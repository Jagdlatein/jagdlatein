"use client";

import { useSession, signIn } from "next-auth/react";
import Seo from "../components/Seo";

export default function EbookPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Lade…</p>;

  // ❌ Nicht eingeloggt → Login anzeigen
  if (!session) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Seo title="E-Book" description="E-Book Download" />

        <h2>🔒 Login erforderlich</h2>
        <p>Bitte melde dich an, um das E-Book zu öffnen.</p>

        <button
          onClick={() => signIn()}
          style={{
            padding: "14px 24px",
            background: "#2b6e3e",
            color: "#fff",
            borderRadius: "10px",
            fontSize: "18px",
            cursor: "pointer",
            border: "none",
          }}
        >
          Login
        </button>
      </div>
    );
  }

  // ✔️ Eingeloggt → Button zum E-Book anzeigen
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <Seo title="E-Book" description="Direkter Zugriff" />

      <h1>📘 Jagdlatein E-Book</h1>
      <p>Klicke unten, um das E-Book zu öffnen.</p>

      <a
        href="https://1drv.ms/b/c/357722b348ffd019/EbveCgU6lLpLpbbe4Na5LO8BtDYreUafjSunpVFmLkmXWA?e=B0pRyj"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "16px 32px",
          background: "#2b6e3e",
          color: "#fff",
          borderRadius: "10px",
          fontSize: "18px",
          textDecoration: "none",
          display: "inline-block",
          marginTop: "20px",
        }}
      >
        📥 E-Book öffnen
      </a>
    </div>
  );
}

// ❗ notwendig, damit kein Prerendering passiert
export async function getServerSideProps() {
  return { props: {} };
}
