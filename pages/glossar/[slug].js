import { TERMS } from "../../data/glossary-terms";
import { getPaidPageProps } from "../../lib/account-access";
import { getGlossaryCourseLinks } from "../../lib/glossary-course-links-server";
import Link from "next/link";
import Seo from "../../components/Seo";
import PageMenu from "../../components/PageMenu";
import styles from "./glossar.module.css";



export async function getServerSideProps(context) {
  const access = await getPaidPageProps(context);
  if (!access.props) return access;
  const slug = context.params.slug === ".windkante" ? "windkante" : context.params.slug;
  if (!TERMS.some(entry => entry.slug === slug)) return { notFound: true };
  const studyLinks = getGlossaryCourseLinks(slug);
  return { props: { slug, ...(studyLinks.length ? { studyLinks } : {}) } };
}

export default function GlossarSlugPage({ slug, studyLinks = [] }) {
  const entryIndex = TERMS.findIndex((t) => t.slug === slug);
  const entry = TERMS[entryIndex];

  // Fallback – Begriff existiert nicht
  if (!entry) {
    return (
      <main className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.title}>Begriff nicht gefunden</h1>

            <p className={styles.subtitle}>
              Dieser Glossarbegriff existiert nicht.
            </p>

            <a href="/glossar" className={styles.linkBack}>
              ← Zurück zum Glossar
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Vorheriger / Nächster Begriff
  const prev = TERMS[entryIndex - 1] || null;
  const next = TERMS[entryIndex + 1] || null;

  // Alphabetical neighbors are not automatically related subject matter.
  const related = TERMS.filter(
    (t) => t.term[0].toLowerCase() === entry.term[0].toLowerCase() && t.slug !== entry.slug
  ).slice(0, 6);

  // Alphabet-Leiste
  const letters = [...new Set(TERMS.map((t) => t.term[0].toUpperCase()))].sort();

  return (
    <>
      <Seo
        title={`${entry.term} – Jagd-Glossar Definition`}
        description={`Definition von "${entry.term}" aus der Jägersprache: ${entry.def}`}
        keywords={`Jagd Glossar ${entry.term}, Jägersprache Begriff ${entry.term}, Jagdlatein`}
      />

      <main className={styles.wrapper}>
        <div className={styles.container}>

          {/* Begriff-Karte */}
          <div className={styles.card}>

            <div className={styles.slugHeader}>
              <h1 className={styles.slugTitle}>{entry.term}</h1>
              <span className={styles.slugLetter}>{entry.term[0].toUpperCase()}</span>
            </div>

            <p className={styles.defBig}>{entry.def}</p>

            <PageMenu title="Glossarbegriffe">
            {studyLinks.length > 0 && <nav aria-labelledby="glossary-course-links-title" data-glossary-course-links>
              <h3 id="glossary-course-links-title" className={styles.relatedTitle}>Weiterlernen</h3>
              <ul className={styles.relatedList}>{studyLinks.map(link => <li key={link.href}>
                <Link href={link.href} prefetch={false} className={styles.relatedLink}>{link.title}</Link>
              </li>)}</ul>
            </nav>}
            <div className={styles.navRow}>
              {prev && (
                <a href={`/glossar/${prev.slug}`} className={styles.navLink}>
                  ← {prev.term}
                </a>
              )}
              {next && (
                <a href={`/glossar/${next.slug}`} className={styles.navLink}>
                  {next.term} →
                </a>
              )}
            </div>

              <nav className={styles.breadcrumb} aria-label="Glossarpfad">
                <a href="/glossar">Glossar A–Z</a><span aria-hidden="true">›</span>
                <a href={`/glossar?letter=${encodeURIComponent(entry.term[0].toUpperCase())}`}>Begriffe mit {entry.term[0].toUpperCase()}</a>
              </nav>
            {/* Verwandte Begriffe */}
            {related.length > 0 && (
              <div className={styles.relatedBox}>
                <h3 className={styles.relatedTitle}>Weitere Begriffe mit {entry.term[0].toUpperCase()}</h3>
                <ul className={styles.relatedList}>
                  {related.map((r) => (
                    <li key={r.slug}>
                      <a href={`/glossar/${r.slug}`} className={styles.relatedLink}>
                        {r.term}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

              <nav className={styles.azBar} aria-label="Andere Glossargruppen">
                {letters.map((l) => (
                  <a key={l} href={`/glossar?letter=${encodeURIComponent(l)}`} className={styles.azItem}>
                    {l}
                  </a>
                ))}
              </nav>
            </PageMenu>
          </div>
        </div>
      </main>
    </>
  );
}
