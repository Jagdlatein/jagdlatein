import Head from "next/head";
import Link from "next/link";
import AppIcon from "./AppIcon";
import { getLearningCategory } from "../lib/learning-categories";
import styles from "../styles/LearningExperience.module.css";

export default function LearningToolLayout({ title, description, icon = "book", category, stats = [], hideCommunity = false, compact = false, headingOnly = false, eyebrow = "Entdecken, üben und verstehen", robots, className = "", children }) {
  const info = typeof category === "string" ? getLearningCategory(category) : category;
  return <>
    <Head><title>{`${title} – Jagdlatein`}</title><meta name="description" content={description} />{robots && <meta name="robots" content={robots} />}</Head>
    <main className={`${styles.main}${className ? ` ${className}` : ""}`}>
      <header className={`${styles.header}${headingOnly ? ` ${styles.titleHeader}` : compact ? ` ${styles.compactHeader}` : ""}`}>
        {!headingOnly && <span className={styles.heroIcon}><AppIcon name={icon} size={38} /></span>}
        {!headingOnly && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 tabIndex={-1} data-learning-page-start>{title}</h1>
        {!headingOnly && <p>{description}</p>}
        {!headingOnly && stats.length > 0 && <dl className={styles.stats}>{stats.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>}
      </header>
      <div className={styles.content}>{children}</div>
      {!hideCommunity && !headingOnly && <footer className={styles.footer}><Link href={{ pathname: "/community", query: { ...(info?.slug ? { category: info.slug } : {}), thema: title.slice(0, 120) } }}><AppIcon name="community" size={20} />Dieses Thema in der Community besprechen</Link></footer>}
    </main>
  </>;
}
