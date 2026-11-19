
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const prompts: Record<string, string> = {
  game: `Создай оригинальную дидактическую игру для дошкольников. Включи название, цель, задачи, возраст, материалы, подготовку, правила, подробный ход игры с репликами воспитателя, три уровня сложности, вопросы, варианты игры и индивидуальную работу. Используй разнообразные игровые механики.`,
  story: `Напиши оригинальную добрую сказку для дошкольников. Добавь короткие эпизоды, понятный сюжет, повторяющиеся фразы, вопросы и творческое задание.`,
  illustration: `Подготовь подробное техническое задание для детской иллюстрации: композиция, персонажи, палитра, фон, стиль и требования к печати.`,
  cards: `Разработай набор карточек для печати. Укажи количество, содержание, подписи, правила использования и размещение на листе А4.`,
  worksheet: `Создай рабочий лист для дошкольника на одну страницу А4, вертикально.

Тема: указанная пользователем.
Возраст: указанный пользователем.

Структура детского листа:
Заголовок и тема.
Строки «Имя» и «Дата».
Пять коротких заданий разного типа:
1. Посчитать предметы и записать число.
2. Соединить пары.
3. Найти лишний предмет.
4. Раскрасить или обвести нужный объект.
5. Выполнить простое логическое задание или лабиринт.
Внизу — «Моё настроение» с тремя смайликами.

ВАЖНО:
- Каждое задание должно быть конкретным и выполнимым.
- Не пиши фразы в скобках вместо рисунков.
- Не используй заглушки вроде «(рисунок котика)», «(изображения животных)», «(лабиринт)».
- Не включай ответы в детскую часть.
- Не добавляй длинные методические объяснения.
- Оставляй достаточно места для ответов ребёнка.
- После детского листа обязательно добавь отдельный раздел, начиная строго с маркера ===TEACHER_GUIDE===.
- В этом разделе напиши ответы и короткие подсказки воспитателю.`,
  lesson: `Подготовь краткосрочный план занятия на 25 минут: тема, цель, задачи, материалы, этапы с примерным временем, речь воспитателя, задания и рефлексия.`,
  author: `Разработай авторскую методическую идею: актуальность, цель, задачи, новизна, целевая группа, материалы, этапы, примеры заданий и рекомендации.`
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Не подключён OPENAI_API_KEY в Vercel." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Войди в аккаунт, чтобы создавать материалы." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      type,
      topic,
      age = "4 года",
      language = "both",
      format = "Цветной, для детей"
    } = body;

    if (
      !prompts[type] ||
      typeof topic !== "string" ||
      !topic.trim()
    ) {
      return NextResponse.json(
        { error: "Проверь тип материала и тему." },
        { status: 400 }
      );
    }

    if (topic.length > 300) {
      return NextResponse.json(
        { error: "Слишком длинная тема. Сократи её." },
        { status: 400 }
      );
    }

    const { data: quotaData, error: quotaError } =
      await supabase.rpc("consume_generation");

    if (quotaError) {
      console.error("QUOTA ERROR:", quotaError);
      return NextResponse.json(
        { error: "Ошибка проверки дневного лимита генераций." },
        { status: 500 }
      );
    }

    const quota = Array.isArray(quotaData)
      ? quotaData[0]
      : quotaData;

    if (!quota?.allowed) {
      return NextResponse.json(
        {
          error: "Ты использовала все 20 генераций на сегодня. Завтра лимит обновится."
        },
        { status: 429 }
      );
    }

    let languageRule = "";

    if (language === "ru") {
      languageRule = "Пиши только на грамотном русском языке.";
    } else if (language === "kz") {
      languageRule = "Пиши только на грамотном казахском языке.";
    } else {
      languageRule = "Сначала создай полноценную версию на русском языке, затем отдельную полноценную версию на казахском. Не смешивай языки.";
    }

    const openai = new OpenAI({ apiKey });
    const isWorksheet = type === "worksheet";

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: isWorksheet
            ? `Ты профессиональный методист и дизайнер рабочих листов для дошкольников. Создавай конкретные, выполнимые задания. Детская часть должна быть короткой и помещаться на одну страницу А4. Не используй текстовые заглушки вместо изображений. Ответы воспитателю всегда отделяй маркером ===TEACHER_GUIDE===. Используй процессные формулировки: учится, пробует, закрепляет, дағдыланады.`
            : `Ты профессиональный методист дошкольного образования. Создавай качественные, интересные и безопасные материалы с учётом возраста детей. Используй процессные формулировки: учится, пробует, закрепляет, дағдыланады.`
        },
        {
          role: "user",
          content: `
${prompts[type]}

ТЕМА: ${topic}
ВОЗРАСТ: ${age}
ОФОРМЛЕНИЕ: ${format}

${languageRule}

Подготовь конкретный, структурированный и готовый к использованию материал.
          `
        }
      ],
      temperature: isWorksheet ? 0.5 : 0.9
    });

    const fullContent = response.choices[0]?.message?.content;

    if (!fullContent) {
      throw new Error("OpenAI вернул пустой ответ.");
    }

    let content = fullContent;
    let teacherGuide = "";

    if (isWorksheet) {
      const marker = "===TEACHER_GUIDE===";
      const markerIndex = fullContent.indexOf(marker);

      if (markerIndex !== -1) {
        content = fullContent.slice(0, markerIndex).trim();
        teacherGuide = fullContent
          .slice(markerIndex + marker.length)
          .trim();
      }
    }

    let illustration: string | null = null;

    if (isWorksheet) {
      const isBlackWhite = format.toLowerCase().includes("чёрно-бел");
      const isPastel = format.toLowerCase().includes("пастель");

      const visualStyle = isBlackWhite
        ? "Чёрно-белые чёткие контурные рисунки на белом фоне, без серых заливок, пригодные для раскрашивания."
        : isPastel
          ? "Нежная пастельная палитра, мягкие объёмные формы, светлый чистый фон."
          : "Высококачественный 3D Cartoon Kids, милые объёмные персонажи, выразительные добрые лица, яркие гармоничные цвета, мягкий свет и тени.";

      const imageResponse = await openai.images.generate({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
        size: "1024x1536",
        quality: "medium",
        n: 1,
        output_format: "png",
        background: "opaque",
        prompt: `
Создай вертикальный лист визуальных элементов для рабочего листа А4.

ТЕМА: ${topic}
ВОЗРАСТ: ${age}
СТИЛЬ: ${visualStyle}

ЗАДАНИЯ, ДЛЯ КОТОРЫХ НУЖНЫ ИЗОБРАЖЕНИЯ:
${content}

Создай отдельные понятные иллюстрации ко всем пяти заданиям.
Если в задании нужно посчитать три предмета — изобрази ровно три.
Если нужно соединить пары — покажи все нужные пары раздельно.
Если нужно найти лишнее — покажи все перечисленные объекты.
Если нужно раскрасить — используй чёткий контур нужного объекта.
Если нужен лабиринт — нарисуй простой настоящий лабиринт с началом и финишем.

Расположи элементы в аккуратной сетке из пяти отдельных блоков.
Каждый блок должен содержать именно те предметы, которые нужны для соответствующего задания.
Оставляй промежутки между блоками.
Не добавляй буквы, слова, цифры, подписи, логотипы, водяные знаки и рамки.
Не создавай готовый лист с текстом.
Не заменяй задания случайным набором животных.
Все объекты должны быть полностью видны и пригодны для печати.
        `
      });

      const imageBase64 = imageResponse.data?.[0]?.b64_json;

      if (!imageBase64) {
        throw new Error("Не удалось получить иллюстрации для рабочего листа.");
      }

      illustration = `data:image/png;base64,${imageBase64}`;
    }

    return NextResponse.json({
      success: true,
      content,
      teacherGuide,
      illustration,
      remaining: quota.remaining
    });

  } catch (e: unknown) {
    console.error("AI KIDS GENERATION ERROR:", e);

    const error = e as {
      message?: string;
      status?: number;
    };

    if (error.status === 401) {
      return NextResponse.json(
        { error: "OpenAI не принял API-ключ. Проверь OPENAI_API_KEY." },
        { status: 502 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: "Превышен лимит OpenAI или недостаточно средств на API-балансе." },
        { status: 429 }
      );
    }

    if (error.status === 404) {
      return NextResponse.json(
        { error: "Модель OpenAI не найдена. Проверь настройки модели." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "Ошибка генерации: " +
          (error.message || "Неизвестная ошибка сервера.")
      },
      { status: 500 }
    );
  }
}
