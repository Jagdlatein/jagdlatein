// pages/ebook.js
import Head from "next/head";

function EbookPage() {
  return (
    <>
      <Head>
        <title>Jagdlatein – E-Book</title>
        <meta
          name="description"
          content="E-Book für die Vorbereitung auf die Jagdprüfung – exklusiv für zahlende Mitglieder von Jagdlatein."
        />
      </Head>
      <main
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "32px 16px 64px",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 12 }}>
          E-Book Jagdlatein
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.5,
            marginBottom: 24,
            color: "#374151",
          }}
        >
          Hier kannst du das aktuelle Jagdlatein-E-Book öffnen. Der Zugriff ist
          nur für eingeloggte und zahlende Nutzer freigeschaltet.
        </p>

        <a
          href="/api/ebook"
          className="cta"
          style={{
            textDecoration: "none",
            padding: "10px 18px",
            borderRadius: 999,
            display: "inline-block",
            marginTop: 12,
          }}
        >
          📥 E-Book öffnen
        </a>

        <p
          style={{
            fontSize: 14,
            marginTop: 24,
            color: "#6b7280",
          }}
        >
          Wenn sich das E-Book nicht öffnet, prüfe bitte, ob dein Browser
          Pop-ups/Downloads blockiert oder melde dich kurz bei mir.
        </p>
      </main>
    </>
  );
}

function hasPaidAccessFromCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  const loggedIn = cookieHeader.includes("jl_session=1");
  const paid = cookieHeader.includes("jl_paid=1");
  return loggedIn && paid;
}

export async function getServerSideProps(ctx) {
  const { req } = ctx;

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

export default EbookPage;
