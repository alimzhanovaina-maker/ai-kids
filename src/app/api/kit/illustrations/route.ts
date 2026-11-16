import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type IllustrationInput = {
  visualDescription?: string;
  title?: string;
};

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
    const cards = Array.isArray(body.cards)
      ? (body.cards as IllustrationInput[]).slice(0, 8)
      : [];
    const age = typeof body.age === "string" ? body.age : "4 года";
    const style = body.style === "mono" ? "mono" : "color";

    if (!cards.length) {
      return NextResponse.json(
        { error: "В комплекте нет карточек для иллюстраций." },
        { status: 400 }
      );
    }

    if (
      cards.some(
        (card) =>
          typeof card.visualDescription !== "string" ||
          !card.visualDescription.trim()
      )
    ) {
      return NextResponse.json(
        { error: "В одной из карточек отсутствует описание изображения." },
        { status: 400 }
      );
    }

    const { data: quotaData, error: quotaError } =
      await supabase.rpc("consume_generation");

    if (quotaError) {
      console.error("KIT IMAGE QUOTA ERROR:", quotaError);
      return NextResponse.json(
        { error: "Не удалось проверить лимит генераций." },
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
    const styleRule =
      style === "mono"
        ? "Black and white preschool coloring-book line art, thick clean black outlines, pure white background, no gray shading, simple large shapes."
        : "Bright friendly preschool storybook illustration, cheerful balanced colors, clean edges, soft minimal shadow, recognizable natural anatomy.";

    const illustrations: string[] = [];
    const batchSize = 2;

    for (let start = 0; start < cards.length; start += batchSize) {
      const batch = cards.slice(start, start + batchSize);

      const generated = await Promise.all(
        batch.map(async (card, index) => {
          const description = String(card.visualDescription || "").trim();
          const title = String(card.title || `Объект ${start + index + 1}`).trim();

          const result = await openai.images.generate({
            model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
            prompt: `
Create ONE isolated educational illustration for a preschool printable.

The only subject in the image must match this description:
${description}

Subject name for meaning only: ${title}.
Age group: ${age}.

Art direction:
${styleRule}

Composition:
- Exactly one complete subject, centered.
- Entire subject visible with generous empty margin.
- Plain pure white background.
- No extra objects, people, animals, scenery, props or decorations.
- No words, letters, numbers, labels, captions, watermark or logo.
- No border, no card frame, no grid, no collage, no multiple views.
- Square composition, crisp high-quality illustration.
`,
            size: "1024x1024",
            quality: "low",
            output_format: "jpeg",
            n: 1,
          });

          const base64 = result.data?.[0]?.b64_json;
          if (!base64) {
            throw new Error(`Не удалось создать иллюстрацию «${title}».`);
          }

          return `data:image/jpeg;base64,${base64}`;
        })
      );

      illustrations.push(...generated);
    }

    return NextResponse.json({
      success: true,
      illustrations,
      remaining: quota.remaining,
    });
  } catch (error: any) {
    console.error("AI KIDS KIT ILLUSTRATIONS ERROR:", error);

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
      { error: error?.message || "Не удалось создать иллюстрации." },
      { status: 500 }
    );
  }
}
