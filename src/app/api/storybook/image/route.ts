
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const styles: Record<string, string> = {
  watercolor:
    "Luminous hand-painted watercolor children's picture book art, textured watercolor paper, soft painterly details, rich harmonious colors, magical natural lighting, professional publishing quality.",
  storybook:
    "High-end charming 3D children's storybook illustration, soft rounded sculpted characters, warm cinematic lighting, playful richly detailed environments, beautiful compositions.",
  gouache:
    "Premium hand-painted gouache children's book illustration, rich matte colors, textured brushwork, whimsical shapes, sophisticated editorial picture-book art.",
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Войдите в аккаунт." },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY не настроен." },
        { status: 503 }
      );
    }

    const body = await req.json();

    const characters =
      typeof body.characters === "string" ? body.characters.trim() : "";
    const scenePrompt =
      typeof body.scenePrompt === "string" ? body.scenePrompt.trim() : "";
    const referenceImagePath =
      typeof body.referenceImagePath === "string"
        ? body.referenceImagePath.trim()
        : "";

    const style = styles[body.style] || styles.watercolor;

    if (
      !characters ||
      !scenePrompt ||
      characters.length > 4000 ||
      scenePrompt.length > 3000
    ) {
      return NextResponse.json(
        { error: "Не хватает описания сцены или персонажей." },
        { status: 400 }
      );
    }

    const { data: quotaData, error: quotaError } =
      await supabase.rpc("consume_generation");

    if (quotaError) {
      return NextResponse.json(
        { error: "Ошибка проверки лимита." },
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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Create one complete vertical illustration for a premium ORIGINAL preschool picture book.

ART STYLE: ${style}

CONSISTENT CHARACTERS (follow EXACTLY): ${characters}

SCENE TO DRAW: ${scenePrompt}

Character continuity is essential. Keep every recurring character visually identical to the reference: same species, face shape, eye color, fur color and markings, body proportions, clothing, accessories, and age. Do not redesign, recolor, replace, or add features to the characters. Only the pose, expression, action, camera angle, and environment may change to fit this page.

Composition: portrait 2:3, full-bleed illustration, detailed immersive scenery, cohesive color palette, readable friendly expressions, professional children's picture-book quality. Absolutely NO text, NO letters, NO words, NO numbers, NO speech bubbles, NO borders, NO watermarks, NO multiple panels.`;

    let result;

    if (referenceImagePath) {
      if (
        !referenceImagePath.startsWith(`${user.id}/`) ||
        referenceImagePath.includes("..")
      ) {
        return NextResponse.json(
          { error: "Недопустимый путь к изображению-образцу." },
          { status: 400 }
        );
      }

      const { data: referenceBlob, error: referenceError } =
        await supabase.storage
          .from("storybooks")
          .download(referenceImagePath);

      if (referenceError || !referenceBlob) {
        throw new Error(
          "Не удалось загрузить обложку для сохранения внешности персонажей."
        );
      }

      const referenceBuffer = Buffer.from(
        await referenceBlob.arrayBuffer()
      );

      const referenceFile = await toFile(
        referenceBuffer,
        "character-reference.jpg",
        { type: "image/jpeg" }
      );

      result = await openai.images.edit({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
        image: referenceFile,
        prompt,
        size: "1024x1536",
        quality: "medium",
      });
    } else {
      result = await openai.images.generate({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
        size: "1024x1536",
        quality: "medium",
        n: 1,
        prompt,
      });
    }

    const base64 = result.data?.[0]?.b64_json;

    if (!base64) {
      throw new Error("Модель не вернула изображение.");
    }

    const filePath = `${user.id}/${crypto.randomUUID()}.jpg`;
    const buffer = Buffer.from(base64, "base64");

    const { error: uploadError } = await supabase.storage
      .from("storybooks")
      .upload(filePath, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        "Не удалось сохранить иллюстрацию в Supabase Storage: " +
          uploadError.message
      );
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from("storybooks")
      .createSignedUrl(filePath, 60 * 60 * 24 * 7);

    if (signedError || !signed?.signedUrl) {
      throw new Error("Не удалось открыть сохранённую иллюстрацию.");
    }

    return NextResponse.json({
      success: true,
      imagePath: filePath,
      imageUrl: signed.signedUrl,
      remaining: quota.remaining,
    });
  } catch (error: unknown) {
    const e = error as { message?: string; status?: number };

    console.error("STORYBOOK IMAGE ERROR", e);

    return NextResponse.json(
      {
        error:
          e?.status === 429
            ? "Лимит OpenAI API или недостаточно средств на API-балансе."
            : e?.message || "Ошибка создания иллюстрации.",
      },
      { status: e?.status === 429 ? 429 : 500 }
    );
  }
}
