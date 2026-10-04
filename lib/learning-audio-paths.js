// Licensed original recordings. Tool pages still require the usual account access.
export const learningAudioPaths = [
  "/lernen/stimmen/aufnahme-01.mp3",
  "/lernen/stimmen/aufnahme-02.mp3",
  "/lernen/stimmen/aufnahme-03.mp3",
  "/lernen/stimmen/aufnahme-04.mp3",
  "/lernen/stimmen/aufnahme-05.mp3",
  "/lernen/stimmen/aufnahme-06.mp3",
  "/lernen/stimmen/aufnahme-07.mp3",
  "/lernen/stimmen/aufnahme-08.mp3",
  ...Array.from({ length: 22 }, (_, index) => `/lernen/stimmen/vogel-${String(index + 1).padStart(2, "0")}.mp3`),
  ...Array.from({ length: 6 }, (_, index) => `/lernen/stimmen/saeuger-${String(index + 1).padStart(2, "0")}.mp3`),
  "/lernen/stimmen/gams-01.mp3",
];
