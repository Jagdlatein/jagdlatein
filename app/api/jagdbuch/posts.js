import fs from "fs";
import path from "path";

function getFilePath() {
  // Vercel: /tmp ist beschreibbar
  return "/tmp/jagdbuch.json";
}

function loadPosts() {
  const file = getFilePath();
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function savePosts(posts) {
  const file = getFilePath();
  fs.writeFileSync(file, JSON.stringify(posts, null, 2));
}

export default function handler(req, res) {
  const posts = loadPosts();

  if (req.method === "GET") {
    return res.status(200).json(posts);
  }

  if (req.method === "POST") {
    const { title, content, slug, date, excerpt } = req.body;

    const newPost = {
      title,
      content,
      slug,
      excerpt,
      date,
      likes: 0,
      likedBy: [],
      comments: [],
      images: []
    };

    posts.unshift(newPost);
    savePosts(posts);

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
