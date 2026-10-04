import Link from "next/link";
import AppIcon from "./AppIcon";
import { NewsCard, NewsRefreshStatus, useJagdNews } from "./JagdNews";
import styles from "../styles/JagdNews.module.css";

export default function HomeNews({ initialNews }) {
  const { news, refresh, refreshing, refreshError, refreshed } = useJagdNews(initialNews);
  return <section className={styles.homeSection} aria-labelledby="home-news-title">
    <header className={styles.homeHeader}><span className={styles.homeIcon}><AppIcon name="book" size={30} /></span><div><p className={styles.eyebrow}>Deutschland · Österreich · Schweiz</p><h2 id="home-news-title">Jagdlatein – Wissen im Blick</h2><p><strong>Wissenschaft · Jagd · Natur</strong><br />Neue Forschung und Fachwissen – direkt von den Quellen.</p></div></header>
    <NewsRefreshStatus news={news} refreshing={refreshing} refreshError={refreshError} refreshed={refreshed} />
    <div className={styles.homeGrid}>{news.items.slice(0, 3).map(item => <NewsCard key={item.id} item={item} compact sourceSnapshot={news.sources.find(value => value.id === item.sourceId)} />)}</div>
    <div className={styles.homeActions}><Link href="/news" className={styles.primaryLink}>Alle News entdecken<AppIcon name="arrow-right" size={19} /></Link><button type="button" className={styles.refreshButton} onClick={refresh} disabled={refreshing}><AppIcon name="calendar" size={18} />{refreshing ? "Wird geladen …" : "Aktualisieren"}</button></div>
  </section>;
}
