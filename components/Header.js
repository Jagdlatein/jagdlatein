// components/Header.js
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [open, setOpen] = useState(false);

  // Menü schliessen bei Route-Wechsel oder Resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 900) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="jl-header">
      <div className="inner">
        {/* Textmarke statt Logo */}
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="title">Jagdlatein</span>
          <span className="tag">• Lernplattform</span>
        </Link>

        {/* Desktop-Menü */}
        <nav className="nav">
          <Link href="/">Start</Link>
          <Link href="/glossar">Glossar</Link>
          <Link href="/quiz">Quiz</Link>
          <Link href="/preise">Preise</Link>
          <Link href="/login">Login</Link>
        </nav>

        {/* Burger für Mobile */}
        <button
          className="burger"
          aria-label="Menü"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile-Dropdown */}
      {open && (
        <div className="mobile">
          <Link href="/" onClick={() => setOpen(false)}>Start</Link>
          <Link href="/glossar" onClick={() => setOpen(false)}>Glossar</Link>
          <Link href="/quiz" onClick={() => setOpen(false)}>Quiz</Link>
          <Link href="/preise" onClick={() => setOpen(false)}>Preise</Link>
          <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
        </div>
      )}

      <style jsx>{`
        .jl-header {
          position: sticky; top: 0; z-index: 50;
          backdrop-filter: saturate(120%) blur(6px);
          background: rgba(248, 246, 238, 0.9); /* dezentes Beige wie auf deiner Seite */
          border-bottom: 1px solid #e6eee6;
        }
        .inner {
          max-width: 1100px; margin: 0 auto;
          padding: 10px 14px; display: flex; align-items: center; gap: 14px;
        }
        .brand {
          display: flex; align-items: baseline; gap: 8px;
          text-decoration: none;
        }
        .title {
          font-weight: 800; letter-spacing: -0.015em;
          color: #1b1d1f; font-size: 20px;
        }
        .tag {
          color: #6b7280; font-size: 13px;
        }
        .nav {
          margin-left: auto; display: flex; gap: 16px;
        }
        .nav :global(a) {
          color: #1b1d1f; text-decoration: none; font-weight: 600;
          padding: 8px 10px; border-radius: 10px;
        }
        .nav :global(a:hover) {
          background: #eef3ef; /* mehr Kontrast */
        }
        .burger {
          margin-left: auto; display: none;
          width: 42px; height: 38px; border-radius: 10px;
          border: 1px solid #dfe7df; background: #fff; cursor: pointer;
          align-items: center; justify-content: center; gap: 4px;
        }
        .burger span { display: block; width: 20px; height: 2px; background: #1b1d1f; }
        .mobile {
          display: none;
        }

        /* Mobile */
        @media (max-width: 900px) {
          .nav { display: none; }
          .burger { display: inline-flex; }
          .mobile {
            display: grid; gap: 6px; padding: 10px 14px 12px; border-top: 1px solid #e6eee6;
            background: rgba(248, 246, 238, 0.96);
          }
          .mobile :global(a) {
            text-decoration: none; color: #1b1d1f; font-weight: 600;
            padding: 10px 12px; border-radius: 10px;
          }
          .mobile :global(a:hover) { background: #eef3ef; }
        }
      `}</style>
    </header>
  );
}
