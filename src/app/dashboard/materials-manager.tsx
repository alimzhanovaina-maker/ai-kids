
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Material = {
  id: string;
  title: string;
  kind: string | null;
  created_at: string;
};

const typeInfo: Record<
  string,
  { label: string; icon: string; background: string }
> = {
  cards: {
    label: "Карточки",
    icon: "🖍️",
    background: "linear-gradient(135deg, #ffe6c7, #f8dcec)",
  },
  story: {
    label: "Сказки",
    icon: "📖",
    background: "linear-gradient(135deg, #dce8ff, #e9ddff)",
  },
  game: {
    label: "Развивающие игры",
    icon: "🧩",
    background: "linear-gradient(135deg, #d8f3e5, #dcecff)",
  },
  illustration: {
    label: "Иллюстрации",
    icon: "🎨",
    background: "linear-gradient(135deg, #ffe0e5, #fff0c9)",
  },
  lesson: {
    label: "Планы занятий",
    icon: "📝",
    background: "linear-gradient(135deg, #dfeaff, #ddf3ed)",
  },
  worksheet: {
    label: "Рабочие листы",
    icon: "📄",
    background: "linear-gradient(135deg, #fff0d5, #e8e2ff)",
  },
  ksp: {
    label: "КСП",
    icon: "📚",
    background: "linear-gradient(135deg, #dfeaff, #ddf3ed)",
  },
  presentation: {
    label: "Презентации",
    icon: "🖥️",
    background: "linear-gradient(135deg, #dcecff, #f9e2ed)",
  },
  material: {
    label: "Материалы",
    icon: "🌟",
    background: "linear-gradient(135deg, #e8e8ff, #e1f5e8)",
  },
};

function getType(kind: string | null) {
  const key = (kind || "material").toLowerCase();

  return (
    typeInfo[key] || {
      label: kind || "Материал",
      icon: "✨",
      background: "linear-gradient(135deg, #e8e8ff, #e1f5e8)",
    }
  );
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
    const normalized = query.trim().toLocaleLowerCase();

    return items.filter((item) => {
      const matchesText =
        !normalized ||
        item.title.toLocaleLowerCase().includes(normalized);

      const matchesKind =
        filter === "all" || (item.kind || "material") === filter;

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

      if (!response.ok) {
        throw new Error(data.error || "Не удалось переименовать материал.");
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, title: data.project.title }
            : item
        )
      );

      setEditingId(null);
      setNotice("Название материала обновлено.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Ошибка сохранения."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteMaterial(id: string, title: string) {
    if (
      !window.confirm(
        `Удалить материал «${title}»? Это действие нельзя отменить.`
      )
    ) {
      return;
    }

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
      setNotice(
        error instanceof Error ? error.message : "Ошибка удаления."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="manager">
      <div className="manager-tools">
        <label className="search-box">
          <span>🔎</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти материал по названию..."
          />

          {query && (
            <button
              className="clear-search"
              onClick={() => setQuery("")}
              type="button"
              aria-label="Очистить поиск"
            >
              ×
            </button>
          )}
        </label>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Фильтр по типу материала"
        >
          <option value="all">Все типы</option>
          {kinds.map((kind) => (
            <option value={kind} key={kind}>
              {getType(kind).label}
            </option>
          ))}
        </select>
      </div>

      <div className="results-line">
        <span>
          Найдено материалов: <b>{visibleItems.length}</b>
        </span>

        {(query || filter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {notice && (
        <p className="manager-notice" role="status">
          {notice}
        </p>
      )}

      {visibleItems.length > 0 ? (
        <div className="materials">
          {visibleItems.map((item) => {
            const type = getType(item.kind);

            return (
              <article className="material" key={item.id}>
                <Link
                  href={`/dashboard/materials/${item.id}`}
                  className="material-art"
                  aria-label={`Открыть ${item.title}`}
                  style={{ background: type.background }}
                >
                  <span className="decoration decoration-one" />
                  <span className="decoration decoration-two" />

                  <span className="fallback-icon">
                    {type.icon}
                  </span>

                  <span className="art-label">
                    {type.label}
                  </span>

                  <span className="art-arrow">↗</span>
                </Link>

                <div className="material-body">
                  <span className="type-label">
                    {type.icon} {type.label}
                  </span>

                  {editingId === item.id ? (
                    <div className="edit-area">
                      <label>Новое название</label>

                      <input
                        value={editTitle}
                        onChange={(event) =>
                          setEditTitle(event.target.value)
                        }
                        maxLength={100}
                        aria-label="Новое название материала"
                      />

                      <div className="card-actions">
                        <button
                          onClick={() => renameMaterial(item.id)}
                          disabled={busyId === item.id}
                        >
                          {busyId === item.id
                            ? "Сохраняем..."
                            : "✓ Сохранить"}
                        </button>

                        <button
                          className="muted-button"
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
                        className="material-title"
                      >
                        {item.title}
                      </Link>

                      <p className="material-date">
                        📅{" "}
                        {new Date(item.created_at).toLocaleDateString("ru-RU")}
                      </p>

                      <Link
                        href={`/dashboard/materials/${item.id}`}
                        className="open-hint"
                      >
                        Открыть материал →
                      </Link>

                      <div className="card-actions">
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
                          className="delete-button"
                          onClick={() =>
                            deleteMaterial(item.id, item.title)
                          }
                          disabled={busyId === item.id}
                        >
                          {busyId === item.id
                            ? "Удаляем..."
                            : "🗑 Удалить"}
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
        <div className="no-results">
          <span>🔍</span>

          <b>
            {items.length
              ? "Ничего не найдено"
              : "Пока нет сохранённых материалов"}
          </b>

          <p>
            {items.length
              ? "Попробуй изменить запрос или выбрать другой тип."
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
        .manager {
          width: 100%;
        }

        .manager-tools {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-height: 48px;
          padding: 0 15px;
          border: 2px solid #e7edf5;
          border-radius: 14px;
          background: white;
        }

        .search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #294363;
          font: inherit;
          font-size: 13px;
        }

        .clear-search {
          border: 0;
          background: transparent;
          color: #8b9ab0;
          font-size: 22px;
          cursor: pointer;
        }

        .manager-tools select {
          min-width: 180px;
          padding: 0 13px;
          border: 2px solid #e7edf5;
          border-radius: 14px;
          background: white;
          color: #426ba8;
          font: inherit;
          font-size: 12px;
          font-weight: 900;
        }

        .results-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 2px 16px;
          color: #8795a9;
          font-size: 11px;
        }

        .results-line b {
          color: #426ba8;
        }

        .results-line button {
          border: 0;
          background: transparent;
          color: #527bc0;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }

        .manager-notice {
          margin: 0 0 15px;
          padding: 11px 14px;
          border-radius: 12px;
          background: #edf5ff;
          color: #426ba8;
          font-size: 12px;
          font-weight: 900;
        }

        .materials {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .material {
          min-width: 0;
          overflow: hidden;
          border: 2px solid #eeeaf0;
          border-radius: 21px;
          background: white;
          box-shadow: 0 5px 0 #e9e5de;
          transition: transform .2s, box-shadow .2s;
        }

        .material:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 0 #e9e5de;
        }

        .material-art {
          position: relative;
          display: flex;
          width: 100%;
          height: 150px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: inherit;
          text-decoration: none;
        }

        .decoration {
          position: absolute;
          display: block;
          border-radius: 50%;
          background: #ffffff55;
        }

        .decoration-one {
          width: 130px;
          height: 130px;
          top: -65px;
          left: -30px;
        }

        .decoration-two {
          width: 100px;
          height: 100px;
          right: -30px;
          bottom: -50px;
        }

        .fallback-icon {
          position: relative;
          z-index: 1;
          font-size: 66px;
          line-height: 1;
          filter: drop-shadow(0 7px 5px #33445a30);
        }

        .art-label {
          position: absolute;
          left: 14px;
          bottom: 12px;
          z-index: 2;
          padding: 6px 11px;
          border-radius: 20px;
          background: #ffffffdf;
          color: #526b8e;
          font-size: 10px;
          font-weight: 900;
        }

        .art-arrow {
          position: absolute;
          right: 15px;
          top: 12px;
          z-index: 2;
          color: white;
          font-size: 24px;
          font-weight: 900;
        }

        .material-body {
          padding: 15px;
        }

        .type-label {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          background: #f1f4fa;
          color: #69809e;
          font-size: 9px;
          font-weight: 1000;
        }

        .material-title {
          display: block;
          min-height: 42px;
          margin: 10px 0 7px;
          color: #294363;
          font-size: 15px;
          font-weight: 1000;
          line-height: 1.4;
          text-decoration: none;
          overflow-wrap: anywhere;
        }

        .material-title:hover {
          color: #527bc0;
        }

        .material-date {
          margin: 0;
          color: #8290a4;
          font-size: 11px;
        }

        .open-hint {
          display: inline-block;
          margin-top: 10px;
          color: #527bc0;
          font-size: 12px;
          font-weight: 1000;
          text-decoration: none;
        }

        .card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 13px;
        }

        .card-actions button,
        .no-results button {
          padding: 9px 11px;
          border: 0;
          border-radius: 10px;
          background: #eaf0fc;
          color: #42649b;
          font-size: 10px;
          font-weight: 1000;
          cursor: pointer;
        }

        .card-actions .delete-button {
          background: #fff0ed;
          color: #b45c50;
        }

        .card-actions .muted-button {
          background: #f1f3f6;
          color: #718096;
        }

        .card-actions button:disabled {
          opacity: .6;
          cursor: wait;
        }

        .edit-area {
          margin-top: 10px;
        }

        .edit-area label {
          display: block;
          margin-bottom: 6px;
          color: #718096;
          font-size: 11px;
          font-weight: 900;
        }

        .edit-area input {
          box-sizing: border-box;
          width: 100%;
          padding: 10px;
          border: 2px solid #dce6f5;
          border-radius: 9px;
          outline: none;
          color: #294363;
          font: inherit;
          font-size: 12px;
        }

        .no-results {
          min-height: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 22px;
          border: 2px dashed #e9d9b8;
          border-radius: 20px;
          background: #fffaf0;
          color: #294363;
          text-align: center;
        }

        .no-results span {
          font-size: 39px;
        }

        .no-results p {
          margin: 0;
          color: #77879e;
          font-size: 12px;
        }

        @media (max-width: 900px) {
          .materials {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .manager-tools {
            flex-direction: column;
          }

          .manager-tools select {
            min-height: 46px;
          }

          .materials {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
