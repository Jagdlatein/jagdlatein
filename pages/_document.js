import { Html, Head, Main, NextScript } from 'next/document';
import { siteBranding } from '../lib/brand-config';

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        <link rel="icon" type="image/png" href={siteBranding.favicon32} sizes="32x32" />
        <link rel="icon" type="image/png" href={siteBranding.favicon48} sizes="48x48" />
        <link rel="icon" type="image/png" href={siteBranding.favicon96} sizes="96x96" />
        <link rel="apple-touch-icon" href={siteBranding.appleTouch} sizes="180x180" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
