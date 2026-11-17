import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };
type AnyObject = Record<string, any>;

function safeList(items: any) {
  return Array.isArray(items) ? items.filter((x) => x !== null && x !== undefined && String(x).trim() !== "") : [];
}

function hasContent(value: any) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== "";
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
  let rawText = typeof material.content === "string" ? material.content : JSON.stringify(material.content ?? "", null, 2);
  try {
    const parsed = typeof material.content === "string" ? JSON.parse(material.content) : material.content;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) kit = parsed as AnyObject;
  } catch {
    kit = null;
  }

  const isImage = typeof material.content === "string" && material.content.startsWith("data:image/");
  const jsonDownload = kit ? `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(kit, null, 2))}` : null;
  const textDownload = `data:text/plain;charset=utf-8,${encodeURIComponent(rawText)}`;
  const cards = safeList(kit?.cards);
  const illustrations = safeList(kit?.illustrations);
  const tasks = safeList(kit?.worksheet?.tasks);
  const vocabulary = safeList(kit?.vocabulary);

  return (
    <main className="saved-page">
      <header className="saved-header">
        <Link href="/dashboard" className="back-link">← Мой кабинет</Link>
        <Link href="/" className="saved-brand">✦ AI KIDS</Link>
        <Link href="/studio" className="new-link">＋ Создать материал</Link>
      </header>

      <section className="saved-card">
        <div className="saved-kicker">📚 ТВОЯ КОЛЛЕКЦИЯ</div>
        <h1>{kit?.title || material.title}</h1>
        <div className="saved-meta">
          <span>Тип: {material.kind || "Материал"}</span>
          {(kit?.topic || material.topic) && <span>Тема: {kit?.topic || material.topic}</span>}
          {kit?.age && <span>Возраст: {kit.age}</span>}
          <span>Создано: {new Date(material.created_at).toLocaleDateString("ru-RU")}</span>
          <span>Язык: {material.language === "both" ? "Русский + Қазақша" : material.language === "kz" ? "Қазақша" : "Русский"}</span>
        </div>

        {isImage ? (
          <div className="single-image"><img src={material.content} alt={material.title} /></div>
        ) : kit ? (
          <div className="kit-content">
            {hasContent(kit.objective) && <section className="content-section"><h2>🎯 Цель комплекта</h2><p>{kit.objective}</p></section>}
            {safeList(kit.materials).length > 0 && <section className="content-section"><h2>🧰 Необходимые материалы</h2><ul>{safeList(kit.materials).map((x: any, i: number) => <li key={i}>{String(x)}</li>)}</ul></section>}
            {hasContent(kit.teacherIntroduction) && <section className="content-section"><h2>👩‍🏫 Вступление педагога</h2><p>{kit.teacherIntroduction}</p></section>}

            {cards.length > 0 && <section className="content-section"><h2>🃏 Обучающие карточки</h2><div className="cards-grid">{cards.map((card: AnyObject, i: number) => (
              <article className="kit-card" key={i}>
                {illustrations[i] && typeof illustrations[i] === "string" && <img className="card-image" src={illustrations[i]} alt={card.title || `Карточка ${i + 1}`} />}
                <h3>{card.number || i + 1}. {card.title || "Карточка"}</h3>
                {card.titleKz && <p className="secondary-language">{card.titleKz}</p>}
                {card.learningFact && <p>{card.learningFact}</p>}
              </article>
            ))}</div></section>}

            {kit.worksheet && <section className="content-section"><h2>✏️ Рабочий лист: {kit.worksheet.title}</h2>{tasks.map((task: AnyObject, i: number) => (
              <article className="task-card" key={i}><h3>Задание {i + 1}</h3><p>{task.instruction}</p>{task.instructionKz && <p className="secondary-language">{task.instructionKz}</p>}{task.items && <ul>{safeList(task.items).map((item: any, j: number) => <li key={j}>{String(item)}</li>)}</ul>}{task.answer && <details><summary>Ответ для педагога</summary><p>{task.answer}</p></details>}</article>
            ))}</section>}

            {kit.game && <section className="content-section"><h2>🎲 Дидактическая игра: {kit.game.title}</h2>{kit.game.purpose && <p>{kit.game.purpose}</p>}{safeList(kit.game.rules).length > 0 && <><h3>Правила игры</h3><ul>{safeList(kit.game.rules).map((x: any, i: number) => <li key={i}>{String(x)}</li>)}</ul></>}{safeList(kit.game.teacherQuestions).length > 0 && <><h3>Вопросы детям</h3><ul>{safeList(kit.game.teacherQuestions).map((x: any, i: number) => <li key={i}>{String(x)}</li>)}</ul></>}</section>}

            {kit.poster && <section className="content-section poster-section"><h2>🖼️ Плакат: {kit.poster.title}</h2>{safeList(kit.poster.sections).map((x: AnyObject, i: number) => <p key={i}><b>{x.heading}</b>{x.description ? ` — ${x.description}` : ""}</p>)}</section>}
            {kit.coloring && <section className="content-section"><h2>🎨 Раскраска: {kit.coloring.title}</h2>{kit.coloring.visualDescription && <p>{kit.coloring.visualDescription}</p>}</section>}
            {kit.puzzle && <section className="content-section"><h2>🧩 Пазлы: {kit.puzzle.title}</h2>{kit.puzzle.instruction && <p>{kit.puzzle.instruction}</p>}{safeList(kit.puzzle.pieces).length > 0 && <ul>{safeList(kit.puzzle.pieces).map((x: any, i: number) => <li key={i}>{String(x)}</li>)}</ul>}</section>}

            {kit.teacherGuide && <section className="content-section"><h2>📚 Методические рекомендации</h2>{safeList(kit.teacherGuide.lessonFlow).length > 0 && <><h3>Ход занятия</h3><ol>{safeList(kit.teacherGuide.lessonFlow).map((x: any, i: number) => <li key={i}>{String(x)}</li>)}</ol></>}{safeList(kit.teacherGuide.teacherTips).length > 0 && <><h3>Советы педагогу</h3><ul>{safeList(kit.teacherGuide.teacherTips).map((x: any, i: number) => <li key={i}>{String(x)}</li>)}</ul></>}{safeList(kit.teacherGuide.expectedProcess).length > 0 && <><h3>Ожидаемый процесс обучения</h3><ul>{safeList(kit.teacherGuide.expectedProcess).map((x: any, i: number) => <li key={i}>{String(x)}</li>)}</ul></>}</section>}

            {vocabulary.length > 0 && <section className="content-section"><h2>🌍 Словарь</h2><div className="vocabulary">{vocabulary.map((word: AnyObject, i: number) => <p key={i}>{[word.ru, word.kz].filter(Boolean).join(" — ")}</p>)}</div></section>}
          </div>
        ) : (
          <article className="text-material">{rawText}</article>
        )}

        <div className="saved-actions">
          {isImage ? <a className="action-primary" href={material.content} download={`AI-KIDS-${material.id}.png`}>⬇️ Скачать PNG</a> : jsonDownload ? <a className="action-primary" href={jsonDownload} download={`AI-KIDS-${material.id}.json`}>⬇️ Скачать комплект (JSON)</a> : <a className="action-primary" href={textDownload} download={`AI-KIDS-${material.id}.txt`}>⬇️ Скачать текст</a>}
          <Link className="action-secondary" href="/dashboard">← Вернуться к материалам</Link>
        </div>
        <p className="print-tip">Для печати или сохранения в PDF нажми Ctrl + P и выбери «Сохранить как PDF».</p>
      </section>

      <style>{`
        .saved-page{max-width:1100px;margin:0 auto;padding:22px 24px 50px;color:#294363;font-family:Nunito,system-ui,sans-serif}
        .saved-header{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:26px}
        .back-link,.new-link{padding:11px 15px;border:2px solid #e7edf5;border-radius:13px;background:#fff;color:#426ba8;font-size:13px;font-weight:900;text-decoration:none}
        .saved-brand{font-size:23px;font-weight:1000;color:#294363;text-decoration:none}
        .saved-card{padding:30px;border:2px solid #eeeaf0;border-radius:25px;background:#fff;box-shadow:0 7px 0 #e9e5de}
        .saved-kicker{color:#df9564;font-size:11px;font-weight:1000;letter-spacing:1.2px}
        h1{margin:9px 0 15px;font-size:clamp(25px,4vw,38px);line-height:1.2}
        .saved-meta{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:23px}
        .saved-meta span{padding:7px 11px;border-radius:20px;background:#f1f4fa;color:#637995;font-size:11px;font-weight:800}
        .kit-content{color:#334b6b;font-size:15px;line-height:1.7}.content-section{margin:24px 0;padding:19px 21px;border:1px solid #e4eaf3;border-radius:17px;background:#fff}.content-section h2{margin:0 0 13px;color:#315b96;font-size:20px}.content-section h3{color:#3c5f91;font-size:16px}.content-section p{margin:8px 0}.content-section li{margin:5px 0}.cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}.kit-card{padding:15px;border:1px solid #dce5f1;border-radius:15px;background:#fbfcff;break-inside:avoid}.kit-card h3{margin:10px 0 6px}.card-image{display:block;width:100%;max-width:260px;height:210px;object-fit:contain;margin:0 auto 8px;border-radius:10px;background:#fff}.secondary-language{color:#6881a4}.task-card{padding:13px 15px;margin:10px 0;border:1px solid #e2e9f2;border-radius:12px;background:#fbfcff;break-inside:avoid}.task-card h3{margin:0 0 7px}.task-card details{margin-top:8px;color:#58749b}.poster-section{background:#f4f7ff}.vocabulary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:5px 16px}.single-image{display:flex;justify-content:center;padding:18px;border-radius:18px;background:#f2f5fa}.single-image img{display:block;max-width:100%;height:auto;max-height:1100px;object-fit:contain;background:white}.text-material{white-space:pre-wrap;padding:24px;border-radius:16px;background:#fffdf8;color:#334b6b;font-size:15px;line-height:1.75}.saved-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.action-primary,.action-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:45px;padding:0 17px;border-radius:13px;font-size:13px;font-weight:1000;text-decoration:none}.action-primary{background:#ffdc75;color:#35527b;box-shadow:0 4px 0 #e8bd52}.action-secondary{background:#e8eefb;color:#42649b}.print-tip{margin:15px 0 0;color:#8794a7;font-size:11px}
        @media(max-width:600px){.saved-page{padding:14px 12px 35px}.saved-header{flex-wrap:wrap}.saved-card{padding:18px}.saved-brand{order:-1;width:100%}.content-section{padding:14px}}
        @media print{@page{size:A4;margin:14mm}body{background:white!important}.saved-page{padding:0;max-width:none}.saved-header,.saved-kicker,.saved-meta,.saved-actions,.print-tip{display:none!important}.saved-card{padding:0;border:0;box-shadow:none}.content-section{break-inside:avoid;page-break-inside:avoid}.kit-card,.task-card{break-inside:avoid}.card-image{max-height:170px}.single-image{padding:0;background:white}.single-image img{max-height:none;width:100%;box-shadow:none}}
      `}</style>
    </main>
  );
}
