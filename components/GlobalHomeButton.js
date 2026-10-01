"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

const HISTORY_KEY = "jl_page_history";

function readHistory() {
  try {
    const history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(history)
      ? history.filter(
          (path) =>
            typeof path === "string" &&
            path.startsWith("/") &&
            !path.startsWith("//")
        )
      : [];
  } catch {
    return [];
  }
}

export default function GlobalHomeButton() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const history = readHistory();
    if (history[history.length - 1] !== router.asPath) {
      history.push(router.asPath);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20)));
    }
  }, [router.isReady, router.asPath]);

  if (!router.isReady || router.pathname === "/") {
    return null;
  }

  function goBack() {
    const history = readHistory();
    if (history[history.length - 1] !== router.asPath) {
      history.push(router.asPath);
    }
    history.pop();

    const previous = history[history.length - 1];
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    router.push(previous || "/");
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
