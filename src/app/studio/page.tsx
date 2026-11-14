
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

    if (/^---+$/.test(line)) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += "<hr>";
      continue;
    }

    if (!line) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      continue;
    }

    const content = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    if (line.startsWith("### ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h3>${content.slice(4)}</h3>`;
    } else if (line.startsWith("## ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h2>${content.slice(3)}</h2>`;
    } else if (line.startsWith("# ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h1>${content.slice(2)}</h1>`;
    } else if (/^[-•]\s/.test(line)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${content.replace(/^[-•]\s/, "")}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p>${content}</p>`;
    }
  }

  if (inList) html += "</ul>";

  return html;
}

function createDocument(content: string, title: string) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${escapeHTML(title)}</title>
<style>
body {
  font-family: Arial, sans-serif;
  color: #243b5b;
  line-height: 1.7;
  max-width: 850px;
  margin: 40px auto;
  padding: 30px;
}
h1 { color: #315b96; font-size: 26px; }
h2 {
  color: #315b96;
  border-bottom: 2px solid #e3eafa;
  padding-bottom: 8px;
  margin-top: 28px;
}
h3 { color: #426ca6; }
li { margin-bottom: 7px; }
hr { border: 0; border-top: 1px solid #ddd; margin: 20px 0; }
p { margin: 10px 0; }
</style>
</head>
<body>
${markdownToHtml(content)}
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    if (t && labels[t]) setType(t);
  }, []);

  async function generate() {
    setBusy(true);
    setError("");
    setResult("");

    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          topic,
          age,
          language,
          format,
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.error || "Не удалось создать материал");
      }

      setResult(data.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    try {
      const r = await fetch("/api/projects", {
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

      const d = await r.json();

      if (!r.ok) {
        setError(d.error || "Не удалось сохранить");
        return;
      }

      setError("Материал успешно сохранён в личном кабинете!");
    } catch {
      setError("Ошибка сохранения материала.");
    }
  }

  function downloadWord() {
    const html = createDocument(
      result,
      labels[type] + ": " + topic
    );

    const blob = new Blob(
      ["\ufeff", html],
      { type: "application/msword;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "AI-KIDS-" + type + ".doc";
    a.click();

    URL.revokeObjectURL(url);
  }

  function downloadPDF() {
    const html = createDocument(
      result,
      labels[type] + ": " + topic
    );

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError("Разреши всплывающие окна для скачивания PDF.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(result);
      setError("Текст скопирован!");
    } catch {
      setError("Не удалось скопировать текст.");
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">✦</span> AI KIDS
        </Link>

        <nav className="nav">
          <Link href="/">Главная</Link>
          <Link href="/dashboard">Мой кабинет</Link>
        </nav>

        <Link className="btn secondary" href="/login">
          Войти
        </Link>
      </header>

      <h1 className="section-title">
        ✨ Творческая мастерская
      </h1>

      <p className="muted">
        Выбери инструмент, тему и язык — AI KIDS подготовит
        основу материала.
      </p>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="form-grid">
          <div className="field">
            <label>Что создаём?</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {Object.entries(labels).map(([k, v]) => (
                <option value={k} key={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Возраст</label>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
            >
              <option>3 года</option>
              <option>4 года</option>
              <option>5 лет</option>
              <option>6 лет</option>
            </select>
          </div>

          <div className="field">
            <label>Тема</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Например, времена года"
            />
          </div>

          <div className="field">
            <label>Язык</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="both">Русский + қазақша</option>
              <option value="ru">Русский</option>
              <option value="kz">Қазақша</option>
            </select>
          </div>

          <div className="field">
            <label>Оформление</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option>Цветной, для детей</option>
              <option>Чёрно-белый, для печати</option>
              <option>Пастельный</option>
            </select>
          </div>
        </div>

        <button
          className="btn"
          style={{ marginTop: 18 }}
          disabled={busy || !topic.trim()}
          onClick={generate}
        >
          {busy ? "Создаём..." : "✨ Создать материал"}
        </button>

        {error && (
          <p className="muted" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}

        {result && (
          <section style={{ marginTop: 25 }}>
            <h2 className="section-title">
              📚 Готовый материал
            </h2>

            <div
              className="result ai-result"
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(result),
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 18,
              }}
            >
              <button className="btn" onClick={downloadWord}>
                📄 Скачать Word
              </button>

              <button className="btn" onClick={downloadPDF}>
                📕 Скачать PDF
              </button>

              <button className="btn secondary" onClick={save}>
                💾 Сохранить
              </button>

              <button className="btn secondary" onClick={copyText}>
                📋 Копировать
              </button>
            </div>
          </section>
        )}
      </div>

      <footer className="footer">
        AI KIDS · Твори с заботой о детях
      </footer>

      <style jsx>{`
        .ai-result {
          background: white;
          border: 1px solid #e2eaf5;
          border-radius: 16px;
          padding: 25px;
          line-height: 1.8;
          color: #30496b;
          overflow-wrap: anywhere;
        }

        .ai-result :global(h1) {
          color: #315b96;
          font-size: 24px;
          margin: 10px 0 20px;
        }

        .ai-result :global(h2) {
          color: #315b96;
          font-size: 19px;
          margin: 25px 0 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5edf8;
        }

        .ai-result :global(h3) {
          color: #426ca6;
          font-size: 16px;
          margin: 18px 0 8px;
        }

        .ai-result :global(li) {
          margin-bottom: 7px;
        }

        .ai-result :global(p) {
          margin: 9px 0;
        }

        .ai-result :global(hr) {
          border: 0;
          border-top: 1px solid #e5edf8;
          margin: 18px 0;
        }
      `}</style>
    </main>
  );
}
