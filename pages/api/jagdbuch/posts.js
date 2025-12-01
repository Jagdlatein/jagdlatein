import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  if (req.method === "POST") {
    const newPost = req.body;

    let posts = [];
    if (fs.existsSync(filePath)) {
      posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    posts.unshift(newPost);

    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
