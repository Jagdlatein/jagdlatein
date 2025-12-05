import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  let posts = [];
  if (fs.existsSync(filePath)) {
    posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // 🔐 Benutzer (Ersteller) — MUSS vom Client gesendet werden
  const user = req.headers["x-user"] || "Jäger";

  // 🔐 Admin — muss 1 sein
  const isAdmin = req.headers["x-admin"] === "1";

  // ------------------------------------
  // 🟢 CREATE POST
  // ------------------------------------
  if (req.method === "POST") {
    const newPost = {
      ...req.body,
      likes: 0,
      comments: [],
      images: [],
      user, // Ersteller speichern
    };

    posts.unshift(newPost);
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
    return res.status(200).json({ ok: true });
  }

  // ------------------------------------
  // ✏️ UPDATE POST
  // ------------------------------------
  if (req.method === "PUT") {
    const { slug, title, content } = req.body;
    const index = posts.findIndex((p) => p.slug === slug);

    if (index === -1) return res.status(404).json({ error: "Not found" });

    const post = posts[index];

    // Ersteller ODER Admin darf bearbeiten
    if (post.user !== user && !isAdmin) {
      return res.status(403).json({ error: "Not allowed" });
    }

    posts[index] = {
      ...post,
      title,
      content,
      excerpt: content.slice(0, 120),
      updated: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
    return res.json({ ok: true });
  }

  // ------------------------------------
  // ❌ DELETE POST
  // ------------------------------------
  if (req.method === "DELETE") {
    const { slug } = req.body;
    const index = posts.findIndex((p) => p.slug === slug);

    if (index === -1) return res.status(404).json({ error: "Not found" });

    const post = posts[index];

    if (post.user !== user && !isAdmin) {
      return res.status(403).json({ error: "Not allowed" });
    }

    posts.splice(index, 1);
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
