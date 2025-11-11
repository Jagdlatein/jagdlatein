// components/Header.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // ESC schließt Drawer
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Logout-Funktion
  function logout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((name) => {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    });
    router.replace("/login");
    setTimeout(() => (window.location.href = "/login"), 400);
  }

  // Aktive Seite
  const isActive = (href) => router.pathname === href;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#f7f3ea] to-[#efe7d6] border-b border-[#b8943b]/40 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-[#2b2b2b] hover:opacity-80 transition"
          >
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2b2b2b]">
              Jagdlatein
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex gap-3 items-center">
            <button
              onClick={() => router.push("/quiz")}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
                isActive("/quiz")
                  ? "bg-[#b8943b] text-white shadow"
                  : "text-[#2b2b2b] hover:bg-[#b8943b]/15"
              }`}
            >
              Quiz
            </button>

            <button
              onClick={() => router.push("/glossar")}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
                isActive("/glossar")
                  ? "bg-[#b8943b] text-white shadow"
                  : "text-[#2b2b2b] hover:bg-[#b8943b]/15"
              }`}
            >
              Glossar
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-full font-semibold text-sm bg-[#2b2b2b] text-white hover:bg-[#b8943b] transition"
            >
              Logout
            </button>
          </nav>

          {/* Mobile Menü-Button */}
          <button
            onClick={() => setOpen(true)}
            className="sm:hidden rounded-lg p-2 hover:bg-[#b8943b]/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-7 h-7 text-[#2b2b2b]"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menü Drawer */}
      {open && (
        <>
          {/* Hintergrund */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          ></div>

          {/* Seitenmenü */}
          <aside className="fixed top-0 right-0 z-50 h-full w-[80%] max-w-xs bg-[#f9f5eb] shadow-2xl flex flex-col p-5 border-l border-[#b8943b]/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-[#2b2b2b]">Menü</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-[#b8943b]/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 text-[#2b2b2b]"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-3">
              <button
                onClick={() => {
                  router.push("/quiz");
                  setOpen(false);
                }}
                className={`px-3 py-2 text-left rounded-lg border ${
                  isActive("/quiz")
                    ? "bg-[#b8943b] text-white border-[#b8943b]"
                    : "border-[#b8943b]/30 hover:bg-[#b8943b]/15 text-[#2b2b2b]"
                }`}
              >
                Quiz
              </button>

              <button
                onClick={() => {
                  router.push("/glossar");
                  setOpen(false);
                }}
                className={`px-3 py-2 text-left rounded-lg border ${
                  isActive("/glossar")
                    ? "bg-[#b8943b] text-white border-[#b8943b]"
                    : "border-[#b8943b]/30 hover:bg-[#b8943b]/15 text-[#2b2b2b]"
                }`}
              >
                Glossar
              </button>

              <button
                onClick={logout}
                className="mt-2 px-3 py-2 text-left rounded-lg bg-[#2b2b2b] text-white hover:bg-[#b8943b]"
              >
                Logout
              </button>
            </nav>

            <div className="mt-auto pt-4 text-xs text-[#6c6c6c]">
              © {new Date().getFullYear()} Jagdlatein
            </div>
          </aside>
        </>
      )}
    </>
  );
}
