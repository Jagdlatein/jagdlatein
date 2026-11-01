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
  'next/router': { useRouter: () => ({ isReady: true, query: {}, asPath: '/lernen/videos' }) },
  './PageMenu': { __esModule: true, default: ({ children }) => React.createElement('aside', { 'data-page-menu': true }, children), closePageMenu() {}, openPageMenu() {} },
};
const load = createLoader(overrides);
const videos = load('lib/learning-video-library.js').getLearningVideoLibrary();
const { filterLearningVideos, resolveVideoLibrarySelection, videoLibraryGroups } = load('lib/video-library-search.js');

test('Server-prepared summaries resolve original scenes and exact courses without media files, questions or full lessons', () => {
  const wildlife = load('lib/wildlife-video-cases.js').wildlifeVideoCases;
  const dogs = load('lib/hunting-dog-video-lessons.js').huntingDogVideoLessons;
  const links = load('lib/learning-video-links.js').learningVideoLinks;
  const modules = load('lib/learning-curriculum.js').learningModules;
  assert.equal(videos.length, wildlife.length + dogs.length);
  assert.equal(new Set(videos.map(item => item.id)).size, videos.length);
  const keys = ['id', 'group', 'title', 'subject', 'duration', 'tags', 'href', 'poster', 'credit', 'focus', 'concepts', 'courses'].sort();
  for (const item of videos) {
    assert.deepEqual(Object.keys(item).sort(), keys);
    const url = new URL(item.href, 'https://jagdlatein.de');
    const original = (item.group === 'wild' ? wildlife : dogs).find(scene => scene.id === url.searchParams.get('eintrag'));
    const link = links.find(entry => entry.kind === item.group && entry.id === original.id);
    assert.ok(original, item.href);
    assert.equal(item.title, original.title); assert.equal(item.duration, original.duration);
    assert.equal(item.poster, original.poster);
    assert.ok(item.poster.startsWith('/lernen/') && fs.existsSync(path.join(root, 'public', item.poster)));
    assert.ok(typeof item.focus === 'string' && item.focus.trim().length >= 30 && item.focus.length <= 220);
    assert.ok(Array.isArray(item.concepts) && item.concepts.every(term => typeof term === 'string' && term.trim()));
    assert.deepEqual(item.courses, link.moduleIds.map(id => {
      const module = modules.find(module => module.id === id);
      assert.ok(module, id); return { title: module.title, href: `/kurse/${id}` };
    }));
    assert.ok(item.courses.length > 0);
    assert.doesNotMatch(JSON.stringify(item), /"questions"|"answers"|"correct"|"transcript"|"lessons"|"src"|"captions"|"mimeType"/);
    const source = item.group === 'wild' ? original : original.media;
    assert.ok(source.source.startsWith('https://') && source.license && source.licenseUrl.startsWith('https://'));
    assert.deepEqual(item.credit, { author: source.author, license: source.license, licenseUrl: source.licenseUrl, source: source.source });
    assert.equal(url.pathname, item.group === 'wild' ? '/lernen/wildtier-videofaelle' : '/lernen/jagdhund-videos');
    assert.equal(url.hash, item.group === 'wild' ? '#video-fall' : '#hundevideo-film');
  }
  assert.deepEqual(load('pages/lernen/videos.js').getStaticProps().props.videos, videos);
  const client = fs.readFileSync(path.join(root, 'components/LearningVideoLibrary.js'), 'utf8');
  assert.doesNotMatch(client, /from ["'][^"']*(?:learning-curriculum|learning-video-library|wildlife-video-cases|hunting-dog-video-lessons)/);
});

test('The directory shows local previews, concise learning focus and separate precise onward links without starting players', () => {
  const Component = load('components/LearningVideoLibrary.js').default;
  const html = renderToStaticMarkup(React.createElement(Component, { videos }));
  assert.equal((html.match(/data-video-id=/g) || []).length, videos.length);
  assert.equal((html.match(/<img\b/g) || []).length, videos.length);
  assert.doesNotMatch(html, /<video|<iframe|<script|src="[^"]*\.(?:webm|mp4|vtt)/);
  assert.equal((html.match(/type="search"/g) || []).length, 1);
  assert.match(html, /<aside[^>]*data-page-menu/);
  assert.deepEqual(videoLibraryGroups.map(item => item.title), ['Wildkunde', 'Hundewesen']);
  for (const item of videos) {
    const start = html.indexOf(`data-video-id="${item.id}"`);
    const card = html.slice(start, html.indexOf('</li>', start));
    assert.ok(card.includes(`href="${item.href}"`) && card.includes(`src="${item.poster}"`));
    assert.ok(card.includes(item.focus.replaceAll('&', '&amp;')));
    assert.match(card, /alt="" loading="lazy" decoding="async"/);
    assert.ok(card.indexOf('</a>') < card.indexOf('<nav'), 'Onward course links stay outside the main video link');
    for (const course of item.courses.slice(0, 2)) assert.ok(card.includes(`href="${course.href}"`));
  }
});

test('Every visible poster has exact source attribution in a closed panel after the last learning card', () => {
  const { JSDOM } = require(process.env.JAGDLATEIN_TEST_DOM || path.join(process.env.TEMP, 'jagdlatein-page-menu-dom/node_modules/jsdom'));
  const Component = load('components/LearningVideoLibrary.js').default;
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(Component, { videos })));
  try {
    const document = dom.window.document, results = document.querySelector('#video-ergebnisse');
    const credits = document.querySelector('#video-bildnachweise');
    assert.equal(credits.tagName, 'DETAILS'); assert.equal(credits.open, false);
    assert.equal(results.lastElementChild, credits);
    const items = [...credits.querySelectorAll('li')]; assert.equal(items.length, videos.length);
    for (const [index, item] of videos.entries()) {
      assert.ok(items[index].textContent.includes(item.title) && items[index].textContent.includes(item.credit.author));
      const links = [...items[index].querySelectorAll('a')];
      assert.deepEqual(links.map(link => link.getAttribute('href')), [item.credit.licenseUrl, item.credit.source]);
      assert.ok(links.every(link => link.rel.includes('noopener') && link.rel.includes('noreferrer')));
    }
  } finally { dom.window.close(); }
});

test('Search finds existing learning concepts and course context while combining words and precise subject filters', () => {
  assert.deepEqual(filterLearningVideos(videos, 'Fuchs').map(item => item.id), ['wild-fuchs']);
  assert.ok(filterLearningVideos(videos, 'Retriever').length >= 2);
  assert.ok(filterLearningVideos(videos, 'REH OFFEN').some(item => item.id === 'wild-rehwild'));
  assert.equal(filterLearningVideos(videos, 'Retriever', 'wild').length, 0);
  assert.deepEqual(filterLearningVideos(videos, '', 'hund'), videos.filter(item => item.group === 'hund'));
  assert.equal(filterLearningVideos(videos, 'kein-solches-video').length, 0);
  assert.deepEqual(filterLearningVideos(videos, 'Spurlaut').map(item => item.id), ['hund-labrador-signal']);
  assert.deepEqual(filterLearningVideos(videos, 'Spurlaut Retriever', 'hund').map(item => item.id), ['hund-labrador-signal']);
  assert.equal(filterLearningVideos(videos, 'Spurlaut', 'wild').length, 0);
  assert.ok(filterLearningVideos(videos, 'Nasenarbeit').some(item => item.id === 'hund-basset-faehrtenende'));
  const fixture = [{ title: 'Gämse', subject: 'Alpen', tags: ['Äsung'], group: 'wild', courses: [{ title: 'Steinwild erkennen' }] }];
  assert.equal(filterLearningVideos(fixture, 'Gaemse aesung').length, 1);
  assert.equal(filterLearningVideos(fixture, 'Steinwild').length, 1);
  for (const item of videos) for (const course of item.courses) {
    assert.ok(filterLearningVideos(videos, course.title, item.group).some(match => match.id === item.id));
  }
});

test('Only omitted filters use defaults; malformed, repeated and explicit empty URL values show help', () => {
  assert.deepEqual(resolveVideoLibrarySelection({}), { valid: true, group: 'all', query: '', error: '' });
  assert.deepEqual(resolveVideoLibrarySelection({ bereich: 'hund', q: '  Spurlaut  ' }), { valid: true, group: 'hund', query: 'Spurlaut', error: '' });
  assert.equal(resolveVideoLibrarySelection({ bereich: 'all' }).valid, true);
  assert.equal(resolveVideoLibrarySelection({ q: 'x'.repeat(160) }).valid, true);
  for (const query of [{ bereich: '' }, { bereich: 'invalid' }, { bereich: ['wild'] }, { bereich: '__proto__' }, { q: '' }, { q: ' ' }, { q: ['Fuchs'] }, { q: 'x'.repeat(161) }]) {
    const result = resolveVideoLibrarySelection(query);
    assert.equal(result.valid, false, JSON.stringify(query)); assert.ok(result.error.length > 30);
  }
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
