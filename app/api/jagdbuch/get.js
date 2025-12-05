import fs from "fs";

export default function handler(req, res) {
  const slug = req.query.slug;
  const file = "/tmp/jagdbuch.json";

  if (!fs.existsSync(file)) return res.status(404).json({ error: "No posts" });

  const posts = JSON.parse(fs.readFileSync(file, "utf8"));
  const post = posts.find(p => p.slug === slug);

  if (!post) return res.status(404).json({ error: "Not found" });

  return res.status(200).json(post);
}
