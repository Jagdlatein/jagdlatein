import "../styles/globals.css";

export default function MyApp({ Component, pageProps }) {
  return (
    <div className="app-wrapper">
      {/* HEADER */}
      <header className="navbar">
        <a href="/" className="logo">Jagdlatein Die Lernplattform</a>
        
      </header>

      {/* CONTENT */}
      <main className="content-area">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
