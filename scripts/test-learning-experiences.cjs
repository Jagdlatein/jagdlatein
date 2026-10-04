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
const css = new Proxy({}, { get: (_, key) => String(key) });
function load(relative, overrides = {}, expose = '') {
  const filename = path.join(root, relative);
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  });
  const mod = { exports: {} }, req = createRequire(filename);
  function resolve(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (id === 'next/link') return ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
    if (id === 'next/head') return ({ children }) => React.createElement(React.Fragment, null, children);
    if (id === 'next/router') return { useRouter: () => ({ query: {} }) };
    if (id === 'next/image') return ({ priority, fill, ...props }) => React.createElement('img', props);
    if (id.endsWith('.module.css')) return { __esModule: true, default: css };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), overrides);
    return req(id);
  }
  new Function('require', 'module', 'exports', code + expose)(resolve, mod, mod.exports);
  return mod.exports;
}
function engine() {
  const slots = []; let cursor = 0;
  return { hooks: { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, value => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useMemo(fn) { return fn(); }, useEffect() {}, useCallback(fn) { return fn; },
  }, render(fn) { cursor = 0; return fn(); } };
}
function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result; } return null; }
  if (!node || typeof node !== 'object') return null;
  return predicate(node) ? node : find(node.props?.children, predicate);
}
function text(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function setup(relative, exportName = 'default', expose = '', props = {}) {
  const e = engine(); const Component = load(relative, { react: e.hooks }, expose)[exportName];
  const render = () => e.render(() => Component(props)); let tree = render();
  return { get tree() { return tree; }, redraw() { tree = render(); }, html() { return renderToStaticMarkup(tree); },
    button(label) { const node = find(tree, n => n.type === 'button' && text(n).trim() === label); assert.ok(node, 'Missing button: ' + label); return node; },
    click(label) { const node = this.button(label); assert.ok(!node.props.disabled, 'Disabled: ' + label); node.props.onClick(); tree = render(); },
    change(id, value) { const node = find(tree, n => n.props?.id === id); assert.ok(node, 'Missing control: ' + id); node.props.onChange({ target: { value, checked: value } }); tree = render(); },
  };
}

test('New tools resolve from the learning hub and relevant categories without changing legal country selection', () => {
  const { learningExperiences } = load('lib/learning-experiences.js');
  assert.equal(learningExperiences.length, 17);
  assert.equal(new Set(learningExperiences.map(tool => tool.href)).size, learningExperiences.length);
  const Component = load('components/LearningExperiences.js').default;
  for (const tool of learningExperiences) {
    assert.ok(fs.existsSync(path.join(root, 'pages', tool.href + '.js')) || fs.existsSync(path.join(root, 'pages', tool.href, 'index.js')));
    const html = renderToStaticMarkup(React.createElement(Component, {})); assert.ok(html.includes(tool.href));
    for (const category of tool.categories) assert.ok(renderToStaticMarkup(React.createElement(Component, { category })).includes(tool.href));
  }
  assert.ok(!renderToStaticMarkup(React.createElement(Component, { category: 'jagdrecht' })).includes('country-select'));
});

test('Original sound records have credits, playable local MP3 headers, and source/lesson links', () => {
  const { animalSounds, animalSoundPaths, shuffledSoundIds, soundFeedback } = load('lib/animal-sounds.js');
  const manifest = ['quellen.json', 'quellen-voegel.json', 'quellen-saeuger.json', 'quellen-gams.json'].flatMap(file => JSON.parse(fs.readFileSync(path.join(root, 'public/lernen/stimmen', file), 'utf8')).recordings);
  assert.equal(manifest.length, animalSounds.length);
  assert.deepEqual(animalSoundPaths, load('lib/learning-audio-paths.js').learningAudioPaths);
  assert.equal(new Set(animalSounds.map(sound => sound.id)).size, animalSounds.length);
  assert.ok(animalSounds.length >= 30, 'Substantial genuine recording expansion');
  for (const sound of animalSounds) {
    const bytes = fs.readFileSync(path.join(root, 'public', sound.src));
    const record = manifest.find(item => item.file === sound.src);
    assert.ok(record && record.aiGenerated === false && record.synthesized === false);
    for (const key of ['sourceUrl', 'license', 'licenseUrl', 'author', 'scientificName']) assert.equal(sound[key], record[key], `${sound.name}: displayed ${key} matches the rights record`);
    assert.equal(record.sha256, require('node:crypto').createHash('sha256').update(bytes).digest('hex'));
    assert.equal(record.bytes, bytes.length);
    assert.ok(record.parsedFrames > 0 && Math.abs(record.parsedDurationSeconds - record.originalDurationSeconds) < .1);
    assert.ok(bytes.toString('ascii', 0, 3) === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224));
    assert.ok(sound.author && (/^CC BY(?:-SA)? [1-4]\.0(?: DE)?$/.test(sound.license) || sound.license === 'Gemeinfrei' || sound.license === 'CC0 1.0'));
    assert.ok(sound.licenseUrl.startsWith('https://creativecommons.org/') || sound.licenseUrl.startsWith('https://commons.wikimedia.org/wiki/File:'));
    assert.ok(sound.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:') || new URL(sound.sourceUrl).hostname === 'suche.tierstimmenarchiv.de');
    assert.ok(sound.duration > 0 && sound.options.includes(sound.id) && new Set(sound.options).size === sound.options.length);
    assert.equal(sound.options.length, 4);
    for (const id of sound.options) assert.ok(animalSounds.some(item => item.id === id), `Unknown answer ${id}`);
    assert.ok(soundFeedback(sound, sound.options.find(id => id !== sound.id)).includes(sound.explanation));
    assert.ok(soundFeedback(sound, null).includes(sound.name));
  }
  assert.deepEqual(shuffledSoundIds(animalSounds, () => .5).sort(), animalSounds.map(sound => sound.id).sort());
});

test('Sound quiz requires listening, explains mistakes and skips, and prevents double/stale score changes', () => {
  const { animalSounds, animalSoundById } = load('lib/animal-sounds.js');
  const roundLength = Math.min(10, animalSounds.length);
  const s = setup('components/AnimalSounds.js'); s.click('Hörquiz starten');
  const player = () => find(s.tree, n => n.type?.name === 'SoundPlayer');
  const heard = () => { player().props.onPlay({ currentTarget: { pause() {} } }); s.redraw(); };
  const first = player().props.sound;
  assert.ok(s.button(animalSoundById[first.id].name).props.disabled);
  const stalePlayback = player().props.onPlay;
  heard();
  const wrongId = first.options.find(id => id !== first.id);
  const wrong = s.button(animalSoundById[wrongId].name), other = s.button(first.name);
  wrong.props.onClick(); wrong.props.onClick(); other.props.onClick(); s.redraw();
  assert.ok(s.html().includes(first.explanation)); assert.match(s.html(), /0 richtig erkannt/);
  const advance = s.button('Nächste Aufnahme'); advance.props.onClick(); advance.props.onClick(); s.redraw();
  assert.ok(s.html().includes(`Aufnahme 2 von ${roundLength}`));
  const second = player().props.sound; heard(); s.click(second.name); s.click('Nächste Aufnahme');
  for (let i = 2; i < roundLength; i++) {
    const sound = player().props.sound;
    s.click('Ich weiß es noch nicht / Aufnahme überspringen');
    assert.ok(s.html().includes(sound.explanation));
    s.click(i === roundLength - 1 ? 'Ergebnis ansehen' : 'Nächste Aufnahme');
  }
  assert.ok(s.html().includes(`1 von ${roundLength} Stimmen erkannt`));
  s.click('Unsichere Stimmen wiederholen');
  stalePlayback({ currentTarget: { pause() {} } }); wrong.props.onClick(); advance.props.onClick(); s.redraw();
  assert.ok(s.html().includes(`Aufnahme 1 von ${roundLength - 1}`));
  assert.ok(s.button(player().props.sound.name).props.disabled);
  assert.equal(find(s.tree, n => n.props?.role === 'status'), null);
});

test('Audio errors offer retry and a disclosed source fallback without autoplay', () => {
  const sound = load('lib/animal-sounds.js').animalSounds[0];
  const s = setup('components/AnimalSounds.js', 'SoundPlayer', '', { sound, label: 'Quizaufnahme 1 abspielen', reveal: false });
  const before = find(s.tree, n => n.type === 'audio');
  assert.equal(before.props.preload, 'none'); assert.equal(before.props.autoPlay, undefined);
  before.props.onError(); s.redraw();
  assert.match(s.html(), /Die Aufnahme konnte nicht abgespielt werden/);
  assert.match(s.html(), /verrät die Art/);
  s.click('Noch einmal laden'); assert.equal(find(s.tree, n => n.props?.role === 'alert'), null);
  assert.notEqual(find(s.tree, n => n.type === 'audio').key, before.key);
});

test('Sound filters, bounded rounds, library pagination and empty states use the same selection', () => {
  const { animalSounds } = load('lib/animal-sounds.js');
  const { filterAnimalSounds, soundRound, SOUND_PAGE_SIZE } = load('lib/animal-sound-learning.js');
  assert.deepEqual(filterAnimalSounds({ query: 'Krähe' }).map(item => item.id), filterAnimalSounds({ query: 'Kraehe' }).map(item => item.id));
  const mammals = filterAnimalSounds({ group: 'mammals' });
  assert.ok(mammals.length >= 7); assert.ok(mammals.every(sound => sound.group === 'Säugetiere'));
  assert.equal(soundRound(animalSounds).length, 10); assert.equal(new Set(soundRound(animalSounds)).size, 10);
  assert.deepEqual(soundRound(mammals, 'all', () => .5).sort(), mammals.map(item => item.id).sort());
  assert.deepEqual(soundRound(['invented', mammals[0].id, mammals[0].id], 'all'), [mammals[0].id]);
  const s = setup('components/AnimalSounds.js');
  const cards = node => { let count = 0; const walk = value => { if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') { if (value.type === 'article') count++; walk(value.props?.children); } }; walk(node); return count; };
  assert.equal(cards(s.tree), SOUND_PAGE_SIZE);
  s.click('Nächste Seite'); assert.match(s.html(), /Seite 2 von/);
  s.change('sound-group', 'mammals'); assert.equal(cards(s.tree), mammals.length);
  s.change('sound-search', 'zzznichtvorhanden'); assert.match(s.html(), /Keine passende Stimme gefunden/);
  assert.ok(s.button('Hörquiz starten').props.disabled); assert.equal(cards(s.tree), 0);
  s.click('Filter zurücksetzen'); s.change('sound-search', 'Rehbock'); s.change('sound-round-size', 'all');
  const matches = filterAnimalSounds({ query: 'Rehbock' }); assert.ok(matches.length > 0);
  s.click('Hörquiz starten'); assert.ok(s.html().includes(`Aufnahme 1 von ${matches.length}`));
  assert.ok(matches.some(item => item.id === find(s.tree, n => n.type?.name === 'SoundPlayer').props.sound.id));
});

test('Photo rounds explain wrong choices, separate hinted results and never count a repeated click twice', () => {
  const { photoDetectiveRounds: rounds } = load('lib/photo-detective.js');
  assert.ok(rounds.length >= 8);
  const s = setup('components/PhotoDetective.js');
  assert.equal(find(s.tree, n => n.props?.['aria-label']?.startsWith('Merkmal 1:')), null);
  const wrong = s.button(rounds[0].options.find(option => option !== rounds[0].name));
  const staleOther = s.button(rounds[0].name);
  wrong.props.onClick(); staleOther.props.onClick(); s.redraw();
  assert.ok(s.html().includes(rounds[0].wrong[text(wrong)]));
  assert.ok(s.html().includes(rounds[0].explanation));
  const advance = s.button('Nächstes Foto'); advance.props.onClick(); advance.props.onClick(); wrong.props.onClick(); s.redraw();
  assert.match(s.html(), /Foto 2 von/);
  s.click('Merkmale als Hilfe anzeigen'); s.click(rounds[1].name);
  assert.match(s.html(), /Mit Merkmals-Hilfe beantwortet/);
  for (let i = 2; i < rounds.length; i++) { s.click('Nächstes Foto'); s.click(rounds[i].name); }
  s.click('Auswertung ansehen');
  assert.ok(s.html().includes(`${rounds.length - 1} von ${rounds.length} Arten richtig erkannt`));
  s.click('Fehler und Hilfefragen wiederholen (2)');
  assert.match(s.html(), /Foto 1 von 2/);
  staleOther.props.onClick(); s.redraw();
  assert.equal(find(s.tree, n => n.props?.role === 'status'), null);
  s.click(rounds[0].name); s.click('Nächstes Foto'); s.click(rounds[1].name); s.click('Auswertung ansehen');
  assert.match(s.html(), /2 von 2 Arten richtig erkannt/);
});

test('Breed filtering explains missing work areas and comparison stays unique and capped at three under stale events', () => {
  const { dogBreeds, getDogTaskMatch, getCompassAdvice } = load('lib/dog-compass.js');
  assert.ok(dogBreeds.length >= 14);
  const tracker = dogBreeds.find(profile => profile.id === 'bayerischer');
  assert.deepEqual(getDogTaskMatch(tracker, ['schweiss', 'vorstehen', 'schweiss', 'unknown']), { matched: ['schweiss'], missing: ['vorstehen'] });
  for (const id of ['golden', 'labrador']) assert.deepEqual(getDogTaskMatch(dogBreeds.find(profile => profile.id === id), ['apport', 'wasser']).missing, []);
  assert.equal(getCompassAdvice({ access: 'none', guidance: 'none', everyday: 'open' }).length, 3);
  const s = setup('components/DogCompass.js');
  const buttons = dogBreeds.slice(0, 4).map(profile => find(s.tree, n => n.type === 'button' && n.props['aria-label'] === `${profile.name} vergleichen`));
  assert.ok(buttons.every(Boolean));
  for (const button of buttons) button.props.onClick(); s.redraw();
  assert.match(s.html(), /3 von 3 im Vergleich/);
  assert.match(s.html(), /Drei Profile sind gewählt/);
  const section = find(s.tree, n => n.props?.id === 'dog-comparison');
  for (const profile of dogBreeds.slice(0, 3)) assert.ok(text(section).includes(profile.name));
  assert.equal(text(section).includes(dogBreeds[3].name), false);
  s.change('dog-search', 'this-breed-does-not-exist');
  assert.match(s.html(), /Kein Profil passt/);
  assert.match(s.html(), /3 von 3 im Vergleich/);
  s.click('Auswahl zurücksetzen'); assert.match(s.html(), /14 von 14 Profilen/);
  s.click('Vergleich leeren'); assert.match(s.html(), /0 von 3 im Vergleich/);
});

test('Dog knowledge feedback survives wrong answers, double clicks and handlers from a completed previous run', () => {
  const { dogCompassChecks: questions } = load('lib/dog-compass.js');
  const s = setup('components/DogCompass.js', 'KnowledgeCheck', '\nmodule.exports.KnowledgeCheck = KnowledgeCheck;');
  const stale = s.button(questions[0].options[0]); stale.props.onClick(); stale.props.onClick(); s.redraw();
  assert.ok(s.html().includes(questions[0].explain));
  const advance = s.button('Nächste Frage'); advance.props.onClick(); advance.props.onClick(); s.redraw();
  assert.match(s.html(), /Frage 2 von/);
  for (let i = 1; i < questions.length; i++) { s.click(questions[i].options[questions[i].answer]); s.click(i === questions.length - 1 ? 'Ergebnis ansehen' : 'Nächste Frage'); }
  assert.match(s.html(), /3 von 4 Antworten richtig/);
  s.click('Wissenscheck wiederholen'); stale.props.onClick(); advance.props.onClick(); s.redraw();
  assert.match(s.html(), /Frage 1 von/);
  assert.equal(find(s.tree, n => n.props?.role === 'status'), null);
});

test('Only documented recordings bypass the gate; tools and invented media paths remain protected', async () => {
  const { learningAudioPaths } = load('lib/learning-audio-paths.js');
  assert.equal(new Set(learningAudioPaths).size, load('lib/animal-sounds.js').animalSounds.length);
  const { middleware } = load('middleware.js', {
    'next/server': { NextResponse: { next: () => ({ allowed: true }), redirect: target => ({ allowed: false, target: target.toString() }) } },
    './lib/account-session-edge': { JL_ACCOUNT_COOKIE: 'jl-account', readAccountSessionEdge: async () => null },
  });
  const check = pathname => middleware({ nextUrl: new URL('https://example.org' + pathname), url: 'https://example.org' + pathname, cookies: { get: () => undefined } });
  for (const src of learningAudioPaths) { assert.ok(fs.statSync(path.join(root, 'public', src)).size > 5000); assert.equal((await check(src)).allowed, true); }
  for (const src of ['/lernen/fotodetektiv', '/lernen/tierstimmen', '/lernen/jagdhund-kompass', '/lernen/stimmen/private.mp3', '/lernen/stimmen/aufnahme-09.mp3']) {
    const result = await check(src); assert.equal(result.allowed, false); assert.equal(new URL(result.target).pathname, '/preise'); assert.equal(new URL(result.target).searchParams.get('next'), src);
  }
});
