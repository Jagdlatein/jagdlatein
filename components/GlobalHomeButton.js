export default function GlobalHomeButton() {
  return (
    <a
      href="/"
      aria-label="Zur Startseite"
      style={{
        position: "fixed",
        left: 16,
        bottom: "max(16px, env(safe-area-inset-bottom))",
        zIndex: 2147483647,
        padding: "11px 16px",
        borderRadius: 999,
        background: "#111827",
        color: "#ffffff",
        textDecoration: "none",
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 700,
        boxShadow: "0 4px 14px rgba(0,0,0,.30)",
      }}
    >
      🏠 Startseite
    </a>
  );
}
