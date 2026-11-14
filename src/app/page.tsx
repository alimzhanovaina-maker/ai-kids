import Link from "next/link";
const tools = [
  ["🧩","Дидактические игры","Игры с правилами, логические задания и игровые сценарии.","/studio?type=game","#ffe9bd"],
  ["📖","Авторские сказки","Добрые истории с вопросами и заданиями для детей.","/studio?type=story","#f8dff0"],
  ["🎨","Иллюстрации","Идеи для плакатов, раскрасок и наглядных пособий.","/studio?type=illustration","#dceaff"],
  ["🗂️","Карточки для печати","Тематические наборы карточек и классификационные игры.","/studio?type=cards","#dff3e4"],
  ["✏️","Рабочие листы","Задания на внимание, речь, логику и математику.","/studio?type=worksheet","#ffe4d8"],
  ["📋","КСП и конспекты","Структура занятий, цели, этапы и материалы.","/studio?type=lesson","#e9e2ff"],
  ["💡","Авторские разработки","Методические идеи, проекты и конкурсные материалы.","/studio?type=author","#fff0bb"]
];
export default function Home() {
  return <main className="shell">
    <header className="topbar">
      <Link className="brand" href="/"><span className="brand-mark">✦</span> AI KIDS</Link>
      <nav className="nav"><a href="#tools">Возможности</a><a href="#plans">Тарифы</a><Link href="/studio">Мастерская</Link></nav>
      <div style={{display:"flex",gap:8}}><Link className="btn secondary" href="/login">Войти</Link><Link className="btn" href="/signup">Регистрация</Link></div>
    </header>
    <section className="hero">
      <span className="pill">🌈 ТВОЯ ТВОРЧЕСКАЯ ЛАБОРАТОРИЯ</span>
      <h1>Идеи для маленьких<br/>исследователей!</h1>
      <p>Создавайте дидактические игры, сказки, рабочие листы и занятия с AI-помощником. На русском и казахском языках.</p>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:22}}><Link className="btn" style={{background:"#ffdc79",color:"#283f69"}} href="/signup">Начать бесплатно →</Link><Link className="btn secondary" href="/studio">Посмотреть мастерскую</Link></div>
      <div style={{position:"absolute",right:40,bottom:12,fontSize:110,opacity:.16}}>🌈</div>
    </section>
    <section id="tools">
      <h2 className="section-title">Что можно создавать?</h2>
      <div className="grid">{tools.map(([icon,title,desc,href,color])=><Link href={href} className="tool-card" key={title}><div className="tool-icon" style={{background:color}}>{icon}</div><h3 style={{margin:"0 0 7px"}}>{title}</h3><div className="muted">{desc}</div></Link>)}</div>
    </section>
    <section id="plans">
      <h2 className="section-title">Выбери свой формат</h2>
      <div className="grid">
        <div className="panel"><span className="pill" style={{background:"#e8f1ff",color:"#4169a8"}}>START</span><h2>Бесплатно</h2><p className="muted">Попробуйте основные инструменты и создавайте первые материалы.</p><ul className="muted"><li>Стартовый лимит AI-запросов</li><li>Базовые шаблоны</li><li>Сохранение проектов</li></ul><Link className="btn secondary" href="/signup">Создать аккаунт</Link></div>
        <div className="panel" style={{border:"2px solid #f0c85c"}}><span className="pill" style={{background:"#fff3ca",color:"#8a6411"}}>PRO</span><h2>Для активных педагогов</h2><p className="muted">Больше генераций, расширенные возможности и библиотека материалов.</p><ul className="muted"><li>Повышенный лимит AI-запросов</li><li>Расширенные шаблоны</li><li>История и библиотека проектов</li></ul><Link className="btn" href="/signup">Скоро доступно</Link></div>
      </div>
    </section>
    <footer className="footer">AI KIDS · Авторская образовательная платформа · Русский / Қазақша</footer>
  </main>;
}
