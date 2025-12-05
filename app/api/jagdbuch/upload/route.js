import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req) {
  const form = await req.formData();
  const file = form.get("image");

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = Date.now() + "-" + file.name;
  const filePath = path.join(process.cwd(), "public/jagdbuch", fileName);

  await writeFile(filePath, buffer);

  return NextResponse.json({
    url: "/jagdbuch/" + fileName,
  });
}
