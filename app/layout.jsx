import "./globals.css";

export const metadata = {
  title: "Jagdlatein",
  description: "Jagdquiz und Lernplattform für Jägerinnen und Jäger.",
  icons: {
    icon: [
      { url: "/favicon_32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/apple_touch_icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
