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

  ...
    <div
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "32px 16px 64px",
      }}
    >
      <Head>
        <title>Jagdlatein – E-Book</title>
      </Head>

      <h1>E-Book für Jagdlatein</h1>
      <p className="lead">
        Hier kannst du dein E-Book öffnen. Es ist nur für registrierte und zahlende Nutzer zugänglich.
      </p>

      <a
        href="/api/ebook"
        className="cta"
        style={{
          textDecoration: "none",
          padding: "10px 18px",
          borderRadius: "999px",
          display: "inline-block",
          marginTop: "20px",
        }}
      >
        📥 E-Book öffnen
      </a>
    </div>
  );
}

function hasPaidAccessFromCookies(req) {
  const cookies = req.headers.cookie || "";
  const loggedIn = cookies.includes("jl_session=1");
  const paid = cookies.includes("jl_paid=1");
  return loggedIn && paid;
}

export async function getServerSideProps(ctx) {
  const { req } = ctx;

  // ⛔ ohne Login + Zahlung → redirect auf /login
  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
}
