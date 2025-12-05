import fs from "fs";
import path from "path";

export default function handler(req, res) {
  // Nur POST erlaubt
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { slug, imageId } = req.body;

  if (!slug || !imageId) {
    return res.status(400).json({ error: "Missing slug or imageId" });
  }

  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  // Datei existiert?
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Posts file missing" });
  }

  // JSON laden
  let posts;
  try {
    posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return res.status(500).json({ error: "Invalid posts file" });
  }

  // Beitrag finden
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  let post = posts[index];

  // Sicherstellen, dass Bilder existieren
  if (!Array.isArray(post.images)) post.images = [];

  // Bild löschen
  post.images = post.images.filter((img) => img.id !== imageId);

  posts[index] = post;

  // Speichern
  try {
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
  } catch (err) {
    return res.status(500).json({ error: "Write failed" });
  }

  return res.status(200).json({
    ok: true,
    images: post.images
  });
}
