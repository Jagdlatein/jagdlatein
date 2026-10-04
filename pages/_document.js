import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        <link rel="icon" href="/favicon_32.png?v=book" sizes="32x32" />
        <link rel="icon" href="/favicon_48.png?v=book" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple_touch_icon.png?v=book" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
