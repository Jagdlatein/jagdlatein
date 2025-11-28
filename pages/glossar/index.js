import { useState } from "react";
import Seo from "../../components/Seo";
import styles from "./glossar.module.css";

const TERMS = [
  // ... deine komplette Liste bleibt
];

function hasPaidAccessFromCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  const loggedIn = cookieHeader.includes("jl_session=1");
  const paid = cookieHeader.includes("jl_paid=1");
  return loggedIn && paid;
}

export async function getServerSideProps(ctx) {
  const { req } = ctx;

  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
}

export default function GlossarIndex() {
  const [query, setQuery] = useState("");

  const filtered = TERMS.filter((t) =>
    t.term.toLowerCase().includes(query.toLowerCase()) ||
    t.def.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <Seo
        title="Jagd-Glossar – Jagdlatein"
        description="Wichtige Begriffe aus der Jägersprache kurz und verständlich erklärt."
      />

      <main className={styles.wrapper}>
        <div className={styles.container}>

          <h1 className={styles.title}>Jagd-Glossar</h1>

          <p className={styles.subtitle}>
            Zentrale Begriffe aus der Jägersprache – kompakt & prüfungsrelevant erklärt.
          </p>

          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Begriff suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <ul className={styles.list}>
            {filtered.length === 0 && (
              <p className={styles.empty}>Keine passenden Begriffe gefunden.</p>
            )}

            {filtered.map((t) => (
              <li key={t.slug} className={styles.card}>
                <a href={`/glossar/${t.slug}`} className={styles.term}>
                  {t.term}
                </a>
                <p className={styles.def}>{t.def}</p>
              </li>
            ))}
          </ul>

          <div className={styles.footer}>
            <a href="/" className={styles.footerLink}>Startseite</a>
            <span>·</span>
            <a href="/quiz" className={styles.footerLink}>Zum Quiz</a>
          </div>

        </div>
      </main>
    </>
  );
}
