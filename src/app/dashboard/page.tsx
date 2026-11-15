import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id,title,kind,created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "воспитатель";
  const items = projects || [];

  return (
    <main className="dashboard">
      <header className="header">
        <Link href="/" className="brand"><span className="logo">✦</span> AI KIDS <span>✨</span></Link>
        <nav><Link href="/">Главная</Link><Link href="/studio">Мастерская</Link><Link href="/studio/kit">Умный комплект</Link><Link href="/studio/visuals">Наглядность</Link></nav>
        <form action="/auth/signout" method="post"><button className="logout">Выйти</button></form>
      </header>

      <section className="welcome">
        <div className="welcome-copy">
          <span className="eyebrow light">🌈 ТВОЁ ПРОСТРАНСТВО AI KIDS</span>
          <h1>Привет, {name}!</h1>
          <p>Здесь живут твои идеи, сказки, игры и материалы для маленьких исследователей.</p>
          <Link href="/studio" className="primary">✨ Создать материал <b>→</b></Link>
          <span className="welcome-note">🧸 Творим с радостью каждый день</span>
        </div>
        <div className="welcome-art" aria-hidden="true"><span className="rainbow">🌈</span><span className="bear">🐻</span><span className="fox">🦊</span><span className="book">📚</span><span className="star">⭐</span></div>
      </section>

      <section className="stats">
        <article className="stat peach"><span>🎀</span><div><small>ТВОЙ ТАРИФ</small><strong>START</strong><p>Бесплатный доступ</p></div></article>
        <article className="stat blue"><span>📚</span><div><small>МОИ МАТЕРИАЛЫ</small><strong>{items.length}</strong><p>Сохранённых разработок</p></div></article>
        <article className="stat mint"><span>🌷</span><div><small>ЯЗЫКИ ПЛАТФОРМЫ</small><strong>Қазақша + Русский</strong><p>Два языка для творчества</p></div></article>
      </section>

      <section className="collection">
        <div className="section-head">
          <div><span className="eyebrow">ТВОЯ КОЛЛЕКЦИЯ</span><h2>Мои материалы 🖍️</h2><p>Все сохранённые разработки в одном месте.</p></div>
          <Link href="/studio" className="outline">＋ Новый материал</Link>
        </div>
        {error ? <div className="alert">Не удалось загрузить материалы. Попробуй обновить страницу.</div> :
          items.length ? <div className="materials">
            {items.map((item) => <article className="material" key={item.id}>
              <div className="material-art"><span>{item.kind === "story" ? "📖" : item.kind === "game" ? "🧩" : item.kind === "illustration" ? "🎨" : item.kind === "cards" ? "🖍️" : item.kind === "lesson" ? "📝" : "✏️"}</span><i>✦</i></div>
              <div className="material-body"><small>{item.kind || "Материал"}</small><h3>{item.title}</h3><p>📅 {new Date(item.created_at).toLocaleDateString("ru-RU")}</p></div>
            </article>)}
          </div> : <div className="empty">
            <div className="empty-art">📚　🦊　✨</div>
            <h3>Твоя коллекция ждёт первую работу!</h3>
            <p>Создай игру, сказку или рабочий лист — и сохрани его здесь.</p>
            <Link href="/studio" className="primary">Создать первый материал →</Link>
          </div>
        }
      </section>

      <section className="bottom"><span>🌼</span><div><b>Каждая большая идея начинается с маленького шага!</b><p>AI KIDS поможет подготовить материалы для занятий.</p></div><Link href="/studio">В мастерскую →</Link></section>
      <footer><b>✦ AI KIDS</b><span>Большие идеи для маленьких открытий</span><span>Қазақша · Русский</span></footer>

      <style jsx>{`
        .dashboard{max-width:1180px;margin:0 auto;padding:20px 28px 35px;color:#294363;font-family:Nunito,system-ui,sans-serif}
        .header{min-height:65px;display:flex;align-items:center;justify-content:space-between;gap:18px}
        .brand{display:flex;align-items:center;gap:9px;font-size:23px;font-weight:1000;white-space:nowrap}.brand>span:last-child{color:#f4a64e}
        .logo{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:#ffdc75;box-shadow:0 4px 0 #ebc25a;color:#34527c}
        nav{display:flex;gap:22px;color:#647995;font-size:13px;font-weight:900}nav a:hover{color:#df865f}
        .logout,.outline{border:2px solid #e7edf5;background:#fff;border-radius:13px;padding:10px 16px;color:#426ba8;font-weight:1000;cursor:pointer}
        .welcome{position:relative;overflow:hidden;display:flex;align-items:center;min-height:265px;margin-top:19px;padding:37px 43px;border-radius:29px;background:linear-gradient(115deg,#527bc0,#8995d3);color:white;box-shadow:0 9px 0 #e9e4dc}
        .welcome:after{content:"";position:absolute;width:340px;height:340px;right:70px;top:-205px;border-radius:50%;background:#ffffff13}
        .welcome-copy{position:relative;z-index:2;max-width:680px}.eyebrow{color:#df9564;font-size:10px;font-weight:1000;letter-spacing:1.2px}.eyebrow.light{display:inline-block;padding:8px 13px;border-radius:25px;background:#ffffff2a;color:white}
        h1{margin:15px 0 8px;font-size:clamp(34px,4vw,48px);line-height:1.08;font-weight:1000;letter-spacing:-1px}.welcome-copy p{max-width:590px;margin:0;color:#f0f4ff;font-size:15px;line-height:1.6;font-weight:700}
        .primary{display:inline-flex;align-items:center;gap:12px;min-height:47px;margin-top:19px;padding:0 18px;border-radius:14px;background:#ffdc75;color:#35527b;font-weight:1000;box-shadow:0 4px 0 #e8bd52}.welcome-note{display:inline-block;margin-left:15px;font-size:11px;font-weight:900;color:#f4f6ff}
        .welcome-art span{position:absolute;z-index:1;filter:drop-shadow(0 8px 5px #304b762b)}.rainbow{right:90px;top:16px;font-size:95px;transform:rotate(8deg)}.fox{right:36px;bottom:22px;font-size:78px}.bear{right:245px;bottom:17px;font-size:68px}.book{right:145px;top:115px;font-size:66px}.star{right:300px;top:25px;font-size:35px}
        .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin:27px 0 42px}
        .stat{display:flex;align-items:center;gap:14px;min-height:112px;padding:18px;border:2px solid transparent;border-radius:20px;box-shadow:0 5px 0 #e9e5de}
        .stat.peach{background:#fff0d7;border-color:#f9e6c4}.stat.blue{background:#e5edff;border-color:#dce6fb}.stat.mint{background:#e2f4e8;border-color:#d8eddf}
        .stat>span{width:49px;height:49px;display:grid;place-items:center;border-radius:16px;background:#ffffffa6;font-size:27px}
        .stat small{display:block;color:#71819a;font-size:9px;font-weight:1000;letter-spacing:1px}.stat strong{display:block;margin-top:3px;color:#294363;font-size:21px;font-weight:1000}.stat p{margin:2px 0 0;color:#7d8ca1;font-size:11px}
        .section-head{display:flex;align-items:end;justify-content:space-between;gap:15px;margin-bottom:19px}.section-head h2{margin:5px 0;color:#294363;font-size:29px;font-weight:1000}.section-head p{margin:0;color:#77879e;font-size:13px}.outline{display:inline-flex;align-items:center;min-height:43px;font-size:12px}
        .materials{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.material{overflow:hidden;border:2px solid #eeeaf0;border-radius:20px;background:white;box-shadow:0 5px 0 #e9e5de}
        .material-art{height:105px;position:relative;display:grid;place-items:center;background:linear-gradient(120deg,#ffeacb,#f9e0ed)}.material:nth-child(3n+2) .material-art{background:linear-gradient(120deg,#e2edff,#e5e1ff)}.material:nth-child(3n) .material-art{background:linear-gradient(120deg,#dff3e7,#fff0c9)}
        .material-art span{font-size:54px;filter:drop-shadow(0 5px 3px #33445a20)}.material-art i{position:absolute;right:22px;top:12px;color:white;font-size:22px;font-style:normal}
        .material-body{padding:15px}.material-body small{display:inline-block;padding:5px 9px;border-radius:20px;background:#f1f4fa;color:#69809e;font-size:9px;font-weight:1000}.material-body h3{margin:9px 0 7px;color:#294363;font-size:15px}.material-body p{margin:0;color:#8290a4;font-size:11px}
        .empty{min-height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:25px;border:2px dashed #e9d9b8;border-radius:23px;background:#fffaf0}.empty-art{font-size:42px}.empty h3{margin:12px 0 5px;font-size:19px}.empty p{margin:0 0 2px;color:#77879e;font-size:13px}
        .alert{padding:15px;border-radius:14px;background:#fff0e8;color:#a45b43;font-weight:800}
        .bottom{display:flex;align-items:center;gap:15px;margin-top:33px;padding:19px 22px;border:2px solid #d9ecdf;border-radius:20px;background:#e8f5eb}.bottom>span{font-size:35px}.bottom b{color:#3b6a53;font-size:14px}.bottom p{margin:4px 0 0;color:#6c8a79;font-size:12px}.bottom>a{margin-left:auto;color:#477b60;font-size:12px;font-weight:1000;white-space:nowrap}
        footer{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:28px;padding:20px 0;border-top:2px dashed #eadfcb;color:#8390a4;font-size:11px}footer b{color:#294363;font-size:17px}
        @media(max-width:800px){nav{gap:12px;font-size:11px}.stats{grid-template-columns:1fr 1fr}.stat:last-child{grid-column:1/-1}.materials{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:600px){.dashboard{padding:12px 15px 28px}.header{flex-wrap:wrap}.brand{font-size:20px}nav{order:3;width:100%;overflow:auto;padding:7px 0}.welcome{min-height:330px;padding:25px 20px;align-items:flex-start}.welcome-copy h1{font-size:35px}.welcome-copy p{font-size:13px}.welcome-art .rainbow{font-size:58px;right:5px;top:auto;bottom:10px;opacity:.6}.welcome-art .fox{font-size:50px;right:10px;bottom:5px;opacity:.65}.welcome-art .bear{font-size:45px;right:115px;bottom:5px;opacity:.65}.welcome-art .book{font-size:44px;right:90px;top:auto;bottom:65px}.stats{grid-template-columns:1fr;margin:22px 0 33px}.stat:last-child{grid-column:auto}.section-head{align-items:flex-start;flex-direction:column}.section-head h2{font-size:25px}.materials{grid-template-columns:1fr}.bottom{align-items:flex-start;flex-wrap:wrap}.bottom>a{margin-left:50px}footer{flex-direction:column;text-align:center}}
      `}</style>
    </main>
  );
}
