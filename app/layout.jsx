import "./globals.css";
import GlobalHomeButton from "../components/GlobalHomeButton";
import "../styles/AppBase.css";
import { siteBranding } from "../lib/brand-config";

export const metadata = {
  title: "Jagdlatein",
  description: "Jagdquiz und Lernplattform für Jägerinnen und Jäger.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(siteBranding.site),
  openGraph: {
    type: "website",
    siteName: siteBranding.name,
    images: [{ url: siteBranding.shareImage, width: siteBranding.shareWidth,
      height: siteBranding.shareHeight, alt: siteBranding.imageAlt }],
  },
  twitter: { card: "summary_large_image", images: [{ url: siteBranding.shareImage, alt: siteBranding.imageAlt }] },
  icons: {
    icon: [
      { url: siteBranding.favicon32, sizes: "32x32", type: "image/png" },
      { url: siteBranding.favicon48, sizes: "48x48", type: "image/png" },
      { url: siteBranding.favicon96, sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: siteBranding.appleTouch, sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head />
      <body>
        {children}
        <GlobalHomeButton />
      </body>
    </html>
  );
}
