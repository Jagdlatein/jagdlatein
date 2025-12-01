import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { slug, image } = req.body;

  if (!slug || !image) {
    return res.status(400).json({ error: "Missing slug or image" });
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

  // Falls Array nicht existiert
  if (!Array.isArray(posts[index].images)) {
    posts[index].images = [];
  }

  // Das Base64-Bild speichern
  posts[index].images.push({
    id: Date.now(),
    data: image, // vollständiger Base64 String
  });

  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

  return res.status(200).json({
    ok: true,
    images: posts[index].images,
  });
}
