import Seo from '../components/Seo';

export default function Home() {
  const hasAccess = typeof window !== 'undefined' && localStorage.getItem('jagdlatein_access') === 'true';

  return (
    <>
      <Seo
        title="Jagdlatein – Online lernen für die Jagdprüfung"
        description="Lernprogramm für Deutschland, Österreich und Schweiz. Quiz, Definitionen und Prüfungswissen online."
        image="/og.png"
      />

      <section className="hero">
        <div className="container">
          <img src="/logo.png" alt="Jagdlatein Logo" className="hero-logo" />
          <h1>Jagdlatein</h1>

          {hasAccess && (
            <p className="status">✅ Zugang aktiv – Willkommen zurück!</p>
          )}

          <p className="tagline">
            Lernen für Jagdschein und Praxis in Deutschland, Österreich &amp; Schweiz
          </p>

          <div className="cta-group">
            {hasAccess ? (
              <a href="/quiz" className="cta">Weiter zum Quiz</a>
            ) : (
              <>
                <a href="/preise" className="cta">Jetzt freischalten</a>
                <a href="/login" className="btn">Login</a>
              </>
            )}
          </div>

          {/* Kleine Kontext-Navigation — HIER innerhalb des JSX */}
          <p className="small" style={{marginTop:16}}>
            <a href="/quiz" style={{marginRight:10}}>Zum Quiz</a> ·
            <a href="/glossar" style={{marginLeft:10}}>Zum Glossar</a>
          </p>
        </div>
      </section>
    </>
  );
}
