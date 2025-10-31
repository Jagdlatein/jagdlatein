export default function NotFound() {
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
            <a href="/preise">Preise</a>
            <a href="/login">Login</a>
          </nav>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <h1>Seite nicht gefunden</h1>
          <p>Die aufgerufene Seite existiert nicht.</p>
          <a className="btn" href="/">Zur Startseite</a>
        </div>
      </section>
    </>
  );
}
