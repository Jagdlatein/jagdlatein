import { useState, useEffect } from 'react'

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)

  // Menü schließen bei Resize auf Desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const closeOnNav = () => setOpen(false)

  return (
    <>
      <header className={`header ${open ? 'header--mobile-open' : ''}`}>
        <div className="container header-inner">
          <a className="brand" href="/" aria-label="Startseite">
            <div style={{ width: 28, height: 28, background: '#D4AF37', borderRadius: '50%' }} />
            <div>Jagdlatein <span>• Lernplattform</span></div>
          </a>

          {/* Hamburger */}
          <button
            className={`hamburger ${open ? 'is-open' : ''}`}
            aria-label="Menü"
            aria-expanded={open ? 'true' : 'false'}
            aria-controls="primary-nav"
            onClick={() => setOpen(v => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          {/* Desktop-Menü */}
          <nav id="primary-nav" className="menu desktop-menu">
            <a href="/">Start</a>
            <a href="/kurse">Kurse</a>
            <a href="/quiz">Quiz</a>
            <a href="/preise">Preise</a>
            <a href="/login">Login</a>
          </nav>
        </div>

        {/* Mobile-Menü */}
        <nav className={`mobile-menu ${open ? 'open' : ''}`}>
          <a href="/" onClick={closeOnNav}>Start</a>
          <a href="/kurse" onClick={closeOnNav}>Kurse</a>
          <a href="/quiz" onClick={closeOnNav}>Quiz</a>
          <a href="/preise" onClick={closeOnNav}>Preise</a>
          <a href="/login" onClick={closeOnNav}>Login</a>
          <div className="mobile-meta">
            <a href="/impressum" onClick={closeOnNav}>Impressum</a> · <a href="/datenschutz" onClick={closeOnNav}>Datenschutz</a>
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="footer">
