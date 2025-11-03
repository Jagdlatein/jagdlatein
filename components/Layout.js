// components/Layout.js
export default function Layout({ children }) {
  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <a className="brand" href="/" aria-label="Startseite">
            {/* PNG-Logo, fällt bei Fehler auf SVG */}
            <img
              src="/logo.png"
              alt="Jagdlatein"
              className="logo"
              onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
            />
            <div className="brand-title">
              <span>Jagdlatein</span>
              <small>• Lernplattform</small>
            </div>
          </a>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="container small">
          © 2025 Jagdlatein – Von Jägern. Für Jäger. • <a href="/impressum">Impressum</a> • <a href="/datenschutz">Datenschutz</a>
        </div>
        <img src="/logo.src" alt="Jagdlatein" className="logo" />

      </footer>
    </>
  );
}
