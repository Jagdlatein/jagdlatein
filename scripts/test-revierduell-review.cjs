const test=require('node:test'),assert=require('node:assert/strict');
const {createLoader}=require('./helpers/project-module.cjs');
const {createDuellReview,duellReviewReducer}=createLoader()('lib/revierduell-review.js');
const questions=Object.freeze(Array.from({length:7},(_,i)=>Object.freeze({id:`q-${i}`,prompt:`Originalfrage ${i}`,explanation:`Originalerklärung ${i}`,href:`/kurse/original#lesson-${i}`,reviewedOn:'2026-10-04',options:Object.freeze(['a','b','c','d'].map(id=>Object.freeze({id,text:`Originalantwort ${id}`}))),correctIds:Object.freeze(['a'])})));
const answers=(bad=[1,4],timeouts=[4])=>questions.map((question,index)=>Object.freeze({questionId:question.id,correct:!bad.includes(index),timedOut:timeouts.includes(index),selectedId:timeouts.includes(index)?null:bad.includes(index)?'b':'a',points:bad.includes(index)?0:920}));
const event=(state,type,extra={})=>({generation:state.generation,index:state.index,type,...extra});
test('Review selects exactly original wrong and timeout questions in original order, without mutating results',()=>{
 const result=Object.freeze(answers()),before=JSON.stringify([questions,result]),review=createDuellReview(questions,result,8);assert.equal(review.questions.length,2);assert.equal(review.questions[0],questions[1]);assert.equal(review.questions[1],questions[4]);assert.equal(review.phase,'asking');assert.equal(review.selectedId,null);assert.equal(review.generation,8);assert.equal(JSON.stringify([questions,result]),before);assert.equal(Object.isFrozen(review.questions),true);
 for(const name of ['score','points','answers','deadline','startedAt','correctCount'])assert.equal(Object.hasOwn(review,name),false);
});
test('A perfect result has no error-practice session; every failure can be practiced',()=>{
 assert.equal(createDuellReview(questions,answers([],[])),null);assert.equal(createDuellReview(questions,answers([0,1,2,3,4,5,6],[])).questions.length,7);
});
test('Incomplete, mismatched, malformed or impossible results cannot become practice',()=>{
 for(const [q,a,g]of[[questions,answers().slice(1),0],[questions.slice(1),answers(),0],[questions,answers().reverse(),0],[questions,answers().map((answer,i)=>i===0?{...answer,timedOut:true}:answer),0],[questions,answers(),-1],[questions,answers(),1.5],[questions.map((question,i)=>i===0?{...question,correctIds:['missing']}:question),answers(),0]])assert.throws(()=>createDuellReview(q,a,g),/INVALID_DUELL_REVIEW/);
});
test('Review reveals only after its own valid choice, never advances without Next and has no clock input',()=>{
 let review=createDuellReview(questions,answers());assert.equal(duellReviewReducer(review,event(review,'next')),review);assert.equal(duellReviewReducer(review,event(review,'timeout',{now:Number.MAX_SAFE_INTEGER})),review);assert.equal(duellReviewReducer(review,event(review,'answer',{optionId:'unknown'})),review);
 review=duellReviewReducer(review,event(review,'answer',{optionId:'c'}));assert.equal(review.phase,'feedback');assert.equal(review.selectedId,'c');assert.equal(review.index,0);assert.equal(duellReviewReducer(review,event(review,'answer',{optionId:'a'})),review);
 review=duellReviewReducer(review,event(review,'next'));assert.equal(review.phase,'asking');assert.equal(review.index,1);assert.equal(review.selectedId,null);review=duellReviewReducer(review,event(review,'answer',{optionId:'a'}));review=duellReviewReducer(review,event(review,'next'));assert.equal(review.phase,'finished');assert.equal(duellReviewReducer(review,event(review,'next')),review);
});
test('Question, session and explicit current-owner guards reject superseded events',()=>{
 const review=createDuellReview(questions,answers(),3);for(const extra of[{generation:2},{index:1},{isCurrent:()=>false},{isCurrent:()=>{throw Error('gone');}},{isCurrent:true}])assert.equal(duellReviewReducer(review,event(review,'answer',{optionId:'a',...extra})),review);
 assert.equal(duellReviewReducer(review,event(review,'answer',{optionId:'a',isCurrent:()=>true})).phase,'feedback');
});
