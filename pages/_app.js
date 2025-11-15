// pages/_app.js
import "../styles/globals.css";
import Header from "../components/Header";
import Link from "next/link";

export default function App({ Component, pageProps, router }) {
  // Header wird NICHT auf Login & Preise angezeigt
  const hideHeader =
    router.pathname === "/login" || router.pathname === "/preise";

  // Der Button soll auf ALLEN Seiten außer der Startseite erscheinen
  const showMainButton = router.pathname !== "/";

  return (
    <>
      {/* Header auf allen Seiten außer login/preise */}
      {!hideHeader && <Header />}

      {/* Hauptmenü-Button auf allen Seiten außer "/" */}
      {showMainButton && (
        <div
          style={{
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <Link
            href="/"
            style={{
              background: "#1f2b23",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 12,
              display: "inline-block",
              fontWeight: 700,
            }}
          >
            Zum Hauptmenü
          </Link>
        </div>
      )}

      <Component {...pageProps} />
    </>
  );
}
