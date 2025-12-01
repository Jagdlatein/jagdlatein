import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Posts file missing" });
  }

  let posts = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { slug, text, replyTo, user } = req.body;

  const postIndex = posts.findIndex((p) => p.slug === slug);
  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const post = posts[postIndex];

  // Stelle sicher, dass Kommentare existieren
  if (!Array.isArray(post.comments)) post.comments = [];

  // Einfache ID für Kommentare
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

  // 🔥 WENN es eine Antwort auf einen Kommentar ist:
  if (replyTo) {
    function addReply(list) {
      for (let c of list) {
        if (c.id === replyTo) {
          c.replies.push(newComment);
          return true;
        }
        if (c.replies && addReply(c.replies)) return true;
      }
      return false;
    }

    addReply(post.comments);
  } else {
    // 🔥 normaler Kommentar
    post.comments.push(newComment);
  }

  // Speichern
  posts[postIndex] = post;
  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

  return res.status(200).json({ ok: true, comments: post.comments });
}
