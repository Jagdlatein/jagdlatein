const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const local = createRequire(path.join(root, 'package.json'));
const manifest = local('./package.json'), lock = local('./package-lock.json');
function installed(name, issuer = local) {
  let folder = path.dirname(issuer.resolve(name));
  while (folder !== path.dirname(folder)) {
    const file = path.join(folder, 'package.json');
    if (fs.existsSync(file)) {
      const metadata = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (metadata.name === name) return { ...metadata, file };
    }
    folder = path.dirname(folder);
  }
  throw new Error('Package metadata missing: ' + name);
}
function atLeast(version, minimum) {
  const parts = version.split('.').map(Number), required = minimum.split('.').map(Number);
  return parts.every(Number.isFinite) && required.every(Number.isFinite) &&
    (parts[0] > required[0] || parts[0] === required[0] && (parts[1] > required[1] || parts[1] === required[1] && parts[2] >= required[2]));
}

test('Installed and locked Next/Nodemailer are pinned to the reviewed fixes; unrelated runtime versions remain selected', () => {
  for (const [name, version] of [['next', '15.5.28'], ['nodemailer', '10.1.4']]) {
    assert.equal(manifest.dependencies[name], version);
    assert.equal(lock.packages[''].dependencies[name], version);
    assert.equal(lock.packages['node_modules/' + name].version, version);
    assert.equal(installed(name).version, version);
  }
  assert.equal(manifest.dependencies['@vercel/functions'], '3.10.1');
  assert.equal(manifest.dependencies.react, '19.3.0');
  assert.equal(manifest.dependencies['react-dom'], '19.3.0');
});

test('Next resolves the patched Sharp and its actual native image path still handles a tiny isolated in-memory PNG', async () => {
  const next = installed('next'), fromNext = createRequire(next.file), sharpMeta = installed('sharp', fromNext);
  assert.ok(atLeast(sharpMeta.version, '0.35.5'), sharpMeta.version);
  const sharp = fromNext('sharp');
  const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).png().toBuffer();
  const image = await sharp(bytes).metadata();
  assert.equal(image.width, 2); assert.equal(image.height, 2); assert.equal(image.format, 'png');
});

test('Only Vercel CLI config receives the compatible Zod4 fix; oversized constrained arrays reject before per-element errors accumulate', () => {
  assert.equal(Object.hasOwn(manifest.dependencies, 'zod'), false);
  assert.deepEqual(manifest.overrides['@vercel/cli-config'], { zod: '4.6.7' });
  const cli = installed('@vercel/cli-config'), fromCli = createRequire(cli.file), metadata = installed('zod', fromCli);
  assert.equal(metadata.version, '4.6.7');
  const { z } = fromCli('zod');
  const result = z.array(z.string()).max(2).safeParse(Array(1000).fill(0));
  assert.equal(result.success, false); assert.equal(result.error.issues.length, 1); assert.equal(result.error.issues[0].code, 'too_big');
  const schema = z.object({ token: z.string().min(1), projectId: z.string().optional() });
  assert.deepEqual(schema.parse({ token: 'isolated-fixture', projectId: 'fixture' }), { token: 'isolated-fixture', projectId: 'fixture' });
  const zodEntries = Object.entries(lock.packages).filter(([key]) => /(^|\/)node_modules\/zod$/.test(key));
  assert.ok(zodEntries.length > 0);
  for (const [key, value] of zodEntries) assert.ok(atLeast(value.version, '4.6.6'), key);
});

test('The real Nodemailer parser keeps nested comments, quoted group delimiters and quoted local-parts from changing the intended recipient', () => {
  const parse = local('nodemailer/lib/addressparser');
  const cases = [
    ['Victim (x(y) <other@attacker.invalid>) <learner@example.invalid>', 'learner@example.invalid'],
    ['G: (a; <other@attacker.invalid>) <learner@example.invalid>;', 'learner@example.invalid'],
    ['<"a@attacker.invalid>"@example.invalid>', '"a@attacker.invalid>"@example.invalid'],
  ];
  const recipients = entries => entries.flatMap(item => item.group ? recipients(item.group) : [item.address]);
  for (const [input, expected] of cases) assert.deepEqual(recipients(parse(input)), [expected]);
  assert.deepEqual(parse('learner@example.invalid').map(item => item.address), ['learner@example.invalid']);
});

test('The actual retained Vercel runtime exports the APIs required by the existing deferred notification path', () => {
  const runtime = local('@vercel/functions');
  assert.equal(typeof runtime.getDeadline, 'function');
  assert.equal(typeof runtime.waitUntil, 'function');
});
