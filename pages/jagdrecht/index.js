import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import AppIcon from "../../components/AppIcon";
import LearningDiscovery from "../../components/LearningDiscovery";
import RegionalLawResume from "../../components/RegionalLawResume";
import ExamProfileSummary from "../../components/ExamProfileSummary";
import PageMenu from "../../components/PageMenu";
import { learningModules } from "../../lib/learning-curriculum";
import useExamProfile from "../../lib/use-exam-profile";
import { examProfileLawHref, getExamProfileDetails } from "../../lib/exam-profile";
import styles from "../../styles/SectionMenu.module.css";

const countries = [
  { id: "DE", slug: "de", title: "Deutsches Jagdrecht", description: "Bundesjagdgesetz, Verordnungen & Landesjagdgesetze." },
  { id: "CH", slug: "ch", title: "Schweizer Jagdrecht", description: "JSG, JSV, Kantone & Jagdsysteme." },
  { id: "AT", slug: "at", title: "Österreichisches Jagdrecht", description: "Landesjagdgesetze, Verordnungen und Jagdkarten der Bundesländer." },
];

const routeKey = router => JSON.stringify([router.isReady === true, router.asPath || "",
  Object.keys(router.query || {}).sort().map(key => [key, router.query[key]]),
  typeof window === "undefined" ? "" : window.location.hash]);

export async function getStaticProps() {
  const { getAllLegalCountryMetadata } = await import("../../lib/regional-law-data");
  const discoveryModules = learningModules.filter(module => module.category === "Jagdrecht").slice(0, 3)
    .map(module => ({ id: module.id, title: module.title, lessonCount: module.lessons.length, questionCount: module.questions.length }));
  return { props: { discoveryModules, regionCountries: getAllLegalCountryMetadata() } };
}

export default function JagdrechtHome({ discoveryModules, regionCountries = [] }) {
  const router = useRouter();
  const exam = useExamProfile();
  const details = exam.ready ? getExamProfileDetails(exam.profile) : null;
  const path = typeof router.asPath === "string" ? router.asPath.split(/[?#]/)[0] : "";
  const ready = router.isReady === true && exam.ready === true && path === "/jagdrecht";
  const target = ready && details ? examProfileLawHref(exam.profile) : null;
  const currentRouteKey = routeKey(router);
  const key = JSON.stringify([currentRouteKey, exam.ready === true, details?.country.code || "", details?.region.code || ""]);
  const currentOrigin = useRef({ key, routeKey: currentRouteKey });
  if (currentOrigin.current.key !== key) currentOrigin.current = { key, routeKey: currentRouteKey };
  const origin = currentOrigin.current;
  const mounted = useRef(false), attempt = useRef(null);
  const [navigation, setNavigation] = useState(null);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  function live(job) {
    return mounted.current && ready && target && currentOrigin.current === origin
      && routeKey(router) === origin.routeKey && (!job || attempt.current === job);
  }
  function openTarget() {
    if (!live() || attempt.current?.origin === origin && attempt.current.pending) return;
    const job = { origin, target, pending: true };
    attempt.current = job;
    setNavigation({ origin, error: false });
    function failed() {
      if (!live(job)) return;
      job.pending = false;
      setNavigation({ origin, error: true });
    }
    try {
      Promise.resolve(router.replace(target, undefined, { scroll: false })).then(accepted => {
        if (accepted === false) failed();
        // An accepted promise is not an actual URL commit. Keep the neutral
        // pending view until Next mounts the explicit country/region reader.
      }).catch(failed);
    } catch { failed(); }
  }
  useEffect(() => {
    if (target && attempt.current?.origin !== origin) openTarget();
  }, [origin, target]);

  // The account target is a default only for this generic entry. Country pages
  // keep their existing explicit URL selection and comparison controls.
  if (!exam.ready || details) return <main className={styles.main}>
    <header className={styles.header}><h1>Jagdrecht</h1></header>
    {navigation?.origin === origin && navigation.error ? <section role="alert">
      <p>Dein regionales Recht konnte nicht geöffnet werden. Bitte versuche es erneut.</p>
      <button type="button" onClick={openTarget}>Erneut öffnen</button>
      <p><Link href={target} prefetch={false} onClick={event => { if (!live()) event.preventDefault(); }}>Regionales Recht direkt öffnen</Link></p>
    </section> : <p role="status">{target ? `Recht für ${details.region.name} · ${details.country.name} wird geöffnet …` : "Dein Prüfungsprofil wird geladen …"}</p>}
  </main>;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>Jagdrecht</h1>
        <p className={styles.intro}>Wähle Land, Prüfungsregion und Thema im unteren Menü.</p>
      </header>
      <ExamProfileSummary />
      <PageMenu title="Jagdrecht – Land wählen" openInitially initialFocusId="jagdrecht-land-de">
      <RegionalLawResume countries={regionCountries} />
          {countries.map((country) => (
            <Link key={country.id} id={`jagdrecht-land-${country.slug}`} href={`/jagdrecht/${country.slug}`} prefetch={false}>
              <AppIcon name={`flag-${country.id}`} size={21} />{country.title}
            </Link>
          ))}
      <details className={styles.section}><summary>Allgemeine Rechtsgrundlagen vertiefen</summary>
        <LearningDiscovery category="Jagdrecht" modules={discoveryModules} title="Jagdrecht Schritt für Schritt lernen" />
      </details>
      </PageMenu>
    </main>
  );
}
