// Exact public ad delivery only; isolated session/database doubles, no customer data.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{inflateRawSync}=require('node:zlib');
const {createLoader,root,local}=require('./helpers/project-module.cjs');
const {NextRequest}=local('next/server');
const {unstable_getResponseFromNextConfig}=local('next/experimental/testing/server');
const config=local('./next.config.js');
const stem='/werbung/jagdlatein-dein-moment-2026-11-15';
const paths=['html','mp4','png','txt','zip'].map(ext=>`${stem}.${ext}`);
const bytes=ext=>fs.readFileSync(path.join(root,'public',`${stem}.${ext}`));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const review=JSON.parse(fs.readFileSync(path.join(root,'data/reviews/dein-moment-promo-2026-11-15.json'),'utf8'));

test('Published campaign preserves reviewed final movie, cover and caption bytes',()=>{
  assert.deepEqual(review.files.map(f=>f.path),paths);
  for(const f of review.files){const b=fs.readFileSync(path.join(root,'public',f.path));assert.equal(b.length,f.bytes);assert.equal(sha(b),f.sha256);}
  const video=bytes('mp4');assert.equal(video.toString('ascii',4,8),'ftyp');assert.ok(video.indexOf(Buffer.from('moov'))<video.indexOf(Buffer.from('mdat')));
  const png=bytes('png');assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),1920);
  assert.equal(review.audio.frames,900);assert.equal(review.audio.blackFrames,0);assert.equal(review.audio.audio,'aac');assert.equal(review.audio.sha256,sha(video));
});

test('Only exact ad filenames are anonymous; neighbours and protected lessons still require access',async()=>{
  let sessions=0;
  const load=createLoader({'./lib/account-session-edge':{JL_ACCOUNT_COOKIE:'jl_account_session',async readAccountSessionEdge(){sessions++;return null;}},'@supabase/supabase-js':{createClient(){throw Error('No database for public media');}}});
  const {middleware}=load('middleware.js');
  const run=(p,method='GET')=>middleware(new NextRequest(`https://jagdlatein.test${p}`,{method}));
  for(const p of paths)for(const method of ['GET','HEAD']){const r=await run(p+'?download=1',method);assert.equal(r.status,200);assert.equal(r.headers.get('x-middleware-next'),'1');assert.equal(r.headers.get('set-cookie'),null);}
  assert.equal(sessions,0);
  for(const p of ['/werbung','/werbung/private.mp4',`${stem}.wav`,`${stem}.json`,`${stem}.mp4.bak`,`${stem}.zip/`,`${stem}-private.mp4`,'/lernen/videos','/admin/testabos']){const r=await run(p);assert.equal(r.status,307,p);assert.equal(new URL(r.headers.get('location')).pathname,'/preise');}
});

test('Inline preview and explicit download have distinct exact headers, retaining security',async()=>{
  for(const [p,d] of [[`${stem}.mp4?download=1`,'attachment; filename="jagdlatein-werbevideo.mp4"'],[`${stem}.zip`,'attachment; filename="Jagdlatein-Dein-Moment.zip"'],...[`${stem}.mp4`,`${stem}.mp4?download=0`,`${stem}.mp4?download=11`,`${stem}.mp4.bak?download=1`,`${stem}.html`,'/api/account','/lernen/lernkarten'].map(p=>[p,null])]){
    const r=await unstable_getResponseFromNextConfig({url:`https://jagdlatein.test${p}`,nextConfig:config});assert.equal(r.headers.get('content-disposition'),d,p);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('content-security-policy'),"frame-ancestors 'self';");
  }
});

test('Phone preview has deliberate playback and final credits below downloads, with no exposed solution in caption',()=>{
  const h=bytes('html').toString('utf8'),caption=bytes('txt').toString('utf8');
  assert.match(h,/<html lang="de">/);assert.equal((h.match(/<video\b/g)||[]).length,1);assert.match(h,/<video controls playsinline preload="none"/);assert.doesNotMatch(h,/\bautoplay\b|<script\b|<iframe\b|\bon\w+\s*=/i);
  assert.ok(h.includes(`href="${stem}.mp4?download=1" download="jagdlatein-werbevideo.mp4"`));assert.ok(h.indexOf('<details>')>h.indexOf('Begleittext öffnen'));assert.doesNotMatch(h,/<details[^>]*\bopen\b/);
  assert.ok([...caption].length<=2200);assert.doesNotMatch(caption,/Richtig ist|Richtig:|Antwort D/i);
  for(const text of ['KI-generiert','Manu Orsini','Alexandre Défossez','Line of Flight','Junichi Yamagishi','Christophe Veaux','Kirsten MacDonald','https://creativecommons.org/licenses/by/4.0/','Martin Vorel','Steve Whitelok','Gerda Arendt']){assert.ok(caption.includes(text),text);assert.ok(h.includes(text),text);}
  for(const ext of ['html','txt']){assert.equal(bytes(ext).includes(Buffer.from('\r\n')),false);assert.ok(fs.readFileSync(path.join(root,'.gitattributes'),'utf8').includes(`public${stem}.${ext} text eol=lf`));}
});

test('Phone ZIP contains final exports and separate comment, with no raw stock, source models or private files',()=>{
  const z=bytes('zip');let end=z.length-22;while(end>=Math.max(0,z.length-65557)&&z.readUInt32LE(end)!==0x06054b50)end--;assert.ok(end>=0);
  const count=z.readUInt16LE(end+10);assert.equal(count,5);let p=z.readUInt32LE(end+16);const members=new Map();
  for(let i=0;i<count;i++){assert.equal(z.readUInt32LE(p),0x02014b50);const method=z.readUInt16LE(p+10),size=z.readUInt32LE(p+20),n=z.readUInt16LE(p+28),off=z.readUInt32LE(p+42),name=z.subarray(p+46,p+46+n).toString('utf8');const start=off+30+z.readUInt16LE(off+26)+z.readUInt16LE(off+28);const b=z.subarray(start,start+size);assert.ok([0,8].includes(method));members.set(name,method===8?inflateRawSync(b):b);p+=46+n+z.readUInt16LE(p+30)+z.readUInt16LE(p+32);}
  assert.deepEqual([...members.keys()],['jagdlatein-werbevideo.mp4','jagdlatein-vorschau.png','Begleittext.txt','Quellen-und-Nutzung.txt','Kommentar-Aufloesung.txt']);
  assert.deepEqual(members.get('jagdlatein-werbevideo.mp4'),bytes('mp4'));assert.deepEqual(members.get('jagdlatein-vorschau.png'),bytes('png'));assert.deepEqual(members.get('Begleittext.txt'),bytes('txt'));assert.match(members.get('Kommentar-Aufloesung.txt').toString('utf8'),/Richtig ist D/);
});
