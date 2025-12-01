import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { slug, imageId } = req.body;

  // Admin Header prüfen
  const isAdmin = req.headers["x-admin"] === "1";
  if (!isAdmin) {
    return res.status(403).json({ error: "Not allowed" });
  }

  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Posts file missing" });
  }

  let posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const index = posts.findIndex((p) => p.slug === slug);

  if (index === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  let post = posts[index];
  if (!Array.isArray(post.images)) post.images = [];

  // Bild löschen
  post.images = post.images.filter((img) => img.id !== imageId);

  posts[index] = post;
  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

  return res.status(200).json({ ok: true, images: post.images });
}
