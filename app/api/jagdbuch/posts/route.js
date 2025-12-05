import { promises as fs } from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

async function loadPosts() {
  try {
    const json = await fs.readFile(filePath, "utf8");
    return JSON.parse(json || "[]");
  } catch {
    return [];
  }
}

async function savePosts(posts) {
  await fs.writeFile(filePath, JSON.stringify(posts, null, 2));
}

export async function POST(req) {
  const body = await req.json();
  const posts = await loadPosts();

  const newPost = {
    ...body,
    likes: 0,
    comments: [],
    images: [],
    created: new Date().toISOString(),
  };

  posts.unshift(newPost);
  await savePosts(posts);

  return Response.json({ ok: true });
}
