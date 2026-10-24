"use client";

import { useEffect, useRef, useState } from "react";
import { createAppUpdateCheck } from "../lib/app-update";
import styles from "../styles/AppUpdateStatus.module.css";

export default function AppUpdateStatus({ offline = false } = {}) {
  const [status, setStatus] = useState("checking");
  const section = useRef(null);
  useEffect(() => {
    const checker = createAppUpdateCheck({ currentRelease: process.env.NEXT_PUBLIC_JL_RELEASE_ID, onChange: setStatus });
    const menu = section.current?.closest("details");
    const checkVisible = () => { if (document.visibilityState !== "hidden") checker.check(); };
    const checkMenu = () => { if (menu?.open) checkVisible(); };
    checkVisible();
    window.addEventListener("focus", checkVisible);
    document.addEventListener("visibilitychange", checkVisible);
    menu?.addEventListener("toggle", checkMenu);
    return () => {
      checker.dispose();
      window.removeEventListener("focus", checkVisible);
      document.removeEventListener("visibilitychange", checkVisible);
      menu?.removeEventListener("toggle", checkMenu);
    };
  }, []);
  return <section ref={section} className={styles.section} aria-label="Stand der Website">
    <p role="status" aria-live="polite">{status === "update" ? "Eine neue Version ist verfügbar." : status === "current" ? "Diese Website-Version ist aktuell." : status === "checking" ? "Website-Stand wird geprüft …" : "Der Website-Stand ist gerade nicht prüfbar."}</p>
    <button type="button" className={styles.reload} onClick={() => window.location.reload()}>{status === "update" ? "Neue Version laden" : "Seite neu laden"}</button>
    {status === "update" && <p className={styles.note}>Offene Eingaben vor dem Neuladen speichern. Gespeicherte Notizen und Downloads bleiben erhalten.</p>}
    {offline && <p className={styles.note}>Offline-Kurse behalten ihren Downloadstand. Neue Inhalte erhältst du mit „Auswahl neu herunterladen“.</p>}
  </section>;
}
