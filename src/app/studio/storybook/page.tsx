"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Language = "ru" | "kz" | "both";
type Page = { textRu: string; textKz: string; scenePrompt: string };
type Story = {
  titleRu: string; titleKz: string; characters: string; coverPrompt: string;
  pages: Page[]; topic: string; age: string; language: Language; style: string;
};
type BookImage = { path: string; url: string };
const emptyImage = { path: "", url: "" };

export default function StorybookStudio() {
  const [topic, setTopic] = useState("Лисёнок, который искал друзей");
  const [age, setAge] = useState("4 года");
  const [language, setLanguage] = useState<Language>("ru");
  const [displayLanguage, setDisplayLanguage] = useState<Language>("ru");
  const [pageCount, setPageCount] = useState(4);
  const [style, setStyle] = useState("watercolor");
  const [story, setStory] = useState<Story | null>(null);
  const [images, setImages] = useState<BookImage[]>([]);
  const [current, setCurrent] = useState(0);
  const [busyText, setBusyText] = useState(false);
  const [busyImages, setBusyImages] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savedProjectId, setSavedProjectId] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("project");
    if (!id) return;
    let active = true;
    fetch(`/api/storybook/project/${encodeURIComponent(id)}`)
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error || "Ошибка загрузки"); return data; })
      .then(data => {
        if (!active) return;
        setStory(data.story);
        setImages(data.images);
        setTopic(data.story.topic || "");
        setAge(data.story.age || "4 года");
        setStyle(data.story.style || "watercolor");
        setPageCount(data.story.pages?.length || 4);
        setLanguage(data.story.language || "ru");
        setDisplayLanguage(data.story.language || "ru");
        setSavedProjectId(data.projectId);
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Не удалось загрузить книгу"); });
    return () => { active = false; };
  }, []);

  async function requestJson(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ошибка создания материала");
    return data;
  }

  async function drawImages(book: Story, existing: BookImage[] = []) {
    setBusyImages(true);
    setError("");
    const updated: BookImage[] = Array.from({ length: book.pages.length + 1 }, (_, i) => existing[i] || { ...emptyImage });
    setImages([...updated]);
    setProgress(updated.filter(img => img.path).length);
    try {
      for (let i = 0; i < updated.length; i++) {
        if (updated[i]?.path && updated[i]?.url) continue;
        const scenePrompt = i === 0 ? book.coverPrompt : book.pages[i - 1].scenePrompt;
        const data = await requestJson("/api/storybook/image", {
          characters: book.characters,
          scenePrompt,
          style: book.style,
          referenceImagePath: i === 0 ? "" : updated[0]?.path || "",
        });
        updated[i] = { path: data.imagePath, url: data.imageUrl };
        setImages([...updated]);
        setProgress(updated.filter(img => img.path).length);
      }
      setMessage("Все иллюстрации готовы! Можно листать книгу, распечатать и сохранить.");
    } catch (e) {
      setError((e instanceof Error ? e.message : "Ошибка генерации") + " Иллюстрации, которые уже готовы, не потеряны. Нажмите «Дорисовать картинки».");
    } finally {
      setBusyImages(false);
    }
  }

  async function generateBook() {
    if (!topic.trim() || busyText || busyImages) return;
    setBusyText(true); setStory(null); setImages([]); setCurrent(0);
    setError(""); setMessage(""); setSavedProjectId(""); setProgress(0);
    try {
      const data = await requestJson("/api/storybook", { topic: topic.trim(), age, language, pageCount, style });
      const book: Story = data.story;
      setStory(book);
      setDisplayLanguage(language);
      setBusyText(false);
      await drawImages(book);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать книгу.");
      setBusyText(false);
    }
  }

  async function saveBook() {
    if (!story || busySave || savedProjectId || images.length !== story.pages.length + 1 || images.some(image => !image.path)) return;
    setBusySave(true); setError("");
    try {
      const data = await requestJson("/api/projects", {
        title: story.titleRu,
        kind: "storybook",
        topic: story.topic,
        language: story.language,
        content: JSON.stringify({ version: "storybook-v1", story, images: images.map(img => ({ path: img.path })) }),
      });
      setSavedProjectId(data.project.id);
      setMessage("Книга сохранена в личном кабинете. Открыть её можно по ссылке ниже.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить книгу.");
    } finally {
      setBusySave(false);
    }
  }

  const title = story ? (displayLanguage === "kz" ? story.titleKz : story.titleRu) : "";
  const allImagesReady = Boolean(story && images.length === story.pages.length + 1 && images.every(img => img.path));
  const totalSheets = story ? story.pages.length + 1 : 0;

  return <main className="storybook-world">
    <header className="topbar"><Link className="brand" href="/studio">✦ AI KIDS <span>📚</span></Link><nav><Link href="/">Главная</Link><Link href="/studio">Мастерская</Link><Link href="/dashboard">Мои материалы</Link></nav></header>

    <section className="hero"><div><span className="eyebrow">✨ МАСТЕРСКАЯ ВОЛШЕБНЫХ ИСТОРИЙ</span><h1>Создай свою настоящую сказочную книгу!</h1><p>С обложкой, красивыми иллюстрациями и отдельными страницами. Листай, читай, сохраняй и печатай.</p></div><span className="hero-emoji" aria-hidden="true">📖🦊✨</span></section>

    <section className="settings"><div className="section-head"><span>🪄</span><div><h2>Придумай сказку</h2><p>Выбери тему и оформление будущей книжки.</p></div></div>
      <div className="form-grid">
        <label className="wide">Тема или название сказки<input value={topic} onChange={e => setTopic(e.target.value)} maxLength={180} placeholder="Например: Приключения маленького зайчика" /></label>
        <label>Возраст детей<select value={age} onChange={e => setAge(e.target.value)}><option>3 года</option><option>4 года</option><option>5 лет</option><option>6 лет</option><option>7 лет</option></select></label>
        <label>Язык книги<select value={language} onChange={e => setLanguage(e.target.value as Language)}><option value="ru">Русский</option><option value="kz">Қазақша</option><option value="both">Русский + қазақша</option></select></label>
        <label>Количество страниц<select value={pageCount} onChange={e => setPageCount(Number(e.target.value))}><option value={4}>4 страницы + обложка</option><option value={6}>6 страниц + обложка</option></select></label>
        <label>Стиль рисунков<select value={style} onChange={e => setStyle(e.target.value)}><option value="watercolor">🎨 Нежная акварель</option><option value="storybook">🧸 Объёмные сказочные герои</option><option value="gouache">🌷 Красочная гуашь</option></select></label>
      </div>
      <div className="create-row"><button className="primary" onClick={() => void generateBook()} disabled={busyText || busyImages || !topic.trim()}>{busyText ? "✍️ Пишем сказку..." : busyImages ? "🎨 Рисуем страницы..." : "✨ Создать книжку"}</button><small>Расход генераций: 1 за сказку и по 1 за каждую иллюстрацию (включая обложку). Для книги на 4 страницы — всего 6.</small></div>
    </section>

    {(busyText || busyImages) && <div className="progress"><span>🦋</span><div><b>{busyText ? "Сочиняем историю на русском и казахском..." : `Рисуем иллюстрации: ${progress} из ${totalSheets}`}</b><p>Каждая страница получает собственную картинку. Создание изображений может занять несколько минут.</p></div></div>}
    {error && <div className="alert" role="alert">⚠️ {error}</div>}
    {message && <div className="success" role="status">🌷 {message}</div>}

    {story && <section className="book-section"><div className="book-heading"><div><span className="eyebrow">📚 ТВОЯ ИЛЛЮСТРИРОВАННАЯ КНИГА</span><h2>{title}</h2><p>Обложка и {story.pages.length} страниц сказки</p></div><div className="book-tools"><label>Читать на языке <select value={displayLanguage} onChange={e => setDisplayLanguage(e.target.value as Language)}><option value="ru">Русский</option><option value="kz">Қазақша</option><option value="both">Оба языка</option></select></label></div></div>
      <div className="book-viewer">
        <div className="book-sheets">
          {Array.from({ length: totalSheets }, (_, i) => {
            const isCover = i === 0;
            const page = isCover ? null : story.pages[i - 1];
            const img = images[i];
            return <article key={i} className={`book-sheet ${i === current ? "active" : ""} ${isCover ? "cover" : "inner"}`}>
              <div className="illustration-area">
                {img?.url ? <img src={img.url} alt={isCover ? `Обложка: ${title}` : `Иллюстрация к странице ${i}`} /> : <div className="illustration-placeholder"><span>🎨</span><b>{busyImages ? "Рисуем иллюстрацию..." : "Иллюстрация ещё не готова"}</b></div>}
                {isCover && <div className="cover-title"><span>✦ AI KIDS ✦</span><h3>{title}</h3>{displayLanguage === "both" && <p>{story.titleKz}</p>}</div>}
              </div>
              {!isCover && page && <div className="page-story">
                {(displayLanguage === "ru" || displayLanguage === "both") && <p>{page.textRu}</p>}
                {(displayLanguage === "kz" || displayLanguage === "both") && <p className={displayLanguage === "both" ? "kz-text" : ""}>{page.textKz}</p>}
                <span className="page-number">{i}</span>
              </div>}
            </article>;
          })}
        </div>
        <div className="page-controls"><button onClick={() => setCurrent(v => Math.max(0, v - 1))} disabled={current === 0}>← Назад</button><span>{current === 0 ? "Обложка" : `Страница ${current} из ${story.pages.length}`}</span><button onClick={() => setCurrent(v => Math.min(totalSheets - 1, v + 1))} disabled={current === totalSheets - 1}>Вперёд →</button></div>
        <div className="page-dots">{Array.from({ length: totalSheets }, (_, i) => <button key={i} className={i === current ? "selected" : ""} onClick={() => setCurrent(i)} aria-label={i === 0 ? "Обложка" : `Страница ${i}`}>{i === 0 ? "📕" : i}</button>)}</div>
      </div>
      <div className="actions">
        {!allImagesReady && !busyImages && <button className="secondary" onClick={() => void drawImages(story, images)}>🎨 Дорисовать картинки</button>}
        <button className="secondary" onClick={() => window.print()} disabled={busyImages}>🖨️ Печать / PDF</button>
        <button className="primary" onClick={() => void saveBook()} disabled={!allImagesReady || busySave || Boolean(savedProjectId)}>{savedProjectId ? "✓ Сохранено" : busySave ? "Сохраняем..." : "💾 Сохранить книгу"}</button>
        {savedProjectId && <Link className="secondary" href={`/studio/storybook?project=${savedProjectId}`}>📖 Ссылка на сохранённую книгу</Link>}
      </div>
      <p className="hint">Для PDF нажмите «Печать / PDF», выберите «Сохранить как PDF» и включите «Фоновая графика» в настройках печати. Каждая страница книги печатается на отдельном листе А4.</p>
    </section>}
    <footer>✦ AI KIDS · Большие идеи для маленьких открытий</footer>
    <style jsx>{
      .storybook-world{max-width:1180px;margin:0 auto;padding:20px 28px 48px;color:#294363;font-family:Nunito,system-ui,sans-serif}.topbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:22px}.brand{font-size:23px;font-weight:1000}.brand span{color:#ef9b67}.topbar nav{display:flex;gap:22px;font-size:13px;font-weight:900;color:#647995}
      .hero{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:30px;padding:37px 43px;border-radius:29px;background:linear-gradient(120deg,#e37f9d,#a48cd9 68%,#728bd1);color:#fff;box-shadow:0 7px 0 #ede3e7}.hero h1{max-width:680px;margin:13px 0;font-size:clamp(30px,4vw,45px);line-height:1.12}.hero p{max-width:630px;margin:0;color:#fff8ff;font-size:15px;line-height:1.65}.hero-emoji{font-size:85px;white-space:nowrap;filter:drop-shadow(0 8px 4px #714c7b44)}.eyebrow{font-size:11px;font-weight:1000;letter-spacing:1px}.settings{margin:30px 0;padding:28px;background:#fff;border:2px solid #eeeaf0;border-radius:23px;box-shadow:0 5px 0 #e9e5de}.section-head{display:flex;gap:15px;align-items:center;margin-bottom:22px}.section-head>span{font-size:38px}.section-head h2{margin:0 0 4px;font-size:27px}.section-head p{margin:0;color:#8290a4;font-size:13px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.form-grid label{display:grid;gap:7px;font-size:13px;font-weight:900;color:#526b8e}.form-grid .wide{grid-column:1/-1}.form-grid input,.form-grid select,.book-tools select{width:100%;min-height:47px;padding:0 13px;border:2px solid #e4eaf3;border-radius:12px;background:#fbfcff;color:#294363;font:inherit;font-size:14px;outline:none}.form-grid input:focus,.form-grid select:focus{border-color:#8da8dc}.create-row{display:flex;align-items:center;gap:20px;margin-top:24px}.create-row small{max-width:460px;color:#8491a5;font-size:11px;line-height:1.6}.primary,.secondary{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:12px 19px;border:0;border-radius:13px;font:inherit;font-size:13px;font-weight:1000;cursor:pointer;text-decoration:none}.primary{background:#527bc0;color:#fff;box-shadow:0 4px 0 #d7dfed}.secondary{background:#f0f4fb;color:#456b9e}.primary:disabled,.secondary:disabled{opacity:.55;cursor:not-allowed}.progress,.alert,.success{display:flex;gap:13px;align-items:center;margin:17px 0;padding:16px 20px;border-radius:15px;background:#f0f4ff;color:#4b6794}.progress>span{font-size:30px}.progress p{margin:5px 0 0;font-size:12px;color:#7186a5}.alert{background:#fff0ed;color:#a95045}.success{background:#e9f7ed;color:#3e7752}
      .book-section{margin-top:35px}.book-heading{display:flex;justify-content:space-between;align-items:end;gap:15px;margin-bottom:22px}.book-heading .eyebrow{color:#df9564}.book-heading h2{margin:9px 0 4px;font-size:31px}.book-heading p{margin:0;color:#8491a5;font-size:13px}.book-tools label{display:grid;gap:6px;color:#71819a;font-size:11px;font-weight:900}.book-tools select{min-width:165px}.book-viewer{padding:25px 20px 18px;border-radius:28px;background:linear-gradient(135deg,#f6ebeb,#e9e9fc);border:1px solid #e9e3ed}.book-sheets{display:flex;justify-content:center}.book-sheet{display:none;position:relative;width:min(100%,500px);aspect-ratio:210/297;overflow:hidden;border-radius:7px;background:#fff;box-shadow:10px 12px 0 #ffffff80,0 16px 42px #53627a38}.book-sheet.active{display:flex;flex-direction:column}.illustration-area{position:relative;min-height:0;overflow:hidden;flex:0 0 64%;background:#f6e8ed}.illustration-area img{display:block;width:100%;height:100%;object-fit:cover}.cover .illustration-area{flex:1}.illustration-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;height:100%;background:linear-gradient(150deg,#f7d9e4,#e1e6fc);color:#647da6}.illustration-placeholder span{font-size:75px}.illustration-placeholder b{font-size:14px}.cover-title{position:absolute;inset:auto 0 0;padding:45px 24px 50px;background:linear-gradient(transparent,#2a3e68cf);color:#fff;text-align:center}.cover-title>span{font-size:13px;letter-spacing:2px}.cover-title h3{margin:13px 0 4px;font-size:clamp(25px,3vw,38px);line-height:1.17;text-shadow:0 2px 10px #0004}.cover-title p{font-size:16px}.page-story{position:relative;display:flex;flex:1;flex-direction:column;justify-content:center;gap:8px;padding:22px 32px 32px;background:#fffdf8}.page-story p{margin:0;color:#354761;font-size:clamp(13px,1.65vw,17px);line-height:1.58;font-weight:700}.page-story p.kz-text{padding-top:8px;border-top:1px dashed #ded8cd;color:#667ba0;font-size:clamp(12px,1.3vw,14px)}.page-number{position:absolute;bottom:10px;right:19px;color:#9b9b9b;font-size:12px}.page-controls{display:flex;align-items:center;justify-content:center;gap:25px;margin-top:25px}.page-controls button{min-width:110px;padding:10px 13px;border:0;border-radius:12px;background:#fff;color:#426ba8;font-weight:1000;cursor:pointer}.page-controls button:disabled{opacity:.45;cursor:default}.page-controls span{min-width:150px;text-align:center;font-size:13px;font-weight:900}.page-dots{display:flex;justify-content:center;gap:8px;margin-top:16px}.page-dots button{min-width:32px;height:32px;border:1px solid #e2e2ee;border-radius:50%;background:#fff;color:#5877a0;font-weight:900;cursor:pointer}.page-dots button.selected{background:#527bc0;color:#fff}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.hint{color:#8491a5;font-size:12px;line-height:1.6}footer{margin-top:40px;padding-top:20px;border-top:2px dashed #eadfcb;color:#8b98a9;text-align:center;font-size:12px}
      @media(max-width:700px){.storybook-world{padding:13px 14px 30px}.topbar{flex-wrap:wrap}.topbar nav{gap:12px;font-size:11px}.hero{padding:25px 22px}.hero-emoji{display:none}.settings{padding:19px}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.create-row{flex-direction:column;align-items:stretch}.book-heading{align-items:stretch;flex-direction:column}.book-sheet{width:min(100%,430px)}.page-story{padding:12px 19px 23px}.page-story p{font-size:clamp(10px,2.8vw,15px)}.page-story p.kz-text{font-size:clamp(9px,2.5vw,12px)}.page-controls{gap:7px}.page-controls button{min-width:75px}.page-controls span{min-width:105px;font-size:11px}}
      @media print{ @page{size:A4 portrait;margin:0} :global(body){background:#fff!important} .storybook-world{max-width:none;margin:0;padding:0}.topbar,.hero,.settings,.progress,.alert,.success,.book-heading,.page-controls,.page-dots,.actions,.hint,footer{display:none!important}.book-section,.book-viewer,.book-sheets{display:block!important;margin:0!important;padding:0!important;border:0!important;background:#fff!important}.book-sheet,.book-sheet:not(.active){display:flex!important;flex-direction:column!important;width:210mm!important;height:297mm!important;aspect-ratio:auto!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;break-after:page!important;page-break-after:always!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.book-sheet:last-child{break-after:auto!important;page-break-after:auto!important}.illustration-area{flex:0 0 64%!important}.cover .illustration-area{flex:1!important}.page-story{padding:12mm 16mm!important}.page-story p{font-size:14pt!important}.page-story p.kz-text{font-size:11pt!important}.cover-title h3{font-size:31pt!important}}
    `}</style>
  </main>;
}
