import "./globals.css";   // 💥 WICHTIG!!!

export const metadata = {
  title: "Jagdlatein",
  description: "Jagdquiz und Lernplattform für Jägerinnen und Jäger.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
