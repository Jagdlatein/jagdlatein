import { promises as fs } from "fs";
import path from "path";

export async function POST(req) {
  try {
    const body = await req.json();

    const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

    // Datei einlesen oder neu erzeugen
    let posts = [];
    try {
      const data = await fs.readFile(filePath, "utf8");
      posts = JSON.parse(data);
    } catch {
      posts = [];
    }

    const newPost = {
      ...body,
      likes: 0,
      comments: [],
      images: []
    };

    posts.unshift(newPost);

    // Speichern
    await fs.writeFile(filePath, JSON.stringify(posts, null, 2));

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500
    });
  }
}
