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

  async function openPdf() {
    try {
      const { Capacitor } = await import("@capacitor/core");

      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import("@capacitor/browser");

        await Browser.open({
          url: pdfUrl,
        });

        return;
      }
    } catch (error) {
      console.error("PDF konnte nicht nativ geöffnet werden:", error);
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

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

        <button
          type="button"
          onClick={openPdf}
          style={styles.btn}
        >
          PDF öffnen
        </button>
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

  btn: {
    display: "block",
    width: "100%",
    maxWidth: 320,
    padding: "15px 24px",
    background: "#caa53b",
    color: "#111",
    border: "none",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
  },
};
