import { useState, useEffect } from 'react'

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <a className="brand" href="/" aria-label="Startseite">
            <span className="brand-dot" />
            <div>Jagdlatein <span style={{color:'var(--brand)'}}>• Lernplattform</span></div>
          </a>

          <button
            className={`hamburger ${open ? 'is-open' : ''}`}
            aria-label="Menü"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            <span/><span/><span/>
          </button>

          <nav className="menu" aria-label="Hauptnavigation">
            <a href="/">Start</a>
            <a href="/kurse">Kurse</a>
            <a href="/quiz">Quiz</a>
            <a href="/preise">Preise</a>
            <a href="/login">Login</a>
          </nav>
        </div>

        <nav className={`mobile-menu ${open ? 'open' : ''}`}>
          <a href="/" onClick={() => setOpen(false)}>Start</a>
          <a href="/kurse" onClick={() => setOpen(false)}>Kurse</a>
          <a href="/quiz" onClick={() => setOpen(false)}>Quiz</a>
          <a href="/preise" onClick={() => setOpen(false)}>Preise</a>
          <a href="/login" onClick={() => setOpen(false)}>Login</a>
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
  )
}
