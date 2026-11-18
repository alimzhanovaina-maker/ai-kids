
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StoryLibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: books, error } = await supabase
    .from("projects")
    .select("id,title,topic,language,created_at,content")
    .eq("user_id", user.id)
    .eq("kind", "storybook")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Не удалось загрузить библиотеку сказок.");
  }

  return (
    <main className="library">
      <header className="topbar">
        <Link href="/dashboard" className="back">← Мой кабинет</Link>
        <Link href="/" className="brand">✦ AI KIDS 📚</Link>
        <Link href="/studio/storybook" className="create">＋ Новая сказка</Link>
      </header>

      <section className="hero">
        <span>✨ МОЯ ТВОРЧЕСКАЯ КОЛЛЕКЦИЯ</span>
        <h1>Моя библиотека сказок 📚</h1>
        <p>
          Здесь хранятся твои авторские истории с иллюстрациями.
          Открывай книги и возвращайся к ним в любое время.
        </p>
        <div className="count">📖 Сохранено книг: {books?.length || 0}</div>
      </section>

      {books && books.length > 0 ? (
        <section className="grid">
          {books.map((book) => {
            let pages = 0;

            try {
              const content =
                typeof book.content === "string"
                  ? JSON.parse(book.content)
                  : book.content;
              pages = Array.isArray(content?.story?.pages)
                ? content.story.pages.length
                : 0;
            } catch {
              pages = 0;
            }

            const language =
              book.language === "kz"
                ? "Қазақша"
                : book.language === "both"
                  ? "Русский + қазақша"
                  : "Русский";

            return (
              <article className="book" key={book.id}>
                <div className="cover">
                  <span>📖</span>
                  <small>AI KIDS · МОЯ СКАЗКА</small>
                </div>

                <div className="info">
                  <h2>{book.title}</h2>
                  {book.topic && <p className="topic">{book.topic}</p>}
                  <div className="meta">
                    <span>📄 {pages} страниц</span>
                    <span>🌍 {language}</span>
                    <span>
                      📅 {new Date(book.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  </div>

                  <Link
                    className="open"
                    href={`/studio/storybook?project=${book.id}`}
                  >
                    Открыть книгу →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="empty">
          <span>📚</span>
          <h2>Твоя библиотека пока пуста</h2>
          <p>
            Создай первую сказку и нажми «Сохранить книгу».
            Она появится здесь.
          </p>
          <Link href="/studio/storybook" className="create">
            ✨ Создать первую сказку
          </Link>
        </section>
      )}

      <footer>✦ AI KIDS · Большие идеи для маленьких открытий</footer>

      <style>{`
        .library {
          max-width: 1150px;
          margin: 0 auto;
          padding: 22px 25px 45px;
          color: #294363;
          font-family: Nunito, system-ui, sans-serif;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 25px;
        }
        .back, .create {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 16px;
          border-radius: 13px;
          font-size: 12px;
          font-weight: 1000;
          text-decoration: none;
        }
        .back {
          border: 2px solid #e7edf5;
          color: #426ba8;
        }
        .create {
          background: #527bc0;
          color: white;
        }
        .brand {
          color: #294363;
          font-size: 22px;
          font-weight: 1000;
          text-decoration: none;
        }
        .hero {
          padding: 35px;
          border-radius: 27px;
          background: linear-gradient(120deg,#e58ca7,#9b91d7,#7895d5);
          color: white;
        }
        .hero > span {
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 1.5px;
        }
        .hero h1 {
          margin: 12px 0;
          font-size: clamp(29px,4vw,42px);
        }
        .hero p {
          max-width: 620px;
          color: #fff8ff;
          font-size: 14px;
          line-height: 1.7;
        }
        .count {
          display: inline-block;
          margin-top: 10px;
          padding: 10px 15px;
          border-radius: 20px;
          background: #ffffff30;
          font-size: 12px;
          font-weight: 900;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 20px;
          margin-top: 30px;
        }
        .book {
          overflow: hidden;
          border: 2px solid #eeeaf0;
          border-radius: 21px;
          background: white;
          box-shadow: 0 5px 0 #e9e5de;
        }
        .cover {
          min-height: 165px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg,#e1eaff,#f4e1f4);
        }
        .cover span { font-size: 65px; }
        .cover small {
          color: #647da6;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 1px;
        }
        .info { padding: 17px; }
        .info h2 {
          margin: 0;
          font-size: 18px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }
        .topic {
          color: #8491a5;
          font-size: 12px;
        }
        .meta {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin: 14px 0;
          color: #71819a;
          font-size: 11px;
        }
        .open {
          display: flex;
          justify-content: center;
          padding: 12px;
          border-radius: 11px;
          background: #edf2fc;
          color: #426ba8;
          font-size: 12px;
          font-weight: 1000;
          text-decoration: none;
        }
        .empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-top: 30px;
          padding: 45px 20px;
          border: 2px dashed #e5dcbf;
          border-radius: 22px;
          background: #fffaf0;
          text-align: center;
        }
        .empty > span { font-size: 55px; }
        .empty h2 { margin: 0; }
        .empty p {
          max-width: 420px;
          color: #8290a4;
          font-size: 13px;
          line-height: 1.6;
        }
        footer {
          margin-top: 35px;
          padding-top: 20px;
          border-top: 2px dashed #eadfcb;
          color: #8995a7;
          text-align: center;
          font-size: 11px;
        }
        @media(max-width:800px) {
          .grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
        }
        @media(max-width:560px) {
          .library { padding: 14px; }
          .topbar { flex-wrap: wrap; }
          .brand { order: -1; width: 100%; }
          .hero { padding: 24px; }
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
