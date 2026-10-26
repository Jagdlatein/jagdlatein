import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import AppIcon from "./AppIcon";
import { getLearningNavigationLabel } from "../lib/learning-navigation-labels";
import { legalCountries } from "../lib/regional-law-core";
import styles from "../styles/KnowledgeTree.module.css";

export default function LearningTopicTree({ category, groups = [], modules = [], entries = [] }) {
  const router = useRouter();
  const requested = typeof router.query?.bereich === "string" ? router.query.bereich : "";
  const group = groups.find(item => item.id === requested);
  const base = `/lernen/${category.slug}`;
  const catalog = new Map(modules.map(module => [module.id, module]));
  const selected = group ? group.moduleIds.map(id => catalog.get(id)).filter(Boolean) : [];
  const requestedCourse = typeof router.query?.kurs === "string" ? router.query.kurs : "";
  const course = selected.find(item => item.id === requestedCourse);
  const heading = useRef(null);
  const courseHeading = useRef(null);
  const section = useRef(null);
  useEffect(() => {
    if (!router.isReady || window.location.hash !== "#learning-modules") return;
    const target = course ? courseHeading.current : heading.current;
    target?.focus({ preventScroll: true });
    // The shared shell resets newly selected categories to the page top.
    // Keep focus meaningful without restoring a lower scroll position here.
  }, [router.isReady, category.slug, requested, requestedCourse]);
  return <section id="learning-modules" ref={section} className={styles.section} aria-labelledby="learning-modules-heading">
    <h2 id="learning-modules-heading" ref={heading} tabIndex={-1}>{group?.title || "Unterkategorien"}</h2>
    {requested && !group && <p role="status">Diese Unterkategorie ist nicht verfügbar. Wähle einen Bereich aus.</p>}
    {router.query?.kurs !== undefined && !course && <p role="status">Dieser Themenbereich gehört nicht zum gewählten Pfad. Wähle einen verfügbaren Themenbereich.</p>}
    {group ? <ul className={styles.courseList}>{selected.map(module => <li key={module.id}>
      <details className={styles.course} name="learning-topic-course" open={course?.id === module.id || undefined}>
        <summary ref={course?.id === module.id ? courseHeading : undefined}>{getLearningNavigationLabel(module)}</summary>
        <ul className={styles.lessonLinks}>{module.topics.map(topic => <li key={topic.href}><Link href={topic.href} prefetch={false}>{topic.title}<AppIcon name="arrow-right" size={17} /></Link></li>)}</ul>
      </details>
    </li>)}</ul> : <>
      {category.slug === "jagdrecht" && <>
        <h3 className={styles.subheading}><Link href="/jagdrecht" prefetch={false} scroll={false}>Land &amp; Region</Link></h3>
        <ul className={styles.branches} aria-label="Jagdrecht nach Land und Region">{legalCountries.map(country => <li key={country.code}>
          <Link href={`/jagdrecht/${country.slug}`} prefetch={false} scroll={false} aria-label={`Jagdrecht ${country.name}`}>
            <span><strong>{country.name}</strong></span><AppIcon name="arrow-right" size={20} />
          </Link>
        </li>)}</ul>
        <h3 className={styles.subheading}>Grundlagen</h3>
      </>}
      <ul className={styles.branches}>{entries.map(item => <li key={item.href}><Link href={item.href} prefetch={false} scroll>
        <span><strong>{item.title}</strong></span><AppIcon name="arrow-right" size={20} />
      </Link></li>)}{groups.map(item => {
      return <li key={item.id}><Link href={`${base}?bereich=${encodeURIComponent(item.id)}#learning-modules`} prefetch={false} scroll={false}>
        <span><strong>{item.title}</strong></span><AppIcon name="arrow-right" size={20} />
      </Link></li>;
    })}</ul></>}
  </section>;
}
