const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const overrides = {
  'next/link': ({ href, children, prefetch, ...props }) => React.createElement('a', { href: typeof href === 'string' ? href : href.pathname, ...props }, children),
  'next/head': ({ children }) => children,
};
const load = createLoader(overrides);
const videos = load('lib/learning-video-library.js').getLearningVideoLibrary();
const { filterLearningVideos } = load('lib/video-library-search.js');

test('Directory summaries resolve every original scene and carry neither video requests nor quiz payload', () => {
  const wildlife = load('lib/wildlife-video-cases.js').wildlifeVideoCases;
  const dogs = load('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons;
  assert.equal(videos.length, wildlife.length + dogs.length);
  assert.equal(new Set(videos.map(item => item.id)).size, videos.length);
  for (const item of videos) {
    assert.ok(Object.keys(item).every(key => ['id', 'group', 'title', 'subject', 'duration', 'tags', 'href'].includes(key)));
    const url = new URL(item.href, 'https://jagdlatein.de');
    const originals = item.group === 'wild' ? wildlife : dogs;
    const original = originals.find(scene => scene.id === url.searchParams.get('eintrag'));
    assert.ok(original, item.href);
    assert.equal(item.title, original.title); assert.equal(item.duration, original.duration);
    assert.ok(fs.existsSync(path.join(root, 'public', original.src)));
    const source = item.group === 'wild' ? original : original.media;
    assert.ok(source.source.startsWith('https://') && source.license && source.licenseUrl.startsWith('https://'));
    assert.equal(url.pathname, item.group === 'wild' ? '/lernen/wildtier-videofaelle' : '/lernen/jagdhund-videos');
    assert.equal(url.hash, item.group === 'wild' ? '#video-fall' : '#hundevideo-film');
  }
  const props = load('pages/lernen/videos.js').getStaticProps().props;
  assert.deepEqual(props.videos, videos);
  const html = renderToStaticMarkup(React.createElement(load('components/LearningVideoLibrary.js').default, props));
  assert.equal((html.match(/<li>/g) || []).length, videos.length);
  assert.doesNotMatch(html, /<img|<video|<iframe|<button|<script/);
  for (const scene of videos) assert.ok(html.includes(scene.title.replaceAll('&', '&amp;')));
});

test('Search combines words, handles umlaut/transliteration and keeps both subject filters precise', () => {
  assert.deepEqual(filterLearningVideos(videos, 'Fuchs').map(item => item.id), ['wild-fuchs']);
  assert.ok(filterLearningVideos(videos, 'Retriever').length >= 2);
  assert.ok(filterLearningVideos(videos, 'REH OFFEN').every(item => item.id === 'wild-rehwild'));
  assert.equal(filterLearningVideos(videos, 'Retriever', 'wild').length, 0);
  assert.deepEqual(filterLearningVideos(videos, '', 'hund'), videos.filter(item => item.group === 'hund'));
  assert.equal(filterLearningVideos(videos, 'kein-solches-video').length, 0);
  const fixture = [{ title: 'Gämse', subject: 'Alpen', tags: ['Äsung'], group: 'wild' }];
  assert.equal(filterLearningVideos(fixture, 'Gaemse aesung').length, 1);
});

test('The directory filters immediately without another submit and exposes a useful empty state', () => {
  const values = []; let cursor = 0;
  const hooks = { ...React, useState(initial) { const index = cursor++; if (!(index in values)) values[index] = initial; return [values[index], value => { values[index] = value; }]; } };
  const Component = createLoader({ ...overrides, react: hooks })('components/LearningVideoLibrary.js').default;
  const nodes = (tree, type, result = []) => { if (Array.isArray(tree)) tree.forEach(item => nodes(item, type, result)); else if (tree && typeof tree === 'object') { if (tree.type === type) result.push(tree); nodes(tree.props?.children, type, result); } return result; };
  const run = () => { cursor = 0; return Component({ videos }); };
  let tree = run();
  nodes(tree, 'input')[0].props.onChange({ target: { value: 'Fuchs' } }); tree = run();
  assert.equal(nodes(tree, 'li').length, 1); assert.equal(nodes(tree, 'li')[0].key, 'wild-fuchs');
  nodes(tree, 'select')[0].props.onChange({ target: { value: 'hund' } }); tree = run();
  assert.equal(nodes(tree, 'li').length, 0);
  assert.ok(renderToStaticMarkup(tree).includes('Keine Aufnahme passt'));
  nodes(tree, 'input')[0].props.onChange({ target: { value: '' } }); tree = run();
  assert.equal(nodes(tree, 'li').length, videos.filter(item => item.group === 'hund').length);
});

test('Learning search and homepage expose the shared video entry; existing players keep deliberate playback', () => {
  assert.ok(load('lib/learning-search.js').searchLearning({ query: 'Jagdvideos' }).results.some(item => item.href === '/lernen/videos'));
  assert.ok(load('components/HomeKnowledgeNavigation.js').homeKnowledgeGroups.flatMap(group => group.links).some(item => item.href === '/lernen/videos'));
  for (const file of ['components/WildlifeVideoCases.js', 'components/HuntingDogVideos.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, /<video[^>]*controls[^>]*playsInline[^>]*preload="none"/);
    assert.doesNotMatch(source, /autoPlay|autoplay|<iframe/);
    assert.ok(source.includes('href="/lernen/videos"'));
  }
});
