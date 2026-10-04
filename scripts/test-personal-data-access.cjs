const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const { NextRequest } = pr('next/server');
const email = 'learner@example.invalid';
const env = { JL_SESSION_SECRET: 'personal-data-test-secret-at-least-32-characters',
  SUPABASE_URL: 'https://database.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'isolated-fake-service-key' };

function fixture(overrides = {}) {
  const calls = []; const cache = new Map();
  const state = { profile: { email, is_premium: false, is_admin: false }, ...overrides };
  const database = {
    from(table) {
      calls.push({ table }); let candidate;
      const query = {
        select() { return query; }, eq() { return query; }, order() { return query; },
        ilike(field, pattern) { calls.push({ field, pattern }); return query; },
        upsert(row) { candidate = row; calls.push({ write: table, row }); return query; },
        insert(row) { candidate = row; calls.push({ write: table, row }); return query; },
        async maybeSingle() { return { data: state.profile, error: state.profileError || null }; },
        async single() {
          const { account_email, ...publicRow } = candidate;
          return { data: publicRow, error: null };
        },
        then(resolve) { resolve({ data: [], error: null }); },
      };
      return query;
    },
    async rpc(name, args) { calls.push({ rpc: name, args }); return { data: { history: [], topics: [] }, error: null }; },
  };
  function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true,
      jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022' }, module: { type: 'commonjs' } });
    const mod = { exports: {} }; cache.set(filename, mod);
    new Function('require', 'module', 'exports', 'process', code)(id => {
      if (id === '@supabase/supabase-js') return { createClient: () => database };
      if (id.startsWith('.')) {
        const file = path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`);
        return file.endsWith('.js') ? load(path.relative(root, file)) : pr(file);
      }
      return pr(id);
    }, mod, mod.exports, { env });
    return mod.exports;
  }
  const session = load('lib/account-session.js');
  const token = session.createAccountSession(email, Date.now() - 3600000);
  const course = load('lib/course-catalog.js').courses[0];
  const payloads = {
    'course-progress': { courseId: course.id, answeredQuestions: 1, totalQuestions: course.totalQuestions, score: 0, completed: false },
    'activity-results': { eventId: '11111111-1111-4111-8111-111111111111', type: 'ansitz', country: null,
      topic: 'Ansitzsimulator', totalQuestions: 25, correctAnswers: 10, timedOutAnswers: 0, points: 10, durationSeconds: 60 },
  };
  return { calls, state, session, token, api: route => load(`app/api/${route}/route.js`),
    request(route, method, cookie = token, body = payloads[route]) {
      return new NextRequest(`https://jagdlatein.test/api/${route}?email=other@example.invalid`, {
        method, headers: { cookie: `jl_account_session=${cookie}`, ...(method === 'POST' ? {
          origin: 'https://jagdlatein.test', 'content-type': 'application/json',
        } : {}) }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
      });
    },
  };
}

for (const route of ['course-progress', 'activity-results']) {
  for (const method of ['GET', 'POST']) {
    test(`Deleted account cannot ${method} ${route} with its still-valid signed cookie`, async () => {
      const ctx = fixture({ profile: null }); const response = await ctx.api(route)[method](ctx.request(route, method));
      assert.equal(response.status, 401); assert.equal((await response.json()).code, 'SESSION_RENEWAL_REQUIRED');
      assert.ok(ctx.calls.filter(call => call.table).every(call => call.table === 'userprofile'));
      assert.ok(!ctx.calls.some(call => call.rpc || call.write));
    });
    test(`Matched unpaid account can ${method} its own ${route} without an active subscription`, async () => {
      const ctx = fixture(); const response = await ctx.api(route)[method](ctx.request(route, method));
      assert.equal(response.status, 200); assert.equal(response.headers.get('vary'), 'Cookie');
      assert.match(response.headers.get('cache-control'), /private, no-store/);
      assert.ok(!JSON.stringify(await response.json()).includes('@'));
      assert.ok(ctx.calls.some(call => call.table === 'userprofile'));
      assert.ok(!ctx.calls.some(call => call.table?.startsWith('paypal_')));
      if (method === 'POST') assert.equal(ctx.calls.find(call => call.write).row.account_email, email);
      if (route === 'activity-results' && method === 'GET') assert.equal(ctx.calls.find(call => call.rpc).args.p_account_email, email);
    });
  }
  test(`Mismatched profile cannot read ${route}`, async () => {
    const ctx = fixture({ profile: { email: 'other@example.invalid' } }); const response = await ctx.api(route).GET(ctx.request(route, 'GET'));
    assert.equal(response.status, 401); assert.ok(!ctx.calls.some(call => call.table === route.replace('-', '_') || call.rpc));
  });
  test(`Database outage exposes no private details for ${route}`, async () => {
    const ctx = fixture({ profileError: { message: 'sensitive database error' } }); const response = await ctx.api(route).GET(ctx.request(route, 'GET'));
    assert.equal(response.status, 503); assert.ok(!JSON.stringify(await response.json()).includes('sensitive'));
    assert.ok(!ctx.calls.some(call => call.rpc || call.write));
  });
  test(`Unsigned identity is rejected before database access for ${route}`, async () => {
    const ctx = fixture(); const response = await ctx.api(route).GET(ctx.request(route, 'GET', 'fake.signature'));
    assert.equal(response.status, 401); assert.equal(ctx.calls.length, 0);
  });
}
