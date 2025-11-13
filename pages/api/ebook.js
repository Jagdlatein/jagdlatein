import fs from 'fs';
import path from 'path';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });

  // Wenn kein Login → blockieren
  if (!session) {
    return res.status(401).json({ error: "Not authorized" });
  }

  // Pfad zur Datei
  const filePath = path.join(process.cwd(), 'files', 'Jagdlatein-Lehrbuch.pdf');
  const file = fs.readFileSync(filePath);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="Jagdlatein-Lehrbuch.pdf"');
  res.send(file);
}
