// Contract and classification tests use isolated responses, not a paid model.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, root } = require('./helpers/project-module.cjs');
const load = createLoader();
const { PHOTO_RECOGNITION_CANDIDATES, normalizePhotoRecognitionResponse } = load('lib/revier-photo-recognition.js');
const { buildPhotoRecognitionRequest, requestPhotoRecognition } = load('lib/revier-photo-openai.js');
const input = changes => ({ status: 'suggestion', candidateIds: ['meat'], categoryId: 'wildbret-gesundheit', observations: [], ...changes });

test('A visible meat motif has the canonical Wildbret category and existing direct learning destinations without inventing species or cuts', () => {
  const meat = PHOTO_RECOGNITION_CANDIDATES.find(candidate => candidate.id === 'meat');
  assert.ok(meat); assert.equal(meat.kind, 'motif'); assert.equal(meat.scientificName, '');
  const result = normalizePhotoRecognitionResponse(input());
  assert.equal(result.status, 'suggestion'); assert.equal(result.candidate.id, 'meat');
  assert.deepEqual(result.category, { id: 'wildbret-gesundheit', title: 'Wildbret & Gesundheit', href: '/lernen/wildbret-gesundheit' });
  assert.equal(result.comparison, null);
  assert.match(result.answer, /Tierart, genaues Teilstück und Genusstauglichkeit sind damit nicht bestimmt/);
  assert.deepEqual(result.readingLinks.map(link => link.href), ['/lernen/wildbret-stuecke', '/lernen/wildbret-fallwerkstatt']);
  for (const link of result.readingLinks) assert.ok(fs.existsSync(path.join(root, 'pages', `${link.href}.js`)));
  result.readingLinks[0].href = '/invented';
  assert.equal(normalizePhotoRecognitionResponse(input()).readingLinks[0].href, '/lernen/wildbret-stuecke', 'Caller mutation cannot change later classifications');
});

test('Uncertain meat and category-only outcomes still expose the proper learning articles; explicit unknown stays unknown', () => {
  for (const candidateIds of [['meat'], []]) {
    const result = normalizePhotoRecognitionResponse(input({ status: 'uncertain', candidateIds }));
    assert.equal(result.status, 'uncertain'); assert.equal(result.candidate, null);
    assert.equal(result.category.id, 'wildbret-gesundheit'); assert.equal(result.readingLinks.length, 2);
  }
  const unknown = normalizePhotoRecognitionResponse(input({ status: 'unknown' }));
  assert.equal(unknown.status, 'unknown'); assert.equal(unknown.category, null); assert.deepEqual(unknown.readingLinks, []);
  assert.equal(normalizePhotoRecognitionResponse(input({ categoryId: 'wildkunde' })).reason, 'inconsistent-category');
});

test('Alternative candidates retain a shared catalogue category without promoting an uncertain species or mixing categories', () => {
  const shared = normalizePhotoRecognitionResponse(input({ status: 'uncertain', candidateIds: ['rehwild', 'rotwild'], categoryId: null }));
  assert.equal(shared.status, 'uncertain'); assert.equal(shared.candidate, null); assert.equal(shared.comparison, null);
  assert.equal(shared.category.id, 'wildkunde'); assert.equal(shared.alternatives.length, 2); assert.deepEqual(shared.readingLinks, []);
  const mixed = normalizePhotoRecognitionResponse(input({ status: 'uncertain', candidateIds: ['meat', 'rehwild'], categoryId: null }));
  assert.equal(mixed.category, null); assert.deepEqual(mixed.readingLinks, []);
});

test('The quality request supplies meat, full-frame instructions and every prepared byte while retaining cost and transfer bounds', () => {
  const bytes = Uint8Array.from([255, 216, 7, 8, 9, 255, 217]); // Request-boundary fixture, not a decoded photograph.
  const body = buildPhotoRecognitionRequest(bytes);
  assert.equal(body.model, 'gpt-6-astra'); assert.deepEqual(body.reasoning, { effort: 'high' });
  assert.equal(body.max_output_tokens, 4096); assert.equal(body.store, false); assert.equal(body.service_tier, 'default');
  const image = body.input[0].content[1];
  assert.equal(image.detail, 'high'); assert.deepEqual(Buffer.from(image.image_url.split(',')[1], 'base64'), Buffer.from(bytes));
  assert.match(body.instructions, /gesamte Bildfläche/); assert.match(body.instructions, /verpacktes Fleisch/);
  assert.ok(body.text.format.schema.properties.candidateIds.items.enum.includes('meat'));
  assert.ok(body.text.format.schema.properties.categoryId.enum.includes('wildbret-gesundheit'));
  const withoutImage = { ...body, input: body.input.map(item => ({ ...item, content: item.content.filter(part => part.type !== 'input_image') })) };
  assert.ok(Buffer.byteLength(JSON.stringify(withoutImage), 'utf8') <= 11000, 'The existing conservative per-request prompt budget remains applicable');
});

test('Known provider capacity failures differ from temporary throttling and never retry or reveal upstream data', async () => {
  const oldWarn = console.warn; const logs = []; console.warn = (...parts) => logs.push(parts);
  try {
    for (const code of ['insufficient_quota', 'credit_balance_exhausted', 'organization_spend_limit_exceeded', 'project_spend_limit_exceeded', 'organization_usage_limit_exceeded', null, 'rate_limit_exceeded']) {
      let calls = 0;
      const capacity = code !== 'rate_limit_exceeded';
      // Known codes must work even without the insufficient_quota fallback type.
      const payload = { error: { code, type: code === null ? 'insufficient_quota' : 'rate_limit_error', message: 'private-provider-content-do-not-return' } };
      await assert.rejects(requestPhotoRecognition({ imageBytes: Uint8Array.from([255,216,255,217]) }, {
        apiKey: 'test-placeholder-no-real-api-key', fetchImpl: async () => { calls++; return Response.json(payload, { status: 429 }); },
      }), error => error.code === (capacity ? 'photo_recognition_provider_capacity' : 'photo_recognition_rate_limited') && !error.message.includes('private-provider'));
      assert.equal(calls, 1);
    }
    assert.doesNotMatch(JSON.stringify(logs), /private-provider|test-placeholder/);
  } finally { console.warn = oldWarn; }
});
