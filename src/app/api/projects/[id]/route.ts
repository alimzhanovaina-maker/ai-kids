import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Context) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Требуется вход в аккаунт." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title || title.length > 100) {
    return NextResponse.json({ error: "Название должно содержать от 1 до 100 символов." }, { status: 400 });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .update({ title })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,title")
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Материал не найден или не удалось изменить название." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(_request: Request, { params }: Context) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Требуется вход в аккаунт." }, { status: 401 });
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
    return NextResponse.json({ error: "Материал не найден или не удалось удалить." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
