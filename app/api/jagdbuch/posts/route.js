import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const body = await req.json();

  const filePath = path.join(process.cwd(), "data/jagdbuch/posts.json");

  let posts = [];
  if (fs.existsSync(filePath)) {
    posts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  const user = req.headers.get("x-user") || "Jäger";

  const newPost = {
    ...body,
    likes: 0,
    comments: [],
    images: [],
    user,
  };

  posts.unshift(newPost);

  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));

  return NextResponse.json({ ok: true });
}
