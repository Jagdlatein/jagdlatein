import { promises as fs } from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

async function loadPosts() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function savePosts(posts) {
  await fs.writeFile(filePath, JSON.stringify(posts, null, 2));
}

export async function POST(req) {
  const body = await req.json();
  const user = req.headers.get("x-user") || "Jäger";

  const posts = await loadPosts();

  const newPost = {
    ...body,
    likes: 0,
    comments: [],
    images: [],
    user,
  };

  posts.unshift(newPost);
  await savePosts(posts);

  return Response.json({ ok: true });
}

export async function PUT(req) {
  const body = await req.json();
  const user = req.headers.get("x-user") || "Jäger";
  const isAdmin = req.headers.get("x-admin") === "1";

  const posts = await loadPosts();

  const index = posts.findIndex((p) => p.slug === body.slug);
  if (index === -1) return Response.json({ error: "Not found" }, { status: 404 });

  const post = posts[index];

  if (post.user !== user && !isAdmin)
    return Response.json({ error: "Not allowed" }, { status: 403 });

  posts[index] = {
    ...post,
    title: body.title,
    content: body.content,
    excerpt: body.content.slice(0, 120),
    updated: new Date().toISOString(),
  };

  await savePosts(posts);
  return Response.json({ ok: true });
}

export async function DELETE(req) {
  const body = await req.json();
  const user = req.headers.get("x-user") || "Jäger";
  const isAdmin = req.headers.get("x-admin") === "1";

  let posts = await loadPosts();

  const index = posts.findIndex((p) => p.slug === body.slug);
  if (index === -1) return Response.json({ error: "Not found" }, { status: 404 });

  const post = posts[index];

  if (post.user !== user && !isAdmin)
    return Response.json({ error: "Not allowed" }, { status: 403 });

  posts.splice(index, 1);
  await savePosts(posts);

  return Response.json({ ok: true });
}
