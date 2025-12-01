import fs from "fs";
import path from "path";

export default function handler(req, res) {
  // Nur POST erlaubt
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  // Existenz prüfen
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Posts file missing" });
  }

  // Daten laden
  let posts = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const { slug } = req.body;
  const clientId = req.headers["x-client-id"]; // Browser-ID vom Client

  if (!clientId) {
    return res.status(400).json({ error: "Missing client ID" });
  }

  // Beitrag finden
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const post = posts[index];

  // Falls Felder fehlen: initialisieren
  if (typeof post.likes !== "number") post.likes = 0;
  if (!Array.isArray(post.likedBy)) post.likedBy = [];

  // 🔐 Prüfen: Hat dieser Client bereits geliked?
  if (post.likedBy.includes(clientId)) {
    // Schon geliked — nichts ändern
    return res.status(200).json({ ok: true, likes: post.likes });
  }

  // 👍 Like hinzufügen
  post.likes += 1;
  post.likedBy.push(clientId);

  // Speicherung im JSON
  posts[index] = post;
  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

  return res.status(200).json({
    ok: true,
    likes: post.likes,
  });
}
