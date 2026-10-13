import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { communityWeeklyCases, getCommunityWeeklyCase } from '../lib/community-weekly-case';
import learning from '../styles/LearningExperience.module.css';
import styles from '../styles/CommunityWeeklyCase.module.css';

export default function CommunityWeeklyCase({ onDiscuss, canDiscuss }) {
  const router = useRouter();
  const [selected, setSelected] = useState(communityWeeklyCases[0].id);
  const [answer, setAnswer] = useState(null);
  const [automatic, setAutomatic] = useState(true);
  useEffect(() => {
    const requested = router.query.fall;
    const next = communityWeeklyCases.find(item => item.id === requested) || getCommunityWeeklyCase(new Date());
    setSelected(next.id); setAnswer(null); setAutomatic(!communityWeeklyCases.some(item => item.id === requested));
  }, [router.query.fall]);
  useEffect(() => {
    if (!automatic) return undefined;
    const timer = setInterval(() => {
      const next = getCommunityWeeklyCase(new Date());
      if (next.id !== selected) { setSelected(next.id); setAnswer(null); }
    }, 60000);
    return () => clearInterval(timer);
  }, [automatic, selected]);
  const item = communityWeeklyCases.find(entry => entry.id === selected) || communityWeeklyCases[0];
  return <section id="community-wochenfall" className={`${learning.panel} ${styles.case}`} aria-labelledby="community-wochenfall-title">
    <p className={learning.eyebrow}>Gemeinsam hinschauen · Lernfall der Woche</p>
    <label className={learning.field}>Lernfall<select value={item.id} onChange={event => { if (communityWeeklyCases.some(entry => entry.id === event.target.value)) { setSelected(event.target.value); setAnswer(null); setAutomatic(false); } }}>{communityWeeklyCases.map(entry => <option value={entry.id} key={entry.id}>{entry.title}</option>)}</select></label>
    <div className={styles.grid}><figure><img src={item.photo.src} alt={item.photo.alt || item.photo.title || item.title} width={item.photo.width} height={item.photo.height} loading="lazy" /><figcaption>{item.photoContext}<br />{item.photo.author} · <a href={item.photo.licenseUrl} target="_blank" rel="noreferrer">{item.photo.license}</a> · <a href={item.photo.sourceUrl} target="_blank" rel="noreferrer">Bildnachweis</a></figcaption></figure>
      <div><h2 id="community-wochenfall-title">{item.question}</h2><fieldset className={styles.question}><legend>Was passt zu den belegten Zusammenhängen?</legend>{item.choices.map((choice, index) => <label key={choice}><input type="radio" name={`weekly-${item.id}`} checked={answer === index} onChange={() => setAnswer(index)} />{choice}</label>)}</fieldset>
        {answer !== null && <div className={learning.feedback} role="status"><strong>{answer === item.answer ? 'Richtig eingeordnet.' : `Passend ist: ${item.choices[item.answer]}`}</strong><p>{item.explanation}</p></div>}
        <p>{item.limit}</p>{canDiscuss && <button type="button" className={learning.secondary} onClick={() => onDiscuss(item)}>Deine Überlegung teilen</button>}
      </div></div>
    <details className={learning.sources}><summary>Begründung und Fachquellen</summary>{item.facts.map(fact => <p key={fact.id}><strong>{fact.title}:</strong> {fact.text}</p>)}<ul>{item.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p>Diese Erklärung wurde inhaltlich am {new Intl.DateTimeFormat('de-CH', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${item.reviewedOn}T00:00:00Z`))} geprüft. <Link href={item.href}>Lerneinheit mit Bildnachweis</Link></p></details>
    <p className={styles.hint}>Jeden Montag wechselt der Einstieg. Alle Lernfälle findest du direkt in der Auswahl. Eure Beiträge werden vor Veröffentlichung moderiert; persönliche Antworten sind kein fachliches Prüfsiegel.</p>
  </section>;
}
