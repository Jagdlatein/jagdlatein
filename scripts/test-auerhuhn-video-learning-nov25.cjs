// Public data/binary checks and real isolated React/DOM answer interactions.
// No browser session, real account, API call or private storage is used.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const load = createLoader();
const baseline = '61019897797d9fe851ff3bb25e46a5a5a534e578';
const id = 'auerhuhn-baum', directory = '/lernen/videos-2026-11-25';
const scene = load('lib/wildlife-video-cases.js').wildlifeVideoCases.find(item => item.id === id);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const asset = href => fs.readFileSync(path.join(root, 'public', href));
const record = JSON.parse(asset(`${directory}/mediennachweise.json`))[0];
function publishedLoader() {
  const cache = new Map();
  function old(relative) {
    const filename = path.resolve(root, relative), file = path.relative(root, filename).replaceAll('\\', '/');
    assert.ok(file && !file.startsWith('../') && !path.isAbsolute(file));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git', ['show', `${baseline}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 30000000 });
    if (file.endsWith('.json')) return JSON.parse(source.replace(/^\uFEFF/, ''));
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(name => name.startsWith('.') ? old(path.resolve(path.dirname(filename), path.extname(name) ? name : `${name}.js`)) : local(name), module, module.exports);
    return module.exports;
  }
  return old;
}
function atoms(bytes, start = 0, end = bytes.length) {
  const result = [];
  while (start < end) {
    assert.ok(start + 8 <= end);
    const type = bytes.toString('ascii', start + 4, start + 8);
    let size = bytes.readUInt32BE(start), header = 8;
    if (size === 1) { assert.ok(start + 16 <= end); size = Number(bytes.readBigUInt64BE(start + 8)); header = 16; }
    if (!size) size = end - start;
    assert.ok(Number.isSafeInteger(size) && size >= header && start + size <= end);
    result.push({ type, start, body: start + header, end: start + size }); start += size;
  }
  assert.equal(start, end); return result;
}
function child(bytes, box, type) { const value = atoms(bytes, box.body, box.end).find(item => item.type === type); assert.ok(value, type); return value; }

test('All25 published complete wildlife scenes/71questions, all4dog scenes, links and discovery entries remain exact in order', () => {
  const old = publishedLoader(), previous = old('lib/wildlife-video-cases.js'), current = load('lib/wildlife-video-cases.js');
  assert.equal(previous.wildlifeVideoCases.length, 25); assert.equal(previous.wildlifeVideoQuestionCount, 71);
  assert.deepEqual(current.wildlifeVideoCases.slice(0, 25), previous.wildlifeVideoCases);
  assert.deepEqual(current.wildlifeVideoCases.filter(item => item.id !== id), previous.wildlifeVideoCases);
  assert.equal(current.wildlifeVideoCases.length, 26); assert.equal(current.wildlifeVideoQuestionCount, 74);
  assert.deepEqual(load('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons, old('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons);
  assert.deepEqual(load('lib/learning-video-links.js').learningVideoLinks.filter(item => item.id !== id), old('lib/learning-video-links.js').learningVideoLinks);
  const previousDiscovery = old('lib/learning-video-discovery.js'), currentDiscovery = load('lib/learning-video-discovery.js');
  for (const item of previous.wildlifeVideoCases) assert.deepEqual(currentDiscovery.getLearningVideoDiscovery(item.id), previousDiscovery.getLearningVideoDiscovery(item.id), item.id);
});

test('The actual bounded MP4 stores590positive-duration H264samples at30fps with720p square pixels, faststart and noaudio', () => {
  const bytes = asset(scene.src);
  assert.equal(bytes.length, 6091131); assert.equal(hash(bytes), 'eb56b5eaa782b9a608406fba9930aaf7e0016ba5292bea662999953daf0f4c64');
  assert.equal(bytes.length, record.bytes); assert.equal(hash(bytes), record.sha256);
  const top = atoms(bytes), moov = top.find(box => box.type === 'moov'), mdat = top.find(box => box.type === 'mdat');
  assert.equal(top[0].type, 'ftyp'); assert.ok(moov && mdat && moov.start < mdat.start);
  const tracks = atoms(bytes, moov.body, moov.end).filter(box => box.type === 'trak'); assert.equal(tracks.length, 1);
  const media = child(bytes, tracks[0], 'mdia'), handler = child(bytes, media, 'hdlr'); assert.equal(bytes.toString('ascii', handler.body + 8, handler.body + 12), 'vide');
  const mdhd = child(bytes, media, 'mdhd'); assert.equal(bytes[mdhd.body], 0);
  const scale = bytes.readUInt32BE(mdhd.body + 12), duration = bytes.readUInt32BE(mdhd.body + 16);
  assert.equal(scale, 15360); assert.equal(duration / scale, 590 / 30);
  const table = child(bytes, child(bytes, media, 'minf'), 'stbl'), sizes = child(bytes, table, 'stsz');
  assert.equal(bytes.readUInt32BE(sizes.body + 8), 590);
  const timing = child(bytes, table, 'stts'), runs = bytes.readUInt32BE(timing.body + 4); let frames = 0, ticks = 0;
  for (let n = 0; n < runs; n++) { const count = bytes.readUInt32BE(timing.body + 8 + n * 8), delta = bytes.readUInt32BE(timing.body + 12 + n * 8); assert.ok(count > 0); assert.equal(delta, 512); frames += count; ticks += count * delta; }
  assert.equal(frames, 590); assert.equal(ticks, duration);
  const descriptions = child(bytes, table, 'stsd'), sample = atoms(bytes, descriptions.body + 8, descriptions.end)[0];
  assert.equal(sample.type, 'avc1'); assert.equal(bytes.readUInt16BE(sample.start + 32), 1280); assert.equal(bytes.readUInt16BE(sample.start + 34), 720);
  const config = atoms(bytes, sample.start + 86, sample.end), pixelAspect = config.find(box => box.type === 'pasp'); assert.ok(pixelAspect);
  assert.equal(bytes.readUInt32BE(pixelAspect.body), bytes.readUInt32BE(pixelAspect.body + 4));
  assert.equal(record.originalBytes, 34347522); assert.equal(record.originalSha1, '43e61ed91b4160fdd1b3727be53a2e2418e96721');
  assert.equal(record.frames, 590); assert.equal(record.pixelFormat, 'yuv420p'); assert.equal(record.audioTracks, 0);
});

test('The actual JPEG decodes fully, matches its credit record and uses a frame from the same final recording', async () => {
  const bytes = asset(scene.poster), sharp = local('sharp'), image = sharp(bytes), metadata = await image.metadata();
  await image.raw().toBuffer(); assert.equal(metadata.format, 'jpeg'); assert.equal(metadata.width, 1280); assert.equal(metadata.height, 720);
  assert.equal(bytes.length, record.posterBytes); assert.equal(hash(bytes), record.posterSha256);
  assert.equal(record.posterAtSeconds, 3); assert.deepEqual(record.questionsAtSeconds, [3,10,15]); assert.deepEqual(record.questionFrameIndices, [90,300,450]);
});

test('New authored observations have4distinct answers with unique keys and scoped actual sources/dates instead of an invented DACH location', () => {
  assert.equal(scene.questions.length, 3); assert.equal(scene.reviewedOn, '2026-11-25');
  assert.deepEqual(scene.questions.map(question => question.answer), [1,2,0]); assert.deepEqual(scene.questions.map(question => question.at), [3,10,15]);
  for (const question of scene.questions) { assert.equal(question.choices.length, 4); assert.equal(new Set(question.choices).size, 4); assert.ok(question.explanation.length > 100); }
  for (const key of ['author','license','licenseUrl','source','sourceTitle','originalSource']) assert.equal(scene[key], record[key]);
  assert.equal(scene.author, 'gailhampshire'); assert.equal(scene.license, 'CC BY 2.0'); assert.equal(scene.knowledgeSources.length, 2);
  assert.match(scene.location, /Schottland/); assert.match(scene.modifications, /stumme Fassung/); assert.match(scene.transcript, /kein genaues Alter|kein genaues/);
  assert.ok(scene.knowledgeSources.some(source => source.url === 'https://www.bfn.de/artenportraits/tetrao-urogallus'));
  assert.ok(scene.knowledgeSources.some(source => source.url === 'https://www.birdlife.at/voegel/auerhuhn/'));
  const credits = asset(`${directory}/MEDIEN-LIZENZEN.md`).toString();
  for (const value of [scene.author,scene.license,scene.licenseUrl,scene.source,scene.sourceTitle,scene.originalSource]) assert.ok(credits.includes(value), value);
  assert.match(credits, /Originalton wurde entfernt/);
});

test('The original course, exact lesson and portrait are reciprocal discovery/search targets without transporting answer keys', () => {
  const { learningVideoLinks, getWildlifeVideoLinks, getCourseVideoLinks } = load('lib/learning-video-links.js');
  const link = learningVideoLinks.find(item => item.id === id), module = load('lib/learning-curriculum.js').getLearningModule('wissen-federwild-beobachtung');
  assert.deepEqual(link.speciesSlugs, ['auerhuhn']); assert.deepEqual(link.moduleIds, [module.id]); assert.ok(module.lessons.some(lesson => lesson.id === 'vogel-merkmale'));
  assert.ok(getWildlifeVideoLinks('auerhuhn').some(item => item.id === id)); assert.ok(getCourseVideoLinks(module.id).some(item => item.id === id));
  const library = load('lib/learning-video-library.js').getLearningVideoLibrary(); assert.equal(library.length, 30);
  const row = library.find(item => item.id === `wild-${id}`); assert.equal(row.courses[0].href, scene.course); assert.equal(row.href, link.href);
  assert.ok(load('lib/video-library-search.js').filterLearningVideos(library, 'Auerhahn Rosen', 'wild').some(item => item.id === row.id));
  const search = load('lib/learning-search.js').searchLearning, first = search({ query: 'Auerhuhn', type: 'entry', category: 'wildkunde' });
  const results = [first.results, ...Array.from({ length: first.pages-1 }, (_, n) => search({ query: 'Auerhuhn', type: 'entry', category: 'wildkunde', page: n+2 }).results)].flat();
  assert.ok(results.some(item => item.href.split('#')[0] === link.href.split('#')[0]));
  const entry = load('lib/media-search-entries.js').mediaSearchEntries.find(item => item.id === `video-${id}`); assert.ok(entry);
  for (const question of scene.questions) for (const record of [row,entry,link]) { assert.ok(!JSON.stringify(record).includes(question.question)); assert.ok(!JSON.stringify(record).includes(question.explanation)); }
});

test('Only2exact media paths and2attribution documents extend public access; lesson/answer/neighbouring paths stay guarded', async () => {
  const current = load('lib/media-experience-asset-paths.js'), previous = publishedLoader()('lib/media-experience-asset-paths.js');
  const media = [scene.src,scene.poster], docs = [`${directory}/mediennachweise.json`,`${directory}/MEDIEN-LIZENZEN.md`];
  assert.deepEqual(current.mediaExperienceAssetPaths, [...previous.mediaExperienceAssetPaths.slice(0,-load('lib/anatomy-explorer.js').anatomyAssetPaths.length), ...media, ...load('lib/anatomy-explorer.js').anatomyAssetPaths]);
  assert.deepEqual(current.mediaExperienceAssetPaths.filter(value => !media.includes(value)), previous.mediaExperienceAssetPaths);
  assert.deepEqual(current.mediaExperienceDocumentationPaths, [...previous.mediaExperienceDocumentationPaths,...docs]);
  const middleware = load('middleware.js').middleware, request = value => { const nextUrl = new URL(value,'https://jagdlatein.de'); return { nextUrl, url: nextUrl.href, cookies:{get(){return undefined;}} }; };
  for (const value of [...media,...docs]) { const response = await middleware(request(value)); assert.equal(response.headers.get('x-middleware-next'), '1', value); }
  for (const value of [directory,`${directory}/answers.json`,`${directory}/mediennachweise.json/extra`,`${directory}/original.webm`,`${scene.src}/private`, `/lernen/wildtier-videofaelle?eintrag=${id}`, scene.course]) { const response = await middleware(request(value)); assert.notEqual(response.headers.get('x-middleware-next'), '1', value); assert.equal(new URL(response.headers.get('location')).pathname, '/preise', value); }
});

let JSDOM;
try { ({ JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || 'jsdom')); }
catch (error) { throw new Error('Set JAGDLATEIN_TEST_DOM to the isolated existing jsdom module.', { cause: error }); }
const React = local('react'), wrap = value => ({ __esModule:true,default:value });
async function fixture() {
  const dom = new JSDOM('<div id="root"></div>', { url:`https://isolated.invalid/lernen/wildtier-videofaelle?eintrag=${id}#video-fall`, pretendToBeVisual:true });
  const keys = ['window','document','navigator','HTMLElement','HTMLVideoElement','Event','MouseEvent','requestAnimationFrame','cancelAnimationFrame','IS_REACT_ACT_ENVIRONMENT'];
  const saved = keys.map(key => [key,Object.getOwnPropertyDescriptor(global,key)]);
  for (const key of keys) Object.defineProperty(global,key,{configurable:true,writable:true,value:key==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[key]});
  dom.window.scrollTo = () => {}; dom.window.HTMLMediaElement.prototype.pause = () => {};
  const router = {isReady:true,query:{eintrag:id},asPath:`/lernen/wildtier-videofaelle?eintrag=${id}#video-fall`,push:async()=>{throw Error('No navigation in answer tests');}};
  const loader = createLoader({'next/router':{useRouter:()=>router},'next/link':wrap(({href,children,...props})=>React.createElement('a',{href,...props},children)),
    './LearningToolLayout':wrap(({children})=>React.createElement('main',null,React.createElement('h1',{'data-learning-page-start':true,tabIndex:-1},'Wildtier-Videofälle'),children)),
    './PageMenu':{...wrap(({children})=>React.createElement('aside',null,children)),openPageMenu(){},closePageMenu(){}}, './MediaExamLawLink':wrap(()=>React.createElement('a',{href:'/lernen/jagdrecht'},'Recht'))});
  const Component = loader('components/WildlifeVideoCases.js').default, host = dom.window.document.getElementById('root'), reactRoot = local('react-dom/client').createRoot(host);
  await React.act(async()=>{reactRoot.render(React.createElement(Component));});
  return { host,
    async click(label){const button=[...host.querySelectorAll('button')].find(node=>node.textContent===label);assert.ok(button,label);assert.equal(button.disabled,false,label);await React.act(async()=>button.click());},
    async cleanup(){await React.act(async()=>reactRoot.unmount());dom.window.close();for(const[key,descriptor]of saved)if(descriptor)Object.defineProperty(global,key,descriptor);else delete global[key];}
  };
}
test('Actual DOM initially gates answers and retains closed transcript/sources, lazy media and complete title/license attribution at the end', async () => {
  const h = await fixture();
  try {
    const video = h.host.querySelector('video'); assert.ok(video); assert.equal(video.getAttribute('preload'),'none'); assert.equal(video.autoplay,false);
    assert.equal(video.querySelector('source').getAttribute('src'),scene.src);
    assert.equal(h.host.querySelector('#video-textfassung').open,false);
    for(const choice of scene.questions[0].choices) assert.equal([...h.host.querySelectorAll('button')].find(node=>node.textContent===choice).disabled,true);
    assert.equal(h.host.querySelector('[role="status"]'),null);
    const credit = [...h.host.querySelectorAll('details')].find(node=>node.querySelector('summary')?.textContent==='Inhalt und Quellen prüfen');
    assert.ok(credit);assert.equal(credit.open,false);assert.equal(credit.parentElement.lastElementChild,credit);
    assert.ok(credit.textContent.includes(scene.sourceTitle));assert.ok(credit.textContent.includes(scene.author));
    for(const url of [scene.source,scene.originalSource,scene.licenseUrl,...scene.knowledgeSources.map(source=>source.url)]) assert.ok([...credit.querySelectorAll('a')].some(anchor=>anchor.href===url),url);
    assert.equal(h.host.querySelector('progress').max,74);
  } finally {await h.cleanup();}
});
test('All12 deliberate answer branches show feedback only after choice and keep the following question blind', async t => {
  for(let option=0;option<4;option++) await t.test(`option${option+1} across all3questions`,async()=>{
    const h=await fixture();
    try {
      await h.click('Textfassung gelesen – Fragen öffnen');
      for(const[index,question]of scene.questions.entries()) {
        assert.ok(h.host.textContent.includes(question.question));assert.ok(!h.host.textContent.includes(question.explanation));
        for(const choice of question.choices){const button=[...h.host.querySelectorAll('button')].find(node=>node.textContent===choice);assert.ok(button);assert.equal(button.disabled,false);assert.ok(!button.className.includes('correct'));}
        await h.click(question.choices[option]);
        const feedback=h.host.querySelector('[role="status"]');assert.ok(feedback);assert.ok(feedback.textContent.includes(question.explanation));
        assert.ok(feedback.textContent.includes(option===question.answer?'Richtig beobachtet.':`Richtig ist: ${question.choices[question.answer]}`));
        if(index<2){await h.click('Nächste Frage');assert.equal(h.host.querySelector('[role="status"]'),null);}
      }
    } finally {await h.cleanup();}
  });
});
