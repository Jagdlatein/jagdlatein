// components/Header.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // ESC schließt Menü
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function logout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((name) => {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    });
    router.replace("/login");
    setTimeout(() => {
      if (typeof window !== "undefined") window.location.href = "/login";
    }, 400);
  }

  function go(path) {
    setOpen(false);
    router.push(path);
  }

  return (
    <>
      {/* Topbar */}
      <header className="flex items-center justify-between bg-green-900 text-white px-4 py-3 shadow-md">
        <button
          onClick={() => go("/quiz")}
          className="text-xl font-extrabold tracking-wide hover:text-gray-200"
          aria-label="Zur Startseite"
        >
          Jagdlatein
        </button>

        {/* Desktop-Navigation */}
        <nav className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => go("/quiz")}
            className="bg-white text-green-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Quiz
          </button>
          <button
            onClick={() => go("/glossar")}
            className="bg-white text-green-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Glossar
          </button>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg"
          >
            Logout
          </button>
        </nav>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setOpen(true)}
          className="sm:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Menü öffnen"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile Overlay + Drawer */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside
            className="fixed top-0 right-0 h-full w-[80%] max-w-xs bg-white z-50 shadow-xl p-4 flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-green-900">Menü</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-2 hover:bg-gray-100"
                aria-label="Menü schließen"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                  <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              <button
                onClick={() => go("/quiz")}
                className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Quiz
              </button>
              <button
                onClick={() => go("/glossar")}
                className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Glossar
              </button>
              <button
                onClick={logout}
                className="mt-2 text-left px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Logout
              </button>
            </nav>

            <div className="mt-auto pt-4 text-xs text-gray-500">
              © {new Date().getFullYear()} Jagdlatein
            </div>
          </aside>
        </>
      )}
    </>
  );
}
