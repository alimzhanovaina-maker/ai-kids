"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Material = {
  id: string;
  title: string;
  kind: string | null;
  created_at: string;
};

export default function MaterialsManager({ initialItems }: { initialItems: Material[] }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const kinds = useMemo(
    () => Array.from(new Set(items.map((item) => item.kind || "Материал"))),
    [items]
  );

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesText = !normalized || item.title.toLocaleLowerCase().includes(normalized);
      const matchesKind = filter === "all" || (item.kind || "Материал") === filter;
      return matchesText && matchesKind;
    });
  }, [items, query, filter]);

  async function renameMaterial(id: string) {
    const title = editTitle.trim();
    if (!title) {
      setNotice("Название не может быть пустым.");
      return;
    }
    setBusyId(id);
    setNotice("");
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось переименовать материал.");
      setItems((current) => current.map((item) => item.id === id ? { ...item, title: data.project.title } : item));
      setEditingId(null);
      setNotice("Название материала обновлено.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Ошибка сохранения.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteMaterial(id: string, title: string) {
    if (!window.confirm(`Удалить материал «${title}»? Это действие нельзя отменить.`)) return;
    setBusyId(id);
    setNotice("");
    try {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось удалить материал.");
      setItems((current) => current.filter((item) => item.id !== id));
      setNotice("Материал удалён.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Ошибка удаления.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="manager">
      <div className="manager-tools">
        <label className="search-box">
          <span>🔎</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти материал по названию..." />
        </label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Фильтр по типу материала">
          <option value="all">Все типы</option>
          {kinds.map((kind) => <option value={kind} key={kind}>{kind}</option>)}
        </select>
      </div>

      {notice && <p className="manager-notice" role="status">{notice}</p>}

      {visibleItems.length ? (
        <div className="materials">
          {visibleItems.map((item) => (
            <article className="material" key={item.id}>
              <Link href={`/dashboard/materials/${item.id}`} className="material-open" aria-label={`Открыть ${item.title}`}>
                <div className="material-art">
                  <span>{item.kind === "story" ? "📖" : item.kind === "game" ? "🧩" : item.kind === "illustration" ? "🎨" : item.kind === "cards" ? "🖍️" : item.kind === "lesson" ? "📝" : "✏️"}</span>
                  <i>↗</i>
                </div>
              </Link>
              <div className="material-body">
                <small>{item.kind || "Материал"}</small>
                {editingId === item.id ? (
                  <div className="edit-area">
                    <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={100} aria-label="Новое название материала" />
                    <div className="card-actions">
                      <button onClick={() => renameMaterial(item.id)} disabled={busyId === item.id}>{busyId === item.id ? "Сохраняем..." : "Сохранить"}</button>
                      <button className="muted-button" onClick={() => setEditingId(null)} disabled={busyId === item.id}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link href={`/dashboard/materials/${item.id}`} className="material-title">{item.title}</Link>
                    <p>📅 {new Date(item.created_at).toLocaleDateString("ru-RU")}</p>
                    <p className="open-hint">Открыть материал →</p>
                    <div className="card-actions">
                      <button onClick={() => { setEditingId(item.id); setEditTitle(item.title); setNotice(""); }}>✏️ Переименовать</button>
                      <button className="delete-button" onClick={() => deleteMaterial(item.id, item.title)} disabled={busyId === item.id}>{busyId === item.id ? "..." : "🗑 Удалить"}</button>
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <span>🔍</span>
          <b>{items.length ? "Ничего не найдено" : "Пока нет сохранённых материалов"}</b>
          <p>{items.length ? "Измени запрос или выбери другой тип." : "Создай материал в мастерской и сохрани его здесь."}</p>
          {items.length > 0 && <button onClick={() => { setQuery(""); setFilter("all"); }}>Сбросить фильтры</button>}
        </div>
      )}

      <style jsx>{`
        .manager-tools{display:flex;gap:12px;margin:0 0 18px}
        .search-box{display:flex;align-items:center;gap:9px;flex:1;min-height:46px;padding:0 14px;border:2px solid #e7edf5;border-radius:13px;background:#fff}
        .search-box input{width:100%;border:0;outline:0;background:transparent;color:#294363;font:inherit;font-size:13px}
        .manager-tools select{min-width:170px;padding:0 13px;border:2px solid #e7edf5;border-radius:13px;background:#fff;color:#426ba8;font:inherit;font-size:12px;font-weight:800}
        .manager-notice{margin:0 0 14px;padding:10px 13px;border-radius:11px;background:#edf5ff;color:#426ba8;font-size:12px;font-weight:800}
        .materials{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
        .material{overflow:hidden;border:2px solid #eeeaf0;border-radius:20px;background:white;box-shadow:0 5px 0 #e9e5de}
        .material-open{display:block;text-decoration:none}
        .material-art{height:105px;position:relative;display:grid;place-items:center;background:linear-gradient(120deg,#ffeacb,#f9e0ed)}
        .material:nth-child(3n+2) .material-art{background:linear-gradient(120deg,#e2edff,#e5e1ff)}
        .material:nth-child(3n) .material-art{background:linear-gradient(120deg,#dff3e7,#fff0c9)}
        .material-art span{font-size:54px;filter:drop-shadow(0 5px 3px #33445a20)}
        .material-art i{position:absolute;right:22px;top:12px;color:white;font-size:22px;font-style:normal}
        .material-body{padding:15px}
        .material-body small{display:inline-block;padding:5px 9px;border-radius:20px;background:#f1f4fa;color:#69809e;font-size:9px;font-weight:1000}
        .material-title{display:block;margin:9px 0 7px;color:#294363;font-size:15px;font-weight:900;text-decoration:none;overflow-wrap:anywhere}
        .material-title:hover{color:#527bc0}
        .material-body p{margin:0;color:#8290a4;font-size:11px}
        .material-body .open-hint{margin-top:8px;color:#527bc0;font-size:12px;font-weight:1000}
        .card-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}
        .card-actions button,.no-results button{padding:8px 10px;border:0;border-radius:9px;background:#eaf0fc;color:#42649b;font-size:10px;font-weight:900;cursor:pointer}
        .card-actions .delete-button{background:#fff0ed;color:#b45c50}
        .card-actions .muted-button{background:#f1f3f6;color:#718096}
        .card-actions button:disabled{opacity:.6;cursor:wait}
        .edit-area{margin-top:10px}
        .edit-area input{box-sizing:border-box;width:100%;padding:10px;border:2px solid #dce6f5;border-radius:9px;outline:none;color:#294363;font:inherit;font-size:12px}
        .no-results{min-height:210px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:2px dashed #e9d9b8;border-radius:20px;background:#fffaf0;text-align:center;padding:20px;color:#294363}
        .no-results span{font-size:35px}.no-results p{margin:0;color:#77879e;font-size:12px}
        @media(max-width:800px){.materials{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:560px){.manager-tools{flex-direction:column}.manager-tools select{min-height:45px}.materials{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
