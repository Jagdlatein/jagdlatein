// State/privacy integration checks. Biological claims are audited separately.
const test = require("node:test");
const assert = require("node:assert/strict");
const { createLoader, local } = require("./helpers/project-module.cjs");
const React = local("react");
const { renderToStaticMarkup } = local("react-dom/server");

function words(node) {
  if (node == null || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(words).join(" ");
  return typeof node === "object" ? words(node.props?.children) : String(node);
}
function all(node, predicate, found = []) {
  if (Array.isArray(node)) { node.forEach(item => all(item, predicate, found)); return found; }
  if (!node || typeof node !== "object") return found;
  if (predicate(node)) found.push(node);
  all(node.props?.children, predicate, found); return found;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function engine() {
  const slots = []; let cursor = 0, effects = [], mounted = true, lateWrites = 0;
  const hooks = { ...React,
    useState(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: typeof initial === "function" ? initial() : initial }; return [slots[i].value, next => { if (!mounted) { lateWrites++; return; } slots[i].value = typeof next === "function" ? next(slots[i].value) : next; }]; },
    useRef(initial) { const i = cursor++; if (!slots[i]) slots[i] = { value: { current: initial } }; return slots[i].value; },
    useMemo(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, index) => !Object.is(value, old.deps[index]))) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, index) => !Object.is(value, old.deps[index]))) { slots[i] = { deps, cleanup: old?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
  };
  return { hooks, render(fn) { cursor = 0; return fn(); }, flush() { const pending = effects; effects = []; pending.forEach(fn => fn()); }, unmount() { if (!mounted) return; mounted = false; effects = []; slots.forEach(slot => slot?.cleanup?.()); }, get lateWrites() { return lateWrites; } };
}
const prepared = label => ({ blob: new Blob([label], { type: "image/jpeg" }), width: 100, height: 80, size: label.length, mimeType: "image/jpeg" });
const record = (id = "record-1234567890") => ({ id, version: 1, photo: prepared(id).blob, note: "Private Notiz", candidateId: "", candidateLabel: "", observedAt: "2026-10-22", createdAt: 1792677600000 });

function setup(options = {}) {
  const e = engine(), calls = { prepare: [], save: [], list: 0, delete: [], clear: 0, created: [], revoked: [] };
  const names = ["window", "navigator", "URL", "fetch"];
  const originals = Object.fromEntries(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: { jagdlateinPhotoCapture: options.captureFlag }, writable: true });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent: options.userAgent || "Mozilla/5.0 Android Chrome/140", platform: options.platform || "Linux", maxTouchPoints: options.maxTouchPoints || 1 }, writable: true });
  Object.defineProperty(globalThis, "URL", { configurable: true, value: { createObjectURL(blob) { calls.created.push(blob); return `blob:private-${calls.created.length}`; }, revokeObjectURL(url) { calls.revoked.push(url); } }, writable: true });
  Object.defineProperty(globalThis, "fetch", { configurable: true, value() { throw new Error("Photo helper must not upload or fetch photos"); }, writable: true });
  const storage = {
    async prepareRevierPhoto(file) { calls.prepare.push(file); return options.prepare ? options.prepare(file) : prepared(file.name || "photo"); },
    async saveRevierObservation(input) { calls.save.push(input); return options.save ? options.save(input) : record(); },
    async listRevierObservations() { calls.list++; return options.list ? options.list(calls.list) : []; },
    async deleteRevierObservation(id) { calls.delete.push(id); if (options.delete) return options.delete(id); },
    async clearRevierObservations() { calls.clear++; if (options.clear) return options.clear(); },
    getRevierPhotoErrorMessage(error) { return `Speicherfehler: ${error.code || "unbekannt"}`; },
  };
  const Component = createLoader({ react: e.hooks, "next/link": ({ children, ...props }) => React.createElement("a", props, children), "./LearningToolLayout": ({ children }) => children, "./AppIcon": () => null, "../lib/revier-photo-storage": storage })("components/RevierPhotoHelper.js").default;
  let tree;
  const h = {
    e, calls, render() { tree = e.render(() => Component()); return tree; },
    flush() { this.render(); e.flush(); this.render(); e.flush(); this.render(); },
    get tree() { return tree; }, get text() { return words(tree); },
    nodes(predicate) { return all(tree, predicate); },
    node(predicate) { const node = all(tree, predicate)[0]; assert.ok(node, "Expected rendered control"); return node; },
    byId(id) { return this.node(node => node.props?.id === id); },
    button(label) { return this.node(node => node.type === "button" && words(node).trim() === label); },
    change(id, value) { this.byId(id).props.onChange({ target: { value } }); this.flush(); },
    async photo(name = "photo") { const pending = this.select(name); await pending; this.flush(); },
    select(name = "photo") { const input = this.node(node => node.type === "input" && node.props.type === "file"); const target = { files: [{ name }], value: "selected-file" }; const pending = input.props.onChange({ target }); assert.equal(target.value, "", "same-file reselection remains possible"); this.render(); return pending; },
    submit() { const form = this.node(node => node.type === "form"); const pending = form.props.onSubmit({ preventDefault() {} }); this.render(); return pending; },
    openJournal() { const details = this.node(node => node.type === "details" && node.props.className === "journal"); details.props.onToggle({ currentTarget: { open: true } }); this.render(); },
    notice() { return this.nodes(node => node.type === "p" && node.props.className === "notice").map(words).join(" "); },
    cleanup() { e.unmount(); for (const name of names) { if (originals[name]) Object.defineProperty(globalThis, name, originals[name]); else delete globalThis[name]; } },
  };
  h.render(); h.flush(); return h;
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test("empty photo SSR renders without browser APIs, an image or a persistence call", () => {
  const Component = createLoader({
    "next/link": ({ children, ...props }) => React.createElement("a", props, children),
    "./LearningToolLayout": ({ children }) => children,
    "./AppIcon": () => null,
    "../lib/revier-photo-storage": new Proxy({}, { get: () => () => { throw new Error("SSR must not read or store photos"); } }),
  })("components/RevierPhotoHelper.js").default;
  const html = renderToStaticMarkup(React.createElement(Component));
  assert.match(html, /Dein Revierfoto/);
  assert.match(html, /Merkmale selbst vergleichen/);
  assert.doesNotMatch(html, /<img |blob:|Beobachtung speichern<\/button>/);
});

test("opening, selecting and comparing never persist or upload a photo", async () => {
  const h = setup();
  try {
    assert.match(h.text, /Bildvorschläge können falsch sein/);
    assert.equal(h.calls.list, 0); assert.equal(h.calls.save.length, 0);
    await h.photo();
    assert.equal(h.calls.save.length, 0);
    assert.match(h.text, /Nur wenn du auf/);
    assert.match(h.text, /Andere Personen mit demselben Browserprofil/);
    assert.match(h.text, /ohne Kontosynchronisierung/);
    assert.ok(h.node(node => node.type === "img").props.src.startsWith("blob:"));
    h.change("photo-helper-group", "cervids");
    h.node(node => node.type === "input" && node.props.type === "checkbox").props.onChange(); h.flush();
    assert.equal(h.calls.save.length, 0);
  } finally { h.cleanup(); }
});

test("a late old selection cannot replace the current photo or its notice; URLs are revoked", async () => {
  const first = deferred(), second = deferred();
  const h = setup({ prepare: file => file.name === "first" ? first.promise : second.promise });
  try {
    const old = h.select("first"), current = h.select("second");
    second.resolve(prepared("second")); await current; h.flush();
    assert.equal(h.calls.created.at(-1), (await second.promise).blob);
    first.reject(Object.assign(new Error("old selection"), { code: "INVALID_FILE" })); await old; h.flush();
    assert.doesNotMatch(h.text, /Speicherfehler/);
    assert.equal(h.calls.created.length, 1);
    h.button("Foto entfernen").props.onClick(); h.flush();
    assert.equal(h.nodes(node => node.type === "img").length, 0);
    assert.equal(h.calls.revoked.length, 1);
  } finally { h.cleanup(); }
});

test("a late successful selection also cannot replace a newer prepared photo", async () => {
  const first = deferred(), second = deferred();
  const h = setup({ prepare: file => file.name === "first" ? first.promise : second.promise });
  try {
    const old = h.select("first"), current = h.select("second");
    const secondPhoto = prepared("second"); second.resolve(secondPhoto); await current; h.flush();
    first.resolve(prepared("old")); await old; h.flush();
    assert.equal(h.calls.created.length, 1);
    assert.equal(h.calls.created[0], secondPhoto.blob);
    await h.submit(); h.flush();
    assert.equal(h.calls.save[0].photo, secondPhoto.blob);
  } finally { h.cleanup(); }
});

test("prepared photos, saves and journal reads resolving after unmount do not update UI", async () => {
  for (const mode of ["prepare", "save", "list", "delete"]) {
    const pending = deferred();
    const h = setup({ ...(mode === "delete" ? { list: async () => [record()] } : {}), [mode]: () => pending.promise });
    try {
      let job;
      if (mode === "prepare") job = h.select();
      else if (mode === "save") { await h.photo(); job = h.submit(); }
      else if (mode === "delete") {
        h.openJournal(); await settle(); h.flush();
        h.button("Eintrag entfernen").props.onClick(); h.flush();
        job = h.button("Endgültig entfernen").props.onClick();
      }
      else h.openJournal();
      h.e.unmount();
      pending.resolve(mode === "prepare" ? prepared("late") : mode === "list" ? [record()] : record());
      await job; await settle();
      assert.equal(h.e.lateWrites, 0, mode);
    } finally { h.cleanup(); }
  }
});

test("explicit save normalizes Unbestimmt to empty candidate fields and guards double submit", async () => {
  const pending = deferred(); const h = setup({ save: () => pending.promise });
  try {
    await h.photo(); h.change("photo-observed-note", "Eine eigene Beobachtung");
    const form = h.node(node => node.type === "form"), event = { preventDefault() {} };
    const first = form.props.onSubmit(event), second = form.props.onSubmit(event); h.render();
    assert.equal(h.calls.save.length, 1);
    assert.equal(h.calls.save[0].candidateId, ""); assert.equal(h.calls.save[0].candidateLabel, "");
    assert.equal(h.calls.save[0].note, "Eine eigene Beobachtung");
    assert.ok(h.calls.save[0].photo instanceof Blob);
    assert.match(h.calls.save[0].observedAt, /^\d{4}-\d{2}-\d{2}$/);
    pending.resolve(record()); await Promise.all([first, second]); h.flush();
    assert.match(h.notice(), /auf diesem Gerät gespeichert/);
  } finally { h.cleanup(); }
});

test("changing a group drops old traits and the prior species selection", async () => {
  const h = setup();
  try {
    await h.photo(); h.change("photo-helper-group", "cervids");
    h.node(node => node.type === "input" && node.props.type === "checkbox").props.onChange(); h.flush();
    const candidates = h.nodes(node => node.type === "select" && node.props.id === "photo-observed-candidate")[0];
    const choice = all(candidates, node => node.type === "option" && node.props.value)[0];
    assert.ok(choice); h.change("photo-observed-candidate", choice.props.value);
    h.change("photo-helper-group", "mountain");
    assert.equal(h.byId("photo-observed-candidate").props.value, "");
    assert.equal(h.nodes(node => node.type === "input" && node.props.type === "checkbox" && node.props.checked).length, 0);
    await h.submit(); h.flush();
    assert.equal(h.calls.save[0].candidateId, ""); assert.equal(h.calls.save[0].candidateLabel, "");
  } finally { h.cleanup(); }
});

test("storage read and save errors stay visible and never announce saved or empty success", async () => {
  const h = setup({ list: async () => { throw { code: "STORAGE_UNAVAILABLE" }; }, save: async () => { throw { code: "STORAGE_FULL" }; } });
  try {
    h.openJournal(); await settle(); h.flush();
    assert.match(h.text, /Speicherfehler: STORAGE_UNAVAILABLE/);
    assert.doesNotMatch(h.text, /Noch keine Beobachtung gespeichert/);
    await h.photo(); await h.submit(); h.flush();
    assert.match(h.text, /Speicherfehler: STORAGE_FULL/);
    assert.doesNotMatch(h.notice(), /Beobachtung auf diesem Gerät gespeichert/);
  } finally { h.cleanup(); }
});

test("deletion failure keeps the confirmation and record; double click deletes only once", async () => {
  const pending = deferred(); const h = setup({ list: async () => [record()], delete: () => pending.promise });
  try {
    h.openJournal(); await settle(); h.flush();
    h.button("Eintrag entfernen").props.onClick(); h.flush();
    const confirm = h.button("Endgültig entfernen");
    const first = confirm.props.onClick(), second = confirm.props.onClick(); h.render();
    assert.equal(h.calls.delete.length, 1);
    pending.reject({ code: "STORAGE_FAILED" }); await Promise.all([first, second]); h.flush();
    assert.match(h.text, /Speicherfehler: STORAGE_FAILED/);
    assert.ok(h.button("Endgültig entfernen"));
    assert.match(h.text, /Private Notiz/);
    assert.doesNotMatch(h.notice(), /Beobachtung entfernt/);
  } finally { h.cleanup(); }
});

test("old native iOS hides unsafe upload controls; Safari and capture-capable native apps enable them", () => {
  const old = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
  const cases = [
    [{ userAgent: old }, 0],
    [{ userAgent: old, captureFlag: true }, 2],
    [{ userAgent: old + " Version/18.0 Safari/604.1" }, 2],
    [{ userAgent: "Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15", platform: "MacIntel", maxTouchPoints: 5 }, 0],
    [{}, 2],
  ];
  for (const [options, expected] of cases) {
    const h = setup(options);
    try {
      assert.equal(h.nodes(node => node.type === "input" && node.props.type === "file").length, expected, JSON.stringify(options));
      if (!expected) { assert.match(h.text, /in Safari öffnen/); assert.ok(h.byId("photo-helper-group")); }
    } finally { h.cleanup(); }
  }
});
