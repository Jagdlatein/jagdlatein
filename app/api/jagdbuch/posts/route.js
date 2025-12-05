import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = "/tmp/jagdbuch-posts.json";

function loadPosts() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]"); // Datei erzeugen
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function savePosts(posts) {
  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
}

// ░░░ GET ░░░
export async function GET() {
  const posts = loadPosts();
  return NextResponse.json(posts);
}

// ░░░ POST ░░░
export async function POST(req) {
  try {
    const body = await req.json();
    const posts = loadPosts();

    const newPost = {
      ...body,
      user: req.headers.get("x-user") || "Jäger",
      created: new Date().toISOString(),
    };

    posts.unshift(newPost);
    savePosts(posts);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ░░░ PUT ░░░
export async function PUT(req) {
  const body = await req.json();
  const posts = loadPosts();

  const index = posts.findIndex((p) => p.slug === body.slug);
  if (index === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  posts[index] = {
    ...posts[index],
    ...body,
    updated: new Date().toISOString(),
  };

  savePosts(posts);
  return NextResponse.json({ ok: true });
}

// ░░░ DELETE ░░░
export async function DELETE(req) {
  const body = await req.json();
  const posts = loadPosts();

  const index = posts.findIndex((p) => p.slug === body.slug);
  if (index === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  posts.splice(index, 1);
  savePosts(posts);

  return NextResponse.json({ ok: true });
}
