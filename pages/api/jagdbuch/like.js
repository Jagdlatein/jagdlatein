import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  if (req.method === "POST") {
    const { slug } = req.body;

    let posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const index = posts.findIndex(p => p.slug === slug);

    if (index === -1) return res.status(404).json({ error: "Not found" });

    posts[index].likes = (posts[index].likes || 0) + 1;

    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    return res.status(200).json({ ok: true, likes: posts[index].likes });
  }

  res.status(405).json({ error: "Method not allowed" });
}
