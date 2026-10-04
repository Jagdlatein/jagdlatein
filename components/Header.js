"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAuth() {
      try {
        const response = await fetch("/api/auth/status", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Anmeldestatus nicht erreichbar");

        const auth = await response.json();
        if (active) {
          setIsLoggedIn(auth.loggedIn === true);
          setIsPaid(auth.paid === true);
        }
      } catch {
        if (active) {
          setIsLoggedIn(false);
          setIsPaid(false);
        }
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    loadAuth();
    return () => { active = false; };
  }, []);
  // Logout über die API löscht die HttpOnly-Cookies.
  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="logo">
          Jagdlatein Die Lernplattform
        </Link>

        <nav className="nav-links">
          <Link href="/">Start</Link>
          <Link href="/preise">Preise</Link>

          {isLoggedIn && (
            <>
              <Link href="/quiz-app">Quiz</Link>
              <Link href="/glossar">Glossar</Link>
              <Link href="/kurse">Kurse</Link>
              <Link href="/lernen">Lernbereich</Link>

              {isPaid && <Link href="/protected/ebook">E-Book</Link>}

              <Link href="/konto">Mein Konto</Link>

              <button
                onClick={logout}
                className="logout-btn"
                style={{
                  background: "none",
                  border: "1px solid #caa53b",
                  padding: "6px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          )}

          {!authLoading && !isLoggedIn && (
            <>
              <Link href="/login">Login</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
