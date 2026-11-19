
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, BookOpen, Brain, ClipboardList, Gamepad2, HeartHandshake,
  Image as ImageIcon, Languages, Menu, Music2, Printer, Sparkles,
  Speech, WandSparkles, X, Star
} from "lucide-react";

type Lang = "ru" | "kz";

const copy = {
  ru: {
    nav: ["Возможности", "Тарифы", "Мастерская"],
    login: "Войти", signup: "Регистрация", badge: "ВОЛШЕБНАЯ МАСТЕРСКАЯ ДЛЯ ВОСПИТАТЕЛЕЙ",
    title: "Здесь рождаются большие идеи для маленьких!",
    subtitle: "Создавайте сказки, игры, карточки и целые занятия вместе с AI KIDS. Ярко, просто и на двух языках!",
    start: "Попробовать бесплатно", explore: "Заглянуть в мастерскую",
    eyebrow: "МИР ИДЕЙ, ИГР И ОТКРЫТИЙ",
    section: "Что будем создавать сегодня?",
    sectionText: "Выбирай волшебный инструмент — и превращай свою идею в готовое занятие.",
    plans: "Выбери свой волшебный набор",
    plansText: "Начни бесплатно, а когда захочется большего — открой PRO-возможности.",
    free: "Начни бесплатно", freeDesc: "Попробуй основные инструменты и создай свои первые материалы.",
    pro: "AI KIDS PRO", proDesc: "Больше творчества, расширенные генераторы и целая библиотека идей.",
    soon: "Скоро доступно", create: "Создать аккаунт", footer: "AI KIDS · Большие идеи для маленьких открытий",
    age: "Для детей 3–6 лет", bilingual: "Қазақша + Русский",
    items: [
      ["Дидактические игры", "Весёлые задания, игры с правилами и маленькие открытия.", "🧩", "game"],
      ["Авторские сказки", "Придумывай добрые истории с героями и приключениями.", "📚", "story"],
      ["Иллюстрации", "Плакаты, раскраски, картинки и наглядные пособия.", "🎨", "illustration"],
      ["Карточки для печати", "Красочные наборы для сортировки, поиска пар и игр.", "🖍️", "cards"],
      ["Рабочие листы", "Задания на внимание, речь, логику и математику.", "✏️", "worksheet"],
      ["КСП и конспекты", "Планы занятий, этапы, цели и подсказки воспитателю.", "📝", "lesson"],
      ["Речь и развитие", "Игры со словами, звуками, историями и общением.", "💬", "speech"],
      ["Материалы для ООП", "Наглядные подсказки и задания с учётом потребностей детей.", "🌈", "special"],
      ["Музыка и движение", "Ритмы, песенки, танцевальные паузы и разминки.", "🎵", "music"]
    ],
    freePoints: ["Основные инструменты", "Первые AI-генерации", "Сохранение проектов"],
    proPoints: ["Расширенные генераторы", "Печатные и интерактивные материалы", "Библиотека и история проектов"]
  },
  kz: {
    nav: ["Мүмкіндіктер", "Тарифтер", "Шеберхана"],
    login: "Кіру", signup: "Тіркелу", badge: "ТӘРБИЕШІЛЕРГЕ АРНАЛҒАН СИҚЫРЛЫ ШЕБЕРХАНА",
    title: "Кішкентайларға арналған үлкен идеялар!",
    subtitle: "AI KIDS көмегімен ертегілер, ойындар, карточкалар мен сабақтар жасаңыз. Жарқын, оңай және екі тілде!",
    start: "Тегін қолданып көру", explore: "Шеберханаға өту",
    eyebrow: "ИДЕЯЛАР, ОЙЫНДАР МЕН ЖАҢАЛЫҚТАР ӘЛЕМІ",
    section: "Бүгін не жасаймыз?",
    sectionText: "Сиқырлы құралды таңда — идеяңды дайын сабаққа айналдыр.",
    plans: "Өзіңе ыңғайлы жинақты таңда",
    plansText: "Тегін бастап, қажет болғанда PRO мүмкіндіктерін аш.",
    free: "Тегін баста", freeDesc: "Негізгі құралдарды қолданып, алғашқы материалдарыңды жаса.",
    pro: "AI KIDS PRO", proDesc: "Көбірек шығармашылық, кеңейтілген генераторлар мен идеялар кітапханасы.",
    soon: "Жақында", create: "Аккаунт ашу", footer: "AI KIDS · Кішкентай жаңалықтарға арналған үлкен идеялар",
    age: "3–6 жастағы балаларға", bilingual: "Қазақша + Русский",
    items: [
      ["Дидактикалық ойындар", "Көңілді тапсырмалар, ережелі ойындар мен жаңалықтар.", "🧩", "game"],
      ["Авторлық ертегілер", "Кейіпкерлері мен оқиғалары бар мейірімді ертегілер.", "📚", "story"],
      ["Иллюстрациялар", "Плакаттар, боямақтар, суреттер және көрнекі құралдар.", "🎨", "illustration"],
      ["Баспа карточкалары", "Топтастыруға, жұп табуға және ойындарға арналған жинақтар.", "🖍️", "cards"],
      ["Жұмыс парақтары", "Зейін, сөйлеу, логика және математика тапсырмалары.", "✏️", "worksheet"],
      ["ҚМЖ және конспектілер", "Сабақ жоспарлары, кезеңдері, мақсаттары мен кеңестер.", "📝", "lesson"],
      ["Сөйлеу және дамыту", "Сөздермен, дыбыстармен, әңгімелермен ойындар.", "💬", "speech"],
      ["ЕБҚ бар балаларға", "Көрнекі нұсқаулар мен бейімделген тапсырмалар.", "🌈", "special"],
      ["Музыка және қимыл", "Ырғақ, әндер, би үзілістері мен сергіту сәттері.", "🎵", "music"]
    ],
    freePoints: ["Негізгі құралдар", "Алғашқы AI генерациялары", "Жобаларды сақтау"],
    proPoints: ["Кеңейтілген генераторлар", "Баспа және интерактивті материалдар", "Жобалар кітапханасы мен тарихы"]
  }
};

const icons = [Gamepad2, BookOpen, ImageIcon, Printer, ClipboardList, ClipboardList, Speech, HeartHandshake, Music2];
const palettes = ["peach", "pink", "blue", "mint", "lavender", "yellow", "sky", "rose", "lime"];
const doodles = [
  ["🦊", "⭐", "🍄"], ["🐻", "🌙", "✨"], ["🦋", "🌼", "🖌️"],
  ["🐰", "🍓", "✂️"], ["🐸", "🔢", "☀️"], ["🦉", "📖", "🌟"],
  ["🐝", "💬", "🌷"], ["🐢", "💚", "🌈"], ["🐱", "🎶", "🎈"]
];

function Doodle({ emoji, extra, small = false }: { emoji: string; extra: string[]; small?: boolean }) {
  return (
    <div className={`doodle ${small ? "doodle-small" : ""}`} aria-hidden="true">
      <span className="doodle-orbit orbit-a" />
      <span className="doodle-orbit orbit-b" />
      <span className="doodle-main">{emoji}</span>
      <span className="doodle-extra extra-a">{extra[0]}</span>
      <span className="doodle-extra extra-b">{extra[1]}</span>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("ru");
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = copy[lang];

  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-symbol"><Sparkles size={24} fill="currentColor" /></span>
          <span>AI KIDS</span>
          <span className="brand-confetti">✦</span>
        </Link>
        <nav className="desktop-nav" aria-label="Основная навигация">
          <a href="#features">{t.nav[0]}</a>
          <a href="#plans">{t.nav[1]}</a>
          <Link href="/studio">{t.nav[2]}</Link>
          <Link href="/games">🎮 Онлайн-игры</Link>
        </nav>
        <div className="header-actions">
          <button className="language-switch" onClick={() => setLang(lang === "ru" ? "kz" : "ru")} aria-label="Переключить язык">
            <Languages size={17} /> {lang === "ru" ? "ҚАЗ" : "РУС"}
          </button>
          <Link className="button button-quiet" href="/login">{t.login}</Link>
          <Link className="button button-primary small-primary" href="/signup">{t.signup}</Link>
          <button className="mobile-menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Открыть меню">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <nav className="mobile-nav">
          <a href="#features" onClick={() => setMobileOpen(false)}>{t.nav[0]}</a>
          <a href="#plans" onClick={() => setMobileOpen(false)}>{t.nav[1]}</a>
          <Link href="/studio" onClick={() => setMobileOpen(false)}>{t.nav[2]}</Link>
          <Link href="/games" onClick={() => setMobileOpen(false)}>🎮 Онлайн-игры</Link>
        </nav>
      )}

      <section className="hero">
        <div className="hero-confetti confetti-one">✦</div>
        <div className="hero-confetti confetti-two">✿</div>
        <div className="hero-copy">
          <div className="hero-label"><span>🌈</span>{t.badge}</div>
          <h1>{t.title}</h1>
          <p className="hero-description">{t.subtitle}</p>
          <div className="hero-actions">
            <Link className="button button-yellow" href="/signup">{t.start}<ArrowRight size={18} /></Link>
            <Link className="button button-white" href="/studio">{t.explore}</Link>
            <Link className="button button-yellow" href="/games">🎮 Онлайн-игры</Link>
          </div>
          <div className="hero-meta">
            <span><HeartHandshake size={16}/>{t.age}</span>
            <span><Languages size={16}/>{t.bilingual}</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-rainbow">🌈</div>
          <div className="hero-book">📖</div>
          <div className="hero-fox">🦊</div>
          <div className="hero-bear">🐻</div>
          <div className="hero-pencil">✏️</div>
          <div className="hero-star star-a">⭐</div>
          <div className="hero-star star-b">✨</div>
          <div className="hero-cloud cloud-a">☁️</div>
          <div className="hero-cloud cloud-b">☁️</div>
          <div className="hero-sun">☀️</div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <span>🌼 ИГРАЙ</span><span>⭐ СОЗДАВАЙ</span><span>🦋 УЧИСЬ</span><span>🌈 ФАНТАЗИРУЙ</span><span>🍓 ТВОРИ</span>
      </div>

      <section className="features-section" id="features">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">{t.eyebrow}</span>
            <h2>{t.section}</h2>
            <p>{t.sectionText}</p>
          </div>
          <Link className="text-link" href="/studio">{t.nav[2]} <ArrowRight size={17}/></Link>
        </div>
        <div className="feature-grid">
          {t.items.map(([title, desc, emoji, route], i) => {
            const Icon = icons[i];
            return (
              <Link href={`/studio?type=${route}`} className={`feature-card card-${palettes[i]}`} key={title}>
                <div className="card-art">
                  <Doodle emoji={emoji} extra={doodles[i].slice(1)} small />
                  <span className="art-spark spark-left">✦</span>
                  <span className="art-spark spark-right">✧</span>
                </div>
                <div className={`feature-icon ${palettes[i]}`}><Icon size={21} strokeWidth={2}/></div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="card-arrow"><ArrowRight size={18}/></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="story-banner">
        <div className="story-art" aria-hidden="true"><span>🧚</span><span>🌷</span><span>🍄</span><span>🦋</span></div>
        <div>
          <span className="section-eyebrow">{lang === "ru" ? "НЕМНОГО ВОЛШЕБСТВА КАЖДЫЙ ДЕНЬ" : "КҮН САЙЫН СӘЛ ҒАЖАЙЫП"}</span>
          <h2>{lang === "ru" ? "Твоя фантазия — начало большого открытия!" : "Қиялың — үлкен жаңалықтың бастауы!"}</h2>
          <p>{lang === "ru" ? "Создавай материалы, которые хочется рассматривать, трогать, обсуждать и использовать снова." : "Қарауға, ұстауға, талқылауға және қайта қолдануға қызықты материалдар жаса."}</p>
        </div>
        <Link className="button button-yellow" href="/studio">{t.explore}<ArrowRight size={17}/></Link>
      </section>

      <section className="plans-section" id="plans">
        <div className="section-heading centered-heading">
          <div>
            <span className="section-eyebrow">{lang === "ru" ? "ТВОИ ВОЗМОЖНОСТИ" : "СЕНІҢ МҮМКІНДІКТЕРІҢ"}</span>
            <h2>{t.plans}</h2>
            <p>{t.plansText}</p>
          </div>
        </div>
        <div className="plans-grid">
          <article className="plan-card">
            <div className="plan-doodle">🐣</div>
            <span className="plan-tag free-tag">FREE</span>
            <h3>{t.free}</h3>
            <p>{t.freeDesc}</p>
            <ul>{t.freePoints.map(x => <li key={x}>{x}</li>)}</ul>
            <Link className="button button-quiet plan-button" href="/signup">{t.create}<ArrowRight size={17}/></Link>
          </article>
          <article className="plan-card pro-card">
            <div className="plan-doodle">🦄</div>
            <span className="plan-tag pro-tag"><WandSparkles size={14}/> PRO</span>
            <h3>{t.pro}</h3>
            <p>{t.proDesc}</p>
            <ul>{t.proPoints.map(x => <li key={x}>{x}</li>)}</ul>
            <span className="button button-primary plan-button disabled-button">{t.soon}</span>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <Link className="brand footer-brand" href="/"><span className="brand-symbol"><Sparkles size={19} fill="currentColor"/></span>AI KIDS</Link>
        <span>{t.footer}</span>
        <span className="footer-languages">🌈 Қазақша · Русский</span>
      </footer>
    </main>
  );
}
