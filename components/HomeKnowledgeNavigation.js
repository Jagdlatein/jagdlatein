import Link from "next/link";
import AppIcon from "./AppIcon";
import LearningCategoryMenu from "./LearningCategoryMenu";
import styles from "../styles/HomeKnowledgeNavigation.module.css";

export const homeKnowledgeGroups = [
  { title: "Für die Jagdprüfung", links: [
    { href: "/lernen", title: "Lernbereich", text: "Alle Kurse und Kategorien", icon: "book" },
    { href: "/lernen/lernkarten", title: "Lernkarten", text: "Wiederholen und ausdrucken", icon: "book" },
    { href: "/quiz-app", title: "Wissen testen", text: "Quiz und Rangliste", icon: "quiz" },
    { href: "/lernen/pruefungsgespraech", title: "Prüfungsgespräch", text: "In eigenen Worten erklären", icon: "community" },
  ] },
  { title: "Für dein Revier", links: [
    { href: "/wildkunde", title: "Wildarten", text: "Merkmale und Biologie", icon: "deer" },
    { href: "/lernen/tierstimmen", title: "Tierstimmen", text: "Echte Aufnahmen erkennen", icon: "sound" },
    { href: "/lernen/jagdhund-kompass", title: "Jagdhunde", text: "Rassen, Aufgaben und Lernen", icon: "paw" },
    { href: "/lernen/wissen-fuers-revier", title: "Wissen fürs Revier", text: "Forschung für die Praxis", icon: "tree" },
  ] },
  { title: "Austauschen und nachschlagen", links: [
    { href: "/community", title: "Community", text: "Fragen in allen Wissensbereichen", icon: "community" },
    { href: "/news", title: "Jagd-News", text: "Wissenschaft, Ausrüstung und Natur", icon: "calendar" },
    { href: "/lernen/videos", title: "Jagdvideos", text: "Originalaufnahmen mit Erklärungen", icon: "video" },
    { href: "/jagdpraxis", title: "Praxisübungen", text: "Fälle und Simulatoren", icon: "practice" },
    { href: "/glossar", title: "Jägersprache", text: "Fachbegriffe gezielt finden", icon: "glossary" },
  ] },
];
export default function HomeKnowledgeNavigation() {
  return <section className={styles.section} aria-labelledby="home-knowledge-heading">
    <h2 id="home-knowledge-heading">Was möchtest du wissen?</h2>
    <form action="/lernen#lernen-suche" className={styles.search} role="search" aria-label="Jagdwissen durchsuchen"><label className={styles.searchField}><AppIcon name="search" size={22} /><span className={styles.srOnly}>Jagdwissen suchen</span><input type="search" name="q" maxLength={160} placeholder="Zum Beispiel Gams, Zahnformel oder Weimaraner" enterKeyHint="search" /></label><button type="submit">Suchen</button></form>
    <LearningCategoryMenu />
    <details className={styles.categories}><summary>Üben, nachschlagen und austauschen</summary>
      <nav className={styles.groups} aria-label="Wichtige Lernangebote">{homeKnowledgeGroups.map(group => <section key={group.title}><h3>{group.title}</h3><ul>{group.links.map(item => <li key={item.href}><Link href={item.href} prefetch={false}><AppIcon name={item.icon} size={25} /><span><strong>{item.title}</strong><span>{item.text}</span></span><AppIcon name="arrow-right" size={17} /></Link></li>)}</ul></section>)}</nav>
    </details>
  </section>;
}
