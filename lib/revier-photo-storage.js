// Photos stay in this browser. Nothing in this module sends data or saves a selection automatically.
export const REVIER_PHOTO_MAX_INPUT_BYTES = 50 * 1024 * 1024;
export const REVIER_PHOTO_MAX_SAVED_BYTES = 3 * 1024 * 1024;
export const REVIER_PHOTO_MAX_EDGE = 1600;
export const REVIER_PHOTO_MAX_PIXELS = 50 * 1000 * 1000;
export const REVIER_OBSERVATION_MAX_RECORDS = 30;
export const REVIER_OBSERVATION_MAX_NOTE = 2000;
export const REVIER_PHOTO_DATABASE = "jagdlatein-revierfotos";
const STORE = "observations";
const SCHEMA_VERSION = 1;
const messages = {
  INVALID_FILE: "Bitte wähle ein Foto als JPEG, PNG oder WebP aus.",
  FILE_TOO_LARGE: "Das Foto ist zu groß. Bitte wähle eine Datei mit höchstens 50 MB aus.",
  UNSUPPORTED_HEIC: "Dieses HEIC-/HEIF-Foto kann hier nicht geöffnet werden. Bitte exportiere es als JPEG oder wähle ein JPEG-, PNG- oder WebP-Foto.",
  ANIMATED_FILE: "Bitte verwende ein einzelnes Foto. Bewegte PNG- und WebP-Dateien werden nicht unterstützt.",
  IMAGE_TOO_LARGE: "Die Bildauflösung ist zu groß. Bitte verkleinere das Foto auf höchstens 50 Megapixel.",
  IMAGE_UNREADABLE: "Das Foto konnte nicht geöffnet werden. Bitte versuche eine andere JPEG-, PNG- oder WebP-Datei.",
  IMAGE_PREPARATION_UNAVAILABLE: "Dieser Browser kann das Foto nicht vorbereiten. Bitte öffne Jagdlatein in einem aktuellen Browser.",
  IMAGE_PREPARATION_FAILED: "Das Foto konnte nicht vorbereitet werden. Bitte versuche es mit einem kleineren Foto erneut.",
  INVALID_OBSERVATION: "Die Beobachtung konnte nicht gespeichert werden. Bitte prüfe Datum und Notiz.",
  INVALID_STORED_RECORDS: "Gespeicherte Revierfotos konnten nicht sicher gelesen werden. Du kannst den lokalen Foto-Speicher leeren und neu beginnen.",
  STORAGE_UNAVAILABLE: "Der lokale Foto-Speicher ist nicht verfügbar. Bitte erlaube Website-Speicher oder öffne Jagdlatein außerhalb des privaten Modus.",
  STORAGE_BLOCKED: "Der lokale Foto-Speicher wird gerade von einem anderen Jagdlatein-Fenster verwendet. Bitte schließe andere Fenster und versuche es erneut.",
  STORAGE_FULL: "Der Gerätespeicher reicht nicht aus. Bitte lösche eine gespeicherte Beobachtung oder schaffe freien Speicherplatz.",
  RECORD_LIMIT: "Du hast bereits 30 Beobachtungen auf diesem Gerät gespeichert. Bitte lösche zuerst eine davon.",
  STORAGE_FAILED: "Die Beobachtung konnte auf diesem Gerät nicht gespeichert oder gelesen werden. Bitte versuche es erneut.",
};

function fail(code) {
  const error = new Error(messages[code] || messages.STORAGE_FAILED);
  error.name = "RevierPhotoError";
  error.code = code;
  return error;
}

export function getRevierPhotoErrorMessage(error) {
  return messages[error?.code] || messages.STORAGE_FAILED;
}

function storageError(error) {
  if (messages[error?.code]) return error;
  if (error?.name === "QuotaExceededError") return fail("STORAGE_FULL");
  if (["SecurityError", "InvalidStateError", "UnknownError", "NotAllowedError"].includes(error?.name)) return fail("STORAGE_UNAVAILABLE");
  return fail("STORAGE_FAILED");
}

function isBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function ascii(bytes, offset, count) {
  return String.fromCharCode(...bytes.subarray(offset, offset + count));
}

function u32be(bytes, offset) {
  return bytes[offset] * 0x1000000 + bytes[offset + 1] * 0x10000 + bytes[offset + 2] * 0x100 + bytes[offset + 3];
}

function u32le(bytes, offset) {
  return bytes[offset] + bytes[offset + 1] * 0x100 + bytes[offset + 2] * 0x10000 + bytes[offset + 3] * 0x1000000;
}

function u24le(bytes, offset) {
  return bytes[offset] + bytes[offset + 1] * 0x100 + bytes[offset + 2] * 0x10000;
}

function validDimensions(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw fail("INVALID_FILE");
  if (width > 20000 || height > 20000 || width * height > REVIER_PHOTO_MAX_PIXELS) throw fail("IMAGE_TOO_LARGE");
  return { width, height };
}

// Inspect bytes, never just the filename or a caller-supplied MIME type. No SVG/GIF/HTML decoding.
export function inspectRevierPhotoBytes(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || 0);
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brands = ascii(bytes, 8, Math.min(bytes.length - 8, 80));
    if (/heic|heix|hevc|hevx|heim|heis|mif1|msf1/.test(brands)) throw fail("UNSUPPORTED_HEIC");
  }
  if (bytes.length >= 24 && [137, 80, 78, 71, 13, 10, 26, 10].every((part, index) => bytes[index] === part)) {
    if (u32be(bytes, 8) !== 13 || ascii(bytes, 12, 4) !== "IHDR") throw fail("INVALID_FILE");
    const dimensions = validDimensions(u32be(bytes, 16), u32be(bytes, 20));
    let offset = 8;
    let hasEnd = false;
    while (offset + 12 <= bytes.length) {
      const length = u32be(bytes, offset);
      const type = ascii(bytes, offset + 4, 4);
      if (length > bytes.length - offset - 12) throw fail("INVALID_FILE");
      if (type === "acTL") throw fail("ANIMATED_FILE");
      offset += length + 12;
      if (type === "IEND") { hasEnd = true; break; }
    }
    if (!hasEnd) throw fail("INVALID_FILE");
    return { mimeType: "image/png", ...dimensions };
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    const length = u32le(bytes, 4) + 8;
    if (length !== bytes.length) throw fail("INVALID_FILE");
    let offset = 12;
    let dimensions;
    while (offset + 8 <= length) {
      const type = ascii(bytes, offset, 4);
      const chunkLength = u32le(bytes, offset + 4);
      const data = offset + 8;
      if (chunkLength > length - data) throw fail("INVALID_FILE");
      if (["ANIM", "ANMF"].includes(type)) throw fail("ANIMATED_FILE");
      if (type === "VP8X" && chunkLength >= 10) {
        if (bytes[data] & 2) throw fail("ANIMATED_FILE");
        dimensions = validDimensions(1 + u24le(bytes, data + 4), 1 + u24le(bytes, data + 7));
      } else if (type === "VP8 " && chunkLength >= 10) {
        if (ascii(bytes, data + 3, 3) !== "\x9d\x01\x2a") throw fail("INVALID_FILE");
        dimensions ||= validDimensions((bytes[data + 6] + bytes[data + 7] * 256) & 0x3fff, (bytes[data + 8] + bytes[data + 9] * 256) & 0x3fff);
      } else if (type === "VP8L" && chunkLength >= 5) {
        if (bytes[data] !== 0x2f) throw fail("INVALID_FILE");
        const packed = u32le(bytes, data + 1);
        dimensions ||= validDimensions(1 + (packed & 0x3fff), 1 + ((packed >>> 14) & 0x3fff));
      }
      offset = data + chunkLength + (chunkLength % 2);
    }
    if (!dimensions || offset !== length) throw fail("INVALID_FILE");
    return { mimeType: "image/webp", ...dimensions };
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    let offset = 2;
    let dimensions;
    let metadata = false;
    if (bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) throw fail("INVALID_FILE");
    while (offset + 3 < bytes.length) {
      if (bytes[offset] !== 0xff) throw fail("INVALID_FILE");
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const length = bytes[offset] * 256 + bytes[offset + 1];
      if (length < 2 || length > bytes.length - offset) throw fail("INVALID_FILE");
      if ([0xe1, 0xed, 0xfe].includes(marker)) metadata = true;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        if (length < 8) throw fail("INVALID_FILE");
        dimensions = validDimensions(bytes[offset + 5] * 256 + bytes[offset + 6], bytes[offset + 3] * 256 + bytes[offset + 4]);
      }
      offset += length;
    }
    if (dimensions) return { mimeType: "image/jpeg", ...dimensions, hasMetadata: metadata };
  }
  throw fail("INVALID_FILE");
}

export async function validateRevierPhotoFile(file) {
  if (!isBlob(file) || !file.size) throw fail("INVALID_FILE");
  if (file.size > REVIER_PHOTO_MAX_INPUT_BYTES) throw fail("FILE_TOO_LARGE");
  const reportedType = (file.type || "").toLowerCase();
  if (/image\/(heic|heif)/.test(reportedType) || /\.(heic|heif)$/i.test(file.name || "")) throw fail("UNSUPPORTED_HEIC");
  let inspected;
  try { inspected = inspectRevierPhotoBytes(new Uint8Array(await file.arrayBuffer())); }
  catch (error) { throw error?.code ? error : fail("INVALID_FILE"); }
  const normalizedType = reportedType === "image/jpg" ? "image/jpeg" : reportedType;
  if (normalizedType && normalizedType !== "application/octet-stream" && normalizedType !== inspected.mimeType) throw fail("INVALID_FILE");
  return { ...inspected, size: file.size };
}

function decodePhoto(file) {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined" || typeof globalThis.URL?.createObjectURL !== "function") { reject(fail("IMAGE_PREPARATION_UNAVAILABLE")); return; }
    let objectUrl;
    let image;
    let timer;
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (image) { image.onload = null; image.onerror = null; }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (error && image) image.src = "";
      error ? reject(error) : resolve(image);
    };
    try {
      objectUrl = URL.createObjectURL(file);
      image = new Image();
      image.onload = () => finish(image.naturalWidth && image.naturalHeight ? null : fail("IMAGE_UNREADABLE"));
      image.onerror = () => finish(fail("IMAGE_UNREADABLE"));
      timer = setTimeout(() => { if (image) image.src = ""; finish(fail("IMAGE_UNREADABLE")); }, 15000);
      image.src = objectUrl;
    } catch { finish(fail("IMAGE_UNREADABLE")); }
  });
}

function encodePhoto(canvas, quality) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => { settled = true; reject(fail("IMAGE_PREPARATION_FAILED")); }, 15000);
    try { canvas.toBlob(blob => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      blob?.size && blob.type === "image/jpeg" ? resolve(blob) : reject(fail("IMAGE_PREPARATION_FAILED"));
    }, "image/jpeg", quality); }
    catch { clearTimeout(timer); settled = true; reject(fail("IMAGE_PREPARATION_FAILED")); }
  });
}

export async function prepareRevierPhoto(file) {
  await validateRevierPhotoFile(file);
  if (typeof document === "undefined") throw fail("IMAGE_PREPARATION_UNAVAILABLE");
  const image = await decodePhoto(file);
  let canvas;
  try {
    validDimensions(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, REVIER_PHOTO_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context || typeof canvas.toBlob !== "function") throw fail("IMAGE_PREPARATION_UNAVAILABLE");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    // A fresh canvas JPEG contains pixels only, not the original EXIF/GPS metadata.
    let blob = await encodePhoto(canvas, 0.86);
    if (blob.size > REVIER_PHOTO_MAX_SAVED_BYTES) blob = await encodePhoto(canvas, 0.72);
    if (blob.size > REVIER_PHOTO_MAX_SAVED_BYTES) throw fail("IMAGE_PREPARATION_FAILED");
    return { blob, width, height, size: blob.size, mimeType: "image/jpeg" };
  } catch (error) { throw error?.code ? error : fail("IMAGE_PREPARATION_FAILED"); }
  finally {
    image.src = "";
    if (canvas) { canvas.width = 1; canvas.height = 1; }
  }
}

export function getRevierLocalDate(now = Date.now()) {
  const date = new Date(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1900 && year <= 2200 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function normalizeRevierObservationInput(input, now = Date.now()) {
  if (!input || typeof input !== "object" || !Number.isFinite(now)) throw fail("INVALID_OBSERVATION");
  const note = input.note == null ? "" : input.note;
  const candidateId = input.candidateId == null ? "" : input.candidateId;
  const candidateLabel = input.candidateLabel == null ? "" : input.candidateLabel;
  const observedAt = input.observedAt == null ? getRevierLocalDate(now) : input.observedAt;
  if (typeof note !== "string" || note.length > REVIER_OBSERVATION_MAX_NOTE || typeof candidateId !== "string" || !/^[a-z0-9-]{0,100}$/.test(candidateId)
    || typeof candidateLabel !== "string" || candidateLabel.length > 150 || Boolean(candidateId) !== Boolean(candidateLabel.trim()) || !validDate(observedAt)) throw fail("INVALID_OBSERVATION");
  return { note: note.trim(), candidateId, candidateLabel: candidateLabel.trim(), observedAt };
}

export function validateRevierObservationRecord(record) {
  try {
    if (!record || record.version !== SCHEMA_VERSION || typeof record.id !== "string" || !/^[a-z0-9-]{16,80}$/.test(record.id)
      || !Number.isSafeInteger(record.createdAt) || record.createdAt < 0 || !isBlob(record.photo) || record.photo.type !== "image/jpeg" || !record.photo.size || record.photo.size > REVIER_PHOTO_MAX_SAVED_BYTES) return false;
    const normalized = normalizeRevierObservationInput(record, record.createdAt);
    return ["note", "candidateId", "candidateLabel", "observedAt"].every(key => record[key] === normalized[key]);
  } catch { return false; }
}

async function validateSavedPhoto(photo) {
  if (!isBlob(photo) || photo.type !== "image/jpeg" || !photo.size || photo.size > REVIER_PHOTO_MAX_SAVED_BYTES) throw fail("INVALID_OBSERVATION");
  let info;
  try { info = inspectRevierPhotoBytes(new Uint8Array(await photo.arrayBuffer())); }
  catch { throw fail("INVALID_OBSERVATION"); }
  if (info.mimeType !== "image/jpeg" || info.hasMetadata || info.width > REVIER_PHOTO_MAX_EDGE || info.height > REVIER_PHOTO_MAX_EDGE) throw fail("INVALID_OBSERVATION");
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined" || typeof indexedDB.open !== "function") { reject(fail("STORAGE_UNAVAILABLE")); return; }
    let settled = false;
    let request;
    let timer;
    const finish = (error, database) => {
      if (settled) { database?.close(); return; }
      settled = true;
      clearTimeout(timer);
      if (error) reject(storageError(error));
      else { database.onversionchange = () => database.close(); resolve(database); }
    };
    try {
      request = indexedDB.open(REVIER_PHOTO_DATABASE, SCHEMA_VERSION);
      request.onupgradeneeded = () => {
        try {
          const database = request.result;
          if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: "id" });
        } catch (error) { try { request.transaction?.abort(); } catch { /* Already closed. */ } finish(error); }
      };
      request.onsuccess = () => finish(null, request.result);
      request.onerror = () => finish(request.error || fail("STORAGE_UNAVAILABLE"));
      request.onblocked = () => finish(fail("STORAGE_BLOCKED"));
      timer = setTimeout(() => finish(fail("STORAGE_UNAVAILABLE")), 10000);
    } catch (error) { finish(error); }
  });
}

async function withStore(mode, action) {
  const database = await openDatabase();
  try { return await new Promise((resolve, reject) => {
    let transaction;
    let result;
    let reason;
    try {
      transaction = database.transaction(STORE, mode);
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = transaction.onerror = () => reject(storageError(reason || transaction.error));
      const abort = error => { reason = error; transaction.abort(); };
      action(transaction.objectStore(STORE), value => { result = value; }, abort);
    } catch (error) {
      reason = error;
      try { transaction?.abort(); } catch { /* Already closed. */ }
      reject(storageError(error));
    }
  }); } finally { database.close(); }
}

function createId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  if (typeof globalThis.crypto?.getRandomValues !== "function") throw fail("STORAGE_UNAVAILABLE");
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(20)), byte => byte.toString(16).padStart(2, "0")).join("");
}

// Call only after the user chooses “Auf diesem Gerät speichern”. No automatic save.
export async function saveRevierObservation(input) {
  const createdAt = Date.now();
  const normalized = normalizeRevierObservationInput(input, createdAt);
  await validateSavedPhoto(input.photo);
  const record = { version: SCHEMA_VERSION, id: createId(), createdAt, photo: input.photo, ...normalized };
  return withStore("readwrite", (store, complete, abort) => {
    const count = store.count();
    count.onsuccess = () => {
      try {
        if (count.result >= REVIER_OBSERVATION_MAX_RECORDS) { abort(fail("RECORD_LIMIT")); return; }
        const request = store.add(record);
        request.onsuccess = () => complete(record);
      } catch (error) { abort(error); }
    };
  });
}

export async function listRevierObservations() {
  const records = await withStore("readonly", (store, complete) => {
    const request = store.getAll(undefined, REVIER_OBSERVATION_MAX_RECORDS + 1);
    request.onsuccess = () => complete(request.result);
  });
  if (!Array.isArray(records) || records.length > REVIER_OBSERVATION_MAX_RECORDS || records.some(record => !validateRevierObservationRecord(record))) throw fail("INVALID_STORED_RECORDS");
  try { await Promise.all(records.map(record => validateSavedPhoto(record.photo))); }
  catch { throw fail("INVALID_STORED_RECORDS"); }
  return records.sort((left, right) => right.createdAt - left.createdAt || left.id.localeCompare(right.id));
}

export async function deleteRevierObservation(id) {
  if (typeof id !== "string" || !/^[a-z0-9-]{16,80}$/.test(id)) throw fail("INVALID_OBSERVATION");
  await withStore("readwrite", store => store.delete(id));
}

export async function clearRevierObservations() {
  await withStore("readwrite", store => store.clear());
}
