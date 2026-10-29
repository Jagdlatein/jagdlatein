"use client";

import Link from "next/link";
import { useState } from "react";
import AppIcon from "./AppIcon";
import { isCountryQuizTopic, quizLearningUrl } from "../lib/quiz-learning-scope";
import { learningCategoryDetails } from "../lib/learning-categories";
import { useExamProfile } from "../lib/use-exam-profile";
import { getExamProfileDetails, examProfileLawHref } from "../lib/exam-profile";
import ExamProfileSummary from "./ExamProfileSummary";
import styles from "../styles/QuizSetup.module.css";

export default function QuizSetup({ commonOptions, countryOptions, initialCountry, initialTopic, legacyTopic = null, countryExplicit = false }) {
  const [country, setCountry] = useState(initialCountry);
  const [topic, setTopic] = useState(initialTopic);
  const [countryChosen, setCountryChosen] = useState(false);
  const exam = useExamProfile();
  const profileDetails = getExamProfileDetails(exam.profile);
  const effectiveCountry = !countryExplicit && !countryChosen && profileDetails ? profileDetails.country.code : country;
  const selectedCountry = countryOptions.find(option => option.code === effectiveCountry) || countryOptions[0];
  const selectedTopic = commonOptions.topics.find(option => option.name === topic);
  const legacyActive = legacyTopic?.name === topic;
  const activeTopic = isCountryQuizTopic(topic) || selectedTopic || legacyActive ? topic : "Alle";
  const countryTopic = isCountryQuizTopic(activeTopic);
  const available = countryTopic ? selectedCountry.count : selectedTopic ? selectedTopic.count : legacyActive ? legacyTopic.count : commonOptions.total;
  const categoryValue = countryTopic ? "Recht" : legacyActive ? legacyTopic.category : activeTopic;
  const menuTopics = learningCategoryDetails.flatMap(category => {
    if (category.slug === "jagdrecht") return [{ name: "Recht", title: category.title, count: selectedCountry.count }];
    const option = commonOptions.topics.find(item => item.name === category.title);
    return option ? [{ ...option, title: category.title }] : [];
  });
  const questionsInRound = Math.min(10, available);
  const startUrl = quizLearningUrl("/quiz-app/run", selectedCountry.code, activeTopic);

  function chooseCountry(code) {
    const next = countryOptions.find(option => option.code === code);
    if (!next) return;
    setCountryChosen(true);
    setCountry(code);
  }

  return (
    <main className={styles.main}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Wissen anwenden</p>
          <h1><AppIcon name="trophy" size={36} />Jagdquiz mit Rangliste</h1>
          <p>Wähle dein Thema und spiele eine gewertete Runde. Bei Rechtsfragen wählst du zusätzlich das passende Land.</p>
        </header>
        <ExamProfileSummary />
        <section className={styles.card} aria-labelledby="quiz-setup-title">
          <h2 id="quiz-setup-title">Deine Quizrunde</h2>
          <label htmlFor="quiz-topic" className={styles.label}>Kategorie</label>
          <select id="quiz-topic" value={categoryValue} onChange={event => setTopic(event.target.value)} className={styles.select}>
            <option value="Alle">Alle Kategorien ({commonOptions.total} Fragen)</option>
            {menuTopics.map(option => <option key={option.name} value={option.name}>{option.title} ({option.count} Fragen)</option>)}
          </select>
          {legacyActive && <p className={styles.hint}>Teilthema: {legacyTopic.name} · <button type="button" className={styles.scopeReset} onClick={() => setTopic(legacyTopic.category)}>Ganze Kategorie</button></p>}
          {countryTopic && !countryExplicit && !countryChosen && !exam.ready ? <p role="status">Dein Prüfungsprofil wird geladen …</p> : countryTopic ? <fieldset className={styles.fieldset}>
            <legend>Land</legend>
            <div className={styles.countries}>
              {countryOptions.map(option => (
                <button type="button" key={option.code} aria-pressed={selectedCountry.code === option.code} className={styles.country} onClick={() => chooseCountry(option.code)}>
                  <strong><AppIcon name={`flag-${option.code}`} size={24} />{option.name}</strong>
                  <span>{option.count} Rechtsfragen</span>
                </button>
              ))}
            </div>
          </fieldset> : <p className={styles.hint}>Gemeinsames Lernwissen für Deutschland, Österreich und die Schweiz. Jagdrecht hat eine eigene Länderwahl.</p>}
          {countryTopic && <p className={styles.hint}>Diese Ranglistenrunde enthält allgemeine Rechtsfragen zum gewählten Land. Sie ist keine Prüfungssimulation für einen bestimmten Kanton oder ein Bundesland.</p>}
          {countryTopic && profileDetails && selectedCountry.code === profileDetails.country.code && <p><Link href={examProfileLawHref(exam.profile, "uebung")} className={styles.start}>Recht für {profileDetails.region.name} üben</Link></p>}
          <div className={styles.summary}>
            <strong><AppIcon name={countryTopic ? "law" : "quiz"} size={22} />{countryTopic ? `${selectedCountry.name} · Jagdrecht` : activeTopic === "Alle" ? "Alle Kategorien" : activeTopic}</strong>
            <p>{questionsInRound} zufällig ausgewählte Fragen aus {available} verfügbaren Fragen.</p>
            <p>Du hast 30 Sekunden pro Frage. Nach jeder Antwort siehst du die Erklärung und kannst selbst weitergehen.</p>
            <p>Deine beste vollständig abgeschlossene Runde zählt für die Gesamtrangliste. Beim ersten Start wählst du einmalig deinen öffentlichen Quiznamen.</p>
          </div>
          {available > 0 && (!countryTopic || countryExplicit || countryChosen || exam.ready) && <Link href={startUrl} className={styles.start}>Quiz starten<AppIcon name="arrow-right" size={20} /></Link>}
        </section>
      </div>
    </main>
  );
}
