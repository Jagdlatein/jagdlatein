"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AppIcon from "./AppIcon";
import styles from "../styles/GlobalNavigation.module.css";

const HISTORY_KEY = "jl_page_history";

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
export default function GlobalHomeButton() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const current = window.location.pathname + window.location.search;
    const history = readHistory();
    if (history[history.length - 1] !== current) {
      history.push(current);
      writeHistory(history.slice(-20));
    }
  }, [pathname]);

  if (!pathname || pathname === "/") {
    return null;
  }

  function goBack() {
    const current = window.location.pathname + window.location.search;
    const history = readHistory();
    if (history[history.length - 1] !== current) {
      history.push(current);
    }
    history.pop();

    const previous = history[history.length - 1];
    writeHistory(history);
    window.location.assign(previous || "/");
  }

  return (
    <nav
      aria-label="Seitennavigation"
      className={styles.nav}
    >
      <button
        type="button"
        onClick={goBack}
        aria-label="Zurück zur vorherigen Seite"
        className={styles.button}
      >
        <AppIcon name="arrow-left" size={18} /> Zurück
      </button>
      <a href="/lernen" className={`${styles.button} ${styles.learning}`} aria-label="Zum Lernbereich">
        <AppIcon name="book" size={18} /> Lernen
      </a>
      <a href="/lernen#lernen-suche" className={styles.button} aria-label="Alle Lernangebote suchen"><AppIcon name="search" size={18} /> Suche</a>
      <a href="/community" className={styles.button} aria-label="Zur Community" aria-current={pathname.startsWith("/community") ? "page" : undefined}><AppIcon name="community" size={18} /> Community</a>
      <a
        href="/"
        aria-label="Zur Startseite"
        className={styles.button}
      >
        <AppIcon name="home" size={18} /> Start
      </a>
    </nav>
  );
}
