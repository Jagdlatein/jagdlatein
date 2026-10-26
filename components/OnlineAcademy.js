import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import LearningToolLayout from './LearningToolLayout';
import PageMenu, { closePageMenu, openPageMenu } from './PageMenu';
import useWebCoursePlatform from '../hooks/useWebCoursePlatform';
import useAccountOverview from '../hooks/useAccountOverview';
import { AccountError, ProgressError } from './AccountLayout';
import { learningCategoryDetails } from '../lib/learning-categories';
import { getMyCoursesView } from '../lib/my-courses';
import { academyViews, academyLearningStates, readAcademySelection, academyQuery, academyDate, makeAcademyCalendar } from '../lib/online-academy-view';
import { getSessionPhase } from '../lib/online-academy';
import LiveCourseRoom from './LiveCourseRoom';
import OnlineAcademyAdmin from './OnlineAcademyAdmin';
import styles from '../styles/LearningExperience.module.css';
import academy from '../styles/OnlineAcademy.module.css';

export default function OnlineAcademy({ catalog = [] }) {
  const platform = useWebCoursePlatform();
  return <LearningToolLayout title="Onlinekurse" description="Selbstständig lernen und Live-Unterricht von Jagdschulen besuchen." icon="video" headingOnly robots="noindex,nofollow">
    {platform==='checking' ? <p role="status">Der Web-Kursbereich wird vorbereitet …</p> : platform==='native' ? <section className={styles.panel}><h2>Onlinekurse im Webbrowser</h2><p>Dieser zusätzliche Kursbereich ist für den Webbrowser vorgesehen. Öffne jagdlatein.de/online-kurse in Safari, Chrome, Edge oder Firefox. Die vorhandenen Lernkurse bleiben in dieser App verfügbar.</p><Link href="/lernen" className={styles.primary}>Zu den Lernkategorien</Link></section> : <AcademyWorkspace catalog={catalog} />}
  </LearningToolLayout>;
}

function AcademyWorkspace({catalog}) {
  const router=useRouter(); const selection=readAcademySelection(router);
  const {account,progress,accountError,progressError,loading,progressLoading,reload}=useAccountOverview();
  const [resources,setResources]=useState(null), [resourceError,setResourceError]=useState(''), [resourceLoading,setResourceLoading]=useState(true), [revision,setRevision]=useState(0);
  const [navigationError,setNavigationError]=useState(''), [limit,setLimit]=useState(12), [now,setNow]=useState(null);
  const mounted=useRef(false), request=useRef(0), pending=useRef(null), heading=useRef(null);
  const readViewKey=()=>JSON.stringify([router.isReady,router.asPath,router.query]);
  const key=readViewKey();
  const currentView=useRef({key}); if(currentView.current.key!==key) currentView.current={key}; const origin=currentView.current;
  const isCurrent=()=>{
    if(!mounted.current || currentView.current!==origin)return false;
    const liveKey=readViewKey();
    if(liveKey!==key){currentView.current={key:liveKey};return false;}
    return router.isReady===true;
  };
  const focus=()=>{closePageMenu(); heading.current?.focus?.({preventScroll:true}); heading.current?.scrollIntoView?.({block:'start',behavior:'auto'});};
  useEffect(()=>{mounted.current=true;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),30000);return()=>{mounted.current=false;request.current++;pending.current=null;clearInterval(timer);};},[]);
  useEffect(()=>{
    if(!router.isReady) return;
    setLimit(12);setNavigationError('');
    if(selection?.invalid) { const timer=setTimeout(()=>{if(isCurrent())openPageMenu('academy-views');},0);return()=>clearTimeout(timer); }
    focus();
  },[origin]);
  useEffect(()=>{
    if(!account || accountError) {setResources(null);setResourceLoading(false);return;}
    const controller=new AbortController(); let active=true;
    setResources(null);setResourceLoading(true);setResourceError('');
    const timeout=setTimeout(()=>controller.abort(),18000);
    const manage=selection?.view==='verwaltung';
    async function load(){
      try {
        const response=await fetch(`/api/online-academy${manage?'?scope=manage':''}`,{cache:'no-store',credentials:'same-origin',signal:controller.signal}); const data=await response.json();
        if(!response.ok)throw new Error(data.message||'Die Kursangebote konnten nicht geladen werden.');
        if(!Array.isArray(data.schools)||!Array.isArray(data.offers)||!Array.isArray(data.sessions)||typeof data.canManage!=='boolean')throw new Error('Die Kursangebote konnten nicht geprüft werden.');
        if(active&&!controller.signal.aborted)setResources({...data,identity:account.email,manage});
      }catch(error){if(active)setResourceError(controller.signal.aborted?'Die Kursangebote brauchen zu lange. Bitte erneut laden.':error.message);}
      finally{clearTimeout(timeout);if(active)setResourceLoading(false);}
    }
    void load();return()=>{active=false;controller.abort();clearTimeout(timeout);};
  },[account?.email,account?.admin,accountError,selection?.view==='verwaltung',revision]);
  async function navigate(changes){
    if(!isCurrent())return;
    const query=academyQuery(router.query,changes);const target=JSON.stringify(query);
    if(target===JSON.stringify(router.query)&&pending.current===null){focus();return;}
    const ticket=++request.current;pending.current=ticket;setNavigationError('');
    try{const accepted=await router.push({pathname:'/online-kurse',query},undefined,{shallow:true,scroll:false});if(accepted===false&&isCurrent()&&ticket===request.current)setNavigationError('Die Auswahl wurde nicht übernommen. Bitte erneut wählen.');}
    catch(error){if(isCurrent()&&ticket===request.current&&!error?.cancelled)setNavigationError('Die Auswahl konnte nicht geöffnet werden. Bitte erneut wählen.');}
    finally{if(pending.current===ticket)pending.current=null;}
  }
  function downloadCalendar(session,offer){
    if(!isCurrent())return;
    try{const blob=new Blob([makeAcademyCalendar(session,offer)],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='jagdlatein-live-unterricht.ics';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    catch{setNavigationError('Der Kalendereintrag konnte nicht erstellt werden.');}
  }
  if(loading)return <p role="status">Dein Kurskonto wird geladen …</p>;
  if(accountError)return <AccountError error={accountError} next="/online-kurse" onRetry={reload}/>;
  if(!account)return <p>Bitte melde dich für den Kursbereich an.</p>;
  const currentResources=resources?.identity===account.email&&resources.manage===(selection?.view==='verwaltung')?resources:null;
  const data=currentResources||{schools:[],offers:[],sessions:[],canManage:account.admin===true};
  const courses=getMyCoursesView(catalog,progress,{category:selection?.category||'all',status:selection?.learningStatus||'all'});
  const listSelection=selection&&!selection.invalid&&selection.view==='kurse'&&!selection.offerId;
  const learningState=listSelection?academyLearningStates.find(item=>item.status===selection.learningStatus):null;
  const approvedSchools=new Set(data.schools.filter(item=>item.status==='approved').map(item=>item.id));
  const offers=data.offers.filter(item=>item.status==='published'&&approvedSchools.has(item.school_id)&&(!selection||selection.category==='all'||item.category_slug===selection.category));
  const visibleOffers=new Set(offers.map(item=>item.id));
  const sessions=data.sessions.filter(item=>item.status==='scheduled'&&visibleOffers.has(item.offer_id)).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
  const selectedOffer=selection?.offerId?offers.find(item=>item.id===selection.offerId):null;
  const selectedSession=selection?.sessionId?sessions.find(item=>item.id===selection.sessionId):null;
  const schoolFor=offer=>data.schools.find(item=>item.id===offer?.school_id);
  const offerFor=session=>offers.find(item=>item.id===session?.offer_id);
  const displayTitle=selection?.view==='kurse'?'Selbstlernen':academyViews.find(item=>item.id===selection?.view)?.title||'Kursbereich wählen';
  return <>
    <PageMenu title="Onlinekurse – Auswahl" openInitially={selection?.invalid===true} initialFocusId="academy-views">
      <div id="academy-views" className={academy.choices} tabIndex={-1}>{academyViews.filter(item=>item.id!=='verwaltung'||data.canManage).map(item=><button type="button" className={academy.choice} key={item.id} aria-pressed={selection?.view===item.id} onClick={()=>navigate({ansicht:item.id})}>{item.title}</button>)}</div>
      {selection&&!selection.invalid&&selection.view!=='verwaltung'&&<><h3>Kategorie</h3><div className={academy.choices}><button type="button" className={academy.choice} aria-pressed={selection.category==='all'} onClick={()=>navigate({ansicht:selection.view,lernstand:learningState?.value})}>Alle Kategorien</button>{learningCategoryDetails.map(item=><button type="button" className={academy.choice} key={item.slug} aria-pressed={selection.category===item.slug} onClick={()=>navigate({ansicht:selection.view,kategorie:item.slug,lernstand:learningState?.value})}>{item.title}</button>)}</div></>}
      {listSelection&&<section aria-labelledby="academy-learning-status-title"><h3 id="academy-learning-status-title">Lernstand</h3><div className={academy.choices} role="group" aria-label="Kurse nach Lernstand" aria-controls="academy-self-learning">{academyLearningStates.map(item=><button type="button" className={academy.choice} key={item.status} aria-pressed={selection.learningStatus===item.status} onClick={()=>navigate({ansicht:'kurse',kategorie:selection.category,lernstand:item.value})}>{item.title}</button>)}</div></section>}
      {navigationError&&<p className={styles.note} role="alert">{navigationError}</p>}
      <button type="button" className={styles.secondary} onClick={()=>{if(isCurrent()){setRevision(value=>value+1);focus();}}}>Angebote aktualisieren</button>
    </PageMenu>
    <h2 ref={heading} tabIndex={-1} id="academy-content-title">{displayTitle}</h2>
    {!selection||selection.invalid?<p className={styles.note}>{router.isReady?'Diese Auswahl ist nicht verfügbar. Wähle unten im Menü Selbstlernen, Live-Unterricht oder Jagdschulen.':'Die Kursauswahl wird geladen …'}</p>:<>
      {selection.view==='kurse'&&<>
        {selection.offerId ? resourceLoading?<p role="status">Das Kursangebot wird geladen …</p>:selectedOffer?<section className={styles.panel}><p className={academy.meta}>{schoolFor(selectedOffer)?.name}</p><h3>{selectedOffer.title}</h3><p>{selectedOffer.description}</p><h3>Vorbereitung</h3>{selectedOffer.module_ids.length?<ol>{selectedOffer.module_ids.map(id=>catalog.find(item=>item.id===id)).filter(Boolean).map(item=><li key={item.id}><Link href={item.href}>{item.title}</Link></li>)}</ol>:<p>Für dieses Angebot sind noch keine Selbstlernmodule zugeordnet.</p>}<h3>Live-Termine</h3>{sessions.filter(item=>item.offer_id===selectedOffer.id).length?sessions.filter(item=>item.offer_id===selectedOffer.id).map(item=><p key={item.id}><button type="button" className={styles.secondary} onClick={()=>navigate({ansicht:'live',termin:item.id})}>{item.title} · {academyDate(item.starts_at)}</button></p>):<p>Für dieses Angebot ist noch kein Live-Termin veröffentlicht.</p>}</section>:<p className={styles.note}>Dieses Kursangebot ist nicht veröffentlicht oder passt nicht zur gewählten Kategorie.</p>:<>
          <p>Die vorhandenen Jagdlatein-Lernkurse und veröffentlichte Angebote von Jagdschulen an einem Ort. Kategorie und Lernform wählst du unten im Menü.</p>
          {offers.length>0&&<section aria-label="Kursangebote der Jagdschulen" className={academy.list}>{offers.map(item=><article className={academy.row} key={item.id}><p className={academy.meta}>{schoolFor(item)?.name}</p><h3>{item.title}</h3><p>{item.description}</p><button className={styles.secondary} type="button" onClick={()=>navigate({ansicht:'kurse',kategorie:selection.category,angebot:item.id})}>Kursangebot öffnen</button></article>)}</section>}
          <section id="academy-self-learning" aria-label="Jagdlatein-Selbstlernkurse">
            <h3>Jagdlatein-Lernkurse</h3>
            <p className={styles.muted}>Der gespeicherte Fortschritt zählt beantwortete Quizfragen, keine gelesenen Lektionen und keine Prüfungsqualifikation.</p>
            {progressError?<ProgressError error={progressError} onRetry={reload}/>:progressLoading?<p role="status">Gespeicherter Fortschritt wird geladen …</p>:<>
              <p role="status" aria-live="polite">{courses.rows.length} {courses.rows.length===1?'Kurs':'Kurse'} in deiner Auswahl · {learningState?.title}</p>
              {courses.rows.length?<div className={academy.list}>{courses.rows.slice(0,limit).map(row=><article className={academy.row} key={row.course.id}><p className={academy.meta}>{row.course.categoryTitle}</p><h3>{row.course.title}</h3><p>{row.course.description}</p><p className={academy.meta}>{row.status==='completed'?'Wissenscheck abgeschlossen':row.status==='in_progress'?'Begonnen':'Noch offen'}{row.answered!==null&&row.total!==null?` · ${row.answered}/${row.total} Fragen beantwortet`:''}{row.bestPercent!==null?` · bestes Ergebnis ${row.bestPercent} % richtig`:''}</p><Link className={styles.secondary} href={row.course.href}>{row.status==='in_progress'?'Kurs weiterlernen':'Kurs öffnen'}</Link></article>)}</div>:<p>Für diese Auswahl sind keine Jagdlatein-Lernkurse mit diesem Lernstand vorhanden.</p>}
              {limit<courses.rows.length&&<button type="button" className={styles.secondary} onClick={()=>{if(isCurrent())setLimit(value=>value+12);}}>Weitere Kurse</button>}
            </>}
          </section>
        </>}
      </>}
      {selection.view==='live'&&(resourceLoading?<p role="status">Live-Termine werden geladen …</p>:selection.sessionId?selectedSession?<LiveCourseRoom key={`${key}:${selectedSession.id}`} session={selectedSession} offer={offerFor(selectedSession)} canAct={isCurrent}/>:<p className={styles.note}>Dieser Termin ist nicht mehr veröffentlicht oder passt nicht zur gewählten Kategorie.</p>:<><p>Unterricht mit einer Lehrperson direkt im Browser. Alle angezeigten Uhrzeiten gelten für Europe/Zurich.</p>{sessions.length?<div className={academy.list}>{sessions.map(item=>{const phase=now===null?'upcoming':getSessionPhase(item,now);return <article className={academy.row} key={item.id}><p className={academy.meta}>{schoolFor(offerFor(item))?.name} · {offerFor(item)?.title}</p><h3>{item.title}</h3><p>{academyDate(item.starts_at)} – {academyDate(item.ends_at)}</p><p className={academy.status}>{phase==='ended'?'Beendet':['opening','live'].includes(phase)?'Raumzeit läuft':'Geplant'}</p><div className={styles.actions}><button type="button" className={styles.secondary} onClick={()=>navigate({ansicht:'live',kategorie:selection.category,termin:item.id})}>Termin öffnen</button><button type="button" className={styles.secondary} onClick={()=>downloadCalendar(item,offerFor(item))}>Kalendereintrag</button></div></article>;})}</div>:<p className={styles.note}>Noch keine Live-Termine veröffentlicht. Hier erscheinen bestätigte Termine, sobald eine Jagdschule ein freigegebenes Angebot mit Unterrichtstermin hat.</p>}</>)}
      {selection.view==='schulen'&&(resourceLoading?<p role="status">Anbieterprofile werden geladen …</p>:<><p>Jagdschulen können mit einem freigegebenen Anbieterprofil eigene Kursangebote und Live-Unterricht auf Jagdlatein anbieten. Interessierte Schulen können sich an info@jagdlatein.de wenden. Der Betreiber prüft und veröffentlicht die Profile und Angebote.</p><div className={academy.list}>{data.schools.filter(item=>item.status==='approved').map(item=><article className={academy.row} key={item.id}><h3>{item.name}</h3><p>{item.description}</p>{item.website&&<p className={academy.meta}>Webseite: {item.website}</p>}{offers.filter(offer=>offer.school_id===item.id).map(offer=><p key={offer.id}><button type="button" className={styles.secondary} onClick={()=>navigate({ansicht:'kurse',angebot:offer.id})}>{offer.title}</button></p>)}</article>)}</div></>)}
      {selection.view==='verwaltung'&&(resourceLoading?<p role="status">Verwaltung wird geladen …</p>:currentResources?.canManage?<OnlineAcademyAdmin key={`${key}:${revision}`} data={currentResources} catalog={catalog} canAct={isCurrent} onSaved={()=>setRevision(value=>value+1)}/>:<p className={styles.note}>Die Kursverwaltung ist dem Betreiber vorbehalten.</p>)}
    </>}
    {resourceError&&<div className={styles.note} role="alert"><p>{resourceError}</p><button type="button" className={styles.secondary} onClick={()=>{if(isCurrent())setRevision(value=>value+1);}}>Angebote erneut laden</button></div>}
    {navigationError&&<p role="alert" className={styles.note}>{navigationError}</p>}
  </>;
}
