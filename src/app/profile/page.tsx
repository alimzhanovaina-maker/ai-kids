 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();

      if (active) {
        setPlan(data?.plan === "pro" ? "pro" : "free");
        setLoading(false);
      }
    }

    loadProfile();
    return () => { active = false; };
  }, [router]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });

    setSaving(false);

    if (updateError) {
      setError("Не удалось сохранить имя. Попробуй ещё раз.");
      return;
    }

    setMessage("Имя профиля успешно обновлено.");
    router.refresh();
  }

  if (loading) {
    return <main className="profile-shell"><p className="loading">Загружаем профиль…</p></main>;
  }

  return (
    <main className="profile-shell">
      <header className="topbar">
        <Link href="/" className="brand"><span>✦</span> AI KIDS</Link>
        <nav>
          <Link href="/dashboard">Личный кабинет</Link>
          <Link href="/studio">Мастерская</Link>
        </nav>
      </header>

      <section className="intro">
        <span className="eyebrow">ТВОЙ АККАУНТ</span>
        <h1>Профиль педагога 🌷</h1>
        <p>Здесь можно изменить имя, посмотреть данные аккаунта и свой тариф.</p>
      </section>

      <section className="profile-grid">
        <article className="panel account-panel">
          <div className="avatar">👩‍🏫</div>
          <h2>Личные данные</h2>
          <p className="muted">Имя будет отображаться в личном кабинете.</p>

          <form onSubmit={saveProfile}>
            <label htmlFor="profile-name">Имя</label>
            <input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Введите имя"
              maxLength={80}
              required
            />

            <label htmlFor="profile-email">Электронная почта</label>
            <input id="profile-email" value={email} readOnly />
            <small className="hint">Email используется для входа и здесь не изменяется.</small>

            {message && <p className="success" role="status">{message}</p>}
            {error && <p className="error" role="alert">{error}</p>}

            <button className="save-button" type="submit" disabled={saving || !name.trim()}>
              {saving ? "Сохраняем…" : "Сохранить изменения"}
            </button>
          </form>
        </article>

        <aside className="side-column">
          <article className="panel plan-panel">
            <span className="eyebrow">ТЕКУЩИЙ ТАРИФ</span>
            <div className="plan-title">{plan === "pro" ? "✨ AI KIDS PRO" : "🌷 START"}</div>
            <p>{plan === "pro" ? "Расширенный тариф" : "Бесплатный тариф"}</p>
            <div className="limit">{plan === "pro" ? "300" : "10"} генераций в месяц</div>
            <Link href="/pricing" className="plan-link">Посмотреть тарифы →</Link>
          </article>

          <article className="panel links-panel">
            <h2>Быстрые переходы</h2>
            <Link href="/dashboard">📚 Мои материалы</Link>
            <Link href="/studio">✨ Создать материал</Link>
            <Link href="/pricing">💎 Тарифы AI KIDS</Link>
            <Link href="/login">🔐 Страница входа</Link>
          </article>
        </aside>
      </section>

      <footer><b>✦ AI KIDS</b><span>Большие идеи для маленьких открытий</span><span>Қазақша · Русский</span></footer>

      <style jsx>{`
        * { box-sizing: border-box; }
        .profile-shell { max-width:1100px; min-height:100vh; margin:0 auto; padding:22px 28px 40px; color:#294363; font-family:Nunito,system-ui,sans-serif; }
        .topbar { min-height:58px; display:flex; align-items:center; justify-content:space-between; gap:18px; }
        .brand { display:flex; align-items:center; gap:9px; color:#294363; font-size:22px; font-weight:1000; text-decoration:none; }
        .brand span { display:grid; place-items:center; width:39px; height:39px; border-radius:13px; background:#ffdc75; box-shadow:0 4px 0 #ebc25a; }
        nav { display:flex; gap:22px; font-size:13px; font-weight:900; }
        nav a { color:#647995; text-decoration:none; }
        .intro { padding:43px 10px 28px; text-align:center; }
        .eyebrow { color:#df9564; font-size:10px; font-weight:1000; letter-spacing:1.3px; }
        .intro h1 { margin:10px 0; font-size:clamp(30px,5vw,43px); line-height:1.15; }
        .intro p,.muted { color:#77879e; font-size:13px; line-height:1.6; }
        .profile-grid { display:grid; grid-template-columns:1.2fr .8fr; gap:20px; max-width:850px; margin:0 auto; align-items:start; }
        .panel { padding:25px; border:2px solid #e8edf5; border-radius:22px; background:#fff; box-shadow:0 6px 0 #e9e5de; }
        .account-panel { background:linear-gradient(160deg,#fffaf0,#fff 55%); }
        .avatar { display:grid; place-items:center; width:62px; height:62px; margin-bottom:13px; border-radius:20px; background:#ffefd5; font-size:31px; }
        h2 { margin:0 0 7px; font-size:21px; }
        .muted { margin:0 0 20px; }
        form { display:grid; gap:9px; }
        label { margin-top:5px; color:#526b8e; font-size:12px; font-weight:1000; }
        input { width:100%; min-height:46px; padding:0 13px; border:2px solid #e4eaf3; border-radius:12px; outline:none; background:#fff; color:#294363; font:inherit; font-size:13px; }
        input:focus { border-color:#91a9dc; }
        input[readonly] { background:#f5f7fa; color:#8190a4; }
        .hint { color:#8996a8; font-size:10px; }
        .save-button { min-height:47px; margin-top:10px; border:0; border-radius:13px; background:#527bc0; color:#fff; font:inherit; font-size:13px; font-weight:1000; cursor:pointer; }
        .save-button:disabled { opacity:.6; cursor:not-allowed; }
        .success,.error { margin:4px 0; padding:10px 12px; border-radius:10px; font-size:11px; }
        .success { background:#e8f5eb; color:#397052; }
        .error { background:#fff0ed; color:#a95045; }
        .side-column { display:grid; gap:18px; }
        .plan-panel { background:linear-gradient(145deg,#eef0ff,#fff); border-color:#dfe3fa; }
        .plan-title { margin-top:12px; font-size:25px; font-weight:1000; }
        .plan-panel p { margin:5px 0 15px; color:#77879e; font-size:12px; }
        .limit { padding:12px; border-radius:12px; background:#ffffffc9; color:#426ba8; font-size:13px; font-weight:1000; }
        .plan-link { display:inline-block; margin-top:16px; color:#527bc0; font-size:12px; font-weight:1000; text-decoration:none; }
        .links-panel { display:grid; gap:13px; }
        .links-panel h2 { margin-bottom:3px; }
        .links-panel a { color:#526b8e; font-size:12px; font-weight:900; text-decoration:none; }
        .links-panel a:hover { color:#527bc0; }
        .loading { padding:80px 20px; text-align:center; color:#71819a; }
        footer { display:flex; justify-content:space-between; gap:14px; margin-top:38px; padding-top:20px; border-top:2px dashed #eadfcb; color:#8390a4; font-size:11px; }
        footer b { color:#294363; font-size:16px; }
        @media(max-width:650px) { .profile-shell { padding:12px 15px 28px; } .topbar { flex-wrap:wrap; } nav { order:3; width:100%; gap:15px; } .profile-grid { grid-template-columns:1fr; } .intro { padding:32px 0 22px; } footer { flex-direction:column; align-items:center; text-align:center; } }
      `}</style>
    </main>
  );
}
