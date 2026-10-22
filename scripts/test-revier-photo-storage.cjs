const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const source = fs.readFileSync(path.join(__dirname, "../lib/revier-photo-storage.js"), "utf8");
const exportsList = [...source.matchAll(/export (?:async )?(?:function|const) (\w+)/g)].map(match => match[1]);
function load(overrides = {}) {
  const context = vm.createContext({ Blob, Uint8Array, ArrayBuffer, Date, Error, Number, String, Boolean, Math, Promise, URL, setTimeout, clearTimeout, crypto: webcrypto, ...overrides });
  const api = vm.runInContext(source.replace(/export /g, "") + `\n({${exportsList.join(",")}})`, context);
  return { api, context };
}
function jpeg(width = 1200, height = 800, metadata = false) {
  const segments = [0xff, 0xd8];
  if (metadata) segments.push(0xff, 0xe1, 0, 8, 69, 120, 105, 102, 0, 0);
  segments.push(0xff, 0xc0, 0, 11, 8, height >> 8, height & 255, width >> 8, width & 255, 1, 1, 0x11, 0, 0xff, 0xda, 0, 8, 1, 1, 0, 0, 63, 0, 0, 0xff, 0xd9);
  return new Uint8Array(segments);
}
function photo(width, height, metadata) { return new Blob([jpeg(width, height, metadata)], { type: "image/jpeg" }); }
const png = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
function u32le(value) { return [value & 255, value >>> 8 & 255, value >>> 16 & 255, value >>> 24 & 255]; }
function webp(animated = false) {
  const chunk = [...Buffer.from("VP8X"), ...u32le(10), animated ? 2 : 0, 0, 0, 0, 99, 0, 0, 79, 0, 0];
  return new Uint8Array([...Buffer.from("RIFF"), ...u32le(4 + chunk.length), ...Buffer.from("WEBP"), ...chunk]);
}
function rejectCode(code) { return error => error?.code === code; }

test("module loads without browser globals, storage writes or network", async () => {
  const { api } = load();
  await assert.rejects(api.listRevierObservations(), rejectCode("STORAGE_UNAVAILABLE"));
  await assert.rejects(api.prepareRevierPhoto(photo()), rejectCode("IMAGE_PREPARATION_UNAVAILABLE"));
  assert.match(api.getRevierPhotoErrorMessage(new Error("private filename")), /auf diesem Gerät/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|geolocation/);
});

test("file validation checks bytes, MIME agreement, bounds and decoded dimension headers", async () => {
  const { api } = load();
  const inspected = await api.validateRevierPhotoFile(photo());
  assert.equal(inspected.mimeType, "image/jpeg");
  assert.equal(inspected.width, 1200);
  assert.equal(inspected.height, 800);
  assert.equal((await api.validateRevierPhotoFile(new Blob([png], { type: "image/png" }))).width, 1);
  assert.equal((await api.validateRevierPhotoFile(new Blob([webp()], { type: "image/webp" }))).height, 80);
  assert.equal((await api.validateRevierPhotoFile(new Blob([jpeg()], { type: "" }))).mimeType, "image/jpeg");
  await assert.rejects(api.validateRevierPhotoFile(new Blob([jpeg()], { type: "image/png" })), rejectCode("INVALID_FILE"));
  await assert.rejects(api.validateRevierPhotoFile(new Blob(["<svg>"], { type: "image/jpeg" })), rejectCode("INVALID_FILE"));
  await assert.rejects(api.validateRevierPhotoFile(new Blob(["GIF89a"], { type: "image/gif" })), rejectCode("INVALID_FILE"));
  await assert.rejects(api.validateRevierPhotoFile(new Blob([])), rejectCode("INVALID_FILE"));
  await assert.rejects(api.validateRevierPhotoFile(new Blob([new Uint8Array(api.REVIER_PHOTO_MAX_INPUT_BYTES + 1)])), rejectCode("FILE_TOO_LARGE"));
  await assert.rejects(api.validateRevierPhotoFile(photo(10000, 6000)), rejectCode("IMAGE_TOO_LARGE"));
  const truncated = jpeg().slice(0, -2);
  await assert.rejects(api.validateRevierPhotoFile(new Blob([truncated], { type: "image/jpeg" })), rejectCode("INVALID_FILE"));
  await assert.rejects(api.validateRevierPhotoFile(new Blob(["0000ftypheic00000000"], { type: "" })), rejectCode("UNSUPPORTED_HEIC"));
});

test("animated and truncated WebP/PNG are rejected before image decode", async () => {
  const { api } = load();
  await assert.rejects(api.validateRevierPhotoFile(new Blob([webp(true)], { type: "image/webp" })), rejectCode("ANIMATED_FILE"));
  const badWebp = webp(); badWebp[16] = 100;
  await assert.rejects(api.validateRevierPhotoFile(new Blob([badWebp], { type: "image/webp" })), rejectCode("INVALID_FILE"));
  const apng = new Uint8Array([...png.slice(0, 33), 0, 0, 0, 0, ...Buffer.from("acTL"), 0, 0, 0, 0, ...png.slice(33)]);
  await assert.rejects(api.validateRevierPhotoFile(new Blob([apng], { type: "image/png" })), rejectCode("ANIMATED_FILE"));
  await assert.rejects(api.validateRevierPhotoFile(new Blob([png.slice(0, -12)], { type: "image/png" })), rejectCode("INVALID_FILE"));
});

test("large photo input accepts the exact 50MiB boundary and still rejects excess resolution", async () => {
  const { api } = load();
  const header = jpeg();
  const atLimit = new Blob([header.slice(0, -2), new Uint8Array(50 * 1024 * 1024 - header.length), header.slice(-2)], { type: "image/jpeg" });
  const inspected = await api.validateRevierPhotoFile(atLimit);
  assert.equal(inspected.size, 50 * 1024 * 1024);
  assert.equal(inspected.width, 1200);
  assert.equal(inspected.height, 800);
  await assert.rejects(api.validateRevierPhotoFile(photo(10000, 6000)), rejectCode("IMAGE_TOO_LARGE"));
});

test("oversized input is rejected before reading bytes or decoding an image", async () => {
  let reads = 0, decodes = 0;
  class OversizedPhoto extends Blob {
    get size() { return 50 * 1024 * 1024 + 1; }
    async arrayBuffer() { reads++; throw new Error("oversized file must never be read"); }
  }
  const { api } = load({ Image: class { constructor() { decodes++; throw new Error("must not decode"); } }, document: {} });
  await assert.rejects(api.prepareRevierPhoto(new OversizedPhoto([jpeg()], { type: "image/jpeg" })), rejectCode("FILE_TOO_LARGE"));
  assert.equal(reads, 0);
  assert.equal(decodes, 0);
});

function imageEnvironment({ decodeFails = false, contextMissing = false, encodeFails = false, width = 4000, height = 3000 } = {}) {
  const calls = { created: [], revoked: [], canvases: [], images: [], encoding: [] };
  class ImageMock {
    constructor() { this.naturalWidth = width; this.naturalHeight = height; calls.images.push(this); }
    set src(value) { this.value = value; if (value) queueMicrotask(() => decodeFails ? this.onerror?.() : this.onload?.()); }
    get src() { return this.value; }
  }
  const document = { createElement(tag) {
    assert.equal(tag, "canvas");
    const canvas = { width: 0, height: 0,
      getContext() { return contextMissing ? null : { fillRect() {}, drawImage() {} }; },
      toBlob(callback, mime, quality) { calls.encoding.push({ width: canvas.width, height: canvas.height, mime, quality }); queueMicrotask(() => callback(encodeFails ? null : photo(canvas.width, canvas.height))); },
    };
    calls.canvases.push(canvas); return canvas;
  } };
  const URLMock = { createObjectURL(blob) { assert.ok(blob instanceof Blob); const value = `blob:private-${calls.created.length}`; calls.created.push(value); return value; }, revokeObjectURL(value) { calls.revoked.push(value); } };
  return { calls, globals: { Image: ImageMock, document, URL: URLMock } };
}

test("preparation scales within1600, makes a new JPEG and releases object URLs/canvas", async () => {
  const environment = imageEnvironment();
  const { api } = load(environment.globals);
  const original = photo(4000, 3000, true);
  const prepared = await api.prepareRevierPhoto(original);
  assert.equal(prepared.width, 1600); assert.equal(prepared.height, 1200);
  assert.equal(prepared.blob.type, "image/jpeg"); assert.notEqual(prepared.blob, original);
  assert.equal(api.inspectRevierPhotoBytes(new Uint8Array(await prepared.blob.arrayBuffer())).hasMetadata, false);
  assert.deepEqual(environment.calls.revoked, environment.calls.created);
  assert.equal(environment.calls.canvases[0].width, 1);
  assert.equal(environment.calls.images[0].src, "");
  assert.equal(environment.calls.encoding[0].quality, 0.86);
});

test("preparation never enlarges small photos and cleans up failures", async () => {
  const small = imageEnvironment({ width: 600, height: 800 });
  const smallPhoto = await load(small.globals).api.prepareRevierPhoto(photo(600, 800));
  assert.equal(smallPhoto.width, 600); assert.equal(smallPhoto.height, 800);
  for (const flags of [{ decodeFails: true }, { contextMissing: true }, { encodeFails: true }]) {
    const environment = imageEnvironment(flags);
    const { api } = load(environment.globals);
    await assert.rejects(api.prepareRevierPhoto(photo()), error => /IMAGE_/.test(error.code));
    assert.deepEqual(environment.calls.revoked, environment.calls.created);
    if (environment.calls.canvases[0]) assert.equal(environment.calls.canvases[0].width, 1);
  }
});

test("observation validation checks actual dates, field bounds and schema", () => {
  const { api } = load();
  const input = api.normalizeRevierObservationInput({ note: "  Im Wald  ", candidateId: "rehwild", candidateLabel: "Rehwild", observedAt: "2024-02-29" });
  assert.equal(input.note, "Im Wald"); assert.equal(input.observedAt, "2024-02-29");
  for (const invalid of [{ observedAt: "2026-02-29" }, { observedAt: "2026-13-01" }, { observedAt: 0 }, { observedAt: "" }, { note: "x".repeat(2001) }, { candidateId: "../secret", candidateLabel: "x" }, { candidateId: "rehwild" }, { candidateLabel: "Rehwild" }, { note: {} }]) {
    assert.throws(() => api.normalizeRevierObservationInput(invalid), rejectCode("INVALID_OBSERVATION"));
  }
  const record = { version: 1, id: "abcdef1234567890", photo: photo(), createdAt: Date.now(), note: "", candidateId: "", candidateLabel: "", observedAt: "2026-10-22" };
  assert.equal(api.validateRevierObservationRecord(record), true);
  assert.equal(api.validateRevierObservationRecord({ ...record, photo: "https://example.com/private.jpg" }), false);
  assert.equal(api.validateRevierObservationRecord({ ...record, version: 2 }), false);
  assert.equal(api.validateRevierObservationRecord({ ...record, note: " bad whitespace " }), false);
});

// A small transaction model exercises completion, rollback and serialization, not just mocked success.
function indexedDatabase(initial = [], options = {}) {
  const state = { rows: new Map(initial.map(row => [row.id, row])), closes: 0, opens: 0, active: null, queued: [] };
  const makeError = name => Object.assign(new Error(name), { name });
  class Transaction {
    constructor(mode) {
      this.mode = mode; this.pending = 0; this.tasks = []; this.aborted = false;
      state.queued.push(this); queueMicrotask(() => start());
    }
    objectStore(name) {
      assert.equal(name, "observations");
      return {
        count: () => this.request(() => this.rows.size),
        getAll: (_query, count) => this.request(() => [...this.rows.values()].slice(0, count).map(row => structuredClone(row))),
        add: row => {
          if (options.syncWriteError) throw makeError("DataCloneError");
          return this.request(() => {
          if (options.quota) throw makeError("QuotaExceededError");
          if (this.rows.has(row.id)) throw makeError("ConstraintError");
          this.rows.set(row.id, structuredClone(row)); return row.id;
          });
        },
        delete: id => this.request(() => this.rows.delete(id)),
        clear: () => this.request(() => this.rows.clear()),
      };
    }
    request(action) {
      const request = {}; this.pending++;
      this.tasks.push(() => {
        if (this.aborted) return;
        try { request.result = action(); request.onsuccess?.(); }
        catch (error) { this.error = error; request.error = error; this.abort(); return; }
        this.pending--; this.flush();
      });
      this.flush(); return request;
    }
    flush() {
      if (state.active !== this || this.aborted) return;
      while (this.tasks.length) queueMicrotask(this.tasks.shift());
      if (!this.pending) queueMicrotask(() => {
        if (state.active !== this || this.pending || this.aborted) return;
        if (this.mode === "readwrite") state.rows = this.rows;
        this.oncomplete?.(); state.active = null; start();
      });
    }
    abort() {
      if (this.aborted) return; this.aborted = true;
      queueMicrotask(() => { this.onabort?.(); if (state.active === this) { state.active = null; start(); } });
    }
  }
  function start() {
    if (state.active || !state.queued.length) return;
    const transaction = state.queued.shift(); state.active = transaction;
    transaction.rows = new Map(state.rows); transaction.flush();
  }
  const indexedDB = { open() {
    state.opens++;
    if (options.security) throw makeError("SecurityError");
    const request = {};
    queueMicrotask(() => {
      if (options.openError) { request.error = makeError(options.openError); request.onerror?.(); return; }
      const database = { close() { state.closes++; }, transaction: (_store, mode) => new Transaction(mode), objectStoreNames: { contains: () => true } };
      request.result = database;
      if (options.blocked) { request.onblocked?.(); queueMicrotask(() => request.onsuccess?.()); return; }
      request.onsuccess?.();
    });
    return request;
  } };
  return { state, indexedDB };
}

test("no observation is persisted before explicit save; list, delete and clear work", async () => {
  const database = indexedDatabase(); const { api } = load({ indexedDB: database.indexedDB });
  await api.validateRevierPhotoFile(photo()); assert.equal(database.state.opens, 0);
  assert.equal((await api.listRevierObservations()).length, 0);
  const saved = await api.saveRevierObservation({ photo: photo(), note: "  Reviernotiz  ", candidateId: "rehwild", candidateLabel: "Rehwild", observedAt: "2026-10-22" });
  assert.equal(saved.note, "Reviernotiz"); assert.equal(saved.photo.type, "image/jpeg");
  assert.equal(database.state.rows.size, 1);
  const rows = await api.listRevierObservations(); assert.equal(rows[0].id, saved.id);
  await api.deleteRevierObservation(saved.id); assert.equal(database.state.rows.size, 0);
  await api.saveRevierObservation({ photo: photo() });
  await api.clearRevierObservations(); assert.equal(database.state.rows.size, 0);
  assert.equal(database.state.closes, database.state.opens);
});

test("save rejects original metadata, forged MIME, oversized dimensions and invalid notes before DB writes", async () => {
  const database = indexedDatabase(); const { api } = load({ indexedDB: database.indexedDB });
  for (const invalidPhoto of [photo(1601, 800), photo(1200, 800, true), new Blob(["svg"], { type: "image/jpeg" }), new Blob([jpeg()], { type: "image/png" })]) {
    await assert.rejects(api.saveRevierObservation({ photo: invalidPhoto }), rejectCode("INVALID_OBSERVATION"));
  }
  await assert.rejects(api.saveRevierObservation({ photo: photo(), note: "x".repeat(2001) }), rejectCode("INVALID_OBSERVATION"));
  assert.equal(database.state.opens, 0);
});

test("30record bound is atomic even with simultaneous saves; limit failure rolls back", async () => {
  const database = indexedDatabase(); const { api } = load({ indexedDB: database.indexedDB });
  const saves = await Promise.allSettled(Array.from({ length: 33 }, () => api.saveRevierObservation({ photo: photo() })));
  assert.equal(saves.filter(result => result.status === "fulfilled").length, 30);
  assert.equal(saves.filter(result => result.status === "rejected" && result.reason.code === "RECORD_LIMIT").length, 3);
  assert.equal(database.state.rows.size, 30);
  assert.equal((await api.listRevierObservations()).length, 30);
});

test("private mode, quota and blocked DB failures are actionable and do not invent success", async () => {
  for (const [options, code] of [[{ security: true }, "STORAGE_UNAVAILABLE"], [{ quota: true }, "STORAGE_FULL"], [{ blocked: true }, "STORAGE_BLOCKED"], [{ openError: "SecurityError" }, "STORAGE_UNAVAILABLE"], [{ syncWriteError: true }, "STORAGE_FAILED"]]) {
    const database = indexedDatabase([], options); const { api } = load({ indexedDB: database.indexedDB });
    await assert.rejects(api.saveRevierObservation({ photo: photo() }), rejectCode(code));
    await Promise.resolve(); assert.equal(database.state.rows.size, 0);
    if (options.blocked) assert.equal(database.state.closes, 1, "a late open success must close its unused connection");
  }
});

test("invalid or future schema storage is rejected; explicit clearing recovers", async () => {
  const invalid = { version: 2, id: "abcdef1234567890", photo: photo(), createdAt: Date.now(), note: "", candidateId: "", candidateLabel: "", observedAt: "2026-10-22" };
  const database = indexedDatabase([invalid]); const { api } = load({ indexedDB: database.indexedDB });
  await assert.rejects(api.listRevierObservations(), rejectCode("INVALID_STORED_RECORDS"));
  await api.clearRevierObservations(); assert.equal((await api.listRevierObservations()).length, 0);
  database.state.rows.set(invalid.id, { ...invalid, version: 1, photo: photo(2000, 1000) });
  await assert.rejects(api.listRevierObservations(), rejectCode("INVALID_STORED_RECORDS"));
});
