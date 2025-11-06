// pages/api/admin/debug.js
export const config = { api: { bodyParser: false }, runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    const has = (k) => Boolean(process.env[k] && String(process.env[k]).length);
    const out = {
      ok: true,
      env: {
        has_DATABASE_URL: has("DATABASE_URL"),
        has_ADMIN_PASS: has("ADMIN_PASS"),
        has_GITHUB_TOKEN: has("GITHUB_TOKEN"),
        GITHUB_OWNER: process.env.GITHUB_OWNER || null,
        GITHUB_REPO: process.env.GITHUB_REPO || null,
        GITHUB_BRANCH: process.env.GITHUB_BRANCH || "main",
      },
    };

    // GitHub-Check (Token/Repo/Branch)
    if (has("GITHUB_TOKEN") && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
      const url = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/git/ref/heads/${process.env.GITHUB_BRANCH || "main"}`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "User-Agent":"jagdlatein-debug" } });
      out.github = { status: r.status, ok: r.ok };
      if (!r.ok) out.github_detail = await r.text();
    }

    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e?.message||e) });
  }
}
