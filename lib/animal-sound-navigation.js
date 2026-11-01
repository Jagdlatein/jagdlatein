import { animalSoundById } from "./animal-sounds";

export function resolveAnimalSoundRoute(query = {}, ready = false) {
  if (!ready) return { status: "pending", sound: null };
  if (!Object.hasOwn(query, "stimme")) return { status: "library", sound: null };
  const id = query.stimme;
  if (typeof id !== "string" || !id || !Object.hasOwn(animalSoundById, id)) return { status: "invalid", sound: null };
  return { status: "detail", sound: animalSoundById[id] };
}

// Query, raw URL and actual address all matter, including the interval before
// React renders a router or hash change. No private state enters this address.
export function animalSoundAddressKey(router) {
  return JSON.stringify([router.isReady === true, router.asPath, router.query,
    typeof window === "undefined" ? null : `${window.location?.pathname || ""}${window.location?.search || ""}${window.location?.hash || ""}`]);
}
