
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

    if (category === "custom" &&
        (typeof topic !== "string" || !topic.trim())) {
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

    const total = Math.min(
      Math.max(Number(count) || 8, 2),
      20
    );

    const { data: quotaData, error: quotaError } =
      await supabase.rpc("consume_generation");

    if (quotaError) {
      console.error("QUOTA ERROR:", quotaError);

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

    const subject =
      category === "custom"
        ? topic.trim()
        : categories[category];

    let languageRule =
      "Для каждого элемента укажи название на русском и казахском языках.";

    if (language === "ru") {
      languageRule = "Названия только на русском языке.";
    }

    if (language === "kz") {
      languageRule = "Названия только на казахском языке.";
    }

    const listResponse =
      await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
Ты профессиональный методист дошкольного образования.

Подбирай конкретные, узнаваемые и понятные детям 3–6 лет образы.

Не повторяй предметы.
Не используй сложные и абстрактные понятия.
Возвращай только корректный JSON.
            `,
          },
          {
            role: "user",
            content: `
Подготовь ровно ${total} разных элементов.

Вид материала: ${kinds[kind]}.
Тема: ${subject}.
Возраст детей: ${age}.

${languageRule}

Верни JSON следующего вида:

{
  "items": [
    {
      "ru": "Название на русском",
      "kz": "Название на казахском",
      "visual": "Detailed visual description in English"
    }
  ]
}

Требования:
1. Ровно ${total} элементов.
2. Все элементы разные.
3. Названия должны соответствовать теме.
4. Описания visual должны точно описывать внешний вид.
5. Не добавляй лишних элементов.
            `,
          },
        ],
        temperature: 0.6,
      });

    const raw =
      listResponse.choices[0]?.message?.content || "";

    const parsed = JSON.parse(raw);

    if (
      !Array.isArray(parsed.items) ||
      parsed.items.length !== total
    ) {
      throw new Error(
        "Не удалось подготовить нужное количество элементов."
      );
    }

    const items = parsed.items;

    if (
      items.some(
        (item: any) =>
          typeof item.ru !== "string" ||
          typeof item.kz !== "string"
      )
    ) {
      throw new Error("Ошибка в названиях элементов.");
    }

    const labels = items.map((item: any) => {
      if (language === "ru") return item.ru;
      if (language === "kz") return item.kz;

      return `${item.ru} / ${item.kz}`;
    });

    const visuals = items.map((item: any) =>
      typeof item.visual === "string" && item.visual.trim()
        ? item.visual
        : item.ru
    );

    const styleRule =
      style === "mono" || kind === "coloring"
        ? `
Black and white outline illustrations.
Thick, smooth, clean black contours.
Pure white background.
No gray shading.
No gradients.
Large empty areas for coloring.
Suitable for preschool children.
        `
        : `
Bright, colorful, cheerful preschool illustrations.
Beautiful harmonious color palette.
Cute friendly cartoon characters.
Soft attractive colors.
Clear recognizable shapes.
Professional children's educational illustration style.
        `;

    let layout = `
Arrange all elements in a perfectly aligned grid.

Every card must:
- Have exactly the same size.
- Have equal spacing.
- Be separated by clear cutting lines.
- Contain one complete illustration.
- Have a clean white background.
- Have rounded rectangular borders.
- Be fully visible without cropping.
    `;

    if (kind === "poster") {
      layout = `
Create one large educational poster.
Use a clear visual hierarchy.
Place all requested subjects harmoniously.
Make the illustrations large and easy to recognize.
      `;
    }

    if (kind === "worksheet") {
      layout = `
Create a children's educational worksheet.
Include large activity areas.
Add visual examples.
Leave empty spaces for children's answers.
Use simple visual tasks.
      `;
    }

    if (kind === "coloring") {
      layout = `
Create a black-and-white coloring page.
Use large separate outlined objects.
Make all contours thick and clear.
Leave enough white space for coloring.
      `;
    }

    if (kind === "craft") {
      layout = `
Create a printable craft template.
Separate all parts clearly.
Add visible cutting lines.
Make pieces large and easy to cut out.
      `;
    }

    if (kind === "game" || kind === "puzzle") {
      layout = `
Create a printable educational game.
Separate every playing element clearly.
Use large cells or puzzle pieces.
Make the game easy to cut out and assemble.
      `;
    }

    if (kind === "scheme") {
      layout = `
Create a clear educational visual scheme.
Use connected sections.
Add simple recognizable illustrations.
Maintain an easy-to-follow visual structure.
      `;
    }

    if (kind === "lapbook") {
      layout = `
Create printable lapbook components.
Include pockets, mini-cards, labels and folding elements.
Separate every component clearly.
Add cutting and folding guides.
      `;
    }

    const prompt = `
Create a professional, beautiful, print-ready preschool educational
${kinds[kind]} for children aged ${age}.

TOPIC:
${subject}

EXACT SUBJECTS:
Include exactly these ${total} subjects in the following order:

${visuals.map((v, i) => `${i + 1}. ${v}`).join("\n")}

LAYOUT:
${layout}

ILLUSTRATION STYLE:
${styleRule}

PRINT REQUIREMENTS:

- Portrait A4 page composition.
- Aspect ratio approximately 2:3.
- Pure white printable background.
- Professional educational design.
- Generous safe margins.
- All elements must fit completely inside the page.
- No cropped objects.
- No overlapping illustrations.
- Consistent proportions.
- Clean, sharp contours.
- High visual clarity.
- Balanced composition.
- Large recognizable objects.
- Child-friendly illustrations.
- No unnecessary decorative elements.

IMPORTANT:
- Include exactly ${total} requested subjects.
- Do not duplicate any subject.
- Do not invent additional objects.
- Do not render words, letters, captions, labels or numbers.
- No watermark.
- No logo.
- No mockup.
- No hands.
- No desk.
- No photographs.
- No text of any kind.

The result must look like a professionally designed educational printable ready for use in a kindergarten classroom.
`;

    const imageResponse = await openai.images.generate({
      model:
        process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
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
            "Недостаточно средств или превышен лимит OpenAI API. Проверь баланс.",
        },
        { status: 429 }
      );
    }

    if (error?.status === 401) {
      return NextResponse.json(
        {
          error: "Проверь API-ключ OpenAI в Vercel.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error:
          error?.message || "Не удалось создать материал.",
      },
      { status: 500 }
    );
  }
}
