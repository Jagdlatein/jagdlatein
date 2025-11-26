export const metadata = {
  title: "Jagdlatein – Die Lernplattform",
  description: "Jagdquiz und Lernplattform für Jäger und Jägerinnen.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
