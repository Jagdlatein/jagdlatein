import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const slug = req.query.slug;

  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  if (!fs.existsSync(filePath)) {
    return res.status(500).json({ error: "Posts file missing" });
  }

  let posts = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const post = posts.find((p) => p.slug === slug);

  if (!post) return res.status(404).json({ error: "Not found" });

  return res.status(200).json(post);
}
