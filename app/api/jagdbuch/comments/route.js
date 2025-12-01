import { NextResponse } from "next/server";
import { getComments, addComment } from "@/lib/jagdbuch";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const comments = await getComments(slug);
  return NextResponse.json(comments);
}

export async function POST(req) {
  const body = await req.json();
  const result = await addComment(body);
  return NextResponse.json(result);
}
