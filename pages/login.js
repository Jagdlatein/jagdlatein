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

// Robust: Serverantwort erst als Text holen, dann JSON parsen
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // E-Mail aus ?email= vorbelegen (optional)
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query || {};
    if (typeof q.email === "string") setEmail(q.email);
  }, [router.isReady, router.query]);

  function hardRedirectToNext() {
    const next = getNextPath();
    if (typeof window !== "undefined") {
      window.location.href = next;
    } else {
      router.replace(next);
    }
  }

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
        setCookie("jl_session", "1");
        setCookie("jl_paid", "1");
        setCookie("jl_email", encodeURIComponent(email));

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

  // ADMIN-LOGIN
  async function tryAdmin(e) {
    e?.preventDefault();
    setBusy(true);
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
      setMsg(err?.message || "Admin-Check fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  function doLogout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach(delCookie);
    if (typeof window !== "undefined") {
      window.location.href = "/"; // direkt Startseite
    } else {
      router.replace("/");
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>
        Login
      </h1>

      <p style={{ opacity: 0.9, marginBottom: "1rem" }}>
        Nutze die E-Mail, die du beim Kauf hinterlegt hast. <br />
        Nach dem Login ist der komplette Zugang zur Lernplattform für dich
        freigeschaltet.
      </p>

      {/* User-Login */}
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
        <label
          style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
        >
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
          <label
            style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
          >
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
          <p
            style={{
              fontSize: 13,
              opacity: 0.8,
              marginTop: 8,
            }}
          >
            Bei Erfolg wird jl_admin=1 gesetzt.
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
