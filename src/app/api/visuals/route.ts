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

    // Each subject is generated as its own image. Keep the first version to 8
    // subjects so the request stays within serverless time and response limits.
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

    const listResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Ты методист дошкольного образования.
Составляй списки конкретных, узнаваемых и подходящих детям объектов.
Каждый объект должен отличаться от остальных по смыслу.
Не используй синонимы или разные названия одного объекта.
Возвращай только корректный JSON.
`,
        },
        {
          role: "user",
          content: `
Составь ровно ${total} уникальных объектов для материала "${kinds[kind]}".
Тема: ${subject}. Возраст: ${age}.

Верни JSON:
{
  "items": [
    {
      "ru": "Название на русском",
      "kz": "Атауы қазақша",
      "visual": "Precise English description of one distinct subject"
    }
  ]
}

Правила:
- Ровно ${total} объектов.
- Не повторяй объект под другим названием.
- Например, "заяц" и "кролик" для этого набора считаются слишком похожими — выбери только один.
- Каждый visual описывает только один объект, без окружения и других существ.
- Названия должны быть корректными переводами друг друга.
`,
        },
      ],
      temperature: 0.2,
    });

    const parsed = JSON.parse(listResponse.choices[0]?.message?.content || "{}");
    if (!Array.isArray(parsed.items) || parsed.items.length !== total) {
      throw new Error("Не удалось составить точный список объектов. Попробуй ещё раз.");
    }

    const items: Array<{ ru: string; kz: string; visual: string }> =
      parsed.items.map((item: any) => ({
        ru: String(item.ru || "").trim(),
        kz: String(item.kz || "").trim(),
        visual: String(item.visual || "").trim(),
      }));

    if (items.some((item) => !item.ru || !item.kz || !item.visual)) {
      throw new Error("В списке есть объект без названия или описания. Попробуй ещё раз.");
    }

    const unique = new Set(items.map((item) => normalizeName(item.ru)));
    if (unique.size !== total) {
      throw new Error("В списке обнаружились повторы. Нажми «Создать» ещё раз.");
    }

    const labels = items.map((item) => {
      if (language === "ru") return item.ru;
      if (language === "kz") return item.kz;
      return `${item.ru} / ${item.kz}`;
    });

    const styleRule =
      style === "mono" || kind === "coloring"
        ? "Black and white coloring-book line art, thick clean black outlines, pure white background, no gray shading, simple large shapes."
        : "Bright friendly preschool storybook illustration, cheerful balanced colors, clean edges, soft minimal shadow, recognizable natural anatomy.";

    // Generate each subject separately. The browser places exactly one image
    // into each card, so the image model cannot add extra cards to the sheet.
    const illustrations: string[] = [];
    const batchSize = 3;

    for (let start = 0; start < items.length; start += batchSize) {
      const batch = items.slice(start, start + batchSize);
      const generated = await Promise.all(
        batch.map(async (item) => {
          const prompt = `
Create ONE isolated educational illustration for a preschool printable.
The only subject in the image must be: ${item.visual}.
Subject label for meaning only: ${item.ru}.
Age group: ${age}.

Style: ${styleRule}

Composition:
- Show exactly one complete subject, centered.
- Entire subject must be visible with generous empty margin around it.
- Plain pure white background.
- No other animals, people, objects, scenery, props or decorations.
- No words, letters, numbers, labels, captions, watermark or logo.
- No border, no card frame, no grid, no collage, no multiple views.
- Square composition, crisp high-quality illustration.
`;
          const result = await openai.images.generate({
            model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
            prompt,
            size: "1024x1024",
            quality: "low",
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
      print: { paper: "A4", orientation: "portrait" },
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
