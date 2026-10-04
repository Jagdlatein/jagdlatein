export const OFFLINE_DB = "jagdlatein-lernrucksack";
export const OFFLINE_CACHE = "jagdlatein-rucksack-v1";
export const OFFLINE_MAX_COURSES = 8;
const string = (value, limit = 30000) => typeof value === "string" && value.length > 0 && value.length <= limit;
const list = (value, max) => Array.isArray(value) && value.length <= max;
const localMedia = value => typeof value === "string" && /^\/(lernen|wildkunde)\/[a-z0-9/_.-]+\.(jpg|mp3)$/.test(value);
const source = value => value && string(value.label || value.title || "Quelle", 300) && typeof value.url === "string" && /^https:\/\//.test(value.url);
export function validateOfflinePack(pack, now = Date.now()) {
  if (!pack || pack.version !== 1 || !string(pack.id, 128) || !string(pack.accountKey, 128) || !Number.isFinite(pack.createdAt) || !Number.isFinite(pack.expiresAt)
    || pack.createdAt > now + 60000 || pack.expiresAt <= now || pack.expiresAt > pack.createdAt + 7 * 86400000 || !list(pack.courses, 8) || !pack.courses.length || !list(pack.photos, 32) || !list(pack.sounds, 8)) return false;
  if (JSON.stringify(pack).length > 8 * 1024 * 1024 || new Set(pack.courses.map(course => course.id)).size !== pack.courses.length) return false;
  return pack.courses.every(course => course && string(course.id, 100) && string(course.title, 300) && string(course.category, 100) && string(course.description, 2000)
    && list(course.countries, 3) && course.countries.length > 0 && course.countries.every(country => ["DE", "AT", "CH"].includes(country) && string(course.countryNotes?.[country], 6000))
    && list(course.objectives, 30) && course.objectives.every(item => string(item, 2000)) && list(course.lessons, 50) && course.lessons.length > 0
    && course.lessons.every(lesson => lesson && string(lesson.id, 150) && string(lesson.title, 300) && list(lesson.paragraphs, 30) && lesson.paragraphs.every(item => string(item)) && string(lesson.takeaway) && string(lesson.exercise))
    && list(course.questions, 100) && course.questions.length > 0 && course.questions.every(question => question && string(question.id, 200) && string(question.q, 3000) && string(question.explain)
      && list(question.answers, 8) && question.answers.length >= 2 && question.answers.every(answer => answer && string(answer.id, 20) && string(answer.text, 3000))
      && new Set(question.answers.map(answer => answer.id)).size === question.answers.length && list(question.correct, 8) && question.correct.length === 1 && question.correct.every(id => question.answers.some(answer => answer.id === id))
      && list(question.countries, 3) && question.countries.length > 0 && question.countries.every(country => course.countries.includes(country)))
    && list(course.sources, 30) && course.sources.every(source))
    && pack.photos.every(photo => photo && localMedia(photo.src) && photo.src.endsWith(".jpg") && string(photo.alt, 1000) && string(photo.credit, 3000) && (photo.creditUrl == null || /^https:\/\//.test(photo.creditUrl)))
    && pack.sounds.every(sound => sound && localMedia(sound.src) && sound.src.endsWith(".mp3") && string(sound.name, 200) && string(sound.author, 1000) && string(sound.license, 100) && /^https:\/\//.test(sound.sourceUrl) && string(sound.explanation));
}
function openStore() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("Dieser Browser unterstützt keinen lokalen Lernspeicher.")); return; }
    const request = indexedDB.open(OFFLINE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("packs");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Der lokale Lernspeicher konnte nicht geöffnet werden."));
    request.onblocked = () => reject(new Error("Bitte andere geöffnete Jagdlatein-Fenster schließen und erneut versuchen."));
  });
}
async function transaction(mode, action) {
  const database = await openStore();
  try { return await new Promise((resolve, reject) => {
    const tx = database.transaction("packs", mode); const request = action(tx.objectStore("packs")); let result;
    if (request) request.onsuccess = () => { result = request.result; };
    tx.oncomplete = () => resolve(result); tx.onerror = tx.onabort = () => reject(new Error("Der Lernrucksack konnte nicht gespeichert werden. Prüfe den freien Gerätespeicher."));
  }); } finally { database.close(); }
}
export async function readOfflinePack() { const pack = await transaction("readonly", store => store.get("current")); return { pack: validateOfflinePack(pack) ? pack : null, expired: Boolean(pack && pack.expiresAt <= Date.now()) }; }
export async function saveOfflinePack(pack) { if (!validateOfflinePack(pack)) throw new Error("Die heruntergeladenen Lerninhalte sind ungültig oder abgelaufen."); await transaction("readwrite", store => store.put(pack, "current")); }
export async function clearOfflineLearning() {
  if (typeof indexedDB !== "undefined") await transaction("readwrite", store => store.clear());
  if (typeof caches !== "undefined") await caches.delete(OFFLINE_CACHE);
}
export async function prepareOfflineCache(media) {
  if (!("serviceWorker" in navigator)) throw new Error("Offline-Lernen wird von diesem Browser nicht unterstützt. Öffne die App in einem aktuellen Browser.");
  const registration = await navigator.serviceWorker.register("/lernen/offline-sw.js", { scope: "/lernen/" });
  const worker = registration.active || registration.waiting || registration.installing;
  if (!worker) throw new Error("Offline-Modus konnte nicht vorbereitet werden.");
  if (worker.state !== "activated") await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { worker.removeEventListener("statechange", changed); reject(new Error("Offline-Modus startet zu langsam. Bitte erneut versuchen.")); }, 20000);
    function changed() { if (worker.state === "activated") { clearTimeout(timeout); worker.removeEventListener("statechange", changed); resolve(); } }
    worker.addEventListener("statechange", changed); changed();
  });
  const assets = [...new Set([...Array.from(document.querySelectorAll('script[src],link[rel="stylesheet"][href]')).map(element => new URL(element.src || element.href, location.href)).filter(url => url.origin === location.origin && url.pathname.startsWith("/_next/static/")).map(url => url.pathname), ...media])];
  await new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => { channel.port1.close(); reject(new Error("Der Download dauert zu lange. Bitte die Verbindung prüfen und erneut versuchen.")); }, 90000);
    channel.port1.onmessage = event => { clearTimeout(timeout); channel.port1.close(); event.data?.ok ? resolve() : reject(new Error(event.data?.message || "Offline-Dateien konnten nicht gespeichert werden.")); };
    worker.postMessage({ type: "PREPARE", assets }, [channel.port2]);
  });
}
