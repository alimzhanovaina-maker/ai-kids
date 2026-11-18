
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomInt, randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 120;

const styleRules: Record<string, string> = {
  storybook:
    "Premium charming children's storybook illustration, expressive friendly characters, rich details, warm magical lighting.",
  watercolor:
    "Beautiful hand-painted watercolor illustration, delicate paper texture, soft flowing colors and natural brushwork.",
  cartoon:
    "High-quality colorful cartoon illustration for preschool children, clear shapes, joyful expressions and polished animation-inspired design.",
  realistic:
    "Detailed realistic educational illustration, natural proportions, accurate objects and gentle natural lighting, still warm and child-friendly.",
  gouache:
    "Premium hand-painted gouache illustration, rich matte colors, visible painterly texture and whimsical picture-book composition.",
  coloring:
    "Black and white coloring-book line art, clean bold outlines, large simple shapes, pure white areas, no gray shading or color.",
};

const sizes: Record<
  string,
  "1024x1024" | "1024x1536" | "1536x1024"
> = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
};

const variationIdeas = [
  "Use a completely different composition. Place the main subject on the left and supporting characters on the right. Change their poses and interactions.",
  "Create a new wide-angle scene with a different camera perspective. Show more of the environment and arrange the characters in a new way.",
  "Use a close-up storybook composition. Change the characters' poses, expressions and positions. Add different small environmental details.",
  "Create a lively diagonal composition with characters interacting with each other. Change the background arrangement and decorative elements.",
  "Use a balanced symmetrical composition with a different arrangement of objects, characters and background details.",
  "Create a fresh scene with a different visual focal point, new character positions, different lighting and a noticeably different color arrangement.",
  "Show the scene from a slightly elevated viewpoint. Change the placement of all important objects and characters.",
  "Create a playful dynamic composition with characters in different poses and activities. Use a different distribution of colors and background elements.",
];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const age =
      typeof body.age === "string" ? body.age : "4 года";

    const style = styleRules[body.style]
      ? body.style
      : "storybook";

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

    const quota = Array.isArray(quotaData)
      ? quotaData[0]
      : quotaData;

    if (!quota?.allowed) {
      return NextResponse.json(
        { error: "Лимит генераций исчерпан. Попробуй позже." },
        { status: 429 }
      );
    }

    const variationNumber = randomInt(variationIdeas.length);
    const variation = variationIdeas[variationNumber];
    const uniqueId = randomUUID();

    const openai = new OpenAI({ apiKey });

    const imagePrompt = `
Create ONE original illustration for a preschool educational project.

SCENE DESCRIPTION:
${promptText}

TARGET AGE:
${age}

VISUAL STYLE:
${styleRules[style]}

NEW CREATIVE VARIATION:
${variation}

VARIATION IDENTIFIER:
${uniqueId}

IMPORTANT CREATIVE RULES:
- Treat this request as a fresh visual interpretation of the scene.
- Do not use a generic repeated composition.
- Change the placement, poses and interactions of the characters.
- Change the camera angle and background arrangement.
- Introduce fresh visual details that match the requested subject.
- Keep all characters recognizable and appropriate for children.
- Preserve the main topic and meaning of the user's description.
- Make this result visually distinct from other possible illustrations of the same topic.

COMPOSITION:
- One complete cohesive full-scene illustration.
- No collage, no grids, no separate cards.
- Clear main subject and readable composition.
- Friendly, age-appropriate characters.
- Keep important subjects fully inside the image.
- No text, letters, numbers, captions, logos or watermarks.
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
        {
          error:
            "Недостаточно средств или превышен лимит OpenAI API. Проверь баланс.",
        },
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
