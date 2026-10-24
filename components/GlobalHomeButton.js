"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/compat/router";
import Link from "next/link";
import AppIcon from "./AppIcon";
import { PAGE_MENU_OUTLET_ID } from "./PageMenu";
import AppUpdateStatus from "./AppUpdateStatus";
import { learningCategoryDetails } from "../lib/learning-categories";
import styles from "../styles/GlobalNavigation.module.css";

const HISTORY_KEY = "jl_page_history";
export const mainMenuItems = [
  { href: "/", title: "Startseite", icon: "home" },
  { href: "/lernen", title: "Lernbereich", icon: "book" },
  { href: "/wildkunde", title: "Wildarten", icon: "deer" },
  { href: "/fotohelfer", title: "Fotohelfer", icon: "camera" },
  { href: "/lernen/lernkarten", title: "Lernkarten", icon: "book" },
  { href: "/kurse", title: "Kursverzeichnis", icon: "book" },
  { href: "/quiz-app", title: "Quiz & Rangliste", icon: "quiz" },
  { href: "/quiz-app/leaderboard", title: "Rangliste", icon: "trophy" },
  { href: "/jagdpraxis", title: "Praxisübungen", icon: "practice" },
  { href: "/glossar", title: "Jägersprache A–Z", icon: "book" },
  { href: "/jagdrecht", title: "Jagdrecht nach Region", icon: "law" },
  { href: "/community", title: "Community", icon: "community", ariaLabel: "Zur Community" },
  { href: "/news", title: "Jagd-News", icon: "calendar" },
  { href: "/lernen/videos", title: "Jagdvideos", icon: "video" },
  { href: "/konto", title: "Konto & Abo", icon: "account", ariaLabel: "Konto und Abo öffnen" },
  { href: "/meine-kurse", title: "Meine Kurse & Fortschritt", icon: "progress" },
  { href: "/auswertungen", title: "Meine Auswertungen", icon: "chart" },
  { href: "/hilfe", title: "Hilfe & Kontakt", icon: "help" },
];

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
  return path.startsWith("/wildkunde/") || path.startsWith("/lernen/jagdhunde/") || path.split(/[?#]/)[0] === "/lernen/lebensraum-werkstatt";
}
function tracksLawSelection(path) {
  return /^\/jagdrecht\/(?:ch|de|at)$/.test(path.split(/[?#]/)[0]);
}
const toolSelectionFields = {
  "/lernen/spurenwerkstatt": ["eintrag", "ansicht"],
  "/lernen/wildbret-stuecke": ["eintrag", "ansicht"],
  "/lernen/pflanzenatlas": ["eintrag", "jahreszeit", "entwicklung", "ansicht"],
  "/lernen/beobachtungswerkstatt": ["eintrag"],
  "/lernen/wildbret-fallwerkstatt": ["bereich", "eintrag", "thema"],
  "/lernen/forschung-verstehen": ["datensatz"],
  "/lernen/kleines-revierleben": ["thema", "motiv"],
  "/lernen/wildtier-details": ["thema"],
  "/lernen/jagdhund-videos": ["eintrag"],
  "/lernen/wissen-fuers-revier": ["thema"],
};
function tracksToolSelection(path) {
  return toolSelectionFields[path.split(/[?#]/)[0]];
}

function rememberCurrentPath(history, current) {
  const previous = history[history.length - 1];
  if (previous === current) return false;
  const previousBranch = previous ? new URL(previous, "https://jagdlatein.invalid").searchParams.get("bereich") : null;
  const currentBranch = new URL(current, "https://jagdlatein.invalid").searchParams.get("bereich");
  const previousCourse = previous ? new URL(previous, "https://jagdlatein.invalid").searchParams.get("kurs") : null;
  const currentCourse = new URL(current, "https://jagdlatein.invalid").searchParams.get("kurs");
  const lawPath = tracksLawSelection(current);
  const lawStep = lawPath && previous?.split(/[?#]/)[0] === current.split(/[?#]/)[0] &&
    ["region", "thema", "artikel", "ansicht", "bund"].some(key => new URL(previous, "https://jagdlatein.invalid").searchParams.get(key) !== new URL(current, "https://jagdlatein.invalid").searchParams.get(key));
  const topicStep = tracksTopicFragments(current) && previous?.split("#")[0] === current.split("#")[0] && previous?.split("#")[1] !== current.split("#")[1];
  const selectionFields = tracksToolSelection(current);
  const toolStep = selectionFields && previous?.split(/[?#]/)[0] === current.split(/[?#]/)[0] && selectionFields.some(key =>
    JSON.stringify(new URL(previous, "https://jagdlatein.invalid").searchParams.getAll(key)) !== JSON.stringify(new URL(current, "https://jagdlatein.invalid").searchParams.getAll(key)));
  // A chosen tree branch is a navigation step; typing a search remains one stop.
  if (previous?.split(/[?#]/)[0] === current.split(/[?#]/)[0] && previousBranch === currentBranch && previousCourse === currentCourse && !topicStep && !lawStep && !toolStep) history[history.length - 1] = current;
  else history.push(current);
  return true;
}

export default function GlobalHomeButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [viewportSpace, setViewportSpace] = useState({ bottom: 0, menuHeight: null });
  const menuRef = useRef(null);
  const navigationRef = useRef(null);
  const menuRoute = useRef(pathname);

  useEffect(() => {
    const samePage = menuRoute.current === pathname;
    menuRoute.current = pathname;
    const menu = menuRef.current;
    const field = document.activeElement;
    // Updating a search query in the address bar must not dismiss the field
    // while the learner is still typing inside the lower page menu.
    const typing = field?.tagName === "TEXTAREA" || (field?.tagName === "INPUT" && ["search", "text"].includes(field.type));
    if (samePage && menu?.open && typing && menu.contains(field) && field.closest?.(`#${PAGE_MENU_OUTLET_ID}`)) return;
    if (menu) menu.open = false;
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
      const existing = tracksTopicFragments(current) || tracksLawSelection(current) || tracksToolSelection(current) ? history.lastIndexOf(current) : -1;
      if (existing >= 0) writeHistory(history.slice(0, existing + 1));
      else if (rememberCurrentPath(history, current)) writeHistory(history.slice(-20));
    }
    rememberLocation();
    window.addEventListener("hashchange", rememberLocation);
    return () => window.removeEventListener("hashchange", rememberLocation);
  }, [pathname, router?.asPath]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const syncViewport = () => {
      const height = viewport?.height;
      const offset = viewport?.offsetTop;
      const scaled = viewport?.scale !== undefined && Math.abs(viewport.scale - 1) > 0.01;
      const valid = Number.isFinite(height) && height > 0 && Number.isFinite(offset) && offset >= 0 &&
        Number.isFinite(window.innerHeight) && window.innerHeight > 0;
      // Keep the dock above a reduced visual viewport, including the closing
      // keyboard transition. Field focus alone never hides or moves navigation.
      // Pinch zoom is a different viewport change and must not move the dock.
      const obscured = valid && !scaled ? Math.max(0, window.innerHeight - height - offset) : 0;
      const bottom = obscured >= 100 ? Math.round(obscured) : 0;
      const nav = navigationRef.current;
      const measuredHeight = nav?.getBoundingClientRect?.().height;
      const dockHeight = Number.isFinite(measuredHeight) ? measuredHeight : 100;
      const previousInset = Number.parseFloat(nav?.style?.getPropertyValue("--navigation-bottom-inset")) || 0;
      const measuredBottom = nav && window.getComputedStyle ? Number.parseFloat(window.getComputedStyle(nav).bottom) : NaN;
      const edgeGap = Number.isFinite(measuredBottom) ? Math.max(0, measuredBottom - previousInset) : 36;
      // Include the actual dock height and resolved safe-area gap. Very short
      // landscape viewports must not be forced to show an oversized menu.
      const menuHeight = bottom ? Math.max(0, Math.floor(height - dockHeight - edgeGap - 14 - 8)) : null;
      setViewportSpace(previous => previous.bottom === bottom && previous.menuHeight === menuHeight
        ? previous : { bottom, menuHeight });
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    viewport?.addEventListener("resize", syncViewport);
    viewport?.addEventListener("scroll", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
      viewport?.removeEventListener("resize", syncViewport);
      viewport?.removeEventListener("scroll", syncViewport);
    };
  }, []);

  if (!pathname) {
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

  const learningCurrent = ["/lernen", "/wildkunde", "/kurse", "/fotohelfer", "/jagdrecht"].some(section => inSection(pathname, section));
  const accountCurrent = ["/konto", "/meine-kurse", "/auswertungen", "/login", "/registrieren", "/preise"]
    .some(section => inSection(pathname, section));
  const videoCurrent = ["/lernen/videos", "/lernen/wildtier-videofaelle", "/lernen/jagdhund-videos"]
    .some(section => inSection(pathname, section));
  function menuCurrent(item) {
    if (item.href === "/") return pathname === "/";
    if (item.href === "/konto") return accountCurrent && !["/meine-kurse", "/auswertungen"].some(section => inSection(pathname, section));
    if (item.href === "/quiz-app") return inSection(pathname, "/quiz-app") && !inSection(pathname, "/quiz-app/leaderboard");
    if (item.href === "/lernen/videos") return videoCurrent;
    if (item.href === "/lernen") return pathname === "/lernen" || inSection(pathname, "/kurse") || inSection(pathname, "/lernen") && !inSection(pathname, "/lernen/lernkarten") && !videoCurrent;
    return inSection(pathname, item.href);
  }
  function closeMenu(event) {
    if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!event.button || event.button === 0) && menuRef.current) menuRef.current.open = false;
  }

  return (
    <nav
      ref={navigationRef}
      aria-label="Seitennavigation"
      className={styles.nav}
      style={{ "--navigation-bottom-inset": `${viewportSpace.bottom}px`,
        ...(viewportSpace.menuHeight !== null ? { "--navigation-menu-height": `${viewportSpace.menuHeight}px` } : {}) }}
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
          <div id={PAGE_MENU_OUTLET_ID} className={styles.pageMenu} />
          {mainMenuItems.map(item => item.href === "/lernen" ? <details key={item.href} className={styles.categoryTree}>
            <summary><AppIcon name="book" size={21} />Lernbereiche<span aria-hidden="true">›</span></summary>
            <div><Link href="/lernen" prefetch={false} onClick={closeMenu}>Alle Kategorien</Link>
            {learningCategoryDetails.map(category => <Link key={category.slug} href={`/lernen/${category.slug}`} prefetch={false} onClick={closeMenu} aria-current={pathname === `/lernen/${category.slug}` ? "page" : undefined}>{category.title}</Link>)}</div>
          </details> : <Link key={item.href} href={item.href} prefetch={false} onClick={closeMenu} aria-label={item.ariaLabel} aria-current={menuCurrent(item) ? "page" : undefined}><AppIcon name={item.icon} size={21} />{item.title}</Link>)}
          <AppUpdateStatus offline={pathname === "/lernen/offline-rucksack"} />
        </div>
      </details>
    </nav>
  );
}
