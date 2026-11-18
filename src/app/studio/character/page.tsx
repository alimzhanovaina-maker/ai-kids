
"use client";

import { useState } from "react";
import Link from "next/link";

const styles = [
  ["cartoon", "🌈 Мультяшный 3D"],
  ["storybook", "📚 Сказочный"],
  ["watercolor", "🎨 Акварель"],
  ["vector", "✏️ Векторный"],
  ["realistic", "🌿 Реалистичный"],
  ["plush", "🧸 Плюшевая игрушка"],
];

const poses = [
  ["standing", "Стоит"],
  ["sitting", "Сидит"],
  ["waving", "Машет рукой"],
  ["jumping", "Прыгает"],
  ["walking", "Идёт"],
];

export default function CharacterPage() {
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("4 года");
  const [style, setStyle] = useState("cartoon");
  const [pose, setPose] = useState("standing");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  async function generate() {
    if (!description.trim() || busy) return;

    setBusy(true);
    setError("");
    setMessage("");
    setImage("");
    setSaved(false);

    try {
      const response = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, age, style, pose }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать персонажа.");
      }

      if (
        typeof data.image !== "string" ||
        !data.image.startsWith("data:image/")
      ) {
        throw new Error("Изображение не было получено.");
      }

      setImage(data.image);
      setRemaining(
        typeof data.remaining === "number" ? data.remaining : null
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Ошибка генерации."
      );
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!image || saving || saved) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Персонаж: " + description.trim().slice(0, 80),
          kind: "character",
          topic: description.trim(),
          language: "none",
          content: image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось сохранить персонажа.");
      }

      setSaved(true);
      setMessage("Персонаж сохранён в личном кабинете!");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Ошибка сохранения."
      );
    } finally {
      setSaving(false);
    }
  }

  function download() {
    if (!image) return;

    const a = document.createElement("a");
    a.href = image;
    a.download = "AI-KIDS-character.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function print() {
    if (!image) return;

    const win = window.open("", "_blank");

    if (!win) {
      setError("Разреши всплывающие окна в браузере для печати.");
      return;
    }

    win.document.open();
    win.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>AI KIDS — персонаж</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body {
            margin: 0;
            min-height: 95vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          img {
            max-width: 100%;
            max-height: 95vh;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img src="${image}" alt="Персонаж AI KIDS">
      </body>
      </html>
    `);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  }

  return (
    <main className="character-page">
      <header className="topbar">
        <Link href="/" className="brand">✦ AI KIDS</Link>
        <nav>
          <Link href="/studio">Мастерская</Link>
          <Link href="/studio/illustration">Иллюстрации</Link>
          <Link href="/dashboard">Мой кабинет</Link>
        </nav>
      </header>

      <section className="hero">
        <span>🧸 ТВОРЧЕСКАЯ МАСТЕРСКАЯ</span>
        <h1>Генератор персонажей</h1>
        <p>
          Создавай милых животных, сказочных героев и персонажей
          для карточек, игр, занятий и презентаций.
        </p>
      </section>

      <section className="workspace">
        <div className="panel">
          <h2>✨ Кого создадим?</h2>

          <label className="field">
            <span>Опиши персонажа</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              placeholder="Например: милый рыжий лисёнок с большими добрыми глазами, пушистым хвостом и маленьким зелёным шарфиком..."
            />
          </label>

          <div className="fields">
            <label className="field">
              <span>Возраст детей</span>
              <select
                value={age}
                onChange={(e) => setAge(e.target.value)}
              >
                <option>3 года</option>
                <option>4 года</option>
                <option>5 лет</option>
                <option>6 лет</option>
                <option>7 лет</option>
              </select>
            </label>

            <label className="field">
              <span>Стиль персонажа</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                {styles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Поза персонажа</span>
              <select
                value={pose}
                onChange={(e) => setPose(e.target.value)}
              >
                {poses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            className="generate"
            onClick={() => void generate()}
            disabled={busy || !description.trim()}
          >
            {busy
              ? "🎨 Создаём персонажа..."
              : "✨ Создать персонажа"}
          </button>

          <p className="hint">
            Персонаж создаётся отдельно от фона в формате PNG.
            Подходит для карточек, наклеек и учебных материалов.
          </p>
        </div>

        {error && <div className="error">{error}</div>}

        {busy && (
          <div className="loading">
            <span>🖌️</span>
            <b>Художник AI KIDS уже рисует...</b>
            <p>Подожди немного, скоро появится твой персонаж.</p>
          </div>
        )}

        {image && (
          <section className="result">
            <span className="ready">ГОТОВО!</span>
            <h2>Твой персонаж 🌟</h2>

            <div className="preview-area">
              <img src={image} alt={description} />
            </div>

            <div className="actions">
              <button onClick={download}>⬇️ Скачать PNG</button>
              <button onClick={print}>🖨️ Печать / PDF</button>
              <button
                className="save"
                onClick={() => void save()}
                disabled={saving || saved}
              >
                {saving
                  ? "Сохраняем..."
                  : saved
                  ? "✓ Сохранено"
                  : "📚 Сохранить в кабинет"}
              </button>
            </div>

            {message && (
              <p className={saved ? "success" : "error"}>
                {message}
              </p>
            )}

            {remaining !== null && (
              <p className="remaining">
                Осталось генераций: <b>{remaining}</b>
              </p>
            )}
          </section>
        )}
      </section>

      <footer>
        ✦ AI KIDS · Большие идеи для маленьких открытий
      </footer>

      <style jsx>{`
        .character-page {
          min-height: 100vh;
          padding: 0 25px 40px;
          background: linear-gradient(180deg, #fffaf1, #f5f7ff);
          color: #294363;
          font-family: Nunito, system-ui, sans-serif;
        }
        .topbar {
          max-width: 1120px;
          min-height: 75px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          border-bottom: 1px solid #eee7da;
        }
        .brand {
          font-size: 23px;
          font-weight: 1000;
          color: #294363;
          text-decoration: none;
        }
        nav {
          display: flex;
          gap: 22px;
          flex-wrap: wrap;
        }
        nav a {
          color: #667b99;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
        }
        .hero {
          max-width: 850px;
          margin: 40px auto 28px;
          padding: 35px;
          border-radius: 26px;
          background: linear-gradient(115deg, #527bc0, #9b91d7);
          color: white;
          text-align: center;
        }
        .hero > span {
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 1.5px;
        }
        .hero h1 {
          margin: 12px 0;
          font-size: clamp(30px, 4vw, 42px);
        }
        .hero p {
          max-width: 650px;
          margin: auto;
          color: #f3f4ff;
          font-size: 14px;
          line-height: 1.7;
        }
        .workspace {
          max-width: 950px;
          margin: auto;
        }
        .panel, .result {
          padding: 28px;
          border: 1px solid #e8eaf0;
          border-radius: 23px;
          background: white;
          box-shadow: 0 10px 30px #344d7410;
        }
        h2 {
          margin: 0 0 20px;
          color: #315b96;
          font-size: 24px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #47648c;
          font-size: 13px;
          font-weight: 900;
        }
        .field textarea, .field select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dce4f0;
          border-radius: 12px;
          background: #fbfcff;
          color: #294363;
          font: 14px Nunito, system-ui, sans-serif;
          padding: 13px;
        }
        .field textarea {
          min-height: 145px;
          resize: vertical;
          line-height: 1.6;
        }
        .field select { min-height: 48px; }
        .fields {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }
        .generate {
          width: 100%;
          min-height: 54px;
          margin-top: 22px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(100deg, #527bc0, #8b91d0);
          color: white;
          font-size: 15px;
          font-weight: 1000;
          cursor: pointer;
        }
        .generate:disabled {
          opacity: .55;
          cursor: wait;
        }
        .hint {
          margin: 12px 0 0;
          color: #8996a9;
          font-size: 11px;
          line-height: 1.6;
        }
        .error {
          margin-top: 18px;
          padding: 13px;
          border-radius: 12px;
          background: #fff0f0;
          color: #a34545;
          font-size: 13px;
        }
        .loading {
          margin-top: 20px;
          padding: 28px;
          text-align: center;
          border: 1px solid #e4eaf5;
          border-radius: 18px;
          background: white;
        }
        .loading span {
          display: block;
          font-size: 40px;
        }
        .loading b {
          display: block;
          margin-top: 8px;
          color: #315b96;
        }
        .loading p {
          color: #8190a4;
          font-size: 12px;
        }
        .result { margin-top: 22px; }
        .ready {
          color: #df9564;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 1.5px;
        }
        .result h2 { margin: 5px 0 18px; }
        .preview-area {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 360px;
          padding: 20px;
          border-radius: 15px;
          background-color: #f5f7fb;
          background-image:
            linear-gradient(45deg, #e6eaf1 25%, transparent 25%),
            linear-gradient(-45deg, #e6eaf1 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #e6eaf1 75%),
            linear-gradient(-45deg, transparent 75%, #e6eaf1 75%);
          background-size: 24px 24px;
          background-position: 0 0, 0 12px, 12px -12px, -12px 0;
        }
        .preview-area img {
          display: block;
          width: 100%;
          max-width: 600px;
          max-height: 650px;
          object-fit: contain;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }
        .actions button {
          min-height: 46px;
          padding: 0 17px;
          border: 0;
          border-radius: 12px;
          background: #e8eefb;
          color: #42649b;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }
        .actions .save {
          background: #e1f3e7;
          color: #347653;
        }
        .actions button:disabled { opacity: .65; }
        .success {
          padding: 11px;
          border-radius: 10px;
          background: #edf9f0;
          color: #347653;
          font-size: 12px;
        }
        .remaining {
          color: #77879e;
          font-size: 12px;
        }
        footer {
          max-width: 950px;
          margin: 30px auto 0;
          padding-top: 18px;
          border-top: 1px dashed #e5dfd4;
          color: #8793a5;
          text-align: center;
          font-size: 11px;
        }
        @media(max-width:700px) {
          .character-page { padding: 0 14px 28px; }
          .topbar {
            align-items: flex-start;
            flex-direction: column;
            padding: 14px 0;
          }
          nav { gap: 14px; }
          .hero {
            margin: 25px auto 20px;
            padding: 25px 18px;
          }
          .panel, .result { padding: 18px; }
          .fields { grid-template-columns: 1fr; }
          .actions { flex-direction: column; }
          .actions button { width: 100%; }
        }
      `}</style>
    </main>
  );
}
