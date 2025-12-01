async function getPost(slug) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/jagdbuch/posts/${slug}`, {
    cache: "no-store",
  });
  return res.json();
}

async function getComments(slug) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/jagdbuch/comments?slug=${slug}`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function JagdbuchPost({ params }) {
  const post = await getPost(params.slug);
  const comments = await getComments(params.slug);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

      <article
        className="prose mb-10"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <section>
        <h2 className="text-xl font-semibold mb-4">Kommentare</h2>

        {comments.map((c, i) => (
          <div key={i} className="border p-3 mb-3 rounded">
            <p>{c.text}</p>
            <span className="text-xs text-gray-400">{c.date}</span>
          </div>
        ))}

        <form
          action="/api/jagdbuch/comments"
          method="POST"
          className="flex flex-col mt-6"
        >
          <textarea
            name="text"
            className="w-full p-3 border rounded mb-2"
            placeholder="Kommentar schreiben…"
            required
          />

          <input type="hidden" name="slug" value={post.slug} />

          <button className="px-4 py-2 bg-green-700 text-white rounded">
            Abschicken
          </button>
        </form>
      </section>
    </main>
  );
}
