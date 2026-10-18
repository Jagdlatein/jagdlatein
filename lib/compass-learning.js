// A fixed, flat teaching circle. This is not a sensor or a declination model.
export function readCompassLearningAngle(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(text)) return null;
  const angle = Number(text.replace(",", "."));
  if (!Number.isInteger(angle) || angle < 0 || angle > 360) return null;
  const direction = angle === 360 ? 0 : angle;
  return { angle, direction, reverse: (direction + 180) % 360 };
}
