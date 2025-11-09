// pages/login.js
import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function tryUserAccess(e) {
    e && e.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      const r = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Login/Check fehlgeschlagen");

      setMsg("Erfolg: Zugang aktiv – weiter zum Quiz …");
      router.replace("/quiz");
      router.reload(); // stellt Cookie-Sync sicher
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  async function tryAdmin(e) {
    e && e.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      const r = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined, adminToken }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Admin-Login fehlgeschlagen");

      setMsg("Admin-Vorschau aktiv. Weiter zum Quiz …");
      router.replace("/quiz");
      router.reload();
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Admin-Check fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  function doLogout() {
    fetch("/api/auth/session", { method: "DELETE" })
      .then(() => setMsg("Abgemeldet."))
      .catch(() => setMsg("Fehler beim Abmelden"));
  }

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
        <summary style={{ cursor: "pointer", fontWeight: 700, marginBottom: 8 }}>
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
            Bei Erfolg wird serverseitig eine Session gesetzt. Zugriff auf Quiz &amp;
            Glossar ohne Abo (nur mit gültigem Admin-Token).
          </p>
        </form>
      </details>

      {msg && <p style={{ marginTop: 16, fontWeight: 700 }}>{msg}</p>}
    </main>
  );
}
