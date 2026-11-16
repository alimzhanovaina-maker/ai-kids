
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

// Загрузка миниатюры сохранённого изображения
export async function GET(_request: Request, { params }: Context) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Требуется вход в аккаунт.", { status: 401 });
  }

  const { id } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .select("content")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !project?.content) {
    return new NextResponse("Материал не найден.", { status: 404 });
  }

  const match = project.content.match(
    /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/
  );

  if (!match) {
    return new NextResponse("У материала нет изображения.", {
      status: 404,
    });
  }

  const mimeType = match[1];
  const imageBuffer = Buffer.from(match[2], "base64");

  return new Response(imageBuffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(imageBuffer.length),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Переименование материала
export async function PATCH(request: Request, { params }: Context) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Требуется вход в аккаунт." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title || title.length > 100) {
    return NextResponse.json(
      { error: "Название должно содержать от 1 до 100 символов." },
      { status: 400 }
    );
  }

  const { data: project, error } = await supabase
    .from("projects")
    .update({ title })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,title")
    .single();

  if (error || !project) {
    return NextResponse.json(
      { error: "Материал не найден или не удалось изменить название." },
      { status: 404 }
    );
  }

  return NextResponse.json({ project });
}

// Удаление материала
export async function DELETE(_request: Request, { params }: Context) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Требуется вход в аккаунт." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const { data: project, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !project) {
    return NextResponse.json(
      { error: "Материал не найден или не удалось удалить." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
