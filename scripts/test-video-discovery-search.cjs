// Shared discovery and real search/SSR integration. No new biological review,
// actual browser storage, account, network request or playback is involved.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {createLoader,root,local}=require('./helpers/project-module.cjs');
const revision='1bf28f2c4d288a95457a37ca2543a6cdfc1487d9',load=createLoader();
function baseline(relative){
  const filename=path.resolve(root,relative),file=path.relative(root,filename).replaceAll('\\','/');
  assert.ok(file&&!file.startsWith('../')&&!path.isAbsolute(file));
  const source=execFileSync('git',['show',`${revision}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:30000000});
  const{code}=local('next/dist/build/swc').transformSync(source,{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  const module={exports:{}};
  new Function('require','module','exports',code)(id=>id.startsWith('.')?load(path.resolve(path.dirname(filename),path.extname(id)?id:`${id}.js`)):local(id),module,module.exports);
  return module.exports;
}
const discovery=load('lib/learning-video-discovery.js'),library=load('lib/learning-video-library.js').getLearningVideoLibrary();
const beforeLinks=baseline('lib/learning-video-links.js').learningVideoLinks,oldIDs=new Set(beforeLinks.map(item=>`${item.kind}-${item.id}`));
const wild=load('lib/wildlife-video-cases.js').wildlifeVideoCases,dogs=load('lib/hunting-dog-video-lessons.js');
const search=load('lib/learning-search.js').searchLearning;
const hrefBase=href=>href.split('#')[0];
function results(query,category){
  const options={query,type:'entry',...(category?{category}:{})},first=search(options);
  return [first.results,...Array.from({length:first.pages-1},(_,index)=>search({...options,page:index+2}).results)].flat();
}

test('All23 authored discovery rows retain exact prior directory objects except the explicit Bled course/visibility note',()=>{
  assert.equal(oldIDs.size,23);
  const before=baseline('lib/learning-video-library.js').getLearningVideoLibrary().filter(item=>oldIDs.has(item.id));
  assert.equal(before.length,23);
  const actual=library.filter(item=>oldIDs.has(item.id));
  assert.deepEqual(actual,before.map(item=>item.id==='wild-blaesshuhn-bled'?{...item,focus:'Helle Kopfpartien und Wasserreflexe unterscheiden. Kursbezug: Schwimmlappen; die Füße bleiben im Film unsichtbar.'}:item));
  for(const item of actual){const id=new URL(item.href,'https://test.invalid').searchParams.get('eintrag'),shared=discovery.getLearningVideoDiscovery(id);assert.ok(shared,id);assert.equal(item.focus,shared.focus);assert.deepEqual(item.concepts,shared.concepts);}
});

test('The shared metadata module imports no curriculum, questions, player, media URL or storage and rejects prototype-shaped IDs',()=>{
  const source=fs.readFileSync(path.join(root,'lib/learning-video-discovery.js'),'utf8');
  assert.doesNotMatch(source,/^\s*(?:import\s|export\s+[^\n]*\sfrom\s)|\brequire\s*\(/m);
  assert.doesNotMatch(source,/https?:\/\/|\/lernen\/|\.mp4|\.webm|\.vtt|localStorage|fetch\(|window\.|document\./);
  for(const id of [undefined,null,[],{},'','missing','__proto__','constructor','toString']){assert.equal(discovery.getLearningVideoDiscovery(id),null);assert.equal(discovery.learningVideoDiscoveryText(id),'');}
});

test('All four full dog movies, eight question objects, source roles and review dates remain exact against Git1bf28f2',()=>{
  const previous=baseline('lib/hunting-dog-video-lessons.js');
  assert.equal(dogs.huntingDogVideoLessons.length,4);assert.equal(dogs.huntingDogVideoLessons.flatMap(item=>item.questions).length,8);
  assert.deepEqual(dogs.huntingDogVideoLessons,previous.huntingDogVideoLessons);assert.deepEqual(dogs.dogVideoSources,previous.dogVideoSources);assert.deepEqual(dogs.huntingDogVideoAssetPaths,previous.huntingDogVideoAssetPaths);
  for(const old of previous.huntingDogVideoSearchEntries){const current=dogs.huntingDogVideoSearchEntries.find(item=>item.id===old.id),{text,...fields}=current;assert.deepEqual(fields,old);assert.ok(text.startsWith([old.description,...old.keywords].join(' ')+' '));assert.ok(text.includes(discovery.learningVideoDiscoveryText(new URL(old.href,'https://test.invalid').searchParams.get('eintrag'))));}
});

test('Every existing clip concept now reaches the same exact film in the real global index and mediathek filter',()=>{
  const{filterLearningVideos}=load('lib/video-library-search.js');
  for(const item of library.filter(item=>oldIDs.has(item.id))){
    for(const term of item.concepts){
      assert.ok(filterLearningVideos(library,term,item.group).some(row=>row.id===item.id),`${item.id}: directory ${term}`);
      assert.ok(results(term,item.group==='hund'?'hundewesen':'wildkunde').some(row=>hrefBase(row.href)===hrefBase(item.href)),`${item.id}: global ${term}`);
    }
  }
  for(const [term,id]of[['Schwimmlappen','wild-blaesshuhn-bled'],['Seitenansicht','wild-damwild-dyrehaven'],['Nasenleistung','hund-basset-faehrtenende'],['Apportierleistung','hund-golden-wasser'],['Signalaufbau','hund-labrador-signal']]){const item=library.find(row=>row.id===id);assert.ok(results(term).some(row=>hrefBase(row.href)===hrefBase(item.href)));}
});

test('Actual global Bled results directly state course context and invisible feet without moving the correct film target',()=>{
  const item=library.find(row=>row.id==='wild-blaesshuhn-bled');
  for(const query of ['Schwimmlappen','Wasserreflexe Schwimmlappen']){
    const result=results(query,'wildkunde').find(row=>hrefBase(row.href)===hrefBase(item.href));assert.ok(result,query);
    assert.equal(result.href,'/lernen/wildtier-videofaelle?eintrag=blaesshuhn-bled');
    assert.match(result.description,/Kursbezug: Schwimmlappen; die Füße bleiben im Film unsichtbar/);
    assert.deepEqual(result.categories,['wildkunde','jagdpraxis']);assert.equal(result.type,'entry');
    assert.doesNotMatch(JSON.stringify(result),/"(?:questions|answers|correct|transcript|lessons|src|text)"/);
  }
  assert.equal(results('Seitenansicht','hundewesen').some(row=>row.href.includes('damwild-dyrehaven')),false);
  assert.equal(results('Nasenleistung','wildkunde').some(row=>row.href.includes('basset-faehrtenende')),false);
});

test('All prior media entry fields, IDs, categories, links and nonvideo entries remain exact except the explicit Bled description and appended search text',()=>{
  const before=baseline('lib/media-search-entries.js').mediaSearchEntries,current=load('lib/media-search-entries.js').mediaSearchEntries;
  for(const old of before.filter(item=>!item.id.startsWith('video-')||oldIDs.has(`wild-${item.id.slice(6)}`))){const entry=current.find(item=>item.id===old.id);assert.ok(entry);if(!old.id.startsWith('video-')){assert.deepEqual(entry,old);continue;}
    const id=old.id.slice(6),expected={...old,text:`${old.text} ${discovery.learningVideoDiscoveryText(id)}`};
    if(id==='blaesshuhn-bled')expected.description+=' Kursbezug: Schwimmlappen; die Füße bleiben im Film unsichtbar.';
    assert.deepEqual(entry,expected);
  }
});

test('A filtered actual directory renders the shared Bled boundary with matching previews and no new player, window or search control',()=>{
  const React=local('react'),{renderToStaticMarkup}=local('react-dom/server');
  const Component=createLoader({'next/router':{useRouter:()=>({isReady:true,query:{q:'Schwimmlappen'},asPath:'/lernen/videos?q=Schwimmlappen'})},
    'next/link':({href,children,prefetch,...props})=>React.createElement('a',{href,...props},children),
    './PageMenu':{__esModule:true,default:({children})=>React.createElement('aside',null,children),closePageMenu(){},openPageMenu(){}}})('components/LearningVideoLibrary.js').default;
  const html=renderToStaticMarkup(React.createElement(Component,{videos:library}));
  assert.match(html,/Kursbezug: Schwimmlappen; die Füße bleiben im Film unsichtbar/);assert.equal((html.match(/data-video-id=/g)||[]).length,load('lib/video-library-search.js').filterLearningVideos(library,'Schwimmlappen').length);assert.equal((html.match(/type="search"/g)||[]).length,1);
  assert.doesNotMatch(html,/<video|<audio|<iframe|src="[^"]*\.(?:mp4|webm)/);assert.ok(html.includes('href="/lernen/wildtier-videofaelle?eintrag=blaesshuhn-bled#video-fall"'));
});

test('Adding discovery text cannot index a synthetic question prompt, wrong option or answer explanation',()=>{
  const fixture={id:'blaesshuhn-bled',title:'Testfilm',species:'Testvogel',tags:['Ansicht'],observations:['Sichtbare Bewegung.'],location:'Isoliertes Beispiel',questions:[{question:'HiddenPromptProbe',choices:['HiddenChoiceProbe'],explanation:'HiddenExplainProbe',answer:0}]};
  const entry=createLoader({'./wildlife-video-cases':{wildlifeVideoCases:[fixture]}})('lib/media-search-entries.js').mediaSearchEntries.find(item=>item.id==='video-blaesshuhn-bled');
  assert.ok(entry.text.includes('Schwimmlappen'));assert.doesNotMatch(JSON.stringify(entry),/HiddenPromptProbe|HiddenChoiceProbe|HiddenExplainProbe|"answer"/);
  const future={...fixture,id:'future-authored-scene'};const fallback=createLoader({'./wildlife-video-cases':{wildlifeVideoCases:[future]}})('lib/media-search-entries.js').mediaSearchEntries[0];
  assert.ok(fallback.text.includes('Sichtbare Bewegung.'));assert.doesNotMatch(fallback.text,/undefined|null|Schwimmlappen/);
});
