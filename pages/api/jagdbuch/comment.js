import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  if (req.method === "POST") {
    const { slug, text, user } = req.body;

    let posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const index = posts.findIndex(p => p.slug === slug);

    if (index === -1) return res.status(404).json({ error: "Not found" });

    posts[index].comments = posts[index].comments || [];
    posts[index].comments.push({
      text,
      user,
      date: new Date().toISOString().split("T")[0],
    });

    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    return res.status(200).json({ ok: true, comments: posts[index].comments });
  }

  res.status(405).json({ error: "Method not allowed" });
}
