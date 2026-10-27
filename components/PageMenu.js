"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { setSingleMenuOpen } from "../lib/single-view-navigation";
import styles from "../styles/PageMenu.module.css";

export const PAGE_MENU_OUTLET_ID = "jl-page-menu";
export const PAGE_MENU_ROUTE_ATTRIBUTE = "data-page-menu-route";

// The page contributes controls to the existing lower menu. It never creates
// another navigation bar or moves the outlet owned by the shared app shell.
export function openPageMenu(focusId) {
  if (typeof document === "undefined") return false;
  const outlet = document.getElementById(PAGE_MENU_OUTLET_ID);
  const menu = outlet?.closest("details");
  if (!menu) return false;
  setSingleMenuOpen(menu, true);
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
  setSingleMenuOpen(menu, false);
  return true;
}

// A subgroup is still the same full-page menu. Reset its own scroll panel,
// rather than moving the inert learning page behind it.
export function resetPageMenuPosition(focusId) {
  if (typeof document === "undefined") return false;
  const outlet = document.getElementById(PAGE_MENU_OUTLET_ID);
  const menu = outlet?.closest("details");
  if (!menu?.open) return false;
  const panel = menu.querySelector?.("[data-navigation-view]");
  if (panel) panel.scrollTop = 0;
  const target = typeof focusId === "string" ? document.getElementById(focusId) : null;
  if (target && menu.contains(target)) target.focus?.({ preventScroll: true });
  return true;
}

export default function PageMenu({ title = "Auf dieser Seite", children, openInitially = false, initialFocusId, className = "" }) {
  const [outlet, setOutlet] = useState(null);
  const initiallyOpened = useRef(false);

  useEffect(() => {
    const current = document.getElementById(PAGE_MENU_OUTLET_ID);
    if (current) {
      setOutlet(current);
      return;
    }
    // The shared shell can mount after this page (for example while its
    // pathname becomes ready). Observe only until its existing outlet arrives.
    if (typeof MutationObserver === "undefined") return;
    let active = true;
    const observer = new MutationObserver(() => {
      if (!active) return;
      const target = document.getElementById(PAGE_MENU_OUTLET_ID);
      if (!target) return;
      observer.disconnect();
      setOutlet(target);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { active = false; observer.disconnect(); };
  }, []);

  // Wait for both the committed portal and the shell's route-close effect.
  // The readiness marker avoids opening before a delayed router update closes
  // the menu again. Once consumed, later updates cannot override user closing.
  useEffect(() => {
    if (!outlet || !openInitially || initiallyOpened.current) return;
    const openWhenReady = () => {
      if (initiallyOpened.current) return;
      const currentPath = window.location.pathname + window.location.search;
      if (outlet.getAttribute(PAGE_MENU_ROUTE_ATTRIBUTE) !== currentPath) return;
      if (openPageMenu(initialFocusId)) initiallyOpened.current = true;
    };
    openWhenReady();
    if (initiallyOpened.current || typeof MutationObserver === "undefined") return;
    let active = true;
    const observer = new MutationObserver(() => {
      if (!active) return;
      openWhenReady();
      if (initiallyOpened.current) observer.disconnect();
    });
    observer.observe(outlet, { attributes: true, attributeFilter: [PAGE_MENU_ROUTE_ATTRIBUTE] });
    return () => { active = false; observer.disconnect(); };
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
