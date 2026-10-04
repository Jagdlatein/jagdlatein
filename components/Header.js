"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppIcon from "./AppIcon";
import { clearOfflineLearning } from "../lib/offline-learning";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAuth() {
      try {
        const response = await fetch("/api/auth/status", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Anmeldestatus nicht erreichbar");

        const auth = await response.json();
        if (active) {
          setIsLoggedIn(auth.loggedIn === true);
        }
      } catch {
        if (active) {
          setIsLoggedIn(false);
        }
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    loadAuth();
    return () => { active = false; };
  }, []);
  // Logout über die API löscht die HttpOnly-Cookies.
  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    try { await clearOfflineLearning(); } catch { window.alert("Abgemeldet. Die lokalen Downloads konnten nicht vollständig entfernt werden. Bitte im Lernrucksack entfernen oder die Browserdaten dieser App löschen."); }
    window.location.href = "/";
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="logo">
          Jagdlatein Die Lernplattform
        </Link>

        <nav className="nav-links" aria-label="Hauptmenü">
          <Link href="/">Start</Link>
          <Link href="/lernen" className="learning-nav"><AppIcon name="book" size={20} />Lernbereich</Link>
          <Link href="/preise">Preise</Link>

          {isLoggedIn && (
            <>
              <Link href="/konto"><AppIcon name="account" size={20} />Mein Konto</Link>

              <button
                onClick={logout}
                className="logout-btn"
              >
                Logout
              </button>
            </>
          )}

          {!authLoading && !isLoggedIn && (
            <>
              <Link href="/login">Login</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
