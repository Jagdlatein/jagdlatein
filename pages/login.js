// pages/login.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

// kleine Cookie-Helpers (Client)
function setCookie(name, value, days = 40) {
  const maxAge = days * 24 * 60 * 60; // Tage → Sekunden
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}
function delCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Ziel nach Login (z.B. ?next=/glossar)
  const nextDest = useMemo(() => {
    if (typeof window === "undefined") return "/quiz";
    try {
      const usp = new URLSearchParams(window.location.search);
      return usp.get("next") || "/quiz";
    } catch {
      return "/quiz";
    }
  }, []);

  async function tryUserAccess(e) {
    e && e.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      const r = await fetch(`/api/auth/check?email=${encodeURIComponent(email)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      let data = null;
      let text = "";
      try {
        text = await r.text();
        data = JSON.parse(text);
      } catch {
        // keine JSON-Antwort → ignoriere, wird unten behandelt
      }

      if (!r.ok) {
        throw new Error((data && (data.error || data.message)) || text || "Serverfehler");
      }

      if (data?.hasAccess) {
        // Session-Cookies setzen (so erwartet es deine Middleware)
        setCookie("jl_session", "1");
        setCookie("jl_paid", "1");
        setCookie("jl_email", encodeURIComponent(email));

        setMsg("Erfolg: Zugang aktiv – weiterleiten …");
        // Client-Routing + Fallback auf Hard Redirect
        router.replace(nextDest);
        setTimeout(() => {
          if (typeof window !== "undefined") window.location.href = nextDest;
        }, 800);
        return;
      } else {
        setMsg("Kein aktives Abo zu dieser E-Mail gefunden.");
      }
    } catch (err) {
      console.error(err);
      setMsg(err?.message || "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  async function tryAdmin(e) {
    e && e.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      // Falls du eine Admin-Route hast, dort den Token prüfen.
      // Alternativ: einfache Vorschau ohne Servercheck:
      if (!adminToken) throw new Error("Bitte Admin-Token eingeben.");
      setCookie("jl_admin", "1");
      if (email) setCookie("jl_email", encodeURIComponent(email));
      setCookie("jl_session", "1");
      setMsg("Admin-Vorschau aktiv. Weiter …");
      router.replace(nextDest);
      setTimeout(() => {
        if (typeof window !== "undefined") window.location.href = nextDest;
      }, 800);
    } catch (err) {
      console.error(err);
      setMsg(err?.message || "Admin-Login fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  function doLogout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach(delCookie);
    window.location.href = "/login";
  }

  // Optional: Query-Param ?email= vorbelegen
  useEffect(() => {
    if (!router.isReady) return;
    const qEmail = router.query?.email;
    if (typeof qEmail === "string" && qEmail) {
      setEmail(qEmail.trim());
    }
  }, [router.isReady, router.query]);

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>
        Login
      </h1>

      <p style={{ opacity: 0.9, marginBottom: "1rem" }}>
        Gib die E-Mail ein, mit der du bezahlt hast. Dein Zugang wird automatisch
        geprüft.
      </p>

      <form
        onSubmit={tryUserAccess}
        style={{
          background: "#fff",
          padding: "1rem",
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,.06)",
          marginBottom: "1rem",
        }}
      >
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          E-Mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          placeholder="deine@mail.de"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button
            disabled={busy}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#111",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {busy ? "Bitte warten…" : "Einloggen"}
          </button>
          <button
            type="button"
            onClick={doLogout}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
            }}
          >
            Abmelden
          </button>
        </div>
      </form>

      <details>
        <summary
          style={{ cursor: "pointer", fontWeight: 700, marginBottom: 8 }}
        >
          Admin-Login (Token)
        </summary>
        <form
          onSubmit={tryAdmin}
          style={{
            background: "#fff",
            padding: "1rem",
            borderRadius: 12,
            boxShadow: "0 2px 10px rgba(0,0,0,.06)",
            marginTop: 10,
          }}
        >
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
            Admin-Token
          </label>
          <input
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="ADMIN_PASS Token"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
            }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button
              disabled={busy}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "#0a7",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Als Admin einloggen (Preview)
            </button>
          </div>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
            Bei Erfolg wird clientseitig eine Session gesetzt. Zugriff auf Quiz &
            Glossar ohne Abo (nur mit gültigem Admin-Token).
          </p>
        </form>
      </details>

      {msg && <p style={{ marginTop: 16, fontWeight: 700 }}>{msg}</p>}
    </main>
  );
}
