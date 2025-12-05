import { NextResponse } from "next/server";
import path from "path";
import { writeFile, readFile } from "fs/promises";

export async function POST(req) {
  try {
    const body = await req.json();

    const filePath = path.join(process.cwd(), "public/data/jagdbuch/posts.json");

    // Datei lesen
    let posts = [];
    try {
      const raw = await readFile(filePath, "utf8");
      posts = JSON.parse(raw);
    } catch (_) {
      posts = [];
    }

    // Neuen Beitrag hinzufügen
    const newPost = {
      ...body,
      likes: 0,
      comments: [],
      images: [],
      date: new Date().toISOString().split("T")[0],
    };

    posts.unshift(newPost);

    // Datei speichern
    await writeFile(filePath, JSON.stringify(posts, null, 2), "utf8");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST ERROR:", err);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}
