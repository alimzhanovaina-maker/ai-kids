
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const styleRules: Record<string, string> = {
  storybook: "Premium charming children's storybook illustration, expressive friendly characters, rich details, warm magical lighting.",
  watercolor: "Beautiful hand-painted watercolor illustration, delicate paper texture, soft flowing colors and natural brushwork.",
  cartoon: "High-quality colorful cartoon illustration for preschool children, clear shapes, joyful expressions and polished animation-inspired design.",
  realistic: "Detailed realistic educational illustration, natural proportions, accurate objects and gentle natural lighting, still warm and child-friendly.",
  gouache: "Premium hand-painted gouache illustration, rich matte colors, visible painterly texture and whimsical picture-book composition.",
  coloring: "Black and white coloring-book line art, clean bold outlines, large simple shapes, pure white areas, no gray shading or color.",
};

const sizes: Record<string, "1024x1024" | "1024x1536" | "1536x1024"> = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Войди в аккаунт, чтобы создавать иллюстрации." },
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
    const promptText =
      typeof body.prompt === "string" ? body.prompt.trim() : "";
    const age = typeof body.age === "string" ? body.age : "4 года";
    const style = styleRules[body.style] ? body.style : "storybook";
    const size = sizes[body.ratio] || sizes.landscape;

    if (!promptText || promptText.length > 1200) {
      return NextResponse.json(
        { error: "Напиши описание до 1200 символов." },
        { status: 400 }
      );
    }

    const { data: quotaData, error: quotaError } =
      await supabase.rpc("consume_generation");

    if (quotaError) {
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

    const imagePrompt = `
Create ONE complete original illustration for a preschool educational project.

SCENE DESCRIPTION: ${promptText}

TARGET AGE: ${age}
VISUAL STYLE: ${styleRules[style]}

COMPOSITION:
- One cohesive full-scene illustration, not a collage or a set of cards.
- Clear main subject and readable composition suitable for young children.
- Friendly, age-appropriate, visually engaging details.
- Keep important subjects fully inside the image.
- No text, letters, numbers, captions, labels, logos, watermarks, borders or panels unless the user specifically requests a visual sign.
- High-quality polished illustration.

Return only the image.
`;

    const result = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
      prompt: imagePrompt,
      size,
      quality: "medium",
      output_format: "jpeg",
      n: 1,
    });

    const base64 = result.data?.[0]?.b64_json;

    if (!base64) {
      throw new Error("Модель не вернула изображение.");
    }

    return NextResponse.json({
      success: true,
      image: `data:image/jpeg;base64,${base64}`,
      remaining: quota.remaining,
    });

  } catch (error: any) {
    console.error("ILLUSTRATION GENERATION ERROR:", error);

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
      { error: error?.message || "Не удалось создать иллюстрацию." },
      { status: 500 }
    );
  }
}
