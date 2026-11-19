
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
  { id: "game", title: "Дидактические игры", note: "Играй и находи решения", emoji: "🧩" },
  { id: "story", title: "Авторские сказки", note: "Придумывай волшебные истории", emoji: "📚" },
  { id: "illustration", title: "Иллюстрации", note: "Плакаты, раскраски и рисунки", emoji: "🎨" },
  { id: "character", title: "Генератор персонажей", note: "Создавай сказочных героев", emoji: "🦊" },
  { id: "cards", title: "Карточки", note: "Материалы для печати", emoji: "🖍️" },
  { id: "worksheet", title: "Рабочие листы", note: "Внимание, речь и логика", emoji: "✏️" },
  { id: "lesson", title: "КСП и конспекты", note: "Планы интересных занятий", emoji: "📝" },
  { id: "author", title: "Авторские разработки", note: "Твои собственные методики", emoji: "🌟" },
];

function escapeHTML(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownToHtml(text: string) {
  const lines = escapeHTML(text).split("\n");
  let html = "";
  let inList = false;

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      continue;
    }

    const value = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    if (line.startsWith("### ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h3>${value.slice(4)}</h3>`;
    } else if (line.startsWith("## ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h2>${value.slice(3)}</h2>`;
    } else if (line.startsWith("# ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h1>${value.slice(2)}</h1>`;
    } else if (/^[-•]\s/.test(line)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${value.replace(/^[-•]\s/, "")}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p>${value}</p>`;
    }
  }

  if (inList) html += "</ul>";
  return html;
}

function documentHtml(
  content: string,
  teacherGuide: string,
  title: string,
  illustration: string | null,
  isWorksheet: boolean
) {
  const image = illustration
    ? `<div class="picture"><img src="${escapeHTML(illustration)}" alt="Иллюстрации к заданиям" /></div>`
    : "";

  const guide = teacherGuide
    ? `<section class="teacher-page">
        <h1>Ответы и рекомендации воспитателю</h1>
        ${markdownToHtml(teacherGuide)}
      </section>`
    : "";

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${escapeHTML(title)}</title>
<style>
@page { size: A4 portrait; margin: 12mm; }
* { box-sizing: border-box; }
body {
  font-family: Arial, sans-serif;
  font-size: 12px;
  line-height: 1.45;
  color: #30496b;
  margin: 0;
}
h1 { color: #315b96; font-size: 22px; text-align: center; }
h2 { color: #315b96; font-size: 16px; margin-top: 12px; }
h3 { color: #426ca6; font-size: 14px; }
p { margin: 5px 0; }
li { margin-bottom: 4px; }
.picture { text-align: center; margin: 10px auto; }
.picture img {
  width: 100%;
  max-height: 145mm;
  object-fit: contain;
}
.teacher-page {
  page-break-before: always;
  break-before: page;
}
@media print {
  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
</style>
</head>
<body>
${isWorksheet ? `<h1>${escapeHTML(title)}</h1>` : ""}
${markdownToHtml(content)}
${image}
${guide}
</body>
</html>`;
}

export default function Studio() {
  const [type, setType] = useState("game");
  const [topic, setTopic] = useState("Животные");
  const [age, setAge] = useState("4 года");
  const [language, setLanguage] = useState("both");
  const [format, setFormat] = useState("Цветной, для детей");
  const [result, setResult] = useState("");
  const [teacherGuide, setTeacherGuide] = useState("");
  const [illustration, setIllustration] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("type");

    if (selected === "story") {
      window.location.replace("/studio/storybook");
      return;
    }

    if (selected && labels[selected]) setType(selected);
  }, []);

  async function generate() {
    setBusy(true);
    setError("");
    setResult("");
    setTeacherGuide("");
    setIllustration(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, topic, age, language, format }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать материал");
      }

      setResult(data.content || "");
      setTeacherGuide(data.teacherGuide || "");
      setIllustration(data.illustration || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Произошла ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: labels[type] + ": " + topic,
          kind: type,
          topic,
          content: result,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Не удалось сохранить");
        return;
      }

      setError("Материал сохранён в личном кабинете!");
    } catch {
      setError("Ошибка сохранения материала.");
    }
  }

  function getDocument() {
    return documentHtml(
      result,
      teacherGuide,
      labels[type] + ": " + topic,
      illustration,
      type === "worksheet"
    );
  }

  function downloadWord() {
    const blob = new Blob(["\ufeff", getDocument()], {
      type: "application/msword;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "AI-KIDS-" + type + ".doc";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPDF() {
    const win = window.open("", "_blank");

    if (!win) {
      setError("Разреши всплывающие окна для печати в PDF.");
      return;
    }

    win.document.open();
    win.document.write(getDocument());
    win.document.close();

    win.onload = () => {
      win.focus();
      win.print();
    };
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(
        result + (teacherGuide ? "\n\nОтветы воспитателю:\n" + teacherGuide : "")
      );
      setError("Текст скопирован!");
    } catch {
      setError("Не удалось скопировать текст.");
    }
  }

  function openTool(toolId: string) {
    if (toolId === "story") {
      window.location.assign("/studio/storybook");
      return;
    }
    if (toolId === "illustration") {
      window.location.assign("/studio/illustration");
      return;
    }
    if (toolId === "character") {
      window.location.assign("/studio/character");
      return;
    }

    setType(toolId);
    setResult("");
    setTeacherGuide("");
    setIllustration(null);
    setError("");
  }

  return (
    <main className="studio">
      <header className="topbar">
        <Link className="brand" href="/">✦ AI KIDS 🌈</Link>
        <nav>
          <Link href="/">Главная</Link>
          <Link href="/dashboard">Мой кабинет</Link>
          <Link href="/studio/kit">Умный комплект</Link>
          <Link href="/studio/visuals">Наглядность</Link>
          <Link href="/studio/character">Персонажи</Link>
        </nav>
        <Link className="login" href="/login">Войти</Link>
      </header>

      <section className="hero">
        <div>
          <span className="hero-label">✨ ТВОЯ ТВОРЧЕСКАЯ КОМНАТА</span>
          <h1>Добро пожаловать в мастерскую!</h1>
          <p>
            Выбирай волшебный инструмент, придумывай тему и создавай
            материалы для маленьких исследователей.
          </p>
          <div className="tags">
            <span>🧸 Для детей 3–6 лет</span>
            <span>🌷 Қазақша + Русский</span>
          </div>
        </div>
        <div className="hero-art">🌈 🦊 🐻 📖 ☀️</div>
      </section>

      <section className="section">
        <span className="eyebrow">ВЫБИРАЙ И ТВОРИ</span>
        <h2>Что будем создавать?</h2>
        <div className="tools">
          {tools.map((tool) => (
            <button
              type="button"
              key={tool.id}
              onClick={() => openTool(tool.id)}
              className={`tool ${type === tool.id ? "active" : ""}`}
            >
              <span>{tool.emoji}</span>
              <b>{tool.title}</b>
              <small>{tool.note}</small>
              <i>{type === tool.id ? "✓ Выбрано" : "Выбрать →"}</i>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <span className="eyebrow">МАСТЕРСКАЯ AI KIDS</span>
        <h2>Создадим что-нибудь чудесное?</h2>

        <div className="builder">
          <h3>🪄 Настрой своё задание</h3>

          <div className="fields">
            <label>
              Что создаём?
              <select value={type} onChange={(e) => openTool(e.target.value)}>
                {Object.entries(labels).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </label>

            <label>
              Возраст детей
              <select value={age} onChange={(e) => setAge(e.target.value)}>
                <option>3 года</option>
                <option>4 года</option>
                <option>5 лет</option>
                <option>6 лет</option>
              </select>
            </label>

            <label className="wide">
              Тема занятия
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: Волшебный мир животных"
              />
            </label>

            <label>
              Язык материала
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="both">Русский + қазақша</option>
                <option value="ru">Русский</option>
                <option value="kz">Қазақша</option>
              </select>
            </label>

            <label>
              Оформление
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option>Цветной, для детей</option>
                <option>Чёрно-белый, для печати</option>
                <option>Пастельный</option>
              </select>
            </label>
          </div>

          <button
            className="create"
            onClick={generate}
            disabled={busy || !topic.trim()}
          >
            {busy ? "✨ Создаём материал..." : "✨ Создать материал →"}
          </button>

          {busy && <p className="notice">🦋 Помощник готовит твой материал...</p>}
          {error && <p className="notice">{error}</p>}

          {result && (
            <section className="result">
              <h3>📚 Твой готовый материал!</h3>

              <div className="child-sheet">
                <div className="sheet-label">📄 СТРАНИЦА 1 — ДЛЯ РЕБЁНКА</div>

                <div
                  className="result-content"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(result) }}
                />

                {illustration && (
                  <div className="illustration">
                    <p><b>🎨 Иллюстрации к заданиям</b></p>
                    <img src={illustration} alt="Иллюстрации к рабочему листу" />
                  </div>
                )}
              </div>

              {teacherGuide && (
                <div className="teacher-sheet">
                  <div className="sheet-label">📘 СТРАНИЦА 2 — ДЛЯ ВОСПИТАТЕЛЯ</div>
                  <h3>Ответы и подсказки</h3>
                  <div
                    className="result-content"
                    dangerouslySetInnerHTML={{
                      __html: markdownToHtml(teacherGuide),
                    }}
                  />
                </div>
              )}

              <div className="actions">
                <button onClick={downloadWord}>📄 Скачать Word</button>
                <button onClick={downloadPDF}>🖨️ Печать / PDF</button>
                <button onClick={save}>💾 Сохранить</button>
                <button onClick={copyText}>📋 Копировать</button>
              </div>
            </section>
          )}
        </div>
      </section>

      <section className="quick">
        <Link href="/studio/kit">🧺 <b>Умный комплект</b><small>Создай сразу несколько материалов</small></Link>
        <Link href="/studio/visuals">🎨 <b>Наглядная мастерская</b><small>Создавай красочные изображения</small></Link>
      </section>

      <footer>🌼 AI KIDS · Большие идеи для маленьких открытий</footer>

      <style jsx>{`
        .studio{max-width:1180px;margin:auto;padding:20px 28px 42px;color:#294363;font-family:Arial,sans-serif}
        .topbar{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;min-height:65px}
        .brand{font-size:23px;font-weight:900;color:#294363;text-decoration:none}
        nav{display:flex;gap:16px;flex-wrap:wrap}
        nav a,.login{color:#647995;text-decoration:none;font-size:13px;font-weight:800}
        .login{border:2px solid #e7edf5;padding:10px 15px;border-radius:13px}
        .hero{margin-top:18px;padding:40px;border-radius:30px;background:linear-gradient(115deg,#527bc0,#8995d3);color:white;display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:260px}
        .hero-label,.tags span{background:#ffffff30;padding:8px 12px;border-radius:20px;font-size:12px;font-weight:800}
        .hero h1{font-size:clamp(32px,4vw,48px);margin:18px 0 10px}
        .hero p{max-width:590px;line-height:1.6}
        .tags{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
        .hero-art{font-size:55px;max-width:280px;line-height:1.7}
        .section{padding:42px 0 10px}
        .eyebrow{color:#df9564;font-size:11px;font-weight:900;letter-spacing:1px}
        h2{font-size:28px;margin:8px 0 20px}
        .tools{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .tool{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:8px;min-height:155px;padding:16px;border:2px solid transparent;border-radius:20px;background:#ffebce;cursor:pointer;color:#294363;box-shadow:0 5px 0 #e9e5de}
        .tool:nth-child(2){background:#fbe1ef}.tool:nth-child(3){background:#e0ebff}.tool:nth-child(4){background:#ffe4e8}.tool:nth-child(5){background:#def3e5}.tool:nth-child(6){background:#fff2c9}.tool:nth-child(7){background:#eee6ff}.tool:nth-child(8){background:#ffe4e8}
        .tool.active{border-color:#527bc0}
        .tool span{font-size:38px}.tool b{font-size:14px}.tool small{color:#71819a}.tool i{margin-top:auto;color:#5279b7;font-size:11px;font-style:normal;font-weight:900}
        .builder{background:white;border:2px solid #eeeaf0;border-radius:25px;padding:25px;box-shadow:0 6px 0 #e9e5de}
        .builder h3{font-size:20px;margin:0 0 20px}
        .fields{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .fields label{display:flex;flex-direction:column;gap:7px;font-weight:800;font-size:13px;color:#526b8c}
        .fields input,.fields select{width:100%;min-height:48px;padding:10px 13px;border:2px solid #e8edf5;border-radius:13px;background:#fffdf9;color:#30496b;font-size:14px}
        .wide{grid-column:1/-1}
        .create{width:100%;margin-top:22px;min-height:55px;border:0;border-radius:15px;background:#ffdc75;color:#35527b;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 5px 0 #e8bd52}
        .create:disabled{opacity:.6;cursor:wait}
        .notice{padding:13px;background:#fff5d9;border-radius:13px;color:#8a7041;font-weight:800}
        .result{margin-top:25px;padding-top:22px;border-top:2px dashed #e9dfce}
        .child-sheet,.teacher-sheet{padding:18px;margin-top:15px;border:2px solid #e8edf5;border-radius:17px;background:#fffdf9}
        .sheet-label{font-size:12px;font-weight:900;color:#5279b7;margin-bottom:12px}
        .result-content{line-height:1.8;overflow-wrap:anywhere}
        .result-content :global(h1),.result-content :global(h2){color:#315b96}
        .result-content :global(h2){border-bottom:2px solid #e7edf6;padding-bottom:8px}
        .illustration{margin:15px 0;padding:12px;background:#f5f8ff;border-radius:16px}
        .illustration img{display:block;width:100%;max-height:500px;object-fit:contain;border-radius:12px}
        .teacher-sheet{background:#f7f9ff}
        .actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:15px}
        .actions button{border:2px solid #e7edf5;border-radius:12px;padding:11px 14px;background:white;color:#426ba8;font-weight:900;cursor:pointer}
        .quick{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:28px 0}
        .quick a{display:flex;flex-direction:column;gap:8px;padding:18px;border-radius:18px;background:#e6f4e9;color:#294363;text-decoration:none}
        .quick a:nth-child(2){background:#e7edff}
        .quick small{color:#71819a}
        footer{padding:22px 0;border-top:2px dashed #eadfcb;color:#8390a4;text-align:center;font-size:12px}
        @media(max-width:850px){.tools{grid-template-columns:repeat(2,minmax(0,1fr))}.hero-art{font-size:40px}}
        @media(max-width:600px){.studio{padding:12px 15px 30px}.hero{padding:24px;min-height:300px;flex-direction:column;align-items:flex-start}.hero h1{font-size:34px}.hero-art{font-size:35px}.fields{grid-template-columns:1fr}.wide{grid-column:auto}.builder{padding:16px}.quick{grid-template-columns:1fr}nav{font-size:11px}}
      `}</style>
    </main>
  );
}
