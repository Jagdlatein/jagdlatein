import { NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/jagdbuch";

export async function GET(req, { params }) {
  const post = await getPostBySlug(params.slug);
  return NextResponse.json(post);
}
