"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      setMessage(error.message === "Invalid login credentials"
        ? "Неверный email или пароль. Проверь данные и попробуй ещё раз."
        : error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="login-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="login-header">
        <Link href="/" className="brand"><span className="brand-symbol">✦</span><span>AI KIDS</span></Link>
        <Link href="/" className="back-link">← На главную</Link>
      </header>

      <section className="login-layout">
        <aside className="welcome-panel">
          <div className="welcome-badge">🌈 Пространство для педагогов</div>
          <h1>Твори, играй<br />и вдохновляй!</h1>
          <p>Твои идеи для маленьких открытий — в одном месте. Создавай карточки, игры, сказки и материалы для занятий.</p>
          <div className="illustration-scene" aria-hidden="true">
            <span className="scene-cloud cloud-left">☁️</span>
            <span className="scene-spark spark-top">✦</span>
            <span className="scene-book">📚</span>
            <span className="scene-pencil">✏️</span>
            <span className="scene-palette">🎨</span>
            <span className="scene-fox">🦊</span>
            <span className="scene-star">⭐</span>
            <span className="scene-cloud cloud-right">☁️</span>
            <span className="scene-rainbow">🌈</span>
          </div>
          <div className="welcome-foot"><span>✦ Русский</span><span>✦ Қазақша</span><span>✦ Для детей 3–7 лет</span></div>
        </aside>

        <section className="login-card">
          <div className="card-top-icon">👋</div>
          <span className="eyebrow">СНОВА РАДЫ ТЕБЯ ВИДЕТЬ</span>
          <h2>С возвращением!</h2>
          <p className="card-description">Войди в свой кабинет педагога и продолжай создавать.</p>

          <form onSubmit={submit}>
            <label className="form-label" htmlFor="email">Электронная почта</label>
            <div className="input-wrap">
              <span className="input-icon">✉</span>
              <input id="email" type="email" autoComplete="email" placeholder="example@mail.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="password-heading"><label className="form-label" htmlFor="password">Пароль</label></div>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Введи свой пароль" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="show-password" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? "Скрыть" : "Показать"}</button>
            </div>

            {message && <div className="error-message" role="alert">⚠️ {message}</div>}
            <button className="submit-button" type="submit" disabled={busy}>{busy ? "Входим в кабинет..." : "Войти в AI KIDS"}{!busy && <span>→</span>}</button>
          </form>

          <div className="signup-prompt"><span>Впервые с нами?</span><Link href="/signup">Создать аккаунт</Link></div>
          <div className="secure-note"><span>🛡️</span><span>Твои данные защищены. Вход доступен только владельцу аккаунта.</span></div>
        </section>
      </section>

      <footer className="login-footer"><span>✦ AI KIDS</span><span>Большие идеи для маленьких открытий</span></footer>

      <style jsx>{`
        .login-page{position:relative;isolation:isolate;min-height:100vh;overflow:hidden;padding:0 34px 22px;background:linear-gradient(135deg,#fffaf1 0%,#f5f7ff 58%,#fff5ed 100%);color:#263d5e;font-family:Nunito,system-ui,sans-serif}
        .ambient{position:absolute;z-index:-1;border-radius:50%;filter:blur(2px);pointer-events:none}.ambient-one{width:470px;height:470px;right:-150px;top:90px;background:#dce6ff75}.ambient-two{width:350px;height:350px;left:-130px;bottom:10px;background:#ffe4c866}
        .login-header{max-width:1240px;height:86px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}.brand{display:inline-flex;align-items:center;gap:11px;font-size:27px;font-weight:1000;letter-spacing:-.8px;color:#263d5e;text-decoration:none}.brand-symbol{width:47px;height:47px;display:grid;place-items:center;border-radius:16px;background:#ffdc75;color:#34527c;box-shadow:0 5px 0 #edc45d;font-size:25px}
        .back-link{color:#637894;font-size:14px;font-weight:900;text-decoration:none}.back-link:hover{color:#e07a56}
        .login-layout{max-width:1100px;min-height:650px;margin:30px auto 20px;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:55px}
        .welcome-panel{position:relative;min-height:570px;padding:35px 20px 20px 5px;display:flex;flex-direction:column;align-items:flex-start}.welcome-badge{display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border:1px solid #f2dfb9;border-radius:30px;background:#fff8e9;color:#9a7942;font-size:12px;font-weight:1000}
        .welcome-panel h1{margin:24px 0 14px;color:#315b96;font-size:clamp(42px,5vw,61px);line-height:1.05;letter-spacing:-2px;font-weight:1000}.welcome-panel>p{max-width:475px;margin:0;color:#71819a;font-size:16px;line-height:1.75;font-weight:600}
        .illustration-scene{position:relative;width:100%;max-width:520px;height:300px;margin:20px auto 8px}.illustration-scene span{position:absolute;display:block;filter:drop-shadow(0 8px 5px #33435b18)}
        .scene-book{left:28%;top:83px;font-size:112px;transform:rotate(-9deg);z-index:2}.scene-pencil{left:58%;top:50px;font-size:76px;transform:rotate(22deg);z-index:3}.scene-palette{left:9%;top:142px;font-size:76px;transform:rotate(-13deg);z-index:3}.scene-fox{left:62%;top:150px;font-size:105px;transform:rotate(5deg);z-index:4}.scene-rainbow{left:35%;top:0;font-size:65px;transform:rotate(-8deg)}
        .scene-star{left:83%;top:82px;font-size:34px;color:#f4bd4f}.scene-spark{left:17%;top:55px;font-size:38px;color:#f4a65c}.scene-cloud{font-size:43px;opacity:.8}.cloud-left{left:2%;top:30px}.cloud-right{right:1%;bottom:24px}
        .welcome-foot{display:flex;flex-wrap:wrap;gap:18px;margin-top:auto;color:#8190a5;font-size:12px;font-weight:900}
        .login-card{width:100%;max-width:455px;justify-self:end;padding:38px 39px 30px;border:1px solid #e8eaf1;border-radius:28px;background:#ffffffed;box-shadow:0 18px 55px #344d7417}
        .card-top-icon{width:55px;height:55px;display:grid;place-items:center;margin-bottom:20px;border-radius:18px;background:#fff0d8;font-size:27px}.eyebrow{color:#df9564;font-size:10px;font-weight:1000;letter-spacing:1.5px}
        .login-card h2{margin:9px 0 8px;color:#294363;font-size:32px;font-weight:1000;letter-spacing:-.8px}.card-description{margin:0 0 27px;color:#8190a4;font-size:14px;line-height:1.6}
        .form-label{display:block;margin:0 0 8px;color:#47648c;font-size:13px;font-weight:900}.input-wrap{height:53px;display:flex;align-items:center;gap:10px;margin-bottom:19px;padding:0 14px;border:1.5px solid #e0e6f0;border-radius:13px;background:#fbfcff;transition:border .15s,box-shadow .15s}.input-wrap:focus-within{border-color:#7898d0;box-shadow:0 0 0 4px #7898d01b}
        .input-icon{color:#8b9bb2;font-size:17px}.input-wrap input{width:100%;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#294363;font-size:14px}.input-wrap input::placeholder{color:#a7b1c0}
        .password-heading{display:flex;align-items:center;justify-content:space-between}.show-password{flex:none;border:0;background:transparent;color:#6682b0;font-size:11px;font-weight:900;cursor:pointer}
        .error-message{margin:0 0 15px;padding:12px 13px;border:1px solid #f0cccc;border-radius:11px;background:#fff2f1;color:#a34545;font-size:12px;line-height:1.5}
        .submit-button{width:100%;height:54px;display:flex;align-items:center;justify-content:center;gap:12px;margin-top:5px;border:0;border-radius:14px;background:linear-gradient(100deg,#527bc0,#788bd0);color:#fff;font-size:15px;font-weight:1000;cursor:pointer;box-shadow:0 5px 0 #d9dff0;transition:transform .15s,opacity .15s}.submit-button:hover{transform:translateY(-2px);box-shadow:0 7px 0 #d9dff0}.submit-button:disabled{opacity:.65;cursor:wait;transform:none}.submit-button span{font-size:20px}
        .signup-prompt{display:flex;justify-content:center;gap:6px;margin-top:23px;color:#8491a4;font-size:13px}.signup-prompt a{color:#4169a8;font-weight:1000;text-decoration:none}.signup-prompt a:hover{text-decoration:underline}
        .secure-note{display:flex;align-items:flex-start;gap:9px;margin-top:25px;padding:13px;border-radius:12px;background:#f5f8fd;color:#8492a6;font-size:10px;line-height:1.55}.secure-note span:first-child{font-size:15px}
        .login-footer{max-width:1100px;display:flex;justify-content:space-between;gap:15px;margin:25px auto 0;padding-top:17px;border-top:1px dashed #e5dfd4;color:#8b98a9;font-size:11px}.login-footer span:first-child{color:#315b96;font-size:15px;font-weight:1000}
        @media(max-width:850px){.login-layout{max-width:520px;grid-template-columns:1fr;gap:15px;margin-top:15px}.welcome-panel{min-height:0;padding:20px 5px 0}.welcome-panel h1{font-size:43px}.welcome-panel>p{font-size:14px}.illustration-scene{height:180px;max-width:390px;margin:8px auto}.scene-book{font-size:76px;top:48px}.scene-pencil{font-size:53px;top:28px}.scene-palette{font-size:52px;top:86px}.scene-fox{font-size:75px;top:87px}.scene-rainbow{font-size:45px}.welcome-foot{display:none}.login-card{justify-self:center;max-width:520px}.login-footer{max-width:520px}}
        @media(max-width:520px){.login-page{padding:0 16px 18px}.login-header{height:68px}.brand{font-size:22px}.brand-symbol{width:40px;height:40px;border-radius:13px}.back-link{font-size:12px}.login-layout{margin-top:7px}.welcome-panel{padding-top:13px}.welcome-badge{font-size:10px}.welcome-panel h1{margin:17px 0 9px;font-size:38px}.welcome-panel>p{font-size:13px;line-height:1.55}.illustration-scene{height:135px;margin:4px auto}.scene-book{font-size:60px;top:35px}.scene-pencil{font-size:42px;top:18px}.scene-palette{font-size:42px;top:65px}.scene-fox{font-size:58px;top:66px}.scene-rainbow{font-size:35px}.scene-star{font-size:25px}.login-card{padding:27px 22px 23px;border-radius:22px}.login-card h2{font-size:28px}.card-description{margin-bottom:22px}.login-footer{flex-direction:column;align-items:center;text-align:center;margin-top:23px}}
      `}</style>
    </main>
  );
}
