import Seo from '../components/Seo';

export default function Home() {
  return (
    <>
      <Seo
        title="Jagdlatein – Lernplattform für die Jagdprüfung (DE · AT · CH)"
        description="Prüfungsnah lernen mit Glossar, Karteikarten und Quiz. Monatlich kündbar. Jetzt 7 Tage kostenlos testen."
      />

      <section className="hero hero-xl">
        <div className="container">
          <img
            src="/logo.png"
            alt="Jagdlatein"
            className="hero-logo"
            onError={(e)=>{ e.currentTarget.style.display='none'; }}
          />
          <h1>Bestehen mit System.</h1>
          <p className="lead">
            Jagdprüfung in <b>Deutschland · Österreich · Schweiz</b> — klar strukturiert,
            mobilfreundlich und prüfungsnah.
          </p>
          <div className="cta-row">
            <a className="cta" href="/preise">Jetzt 7 Tage kostenlos testen</a>
            <a className="btn" href="/quiz">Quiz ansehen</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid">
            <div className="card">
              <h3>Glossar</h3>
              <p>Alle wichtigen Begriffe des Jagdwesens – prägnant und verständlich erklärt.</p>
              <a className="btn" href="/login">Öffnen</a>
            </div>
            <div className="card">
              <h3>Karteikarten</h3>
              <p>Effizientes Wiederholen mit spaced repetition – ideal fürs Handy.</p>
              <a className="btn" href="/login">Öffnen</a>
            </div>
            <div className="card">
              <h3>Quiz</h3>
              <p>Originalnah trainieren mit themenscharfen Fragenpools (DE/AT/CH).</p>
              <a className="btn" href="/quiz">Öffnen</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2>Warum Jagdlatein?</h2>
          <div className="grid">
            <div className="card">
              <h3>Prüfungsnah</h3>
              <p>Struktur nach Prüfungsordnungen – Fokus auf relevante Inhalte.</p>
            </div>
            <div className="card">
              <h3>Mobilfreundlich</h3>
              <p>Alles funktioniert schnell & sauber auf dem Handy.</p>
            </div>
            <div className="card">
              <h3>Immer aktuell</h3>
              <p>Laufende Pflege und Erweiterung der Inhalte.</p>
            </div>
            <div className="card">
              <h3>Von Jägern</h3>
              <p>Praxisnahe Beispiele, klare Sprache, echte Jagd-Situationen.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="trust">
            <div className="trust-item">DE · AT · CH</div>
            <div className="trust-item">Karteikarten & Quiz</div>
            <div className="trust-item">Monatlich kündbar</div>
          </div>
        </div>
      </section>
    </>
  );
}
