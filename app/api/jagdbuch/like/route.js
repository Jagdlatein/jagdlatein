import { NextResponse } from "next/server";
import fs from "fs";

const FILE = "/tmp/jagdbuch.json";

export async function POST(req) {
  const { slug } = await req.json();
  const clientId = req.headers.get("x-client-id");

  const posts = JSON.parse(fs.readFileSync(FILE, "utf8"));
  const post = posts.find(p => p.slug === slug);

  if (!post)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!post.likedBy.includes(clientId)) {
    post.likedBy.push(clientId);
    post.likes++;
  }

  fs.writeFileSync(FILE, JSON.stringify(posts, null, 2));

  return NextResponse.json({ likes: post.likes });
}
