import Link from "next/link";

export default function HomeButton() {
  return (
    <Link
      href="/"
      style={{
        position: "fixed",
        top: 20,
        left: 20,
        background: "#caa53b",
        padding: "10px 18px",
        borderRadius: 12,
        fontWeight: "bold",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        color: "#111",
        textDecoration: "none",
        zIndex: 9999,
      }}
    >
      ← Startseite
    </Link>
  );
}
