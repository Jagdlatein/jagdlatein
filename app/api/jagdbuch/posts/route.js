import { kv } from "@vercel/kv";

export async function POST(req) {
  const body = await req.json();

  const post = {
    ...body,
    likes: 0,
    comments: [],
    images: [],
    created: Date.now()
  };

  // speichern
  await kv.lpush("posts", JSON.stringify(post));

  return Response.json({ ok: true });
}
