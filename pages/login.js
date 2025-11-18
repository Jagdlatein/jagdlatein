// pages/login.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// Cookies setzen / löschen
function setCookie(name, value, days = 40) {
  const maxAge = days * 24 * 60 * 60;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function delCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

// Sicheres Fetch mit JSON-Parsing
async function fetchJsonSafe(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  let data = null;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("❌ Server hat KEIN gültiges JSON geschickt:", text);
    throw new Error("Server-Antwort ist ungültig (kein JSON).");
  }

  return { res, data };
}

// nach Login immer auf /quiz
function getNextPath() {
  return "/quiz";
}

// Harte Weiterleitung, wenn Login erfolgreich
function hardRedirectToNext() {
  if (typeof window !== "undefined") {
    window.location.href = getNextPath();
  }
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyAdmin, setBusyAdmin] = useState(false);

  useEffect(() => {
    // Optional: könnte vorhandene Session prüfen / redirecten
  }, []);

  // USER-LOGIN
  async function tryUserAccess(e) {
    e?.preventDefault();
    setBusy(true);
    setMsg("");

    try {
      const { res, data } = await fetchJsonSafe(
        `/api/auth/check?email=${encodeURIComponent(email)}`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error(data?.error || "Serverfehler");
      }

      if (data?.hasAccess) {
        // Cookies
        setCookie("jl_session", "1");
        setCookie("jl_paid", "1");
        setCookie("jl_email", encodeURIComponent(email));

        // Variante A: LocalStorage für RequireAccess
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("jagdlatein_email", email);
            localStorage.setItem("jagdlatein_access", "true");
          } catch (e) {
            console.warn("Konnte localStorage nicht setzen:", e);
          }
        }

        setMsg("Erfolg: Zugang aktiv – weiter …");
        hardRedirectToNext();
      } else {
        setMsg("Kein aktives Abo zu dieser E-Mail gefunden.");
      }
    } catch (err) {
      console.error("Login-Fehler:", err);
      setMsg(err?.message || "Unbekannter Fehler");
    } finally {
      setBusy(false);
    }
  }

  // ADMIN-LOGIN (Token)
  async function tryAdminAccess(e) {
    e?.preventDefault();
    setBusyAdmin(true);
    setMsg("");

    try {
      const { res, data } = await fetchJsonSafe("/api/admin/auth/check", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Admin-Token ungültig.");
      }

      setCookie("jl_admin", "1");
      if (email) setCookie("jl_email", encodeURIComponent(email));
      setCookie("jl_session", "1");

      setMsg("Admin-Vorschau aktiv. Weiter …");
      hardRedirectToNext();
    } catch (err) {
      console.error("Admin-Login-Fehler:", err);
      setMsg(err?.message || "Admin-Login fehlgeschlagen");
    } finally {
      setBusyAdmin(false);
    }
  }

  // Logout
  function handleLogout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach(delCookie);

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("jagdlatein_email");
        localStorage.removeItem("jagdlatein_access");
      } catch (e) {
        console.warn("Konnte localStorage nicht löschen:", e);
      }

      window.location.href = "/";
    } else {
      router.replace("/");
    }
  }

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "40px auto",
        padding: "0 16px 40px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Login Jagdlatein</h1>
      <p style={{ marginBottom: 24 }}>
        Gib deine E-Mail-Adresse ein, mit der du dein Abo abgeschlossen hast.
      </p>

      {/* User Login */}
      <form onSubmit={tryUserAccess} style={{ marginBottom: 32 }}>
        <label
          htmlFor="email"
          style={{ display: "block", fontWeight: 600, marginBottom: 8 }}
        >
          E-Mail-Adresse
        </label>
        <input
          id="email"
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
              padding: "10px 16px",
              borderRadius: 999,
              border: "none",
              background: "#136f39",
              color: "white",
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Prüfe Zugang …" : "Login"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid #ccc",
              background: "white",
              color: "#444",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </form>

      {/* Admin-Login */}
      <details>
        <summary
          style={{
            cursor: "pointer",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Admin-Login (Token)
        </summary>
        <form onSubmit={tryAdminAccess}>
          <label
            htmlFor="adminToken"
            style={{ display: "block", fontWeight: 600, marginBottom: 8 }}
          >
            Admin-Token
          </label>
          <input
            id="adminToken"
            type="text"
            required
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value.trim())}
            placeholder="Admin-Token"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
            }}
          />
          <button
            disabled={busyAdmin}
            style={{
              marginTop: 12,
              padding: "10px 16px",
              borderRadius: 999,
              border: "none",
              background: "#333",
              color: "white",
              fontWeight: 600,
              cursor: busyAdmin ? "wait" : "pointer",
              opacity: busyAdmin ? 0.7 : 1,
            }}
          >
            {busyAdmin ? "Prüfe Token …" : "Admin-Login"}
          </button>
          <p style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
            Bei Erfolg wird <code>jl_admin=1</code> gesetzt.
          </p>
        </form>
      </details>

      {msg && (
        <p style={{ marginTop: 16, fontWeight: 700 }}>
          {msg}
        </p>
      )}
    </main>
  );
}
