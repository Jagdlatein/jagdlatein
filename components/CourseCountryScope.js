import { useEffect, useRef } from "react";
import useExamProfile from "../lib/use-exam-profile";
import { normalizeExamProfile } from "../lib/exam-profile";
import styles from "../styles/Learning.module.css";

const countryNames = { DE: "Deutschland", AT: "Österreich", CH: "Schweiz" };
const countriesFor = module => Array.isArray(module?.countries)
  ? [...new Set(module.countries.filter(country => Object.hasOwn(countryNames, country)))] : [];

// This chooses only the existing course note. It never filters course questions
// or changes the separately and explicitly saved examination profile.
export function getCourseExamCountry(module, examSnapshot, country) {
  const countries = countriesFor(module);
  if (typeof country === "string" && countries.includes(country)) return country;
  if (countries.length < 2) return countries[0] || null;
  if (examSnapshot?.ready !== true) return null;
  const profile = normalizeExamProfile(examSnapshot.profile);
  return profile && countries.includes(profile.country) ? profile.country : countries[0];
}

export function CourseCountryNote({ module, country = null }) {
  const snapshot = useExamProfile();
  const selected = getCourseExamCountry(module, snapshot, country);
  if (!selected && countriesFor(module).length > 1 && snapshot.ready !== true) {
    return <p className={styles.muted} role="status">Der Länderhinweis wird geladen.</p>;
  }
  const note = selected && module?.countryNotes?.[selected];
  return typeof note === "string" && note.length > 0
    ? <p className={styles.countryNote}><strong>{countryNames[selected]}:</strong> {note}</p>
    : null;
}

export function CourseCountryMenu({ module, country = null, onChoose }) {
  const snapshot = useExamProfile();
  const countries = countriesFor(module);
  const selected = getCourseExamCountry(module, snapshot, country);
  const mounted = useRef(false);
  const profile = normalizeExamProfile(snapshot.profile);
  const key = JSON.stringify([countries, country, snapshot.ready, profile?.country, profile?.region]);
  const active = useRef({ module, key, onChoose });
  if (active.current.module !== module || active.current.key !== key || active.current.onChoose !== onChoose) active.current = { module, key, onChoose };
  const origin = active.current;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  if (countries.length < 2) return null;
  return <fieldset className={styles.countryChoice}>
    <legend>Länderschwerpunkt</legend>
    <div className={styles.countryButtons}>{countries.map(item => <button type="button" key={item} aria-pressed={selected === item} onClick={() => {
      if (!mounted.current || active.current !== origin || typeof onChoose !== "function") return;
      onChoose(item);
    }}>{countryNames[item]}</button>)}</div>
    <p className={styles.muted}>Der Schwerpunkt wählt den Länderhinweis. Die Fragen dieses Kurses bleiben gemischt; der Geltungsbereich steht bei jeder Frage. Dein gespeichertes Prüfungsziel wird dadurch nicht geändert.</p>
  </fieldset>;
}
