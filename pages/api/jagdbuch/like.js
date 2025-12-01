import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Posts file missing" });
  }

  let posts = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const { slug } = req.body;

  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  let post = posts[index];

  // Likes-Aggregat sicherstellen
  if (typeof post.likes !== "number") post.likes = 0;

  // 🔐 Benutzer identifizieren (localStorage ID wird vom Client gesendet)
  const userId = req.headers["x-client-id"];

  // Liste der Nutzer, die diesen Beitrag geliked haben
  if (!Array.isArray(post.likedBy)) post.likedBy = [];

  // Wenn Nutzer schon geliked hat → abbrechen
  if (post.likedBy.includes(userId)) {
    return res.status(200).json({ ok: true, likes: post.likes });
  }

  // 👍 Like hinzufügen
  post.likes += 1;
  post.likedBy.push(userId);

  posts[index] = post;

  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

  return res.status(200).json({ ok: true, likes: post.likes });
}
