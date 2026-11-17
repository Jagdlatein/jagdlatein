import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LearningToolLayout from "./LearningToolLayout";
import AppIcon from "./AppIcon";
import PageMenu, { closePageMenu, openPageMenu } from "./PageMenu";
import MenuChoice from "./MenuChoice";
import useSelectionPageStart from "../hooks/useSelectionPageStart";
import { learningCategoryDetails } from "../lib/learning-categories";
import { courseDirectoryRoute, courseDirectoryTarget, courseDirectoryCourses, courseDirectoryFocusIntent } from "../lib/course-directory-selection";
import shared from "../styles/LearningExperience.module.css";
import styles from "../styles/CourseDirectory.module.css";

const selectionKey = selection => JSON.stringify([selection.valid, selection.category, selection.format]);
const sameScope = (left, right) => ["path", "query", "browser"].every(key => left?.[key] === right?.[key]);
const focusTransition = (scope, intent) => ["path", "query", "browser"].every(key => scope?.[key] === intent.source[key] || scope?.[key] === intent.target[key]);

export default function CourseDirectory({ courses }) {
  const router = useRouter(), route = courseDirectoryRoute(router), { ready, selection } = route;
  const view = useRef(null);
  if (!view.current || view.current.key !== route.origin) view.current = { key: route.origin };
  const origin = view.current, mounted = useRef(false), navigation = useRef(0), pending = useRef(null), focusIntent = useRef(null), top = useRef(null), lastFocus = useRef(null);
  const [working, setWorking] = useState(false), [navigationError, setNavigationError] = useState("");
  const { focusSelection, cancelSelectionFocus } = useSelectionPageStart(origin, ready);
  const visible = ready ? courseDirectoryCourses(courses, selection) : [];
  const category = learningCategoryDetails.find(item => item.slug === selection.category);
  const formatTitle = selection.format === "mini" ? "Minikurse" : selection.format === "detailed" ? "Ausführliche Lerneinheiten" : "Alle Formate";
  const current = () => mounted.current && ready && view.current === origin && courseDirectoryRoute(router).origin === route.origin;
  const intended = () => pending.current?.origin === origin ? pending.current.selection : selection;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; navigation.current++; pending.current = null; focusIntent.current = null; };
  }, []);
  useEffect(() => {
    const live = courseDirectoryRoute(router), marker = focusIntent.current;
    if (marker && !focusTransition(live.scope, marker)) focusIntent.current = null;
    if (pending.current && (pending.current.origin !== origin || live.origin !== route.origin)) { pending.current = null; navigation.current++; setWorking(false); }
    if (!current()) return;
    const ownCommit = selection.valid && focusIntent.current && sameScope(live.scope, focusIntent.current.target);
    if (ownCommit) focusIntent.current = null;
    setNavigationError("");
    const key = selectionKey(selection);
    if ((lastFocus.current !== key || ownCommit) && current()) { lastFocus.current = key; focusSelection(top.current); }
    if (selection.valid && selection.category) { if (current()) closePageMenu(); return; }
    const timer = setTimeout(() => {
      if (current()) openPageMenu("course-directory-selection");
    }, 0);
    return () => clearTimeout(timer);
  }, [route.origin]);

  async function select(nextCategory, nextFormat) {
    if (!current()) return false;
    const target = courseDirectoryTarget(router, nextCategory, nextFormat);
    if (!target) return false;
    cancelSelectionFocus(); focusIntent.current = null; setNavigationError("");
    const nextSelection = { valid: true, category: nextCategory, format: nextFormat || "all" };
    if (pending.current === null && !(nextCategory === null && nextFormat === null) && selectionKey(nextSelection) === selectionKey(selection)) {
      if (nextCategory) { closePageMenu(); focusSelection(top.current); } else openPageMenu("course-directory-selection");
      return true;
    }
    const marker = courseDirectoryFocusIntent(router, target);
    const ticket = ++navigation.current, operation = { ticket, origin, selection: nextSelection, target, marker }; pending.current = operation; focusIntent.current = marker; setWorking(true);
    let finished = false;
    const ownsRequest = () => current() && navigation.current === ticket && pending.current === operation;
    function failed() {
      if (!ownsRequest()) return;
      setNavigationError("Die Kursauswahl konnte nicht geöffnet werden. Bitte wähle sie erneut.");
      openPageMenu("course-directory-selection");
    }
    try {
      const accepted = await router.push(target, undefined, { shallow: true, scroll: false });
      if (accepted === false) { finished = true; failed(); return false; }
      if (!ownsRequest()) return true;
      // A successful promise alone cannot change the list. Normally the new
      // committed URL re-renders this owner. The exact already-current target
      // also lets a new intent cancel a pending switch to another category.
      if (router.asPath === target) {
        finished = true;
        if (nextCategory) { closePageMenu(); focusSelection(top.current); } else openPageMenu("course-directory-selection");
      }
      return true;
    } catch (error) {
      finished = true; if (!error?.cancelled) failed(); return false;
    } finally {
      if (finished && focusIntent.current === marker) focusIntent.current = null;
      if (finished && ownsRequest()) { pending.current = null; setWorking(false); }
    }
  }

  return <LearningToolLayout title="Kursverzeichnis" description="Kurse nach Kategorie und Lernformat wählen." headingOnly>
    <PageMenu title="Kursauswahl" openInitially={ready && (!selection.valid || !selection.category)} initialFocusId="course-directory-selection">
      <section id="course-directory-selection" tabIndex={-1}>
        <MenuChoice label="Kategorie" id="course-directory-category" value={selection.category || ""} disabled={!ready} aria-controls="course-directory-results" onChange={event => select(event.target.value, intended().format || "all")}>
          <option value="" disabled>Kategorie wählen</option><option value="all">Alle Kategorien</option>
          {learningCategoryDetails.map(item => <option value={item.slug} key={item.slug}>{item.title}</option>)}
        </MenuChoice>
        <MenuChoice label="Lernformat" id="course-directory-format" value={selection.format || ""} disabled={!ready} aria-controls="course-directory-results" onChange={event => select(intended().category, event.target.value)}>
          {!selection.format && <option value="" disabled>Lernformat wählen</option>}<option value="all">Alle Formate</option><option value="mini">Minikurse</option><option value="detailed">Ausführliche Lerneinheiten</option>
        </MenuChoice>
        {(router.query?.kategorie !== undefined || router.query?.format !== undefined) && <button type="button" className={shared.secondary} disabled={!ready} onClick={() => select(null, null)}>Auswahl zurücksetzen</button>}
        {navigationError && <p role="alert" className={shared.wrong}>{navigationError}</p>}
      </section>
    </PageMenu>
    <div id="course-directory-top" ref={top} tabIndex={-1} className={styles.start}>
      <section id="course-directory-results" aria-busy={working} aria-labelledby="course-directory-title">
        {ready && selection.valid && selection.category ? <>
          <h2 id="course-directory-title">{category?.title || "Alle Kategorien"}</h2>
          <p role="status" className={styles.summary}>{formatTitle} · {visible.length} von {courses.length} Kursen</p>
          <div className={styles.courses}>{visible.map(course => <article className={shared.card} key={course.id}>
            <p className={shared.muted}>{learningCategoryDetails.find(item => item.slug === course.category)?.title} · {course.format === "mini" ? "Minikurs" : "Ausführliche Lerneinheit"}</p>
            <h3>{course.title}</h3><p>{course.description}</p><p>{course.totalQuestions} Übungsfragen</p>
            <Link href={course.href} prefetch={false} className={shared.primary}>Kurs öffnen<AppIcon name="arrow-right" size={18} /></Link>
          </article>)}</div>
          {visible.length === 0 && <p className={shared.empty}>Für diese Kategorie und dieses Lernformat sind keine Kurse vorhanden. Ändere die Auswahl unten im Menü.</p>}
        </> : <><h2 id="course-directory-title">Kurse auswählen</h2><p className={shared.note} role={ready ? undefined : "status"}>{!ready ? "Deine Kursauswahl wird geladen …" : selection.valid ? "Wähle eine Kategorie unten im Menü. Dort passt du auch das Lernformat an." : "Diese Kursauswahl ist nicht verfügbar. Wähle Kategorie und Lernformat unten im Menü."}</p></>}
      </section>
    </div>
  </LearningToolLayout>;
}
