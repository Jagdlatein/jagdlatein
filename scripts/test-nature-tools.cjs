const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const React = pr('react');
const { renderToStaticMarkup } = pr('react-dom/server');
const css = new Proxy({}, {get: (_, key) => String(key)});
function load(relative, overrides = {}) {
  const filename = path.join(root, relative);
  if(filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename,'utf8').replace(/^\uFEFF/,''));
  const {code} = swc.transformSync(fs.readFileSync(filename, 'utf8'), {filename, disableNextSsg:true, jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  const mod={exports:{}}; const req=createRequire(filename);
  function resolve(id) {
    if(Object.hasOwn(overrides,id)) return overrides[id];
    if(id==='next/router') return {useRouter:()=>({isReady:false,query:{},pathname:'',replace:async()=>true})};
    if(id==='next/link') return ({href,children,prefetch,shallow,scroll,...props})=>React.createElement('a',{href,...props},children);
    if(id==='next/head') return ({children})=>React.createElement(React.Fragment,null,children);
    if(id==='./PageMenu') return {__esModule:true,default:({children})=>React.createElement('aside',{'data-page-menu':true},children),openPageMenu:()=>{},closePageMenu:()=>{}};
    if(id==='next/image') return ({priority,loading,sizes,...props})=>React.createElement('img',props);
    if(id.endsWith('.module.css')) return {__esModule:true,default:css};
    if(id.startsWith('.')) return load(path.relative(root,path.resolve(path.dirname(filename),path.extname(id)?id:id+'.js')),overrides);
    return req(id);
  }
  new Function('require','module','exports',code)(resolve,mod,mod.exports);
  return mod.exports;
}
function engine() {
  const slots=[]; let cursor=0; const effects=[];
  const hooks={
    useState(initial){const i=cursor++; if(!slots[i])slots[i]={value:typeof initial==='function'?initial():initial}; return[slots[i].value,value=>{slots[i].value=typeof value==='function'?value(slots[i].value):value}];},
    useRef(initial){const i=cursor++; if(!slots[i])slots[i]={value:{current:initial}}; return slots[i].value;},
    useEffect(fn,deps){const i=cursor++;if(!slots[i]||!deps||deps.some((value,j)=>!Object.is(value,slots[i].deps[j]))){slots[i]={deps};effects.push(fn);}}
  };
  return {hooks,render(fn){cursor=0;return fn();},runEffects(){for(const effect of effects.splice(0))effect();}};
}
function text(node){if(node==null||typeof node==='boolean')return'';if(Array.isArray(node))return node.map(text).join('');return typeof node==='object'?text(node.props?.children):String(node);}
function find(node,predicate){if(Array.isArray(node)){for(const child of node){const item=find(child,predicate);if(item)return item;}return null;}if(!node||typeof node!=='object')return null;return predicate(node)?node:find(node.props?.children,predicate);}
function setup(relative,props={},router={isReady:false,query:{}}){const e=engine();const Component=load(relative,{react:e.hooks,'next/router':{useRouter:()=>router}}).default;let tree=e.render(()=>Component(props));return{e,get tree(){return tree;},redraw(){tree=e.render(()=>Component(props));return tree;},click(label){const button=find(tree,item=>item.type==='button'&&text(item)===label);assert.ok(button,label);button.props.onClick();this.redraw();return button;},html(){return renderToStaticMarkup(tree);}};}
const plants=load('lib/plant-atlas.js');
const tracks=load('lib/tracks-workshop.js');
const habitat=load('lib/habitat-workshop.js');
const media=load('lib/nature-photos.js');
const {natureAssetPaths}=load('lib/nature-asset-paths.js');
const {natureSearchEntries}=load('lib/nature-search-entries.js');
const fixture=[{id:'first',title:'Erster Fall',question:'Welche erste Antwort?',options:['Erste richtig','Erste falsch'],answer:0,explanation:'Erklärung eins.',source:{title:'Fachquelle',url:'https://www.bfn.de/'}},{id:'second',title:'Zweiter Fall',question:'Welche zweite Antwort?',options:['Zweite falsch','Zweite richtig'],answer:1,explanation:'Erklärung zwei.'}];

test('Twelve plant profiles provide four seasons, comparisons, real photos and botanical references',()=>{
  assert.equal(plants.plantAtlasEntries.length,12);assert.equal(new Set(plants.plantAtlasEntries.map(item=>item.id)).size,12);
  for(const item of plants.plantAtlasEntries){assert.equal(item.features.length,3);assert.equal(Object.keys(item.seasons).length,4);assert.ok(item.confusion.length>35);assert.ok(item.photo);assert.match(item.source.url,/^https:\/\/www\.infoflora\.ch\/de\/flora\//);assert.match(item.latin,/^[A-Z][a-z]+ [a-z]+$/);}
  const spruce=plants.plantAtlasEntries.find(item=>item.id==='fichte');const fir=plants.plantAtlasEntries.find(item=>item.id==='weisstanne');assert.match(spruce.features.join(' '),/hängen.*Ganzes/);assert.match(fir.features.join(' '),/Aufrechte.*zerfallen/);
});
test('Botanical search handles German accents, alternate names, Latin and group intersection',()=>{
  assert.equal(plants.filterPlants('Fagus')[0].id,'rotbuche');assert.equal(plants.filterPlants('Fohre')[0].id,'waldkiefer');assert.equal(plants.filterPlants('Birke','Nadelbaum').length,0);assert.equal(plants.filterPlants('', 'Nadelbaum').length,3);assert.equal(plants.filterPlants('kein-solcher-begriff').length,0);
});
test('Tracks distinguish eight genuine photographs from two explicitly labelled comparison diagrams',()=>{
  assert.equal(tracks.tracksWorkshopEntries.length,10);assert.equal(tracks.tracksWorkshopEntries.filter(item=>item.photo).length,8);assert.equal(tracks.tracksWorkshopEntries.filter(item=>item.schema).length,2);
  for(const item of tracks.tracksWorkshopEntries){assert.equal(item.traits.length,3);assert.ok(item.caution.length>60);assert.ok(tracks.tracksSources[item.source]);assert.ok(Boolean(item.photo)!==Boolean(item.schema));}
  assert.equal(tracks.filterTracks('Biber')[0].id,'biber-nagespur');assert.equal(tracks.filterTracks('Schnee','Nahrungszeichen').length,0);assert.equal(tracks.filterTracks('', 'Vergleichsschema').length,2);
});
test('Every practice question has unique options, a valid answer and meaningful explanation',()=>{
  for(const items of[plants.plantAtlasQuestions,tracks.tracksWorkshopEntries,habitat.habitatQuestions]){
    assert.equal(new Set(items.map(item=>item.id)).size,items.length);
    for(const item of items){assert.ok(item.options.length>=3);assert.equal(new Set(item.options).size,item.options.length);assert.ok(item.answer>=0&&item.answer<item.options.length);assert.ok(item.explanation.length>100);}
  }
});
test('All delivered images exist, have accurate dimensions and commercially compatible provenance',async()=>{
  const sharp=pr('sharp');const delivered=Object.values({...media.plantPhotos,...media.tracksPhotos});assert.equal(delivered.length,20);assert.equal(natureAssetPaths.length,20);assert.equal(new Set(natureAssetPaths).size,20);
  for(const item of delivered){assert.equal(item.aiGenerated,false);assert.ok(item.author&&item.alt&&item.sourceUrl&&item.licenseUrl);assert.match(item.license,/^(CC BY|CC0|Public domain)/);assert.match(item.sourceUrl,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);assert.ok(natureAssetPaths.includes(item.src));const meta=await sharp(path.join(root,'public',item.src)).metadata();assert.equal(meta.width,item.width);assert.equal(meta.height,item.height);}
  const manifests=['pflanzen','spuren'].flatMap(folder=>JSON.parse(fs.readFileSync(path.join(root,'public','lernen',folder,'bildnachweise.json'),'utf8').replace(/^\uFEFF/,'')));assert.equal(manifests.length,20);assert.deepEqual(manifests.map(item=>item.src).sort(),natureAssetPaths.slice().sort());
});
test('The oak image explicitly distinguishes galls from acorns',()=>{
  assert.match(media.plantPhotos.stieleiche.alt,/Blattgallen.*keine Eicheln/);assert.match(media.plantPhotos.stieleiche.displayCaption,/keine Eicheln/);
  const {NaturePhoto}=load('components/NatureMedia.js');const html=renderToStaticMarkup(React.createElement(NaturePhoto,{photo:media.plantPhotos.stieleiche}));assert.match(html,/Blattgallen, keine Eicheln/);assert.match(html,/Original und Nachweis/);
});
test('Habitat model evaluates functional resources without accepting unknown features or duplicate inflation',()=>{
  const empty=habitat.evaluateHabitat([]);assert.equal(empty.length,8);assert.ok(empty.every(item=>item.resources.every(resource=>!resource.covered)));
  assert.deepEqual(habitat.evaluateHabitat(['wald','wald','unsupported']),habitat.evaluateHabitat(['wald']));
  const all=habitat.evaluateHabitat(habitat.habitatFeatures.map(item=>item.id));assert.ok(all.every(item=>item.resources.every(resource=>resource.covered)));
  const frog=habitat.evaluateHabitat(['wasser']).find(item=>item.id==='erdkroete');assert.equal(frog.resources[0].covered,true);assert.equal(frog.resources[1].covered,false);assert.equal(frog.resources[2].covered,false);
  const lark=habitat.evaluateHabitat(['wald','hecke']).find(item=>item.id==='feldlerche');assert.equal(lark.resources[0].covered,false);
});
test('Search results link each plant and track directly to a validated entry',()=>{
  assert.equal(natureSearchEntries.length,23);assert.equal(new Set(natureSearchEntries.map(item=>item.id)).size,23);
  for(const result of natureSearchEntries){assert.ok(result.title&&result.description&&result.text);assert.ok(result.categories.length);const url=new URL(result.href,'https://example.org');if(url.pathname==='/lernen/pflanzenatlas')assert.ok(plants.plantAtlasEntries.some(item=>item.id===url.searchParams.get('eintrag')));if(url.pathname==='/lernen/spurenwerkstatt')assert.ok(tracks.tracksWorkshopEntries.some(item=>item.id===url.searchParams.get('eintrag')));}
});
test('Wrong answers always reveal explanation and mark the correct choice before navigation',()=>{
  const s=setup('components/NatureQuestionRound.js',{entries:fixture});assert.doesNotMatch(text(s.tree),/Erklärung eins/);s.click('Erste falsch');assert.match(text(s.tree),/Erklärung eins/);assert.match(text(s.tree),/Erste richtig.*Richtige Antwort/);assert.ok(find(s.tree,item=>item.type==='button'&&item.props.disabled));assert.match(s.html(),/role="status"/);assert.match(s.html(),/https:\/\/www.bfn.de/);
});
test('Answer and next guards reject double clicks, old rendered answers and restart callbacks',()=>{
  const s=setup('components/NatureQuestionRound.js',{entries:fixture});const first=find(s.tree,item=>item.type==='button'&&text(item)==='Erste richtig');const other=find(s.tree,item=>item.type==='button'&&text(item)==='Erste falsch');first.props.onClick();other.props.onClick();s.redraw();assert.match(text(s.tree),/Richtig/);assert.doesNotMatch(text(s.tree),/Du hast gewählt/);
  const next=find(s.tree,item=>item.type==='button'&&text(item)==='Nächste Frage');next.props.onClick();next.props.onClick();first.props.onClick();s.redraw();assert.match(text(s.tree),/Welche zweite Antwort/);assert.doesNotMatch(text(s.tree),/Erklärung zwei/);
  const stale=find(s.tree,item=>item.type==='button'&&text(item)==='Zweite richtig');s.click('Runde neu beginnen');stale.props.onClick();next.props.onClick();s.redraw();assert.match(text(s.tree),/Welche erste Antwort/);assert.doesNotMatch(text(s.tree),/Erklärung eins/);
});
test('Result review and targeted practice include only incorrect entries',()=>{
  const s=setup('components/NatureQuestionRound.js',{entries:fixture});s.click('Erste richtig');s.click('Nächste Frage');s.click('Zweite falsch');s.click('Auswertung ansehen');assert.match(text(s.tree),/1 von 2 Fragen richtig/);assert.match(text(s.tree),/Erklärung zwei/);s.click('Fehler gezielt wiederholen (1)');assert.match(text(s.tree),/Frage 1 von 1/);assert.match(text(s.tree),/Welche zweite Antwort/);assert.doesNotMatch(text(s.tree),/Erklärung zwei/);
});
test('All three tools use one layout, render one main region and usable form labels without the retired upper navigation',()=>{
  for(const [file,title]of[['components/PlantAtlas.js','Pflanzenatlas im Jahreslauf'],['components/TracksWorkshop.js','Spurenwerkstatt'],['components/HabitatWorkshop.js','Lebensraum-Werkstatt']]){const s=setup(file);const html=s.html();assert.equal((html.match(/<main/g)||[]).length,1);assert.match(html,new RegExp(title));assert.doesNotMatch(html,/href="\/lernen#lernen-suche"/);assert.match(html,/<label/);assert.doesNotMatch(html,/undefined|null/);}
});

test('The plant learning selector opens photo development directly and returns to the searchable atlas',()=>{
  const router={isReady:true,query:{},push:async update=>{router.query=update.query;}};
  const s=setup('components/PlantAtlas.js',{},router);
  const select=()=>find(s.tree,node=>node.type==='label'&&text(node).startsWith('Lernangebot'));
  const choose=value=>{const control=find(select(),node=>node.type==='select');assert.ok(control);control.props.onChange({target:{value}});s.redraw();};
  choose('entwicklung');assert.ok(find(s.tree,node=>node.type?.name==='DevelopmentPhotoSeries'));
  choose('atlas');assert.equal(find(s.tree,node=>node.type?.name==='DevelopmentPhotoSeries'),null);assert.ok(find(s.tree,node=>node.type==='input'&&node.props.type==='search'));
  choose('quiz');assert.ok(find(s.tree,node=>node.type?.name==='NatureQuestionRound'));
});
test('Valid direct entry parameters open the intended profiles; unknown values are ignored',()=>{
  const previous=global.window;try{
    const p=setup('components/PlantAtlas.js',{}, {isReady:true,query:{eintrag:'waldkiefer'}});p.e.runEffects();p.redraw();assert.equal(find(p.tree,item=>item.props?.id==='plant-title').props.children,'Waldkiefer / Waldföhre');
    const t=setup('components/TracksWorkshop.js',{}, {isReady:true,query:{eintrag:'biber-nagespur'}});t.e.runEffects();t.redraw();assert.equal(find(t.tree,item=>item.props?.id==='tracks-title').props.children,'Nagespur des Bibers');
    const unknown=setup('components/TracksWorkshop.js',{}, {isReady:true,query:{eintrag:'nonexistent'}});unknown.e.runEffects();unknown.redraw();assert.equal(find(unknown.tree,item=>item.props?.id==='tracks-title'),null);assert.match(text(unknown.tree),/Diese Spur ist nicht verfügbar/);
  }finally{if(previous===undefined)delete global.window;else global.window=previous;}
});
test('Documentation checklist is reversible and counts only selected current-session items',()=>{
  const s=setup('components/TracksWorkshop.js',{}, {isReady:true,query:{ansicht:'checkliste'}});const checkbox=find(s.tree,item=>item.type==='input'&&item.props.type==='checkbox');checkbox.props.onChange();s.redraw();assert.match(text(s.tree),/1 von 6/);s.click('Checkliste leeren');assert.match(text(s.tree),/0 von 6/);assert.match(text(s.tree),/nicht als amtlicher Nachweis/);
});
test('Choosing a plant preserves its URL, focuses its details, and reduces seasonal controls to one select',()=>{
  const updates=[]; let focused=0;
  const router={isReady:true,pathname:'/lernen/pflanzenatlas',query:{eintrag:'rotbuche',retained:'yes'},push:async update=>{updates.push(update);router.query=update.query;}};
  const p=setup('components/PlantAtlas.js',{},router);p.e.runEffects();p.redraw();
  find(p.tree,n=>n.type==='div'&&n.props.ref).props.ref.current={querySelector:()=>({focus:()=>{focused++;},scrollIntoView:()=>{}})};
  find(p.tree,n=>n.type==='button'&&text(n).startsWith('Waldkiefer / Waldföhre')).props.onClick();p.redraw();p.e.runEffects();p.redraw();
  assert.equal(focused,1);assert.equal(updates[0].query.eintrag,'waldkiefer');assert.equal(updates[0].query.retained,'yes');assert.equal(updates[0].hash,'plant-detail');
  const season=find(p.tree,n=>n.type==='select'&&n.props.id==='plant-season-choice');assert.ok(season);
  season.props.onChange({target:{value:'winter'}});p.redraw();p.e.runEffects();p.redraw();
  assert.equal(updates.at(-1).query.jahreszeit,'winter');assert.equal(updates.at(-1).query.eintrag,'waldkiefer');
  assert.match(text(find(p.tree,n=>n.props?.id==='plant-season')),/^Winter/);
  assert.equal(find(p.tree,n=>n.type==='button'&&n.props['aria-controls']==='plant-season'),null);
  router.query={eintrag:'unknown',jahreszeit:'unknown'};p.e.runEffects();p.redraw();p.e.runEffects();p.redraw();
  assert.equal(find(p.tree,n=>n.props?.id==='plant-title'),null);
  assert.match(text(p.tree),/Dieses Pflanzenthema ist nicht verfügbar/);
});
