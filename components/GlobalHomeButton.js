"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/compat/router";
import Link from "next/link";
import AppIcon from "./AppIcon";
import { learningCategoryDetails } from "../lib/learning-categories";
import styles from "../styles/GlobalNavigation.module.css";

const HISTORY_KEY = "jl_page_history";
export const mainMenuItems = [
  { href: "/", title: "Startseite", icon: "home" },
  { href: "/lernen", title: "Lernbereich", icon: "book" },
  { href: "/wildkunde", title: "Wildarten", icon: "deer" },
  { href: "/lernen/lernkarten", title: "Lernkarten", icon: "book" },
  { href: "/quiz-app", title: "Quiz & Rangliste", icon: "quiz" },
  { href: "/community", title: "Community", icon: "community", ariaLabel: "Zur Community" },
  { href: "/news", title: "Jagd-News", icon: "calendar" },
  { href: "/lernen/videos", title: "Jagdvideos", icon: "video" },
  { href: "/konto", title: "Konto & Abo", icon: "account", ariaLabel: "Konto und Abo öffnen" },
  { href: "/hilfe", title: "Hilfe & Kontakt", icon: "help" },
];

function isEditingField(element) {
  if (!element || element.disabled || element.readOnly) return false;
  if (element.isContentEditable) return true;
  const tag = element.tagName?.toLowerCase();
  if (tag === "textarea" || tag === "select") return true;
  return tag === "input" && ![
    "button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit",
  ].includes(element.type?.toLowerCase());
}

function inSection(pathname, section) {
  return pathname === section || pathname.startsWith(`${section}/`);
}

function readHistory() {
  try {
    const history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(history)
      ? history.filter(
          (path) =>
            typeof path === "string" &&
            path.startsWith("/") &&
            !path.startsWith("//") &&
            !/[\\\u0000-\u001f\u007f]/.test(path)
        )
      : [];
  } catch {
    return [];
  }
}

function writeHistory(history) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Navigation still works when browser storage is blocked or full.
  }
}

function tracksTopicFragments(path) {
  return path.startsWith("/wildkunde/") || path.split(/[?#]/)[0] === "/lernen/lebensraum-werkstatt";
}

function rememberCurrentPath(history, current) {
  const previous = history[history.length - 1];
  if (previous === current) return false;
  const previousBranch = previous ? new URL(previous, "https://jagdlatein.invalid").searchParams.get("bereich") : null;
  const currentBranch = new URL(current, "https://jagdlatein.invalid").searchParams.get("bereich");
  const previousCourse = previous ? new URL(previous, "https://jagdlatein.invalid").searchParams.get("kurs") : null;
  const currentCourse = new URL(current, "https://jagdlatein.invalid").searchParams.get("kurs");
  const topicStep = tracksTopicFragments(current) && previous?.split("#")[0] === current.split("#")[0] && previous?.split("#")[1] !== current.split("#")[1];
  // A chosen tree branch is a navigation step; typing a search remains one stop.
  if (previous?.split(/[?#]/)[0] === current.split(/[?#]/)[0] && previousBranch === currentBranch && previousCourse === currentCourse && !topicStep) history[history.length - 1] = current;
  else history.push(current);
  return true;
}

export default function GlobalHomeButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname, router?.asPath]);

  useEffect(() => {
    const closeOutside = event => {
      const menu = menuRef.current;
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    function rememberLocation() {
      const current = window.location.pathname + window.location.search + (window.location.hash || "");
      const history = readHistory();
      const existing = tracksTopicFragments(current) ? history.lastIndexOf(current) : -1;
      if (existing >= 0) writeHistory(history.slice(0, existing + 1));
      else if (rememberCurrentPath(history, current)) writeHistory(history.slice(-20));
    }
    rememberLocation();
    window.addEventListener("hashchange", rememberLocation);
    return () => window.removeEventListener("hashchange", rememberLocation);
  }, [pathname, router?.asPath]);

  useEffect(() => {
    if (!pathname || pathname === "/") return;
    let blurTimer;
    const syncFocus = () => setEditing(isEditingField(document.activeElement));
    const afterBlur = () => {
      window.clearTimeout(blurTimer);
      // Wait for focus to settle when moving between fields.
      blurTimer = window.setTimeout(syncFocus, 0);
    };
    syncFocus();
    document.addEventListener("focusin", syncFocus);
    document.addEventListener("focusout", afterBlur);
    return () => {
      window.clearTimeout(blurTimer);
      document.removeEventListener("focusin", syncFocus);
      document.removeEventListener("focusout", afterBlur);
    };
  }, [pathname]);

  if (!pathname || pathname === "/") {
    return null;
  }

  function goBack() {
    const current = window.location.pathname + window.location.search + (window.location.hash || "");
    const history = readHistory();
    rememberCurrentPath(history, current);
    history.pop();

    const previous = history[history.length - 1];
    writeHistory(history);
    const target = previous || "/";
    // Pages navigation reuses the loaded app shell. A hard navigation remains
    // available in App Router and if a chunk cannot be loaded. A cancelled
    // transition must not override a newer choice made by the learner.
    if (router?.push) {
      try {
        const transition = router.push(target);
        transition?.catch(error => { if (!error?.cancelled) window.location.assign(target); });
        return;
      } catch { /* Retry a failed client transition with a document navigation. */ }
    }
    window.location.assign(target);
  }

  const learningCurrent = ["/lernen", "/wildkunde", "/kurse"].some(section => inSection(pathname, section));
  const accountCurrent = ["/konto", "/meine-kurse", "/auswertungen", "/login", "/registrieren", "/preise"]
    .some(section => inSection(pathname, section));
  const videoCurrent = ["/lernen/videos", "/lernen/wildtier-videofaelle", "/lernen/jagdhund-videos"]
    .some(section => inSection(pathname, section));
  function menuCurrent(item) {
    if (item.href === "/") return pathname === "/";
    if (item.href === "/konto") return accountCurrent;
    if (item.href === "/lernen/videos") return videoCurrent;
    if (item.href === "/lernen") return pathname === "/lernen" || inSection(pathname, "/kurse") || inSection(pathname, "/lernen") && !inSection(pathname, "/lernen/lernkarten") && !videoCurrent;
    return inSection(pathname, item.href);
  }
  function closeMenu(event) {
    if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!event.button || event.button === 0) && menuRef.current) menuRef.current.open = false;
  }

  return (
    <nav
      aria-label="Seitennavigation"
      className={`${styles.nav}${editing ? ` ${styles.editing}` : ""}`}
    >
      <button
        type="button"
        onClick={goBack}
        aria-label="Zurück zur vorherigen Seite"
        className={styles.button}
      >
        <AppIcon name="arrow-left" size={18} /> Zurück
      </button>
      <Link href="/lernen" prefetch={false} className={`${styles.button} ${styles.learning}`} aria-label="Zum Lernbereich" aria-current={learningCurrent ? "true" : undefined}>
        <AppIcon name="book" size={18} /> Lernen
      </Link>
      <Link href="/lernen#lernen-suche" prefetch={false} className={styles.button} aria-label="Alle Lernangebote suchen"><AppIcon name="search" size={18} /> Suche</Link>
      <details className={styles.more} ref={menuRef} onKeyDown={event => {
        if (event.key === "Escape" && menuRef.current?.open) {
          event.preventDefault(); menuRef.current.open = false;
          menuRef.current.querySelector("summary")?.focus();
        }
      }}>
        <summary className={styles.button}><AppIcon name="menu" size={18} />Menü</summary>
        <div className={styles.moreLinks}>
          {mainMenuItems.map(item => item.href === "/lernen" ? <details key={item.href} className={styles.categoryTree}>
            <summary><AppIcon name="book" size={21} />Lernbereiche<span aria-hidden="true">›</span></summary>
            <div><Link href="/lernen" prefetch={false} onClick={closeMenu}>Alle Kategorien</Link>
            {learningCategoryDetails.map(category => <Link key={category.slug} href={`/lernen/${category.slug}`} prefetch={false} onClick={closeMenu} aria-current={pathname === `/lernen/${category.slug}` ? "page" : undefined}>{category.title}</Link>)}</div>
          </details> : <Link key={item.href} href={item.href} prefetch={false} onClick={closeMenu} aria-label={item.ariaLabel} aria-current={menuCurrent(item) ? "page" : undefined}><AppIcon name={item.icon} size={21} />{item.title}</Link>)}
        </div>
      </details>
    </nav>
  );
}
