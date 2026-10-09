const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const postId = '11111111-1111-4111-8111-111111111111';
process.env.JL_SESSION_SECRET = 'community-isolated-test-secret-32-characters';
process.env.SUPABASE_URL = 'https://community-test.invalid';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'isolated-server-role-test';
function load(relative, dbFactory, cache = new Map()) {
  const filename = path.join(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2020' }, module: { type: 'commonjs' } });
  const mod = { exports: {} }; cache.set(filename, mod); const req = createRequire(filename);
  new Function('require', 'module', 'exports', code)(id => {
    if (id === '@supabase/supabase-js') return { createClient: dbFactory };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.js')), dbFactory, cache);
    return req(id);
  }, mod, mod.exports);
  return mod.exports;
}
function setup(overrides = {}) {
  const calls = []; let clients = 0;
  const state = { profile: { email: 'learner@example.invalid', is_admin: false, is_community_moderator: false }, communityProfile: { display_name: 'Lernfuchs', rules_accepted_at: '2026-10-04T10:00:00Z' },
    read: { posts: [{ id: postId, threadId: null, title: 'Wie lerne ich Wildkunde?', body: 'Eine echte Frage zum gemeinsamen Lernen.', category: 'wildkunde', type: 'question', displayName: 'Lernfuchs', status: 'visible', owned: true, solved: false, replyCount: 0, createdAt: '2026-10-04T10:00:00Z', updatedAt: '2026-10-04T10:00:00Z', account_email: 'must-never-leave@example.invalid' }], total: 1, page: 1, pageSize: 12, email: 'must-never-leave@example.invalid' }, ...overrides };
  if (state.profile && !Object.hasOwn(state.profile, 'is_community_moderator')) state.profile.is_community_moderator = false;
  const db = { from(table) { const query = { select(columns) { calls.push({ table, columns }); return query; }, ilike() { return query; }, eq() { return query; }, async maybeSingle() { return table === 'userprofile' ? { data: state.profile, error: state.profileError || null } : { data: state.communityProfile, error: state.communityProfileError || null }; } }; return query; }, async rpc(name, args) { calls.push({ name, args }); return { data: name === 'community_read' ? { moderationAuthorized: state.profile?.is_admin === true || state.profile?.is_community_moderator === true, ...state.read } : state.write || { success: true, postId, email: 'private@example.invalid' }, error: state.rpcError || null }; } };
  const factory = () => { clients++; return db; };
  const session = load('lib/account-session.js', factory);
  const token = session.createAccountSession('learner@example.invalid', Date.now(), { paid: false, admin: false });
  const api = load('app/api/community/route.js', factory);
  function request(method = 'GET', body, query = '', headers = {}) { return new Request(`https://jagdlatein.test/api/community${query}`, { method, headers: { cookie: `jl_account_session=${token}`, ...(method !== 'GET' ? { origin: 'https://jagdlatein.test', 'content-type': 'application/json' } : {}), ...headers }, ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}) }); }
  return { api, state, calls, session, token, request, clients: () => clients, server: load('lib/community-server.js', factory) };
}
test('Signed unpaid accounts read community without a paid-access query; optional profile is required only for writing', async () => {
  const ctx = setup({ communityProfile: null }); const response = await ctx.api.GET(ctx.request()); const data = await response.json();
  assert.equal(response.status, 200); assert.equal(data.viewer.profileRequired, true); assert.equal(data.viewer.displayName, null);
  assert.equal(data.posts[0].replyCount, 0); assert.equal(data.posts[0].solved, false);
  assert.ok(ctx.calls.filter(call => call.table).every(call => ['userprofile', 'community_profiles'].includes(call.table)));
  assert.ok(!JSON.stringify(data).includes('@')); assert.equal(response.headers.get('cache-control'), 'private, no-store');
});
test('Forged or expired session cookies fail before database access', async () => {
  const ctx = setup();
  for (const token of [ctx.token.slice(0, -8) + 'forgedxx', ctx.session.createAccountSession('learner@example.invalid', Date.now() - 41 * 86400000)]) {
    const response = await ctx.api.GET(ctx.request('GET', undefined, '', { cookie: `jl_account_session=${token}` })); assert.equal(response.status, 401);
  }
  assert.equal(ctx.clients(), 0);
});
test('Deleted accounts cannot use a still-valid signed cookie', async () => {
  const ctx = setup({ profile: null }); const response = await ctx.api.GET(ctx.request()); assert.equal(response.status, 401); assert.ok(!ctx.calls.some(call => call.name));
});
test('Fresh database admin flag overrides a signed cookie admin flag', async () => {
  const ctx = setup(); const token = ctx.session.createAccountSession('learner@example.invalid', Date.now(), { paid: true, admin: true });
  const response = await ctx.api.GET(ctx.request('GET', undefined, '?view=reports', { cookie: `jl_account_session=${token}` })); assert.equal(response.status, 403); assert.ok(!ctx.calls.some(call => call.name));
});
test('Origin and JSON checks reject cross-site writes before access or parsing', async () => {
  const ctx = setup();
  const crossSite = await ctx.api.POST(ctx.request('POST', {}, '', { origin: 'https://foreign.test' })); assert.equal(crossSite.status, 403);
  const nonJson = await ctx.api.POST(ctx.request('POST', {}, '', { 'content-type': 'text/plain' })); assert.equal(nonJson.status, 415);
  assert.equal(ctx.clients(), 0);
});
test('Byte limit checks real body bytes even without content-length', async () => {
  const ctx = setup(); const response = await ctx.api.POST(ctx.request('POST', JSON.stringify({ action: 'post', body: 'ö'.repeat(10000) })));
  assert.equal(response.status, 413); assert.ok(!ctx.calls.some(call => call.name));
});
test('Profiles require voluntary rules acceptance and allow no identity override', async () => {
  const ctx = setup({ communityProfile: null });
  const bad = await ctx.api.POST(ctx.request('POST', { action: 'profile', displayName: 'Lernfuchs', acceptedRules: true, email: 'other@example.invalid' })); assert.equal(bad.status, 400);
  const unaccepted = await ctx.api.POST(ctx.request('POST', { action: 'profile', displayName: 'Lernfuchs', acceptedRules: false })); assert.equal(unaccepted.status, 400);
  const response = await ctx.api.POST(ctx.request('POST', { action: 'profile', displayName: 'Lernfuchs', acceptedRules: true })); assert.equal(response.status, 200);
  const rpc = ctx.calls.find(call => call.name === 'community_write'); assert.equal(rpc.args.p_actor_email, 'learner@example.invalid'); assert.equal(rpc.args.p_action, 'profile'); assert.equal(rpc.args.p_payload.rulesVersion, '2026-10-09');
});
test('Authors cannot supply admin, email, status or profile names when creating a post', async () => {
  const ctx = setup(); const body = { action: 'post', category: 'wildkunde', type: 'question', title: 'Wie lerne ich Wildkunde?', body: 'Meine Frage zum gemeinsamen Lernen.', acceptedRules: true };
  for (const override of [{ admin: true }, { email: 'other@example.invalid' }, { status: 'visible' }, { displayName: 'Moderator' }]) assert.equal((await ctx.api.POST(ctx.request('POST', { ...body, ...override }))).status, 400);
  const response = await ctx.api.POST(ctx.request('POST', body)); assert.equal(response.status, 200); assert.ok(!JSON.stringify(await response.json()).includes('@'));
  const rpc = ctx.calls.find(call => call.name === 'community_write'); assert.equal(rpc.args.p_actor_email, 'learner@example.invalid'); assert.ok(!Object.hasOwn(rpc.args.p_payload, 'admin'));
});
test('Posting without community profile fails clearly while reads remain allowed', async () => {
  const ctx = setup({ communityProfile: null }); const response = await ctx.api.POST(ctx.request('POST', { action: 'reply', threadId: postId, body: 'Eine Antwort.', acceptedRules: true }));
  assert.equal(response.status, 409); assert.equal((await response.json()).code, 'PROFILE_REQUIRED'); assert.ok(!ctx.calls.some(call => call.name));
});
test('Only fresh admins moderate; own delete and mark-solved ownership is enforced by atomic RPC', async () => {
  const ctx = setup(); assert.equal((await ctx.api.PATCH(ctx.request('PATCH', { action: 'moderate', postId, status: 'hidden' }))).status, 403);
  ctx.state.rpcError = { message: 'JL_COMMUNITY_FORBIDDEN' };
  assert.equal((await ctx.api.DELETE(ctx.request('DELETE', { postId }))).status, 403);
  assert.equal((await ctx.api.PATCH(ctx.request('PATCH', { action: 'mark-solved', postId, solved: true }))).status, 403);
  const admin = setup({ profile: { email: 'learner@example.invalid', is_admin: true } });
  assert.equal((await admin.api.PATCH(admin.request('PATCH', { action: 'moderate', postId, status: 'hidden' }))).status, 200);
});
test('Atomic rate limits and missing migrations produce clear, private API errors', async () => {
  const limited = setup({ rpcError: { message: 'JL_COMMUNITY_LIMIT' } });
  const rate = await limited.api.POST(limited.request('POST', { action: 'reply', threadId: postId, body: 'Eine Antwort.', acceptedRules: true })); assert.equal(rate.status, 429);
  const missing = setup({ communityProfileError: { code: '42P01', message: 'private database details' } });
  const unavailable = await missing.api.GET(missing.request()); const data = await unavailable.json(); assert.equal(unavailable.status, 503); assert.equal(data.setupRequired, true); assert.ok(!JSON.stringify(data).includes('private database details'));
});
test('Filters, solve flags, identifiers and field lengths validate before RPC', () => {
  const ctx = setup();
  assert.deepEqual(ctx.server.validateCommunityRead(ctx.request('GET', undefined, '?category=wildkunde&type=question&unanswered=1&page=2')).options, { category: 'wildkunde', query: '', type: 'question', unanswered: true, page: 2 });
  for (const query of ['?page=0', '?page=1.2', '?category=unknown', '?type=other', '?unanswered=yes', '?thread=not-a-uuid']) assert.throws(() => ctx.server.validateCommunityRead(ctx.request('GET', undefined, query)));
  assert.throws(() => ctx.server.validateCommunityWrite('PATCH', { action: 'mark-solved', postId, solved: 'true' }));
  assert.throws(() => ctx.server.validateCommunityWrite('POST', { action: 'profile', displayName: 'someone@example.invalid', acceptedRules: true }));
  assert.throws(() => ctx.server.validateCommunityWrite('POST', { action: 'reply', threadId: postId, body: 'x', acceptedRules: true }));
});

test('Block actions identify the target by post only and never accept account or actor overrides', async () => {
  const ctx = setup();
  for (const extra of [{ email: 'other@example.invalid' }, { actor: 'other@example.invalid' }, { blockedEmail: 'other@example.invalid' }]) {
    assert.equal((await ctx.api.POST(ctx.request('POST', { action: 'block', postId, ...extra }))).status, 400);
  }
  assert.equal((await ctx.api.POST(ctx.request('POST', { action: 'block', postId }))).status, 200);
  const call = ctx.calls.find(value => value.name === 'community_write');
  assert.equal(call.args.p_actor_email, 'learner@example.invalid');
  assert.deepEqual(call.args.p_payload, { postId });
  assert.equal((await ctx.api.PATCH(ctx.request('PATCH', { action: 'unblock', blockId: postId }))).status, 200);
});

test('Own block management discloses only opaque record ID, public name and date', async () => {
  const ctx = setup({ read: { blocks: [{ id: postId, displayName: 'Lernfuchs', createdAt: '2026-10-08T10:00:00Z', blocked_email: 'private@example.invalid', blocker_email: 'private2@example.invalid' }] } });
  const response = await ctx.api.GET(ctx.request('GET', undefined, '?view=blocks'));
  assert.equal(response.status, 200); const data = await response.json();
  assert.deepEqual(Object.keys(data.blocks[0]).sort(), ['createdAt','displayName','id']);
  assert.ok(!JSON.stringify(data).includes('@'));
  assert.equal(ctx.calls.find(value => value.name === 'community_read').args.p_mode, 'blocks');
});

test('Blocked interaction errors are sanitized and profile-less accounts cannot set blocks', async () => {
  const ctx = setup({ rpcError: { message: 'JL_COMMUNITY_BLOCKED private@example.invalid' } });
  const response = await ctx.api.POST(ctx.request('POST', { action: 'reply', threadId: postId, body: 'Eine Antwort', acceptedRules: true }));
  assert.equal(response.status, 403); const data = await response.json();
  assert.equal(data.code, 'USER_BLOCKED'); assert.ok(!JSON.stringify(data).includes('@'));
  const missing = setup({ communityProfile: null });
  assert.equal((await missing.api.POST(missing.request('POST', { action: 'block', postId }))).status, 409);
  assert.ok(!missing.calls.some(value => value.name));
});
