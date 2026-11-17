import Link from "next/link";

const features = [
  { label: "Месячный лимит AI-генераций", start: "10", pro: "300" },
  { label: "Создание сказок и игр", start: true, pro: true },
  { label: "Карточки и рабочие листы", start: true, pro: true },
  { label: "Сохранение материалов", start: true, pro: true },
  { label: "Расширенный месячный лимит", start: false, pro: true },
  { label: "Приоритетная генерация", start: false, pro: "Будет добавлено" },
];

export default function PricingPage() {
  return (
    <main className="pricing-page">
      <header className="topbar">
        <Link href="/" className="brand"><span>✦</span> AI KIDS</Link>
        <nav>
          <Link href="/">Главная</Link>
          <Link href="/studio">Мастерская</Link>
          <Link href="/dashboard">Личный кабинет</Link>
        </nav>
      </header>

      <section className="intro">
        <span className="eyebrow">ТАРИФЫ AI KIDS</span>
        <h1>Выбери свой темп творчества 🌈</h1>
        <p>Начни бесплатно и переходи на расширенные возможности, когда они понадобятся.</p>
      </section>

      <section className="plans" aria-label="Сравнение тарифов">
        <article className="plan start">
          <div className="plan-icon">🌷</div>
          <span className="plan-label">ДЛЯ ЗНАКОМСТВА</span>
          <h2>START</h2>
          <p className="plan-desc">Основные инструменты, чтобы попробовать AI KIDS и создавать первые материалы.</p>
          <div className="price">Бесплатно</div>
          <div className="limit"><strong>10</strong><span>AI-генераций в месяц</span></div>
          <ul>
            <li>✓ Создание сказок и игр</li>
            <li>✓ Карточки и рабочие листы</li>
            <li>✓ Сохранение своих материалов</li>
            <li>✓ Русский и казахский языки</li>
          </ul>
          <Link href="/signup" className="plan-button secondary">Начать бесплатно</Link>
        </article>

        <article className="plan pro">
          <div className="popular">БОЛЬШЕ ВОЗМОЖНОСТЕЙ</div>
          <div className="plan-icon">✨</div>
          <span className="plan-label">ДЛЯ АКТИВНОГО ТВОРЧЕСТВА</span>
          <h2>AI KIDS PRO</h2>
          <p className="plan-desc">Больше генераций для регулярной подготовки занятий и наглядных материалов.</p>
          <div className="price">Скоро запуск</div>
          <div className="limit"><strong>300</strong><span>AI-генераций в месяц</span></div>
          <ul>
            <li>✓ Всё, что входит в START</li>
            <li>✓ Увеличенный лимит генераций</li>
            <li>✓ Больше возможностей для подготовки материалов</li>
            <li>◷ Дополнительные PRO-функции будут объявлены отдельно</li>
          </ul>
          <button className="plan-button primary" type="button" disabled>Подключение оплаты скоро</button>
        </article>
      </section>

      <section className="comparison">
        <h2>Сравнение возможностей</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Возможность</th><th>START</th><th>PRO</th></tr></thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.label}>
                  <td>{feature.label}</td>
                  <td>{feature.start === true ? "✓" : feature.start === false ? "—" : feature.start}</td>
                  <td>{feature.pro === true ? "✓" : feature.pro === false ? "—" : feature.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="notice">
        Важно: сейчас на странице показаны условия тарифов, предусмотренные платформой.
        Приём оплаты и автоматическое подключение PRO ещё не настроены. Кнопка PRO станет активной после подключения платёжного сервиса.
      </p>

      <footer><b>✦ AI KIDS</b><span>Большие идеи для маленьких открытий</span><span>Қазақша · Русский</span></footer>

      <style>{`
        * { box-sizing: border-box; }
        .pricing-page { max-width: 1120px; margin: 0 auto; padding: 22px 28px 40px; color: #294363; font-family: Nunito, system-ui, sans-serif; }
        .topbar { min-height: 58px; display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .brand { display:flex; align-items:center; gap:9px; color:#294363; font-size:22px; font-weight:1000; text-decoration:none; }
        .brand span { display:grid; place-items:center; width:39px; height:39px; border-radius:13px; background:#ffdc75; box-shadow:0 4px 0 #ebc25a; }
        nav { display:flex; gap:22px; font-size:13px; font-weight:900; }
        nav a { color:#647995; text-decoration:none; }
        nav a:hover { color:#df865f; }
        .intro { padding:48px 10px 30px; text-align:center; }
        .eyebrow,.plan-label { color:#df9564; font-size:10px; font-weight:1000; letter-spacing:1.3px; }
        .intro h1 { margin:12px 0 10px; font-size:clamp(30px,5vw,46px); line-height:1.12; letter-spacing:-1px; }
        .intro p { max-width:620px; margin:0 auto; color:#77879e; font-size:15px; line-height:1.6; }
        .plans { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:22px; max-width:850px; margin:0 auto 48px; align-items:stretch; }
        .plan { position:relative; padding:28px; border:2px solid #e8edf5; border-radius:25px; background:white; box-shadow:0 7px 0 #e9e5de; }
        .plan.start { background:linear-gradient(160deg,#fffaf0,#fff); }
        .plan.pro { border-color:#d9defb; background:linear-gradient(160deg,#f0f1ff,#fff); }
        .popular { position:absolute; top:-13px; right:22px; padding:7px 12px; border-radius:20px; background:#7c83ce; color:white; font-size:9px; font-weight:1000; letter-spacing:.7px; }
        .plan-icon { font-size:32px; margin-bottom:12px; }
        .plan h2 { margin:5px 0 8px; font-size:27px; font-weight:1000; }
        .plan-desc { min-height:65px; margin:0; color:#77879e; font-size:13px; line-height:1.55; }
        .price { margin:20px 0 12px; color:#426ba8; font-size:22px; font-weight:1000; }
        .limit { display:flex; align-items:center; gap:10px; padding:13px 14px; border-radius:14px; background:#ffffffc9; }
        .limit strong { color:#294363; font-size:29px; }
        .limit span { color:#71819a; font-size:12px; font-weight:800; }
        ul { display:grid; gap:12px; min-height:150px; margin:22px 0; padding:0; list-style:none; color:#526b8e; font-size:12px; line-height:1.45; }
        .plan-button { display:flex; width:100%; min-height:48px; align-items:center; justify-content:center; border:0; border-radius:13px; font:inherit; font-size:13px; font-weight:1000; text-decoration:none; }
        .plan-button.secondary { background:#ffdc75; color:#35527b; box-shadow:0 4px 0 #e8bd52; }
        .plan-button.primary { background:#7c83ce; color:white; opacity:.7; cursor:not-allowed; }
        .comparison { max-width:850px; margin:0 auto; }
        .comparison h2 { margin:0 0 17px; font-size:24px; }
        .table-wrap { overflow-x:auto; border:2px solid #e8edf5; border-radius:17px; background:white; }
        table { width:100%; border-collapse:collapse; font-size:12px; }
        th,td { padding:14px 16px; border-bottom:1px solid #edf0f5; text-align:left; }
        th { background:#f4f6fc; color:#526b8e; font-weight:1000; }
        td:not(:first-child),th:not(:first-child) { text-align:center; font-weight:900; }
        tr:last-child td { border-bottom:0; }
        .notice { max-width:850px; margin:22px auto 0; padding:14px 16px; border-radius:13px; background:#fff7e8; color:#8a7049; font-size:11px; line-height:1.6; }
        footer { display:flex; justify-content:space-between; gap:14px; margin-top:35px; padding-top:20px; border-top:2px dashed #eadfcb; color:#8390a4; font-size:11px; }
        footer b { color:#294363; font-size:16px; }
        @media(max-width:650px) { .pricing-page { padding:12px 15px 28px; } .topbar { flex-wrap:wrap; } nav { order:3; width:100%; gap:14px; flex-wrap:wrap; } .intro { padding:35px 0 24px; } .plans { grid-template-columns:1fr; gap:20px; } .plan-desc,ul { min-height:0; } footer { flex-direction:column; align-items:center; text-align:center; } }
      `}</style>
    </main>
  );
}
