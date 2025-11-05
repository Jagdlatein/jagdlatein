// pages/api/quiz/upload.js
export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const adminPass = process.env.ADMIN_PASS || "Jagdlatein2025";
  if (req.headers["x-admin-pass"] !== adminPass) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { path = "public/data/quiz_bank.json", data, message = "update quiz_bank.json", branch } = req.body || {};
  if (!data || !Array.isArray(data)) return res.status(400).json({ error: "Body.data muss ein Array sein." });

  const repo = process.env.GITHUB_REPO;   // z.B. "hannes-ziegler/jagdlatein"
  const token = process.env.GITHUB_TOKEN; // PAT mit repo-Rechten
  const targetBranch = branch || process.env.GITHUB_BRANCH || "main";
  if (!repo || !token) return res.status(500).json({ error: "Server nicht konfiguriert (GITHUB_REPO / GITHUB_TOKEN)." });

  try {
    const apiBase = "https://api.github.com";
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    };

    // 1) SHA der bestehenden Datei holen (falls vorhanden)
    let sha = undefined;
    const getResp = await fetch(`${apiBase}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(targetBranch)}`, { headers });
    if (getResp.ok) {
      const j = await getResp.json();
      sha = j.sha;
    }

    // 2) Content base64
    const content = Buffer.from(JSON.stringify(data, null, 2), "utf8").toString("base64");

    // 3) Commit (create/update file)
    const putResp = await fetch(`${apiBase}/repos/${repo}/contents/${encodeURIComponent(path)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message,
        content,
        branch: targetBranch,
        sha
      })
    });

    const result = await putResp.json();
    if (!putResp.ok) {
      return res.status(500).json({ error: "GitHub API Fehler", details: result });
    }

    return res.status(200).json({ ok: true, path, branch: targetBranch, commit: result.commit?.sha });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Unbekannter Fehler" });
  }
}
