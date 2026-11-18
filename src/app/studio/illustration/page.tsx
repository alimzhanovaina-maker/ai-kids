
"use client";

import { useState } from "react";
import Link from "next/link";

const styles = [
  ["storybook", "🧸 Сказочная иллюстрация"],
  ["watercolor", "🎨 Акварель"],
  ["cartoon", "🌈 Мультяшный стиль"],
  ["realistic", "🌿 Реалистичный рисунок"],
  ["gouache", "🌷 Гуашь"],
  ["coloring", "✏️ Чёрно-белая раскраска"],
];

const ratios = [
  ["square", "Квадратная"],
  ["portrait", "Вертикальная"],
  ["landscape", "Горизонтальная"],
];

export default function IllustrationGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [age, setAge] = useState("4 года");
  const [style, setStyle] = useState("storybook");
  const [ratio, setRatio] = useState("landscape");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  async function generate() {
    if (!prompt.trim() || busy) return;

    setBusy(true);
    setError("");
    setMessage("");
    setImage("");
    setSaved(false);

    try {
      const response = await fetch("/api/illustration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          age,
          style,
          ratio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать иллюстрацию.");
      }

      if (
        typeof data.image !== "string" ||
        !data.image.startsWith("data:image/")
      ) {
        throw new Error("Изображение не было получено. Попробуй ещё раз.");
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
          title: "Иллюстрация: " + prompt.trim().slice(0, 90),
          kind: "illustration",
          topic: prompt.trim(),
          language: "none",
          content: image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось сохранить изображение.");
      }

      setSaved(true);
      setMessage("Иллюстрация сохранена в личном кабинете!");
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
    a.download = "AI-KIDS-illustration.jpg";
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
        <title>AI KIDS — иллюстрация</title>
        <style>
          @page { size: auto; margin: 10mm; }
          body {
            margin: 0;
            display: flex;
            justify-content: center;
          }
          img {
            max-width: 100%;
            max-height: 95vh;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img src="${image}" alt="Иллюстрация AI KIDS">
      </body>
      </html>
    `);

    win.document.close();
    win.onload = () => win.print();
  }

  return (
    <main className="illustration-page">
      <header className="topbar">
        <Link className="brand" href="/">
          ✦ AI KIDS
        </Link>

        <nav>
          <Link href="/studio">Мастерская</Link>
          <Link href="/studio/visuals">Карточки и плакаты</Link>
          <Link href="/dashboard">Мой кабинет</Link>
        </nav>
      </header>

      <section className="hero">
        <span>🎨 ТВОРЧЕСКАЯ МАСТЕРСКАЯ</span>
        <h1>Генератор иллюстраций</h1>
        <p>
          Опиши картинку своими словами — AI KIDS создаст одну большую
          иллюстрацию для занятия, презентации или оформления группы.
        </p>
      </section>

      <section className="workspace">
        <div className="panel">
          <h2>✨ Что нарисуем?</h2>

          <label className="field">
            <span>Опиши будущую иллюстрацию</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={1200}
              placeholder="Например: Красивый осенний лес, в котором гуляют ёжик, белочка и зайчик. Золотые листья, мягкое солнечное освещение, добрая сказочная атмосфера..."
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
              <span>Стиль изображения</span>
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
              <span>Формат изображения</span>
              <select
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
              >
                {ratios.map(([value, label]) => (
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
            disabled={busy || !prompt.trim()}
          >
            {busy
              ? "🎨 Создаём твою иллюстрацию..."
              : "✨ Создать иллюстрацию"}
          </button>

          <p className="hint">
            Одна иллюстрация = одна генерация. Каждый новый вариант
            также расходует одну генерацию из лимита.
          </p>
        </div>

        {error && <div className="error">{error}</div>}

        {busy && (
          <div className="loading">
            <span>🖌️</span>
            <b>Художник AI KIDS уже рисует...</b>
            <p>Это может занять немного времени.</p>
          </div>
        )}

        {image && (
          <section className="result">
            <div className="result-head">
              <div>
                <span>ГОТОВО!</span>
                <h2>Твоя иллюстрация 🌟</h2>
              </div>
            </div>

            <img
              className="preview"
              src={image}
              alt={prompt}
            />

            <div className="actions">
              <button onClick={download}>
                ⬇️ Скачать изображение
              </button>

              <button onClick={print}>
                🖨️ Печать / PDF
              </button>

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

              <button
                className="new-version"
                onClick={() => void generate()}
                disabled={busy}
              >
                🔄 Создать ещё вариант
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
        .illustration-page {
          min-height: 100vh;
          padding: 0 25px 40px;
          background: linear-gradient(180deg, #fffaf1, #f5f7ff);
          color: #294363;
          font-family: Nunito, system-ui, sans-serif;
        }

        .topbar {
          max-width: 1120px;
          margin: auto;
          min-height: 75px;
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

        .panel,
        .result {
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

        .field textarea,
        .field select {
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

        .field select {
          min-height: 48px;
        }

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

        .result {
          margin-top: 22px;
        }

        .result-head span {
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 1.5px;
          color: #df9564;
        }

        .result-head h2 {
          margin: 5px 0 18px;
        }

        .preview {
          display: block;
          width: 100%;
          max-height: 850px;
          object-fit: contain;
          border-radius: 15px;
          background: #f4f6fa;
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

        .actions .new-version {
          background: #fff0d8;
          color: #a66b25;
        }

        .actions button:disabled {
          opacity: .65;
          cursor: wait;
        }

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
          .illustration-page {
            padding: 0 14px 28px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
            padding: 14px 0;
          }

          nav {
            gap: 14px;
          }

          .hero {
            margin: 25px auto 20px;
            padding: 25px 18px;
          }

          .panel,
          .result {
            padding: 18px;
          }

          .fields {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column;
          }

          .actions button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
