// pages/api/download-ebook.js
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]"; // <-- anpassen falls dein Pfad anders ist

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  // ❌ Nicht eingeloggt
  if (!session) {
    return res.status(401).json({ error: "Not authorized" });
  }

  // ❌ Zugriff bezahlt?
  if (!session.user?.paid && session.user?.paid !== true) {
    return res.status(403).json({ error: "Payment required" });
  }

  // 📄 Pfad zur Datei
  const filePath = path.join(process.cwd(), "files", "Jagdlatein-Lehrbuch.pdf");

  // 🔐 Existiert Datei?
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // 📤 Stream statt readFile → besser für große PDFs
  const stat = fs.statSync(filePath);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="Jagdlatein-Lehrbuch.pdf"'
  );
  res.setHeader("Content-Length", stat.size);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}
