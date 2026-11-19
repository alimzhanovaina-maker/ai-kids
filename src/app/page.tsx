
"use client";

import { useState } from "react";
import Link from "next/link";

const games = [
  { id: "memory", title: "Найди пару", emoji: "🧩", color: "#fce4f0", desc: "Открой карточки и найди одинаковые картинки" },
  { id: "count", title: "Посчитай предметы", emoji: "🔢", color: "#e3efff", desc: "Посчитай картинки и выбери правильный ответ" },
  { id: "odd", title: "Найди лишнее", emoji: "🔎", color: "#e1f5e8", desc: "Найди картинку, которая не подходит" },
  { id: "shadow", title: "Угадай животное", emoji: "🐾", color: "#fff0d8", desc: "Подбери животное к его силуэту" },
  { id: "puzzle", title: "Собери картинку", emoji: "🧩", color: "#eee5ff", desc: "Поставь части картинки на свои места" },
];

const memoryCards = ["🐱", "🐶", "🐰", "🦊", "🐸", "🐻", "🐱", "🐶", "🐰", "🦊", "🐸", "🐻"];

const countTasks = [
  { emoji: "🍎", count: 3 },
  { emoji: "⭐", count: 5 },
  { emoji: "🐥", count: 4 },
  { emoji: "🍓", count: 2 },
];

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

const puzzlePicture = ["🌳", "🌞", "🏡", "🌷"];

function shufflePuzzle() {
  const result = [...puzzlePicture];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.every((item, index) => item === puzzlePicture[index])) {
    [result[0], result[1]] = [result[1], result[0]];
  }
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
  const [puzzleTiles, setPuzzleTiles] = useState<string[]>(puzzlePicture);
  const [puzzleSelected, setPuzzleSelected] = useState<number | null>(null);
  const [puzzleMoves, setPuzzleMoves] = useState(0);

  const ru = language === "ru";
  const puzzleSolved = puzzleTiles.every((item, index) => item === puzzlePicture[index]);

  function startGame(id: string) {
    setSelected(id);
    setOpened([]);
    setMatched([]);
    setCountIndex(0);
    setOddIndex(0);
    setShadowIndex(0);
    setScore(0);
    setMessage("");
    setPuzzleTiles(shufflePuzzle());
    setPuzzleSelected(null);
    setPuzzleMoves(0);
  }

  function flipCard(index: number) {
    if (opened.length === 2 || opened.includes(index) || matched.includes(index)) return;

    const next = [...opened, index];
    setOpened(next);

    if (next.length === 2) {
      if (memoryCards[next[0]] === memoryCards[next[1]]) {
        setMatched((old) => [...old, ...next]);
        setScore((old) => old + 1);
        setMessage(ru ? "Молодец! Нашёл пару! 🌟" : "Жарайсың! Жұбын таптың! 🌟");
        setOpened([]);
      } else {
        setMessage(ru ? "Попробуй ещё раз!" : "Қайталап көр!");
        setTimeout(() => {
          setOpened([]);
          setMessage("");
        }, 900);
      }
    }
  }

  function answerCount(value: number) {
    if (value === countTasks[countIndex].count) {
      setScore((old) => old + 1);
      setMessage(ru ? "Правильно! Отлично! 🎉" : "Дұрыс! Тамаша! 🎉");
    } else {
      setMessage(ru ? "Попробуй ещё раз 😊" : "Қайталап көр 😊");
      return;
    }
    setTimeout(() => {
      setMessage("");
      setCountIndex((old) => (old + 1) % countTasks.length);
    }, 700);
  }

  function answerOdd(value: number) {
    if (value === oddTasks[oddIndex].answer) {
      setScore((old) => old + 1);
      setMessage(ru ? "Верно! Ты внимательный! ⭐" : "Дұрыс! Сен зерексің! ⭐");
      setTimeout(() => {
        setMessage("");
        setOddIndex((old) => (old + 1) % oddTasks.length);
      }, 700);
    } else {
      setMessage(ru ? "Подумай ещё немножко!" : "Тағы ойланып көр!");
    }
  }

  function answerShadow(value: number) {
    if (value === shadowTasks[shadowIndex].answer) {
      setScore((old) => old + 1);
      setMessage(ru ? "Ты угадал! 🥳" : "Дұрыс таптың! 🥳");
      setTimeout(() => {
        setMessage("");
        setShadowIndex((old) => (old + 1) % shadowTasks.length);
      }, 700);
    } else {
      setMessage(ru ? "Это другое животное. Попробуй ещё!" : "Бұл басқа жануар. Қайталап көр!");
    }
  }

  function selectPuzzleTile(index: number) {
    if (puzzleSolved) return;

    if (puzzleSelected === null) {
      setPuzzleSelected(index);
      setMessage(ru ? "Теперь выбери вторую карточку для обмена." : "Енді ауыстыру үшін екінші бөлікті таңда.");
      return;
    }

    if (puzzleSelected === index) {
      setPuzzleSelected(null);
      setMessage("");
      return;
    }

    const next = [...puzzleTiles];
    [next[puzzleSelected], next[index]] = [next[index], next[puzzleSelected]];
    setPuzzleTiles(next);
    setPuzzleSelected(null);
    setPuzzleMoves((old) => old + 1);

    if (next.every((item, i) => item === puzzlePicture[i])) {
      setScore((old) => old + 1);
      setMessage(ru ? "Ура! Картинка собрана! 🏆" : "Алақай! Сурет құрастырылды! 🏆");
    } else {
      setMessage(ru ? "Хорошо! Продолжай собирать картинку." : "Жақсы! Суретті құрастыруды жалғастыр.");
    }
  }

  function restartPuzzle() {
    setPuzzleTiles(shufflePuzzle());
    setPuzzleSelected(null);
    setPuzzleMoves(0);
    setMessage("");
  }

  return (
    <main className="games">
      <header>
        <Link href="/" className="brand">🌈 AI KIDS</Link>
        <nav>
          <Link href="/studio">{ru ? "Мастерская" : "Шеберхана"}</Link>
          <Link href="/dashboard">{ru ? "Мой кабинет" : "Жеке кабинет"}</Link>
        </nav>
        <button className="lang" onClick={() => setLanguage(ru ? "kz" : "ru")}>
          {ru ? "ҚАЗ" : "РУС"}
        </button>
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
            {games.map((game) => (
              <button key={game.id} className="game-card" style={{ background: game.color }} onClick={() => startGame(game.id)}>
                <span className="game-emoji">{game.emoji}</span>
                <b>{ru ? game.title : ({
                  memory: "Жұбын тап",
                  count: "Заттарды сана",
                  odd: "Артығын тап",
                  shadow: "Жануарды таны",
                  puzzle: "Суретті құрастыр"
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

          {selected === "memory" && (
            <>
              <h2>{ru ? "Найди одинаковые картинки" : "Бірдей суреттерді тап"}</h2>
              <p>{ru ? "Открывай карточки по одной и находи пары." : "Карточкаларды бір-бірден ашып, жұптарын тап."}</p>
              <div className="memory-grid">
                {memoryCards.map((card, index) => (
                  <button key={index} className={`memory-card ${matched.includes(index) ? "matched" : ""}`} onClick={() => flipCard(index)}>
                    {opened.includes(index) || matched.includes(index) ? card : "❔"}
                  </button>
                ))}
              </div>
              {matched.length === memoryCards.length && <h3>🏆 {ru ? "Ты нашёл все пары! Молодец!" : "Барлық жұпты таптың! Жарайсың!"}</h3>}
            </>
          )}

          {selected === "count" && (
            <>
              <h2>{ru ? "Сколько предметов ты видишь?" : "Неше зат көріп тұрсың?"}</h2>
              <div className="big-items">{Array.from({ length: countTasks[countIndex].count }).map((_, i) => <span key={i}>{countTasks[countIndex].emoji}</span>)}</div>
              <div className="answers">
                {[1, 2, 3, 4, 5, 6].map((n) => <button key={n} onClick={() => answerCount(n)}>{n}</button>)}
              </div>
            </>
          )}

          {selected === "odd" && (
            <>
              <h2>{ru ? "Найди лишнюю картинку" : "Артық суретті тап"}</h2>
              <p>{ru ? oddTasks[oddIndex].hint : "Артық суретті анықта."}</p>
              <div className="picture-answers">
                {oddTasks[oddIndex].items.map((item, index) => <button key={index} onClick={() => answerOdd(index)}>{item}</button>)}
              </div>
            </>
          )}

          {selected === "shadow" && (
            <>
              <h2>{ru ? "Кто спрятался?" : "Кім жасырынды?"}</h2>
              <div className="shadow">{shadowTasks[shadowIndex].shadow}</div>
              <p>{ru ? "Найди такое же животное." : "Осындай жануарды тап."}</p>
              <div className="picture-answers">
                {shadowTasks[shadowIndex].options.map((item, index) => <button key={index} onClick={() => answerShadow(index)}>{item}</button>)}
              </div>
            </>
          )}

          {selected === "puzzle" && (
            <>
              <h2>{ru ? "Собери картинку!" : "Суретті құрастыр!"}</h2>
              <p>{ru ? "Посмотри на образец. Нажми на две части, чтобы поменять их местами." : "Үлгіге қара. Екі бөлікті басып, орындарын ауыстыр."}</p>
              <div className="puzzle-reference">
                <span>{ru ? "Образец:" : "Үлгі:"}</span>
                <div className="reference-pieces">
                  {puzzlePicture.map((piece, index) => <span key={index}>{piece}</span>)}
                </div>
              </div>
              <div className="puzzle-board">
                {puzzleTiles.map((piece, index) => (
                  <button
                    key={index}
                    className={`puzzle-tile ${puzzleSelected === index ? "chosen" : ""} ${puzzleSolved ? "correct" : ""}`}
                    onClick={() => selectPuzzleTile(index)}
                  >
                    {piece}
                  </button>
                ))}
              </div>
              <p className="moves">{ru ? "Перестановок:" : "Ауыстыру саны:"} {puzzleMoves}</p>
              {puzzleSolved && <h3>🏆 {ru ? "Молодец! Ты собрал картинку!" : "Жарайсың! Суретті құрастырдың!"}</h3>}
              <button className="again" onClick={restartPuzzle}>{ru ? "Перемешать и начать снова ↻" : "Араластырып, қайта бастау ↻"}</button>
            </>
          )}

          {message && <div className="message">{message}</div>}
          {selected !== "puzzle" && (
            <button className="again" onClick={() => startGame(selected)}>{ru ? "Начать заново ↻" : "Қайта бастау ↻"}</button>
          )}
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
        .hero-art{font-size:45px;line-height:1.7}
        h2{font-size:27px;margin:15px 0 22px}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:17px}
        .game-card{border:2px solid transparent;border-radius:23px;padding:22px;min-height:225px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;color:#30496b;cursor:pointer;transition:.2s}
        .game-card:hover{transform:translateY(-5px);border-color:#8da8d7}
        .game-emoji{font-size:48px;margin-bottom:14px}.game-card b{font-size:18px}.game-card small{margin-top:9px;line-height:1.5;color:#6d7f98}
        .play{margin-top:auto;padding-top:18px;color:#416ca8;font-weight:900}
        .play-area{margin:25px 0;padding:25px;border:2px solid #e7edf5;border-radius:25px;background:#fffdf9;text-align:center;min-height:390px}
        .back{float:left}.score{display:inline-block;background:#fff1c9;padding:10px 15px;border-radius:15px;font-weight:900}
        .memory-grid{max-width:560px;margin:25px auto;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .memory-card{height:105px;border:0;border-radius:18px;background:#e6edff;font-size:40px;cursor:pointer}
        .memory-card.matched{background:#dcf4e3}
        .big-items{display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin:35px auto;font-size:65px;max-width:500px}
        .answers,.picture-answers{display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin:25px auto}
        .answers button,.picture-answers button{width:85px;height:85px;border:2px solid #e2eaf6;border-radius:20px;background:#eef3ff;font-size:38px;cursor:pointer}
        .answers button{font-weight:900;color:#416ca8}
        .picture-answers button{background:#fff0d8}
        .shadow{font-size:100px;filter:grayscale(1);opacity:.7;margin:20px}
        .message{margin:20px auto;padding:15px;background:#e5f6e9;border-radius:15px;font-size:18px;font-weight:900;max-width:500px}
        .again{margin-top:20px;border:0;border-radius:14px;padding:13px 20px;background:#ffdf83;color:#405b83;font-weight:900;cursor:pointer}
        .puzzle-reference{display:flex;flex-direction:column;align-items:center;gap:8px;margin:20px auto;color:#687d9a;font-weight:700}
        .reference-pieces{display:grid;grid-template-columns:repeat(2,55px);gap:4px}
        .reference-pieces span{height:45px;display:grid;place-items:center;background:#f0eaff;border-radius:9px;font-size:25px}
        .puzzle-board{display:grid;grid-template-columns:repeat(2,minmax(100px,145px));gap:10px;justify-content:center;margin:25px auto}
        .puzzle-tile{height:125px;border:3px solid #e2d8fa;border-radius:18px;background:#eee7ff;font-size:58px;cursor:pointer;transition:.15s}
        .puzzle-tile.chosen{border-color:#7c63c7;background:#dcd0ff;transform:scale(.96)}
        .puzzle-tile.correct{background:#ddf5e5;border-color:#8ac9a0}
        .moves{color:#71829a;font-weight:700}
        footer{text-align:center;padding:30px;color:#8a98aa;border-top:2px dashed #e8e4dc;margin-top:35px}
        @media(max-width:800px){.grid{grid-template-columns:repeat(2,1fr)}.hero-art{font-size:32px}}
        @media(max-width:520px){.games{padding:15px}.hero{padding:22px;flex-direction:column;align-items:flex-start}.grid{grid-template-columns:1fr 1fr;gap:10px}.game-card{padding:15px;min-height:200px}.memory-card{height:75px;font-size:30px}.big-items{font-size:45px}.play-area{padding:15px}.puzzle-tile{height:105px;font-size:48px}}
      `}</style>
    </main>
  );
}
