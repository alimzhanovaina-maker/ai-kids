
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const prompts: Record<string, string> = {
  game: "Создай оригинальную дидактическую игру для дошкольников. Обязательно: название, цель, материалы, подготовка, правила, ход игры, 3 уровня сложности и вопросы воспитателя.",
  story: "Напиши оригинальную добрую сказку для дошкольников. Добавь короткие эпизоды, повторяющиеся фразы, понятный сюжет, вопросы на понимание и творческое задание.",
  illustration: "Подготовь подробное техническое задание для создания оригинальной детской иллюстрации: композиция, персонажи, палитра, фон, стиль, требования к печати. Не утверждай, что изображение уже создано.",
  cards: "Разработай набор карточек для печати: перечень карточек, точные подписи, идеи изображений, правила сортировки и рекомендации по макету А4.",
  worksheet: "Создай рабочий лист для дошкольника: 4-6 коротких заданий, инструкции ребёнку, ответы и подсказки воспитателю, рекомендации по печати.",
  lesson: "Подготовь краткосрочный план занятия на 25 минут: тема, цель, задачи, материалы, этапы с примерным временем, речь воспитателя, задания и рефлексия.",
  author: "Разработай авторскую методическую идею: актуальность, цель, задачи, новизна, целевая группа, материалы, этапы, правила, примеры заданий, оценка процесса и рекомендации."
};

export async function POST(req: Request) {
  try {
    // 1. Проверяем настройки OpenAI
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Не подключён OPENAI_API_KEY в Vercel." },
        { status: 503 }
      );
    }

    // 2. Проверяем пользователя
    const supabase = await createClient();
    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Войди в аккаунт, чтобы создавать материалы." },
        { status: 401 }
      );
    }

    // 3. Получаем параметры
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

    // 4. Проверяем лимит
    const { data: quotaData, error: quotaError } =
      await supabase.rpc("consume_generation");

    if (quotaError) {
      console.error("QUOTA ERROR:", quotaError);

      return NextResponse.json(
        { error: "Ошибка проверки лимита генераций. Проверь Supabase." },
        { status: 500 }
      );
    }

    const quota = Array.isArray(quotaData)
      ? quotaData[0]
      : quotaData;

    if (!quota?.allowed) {
      return NextResponse.json(
        {
          error: "Лимит бесплатного тарифа исчерпан. Попробуй позже или перейди на PRO."
        },
        { status: 429 }
      );
    }

    // 5. Настраиваем язык
    let languageRule = "";

    if (language === "ru") {
      languageRule = "Пиши только на грамотном русском языке.";
    } else if (language === "kz") {
      languageRule = "Қазақ тілінде сауатты жаз.";
    } else {
      languageRule =
        "Сначала создай полноценную версию на русском языке, затем отдельную полноценную версию на грамотном казахском языке. Не смешивай языки.";
    }

    // 6. Подключаем OpenAI
    const openai = new OpenAI({
      apiKey
    });

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
Ты — профессиональный методист дошкольного образования
и автор образовательных материалов для детей.

Создавай оригинальные, интересные, безопасные
и возрастосообразные материалы.

Учитывай возраст детей.
Используй понятные инструкции и игровые задания.

Не используй формулировки, подразумевающие,
что ребёнок полностью освоил навык за одно занятие.

Используй формулировки процесса:
учится, пробует, закрепляет, дағдыланады.

Материалы должны быть практически полезны воспитателю.
          `
        },
        {
          role: "user",
          content: `
${prompts[type]}

ТЕМА: ${topic}
ВОЗРАСТ: ${age}
ОФОРМЛЕНИЕ: ${format}

${languageRule}

Подготовь подробный, структурированный
и готовый к использованию материал.

Учитывай условия работы детского сада.
          `
        }
      ],
      temperature: 0.8
    });

    // 7. Получаем результат
    const content =
      response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI вернул пустой ответ.");
    }

    return NextResponse.json({
      success: true,
      content,
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
        { error: "Превышен лимит запросов OpenAI или недостаточно средств на API-балансе." },
        { status: 429 }
      );
    }

    if (error.status === 404) {
      return NextResponse.json(
        { error: "Модель OpenAI не найдена. Проверь OPENAI_MODEL." },
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
