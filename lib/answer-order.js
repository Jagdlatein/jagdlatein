// Display positions never replace the original answer IDs or option indexes.
// The default seed is reproducible for server rendering and hydration. Generate
// a fresh seed only in a round-start/restart event or after async loading.
export function newAnswerSeed(previous = 0, random = Math.random) {
  const value = Math.floor(random() * 0x100000000) >>> 0;
  return value === previous ? (value + 1) >>> 0 : value;
}

export function answerOrder(answers, questionKey, seed = 0) {
  const order = answers.map((_, index) => index);
  let state = 2166136261;
  for (const char of `${questionKey}:${seed}`) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  // Small, deterministic PRNG: independent of render count, score or selection.
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 0x100000000;
  };
  for (let index = order.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [order[index], order[next]] = [order[next], order[index]];
  }
  return order;
}
