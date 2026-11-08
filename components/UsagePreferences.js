import { useEffect, useRef, useState } from "react";
import { usagePreferenceClient, usageBrowserAllowed, usagePrivacyAllows } from "../lib/usage-analytics";
import styles from "../styles/Account.module.css";

export default function UsagePreferences({ account, isCurrent = () => true }) {
  const [state, setState] = useState(() => usagePreferenceClient.getSnapshot());
  const [native, setNative] = useState(false);
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const current = useRef({ account, isCurrent }); current.current = { account, isCurrent };
  const mounted = useRef(false);
  const requestOwner = useRef(null);
  const valid = captured => {
    try { return mounted.current && current.current.account === captured && current.current.isCurrent() !== false; } catch { return false; }
  };
  useEffect(() => {
    mounted.current = true; const captured = account, owner = {}; requestOwner.current = owner;
    const guard = () => valid(captured);
    setNative(!usageBrowserAllowed(window));
    setDeviceBlocked(!usagePrivacyAllows(window));
    const unsubscribe = usagePreferenceClient.subscribe(() => { if (guard()) { setState(usagePreferenceClient.getSnapshot()); setDeviceBlocked(!usagePrivacyAllows(window)); } });
    if (account?.email && guard()) void usagePreferenceClient.load({ isCurrent: guard, owner });
    else setState(usagePreferenceClient.getSnapshot());
    return () => { mounted.current = false; unsubscribe(); usagePreferenceClient.stop({ owner }); };
  }, [account]);
  if (!account?.email) return null;
  const captured = account, revision = state.revision;
  const guard = () => valid(captured) && usagePreferenceClient.getSnapshot().revision === revision;
  const change = event => {
    if (!guard() || state.loading || !state.known) return;
    const enabled = event.target.checked;
    void usagePreferenceClient.setEnabled(enabled, { accountKey: state.accountKey, revision, isCurrent: () => valid(captured), owner: requestOwner.current });
  };
  const retry = () => {
    if (!guard()) return;
    if (state.known && typeof state.pendingEnabled === "boolean") void usagePreferenceClient.setEnabled(state.pendingEnabled, { accountKey: state.accountKey, revision, isCurrent: () => valid(captured), owner: requestOwner.current });
    else void usagePreferenceClient.load({ isCurrent: () => valid(captured), owner: requestOwner.current });
  };
  const saveOff = () => { if (guard() && state.known && !state.loading) void usagePreferenceClient.setEnabled(false, { accountKey: state.accountKey, revision, isCurrent: () => valid(captured), owner: requestOwner.current }); };
  return <section className={styles.section} aria-labelledby="usage-preferences-title" data-usage-private>
    <h2 id="usage-preferences-title">Website-Statistik</h2>
    <p>Du kannst freiwillig helfen, die Website zu verbessern. Erfasst werden nur zusammengezählte Seitenaufrufe und Bedienaktionen in ausgewählten Lernbereichen – keine Eingaben, Notizen, Suchtexte oder Fotos.</p>
    <label><input type="checkbox" checked={state.known && state.serverEnabled && !usagePreferenceClient.isBlocked()} disabled={!state.known || state.loading} onChange={change} /> Freiwillige Website-Statistik erlauben</label>
    {native && <p>Gilt für die Website; diese App sendet dafür keine Klickereignisse.</p>}
    {!native && deviceBlocked && <p>Auf diesem Gerät ist die Messung ausgeschaltet. Browser-Datenschutzeinstellungen werden beachtet.</p>}
    {state.loading && <p role="status">Einstellung wird geprüft …</p>}
    {state.error && <div role="alert"><p>Die Einstellung konnte nicht bestätigt werden. Die Messung bleibt auf diesem Gerät ausgeschaltet.</p><button type="button" className={styles.secondaryButton} onClick={retry}>Erneut versuchen</button></div>}
    {!state.loading && !state.error && state.known && state.serverEnabled && usagePreferenceClient.isBlocked() && <p>Auf diesem Gerät ist die Messung ausgeschaltet. <button type="button" className={styles.secondaryButton} onClick={saveOff}>Ausschalten auch im Konto speichern</button></p>}
    <p>Du kannst jederzeit ausschalten. Das stoppt die Erfassung auf diesem Gerät sofort, auch wenn das Speichern gerade fehlschlägt. Bereits zusammengezählte, keinem Konto zugeordnete Werte bleiben erhalten. <a href="/datenschutz">Datenschutz</a></p>
  </section>;
}
