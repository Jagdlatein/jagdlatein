import Link from "next/link";
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
  return <section id="learning-modules" className={styles.section} aria-labelledby="learning-modules-heading">
    <KnowledgeBreadcrumb items={[{ href: "/lernen", title: "Kategorien" }, ...(requested ? [{ href: base, title: category.title }] : [])]} current={group?.title || category.title} />
    <h2 id="learning-modules-heading">{group?.title || "Unterkategorien"}</h2>
    {requested && !group && <p role="status">Diese Unterkategorie ist nicht verfügbar. Wähle einen Bereich aus.</p>}
    {group ? <>
      <p className={styles.hint}>Wähle das Thema, dessen Wissenstext du lesen möchtest.</p>
      <ul className={styles.topics}>{selected.map(module => <li key={module.id}>
        <h3>{module.title}</h3>
        <ul>{module.topics.map(topic => <li key={topic.href}><Link href={topic.href} prefetch={false}>{topic.title}<AppIcon name="arrow-right" size={17} /></Link></li>)}</ul>
      </li>)}</ul>
    </> : <ul className={styles.branches}>{groups.map(item => {
      const courses = item.moduleIds.map(id => catalog.get(id)).filter(Boolean);
      const lessons = courses.reduce((sum, course) => sum + course.lessonCount, 0);
      return <li key={item.id}><Link href={`${base}?bereich=${encodeURIComponent(item.id)}#learning-modules`} prefetch={false}>
        <span><strong>{item.title}</strong><span>{courses.length} Themenbereiche · {lessons} Wissenstexte</span></span><AppIcon name="arrow-right" size={20} />
      </Link></li>;
    })}</ul>}
  </section>;
}
