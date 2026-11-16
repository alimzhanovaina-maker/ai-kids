
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SavedMaterialPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: material, error } = await supabase
    .from("projects")
    .select("id,title,kind,topic,language,content,created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !material) notFound();

  const isImage = material.content.startsWith("data:image/");

  return (
    <main className="saved-page">
      <header className="saved-header">
        <Link href="/dashboard" className="back-link">← Мой кабинет</Link>
        <Link href="/" className="saved-brand">✦ AI KIDS</Link>
        <Link href="/studio" className="new-link">＋ Создать материал</Link>
      </header>

      <section className="saved-card">
        <div className="saved-kicker">📚 ТВОЯ КОЛЛЕКЦИЯ</div>
        <h1>{material.title}</h1>

        <div className="saved-meta">
          <span>Тип: {material.kind || "Материал"}</span>
          {material.topic && <span>Тема: {material.topic}</span>}
          <span>Создано: {new Date(material.created_at).toLocaleDateString("ru-RU")}</span>
          <span>Язык: {material.language === "both" ? "Русский + Қазақша" : material.language === "kz" ? "Қазақша" : "Русский"}</span>
        </div>

        {isImage ? (
          <div className="image-wrap">
            <img src={material.content} alt={material.title} />
          </div>
        ) : (
          <article className="text-material">{material.content}</article>
        )}

        <div className="saved-actions">
          {isImage ? (
            <a className="action-primary" href={material.content} download={`AI-KIDS-${material.id}.png`}>⬇️ Скачать PNG</a>
          ) : (
            <a className="action-primary" href={`data:text/plain;charset=utf-8,${encodeURIComponent(material.content)}`} download={`AI-KIDS-${material.id}.txt`}>⬇️ Скачать текст</a>
          )}
          <Link className="action-secondary" href="/dashboard">← Вернуться к материалам</Link>
        </div>

        <p className="print-tip">Для печати нажми Ctrl + P и выбери принтер или «Сохранить как PDF».</p>
      </section>

      <style>{`
        .saved-page{max-width:1050px;margin:0 auto;padding:22px 24px 50px;color:#294363;font-family:Nunito,system-ui,sans-serif}
        .saved-header{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:26px}
        .back-link,.new-link{padding:11px 15px;border:2px solid #e7edf5;border-radius:13px;background:#fff;color:#426ba8;font-size:13px;font-weight:900}
        .saved-brand{font-size:23px;font-weight:1000;color:#294363}
        .saved-card{padding:30px;border:2px solid #eeeaf0;border-radius:25px;background:#fff;box-shadow:0 7px 0 #e9e5de}
        .saved-kicker{color:#df9564;font-size:11px;font-weight:1000;letter-spacing:1.2px}
        h1{margin:9px 0 15px;font-size:clamp(25px,4vw,38px);line-height:1.2}
        .saved-meta{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:23px}
        .saved-meta span{padding:7px 11px;border-radius:20px;background:#f1f4fa;color:#637995;font-size:11px;font-weight:800}
        .image-wrap{display:flex;justify-content:center;padding:18px;border-radius:18px;background:#f2f5fa}
        .image-wrap img{display:block;max-width:100%;height:auto;max-height:1100px;object-fit:contain;background:white;box-shadow:0 3px 15px #263d5e12}
        .text-material{white-space:pre-wrap;padding:24px;border-radius:16px;background:#fffdf8;color:#334b6b;font-size:15px;line-height:1.75}
        .saved-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
        .action-primary,.action-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:45px;padding:0 17px;border-radius:13px;font-size:13px;font-weight:1000}
        .action-primary{background:#ffdc75;color:#35527b;box-shadow:0 4px 0 #e8bd52}
        .action-secondary{background:#e8eefb;color:#42649b}
        .print-tip{margin:15px 0 0;color:#8794a7;font-size:11px}
        @media(max-width:600px){.saved-page{padding:14px 12px 35px}.saved-header{flex-wrap:wrap}.saved-card{padding:18px}.saved-brand{order:-1;width:100%}}
        @media print{body{background:white!important}.saved-page{padding:0;max-width:none}.saved-header,.saved-kicker,.saved-meta,.saved-actions,.print-tip{display:none!important}.saved-card{padding:0;border:0;box-shadow:none}.image-wrap{padding:0;background:white}.image-wrap img{max-height:none;width:100%;box-shadow:none}.text-material{padding:0}}
      `}</style>
    </main>
  );
}
