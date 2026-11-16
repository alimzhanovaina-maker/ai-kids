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

type MaterialResult = {
  illustrations: string[];
  labels: string[];
  remaining?: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось загрузить одну из иллюстраций."));
    img.src = src;
  });
}

async function composeA4Sheet(illustrations: string[], labels: string[]) {
  const canvas = document.createElement("canvas");
  // A4 portrait at 150 DPI.
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Браузер не поддерживает создание листа PNG.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const total = illustrations.length;
  const columns = total <= 4 ? 2 : 3;
  const rows = Math.ceil(total / columns);
  const marginX = 76;
  const marginY = 78;
  const gapX = 28;
  const gapY = 28;
  const cardW = (canvas.width - marginX * 2 - gapX * (columns - 1)) / columns;
  // Use the full printable page height instead of leaving a large blank area.
  const cardH =
    (canvas.height - marginY * 2 - gapY * (rows - 1)) / rows;
  const totalGridH = rows * cardH + (rows - 1) * gapY;
  const startY = Math.max(marginY, (canvas.height - totalGridH) / 2);
  const loaded = await Promise.all(illustrations.map(loadImage));

  loaded.forEach((img, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const x = marginX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#9aa9bd";
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 6]);
    roundRect(ctx, x, y, cardW, cardH, 22);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    const labelArea = 104;
    const imagePadding = Math.max(26, Math.round(cardW * 0.055));
    const imageBoxW = cardW - imagePadding * 2;
    const imageBoxH = cardH - labelArea - imagePadding * 1.35;
    const scale = Math.min(imageBoxW / img.width, imageBoxH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = x + (cardW - drawW) / 2;
    const drawY = y + imagePadding + (imageBoxH - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Center the title in the card, with enough space for bilingual labels.
    const label = labels[index] || `Элемент ${index + 1}`;
    ctx.fillStyle = "#294363";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.max(27, Math.min(36, Math.round(cardW * 0.065)))}px Arial, sans-serif`;
    wrapCanvasText(
      ctx,
      label,
      x + cardW / 2,
      y + cardH - labelArea / 2,
      cardW - 48,
      36,
      2
    );
    ctx.restore();
  });

  return canvas.toDataURL("image/png");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const visible = lines.slice(0, maxLines);
  const startY = centerY - ((visible.length - 1) * lineHeight) / 2;
  visible.forEach((part, index) => {
    let output = part;
    while (ctx.measureText(output).width > maxWidth && output.length > 3) {
      output = output.slice(0, -2) + "…";
    }
    ctx.fillText(output, centerX, startY + index * lineHeight);
  });
}

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
      if (!response.ok) throw new Error(data.error || "Не удалось создать материал.");

      if (
        !Array.isArray(data.illustrations) ||
        data.illustrations.length !== Number(count) ||
        !data.illustrations.every((item: unknown) => typeof item === "string" && item.startsWith("data:image/"))
      ) {
        throw new Error("Сервис вернул неполный набор иллюстраций. Попробуй ещё раз.");
      }

      const names = Array.isArray(data.labels) ? data.labels : [];
      const sheet = await composeA4Sheet(data.illustrations, names);
      setImage(sheet);
      setLabels(names);
      setRemaining(typeof data.remaining === "number" ? data.remaining : null);
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
    a.download = `AI-KIDS-A4-${kind}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function printMaterial() {
    if (!image) return;
    const win = window.open("", "_blank");
    if (!win) {
      setError("Разреши всплывающие окна в браузере, чтобы открыть печать.");
      return;
    }

    win.document.open();
    win.document.write(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AI KIDS — лист A4</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; background: white; }
          body { display: flex; justify-content: center; align-items: center; }
          img { display: block; width: 210mm; height: 297mm; object-fit: contain; }
          @media print { html, body { width: 210mm; height: 297mm; } }
        </style>
      </head>
      <body>
        <img id="print-image" src="${image}" alt="Лист AI KIDS A4" />
        <script>
          const img = document.getElementById("print-image");
          let opened = false;
          function openPrint() {
            if (opened) return;
            opened = true;
            setTimeout(() => { window.focus(); window.print(); }, 250);
          }
          img.onload = openPrint;
          img.onerror = () => {
            document.body.innerHTML = "<p>Не удалось загрузить лист. Закрой окно и скачай PNG.</p>";
          };
          if (img.complete && img.naturalWidth > 0) openPrint();
        </script>
      </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <main className="visual-page">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">✦</span><span>AI KIDS</span>
        </Link>
        <nav className="nav">
          <Link href="/">Главная</Link>
          <Link href="/studio">Текстовая мастерская</Link>
          <Link href="/dashboard">Мой кабинет</Link>
        </nav>
      </header>

      <section className="intro">
        <div className="intro-icon">🎨 ✨ 🧩</div>
        <span className="eyebrow">ТВОРЧЕСКАЯ МАСТЕРСКАЯ</span>
        <h1>Визуальная мастерская AI KIDS</h1>
        <p>Создавай яркие карточки, плакаты и задания для дошкольников на русском и казахском языках.</p>
      </section>

      <section className="workspace">
        <div className="form-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">ШАГ 1</span>
              <h2>Настрой свой материал</h2>
              <p>Выбери формат, возраст и тему занятия.</p>
            </div>
            <span className="panel-emoji">🖍️</span>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Что будем создавать?</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {kinds.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Возраст детей</span>
              <select value={age} onChange={(e) => setAge(e.target.value)}>
                <option>3 года</option><option>4 года</option><option>5 лет</option><option>6 лет</option><option>7 лет</option>
              </select>
            </label>
            <label className="field">
              <span>Категория</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
              </select>
            </label>
            {category === "custom" && (
              <label className="field full">
                <span>Твоя собственная тема</span>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Например: Подводный мир" maxLength={160} />
              </label>
            )}
            <label className="field">
              <span>Язык материала</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="ru">Русский</option><option value="kz">Қазақша</option><option value="both">Русский + Қазақша</option>
              </select>
            </label>
            <label className="field">
              <span>Количество элементов</span>
              <select value={count} onChange={(e) => setCount(e.target.value)}>
                {[2, 4, 6, 8].map((n) => <option key={n} value={n}>{n} элементов</option>)}
              </select>
            </label>
            <label className="field full">
              <span>Оформление</span>
              <select value={style} onChange={(e) => setStyle(e.target.value)}>
                <option value="color">🌈 Цветное</option><option value="mono">✏️ Чёрно-белое</option>
              </select>
            </label>
          </div>

          <div className="print-note">
            <span>📄</span>
            <div><b>Крупные карточки на весь лист A4</b><small>Подписи по центру, увеличенный размер и аккуратные линии для вырезания.</small></div>
          </div>

          <button onClick={generate} disabled={busy || (category === "custom" && !topic.trim())} className="create-button">
            {busy ? "✨ Создаём иллюстрации по одной..." : "🎨 Создать наглядный материал"}
          </button>
          <p className="cost-note">Каждая карточка создаётся отдельным запросом к OpenAI и расходует баланс API. Набор из 8 карточек требует 8 генераций изображений.</p>
        </div>

        {error && <div className="error-box" role="alert">⚠️ {error}</div>}
        {busy && (
          <div className="loading-panel">
            <div className="loading-icon">🎨</div>
            <h3>Создаём карточки по одной</h3>
            <p>Затем автоматически соберём их на одном листе A4. Пожалуйста, подожди.</p>
          </div>
        )}

        {image && (
          <section className="result-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">ШАГ 2</span><h2>Твой готовый материал</h2><p>Количество карточек на листе соответствует выбранному.</p></div>
              <span className="panel-emoji">🌟</span>
            </div>
            <div className="preview-wrap">
              <img src={image} alt="Готовый лист AI KIDS A4" className="preview-image" />
            </div>
            {labels.length > 0 && (
              <div className="labels-panel">
                <h3>Названия элементов</h3>
                <ol>{labels.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol>
              </div>
            )}
            <div className="actions">
              <button className="download-button" onClick={downloadImage}>⬇️ Скачать PNG A4</button>
              <button className="print-button" onClick={printMaterial}>🖨️ Печать / Сохранить PDF</button>
            </div>
            <p className="pdf-note">Для PDF в окне печати выбери «Сохранить как PDF» и формат бумаги A4.</p>
            {remaining !== null && <p className="remaining">Осталось генераций: <b>{remaining}</b></p>}
          </section>
        )}
      </section>

      <footer className="page-footer">
        <b>✦ AI KIDS</b><span>Большие идеи для маленьких открытий</span><span>Қазақша · Русский</span>
      </footer>

      <style jsx>{`
        .visual-page{min-height:100vh;padding:0 28px 35px;background:linear-gradient(180deg,#fffaf1 0%,#f7f9ff 100%);color:#294363;font-family:Nunito,system-ui,sans-serif}
        .topbar{max-width:1180px;margin:0 auto;min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid #eee7da}
        .brand{display:flex;align-items:center;gap:10px;color:#294363;font-size:24px;font-weight:1000;text-decoration:none}.brand-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:#ffdf83;box-shadow:0 4px 0 #ebc25a}
        .nav{display:flex;align-items:center;gap:25px}.nav a{color:#667b99;text-decoration:none;font-size:13px;font-weight:800}.nav a:hover{color:#e28b62}
        .intro{max-width:850px;margin:42px auto 30px;text-align:center}.intro-icon{font-size:40px;margin-bottom:10px}.eyebrow{display:block;color:#df9564;font-size:10px;font-weight:1000;letter-spacing:1.6px}.intro h1{margin:10px 0;color:#315b96;font-size:clamp(29px,4vw,39px);font-weight:1000;letter-spacing:-.7px}.intro p{max-width:680px;margin:0 auto;color:#718096;font-size:15px;line-height:1.7}
        .workspace{max-width:1050px;margin:0 auto}.form-panel,.result-panel{padding:30px;border:1px solid #e8eaf0;border-radius:25px;background:#fff;box-shadow:0 12px 35px #344d7410}
        .panel-heading{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:23px}.panel-heading h2{margin:5px 0;color:#294363;font-size:25px;font-weight:1000}.panel-heading p{margin:0;color:#8290a5;font-size:13px}.panel-emoji{display:grid;place-items:center;width:58px;height:58px;border-radius:19px;background:#fff0d8;font-size:29px}
        .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 20px}.field{display:flex;flex-direction:column;gap:8px;color:#47648c;font-size:13px;font-weight:800}.field.full{grid-column:1/-1}.field select,.field input{width:100%;min-height:48px;padding:0 14px;border:1px solid #dce4f0;border-radius:12px;background:#fbfcff;color:#294363;font-size:14px;outline:none}.field select:focus,.field input:focus{border-color:#7898d0;box-shadow:0 0 0 3px #7898d020}
        .print-note{display:flex;align-items:center;gap:12px;margin-top:22px;padding:14px 16px;border:1px solid #f2e4c9;border-radius:14px;background:#fffaf0}.print-note>span{font-size:25px}.print-note b,.print-note small{display:block}.print-note b{color:#5a6f91;font-size:12px}.print-note small{margin-top:3px;color:#8b98aa;font-size:11px}
        .create-button{width:100%;min-height:54px;margin-top:20px;border:0;border-radius:14px;background:linear-gradient(100deg,#527bc0,#8b91d0);color:white;font-size:16px;font-weight:1000;cursor:pointer;box-shadow:0 5px 0 #d9dff0;transition:transform .15s,opacity .15s}.create-button:hover{transform:translateY(-1px)}.create-button:disabled{opacity:.55;cursor:wait}
        .cost-note,.pdf-note{margin:12px 0 0;color:#8996a9;font-size:11px;line-height:1.6}.error-box{margin-top:20px;padding:15px;border:1px solid #f1cccc;border-radius:13px;background:#fff1f1;color:#a33;font-size:14px}
        .loading-panel{margin-top:22px;padding:35px;text-align:center;border:1px solid #e4eaf5;border-radius:22px;background:#fff}.loading-icon{font-size:42px}.loading-panel h3{margin:10px 0 5px;color:#315b96}.loading-panel p{margin:0;color:#8190a4;font-size:13px}
        .result-panel{margin-top:25px}.preview-wrap{display:flex;justify-content:center;padding:18px;border-radius:18px;background:#f2f5fa}.preview-image{display:block;width:100%;max-width:620px;height:auto;object-fit:contain;border-radius:7px;background:white;box-shadow:0 4px 18px #243b5b12}
        .labels-panel{margin-top:20px;padding:18px 20px;border-radius:15px;background:#fbfcff;border:1px solid #edf0f5}.labels-panel h3{margin:0 0 10px;color:#315b96;font-size:15px}.labels-panel ol{margin:0;padding-left:22px;columns:2;column-gap:35px}.labels-panel li{break-inside:avoid;margin:0 0 7px;color:#5c7191;font-size:13px}
        .actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}.download-button,.print-button{min-height:46px;padding:0 18px;border:0;border-radius:12px;font-size:13px;font-weight:900;cursor:pointer}.download-button{background:#ffdf83;color:#35527b;box-shadow:0 4px 0 #ebc25a}.print-button{background:#e8eefb;color:#42649b}.remaining{margin:12px 0 0;color:#77879e;font-size:12px}
        .page-footer{max-width:1050px;display:flex;justify-content:space-between;gap:15px;margin:35px auto 0;padding-top:20px;border-top:1px dashed #e5dfd4;color:#8793a5;font-size:11px}.page-footer b{color:#315b96;font-size:16px}
        @media(max-width:700px){.visual-page{padding:0 14px 25px}.topbar{align-items:flex-start;flex-direction:column;padding:14px 0}.nav{width:100%;gap:16px;overflow-x:auto;padding:4px 0}.nav a{white-space:nowrap;font-size:11px}.intro{margin:28px auto 22px}.intro p{font-size:13px}.form-panel,.result-panel{padding:19px;border-radius:19px}.panel-heading h2{font-size:21px}.form-grid{grid-template-columns:1fr;gap:15px}.field.full{grid-column:auto}.labels-panel ol{columns:1}.actions{flex-direction:column}.download-button,.print-button{width:100%}.page-footer{flex-direction:column;align-items:center;text-align:center}}
      `}</style>
    </main>
  );
}
