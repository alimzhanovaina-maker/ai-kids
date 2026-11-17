import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type Page = { textRu: string; textKz: string; scenePrompt: string };

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY не настроен в Vercel." }, { status: 503 });

    const body = await req.json();
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const age = ["3 года", "4 года", "5 лет", "6 лет", "7 лет"].includes(body.age) ? body.age : "4 года";
    const pageCount = body.pageCount === 6 ? 6 : 4;
    const language = ["ru", "kz", "both"].includes(body.language) ? body.language : "ru";
    const style = ["watercolor", "storybook", "gouache"].includes(body.style) ? body.style : "watercolor";
    if (!topic || topic.length > 180) return NextResponse.json({ error: "Укажите тему сказки (до 180 символов)." }, { status: 400 });

    const { data: quotaData, error: quotaError } = await supabase.rpc("consume_generation");
    if (quotaError) return NextResponse.json({ error: "Не удалось проверить лимит генераций." }, { status: 500 });
    const quota = Array.isArray(quotaData) ? quotaData[0] : quotaData;
    if (!quota?.allowed) return NextResponse.json({ error: "Лимит генераций исчерпан." }, { status: 429 });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      temperature: 0.85,
      messages: [
        { role: "system", content: `Ты профессиональный автор добрых, оригинальных иллюстрированных детских книг и литературный переводчик с русского на казахский. Возвращай только JSON. История должна иметь завязку, развитие, добрый финал. Персонажи сохраняют внешность на всех страницах. Не используй известных защищённых персонажей. Не добавляй текст или буквы в описание рисунков. Формулируй возрастосообразно и естественно.` },
        { role: "user", content: `Создай полноценную книжку-картинку для детей ${age}. Тема: ${topic}. Ровно ${pageCount} страниц И ОТДЕЛЬНАЯ ОБЛОЖКА. Язык интерфейса/первого чтения: ${language}. Стиль картинок: ${style}.
Верни JSON ровно такой структуры:
{
 "titleRu": "оригинальное название на русском",
 "titleKz": "сол атаудың сауатты қазақша нұсқасы",
 "characters": "English detailed character bible: stable names, species, clothing, colors, proportions, distinguishing features for ALL recurring characters. No text.",
 "coverPrompt": "English detailed scene description for a unique beautiful book cover illustration, with the same characters; no letters or text",
 "pages": [
   {"textRu": "3-5 коротких предложений для детей на русском", "textKz": "3-5 сөйлемнен тұратын табиғи қазақша аударма", "scenePrompt": "English precise unique illustration scene describing actions, environment, mood, time of day, camera angle, recurring characters"}
 ]
}
Требования: ровно ${pageCount} объектов pages, не повторяй картинки и композиции, меняй локации/действия/ракурсы по ходу сюжета. В каждом эпизоде 3-5 коротких предложений; все страницы образуют одну последовательную сказку. Казахский текст — естественный литературный перевод русского. Сохраняй одинаковые имена и одежду героев. Иллюстрации без текста, надписей, логотипов. Ответ — только корректный JSON.` }
      ]
    });

    const raw = JSON.parse(response.choices[0]?.message?.content || "{}");
    const pages: Page[] = Array.isArray(raw.pages) ? raw.pages.map((p: Record<string, unknown>) => ({
      textRu: String(p.textRu || "").trim(),
      textKz: String(p.textKz || "").trim(),
      scenePrompt: String(p.scenePrompt || "").trim(),
    })) : [];
    if (pages.length !== pageCount || pages.some(p => !p.textRu || !p.textKz || !p.scenePrompt) || !raw.titleRu || !raw.titleKz || !raw.coverPrompt || !raw.characters) {
      throw new Error("Не удалось подготовить все страницы сказки. Попробуйте ещё раз.");
    }

    return NextResponse.json({
      success: true,
      story: {
        titleRu: String(raw.titleRu).slice(0, 160),
        titleKz: String(raw.titleKz).slice(0, 160),
        characters: String(raw.characters).slice(0, 4000),
        coverPrompt: String(raw.coverPrompt).slice(0, 3000),
        pages,
        age,
        topic,
        style,
        language,
      },
      remaining: quota.remaining,
    });
  } catch (error: unknown) {
    const e = error as { message?: string; status?: number };
    console.error("STORYBOOK TEXT ERROR", e);
    return NextResponse.json({ error: e?.status === 429 ? "Недостаточно средств или превышен лимит OpenAI API." : e?.message || "Не удалось создать сказку." }, { status: e?.status === 429 ? 429 : 500 });
  }
}
