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
    </div>
  );
}
