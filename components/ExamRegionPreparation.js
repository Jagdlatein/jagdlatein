import Link from "next/link";
import styles from "../styles/ExamStudyPlan.module.css";

const internalHref = value => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !/[\\\s\u0000-\u001f\u007f]/.test(value);

function learningStarts(region, learningCatalog) {
  const ids = [...(region.focus || []).flatMap(item => item.moduleIds || []), ...(region.moduleIds || [])];
  return [...new Set(ids)].flatMap(id => {
    const item = learningCatalog instanceof Map ? learningCatalog.get(id) : Object.hasOwn(learningCatalog || {}, id) ? learningCatalog[id] : null;
    return item && item.id === id && item.title && item.categorySlug !== "jagdrecht" && internalHref(item.href) ? [item] : [];
  });
}

export default function ExamRegionPreparation({ region, learningCatalog }) {
  if (!region || !region.country || !region.region) return null;
  const confirmed = region.status === "confirmed";
  const special = region.status === "special";
  const formats = confirmed ? region.formats || [] : [];
  const focus = region.focus || [];
  const starts = learningStarts(region, learningCatalog);

  return <section className={styles.section} aria-labelledby="exam-plan-regional-exam">
    <h2 id="exam-plan-regional-exam">Deine Prüfung</h2>
    {!confirmed && <p className={styles.note}><strong>{special ? "Besonderer Prüfungsrahmen" : "Prüfungsrahmen noch im Abgleich"}</strong></p>}
    {region.summary && <p>{region.summary}</p>}
    {formats.length > 0 && <ul className={styles.regionFormats}>{formats.map(format => <li key={format.label}>{format.label}</li>)}</ul>}
    {region.limits?.length > 0 && <div className={styles.regionLimits}>
      <h3>Umfang und Grenzen</h3>
      <ul>{region.limits.map(limit => <li key={limit}>{limit}</li>)}</ul>
    </div>}

    {(focus.length > 0 || starts.length > 0) && <div className={styles.regionPreparation}>
      <h3>Eigene Vorbereitung</h3>
      <p>Die Lernaufträge sind eigene Übungsbeispiele. Verbinde die genannten Fachbezüge mit deinen Erklärungen und den vorhandenen Kursen.</p>
      {focus.length > 0 && <ul className={styles.regionFocus}>{focus.map((item, index) => <li key={`${item.label}:${index}`}>
        <h4>{item.label}</h4>
        {item.detail && <p>{item.detail}</p>}
      </li>)}</ul>}
      {starts.length > 0 && <>
        <h3>Passende Lernstarts</h3>
        <ul className={styles.regionStarts}>{starts.map(item => <li key={item.id}>
          {item.categoryTitle && <p className={styles.regionCategory}>{item.categoryTitle}</p>}
          <h4>{item.title}</h4>
          <div className={styles.links}>
            <Link href={item.href} prefetch={false} aria-label={`${item.title}: Lernen`}>Lernen</Link>
            {internalHref(item.quizHref) && <Link href={item.quizHref} prefetch={false} aria-label={`${item.title}: Wissenscheck`}>Wissenscheck</Link>}
            {internalHref(item.oralHref) && <Link href={item.oralHref} prefetch={false} aria-label={`${item.title}: Erklären`}>Erklären</Link>}
            {internalHref(item.reviewHref) && <Link href={item.reviewHref} prefetch={false} aria-label={`${item.title}: Wiederholen`}>Wiederholen</Link>}
          </div>
        </li>)}</ul>
      </>}
    </div>}
  </section>;
}
