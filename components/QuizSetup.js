"use client";

import Link from "next/link";
import { useState } from "react";
import AppIcon from "./AppIcon";
import { isCountryQuizTopic, quizLearningUrl } from "../lib/quiz-learning-scope";
import styles from "../styles/QuizSetup.module.css";

export default function QuizSetup({ commonOptions, countryOptions, initialCountry, initialTopic }) {
  const [country, setCountry] = useState(initialCountry);
  const [topic, setTopic] = useState(initialTopic);
  const selectedCountry = countryOptions.find(option => option.code === country) || countryOptions[0];
  const selectedTopic = commonOptions.topics.find(option => option.name === topic);
  const activeTopic = isCountryQuizTopic(topic) || selectedTopic ? topic : "Alle";
  const countryTopic = isCountryQuizTopic(activeTopic);
  const available = countryTopic ? selectedCountry.count : selectedTopic ? selectedTopic.count : commonOptions.total;
  const questionsInRound = Math.min(10, available);
  const startUrl = quizLearningUrl("/quiz-app/run", selectedCountry.code, activeTopic);

  function chooseCountry(code) {
    const next = countryOptions.find(option => option.code === code);
    if (!next) return;
    setCountry(code);
  }

  return (
    <main className={styles.main}>
      <div className={styles.wrap}>
        <nav className={styles.nav} aria-label="Quizmenü">
          <Link href="/lernen"><AppIcon name="book" size={20} />Lernbereich</Link>
          <Link href="/auswertungen"><AppIcon name="stats" size={20} />Meine Auswertungen</Link>
        </nav>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Wissen anwenden</p>
          <h1><AppIcon name="quiz" size={34} />Jagdquiz</h1>
          <p>Wähle dein Thema und übe gemeinsames Jagdwissen. Bei Rechtsfragen wählst du zusätzlich das passende Land.</p>
        </header>
        <section className={styles.card} aria-labelledby="quiz-setup-title">
          <h2 id="quiz-setup-title">Deine Quizrunde</h2>
          <label htmlFor="quiz-topic" className={styles.label}>Welches Thema möchtest du üben?</label>
          <select id="quiz-topic" value={activeTopic} onChange={event => setTopic(event.target.value)} className={styles.select}>
            <option value="Alle">Alle Lernbereiche ({commonOptions.total} Fragen)</option>
            {commonOptions.topics.map(option => <option key={option.name} value={option.name}>{option.name} ({option.count} Fragen)</option>)}
            <option value="Recht">Recht · Land wählen</option>
          </select>
          {countryTopic ? <fieldset className={styles.fieldset}>
            <legend>Für welches Land möchtest du Recht üben?</legend>
            <div className={styles.countries}>
              {countryOptions.map(option => (
                <button type="button" key={option.code} aria-pressed={country === option.code} className={styles.country} onClick={() => chooseCountry(option.code)}>
                  <strong><AppIcon name={`flag-${option.code}`} size={24} />{option.name}</strong>
                  <span>{option.count} Rechtsfragen</span>
                </button>
              ))}
            </div>
          </fieldset> : <p className={styles.hint}>Gemeinsames Lernwissen für Deutschland, Österreich und die Schweiz. Rechtsfragen findest du im Thema Recht mit eigener Länderwahl.</p>}
          <div className={styles.summary}>
            <strong><AppIcon name={countryTopic ? "law" : "quiz"} size={22} />{countryTopic ? `${selectedCountry.name} · Recht` : activeTopic === "Alle" ? "Alle Lernbereiche" : activeTopic}</strong>
            <p>{questionsInRound} zufällig ausgewählte Fragen aus {available} verfügbaren Fragen.</p>
            <p>Du hast 30 Sekunden pro Frage. Nach jeder Antwort siehst du die Erklärung und kannst selbst weitergehen.</p>
          </div>
          {available > 0 && <Link href={startUrl} className={styles.start}>Quiz starten<AppIcon name="arrow-right" size={20} /></Link>}
        </section>
      </div>
    </main>
  );
}
