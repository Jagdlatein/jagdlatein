// Read-only search ranking, unchanged index-content comparison and synthetic
// lesson fixtures. No live API, browser data or user answers are accessed.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const{createLoader,local,root}=require('./helpers/project-module.cjs'),swc=local('next/dist/build/swc');
const load=createLoader(),current=load('lib/learning-search.js'),filename=path.join(root,'lib/learning-search.js'),source=fs.readFileSync(filename,'utf8'),baseline=execFileSync('git',['show','98fc900a6825bfa1c1c7f3520814eb954e4498f5:lib/learning-search.js'],{cwd:root,encoding:'utf8'}),old={exports:{}};
const{code}=swc.transformSync(baseline,{filename,jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});
new Function('require','module','exports',code)(id=>id.startsWith('.')?load(path.resolve(root,'lib',path.extname(id)?id:id+'.js')):local(id),old,old.exports);
const lessons=(id,title,paragraphs)=>({id,title,paragraphs,takeaway:'Eigenes synthetisches Lernbeispiel.',exercise:'Teste den Suchbegriff.'});
const course=(id,title,entries)=>({id,title,description:'Rein synthetischer Rankingtest.',category:'Wildkunde',countries:['DE','AT','CH'],lessons:entries,questions:[{q:'SECRET_QUIZ_MUST_NOT_BE_INDEXED',correct:['SECRET_QUIZ_MUST_NOT_BE_INDEXED'],explain:'SECRET_EXPLANATION_MUST_NOT_BE_INDEXED'}]});
const synthetic=fixtures=>createLoader({'./learning-curriculum':{learningModules:fixtures},'./course-catalog':{miniCourses:[]},'./mini-course-details':{miniCourseDetails:{}}})('lib/learning-search.js');
function all(api,args){const first=api.searchLearning(args),results=[...first.results];for(let page=2;page<=first.pages;page++)results.push(...api.searchLearning({...args,page}).results);return{...first,results};}

test('The entire index definition, included lesson fields, aliases, normalizer and typo correction stay byte-identical to HEAD98fc900',()=>{
 assert.equal(source.slice(0,source.indexOf('function matchRank')),baseline.slice(0,baseline.indexOf('function matchRank')));
 const includes=s=>s.match(/function includesTerm\(value, term\) \{[\s\S]*?\n\}/)[0];assert.equal(includes(source),includes(baseline));
 const fixtures=[course('safe-course','Neutraler Titel',[{...lessons('safe','Sichere Lektion',['Öffentlicher Testtext.']),questions:[{q:'SECRET_QUIZ_MUST_NOT_BE_INDEXED'}],explain:'SECRET_EXPLANATION_MUST_NOT_BE_INDEXED'}])],api=synthetic(fixtures);
 assert.equal(api.searchLearning({query:'SECRET_QUIZ_MUST_NOT_BE_INDEXED',type:'course'}).total,0);assert.equal(api.searchLearning({query:'SECRET_EXPLANATION_MUST_NOT_BE_INDEXED',type:'course'}).total,0);
});

test('Real Nische search keeps all substring matches but brings the actual lesson onto the first page ahead of accidental internal title matches',()=>{
 const before=old.exports.searchLearning({query:'Nische'}),after=current.searchLearning({query:'Nische'});assert.equal(after.total,before.total);assert.ok(!before.results.some(item=>item.href.includes('#lesson-habitat-nische')));
 assert.equal(after.results[0].href,'/kurse/wissen-lebensraeume-biotopverbund#lesson-habitat-nische');assert.equal(after.results[0].lessonTitle,'Habitat und Nische');assert.ok(after.results.some(item=>item.title==='Finnischer Laufhund'),'An inner-word match remains available');
 assert.equal(current.searchLearning({query:'ökologische Nische'}).results[0].href,after.results[0].href);
});

test('Whole words and word beginnings outrank accidental internal substrings without deleting their recall',()=>{
 const api=synthetic([course('inside-title','Technische Abläufe',[lessons('technical','Technischer Ablauf',['Ein rein technischer Test.'])]),course('whole-body','Zoologie lernen',[lessons('concept','Grundbegriffe',['Nische ist hier ein ausdrücklich gewähltes Testwort.'])]),course('prefix-title','Nischenplanung',[lessons('prefix','Nischenmodell',['Nischenmodelle als synthetischer Begriff.'])]),course('exact-title','Nische',[lessons('exact','Beispiel',['Neutrale Beschreibung.'])])]);
 const result=api.searchLearning({query:'Nische',type:'course'});assert.equal(result.total,4);assert.equal(result.results[0].id,'course:exact-title');assert.ok(result.results.findIndex(item=>item.id==='course:whole-body')<result.results.findIndex(item=>item.id==='course:inside-title'));assert.ok(result.results.findIndex(item=>item.id==='course:prefix-title')<result.results.findIndex(item=>item.id==='course:inside-title'));
});

test('The matching lesson and passage prefer a real word over an earlier technical substring, including within one long paragraph',()=>{
 const paragraph='Technische Vorbemerkung. '+'Neutraler Testabschnitt. '.repeat(55)+'Die ökologische Nische ist das ausdrücklich gesuchte Testwort. '+'Späterer Text. '.repeat(20);
 const api=synthetic([course('lesson-quality','Allgemeine Lerninhalte',[lessons('first','Technische Beschreibung',['Ein technischer Test ohne diesen eigentlichen Begriff.']),lessons('second','Begriff nachlesen',[paragraph])])]);
 const result=api.searchLearning({query:'Nische',type:'course'}).results[0];assert.equal(result.href,'/kurse/lesson-quality#lesson-second');assert.equal(result.lessonTitle,'Begriff nachlesen');assert.match(result.description,/ökologische Nische/);assert.doesNotMatch(result.description,/Technische Vorbemerkung/);assert.ok(result.description.length<=260);
});

test('Excerpt offsets remain in the original umlaut/combining-mark spelling despite a longer normalized prefix',()=>{
 const word='Mu\u0308nsterla\u0308nder',paragraph='Äußere Übung. '.repeat(70)+word+' ist hier nur ein synthetisches Suchwort. '+'Abschluss. '.repeat(20),api=synthetic([course('diacritic-offset','Neutraler Kurs',[lessons('spelling','Schreibweisen',[paragraph])])]);
 const result=api.searchLearning({query:'Muensterlaender',type:'course'}).results[0];assert.ok(result.description.includes(word));assert.deepEqual(api.searchLearning({query:'Münsterländer',type:'course'}),api.searchLearning({query:'Muensterlaender',type:'course'}));
});

test('Complete result membership, filter boundaries, typo suggestions and duplicate-free pagination match the previous implementation',()=>{
 const probes=[{},...['Nische','ökologische Nische','Reh','Uhu','DNA','HEV','Schädel','Schaedel','Münsterländer','Muensterlaender','Dackel','Rehwidl','Kühlkete','kugelf','abc','zzznichtvorhanden'].map(query=>({query})),{query:'Nische',type:'course'},{query:'Nische',category:'natur-revier'},{query:'Kugelfang',category:'waffen-sicherheit'},{query:'Jagd',category:'jagdrecht',country:'DE'},{query:'Jagd',category:'jagdrecht',country:'AT'},{query:'Jagd',category:'jagdrecht',country:'CH'}];
 for(const probe of probes){const a=all(old.exports,probe),b=all(current,probe);assert.equal(b.total,a.total,JSON.stringify(probe));assert.equal(b.pages,a.pages);assert.equal(b.suggestion,a.suggestion);assert.equal(new Set(b.results.map(item=>item.id)).size,b.results.length);const identity=item=>({id:item.id,title:item.title,type:item.type,categories:item.categories,path:new URL(item.href,'https://search.invalid').pathname});const sorted=rows=>rows.map(identity).sort((x,y)=>x.id.localeCompare(y.id));assert.deepEqual(sorted(b.results),sorted(a.results),JSON.stringify(probe));}
});

test('Exact aliases, partial word beginnings, Unicode normalization and established short-query safeguards stay usable',()=>{
 assert.equal(current.searchLearning({query:'Dackel'}).results[0].id,'breed:teckel');assert.ok(current.searchLearning({query:'kugelf'}).results.some(item=>item.id==='course:wissen-kugelfang'));assert.ok(current.searchLearning({query:'Reh'}).results.some(item=>item.id==='species:rehwild'));assert.ok(current.searchLearning({query:'HEV'}).results.some(item=>item.id==='course:wissen-ausbau-hepatitis-e-2026'));
 assert.deepEqual(current.searchLearning({query:'Schädel'}),current.searchLearning({query:'Schaedel'}));assert.deepEqual(current.searchLearning({query:'Münsterländer'}),current.searchLearning({query:'Muensterlaender'}));assert.equal(current.searchLearning({query:'abc'}).total,0);assert.throws(()=>current.searchLearning({category:'__proto__'}),/Ungültige/);
});
