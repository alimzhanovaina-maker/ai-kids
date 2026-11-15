"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const labels: Record<string, string> = {
  game: "Дидактическая игра",
  story: "Авторская сказка",
  illustration: "Задание для иллюстрации",
  cards: "Карточки для печати",
  worksheet: "Рабочий лист",
  lesson: "КСП / конспект занятия",
  author: "Авторская методическая разработка",
};

const tools = [
  { id: "game", title: "Дидактические игры", note: "Играй и находи решения", emoji: "🧩", color: "peach" },
  { id: "story", title: "Авторские сказки", note: "Придумывай волшебные истории", emoji: "📚", color: "pink" },
  { id: "illustration", title: "Иллюстрации", note: "Плакаты, раскраски и рисунки", emoji: "🎨", color: "blue" },
  { id: "cards", title: "Карточки", note: "Материалы для печати", emoji: "🖍️", color: "mint" },
  { id: "worksheet", title: "Рабочие листы", note: "Внимание, речь и логика", emoji: "✏️", color: "yellow" },
  { id: "lesson", title: "КСП и конспекты", note: "Планы интересных занятий", emoji: "📝", color: "lavender" },
  { id: "author", title: "Авторские разработки", note: "Твои собственные методики", emoji: "🌟", color: "rose" },
];

function escapeHTML(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function markdownToHtml(text: string) {
  const lines = escapeHTML(text).split("\n");
  let html = "";
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^---+$/.test(line)) { if (inList) { html += "</ul>"; inList = false; } html += "<hr />"; continue; }
    if (!line) { if (inList) { html += "</ul>"; inList = false; } continue; }
    const value = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    if (line.startsWith("### ")) { if (inList) { html += "</ul>"; inList = false; } html += `<h3>${value.slice(4)}</h3>`; }
    else if (line.startsWith("## ")) { if (inList) { html += "</ul>"; inList = false; } html += `<h2>${value.slice(3)}</h2>`; }
    else if (line.startsWith("# ")) { if (inList) { html += "</ul>"; inList = false; } html += `<h1>${value.slice(2)}</h1>`; }
    else if (/^[-•]\s/.test(line)) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${value.replace(/^[-•]\s/, "")}</li>`; }
    else { if (inList) { html += "</ul>"; inList = false; } html += `<p>${value}</p>`; }
  }
  if (inList) html += "</ul>";
  return html;
}

function documentHtml(content: string, title: string) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHTML(title)}</title><style>
  @page{size:A4;margin:18mm}body{font:16px/1.7 Arial,sans-serif;color:#30496b;max-width:850px;margin:30px auto;padding:24px}
  h1,h2{color:#315b96}h2{border-bottom:2px solid #e3eafa;padding-bottom:8px;margin-top:26px}li{margin-bottom:7px}
  </style></head><body>${markdownToHtml(content)}</body></html>`;
}

export default function Studio() {
  const [type, setType] = useState("game");
  const [topic, setTopic] = useState("Животные");
  const [age, setAge] = useState("4 года");
  const [language, setLanguage] = useState("both");
  const [format, setFormat] = useState("Цветной, для детей");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("type");
    if (selected && labels[selected]) setType(selected);
  }, []);

  async function generate() {
    setBusy(true); setError(""); setResult("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, topic, age, language, format }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось создать материал");
      setResult(data.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Произошла ошибка");
    } finally { setBusy(false); }
  }

  async function save() {
    try {
      const response = await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: labels[type] + ": " + topic, kind: type, topic, content: result, language }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Не удалось сохранить"); return; }
      setError("Материал сохранён в личном кабинете!");
    } catch { setError("Ошибка сохранения материала."); }
  }

  function downloadWord() {
    const blob = new Blob(["\ufeff", documentHtml(result, labels[type] + ": " + topic)], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "AI-KIDS-" + type + ".doc"; a.click(); URL.revokeObjectURL(url);
  }

  function downloadPDF() {
    const win = window.open("", "_blank");
    if (!win) { setError("Разреши всплывающие окна для печати в PDF."); return; }
    win.document.open(); win.document.write(documentHtml(result, labels[type] + ": " + topic)); win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  }

  async function copyText() {
    try { await navigator.clipboard.writeText(result); setError("Текст скопирован!"); }
    catch { setError("Не удалось скопировать текст."); }
  }

  return (
    <main className="studio-world">
      <header className="studio-topbar">
        <Link className="studio-brand" href="/"><span className="brand-mark">✦</span> AI KIDS <span>🌈</span></Link>
        <nav><Link href="/">Главная</Link><Link href="/dashboard">Мой кабинет</Link><Link href="/studio/kit">Умный комплект</Link><Link href="/studio/visuals">Наглядность</Link></nav>
        <Link className="login-link" href="/login">Войти</Link>
      </header>

      <section className="studio-hero">
        <div className="hero-copy">
          <span className="hero-label">✨ ТВОЯ ТВОРЧЕСКАЯ КОМНАТА</span>
          <h1>Добро пожаловать в мастерскую!</h1>
          <p>Выбирай волшебный инструмент, придумывай тему — и создавай материалы для маленьких исследователей.</p>
          <div className="hero-tags"><span>🧸 Для детей 3–6 лет</span><span>🌷 Қазақша + Русский</span></div>
        </div>
        <div className="hero-pictures" aria-hidden="true"><span className="rainbow">🌈</span><span className="fox">🦊</span><span className="bear">🐻</span><span className="book">📖</span><span className="sun">☀️</span><span className="cloud">☁️</span></div>
      </section>

      <section className="tools-section">
        <div className="section-heading"><div><span className="eyebrow">ВЫБИРАЙ И ТВОРИ</span><h2>Что будем создавать?</h2><p>Каждый инструмент — маленькое творческое приключение.</p></div><span className="heading-mascot">🐰</span></div>
        <div className="tools-grid">
          {tools.map((tool) => <button type="button" key={tool.id} onClick={() => setType(tool.id)} className={`tool-card ${tool.color} ${type === tool.id ? "active" : ""}`}>
            <span className="tool-art">{tool.emoji}</span><b>{tool.title}</b><small>{tool.note}</small><i>{type === tool.id ? "✓ Выбрано" : "Выбрать →"}</i>
          </button>)}
        </div>
      </section>

      <section className="builder-section">
        <div className="section-heading"><div><span className="eyebrow">МАСТЕРСКАЯ AI KIDS</span><h2>Создадим что-нибудь чудесное?</h2><p>Заполни несколько полей — AI KIDS подготовит основу материала.</p></div><span className="heading-mascot">🧚</span></div>
        <div className="builder-card">
          <div className="builder-title"><span>🪄</span><div><b>Настрой своё задание</b><small>Все параметры можно изменить перед генерацией.</small></div></div>
          <div className="form-grid">
            <div className="field"><label>Что создаём?</label><select value={type} onChange={(e) => setType(e.target.value)}>{Object.entries(labels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div>
            <div className="field"><label>Возраст детей</label><select value={age} onChange={(e) => setAge(e.target.value)}><option>3 года</option><option>4 года</option><option>5 лет</option><option>6 лет</option></select></div>
            <div className="field field-wide"><label>Тема занятия</label><input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Например: Волшебный мир животных" /></div>
            <div className="field"><label>Язык материала</label><select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="both">Русский + қазақша</option><option value="ru">Русский</option><option value="kz">Қазақша</option></select></div>
            <div className="field"><label>Оформление</label><select value={format} onChange={(e) => setFormat(e.target.value)}><option>Цветной, для детей</option><option>Чёрно-белый, для печати</option><option>Пастельный</option></select></div>
          </div>
          <button className="create-button" onClick={generate} disabled={busy || !topic.trim()}>{busy ? "✨ Создаём волшебство..." : "✨ Создать материал　→"}</button>
          {busy && <div className="notice">🦋 Помощник готовит твой материал. Это может занять немного времени...</div>}
          {error && <div className="notice">{error}</div>}
          {result && <section className="result-section"><div className="builder-title"><span>📚</span><div><b>Твой готовый материал!</b><small>Проверь результат, сохрани или скачай его.</small></div></div>
            <div className="result-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(result) }} />
            <div className="result-actions"><button onClick={downloadWord}>📄 Скачать Word</button><button onClick={downloadPDF}>🖨️ Печать / PDF</button><button onClick={save}>💾 Сохранить</button><button onClick={copyText}>📋 Копировать</button></div>
          </section>}
        </div>
      </section>

      <section className="quick-links">
        <Link href="/studio/kit"><span>🧺</span><b>Умный комплект</b><small>Создай сразу несколько материалов</small><i>Открыть →</i></Link>
        <Link href="/studio/visuals"><span>🎨</span><b>Наглядная мастерская</b><small>Создавай красочные изображения</small><i>Открыть →</i></Link>
      </section>
      <footer className="studio-footer"><span>🌼 AI KIDS · Большие идеи для маленьких открытий</span><Link href="/">Вернуться на главную</Link></footer>

      <style jsx>{`
        .studio-world{max-width:1180px;margin:0 auto;padding:20px 28px 42px;color:#294363;font-family:Nunito,system-ui,sans-serif}
        .studio-topbar{min-height:65px;display:flex;align-items:center;justify-content:space-between;gap:18px}
        .studio-brand{display:flex;align-items:center;gap:9px;font-size:23px;font-weight:1000}.brand-mark{width:40px;height:40px;display:grid;place-items:center;background:#ffdc75;border-radius:14px;box-shadow:0 4px 0 #ebc25a}
        .studio-topbar nav{display:flex;gap:20px;color:#647995;font-size:13px;font-weight:900}.login-link{background:#fff;border:2px solid #e7edf5;border-radius:13px;padding:10px 16px;color:#426ba8;font-weight:1000}
        .studio-hero{position:relative;overflow:hidden;margin-top:18px;padding:40px 45px;min-height:270px;border-radius:31px;background:linear-gradient(115deg,#527bc0,#8995d3);color:#fff;box-shadow:0 9px 0 #e9e4dc}
        .studio-hero:after{content:"";position:absolute;width:350px;height:350px;border-radius:50%;background:#ffffff13;right:70px;top:-190px}
        .hero-copy{position:relative;z-index:2;max-width:660px}.hero-label{display:inline-block;padding:8px 13px;background:#ffffff2c;border-radius:30px;font-size:11px;font-weight:1000;letter-spacing:.7px}
        .studio-hero h1{font-size:clamp(35px,4.4vw,52px);line-height:1.08;margin:16px 0 10px;font-weight:1000;letter-spacing:-1.4px}.studio-hero p{font-size:16px;line-height:1.6;max-width:590px;color:#f0f4ff;font-weight:700}
        .hero-tags{display:flex;gap:10px;flex-wrap:wrap;margin-top:19px}.hero-tags span{padding:8px 12px;background:#ffffff24;border-radius:20px;font-size:12px;font-weight:900}
        .hero-pictures span{position:absolute;z-index:1;filter:drop-shadow(0 8px 5px #304b762b)}.rainbow{right:90px;top:22px;font-size:100px;transform:rotate(9deg)}.fox{right:35px;bottom:20px;font-size:86px}.bear{right:260px;bottom:20px;font-size:73px}.book{right:155px;top:115px;font-size:75px}.sun{right:300px;top:30px;font-size:43px}.cloud{right:25px;top:25px;font-size:45px}
        .tools-section,.builder-section{padding:45px 0 12px}.section-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:20px}.eyebrow{color:#df9564;font-size:11px;font-weight:1000;letter-spacing:1.3px}
        .section-heading h2{font-size:29px;margin:5px 0;color:#294363;font-weight:1000}.section-heading p{margin:0;color:#77879e;font-size:14px}.heading-mascot{font-size:53px}
        .tools-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.tool-card{min-height:172px;text-align:left;border:2px solid transparent;border-radius:22px;padding:16px;display:flex;flex-direction:column;align-items:flex-start;cursor:pointer;box-shadow:0 5px 0 #e9e5de;transition:transform .18s,box-shadow .18s}
        .tool-card:hover{transform:translateY(-4px) rotate(-.4deg);box-shadow:0 9px 0 #e9e5de}.tool-card.active{border-color:#527bc0;box-shadow:0 5px 0 #527bc055}
        .peach{background:#ffebce}.pink{background:#fbe1ef}.blue{background:#e0ebff}.mint{background:#def3e5}.yellow{background:#fff2c9}.lavender{background:#eee6ff}.rose{background:#ffe4e8}
        .tool-art{font-size:43px;line-height:1.2;margin-bottom:9px;filter:drop-shadow(0 4px 2px #34445a18)}.tool-card b{font-size:14px;font-weight:1000;color:#294363}.tool-card small{font-size:11px;color:#71819a;margin-top:4px;line-height:1.4}.tool-card i{font-size:11px;font-style:normal;font-weight:1000;color:#5479b6;margin-top:auto;padding-top:10px}
        .builder-card{background:#fff;border:2px solid #eeeaf0;border-radius:27px;padding:27px;box-shadow:0 7px 0 #e9e5de}.builder-title{display:flex;align-items:center;gap:13px;margin-bottom:22px}.builder-title>span{font-size:35px}.builder-title b{display:block;font-size:20px;font-weight:1000}.builder-title small{display:block;margin-top:3px;color:#8290a4;font-size:12px}
        .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.field{display:flex;flex-direction:column;gap:7px}.field-wide{grid-column:1/-1}.field label{font-size:13px;font-weight:1000;color:#526b8c}
        .field input,.field select{width:100%;min-height:49px;padding:0 14px;border:2px solid #e8edf5;border-radius:14px;background:#fffdf9;color:#30496b;outline:none;font-size:14px}.field input:focus,.field select:focus{border-color:#89a6d8;box-shadow:0 0 0 3px #89a6d822}
        .create-button{margin-top:22px;width:100%;min-height:56px;border:0;border-radius:16px;background:#ffdc75;color:#35527b;font-size:16px;font-weight:1000;box-shadow:0 5px 0 #e8bd52;cursor:pointer}.create-button:disabled{opacity:.65;cursor:wait}
        .notice{margin-top:15px;padding:13px 16px;border-radius:14px;background:#fff5d9;color:#8a7041;font-weight:800;font-size:13px}
        .result-section{margin-top:28px;padding-top:24px;border-top:2px dashed #e9dfce}.result-content{background:#fffdf9;border:2px solid #f0e8dc;border-radius:18px;padding:23px;line-height:1.8;color:#30496b;overflow-wrap:anywhere}.result-content :global(h1),.result-content :global(h2){color:#315b96}.result-content :global(h2){border-bottom:2px solid #e7edf6;padding-bottom:8px;margin-top:24px}.result-content :global(h3){color:#426ca6}.result-content :global(li){margin-bottom:7px}
        .result-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:15px}.result-actions button{border:2px solid #e7edf5;border-radius:13px;padding:11px 14px;background:#fff;color:#426ba8;font-weight:900;cursor:pointer}.result-actions button:hover{background:#fff5d9}
        .quick-links{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:28px 0}.quick-links a{display:grid;grid-template-columns:52px 1fr;column-gap:12px;align-items:center;padding:17px;background:#e6f4e9;border:2px solid #d8eadc;border-radius:20px}.quick-links a:nth-child(2){background:#e7edff;border-color:#d9e2fb}.quick-links a>span{grid-row:span 3;font-size:39px}.quick-links b{font-size:14px}.quick-links small{color:#71819a;font-size:11px}.quick-links i{font-size:11px;font-style:normal;font-weight:1000;color:#5279b7;margin-top:5px}
        .studio-footer{display:flex;justify-content:space-between;gap:15px;padding:22px 0;border-top:2px dashed #eadfcb;color:#8390a4;font-size:12px;font-weight:800}.studio-footer a{color:#5279b7}
        @media(max-width:850px){.tools-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero-pictures .bear{right:190px}.hero-pictures .rainbow{right:25px;opacity:.8}.hero-pictures .fox{right:15px;opacity:.8}.studio-hero{padding:34px}.hero-copy{max-width:76%}}
        @media(max-width:600px){.studio-world{padding:12px 15px 30px}.studio-topbar{height:auto;min-height:55px;flex-wrap:wrap}.studio-topbar nav{order:3;width:100%;overflow:auto;gap:14px;font-size:11px;padding:8px 0}.studio-hero{margin-top:14px;padding:24px 20px;min-height:330px}.studio-hero h1{font-size:35px}.studio-hero p{font-size:14px}.hero-copy{max-width:100%}.hero-pictures .rainbow{font-size:60px;right:8px;top:auto;bottom:5px;opacity:.55}.hero-pictures .fox{font-size:53px;right:15px;bottom:5px;opacity:.55}.hero-pictures .bear{font-size:48px;right:120px;bottom:5px;opacity:.55}.hero-pictures .book{right:100px;top:auto;bottom:65px;font-size:48px}.hero-pictures .sun{right:220px;top:20px}.tools-section,.builder-section{padding-top:34px}.section-heading h2{font-size:24px}.heading-mascot{font-size:39px}.tools-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.tool-card{min-height:155px;padding:12px}.tool-card b{font-size:12px}.tool-card small{font-size:10px}.tool-art{font-size:35px}.builder-card{padding:17px}.form-grid{grid-template-columns:1fr}.field-wide{grid-column:auto}.quick-links{grid-template-columns:1fr}.studio-footer{flex-direction:column;text-align:center}}
      `}</style>
    </main>
  );
}
