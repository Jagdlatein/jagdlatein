"use client";

import { useEffect, useState } from "react";

export default function GlobalHomeButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(window.location.pathname !== "/");
  }, []);

  if (!show) return null;

  return (
    <a
      href="/"
      aria-label="Zur Startseite"
      style={{
        position: "fixed",
        left: 16,
        bottom: "max(16px, env(safe-area-inset-bottom))",
        zIndex: 9999,
        padding: "11px 16px",
        borderRadius: 999,
        background: "#111827",
        color: "#ffffff",
        textDecoration: "none",
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 700,
        boxShadow: "0 4px 14px rgba(0,0,0,.25)",
      }}
    >
      🏠 Startseite
    </a>
  );
}
