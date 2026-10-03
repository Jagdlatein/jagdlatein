// pages/login.js
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

function getNextUrl(next) {
  const value = Array.isArray(next) ? next[0] : next;

  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/";
  }

  try {
    const target = new URL(value, "https://jagdlatein.invalid");
    const pathname = decodeURIComponent(target.pathname).replace(/\/+$/, "");
    if (target.origin !== "https://jagdlatein.invalid" || pathname === "/login") {
      return "/";
    }
  } catch {
    return "/";
  }

  return value;
}

export async function getServerSideProps({ req, query }) {
  if (req.cookies?.jl_session === "1" && query.reauth !== "1") {
    return {
      redirect: {
        destination: getNextUrl(query.next),
        permanent: false,
      },
    };
  }

  return { props: {} };
}

export default function LoginPage() {
  const router = useRouter();

  const nextUrl = getNextUrl(router.query.next);

  const PAYMENT_URL =
    process.env.NEXT_PUBLIC_PAYMENT_URL ||
    "/preise#paypal-subscribe-preise";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("email");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(e) {
    e.preventDefault();
    setMsg("");

    const cleanEmail = email.toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMsg("Bitte gültige E-Mail eingeben.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setMsg(data.message || "Code konnte nicht versendet werden.");
        return;
      }

      setEmail(cleanEmail);
      setStep("code");
      setMsg(
        "Wir haben dir einen 6-stelligen Login-Code per E-Mail geschickt."
      );
    } catch {
      setMsg("Server nicht erreichbar. Bitte später erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    setMsg("");

    if (!/^\d{6}$/.test(code)) {
      setMsg("Bitte den 6-stelligen Login-Code eingeben.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setMsg(data.message || "Login-Code ist ungültig.");
        return;
      }

      setMsg("Erfolgreich eingeloggt – Weiterleitung …");

      setTimeout(() => {
        const accountDestination = ["/konto", "/meine-kurse"].includes(
          nextUrl.split(/[?#]/)[0]
        );

        if (data.admin !== true && data.paid !== true && !accountDestination) {
          const base = String(PAYMENT_URL);
          const next = encodeURIComponent(String(nextUrl));

          const hashIndex = base.indexOf("#");
          const hasHash = hashIndex >= 0;
          const beforeHash = hasHash
            ? base.slice(0, hashIndex)
            : base;
          const afterHash = hasHash
            ? base.slice(hashIndex)
            : "";

          const sep = beforeHash.includes("?") ? "&" : "?";

          window.location.href =
            `${beforeHash}${sep}next=${next}${afterHash}`;

          return;
        }

        window.location.href = String(nextUrl);
      }, 500);
    } catch {
      setMsg("Server nicht erreichbar. Bitte später erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login – Jagdlatein</title>
      </Head>

      <main style={styles.main}>
        <div style={styles.card}>
          <h1 style={styles.title}>
            Willkommen zurück
          </h1>

          {step === "email" ? (
            <>
              <p style={styles.subtitle}>
                Gib deine registrierte E-Mail-Adresse ein.
              </p>

              <form onSubmit={requestCode} style={styles.form}>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="E-Mail-Adresse"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.button,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading
                    ? "Wird gesendet…"
                    : "Login-Code senden"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p style={styles.subtitle}>
                Code an <strong>{email}</strong>
              </p>

              <form onSubmit={verifyCode} style={styles.form}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-stelliger Code"
                  value={code}
                  maxLength={6}
                  onChange={(e) =>
                    setCode(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  style={{
                    ...styles.input,
                    textAlign: "center",
                    fontSize: 24,
                    letterSpacing: 6,
                    fontWeight: 700,
                  }}
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.button,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading
                    ? "Wird geprüft…"
                    : "Einloggen"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setMsg("");
                }}
                style={styles.secondaryButton}
              >
                Andere E-Mail verwenden
              </button>
            </>
          )}

          {msg && (
            <div style={styles.alert}>
              {msg}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    background:
      "linear-gradient(180deg,#faf8f1,#efe7d5)",
  },

  card: {
    background: "#fff",
    padding: "36px 30px",
    borderRadius: 20,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
    textAlign: "center",
  },

  title: {
    fontSize: 32,
    fontFamily: "Georgia, serif",
    color: "#1f2b23",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#6c6458",
    marginBottom: 28,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  input: {
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #cfc7b6",
    fontSize: 16,
    background: "#faf8f1",
    boxSizing: "border-box",
    width: "100%",
  },

  button: {
    background: "#caa53b",
    padding: "14px 16px",
    borderRadius: 14,
    border: "none",
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    color: "#111",
  },

  secondaryButton: {
    marginTop: 16,
    background: "transparent",
    border: "none",
    color: "#6c6458",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: 14,
  },

  alert: {
    marginTop: 18,
    background: "#fff4e5",
    padding: "12px 14px",
    borderRadius: 12,
    fontSize: 14,
    color: "#8a5a1f",
    border: "1px solid #f1d2a8",
  },
};
