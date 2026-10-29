import Head from 'next/head';
import { siteBranding } from '../lib/brand-config';

export default function Seo({ title, description, image=siteBranding.shareImage, imageAlt, imageWidth, imageHeight, url="" }) {
  const site = siteBranding.site;
  const metaTitle = title || "Jagdlatein – Lernplattform";
  const metaDesc  = description || "Lernen für die Jagdprüfung (DE·AT·CH).";
  const metaUrl   = url || site + (typeof window !== 'undefined' ? window.location.pathname : "");
  const metaImg   = image.startsWith('http') ? image : `${site}${image}`;
  const defaultImage = image === siteBranding.shareImage;
  const metaAlt = imageAlt ?? (defaultImage ? siteBranding.imageAlt : undefined);
  const metaWidth = imageWidth ?? (defaultImage ? siteBranding.shareWidth : undefined);
  const metaHeight = imageHeight ?? (defaultImage ? siteBranding.shareHeight : undefined);

  return (
    <Head>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:image" content={metaImg} />
      {metaAlt && <meta property="og:image:alt" content={metaAlt} />}
      {metaWidth && <meta property="og:image:width" content={metaWidth} />}
      {metaHeight && <meta property="og:image:height" content={metaHeight} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImg} />
      {metaAlt && <meta name="twitter:image:alt" content={metaAlt} />}
      <link rel="canonical" href={metaUrl} />
    </Head>
  );
}
