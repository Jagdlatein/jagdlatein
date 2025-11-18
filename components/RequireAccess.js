// components/RequireAccess.js
import { useEffect, useState } from "react";

export default function RequireAccess({ children }) {
  const [state, setState] = useState({ loading: true, ok: false });

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      try {
        const email =
          (typeof window !== "undefined" &&
            localStorage.getItem("jagdlatein_email")) ||
          "";

        // Kein Email im localStorage → kein Zugang
        if (!email) {
          if (!cancelled) {
            setState({ loading: false, ok: false });
          }
          return;
        }

        // WICHTIG: GET mit ?email=… (kein POST-Body mehr)
        const res = await fetch(
          `/api/auth/check?email=${encodeURIComponent(email)}`,
          {
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("AUTH CHECK JSON FEHLER:", text);
        }

        // API liefert { hasAccess: true/false }
        const hasAccess = !!data.hasAccess;

        if (cancelled) return;

        setState({ loading: false, ok: hasAccess });

        if (typeof window !== "undefined") {
          try {
            if (hasAccess) {
              localStorage.setItem("jagdlatein_access", "true");
            } else {
              localStorage.removeItem("jagdlatein_access");
            }
          } catch (e) {
            console.warn("Konnte localStorage in RequireAccess nicht setzen:", e);
          }
        }
      } catch (e) {
        console.error("AUTH CHECK FEHLGESCHLAGEN:", e);
        if (!cancelled) {
          setState({ loading: false, ok: false });
        }
      }
    };

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) return null;

  if (!state.ok) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <h1>Zugang erforderlich</h1>
          <p>
            Bitte logge dich mit der E-Mail ein, mit der du dein Abo bezahlt
            hast.
          </p>
          <a className="cta" href="/login">
            Zum Login
          </a>
          <p className="small" style={{ marginTop: 10 }}>
            Noch kein Abo? <a href="/preise">Preise ansehen</a>
          </p>
        </div>
      </section>
    );
  }

  return children;
}
