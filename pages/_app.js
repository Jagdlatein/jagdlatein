// pages/_app.js
import "../styles/globals.css";
import Header from "../components/Header";

export default function App({ Component, pageProps, router }) {
  const hideHeader = router.pathname === "/login" || router.pathname === "/preise";
  return (
    <>
      {!hideHeader && <Header />}
      <Component {...pageProps} />
    </>
  );
}
