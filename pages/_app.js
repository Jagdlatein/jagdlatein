import GlobalHomeButton from "../components/GlobalHomeButton";

import "../styles/AppBase.css";
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head><link rel="manifest" href="/manifest.webmanifest" /><meta name="theme-color" content="#faf8f1" /></Head>
      <Component {...pageProps} />
      <GlobalHomeButton />
    </>
  );
}
