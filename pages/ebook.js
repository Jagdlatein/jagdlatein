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
  const pdfUrl = "https://jagdlatein.de/ebook.pdf";

  const viewerUrl =
    "https://docs.google.com/gview?embedded=1&url=" +
    encodeURIComponent(pdfUrl);

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

        <iframe
          src={viewerUrl}
          title="Jagdlatein E-Book"
          style={styles.viewer}
        />

        <a
          href={pdfUrl}
          style={styles.btn}
          rel="noopener noreferrer"
        >
          PDF herunterladen
        </a>
      </main>
    </>
  );
}

const styles = {
  main: {
    padding: "24px 14px 90px",
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
    marginBottom: 18,
  },

  viewer: {
    width: "100%",
    height: "75vh",
    minHeight: 500,
    border: "1px solid #ddd",
    borderRadius: 12,
    background: "#fff",
  },

  btn: {
    display: "inline-block",
    marginTop: 20,
    padding: "14px 24px",
    background: "#caa53b",
    color: "#111",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 700,
    textDecoration: "none",
  },
};
