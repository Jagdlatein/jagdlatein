import {useEffect,useRef,useState} from 'react';
import {createNativePushPreferences} from '../lib/native-push-preferences';
import styles from '../styles/Account.module.css';

export default function NativePushPreferences({account}){
  const identity=account?.email||'';const scope=useRef(null);if(scope.current?.identity!==identity)scope.current={identity};const current=scope.current;
  const control=useRef(null),[view,setView]=useState(null);
  useEffect(()=>{
    if(!identity||!window.jagdlateinNativePush)return;
    const controller=createNativePushPreferences({isCurrent:()=>scope.current===current,onStatus:value=>{if(scope.current===current)setView(old=>({...old,...value,current}));}});
    control.current={controller,current};void controller.status();return()=>{controller.dispose();if(control.current?.controller===controller)control.current=null;};
  },[identity]);
  if(!view||view.current!==current)return null;
  function act(action){if(scope.current===current&&control.current?.current===current)void control.current.controller[action]();}
  return <section className={styles.card} aria-labelledby="apple-push-title" aria-busy={view.working===true}>
    <h2 id="apple-push-title">Apple-Benachrichtigungen</h2>
    <p>Aktiviere freiwillig Hinweise von Jagdlatein auf diesem iPhone oder iPad. Erst nach deiner Aktivierung wird Firebase Cloud Messaging eingerichtet. Google und Apples Pushdienst verarbeiten dafür Geräte- und Verbindungsdaten sowie eine Installationskennung. Deine Konto-E-Mail wird nicht an Firebase übergeben.</p>
    {view.checkingFailed?<button type="button" className={styles.secondaryButton} onClick={()=>act('status')}>Geräteprüfung wiederholen</button>:!view.supported?<p>Für diese App-Version sind Apple-Benachrichtigungen noch nicht vollständig eingerichtet. Verwende die dafür freigegebene neue Version, sobald sie verfügbar ist.</p>:<>
      <p>{view.linked?'Die Kontoverknüpfung wurde in dieser Ansicht bestätigt.':'Die iOS-Systemerlaubnis und die Verknüpfung mit diesem Lernkonto werden getrennt geprüft.'}</p>
      <div className={styles.actions}><button type="button" className={styles.secondaryButton} disabled={view.working===true} onClick={()=>act('enable')}>{view.linked||view.hasRegistration?'Verknüpfung prüfen':'Aktivieren'}</button></div>
    </>}
    {(view.enabled||view.linked||view.hasRegistration)&&<button type="button" className={styles.secondaryButton} disabled={view.working===true} onClick={()=>act('disable')}>Deaktivieren</button>}
    {view.message&&<p role={view.error?'alert':'status'}>{view.message}</p>}
  </section>;
}
