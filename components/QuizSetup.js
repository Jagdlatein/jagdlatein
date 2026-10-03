"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../styles/QuizSetup.module.css";

export default function QuizSetup({ countryOptions, initialCountry, initialTopic }) {
  const [country, setCountry] = useState(initialCountry);
  const [topic, setTopic] = useState(initialTopic);
  const selectedCountry = countryOptions.find(option => option.code === country) || countryOptions[0];
  const selectedTopic = selectedCountry.topics.find(option => option.name === topic);
  const activeTopic = selectedTopic ? topic : "Alle";
  const available = selectedTopic ? selectedTopic.count : selectedCountry.total;
  const questionsInRound = Math.min(10, available);
  const startUrl = `/quiz-app/run?country=${encodeURIComponent(selectedCountry.code)}&topic=${encodeURIComponent(activeTopic)}`;

  function chooseCountry(code) {
    const next = countryOptions.find(option => option.code === code);
    if (!next) return;
    setCountry(code);
    if (topic !== "Alle" && !next.topics.some(option => option.name === topic)) setTopic("Alle");
  }

  return (
    <main className={styles.main}>
      <div className={styles.wrap}>
        <nav className={styles.nav} aria-label="Quizmenü">
          <Link href="/lernen">Lernbereich</Link>
          <Link href="/auswertungen">Meine Auswertungen</Link>
        </nav>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Wissen anwenden</p>
          <h1>Jagdquiz</h1>
          <p>Wähle das Land und dein Thema. Die Fragen passen zum Jagdwissen des gewählten Landes.</p>
        </header>
        <section className={styles.card} aria-labelledby="quiz-setup-title">
          <h2 id="quiz-setup-title">Deine Quizrunde</h2>
          <fieldset className={styles.fieldset}>
            <legend>Zu welchem Land möchtest du lernen?</legend>
            <div className={styles.countries}>
              {countryOptions.map(option => (
                <button type="button" key={option.code} aria-pressed={country === option.code} className={styles.country} onClick={() => chooseCountry(option.code)}>
                  <strong>{option.name}</strong>
                  <span>{option.total} Fragen verfügbar</span>
                </button>
              ))}
            </div>
          </fieldset>
          <label htmlFor="quiz-topic" className={styles.label}>Welches Thema möchtest du üben?</label>
          <select id="quiz-topic" value={activeTopic} onChange={event => setTopic(event.target.value)} className={styles.select}>
            <option value="Alle">Alle Themen ({selectedCountry.total} Fragen)</option>
            {selectedCountry.topics.map(option => <option key={option.name} value={option.name}>{option.name} ({option.count} Fragen)</option>)}
          </select>
          <div className={styles.summary}>
            <strong>{selectedCountry.name} · {activeTopic === "Alle" ? "Alle Themen" : activeTopic}</strong>
            <p>{questionsInRound} zufällig ausgewählte Fragen aus {available} verfügbaren Fragen.</p>
            <p>Du hast 30 Sekunden pro Frage. Nach jeder Antwort siehst du die Erklärung und kannst selbst weitergehen.</p>
          </div>
          {available > 0 && <Link href={startUrl} className={styles.start}>Quiz starten</Link>}
        </section>
      </div>
    </main>
  );
}
