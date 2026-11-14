"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const labels: Record<string,string> = {game:"Дидактическая игра",story:"Авторская сказка",illustration:"Задание для иллюстрации",cards:"Карточки для печати",worksheet:"Рабочий лист",lesson:"КСП / конспект занятия",author:"Авторская методическая разработка"};
export default function Studio() {
  const [type,setType]=useState("game"),[topic,setTopic]=useState("Животные"),[age,setAge]=useState("4 года"),[language,setLanguage]=useState("both"),[format,setFormat]=useState("Цветной, для детей"),[result,setResult]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  useEffect(()=>{const t=new URLSearchParams(window.location.search).get("type");if(t&&labels[t])setType(t)},[]);
  async function generate(){setBusy(true);setError("");setResult("");try{const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,topic,age,language,format})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Не удалось создать материал");setResult(data.content)}catch(e){setError(e instanceof Error?e.message:"Ошибка");}finally{setBusy(false)}}
  async function save(){const r=await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:labels[type]+": "+topic,kind:type,topic,content:result,language})});const d=await r.json();if(!r.ok){setError(d.error||"Не удалось сохранить");return}setError("Материал сохранён в твоём кабинете.");}
  return <main className="shell"><header className="topbar"><Link className="brand" href="/"><span className="brand-mark">✦</span> AI KIDS</Link><nav className="nav"><Link href="/">Главная</Link><Link href="/dashboard">Мой кабинет</Link></nav><Link className="btn secondary" href="/login">Войти</Link></header>
    <h1 className="section-title">✨ Творческая мастерская</h1><p className="muted">Выбери инструмент, тему и язык — AI KIDS подготовит основу материала.</p>
    <div className="panel" style={{marginTop:18}}><div className="form-grid">
      <div className="field"><label>Что создаём?</label><select value={type} onChange={e=>setType(e.target.value)}>{Object.entries(labels).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></div>
      <div className="field"><label>Возраст</label><select value={age} onChange={e=>setAge(e.target.value)}><option>3 года</option><option>4 года</option><option>5 лет</option><option>6 лет</option></select></div>
      <div className="field"><label>Тема</label><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Например, времена года"/></div>
      <div className="field"><label>Язык</label><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="both">Русский + қазақша</option><option value="ru">Русский</option><option value="kz">Қазақша</option></select></div>
      <div className="field"><label>Оформление</label><select value={format} onChange={e=>setFormat(e.target.value)}><option>Цветной, для детей</option><option>Чёрно-белый, для печати</option><option>Пастельный</option></select></div>
    </div><button className="btn" style={{marginTop:18}} disabled={busy||!topic.trim()} onClick={generate}>{busy?"Создаём...":"✨ Создать материал"}</button>
    {error&&<p className="muted" style={{marginTop:12}}>{error}</p>}
    {result&&<><div className="result">{result}</div><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14}}><button className="btn" onClick={save}>Сохранить в кабинете</button><button className="btn secondary" onClick={()=>navigator.clipboard.writeText(result)}>Скопировать</button></div></>}
    </div><footer className="footer">AI KIDS · Твори с заботой о детях</footer></main>;
}
