// Project only the exact, separately tested Guttation appendix from old views.
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
// Fixed reviewed complete new-object hashes; never derive expected values from live inputs.
const expectedHashes=Object.freeze({
  "rawLesson": "7c46ecb4d40d77de88c3e821c6bdb392d80f2a9f5c59588e34d7b8c1c4a4f675",
  "preparedLesson": "0de5fb62f6fd1239f89cba913705dd21882a694bd15f6da4c9da9ed3d95dcdf3",
  "rawQuestions": "7038ac4f0b87acbd7617df7e69ef59055c2c3e90fb35359e88b9abcc4285ae49",
  "preparedQuestions": "9b79731446cc085a30097cc81a7d6d0307a80b7cf7f6feeddc00e8f7defc3a97",
  "sources": "7248c938919b994f9269123050e751e1e8dbd578ade901b7e8392a8128367c76",
  "evidence": "0df223aba0e9ef70c915548f762a9b5506df9f33ab9d58ac381d53467f82a247",
  "cards": "fe90959a979cdc8eecf073de8f359dc1218ee00320121abf6f7b812291c39290"
});
const assertExact=(value,expected,label)=>assert.equal(createHash('sha256').update(JSON.stringify(value)).digest('hex'),expected,label);
const addition=Object.freeze({courseId:'wissen-ausbau-oekologie-blattfunktion-2026',lessonId:'guttation',date:'2026-11-25',questionIds:['guttation-austritt','guttation-tau-modell'],urls:[
 'https://www-archiv.fdm.uni-hamburg.de/b-online/d05/05a.htm',
 'https://ipm.missouri.edu/MEG/2009/6/Guttation-A-Pressure-Relief-for-Plants/index.cfm',
 'https://hess.copernicus.org/articles/25/2617/2021/',
 'https://weather.metoffice.gov.uk/learn-about/weather/types-of-weather/temperature/dew',
]});
const newQuestionIds=addition.questionIds.map(id=>`${addition.courseId}-${id}`),newCardIds=newQuestionIds.map(id=>`flash-${id}`);
const expectedDiagram={type:'comparison',title:'Drei Wasserwege am Blatt',note:'Eigenes vereinfachtes Vergleichsschema. Die Kästen unterscheiden Stoffzustand und Herkunft; sie sind keine zeitliche Abfolge, keine massstäbliche Anatomiezeichnung und kein Nachweis der Herkunft eines fotografierten Tropfens.',steps:[
 {title:'Guttation: Flüssigkeit nach aussen',text:'Flüssiges Wasser stammt aus dem Pflanzeninneren und tritt im beschriebenen Modell über Hydathoden aus.'},
 {title:'Tau: Wasserdampf kondensiert',text:'Wasserdampf aus der Umgebung wird an einer genügend abgekühlten Oberfläche zu flüssigem Wasser.'},
 {title:'Transpiration: Wasserdampf nach aussen',text:'Wasser wird aus der Pflanze in Dampfform an die umgebende Luft abgegeben.'},
]};
const expectedSourceSets=[[addition.urls[0],addition.urls[1],addition.urls[2]],[addition.urls[1],addition.urls[2]],[addition.urls[2],addition.urls[3]]];
function stripGuttationCourse(course){
 if(course?.id!==addition.courseId||!course.lessons.some(item=>item.id===addition.lessonId))return course;
 assert.deepEqual([course.lessons.length,course.questions.length,course.sources.length],[7,38,19]);
 assert.deepEqual(course.lessons.map(item=>item.id),['blattbau','photosynthese','wasserhaushalt','blattalterung','zellatmung','energie-stoffe',addition.lessonId]);
 const lesson=course.lessons.at(-1);
 const prepared=Array.isArray(course.questions.at(-1).answers);
 assertExact(lesson,expectedHashes[prepared?'preparedLesson':'rawLesson'],'Complete named Guttation lesson including text/evidence/diagram');
 assertExact(course.questions.slice(-2),expectedHashes[prepared?'preparedQuestions':'rawQuestions'],'Complete two named questions including every option and explanation');
 assertExact(course.sources.slice(-4),expectedHashes.sources,'Complete four lesson-scoped sources including labels/roles');assert.equal(lesson.title,'Guttation: Tropfen aus der Pflanze');assert.equal(lesson.reviewedOn,addition.date);assert.equal(lesson.flashcardExpansion,true);assert.equal(lesson.paragraphs.length,3);assert.ok(lesson.takeaway&&lesson.exercise);
 if(lesson.evidence)assert.deepEqual(lesson.evidence.map(item=>item.sources.map(source=>source.url)),expectedSourceSets);
 if(lesson.diagram)assert.deepEqual(lesson.diagram,expectedDiagram);
 assert.deepEqual(course.questions.slice(-2).map(item=>item.id.replace(`${course.id}-`,'')),addition.questionIds);assert.ok(course.questions.slice(-2).every(item=>item.lessonId===addition.lessonId));
 assert.deepEqual(course.sources.slice(-4).map(item=>item.url),addition.urls);assert.ok(course.sources.slice(-4).every(item=>item.checkedOn===addition.date&&JSON.stringify(item.lessonIds)===JSON.stringify([addition.lessonId])));
 return {...course,lessons:course.lessons.slice(0,-1),questions:course.questions.slice(0,-2),sources:course.sources.slice(0,-4)};
}
function stripGuttationDataset(data){
 if(!data?.modules?.some(item=>item.id===addition.courseId&&item.lessons.some(lesson=>lesson.id===addition.lessonId)))return data;
 const records=data.evidence.filter(item=>item.moduleId===addition.courseId&&item.lessonId===addition.lessonId);assert.equal(records.length,1);assertExact(records[0],expectedHashes.evidence,'Complete named raw evidence including claim text and source roles');assert.equal(records.length,1);assert.equal(data.evidence.at(-1),records[0]);assert.equal(records[0].claims.length,3);assert.deepEqual(records[0].claims.map(item=>item.sourceUrls),expectedSourceSets);
 for(const claim of records[0].claims){assert.ok(claim.claim);assert.deepEqual(Object.keys(claim.sourceRoles),claim.sourceUrls);assert.ok(Object.values(claim.sourceRoles).every(role=>typeof role==='string'&&role.length>30));}
 return {...data,modules:data.modules.map(stripGuttationCourse),evidence:data.evidence.slice(0,-1)};
}
function guttationBaselineFixture(overrides={}){const key='../data/learning-expansion-ecology-2026-10-16.json',dataset=Object.hasOwn(overrides,key)?overrides[key]:require('../../data/learning-expansion-ecology-2026-10-16.json');return {...overrides,[key]:stripGuttationDataset(dataset)};}
function stripGuttationCards(cards){const extra=cards.filter(item=>newCardIds.includes(item.id));if(!extra.length)return cards;assertExact(extra,expectedHashes.cards,'Both complete derived cards including prompt/answer/explanation/context/source labels');assert.deepEqual(extra.map(item=>item.id),newCardIds);assert.ok(extra.every(item=>item.moduleId===addition.courseId&&item.lessonId===addition.lessonId&&item.reviewedOn===addition.date&&item.sourceScope==='lesson'&&JSON.stringify(item.sources.map(source=>source.url))===JSON.stringify(addition.urls)));return cards.filter(item=>!newCardIds.includes(item.id));}
function guttationDiagramBaseline(getDiagram){return(courseId,lessonId)=>{const current=getDiagram(courseId,lessonId);if(courseId!==addition.courseId||lessonId!==addition.lessonId)return current;assert.deepEqual(current,expectedDiagram);return null;};}
module.exports={expectedHashes,addition,newQuestionIds,newCardIds,expectedDiagram,expectedSourceSets,stripGuttationCourse,stripGuttationDataset,guttationBaselineFixture,stripGuttationCards,guttationDiagramBaseline};
