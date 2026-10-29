"use client";

import { useSyncExternalStore } from "react";
import { EXAM_PROFILE_STORAGE_KEY, normalizeExamProfile } from "./exam-profile";

const subscribers = new Set();
const serverSnapshot = Object.freeze({
  profile: null, ready: false, persistence: "unknown", saveProfile, clearProfile,
});
let snapshot = serverSnapshot;
let storeWindow = null;
let listeningWindow = null;
let storeStorage = null;

const browserWindow = () => typeof window === "undefined" ? null : window;
const sameProfile = (a, b) => a === b || Boolean(a && b && a.country === b.country && a.region === b.region);

function publish(profile, persistence) {
  if (sameProfile(snapshot.profile, profile)) profile = snapshot.profile;
  if (snapshot.ready && snapshot.profile === profile && snapshot.persistence === persistence) return;
  snapshot = Object.freeze({ profile, ready: true, persistence, saveProfile, clearProfile });
  [...subscribers].forEach(notify => notify());
}

function readProfile(target) {
  try {
    const storage = target.localStorage;
    if (!storage) throw new Error("Storage unavailable");
    storeStorage = storage;
    const raw = storage.getItem(EXAM_PROFILE_STORAGE_KEY);
    let profile = null;
    try { profile = normalizeExamProfile(JSON.parse(raw || "null")); } catch { /* Invalid stored data is not a selection. */ }
    publish(profile, "device");
  } catch {
    // A denied read must not erase an explicit selection already held in memory.
    publish(snapshot.profile, "session");
  }
}

function handleStorage(event) {
  if (!listeningWindow || (event.key !== EXAM_PROFILE_STORAGE_KEY && event.key !== null)) return;
  if (event.storageArea) {
    let expectedStorage = storeStorage;
    try { expectedStorage ||= listeningWindow.localStorage; } catch { return; }
    if (event.storageArea !== expectedStorage) return;
  }
  // Read the present value rather than a queued event's possibly superseded value.
  readProfile(listeningWindow);
}

function subscribe(notify) {
  const target = browserWindow();
  if (!target) return () => {};
  subscribers.add(notify);
  if (!listeningWindow) {
    if (storeWindow !== target) {
      storeWindow = target;
      storeStorage = null;
      snapshot = serverSnapshot;
    }
    listeningWindow = target;
    target.addEventListener("storage", handleStorage);
    // Keep an explicit session fallback on remount: a failed remove/write may
    // have left an older device value that must not revive the old target.
    if (!snapshot.ready || snapshot.persistence !== "session") readProfile(target);
  }
  let live = true;
  return () => {
    if (!live) return;
    live = false;
    subscribers.delete(notify);
    if (!subscribers.size && listeningWindow) {
      listeningWindow.removeEventListener("storage", handleStorage);
      listeningWindow = null;
    }
  };
}

function saveProfile(value) {
  const profile = normalizeExamProfile(value);
  const target = browserWindow();
  if (!profile || !target) return false;
  let persistence = "session";
  try {
    const storage = target.localStorage;
    if (storage) {
      storeStorage = storage;
      storage.setItem(EXAM_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      persistence = "device";
    }
  } catch { /* The valid explicit choice remains available for this session. */ }
  storeWindow = target;
  publish(profile, persistence);
  return true;
}

function clearProfile() {
  const target = browserWindow();
  if (!target) return false;
  let persistence = "session";
  try {
    const storage = target.localStorage;
    if (storage) {
      storeStorage = storage;
      storage.removeItem(EXAM_PROFILE_STORAGE_KEY);
      persistence = "device";
    }
  } catch { /* Clear the in-memory target even if device persistence is denied. */ }
  storeWindow = target;
  publish(null, persistence);
  return true;
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => serverSnapshot;

export function useExamProfile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useExamProfile;
