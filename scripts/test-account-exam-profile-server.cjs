// Synthetic accounts and an isolated Supabase double; no live database calls.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const repo = path.resolve(__dirname, '..');
const local = createRequire(path.join(repo, 'package.json'));
const swc = local('next/dist/build/swc');
const { NextRequest } = local('next/server');
const EMAIL = 'exam_test@example.invalid';
const GENERATION = 'a1111111-1111-4111-8111-111111111111';
const OTHER_GENERATION = 'b2222222-2222-4222-8222-222222222222';
const ORIGIN = 'https://jagdlatein.example.invalid';

function fixture(options = {}) {
  const state = { email: EMAIL, account_generation: GENERATION, exam_country: null, exam_region: null,
    ...(options.row || {}) };
  const queries = [], writes = [], clients = [];
  let currentReads = 0;
  const db = {
    from(table) {
      assert.equal(table, 'userprofile');
      const query = { table, fields: null, filters: [] }; queries.push(query);
      const chain = {
        select(fields) { query.fields = fields; return chain; },
        ilike(column, value) { query.filters.push({ method: 'ilike', column, value }); return chain; },
        eq(column, value) { query.filters.push({ method: 'eq', column, value }); return chain; },
        async maybeSingle() {
          if (options.databaseError) return { error: { message: 'synthetic private database detail' } };
          if (options.deleted) return { data: null };
          const normalizedPattern = query.filters.find(item => item.column === 'email').value.replace(/\\([\\%_])/g, '$1');
          if (normalizedPattern !== state.email.toLowerCase() || query.filters.some(item => item.method === 'eq' && state[item.column] !== item.value)) return { data: null };
          const data = Object.fromEntries(query.fields.split(',').filter(key => Object.hasOwn(state, key)).map(key => [key, state[key]]));
          if (query.fields.includes('exam_country')) options.afterRead?.(state);
          else { currentReads++; if (options.failCurrentRead === currentReads) return { data: null }; }
          return { data };
        },
      };
      return chain;
    },
    async rpc(name, values) {
      assert.equal(name, 'set_account_exam_profile');
      writes.push({ name, values });
      options.beforeWrite?.(state);
      if (options.rpcError) return { error: options.rpcError };
      if (options.deleted || state.account_generation !== values.p_account_generation || state.email !== values.p_email) return { error: { message: 'JL_EXAM_PROFILE_IDENTITY' } };
      state.exam_country = values.p_country; state.exam_region = values.p_region;
      return { data: options.rpcResult || { country: state.exam_country, region: state.exam_region } };
    },
  };
  const env = { JL_SESSION_SECRET: 'synthetic-exam-profile-session-secret-32-bytes-long',
    ACCOUNT_GENERATION_ENABLED: 'true', SUPABASE_URL: 'https://database.example.invalid',
    SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key', ...options.env };
  const cache = new Map();
  const context = vm.createContext({ process: { env }, Buffer, TextDecoder, TextEncoder, Response,
    URL, Date, console, Uint8Array, fetch() { throw new Error('No real network is allowed'); } });
  function load(relative) {
    const filename = path.join(repo, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    const module = { exports: {} }; cache.set(filename, module);
    const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename,
      jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' } });
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(id => {
      if (id === '@supabase/supabase-js') return { createClient(...args) { clients.push(args); return db; } };
      if (id.startsWith('.')) return load(path.relative(repo, path.resolve(path.dirname(filename), path.extname(id) ? id : `${id}.js`)));
      return local(id);
    }, module, module.exports);
    return module.exports;
  }
  const sessions = load('lib/account-session.js');
  const access = { paid: false, admin: false, authenticatedAt: Math.floor(Date.now() / 1000), accountGeneration: GENERATION, ...options.access };
  const token = sessions.createAccountSession(options.email || EMAIL, options.tokenTime || Date.now(), access);
  const session = sessions.readAccountSession(token);
  const route = load('app/api/account/exam-profile/route.js');
  function request(method = 'GET', value = { country: 'CH', region: 'ZH' }, headers = {}) {
    return new NextRequest(ORIGIN + '/api/account/exam-profile?email=other@example.invalid', {
      method, headers: { ...(token ? { Cookie: `jl_account_session=${token}` } : {}),
        ...(method !== 'GET' ? { Origin: ORIGIN, 'Content-Type': 'application/json', 'X-Jagdlatein-Exam-Account': GENERATION } : {}), ...headers },
      ...(method !== 'GET' ? { body: typeof value === 'string' ? value : JSON.stringify(value) } : {}),
    });
  }
  return { db, state, queries, writes, clients, session, route, request, server: load('lib/account-exam-profile-server.js') };
}

async function json(response, status = 200) {
  assert.equal(response.status, status);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  assert.equal(response.headers.get('vary'), 'Cookie');
  return response.json();
}

test('Unpaid account can read an absent target using only signed identity and current generation', async () => {
  const s = fixture();
  assert.deepEqual(await json(await s.route.GET(s.request())), { profile: null, accountKey: GENERATION });
  assert.equal(s.writes.length, 0);
  assert.equal(s.queries.length, 3);
  assert.ok(s.queries.every(query => query.filters.some(filter => filter.column === 'email' && filter.value === 'exam\\_test@example.invalid')));
  assert.deepEqual(s.queries[1].filters[1], { method: 'eq', column: 'account_generation', value: GENERATION });
});

test('SSR export returns only a validated profile without leaking email or generation', async () => {
  const s = fixture({ row: { exam_country: 'AT', exam_region: 'T' } });
  assert.deepEqual(JSON.parse(JSON.stringify(await s.server.readAccountExamProfile(s.session, s.db))), { country: 'AT', region: 'T' });
});

test('PUT changes only exam fields of the current unpaid account via restricted RPC', async () => {
  const s = fixture({ row: { is_premium: false, is_admin: false } });
  assert.deepEqual(await json(await s.route.PUT(s.request('PUT', { country: 'DE', region: 'BY' }))), { profile: { country: 'DE', region: 'BY' }, accountKey: GENERATION });
  assert.deepEqual(JSON.parse(JSON.stringify(s.writes[0])), { name: 'set_account_exam_profile', values: {
    p_email: EMAIL, p_account_generation: GENERATION, p_country: 'DE', p_region: 'BY',
  } });
  assert.equal(s.state.is_premium, false); assert.equal(s.state.is_admin, false);
});

test('All 51 exact region pairs are accepted, including country-specific duplicate codes', async () => {
  const s = fixture(), { examCountries } = require('./helpers/project-module.cjs').createLoader()('lib/exam-profile.js');
  let count = 0;
  for (const country of examCountries) for (const region of country.regions) {
    const value = { country: country.code, region: region.code };
    assert.deepEqual(await json(await s.route.PUT(s.request('PUT', value))), { profile: value, accountKey: GENERATION });
    count++;
  }
  assert.equal(count, 51);
});

for (const value of [null, [], {}, { country: 'CH' }, { country: 'CH', region: null },
  { country: 'CH', region: 'BY' }, { country: 'DE', region: 'BUND' }, { country: 'de', region: 'BY' },
  { country: 'DE', region: 'by' }, { country: 'AT', region: 'ZH' }, { country: 'DE', region: 'BY', email: 'victim@example.invalid' },
  { country: 'DE', region: 'BY', accountGeneration: OTHER_GENERATION }, { country: 'DE', region: 'BY', paid: true }]) {
  test('Invalid/identity-bearing body is rejected without any write: ' + JSON.stringify(value), async () => {
    const s = fixture();
    const data = await json(await s.route.PUT(s.request('PUT', value)), 400);
    assert.equal(data.code, 'INVALID_EXAM_PROFILE'); assert.deepEqual(s.writes, []); assert.deepEqual(s.queries, []);
  });
}

for (const [headers, expected] of [[{ Origin: 'https://evil.example.invalid' }, 403], [{ Origin: 'null' }, 403], [{ 'Content-Type': 'text/plain' }, 415]]) {
  test('Existing JSON/origin guard rejects ' + JSON.stringify(headers), async () => {
    const s = fixture();
    await json(await s.route.PUT(s.request('PUT', { country: 'CH', region: 'ZH' }, headers)), expected);
    assert.equal(s.clients.length, 0); assert.deepEqual(s.writes, []);
  });
}

for (const key of ['', OTHER_GENERATION, GENERATION.toUpperCase()]) {
  test('A stale tab cannot write through a changed cookie account scope: ' + key, async () => {
    const s = fixture();
    const body = await json(await s.route.PUT(s.request('PUT', { country: 'AT', region: 'T' }, { 'X-Jagdlatein-Exam-Account': key })), 409);
    assert.equal(body.code, 'EXAM_ACCOUNT_CHANGED'); assert.equal(s.clients.length, 0); assert.deepEqual(s.writes, []);
  });
}

test('Missing, forged, expired and legacy identity sessions expose no target and write nothing', async () => {
  for (const options of [{}, { access: { accountGeneration: null } }, { tokenTime: Date.now() - 41 * 86400000,
    access: { authenticatedAt: Math.floor((Date.now() - 41 * 86400000) / 1000) } }]) {
    const s = fixture(options);
    const req = s.request('GET', undefined, Object.keys(options).length === 0
      ? { Cookie: 'jl_session=1; jl_email=victim@example.invalid; jl_account_session=forged' } : {});
    await json(await s.route.GET(req), 401); assert.equal(s.clients.length, 0);
  }
});

test('Deleted and recreated accounts cannot be read or changed by the old generation', async () => {
  for (const options of [{ deleted: true }, { row: { account_generation: OTHER_GENERATION } }]) {
    const s = fixture(options);
    await json(await s.route.GET(s.request()), 401);
    await json(await s.route.PUT(s.request('PUT')), 401);
    assert.deepEqual(s.writes, []);
  }
});

test('Generation binding remains mandatory even when a legacy deployment flag is off', async () => {
  const s = fixture({ env: { ACCOUNT_GENERATION_ENABLED: 'false' }, row: { account_generation: OTHER_GENERATION } });
  await json(await s.route.GET(s.request()), 401);
  await json(await s.route.PUT(s.request('PUT')), 401);
  assert.equal(s.writes.length, 1, 'The atomic write RPC independently rejects the old generation');
});

test('Deletion/recreation between precheck and write cannot affect the replacement account', async () => {
  const s = fixture({ beforeWrite: state => { state.account_generation = OTHER_GENERATION; } });
  await json(await s.route.PUT(s.request('PUT')), 401);
  assert.equal(s.state.exam_country, null); assert.equal(s.state.exam_region, null);
});

test('Account revocation after data arrived suppresses the response', async () => {
  const s = fixture({ afterRead: state => { state.account_generation = OTHER_GENERATION; } });
  await json(await s.route.GET(s.request()), 401);
  const w = fixture({ failCurrentRead: 2 });
  await json(await w.route.PUT(w.request('PUT')), 401);
});

test('Missing schema/RPC/configuration and corrupt persisted pairs fail closed without disclosure', async () => {
  for (const options of [{ databaseError: true }, { rpcError: { message: 'private SQL schema details' } },
    { rpcResult: { country: 'DE', region: 'BY' } }, { env: { SUPABASE_URL: '' } }]) {
    const s = fixture(options);
    const response = await s.route.PUT(s.request('PUT'));
    const data = await json(response, 503);
    assert.equal(data.code, 'EXAM_PROFILE_UNAVAILABLE'); assert.doesNotMatch(JSON.stringify(data), /private SQL|synthetic-service|database\.example/);
  }
  for (const row of [{ exam_country: 'CH', exam_region: 'BY' }, { exam_country: null, exam_region: 'ZH' }, { exam_country: 'CH', exam_region: null }]) {
    const s = fixture({ row }); await json(await s.route.GET(s.request()), 503);
  }
});

test('Malformed, oversized and wrong-encoding bodies are bounded before database access', async () => {
  for (const [value, headers, status] of [['{', {}, 400], ['x'.repeat(1025), {}, 413], ['{}', { 'Content-Length': '9999' }, 413], ['{}', { 'Content-Length': '-1' }, 413]]) {
    const s = fixture(); await json(await s.route.PUT(s.request('PUT', value, headers)), status); assert.equal(s.clients.length, 0);
  }
  const s = fixture();
  const req = s.request('PUT');
  Object.defineProperty(req, 'body', { value: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([0xff])); controller.close(); } }) });
  await json(await s.route.PUT(req), 400); assert.equal(s.clients.length, 0);
});

test('No DELETE/POST route exists and GET is never a write', async () => {
  const s = fixture(); assert.equal(s.route.DELETE, undefined); assert.equal(s.route.POST, undefined);
  await s.route.GET(s.request()); assert.deepEqual(s.writes, []);
});
