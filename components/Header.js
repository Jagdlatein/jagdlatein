// components/Header.js
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href) =>
    router.pathname === href || router.pathname.startsWith(href + "/");

function logout() {
  ["jl_session","jl_paid","jl_email","jl_admin"].forEach(n => {
    document.cookie = `${n}=; Path=/; Max-Age=0; SameSite=Lax`;
  });
  // direkt ins Hauptmenü
  window.location.replace("/");
}

  return (
    <header className="header">
      <div className="container header-inner">
        {/* Text-Brand */}
        <Link href="/" className="brand" aria-label="Startseite">
          <span className="brand-title">
            <span className="brand-name">Jagdlatein</span>
            <small>Lernplattform</small>
          </span>
        </Link>

        {/* Desktop-Menü */}
        <nav className="menu">
          <Link href="/quiz" className={`nav-link ${isActive("/quiz") ? "active" : ""}`}>
            Quiz
          </Link>
          <Link href="/glossar" className={`nav-link ${isActive("/glossar") ? "active" : ""}`}>
            Glossar
          </Link>
          <button onClick={logout} className="nav-link" style={{ fontWeight: 800 }}>
            Logout
          </button>
        </nav>

        {/* Hamburger für Mobile */}
        <button
          className={`hamburger ${open ? "is-open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Menü öffnen"
          aria-expanded={open}
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      {/* Mobiles Menü */}
      <div className={`mobile-menu ${open ? "open" : ""}`}>
        <Link href="/quiz" className={isActive("/quiz") ? "active" : ""} onClick={() => setOpen(false)}>
          Quiz
        </Link>
        <Link href="/glossar" className={isActive("/glossar") ? "active" : ""} onClick={() => setOpen(false)}>
          Glossar
        </Link>
        <button onClick={() => { setOpen(false); logout(); }}>Logout</button>
        <div className="mobile-meta">© {new Date().getFullYear()} Jagdlatein</div>
      </div>
    </header>
  );
}
