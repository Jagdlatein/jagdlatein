"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { isCountryQuizTopic, quizLearningUrl } from "../../../lib/quiz-learning-scope";

function UsernameForm() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedCountry = (params.get("country") || "DE").toUpperCase();
  const requestedTopic = (params.get("topic") || "Alle").trim();
  const quizTopic = requestedTopic.length > 0 && requestedTopic.length <= 120 && !/[\u0000-\u001f\u007f]/.test(requestedTopic)
    ? requestedTopic : "Alle";
  const quizCountry = isCountryQuizTopic(quizTopic) && ["DE", "AT", "CH"].includes(requestedCountry) ? requestedCountry : "DE";
  const quizUrl = quizLearningUrl("/quiz-app/run", quizCountry, quizTopic);
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState(["DE", "AT", "CH"].includes(requestedCountry) ? requestedCountry : "DE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [renewalRequired, setRenewalRequired] = useState(false);
  const registrationPending = useRef(false);
  const mounted = useRef(false);
  const registrationController = useRef(null);
  useEffect(() => {
    mounted.current = true;
    try {
      const storedName = localStorage.getItem("jagd_username");
      if (typeof storedName === "string" && storedName.length <= 40 && !/[\u0000-\u001f\u007f]/.test(storedName)) setUsername(storedName);
      const storedCountry = localStorage.getItem("jagd_country");
      if (countries.some(item => item.code === storedCountry)) setCountry(storedCountry);
    } catch {
      // Keep the initial profile choice when browser storage is unavailable.
    }
    return () => {
      mounted.current = false;
      registrationController.current?.abort();
    };
  }, []);
  const countries = [
    { code: "DE", name: "Deutschland 🇩🇪" },
    { code: "AT", name: "Österreich 🇦🇹" },
    { code: "CH", name: "Schweiz 🇨🇭" },
    { code: "FR", name: "Frankreich 🇫🇷" },
    { code: "IT", name: "Italien 🇮🇹" },
    { code: "ES", name: "Spanien 🇪🇸" },
    { code: "PT", name: "Portugal 🇵🇹" },
    { code: "NL", name: "Niederlande 🇳🇱" },
    { code: "BE", name: "Belgien 🇧🇪" },
    { code: "LU", name: "Luxemburg 🇱🇺" },
    { code: "DK", name: "Dänemark 🇩🇰" },
    { code: "NO", name: "Norwegen 🇳🇴" },
    { code: "SE", name: "Schweden 🇸🇪" },
    { code: "FI", name: "Finnland 🇫🇮" },
    { code: "PL", name: "Polen 🇵🇱" },
    { code: "CZ", name: "Tschechien 🇨🇿" },
    { code: "SK", name: "Slowakei 🇸🇰" },
    { code: "HU", name: "Ungarn 🇭🇺" },
    { code: "SI", name: "Slowenien 🇸🇮" },
    { code: "HR", name: "Kroatien 🇭🇷" },
    { code: "RO", name: "Rumänien 🇷🇴" },
    { code: "BG", name: "Bulgarien 🇧🇬" },
    { code: "GR", name: "Griechenland 🇬🇷" },
    { code: "IE", name: "Irland 🇮🇪" },
    { code: "UK", name: "Vereinigtes Königreich 🇬🇧" },
  ];

  

  async function start() {
    if (!mounted.current || registrationPending.current) return;
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setError("Bitte gib einen Namen für die Rangliste ein.");
      return;
    }
    if (clean.length > 40 || /[\u0000-\u001f\u007f]/.test(clean)) {
      setError("Dein Quizname darf höchstens 40 Zeichen lang sein und keine Steuerzeichen enthalten.");
      return;
    }
    registrationPending.current = true;
    registrationController.current = new AbortController();
    setBusy(true);
    setError("");
    setRenewalRequired(false);
    try {
      const res = await fetch("/api/quiz/register", {
        method: "POST",
        credentials: "same-origin",
        signal: registrationController.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean, country }),
      });
      const json = await res.json();
      if (!mounted.current) return;
      if (!res.ok || json.success !== true) {
        const failure = new Error(res.status === 409
          ? "Dieser Quizname ist bereits vergeben. Bitte wähle einen anderen Namen."
          : "Dein Quizname konnte gerade nicht gespeichert werden. Bitte versuche es erneut.");
        failure.renewalRequired = res.status === 401 || res.status === 403;
        failure.expected = true;
        throw failure;
      }
      if (typeof json.username !== "string" || !json.username || json.username.length > 40
        || /[\u0000-\u001f\u007f]/.test(json.username) || !countries.some(item => item.code === json.country)) {
        throw Object.assign(new Error("Dein Quizname konnte gerade nicht bestätigt werden. Bitte versuche es erneut."), { expected: true });
      }
      setUsername(json.username);
      setCountry(json.country);
      try {
        localStorage.setItem("jagd_username", json.username);
        localStorage.setItem("jagd_country", json.country);
      } catch { /* Browser storage is optional; the name belongs to the signed-in account. */ }
      router.push(quizUrl);
    } catch (failure) {
      if (mounted.current) {
        setError(failure.expected ? failure.message : "Dein Quizname konnte gerade nicht gespeichert werden. Bitte versuche es erneut.");
        setRenewalRequired(failure.renewalRequired === true);
      }
    } finally {
      registrationPending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 30 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>
        🏹 Jagdquiz – Start
      </h1>
      <p>{isCountryQuizTopic(quizTopic) ? <>Recht: <strong>{{ DE: "Deutschland", AT: "Österreich", CH: "Schweiz" }[quizCountry]}</strong></> : <>Lernbereich: <strong>{quizTopic === "Alle" ? "Alle Lernbereiche" : quizTopic}</strong></>}</p>
      <p><Link href={quizLearningUrl("/quiz-app", quizCountry, quizTopic)}>Thema wählen</Link></p>

      <label htmlFor="quiz-username" style={{ fontSize: 18, fontWeight: 700 }}>Dein Username:</label>
      <input
        id="quiz-username"
        type="text"
        disabled={busy}
        maxLength={40}
        placeholder="z.B. hannesjäger"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 14,
          marginTop: 8,
          borderRadius: 10,
          border: "1px solid #ccc",
          fontSize: 18,
        }}
      />

      <div style={{ marginTop: 20 }}>
        <label htmlFor="leaderboard-country" style={{ fontSize: 18, fontWeight: 700 }}>Dein Land für die Rangliste:</label>
        <select
          id="leaderboard-country"
          disabled={busy}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 14,
            fontSize: 18,
            marginTop: 8,
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={start}
        disabled={busy}
        style={{
          marginTop: 30,
          width: "100%",
          padding: 16,
          background: "#136f39",
          color: "white",
          fontSize: 20,
          borderRadius: 12,
          border: 0,
          cursor: "pointer",
        }}
      >
        {busy ? "Quizname wird gespeichert…" : "▶️ Quiz starten"}
      </button>
      <p style={{ lineHeight: 1.5 }}>Dein Quizname gehört zu deinem Konto. Ein bereits gespeicherter Name bleibt mit deinem Konto verbunden.</p>
      {error && <p role="alert" style={{ color: "#9b2828", lineHeight: 1.5 }}>{error}</p>}
      {renewalRequired && <p><Link href={`/login?reauth=1&next=${encodeURIComponent(quizLearningUrl("/quiz-app/username", quizCountry, quizTopic))}`}>Anmeldung erneuern</Link></p>}
    </div>
  );
}

export default function UsernamePage() {
  return <Suspense fallback={<p style={{ padding: 30 }}>Quizstart wird vorbereitet…</p>}><UsernameForm /></Suspense>;
}
