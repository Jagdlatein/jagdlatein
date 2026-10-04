"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const HISTORY_KEY = "jl_page_history";

function readHistory() {
  try {
    const history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(history)
      ? history.filter(
          (path) =>
            typeof path === "string" &&
            path.startsWith("/") &&
            !path.startsWith("//") &&
            !/[\\\u0000-\u001f\u007f]/.test(path)
        )
      : [];
  } catch {
    return [];
  }
}

function writeHistory(history) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Navigation still works when browser storage is blocked or full.
  }
}
export default function GlobalHomeButton() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const current = window.location.pathname + window.location.search;
    const history = readHistory();
    if (history[history.length - 1] !== current) {
      history.push(current);
      writeHistory(history.slice(-20));
    }
  }, [pathname]);

  if (!pathname || pathname === "/") {
    return null;
  }

  function goBack() {
    const current = window.location.pathname + window.location.search;
    const history = readHistory();
    if (history[history.length - 1] !== current) {
      history.push(current);
    }
    history.pop();

    const previous = history[history.length - 1];
    writeHistory(history);
    window.location.assign(previous || "/");
  }

  const buttonStyle = {
    padding: "11px 16px",
    borderRadius: 999,
    fontFamily: "system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 700,
    boxShadow: "0 4px 14px rgba(0,0,0,.30)",
    cursor: "pointer",
  };

  return (
    <nav
      aria-label="Seitennavigation"
      style={{
        position: "fixed",
        left: 16,
        bottom: "max(16px, env(safe-area-inset-bottom))",
        zIndex: 2147483647,
        display: "flex",
        gap: 8,
      }}
    >
      <button
        type="button"
        onClick={goBack}
        aria-label="Zurück zur vorherigen Seite"
        style={{
          ...buttonStyle,
          border: "1px solid #111827",
          background: "#ffffff",
          color: "#111827",
        }}
      >
        ← Zurück
      </button>
      <a
        href="/"
        aria-label="Zur Startseite"
        style={{
          ...buttonStyle,
          border: "1px solid #111827",
          background: "#111827",
          color: "#ffffff",
          textDecoration: "none",
        }}
      >
        🏠 Startseite
      </a>
    </nav>
  );
}
