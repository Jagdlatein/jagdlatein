import { useState } from "react";

export default function AdminPush() {
  const [title, setTitle] = useState("Jagdlatein");
  const [body, setBody] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function sendPush(e) {
    e.preventDefault();

    setResult(null);
    setError("");

    if (!title.trim() || !body.trim() || !adminPass.trim()) {
      setError("Bitte Titel, Nachricht und Admin-Passwort ausfüllen.");
      return;
    }

    const confirmed = window.confirm(
      `Push wirklich an alle aktiven Geräte senden?\n\n${title}\n${body}`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminPass.trim()}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Fehler ${response.status}`);
      }

      setResult(data);
      setBody("");
    } catch (err) {
      setError(err.message || "Push konnte nicht gesendet werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 650,
        margin: "0 auto",
        padding: "32px 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>🔔 Jagdlatein Push</h1>

      <p style={{ color: "#666", marginTop: 0 }}>
        Nachricht an alle registrierten Geräte senden.
      </p>

      <form
        onSubmit={sendPush}
        style={{
          display: "grid",
          gap: 18,
          marginTop: 32,
        }}
      >
        <label>
          <strong>Titel</strong>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            style={{
              display: "block",
              width: "100%",
              marginTop: 8,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        </label>

        <label>
          <strong>Nachricht</strong>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            maxLength={500}
            placeholder="Deine Push-Nachricht ..."
            style={{
              display: "block",
              width: "100%",
              marginTop: 8,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </label>

        <label>
          <strong>Admin-Passwort</strong>

          <input
            type="password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            autoComplete="current-password"
            style={{
              display: "block",
              width: "100%",
              marginTop: 8,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "14px 18px",
            border: 0,
            borderRadius: 10,
            background: "#111827",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Wird gesendet ..." : "🔔 Push an alle senden"}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: 24,
            padding: 14,
            background: "#fee2e2",
            borderRadius: 8,
          }}
        >
          ❌ {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#dcfce7",
            borderRadius: 8,
          }}
        >
          <strong>✅ Push versendet</strong>

          <div style={{ marginTop: 10 }}>
            Erfolgreich: {result.sent}
            <br />
            Fehlgeschlagen: {result.failed}
            <br />
            Geräte insgesamt: {result.total}
            <br />
            Deaktivierte Tokens: {result.disabled}
          </div>
        </div>
      )}
    </main>
  );
}
