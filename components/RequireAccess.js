import { useEffect, useState } from "react";

export default function RequireAccess({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      try {
        const response = await fetch("/api/auth/status", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Zugang nicht erreichbar");
        const auth = await response.json();
        if (!cancelled) {
          setState({ loading: false, ok: auth.loggedIn === true && (auth.paid === true || auth.admin === true) });
        }
      } catch {
        if (!cancelled) setState({ loading: false, ok: false });
      }
    }

    checkAccess();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) return <p role="status">Dein Zugang wird geprüft …</p>;

  if (!state.ok) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <h1>Zugang erforderlich</h1>
          <p>Bitte logge dich mit der E-Mail ein, mit der du dein Abo bezahlt hast.</p>
          <a className="cta" href="/login">Zum Login</a>
          <p className="small" style={{ marginTop: 10 }}>Noch kein Abo? <a href="/preise">Preise ansehen</a></p>
        </div>
      </section>
    );
  }

  return children;
}
