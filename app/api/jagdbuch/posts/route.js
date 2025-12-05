import { NextResponse } from "next/server";
import fs from "fs";

const FILE = "/tmp/jagdbuch.json";

function load() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  const posts = load();
  return NextResponse.json(posts);
}

export async function POST(req) {
  const body = await req.json();
  const posts = load();

  const newPost = {
    ...body,
    likes: 0,
    likedBy: [],
    comments: [],
    images: []
  };

  posts.unshift(newPost);
  save(posts);

  return NextResponse.json({ ok: true });
}
