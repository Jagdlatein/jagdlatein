export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <img
            src="/logo.png"
            alt="Jagdlatein"
            className="hero-logo"
            onError={(e)=>{ e.currentTarget.style.display='none' }}
          />
          <h1>Jagdlatein</h1>
          <p>Lernplattform für die Jagdprüfung in DE · AT · CH</p>
          <a className="cta" href="/preise">Jetzt 7 Tage kostenlos testen</a>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid">
            <div className="card">
              <h3>Glossar</h3>
              <p>Die wichtigsten Begriffe aus dem Jagdlatein – klar erklärt.</p>
              <a className="btn" href="/login">Öffnen</a>
            </div>
            <div className="card">
              <h3>Karteikarten</h3>
              <p>Wissen festigen mit smarten Lernkarten – mobilfreundlich.</p>
              <a className="btn" href="/login">Öffnen</a>
            </div>
            <div className="card">
              <h3>Quiz</h3>
              <p>Prüfungsnahes Training – bereite dich realistisch vor.</p>
              <a className="btn" href="/quiz">Öffnen</a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
export default function Home() {
  return <div style={{padding:20, fontFamily:'system-ui'}}>Hallo Jagdlatein 👋 – Build-Test OK</div>;
}
