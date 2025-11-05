import '../styles/globals.css';
import Layout from '../components/Layout';
import CookieBanner from '../components/CookieBanner';

export default function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
      <CookieBanner />
    </Layout>
  );
}
// pages/_app.js
import "../styles/globals.css";              // <— nur diese Zeile ergänzt
import Layout from "../components/Layout";   // falls du das schon hattest
import CookieBanner from "../components/CookieBanner"; // falls vorhanden

export default function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
      <CookieBanner />
    </Layout>
  );
}
