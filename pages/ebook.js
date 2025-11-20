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
  return (
    <>
      <Head>
        <title>E-Book – Jagdlatein</title>
      </Head>

      <main style={styles.main}>
        <h1 style={styles.title}>E-Book</h1>

        <p style={styles.text}>
          Dein exklusiver Zugriff auf das E-Book ist freigeschaltet.
        </p>

        <a
          href="/ebook.pdf"
          style={styles.btn}
          target="_blank"
          rel="noopener noreferrer"
        >
          E-Book öffnen
        </a>
      </main>
    </>
  );
}

const styles = {
  main: {
    padding: "40px 20px",
    maxWidth: 900,
    margin: "0 auto",
  },
  title: {
    fontSize: 40,
    marginBottom: 20,
    fontFamily: "Georgia, serif",
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
  btn: {
    display: "inline-block",
    padding: "14px 24px",
    background: "#caa53b",
    color: "#111",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 700,
    textDecoration: "none",
  },
};
