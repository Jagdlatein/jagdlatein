export const OFFLINE_DB = "jagdlatein-lernrucksack";
export const OFFLINE_CACHE = "jagdlatein-rucksack-v1";
export const OFFLINE_MAX_COURSES = 8;
// Eight legitimate existing courses can now include 33 distinct photographs.
// Keep a bounded media list; the 8 MiB pack and 64 MiB cache limits still apply.
export const OFFLINE_MAX_PHOTOS = 64;
const string = (value, limit = 30000) => typeof value === "string" && value.length > 0 && value.length <= limit;
const list = (value, max) => Array.isArray(value) && value.length <= max;
const localMedia = value => typeof value === "string" && /^\/(lernen|wildkunde)\/[a-z0-9/_.-]+\.(jpg|mp3)$/.test(value);
const source = value => value && string(value.label || value.title || "Quelle", 300) && typeof value.url === "string" && /^https:\/\//.test(value.url);
const lessonDiagram = value => value == null || value && typeof value === "object" && !Array.isArray(value)
  && string(value.title, 300) && (value.note == null || string(value.note, 2000))
  && list(value.steps, 12) && value.steps.length > 0
  && value.steps.every(step => step && string(step.title, 300) && string(step.text, 2000));
const lessonEvidence = (value, sources) => value == null || list(value, 30)
  && value.every(item => item && string(item.claim) && list(item.sources, 30) && item.sources.length > 0
    && item.sources.every(reference => reference && string(reference.label, 300) && source(reference) && Array.isArray(sources) && sources.some(original => original && original.url === reference.url)));
const record = value => value && typeof value === "object" && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const photoText = (value, limit) => string(value, limit) && Boolean(value.trim());
const photoLink = value => {
  if (!string(value, 2048) || value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value)) return false;
  try { const url = new URL(value); return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password && !url.port; }
  catch { return false; }
};
function validLessonPhotos(pack) {
  // Optional version-one extension. Existing downloaded courses have no map
  // and must neither acquire new pictures nor request files while being read.
  if (pack.lessonPhotos === undefined) return true;
  if (!record(pack.lessonPhotos) || Object.keys(pack.lessonPhotos).length > pack.courses.length) return false;
  return Object.entries(pack.lessonPhotos).every(([courseId, photoMap]) => {
    const course = pack.courses.find(item => item.id === courseId);
    if (!course || !record(photoMap) || Object.keys(photoMap).length > course.lessons.length) return false;
    return Object.entries(photoMap).every(([lessonId, photos]) => {
      const lesson = course.lessons.find(item => item.id === lessonId);
      if (!lesson || !list(photos, 2) || !photos.length || new Set(photos.map(photo => photo?.id)).size !== photos.length) return false;
      return photos.every(photo => {
        if (!record(photo) || !photoText(photo.id, 200) || !localMedia(photo.src) || !photo.src.endsWith(".jpg") || !learningImagePaths.includes(photo.src)) return false;
        const asset = pack.photos.find(item => item.src === photo.src);
        return Boolean(asset && Number.isInteger(photo.width) && photo.width > 0 && photo.width <= 20000
          && Number.isInteger(photo.height) && photo.height > 0 && photo.height <= 20000
          && photoText(photo.alt, 1000) && photoText(photo.caption, 3000) && photoText(photo.limit, 3000)
          && Number.isInteger(photo.afterParagraph) && photo.afterParagraph >= 0 && photo.afterParagraph < lesson.paragraphs.length
          && photoText(photo.author, 1000) && photoText(photo.license, 200) && photoText(photo.modifications, 3000)
          && photoLink(photo.sourceUrl) && photoLink(photo.licenseUrl)
          && photo.sourceUrl === asset.creditUrl && photo.licenseUrl === asset.licenseUrl);
      });
    });
  });
}
export function validateOfflinePack(pack, now = Date.now()) {
  if (!pack || pack.version !== 1 || !string(pack.id, 128) || !string(pack.accountKey, 128) || !Number.isFinite(pack.createdAt) || !Number.isFinite(pack.expiresAt)
    || pack.createdAt > now + 60000 || pack.expiresAt <= now || pack.expiresAt > pack.createdAt + 7 * 86400000 || !list(pack.courses, 8) || !pack.courses.length || !list(pack.photos, OFFLINE_MAX_PHOTOS) || !list(pack.sounds, learningAudioPaths.length)) return false;
  if (JSON.stringify(pack).length > 8 * 1024 * 1024 || new Set(pack.courses.map(course => course.id)).size !== pack.courses.length) return false;
  return pack.courses.every(course => course && string(course.id, 100) && string(course.title, 300) && string(course.category, 100) && string(course.description, 2000)
    && list(course.countries, 3) && course.countries.length > 0 && course.countries.every(country => ["DE", "AT", "CH"].includes(country) && string(course.countryNotes?.[country], 6000))
    && list(course.objectives, 30) && course.objectives.every(item => string(item, 2000)) && list(course.lessons, 50) && course.lessons.length > 0
    && course.lessons.every(lesson => lesson && string(lesson.id, 150) && string(lesson.title, 300) && list(lesson.paragraphs, 30) && lesson.paragraphs.every(item => string(item)) && string(lesson.takeaway) && string(lesson.exercise) && lessonDiagram(lesson.diagram) && lessonEvidence(lesson.evidence, course.sources))
    && list(course.questions, 100) && course.questions.length > 0 && course.questions.every(question => question && string(question.id, 200) && string(question.q, 3000) && string(question.explain)
      && list(question.answers, 8) && question.answers.length >= 2 && question.answers.every(answer => answer && string(answer.id, 20) && string(answer.text, 3000))
      && new Set(question.answers.map(answer => answer.id)).size === question.answers.length && list(question.correct, 8) && question.correct.length === 1 && question.correct.every(id => question.answers.some(answer => answer.id === id))
      && list(question.countries, 3) && question.countries.length > 0 && question.countries.every(country => course.countries.includes(country)))
    && list(course.sources, 30) && course.sources.every(source))
    && pack.photos.every(photo => photo && localMedia(photo.src) && photo.src.endsWith(".jpg") && (learningImagePaths.includes(photo.src) || Object.hasOwn(retiredOfflinePhotoReplacements, photo.src)) && string(photo.alt, 1000) && string(photo.credit, 3000) && (photo.creditUrl == null || /^https:\/\//.test(photo.creditUrl)))
    && validLessonPhotos(pack)
    && new Set(pack.sounds.map(sound => sound?.src)).size === pack.sounds.length
    && pack.sounds.every(sound => sound && learningAudioPaths.includes(sound.src) && string(sound.name, 200) && string(sound.author, 1000) && string(sound.license, 100) && /^https:\/\//.test(sound.sourceUrl) && string(sound.explanation));
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
export async function readOfflinePack() {
  const saved = await transaction("readonly", store => store.get("current"));
  const normalized = validateOfflinePack(saved) ? normalizeOfflinePackPhotos(saved) : { pack: null, retiredPhotoPaths: [] };
  return { ...normalized, expired: Boolean(saved && saved.expiresAt <= Date.now()) };
}
export async function readCachedRetiredPhoto(src) {
  const replacement = Object.values(retiredOfflinePhotoReplacements).find(photo => photo.src === src);
  if (!replacement || typeof caches === "undefined" || !globalThis.crypto?.subtle) return null;
  try {
    const response = await (await caches.open(OFFLINE_CACHE)).match(src);
    if (!response?.ok || !/^image\/jpeg(?:;|$)/i.test(response.headers.get("content-type") || "")) return null;
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 8 * 1024 * 1024) return null;
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(byte => byte.toString(16).padStart(2, "0")).join("");
    return digest === replacement.sha256 ? new Blob([bytes], { type: "image/jpeg" }) : null;
  } catch { return null; }
}
export async function saveOfflinePack(pack) { if (!validateOfflinePack(pack)) throw new Error("Die heruntergeladenen Lerninhalte sind ungültig oder abgelaufen."); await transaction("readwrite", store => store.put(pack, "current")); }
export async function clearOfflineLearning() {
  const failures = [];
  // Failed database cleanup must not prevent removing the independently stored media.
  try { if (typeof indexedDB !== "undefined") await transaction("readwrite", store => store.clear()); }
  catch (failure) { failures.push(failure); }
  try { if (typeof caches !== "undefined") await caches.delete(OFFLINE_CACHE); }
  catch (failure) { failures.push(failure); }
  if (failures.length) throw failures[0];
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
import { learningAudioPaths } from "./learning-audio-paths";
import { learningImagePaths } from "./learning-image-paths";
import { normalizeOfflinePackPhotos, retiredOfflinePhotoReplacements } from "./offline-photo-retirement";
