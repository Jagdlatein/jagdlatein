import fs from "fs";
import path from "path";

// Body-Parser für JSON aktivieren
export const config = {
  api: {
    bodyParser: true,
  },
};

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  // Datei laden
  let posts = [];
  if (fs.existsSync(filePath)) {
    try {
      posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
      posts = [];
    }
  }

  // POST → neuen Beitrag speichern
  if (req.method === "POST") {
    const { title, content, slug } = req.body;

    if (!title || !content || !slug) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const newPost = {
      title,
      content,
      slug,
      excerpt: content.substring(0, 150),
      date: new Date().toISOString().split("T")[0],
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
