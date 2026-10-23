"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "../styles/PageMenu.module.css";

export const PAGE_MENU_OUTLET_ID = "jl-page-menu";

// The page contributes controls to the existing lower menu. It never creates
// another navigation bar or moves the outlet owned by the shared app shell.
export function openPageMenu(focusId) {
  if (typeof document === "undefined") return false;
  const outlet = document.getElementById(PAGE_MENU_OUTLET_ID);
  const menu = outlet?.closest("details");
  if (!menu) return false;
  menu.open = true;
  const target = typeof focusId === "string" && focusId
    ? document.getElementById(focusId)
    : null;
  if (target && menu.contains(target)) {
    target.focus?.({ preventScroll: true });
    target.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }
  return true;
}

export function closePageMenu() {
  if (typeof document === "undefined") return false;
  const menu = document.getElementById(PAGE_MENU_OUTLET_ID)?.closest("details");
  if (!menu) return false;
  menu.open = false;
  return true;
}

export default function PageMenu({ title = "Auf dieser Seite", children, openInitially = false, initialFocusId, className = "" }) {
  const [outlet, setOutlet] = useState(null);
  const initiallyOpened = useRef(false);

  useEffect(() => {
    setOutlet(document.getElementById(PAGE_MENU_OUTLET_ID));
  }, []);

  // This effect runs after the portal commit: its controls are present when
  // the native details menu opens. Updating controls must not reopen it.
  useEffect(() => {
    if (!outlet || !openInitially || initiallyOpened.current) return;
    if (openPageMenu(initialFocusId)) initiallyOpened.current = true;
  }, [outlet, openInitially, initialFocusId]);

  if (!outlet) return null;
  return createPortal(
    <section className={`${styles.section}${className ? ` ${className}` : ""}`} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </section>,
    outlet,
  );
}
