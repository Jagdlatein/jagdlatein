import { NextResponse } from "next/server";
import fs from "fs";

const FILE = "/tmp/jagdbuch.json";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!fs.existsSync(FILE))
    return NextResponse.json({ error: "No posts" }, { status: 404 });

  const posts = JSON.parse(fs.readFileSync(FILE, "utf8"));
  const post = posts.find(p => p.slug === slug);

  if (!post)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(post);
}
