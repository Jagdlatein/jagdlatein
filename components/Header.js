"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const s = !!getCookie("jl_session");
    const a = getCookie("jl_admin") === "1";
    setLoggedIn(s);
    setIsAdmin(a);
  }, []);

  function logout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((n) => {
      document.cookie = `${n}=; Path=/; Max-Age=0; SameSite=Lax`;
    });
    window.location.replace("/");
  }

  return (
    <header className="header">

      {/* OBERER HEADER */}
      <div className="container header-inner">

        {/* BRAND */}
        <Link href="/" className="brand">
          <span className="brand-title">
            <span className="brand-name">Jagdlatein</span>
            <small>Lernplattform</small>
          </span>
        </Link>

        {/* DESKTOP MENÜ */}
        <nav className="menu">
          <Link href="/quiz" className="nav-link">Quiz</Link>
          <Link href="/glossar" className="nav-link">Glossar</Link>
          <Link href="/ebook" className="nav-link">📘 E-Book</Link>

          {!loggedIn && (
            <Link href="/login" className="nav-link">Login</Link>
          )}

          {loggedIn && (
            <>
              {isAdmin && (
                <Link href="/admin/glossar" className="nav-link">
                  Admin
                </Link>
              )}

              <button
                onClick={logout}
                className="nav-link"
                type="button"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>

      {/* UNTERE LEISTE */}
      <div className="header-sub">
        <div className="container header-sub-inner">

          <Link href="/quiz">Quiz</Link>
          <span>·</span>

          <Link href="/glossar">Glossar</Link>
          <span>·</span>

          <Link href="/ebook">E-Book</Link>

          {!loggedIn && (
            <>
              <span>·</span>
              <Link href="/login">Login</Link>
            </>
          )}

          {loggedIn && (
            <>
              <span>·</span>
              <button className="logout-btn-inline" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>

    </header>
  );
}
