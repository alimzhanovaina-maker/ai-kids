import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const kinds: Record<string, string> = {
  cards: "обучающие карточки",
  poster: "образовательный плакат",
  worksheet: "рабочий лист с заданиями",
  game: "дидактическая игра",
  puzzle: "пазлы",
  coloring: "раскраска",
  lapbook: "элементы для лэпбука",
  craft: "шаблон поделки",
  scheme: "наглядная обучающая схема",
};

const categories: Record<string, string> = {
  animals: "Домашние и дикие животные",
  fruits: "Фрукты и ягоды",
  vegetables: "Овощи",
  transport: "Виды транспорта",
  professions: "Профессии",
  birds: "Птицы",
  colors: "Цвета",
  shapes: "Геометрические фигуры",
  seasons: "Времена года",
  nature: "Природа",
  emotions: "Эмоции",
  safety: "Правила безопасности",
};

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[ё]/g, "е").replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Войди в аккаунт, чтобы создавать материалы." },
        { status: 401 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Не подключён OPENAI_API_KEY в Vercel." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      kind = "cards",
      category = "animals",
      topic = "",
      age = "4 года",
      language = "both",
      count = 8,
      style = "color",
    } = body;

    if (!kinds[kind]) {
      return NextResponse.json({ error: "Выбери вид материала." }, { status: 400 });
    }

    if (
      category === "custom" &&
      (typeof topic !== "string" || !topic.trim())
    ) {
      return NextResponse.json({ error: "Введи собственную тему." }, { status: 400 });
    }

    if (category !== "custom" && !categories[category]) {
      return NextResponse.json({ error: "Выбери готовую категорию." }, { status: 400 });
    }

    const total = Math.min(Math.max(Number(count) || 8, 2), 20);

    const { data: quotaData, error: quotaError } =
      await supabase.rpc("consume_generation");

    if (quotaError) {
      console.error("QUOTA ERROR:", quotaError);
      return NextResponse.json(
        { error: "Ошибка проверки лимита генераций." },
        { status: 500 }
      );
    }

    const quota = Array.isArray(quotaData) ? quotaData[0] : quotaData;
    if (!quota?.allowed) {
      return NextResponse.json(
        { error: "Лимит генераций исчерпан. Попробуй позже." },
        { status: 429 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const subject =
      category === "custom" ? topic.trim() : categories[category];

    const languageRule =
      language === "ru"
        ? "Заполни ru. Поле kz тоже заполни точным переводом для внутренней структуры."
        : language === "kz"
          ? "Заполни kz. Поле ru тоже заполни точным переводом для внутренней структуры."
          : "Заполни оба поля: ru на русском и kz на казахском.";

    const listResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Ты методист дошкольного образования и составитель дидактических наборов.
Возвращай только корректный JSON. Не добавляй комментарии вне JSON.
Все элементы должны быть конкретными, узнаваемыми и подходить детям указанного возраста.
`,
        },
        {
          role: "user",
          content: `
Составь набор ровно из ${total} РАЗНЫХ объектов по теме: "${subject}".
Возраст: ${age}. Тип: ${kinds[kind]}.
${languageRule}

КРИТИЧЕСКИ ВАЖНО:
- Каждый объект должен быть уникальным по смыслу.
- Не повторяй один объект под другим названием.
- Не используй варианты одного и того же объекта (например, кот и кошка считаются повтором).
- Не добавляй фоновые предметы как отдельные элементы.
- В поле visual дай короткое, конкретное описание одного объекта на английском языке.
- Верни ровно ${total} элементов.

JSON:
{
  "items": [
    {
      "ru": "Название на русском",
      "kz": "Название на казахском",
      "visual": "One specific object, its appearance, pose and distinguishing features"
    }
  ]
}
`,
        },
      ],
      temperature: 0.3,
    });

    const raw = listResponse.choices[0]?.message?.content || "";
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.items) || parsed.items.length !== total) {
      throw new Error("Не удалось подготовить точное количество элементов. Попробуй ещё раз.");
    }

    const items: Array<{ ru: string; kz: string; visual: string }> =
      parsed.items.map((item: any) => ({
        ru: String(item.ru || "").trim(),
        kz: String(item.kz || "").trim(),
        visual: String(item.visual || "").trim(),
      }));

    if (items.some((item) => !item.ru || !item.kz || !item.visual)) {
      throw new Error("В списке есть элемент без названия или описания. Попробуй ещё раз.");
    }

    const uniqueRu = new Set(items.map((item) => normalizeName(item.ru)));
    if (uniqueRu.size !== total) {
      throw new Error("Нейросеть повторила некоторые элементы. Нажми «Создать» ещё раз для нового набора.");
    }

    const labels = items.map((item) => {
      if (language === "ru") return item.ru;
      if (language === "kz") return item.kz;
      return `${item.ru} / ${item.kz}`;
    });

    const columns =
      total <= 4 ? 2 :
      total <= 9 ? 3 :
      total <= 16 ? 4 : 5;
    const rows = Math.ceil(total / columns);

    const styleRule =
      style === "mono" || kind === "coloring"
        ? `
Black and white coloring-book line art.
Thick, smooth, clean black outlines.
Pure white background, no gray shading, no gradients.
Large simple shapes with generous empty areas for coloring.
`
        : `
Bright, warm, cheerful preschool illustration style.
Cute but anatomically recognizable objects and animals.
Consistent illustration style, scale, lighting and detail across all cards.
Clean colors, crisp edges, gentle minimal shadows.
`;

    let layout = `
PRINTABLE CARD SHEET GRID:
- Use exactly ${rows} rows and ${columns} columns.
- There must be exactly ${total} cards, not ${total + 1}, not ${total - 1}.
- Fill cells from left to right, top to bottom.
- Each cell contains exactly ONE complete subject.
- Use the same card size, same border thickness and same inner margins.
- Keep clear white gutters and thin dotted cut lines between cards.
- Do not add a title card, legend, extra icon, decoration or empty sample card.
- If the final row has fewer cards, leave the remaining cell area completely blank.
- Never repeat a subject.
`;

    if (kind === "poster") {
      layout = `
Create one educational poster with exactly ${total} requested subjects.
Arrange them in a balanced ${rows}-row by ${columns}-column visual grid.
Keep all subjects separate, large and easy to recognize.
Do not add extra subjects or a title.
`;
    } else if (kind === "worksheet") {
      layout = `
Create one preschool worksheet with exactly ${total} numbered activity spaces arranged in ${rows} rows and ${columns} columns.
Each space must relate to one requested subject.
Leave clear blank areas for a child to draw, trace or write.
Do not add extra tasks or decorative objects.
`;
    } else if (kind === "coloring") {
      layout = `
Create one printable coloring sheet with exactly ${total} separate outlined subjects.
Arrange them in ${rows} rows and ${columns} columns.
Each subject appears once only, with thick black outlines and large white coloring areas.
`;
    } else if (kind === "craft" || kind === "lapbook") {
      layout = `
Create a printable cut-and-assemble sheet with exactly ${total} requested components.
Arrange components in a clean ${rows} by ${columns} grid.
Keep every component separate, fully visible and surrounded by cutting guides.
Do not add extra components.
`;
    } else if (kind === "game" || kind === "puzzle" || kind === "cards") {
      layout = `
Create a printable set of exactly ${total} separate cards.
Arrange them in exactly ${rows} rows and ${columns} columns.
Every card contains one and only one requested subject.
Use equal-sized rounded rectangles, consistent margins and subtle dotted cut lines.
No extra cards, no duplicate subjects, no title panel.
`;
    } else if (kind === "scheme") {
      layout = `
Create one clear educational scheme containing exactly ${total} requested subjects.
Arrange the subjects in ${rows} rows and ${columns} columns with simple visual connections.
Do not add any extra objects or repeated subjects.
`;
    }

    const subjectList = items
      .map((item, index) => `${index + 1}. ${item.visual}`)
      .join("\n");

    const prompt = `
Create a high-quality, print-ready preschool educational ${kinds[kind]}.
Topic: ${subject}.
Target age: ${age}.

EXACT SUBJECT LIST — FOLLOW THIS LIST ONE-TO-ONE:
${subjectList}

${layout}

VISUAL STYLE:
${styleRule}

A4 PRINT COMPOSITION:
- Portrait A4 page, 2:3 portrait image ratio.
- White page background.
- Keep all cards and illustrations inside safe print margins.
- Nothing may be cropped, clipped or overlap another card.
- Keep the grid centered and balanced on the page.
- Clear, consistent cut guides.
- High contrast and crisp edges.
- No mockup, no desk, no hands, no photo, no watermark, no logo.
- Do not draw any words, letters, captions, labels or numbers.
- Do not invent, omit, merge or duplicate subjects.
- The number of visible cards must be exactly ${total}.
`;

    const imageResponse = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
      prompt,
      size: "1024x1536",
      quality: "medium",
      output_format: "png",
      n: 1,
    });

    const image = imageResponse.data?.[0]?.b64_json;
    if (!image) throw new Error("OpenAI не вернул изображение.");

    return NextResponse.json({
      success: true,
      kind,
      topic: subject,
      age,
      language,
      count: total,
      labels,
      image: `data:image/png;base64,${image}`,
      remaining: quota.remaining,
      print: {
        paper: "A4",
        orientation: "portrait",
        rows,
        columns,
      },
    });
  } catch (error: any) {
    console.error("VISUAL GENERATION ERROR:", error);

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Недостаточно средств или превышен лимит OpenAI API. Проверь баланс." },
        { status: 429 }
      );
    }
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "Проверь API-ключ OpenAI в Vercel." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Не удалось создать материал." },
      { status: 500 }
    );
  }
}
