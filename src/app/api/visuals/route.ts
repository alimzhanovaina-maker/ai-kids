
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
  coloring: "детская сюжетная раскраска",
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
      return NextResponse.json(
        { error: "Выбери вид материала." },
        { status: 400 }
      );
    }

    if (
      category === "custom" &&
      (typeof topic !== "string" || !topic.trim())
    ) {
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

    const total = Math.min(Math.max(Number(count) || 8, 2), 8);

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
    const subject = category === "custom" ? topic.trim() : categories[category];
    const isColoring = kind === "coloring";

    // Сначала создаём список разных сюжетов или объектов
    const listResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Ты профессиональный методист дошкольного образования и автор материалов для детей.
Составляй интересные, разнообразные и понятные детям сюжеты.
Для раскрасок придумывай полноценные сцены, а не отдельные предметы.
Каждый сюжет должен отличаться персонажами, действием, окружением и композицией.
Не повторяй одну и ту же сцену под другими словами.
Возвращай только корректный JSON.
`,
        },
        {
          role: "user",
          content: `
Создай ровно ${total} разных элементов для материала "${kinds[kind]}".
Тема: ${subject}.
Возраст детей: ${age}.

Верни JSON:
{
  "items": [
    {
      "ru": "Название на русском",
      "kz": "Название на казахском",
      "visual": "Detailed English visual description"
    }
  ]
}

Правила:
- Ровно ${total} элементов.
- Названия должны быть корректными переводами друг друга.
- Не повторяй один сюжет под разными названиями.

${isColoring ? `
ОСОБО ВАЖНО: это набор детских раскрасок.
Каждый элемент должен быть отдельной полноценной сюжетной сценой для целой страницы.
В каждом visual подробно укажи:
1. Главных персонажей.
2. Что они делают.
3. Где происходит действие.
4. Какие дополнительные предметы и детали находятся вокруг.
5. Как расположены элементы на странице.

Все ${total} сцен должны быть действительно разными.
Меняй место действия, персонажей, действия, ракурс и композицию.
Не создавай набор одинаковых животных в ряд.
Не ограничивайся изображением одного предмета.

Возможные направления: лесная поляна, ферма, подводный мир, парк, сад, космос, сказочный замок, динозавры, времена года, транспорт, профессии.
Придумывай новые сцены по заданной теме, не копируй примеры дословно.
` : `
Для каждого visual опиши один отдельный узнаваемый объект.
Объекты должны подходить дошкольникам и соответствовать теме.
`}
`,
        },
      ],
      temperature: isColoring ? 0.95 : 0.35,
    });

    const parsed = JSON.parse(
      listResponse.choices[0]?.message?.content || "{}"
    );

    if (!Array.isArray(parsed.items) || parsed.items.length !== total) {
      throw new Error("Не удалось составить список. Попробуй ещё раз.");
    }

    const items: Array<{ ru: string; kz: string; visual: string }> =
      parsed.items.map((item: any) => ({
        ru: String(item.ru || "").trim(),
        kz: String(item.kz || "").trim(),
        visual: String(item.visual || "").trim(),
      }));

    if (items.some((item) => !item.ru || !item.kz || !item.visual)) {
      throw new Error("В списке есть элемент без названия или описания.");
    }

    const unique = new Set(items.map((item) => normalizeName(item.ru)));

    if (unique.size !== total) {
      throw new Error("В списке обнаружились повторы. Попробуй ещё раз.");
    }

    const labels = items.map((item) => {
      if (language === "ru") return item.ru;
      if (language === "kz") return item.kz;
      return `${item.ru} / ${item.kz}`;
    });

    const styleRule = isColoring || style === "mono"
      ? "Professional preschool coloring book line art. Pure white background. Crisp, smooth, bold black outlines only. No colors, no gray, no shadows, no gradients, no hatching and no filled black areas. Large closed shapes, easy for young children to color."
      : "Bright friendly preschool storybook illustration, cheerful balanced colors, clean edges, soft minimal shadow, recognizable natural anatomy.";

    const illustrations: string[] = [];
    const batchSize = 2;

    // Каждая страница создаётся отдельным запросом к генератору изображений
    for (let start = 0; start < items.length; start += batchSize) {
      const batch = items.slice(start, start + batchSize);

      const generated = await Promise.all(
        batch.map(async (item, index) => {
          const pageNumber = start + index + 1;

          const prompt = isColoring
            ? `
Create ONE unique, complete preschool coloring-book page.

PAGE ${pageNumber} OF ${total}.
Scene concept: ${item.visual}
Theme: ${item.ru}
Age group: ${age}

ART STYLE:
${styleRule}

SCENE REQUIREMENTS:
- Draw a complete story scene with a clear action.
- Show several related characters and details that support this specific scene.
- Create a visually rich but uncluttered environment.
- Every page in this set must have a different setting, character arrangement, action and composition.
- Use large, clearly separated shapes.
- Leave enough open white spaces inside shapes for coloring.
- Use simple, recognizable forms suitable for preschool children.
- Keep all important elements fully inside the page.
- Make the main characters large and easy to recognize.

PRINT FORMAT:
- Vertical portrait page, A4 coloring-book composition.
- White background.
- Black outlines only.
- Clean, smooth, closed contours.
- No color, no gray shading, no gradients, no textures.
- No large black filled areas.
- No words, letters, numbers, captions, watermark or logo.
- No page frame, no collage, no multiple panels.
- Do not create a single isolated object.
- Do not repeat a generic animal lineup.
`
            : `
Create ONE isolated educational illustration for a preschool printable.
The only subject in the image must be: ${item.visual}.
Subject label: ${item.ru}.
Age group: ${age}.

Style: ${styleRule}

Composition:
- Show exactly one complete subject, centered.
- Entire subject visible with generous empty margin.
- Plain pure white background.
- No additional objects, scenery or decorations.
- No words, letters, numbers, labels, captions, watermark or logo.
- No border, card frame, grid, collage or multiple views.
- Square composition, crisp high-quality illustration.
`;

          const result = await openai.images.generate({
            model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
            prompt,
            size: isColoring ? "1024x1536" : "1024x1024",
            quality: isColoring ? "medium" : "low",
            output_format: "jpeg",
            n: 1,
          });

          const b64 = result.data?.[0]?.b64_json;

          if (!b64) {
            throw new Error(`Не удалось создать иллюстрацию: ${item.ru}.`);
          }

          return `data:image/jpeg;base64,${b64}`;
        })
      );

      illustrations.push(...generated);
    }

    return NextResponse.json({
      success: true,
      kind,
      topic: subject,
      age,
      language,
      count: total,
      labels,
      illustrations,
      remaining: quota.remaining,
      print: {
        paper: "A4",
        orientation: isColoring ? "portrait" : "portrait",
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
