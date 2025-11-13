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
  const [menuOpen, setMenuOpen] = useState(false);

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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="header">
      <div className="container header-inner">

        {/* BRAND */}
        <Link href="/" className="brand">
          <span className="brand-title">
            <span className="brand-name">Jagdlatein</span>
            <small>Lernplattform</small>
          </span>
        </Link>

        {/* DESKTOP MENU */}
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

        {/* HAMBURGER (immer da auf Mobile, Styling macht den Rest) */}
        <div
          className={`hamburger${menuOpen ? " open" : ""}`}
          role="button"
          aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={menuOpen}
          tabIndex={0}
          onClick={() => setMenuOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setMenuOpen((v) => !v);
            }
          }}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <Link href="/quiz" onClick={closeMenu}>Quiz</Link>
        <Link href="/glossar" onClick={closeMenu}>Glossar</Link>
        <Link href="/ebook" onClick={closeMenu}>📘 E-Book</Link>

        {!loggedIn && (
          <Link href="/login" onClick={closeMenu}>Login</Link>
        )}

        {loggedIn && (
          <>
            {isAdmin && (
              <Link href="/admin/glossar" onClick={closeMenu}>
                Admin
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                closeMenu();
                logout();
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
