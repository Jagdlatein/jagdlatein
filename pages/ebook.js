// pages/ebook.js
import { useEffect, useState } from "react";
import Seo from "../components/Seo";
import Link from "next/link";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[1]) : null;
}

export default function EbookPage() {
  const [state, setState] = useState({
    checked: false,
    loggedIn: false,
    paid: false,
  });

  useEffect(() => {
    const session = !!getCookie("jl_session");
    const paidCookie = getCookie("jl_paid");
    const paid = paidCookie === "1" || paidCookie === "true";
    setState({ checked: true, loggedIn: session, paid });
  }, []);

  // Loading
  if (!state.checked) {
    return (
      <>
        <Seo title="E-Book – Jagdlatein" />
        <main className="p-4 max-w-3xl mx-auto">
          <p>Seite wird geladen …</p>
        </main>
      </>
    );
  }

  // Not logged in
  if (!state.loggedIn) {
    return (
      <>
        <Seo title="E-Book – Jagdlatein" />
        <main className="p-4 max-w-3xl mx-auto">
          <h1>E-Book geschützt</h1>
          <p>Bitte logge dich ein, um dein E-Book zu öffnen.</p>
          <Link href="/login">Zum Login</Link>
        </main>
      </>
    );
  }

  // Logged in but not paid
  if (!state.paid) {
    return (
      <>
        <Seo title="E-Book – Jagdlatein" />
        <main className="p-4 max-w-3xl mx-auto">
          <h1>Nur für Käufer</h1>
          <p>
            Du bist eingeloggt, aber dein Zugang für das E-Book ist noch
            nicht freigeschaltet.
          </p>
        </main>
      </>
    );
  }

  // ✔ Logged in AND paid
  return (
    <>
      <Seo title="E-Book – Jagdlatein" />

      <main className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Jagdlatein E-Book</h1>

        <p className="mb-4">
          Hier kannst du dein E-Book öffnen oder herunterladen.
        </p>

        <p>
          <a
            href="https://1drv.ms/b/c/357722b348ffd019/EbveCgU6lLpLpbbe4Na5LO8BtDYreUafjSunpVFmLkmXWA"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#2f6d2f",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            📘 E-Book öffnen
          </a>
        </p>
      </main>
    </>
  );
}
