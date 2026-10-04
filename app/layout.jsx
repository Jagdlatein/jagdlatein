import "./globals.css";
import GlobalHomeButton from "../components/GlobalHomeButton";
import "../styles/AppBase.css";

export const metadata = {
  title: "Jagdlatein",
  description: "Jagdquiz und Lernplattform für Jägerinnen und Jäger.",
  icons: {
    icon: [
      { url: "/favicon_32.png?v=book", sizes: "32x32", type: "image/png" },
      { url: "/favicon_48.png?v=book", sizes: "48x48", type: "image/png" },
    ],
    apple: "/apple_touch_icon.png?v=book",
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
