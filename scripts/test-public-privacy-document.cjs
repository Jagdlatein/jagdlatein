const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const { renderPrivacyDocument, outputPath } = require('./render-privacy-document.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');
const document = fs.readFileSync(outputPath, 'utf8').replace(/\r\n/g, '\n');

test('The published standalone privacy document is up to date with its shared content', () => {
  assert.equal(document, renderPrivacyDocument(), 'Run the privacy document generator after updating the shared policy');
  const PrivacyPolicyContent = createLoader()('components/PrivacyPolicyContent.js').default;
  const content = renderToStaticMarkup(React.createElement(PrivacyPolicyContent, { mutedClassName: 'muted' }));
  assert.equal(document.match(/<section aria-label="Datenschutzhinweise">([\s\S]*?)<\/section>/)[1], content);
});

test('The existing privacy page renders the same shared policy and retains its layout styling', () => {
  const load = createLoader({ '../components/LearningToolLayout': ({ children }) => React.createElement('main', null, children) });
  const Page = load('pages/datenschutz.js').default;
  const page = renderToStaticMarkup(React.createElement(Page));
  const PrivacyPolicyContent = load('components/PrivacyPolicyContent.js').default;
  const content = renderToStaticMarkup(React.createElement(PrivacyPolicyContent, { mutedClassName: 'muted' }));
  assert.equal(page, `<main><section class="panel">${content}</section></main>`);
});

test('Privacy text is readable without scripts, app navigation, forms or fetched resources', () => {
  assert.match(document, /^<!DOCTYPE html>\s*<html lang="de">/);
  assert.match(document, /<meta charset="utf-8">/);
  assert.match(document, /<meta name="viewport"/);
  assert.match(document, /<title>Datenschutzerklärung – Jagdlatein<\/title>/);
  assert.match(document, /<h1>Datenschutzerklärung<\/h1>/);
  assert.equal((document.match(/<h2>/g) || []).length, 7);
  assert.match(document, /<h2>1\. Verantwortlicher<\/h2>/);
  assert.match(document, /<h2>7\. Deine Rechte und Kontakt<\/h2>/);
  assert.match(document, /<h3>Technische Schutzmaßnahmen<\/h3>/);
  assert.doesNotMatch(document, /<(?:script|noscript|nav|iframe|form|input|button|img|video|audio|link)\b/i);
  assert.doesNotMatch(document, /\b(?:src|srcset|on\w+)\s*=/i);
  assert.doesNotMatch(document, /(?:url\s*\(|@import\b|http-equiv\s*=)/i);
  assert.doesNotMatch(document, /__NEXT_DATA__|\/_next\//);
});

test('The standalone page includes the shared operator identity and direct contact links', () => {
  const { operatorContact } = createLoader()('lib/operator-contact.js');
  for (const text of [operatorContact.name, operatorContact.street, operatorContact.city, operatorContact.country, operatorContact.email, operatorContact.phone]) {
    assert.ok(document.includes(text), text);
  }
  assert.ok(document.includes(`href="mailto:${operatorContact.email}"`));
  assert.ok(document.includes(`href="${operatorContact.phoneHref}"`));
});

test('Every production build regenerates the privacy document before Next builds', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.prebuild, 'node scripts/render-privacy-document.cjs');
});
