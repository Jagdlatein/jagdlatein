import Head from 'next/head';

export default function Seo({ title, description, image="/og.png", url="" }) {
  const site = "https://jagdlatein.de";
  const metaTitle = title || "Jagdlatein – Lernplattform";
  const metaDesc  = description || "Lernen für die Jagdprüfung (DE·AT·CH).";
  const metaUrl   = url || site + (typeof window !== 'undefined' ? window.location.pathname : "");
  const metaImg   = image.startsWith('http') ? image : `${site}${image}`;

  return (
    <Head>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:image" content={metaImg} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImg} />
      <link rel="canonical" href={metaUrl} />
    </Head>
  );
}
