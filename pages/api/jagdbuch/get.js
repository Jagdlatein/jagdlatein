import fs from "fs";
import path from "path";

export default function handler(req, res) {
  // Nur GET erlauben
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  const slug = req.query.slug;

  if (!slug) {
    return res.status(400).json({ error: "Missing slug" });
  }

  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Posts file missing" });
  }

  let posts;

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    posts = JSON.parse(raw);
  } catch (err) {
    console.error("Error reading posts.json:", err);
    return res.status(500).json({ error: "Posts file invalid" });
  }

  const post = Array.isArray(posts)
    ? posts.find((p) => p.slug === slug)
    : null;

  if (!post) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.status(200).json(post);
}
