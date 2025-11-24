export const metadata = {
  title: "Jagdlatein",
  description: "Jagdlatein Lernplattform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
