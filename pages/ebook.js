// pages/ebook.js
import Head from "next/head";

export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";

  const hasSession = cookie.includes("jl_session=1");
  const hasPaid = cookie.includes("jl_paid=1");
  const isAdmin = cookie.includes("jl_admin=1");

  if (!hasSession) {
    return {
      redirect: {
        destination: "/login?next=/ebook",
        permanent: false,
      },
    };
  }

  if (!hasPaid && !isAdmin) {
    return {
      redirect: {
        destination: "/preise",
        permanent: false,
      },
    };
  }

  return { props: {} };
}

export default function Ebook() {
  const pdfUrl = "/ebook.pdf";

  return (
    <>
      <Head>
        <title>E-Book – Jagdlatein</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.title}>E-Book</h1>

        <p style={styles.text}>
          Dein exklusiver Zugriff auf das Jagdlatein E-Book ist freigeschaltet.
        </p>

        <div style={styles.card}>
          <div style={styles.icon}>📖</div>

          <h2 style={styles.cardTitle}>Jagdlatein E-Book</h2>

          <p style={styles.description}>
            Öffne das vollständige E-Book als PDF.
          </p>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.btn}
          >
            PDF öffnen
          </a>

          <a
            href={pdfUrl}
            download
            style={styles.btnSecondary}
          >
            PDF herunterladen
          </a>
        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    padding: "24px 14px 110px",
    maxWidth: 1000,
    margin: "0 auto",
  },

  title: {
    fontSize: 36,
    marginBottom: 12,
    fontFamily: "Georgia, serif",
  },

  text: {
    fontSize: 17,
    marginBottom: 24,
  },

  card: {
    padding: 28,
    border: "1px solid #ddd",
    borderRadius: 16,
    background: "#fff",
    textAlign: "center",
  },

  icon: {
    fontSize: 64,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 26,
    marginBottom: 10,
  },

  description: {
    fontSize: 17,
    marginBottom: 24,
  },

  btn: {
    display: "block",
    maxWidth: 320,
    margin: "0 auto 14px",
    padding: "15px 24px",
    background: "#caa53b",
    color: "#111",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 700,
    textDecoration: "none",
  },

  btnSecondary: {
    display: "block",
    maxWidth: 320,
    margin: "0 auto",
    padding: "14px 24px",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    fontSize: 17,
    fontWeight: 700,
    textDecoration: "none",
  },
};
