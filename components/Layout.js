// components/Layout.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 780) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isActive = (path) => router.pathname === path;

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <a className="brand" href="/" aria-label="Startseite">
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

          <button
            className={`hamburger ${open ? 'is-open' : ''}`}
            aria-label="Menü"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            <span /><span /><span />
          </button>

          <nav className="menu" aria-label="Hauptnavigation">
            <a className={`nav-link ${isActive('/') ? 'active' : ''}`} href="/">Start</a>
            <a className={`nav-link ${router.pathname.startsWith('/quiz') ? 'active' : ''}`} href="/quiz">Quiz</a>
            <a className={`nav-link ${isActive('/preise') ? 'active' : ''}`} href="/preise">Preise</a>
            <a className={`nav-link ${isActive('/login') ? 'active' : ''}`} href="/login">Login</a>
          </nav>
        </div>

        <nav className={`mobile-menu ${open ? 'open' : ''}`} aria-label="Mobile Navigation">
          <a className={isActive('/') ? 'active' : ''} href="/" onClick={() => setOpen(false)}>Start</a>
          <a className={isActive('/kurse') ? 'active' : ''} href="/kurse" onClick={() => setOpen(false)}>Kurse</a>
          <a className={router.pathname.startsWith('/quiz') ? 'active' : ''} href="/quiz" onClick={() => setOpen(false)}>Quiz</a>
          <a className={isActive('/preise') ? 'active' : ''} href="/preise" onClick={() => setOpen(false)}>Preise</a>
          <a className={isActive('/login') ? 'active' : ''} href="/login" onClick={() => setOpen(false)}>Login</a>
          <div className="mobile-meta">
            <a href="/impressum" onClick={() => setOpen(false)}>Impressum</a> · <a href="/datenschutz" onClick={() => setOpen(false)}>Datenschutz</a>
          </div>
        </nav>
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
