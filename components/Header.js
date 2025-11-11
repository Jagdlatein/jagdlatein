// components/Header.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const links = [
  { href: "/quiz", label: "Quiz" },
  { href: "/glossar", label: "Glossar" },
];

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // ESC schließt Drawer
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function logout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((n) => {
      document.cookie = `${n}=; Path=/; Max-Age=0; SameSite=Lax`;
    });
    router.replace("/login");
    setTimeout(() => (window.location.href = "/login"), 300);
  }

  const isActive = (href) =>
    router.pathname === href || router.pathname.startsWith(href + "/");

  return (
    <>
      {/* Sticky, glasiger Header */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-black/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => router.push("/")}
              className="text-[18px] font-extrabold tracking-wide text-gray-900 hover:opacity-80"
              aria-label="Startseite"
            >
              Jagdlatein
            </button>

            {/* Desktop Nav */}
            <nav className="hidden sm:flex items-center gap-2">
              {links.map((l) => (
                <button
                  key={l.href}
                  onClick={() => router.push(l.href)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition
                  ${isActive(l.href)
                    ? "bg-emerald-600 text-white shadow"
                    : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow"
              >
                Logout
              </button>
            </nav>

            {/* Mobile Burger */}
            <button
              onClick={() => setOpen(true)}
              className="sm:hidden inline-flex items-center justify-center rounded-xl p-2.5 hover:bg-black/5"
              aria-label="Menü öffnen"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40"
            onClick={() => setOpen(false)}
          />
          <aside
            className="fixed right-0 top-0 h-full w-[82%] max-w-xs bg-white z-50 shadow-2xl p-4 flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-gray-900">Menü</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 hover:bg-black/5"
                aria-label="Menü schließen"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M6.7 5.3 5.3 6.7 10.6 12l-5.3 5.3 1.4 1.4L12 13.4l5.3 5.3 1.4-1.4L13.4 12l5.3-5.3-1.4-1.4L12 10.6z" />
                </svg>
              </button>
            </div>

            <nav className="mt-1 flex flex-col gap-2">
              {links.map((l) => (
                <button
                  key={l.href}
                  onClick={() => {
                    setOpen(false);
                    router.push(l.href);
                  }}
                  className={`text-left px-3 py-2 rounded-xl border transition
                  ${isActive(l.href)
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={logout}
                className="mt-1 text-left px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Logout
              </button>
            </nav>

            <div className="mt-auto pt-3 text-xs text-gray-500">
              © {new Date().getFullYear()} Jagdlatein
            </div>
          </aside>
        </>
      )}
    </>
  );
}
