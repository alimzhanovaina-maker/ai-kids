
import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="pricing-page">
      <header className="topbar">
        <Link href="/" className="brand">
          <span>✦</span> AI KIDS
        </Link>

        <nav>
          <Link href="/">Главная</Link>
          <Link href="/studio">Мастерская</Link>
          <Link href="/dashboard">Личный кабинет</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-icon">🌈</div>
        <span className="eyebrow">AI KIDS ДЛЯ ПЕДАГОГОВ</span>
        <h1>Все возможности — бесплатно!</h1>
        <p>
          Создавай сказки, игры, карточки и наглядные материалы
          для детей. Все инструменты AI KIDS доступны каждому
          зарегистрированному пользователю.
        </p>

        <div className="free-card">
          <div className="free-icon">🎁</div>
          <span className="free-label">ЕДИНЫЙ БЕСПЛАТНЫЙ ДОСТУП</span>
          <strong>20 генераций</strong>
          <span className="per-day">каждый день</span>

          <div className="free-divider" />

          <div className="features">
            <div>✓ Создание сказок и игр</div>
            <div>✓ Карточки и рабочие листы</div>
            <div>✓ Иллюстрации и персонажи</div>
            <div>✓ КСП и конспекты занятий</div>
            <div>✓ Сохранение материалов</div>
            <div>✓ Русский и казахский языки</div>
          </div>

          <Link href="/studio" className="start-button">
            ✨ Перейти в мастерскую
          </Link>
        </div>

        <div className="note">
          🌷 Лимит генераций обновляется ежедневно.
          Создавай новые материалы и сохраняй свои разработки
          в личном кабинете.
        </div>
      </section>

      <section className="bottom">
        <span>🧸</span>
        <h2>Твори, учись и вдохновляй!</h2>
        <p>AI KIDS — твой помощник в мире детского творчества.</p>
        <Link href="/signup">Создать аккаунт →</Link>
      </section>

      <footer>
        <b>✦ AI KIDS</b>
        <span>Большие идеи для маленьких открытий</span>
        <span>Қазақша · Русский</span>
      </footer>

      <style>{`
        * { box-sizing: border-box; }

        .pricing-page {
          max-width: 1120px;
          min-height: 100vh;
          margin: 0 auto;
          padding: 22px 28px 40px;
          color: #294363;
          font-family: Nunito, system-ui, sans-serif;
        }

        .topbar {
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #294363;
          font-size: 22px;
          font-weight: 1000;
          text-decoration: none;
        }

        .brand span {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border-radius: 13px;
          background: #ffdc75;
          box-shadow: 0 4px 0 #ebc25a;
        }

        nav {
          display: flex;
          gap: 22px;
          font-size: 13px;
          font-weight: 900;
        }

        nav a {
          color: #647995;
          text-decoration: none;
        }

        nav a:hover { color: #df865f; }

        .hero {
          padding: 48px 10px 35px;
          text-align: center;
        }

        .hero-icon {
          margin-bottom: 12px;
          font-size: 65px;
        }

        .eyebrow {
          color: #df9564;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 1.5px;
        }

        .hero h1 {
          max-width: 750px;
          margin: 13px auto;
          font-size: clamp(32px,5vw,48px);
          line-height: 1.12;
          letter-spacing: -1px;
        }

        .hero > p {
          max-width: 640px;
          margin: 0 auto;
          color: #77879e;
          font-size: 15px;
          line-height: 1.7;
        }

        .free-card {
          max-width: 480px;
          margin: 32px auto 0;
          padding: 32px;
          border: 2px solid #f2e6ce;
          border-radius: 27px;
          background: linear-gradient(155deg,#fff8e9,#fff);
          box-shadow: 0 8px 0 #e9e5de;
          text-align: center;
        }

        .free-icon { font-size: 42px; }

        .free-label {
          display: block;
          margin-top: 12px;
          color: #d39455;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 1px;
        }

        .free-card > strong {
          display: block;
          margin-top: 14px;
          color: #426ba8;
          font-size: 42px;
          font-weight: 1000;
        }

        .per-day {
          display: block;
          margin-top: 2px;
          color: #77879e;
          font-size: 14px;
          font-weight: 800;
        }

        .free-divider {
          height: 2px;
          margin: 24px 0;
          background: #f0e8d9;
        }

        .features {
          display: grid;
          gap: 13px;
          text-align: left;
          color: #526b8e;
          font-size: 13px;
          font-weight: 800;
        }

        .features div::first-letter {
          color: #58a77a;
        }

        .start-button {
          display: flex;
          min-height: 51px;
          align-items: center;
          justify-content: center;
          margin-top: 27px;
          border-radius: 14px;
          background: #ffdc75;
          color: #35527b;
          font-size: 14px;
          font-weight: 1000;
          text-decoration: none;
          box-shadow: 0 4px 0 #e8bd52;
        }

        .start-button:hover {
          transform: translateY(-1px);
        }

        .note {
          max-width: 480px;
          margin: 22px auto 0;
          color: #8793a5;
          font-size: 12px;
          line-height: 1.7;
        }

        .bottom {
          margin: 20px auto 0;
          padding: 30px 20px;
          border: 2px solid #dceee1;
          border-radius: 23px;
          background: #edf7ef;
          text-align: center;
        }

        .bottom > span { font-size: 38px; }

        .bottom h2 {
          margin: 9px 0;
          color: #3b6a53;
          font-size: 23px;
        }

        .bottom p {
          color: #718b79;
          font-size: 13px;
        }

        .bottom a {
          display: inline-block;
          margin-top: 8px;
          color: #477b60;
          font-size: 13px;
          font-weight: 1000;
          text-decoration: none;
        }

        footer {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          margin-top: 35px;
          padding-top: 20px;
          border-top: 2px dashed #eadfcb;
          color: #8390a4;
          font-size: 11px;
        }

        footer b {
          color: #294363;
          font-size: 16px;
        }

        @media(max-width:650px) {
          .pricing-page { padding: 12px 15px 28px; }
          .topbar { flex-wrap: wrap; }
          nav {
            order: 3;
            width: 100%;
            gap: 14px;
            flex-wrap: wrap;
          }
          .hero { padding: 35px 0 24px; }
          .free-card { padding: 25px 20px; }
          .free-card > strong { font-size: 36px; }
          footer {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
