
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Material = {
  id: string;
  title: string;
  kind: string | null;
  created_at: string;
};

const types: Record<string, { label: string; icon: string; bg: string }> = {
  cards: { label: "Карточки", icon: "🖍️", bg: "linear-gradient(135deg,#ffe6c7,#f8dcec)" },
  story: { label: "Сказки", icon: "📖", bg: "linear-gradient(135deg,#dce8ff,#e9ddff)" },
  game: { label: "Развивающие игры", icon: "🧩", bg: "linear-gradient(135deg,#d8f3e5,#dcecff)" },
  illustration: { label: "Иллюстрации", icon: "🎨", bg: "linear-gradient(135deg,#ffe0e5,#fff0c9)" },
  lesson: { label: "Планы занятий", icon: "📝", bg: "linear-gradient(135deg,#dfeaff,#ddf3ed)" },
  worksheet: { label: "Рабочие листы", icon: "📄", bg: "linear-gradient(135deg,#fff0d5,#e8e2ff)" },
  ksp: { label: "КСП", icon: "📚", bg: "linear-gradient(135deg,#dfeaff,#ddf3ed)" },
  presentation: { label: "Презентации", icon: "🖥️", bg: "linear-gradient(135deg,#dcecff,#f9e2ed)" },
  material: { label: "Материалы", icon: "🌟", bg: "linear-gradient(135deg,#e8e8ff,#e1f5e8)" },
};

function getType(kind: string | null) {
  const key = (kind || "material").toLowerCase();
  return types[key] || {
    label: kind || "Материал",
    icon: "✨",
    bg: "linear-gradient(135deg,#e8e8ff,#e1f5e8)",
  };
}

export default function MaterialsManager({
  initialItems,
}: {
  initialItems: Material[];
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const kinds = useMemo(
    () => Array.from(new Set(items.map((item) => item.kind || "material"))),
    [items]
  );

  const visibleItems = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !search || item.title.toLocaleLowerCase().includes(search);
      const matchesFilter =
        filter === "all" || (item.kind || "material") === filter;

      return matchesSearch && matchesFilter;
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

      if (!response.ok) {
        throw new Error(data.error || "Не удалось изменить название.");
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, title: data.project.title } : item
        )
      );

      setEditingId(null);
      setNotice("Название материала обновлено.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Ошибка сохранения.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteMaterial(id: string, title: string) {
    if (!window.confirm(`Удалить материал «${title}»?`)) return;

    setBusyId(id);
    setNotice("");

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось удалить материал.");
      }

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
      <div className="tools">
        <label className="search">
          <span>🔎</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти материал по названию..."
          />
          {query && (
            <button type="button" onClick={() => setQuery("")}>×</button>
          )}
        </label>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Фильтр по типу"
        >
          <option value="all">Все типы</option>
          {kinds.map((kind) => (
            <option key={kind} value={kind}>
              {getType(kind).label}
            </option>
          ))}
        </select>
      </div>

      <div className="results">
        <span>Найдено материалов: <b>{visibleItems.length}</b></span>
        {(query || filter !== "all") && (
          <button
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {notice && <p className="notice">{notice}</p>}

      {visibleItems.length > 0 ? (
        <div className="materials">
          {visibleItems.map((item) => {
            const type = getType(item.kind);

            return (
              <article className="material" key={item.id}>
                <Link
                  href={`/dashboard/materials/${item.id}`}
                  aria-label={`Открыть ${item.title}`}
                  style={{
                    position: "relative",
                    display: "flex",
                    width: "100%",
                    height: "150px",
                    minHeight: "150px",
                    boxSizing: "border-box",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    background: type.bg,
                    color: "inherit",
                    textDecoration: "none",
                    borderRadius: "18px 18px 0 0",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      width: "130px",
                      height: "130px",
                      top: "-65px",
                      left: "-30px",
                      borderRadius: "50%",
                      background: "#ffffff66",
                      zIndex: 0,
                      pointerEvents: "none",
                    }}
                  />

                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      width: "100px",
                      height: "100px",
                      right: "-30px",
                      bottom: "-50px",
                      borderRadius: "50%",
                      background: "#ffffff66",
                      zIndex: 0,
                      pointerEvents: "none",
                    }}
                  />

                  <span
                    style={{
                      position: "relative",
                      zIndex: 1,
                      display: "block",
                      fontSize: "66px",
                      lineHeight: 1,
                      filter: "drop-shadow(0 7px 5px #33445a30)",
                      pointerEvents: "none",
                    }}
                  >
                    {type.icon}
                  </span>

                  <span
                    style={{
                      position: "absolute",
                      left: "14px",
                      bottom: "12px",
                      zIndex: 2,
                      padding: "6px 11px",
                      borderRadius: "20px",
                      background: "#ffffffdf",
                      color: "#526b8e",
                      fontSize: "10px",
                      fontWeight: 900,
                      lineHeight: 1.2,
                    }}
                  >
                    {type.label}
                  </span>

                  <span
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "12px",
                      zIndex: 2,
                      color: "#ffffff",
                      fontSize: "24px",
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    ↗
                  </span>
                </Link>

                <div className="body">
                  <span className="type-label">
                    {type.icon} {type.label}
                  </span>

                  {editingId === item.id ? (
                    <div className="edit-area">
                      <label>Новое название</label>
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        maxLength={100}
                      />

                      <div className="actions">
                        <button
                          onClick={() => renameMaterial(item.id)}
                          disabled={busyId === item.id}
                        >
                          {busyId === item.id ? "Сохраняем..." : "✓ Сохранить"}
                        </button>
                        <button
                          className="muted"
                          onClick={() => setEditingId(null)}
                          disabled={busyId === item.id}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link
                        href={`/dashboard/materials/${item.id}`}
                        className="title"
                      >
                        {item.title}
                      </Link>

                      <p className="date">
                        📅 {new Date(item.created_at).toLocaleDateString("ru-RU")}
                      </p>

                      <Link
                        href={`/dashboard/materials/${item.id}`}
                        className="open-link"
                      >
                        Открыть материал →
                      </Link>

                      <div className="actions">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditTitle(item.title);
                            setNotice("");
                          }}
                        >
                          ✏️ Переименовать
                        </button>

                        <button
                          className="delete"
                          onClick={() => deleteMaterial(item.id, item.title)}
                          disabled={busyId === item.id}
                        >
                          {busyId === item.id ? "Удаляем..." : "🗑 Удалить"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <span>🔍</span>
          <b>
            {items.length ? "Ничего не найдено" : "Пока нет сохранённых материалов"}
          </b>
          <p>
            {items.length
              ? "Измени запрос или выбери другой тип."
              : "Создай материал в мастерской и сохрани его здесь."}
          </p>
          {items.length > 0 && (
            <button
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Показать все материалы
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .manager { width: 100%; }
        .tools { display: flex; gap: 12px; margin-bottom: 12px; }
        .search {
          display: flex; align-items: center; gap: 10px; flex: 1;
          min-height: 48px; padding: 0 15px; border: 2px solid #e7edf5;
          border-radius: 14px; background: white;
        }
        .search input {
          width: 100%; border: 0; outline: 0; background: transparent;
          color: #294363; font: inherit; font-size: 13px;
        }
        .search button {
          border: 0; background: transparent; color: #8b9ab0;
          font-size: 22px; cursor: pointer;
        }
        .tools select {
          min-width: 180px; padding: 0 13px; border: 2px solid #e7edf5;
          border-radius: 14px; background: white; color: #426ba8;
          font: inherit; font-size: 12px; font-weight: 900;
        }
        .results {
          display: flex; justify-content: space-between; margin: 0 2px 16px;
          color: #8795a9; font-size: 11px;
        }
        .results b { color: #426ba8; }
        .results button {
          border: 0; background: transparent; color: #527bc0;
          font: inherit; font-weight: 900; cursor: pointer;
        }
        .notice {
          padding: 11px 14px; border-radius: 12px; background: #edf5ff;
          color: #426ba8; font-size: 12px; font-weight: 900;
        }
        .materials {
          display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px;
        }
        .material {
          min-width: 0; overflow: hidden; border: 2px solid #eeeaf0;
          border-radius: 21px; background: white; box-shadow: 0 5px 0 #e9e5de;
          transition: transform .2s, box-shadow .2s;
        }
        .material:hover {
          transform: translateY(-3px); box-shadow: 0 8px 0 #e9e5de;
        }
        .body { padding: 15px; }
        .type-label {
          display: inline-block; padding: 5px 9px; border-radius: 20px;
          background: #f1f4fa; color: #69809e; font-size: 9px; font-weight: 1000;
        }
        .title {
          display: block; min-height: 42px; margin: 10px 0 7px;
          color: #294363; font-size: 15px; font-weight: 1000;
          line-height: 1.4; text-decoration: none; overflow-wrap: anywhere;
        }
        .title:hover { color: #527bc0; }
        .date { margin: 0; color: #8290a4; font-size: 11px; }
        .open-link {
          display: inline-block; margin-top: 10px; color: #527bc0;
          font-size: 12px; font-weight: 1000; text-decoration: none;
        }
        .actions { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 13px; }
        .actions button, .empty button {
          padding: 9px 11px; border: 0; border-radius: 10px;
          background: #eaf0fc; color: #42649b; font-size: 10px;
          font-weight: 1000; cursor: pointer;
        }
        .actions .delete { background: #fff0ed; color: #b45c50; }
        .actions .muted { background: #f1f3f6; color: #718096; }
        .actions button:disabled { opacity: .6; cursor: wait; }
        .edit-area { margin-top: 10px; }
        .edit-area label {
          display: block; margin-bottom: 6px; color: #718096;
          font-size: 11px; font-weight: 900;
        }
        .edit-area input {
          box-sizing: border-box; width: 100%; padding: 10px;
          border: 2px solid #dce6f5; border-radius: 9px; outline: none;
          color: #294363; font: inherit; font-size: 12px;
        }
        .empty {
          min-height: 220px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 9px; padding: 22px;
          border: 2px dashed #e9d9b8; border-radius: 20px;
          background: #fffaf0; color: #294363; text-align: center;
        }
        .empty span { font-size: 39px; }
        .empty p { margin: 0; color: #77879e; font-size: 12px; }
        @media (max-width: 900px) {
          .materials { grid-template-columns: repeat(2,minmax(0,1fr)); }
        }
        @media (max-width: 560px) {
          .tools { flex-direction: column; }
          .tools select { min-height: 46px; }
          .materials { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
