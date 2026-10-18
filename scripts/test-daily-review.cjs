const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const cache = new Map();
function load(relative) {
  const filename = path.join(root, relative);
  if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), (path.extname(id) ? id : id + '.js')))) : pr(id), mod, mod.exports);
  cache.set(filename, mod.exports); return mod.exports;
}
const api = load('lib/daily-review.js');
const DAY = 86400000, now = Date.UTC(2026, 9, 12);
const empty = api.parseReviewHistory(null);
test('Malformed, oversized and poisoned device records cannot invent progress or object properties', () => {
  for (const value of [null, '{', 'x'.repeat(350001), JSON.stringify({version: 2, entries: {}})]) assert.deepEqual(api.parseReviewHistory(value), empty);
  assert.deepEqual(api.parseReviewHistory('{"version":1,"entries":{"__proto__":{"seen":1},"wissen-a":{"seen":1,"mistakes":2}}}'), empty);
});
test('Duplicate feedback and an earlier response do not count twice; mistakes reset intervals', () => {
  const first = api.updateReviewHistory(empty, 'wissen-a', true, now, 'event-a');
  assert.equal(first.entries['wissen-a'].due, now + DAY);
  assert.deepEqual(api.updateReviewHistory(first, 'wissen-a', true, now + 1, 'event-a'), first);
  assert.deepEqual(api.updateReviewHistory(first, 'wissen-a', false, now - 1, 'event-b'), first);
  const wrong = api.updateReviewHistory(first, 'wissen-a', false, now + DAY, 'event-b');
  assert.equal(wrong.entries['wissen-a'].streak, 0); assert.equal(wrong.entries['wissen-a'].mistakes, 1);
  assert.equal(wrong.entries['wissen-a'].due, now + DAY + 600000);
});

test('The expanded device history retains more than a thousand answers, accepts old records and stays bounded', () => {
  const entries=Object.fromEntries(Array.from({length:5000},(_,index)=>[`wissen-history-${index}`,{seen:1,mistakes:0,streak:1,lastSeen:now-DAY+index*1000,due:now+index*1000,lastEvent:`history-${index}`}]));
  const history=api.parseReviewHistory(JSON.stringify({version:1,entries}));
  assert.equal(Object.keys(history.entries).length,5000);
  assert.ok(history.entries['wissen-history-0'] && history.entries['wissen-history-4999']);
  const next=api.updateReviewHistory(history,'wissen-history-new',true,now,'new-answer');
  assert.equal(Object.keys(next.entries).length,5000);
  assert.ok(next.entries['wissen-history-new'] && next.entries['wissen-history-4999']);
  assert.equal(next.entries['wissen-history-0'],undefined);
  assert.deepEqual(api.parseReviewHistory(JSON.stringify(next)),next);
  const tied={version:1,entries:Object.fromEntries(Object.entries(history.entries).map(([id,item])=>[id,{...item,lastSeen:now,due:now+DAY}]))};
  assert.ok(api.updateReviewHistory(tied,'wissen-same-time-new',true,now,'same-time').entries['wissen-same-time-new']);
  const legacy=api.updateReviewHistory(empty,'wissen-old-device',false,now,'legacy');
  assert.deepEqual(api.parseReviewHistory(JSON.stringify(legacy)),legacy);
  assert.deepEqual(api.parseReviewHistory(' '.repeat(1750001)),empty);
});

test('Long but valid IDs and event tokens cannot make the next history read discard every answer', () => {
  const id=index=>`wissen-${String(index).padStart(4,'0')}-${'x'.repeat(140)}`;
  const entry={seen:1,mistakes:0,streak:1,lastSeen:now-DAY,due:now,lastEvent:'e'.repeat(240)};
  const cost=JSON.stringify({[id(0)]:entry}).length-1;
  const count=Math.floor((1750000-JSON.stringify(empty).length)/cost);
  const history={version:1,entries:Object.fromEntries(Array.from({length:count},(_,index)=>[id(index),{...entry,lastSeen:entry.lastSeen+index,due:entry.due+index}]))};
  assert.ok(count<5000 && JSON.stringify(history).length<=1750000);
  assert.equal(Object.keys(api.parseReviewHistory(JSON.stringify(history)).entries).length,count);
  const next=api.updateReviewHistory(history,id(9999),true,now,'n'.repeat(240));
  assert.ok(JSON.stringify(next).length<=1750000);
  assert.ok(next.entries[id(9999)] && next.entries[id(count-1)]);
  assert.deepEqual(api.parseReviewHistory(JSON.stringify(next)),next);
});
test('A round prioritizes due mistakes and due repetitions, excludes other categories and unknown history', () => {
  const pool = [{id:'wissen-a', category:'wildkunde'}, {id:'wissen-b', category:'wildkunde'}, {id:'wissen-c', category:'wildkunde'}, {id:'wissen-d', category:'hundewesen'}];
  let history = api.updateReviewHistory(empty, 'wissen-a', false, now - DAY, 'a');
  history = api.updateReviewHistory(history, 'wissen-b', true, now - 2 * DAY, 'b');
  history = api.updateReviewHistory(history, 'wissen-deleted', false, now - 3 * DAY, 'c');
  const round = api.selectDailyReview(pool, history, {now, category:'wildkunde'});
  assert.deepEqual(round.map(item => item.id), ['wissen-a', 'wissen-b', 'wissen-c']);
  assert.deepEqual(round.map(item => item.reason), ['Fehler wiederholen', 'Fällige Wiederholung', 'Neu entdecken']);
});

test('Fresh mixed rounds spread categories before seconds and remain reproducible without changing the input', () => {
  const pool = ['wildkunde', 'hundewesen', 'natur-revier'].flatMap((category, group) => Array.from({length: 12}, (_, index) => ({id:`wissen-long-shared-prefix-group-${group}-q${index}`,category})));
  const before = JSON.stringify(pool), settings = {now,count:8};
  const round = api.selectDailyReview(pool, empty, settings);
  assert.equal(round.length,8); assert.equal(new Set(round.slice(0,3).map(item=>item.category)).size,3);
  const counts=[...new Set(pool.map(item=>item.category))].map(category=>round.filter(item=>item.category===category).length);
  assert.deepEqual(counts.sort(),[2,3,3]);
  assert.deepEqual(api.selectDailyReview(pool,empty,settings),round);
  assert.equal(JSON.stringify(pool),before);
  for(const item of round) assert.deepEqual(Object.keys(item).sort(),['category','id','reason']);
  const selected=api.selectDailyReview(pool,empty,{...settings,category:'hundewesen'});
  assert.equal(selected.length,8); assert.ok(selected.every(item=>item.category==='hundewesen'));
});

test('Category variety never displaces due errors or due-time order and exhausts sparse groups without duplicates', () => {
  const due=Array.from({length:9},(_,i)=>({id:`wissen-due-${i}`,category:'wildkunde'}));
  const fresh=[{id:'wissen-fresh-a',category:'hundewesen'},...Array.from({length:12},(_,i)=>({id:`wissen-fresh-b-${i}`,category:'natur-revier'}))];
  let history=empty;
  for(let i=0;i<due.length;i++)history=api.updateReviewHistory(history,due[i].id,false,now-DAY+i*1000,`due-${i}`);
  assert.deepEqual(api.selectDailyReview([...fresh,...due].reverse(),history,{now}).map(item=>item.id),due.slice(0,8).map(item=>item.id));
  const firstTwo=Object.fromEntries(Object.entries(history.entries).filter(([id])=>due.slice(0,2).some(item=>item.id===id)));
  const round=api.selectDailyReview([...fresh,...due.slice(0,2)],{version:1,entries:firstTwo},{now,count:20});
  assert.equal(round.length,15); assert.equal(new Set(round.map(item=>item.id)).size,15);
  assert.deepEqual(round.slice(0,2).map(item=>item.id),due.slice(0,2).map(item=>item.id));
  assert.ok(round.slice(0,2).every(item=>item.reason==='Fehler wiederholen'));
  assert.equal(new Set(round.slice(2,4).map(item=>item.category)).size,2);
  const future=api.updateReviewHistory(empty,'wissen-future-a',true,now,'future');
  const all=api.selectDailyReview([...fresh,{id:'wissen-future-a',category:'wildkunde'}],future,{now,count:20});
  assert.equal(all.at(-1).id,'wissen-future-a');assert.equal(all.at(-1).reason,'Erneut festigen');
});

test('The actual growing catalog no longer clusters adjacent course IDs in daily discovery', () => {
  const modules=load('lib/learning-curriculum.js').learningModules;
  const catalog=load('lib/daily-review-pool.js').getDailyReviewCatalog();
  const courses=new Map(modules.flatMap(course=>course.questions.map(question=>[question.id,course.id])));
  const categoryCount=new Set(catalog.map(item=>item.category)).size;
  for(let day=0;day<30;day++){
    const options={now:now+day*DAY};
    const mixed=api.selectDailyReview(catalog,empty,options);
    assert.equal(new Set(mixed.map(item=>item.category)).size,Math.min(8,categoryCount));
    const wildlife=api.selectDailyReview(catalog,empty,{...options,category:'wildkunde'});
    assert.ok(new Set(wildlife.map(item=>courses.get(item.id))).size>=3,`Wildkunde day ${day}`);
  }
});
test('Repetition never widens regional legal questions and links to a real lesson', () => {
  const modules = load('lib/learning-curriculum.js').learningModules;
  const pool = load('lib/daily-review-pool.js').getDailyReviewPool();
  assert.ok(pool.length > 600); assert.equal(new Set(pool.map(item => item.id)).size, pool.length);
  assert.ok(!pool.some(item => item.id === 'wissen-waffensicherheit-4'));
  for (const item of pool) {
    const course = modules.find(course => course.questions.some(question => question.id === item.id));
    const question = course.questions.find(question => question.id === item.id);
    assert.equal(question.countries.length, 3); assert.notEqual(question.topic, 'Recht');
    assert.ok(item.href.includes('#lesson-')); assert.ok(course.lessons.some(lesson => item.href.endsWith(encodeURIComponent(lesson.id))));
  }
});
test('Storage failure leaves practice available and history clearing does not change server account data', () => {
  global.window = {localStorage: {getItem() {throw Error('denied');}, setItem() {throw Error('denied');}, removeItem() {throw Error('denied');}}};
  assert.deepEqual(api.readReviewHistory(), empty); assert.equal(api.recordReviewAnswer('wissen-a', true, 'a'), false); assert.equal(api.clearReviewHistory(), false);
  let removed; window.localStorage.removeItem = key => {removed = key;};
  assert.equal(api.clearReviewHistory(), true); assert.equal(removed, api.REVIEW_STORAGE_KEY); delete global.window;
});
