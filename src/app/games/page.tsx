
"use client";

import { useState } from "react";
import Link from "next/link";

const games = [
  { id: "memory", title: "Найди пару", emoji: "🧩", color: "#fce4f0", desc: "Найди одинаковые картинки" },
  { id: "count", title: "Посчитай предметы", emoji: "🔢", color: "#e3efff", desc: "Посчитай предметы" },
  { id: "odd", title: "Найди лишнее", emoji: "🔎", color: "#e1f5e8", desc: "Найди лишнюю картинку" },
  { id: "shadow", title: "Угадай животное", emoji: "🐾", color: "#fff0d8", desc: "Угадай животное" },
  { id: "puzzle", title: "Собери картинку", emoji: "🧩", color: "#eee5ff", desc: "Собери красивую картинку" },
];

const memoryCards = ["🐱", "🐶", "🐰", "🦊", "🐸", "🐻", "🐱", "🐶", "🐰", "🦊", "🐸", "🐻"];
const countTasks = [{ emoji: "🍎", count: 3 }, { emoji: "⭐", count: 5 }, { emoji: "🐥", count: 4 }, { emoji: "🍓", count: 2 }];
const oddTasks = [
  { items: ["🐶", "🐱", "🐰", "🚗"], answer: 3, hint: "Найди то, что не является животным." },
  { items: ["🍎", "🍐", "🍌", "🐟"], answer: 3, hint: "Найди то, что не является фруктом." },
  { items: ["🚗", "🚌", "🚲", "🌷"], answer: 3, hint: "Найди то, что не является транспортом." },
];
const shadowTasks = [
  { shadow: "🐱", options: ["🐱", "🐶", "🐰"], answer: 0 },
  { shadow: "🐸", options: ["🐻", "🐸", "🦊"], answer: 1 },
  { shadow: "🦋", options: ["🐝", "🦋", "🐞"], answer: 1 },
];

const foxPicture = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
<defs>
<linearGradient id="sky" x2="0" y2="1"><stop stop-color="#65c9ff"/><stop offset="1" stop-color="#d8f5ff"/></linearGradient>
<linearGradient id="grass" x2="0" y2="1"><stop stop-color="#8bdc59"/><stop offset="1" stop-color="#32a94c"/></linearGradient>
<linearGradient id="fur" x2="0" y2="1"><stop stop-color="#ffb34f"/><stop offset="1" stop-color="#ed6b19"/></linearGradient>
</defs>
<rect width="600" height="600" fill="url(#sky)"/>
<circle cx="500" cy="100" r="48" fill="#fff7b0"/>
<g fill="#fff"><ellipse cx="100" cy="120" rx="65" ry="24"/><ellipse cx="145" cy="105" rx="42" ry="30"/><ellipse cx="185" cy="125" rx="50" ry="20"/></g>
<path d="M0 370 Q130 270 260 365 T600 340 V600 H0Z" fill="#83d45a"/>
<path d="M0 450 Q180 350 330 440 T600 410 V600 H0Z" fill="url(#grass)"/>
<g fill="#fff5a8"><circle cx="75" cy="440" r="9"/><circle cx="95" cy="420" r="9"/><circle cx="115" cy="440" r="9"/><circle cx="95" cy="460" r="9"/></g>
<g fill="#ff79ad"><circle cx="500" cy="400" r="10"/><circle cx="520" cy="380" r="10"/><circle cx="540" cy="400" r="10"/><circle cx="520" cy="420" r="10"/></g>
<path d="M360 430 Q510 500 460 370 Q420 285 340 355 Q300 390 360 430Z" fill="#fff0d7" stroke="#b9541d" stroke-width="12"/>
<path d="M245 360 Q185 270 205 140 Q280 155 300 245 Q335 150 410 140 Q430 275 360 360Z" fill="url(#fur)" stroke="#a94b19" stroke-width="13"/>
<path d="M235 225 Q245 180 260 190 L282 270Z M355 270 L390 190 Q410 185 415 225 L375 290Z" fill="#ffd0c5"/>
<ellipse cx="305" cy="385" rx="145" ry="145" fill="url(#fur)" stroke="#a94b19" stroke-width="12"/>
<ellipse cx="305" cy="440" rx="112" ry="83" fill="#fff0d7"/>
<path d="M180 380 Q210 310 300 340 Q385 310 430 380 Q395 440 305 425 Q220 440 180 380Z" fill="#fff9ed"/>
<ellipse cx="255" cy="370" rx="18" ry="25" fill="#292b38"/><ellipse cx="355" cy="370" rx="18" ry="25" fill="#292b38"/>
<circle cx="261" cy="362" r="6" fill="#fff"/><circle cx="361" cy="362" r="6" fill="#fff"/>
<path d="M290 405 Q305 390 320 405 Q310 425 300 420Z" fill="#38252a"/>
<path d="M300 420 Q285 442 270 428 M310 420 Q325 442 340 428" fill="none" stroke="#713c36" stroke-width="6" stroke-linecap="round"/>
<ellipse cx="220" cy="520" rx="48" ry="28" fill="#fff0d7"/><ellipse cx="390" cy="520" rx="48" ry="28" fill="#fff0d7"/>
<g fill="#fff"><circle cx="145" cy="520" r="8"/><circle cx="165" cy="500" r="8"/><circle cx="185" cy="520" r="8"/><circle cx="165" cy="540" r="8"/></g>
</svg>`;

const foxImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(foxPicture)}`;

function shufflePuzzle() {
  const result = [0, 1, 2, 3];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.every((v, i) => v === i)) [result[0], result[1]] = [result[1], result[0]];
  return result;
}

export default function GamesPage() {
  const [selected, setSelected] = useState("");
  const [language, setLanguage] = useState<"ru" | "kz">("ru");
  const [opened, setOpened] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [countIndex, setCountIndex] = useState(0);
  const [oddIndex, setOddIndex] = useState(0);
  const [shadowIndex, setShadowIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [tiles, setTiles] = useState<number[]>([2, 0, 3, 1]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);

  const ru = language === "ru";
  const solved = tiles.every((tile, index) => tile === index);

  function startGame(id: string) {
    setSelected(id);
    setOpened([]);
    setMatched([]);
    setCountIndex(0);
    setOddIndex(0);
    setShadowIndex(0);
    setScore(0);
    setMessage("");
    setTiles(shufflePuzzle());
    setChosen(null);
    setMoves(0);
  }

  function flipCard(index: number) {
    if (opened.length === 2 || opened.includes(index) || matched.includes(index)) return;
    const next = [...opened, index];
    setOpened(next);
    if (next.length === 2) {
      if (memoryCards[next[0]] === memoryCards[next[1]]) {
        setMatched(old => [...old, ...next]);
        setScore(old => old + 1);
        setMessage(ru ? "Молодец! Нашёл пару! 🌟" : "Жарайсың! Жұбын таптың! 🌟");
        setOpened([]);
      } else {
        setMessage(ru ? "Попробуй ещё раз!" : "Қайталап көр!");
        setTimeout(() => { setOpened([]); setMessage(""); }, 900);
      }
    }
  }

  function answerCount(value: number) {
    if (value !== countTasks[countIndex].count) {
      setMessage(ru ? "Попробуй ещё раз 😊" : "Қайталап көр 😊");
      return;
    }
    setScore(old => old + 1);
    setMessage(ru ? "Правильно! Отлично! 🎉" : "Дұрыс! Тамаша! 🎉");
    setTimeout(() => { setMessage(""); setCountIndex(old => (old + 1) % countTasks.length); }, 700);
  }

  function answerOdd(value: number) {
    if (value !== oddTasks[oddIndex].answer) {
      setMessage(ru ? "Подумай ещё немножко!" : "Тағы ойланып көр!");
      return;
    }
    setScore(old => old + 1);
    setMessage(ru ? "Верно! Ты внимательный! ⭐" : "Дұрыс! Сен зерексің! ⭐");
    setTimeout(() => { setMessage(""); setOddIndex(old => (old + 1) % oddTasks.length); }, 700);
  }

  function answerShadow(value: number) {
    if (value !== shadowTasks[shadowIndex].answer) {
      setMessage(ru ? "Попробуй ещё!" : "Қайталап көр!");
      return;
    }
    setScore(old => old + 1);
    setMessage(ru ? "Ты угадал! 🥳" : "Дұрыс таптың! 🥳");
    setTimeout(() => { setMessage(""); setShadowIndex(old => (old + 1) % shadowTasks.length); }, 700);
  }

  function selectTile(index: number) {
    if (solved) return;
    if (chosen === null) {
      setChosen(index);
      setMessage(ru ? "Теперь выбери вторую часть картинки." : "Енді суреттің екінші бөлігін таңда.");
      return;
    }
    if (chosen === index) {
      setChosen(null);
      setMessage("");
      return;
    }
    const next = [...tiles];
    [next[chosen], next[index]] = [next[index], next[chosen]];
    setTiles(next);
    setChosen(null);
    setMoves(old => old + 1);
    if (next.every((tile, i) => tile === i)) {
      setScore(old => old + 1);
      setMessage(ru ? "Ура! Лисичка собрана! 🏆" : "Алақай! Түлкі құрастырылды! 🏆");
    } else {
      setMessage(ru ? "Отлично! Продолжай собирать." : "Жақсы! Құрастыруды жалғастыр.");
    }
  }

  function restartPuzzle() {
    setTiles(shufflePuzzle());
    setChosen(null);
    setMoves(0);
    setMessage("");
  }

  const tilePositions = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"];

  return (
    <main className="games">
      <header>
        <Link href="/" className="brand">🌈 AI KIDS</Link>
        <nav>
          <Link href="/studio">{ru ? "Мастерская" : "Шеберхана"}</Link>
          <Link href="/dashboard">{ru ? "Мой кабинет" : "Жеке кабинет"}</Link>
        </nav>
        <button className="lang" onClick={() => setLanguage(ru ? "kz" : "ru")}>{ru ? "ҚАЗ" : "РУС"}</button>
      </header>

      <section className="hero">
        <div>
          <span className="tag">✨ {ru ? "ИГРОВАЯ КОМНАТА" : "ОЙЫН БӨЛМЕСІ"}</span>
          <h1>{ru ? "Играй, учись и открывай!" : "Ойна, үйрен және жаңалық аш!"}</h1>
          <p>{ru ? "Весёлые развивающие игры для маленьких исследователей от 3 до 6 лет." : "3–6 жастағы балаларға арналған қызықты дамытушы ойындар."}</p>
        </div>
        <div className="hero-art">🧸 🌈 🦊 ⭐</div>
      </section>

      {!selected ? (
        <section>
          <h2>{ru ? "Выбери игру" : "Ойынды таңда"}</h2>
          <div className="grid">
            {games.map(game => (
              <button key={game.id} className="game-card" style={{ background: game.color }} onClick={() => startGame(game.id)}>
                <span className="game-emoji">{game.emoji}</span>
                <b>{ru ? game.title : ({
                  memory: "Жұбын тап", count: "Заттарды сана", odd: "Артығын тап",
                  shadow: "Жануарды таны", puzzle: "Суретті құрастыр"
                } as Record<string, string>)[game.id]}</b>
                <small>{ru ? game.desc : "Ойна және тапсырманы орында!"}</small>
                <span className="play">{ru ? "Играть →" : "Ойнау →"}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="play-area">
          <button className="back" onClick={() => setSelected("")}>← {ru ? "Все игры" : "Барлық ойындар"}</button>
          <div className="score">⭐ {ru ? "Правильных ответов:" : "Дұрыс жауаптар:"} {score}</div>

          {selected === "memory" && <>
            <h2>{ru ? "Найди одинаковые картинки" : "Бірдей суреттерді тап"}</h2>
            <p>{ru ? "Открывай карточки по одной и находи пары." : "Карточкаларды бір-бірден ашып, жұптарын тап."}</p>
            <div className="memory-grid">
              {memoryCards.map((card, index) => <button key={index} className={`memory-card ${matched.includes(index) ? "matched" : ""}`} onClick={() => flipCard(index)}>{opened.includes(index) || matched.includes(index) ? card : "❔"}</button>)}
            </div>
            {matched.length === memoryCards.length && <h3>🏆 {ru ? "Ты нашёл все пары! Молодец!" : "Барлық жұпты таптың! Жарайсың!"}</h3>}
          </>}

          {selected === "count" && <>
            <h2>{ru ? "Сколько предметов ты видишь?" : "Неше зат көріп тұрсың?"}</h2>
            <div className="big-items">{Array.from({ length: countTasks[countIndex].count }).map((_, i) => <span key={i}>{countTasks[countIndex].emoji}</span>)}</div>
            <div className="answers">{[1, 2, 3, 4, 5, 6].map(n => <button key={n} onClick={() => answerCount(n)}>{n}</button>)}</div>
          </>}

          {selected === "odd" && <>
            <h2>{ru ? "Найди лишнюю картинку" : "Артық суретті тап"}</h2>
            <p>{ru ? oddTasks[oddIndex].hint : "Артық суретті анықта."}</p>
            <div className="picture-answers">{oddTasks[oddIndex].items.map((item, index) => <button key={index} onClick={() => answerOdd(index)}>{item}</button>)}</div>
          </>}

          {selected === "shadow" && <>
            <h2>{ru ? "Кто спрятался?" : "Кім жасырынды?"}</h2>
            <div className="shadow">{shadowTasks[shadowIndex].shadow}</div>
            <p>{ru ? "Найди такое же животное." : "Осындай жануарды тап."}</p>
            <div className="picture-answers">{shadowTasks[shadowIndex].options.map((item, index) => <button key={index} onClick={() => answerShadow(index)}>{item}</button>)}</div>
          </>}

          {selected === "puzzle" && <>
            <h2>{ru ? "Собери картинку с лисичкой!" : "Түлкінің суретін құрастыр!"}</h2>
            <p>{ru ? "Посмотри на образец. Выбирай две части, чтобы поменять их местами." : "Үлгіге қара. Екі бөлікті таңдап, орындарын ауыстыр."}</p>
            <div className="puzzle-layout">
              <div className="sample">
                <b>{ru ? "Образец:" : "Үлгі:"}</b>
                <div className="sample-image" />
              </div>
              <div className="puzzle-main">
                <div className="puzzle-board">
                  {tiles.map((tile, index) => <button key={index} aria-label={`Фрагмент ${index + 1}`} className={`puzzle-tile ${chosen === index ? "chosen" : ""} ${solved ? "correct" : ""}`} onClick={() => selectTile(index)} style={{ backgroundImage: `url("${foxImage}")`, backgroundPosition: tilePositions[tile] }} />)}
                </div>
                <p className="moves">{ru ? "Перестановок:" : "Ауыстыру саны:"} {moves}</p>
              </div>
            </div>
            {solved && <h3>🏆 {ru ? "Молодец! Ты собрал лисичку!" : "Жарайсың! Түлкіні құрастырдың!"}</h3>}
            <button className="again" onClick={restartPuzzle}>{ru ? "Перемешать и начать снова ↻" : "Араластырып, қайта бастау ↻"}</button>
          </>}

          {message && <div className="message">{message}</div>}
          {selected !== "puzzle" && <button className="again" onClick={() => startGame(selected)}>{ru ? "Начать заново ↻" : "Қайта бастау ↻"}</button>}
        </section>
      )}

      <footer>🌼 AI KIDS · {ru ? "Учимся играя!" : "Ойнап үйренеміз!"}</footer>

      <style jsx>{`
        .games{max-width:1100px;margin:auto;padding:20px 25px 45px;font-family:Arial,sans-serif;color:#30496b}
        header{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap}
        .brand{font-size:23px;font-weight:900;color:#30496b;text-decoration:none}
        nav{display:flex;gap:20px}nav a{color:#627894;text-decoration:none;font-weight:700;font-size:14px}
        .lang,.back{border:2px solid #e4eaf3;background:white;border-radius:12px;padding:10px 14px;color:#426ca7;font-weight:900;cursor:pointer}
        .hero{margin:25px 0 40px;padding:35px;border-radius:28px;background:linear-gradient(120deg,#688bd0,#a6a3df);color:white;display:flex;align-items:center;justify-content:space-between;gap:20px}
        .tag{font-weight:900;font-size:12px;background:#ffffff35;padding:9px 13px;border-radius:20px}
        h1{font-size:clamp(30px,5vw,48px);margin:20px 0 10px}.hero p{line-height:1.6;max-width:580px}
        .hero-art{font-size:45px;line-height:1.7}h2{font-size:27px;margin:15px 0 22px}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:17px}
        .game-card{border:2px solid transparent;border-radius:23px;padding:22px;min-height:225px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;color:#30496b;cursor:pointer;transition:.2s}
        .game-card:hover{transform:translateY(-5px);border-color:#8da8d7}
        .game-emoji{font-size:48px;margin-bottom:14px}.game-card b{font-size:18px}.game-card small{margin-top:9px;line-height:1.5;color:#6d7f98}
        .play{margin-top:auto;padding-top:18px;color:#416ca8;font-weight:900}
        .play-area{margin:25px 0;padding:25px;border:2px solid #e7edf5;border-radius:25px;background:#fffdf9;text-align:center;min-height:390px}
        .back{float:left}.score{display:inline-block;background:#fff1c9;padding:10px 15px;border-radius:15px;font-weight:900}
        .memory-grid{max-width:560px;margin:25px auto;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .memory-card{height:105px;border:0;border-radius:18px;background:#e6edff;font-size:40px;cursor:pointer}.memory-card.matched{background:#dcf4e3}
        .big-items{display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin:35px auto;font-size:65px;max-width:500px}
        .answers,.picture-answers{display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin:25px auto}
        .answers button,.picture-answers button{width:85px;height:85px;border:2px solid #e2eaf6;border-radius:20px;background:#eef3ff;font-size:38px;cursor:pointer}
        .answers button{font-weight:900;color:#416ca8}.picture-answers button{background:#fff0d8}
        .shadow{font-size:100px;filter:grayscale(1);opacity:.7;margin:20px}
        .message{margin:20px auto;padding:15px;background:#e5f6e9;border-radius:15px;font-size:18px;font-weight:900;max-width:500px}
        .again{margin-top:20px;border:0;border-radius:14px;padding:13px 20px;background:#ffdf83;color:#405b83;font-weight:900;cursor:pointer}
        .puzzle-layout{display:flex;justify-content:center;align-items:center;gap:35px;flex-wrap:wrap;margin:25px auto}
        .sample{padding:15px;background:#f5efff;border-radius:20px;display:flex;flex-direction:column;gap:10px}
        .sample-image{width:210px;height:210px;border-radius:14px;background-image:url("${foxImage}");background-size:cover;background-position:center}
        .puzzle-board{width:min(440px,90vw);aspect-ratio:1;display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:auto}
        .puzzle-tile{border:4px solid #e2d8fa;border-radius:16px;background-repeat:no-repeat;background-size:200% 200%;cursor:pointer;min-width:0;min-height:0;transition:.15s}
        .puzzle-tile.chosen{border-color:#8057dc;box-shadow:0 0 0 4px #d8c7ff;transform:scale(.97)}
        .puzzle-tile.correct{border-color:#83c99a}
        .moves{color:#71829a;font-weight:700;margin-top:18px}
        footer{text-align:center;padding:30px;color:#8a98aa;border-top:2px dashed #e8e4dc;margin-top:35px}
        @media(max-width:800px){.grid{grid-template-columns:repeat(2,1fr)}.hero-art{font-size:32px}}
        @media(max-width:520px){.games{padding:15px}.hero{padding:22px;flex-direction:column;align-items:flex-start}.grid{grid-template-columns:1fr 1fr;gap:10px}.game-card{padding:15px;min-height:200px}.memory-card{height:75px;font-size:30px}.big-items{font-size:45px}.play-area{padding:15px}.puzzle-layout{gap:18px}.sample-image{width:150px;height:150px}}
      `}</style>
    </main>
  );
}
