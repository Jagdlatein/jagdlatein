const V4_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Photo requests only. Older WebViews can expose secure random bytes without
// randomUUID; never replace either Web Crypto API with Math.random.
export function createPhotoRecognitionRequestId(cryptoApi) {
  try {
    const secure = cryptoApi === undefined ? globalThis.crypto : cryptoApi;
    if (typeof secure?.randomUUID === "function") {
      const id = secure.randomUUID();
      if (typeof id !== "string" || !V4_UUID.test(id)) throw new Error();
      return id.toLowerCase();
    }
    if (typeof secure?.getRandomValues !== "function") throw new Error();
    const bytes = new Uint8Array(16);
    secure.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch {
    throw Object.assign(new Error("Secure photo request identifier unavailable"), { code: "photo_secure_random_unavailable" });
  }
}
