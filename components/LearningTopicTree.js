import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import AppIcon from "./AppIcon";
import KnowledgeBreadcrumb from "./KnowledgeBreadcrumb";
import styles from "../styles/KnowledgeTree.module.css";

export default function LearningTopicTree({ category, groups = [], modules = [] }) {
  const router = useRouter();
  const requested = typeof router.query?.bereich === "string" ? router.query.bereich : "";
  const group = groups.find(item => item.id === requested);
  const base = `/lernen/${category.slug}`;
  const catalog = new Map(modules.map(module => [module.id, module]));
  const selected = group ? group.moduleIds.map(id => catalog.get(id)).filter(Boolean) : [];
  const requestedCourse = typeof router.query?.kurs === "string" ? router.query.kurs : "";
  const course = selected.find(item => item.id === requestedCourse);
  const groupHref = group ? `${base}?bereich=${encodeURIComponent(group.id)}` : base;
  const heading = useRef(null);
  const section = useRef(null);
  useEffect(() => {
    if (!router.isReady || window.location.hash !== "#learning-modules") return;
    heading.current?.focus({ preventScroll: true });
    section.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [router.isReady, category.slug, requested, requestedCourse]);
  return <section id="learning-modules" ref={section} className={styles.section} aria-labelledby="learning-modules-heading">
    <KnowledgeBreadcrumb items={[{ href: "/lernen", title: "Kategorien" }, ...(requested ? [{ href: base, title: category.title }] : []), ...(course ? [{ href: `${groupHref}#learning-modules`, title: group.title }] : [])]} current={course ? "Wissenstexte" : group?.title || category.title} />
    <h2 id="learning-modules-heading" ref={heading} tabIndex={-1}>{course?.title || group?.title || "Unterkategorien"}</h2>
    {requested && !group && <p role="status">Diese Unterkategorie ist nicht verfügbar. Wähle einen Bereich aus.</p>}
    {router.query?.kurs !== undefined && !course && <p role="status">Dieser Themenbereich gehört nicht zum gewählten Pfad. Wähle einen verfügbaren Themenbereich.</p>}
    {course ? <>
      <p className={styles.hint}>Wähle den Wissenstext, den du genauer lesen möchtest.</p>
      <ul className={styles.topics} aria-label={`Wissenstexte: ${course.title}`}><li>
        <ul>{course.topics.map(topic => <li key={topic.href}><Link href={topic.href} prefetch={false}>{topic.title}<AppIcon name="arrow-right" size={17} /></Link></li>)}</ul>
      </li></ul>
    </> : group ? <>
      <p className={styles.hint}>Wähle einen Themenbereich und danach den passenden Wissenstext.</p>
      <ul className={styles.branches}>{selected.map(module => <li key={module.id}>
        <Link href={`${groupHref}&kurs=${encodeURIComponent(module.id)}#learning-modules`} prefetch={false}>
          <span><strong>{module.title}</strong><span>{module.lessonCount} {module.lessonCount === 1 ? "Wissenstext" : "Wissenstexte"} · {module.level}</span></span><AppIcon name="arrow-right" size={20} />
        </Link>
      </li>)}</ul>
    </> : <ul className={styles.branches}>{groups.map(item => {
      const courses = item.moduleIds.map(id => catalog.get(id)).filter(Boolean);
      const lessons = courses.reduce((sum, course) => sum + course.lessonCount, 0);
      return <li key={item.id}><Link href={`${base}?bereich=${encodeURIComponent(item.id)}#learning-modules`} prefetch={false}>
        <span><strong>{item.title}</strong><span>{courses.length} {courses.length === 1 ? "Themenbereich" : "Themenbereiche"} · {lessons} {lessons === 1 ? "Wissenstext" : "Wissenstexte"}</span></span><AppIcon name="arrow-right" size={20} />
      </Link></li>;
    })}</ul>}
  </section>;
}
