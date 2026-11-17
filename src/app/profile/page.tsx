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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("ru");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
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
      setAvatarUrl(user.user_metadata?.avatar_url || "");
      setPreferredLanguage(user.user_metadata?.preferred_language === "kz" ? "kz" : "ru");

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

  async function saveLanguage() {
    setSavingLanguage(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      data: { preferred_language: preferredLanguage },
    });

    setSavingLanguage(false);

    if (updateError) {
      setError("Не удалось сохранить язык. Попробуй ещё раз.");
      return;
    }

    setMessage(
      preferredLanguage === "kz"
        ? "Таңдалған тіл сақталды. Интерфейсті толық аудару келесі кезеңде орындалады."
        : "Выбранный язык сохранён. Полный перевод интерфейса будет добавлен на следующем этапе."
    );
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage("");
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Выбери изображение в формате JPG, PNG или WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Размер фотографии не должен превышать 3 МБ.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      setError("Сначала войди в аккаунт.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${user.id}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setUploading(false);
      setError("Не удалось загрузить фото. Проверь настройки хранилища avatars в Supabase.");
      return;
    }

    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const newAvatarUrl = `${publicData.publicUrl}?t=${Date.now()}`;
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { avatar_url: newAvatarUrl },
    });

    setUploading(false);

    if (metadataError) {
      setError("Фото загружено, но не удалось обновить профиль. Попробуй ещё раз.");
      return;
    }

    setAvatarUrl(newAvatarUrl);
    setMessage("Фотография профиля обновлена.");
    event.target.value = "";
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Новый пароль должен содержать не менее 8 символов.");
      return;
    }
    if (password !== passwordAgain) {
      setError("Пароли не совпадают. Проверь оба поля.");
      return;
    }

    setChangingPassword(true);
    const supabase = createClient();
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    setChangingPassword(false);

    if (passwordError) {
      setError("Не удалось изменить пароль. Попробуй ещё раз.");
      return;
    }

    setPassword("");
    setPasswordAgain("");
    setMessage("Пароль успешно изменён.");
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
        <p>Управляй личными данными, фотографией, паролем и настройками.</p>
      </section>

      <section className="profile-grid">
        <div className="main-column">
          <article className="panel account-panel">
            <div className="avatar">
              {avatarUrl ? <img src={avatarUrl} alt="Фото профиля" /> : "👩‍🏫"}
            </div>
            <h2>Личные данные</h2>
            <p className="muted">Имя будет отображаться в личном кабинете.</p>

            <div className="photo-control">
              <label htmlFor="profile-photo">Фотография педагога</label>
              <input
                id="profile-photo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={uploadAvatar}
                disabled={uploading}
              />
              <small className="hint">JPG, PNG или WebP. Максимальный размер — 3 МБ.</small>
              {uploading && <small className="hint">Загружаем фотографию…</small>}
            </div>

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

              <button className="save-button" type="submit" disabled={saving || !name.trim()}>
                {saving ? "Сохраняем…" : "Сохранить изменения"}
              </button>
            </form>
          </article>

          <article className="panel settings-panel">
            <h2>🌐 Язык интерфейса</h2>
            <p className="muted">Выбери предпочитаемый язык для своего аккаунта.</p>
            <label htmlFor="preferred-language">Предпочитаемый язык</label>
            <select
              id="preferred-language"
              value={preferredLanguage}
              onChange={(event) => setPreferredLanguage(event.target.value)}
            >
              <option value="ru">🇷🇺 Русский</option>
              <option value="kz">🇰🇿 Қазақша</option>
            </select>
            <small className="hint">
              Выбор сохранится в настройках аккаунта. Переключение всего интерфейса будет добавлено отдельно.
            </small>
            <button
              className="save-button"
              type="button"
              onClick={saveLanguage}
              disabled={savingLanguage}
            >
              {savingLanguage ? "Сохраняем…" : "Сохранить язык"}
            </button>
          </article>

          <article className="panel password-panel">
            <h2>🔐 Изменение пароля</h2>
            <p className="muted">Придумай новый пароль и введи его дважды для проверки.</p>
            <form onSubmit={updatePassword}>
              <label htmlFor="new-password">Новый пароль</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Не менее 8 символов"
                minLength={8}
                required
              />
              <label htmlFor="repeat-password">Повтори новый пароль</label>
              <input
                id="repeat-password"
                type="password"
                autoComplete="new-password"
                value={passwordAgain}
                onChange={(event) => setPasswordAgain(event.target.value)}
                placeholder="Повтори пароль"
                minLength={8}
                required
              />
              <button className="save-button" type="submit" disabled={changingPassword || !password || !passwordAgain}>
                {changingPassword ? "Изменяем…" : "Изменить пароль"}
              </button>
            </form>
          </article>

          {(message || error) && (
            <p className={error ? "error" : "success"} role={error ? "alert" : "status"}>
              {error || message}
            </p>
          )}
        </div>

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
        .profile-grid { display:grid; grid-template-columns:1.2fr .8fr; gap:20px; max-width:950px; margin:0 auto; align-items:start; }
        .main-column,.side-column { display:grid; gap:18px; }
        .panel { padding:25px; border:2px solid #e8edf5; border-radius:22px; background:#fff; box-shadow:0 6px 0 #e9e5de; }
        .account-panel { background:linear-gradient(160deg,#fffaf0,#fff 55%); }
        .avatar { display:grid; place-items:center; width:76px; height:76px; margin-bottom:13px; overflow:hidden; border-radius:22px; background:#ffefd5; font-size:35px; }
        .avatar img { width:100%; height:100%; object-fit:cover; }
        h2 { margin:0 0 7px; font-size:21px; }
        .muted { margin:0 0 20px; }
        form { display:grid; gap:9px; }
        label { margin-top:5px; color:#526b8e; font-size:12px; font-weight:1000; }
        input:not([type="file"]),select { width:100%; min-height:46px; padding:0 13px; border:2px solid #e4eaf3; border-radius:12px; outline:none; background:#fff; color:#294363; font:inherit; font-size:13px; }
        input:focus,select:focus { border-color:#91a9dc; }
        input[readonly] { background:#f5f7fa; color:#8190a4; }
        input[type="file"] { width:100%; padding:9px; border:2px dashed #dce5f2; border-radius:12px; background:#fff; color:#647995; font-size:12px; }
        .photo-control { display:grid; gap:8px; margin:15px 0 18px; }
        .hint { color:#8996a8; font-size:10px; line-height:1.5; }
        .save-button { min-height:47px; margin-top:10px; border:0; border-radius:13px; background:#527bc0; color:#fff; font:inherit; font-size:13px; font-weight:1000; cursor:pointer; }
        .save-button:disabled { opacity:.6; cursor:not-allowed; }
        .success,.error { margin:4px 0; padding:11px 13px; border-radius:10px; font-size:12px; }
        .success { background:#e8f5eb; color:#397052; }
        .error { background:#fff0ed; color:#a95045; }
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
