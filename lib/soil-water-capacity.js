function readNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim())) return null;
  return Number(value.trim().replace(",", "."));
}

// A uniform fictitious profile: percentage points × cm / 10 = mm water.
// This computes storage capacity, not current moisture or an irrigation target.
export function calculateSoilWaterCapacity({ fieldCapacity, wiltingPoint, depthCm } = {}) {
  const fc = readNumber(fieldCapacity), wp = readNumber(wiltingPoint), depth = readNumber(depthCm);
  if ([fc, wp, depth].some(value => value === null || !Number.isFinite(value))) return { valid: false, message: "Bitte alle drei Lernwerte als Zahlen eingeben." };
  if (fc < 0 || fc > 100 || wp < 0 || wp > 100) return { valid: false, message: "Die Wassergehalte müssen zwischen 0 und 100 Volumenprozent liegen." };
  if (fc < wp) return { valid: false, message: "Die Feldkapazität darf in diesem Lernmodell nicht kleiner als der Wassergehalt am Welkepunkt sein." };
  if (depth <= 0 || depth > 1000) return { valid: false, message: "Für dieses Lernbeispiel bitte eine Tiefe über 0 bis 1.000 Zentimeter wählen." };
  return { valid: true, fieldCapacity: fc, wiltingPoint: wp, depthCm: depth, availablePercent: fc - wp, capacityMm: (fc - wp) * depth / 10 };
}
