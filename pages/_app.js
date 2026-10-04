import GlobalHomeButton from "../components/GlobalHomeButton";

import "../styles/AppBase.css";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <GlobalHomeButton />
    </>
  );
}
