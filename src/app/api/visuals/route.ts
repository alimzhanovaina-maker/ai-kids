
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

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
      return NextResponse.json(
        { error: "Выбери вид материала." },
        { status: 400 }
      );
    }

    if (category === "custom" && !topic.trim()) {
      return NextResponse.json(
        { error: "Введи собственную тему." },
        { status: 400 }
      );
    }

    if (category !== "custom" && !categories[category]) {
      return NextResponse.json(
        { error: "Выбери готовую категорию." },
        { status: 400 }
      );
    }

    const total = Math.min(Math.max(Number(count) || 8, 2), 20);

    const { data: quotaData, error: quotaError } =
      await supabase.rpc("consume_generation");

    if (quotaError) {
      return NextResponse.json(
        { error: "Ошибка проверки лимита генераций." },
        { status: 500 }
      );
    }

    const quota = Array.isArray(quotaData)
      ? quotaData[0]
      : quotaData;

    if (!quota?.allowed) {
      return NextResponse.json(
        { error: "Лимит генераций исчерпан. Попробуй позже." },
        { status: 429 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const subject = category === "custom"
      ? topic
      : categories[category];

    let languageRule =
      "Для каждого элемента укажи название сначала на русском, затем на казахском языке.";

    if (language === "ru") {
      languageRule = "Названия только на русском языке.";
    }

    if (language === "kz") {
      languageRule = "Названия только на казахском языке.";
    }

    const listResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Ты методист дошкольного образования. Подбирай конкретные, понятные детям предметы и образы. Возвращай только JSON."
        },
        {
          role: "user",
          content: `Подготовь ровно ${total} разных элементов для материала «${kinds[kind]}».
Тема: ${subject}.
Возраст детей: ${age}.
${languageRule}

Верни JSON такого вида:
{"items":[{"ru":"название на русском","kz":"название на казахском","visual":"short visual description in English"}]}

Соблюдай порядок: сначала русское название, затем казахское.
Не повторяй элементы.
Описания visual должны точно передавать внешний вид предметов.`
        }
      ],
      temperature: 0.6,
    });

    const raw = listResponse.choices[0]?.message?.content || "";
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.items) || parsed.items.length !== total) {
      throw new Error(
        "Не удалось подготовить нужное количество элементов."
      );
    }

    const items = parsed.items;

    const labels = items.map((item: any) => {
      if (language === "ru") return item.ru;
      if (language === "kz") return item.kz;
      return `${item.ru} / ${item.kz}`;
    });

    const visuals = items.map((item: any) =>
      item.visual || item.ru || item.kz
    );

    const styleRule = style === "mono"
      ? "Black and white outline illustrations, thick clean contours, no gray shading, suitable for coloring."
      : "Bright, friendly, colorful preschool illustrations, simple recognizable shapes, attractive professional educational design.";

    let layout =
      "Arrange all elements in a perfectly aligned grid of separate equal-sized cards with white gutters and clear cut lines.";

    if (kind === "poster") {
      layout =
        "Create one large educational poster with a clear visual hierarchy and all requested subjects.";
    } else if (kind === "worksheet") {
      layout =
        "Create a printable worksheet with large activity areas, simple visual examples and blank spaces for children's answers.";
    } else if (kind === "coloring") {
      layout =
        "Create a black-and-white coloring page with large separate outlined objects.";
    } else if (kind === "craft") {
      layout =
        "Create a printable cut-out craft template with large separate parts and clear cutting lines.";
    } else if (kind === "game" || kind === "puzzle") {
      layout =
        "Create a printable game sheet with clearly separated large cells or pieces.";
    } else if (kind === "scheme") {
      layout =
        "Create a clear educational visual scheme with connected sections and simple illustrations.";
    } else if (kind === "lapbook") {
      layout =
        "Create separate printable lapbook elements: pockets, labels, mini-cards and folding pieces.";
    }

    const prompt = `Create a professional, print-ready preschool educational ${kinds[kind]} for children aged ${age}.

TOPIC: ${subject}

Include exactly these ${total} subjects in this order:
${visuals.join("; ")}

${layout}

${styleRule}

PRINT AND LAYOUT REQUIREMENTS:

- Portrait A4-style composition.
- Clean pure white background.
- High-quality professional educational design.
- Generous print margins on all sides.
- All objects must fit completely inside the page.
- For cards: perfectly aligned grid with equal-sized cards.
- Every card must have consistent spacing and clearly visible cut lines.
- Each card must contain one complete centered illustration.
- No overlapping, cropped or duplicated objects.
- Sharp contours and clear recognizable details.
- Friendly cartoon-style illustrations suitable for preschool children.
- Balanced composition with no unnecessary decorations.
- Do not render words, letters, captions, labels, logos, watermarks or numbers.
- No mockups, hands, desks or photographs.
- Keep every important element inside the printable area.

The result must look like a professionally designed educational printable, ready for an A4 printer.`;

    const imageResponse = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
      prompt,
      size: "1024x1536",
      quality: "medium",
      output_format: "png",
      n: 1,
    });

    const image = imageResponse.data?.[0]?.b64_json;

    if (!image) {
      throw new Error("OpenAI не вернул изображение.");
    }

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
    });

  } catch (error: any) {
    console.error("VISUAL GENERATION ERROR:", error);

    if (error?.status === 429) {
      return NextResponse.json(
        {
          error:
            "Недостаточно средств или превышен лимит OpenAI API. Проверь баланс."
        },
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
