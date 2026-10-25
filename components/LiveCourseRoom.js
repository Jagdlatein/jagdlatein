import { useEffect, useRef, useState } from 'react';
import { academyDate } from '../lib/online-academy-view';
import styles from '../styles/LearningExperience.module.css';
import academy from '../styles/OnlineAcademy.module.css';

// A room URL is fetched only after the visitor explicitly loads this room.
// No conference request, camera request or third-party script runs on entry.
export default function LiveCourseRoom({ session, offer, canAct = () => true }) {
  const [room, setRoom] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(false), request = useRef(0), controller = useRef(null), activeRoom = useRef(null);
  const renderedRequest = request.current;
  function stop() {
    if (!mounted.current || !canAct()) return;
    if (!controller.current && !activeRoom.current) return;
    request.current++; controller.current?.abort(); controller.current = null; activeRoom.current = null;
    setRoom(null); setBusy(false);
  }
  useEffect(() => {
    mounted.current = true;
    const menu = document.querySelector('nav[aria-label="Seitennavigation"] > details');
    const menuChange = () => { if (menu?.open) stop(); };
    menu?.addEventListener('toggle', menuChange);
    menu?.addEventListener('jagdlatein-menu-visibility', menuChange);
    return () => { mounted.current = false; request.current++; controller.current?.abort(); activeRoom.current = null;
      menu?.removeEventListener('toggle', menuChange); menu?.removeEventListener('jagdlatein-menu-visibility', menuChange); };
  }, []);
  async function load() {
    if (!mounted.current || !canAct() || request.current !== renderedRequest || busy || activeRoom.current || controller.current) return;
    const ticket = ++request.current;
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    setBusy(true); setError('');
    const timeout = setTimeout(() => abort.abort(), 18000);
    try {
      const response = await fetch(`/api/online-academy/room?id=${encodeURIComponent(session.id)}`, { cache:'no-store', credentials:'same-origin', signal:abort.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Der Videoraum ist noch nicht verfügbar.');
      if (data.host !== 'meet.jit.si' || data.sessionId !== session.id || !/^jagdlatein-[a-f0-9-]{36}$/i.test(data.roomName) || !Number.isFinite(Date.parse(data.endsAt)) || Date.parse(data.endsAt) <= Date.now()) throw new Error('Der Videoraum konnte nicht geprüft werden.');
      if (!mounted.current || !canAct() || ticket !== request.current || abort.signal.aborted) return;
      activeRoom.current = data; setRoom(data);
    } catch (cause) {
      if (mounted.current && canAct() && ticket === request.current) setError(abort.signal.aborted ? 'Der Raumabruf hat zu lange gedauert. Bitte erneut versuchen.' : cause.message);
    } finally { clearTimeout(timeout); if (mounted.current && canAct() && ticket === request.current) { controller.current = null; setBusy(false); } }
  }
  useEffect(() => {
    if (!room) return;
    const current = room; let running = false;
    const abort = new AbortController();
    async function recheck() {
      if (running || !mounted.current || !canAct() || activeRoom.current !== current) return;
      if (Date.now() >= Date.parse(current.endsAt)) { stop(); setError('Dieser Unterrichtstermin ist beendet.'); return; }
      running = true;
      const timeout = setTimeout(() => abort.abort(), 18000);
      try {
        const response = await fetch(`/api/online-academy/room?id=${encodeURIComponent(session.id)}`, {cache:'no-store',credentials:'same-origin',signal:abort.signal});
        const next = await response.json();
        if (!mounted.current || !canAct() || activeRoom.current !== current) return;
        if (!response.ok || next.roomName !== current.roomName || next.sessionId !== session.id || next.endsAt !== current.endsAt) { stop(); setError('Der Raumzugang hat sich geändert. Bitte den Termin erneut öffnen.'); }
      } catch { if (mounted.current && canAct() && activeRoom.current === current) { stop(); setError('Der Raumzugang konnte nicht erneut geprüft werden. Bitte erneut laden.'); } }
      finally { clearTimeout(timeout); running = false; }
    }
    const interval = setInterval(recheck, 30000);
    const end = setTimeout(recheck, Math.max(0, Math.min(2147483647, Date.parse(current.endsAt) - Date.now())));
    const visible = () => { if (document.visibilityState === 'visible') void recheck(); };
    document.addEventListener('visibilitychange', visible);
    return () => { abort.abort(); clearInterval(interval); clearTimeout(end); document.removeEventListener('visibilitychange', visible); };
  }, [room, session.id]);
  const src = room ? `https://meet.jit.si/${encodeURIComponent(room.roomName)}#config.startWithAudioMuted=true&config.startWithVideoMuted=true&config.prejoinConfig.enabled=true&config.disableInviteFunctions=true&config.disableDeepLinking=true` : null;
  return <section className={styles.panel} aria-labelledby="academy-room-title">
    <p className={academy.meta}>{offer?.title} · {academyDate(session.starts_at)} bis {academyDate(session.ends_at)} · Schweizer Zeit</p>
    <h2 id="academy-room-title">{session.title}</h2>
    {!room ? <>
      <p>Der Unterricht findet hier in einem eingebetteten Jitsi-Videoraum statt. Mit „Videoraum laden“ verbindet sich dein Browser mit meet.jit.si. Dabei erhält der Konferenzdienst deine IP-Adresse und Browserdaten. Einen sichtbaren Namen, Chat sowie freigegebenes Bild, Ton oder Bildschirm erhält der Dienst erst bei deiner Nutzung. Deine Jagdlatein-E-Mail und dein Lernfortschritt werden nicht übergeben.</p>
      <p>Kamera und Mikrofon beginnen stumm. Prüfe die Vorschau und erteile Gerätefreigaben selbst im Browser. Die Lehrperson muss den Raum bei Jitsi starten; dazu kann eine Anmeldung beim Konferenzdienst erforderlich sein. Der Raum öffnet frühestens 15 Minuten vor Unterrichtsbeginn.</p>
      <button type="button" className={styles.primary} disabled={busy} onClick={load}>{busy ? 'Raum wird geprüft …' : 'Videoraum laden'}</button>
    </> : <>
      <p role="status">Die Raumansicht ist geöffnet. Der tatsächliche Beitritt erfolgt in der Videovorschau.</p>
      <iframe className={academy.classroom} title={`Live-Unterricht: ${session.title}`} src={src} allow="camera https://meet.jit.si; microphone https://meet.jit.si; fullscreen https://meet.jit.si; display-capture https://meet.jit.si" referrerPolicy="no-referrer" allowFullScreen />
      <button type="button" className={styles.secondary} onClick={() => { if (request.current === renderedRequest && activeRoom.current === room) stop(); }}>Videoraum schließen</button>
    </>}
    {error && <p role="alert" className={styles.note}>{error}</p>}
    <p className={styles.muted}>Öffnest du das Menü oder verlässt den Termin, wird die eingebettete Verbindung beendet. Jagdlatein legt keine Unterrichtsaufzeichnung an.</p>
    <details className={styles.sources}><summary>Videodienst und Datenschutz</summary><p><a href="https://jitsi.org/meet-jit-si-privacy/" target="_blank" rel="noreferrer">Datenschutzhinweise von meet.jit.si</a> · <a href="https://jitsi.github.io/handbook/docs/user-guide/user-guide-join-jitsi-meeting/" target="_blank" rel="noreferrer">Jitsi: Beitreten und Lehrperson-Anmeldung</a></p></details>
  </section>;
}
