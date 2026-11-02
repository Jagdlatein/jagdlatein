const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), {execFileSync} = require('node:child_process');
const {createLoader, local, root} = require('./helpers/project-module.cjs');
const load = createLoader();
const {getExamReviewProgress, examReviewHref} = load('lib/exam-review-progress.js');
const review = load('lib/daily-review.js'), {packDailyReviewCatalog, unpackDailyReviewCatalog} = load('lib/daily-review-catalog.js');
const now = Date.UTC(2026, 10, 1, 12), day = 86400000;
const items = [{id:'wissen-test-wild',category:'wildkunde'}, {id:'wissen-test-dog',category:'hundewesen'}, {id:'wissen-test-fixed',category:'wildkunde'}, {id:'wissen-test-new',category:'wildkunde'}];
const catalog = packDailyReviewCatalog(items);
function history() {
 let data = review.parseReviewHistory(null);
 data = review.updateReviewHistory(data, items[0].id, false, now-3600000, 'old-error');
 data = review.updateReviewHistory(data, items[1].id, false, now, 'not-due-error');
 data = review.updateReviewHistory(data, items[2].id, false, now-2*day, 'former-error');
 data = review.updateReviewHistory(data, items[2].id, true, now, 'fixed');
 return data;
}
test('Counts actual distinct active questions, current errors and due overlap without treating old mistakes as open', () => {
 const value=history(), before=JSON.stringify(value), result=getExamReviewProgress(catalog,before,now);
 assert.deepEqual(result.total,{available:4,answered:3,due:1,mistakes:2});
 assert.deepEqual(result.byCategory.wildkunde,{available:3,answered:2,due:1,mistakes:1});
 assert.deepEqual(result.byCategory.hundewesen,{available:1,answered:1,due:0,mistakes:1});
 assert.equal(JSON.stringify(value),before);
 assert.deepEqual(getExamReviewProgress(catalog,null,now).total,{available:4,answered:0,due:0,mistakes:0});
});
test('All eligible entries are counted beyond the practice round size and expiry uses the exact existing boundary', () => {
 const many=Array.from({length:36},(_,i)=>({id:`wissen-count-${i}`,category:i%2?'hundewesen':'wildkunde'}));
 let h=review.parseReviewHistory(null);for(const item of many)h=review.updateReviewHistory(h,item.id,false,now,'one-'+item.id);
 const packed=packDailyReviewCatalog(many),raw=JSON.stringify(h);
 assert.deepEqual(getExamReviewProgress(packed,raw,now+599999).total,{available:36,answered:36,due:0,mistakes:36});
 assert.deepEqual(getExamReviewProgress(packed,raw,now+600000).total,{available:36,answered:36,due:36,mistakes:36});
});
test('Unknown and removed stored IDs do not fabricate category progress and inherited names are never answers', () => {
 let h=history();h=review.updateReviewHistory(h,'wissen-removed',false,now-day,'removed');
 assert.deepEqual(getExamReviewProgress(catalog,JSON.stringify(h),now).total,{available:4,answered:3,due:1,mistakes:2});
 const inherited=packDailyReviewCatalog([{id:'constructor',category:'wildkunde'}]);
 assert.deepEqual(getExamReviewProgress(inherited,null,now).total,{available:1,answered:0,due:0,mistakes:0});
});
test('Malformed catalog, duplicate bindings, unknown categories, law and unreadable history fail without false zero', () => {
 for(const value of [undefined,null,{},packDailyReviewCatalog([]),packDailyReviewCatalog([items[0],items[0]]),packDailyReviewCatalog([{id:'wissen-law',category:'jagdrecht'}]),packDailyReviewCatalog([{id:'wissen-other',category:'unknown'}]),{...catalog,rows:[[999,'bad',0]]}])assert.equal(getExamReviewProgress(value,null,now),null);
 for(const raw of [undefined,'','{','null','[]','{}','{"version":2,"entries":{}}','{"version":1,"entries":[]}',' '.repeat(1750001)])assert.equal(getExamReviewProgress(catalog,raw,now),null);
 for(const date of [-1,NaN,Infinity,1.1,8640000000000001])assert.equal(getExamReviewProgress(catalog,null,date),null);
 const invalid=history();invalid.entries[items[0].id].due=-1;
 assert.equal(getExamReviewProgress(catalog,JSON.stringify(invalid),now).total.answered,2);
});
test('Only exact public practice mode/category fields enter the practice URL', () => {
 assert.equal(examReviewHref('faellig'),'/lernen/fuenf-minuten?modus=faellig');
 assert.equal(examReviewHref('fehler','wildkunde'),'/lernen/fuenf-minuten?modus=fehler&kategorie=wildkunde');
 for(const category of ['jagdrecht','unknown','wildkunde&email=private',['wildkunde'],null])assert.equal(examReviewHref('fehler',category),null);
 for(const mode of ['',null,[], 'fehler&token=private'])assert.equal(examReviewHref(mode),null);
});
test('Plan SSG reuses the exact public common catalog while its client transform imports no answer pool or legal bank', () => {
 const actual=load('lib/daily-review-pool.js'),props=load('pages/lernen/pruefungsplan.js').getStaticProps().props;
 assert.deepEqual(props.reviewCatalog,actual.getPackedDailyReviewCatalog());
 assert.deepEqual(unpackDailyReviewCatalog(props.reviewCatalog),actual.getDailyReviewCatalog());
 assert.ok(!props.reviewCatalog.categories.includes('jagdrecht'));
 assert.doesNotMatch(JSON.stringify(props.reviewCatalog),/"q"|"answers"|"correct"|"explain"|"reading"|"sources"|email/);
 // The documented all-region metadata now exceeds Next's128KiB advisory.
 // Keep an explicit regression budget without hiding the build warning or
 // calling this local gzip estimate an authenticated production measurement.
 const encoded=JSON.stringify(props);
 assert.ok(Buffer.byteLength(encoded)<400000,'All-region study metadata stays within the documented400kB regression budget');
 assert.ok(require('node:zlib').gzipSync(encoded).length<100000,'Local gzip estimate stays within100kB; not a production transfer measurement');
 const filename=path.join(root,'pages/lernen/pruefungsplan.js');
 const {code}=local('next/dist/build/swc').transformSync(fs.readFileSync(filename,'utf8'),{filename,isPageFile:true,disableNextSsg:false,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 assert.match(code,/__N_SSG/);assert.doesNotMatch(code,/daily-review-pool|learning-curriculum|exam-study-plan-server|regional-law-data/);
});
test('The November2 package preserves curriculum, regional law, review storage and official projection source text', () => {
 // Later reviewed biology additions are already in this package baseline.
 // The pool has its own complete positive semantic preservation regression.
 for(const name of ['lib/daily-review.js','lib/daily-review-catalog.js','lib/exam-study-plan-server.js','lib/learning-curriculum.js','data/learning-expansion-biology-2026-10-16.json','data/jagdrecht-regional/at.json','data/jagdrecht-regional/ch.json','data/jagdrecht-regional/de.json']){
  const before=execFileSync('git',['show',`8b12ce6253ce9bc090aad2c47bd660e5b2280002:${name}`],{cwd:root,maxBuffer:20e6});
  const current=fs.readFileSync(path.join(root,name));
  assert.equal(current.toString().replace(/\r\n/g,'\n'),before.toString().replace(/\r\n/g,'\n'),name);
 }
});
