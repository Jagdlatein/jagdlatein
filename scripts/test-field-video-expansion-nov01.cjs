// Binary, historical, access-boundary and rendered integration checks. These
// do not substitute for source reading or visual review of the actual frames.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const load = createLoader();
const added = load('lib/wildlife-video-expansion-field-2026-11-01.js').wildlifeVideoFieldExpansionNov01Cases;
const videos = load('lib/wildlife-video-cases.js');
const dogs = load('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons;
const dir = '/lernen/videos-wildkunde-2026-11-01';
const records = load(`public${dir}/mediennachweise.json`);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const expected = [
  { id:'steinwild-ljubljana', slug:'steinwild', title:'Steinwild im Zoo Ljubljana', author:'NaIzletuSi ™', license:'CC BY 3.0', course:'/kurse/wissen-gams-steinbock#lesson-berg-merkmale', duration:28.011, frames:839, bytes:9552539, hash:'8b02c936b924029335b50f5bbde97310a76b6ee72974041d7e11f7bdbd4c7eac', posterTime:13, posterBytes:260955, posterHash:'a694d5e9bf7c80ef990c2f308d7bece8d0c861176b31ec30fa72d5daf924ac97', times:[3,13] },
  { id:'reiherente-petrosawodsk', slug:'reiherente', title:'Reiherente auf dem Wasser', author:'Olksolo', license:'CC BY-SA 4.0', course:'/kurse/wissen-federwild-beobachtung#lesson-vogel-merkmale', duration:27.975, frames:839, bytes:13055904, hash:'8c25c2e535df8042e5a48f9ceecf043d7c2dc46e46ec63a5fd2a7ab09c35f263', posterTime:3, posterBytes:219369, posterHash:'d2b94de2346eba71c41fbfde45bcc7f5ec37eb76de0967d5262bd86668ba5209', times:[3,11] },
];
const addedIds = new Set(expected.map(item => item.id));
function historicalLoader() {
  const cache = new Map(), swc = local('next/dist/build/swc');
  function old(relative) {
    const filename = path.resolve(root, relative), file = path.relative(root, filename).replaceAll('\\','/');
    assert.ok(file && !file.startsWith('../') && !path.isAbsolute(file));
    if (cache.has(filename)) return cache.get(filename).exports;
    const source = execFileSync('git',['show',`1bf28f2c4d288a95457a37ca2543a6cdfc1487d9:${file}`],{cwd:root,encoding:'utf8',maxBuffer:30000000});
    const module = {exports:{}}; cache.set(filename,module);
    const {code} = swc.transformSync(source,{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
    new Function('require','module','exports',code)(id => id.startsWith('.') ? old(path.resolve(path.dirname(filename),path.extname(id)?id:`${id}.js`)) : local(id),module,module.exports);
    return module.exports;
  } return old;
}

function atoms(data, start = 0, end = data.length) {
  const result = []; let position = start;
  while (position < end) {
    assert.ok(position + 8 <= end, 'Bounded atom header');
    const type = data.toString('ascii', position + 4, position + 8);
    let size = data.readUInt32BE(position), header = 8;
    if (size === 1) { assert.ok(position + 16 <= end); size = Number(data.readBigUInt64BE(position + 8)); header = 16; }
    if (size === 0) size = end - position;
    assert.ok(Number.isSafeInteger(size) && size >= header && position + size <= end, `${type}: bounded payload`);
    result.push({ type, start: position, body: position + header, end: position + size }); position += size;
  }
  assert.equal(position, end); return result;
}
function child(data, parent, type) {
  const value = atoms(data, parent.body, parent.end).find(atom => atom.type === type); assert.ok(value, `${parent.type}/${type}`); return value;
}
function timing(data, atom) {
  const version = data[atom.body]; assert.ok(version === 0 || version === 1);
  const position = atom.body + (version === 0 ? 12 : 20), scale = data.readUInt32BE(position);
  const ticks = version === 0 ? data.readUInt32BE(position + 4) : Number(data.readBigUInt64BE(position + 4));
  assert.ok(scale > 0); return { scale, ticks, duration: ticks / scale };
}
function avcFormat(data, atom) {
  assert.equal(data[atom.body], 1);
  assert.equal(data[atom.body + 1], 100, 'H.264 High profile');
  assert.ok((data[atom.body + 5] & 31) > 0, 'An actual sequence parameter set exists');
  const length = data.readUInt16BE(atom.body + 6), nal = data.subarray(atom.body + 8, atom.body + 8 + length);
  assert.equal(nal[0] & 31, 7, 'AVC SPS NAL unit');
  const rbsp = [];
  for (let i = 1; i < nal.length; i++) if (!(nal[i] === 3 && nal[i - 1] === 0 && nal[i - 2] === 0)) rbsp.push(nal[i]);
  let bit = 24;
  const read = () => { assert.ok(bit < rbsp.length * 8); const value = rbsp[bit >> 3] >> (7 - (bit & 7)) & 1; bit++; return value; };
  const ue = () => { let zeros = 0; while (!read()) { zeros++; assert.ok(zeros < 32); } let result = 1; while (zeros--) result = result * 2 + read(); return result - 1; };
  ue(); // seq_parameter_set_id
  assert.equal(ue(), 1, 'SPS chroma_format_idc 1: YUV 4:2:0');
  assert.equal(ue(), 0, 'Eight-bit luma'); assert.equal(ue(), 0, 'Eight-bit chroma');
}
function filmInfo(data) {
  const top = atoms(data); assert.equal(top[0].type, 'ftyp');
  const movie = top.find(atom => atom.type === 'moov'), payload = top.find(atom => atom.type === 'mdat');
  assert.ok(movie && payload && movie.start < payload.start, 'Fast-start metadata before media bytes');
  const movieTiming = timing(data, child(data, movie, 'mvhd'));
  const media = atoms(data, movie.body, movie.end).filter(atom => atom.type === 'trak').map(track => child(data, track, 'mdia')).find(mdia => {
    const handler = child(data, mdia, 'hdlr'); return data.toString('ascii', handler.body + 8, handler.body + 12) === 'vide';
  }); assert.ok(media, 'Video track exists');
  const videoTiming = timing(data, child(data, media, 'mdhd'));
  const table = child(data, child(data, media, 'minf'), 'stbl');
  const samples = child(data, table, 'stsz'), frameCount = data.readUInt32BE(samples.body + 8);
  const timeTable = child(data, table, 'stts'), entries = data.readUInt32BE(timeTable.body + 4);
  assert.equal(timeTable.body + 8 + entries * 8, timeTable.end);
  let timingFrames = 0, ticks = 0;
  for (let i = 0; i < entries; i++) { const count = data.readUInt32BE(timeTable.body + 8 + i * 8), delta = data.readUInt32BE(timeTable.body + 12 + i * 8); timingFrames += count; ticks += count * delta; }
  assert.equal(timingFrames, frameCount); assert.equal(ticks, videoTiming.ticks);
  const descriptions = child(data, table, 'stsd'); assert.equal(data.readUInt32BE(descriptions.body + 4), 1);
  const description = atoms(data, descriptions.body + 8, descriptions.end)[0]; assert.equal(description.type, 'avc1');
  const width = data.readUInt16BE(description.start + 32), height = data.readUInt16BE(description.start + 34);
  assert.deepEqual([width, height], [1280, 720]); assert.equal(width % 2, 0); assert.equal(height % 2, 0);
  assert.equal(width / height, 1920 / 1080, 'Actual original display aspect retained');
  const format = atoms(data, description.start + 86, description.end), avc = format.find(atom => atom.type === 'avcC'); assert.ok(avc); avcFormat(data, avc);
  const aspect = format.find(atom => atom.type === 'pasp'); if (aspect) assert.equal(data.readUInt32BE(aspect.body), data.readUInt32BE(aspect.body + 4));
  return { frameCount, movieDuration: movieTiming.duration, videoDuration: videoTiming.duration };
}



test('Two exact source-backed scenes and complete playable files retain their own licenses and all original frames', () => {
  assert.deepEqual(added.map(item => item.id), expected.map(item => item.id));
  assert.deepEqual(records.map(item => item.id), expected.map(item => item.id));
  assert.deepEqual(fs.readdirSync(path.join(root,'public',dir)).sort(), ['MEDIEN-LIZENZEN.md','mediennachweise.json',...expected.flatMap(item => [item.id+'.mp4',item.id+'-vorschau.jpg'])].sort());
  for (const [i, item] of added.entries()) {
    const spec = expected[i], record = records[i];
    for (const [field,value] of Object.entries({title:spec.title,speciesSlug:spec.slug,author:spec.author,license:spec.license,course:spec.course})) assert.equal(item[field],value);
    for (const key of ['source','author','license','licenseUrl','modifications']) assert.equal(item[key],record[key]);
    assert.equal(item.src,`${dir}/${spec.id}.mp4`); assert.equal(record.file,item.src);
    assert.equal(item.poster,`${dir}/${spec.id}-vorschau.jpg`); assert.equal(record.poster,item.poster);
    assert.equal(item.mimeType,'video/mp4'); assert.equal(item.reviewedOn,'2026-11-01'); assert.equal(record.checked,item.reviewedOn);
    assert.equal(record.aiGenerated,false); assert.equal(record.posterTime,spec.posterTime);
    assert.equal(item.duration,Math.ceil(spec.duration)); assert.equal(record.duration,spec.duration);
    assert.equal(record.sourceVideoFrames,spec.frames); assert.equal(record.encodedVideoFrames,spec.frames);
    const film = fs.readFileSync(path.join(root,'public',item.src)), poster = fs.readFileSync(path.join(root,'public',item.poster));
    assert.equal(film.length,spec.bytes); assert.equal(record.bytes,spec.bytes); assert.equal(hash(film),spec.hash); assert.equal(record.sha256,spec.hash);
    assert.equal(poster.length,spec.posterBytes); assert.equal(hash(poster),spec.posterHash); assert.equal(record.posterSha256,spec.posterHash);
    assert.equal(poster.readUInt16BE(0),0xffd8);
    const actual = filmInfo(film); assert.equal(actual.frameCount,spec.frames); assert.equal(actual.movieDuration,spec.duration);
    assert.ok(Math.abs(record.duration-record.sourceDuration)<0.1,'Container/audio padding is distinguished from the preserved complete frame sequence');
  }
  const credits = fs.readFileSync(path.join(root,'public',dir,'MEDIEN-LIZENZEN.md'),'utf8');
  for (const spec of expected) for (const text of [spec.author,spec.license,spec.id+'.mp4',spec.id+'-vorschau.jpg']) assert.ok(credits.includes(text),text);
  assert.doesNotMatch(credits,/Uppflog|graugans-auffliegen/);
});

test('All23 prior full video objects,63 prior questions, lightweight links and ordering remain exact against published Git1bf28f2', () => {
  const old = historicalLoader(), beforeWild = old('lib/wildlife-video-cases.js').wildlifeVideoCases;
  const beforeDogs = old('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons;
  assert.equal(beforeWild.length+beforeDogs.length,23); assert.equal([...beforeWild,...beforeDogs].flatMap(item=>item.questions).length,63);
  assert.deepEqual(videos.wildlifeVideoCases.filter(item=>!addedIds.has(item.id)),beforeWild);
  assert.deepEqual(videos.wildlifeVideoCases.slice(0,beforeWild.length),beforeWild); assert.deepEqual(dogs,beforeDogs);
  assert.deepEqual(load('lib/learning-video-links.js').learningVideoLinks.filter(item=>!addedIds.has(item.id)),old('lib/learning-video-links.js').learningVideoLinks);
  assert.equal(videos.wildlifeVideoCases.length+dogs.length,25); assert.equal(videos.wildlifeVideoQuestionCount,59);
  assert.equal([...videos.wildlifeVideoCases,...dogs].flatMap(item=>item.questions).length,67);
});

test('Both whole-frame JPEG posters fully decode at1280by720 without a hidden crop or broken payload', async()=>{
  const sharp=local('sharp');
  for(const item of expected){
    const picture=sharp(fs.readFileSync(path.join(root,'public',dir,item.id+'-vorschau.jpg')));
    const metadata=await picture.metadata(); assert.equal(metadata.format,'jpeg'); assert.deepEqual([metadata.width,metadata.height],[1280,720]);
    const decoded=await picture.raw().toBuffer({resolveWithObject:true}); assert.equal(decoded.data.length,1280*720*decoded.info.channels);
  }
});

test('Four distinct feature questions use their actual inspected MP4 times without inventing a third question', () => {
  const all = [...videos.wildlifeVideoCases,...dogs].flatMap(item=>item.questions);
  assert.equal(new Set(all.map(item=>item.question.trim().toLocaleLowerCase('de'))).size,all.length);
  for (const [i,item] of added.entries()) {
    assert.equal(item.questions.length,2); assert.deepEqual(item.questions.map(q=>q.at),expected[i].times);
    assert.equal(item.observations.length,3);
    assert.ok(item.transcript.split(/\s+/).length>=100 && item.transcript.split(/\s+/).length<=140);
    assert.equal(new Set(item.questions.map(q=>q.id)).size,2);
    for (const q of item.questions) {
      assert.ok(q.at>=0 && q.at<records[i].duration); assert.equal(q.choices.length,3); assert.equal(new Set(q.choices).size,3);
      assert.ok(Number.isInteger(q.answer) && q.answer>=0 && q.answer<3); assert.ok(q.explanation.length>=90);
    }
  }
  assert.match(added[0].transcript,/Zoo/);
  assert.match(added[0].transcript,/August 2023/);
  assert.match(added[0].transcript,/Die Querwülste an der Vorderseite sind von den Jahresringen an der Hornrückseite zu unterscheiden/);
  assert.doesNotMatch(added[0].transcript,/Der verknüpfte Kurs unterscheidet/);
  assert.match(added[1].transcript,/Füße.*(?:Wasser|nicht)/);
  assert.equal(added[0].soundHref,undefined);
});

test('New films resolve precise existing courses, portraits, search entries and the independently sourced sound without loading answers into discovery', () => {
  const {getLearningModule}=load('lib/learning-curriculum.js');
  const {getLearningVideoLibrary}=load('lib/learning-video-library.js'), library=getLearningVideoLibrary();
  const {getCourseVideoLinks,getWildlifeVideoLinks}=load('lib/learning-video-links.js');
  const {europeanWildlifeBySlug}=load('lib/european-wildlife-discovery.js');
  const {mediaSearchEntries}=load('lib/media-search-entries.js'), {searchLearning}=load('lib/learning-search.js');
  const {filterLearningVideos}=load('lib/video-library-search.js');
  const globalVideoResults=query=>{
    const options={query,type:'entry',category:'wildkunde'}, first=searchLearning(options);
    return [first.results,...Array.from({length:first.pages-1},(_,index)=>searchLearning({...options,page:index+2}).results)].flat();
  };
  assert.equal(library.length,25);
  for (const item of added) {
    const target=new URL(item.course,'https://jagdlatein.invalid'), moduleId=target.pathname.slice(7), course=getLearningModule(moduleId);
    assert.ok(course); if(target.hash) assert.ok(course.lessons.some(lesson=>'#lesson-'+lesson.id===target.hash));
    assert.ok(europeanWildlifeBySlug[item.speciesSlug]);
    const summary=library.find(row=>row.id==='wild-'+item.id), href=`/lernen/wildtier-videofaelle?eintrag=${item.id}#video-fall`;
    assert.equal(summary.href,href); assert.equal(summary.title,item.title); assert.equal(summary.courses[0].href,item.course);
    assert.doesNotMatch(JSON.stringify(summary),/"questions"|"answers"|"correct"|"transcript"|"src"/);
    assert.ok(getCourseVideoLinks(moduleId).some(row=>row.href===href)); assert.ok(getWildlifeVideoLinks(item.speciesSlug).some(row=>row.href===href));
    assert.ok(filterLearningVideos(library,item.tags[0]).some(row=>row.href===href));
    const search=mediaSearchEntries.find(row=>row.id==='video-'+item.id); assert.match(search.description,/zwei erklärten Beobachtungsfragen/);
    if(item.id==='reiherente-petrosawodsk')assert.match(search.description,/Kursbezug: Vogelbein und Sprunggelenk; Füße und Gelenke bleiben im Film unter Wasser unsichtbar/);
    assert.ok(searchLearning({query:item.title}).results.some(row=>row.href.split('#')[0]===href.split('#')[0]));
    for(const term of summary.concepts){assert.ok(filterLearningVideos(library,term).some(row=>row.id===summary.id));assert.ok(globalVideoResults(term).some(row=>row.href.split('#')[0]===href.split('#')[0]),`${item.id}: ${term}`);}
  }
  const soundURL=new URL(added[1].soundHref,'https://jagdlatein.invalid');
  assert.equal(load('lib/animal-sounds.js').animalSoundById[soundURL.searchParams.get('stimme')].speciesSlug,'reiherente');
});

test('Only the exact4new media files and2attribution documents extend the public media allowlist', () => {
  const {mediaExperienceAssetPaths,mediaExperienceDocumentationPaths}=load('lib/media-experience-asset-paths.js');
  const old=historicalLoader()('lib/media-experience-asset-paths.js');
  const media=expected.flatMap(item=>[`${dir}/${item.id}.mp4`,`${dir}/${item.id}-vorschau.jpg`]);
  const docs=[`${dir}/mediennachweise.json`,`${dir}/MEDIEN-LIZENZEN.md`];
  assert.deepEqual(mediaExperienceAssetPaths.filter(value=>!media.includes(value)),old.mediaExperienceAssetPaths);
  assert.deepEqual(mediaExperienceDocumentationPaths.filter(value=>!docs.includes(value)),old.mediaExperienceDocumentationPaths);
  for(const item of media) assert.ok(mediaExperienceAssetPaths.includes(item));
  for(const item of docs) assert.ok(mediaExperienceDocumentationPaths.includes(item));
  assert.equal(mediaExperienceDocumentationPaths.includes(dir),false);
  assert.equal(mediaExperienceDocumentationPaths.includes(`${dir}/answers.json`),false);
  assert.equal(mediaExperienceDocumentationPaths.includes(`${dir}/mediennachweise.json/extra`),false);
  assert.equal(mediaExperienceAssetPaths.includes(`${dir}/private-film.mp4`),false);
});

test('Actual readers render exactly one opt-in film and the complete text before their closed final sources', () => {
  const React=local('react'), {renderToStaticMarkup}=local('react-dom/server'); let router;
  const componentLoad=createLoader({
    'next/router':{useRouter:()=>router},
    'next/link':({href,children,prefetch,...props})=>React.createElement('a',{href,...props},children),
    './LearningToolLayout':{__esModule:true,default:({children})=>React.createElement('main',null,children)},
    './PageMenu':{__esModule:true,default:({children})=>React.createElement('aside',null,children),closePageMenu(){},openPageMenu(){}},
  });
  const Component=componentLoad('components/WildlifeVideoCases.js').default;
  const {JSDOM}=require(process.env.JAGDLATEIN_TEST_DOM||path.join(process.env.TEMP,'jagdlatein-page-menu-dom/node_modules/jsdom'));
  for(const item of added){
    router={isReady:true,query:{eintrag:item.id},asPath:`/lernen/wildtier-videofaelle?eintrag=${item.id}`};
    const dom=new JSDOM(renderToStaticMarkup(React.createElement(Component)));
    try{
      const document=dom.window.document, section=document.querySelector('section[aria-labelledby="video-fall"]'), player=section.querySelector('video');
      assert.equal(document.querySelectorAll('video').length,1); assert.equal(document.querySelectorAll('audio,iframe').length,0);
      assert.equal(player.querySelector('source').getAttribute('src'),item.src); assert.equal(player.preload,'none'); assert.equal(player.autoplay,false); assert.equal(player.controls,true); assert.equal(player.playsInline,true);
      assert.ok(section.querySelector('#video-textfassung').textContent.includes(item.transcript));
      assert.equal(section.lastElementChild.tagName,'DETAILS'); assert.equal(section.lastElementChild.open,false);
      if(item.knowledgeSources) for(const source of item.knowledgeSources) assert.ok([...section.lastElementChild.querySelectorAll('a')].some(link=>link.getAttribute('href')===source.url));
      assert.ok([...section.querySelectorAll('a')].some(link=>link.getAttribute('href')===item.course));
    }finally{dom.window.close();}
  }
});
