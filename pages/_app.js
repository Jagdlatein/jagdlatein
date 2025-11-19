import "../styles/globals.css";

export default function MyApp({ Component, pageProps }) {
  return (
    <div className="app-wrapper">
      {/* HEADER */}
      <header className="navbar">
        <a href="/" className="logo">Jagdlatein</a>
        <a href="/api/auth/logout" className="logout-btn">Logout</a>
      </header>

      {/* CONTENT */}
      <main className="content-area">
        <Component {...pageProps} />
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="bottom-nav">
        <a href="/kurse">Kurse</a>
        <a href="/quiz">Quiz</a>
        <a href="/glossar">Glossar</a>
        <a href="/ebook">E-Book</a>
      </nav>
    </div>
  );
}
