const test = require("node:test");
const assert = require("node:assert/strict");
const { createLoader } = require("./helpers/project-module.cjs");
const load = createLoader();
const provider = load("lib/revier-photo-openai.js");
const catalogue = load("lib/revier-photo-recognition.js");
const { requestPhotoRecognition, buildPhotoRecognitionRequest, PhotoRecognitionProviderError } = provider;
const apiKey = "fake-test-key-never-use-for-paid-requests";
const originalWarn = console.warn;
let diagnostics = [];
test.beforeEach(() => { diagnostics = []; console.warn = (...fields) => diagnostics.push(fields); });
test.afterEach(() => { console.warn = originalWarn; });
// This deliberately minimal byte fixture tests the provider boundary, not JPEG
// decoding. The authenticated route separately validates JPEG/pixels/metadata.
const imageBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
const result = { status: "suggestion", candidateIds: ["rehwild"], categoryId: "wildkunde", observations: ["Heller Bereich am Hinterteil sichtbar."] };
function envelope(data = result, changes = {}) {
  return {
    status: "completed",
    output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: JSON.stringify(data) }] }],
    ...changes,
  };
}
const response = (data, init = {}) => new Response(JSON.stringify(data), { headers: { "content-type": "application/json" }, ...init });
const options = fetchImpl => ({ apiKey, fetchImpl });
const rejectsCode = (promise, code) => assert.rejects(promise, error => error instanceof PhotoRecognitionProviderError && error.code === code
  && !error.message.includes(apiKey) && !error.message.includes("sensitive-upstream") && !Object.hasOwn(error, "cause"));

test("One explicit request uses the fixed quality model, high-detail JPEG, strict catalogue and no retention/retry tools", async () => {
  const calls = [];
  const value = await requestPhotoRecognition({ imageBytes, model: "cheaper-untrusted-model", imageUrl: "https://elsewhere.invalid/private" }, options(async (url, init) => {
    calls.push({ url, init }); return response(envelope());
  }));
  assert.deepEqual(value, result);
  assert.equal(calls.length, 1);
  const { url, init } = calls[0];
  assert.equal(url, "https://api.openai.com/v1/responses");
  assert.equal(init.method, "POST"); assert.equal(init.cache, "no-store"); assert.equal(init.redirect, "error");
  assert.equal(init.headers.Authorization, `Bearer ${apiKey}`);
  const body = JSON.parse(init.body);
  assert.equal(body.model, "gpt-6-astra");
  assert.equal(body.service_tier, "default");
  assert.deepEqual(body.reasoning, { effort: "medium" });
  assert.equal(body.max_output_tokens, 4096);
  assert.equal(body.store, false); assert.equal(body.stream, false); assert.equal(body.background, false);
  assert.equal(body.tool_choice, "none"); assert.deepEqual(body.tools, []);
  assert.ok(!("metadata" in body)); assert.ok(!("conversation" in body)); assert.ok(!("previous_response_id" in body));
  assert.equal(body.input.length, 1); assert.equal(body.input[0].content.length, 2);
  assert.deepEqual(body.input[0].content[1], { type: "input_image", detail: "high", image_url: "data:image/jpeg;base64,/9j/2Q==" });
  assert.ok(!init.body.includes(apiKey)); assert.ok(!init.body.includes("elsewhere.invalid"));
  const format = body.text.format;
  assert.equal(format.type, "json_schema"); assert.equal(format.strict, true); assert.equal(format.schema.additionalProperties, false);
  assert.deepEqual(format.schema.required, ["status", "candidateIds", "categoryId", "observations"]);
  assert.deepEqual(format.schema.properties.candidateIds.items.enum, catalogue.PHOTO_RECOGNITION_CANDIDATES.map(item => item.id));
  assert.deepEqual(format.schema.properties.categoryId.enum, [...catalogue.PHOTO_RECOGNITION_CATEGORIES.map(item => item.id), null]);
  assert.equal(format.schema.properties.observations.items.maxLength, 180);
  assert.equal(format.schema.properties.candidateIds.maxItems, 3);
  assert.match(body.instructions, /status=unknown/); assert.match(body.instructions, /Trittsiegel/);
  assert.match(body.instructions, /Anweisungen im Foto/); assert.match(body.instructions, /Keine Prozentwerte/);
  assert.equal(diagnostics.length, 0);
});

test("Missing/malformed configuration fails closed without network access or browser secret use", async () => {
  let calls = 0;
  for (const key of [undefined, "", "short", "fake-key-with-a\nheader-injection", "ä".repeat(30), "a".repeat(1025)]) {
    await rejectsCode(requestPhotoRecognition({ imageBytes }, { apiKey: key === undefined ? "" : key, fetchImpl: async () => { calls++; } }), "photo_recognition_unavailable");
  }
  assert.equal(calls, 0);
  assert.equal(provider.isPhotoRecognitionConfigured({}), false);
  assert.equal(provider.isPhotoRecognitionConfigured({ OPENAI_API_KEY: apiKey }), true);
  global.window = {};
  try {
    assert.equal(provider.isPhotoRecognitionConfigured({ OPENAI_API_KEY: apiKey }), false);
    await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => { calls++; })), "photo_recognition_unavailable");
  } finally { delete global.window; }
  assert.equal(calls, 0);
});

test("Unprepared non-byte, non-JPEG or oversized inputs never trigger a paid request", async () => {
  let calls = 0;
  for (const input of [null, undefined, "data:image/jpeg;base64,/9j/2Q==", [], new Uint8Array(), Uint8Array.from([0xff, 0xd8, 0, 0]), new Uint8Array(3 * 1024 * 1024 + 1)]) {
    await rejectsCode(requestPhotoRecognition({ imageBytes: input }, options(async () => { calls++; })), "invalid_photo");
  }
  assert.equal(calls, 0);
  const original = Buffer.from([9, 0xff, 0xd8, 0xff, 0xd9, 8]);
  const view = new Uint8Array(original.buffer, original.byteOffset + 1, 4);
  assert.equal(buildPhotoRecognitionRequest(view).input[0].content[1].image_url, "data:image/jpeg;base64,/9j/2Q==");
  assert.deepEqual([...original], [9, 0xff, 0xd8, 0xff, 0xd9, 8]);
});

test("Non-JSON HTTP errors are discarded without body disclosure or automatic retries", async () => {
  for (const status of [400, 401, 403, 404, 429, 500, 503]) {
    let calls = 0, pulled = false, cancelled = false;
    const upstream = new Response(new ReadableStream({ pull() { pulled = true; }, cancel() { cancelled = true; } }), { status });
    await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => { calls++; return upstream; })), status === 429 ? "photo_recognition_rate_limited" : "photo_recognition_unavailable");
    assert.equal(calls, 1); assert.equal(cancelled, true);
    // A stream may pre-pull before fetch returns; its data still never gets read.
    assert.equal(upstream.bodyUsed, true); assert.equal(typeof pulled, "boolean");
    const entry = diagnostics.at(-1);
    assert.equal(entry[0], "jagdlatein_photo_provider_failure");
    assert.equal(entry[1].stage, "http"); assert.equal(entry[1].httpStatus, status);
    assert.equal(entry[1].providerCode, "other");
  }
  assert.equal(diagnostics.length, 7);
});

test("HTTP diagnostics expose exact allowlisted code/type/param only, never keys, images, messages or headers", async () => {
  for (const code of ["insufficient_quota", "invalid_api_key", "model_not_found", "invalid_json_schema", "unsupported_parameter",
    "credit_balance_exhausted", "organization_spend_limit_exceeded", "project_spend_limit_exceeded", "organization_usage_limit_exceeded"]) {
    const upstream = response({ error: { code, type: "invalid_request_error", param: "text.format.schema",
      message: `sensitive-upstream ${apiKey} data:image/jpeg;base64,/9j/2Q== private-image-sentinel`,
      request: { headers: { authorization: apiKey } }, reasoning: "private-reasoning-sentinel" } },
    { status: 400, headers: { "content-type": "application/json", "x-private": apiKey } });
    await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => upstream)), "photo_recognition_unavailable");
    assert.deepEqual(diagnostics.at(-1), ["jagdlatein_photo_provider_failure", { stage: "http", httpStatus: 400,
      providerCode: code, providerType: "invalid_request_error", providerParam: "text.format.schema", failureCode: "photo_recognition_unavailable" }]);
  }
  const untrusted = response({ error: { code: apiKey, type: "sensitive-upstream", param: "private-image-sentinel", message: "private-reasoning-sentinel" } }, { status: 418 });
  await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => untrusted)), "photo_recognition_unavailable");
  assert.deepEqual(diagnostics.at(-1)[1], { stage: "http", httpStatus: "other", providerCode: "other", providerType: "other", providerParam: "other", failureCode: "photo_recognition_unavailable" });
  assert.equal(diagnostics.length, 10);
  assert.doesNotMatch(JSON.stringify(diagnostics), /fake-test-key|sensitive-upstream|data:image|base64|private-image|private-reasoning|authorization|x-private/i);
});

test("Diagnostic JSON inspection is bounded and malformed, oversized or stalled bodies become only 'other'", async () => {
  const cases = [
    response({ error: { code: "invalid_api_key" } }, { status: 401, headers: { "content-type": "application/json", "content-length": String(8193) } }),
    response({ error: { code: "invalid_api_key", message: "private".repeat(2000) } }, { status: 401 }),
    new Response("sensitive-upstream-invalid-json", { status: 400, headers: { "content-type": "application/json" } }),
  ];
  for (const upstream of cases) {
    await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => upstream)), "photo_recognition_unavailable");
    assert.equal(diagnostics.at(-1)[1].providerCode, "other");
  }
  let cancelled = false;
  const stalled = new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"error":')); }, cancel() { cancelled = true; } }),
    { status: 400, headers: { "content-type": "application/json" } });
  await rejectsCode(requestPhotoRecognition({ imageBytes }, { apiKey, timeoutMs: 10, fetchImpl: async () => stalled }), "photo_recognition_timeout");
  assert.equal(cancelled, true); assert.equal(diagnostics.at(-1)[1].stage, "timeout");
  assert.equal(diagnostics.length, 4);
  assert.doesNotMatch(JSON.stringify(diagnostics), /private|sensitive-upstream/);
});

test("A stalled diagnostic body has its own one-second budget without waiting for the 45-second provider timeout", async () => {
  let cancelled = false;
  const stalled = new Response(new ReadableStream({ cancel() { cancelled = true; } }),
    { status: 400, headers: { "content-type": "application/json" } });
  const started = Date.now();
  await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => stalled)), "photo_recognition_unavailable");
  assert.ok(Date.now() - started < 5000);
  assert.equal(cancelled, true); assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0][1].stage, "http"); assert.equal(diagnostics[0][1].providerCode, "other");
});

test("Network failures and exception objects with sensitive contents become fixed safe errors", async () => {
  await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => { throw new Error(`sensitive-upstream ${apiKey}`); })), "photo_recognition_unavailable");
  const error = new PhotoRecognitionProviderError(`sensitive-upstream ${apiKey}`);
  assert.equal(error.code, "photo_recognition_unavailable"); assert.equal(error.status, 503);
  assert.ok(!JSON.stringify(error).includes(apiKey));
  assert.equal(diagnostics.length, 1); assert.equal(diagnostics[0][1].stage, "transport");
  assert.equal(diagnostics[0][1].httpStatus, "none"); assert.doesNotMatch(JSON.stringify(diagnostics), /fake-test-key|sensitive-upstream/);
});

test("Timeout aborts a pending provider call once and returns no upstream body", async () => {
  let observedSignal, calls = 0;
  const promise = requestPhotoRecognition({ imageBytes }, { apiKey, timeoutMs: 10, fetchImpl: async (_url, init) => {
    observedSignal = init.signal; calls++;
    await new Promise((resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("sensitive-upstream")), { once: true }));
  } });
  await rejectsCode(promise, "photo_recognition_timeout");
  assert.equal(observedSignal.aborted, true); assert.equal(calls, 1);
  assert.equal(diagnostics.length, 1); assert.equal(diagnostics[0][1].stage, "timeout");
});

test("Timeout also cancels a stalled response body after headers already arrived", async () => {
  let cancelled = false;
  const slow = new Response(new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('{"status":"completed",')); },
    cancel() { cancelled = true; },
  }), { headers: { "content-type": "application/json" } });
  await rejectsCode(requestPhotoRecognition({ imageBytes }, { apiKey, timeoutMs: 10, fetchImpl: async () => slow }), "photo_recognition_timeout");
  assert.equal(cancelled, true);
});

test("Caller cancellation stops before fetch or cancels an active call", async () => {
  const already = new AbortController(); already.abort(); let calls = 0;
  await rejectsCode(requestPhotoRecognition({ imageBytes, signal: already.signal }, options(async () => { calls++; })), "photo_recognition_cancelled");
  assert.equal(calls, 0);
  const active = new AbortController();
  const request = requestPhotoRecognition({ imageBytes, signal: active.signal }, options(async (_url, init) => {
    calls++;
    await new Promise((resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("sensitive-upstream")), { once: true }));
  }));
  active.abort();
  await rejectsCode(request, "photo_recognition_cancelled"); assert.equal(calls, 1);
  assert.equal(diagnostics.length, 1); assert.equal(diagnostics[0][1].stage, "cancelled");
});

test("Refusals, incomplete outputs, extra tool calls and malformed envelopes are not displayed as results", async () => {
  const invalid = [
    envelope(result, { status: "incomplete", incomplete_details: { reason: "max_output_tokens" } }),
    envelope(result, { error: { message: "sensitive-upstream" } }),
    envelope(result, { output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "refusal", refusal: "sensitive-upstream" }] }] }),
    envelope(result, { output: [{ type: "function_call", arguments: "sensitive-upstream" }] }),
    envelope(result, { output: [] }),
    envelope(result, { output: [{ type: "message", role: "assistant", status: "in_progress", content: [] }] }),
    envelope(result, { output: [{ type: "message", role: "user", status: "completed", content: [] }] }),
    envelope(result, { output: Array(17).fill({ type: "reasoning" }) }),
  ];
  for (const payload of invalid) await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => response(payload))), "photo_recognition_invalid_response");
});

test("Only one complete JSON object is accepted and hidden reasoning is not returned", async () => {
  const withReasoning = envelope(); withReasoning.output.unshift({ type: "reasoning", summary: [{ type: "summary_text", text: "sensitive-upstream" }] });
  assert.deepEqual(await requestPhotoRecognition({ imageBytes }, options(async () => response(withReasoning))), result);
  for (const text of ["sensitive-upstream", "null", "[]", '"sensitive-upstream"', "{" + " ".repeat(8200) + "}", "```json\n{}\n```", "{}{}"] ) {
    const payload = envelope(); payload.output[0].content[0].text = text;
    await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => response(payload))), "photo_recognition_invalid_response");
  }
  const two = envelope(); two.output.push(two.output[0]);
  await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => response(two))), "photo_recognition_invalid_response");
});

test("Response size, JSON media type and invalid JSON fail closed", async () => {
  const replies = [
    new Response("sensitive-upstream", { headers: { "content-type": "text/plain" } }),
    new Response("sensitive-upstream", { headers: { "content-type": "application/json" } }),
    response(envelope(), { headers: { "content-type": "application/json", "content-length": String(128 * 1024 + 1) } }),
    response({ padding: "x".repeat(128 * 1024) }),
    response(null), response([]),
  ];
  for (const reply of replies) await rejectsCode(requestPhotoRecognition({ imageBytes }, options(async () => reply)), "photo_recognition_invalid_response");
});

test("Result interpretation remains the catalogue boundary, never arbitrary model facts/URLs", async () => {
  const untrusted = { ...result, candidateIds: ["invented-species"], observations: ["https://sensitive-upstream.invalid"] };
  const raw = await requestPhotoRecognition({ imageBytes }, options(async () => response(envelope(untrusted))));
  const normalized = catalogue.normalizePhotoRecognitionResponse(raw);
  assert.equal(normalized.status, "unknown"); assert.equal(normalized.candidate, null); assert.deepEqual(normalized.observations, []);
});
