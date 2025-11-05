// components/Header.js
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 920) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="jl-header">
      <div className="inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="title">Jagdlatein</span>
          <span className="tag">Lernplattform</span>
        </Link>

        <nav className="nav">
          <Link href="/">Start</Link>
          <Link href="/glossar">Glossar</Link>
          <Link href="/quiz">Quiz</Link>
          <Link href="/preise">Preise</Link>
          <Link href="/login">Login</Link>
        </nav>

        <button
          className="burger"
          aria-label="Menü"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <span /><span /><span />
        </button>
      </div>

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
        .jl-header{position:sticky;top:0;z-index:50;background:#faf8f1cc;
          backdrop-filter:saturate(120%) blur(6px);border-bottom:1px solid #e6eee6}
        .inner{max-width:1100px;margin:0 auto;padding:8px 12px;display:flex;align-items:center;gap:10px}
        .brand{display:flex;align-items:baseline;gap:6px;text-decoration:none}
        .title{font-weight:800;letter-spacing:-.01em;color:#121518;font-size:18px}
        .tag{color:#6b7280;font-size:12px}
        .nav{margin-left:auto;display:flex;gap:12px}
        .nav :global(a){color:#121518;text-decoration:none;font-weight:600;padding:8px 10px;border-radius:10px}
        .nav :global(a:hover){background:#eef3ef}
        .burger{margin-left:auto;display:none;width:40px;height:36px;border:1px solid #dfe7df;background:#fff;border-radius:10px;cursor:pointer;align-items:center;justify-content:center;gap:3px}
        .burger span{display:block;width:18px;height:2px;background:#121518}
        .mobile{display:none}

        @media (max-width:920px){
          .title{font-size:17px}
          .nav{display:none}
          .burger{display:inline-flex}
          .mobile{display:grid;gap:6px;padding:8px 12px 10px;background:#faf8f1ee;border-top:1px solid #e6eee6}
          .mobile :global(a){text-decoration:none;color:#121518;font-weight:600;padding:10px 12px;border-radius:10px}
          .mobile :global(a:hover){background:#eef3ef}
        }
      `}</style>
    </header>
  );
}
