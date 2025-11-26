export const metadata = {
  title: "Jagdlatein – Die Lernplattform",
  description: "Jagdquiz und Lernplattform für Jägerinnen und Jäger.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        {children}
      </body>
    </html>
  );
}
