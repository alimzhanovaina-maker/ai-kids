
"use client";

import { useState } from "react";
import Link from "next/link";

const kinds = [
  ["cards", "🃏 Карточки для печати"],
  ["poster", "🖼️ Обучающий плакат"],
  ["worksheet", "✏️ Рабочий лист"],
  ["game", "🎲 Дидактическая игра"],
  ["puzzle", "🧩 Пазлы"],
  ["coloring", "🎨 Раскраска"],
  ["lapbook", "📚 Лэпбук"],
  ["craft", "✂️ Шаблон поделки"],
  ["scheme", "🌈 Обучающая схема"],
];

const categories = [
  ["animals", "Животные"],
  ["fruits", "Фрукты и ягоды"],
  ["vegetables", "Овощи"],
  ["transport", "Транспорт"],
  ["professions", "Профессии"],
  ["birds", "Птицы"],
  ["colors", "Цвета"],
  ["shapes", "Геометрические фигуры"],
  ["seasons", "Времена года"],
  ["nature", "Природа"],
  ["emotions", "Эмоции"],
  ["safety", "Правила безопасности"],
  ["custom", "✍️ Своя тема"],
];

export default function VisualStudio() {
  const [kind, setKind] = useState("cards");
  const [category, setCategory] = useState("animals");
  const [topic, setTopic] = useState("");
  const [age, setAge] = useState("4 года");
  const [language, setLanguage] = useState("both");
  const [count, setCount] = useState("8");
  const [style, setStyle] = useState("color");

  const [image, setImage] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  async function generate() {
    setBusy(true);
    setError("");
    setImage("");
    setLabels([]);

    try {
      const response = await fetch("/api/visuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          category,
          topic,
          age,
          language,
          count: Number(count),
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать материал.");
      }

      setImage(data.image);
      setLabels(data.labels || []);
      setRemaining(
        typeof data.remaining === "number" ? data.remaining : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации.");
    } finally {
      setBusy(false);
    }
  }

  function downloadImage() {
    if (!image) return;

    const a = document.createElement("a");
    a.href = image;
    a.download = "AI-KIDS-visual-material.jpg";
    a.click();
  }

  function printMaterial() {
    if (!image) return;

    const win = window.open("", "_blank");

    if (!win) {
      setError("Разреши всплывающие окна в браузере.");
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AI KIDS — материал для печати</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; text-align: center; }
          img { width: 100%; height: 100vh; object-fit: contain; }
          @media print { img { width: 100%; height: 100%; } }
        </style>
      </head>
      <body>
        <img src="${image}" />
        <script>
          window.onload = () => {
            setTimeout(() => window.print(), 500);
          };
        </script>
      </body>
      </html>
    `);

    win.document.close();
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d9e2f0",
    borderRadius: "10px",
    background: "white",
    color: "#243b5b",
    fontSize: "15px",
    marginTop: "7px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 600,
    color: "#315b96",
    marginBottom: "5px",
  };

  return (
    <main className="shell" style={{ paddingBottom: 50 }}>
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">✦</span> AI KIDS
        </Link>

        <nav className="nav">
          <Link href="/">Главная</Link>
          <Link href="/studio">Текстовая мастерская</Link>
          <Link href="/dashboard">Мой кабинет</Link>
        </nav>
      </header>

      <section style={{ marginTop: 35, maxWidth: 950, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 42 }}>🎨 ✨ 🧩</div>
          <h1 style={{ color: "#315b96", fontSize: 32, margin: "10px 0" }}>
            Визуальная мастерская AI KIDS
          </h1>
          <p style={{ color: "#718096", fontSize: 16 }}>
            Создавай яркие наглядные пособия, карточки и задания
            для дошкольников на русском и казахском языках.
          </p>
        </div>

        <div className="panel" style={{ padding: 24 }}>
          <div className="form-grid">
            <div className="field">
              <label style={labelStyle}>Что будем создавать?</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                style={fieldStyle}
              >
                {kinds.map(([value, title]) => (
                  <option key={value} value={value}>{title}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label style={labelStyle}>Возраст детей</label>
              <select
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={fieldStyle}
              >
                <option>3 года</option>
                <option>4 года</option>
                <option>5 лет</option>
                <option>6 лет</option>
                <option>7 лет</option>
              </select>
            </div>

            <div className="field">
              <label style={labelStyle}>Выбери категорию</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={fieldStyle}
              >
                {categories.map(([value, title]) => (
                  <option key={value} value={value}>{title}</option>
                ))}
              </select>
            </div>

            {category === "custom" && (
              <div className="field">
                <label style={labelStyle}>Твоя собственная тема</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: Подводный мир"
                  style={fieldStyle}
                />
              </div>
            )}

            <div className="field">
              <label style={labelStyle}>Язык материала</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={fieldStyle}
              >
                <option value="ru">Русский</option>
                <option value="kz">Қазақша</option>
                <option value="both">Русский + Қазақша</option>
              </select>
            </div>

            <div className="field">
              <label style={labelStyle}>Количество элементов</label>
              <select
                value={count}
                onChange={(e) => setCount(e.target.value)}
                style={fieldStyle}
              >
                {[2, 4, 6, 8, 10, 12, 15, 20].map((n) => (
                  <option key={n} value={n}>{n} элементов</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label style={labelStyle}>Оформление</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={fieldStyle}
              >
                <option value="color">🌈 Цветное</option>
                <option value="mono">✏️ Чёрно-белое</option>
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={busy || (category === "custom" && !topic.trim())}
            className="btn"
            style={{
              width: "100%",
              marginTop: 24,
              padding: 16,
              fontSize: 17,
              border: "none",
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "✨ Создаём твой материал..." : "🎨 Создать наглядный материал"}
          </button>

          <p style={{ color: "#8290a5", fontSize: 12, marginTop: 12 }}>
            Создание изображения использует баланс OpenAI API.
            Для начала рекомендуем выбрать 2–4 элемента.
          </p>
        </div>

        {error && (
          <div style={{
            marginTop: 20,
            padding: 15,
            borderRadius: 10,
            background: "#fff0f0",
            color: "#a33",
          }}>
            {error}
          </div>
        )}

        {busy && (
          <div style={{ textAlign: "center", padding: 35, color: "#5277aa" }}>
            <div style={{ fontSize: 38 }}>🎨</div>
            <p>Нейросеть готовит иллюстрации. Это может занять некоторое время.</p>
          </div>
        )}

        {image && (
          <section className="panel" style={{ marginTop: 25, padding: 22 }}>
            <h2 style={{ color: "#315b96", marginTop: 0 }}>
              ✨ Твой готовый материал
            </h2>

            <div style={{
              display: "flex",
              justifyContent: "center",
              background: "#f5f7fb",
              padding: 12,
              borderRadius: 12,
            }}>
              <img
                src={image}
                alt="Созданный наглядный материал AI KIDS"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: 650,
                  height: "auto",
                  objectFit: "contain",
                  background: "white",
                }}
              />
            </div>

            <h3 style={{ color: "#315b96" }}>Названия элементов</h3>
            <ol>
              {labels.map((item, index) => (
                <li key={index} style={{ marginBottom: 6 }}>{item}</li>
              ))}
            </ol>

            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 20,
            }}>
              <button className="btn" onClick={downloadImage}>
                ⬇️ Скачать изображение
              </button>
              <button className="btn secondary" onClick={printMaterial}>
                🖨️ Печать / PDF
              </button>
            </div>

            {remaining !== null && (
              <p style={{ color: "#8290a5", fontSize: 13 }}>
                Осталось генераций: {remaining}
              </p>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
