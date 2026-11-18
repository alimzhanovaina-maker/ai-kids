
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const prompts: Record<string, string> = {
  game: `Создай оригинальную дидактическую игру для дошкольников. Обязательно включи название, цель, задачи, возраст, участников, материалы, подготовку, правила, подробный ход игры с репликами воспитателя, три уровня сложности, вопросы, три варианта, индивидуальную работу, ожидаемый процесс и материалы для печати. Используй разнообразные механики: поиск, движение, роли, расследование, загадки, логику, командные задания и конструирование. Не повторяй постоянно сортировку карточек.`,
  story: `Напиши оригинальную добрую сказку для дошкольников. Добавь короткие эпизоды, повторяющиеся фразы, понятный сюжет, вопросы на понимание и творческое задание.`,
  illustration: `Подготовь подробное техническое задание для создания оригинальной детской иллюстрации: композиция, персонажи, палитра, фон, стиль и требования к печати.`,
  cards: `Разработай набор карточек для печати. Укажи точное количество карточек, содержание изображений, подписи, правила использования и рекомендации по размещению на листах А4.`,
  worksheet: `Создай полноценный рабочий лист для дошкольника строго на одной странице А4, вертикально. Возраст: ${"указанный пользователем"}.

Верх: красивый заголовок, строки «Имя» и «Дата».
Основная часть: 4–5 конкретных заданий по теме, с короткими инструкциями, примерами предметов, числами и местом для ответа. Используй разные типы: посчитать, соединить, найти лишнее, обвести, раскрасить, дорисовать, продолжить закономерность, пройти лабиринт.
Низ: поле «Моё настроение» с тремя смайликами.
Отдельно после макета напиши ответы и подсказки воспитателю.

Не пиши длинную методическую разработку. Не заменяй задания общими описаниями. Учитывай возраст и оставляй достаточно места для выполнения.`,
  lesson: `Подготовь краткосрочный план занятия на 25 минут: тема, цель, задачи, материалы, этапы с примерным временем, речь воспитателя, задания и рефлексия.`,
  author: `Разработай авторскую методическую идею: актуальность, цель, задачи, новизна, целевая группа, материалы, этапы, правила, примеры заданий, оценка процесса и рекомендации.`
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
      languageRule = "Қазақ тілінде сауатты жаз. Барлық материал тек қазақ тілінде болуы керек.";
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
            ? `Ты профессиональный методист и дизайнер рабочих листов для дошкольников. Создавай конкретные задания для одной страницы А4 в вертикальной ориентации. Инструкции короткие, крупные, понятные. Оставляй место для ответов. Не перегружай страницу. Ответы воспитателю размещай отдельно. Не утверждай, что навык освоен за одно занятие. Используй процессные формулировки: учится, пробует, закрепляет, дағдыланады.`
            : `Ты профессиональный методист дошкольного образования. Создавай качественные, интересные и безопасные материалы. Учитывай возраст детей. Для игр создавай полноценную игровую механику. Соблюдай структуру. Используй процессные формулировки: учится, пробует, закрепляет, дағдыланады.`
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
      temperature: isWorksheet ? 0.7 : 0.9
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI вернул пустой ответ.");
    }

    // Настоящая 3D-иллюстрация создаётся только для рабочего листа.
    let illustration: string | null = null;

    if (isWorksheet) {
      const isBlackWhite = format.toLowerCase().includes("чёрно-бел");
      const isPastel = format.toLowerCase().includes("пастель");

      const visualStyle = isBlackWhite
        ? "Чёткие чёрные контурные рисунки на чистом белом фоне, без серых заливок, пригодные для раскрашивания."
        : isPastel
          ? "Нежная пастельная палитра, мягкие объёмные формы, светлый чистый фон."
          : "Высококачественный современный 3D Cartoon Kids, милые объёмные персонажи, выразительные добрые лица, яркие гармоничные цвета, мягкий свет и тени.";

      const imageResponse = await openai.images.generate({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
        size: "1024x1536",
        quality: "medium",
        n: 1,
        output_format: "png",
        background: "opaque",
        prompt: `
Создай вертикальную иллюстрацию для детского рабочего листа А4.

ТЕМА: ${topic}
ВОЗРАСТ: ${age}
СТИЛЬ: ${visualStyle}

Изобрази 4–6 отдельных крупных тематических предметов
или персонажей, подходящих для заданий дошкольника.
Расположи их аккуратно, с достаточными промежутками,
чтобы изображения можно было использовать в упражнениях.
Фон белый или очень светлый.
Не добавляй никаких букв, слов, цифр, подписей,
логотипов, водяных знаков и рамок.
Не изображай готовый лист с текстом.
Изображения должны быть понятными детям и пригодными
для печати. Не обрезай важные части персонажей.
        `
      });

      const imageBase64 = imageResponse.data?.[0]?.b64_json;

      if (!imageBase64) {
        throw new Error("Не удалось получить изображение для рабочего листа.");
      }

      illustration = `data:image/png;base64,${imageBase64}`;
    }

    return NextResponse.json({
      success: true,
      content,
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
