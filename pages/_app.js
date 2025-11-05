// pages/_app.js
import "../styles/globals.css"; // falls vorhanden, ansonsten weglassen
import Layout from "../components/Layout";

export default function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
