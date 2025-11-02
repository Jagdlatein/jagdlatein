import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111915" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
