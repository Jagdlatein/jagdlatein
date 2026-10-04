import { useState } from "react";
import Link from "next/link";
import LearningToolLayout from "../../components/LearningToolLayout";
import AppIcon from "../../components/AppIcon";
import { courses as courseCatalog, miniCourses } from "../../lib/course-catalog";
import { learningModules } from "../../lib/learning-curriculum";
import { learningCategoryDetails, getLearningCategoryByTitle } from "../../lib/learning-categories";
import { miniCourseDetails } from "../../lib/mini-course-details";
import styles from "../../styles/LearningExperience.module.css";

export function getStaticProps() {
  const moduleCategories = new Map(learningModules.map(module => [module.id, getLearningCategoryByTitle(module.category)?.slug]));
  const courses = courseCatalog.map(course => ({ ...course, title: miniCourseDetails[course.id]?.title || course.title.replace(/^[^\p{L}\p{N}]+/u, ""), category: miniCourseDetails[course.id]?.category || moduleCategories.get(course.id), format: miniCourseDetails[course.id] ? "mini" : "detailed" }));
  return { props: { courses, miniCount: miniCourses.length, detailedCount: learningModules.length } };
}
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");

export default function KurseOverview({ courses, miniCount, detailedCount }) {
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("all"); const [format, setFormat] = useState("all");
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const visible = courses.filter(course => (category === "all" || course.category === category) && (format === "all" || course.format === format) && terms.every(term => normalize(`${course.title} ${course.description}`).includes(term)));
  return <LearningToolLayout title="Alle Kurse" description="Finde die passende Lerneinheit: kurze Wissenschecks oder ausführliche Lektionen mit Hintergründen, Quellen und erklärten Übungsfragen." stats={[{ value: miniCount, label: "Minikurse" }, { value: detailedCount, label: "Ausführliche Lerneinheiten" }]}>
    <div className={styles.actions}><Link href="/lernen" className={styles.secondary}>Kategorien und Lernpfade</Link><Link href="/meine-kurse" className={styles.secondary}>Meine Kurse und Abschlüsse</Link></div>
    <section className={styles.panel} aria-labelledby="course-filter-title"><h2 id="course-filter-title">Deinen Kurs finden</h2><label className={styles.field}>Kurse durchsuchen<input type="search" maxLength={160} value={query} onChange={event => setQuery(event.target.value)} placeholder="Zum Beispiel Jagdhunde, Wildkunde oder Nachsuche" /></label><div className={styles.grid}><label className={styles.field}>Kategorie<select value={category} onChange={event => setCategory(event.target.value)}><option value="all">Alle Kategorien</option>{learningCategoryDetails.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}</select></label><label className={styles.field}>Lernformat<select value={format} onChange={event => setFormat(event.target.value)}><option value="all">Alle Formate</option><option value="mini">Minikurse</option><option value="detailed">Ausführliche Lerneinheiten</option></select></label></div><p role="status">{visible.length} von {courses.length} Kursen passen zu deiner Auswahl.</p>{(query || category !== "all" || format !== "all") && <button className={styles.secondary} onClick={() => { setQuery(""); setCategory("all"); setFormat("all"); }}>Auswahl zurücksetzen</button>}</section>
    <div className={styles.grid}>{visible.map(course => <article className={styles.card} key={course.id}><p className={styles.muted}>{learningCategoryDetails.find(item => item.slug === course.category)?.title} · {course.format === "mini" ? "Minikurs" : "Ausführliche Lerneinheit"}</p><h2>{course.title}</h2><p>{course.description}</p><p>{course.totalQuestions} Übungsfragen</p><Link href={course.href} className={styles.primary}>Kurs öffnen<AppIcon name="arrow-right" size={18} /></Link></article>)}</div>{visible.length === 0 && <p className={styles.empty}>Keine passenden Kurse gefunden. Wähle eine andere Kategorie oder einen kürzeren Suchbegriff.</p>}
  </LearningToolLayout>;
}
