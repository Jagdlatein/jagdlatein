import { useEffect, useRef, useState } from 'react';
import { academyUtcInput } from '../lib/online-academy-view';
import { learningCategoryDetails } from '../lib/learning-categories';
import styles from '../styles/LearningExperience.module.css';
import academy from '../styles/OnlineAcademy.module.css';

const labels = {pending:'Zur Prüfung',approved:'Freigegeben',rejected:'Zurückgestellt',draft:'Entwurf',submitted:'Zur Prüfung',published:'Veröffentlicht',scheduled:'Geplant',cancelled:'Abgesagt'};
const blanks = {
  school: () => ({name:'',description:'',website:'',status:'pending'}),
  offer: () => ({school_id:'',title:'',description:'',category_slug:learningCategoryDetails[0].slug,module_ids:[],status:'draft'}),
  session: () => ({offer_id:'',title:'',starts_at:'',ends_at:'',status:'scheduled'}),
};
function dateInput(value) { return value ? String(value).slice(0,16) : ''; }
function fields(action, record) {
  const keys = {school:['id','name','description','website','status'],offer:['id','school_id','title','description','category_slug','module_ids','status'],session:['id','offer_id','title','starts_at','ends_at','status']}[action];
  return Object.fromEntries(keys.filter(key => record[key] !== undefined).map(key => [key,record[key]]));
}

export default function OnlineAcademyAdmin({ data, catalog, onSaved, canAct = () => true }) {
  const [action,setAction] = useState('school');
  const [draft,setDraft] = useState(blanks.school);
  const draftRef=useRef(draft); draftRef.current=draft;
  const [busy,setBusy] = useState(false), [message,setMessage] = useState('');
  const session = useRef({}); const current = session.current;
  const mounted = useRef(false), saving = useRef(false), controller = useRef(null);
  // The parent remounts this editor on a committed platform view change.
  // Async completion and retained form handlers must not write into its successor.
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; session.current = {}; controller.current?.abort(); }; }, []);
  function valid() { return mounted.current && canAct() && session.current === current && !saving.current; }
  function change(key,value) { if (valid()) { const next={...draftRef.current,[key]:typeof value==='function'?value(draftRef.current[key]):value}; draftRef.current=next; setDraft(next); } }
  function select(next,record) {
    if (!valid()) return;
    session.current = {}; setAction(next); setDraft(record ? fields(next,record) : blanks[next]()); setMessage('');
  }
  async function save(event) {
    event.preventDefault(); if (!valid()) return;
    saving.current = true; setBusy(true); setMessage('');
    const abort = new AbortController(); controller.current = abort; const timeout = setTimeout(() => abort.abort(),18000);
    try {
      const record = fields(action,draftRef.current);
      if (action === 'session') {
        // The form explicitly says UTC, avoiding an invisible DST/local-zone conversion.
        for (const key of ['starts_at','ends_at']) record[key]=academyUtcInput(dateInput(record[key]));
      }
      const response=await fetch('/api/online-academy',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,record}),signal:abort.signal});
      const result=await response.json();
      if (!response.ok) throw new Error(result.message || 'Das Angebot konnte nicht gespeichert werden.');
      if (!mounted.current || !canAct() || session.current !== current) return;
      setMessage('Gespeichert. Die Übersicht wird neu geladen.'); onSaved();
    } catch(error) { if (mounted.current && canAct() && session.current === current) setMessage(abort.signal.aborted ? 'Die Speicheranfrage hat zu lange gedauert. Lade die Übersicht neu und prüfe den Stand, bevor du erneut speicherst.' : error.message); }
    finally { clearTimeout(timeout); saving.current=false; if (mounted.current && session.current === current) setBusy(false); }
  }
  const collections={school:data.schools,offer:data.offers,session:data.sessions};
  return <section aria-labelledby="academy-management-title">
    <h2 id="academy-management-title">Kursangebote verwalten</h2>
    <p>Nur der Betreiber kann Anbieter, Kursangebote und Termine bearbeiten. Eine Schule hat dadurch keinen Zugriff auf Lernkonten oder Zahlungen. Erst freigegebene Schulen mit veröffentlichtem Kursangebot erscheinen für Lernende.</p>
    <label className={styles.field}>Bearbeiten<select value={action} disabled={busy} onChange={event=>select(event.target.value)}><option value="school">Jagdschule</option><option value="offer">Kursangebot</option><option value="session">Live-Termin</option></select></label>
    <div className={academy.choices}><button className={academy.choice} type="button" disabled={busy} onClick={()=>select(action)}>Neu anlegen</button>{collections[action].map(item=><button type="button" className={academy.choice} disabled={busy} key={item.id} onClick={()=>select(action,item)} aria-pressed={draft.id===item.id}>{item.name||item.title}<small>{labels[item.status]}</small></button>)}</div>
    <form className={academy.editor} onSubmit={save}>
      <h3>{draft.id?'Eintrag bearbeiten':'Neuer Eintrag'}</h3>
      <fieldset disabled={busy}>
        {action==='school' ? <>
          <label className={styles.field}>Schulname<input required minLength={2} maxLength={120} value={draft.name||''} onChange={event=>change('name',event.target.value)} /></label>
          <label className={styles.field}>Webseite<input type="url" maxLength={500} placeholder="https://…" value={draft.website||''} onChange={event=>change('website',event.target.value)} /></label>
        </> : <>
          <label className={styles.field}>{action==='offer'?'Jagdschule':'Kursangebot'}<select required value={draft[action==='offer'?'school_id':'offer_id']||''} onChange={event=>change(action==='offer'?'school_id':'offer_id',event.target.value)}><option value="">Bitte wählen</option>{(action==='offer'?data.schools:data.offers).map(item=><option key={item.id} value={item.id}>{item.name||item.title} · {labels[item.status]}</option>)}</select></label>
          <label className={styles.field}>Titel<input required maxLength={160} value={draft.title||''} onChange={event=>change('title',event.target.value)} /></label>
        </>}
        {action!=='session' && <label className={styles.field}>Beschreibung<textarea required maxLength={2000} value={draft.description||''} onChange={event=>change('description',event.target.value)} /></label>}
        {action==='offer' && <>
          <label className={styles.field}>Kategorie<select value={draft.category_slug} onChange={event=>change('category_slug',event.target.value)}>{learningCategoryDetails.map(item=><option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
          <p>Vorhandene Lerneinheiten als Vorbereitung zuordnen. Die vollständigen Inhalte und fachlichen Quellen bleiben in ihren Kursen.</p>
          <div className={academy.moduleChoices}>{catalog.filter(item=>item.categorySlug===draft.category_slug || draft.module_ids.includes(item.id)).map(item=><label key={item.id}><input type="checkbox" checked={draft.module_ids.includes(item.id)} onChange={event=>{const checked=event.target.checked;change('module_ids',ids=>checked?(ids.includes(item.id)?ids:[...ids,item.id]):ids.filter(id=>id!==item.id));}} />{item.title}</label>)}</div>
        </>}
        {action==='session' && <>
          <p>Beginn und Ende in <strong>UTC</strong> eintragen. Im Kurs werden die Termine in Schweizer Zeit angezeigt. Nach der Sommerzeit entspricht 18:00 Uhr Schweiz 17:00 Uhr UTC; während der Sommerzeit 16:00 Uhr UTC.</p>
          <label className={styles.field}>Beginn (UTC)<input type="datetime-local" required step="60" value={dateInput(draft.starts_at)} onChange={event=>change('starts_at',event.target.value)} /></label>
          <label className={styles.field}>Ende (UTC)<input type="datetime-local" required step="60" value={dateInput(draft.ends_at)} onChange={event=>change('ends_at',event.target.value)} /></label>
          <p>Für jeden neuen Termin wird ein eigener zufälliger Jitsi-Raum angelegt. Veröffentliche nur mit der Lehrperson vereinbarte Termine. Die Lehrperson startet den Raum selbst bei Jitsi.</p>
        </>}
        <label className={styles.field}>Status<select value={draft.status} onChange={event=>change('status',event.target.value)}>{(action==='school'?['pending','approved','rejected']:action==='offer'?['draft','submitted','published']:['scheduled','cancelled']).map(value=><option key={value} value={value}>{labels[value]}</option>)}</select></label>
        <button type="submit" className={styles.primary}>{busy?'Wird gespeichert …':'Speichern'}</button>
      </fieldset>
    </form>
    {message && <p role="status" className={styles.note}>{message}</p>}
  </section>;
}
