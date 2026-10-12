"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/compat/router";
import AppIcon from "./AppIcon";
import styles from "../styles/GlobalNavigation.module.css";

const HISTORY_KEY = "jl_page_history";

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

function rememberCurrentPath(history, current) {
  const previous = history[history.length - 1];
  if (previous === current) return false;
  // Search/filter edits replace the current page rather than adding a Back stop.
  if (previous?.split(/[?#]/)[0] === current.split(/[?#]/)[0]) history[history.length - 1] = current;
  else history.push(current);
  return true;
}

export default function GlobalHomeButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!pathname) return;

    const current = window.location.pathname + window.location.search;
    const history = readHistory();
    if (rememberCurrentPath(history, current)) {
      writeHistory(history.slice(-20));
    }
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
    const current = window.location.pathname + window.location.search;
    const history = readHistory();
    rememberCurrentPath(history, current);
    history.pop();

    const previous = history[history.length - 1];
    writeHistory(history);
    window.location.assign(previous || "/");
  }

  const learningCurrent = inSection(pathname, "/lernen");
  const communityCurrent = inSection(pathname, "/community");
  const accountCurrent = ["/konto", "/meine-kurse", "/auswertungen", "/login", "/registrieren", "/preise"]
    .some(section => inSection(pathname, section));

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
      <a href="/lernen" className={`${styles.button} ${styles.learning}`} aria-label="Zum Lernbereich" aria-current={learningCurrent ? "true" : undefined}>
        <AppIcon name="book" size={18} /> Lernen
      </a>
      <a href="/lernen#lernen-suche" className={styles.button} aria-label="Alle Lernangebote suchen"><AppIcon name="search" size={18} /> Suche</a>
      <a href="/community" className={styles.button} aria-label="Zur Community" aria-current={communityCurrent ? "true" : undefined}><AppIcon name="community" size={18} /><span className={styles.desktopLabel}>Community</span><span className={styles.mobileLabel}>Forum</span></a>
      <a
        href="/"
        aria-label="Zur Startseite"
        className={styles.button}
      >
        <AppIcon name="home" size={18} /> Start
      </a>
      <a href="/konto" className={styles.button} aria-label="Konto und Abo öffnen" aria-current={accountCurrent ? "true" : undefined}>
        <AppIcon name="account" size={18} /> Konto
      </a>
    </nav>
  );
}
