export default function Layout({ children }) {
  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="brand">
            <div style={{ width: 28, height: 28, background: '#D4AF37', borderRadius: '50%' }} />
            <div>Jagdlatein <span>• Lernplattform</span></div>
          </div>
          <nav className="menu">
            <a href="/">Start</a>
            <a href="/kurse">Kurse</a>
            <a href="/quiz">Quiz</a>
            <a href="/preise">Preise</a>
            <a href="/login">Login</a>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="container small">
          © 2025 Jagdlatein – Von Jägern. Für Jäger. • <a href="/impressum">Impressum</a> • <a href="/datenschutz">Datenschutz</a>
        </div>
      </footer>
    </>
  );
}
