// pages/ebook.js
import Head from "next/head";
import { useEffect, useState } from "react";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function EbookPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const s = !!getCookie("jl_session");  // gleicher Login-Check wie Header
    setLoggedIn(s);
  }, []);

  // ❌ Nicht eingeloggt → Login anzeigen
  if (!loggedIn) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Head>
          <title>E-Book – Login erforderlich</title>
        </Head>

        <h2>🔒 Login erforderlich</h2>
        <p>Bitte logge dich ein, um das E-Book zu öffnen.</p>

        <a
          href="/login"
          style={{
            padding: "14px 24px",
            background: "#2b6e3e",
            color: "#fff",
            borderRadius: "10px",
            fontSize: "18px",
            textDecoration: "none",
          }}
        >
          Login
        </a>
      </div>
    );
  }

  // ✔ Eingeloggt → Link anzeigen
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <Head>
        <title>E-Book – Zugriff</title>
      </Head>

      <h1>📘 Jagdlatein E-Book</h1>
      <p>Klicke unten, um das E-Book zu öffnen:</p>

      <a
        href="https://1drv.ms/b/c/357722b348ffd019/EbveCgU6lLpLpbbe4Na5LO8BtDYreUafjSunpVFmLkmXWA?e=B0pRyj"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "16px 32px",
          background: "#2b6e3e",
          color: "white",
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

export async function getServerSideProps() {
  return { props: {} };
}

