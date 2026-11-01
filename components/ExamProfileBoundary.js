"use client";
import { useEffect, useRef } from "react";
import ExamProfileWelcome from "./ExamProfileWelcome";
import useAccountExamProfile from "../hooks/useAccountExamProfile";
import { loadAccountExamProfile, resetAccountExamProfile } from "../lib/account-exam-profile-client";
import useSelectionPageStart from "../hooks/useSelectionPageStart";

export function requiresExamProfile(path) {
  const pathname = String(path || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (pathname === "/lernen/offline-rucksack") return false;
  return ["/meine-kurse", "/auswertungen", "/ebook", "/protected/ebook", "/glossar", "/online-kurse", "/dashboard", "/suche"].includes(pathname)
    || ["/lernen", "/kurse", "/wildkunde", "/hundewesen", "/jagdrecht", "/quiz-app"].some(base => pathname === base || pathname.startsWith(base + "/"));
}

// One page replaces learning until this account confirms its target. Existing
// authentication, subscription and API checks remain the access boundary.
export default function ExamProfileBoundary({ required, children }) {
  const account = useAccountExamProfile();
  const waiting = useRef(false);
  const { focusSelection } = useSelectionPageStart(account, account.ready);
  useEffect(() => {
    if (!required) { waiting.current = false; return; }
    if (!account.ready || !account.profile) { waiting.current = true; return; }
    if (waiting.current) {
      waiting.current = false;
      focusSelection(document.querySelector("[data-learning-page-start]"));
    }
  }, [required, account, focusSelection]);
  useEffect(() => {
    if (!required) return;
    loadAccountExamProfile();
    const deleted = () => resetAccountExamProfile();
    window.addEventListener("jagdlatein-account-deleted", deleted);
    return () => window.removeEventListener("jagdlatein-account-deleted", deleted);
  }, [required]);
  if (!required || (account.ready && account.profile)) return children;
  return <ExamProfileWelcome inline />;
}
