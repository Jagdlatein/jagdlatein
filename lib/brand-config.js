// Operator-approved brand illustration, kept separate from teaching media.
export const siteBranding = Object.freeze({
  site: "https://jagdlatein.de",
  name: "Jagdlatein",
  logo: "/branding/jagdlatein-2026-10-29.png",
  logoSize: 1254,
  icon192: "/branding/app-192-2026-10-29.png",
  icon512: "/branding/app-512-2026-10-29.png",
  favicon32: "/branding/favicon-32-2026-10-29.png",
  favicon48: "/branding/favicon-48-2026-10-29.png",
  favicon96: "/branding/favicon-96-2026-10-29.png",
  appleTouch: "/branding/apple-touch-2026-10-29.png",
  shareImage: "/branding/og-2026-10-29.png",
  shareWidth: 1200,
  shareHeight: 630,
  imageAlt: "Jagdlatein – Illustration mit Jäger und Hirsch",
});

export const brandingAssetPaths = Object.freeze([
  siteBranding.logo, siteBranding.icon192, siteBranding.icon512,
  siteBranding.favicon32, siteBranding.favicon48, siteBranding.favicon96,
  siteBranding.appleTouch, siteBranding.shareImage,
]);

export const brandAssetsObject = Object.freeze({
  image: siteBranding.logo,
  favicon32: siteBranding.favicon32,
  favicon48: siteBranding.favicon48,
  favicon96: siteBranding.favicon96,
  appleTouch: siteBranding.appleTouch,
  app192: siteBranding.icon192,
  app512: siteBranding.icon512,
  og: siteBranding.shareImage,
});

export const siteOrganization = Object.freeze({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteBranding.site}/#organization`,
  name: siteBranding.name,
  url: `${siteBranding.site}/`,
  logo: {
    "@type": "ImageObject",
    url: `${siteBranding.site}${siteBranding.logo}`,
    contentUrl: `${siteBranding.site}${siteBranding.logo}`,
    width: siteBranding.logoSize,
    height: siteBranding.logoSize,
  },
});
