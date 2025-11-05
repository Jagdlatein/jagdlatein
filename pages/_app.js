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
import "../styles/globals.css"; // <-- globales CSS hier laden

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
