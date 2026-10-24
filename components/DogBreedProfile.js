import Image from "next/image";
import Link from "next/link";
import LearningToolLayout from "./LearningToolLayout";
import TopicSectionReader from "./TopicSectionReader";
import styles from "../styles/DogBreedProfile.module.css";

function BreedSources({ profile, contextSources, includePhoto = false }) {
  return <details className={styles.sources}>
    <summary>Quellen und vorhandener Dokumentationsstand</summary>
    <p>Stand des vorhandenen Rassenprofils: {profile.reviewedOn}. Die neue Gliederung ist keine neue vollständige fachliche Prüfung.</p>
    <p>Der FCI-Standard ist die Originalgrundlage zur Rasse. Die weiteren Quellen ordnen Arbeitsgebiete und Hundebedürfnisse allgemein ein; sie bestätigen nicht automatisch jede Einzelangabe zu dieser Rasse.</p>
    <ul><li><a href={profile.source.url} target="_blank" rel="noopener noreferrer">{profile.source.title}</a></li>
      {contextSources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}
    </ul>
    {includePhoto && profile.photo && <p>Foto: {profile.photo.author} · {profile.photo.license}. <a href={profile.photo.url} target="_blank" rel="noopener noreferrer">Originalaufnahme</a>{profile.photo.licenseUrl && <> · <a href={profile.photo.licenseUrl} target="_blank" rel="noopener noreferrer">Lizenz</a></>}{profile.photo.modifications && <> {profile.photo.modifications}</>}</p>}
  </details>;
}

function HealthSources({ knowledge, lesson }) {
  return <details className={styles.sources}>
    <summary>Quellen und Prüfung dieser Genetik-Lektion</summary>
    <p>Prüfstand dieser Erweiterung: {knowledge.reviewedOn}. Das übrige Rassenprofil behält seinen bisherigen Dokumentationsstand.</p>
    <ul>{knowledge.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a><br />{source.organization}</li>)}</ul>
    <h3>Zuordnung der belegten Aussagen</h3>
    <ul>{lesson.evidence.map(item => <li key={item.claim}>
      <p>{item.claim}</p>
      <ul>{item.sourceUrls.map(url => {
        const source = knowledge.sources.find(source => source.url === url);
        return source ? <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{source.label}</a></li> : null;
      })}</ul>
    </li>)}</ul>
    <h3>Grenzen dieser Prüfung</h3>
    <ul>{knowledge.limitations.map(limit => <li key={limit}>{limit}</li>)}</ul>
  </details>;
}

export function createDogBreedTopics(profile, tasks = [], contextSources = [], healthKnowledge = null) {
  const sources = options => <BreedSources profile={profile} contextSources={contextSources} {...options} />;
  const groups = [{ id: "rassenprofil", title: profile.name, topics: [
    { id: "rasse-erkennen", aliases: [`dog-${profile.id}`], title: "Rasse erkennen", render: () => <section className={styles.knowledge}>
      <h2>{profile.name}: Rasse erkennen</h2><p className={styles.lead}>{profile.summary}</p>
      <p><strong>Rassegruppe:</strong> {profile.group}</p>
      {profile.aliases?.length > 0 && <p><strong>Weitere Bezeichnungen:</strong> {profile.aliases.join(", ")}</p>}
      {profile.photo && <figure className={styles.photo}><Image src={profile.photo.src} alt={profile.photo.alt} width={profile.photo.width} height={profile.photo.height} sizes="(max-width: 760px) 92vw, 760px" /></figure>}
      {sources({ includePhoto: true })}
    </section> },
    { id: "arbeitsprofil", title: "Arbeitsprofil", render: () => <section className={styles.knowledge}>
      <h2>{profile.name}: Arbeitsprofil</h2><p>{profile.work}</p>
      <h3>Jagdliche Schwerpunkte</h3><dl>{tasks.map(task => <div key={task.id}><dt>{task.title}</dt><dd>{task.text}</dd></div>)}</dl>
      <p className={styles.boundary}>Rassenschwerpunkte sind keine Leistungszusage. Die tatsächliche Eignung hängt von Anlagen, Gesundheit, Ausbildung und Erfahrung des Teams ab. Arbeitsweisen und örtliche Anerkennung werden gesondert geprüft.</p>
      {sources()}
    </section> },
    { id: "ausbildung", title: "Ausbildung und Zusammenarbeit", render: () => <section className={styles.knowledge}>
      <h2>{profile.name}: Ausbildung und Zusammenarbeit</h2><p>{profile.training}</p>{sources()}
    </section> },
    { id: "alltag-pflege", title: "Alltag und Pflege", render: () => <section className={styles.knowledge}>
      <h2>{profile.name}: Alltag und Pflege</h2><h3>Alltag und Betreuung</h3><p>{profile.everyday}</p><h3>Pflege und Belastung</h3><p>{profile.care}</p>{sources()}
    </section> },
    { id: "grenzen", title: "Grenzen und wichtige Unterschiede", render: () => <section className={styles.knowledge}>
      <h2>{profile.name}: Grenzen und wichtige Unterschiede</h2><p>{profile.boundary}</p>
      <p>Der einzelne Hund, seine Ausbildung und die örtlichen Voraussetzungen entscheiden über die praktische Eignung.</p>{sources()}
    </section> },
  ] }];
  if (healthKnowledge?.breedId === profile.id) groups.push({ id: "gesundheit-genetik", title: "Gesundheit & Genetik", topics:
    healthKnowledge.lessons.map(lesson => ({ id: `gesundheit-${lesson.id}`, title: lesson.title, render: () => <section className={styles.knowledge}>
      <h2>{lesson.title}</h2>
      {lesson.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <p><strong>Merke:</strong> {lesson.takeaway}</p>
      <p className={styles.boundary}>{healthKnowledge.scope}</p>
      <HealthSources knowledge={healthKnowledge} lesson={lesson} />
    </section> })) });
  return groups;
}

export default function DogBreedProfile({ profile, tasks = [], contextSources = [], healthKnowledge = null }) {
  const matchingKnowledge = healthKnowledge?.breedId === profile.id ? healthKnowledge : null;
  return <LearningToolLayout title={profile.name} description={profile.summary} icon="paw" category="hundewesen" headingOnly hideCommunity className={styles.page}>
    <TopicSectionReader key={profile.id} id="jagdhund-themen" title={`${profile.name} – Themen`} groups={createDogBreedTopics(profile, tasks, contextSources, matchingKnowledge)}
      menuFooter={matchingKnowledge ? <>
        <p><Link href={`/kurse/${matchingKnowledge.courseId}#wissenscheck`} prefetch={false}>Diese Genetik-Lektion üben</Link></p>
        <p><Link href="/lernen/jagdhunde" prefetch={false}>Alle Jagdhunderassen</Link></p>
      </> : <Link href="/lernen/jagdhunde" prefetch={false}>Alle Jagdhunderassen</Link>} />
  </LearningToolLayout>;
}
