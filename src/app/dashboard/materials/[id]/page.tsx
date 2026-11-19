
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };
type AnyObject = Record<string, any>;

function list(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

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

  let kit: AnyObject | null = null;
  const rawText = typeof material.content === "string"
    ? material.content
    : JSON.stringify(material.content ?? "", null, 2);

  try {
    const parsed = typeof material.content === "string"
      ? JSON.parse(material.content)
      : material.content;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      kit = parsed;
    }
  } catch {
    kit = null;
  }

  const storybookData: AnyObject | null =
    kit &&
    kit.version === "storybook-v1" &&
    kit.story &&
    Array.isArray(kit.images)
      ? kit
      : null;

  const storybookImages: string[] = storybookData
    ? await Promise.all(
        storybookData.images.map(async (entry: AnyObject) => {
          const storagePath =
            typeof entry?.path === "string" ? entry.path : "";

          if (!storagePath || !storagePath.startsWith(user.id + "/")) {
            return "";
          }

          const { data } = await supabase.storage
            .from("storybooks")
            .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

          return data?.signedUrl || "";
        })
      )
    : [];

  const isImage =
    typeof material.content === "string" &&
    material.content.startsWith("data:image/");

  const imageUrl = `/api/projects/${material.id}`;
  const jsonDownload = kit
    ? `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(kit, null, 2))}`
    : null;
  const textDownload =
    `data:text/plain;charset=utf-8,${encodeURIComponent(rawText)}`;

  const language = material.language || "ru";
  const pages = list(storybookData?.story?.pages);

  return (
    <main className="saved-page">
      <header className="saved-header">
        <Link href="/dashboard" className="nav-button">← Мой кабинет</Link>
        <Link href="/" className="brand">✦ AI KIDS</Link>
        <Link href="/studio" className="nav-button">＋ Создать материал</Link>
      </header>

      <section className="saved-card">
        <div className="kicker">📚 ТВОЯ КОЛЛЕКЦИЯ</div>
        <h1>{storybookData?.story?.titleRu || kit?.title || material.title}</h1>

        <div className="meta">
          <span>Тип: {material.kind || "Материал"}</span>
          {material.topic && <span>Тема: {material.topic}</span>}
          <span>
            Создано: {new Date(material.created_at).toLocaleDateString("ru-RU")}
          </span>
          <span>
            Язык: {language === "both" ? "Русский + Қазақша" : language === "kz" ? "Қазақша" : "Русский"}
          </span>
        </div>

        {storybookData ? (
          <div className="storybook">
            <section className="book-cover">
              <div className="cover-picture">
                {storybookImages[0] ? (
                  <img src={storybookImages[0]} alt="Обложка сказки" />
                ) : <span>📖</span>}
              </div>
              <div className="cover-info">
                <span className="book-label">✨ АВТОРСКАЯ СКАЗКА</span>
                <h2>{storybookData.story.titleRu || material.title}</h2>
                {storybookData.story.titleKz && <h3>{storybookData.story.titleKz}</h3>}
                <p>{pages.length} страниц · Иллюстрированная книга</p>
              </div>
            </section>

            <div className="book-pages">
              {pages.map((page: AnyObject, i: number) => (
                <article className="book-page" key={i}>
                  <div className="page-art">
                    {storybookImages[i + 1] ? (
                      <img
                        src={storybookImages[i + 1]}
                        alt={`Иллюстрация страницы ${i + 1}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="image-placeholder">🦊</div>
                    )}

                    <div className="page-text-overlay">
                      <span className="page-number">СТРАНИЦА {i + 1}</span>

                      {(language === "ru" || language === "both" || !language) && page.textRu && (
                        <p>{page.textRu}</p>
                      )}

                      {(language === "kz" || language === "both") && page.textKz && (
                        <p>{page.textKz}</p>
                      )}

                      {language === "ru" && page.textKz && (
                        <details>
                          <summary>Қазақша оқу</summary>
                          <p>{page.textKz}</p>
                        </details>
                      )}

                      {language === "kz" && page.textRu && (
                        <details>
                          <summary>Читать на русском</summary>
                          <p>{page.textRu}</p>
                        </details>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : isImage ? (
          <div className="single-image">
            <img src={imageUrl} alt={material.title} />
          </div>
        ) : kit ? (
          <div className="kit-content">
            {kit.objective && (
              <section className="content-section">
                <h2>🎯 Цель</h2>
                <p>{kit.objective}</p>
              </section>
            )}

            {list(kit.materials).length > 0 && (
              <section className="content-section">
                <h2>🧰 Материалы</h2>
                <ul>{list(kit.materials).map((x: any, i: number) => <li key={i}>{String(x)}</li>)}</ul>
              </section>
            )}

            {kit.teacherIntroduction && (
              <section className="content-section">
                <h2>👩‍🏫 Вступление педагога</h2>
                <p>{kit.teacherIntroduction}</p>
              </section>
            )}

            {list(kit.cards).length > 0 && (
              <section className="content-section">
                <h2>🃏 Обучающие карточки</h2>
                <div className="cards-grid">
                  {list(kit.cards).map((card: AnyObject, i: number) => (
                    <article className="kit-card" key={i}>
                      {list(kit.illustrations)[i] && (
                        <img src={kit.illustrations[i]} alt="" />
                      )}
                      <h3>{card.number || i + 1}. {card.title || "Карточка"}</h3>
                      {card.titleKz && <p>{card.titleKz}</p>}
                      {card.learningFact && <p>{card.learningFact}</p>}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {kit.worksheet && (
              <section className="content-section">
                <h2>✏️ {kit.worksheet.title || "Рабочий лист"}</h2>
                {list(kit.worksheet.tasks).map((task: AnyObject, i: number) => (
                  <article className="task-card" key={i}>
                    <h3>Задание {i + 1}</h3>
                    <p>{task.instruction}</p>
                    {task.instructionKz && <p>{task.instructionKz}</p>}
                    {list(task.items).map((item: any, j: number) => <p key={j}>{String(item)}</p>)}
                    {task.answer && <details><summary>Ответ для педагога</summary>{task.answer}</details>}
                  </article>
                ))}
              </section>
            )}

            {kit.game && (
              <section className="content-section">
                <h2>🎲 {kit.game.title || "Дидактическая игра"}</h2>
                {kit.game.purpose && <p>{kit.game.purpose}</p>}
                {list(kit.game.rules).map((x: any, i: number) => <p key={i}>{String(x)}</p>)}
                {list(kit.game.teacherQuestions).map((x: any, i: number) => <p key={i}>{String(x)}</p>)}
              </section>
            )}

            {kit.poster && (
              <section className="content-section">
                <h2>🖼️ {kit.poster.title || "Плакат"}</h2>
                {list(kit.poster.sections).map((x: AnyObject, i: number) => (
                  <p key={i}><b>{x.heading}</b> — {x.description}</p>
                ))}
              </section>
            )}

            {kit.coloring && (
              <section className="content-section">
                <h2>🎨 {kit.coloring.title || "Раскраска"}</h2>
                <p>{kit.coloring.visualDescription}</p>
              </section>
            )}

            {kit.puzzle && (
              <section className="content-section">
                <h2>🧩 {kit.puzzle.title || "Пазл"}</h2>
                <p>{kit.puzzle.instruction}</p>
                {list(kit.puzzle.pieces).map((x: any, i: number) => <p key={i}>{String(x)}</p>)}
              </section>
            )}

            {kit.teacherGuide && (
              <section className="content-section">
                <h2>📚 Методические рекомендации</h2>
                {list(kit.teacherGuide.lessonFlow).map((x: any, i: number) => <p key={i}>{String(x)}</p>)}
                {list(kit.teacherGuide.teacherTips).map((x: any, i: number) => <p key={i}>{String(x)}</p>)}
                {list(kit.teacherGuide.expectedProcess).map((x: any, i: number) => <p key={i}>{String(x)}</p>)}
              </section>
            )}

            {list(kit.vocabulary).length > 0 && (
              <section className="content-section">
                <h2>🌍 Словарь</h2>
                {list(kit.vocabulary).map((word: AnyObject, i: number) => (
                  <p key={i}>{[word.ru, word.kz].filter(Boolean).join(" — ")}</p>
                ))}
              </section>
            )}

            {!kit.objective && !kit.cards && !kit.worksheet && !kit.game && !kit.poster && !kit.coloring && !kit.puzzle && !kit.teacherGuide && (
              <pre className="raw-content">{rawText}</pre>
            )}
          </div>
        ) : (
          <pre className="raw-content">{rawText}</pre>
        )}

        <div className="actions">
          {isImage ? (
            <a className="primary" href={imageUrl} download={`AI-KIDS-${material.id}.png`}>⬇️ Скачать изображение</a>
          ) : jsonDownload ? (
            <a className="primary" href={jsonDownload} download={`AI-KIDS-${material.id}.json`}>⬇️ Скачать комплект JSON</a>
          ) : (
            <a className="primary" href={textDownload} download={`AI-KIDS-${material.id}.txt`}>⬇️ Скачать текст</a>
          )}
          <Link className="secondary" href="/dashboard">← Вернуться к материалам</Link>
        </div>
        <p className="print-tip">Для печати нажми Ctrl + P и выбери «Сохранить как PDF».</p>
      </section>

      <style>{`
        .saved-page{max-width:1100px;margin:auto;padding:22px 24px 50px;color:#294363;font-family:Nunito,system-ui,sans-serif}
        .saved-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:25px}
        .nav-button{padding:10px 14px;border:2px solid #e7edf5;border-radius:13px;background:white;color:#426ba8;font-size:13px;font-weight:800;text-decoration:none}
        .brand{font-size:23px;font-weight:1000;color:#294363;text-decoration:none}
        .saved-card{padding:30px;border:2px solid #eeeaf0;border-radius:25px;background:white;box-shadow:0 7px 0 #e9e5de}
        .kicker{color:#df9564;font-size:11px;font-weight:1000;letter-spacing:1.2px}
        h1{margin:10px 0 15px;font-size:clamp(25px,4vw,38px)}
        .meta{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:23px}
        .meta span{padding:7px 11px;border-radius:20px;background:#f1f4fa;color:#637995;font-size:11px;font-weight:800}
        .book-cover{display:grid;grid-template-columns:1fr 1fr;gap:25px;align-items:center;padding:22px;border-radius:22px;background:linear-gradient(135deg,#fff3d9,#f4eaff)}
        .cover-picture{min-height:300px;display:grid;place-items:center;background:white;border-radius:16px;overflow:hidden}
        .cover-picture img{width:100%;height:100%;max-height:480px;object-fit:contain}
        .cover-picture span{font-size:90px}
        .cover-info{padding:18px}
        .book-label{font-size:11px;font-weight:900;letter-spacing:1px;color:#df9564}
        .cover-info h2{font-size:clamp(24px,4vw,34px);color:#315b96;line-height:1.2}
        .cover-info h3{color:#7b75a8}
        .cover-info p{color:#71829a;font-weight:700}
        .book-pages{display:grid;gap:30px;margin-top:28px}
        .book-page{width:100%;break-inside:avoid;page-break-inside:avoid}
        .page-art{position:relative;width:100%;max-width:800px;margin:auto;overflow:hidden;border-radius:22px;background:#eaf0fa;box-shadow:0 6px 20px #20385a24}
        .page-art>img{display:block;width:100%;height:auto;min-height:480px;max-height:850px;object-fit:cover}
        .image-placeholder{min-height:480px;display:grid;place-items:center;font-size:100px}
        .page-text-overlay{position:absolute;left:5%;right:5%;bottom:4%;max-height:55%;overflow:auto;padding:20px 24px;border:1px solid #ffffffb5;border-radius:18px;background:rgba(255,255,255,.91);backdrop-filter:blur(6px);color:#263d5d;font-size:clamp(15px,1.7vw,20px);font-weight:600;line-height:1.6;white-space:pre-wrap;box-shadow:0 5px 22px #20385a30}
        .page-text-overlay p{margin:8px 0}
        .page-number{display:block;margin-bottom:8px;color:#d58b58;font-size:11px;font-weight:900;letter-spacing:1px}
        .page-text-overlay details{margin-top:10px;padding-top:8px;border-top:1px dashed #ccd6e5;font-size:14px}
        .page-text-overlay summary{cursor:pointer;color:#526c91;font-weight:800}
        .kit-content{color:#334b6b;font-size:15px;line-height:1.7}
        .content-section{margin:24px 0;padding:19px 21px;border:1px solid #e4eaf3;border-radius:17px;background:#fff}
        .content-section h2{margin:0 0 13px;color:#315b96;font-size:20px}
        .content-section h3{color:#3c5f91;font-size:16px}
        .cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}
        .kit-card{padding:15px;border:1px solid #dce5f1;border-radius:15px;background:#fbfcff}
        .kit-card img{display:block;width:100%;max-height:230px;object-fit:contain}
        .task-card{padding:13px 15px;margin:10px 0;border:1px solid #e2e9f2;border-radius:12px;background:#fbfcff}
        .single-image{display:flex;justify-content:center;padding:18px;background:#f2f5fa}
        .single-image img{max-width:100%;height:auto;max-height:1100px;object-fit:contain}
        .raw-content{white-space:pre-wrap;padding:24px;background:#fffdf8;border-radius:16px;line-height:1.75;overflow-wrap:anywhere}
        .actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
        .primary,.secondary{display:inline-flex;align-items:center;justify-content:center;min-height:45px;padding:0 17px;border-radius:13px;font-size:13px;font-weight:900;text-decoration:none}
        .primary{background:#ffdc75;color:#35527b;box-shadow:0 4px 0 #e8bd52}
        .secondary{background:#e8eefb;color:#42649b}
        .print-tip{margin-top:15px;color:#8794a7;font-size:11px}
        @media(max-width:700px){
          .book-cover{grid-template-columns:1fr}
          .page-art>img{min-height:380px}
          .page-text-overlay{left:3%;right:3%;bottom:3%;padding:13px;font-size:14px;max-height:60%}
        }
        @media(max-width:600px){
          .saved-page{padding:14px 12px 35px}
          .saved-header{flex-wrap:wrap}
          .saved-card{padding:18px}
          .brand{order:-1;width:100%}
        }
        @media print{
          @page{size:A4;margin:10mm}
          body{background:white!important}
          .saved-page{padding:0;max-width:none}
          .saved-header,.kicker,.meta,.actions,.print-tip{display:none!important}
          .saved-card{padding:0;border:0;box-shadow:none}
          .book-cover,.book-page{break-inside:avoid;page-break-inside:avoid}
          .page-art{box-shadow:none;border-radius:0}
          .page-art>img{min-height:0;max-height:260mm;object-fit:contain}
          .page-text-overlay{background:rgba(255,255,255,.94);max-height:none;overflow:visible;backdrop-filter:none}
        }
      `}</style>
    </main>
  );
}
