import { useEffect, useRef, useState } from "react";
import useWebCoursePlatform from "../hooks/useWebCoursePlatform";
import { createWebPushController, getWebPushSupport } from "../lib/firebase-web-push";
import { firebaseWebVapidKey } from "../lib/firebase-web-config";
import styles from "../styles/Account.module.css";

export default function WebPushPreferences({ account }) {
  const platform = useWebCoursePlatform();
  const identity = typeof account?.email === "string" ? account.email : "";
  const scope = useRef(null), control = useRef(null);
  if (scope.current?.identity !== identity || scope.current?.platform !== platform) scope.current = { identity, platform };
  const current = scope.current;
  const [view, setView] = useState(null);
  useEffect(() => {
    if (platform !== "browser" || !identity) return;
    const support = getWebPushSupport(window, navigator);
    const controller = createWebPushController({ isCurrent: () => scope.current === current,
      onStatus: value => { if (scope.current === current) setView({ ...value, current, support: value.support || support }); } });
    control.current = { controller, current };
    setView({ current, support, phase: "idle", message: "", hasRegistration: controller.hasRegistration() });
    return () => { controller.dispose(); if (control.current?.controller === controller) control.current = null; };
  }, [platform, identity]);
  if (platform !== "browser" || !identity) return null;
  const shown = view?.current === current ? view : { support: "checking", phase: "idle", message: "", hasRegistration: false };
  const configured = /^[A-Za-z0-9_-]{80,100}$/.test(firebaseWebVapidKey);
  const working = shown.phase === "working";
  function act(action) {
    if (scope.current !== current || control.current?.current !== current) return;
    void control.current.controller[action]();
  }
  return <section className={styles.card} aria-labelledby="browser-push-title" aria-busy={working}>
    <h2 id="browser-push-title">Browser-Benachrichtigungen</h2>
    <p>Erhalte freiwillig Hinweise von Jagdlatein auf diesem Browser. Erst mit „Aktivieren“ wird Firebase Cloud Messaging von Google eingerichtet. Dabei werden technische Verbindungsdaten und eine Installationskennung übertragen. Dein Konto wird dafür nicht an Google übergeben.</p>
    <p className={styles.muted}>Die Systemerlaubnis entscheidest du selbst. Die Einstellung gilt für diesen Browser; andere Geräte bleiben unabhängig.</p>
    {!configured ? <p>Web-Benachrichtigungen werden noch eingerichtet.</p> : shown.support === "checking" ? <p role="status">Browser wird geprüft …</p> : shown.support === "unavailable" ? <p>Web-Benachrichtigungen stehen auf der veröffentlichten Website jagdlatein.de zur Verfügung.</p> : shown.support === "ios-home-screen" ? <p>Auf iPhone und iPad benötigst du eine unterstützte Web-App auf dem Home-Bildschirm. Öffne Jagdlatein dort und aktiviere die Benachrichtigungen erneut.</p> : shown.support === "unsupported" ? <p>Dieser Browser unterstützt Web-Benachrichtigungen noch nicht.</p> : shown.support === "denied" ? <p>Benachrichtigungen sind in den Browser- oder Systemeinstellungen blockiert. Du kannst sie dort für Jagdlatein wieder erlauben.</p> : null}
    <div className={styles.actions}>
      {configured && shown.support === "ready" && <button type="button" className={styles.secondaryButton} disabled={working || shown.phase === "active"} onClick={() => act("enable")}>Aktivieren</button>}
      {shown.hasRegistration && <button type="button" className={styles.secondaryButton} disabled={working} onClick={() => act("disable")}>Deaktivieren</button>}
    </div>
    {shown.message && <p role={shown.phase === "error" ? "alert" : "status"}>{shown.message}</p>}
  </section>;
}
