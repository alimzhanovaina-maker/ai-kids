 "use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, BookOpen, Brain, ClipboardList, Gamepad2, HeartHandshake,
  Image as ImageIcon, Languages, Lightbulb, Menu, Music2, Printer,
  Sparkles, Speech, WandSparkles, X
} from "lucide-react";

type Lang = "ru" | "kz";

const copy = {
  ru: {
    nav: ["Возможности", "Тарифы", "Мастерская"],
    login: "Войти", signup: "Регистрация", badge: "ТВОЯ ТВОРЧЕСКАЯ ЛАБОРАТОРИЯ",
    title: "Идеи для маленьких исследователей!",
    subtitle: "Создавайте дидактические игры, сказки, рабочие листы и занятия с AI-помощником. На русском и казахском языках.",
    start: "Начать бесплатно", explore: "Посмотреть мастерскую",
    eyebrow: "ВСЁ ДЛЯ ТВОРЧЕСТВА И ОБУЧЕНИЯ",
    section: "Что можно создавать?",
    sectionText: "От первой идеи до готового материала для занятия — в одном пространстве.",
    plans: "Выбери свой формат",
    plansText: "Начни бесплатно и расширяй возможности по мере необходимости.",
    free: "Бесплатный старт", freeDesc: "Попробуйте основные инструменты и создавайте первые материалы.",
    pro: "AI KIDS PRO", proDesc: "Больше возможностей для активной работы и авторских разработок.",
    soon: "Скоро доступно", create: "Создать аккаунт", footer: "AI KIDS · Твори с заботой о детях",
    items: [
      ["Дидактические игры", "Игры с правилами, логические задания и игровые сценарии."],
      ["Авторские сказки", "Добрые истории, вопросы для обсуждения и задания по сюжету."],
      ["Иллюстрации", "Идеи для плакатов, раскрасок и наглядных пособий."],
      ["Карточки для печати", "Тематические наборы, сортировка и задания на соответствие."],
      ["Рабочие листы", "Упражнения на внимание, речь, логику и математику."],
      ["КСП и конспекты", "Структура занятия, цели, этапы и необходимые материалы."],
      ["Речь и развитие", "Игры для словаря, связной речи и звукового внимания."],
      ["Материалы для ООП", "Визуальные подсказки и адаптированные задания."],
      ["Музыка и движение", "Песенки, ритмические игры и музыкальные разминки."]
    ],
    age: "Для детей 3–6 лет", bilingual: "Қазақша + Русский",
    freePoints: ["Базовые инструменты", "Первые AI-генерации", "Сохранение проектов"],
    proPoints: ["Расширенные генераторы", "Печатные и интерактивные материалы", "Библиотека и история проектов"]
  },
  kz: {
    nav: ["Мүмкіндіктер", "Тарифтер", "Шеберхана"],
    login: "Кіру", signup: "Тіркелу", badge: "СЕНІҢ ШЫҒАРМАШЫЛЫҚ ЗЕРТХАНАҢ",
    title: "Кішкентай зерттеушілерге арналған идеялар!",
    subtitle: "AI көмекшісімен дидактикалық ойындар, ертегілер, жұмыс парақтары мен сабақтар жасаңыз. Қазақ және орыс тілдерінде.",
    start: "Тегін бастау", explore: "Шеберхананы көру",
    eyebrow: "ШЫҒАРМАШЫЛЫҚ ПЕН ОҚУҒА АРНАЛҒАН БАРЛЫҒЫ",
    section: "Нені жасауға болады?",
    sectionText: "Алғашқы идеядан дайын оқу материалына дейін — бір кеңістікте.",
    plans: "Өзіңе ыңғайлы жоспарды таңда",
    plansText: "Тегін бастап, қажетіне қарай мүмкіндіктерді кеңейт.",
    free: "Тегін бастау", freeDesc: "Негізгі құралдарды қолданып, алғашқы материалдарыңызды жасаңыз.",
    pro: "AI KIDS PRO", proDesc: "Белсенді жұмыс пен авторлық әзірлемелерге арналған кең мүмкіндіктер.",
    soon: "Жақында", create: "Аккаунт ашу", footer: "AI KIDS · Балаларға қамқорлықпен жаса",
    items: [
      ["Дидактикалық ойындар", "Ережелері бар ойындар, логикалық тапсырмалар мен ойын сценарийлері."],
      ["Авторлық ертегілер", "Жақсы оқиғалар, талқылау сұрақтары және сюжеттік тапсырмалар."],
      ["Иллюстрациялар", "Плакаттар, боямақтар және көрнекі құралдарға арналған идеялар."],
      ["Басып шығаруға арналған карточкалар", "Тақырыптық жинақтар, сұрыптау және сәйкестендіру тапсырмалары."],
      ["Жұмыс парақтары", "Зейін, сөйлеу, логика және математикаға арналған жаттығулар."],
      ["ҚМЖ және сабақ жоспарлары", "Сабақ құрылымы, мақсаттары, кезеңдері мен қажетті материалдар."],
      ["Сөйлеу және дамыту", "Сөздік қор, байланыстырып сөйлеу және дыбысты ажыратуға арналған ойындар."],
      ["ЕБҚ бар балаларға", "Көрнекі нұсқаулар мен бейімделген тапсырмалар."],
      ["Музыка және қимыл", "Әндер, ырғақты ойындар және музыкалық сергіту сәттері."]
    ],
    age: "3–6 жастағы балаларға", bilingual: "Қазақша + Русский",
    freePoints: ["Негізгі құралдар", "Алғашқы AI генерациялары", "Жобаларды сақтау"],
    proPoints: ["Кеңейтілген генераторлар", "Баспа және интерактивті материалдар", "Жобалар кітапханасы мен тарихы"]
  }
};

const icons = [Gamepad2, BookOpen, ImageIcon, Printer, ClipboardList, ClipboardList, Speech, HeartHandshake, Music2];
const colors = ["peach", "pink", "blue", "mint", "lavender", "yellow", "sky", "rose", "lime"];

export default function Home() {
  const [lang, setLang] = useState<Lang>("ru");
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = copy[lang];

  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-symbol"><Sparkles size={23} fill="currentColor" /></span>
          <span>AI KIDS</span>
        </Link>
        <nav className="desktop-nav" aria-label="Основная навигация">
          <a href="#features">{t.nav[0]}</a>
          <a href="#plans">{t.nav[1]}</a>
          <Link href="/studio">{t.nav[2]}</Link>
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
        </nav>
      )}

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-label"><span className="rainbow-dot">✦</span>{t.badge}</div>
          <h1>{t.title}</h1>
          <p className="hero-description">{t.subtitle}</p>
          <div className="hero-actions">
            <Link className="button button-yellow" href="/signup">{t.start}<ArrowRight size={18} /></Link>
            <Link className="button button-white" href="/studio">{t.explore}</Link>
          </div>
          <div className="hero-meta">
            <span><HeartHandshake size={16}/>{t.age}</span>
            <span><Languages size={16}/>{t.bilingual}</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="hero-spark spark-one">✦</div>
          <div className="hero-spark spark-two">✧</div>
          <div className="hero-book"><BookOpen size={82} strokeWidth={1.35}/></div>
          <div className="floating-chip chip-game"><Gamepad2 size={23}/></div>
          <div className="floating-chip chip-star"><Sparkles size={21}/></div>
          <div className="floating-chip chip-brain"><Brain size={23}/></div>
        </div>
      </section>

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
          {t.items.map(([title, desc], i) => {
            const Icon = icons[i];
            return (
              <Link href={`/studio?type=${["game","story","illustration","cards","worksheet","lesson","author","author","author"][i]}`} className="feature-card" key={title}>
                <div className={`feature-icon ${colors[i]}`}><Icon size={25} strokeWidth={1.9}/></div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="card-arrow"><ArrowRight size={17}/></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="plans-section" id="plans">
        <div className="section-heading centered-heading">
          <div>
            <span className="section-eyebrow">{lang === "ru" ? "ПОНЯТНЫЕ ВОЗМОЖНОСТИ" : "ТҮСІНІКТІ МҮМКІНДІКТЕР"}</span>
            <h2>{t.plans}</h2>
            <p>{t.plansText}</p>
          </div>
        </div>
        <div className="plans-grid">
          <article className="plan-card">
            <span className="plan-tag free-tag">FREE</span>
            <h3>{t.free}</h3>
            <p>{t.freeDesc}</p>
            <ul>{t.freePoints.map(x => <li key={x}>{x}</li>)}</ul>
            <Link className="button button-quiet plan-button" href="/signup">{t.create}<ArrowRight size={17}/></Link>
          </article>
          <article className="plan-card pro-card">
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
        <span className="footer-languages">Қазақша · Русский</span>
      </footer>
    </main>
  );
}
