import Link from "next/link";
import styles from "../styles/KnowledgeTree.module.css";

export default function KnowledgeBreadcrumb({ items, current }) {
  return <nav aria-label="Wissenspfad" className={styles.breadcrumb}><ol>
    {items.map(item => <li key={item.href}><Link href={item.href} prefetch={false}>{item.title}</Link></li>)}
    {current && <li aria-current="page">{current}</li>}
  </ol></nav>;
}
