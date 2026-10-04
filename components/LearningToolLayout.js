import Head from "next/head";
import Link from "next/link";
import AppIcon from "./AppIcon";
import { getLearningCategory } from "../lib/learning-categories";
import styles from "../styles/LearningExperience.module.css";

export default function LearningToolLayout({ title, description, icon = "book", category, stats = [], hideCommunity = false, children }) {
  const info = typeof category === "string" ? getLearningCategory(category) : category;
  const categoryHref = info?.href || (info?.slug ? `/lernen/${info.slug}` : null);
  return <>
    <Head><title>{`${title} – Jagdlatein`}</title><meta name="description" content={description} /></Head>
    <main className={styles.main}>
      <nav className={styles.nav} aria-label="Lernmenü">
        <Link href="/lernen"><AppIcon name="arrow-left" size={18} />Lernbereich</Link>
        {categoryHref && <Link href={categoryHref}><AppIcon name={info.slug || "book"} size={18} />{info.title}</Link>}
        <Link href="/lernen#lernen-suche"><AppIcon name="search" size={18} />Alle Angebote suchen</Link>
      </nav>
      <header className={styles.header}>
        <span className={styles.heroIcon}><AppIcon name={icon} size={38} /></span>
        <p className={styles.eyebrow}>Entdecken, üben und verstehen</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {stats.length > 0 && <dl className={styles.stats}>{stats.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>}
      </header>
      <div className={styles.content}>{children}</div>
      <footer className={styles.footer}><Link href={categoryHref || "/lernen"}><AppIcon name="book" size={20} />Weitere Themen entdecken<AppIcon name="arrow-right" size={18} /></Link><Link href="/lernen#lernen-suche"><AppIcon name="search" size={20} />Zur gemeinsamen Suche</Link>{!hideCommunity && <Link href={{ pathname: "/community", query: { ...(info?.slug ? { category: info.slug } : {}), thema: title.slice(0, 120) } }}><AppIcon name="community" size={20} />In der Community besprechen</Link>}</footer>
    </main>
  </>;
}
