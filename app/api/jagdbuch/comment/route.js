import { NextResponse } from "next/server";
import fs from "fs";

const FILE = "/tmp/jagdbuch.json";

export async function POST(req) {
  const { slug, text, user } = await req.json();

  const posts = JSON.parse(fs.readFileSync(FILE, "utf8"));
  const post = posts.find(p => p.slug === slug);

  if (!post)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  post.comments.push({
    id: Date.now(),
    user: user || "Jäger",
    text,
    date: new Date().toISOString()
  });

  fs.writeFileSync(FILE, JSON.stringify(posts, null, 2));

  return NextResponse.json(post.comments);
}
