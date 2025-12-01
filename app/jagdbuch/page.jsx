import Link from "next/link";

async function getPosts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/jagdbuch/posts`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function Jagdbuch() {
  const posts = await getPosts();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-6">
        Jagdbuch – Austausch unter Jägern
      </h1>

      <p className="text-center text-gray-600 mb-10">
        Erfahrungen, Jagdpraxis, Revierarbeit und Wissen – von Jägern, für Jäger.
      </p>

      <div className="space-y-6">
        {posts.map(post => (
          <Link
            key={post.slug}
            href={`/jagdbuch/${post.slug}`}
            className="block p-5 border rounded-lg hover:bg-gray-50"
          >
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="text-gray-600 mt-2">{post.excerpt}</p>
            <span className="text-xs text-gray-400">{post.date}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
