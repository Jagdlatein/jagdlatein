import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  // Datei existiert?
  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Posts file missing" });
  }

  let posts;

  // JSON sicher laden
  try {
    posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return res.status(500).json({ error: "Invalid posts file" });
  }

  // Nur POST erlauben
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { slug, text, replyTo, user } = req.body;

  if (!slug || !text) {
    return res.status(400).json({ error: "Missing slug or text" });
  }

  // Beitrag finden
  const postIndex = posts.findIndex((p) => p.slug === slug);
  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const post = posts[postIndex];

  // Sicherstellen, dass Kommentare existieren
  if (!Array.isArray(post.comments)) post.comments = [];

  // Kommentar ID Generator
  function generateId() {
    return Math.floor(Math.random() * 1_000_000);
  }

  const newComment = {
    id: generateId(),
    text,
    user: user || "Jäger",
    date: new Date().toISOString().split("T")[0],
    replies: [],
  };

  // 🔥 Antwort auf bestehenden Kommentar
  if (replyTo) {
    function addReply(list) {
      for (let c of list) {
        if (c.id === replyTo) {
          if (!Array.isArray(c.replies)) c.replies = [];
          c.replies.push(newComment);
          return true;
        }
        if (c.replies && addReply(c.replies)) return true;
      }
      return false;
    }

    addReply(post.comments);
  }

  // 🔥 normaler Kommentar
  if (!replyTo) {
    post.comments.push(newComment);
  }

  // Speichern
  posts[postIndex] = post;

  try {
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
  } catch (err) {
    return res.status(500).json({ error: "Failed to save comments" });
  }

  return res.status(200).json({
    ok: true,
    comments: post.comments,
  });
}
