const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { PassThrough } = require('node:stream');
const { local, root } = require('./helpers/project-module.cjs');
const current = require('../next.config.js');
const expected = {
  'content-security-policy': "frame-ancestors 'self';",
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
};
const toHeaders = values => Object.fromEntries(values.map(({ key, value }) => [key.toLowerCase(), value]));

test('Exactly four response safeguards apply globally without restricting scripts, child frames, cameras or media', async () => {
  const entries = await current.headers();
  assert.equal(entries.length, 1); assert.equal(entries[0].source, '/:path*');
  assert.deepEqual(toHeaders(entries[0].headers), expected);
  assert.doesNotMatch(expected['content-security-policy'], /(?:script-src|default-src|frame-src|child-src|media-src|connect-src|sandbox)/);
  assert.ok(!entries[0].headers.some(item => item.key.toLowerCase() === 'permissions-policy'));
});

test('Every existing redirect, remote image pattern and public release environment rule stays exact', async () => {
  const original = { exports: {} };
  const source = execFileSync('git', ['show', 'c42efa5:next.config.js'], { cwd: root, encoding: 'utf8' });
  new Function('module', 'process', source)(original, process);
  assert.deepEqual(Object.keys(current).filter(key => key !== 'headers'), Object.keys(original.exports));
  assert.deepEqual(await current.redirects(), await original.exports.redirects());
  assert.deepEqual(current.images, original.exports.images); assert.deepEqual(current.env, original.exports.env);
});

async function resolver() {
  const { defaultConfig } = local('next/dist/server/config-shared');
  const loadCustomRoutes = local('next/dist/lib/load-custom-routes').default;
  const { buildCustomRoute } = local('next/dist/server/lib/router-utils/filesystem');
  const { getResolveRoutes } = local('next/dist/server/lib/router-utils/resolve-routes');
  const config = { ...defaultConfig, ...current, experimental: { ...defaultConfig.experimental } };
  const routes = await loadCustomRoutes(config);
  const files = new Map([
    ['/', 'pageFile'], ['/kurse/testkurs', 'pageFile'], ['/api/fotohelfer/recognize', 'appFile'],
    ['/_next/static/chunks/test.js', 'nextStaticFolder'], ['/lernen/videos/test.mp4', 'publicFolder'],
    ['/firebase-messaging-sw.js', 'publicFolder'], ['/404', 'pageFile'], ['/500', 'pageFile'],
  ]);
  const fsChecker = {
    buildId: 'isolated-security-header-build',
    headers: routes.headers.map(item => buildCustomRoute('header', item, config.basePath, false)),
    redirects: routes.redirects.map(item => buildCustomRoute('redirect', item, config.basePath, false)),
    rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
    getMiddlewareMatchers: () => null, getDynamicRoutes: () => [],
    handleLocale: pathname => ({ pathname }),
    getItem: async pathname => files.has(pathname) ? { type: files.get(pathname), itemPath: pathname } : null,
  };
  const resolve = getResolveRoutes(fsChecker, config, { dir: root, dev: false, hostname: 'localhost', port: 3000, minimalMode: false }, null, {});
  return async pathname => {
    const req = new PassThrough(); req.url = pathname; req.method = 'GET'; req.headers = { host: 'localhost:3000' }; req.socket = {};
    const res = { setHeader() {}, writableFinished: false };
    try { return await resolve({ req, res, isUpgradeReq: false, invokedOutputs: new Set() }); }
    finally { req.destroy(); }
  };
}

test('The installed Next router resolves real global header rules for HTML, API, static assets, service worker and error paths', async () => {
  const resolve = await resolver();
  for (const pathname of ['/', '/kurse/testkurs', '/api/fotohelfer/recognize', '/_next/static/chunks/test.js', '/lernen/videos/test.mp4', '/firebase-messaging-sw.js', '/404', '/500', '/missing-page?next=%2Fkonto']) {
    const result = await resolve(pathname);
    const headers = Object.fromEntries(Object.entries(result.resHeaders).map(([key, value]) => [key.toLowerCase(), value]));
    assert.deepEqual(headers, expected, pathname);
    assert.equal(result.parsedUrl.pathname, pathname.split('?')[0]);
    assert.equal(result.statusCode, undefined);
  }
});

test('The installed Next redirect resolver preserves the existing permanent quiz destinations', async () => {
  const resolve = await resolver();
  for (const suffix of ['', '/run', '/leaderboard', '/stats', '/username']) {
    const result = await resolve('/quiz' + suffix);
    assert.equal(result.finished, true); assert.equal(result.statusCode, 308);
    assert.equal(result.parsedUrl.pathname, '/quiz-app' + suffix);
    assert.equal(result.parsedUrl.host, undefined);
  }
});
