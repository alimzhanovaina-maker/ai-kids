
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Войди в аккаунт, чтобы создавать комплекты." },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Не подключён OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    const body = await req.json();

    const {
      topic = "",
      age = "4 года",
      language = "both",
      count = 8,
      difficulty = "обычный",
      materialTypes = [
        "cards",
        "worksheet",
        "game",
        "teacher_guide",
      ],
    } = body;

    if (typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "Напиши тему образовательного комплекта." },
        { status: 400 }
      );
    }

    const total = Math.min(
      Math.max(Number(count) || 8, 2),
      20
    );

    const allowedTypes = [
      "cards",
      "worksheet",
      "game",
      "poster",
      "coloring",
      "puzzle",
      "teacher_guide",
    ];

    const selectedTypes = Array.isArray(materialTypes)
      ? materialTypes.filter((item: string) =>
          allowedTypes.includes(item)
        )
      : [];

    if (!selectedTypes.length) {
      return NextResponse.json(
        { error: "Выбери хотя бы один вид материала." },
        { status: 400 }
      );
    }

    const { data: quotaData, error: quotaError } =
      await supabase.rpc("consume_generation");

    if (quotaError) {
      return NextResponse.json(
        { error: "Не удалось проверить лимит генераций." },
        { status: 500 }
      );
    }

    const quota = Array.isArray(quotaData)
      ? quotaData[0]
      : quotaData;

    if (!quota?.allowed) {
      return NextResponse.json(
        { error: "Лимит генераций исчерпан." },
        { status: 429 }
      );
    }

    let languageInstruction =
      "Создай полноценный комплект на русском и казахском языках. Для каждого задания, названия и инструкции предоставь обе версии.";

    if (language === "ru") {
      languageInstruction =
        "Создай весь комплект только на русском языке.";
    }

    if (language === "kz") {
      languageInstruction =
        "Создай весь комплект только на казахском языке.";
    }

    const typeNames: Record<string, string> = {
      cards: "Обучающие карточки",
      worksheet: "Рабочий лист",
      game: "Дидактическая игра",
      poster: "Наглядный плакат",
      coloring: "Раскраска",
      puzzle: "Пазлы",
      teacher_guide: "Методические рекомендации педагогу",
    };

    const requestedMaterials = selectedTypes
      .map((type: string) => typeNames[type])
      .join(", ");

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `
Ты — AI-методист современной образовательной платформы AI KIDS.

Ты специализируешься на дошкольном образовании,
разработке дидактических игр, рабочих листов,
наглядных пособий и методических материалов.

Учитывай возраст детей.
Используй понятные инструкции.
Не приписывай детям навыки, которые они ещё только осваивают.
Формулируй педагогические результаты через:
«учится», «пробует», «закрепляет», «дағдыланады».

Не придумывай нормативные документы и требования.
Возвращай только корректный JSON.
          `,
        },
        {
          role: "user",
          content: `
Создай профессиональный образовательный комплект AI KIDS.

ТЕМА: ${topic}
ВОЗРАСТ: ${age}
СЛОЖНОСТЬ: ${difficulty}
КОЛИЧЕСТВО КАРТОЧЕК ИЛИ ЭЛЕМЕНТОВ: ${total}
НЕОБХОДИМЫЕ МАТЕРИАЛЫ: ${requestedMaterials}

${languageInstruction}

Верни JSON со следующей структурой:

{
  "title": "Название комплекта",
  "topic": "${topic}",
  "age": "${age}",
  "difficulty": "${difficulty}",
  "objective": "Цель комплекта",
  "materials": ["Список необходимых материалов"],
  "teacherIntroduction": "Краткое вступление педагога",
  "cards": [
    {
      "number": 1,
      "title": "Название",
      "titleKz": "Қазақша атауы",
      "visualDescription": "Точное описание изображения на английском языке",
      "learningFact": "Короткий познавательный факт"
    }
  ],
  "worksheet": {
    "title": "Название рабочего листа",
    "tasks": [
      {
        "instruction": "Инструкция ребёнку",
        "instructionKz": "Қазақша нұсқау",
        "type": "matching",
        "items": ["Элемент задания"],
        "answer": "Правильный ответ для педагога"
      }
    ]
  },
  "game": {
    "title": "Название игры",
    "purpose": "Цель игры",
    "rules": ["Правило 1", "Правило 2"],
    "teacherQuestions": ["Вопросы детям"]
  },
  "poster": {
    "title": "Заголовок плаката",
    "sections": [
      {
        "heading": "Подзаголовок",
        "description": "Краткое содержание"
      }
    ]
  },
  "coloring": {
    "title": "Тема раскраски",
    "visualDescription": "Описание рисунка на английском языке"
  },
  "puzzle": {
    "title": "Название пазла",
    "instruction": "Инструкция",
    "pieces": ["Описание деталей"]
  },
  "teacherGuide": {
    "lessonFlow": ["Этап занятия"],
    "teacherTips": ["Рекомендация педагогу"],
    "expectedProcess": ["Дети учатся...", "Балалар ... дағдыланады."]
  },
  "vocabulary": [
    {
      "ru": "Русское слово",
      "kz": "Қазақское слово"
    }
  ]
}

ВАЖНО:
- Количество объектов в cards должно быть ровно ${total}.
- Не повторяй карточки.
- Не заполняй невыбранные виды материалов.
- Если материал не выбран, верни null для соответствующего раздела.
- Все задания должны соответствовать возрасту.
- Ответы предназначены педагогу, а не ребёнку.
- Описания изображений должны быть конкретными и понятными генератору изображений.
          `,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;

    if (!raw) {
      throw new Error("AI не вернул содержание комплекта.");
    }

    const kit = JSON.parse(raw);

    if (
      !kit.title ||
      !Array.isArray(kit.cards) ||
      kit.cards.length !== total
    ) {
      throw new Error(
        "AI вернул неполный комплект. Попробуй повторить запрос."
      );
    }

    return NextResponse.json({
      success: true,
      kit,
      remaining: quota.remaining,
    });
  } catch (error: any) {
    console.error("AI KIDS KIT ERROR:", error);

    return NextResponse.json(
      {
        error:
          error?.status === 429
            ? "Недостаточно средств или превышен лимит OpenAI API."
            : error?.message ||
              "Не удалось создать образовательный комплект.",
      },
      {
        status: error?.status === 429 ? 429 : 500,
      }
    );
  }
}
