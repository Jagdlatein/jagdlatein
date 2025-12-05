import { notFound } from "next/navigation";
import PostClient from "./PostClient";

export default async function JagdbuchPostPage({ params }) {
  const slug = params.slug;

  const res = await fetch(process.env.NEXT_PUBLIC_SITE_URL + `/api/jagdbuch/get?slug=${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) return notFound();

  const post = await res.json();

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <PostClient post={post} />
    </main>
  );
}
