const safeBreedId = value => typeof value === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(value);

export function dogBreedProfileHref(id, topic = "rasse-erkennen") {
  if (!safeBreedId(id)) return "/lernen/jagdhunde";
  const fragment = typeof topic === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(topic) ? `#${topic}` : "";
  return `/lernen/jagdhunde/${encodeURIComponent(id)}${fragment}`;
}

export function legacyDogBreedTarget(query = {}, profiles = []) {
  if (!safeBreedId(query.rasse)) return "/lernen/jagdhunde";
  const profile = profiles.find(profile => profile.id === query.rasse);
  return profile ? dogBreedProfileHref(profile.id) : "/lernen/jagdhunde";
}
