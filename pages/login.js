// pages/login.js
import { useState } from "react";
import { useRouter } from "next/router";

function setCookie(name, value, days = 40) {
  const maxAge = days * 24 * 60 * 60; // Tage → Sekunden
  // Secure nur auf Produktionsdomain mit https
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
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

  async function tryUserAccess(e) {
    e && e.preventDefault();
    setBusy(true); setMsg("");

    try {
      // Dein Backend /api/auth/check liefert: { ok, hasAccess, status, plan, expiresAt, ... }
      // Email wird als Query mitgegeben (funktioniert bei dir bereits).
      const r = await fetch(`/api/auth/check?email=${encodeURIComponent(email)}`, {
        headers: { "Accept": "application/json" },
        cache: "no-store",
      });
      const data = await r.json();

      if (!r.ok) throw new Error(data?.error || "Serverfehler");

      if (data?.hasAccess) {
        // >>> Cookies setzen: exakt was die Middleware erwartet
        setCookie("jl_session", "1");
        setCookie("jl_paid", "1");
        setCookie("jl_email", encodeURIComponent(email));

        setMsg("Erfolg: Zugang aktiv – weiter zum Quiz …");
        router.replace("/quiz");
        return;
      } else {
        setMsg("Kein aktives Abo zu dieser E-Mail gefunden.");
      }
    } catch (err) {
      console.error(err);
      setMsg(err.message || "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  async function tryAdmin(e) {
    e && e.preventDefault();
    setBusy(true); setMsg("");

    try {
      // Prüft den Admin-Token gegen ENV ADMIN_PASS (dein endpoint existiert schon)
      const r = await fetch("/api/admin/auth/check", {
        headers: { "Authorization": `Bearer ${adminToken}` },
      });
      const data = await r.json();

      if (data?.ok) {
        // Nur Admin-Preview: jl_admin=1 reicht in deiner Middleware
        setCookie("jl_admin", "1");
        if (email) setCookie("jl_email", encodeURIComponent(email));
        setCookie("jl_session", "1"); // Komfort: eingeloggt markieren
        setMsg("Admin-Vorschau aktiv. Weiter zum Quiz …");
        router.replace("/quiz");
      } else {
        setMsg("Admin-Token ungültig.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Admin-Check fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  function doLogout() {
    // Clientseitig alle relevanten Cookies löschen
    ["jl_session","jl_paid","jl_email","jl_admin"].forEach(delCookie);
    setMsg("Abgemeldet.");
  }

  return (
    <main style={{maxWidth: 720, margin: "2rem auto", padding: "0 1rem"}}>
      <h1 style={{fontSize: "2rem", fontWeight: 800, marginBottom: "1rem"}}>Login</h1>

      <p style={{opacity:.9, marginBottom:"1rem"}}>
        Gib die E-Mail ein, mit der du bezahlt hast. Dein Zugang wird automatisch geprüft.
      </p>

      <form onSubmit={tryUserAccess}
            style={{background:"#fff", padding:"1rem", borderRadius:12, boxShadow:"0 2px 10px rgba(0,0,0,.06)", marginBottom:"1rem"}}>
        <label style={{display:"block", fontWeight:600, marginBottom:6}}>E-Mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={e=>setEmail(e.target.value.trim())}
          placeholder="deine@mail.de"
          style={{width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #ddd"}}
        />
        <div style={{display:"flex", gap:12, marginTop:12}}>
          <button disabled={busy}
            style={{padding:"10px 14px", borderRadius:10, border:"none", background:"#111", color:"#fff", fontWeight:700}}
          >
            {busy ? "Bitte warten…" : "Einloggen"}
          </button>
          <button type="button" onClick={doLogout}
            style={{padding:"10px 14px", borderRadius:10, border:"1px solid #ddd", background:"#fff"}}
          >
            Abmelden
          </button>
        </div>
      </form>

      <details>
        <summary style={{cursor:"pointer", fontWeight:700, marginBottom:8}}>Admin-Login (Token)</summary>
        <form onSubmit={tryAdmin}
              style={{background:"#fff", padding:"1rem", borderRadius:12, boxShadow:"0 2px 10px rgba(0,0,0,.06)", marginTop:10}}>
          <label style={{display:"block", fontWeight:600, marginBottom:6}}>Admin-Token</label>
          <input
            type="password"
            value={adminToken}
            onChange={e=>setAdminToken(e.target.value)}
            placeholder="ADMIN_PASS Token"
            style={{width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #ddd"}}
          />
          <div style={{display:"flex", gap:12, marginTop:12}}>
            <button disabled={busy}
              style={{padding:"10px 14px", borderRadius:10, border:"none", background:"#0a7", color:"#fff", fontWeight:700}}
            >
              Als Admin einloggen (Preview)
            </button>
          </div>
          <p style={{fontSize:13, opacity:.8, marginTop:8}}>
            Bei Erfolg wird <code>jl_admin=1</code> gesetzt. Zugriff auf Quiz & Glossar ohne Abo.
          </p>
        </form>
      </details>

      {msg && <p style={{marginTop:16, fontWeight:700}}>{msg}</p>}
    </main>
  );
}
