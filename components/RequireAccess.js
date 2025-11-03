// components/RequireAccess.js
import { useEffect, useState } from 'react';

export default function RequireAccess({ children }) {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    const allowed = typeof window !== 'undefined' && localStorage.getItem('jagdlatein_access') === 'true';
    setOk(allowed);
  }, []);

  if (ok === null) return null; // optional: Loader einblenden
  if (!ok) {
    return (
      <section className="section">
        <div className="container" style={{maxWidth:560}}>
          <h1>Zugang erforderlich</h1>
          <p>Bitte logge dich mit der E-Mail ein, mit der du dein Abo bezahlt hast.</p>
          <a className="cta" href="/login">Zum Login</a>
          <p className="small" style={{marginTop:10}}>Noch kein Abo? <a href="/preise">Preise ansehen</a></p>
        </div>
      </section>
    );
  }
  return children;
}
