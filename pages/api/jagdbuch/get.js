import fs from "fs";
import path from "path";

export default function handler(req, res) {
  // OPTIONS Preflight erlauben (wichtig!)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Nur POST erlauben
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Posts file missing" });
  }

  let posts = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const { slug, title, content, excerpt, date, user } = req.body;

  const newPost = {
    slug,
    title,
    content,
    excerpt,
    date,
    user: user || "Jäger",
    likes: 0,
    comments: [],
    images: [],
  };

  posts.unshift(newPost);

  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

  return res.status(200).json({ ok: true });
}
