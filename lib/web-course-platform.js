// Presentation only: the server must still enforce the existing account and
// course permissions. User-agent and bridge checks are not access controls.
export function detectWebCoursePlatform({ available = true, capacitorNative = false, cordova = false,
  photoCapture = false, userAgent = "", platform = "", maxTouchPoints = 0, standalone = false } = {}) {
  if (!available) return "checking";
  if (capacitorNative === true || cordova === true) return "native";
  const ua = typeof userAgent === "string" ? userAgent : "";
  const ios = /iPad|iPhone|iPod/i.test(ua) || platform === "MacIntel" && maxTouchPoints > 1;
  // Compatibility with the existing, first-party iOS binary. It injects this
  // read-only camera-capability marker at document start only on our origins.
  // A future native client should supply its own explicit platform contract.
  if (ios && photoCapture === true) return "native";
  if (/\bwv\b/i.test(ua) && /Android/i.test(ua) || /\bJagdlateinApp\b/i.test(ua)) return "native";
  // Installed web apps remain browser courses. iOS WKWebView's UA otherwise
  // omits Safari; recognise ordinary third-party browsers before that fallback.
  const browser = /Safari\/|CriOS\/|FxiOS\/|EdgiOS\/|OPiOS\/|DuckDuckGo\/|GSA\//i.test(ua);
  if (ios && !standalone && !browser && /AppleWebKit\//i.test(ua)) return "native";
  return "browser";
}

export function readWebCoursePlatform({ browserWindow, browserNavigator, capacitor } = {}) {
  if (!browserWindow || !browserNavigator) return "checking";
  let capacitorNative = false, standalone = false;
  try { capacitorNative = capacitor?.isNativePlatform?.() === true; } catch {}
  try { standalone = browserNavigator.standalone === true || browserWindow.matchMedia?.("(display-mode: standalone)").matches === true; } catch {}
  return detectWebCoursePlatform({
    capacitorNative, standalone, cordova: Boolean(browserWindow.cordova),
    photoCapture: browserWindow.jagdlateinPhotoCapture === true,
    userAgent: browserNavigator.userAgent, platform: browserNavigator.platform,
    maxTouchPoints: browserNavigator.maxTouchPoints,
  });
}
