
"use client";

import { useState } from "react";
import Link from "next/link";

type Task = {
  items: string[];
  answer: number;
  hint: string;
};

type ShadowTask = {
  animal: string;
  options: string[];
  answer: number;
};

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const games = [
  { id: "memory", title: "Найди пару", emoji: "🧩", color: "#fce4f0", desc: "Найди одинаковые картинки" },
  { id: "count", title: "Посчитай предметы", emoji: "🔢", color: "#e3efff", desc: "Посчитай предметы" },
  { id: "odd", title: "Найди лишнее", emoji: "🔎", color: "#e1f5e8", desc: "Найди лишнюю картинку" },
  { id: "shadow", title: "Угадай животное", emoji: "🐾", color: "#fff0d8", desc: "Угадай животное" },
  { id: "puzzle", title: "Собери картинку", emoji: "🎨", color: "#eee5ff", desc: "Собери красивую картинку" },
];

const memoryPool = [
  "🐱", "🐶", "🐰", "🦊", "🐸", "🐻", "🦁", "🐼",
  "🐵", "🐯", "🐮", "🐷", "🐨", "🐔", "🦉", "🐢",
  "🦋", "🐝", "🐞", "🐬", "🐙", "🦄", "🐘", "🦒",
  "🍎", "🍓", "🍐", "🍌", "🍇", "🍉", "🍒", "🥕",
  "🌻", "🌷", "🌈", "⭐", "🚗", "🚂", "✈️", "⚽",
];

const countObjects = [
  "🍎", "⭐", "🐥", "🍓", "🚗", "🌸", "🐠", "🍐",
  "🦋", "🍪", "🐸", "🌼", "🎈", "🍋", "🐞", "🚂",
  "🥕", "🐰", "🌙", "⚽",
];

const oddPool: Task[] = [
  { items: ["🐶", "🐱", "🐰", "🚗"], answer: 3, hint: "Найди транспорт среди животных." },
  { items: ["🍎", "🍐", "🍌", "🐟"], answer: 3, hint: "Найди того, кто не является фруктом." },
  { items: ["🚗", "🚌", "🚲", "🌷"], answer: 3, hint: "Найди то, что не является транспортом." },
  { items: ["🥕", "🥔", "🍅", "🐻"], answer: 3, hint: "Найди животное среди овощей." },
  { items: ["🐟", "🐬", "🦀", "✈️"], answer: 3, hint: "Найди то, что не живёт в воде." },
  { items: ["🌞", "⭐", "🌙", "🍓"], answer: 3, hint: "Найди то, что не находится в небе." },
  { items: ["👕", "👖", "👗", "🍉"], answer: 3, hint: "Найди то, что не является одеждой." },
  { items: ["✏️", "📚", "📏", "🐘"], answer: 3, hint: "Найди животное среди школьных принадлежностей." },
  { items: ["🌹", "🌷", "🌻", "🚂"], answer: 3, hint: "Найди то, что не является цветком." },
  { items: ["🥛", "🧀", "🧈", "🦊"], answer: 3, hint: "Найди животное среди продуктов." },
  { items: ["🚒", "🚑", "🚓", "🐸"], answer: 3, hint: "Найди животное среди машин." },
  { items: ["🐝", "🦋", "🐞", "🍍"], answer: 3, hint: "Найди фрукт среди насекомых." },
];

const shadowPool: ShadowTask[] = [
  { animal: "🐱", options: ["🐱", "🐶", "🐰"], answer: 0 },
  { animal: "🐸", options: ["🐻", "🐸", "🦊"], answer: 1 },
  { animal: "🦋", options: ["🐝", "🦋", "🐞"], answer: 1 },
  { animal: "🦁", options: ["🐯", "🐮", "🦁"], answer: 2 },
  { animal: "🐘", options: ["🦒", "🐘", "🐼"], answer: 1 },
  { animal: "🐰", options: ["🐰", "🐭", "🐱"], answer: 0 },
  { animal: "🐢", options: ["🐍", "🐢", "🐊"], answer: 1 },
  { animal: "🐬", options: ["🐟", "🦈", "🐬"], answer: 2 },
  { animal: "🦉", options: ["🦉", "🐧", "🦆"], answer: 0 },
  { animal: "🐵", options: ["🐻", "🐵", "🐨"], answer: 1 },
  { animal: "🦒", options: ["🦓", "🦒", "🐴"], answer: 1 },
  { animal: "🐙", options: ["🦀", "🐠", "🐙"], answer: 2 },
];

const scenes = [
  { name: "Лес", emoji: "🦊", sky: "#bceaff", ground: "#80cf76", extra: "🌳" },
  { name: "Сад", emoji: "🐰", sky: "#ffe0ed", ground: "#a8dc82", extra: "🌷" },
  { name: "Море", emoji: "🐬", sky: "#a9e6ff", ground: "#54b9df", extra: "🐠" },
  { name: "Ферма", emoji: "🐮", sky: "#fff0bd", ground: "#9bd879", extra: "🐥" },
  { name: "Саванна", emoji: "🦁", sky: "#ffd9a2", ground: "#d8c16e", extra: "🌴" },
  { name: "Космос", emoji: "🚀", sky: "#333c80", ground: "#6d70bb", extra: "⭐" },
];

function makeSceneImage(scene: typeof scenes[number]) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="${scene.sky}"/>
    <circle cx="490" cy="105" r="48" fill="#fff6ae"/>
    <path d="M0 370 Q150 290 300 370 T600 350 V600 H0Z" fill="${scene.ground}"/>
    <path d="M0 465 Q160 390 320 465 T600 435 V600 H0Z" fill="#ffffff25"/>
    <text x="300" y="390" font-size="205" text-anchor="middle" dominant-baseline="middle">${scene.emoji}</text>
    <text x="115" y="170" font-size="75" text-anchor="middle">☁️</text>
    <text x="475" y="270" font-size="82" text-anchor="middle">${scene.extra}</text>
    <text x="300" y="540" font-size="36" font-family="Arial" font-weight="bold" fill="#ffffff" text-anchor="middle">${scene.name}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeMemoryDeck() {
  return shuffle(memoryPool).slice(0, 6).flatMap(item => [item, item]).sort(() => Math.random() - 0.5);
}

function makeCountTask() {
  const emoji = countObjects[Math.floor(Math.random() * countObjects.length)];
  const count = Math.floor(Math.random() * 10) + 1;
  return { emoji, count };
}

function makeCountOptions(answer: number) {
  const values = new Set([answer]);
  while (values.size < 4) {
    values.add(Math.max(1, Math.min(10, answer + Math.floor(Math.random() * 7) - 3)));
  }
  return shuffle([...values]);
}

function makePuzzle() {
  const scene = scenes[Math.floor(Math.random() * scenes.length)];
  const image = makeSceneImage(scene);
  const tiles = shuffle([0, 1, 2, 3]);
  if (tiles.every((v, i) => v === i)) [tiles[0], tiles[1]] = [tiles[1], tiles[0]];
  return { scene, image, tiles };
}

export default function GamesPage() {
  const [selected, setSelected] = useState("");
  const [language, setLanguage] = useState<"ru" | "kz">("ru");
  const [memoryCards, setMemoryCards] = useState<string[]>(makeMemoryDeck());
  const [opened, setOpened] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [countTask, setCountTask] = useState(makeCountTask());
  const [countOptions, setCountOptions] = useState(makeCountOptions(countTask.count));
  const [oddTasks, setOddTasks] = useState<Task[]>(shuffle(oddPool));
  const [oddIndex, setOddIndex] = useState(0);
  const [shadowTasks, setShadowTasks] = useState<ShadowTask[]>(shuffle(shadowPool));
  const [shadowIndex, setShadowIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [puzzle, setPuzzle] = useState(makePuzzle());
  const [chosen, setChosen] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const ru = language === "ru";
  const solved = puzzle.tiles.every((tile, index) => tile === index);
  const currentOdd = oddTasks[oddIndex];
  const currentShadow = shadowTasks[shadowIndex];

  function startGame(id: string) {
    setSelected(id);
    setOpened([]);
    setMatched([]);
    setMemoryCards(makeMemoryDeck());
    setCountTask(makeCountTask());
    setCountOptions(makeCountOptions(makeCountTask().count));
    setOddTasks(shuffle(oddPool));
    setOddIndex(0);
    setShadowTasks(shuffle(shadowPool));
    setShadowIndex(0);
    setScore(0);
    setMessage("");
    setPuzzle(makePuzzle());
    setChosen(null);
    setMoves(0);
    setLocked(false);
  }

  function flipCard(index: number) {
    if (locked || opened.length === 2 || opened.includes(index) || matched.includes(index)) return;
    const next = [...opened, index];
    setOpened(next);

    if (next.length === 2) {
      setLocked(true);
      if (memoryCards[next[0]] === memoryCards[next[1]]) {
        setMatched(old => [...old, ...next]);
        setScore(old => old + 1);
        setMessage(ru ? "Молодец! Нашёл пару! 🌟" : "Жарайсың! Жұбын таптың! 🌟");
        setOpened([]);
        setLocked(false);
      } else {
        setMessage(ru ? "Попробуй ещё раз!" : "Қайталап көр!");
        setTimeout(() => {
          setOpened([]);
          setMessage("");
          setLocked(false);
        }, 850);
      }
    }
  }

  function nextCount() {
    const next = makeCountTask();
    setCountTask(next);
    setCountOptions(makeCountOptions(next.count));
  }

  function answerCount(value: number) {
    if (value !== countTask.count) {
      setMessage(ru ? "Попробуй ещё раз 😊" : "Қайталап көр 😊");
      return;
    }
    setScore(old => old + 1);
    setMessage(ru ? "Правильно! Отлично! 🎉" : "Дұрыс! Тамаша! 🎉");
    setTimeout(() => {
      setMessage("");
      nextCount();
    }, 650);
  }

  function answerOdd(value: number) {
    if (value !== currentOdd.answer) {
      setMessage(ru ? "Подумай ещё немножко!" : "Тағы ойланып көр!");
      return;
    }
    setScore(old => old + 1);
    setMessage(ru ? "Верно! Ты внимательный! ⭐" : "Дұрыс! Сен зерексің! ⭐");
    setTimeout(() => {
      setMessage("");
      if (oddIndex + 1 >= oddTasks.length) {
        setOddTasks(shuffle(oddPool));
        setOddIndex(0);
      } else {
        setOddIndex(old => old + 1);
      }
    }, 650);
  }

  function answerShadow(value: number) {
    if (value !== currentShadow.answer) {
      setMessage(ru ? "Попробуй ещё!" : "Қайталап көр!");
      return;
    }
    setScore(old => old + 1);
    setMessage(ru ? "Ты угадал! 🥳" : "Дұрыс таптың! 🥳");
    setTimeout(() => {
      setMessage("");
      if (shadowIndex + 1 >= shadowTasks.length) {
        setShadowTasks(shuffle(shadowPool));
        setShadowIndex(0);
      } else {
        setShadowIndex(old => old + 1);
      }
    }, 650);
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
    const next = [...puzzle.tiles];
    [next[chosen], next[index]] = [next[index], next[chosen]];
    setPuzzle(old => ({ ...old, tiles: next }));
    setChosen(null);
    setMoves(old => old + 1);
    if (next.every((tile, i) => tile === i)) {
      setScore(old => old + 1);
      setMessage(ru ? "Ура! Картинка собрана! 🏆" : "Алақай! Сурет құрастырылды! 🏆");
    } else {
      setMessage(ru ? "Отлично! Продолжай собирать." : "Жақсы! Құрастыруды жалғастыр.");
    }
  }

  function restartPuzzle() {
    setPuzzle(makePuzzle());
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
              {memoryCards.map((card, index) => (
                <button key={index} className={`memory-card ${matched.includes(index) ? "matched" : ""}`} onClick={() => flipCard(index)}>
                  {opened.includes(index) || matched.includes(index) ? card : "❔"}
                </button>
              ))}
            </div>
            {matched.length === memoryCards.length && <h3>🏆 {ru ? "Ты нашёл все пары! Молодец!" : "Барлық жұпты таптың! Жарайсың!"}</h3>}
          </>}

          {selected === "count" && <>
            <h2>{ru ? "Сколько предметов ты видишь?" : "Неше зат көріп тұрсың?"}</h2>
            <div className="big-items">
              {Array.from({ length: countTask.count }).map((_, i) => <span key={i}>{countTask.emoji}</span>)}
            </div>
            <div className="answers">
              {countOptions.map(n => <button key={n} onClick={() => answerCount(n)}>{n}</button>)}
            </div>
          </>}

          {selected === "odd" && <>
            <h2>{ru ? "Найди лишнюю картинку" : "Артық суретті тап"}</h2>
            <p>{ru ? currentOdd.hint : "Артық суретті анықта."}</p>
            <div className="picture-answers">
              {shuffle(currentOdd.items.map((item, index) => ({ item, index }))).map(({ item, index }) => (
                <button key={index} onClick={() => answerOdd(index)}>{item}</button>
              ))}
            </div>
          </>}

          {selected === "shadow" && <>
            <h2>{ru ? "Кто спрятался?" : "Кім жасырынды?"}</h2>
            <div className="shadow">{currentShadow.animal}</div>
            <p>{ru ? "Найди такое же животное." : "Осындай жануарды тап."}</p>
            <div className="picture-answers">
              {shuffle(currentShadow.options.map((item, index) => ({ item, index }))).map(({ item, index }) => (
                <button key={index} onClick={() => answerShadow(index)}>{item}</button>
              ))}
            </div>
          </>}

          {selected === "puzzle" && <>
            <h2>{ru ? `Собери картинку: ${puzzle.scene.name}!` : "Суретті құрастыр!"}</h2>
            <p>{ru ? "Посмотри на образец. Выбирай две части, чтобы поменять их местами." : "Үлгіге қара. Екі бөлікті таңдап, орындарын ауыстыр."}</p>
            <div className="puzzle-layout">
              <div className="sample">
                <b>{ru ? "Образец:" : "Үлгі:"}</b>
                <div className="sample-image" style={{ backgroundImage: `url("${puzzle.image}")` }} />
              </div>
              <div className="puzzle-main">
                <div className="puzzle-board">
                  {puzzle.tiles.map((tile, index) => (
                    <button
                      key={index}
                      aria-label={`Фрагмент ${index + 1}`}
                      className={`puzzle-tile ${chosen === index ? "chosen" : ""} ${solved ? "correct" : ""}`}
                      onClick={() => selectTile(index)}
                      style={{
                        backgroundImage: `url("${puzzle.image}")`,
                        backgroundPosition: tilePositions[tile]
                      }}
                    />
                  ))}
                </div>
                <p className="moves">{ru ? "Перестановок:" : "Ауыстыру саны:"} {moves}</p>
              </div>
            </div>
            {solved && <h3>🏆 {ru ? "Молодец! Ты собрал картинку!" : "Жарайсың! Суретті құрастырдың!"}</h3>}
            <button className="again" onClick={restartPuzzle}>{ru ? "Другая картинка ↻" : "Басқа сурет ↻"}</button>
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
        .big-items{display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin:35px auto;font-size:55px;max-width:600px}
        .answers,.picture-answers{display:flex;justify-content:center;flex-wrap:wrap;gap:15px;margin:25px auto}
        .answers button,.picture-answers button{width:85px;height:85px;border:2px solid #e2eaf6;border-radius:20px;background:#eef3ff;font-size:38px;cursor:pointer}
        .answers button{font-weight:900;color:#416ca8}.picture-answers button{background:#fff0d8}
        .shadow{font-size:100px;filter:grayscale(1);opacity:.7;margin:20px}
        .message{margin:20px auto;padding:15px;background:#e5f6e9;border-radius:15px;font-size:18px;font-weight:900;max-width:500px}
        .again{margin-top:20px;border:0;border-radius:14px;padding:13px 20px;background:#ffdf83;color:#405b83;font-weight:900;cursor:pointer}
        .puzzle-layout{display:flex;justify-content:center;align-items:center;gap:35px;flex-wrap:wrap;margin:25px auto}
        .sample{padding:15px;background:#f5efff;border-radius:20px;display:flex;flex-direction:column;gap:10px}
        .sample-image{width:210px;height:210px;border-radius:14px;background-size:cover;background-position:center}
        .puzzle-board{width:min(440px,90vw);aspect-ratio:1;display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:auto}
        .puzzle-tile{border:4px solid #e2d8fa;border-radius:16px;background-repeat:no-repeat;background-size:200% 200%;cursor:pointer;min-width:0;min-height:0;transition:.15s}
        .puzzle-tile.chosen{border-color:#8057dc;box-shadow:0 0 0 4px #d8c7ff;transform:scale(.97)}
        .puzzle-tile.correct{border-color:#83c99a}
        .moves{color:#71829a;font-weight:700;margin-top:18px}
        footer{text-align:center;padding:30px;color:#8a98aa;border-top:2px dashed #e8e4dc;margin-top:35px}
        @media(max-width:800px){.grid{grid-template-columns:repeat(2,1fr)}.hero-art{font-size:32px}}
        @media(max-width:520px){.games{padding:15px}.hero{padding:22px;flex-direction:column;align-items:flex-start}.grid{grid-template-columns:1fr 1fr;gap:10px}.game-card{padding:15px;min-height:200px}.memory-card{height:75px;font-size:30px}.big-items{font-size:38px}.play-area{padding:15px}.puzzle-layout{gap:18px}.sample-image{width:150px;height:150px}}
      `}</style>
    </main>
  );
}
