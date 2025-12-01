import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { file, name } = req.body;

  const uploadPath = path.join(process.cwd(), "public/jagdbuch");
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

  const filePath = path.join(uploadPath, name);
  fs.writeFileSync(filePath, file, "base64");

  return res.json({ url: "/jagdbuch/" + name });
}
