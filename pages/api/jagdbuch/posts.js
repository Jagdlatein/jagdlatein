import fs from "fs";
import path from "path";

export default function handler(req, res) {

  // Browser Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  let posts = [];
  if (fs.existsSync(filePath)) {
    try {
      posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      posts = [];
    }
  }

  // --------------------------
  // POST → Beitrag speichern
  // --------------------------
  if (req.method === "POST") {
    const newPost = {
      ...req.body,
      likes: 0,
      comments: [],
      images: []
    };

    posts.unshift(newPost);

    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
