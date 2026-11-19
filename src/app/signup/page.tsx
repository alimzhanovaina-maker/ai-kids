
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setError(false);

    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    setBusy(false);

    if (error) {
      setError(true);
      setMsg(error.message);
      return;
    }

    setMsg(
      data.session
        ? "Аккаунт успешно создан! Добро пожаловать в AI KIDS!"
        : "Почти готово! Проверь почту и подтверди регистрацию."
    );
  }

  return (
    <main className="signup-page">
      <div className="signup-top">
        <Link href="/" className="signup-brand">
          <span className="brand-star">✦</span> AI KIDS
        </Link>
        <Link href="/" className="back-home">← На главную</Link>
      </div>

      <div className="signup-layout">
        <section className="signup-welcome">
          <div className="welcome-label">✨ ТВОРЧЕСКАЯ МАСТЕРСКАЯ ПЕДАГОГА</div>
          <h1>Мир детских<br />идей начинается<br /><span>здесь!</span></h1>
          <p className="welcome-text">
            Создавай авторские сказки, яркие иллюстрации, карточки,
            раскраски и увлекательные игры для маленьких исследователей.
          </p>

          <div className="welcome-art">
            <div className="art-circle circle-one" />
            <div className="art-circle circle-two" />
            <span className="art-book">📚</span>
            <span className="art-fox">🦊</span>
            <span className="art-palette">🎨</span>
            <span className="art-star star-one">⭐</span>
            <span className="art-star star-two">✨</span>
            <span className="art-pencil">✏️</span>
          </div>

          <div className="welcome-bottom">
            <span>🌈 Для детей 3–6 лет</span>
            <span>💛 Қазақша + Русский</span>
          </div>
        </section>

        <section className="signup-card">
          <div className="card-icon">🌸</div>
          <div className="card-eyebrow">ДОБРО ПОЖАЛОВАТЬ В AI KIDS</div>
          <h2>Создать аккаунт</h2>
          <p className="card-subtitle">Присоединяйся к сообществу педагогов!</p>

          <form onSubmit={submit} className="signup-form">
            <label htmlFor="signup-name">Твоё имя</label>
            <div className="input-wrap">
              <span>👤</span>
              <input
                id="signup-name"
                type="text"
                placeholder="Как тебя зовут?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <label htmlFor="signup-email">Электронная почта</label>
            <div className="input-wrap">
              <span>✉️</span>
              <input
                id="signup-email"
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <label htmlFor="signup-password">Пароль</label>
            <div className="input-wrap">
              <span>🔒</span>
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button className="signup-submit" disabled={busy}>
              {busy ? "Создаём аккаунт..." : "Создать аккаунт бесплатно ✨"}
            </button>
          </form>

          {msg && (
            <div className={`signup-message ${error ? "is-error" : "is-success"}`}>
              {msg}
            </div>
          )}

          <div className="signup-divider"><span>Уже есть аккаунт?</span></div>
          <Link href="/login" className="login-link">Войти в свой аккаунт</Link>
          <p className="signup-terms">
            Создавая аккаунт, ты присоединяешься к творческому пространству AI KIDS 💛
          </p>
        </section>
      </div>

      <footer className="signup-footer">
        ✦ AI KIDS — вдохновение для маленьких открытий
      </footer>

      <style jsx>{`
        .signup-page {
          min-height: 100vh;
          padding: 22px 5%;
          background:
            radial-gradient(circle at 8% 15%, #ffe8c8 0, transparent 25%),
            radial-gradient(circle at 90% 85%, #e9e2ff 0, transparent 27%),
            #fffaf2;
          color: #294568;
          overflow: hidden;
        }
        .signup-top {
          max-width: 1250px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .signup-brand {
          font-size: 28px;
          font-weight: 1000;
          letter-spacing: -1px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .brand-star { color: #f3a54d; font-size: 35px; }
        .back-home {
          padding: 11px 18px;
          border-radius: 14px;
          background: white;
          border: 1px solid #e8eaf1;
          font-size: 13px;
          font-weight: 800;
        }
        .signup-layout {
          max-width: 1150px;
          margin: 55px auto 35px;
          display: grid;
          grid-template-columns: 1fr 470px;
          align-items: center;
          gap: 65px;
        }
        .signup-welcome { position: relative; min-height: 570px; padding: 35px 10px; }
        .welcome-label, .card-eyebrow {
          color: #e49a58;
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: 1.5px;
        }
        .signup-welcome h1 {
          margin: 25px 0 18px;
          font-size: clamp(42px, 5vw, 65px);
          line-height: 1.08;
          letter-spacing: -2px;
          font-weight: 1000;
          color: #294568;
        }
        .signup-welcome h1 span { color: #e99a69; }
        .welcome-text {
          max-width: 490px;
          color: #71819a;
          font-size: 17px;
          line-height: 1.8;
          font-weight: 700;
        }
        .welcome-art { height: 205px; max-width: 500px; margin-top: 12px; position: relative; }
        .art-circle { position: absolute; border-radius: 50%; }
        .circle-one { width: 190px; height: 190px; background: #ffe8c9; left: 100px; top: 5px; }
        .circle-two { width: 125px; height: 125px; background: #e9e3ff; left: 245px; top: 48px; }
        .welcome-art span {
          position: absolute;
          z-index: 2;
          filter: drop-shadow(0 8px 5px #42536b20);
        }
        .art-book { font-size: 105px; left: 105px; top: 28px; transform: rotate(-9deg); }
        .art-fox { font-size: 100px; left: 250px; top: 55px; transform: rotate(7deg); }
        .art-palette { font-size: 60px; left: 20px; top: 95px; }
        .art-star { font-size: 35px; }
        .star-one { left: 315px; top: 5px; }
        .star-two { left: 45px; top: 20px; }
        .art-pencil { font-size: 55px; left: 390px; top: 105px; transform: rotate(25deg); }
        .welcome-bottom { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
        .welcome-bottom span {
          padding: 11px 16px;
          border-radius: 30px;
          background: #fff;
          color: #627c9c;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 4px 15px #52617b0d;
        }
        .signup-card {
          background: #fff;
          border: 1px solid #eeeaf1;
          border-radius: 30px;
          padding: 38px;
          box-shadow: 0 18px 55px #53627b16;
        }
        .card-icon {
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          background: #fff0d8;
          border-radius: 18px;
          font-size: 27px;
          margin-bottom: 22px;
        }
        .signup-card h2 {
          margin: 10px 0 7px;
          font-size: 32px;
          letter-spacing: -1px;
          color: #294568;
          font-weight: 1000;
        }
        .card-subtitle { margin: 0 0 27px; color: #8390a4; font-size: 14px; }
        .signup-form { display: flex; flex-direction: column; gap: 10px; }
        .signup-form label {
          margin-top: 8px;
          color: #435b7a;
          font-size: 13px;
          font-weight: 900;
        }
        .input-wrap {
          min-height: 53px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 15px;
          border: 1.5px solid #e6eaf1;
          border-radius: 14px;
          background: #fffdfb;
          transition: border .2s, box-shadow .2s;
        }
        .input-wrap:focus-within {
          border-color: #8ba5dc;
          box-shadow: 0 0 0 4px #8ba5dc20;
        }
        .input-wrap > span { font-size: 17px; }
        .input-wrap input {
          min-width: 0;
          width: 100%;
          height: 48px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #294568;
          font-size: 14px;
        }
        .input-wrap input::placeholder { color: #aab4c2; }
        .show-password { border: 0; background: transparent; cursor: pointer; font-size: 17px; }
        .signup-submit {
          min-height: 55px;
          margin-top: 17px;
          border: 0;
          border-radius: 15px;
          background: linear-gradient(110deg, #547bc4, #8b86d1);
          color: white;
          font-size: 14px;
          font-weight: 1000;
          cursor: pointer;
          box-shadow: 0 5px 0 #405e9c;
          transition: transform .2s;
        }
        .signup-submit:hover { transform: translateY(-2px); }
        .signup-submit:disabled { opacity: .65; cursor: wait; }
        .signup-message {
          padding: 13px;
          margin-top: 17px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
        }
        .is-success { color: #28764c; background: #e9f8ee; }
        .is-error { color: #a33c45; background: #fff0f0; }
        .signup-divider {
          margin: 25px 0 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #9aa5b5;
          font-size: 12px;
        }
        .signup-divider:before, .signup-divider:after {
          content: "";
          height: 1px;
          background: #edf0f4;
          flex: 1;
        }
        .login-link {
          min-height: 49px;
          display: grid;
          place-items: center;
          border: 1.5px solid #dfe6f1;
          border-radius: 14px;
          color: #496da9;
          font-weight: 1000;
          font-size: 14px;
        }
        .login-link:hover { background: #f5f7fc; }
        .signup-terms {
          margin: 22px 0 0;
          text-align: center;
          color: #a0aaba;
          font-size: 11px;
          line-height: 1.6;
        }
        .signup-footer {
          padding: 18px;
          text-align: center;
          color: #9aa5b5;
          font-size: 12px;
          font-weight: 800;
        }
        @media (max-width: 850px) {
          .signup-layout {
            grid-template-columns: 1fr;
            max-width: 520px;
            gap: 20px;
            margin-top: 25px;
          }
          .signup-welcome { min-height: auto; padding: 25px 5px 0; }
          .signup-welcome h1 { font-size: 43px; }
          .welcome-art {
            height: 140px;
            transform: scale(.75);
            transform-origin: left top;
            margin-bottom: -25px;
          }
          .welcome-bottom { margin-bottom: 20px; }
        }
        @media (max-width: 480px) {
          .signup-page { padding: 15px; }
          .signup-card { padding: 25px 20px; border-radius: 23px; }
          .signup-welcome h1 { font-size: 37px; }
          .welcome-text { font-size: 14px; }
          .back-home { font-size: 11px; padding: 9px 11px; }
          .signup-card h2 { font-size: 27px; }
        }
      `}</style>
    </main>
  );
}
