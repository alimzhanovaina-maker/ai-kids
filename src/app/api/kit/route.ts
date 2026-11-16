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
      materialTypes = ["cards", "worksheet", "game", "teacher_guide"],
    } = body;

    if (typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "Напиши тему образовательного комплекта." },
        { status: 400 }
      );
    }

    const selectedLanguage = ["ru", "kz", "both"].includes(language)
      ? language
      : "both";

    const total = Math.min(Math.max(Number(count) || 8, 2), 20);

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
      ? materialTypes.filter((item: string) => allowedTypes.includes(item))
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

    const quota = Array.isArray(quotaData) ? quotaData[0] : quotaData;

    if (!quota?.allowed) {
      return NextResponse.json(
        { error: "Лимит генераций исчерпан." },
        { status: 429 }
      );
    }

    const languageInstruction =
      selectedLanguage === "ru"
        ? `
ЯЗЫКОВОЙ РЕЖИМ: ТОЛЬКО РУССКИЙ.
Весь видимый текст комплекта пиши исключительно на русском языке.
Не добавляй казахские переводы, казахские предложения или двуязычные заголовки.
Поля titleKz и instructionKz обязательно верни пустыми строками.
В массиве vocabulary заполняй только поле ru, поле kz оставляй пустой строкой.
`
        : selectedLanguage === "kz"
        ? `
ТІЛ РЕЖИМІ: ТЕК ҚАЗАҚ ТІЛІ.
Барлық көрінетін мәтінді тек қазақ тілінде жаз.
Орысша аудармаларды, орысша сөйлемдерді және екі тілдегі тақырыптарды қоспа.
Өрістердің құрылымын сақтау үшін title өрісіне қазақша атауды жаз, titleKz өрісін бос қалдыр.
instruction өрісіне қазақша нұсқауды жаз, instructionKz өрісін бос қалдыр.
vocabulary массивінде тек kz өрісін толтыр, ru өрісін бос қалдыр.
`
        : `
ЯЗЫКОВОЙ РЕЖИМ: РУССКИЙ + КАЗАХСКИЙ.
Каждый важный заголовок, текст и инструкция должны иметь обе языковые версии.
Русский текст размещай в полях без суффикса Kz, казахский — в соответствующих полях Kz.
В vocabulary заполняй оба поля ru и kz.
`;

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
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `
Ты — AI-методист образовательной платформы AI KIDS.
Создавай качественные материалы для дошкольного образования.
Учитывай возраст детей и используй понятные инструкции.
Не приписывай детям навыки, которые они ещё только осваивают.
Формулируй результаты как процесс: «учится», «пробует», «закрепляет», «дағдыланады».
Строго соблюдай выбранный языковой режим из задания пользователя.
Не добавляй второй язык, если выбран один язык.
Возвращай только корректный JSON без Markdown.
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

Верни JSON строго со следующей структурой:
{
  "title": "Название комплекта на выбранном языке",
  "topic": "${topic}",
  "age": "${age}",
  "difficulty": "${difficulty}",
  "objective": "Цель комплекта на выбранном языке",
  "materials": ["Список необходимых материалов на выбранном языке"],
  "teacherIntroduction": "Вступление педагога на выбранном языке",
  "cards": [
    {
      "number": 1,
      "title": "Название карточки на выбранном языке",
      "titleKz": "",
      "visualDescription": "Точное описание изображения на английском языке для генератора изображений",
      "learningFact": "Познавательный факт на выбранном языке"
    }
  ],
  "worksheet": {
    "title": "Название рабочего листа на выбранном языке",
    "tasks": [
      {
        "instruction": "Инструкция на выбранном языке",
        "instructionKz": "",
        "type": "matching",
        "items": ["Элемент задания на выбранном языке"],
        "answer": "Правильный ответ для педагога на выбранном языке"
      }
    ]
  },
  "game": {
    "title": "Название игры на выбранном языке",
    "purpose": "Цель игры на выбранном языке",
    "rules": ["Правила игры на выбранном языке"],
    "teacherQuestions": ["Вопросы детям на выбранном языке"]
  },
  "poster": {
    "title": "Заголовок плаката на выбранном языке",
    "sections": [
      {
        "heading": "Подзаголовок на выбранном языке",
        "description": "Краткое содержание на выбранном языке"
      }
    ]
  },
  "coloring": {
    "title": "Тема раскраски на выбранном языке",
    "visualDescription": "Описание рисунка на английском языке для генератора изображений"
  },
  "puzzle": {
    "title": "Название пазла на выбранном языке",
    "instruction": "Инструкция на выбранном языке",
    "pieces": ["Описание деталей на выбранном языке"]
  },
  "teacherGuide": {
    "lessonFlow": ["Этап занятия на выбранном языке"],
    "teacherTips": ["Совет педагогу на выбранном языке"],
    "expectedProcess": ["Ожидаемый процесс обучения на выбранном языке"]
  },
  "vocabulary": [
    {
      "ru": "Слово на русском языке или пустая строка",
      "kz": "Слово на казахском языке или пустая строка"
    }
  ]
}

ВАЖНО:
- Количество объектов в cards должно быть ровно ${total}.
- Не повторяй карточки.
- Не заполняй невыбранные виды материалов: верни null для соответствующих разделов.
- Все задания должны соответствовать возрасту.
- Ответы предназначены педагогу, а не ребёнку.
- Описания изображений оставляй на английском языке — это технические подсказки генератору, а не текст для детей.
- При режиме «только русский» не пиши ни одного казахского слова в видимом тексте.
- При режиме «только казахский» не пиши ни одного русского слова в видимом тексте.
- Не создавай двуязычные предложения, если выбран один язык.
          `,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;

    if (!raw) {
      throw new Error("AI не вернул содержание комплекта.");
    }

    const kit = JSON.parse(raw);

    if (!kit.title || !Array.isArray(kit.cards) || kit.cards.length !== total) {
      throw new Error("AI вернул неполный комплект. Попробуй повторить запрос.");
    }

    // Очищаем поля второго языка, чтобы интерфейс не показывал случайные переводы.
    if (selectedLanguage === "ru") {
      for (const card of kit.cards || []) card.titleKz = "";
      for (const task of kit.worksheet?.tasks || []) task.instructionKz = "";
      for (const word of kit.vocabulary || []) word.kz = "";
    }

    if (selectedLanguage === "kz") {
      for (const card of kit.cards || []) {
        card.title = card.titleKz || card.title;
        card.titleKz = "";
      }
      for (const task of kit.worksheet?.tasks || []) {
        task.instruction = task.instructionKz || task.instruction;
        task.instructionKz = "";
      }
      for (const word of kit.vocabulary || []) {
        word.kz = word.kz || word.ru;
        word.ru = "";
      }
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
            : error?.message || "Не удалось создать образовательный комплект.",
      },
      { status: error?.status === 429 ? 429 : 500 }
    );
  }
}
