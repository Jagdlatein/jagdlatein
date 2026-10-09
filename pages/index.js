// pages/index.js

import Head from "next/head";
import { readRequestAccountSession } from "../lib/account-access";
import Link from "next/link";
import AppIcon from "../components/AppIcon";
import home from "../styles/Home.module.css";
import HomeNews from "../components/HomeNews";
import { CommunityInvite } from "../components/Community";
import { getJagdNews } from "../lib/jagd-news-server";
import { clearOfflineLearning } from "../lib/offline-learning";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export async function getServerSideProps({ req }) {
  const initialNews = await getJagdNews();
  return {
    props: {
      loggedIn: Boolean(readRequestAccountSession(req)),
      initialNews,
    },
  };
}

export default function Home({ loggedIn = false, initialNews }) {

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let registrationListener;
    let registrationErrorListener;

    async function setupPush() {
      try {
        let permission =
          await PushNotifications.checkPermissions();

        if (
          permission.receive === "prompt" ||
          permission.receive === "prompt-with-rationale"
        ) {
          permission =
            await PushNotifications.requestPermissions();
        }

        if (permission.receive !== "granted") {
          console.log(
            "Push-Benachrichtigungen nicht erlaubt"
          );
          return;
        }

        registrationListener =
          await PushNotifications.addListener(
            "registration",
            async (token) => {
              try {
                const response = await fetch("/api/push/register", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    token: token.value,
                  }),
                });

                await response.json();
              } catch {
                console.error("Push-Token konnte nicht gespeichert werden.");
              }
            }
          );

        registrationErrorListener =
          await PushNotifications.addListener(
            "registrationError",
            () => {
              console.error("Push Registrierung fehlgeschlagen.");
            }
          );

        await PushNotifications.register();
      } catch {
        console.error("Push konnte nicht eingerichtet werden.");
      }
    }

    setupPush();

    return () => {
      registrationListener?.remove();
      registrationErrorListener?.remove();
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/session", {
      method: "DELETE",
    });
    try { await clearOfflineLearning(); } catch { window.alert("Abgemeldet. Die lokalen Downloads konnten nicht vollständig entfernt werden. Bitte im Lernrucksack entfernen oder die Browserdaten dieser App löschen."); }

    window.location.href = "/";
  }

  return (
    <>
      <Head>
        <title>Jagdlatein – Lernplattform für Jäger</title>
      </Head>

      <main className={home.main}>
        <div className={home.wrap}>
          <p className={home.eyebrow}>Wissen für Revier und Prüfung</p>
          <h1 className={home.title}>
            Jagdlatein
          </h1>

          <p className={home.sub}>
            Lernen für Jagdschein und Praxis in Deutschland,
            Österreich &amp; Schweiz
          </p>

          <div className={home.btnRow}>
            <Link
              href="/preise"
              className={home.btnPrimary}
            >
              Jetzt freischalten
            </Link>

            {loggedIn ? (
              <>
                <Link href="/konto" className={home.btnGhost}>
                  <AppIcon name="account" size={20} />
                  Mein Konto
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className={home.btnGhost}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login?next=/"
                className={home.btnGhost}
              >
                Login
              </Link>
            )}

            <a
              href="https://whatsapp.com/channel/0029VbBQe6jD8SDpuh6q2y2v"
              target="_blank"
              rel="noopener noreferrer"
              className={home.iconButton}
              aria-label="Jagdlatein auf WhatsApp"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="#111"
                aria-hidden="true"
              >
                <path d="M12 2C6.5 2 2 6.3 2 11.7c0 2.1.7 4 2 5.6L2 22l4.9-1.9c1.5.8 3.2 1.2 5 1.2 5.5 0 10-4.3 10-9.7S17.5 2 12 2zm4.6 13.8c-.2.6-1.1 1.1-1.5 1.2-.4.1-.9.1-1.5-.1-.3-.1-.7-.2-1.2-.5-2.1-1-3.4-2.8-3.6-3-.2-.3-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .4.3.1.3.5 1.3.6 1.4.1.1.1.2 0 .4-.1.2-.2.3-.3.5-.1.1-.2.2-.3.3-.1.1-.2.2-.1.4.1.2.5.8 1.1 1.3.8.7 1.4.9 1.6 1 .2.1.3.1.4 0 .1-.1.5-.6.6-.8.1-.2.3-.2.4-.1.2.1 1.3.6 1.5.7.2.1.3.1.4.2.1.1.1.6-.1 1.2z" />
              </svg>
            </a>

            <a
              href="https://www.facebook.com/share/1FRELdRuAP/"
              target="_blank"
              rel="noopener noreferrer"
              className={home.iconButton}
              aria-label="Jagdlatein auf Facebook"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="#111"
                aria-hidden="true"
              >
                <path d="M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.7 1.8-1.7H17V2.5c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5v2.6H7V13h3v9h3.5z" />
              </svg>
            </a>

            <a
              href="https://instagram.com/jagdlatein"
              target="_blank"
              rel="noopener noreferrer"
              className={home.iconButton}
              aria-label="Jagdlatein auf Instagram"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="#111"
                aria-hidden="true"
              >
                <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.3 2.4.5.6.3 1 .6 1.5 1.1.5.5.8.9 1.1 1.5.2.5.4 1.2.5 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.9-.5 2.4-.3.6-.6 1-1.1 1.5-.5.5-.9.8-1.5 1.1-.5.2-1.2.4-2.4.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.3-2.4-.5-.6-.3-1-.6-1.5-1.1-.5-.5-.8-.9-1.1-1.5-.2-.5-.4-1.2-.5-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.9.5-2.4.3-.6.6-1 1.1-1.5.5-.5.9-.8 1.5-1.1.5-.2 1.2-.4 2.4-.5C8.4 2.2 8.8 2.2 12 2.2zm0 3.3a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm7.1-.5a1.5 1.5 0 1 0-3.1 0 1.5 1.5 0 0 0 3.1 0z" />
              </svg>
            </a>
          </div>

          <Link href="/lernen" className={home.learningCard}>
            <span className={home.learningIcon}><AppIcon name="book" size={42} /></span>
            <span className={home.learningContent}>
              <span className={home.learningLabel}>Alles für deinen Lernerfolg</span>
              <strong>Lernbereich</strong>
              <span>Alle Kategorien, Lernpfade, Kurse, Quiz und Praxisübungen an einem Ort.</span>
              <span className={home.learningAction}>Lernbereich öffnen <AppIcon name="arrow-right" size={20} /></span>
            </span>
          </Link>
          <p className={home.learningHint}>Gemeinsames Jagdwissen für Deutschland, Österreich und die Schweiz. Die Länderwahl findest du dort, wo sich die rechtlichen Regeln unterscheiden.</p>

          <CommunityInvite />
          <HomeNews initialNews={initialNews} />

        </div>
      </main>
    </>
  );
}
