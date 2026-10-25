export const NATIVE_PUSH_STORAGE_KEY='jagdlatein.native-push.v1';
const FID=/^[A-Za-z0-9_-]{22}$/;
const controls=new Set();
// UI deadlines never release an already-started native/HTTP operation. A late
// bridge preflight can still reach the SDK, so its real Promise must settle
// before another account view is allowed to touch the same device.
let deviceTail=Promise.resolve();
function reserveDeviceOperation(){
  const previous=deviceTail.catch(()=>{});
  let release;
  const done=new Promise(resolve=>{release=resolve;});
  deviceTail=previous.then(()=>done);
  const pending=[];let released=false;
  return {
    wait:previous,
    track(value){const promise=Promise.resolve(value);pending.push(promise);return promise;},
    release(){if(released)return;released=true;Promise.allSettled(pending).then(release);},
  };
}
function storage(){try{return window.localStorage;}catch{return null;}}
export function readNativePushRegistration(){try{const raw=storage()?.getItem(NATIVE_PUSH_STORAGE_KEY);if(!raw||raw.length>256)return null;const value=JSON.parse(raw);return value?.version===1&&value.platform==='ios'&&value.kind==='fid'&&typeof value.registration==='string'&&FID.test(value.registration)?value.registration:null;}catch{return null;}}
function remember(registration){try{const store=storage();if(!store)return false;store.setItem(NATIVE_PUSH_STORAGE_KEY,JSON.stringify({version:1,platform:'ios',kind:'fid',registration}));return readNativePushRegistration()===registration;}catch{return false;}}
function forget(){try{storage()?.removeItem(NATIVE_PUSH_STORAGE_KEY);}catch{}}
function bridge(){return typeof window!=='undefined'?window.jagdlateinNativePush:null;}
async function bounded(promise,signal){
  return new Promise((resolve,reject)=>{
    const abort=()=>finish(reject,new Error('Vorgang abgebrochen.'));
    let timeout;const finish=(fn,value)=>{clearTimeout(timeout);signal?.removeEventListener('abort',abort);fn(value);};
    if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});
    timeout=setTimeout(()=>finish(reject,Object.assign(new Error('Die Einrichtung braucht zu lange. Bitte erneut prüfen.'),{code:'PUSH_TIMEOUT'})),45000);
    Promise.resolve(promise).then(value=>finish(resolve,value),error=>finish(reject,error));
  });
}
async function post(path,registration,signal,lease){
  const response=await bounded(lease.track(fetch(path,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({registration,kind:'fid',platform:'ios'}),signal})),signal);
  const result=await bounded(lease.track(response.json()),signal);if(!response.ok||result.success!==true)throw new Error(result.error||'Die Geräteverknüpfung konnte nicht bestätigt werden.');
}
export function createNativePushPreferences({isCurrent=()=>true,onStatus=()=>{}}={}){
  let alive=true,busy=false,revision=0,abort=null;
  const active=ticket=>alive&&isCurrent()&&revision===ticket;
  const publish=(ticket,value)=>{if(active(ticket))onStatus(value);};
  const controller={
    async status(){
      if(!alive||!isCurrent()||busy||!bridge()?.status)return;
      const ticket=++revision;abort?.abort();abort=new AbortController();const signal=abort.signal,lease=reserveDeviceOperation();
      try{
        await bounded(lease.wait,signal);if(!active(ticket))return;
        const value=await bounded(lease.track(bridge().status()),signal);if(!active(ticket))return;
        const {registration,...device}=value||{};publish(ticket,{...device,linked:false,checkingFailed:false,error:false,message:'',hasRegistration:readNativePushRegistration()!==null});
      }catch{publish(ticket,{checkingFailed:true,linked:false,hasRegistration:readNativePushRegistration()!==null,message:'Die Geräteprüfung konnte nicht abgeschlossen werden. Bitte erneut prüfen.',error:true});}
      finally{lease.release();}
    },
    async enable(){
      if(!alive||!isCurrent()||busy||!bridge()?.enable)return;
      busy=true;let started=false;const ticket=++revision;abort?.abort();abort=new AbortController();const signal=abort.signal,lease=reserveDeviceOperation();
      publish(ticket,{working:true,supported:true,linked:false,error:false,message:''});
      try{
        await bounded(lease.wait,signal);if(!active(ticket))return;
        started=true;const value=await bounded(lease.track(bridge().enable()),signal);if(!active(ticket))return;
        if(!value?.supported||typeof value.registration!=='string'||!FID.test(value.registration)){const {registration,...device}=value||{};publish(ticket,{...device,linked:false,message:value?.permission==='denied'?'Benachrichtigungen sind in den iOS-Einstellungen gesperrt.':'Die Apple-Benachrichtigungen sind noch nicht vollständig eingerichtet.'});return;}
        if(!remember(value.registration)){if(active(ticket))await bounded(lease.track(bridge().disable()),signal);throw new Error('Der lokale Gerätespeicher ist gesperrt. Die Kontoverknüpfung wurde nicht aktiviert.');}
        if(!active(ticket))return;
        await post('/api/push/register',value.registration,signal,lease);if(!active(ticket))return;
        const {registration,...device}=value;publish(ticket,{...device,linked:true,hasRegistration:true,message:'Benachrichtigungen sind für dieses Konto auf diesem Apple-Gerät aktiviert.'});
      }catch(error){
        // A queued successor which merely timed out waiting has not acquired the
        // device. It must never cancel an older view's pending native action.
        if(started&&active(ticket)&&error.code==='PUSH_TIMEOUT'){try{await bounded(lease.track(bridge().disable()),signal);}catch{}}
        publish(ticket,{supported:true,linked:false,hasRegistration:readNativePushRegistration()!==null,message:error.message,error:true});
      }finally{lease.release();if(active(ticket)){busy=false;onStatus({working:false});}}
    },
    async disable(){
      if(!alive||!isCurrent()||busy||!bridge()?.disable)return;
      busy=true;let unlinked=false;const ticket=++revision;abort?.abort();abort=new AbortController();const signal=abort.signal,lease=reserveDeviceOperation();
      publish(ticket,{working:true,error:false,message:''});
      try{
        await bounded(lease.wait,signal);if(!active(ticket))return;
        const registration=readNativePushRegistration();if(registration)await post('/api/push/unregister',registration,signal,lease);if(!active(ticket))return;unlinked=true;publish(ticket,{linked:false});
        await bounded(lease.track(bridge().disable()),signal);if(!active(ticket))return;forget();publish(ticket,{enabled:false,linked:false,hasRegistration:readNativePushRegistration()!==null,message:'Apple-Benachrichtigungen sind auf diesem Gerät deaktiviert.'});
      }catch(error){publish(ticket,{...(unlinked?{linked:false}:{}),message:unlinked?'Die Kontoverknüpfung ist entfernt. Die lokale Deaktivierung konnte noch nicht vollständig bestätigt werden. Bitte erneut versuchen.':error.message,error:true});}
      finally{lease.release();if(active(ticket)){busy=false;onStatus({working:false});}}
    },
    dispose(){alive=false;revision++;abort?.abort();controls.delete(controller);},
  };controls.add(controller);return controller;
}
export async function cleanupNativePushForAccountChange({localOnly=false,isCurrent=()=>true}={}){
  if(!isCurrent())return false;
  for(const control of [...controls]){if(!isCurrent())return false;control.dispose();}
  const abort=new AbortController(),lease=reserveDeviceOperation();
  try{
    await bounded(lease.wait,abort.signal);if(!isCurrent())return false;
    const registration=readNativePushRegistration(),native=bridge();if(!registration&&!native)return true;
    if(!isCurrent())return false;
    if(registration&&!localOnly)await post('/api/push/unregister',registration,abort.signal,lease);
    if(!isCurrent())return false;
    if(native?.disable)await bounded(lease.track(native.disable()),abort.signal);
    if(!isCurrent())return false;
    forget();return true;
  }catch{return false;}finally{abort.abort();lease.release();}
}
