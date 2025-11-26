import "./globals.css";

export const metadata = {
  title: "Jagdlatein – Die Lernplattform",
  description: "Jagdquiz und Lernplattform für Jägerinnen und Jäger.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head />
      <body suppressHydrationWarning={true}>
        <main id="root">{children}</main>
      </body>
    </html>
  );
}
