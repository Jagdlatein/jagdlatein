// components/RequireAccess.js
import { useEffect, useState } from 'react';

export default function RequireAccess({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    const fn = async () => {
      try {
        const email = (typeof window !== 'undefined' && localStorage.getItem('jagdlatein_email')) || '';
        if (!email) return setState({ loading: false, ok: false });
        const res = await fetch('/api/auth/check', { method: 'POST', body: JSON.stringify({ email }) });
        const data = await res.json();
        setState({ loading: false, ok: !!data.active });
        if (!data.active) {
          localStorage.removeItem('jagdlatein_access');
        } else {
          localStorage.setItem('jagdlatein_access', 'true');
        }
      } catch {
        setState({ loading: false, ok: false });
      }
    };
    fn();
  }, []);

  if (state.loading) return null;
  if (!state.ok) {
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
