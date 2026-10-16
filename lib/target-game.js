// An abstract arcade board. Coordinates and rings describe this screen game
// only; they do not represent animals, equipment or real-world distances.
export const TARGET_SHOTS = 10;
export const TARGET_BOARD_ASPECT = 5 / 3;
export const TARGET_RADIUS = 0.24;
export const TARGET_RINGS = Object.freeze([
  Object.freeze({ radius: 1, score: 2 }),
  Object.freeze({ radius: 0.65, score: 5 }),
  Object.freeze({ radius: 0.38, score: 8 }),
  Object.freeze({ radius: 0.18, score: 10 }),
]);

function validMode(mode) {
  return mode === 'ruhig' || mode === 'wechsel';
}

function validSeed(seed) {
  return Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff;
}

function validPoint(point) {
  return Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1);
}

function randomPair(seed, shotIndex) {
  let state = (seed ^ Math.imul(shotIndex + 1, 0x9e3779b1)) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 0x100000000;
  };
  return [next(), next()];
}

// Radius is a fraction of board height. The aspect ratio keeps SVG circles
// and score circles identical on wide, narrow and scaled displays.
export function targetForShot(mode = 'ruhig', seed = 0, shotIndex = 0) {
  if (mode !== 'wechsel') return { x: 0.5, y: 0.5, radius: TARGET_RADIUS };
  const index = Number.isInteger(shotIndex) && shotIndex >= 0 ? shotIndex : 0;
  const [horizontal, vertical] = randomPair(validSeed(seed) ? seed : 0, index);
  return {
    x: 0.22 + horizontal * 0.56,
    y: 0.28 + vertical * 0.44,
    radius: TARGET_RADIUS,
  };
}

export function targetDistanceRatio(point, target) {
  if (!validPoint(point) || !validPoint(target)
    || !Number.isFinite(target.radius) || target.radius <= 0) return null;
  return Math.hypot((point.x - target.x) * TARGET_BOARD_ASPECT, point.y - target.y) / target.radius;
}

export function scoreTargetPoint(point, target) {
  const distance = targetDistanceRatio(point, target);
  if (distance === null) return 0;
  // A small floating-point allowance makes the drawn boundary part of its
  // ring, without changing the result for points visibly beyond a boundary.
  const epsilon = Number.EPSILON * 32;
  for (let index = TARGET_RINGS.length - 1; index >= 0; index -= 1) {
    if (distance <= TARGET_RINGS[index].radius + epsilon) return TARGET_RINGS[index].score;
  }
  return 0;
}

// Project through the actual SVG content rectangle, including meet-style
// letterboxing. A tap in a letterbox or outside the board is not a shot.
export function coordinateToGamePoint(event, rect) {
  if (!event || !rect || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)
    || !Number.isFinite(rect.left) || !Number.isFinite(rect.top)
    || !Number.isFinite(rect.width) || !Number.isFinite(rect.height)
    || rect.width <= 0 || rect.height <= 0) return null;
  const width = Math.min(rect.width, rect.height * TARGET_BOARD_ASPECT);
  const height = width / TARGET_BOARD_ASPECT;
  const left = rect.left + (rect.width - width) / 2;
  const top = rect.top + (rect.height - height) / 2;
  const point = {
    x: (event.clientX - left) / width,
    y: (event.clientY - top) / height,
  };
  return validPoint(point) ? point : null;
}

export function createTargetGame(options = {}) {
  const mode = validMode(options?.mode) ? options.mode : 'ruhig';
  const seed = validSeed(options?.seed) ? options.seed : 0;
  return {
    status: 'ready',
    generation: 0,
    mode,
    seed,
    shots: [],
    score: 0,
    target: targetForShot(mode, seed, 0),
    lastInputId: null,
  };
}

export function targetGameToken(state) {
  return { generation: state.generation, shotIndex: state.shots.length };
}

export function targetGameReducer(state = createTargetGame(), action) {
  if (!action || typeof action !== 'object') return state;
  if (action.type === 'start' || action.type === 'restart') {
    if (action.generation !== state.generation
      || !Number.isSafeInteger(state.generation) || state.generation >= Number.MAX_SAFE_INTEGER
      || (action.type === 'start' && state.status !== 'ready')
      || (action.type === 'restart' && state.status === 'ready')
      || (action.mode !== undefined && !validMode(action.mode))
      || (action.seed !== undefined && !validSeed(action.seed))) return state;
    const mode = action.mode ?? state.mode;
    const seed = action.seed ?? (action.type === 'restart' ? (state.seed + 1) >>> 0 : state.seed);
    return {
      ...createTargetGame({ mode, seed }),
      status: 'playing',
      generation: state.generation + 1,
    };
  }
  if (action.type !== 'shot' || state.status !== 'playing'
    || action.generation !== state.generation || action.shotIndex !== state.shots.length
    || state.shots.length >= TARGET_SHOTS || !validPoint(action)
    || typeof action.inputId !== 'string' || !/^[A-Za-z0-9_.:-]{1,64}$/.test(action.inputId)
    || state.shots.some(shot => shot.inputId === action.inputId)) return state;
  const score = scoreTargetPoint(action, state.target);
  const shots = [...state.shots, {
    index: state.shots.length + 1,
    x: action.x,
    y: action.y,
    target: { ...state.target },
    score,
    inputId: action.inputId,
  }];
  const finished = shots.length === TARGET_SHOTS;
  return {
    ...state,
    status: finished ? 'finished' : 'playing',
    shots,
    score: state.score + score,
    target: finished ? state.target : targetForShot(state.mode, state.seed, shots.length),
    lastInputId: action.inputId,
  };
}

export function targetGameSummary(state) {
  return {
    score: state.score,
    maxScore: TARGET_SHOTS * 10,
    shotsUsed: state.shots.length,
    shotsRemaining: TARGET_SHOTS - state.shots.length,
    hits: state.shots.filter(shot => shot.score > 0).length,
    centerHits: state.shots.filter(shot => shot.score === 10).length,
    bestScore: state.shots.reduce((best, shot) => Math.max(best, shot.score), 0),
    completed: state.status === 'finished',
  };
}
