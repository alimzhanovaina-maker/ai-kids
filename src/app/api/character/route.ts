
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const styles: Record<string, string> = {
  cartoon: "Cute high-quality 3D cartoon character, expressive eyes, friendly appearance, polished animation style.",
  storybook: "Beautiful children's storybook character illustration, charming hand-painted details and warm colors.",
  watercolor: "Soft watercolor character illustration, delicate brushwork, gentle colors and paper texture.",
  vector: "Clean professional vector character illustration, smooth shapes, crisp outlines and simple readable forms.",
  realistic: "Detailed realistic educational character illustration, natural proportions and child-friendly appearance.",
  plush: "Adorable soft plush toy character, fluffy fabric texture, rounded shapes and gentle expression.",
};

const poses: Record<string, string> = {
  standing: "Full body, standing upright, facing slightly toward the viewer.",
  sitting: "Full body, sitting naturally in a cute relaxed pose.",
  waving: "Full body, standing and waving one hand toward the viewer.",
  jumping: "Full body, happily jumping in the air.",
  walking: "Full body, walking naturally, showing the entire character.",
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Войди в аккаунт, чтобы создавать персонажей." },
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

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const age =
      typeof body.age === "string" ? body.age : "4 года";

    const style = styles[body.style] ? body.style : "cartoon";
    const pose = poses[body.pose] ? body.pose : "standing";

    if (!description || description.length > 1000) {
      return NextResponse.json(
        { error: "Опиши персонажа (до 1000 символов)." },
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

    const prompt = `
Create ONE original isolated character for a preschool educational project.

CHARACTER DESCRIPTION:
${description}

TARGET AGE:
${age}

ART STYLE:
${styles[style]}

POSE:
${poses[pose]}

IMPORTANT REQUIREMENTS:
- Show exactly one complete character.
- Show the entire body, including feet, ears, tail, wings or other body parts.
- Keep the character centered with comfortable space around it.
- Friendly, recognizable and suitable for young children.
- Attractive expressive face and clear silhouette.
- No additional characters.
- No scene, landscape, room or decorative background.
- No text, letters, numbers, labels, logos or watermarks.
- The background MUST be truly transparent, not white or checkerboard.
- The character must have clean edges, suitable for stickers, cards and worksheets.
- High-quality polished illustration.

Return only the image.
`;

    const result = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
      prompt,
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
      output_format: "png",
      n: 1,
    });

    const base64 = result.data?.[0]?.b64_json;

    if (!base64) {
      throw new Error("Модель не вернула изображение.");
    }

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${base64}`,
      remaining: quota.remaining,
    });

  } catch (error: any) {
    console.error("CHARACTER GENERATION ERROR:", error);

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Проверь баланс или лимит OpenAI API." },
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
      { error: error?.message || "Не удалось создать персонажа." },
      { status: 500 }
    );
  }
}
