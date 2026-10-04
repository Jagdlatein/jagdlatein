import { createHmac, randomUUID } from "node:crypto";
import { getLearningModule } from "./learning-curriculum";
import { getLearningMedia, breedPictures } from "./learning-media";
import { animalSounds } from "./animal-sounds";
import { learningImagePaths } from "./learning-image-paths";
import { validateOfflinePack, OFFLINE_MAX_COURSES } from "./offline-learning";
export const offlineAccountKey = access => createHmac("sha256", process.env.JL_SESSION_SECRET).update(access.email).digest("hex");
export function createOfflinePack(body, access, now = Date.now()) {
  if (!body || Object.keys(body).some(key => !["courseIds", "sounds"].includes(key)) || !Array.isArray(body.courseIds) || body.courseIds.length < 1 || body.courseIds.length > OFFLINE_MAX_COURSES
    || new Set(body.courseIds).size !== body.courseIds.length || body.courseIds.some(id => typeof id !== "string" || !getLearningModule(id)) || typeof body.sounds !== "boolean") throw Object.assign(new Error("Bitte ein bis acht gültige Kurse auswählen."), { status: 400 });
  const courses = body.courseIds.map(getLearningModule);
  let expiresAt = now + 7 * 86400000;
  const accessUntil = Date.parse(access.paidUntil || access.trialUntil || "");
  if (!access.admin && Number.isFinite(accessUntil)) expiresAt = Math.min(expiresAt, accessUntil);
  if (expiresAt <= now) throw Object.assign(new Error("Dein Zugang ist abgelaufen. Bitte den Kontostatus prüfen."), { status: 403 });
  const photos = new Map();
  for (const course of courses) {
    const media = getLearningMedia(course);
    for (const image of [media, ...(media?.pictures || []), ...(course.id === "wissen-vertiefung-jagdhunderassen" ? breedPictures : [])].filter(Boolean)) {
      if (!learningImagePaths.includes(image.src)) continue;
      const creditUrl = image.creditUrl || image.url || null;
      photos.set(image.src, { src: image.src, alt: image.alt || image.name, credit: image.credit || `Foto: ${image.author} · ${image.license}`, creditUrl, licenseUrl: image.licenseUrl || null });
    }
  }
  const pack = { version: 1, id: randomUUID(), accountKey: offlineAccountKey(access), createdAt: now, expiresAt,
    courses, photos: [...photos.values()], sounds: body.sounds ? animalSounds : [] };
  if (!validateOfflinePack(pack, now)) throw new Error("Lernpaket enthält ungültige Inhalte.");
  return pack;
}
