const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { nodes } = require('./helpers/field-reader-fixture.cjs');
const React = local('react'), { renderToStaticMarkup } = local('react-dom/server');
const Head = ({ children }) => React.createElement(React.Fragment, null, children);
const load = createLoader({ 'next/head': Head });
const { siteBranding: brand, brandingAssetPaths, brandAssetsObject, siteOrganization } = load('lib/brand-config.js');
const Seo = load('components/Seo.js').default;
const meta = tree => new Map(nodes(tree, node => node.type === 'meta').map(node => [node.props.property || node.props.name, node.props.content]));

test('Default social preview uses an absolute brand image with its own truthful shape and alt text; explicit content images remain independent', () => {
  const defaults = meta(Seo({ title: 'Jagdlatein', url: `${brand.site}/` }));
  assert.equal(defaults.get('og:image'), `${brand.site}${brand.shareImage}`);
  assert.equal(defaults.get('twitter:image'), defaults.get('og:image'));
  assert.equal(defaults.get('og:image:width'), 1200); assert.equal(defaults.get('og:image:height'), 630);
  assert.equal(defaults.get('og:image:alt'), brand.imageAlt);
  const custom = meta(Seo({ image: '/lernen/actual-photo.jpg', imageAlt: 'Belegtes Lehrmotiv', imageWidth: 800, imageHeight: 600 }));
  assert.equal(custom.get('og:image'), `${brand.site}/lernen/actual-photo.jpg`); assert.equal(custom.get('twitter:image'), custom.get('og:image'));
  assert.equal(custom.get('og:image:alt'), 'Belegtes Lehrmotiv'); assert.equal(custom.get('og:image:width'), 800); assert.equal(custom.get('og:image:height'), 600);
  const bare = meta(Seo({ image: 'https://example.invalid/reference.jpg' }));
  assert.equal(bare.get('og:image'), 'https://example.invalid/reference.jpg');
  assert.ok(!bare.has('og:image:width') && !bare.has('og:image:height') && !bare.has('og:image:alt'));
});

test('The actual signed-out homepage supplies one crawlable compact brand image and matching Organization logo without new controls', () => {
  const Empty = () => null;
  const Home = createLoader({ 'next/head': Head, 'next/link': ({ children, ...props }) => React.createElement('a', props, children),
    '../lib/account-access': { readRequestAccountSession: () => null },
    '../lib/jagd-news-server': { getInitialJagdNews: () => ({ items: [], sources: [] }) },
    '../lib/revier-moment-server': { getRevierMoment: () => null, getRevierMomentPreview: () => null },
    '@capacitor/core': { Capacitor: { isNativePlatform: () => false } }, '@capacitor/push-notifications': { PushNotifications: {} },
    '../components/HomeKnowledgeNavigation': Empty, '../components/RevierMomentEntry': Empty,
    '../components/Community': { CommunityInvite: Empty }, '../components/HomeNews': Empty, '../components/JagdakademiePromotion': Empty,
  })('pages/index.js').default;
  const html = renderToStaticMarkup(React.createElement(Home));
  assert.equal((html.match(/class="brandImage"/g) || []).length, 1);
  assert.match(html, new RegExp(`src="${brand.icon192}"`));
  assert.ok(html.includes(`${brand.icon512} 512w`)); assert.match(html, /sizes="\(max-width: 620px\) 112px, 144px"/);
  assert.ok(html.includes('alt="Jagdlatein – Illustration mit Jäger und Hirsch"'));
  const data = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  assert.deepEqual(data, [siteOrganization]);
  assert.equal(data[0].name, 'Jagdlatein'); assert.equal(data[0].logo.contentUrl, `${brand.site}${brand.logo}`);
  assert.equal(data[0].logo.width, brand.logoSize); assert.equal(data[0].logo.height, brand.logoSize);
  assert.ok(!Object.hasOwn(data[0], 'aggregateRating') && !Object.hasOwn(data[0], 'review'));
  assert.match(html, /rel="canonical" href="https:\/\/jagdlatein.de\/"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.doesNotMatch(html, /<dialog|\?v=book|\/og\.png/);
});

test('Pages and App Router advertise the same PNG favicon and Apple touch paths without changing page canonicals', () => {
  const component = tag => ({ children, ...props }) => React.createElement(tag, props, children);
  const Document = createLoader({ 'next/document': { Html: component('html'), Head: component('head'), Main: () => null, NextScript: () => null } })('pages/_document.js').default;
  const headLinks = nodes(Document(), node => node.type === 'link');
  assert.deepEqual(headLinks.map(node => node.props.href), [brand.favicon32, brand.favicon48, brand.favicon96, brand.appleTouch]);
  assert.deepEqual(headLinks.map(node => node.props.sizes), ['32x32', '48x48', '96x96', '180x180']);
  const file = path.join(root, 'app/layout.jsx'), { code } = local('next/dist/build/swc').transformSync(fs.readFileSync(file, 'utf8'), { filename: file, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id.endsWith('.css') ? {} : id === '../lib/brand-config' ? load('lib/brand-config.js') : id === '../components/GlobalHomeButton' ? { __esModule: true, default: () => null } : local(id), module, module.exports);
  const metadata = module.exports.metadata;
  assert.equal(metadata.metadataBase.href, `${brand.site}/`);
  assert.deepEqual(metadata.icons.icon.map(icon => icon.url), [brand.favicon32, brand.favicon48, brand.favicon96]);
  assert.equal(metadata.icons.apple[0].url, brand.appleTouch);
  assert.equal(metadata.openGraph.images[0].url, brand.shareImage); assert.equal(metadata.twitter.images[0].url, brand.shareImage);
  assert.equal(metadata.alternates, undefined, 'Global App metadata must not assign the homepage as every route canonical');
});

test('The public-brand inventory contains only the eight exact approved assets, with no teaching-media or path-prefix exception', () => {
  assert.equal(brandingAssetPaths.length, 8); assert.equal(new Set(brandingAssetPaths).size, 8);
  assert.deepEqual(new Set(Object.values(brandAssetsObject)), new Set(brandingAssetPaths));
  for (const url of brandingAssetPaths) assert.match(url, /^\/branding\/[a-z0-9-]+-2026-10-29\.png$/);
  assert.ok(!brandingAssetPaths.includes('/branding') && !brandingAssetPaths.some(url => url.includes('lernen')));
  assert.deepEqual(Object.keys(brandAssetsObject).sort(), ['image', 'favicon32', 'favicon48', 'favicon96', 'appleTouch', 'app192', 'app512', 'og'].sort());
});
