"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin() {
    setMsg("");

    if (!email || !email.includes("@")) {
      setMsg("Bitte gültige E-Mail eingeben.");
      return;
    }

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        credentials: "include",  // 🟢 GANZ WICHTIG!
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!data.success) {
        setMsg(data.message || "Fehler beim Login.");
        return;
      }

      // Falls E-Mail später erneut benötigt wird
      localStorage.setItem("jl_email_last", email);

      // 🟢 Weiterleitung: jetzt sind Cookies gesetzt!
      window.location.href = "/";

    } catch (err) {
      setMsg("Serverfehler: " + err.toString());
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Login</h1>
      <p>Gib deine E-Mail ein:</p>

      <input
        type="email"
        value={email}
        placeholder="dein@email.de"
        onChange={(e) => setEmail(e.target.value)}
        style={{
          display: "block",
          marginBottom: "12px",
          padding: "10px",
          width: "100%",
          maxWidth: "400px",
        }}
      />

      <button
        onClick={handleLogin}
        style={{
          padding: "12px 20px",
          background: "#0a7f0a",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Login
      </button>

      {msg && (
        <p style={{ color: "red", marginTop: "12px" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
