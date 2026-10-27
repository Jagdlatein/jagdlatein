// Real React/DOM lifecycle; synthetic metadata and fetch doubles only. No accounts or database.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createLoader, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
const props = node => { assert.ok(node); return node[Object.keys(node).find(key => key.startsWith('__reactProps$'))]; };
const schoolId='11111111-1111-4111-8111-111111111111',offerId='22222222-2222-4222-8222-222222222222';
const catalog=['a','b','c'].map(letter=>({id:`wissen-test-${letter}`,title:`Vorhandenes Testmodul ${letter}`,categorySlug:'wildkunde'}));
const data={schools:[{id:schoolId,name:'Isolierte Testschule',status:'approved'}],offers:[{id:offerId,school_id:schoolId,title:'Isoliertes Testangebot',description:'Keine echten Kursdaten',category_slug:'wildkunde',module_ids:[catalog[0].id],status:'draft'}],sessions:[]};
const flush=async()=>{for(let index=0;index<6;index++)await Promise.resolve();};
async function fixture(t) {
  const dom=new JSDOM('<html><body><div id="root"></div></body></html>',{url:'https://jagdlatein.invalid/online-kurse?ansicht=verwaltung'});
  const saved=new Map(),requests=[];let current=true,savedCalls=0;
  const fetcher=(url,init)=>new Promise((resolve,reject)=>requests.push({url,init,resolve,reject}));
  for(const [key,value]of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,fetch:fetcher,IS_REACT_ACT_ENVIRONMENT:true})){
    saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  }
  const Component=createLoader()('components/OnlineAcademyAdmin.js').default;
  let root=local('react-dom/client').createRoot(document.getElementById('root'));
  const act=action=>React.act(async()=>{action();await flush();});
  const render=()=>act(()=>root.render(React.createElement(Component,{data,catalog,onSaved:()=>savedCalls++,canAct:()=>current})));
  const button=text=>[...document.querySelectorAll('button')].find(node=>node.textContent===text);
  const boxes=()=>[...document.querySelectorAll('input[type="checkbox"]')];
  const checked=()=>boxes().map((node,index)=>node.checked?catalog[index].id:null).filter(Boolean);
  const chooseOffer=()=>act(()=>props(document.querySelector('select')).onChange({target:{value:'offer'}}));
  const selectExisting=()=>act(()=>props(button('Isoliertes TestangebotEntwurf')).onClick());
  const unmount=async()=>{if(root){await React.act(async()=>root.unmount());root=null;}};
  t.after(async()=>{await unmount();dom.window.close();for(const[key,value]of saved)value?Object.defineProperty(globalThis,key,value):delete globalThis[key];});
  await render();await chooseOffer();
  return{act,render,button,boxes,checked,requests,chooseOffer,selectExisting,unmount,setCurrent:value=>{current=value;},savedCalls:()=>savedCalls};
}

test('Rapid current-draft module additions combine all choices before React redraws',async t=>{
  const h=await fixture(t),change=h.boxes().map(node=>props(node).onChange);
  await h.act(()=>{for(const update of change)update({target:{checked:true}});});
  assert.deepEqual(h.checked(),catalog.map(item=>item.id));assert.equal(h.requests.length,0);
});

test('Retained current-draft add/remove handlers preserve later choices and other current input fields',async t=>{
  const h=await fixture(t),change=h.boxes().map(node=>props(node).onChange);
  await h.act(()=>change[0]({target:{checked:true}}));
  const title=props(document.querySelector('input[type="text"], input:not([type])')).onChange;
  await h.act(()=>{title({target:{value:'Aktueller korrigierter Titel'}});change[1]({target:{checked:true}});});
  await h.act(()=>change[2]({target:{checked:true}}));
  await h.act(()=>change[0]({target:{checked:false}}));
  assert.deepEqual(h.checked(),[catalog[1].id,catalog[2].id]);
  assert.equal(document.querySelector('input[type="text"], input:not([type])').value,'Aktueller korrigierter Titel');assert.equal(h.requests.length,0);
});

test('Repeated checked events are idempotent and a double submit sends current exact module IDs once to a local double',async t=>{
  const h=await fixture(t),change=props(h.boxes()[0]).onChange;
  await h.act(()=>{change({target:{checked:true}});change({target:{checked:true}});});
  const submit=props(document.querySelector('form')).onSubmit;
  await h.act(()=>{void submit({preventDefault(){}});void submit({preventDefault(){}});});
  assert.equal(h.requests.length,1);assert.equal(h.requests[0].url,'/api/online-academy');
  assert.deepEqual(JSON.parse(h.requests[0].init.body).record.module_ids,[catalog[0].id]);
  assert.deepEqual(Object.keys(JSON.parse(h.requests[0].init.body)).sort(),['action','record']);
  await h.act(()=>h.requests[0].resolve({ok:true,json:async()=>({ok:true})}));assert.equal(h.savedCalls(),1);
});

test('Handlers from a replaced draft stay blocked through an offer-school-offer cycle',async t=>{
  const h=await fixture(t),oldChange=props(h.boxes()[2]).onChange,oldSubmit=props(document.querySelector('form')).onSubmit;
  await h.act(()=>props(h.button('Neu anlegen')).onClick());
  await h.act(()=>{oldChange({target:{checked:true}});void oldSubmit({preventDefault(){}});});
  assert.deepEqual(h.checked(),[]);assert.equal(h.requests.length,0);
  await h.act(()=>props(document.querySelector('select')).onChange({target:{value:'school'}}));await h.chooseOffer();
  await h.act(()=>oldChange({target:{checked:true}}));assert.deepEqual(h.checked(),[]);
  await h.selectExisting();assert.deepEqual(h.checked(),[catalog[0].id]);
  await h.act(()=>oldChange({target:{checked:false}}));assert.deepEqual(h.checked(),[catalog[0].id]);
});

test('Saving blocks current retained input/module actions until the local request completes',async t=>{
  const h=await fixture(t),change=h.boxes().map(node=>props(node).onChange);
  await h.act(()=>change[0]({target:{checked:true}}));
  const submit=props(document.querySelector('form')).onSubmit;
  await h.act(()=>{void submit({preventDefault(){}});change[1]({target:{checked:true}});});
  assert.deepEqual(h.checked(),[catalog[0].id]);assert.equal(document.querySelector('fieldset').disabled,true);
  await h.act(()=>h.requests[0].resolve({ok:false,json:async()=>({message:'Isolierter Prüffehler'})}));
  assert.equal(document.querySelector('fieldset').disabled,false);
  await h.act(()=>change[1]({target:{checked:true}}));assert.deepEqual(h.checked(),[catalog[0].id,catalog[1].id]);assert.equal(h.requests.length,1);
});

test('Origin invalidation and actual unmount block retained module, submit and late completion actions',async t=>{
  const h=await fixture(t),change=props(h.boxes()[0]).onChange,submit=props(document.querySelector('form')).onSubmit;
  h.setCurrent(false);await h.act(()=>{change({target:{checked:true}});void submit({preventDefault(){}});});
  assert.deepEqual(h.checked(),[]);assert.equal(h.requests.length,0);
  h.setCurrent(true);await h.act(()=>{change({target:{checked:true}});void submit({preventDefault(){}});});assert.equal(h.requests.length,1);
  await h.unmount();assert.equal(h.requests[0].init.signal.aborted,true);
  await h.act(()=>{change({target:{checked:false}});void submit({preventDefault(){}});h.requests[0].resolve({ok:true,json:async()=>({ok:true})});});
  assert.equal(h.requests.length,1);assert.equal(h.savedCalls(),0);
});
