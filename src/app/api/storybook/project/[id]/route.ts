import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const { id } = await params;
  const { data: project, error } = await supabase.from("projects")
    .select("id,title,kind,content").eq("id", id).eq("user_id", user.id).single();
  if (error || !project || project.kind !== "storybook") return NextResponse.json({ error: "Книга не найдена." }, { status: 404 });

  try {
    const parsed = typeof project.content === "string" ? JSON.parse(project.content) : project.content;
    if (parsed?.version !== "storybook-v1" || !parsed.story || !Array.isArray(parsed.images)) throw new Error("Неверный формат книги.");
    const images = await Promise.all(parsed.images.map(async (entry: { path?: string }) => {
      const path = typeof entry?.path === "string" ? entry.path : "";
      if (!path || !path.startsWith(user.id + "/")) return { path: "", url: "" };
      const { data } = await supabase.storage.from("storybooks").createSignedUrl(path, 60 * 60 * 24 * 7);
      return { path, url: data?.signedUrl || "" };
    }));
    return NextResponse.json({ story: parsed.story, images, projectId: project.id });
  } catch (e) {
    console.error("STORYBOOK LOAD ERROR", e);
    return NextResponse.json({ error: "Не удалось открыть сохранённую книгу." }, { status: 500 });
  }
}
