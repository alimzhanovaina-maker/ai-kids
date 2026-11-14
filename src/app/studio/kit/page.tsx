
"use client";

import { useState } from "react";
import Link from "next/link";

const options = [
  { id: "cards", title: "Карточки для печати", icon: "🃏" },
  { id: "worksheet", title: "Рабочий лист", icon: "✏️" },
  { id: "game", title: "Дидактическая игра", icon: "🎲" },
  { id: "poster", title: "Обучающий плакат", icon: "🖼️" },
  { id: "coloring", title: "Раскраска", icon: "🎨" },
  { id: "puzzle", title: "Пазлы", icon: "🧩" },
  { id: "teacher_guide", title: "Методические рекомендации", icon: "📚" },
];

export default function SmartKitPage() {
  const [topic, setTopic] = useState("");
  const [age, setAge] = useState("4 года");
  const [language, setLanguage] = useState("both");
  const [count, setCount] = useState("8");
  const [difficulty, setDifficulty] = useState("обычный");
  const [selected, setSelected] = useState([
    "cards",
    "worksheet",
    "game",
    "teacher_guide",
  ]);

  const [kit, setKit] = useState<any>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelected((old) =>
      old.includes(id)
        ? old.filter((item) => item !== id)
        : [...old, id]
    );
  }

  async function createKit() {
    if (!topic.trim()) {
      setError("Сначала введи тему комплекта.");
      return;
    }

    if (!selected.length) {
      setError("Выбери хотя бы один вид материала.");
      return;
    }

    setBusy(true);
    setError("");
    setKit(null);

    try {
      const response = await fetch("/api/kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          age,
          language,
          count: Number(count),
          difficulty,
          materialTypes: selected,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать комплект.");
      }

      setKit(data.kit);
      setRemaining(
        typeof data.remaining === "number" ? data.remaining : null
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Произошла ошибка."
      );
    } finally {
      setBusy(false);
    }
  }

  function downloadJSON() {
    if (!kit) return;

    const blob = new Blob(
      [JSON.stringify(kit, null, 2)],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "AI-KIDS-Smart-Kit.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function printKit() {
    if (!kit) return;

    const escape = (value: any) =>
      String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char] || char));

    const section = (heading: string, content: string) =>
      content
        ? `<section><h2>${escape(heading)}</h2>${content}</section>`
        : "";

    const list = (items: any[]) =>
      Array.isArray(items)
        ? `<ul>${items.map((item) =>
            `<li>${escape(item)}</li>`
          ).join("")}</ul>`
        : "";

    const cards = Array.isArray(kit.cards)
      ? kit.cards.map((card: any) => `
          <article class="card">
            <h3>${escape(card.number)}. ${escape(card.title)}</h3>
            <p>${escape(card.titleKz)}</p>
            <p>${escape(card.learningFact)}</p>
            <small>${escape(card.visualDescription)}</small>
          </article>
        `).join("")
      : "";

    const tasks = kit.worksheet?.tasks
      ? kit.worksheet.tasks.map((task: any, i: number) => `
          <article class="card">
            <h3>Задание ${i + 1}</h3>
            <p>${escape(task.instruction)}</p>
            <p>${escape(task.instructionKz)}</p>
            <small>Ответ педагогу: ${escape(task.answer)}</small>
          </article>
        `).join("")
      : "";

    const html = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>${escape(kit.title)}</title>
        <style>
          @page { size: A4; margin: 17mm; }
          body {
            font-family: Arial, sans-serif;
            color: #243b5b;
            line-height: 1.5;
          }
          h1 { color: #315b96; text-align: center; }
          h2 {
            color: #315b96;
            border-bottom: 1px solid #d9e2f0;
            padding-bottom: 6px;
          }
          .card {
            border: 1px solid #d9e2f0;
            border-radius: 9px;
            padding: 12px;
            margin: 10px 0;
            break-inside: avoid;
          }
          small { color: #687b91; }
          section { margin-top: 22px; }
        </style>
      </head>
      <body>
        <h1>${escape(kit.title)}</h1>
        <p><b>Тема:</b> ${escape(kit.topic)}</p>
        <p><b>Возраст:</b> ${escape(kit.age)}</p>
        ${section("Цель комплекта", `<p>${escape(kit.objective)}</p>`)}
        ${section("Необходимые материалы", list(kit.materials))}
        ${section("Вступление педагога", `<p>${escape(kit.teacherIntroduction)}</p>`)}
        ${section("Карточки", cards)}
        ${section("Рабочий лист", `<h3>${escape(kit.worksheet?.title)}</h3>${tasks}`)}
        ${section("Дидактическая игра", `
          <h3>${escape(kit.game?.title)}</h3>
          <p>${escape(kit.game?.purpose)}</p>
          ${list(kit.game?.rules || [])}
          <h4>Вопросы детям</h4>
          ${list(kit.game?.teacherQuestions || [])}
        `)}
        ${section("Плакат", `
          <h3>${escape(kit.poster?.title)}</h3>
          ${(kit.poster?.sections || []).map((item: any) =>
            `<p><b>${escape(item.heading)}</b> — ${escape(item.description)}</p>`
          ).join("")}
        `)}
        ${section("Раскраска", `
          <h3>${escape(kit.coloring?.title)}</h3>
          <p>${escape(kit.coloring?.visualDescription)}</p>
        `)}
        ${section("Пазлы", `
          <h3>${escape(kit.puzzle?.title)}</h3>
          <p>${escape(kit.puzzle?.instruction)}</p>
          ${list(kit.puzzle?.pieces || [])}
        `)}
        ${section("Методические рекомендации", `
          <h3>Ход занятия</h3>
          ${list(kit.teacherGuide?.lessonFlow || [])}
          <h3>Советы педагогу</h3>
          ${list(kit.teacherGuide?.teacherTips || [])}
          <h3>Ожидаемые результаты деятельности</h3>
          ${list(kit.teacherGuide?.expectedProcess || [])}
        `)}
        ${section("Словарь", list(
          (kit.vocabulary || []).map((v: any) => `${v.ru} — ${v.kz}`)
        ))}
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) {
      setError("Разреши всплывающие окна для печати.");
      return;
    }

    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  return (
    <main className="shell" style={{ paddingBottom: 60 }}>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">✦</span> AI KIDS
        </Link>
        <nav className="nav">
          <Link href="/">Главная</Link>
          <Link href="/studio">Мастерская</Link>
          <Link href="/dashboard">Мой кабинет</Link>
        </nav>
      </header>

      <div style={{ maxWidth: 950, margin: "35px auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🧠 ✨ 📚</div>
          <h1 style={{ color: "#315b96", fontSize: 32 }}>
            AI KIDS SMART KIT
          </h1>
          <p style={{ color: "#718096" }}>
            Умный помощник педагога. Создавай целые образовательные комплекты
            по одной теме.
          </p>
        </div>

        <div className="panel" style={{ padding: 25 }}>
          <label style={{ color: "#315b96", fontWeight: 700 }}>
            Тема образовательного комплекта
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Например: Домашние животные"
            style={{
              width: "100%",
              padding: 14,
              marginTop: 8,
              marginBottom: 20,
              border: "1px solid #d9e2f0",
              borderRadius: 10,
              fontSize: 16,
            }}
          />

          <div className="form-grid">
            <div>
              <label>Возраст детей</label>
              <select
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={{ width: "100%", padding: 12, marginTop: 8 }}
              >
                <option>3 года</option>
                <option>4 года</option>
                <option>5 лет</option>
                <option>6 лет</option>
                <option>7 лет</option>
              </select>
            </div>

            <div>
              <label>Язык</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ width: "100%", padding: 12, marginTop: 8 }}
              >
                <option value="ru">Русский</option>
                <option value="kz">Қазақша</option>
                <option value="both">Русский + Қазақша</option>
              </select>
            </div>

            <div>
              <label>Количество карточек</label>
              <select
                value={count}
                onChange={(e) => setCount(e.target.value)}
                style={{ width: "100%", padding: 12, marginTop: 8 }}
              >
                {[2, 4, 6, 8, 10, 12, 15, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Сложность</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ width: "100%", padding: 12, marginTop: 8 }}
              >
                <option value="лёгкий">Начальный уровень</option>
                <option value="обычный">Средний уровень</option>
                <option value="повышенный">Повышенный уровень</option>
              </select>
            </div>
          </div>

          <h3 style={{ color: "#315b96", marginTop: 28 }}>
            Что включить в комплект?
          </h3>
          <div className="form-grid">
            {options.map((option) => (
              <label
                key={option.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 13,
                  border: "1px solid #d9e2f0",
                  borderRadius: 10,
                  background: selected.includes(option.id) ? "#eff5ff" : "white",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.id)}
                  onChange={() => toggle(option.id)}
                />
                <span>{option.icon} {option.title}</span>
              </label>
            ))}
          </div>

          <button
            className="btn"
            onClick={createKit}
            disabled={busy}
            style={{
              width: "100%",
              marginTop: 25,
              padding: 16,
              border: "none",
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? "🧠 AI готовит комплект..." : "✨ Создать умный комплект"}
          </button>

          <p style={{ color: "#8290a5", fontSize: 12, marginTop: 10 }}>
            Создание комплекта использует лимит генераций AI KIDS.
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fff0f0",
            color: "#a33",
            padding: 15,
            borderRadius: 10,
            marginTop: 18,
          }}>
            {error}
          </div>
        )}

        {busy && (
          <div style={{ textAlign: "center", padding: 30, color: "#5277aa" }}>
            <div style={{ fontSize: 40 }}>✨</div>
            AI анализирует тему и подготавливает материалы...
          </div>
        )}

        {kit && (
          <div className="panel" style={{ marginTop: 25, padding: 25 }}>
            <h2 style={{ color: "#315b96" }}>{kit.title}</h2>
            <p><b>Тема:</b> {kit.topic}</p>
            <p><b>Возраст:</b> {kit.age}</p>

            <h3>🎯 Цель комплекта</h3>
            <p>{kit.objective}</p>

            <h3>🧰 Необходимые материалы</h3>
            <ul>
              {(kit.materials || []).map((item: string, i: number) =>
                <li key={i}>{item}</li>
              )}
            </ul>

            <h3>👩‍🏫 Вступление педагога</h3>
            <p>{kit.teacherIntroduction}</p>

            {kit.cards && (
              <>
                <h3>🃏 Карточки</h3>
                <div className="form-grid">
                  {kit.cards.map((card: any, i: number) => (
                    <div key={i} style={{
                      border: "1px solid #d9e2f0",
                      borderRadius: 10,
                      padding: 14,
                    }}>
                      <b>{card.number}. {card.title}</b>
                      <p>{card.titleKz}</p>
                      <p>{card.learningFact}</p>
                      <small>{card.visualDescription}</small>
                    </div>
                  ))}
                </div>
              </>
            )}

            {kit.worksheet && (
              <>
                <h3>✏️ Рабочий лист: {kit.worksheet.title}</h3>
                {kit.worksheet.tasks?.map((task: any, i: number) => (
                  <div key={i} style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                    <b>Задание {i + 1}</b>
                    <p>{task.instruction}</p>
                    <p>{task.instructionKz}</p>
                    <details>
                      <summary>Ответ для педагога</summary>
                      {task.answer}
                    </details>
                  </div>
                ))}
              </>
            )}

            {kit.game && (
              <>
                <h3>🎲 Игра: {kit.game.title}</h3>
                <p>{kit.game.purpose}</p>
                <ul>
                  {kit.game.rules?.map((rule: string, i: number) =>
                    <li key={i}>{rule}</li>
                  )}
                </ul>
                <b>Вопросы детям</b>
                <ul>
                  {kit.game.teacherQuestions?.map((q: string, i: number) =>
                    <li key={i}>{q}</li>
                  )}
                </ul>
              </>
            )}

            {kit.poster && (
              <>
                <h3>🖼️ Плакат: {kit.poster.title}</h3>
                {kit.poster.sections?.map((s: any, i: number) => (
                  <p key={i}><b>{s.heading}:</b> {s.description}</p>
                ))}
              </>
            )}

            {kit.coloring && (
              <>
                <h3>🎨 Раскраска: {kit.coloring.title}</h3>
                <p>{kit.coloring.visualDescription}</p>
              </>
            )}

            {kit.puzzle && (
              <>
                <h3>🧩 Пазлы: {kit.puzzle.title}</h3>
                <p>{kit.puzzle.instruction}</p>
                <ul>
                  {kit.puzzle.pieces?.map((piece: string, i: number) =>
                    <li key={i}>{piece}</li>
                  )}
                </ul>
              </>
            )}

            {kit.teacherGuide && (
              <>
                <h3>📚 Методические рекомендации</h3>
                <h4>Ход занятия</h4>
                <ul>
                  {kit.teacherGuide.lessonFlow?.map((item: string, i: number) =>
                    <li key={i}>{item}</li>
                  )}
                </ul>
                <h4>Советы педагогу</h4>
                <ul>
                  {kit.teacherGuide.teacherTips?.map((item: string, i: number) =>
                    <li key={i}>{item}</li>
                  )}
                </ul>
                <h4>Ожидаемый процесс обучения</h4>
                <ul>
                  {kit.teacherGuide.expectedProcess?.map((item: string, i: number) =>
                    <li key={i}>{item}</li>
                  )}
                </ul>
              </>
            )}

            {kit.vocabulary && (
              <>
                <h3>🌍 Словарь</h3>
                {kit.vocabulary.map((word: any, i: number) => (
                  <p key={i}>{word.ru} — {word.kz}</p>
                ))}
              </>
            )}

            <div style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 25,
            }}>
              <button className="btn" onClick={printKit}>
                🖨️ Печать / PDF
              </button>
              <button className="btn secondary" onClick={downloadJSON}>
                ⬇️ Скачать данные комплекта
              </button>
            </div>

            {remaining !== null && (
              <p style={{ color: "#8290a5", fontSize: 12 }}>
                Осталось генераций: {remaining}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
