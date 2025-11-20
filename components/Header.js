"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const cookie = document.cookie || "";

      setIsLoggedIn(cookie.includes("jl_session=1"));
      setIsPaid(cookie.includes("jl_paid=1"));
    }
  }, []);

  // 🔥 KORREKTER LOGOUT — über API Route (löscht HttpOnly Cookies)
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
              <Link href="/quiz">Quiz</Link>
              <Link href="/glossar">Glossar</Link>
              <Link href="/kurse">Kurse</Link>

              {isPaid && <Link href="/protected/ebook">E-Book</Link>}

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

          {!isLoggedIn && (
            <>
              <Link href="/login">Login</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
