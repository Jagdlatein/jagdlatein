// pages/_app.js
import "../styles/globals.css";
import Header from "../components/Header";

export default function App({ Component, pageProps, router }) {
  // Header nur anzeigen, wenn der User eingeloggt ist (nicht auf /login oder /preise)
  const hideHeader = router.pathname === "/login" || router.pathname === "/preise";

  return (
    <>
      {!hideHeader && <Header />}
      <Component {...pageProps} />
    </>
  );
}
