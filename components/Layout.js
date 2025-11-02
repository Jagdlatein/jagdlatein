// components/Layout.js
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  // Schließt das Mobile-Menü beim Resize auf Desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 780) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <a className="brand" href="/" aria-label="Startseite">
            {/* PNG-Logo, fällt bei Fehler automatisch auf SVG zurück */}
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

          {/* Hamburger für Mobil */}
          <button
            className={`hamburger ${open ? 'is-open' : ''}`}
            aria-label="Menü"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            <span /><span /><span />
          </button>

          {/* Desktop-Menü */}
          <nav className="menu" aria-label="Hauptnavigation">
            <a href="/">Start</a>
            <a href="/kurse">Kurse</a>
            <a href="/quiz">Quiz</a>
            <a href="/preise">Preise</a>
            <a href="/login">Login</a>
          </nav>
        </div>

        {/* Mobile-Menü */}
        <nav className={`mobile-menu ${open ? 'open' : ''}`} aria-label="Mobile Navigation">
          <a href="/" onClick={() => setOpen(false)}>Start</a>
          <a href="/kurse" onClick={() => setOpen(false)}>Kurse</a>
          <a href="/quiz" onClick={() => setOpen(false)}>Quiz</a>
          <a href="/preise" onClick={() => setOpen(false)}>Preise</a>
          <a href="/login" onClick={() => setOpen(false)}>Login</a>
          <div className="mobile-meta">
            <a href="/impressum" onClick={() => setOpen(false)}>Impressum</a> ·{' '}
            <a href="/datenschutz" onClick={() => setOpen(false)}>Datenschutz</a>
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="container small">
          © 2025 Jagdlatein – Von Jägern. Für Jäger. • <a href="/impressum">Impressum</a> •{' '}
          <a href="/datenschutz">Datenschutz</a>
        </div>
      </footer>
    </>
  );
}
