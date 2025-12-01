import { NextResponse } from "next/server";
import { getAllPosts, addPost } from "@/lib/jagdbuch";

export async function GET() {
  const posts = await getAllPosts();
  return NextResponse.json(posts);
}

export async function POST(req) {
  const body = await req.json();
  const result = await addPost(body);
  return NextResponse.json(result);
}
