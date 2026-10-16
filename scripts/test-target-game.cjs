// Synthetic geometry and local state only. No remote services or user data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const pr = createRequire(path.join(root, 'package.json'));
const swc = pr('next/dist/build/swc');
const filename = path.join(root, 'lib/target-game.js');
const { code } = swc.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' }, module: { type: 'commonjs' },
});
const mod = { exports: {} };
new Function('module', 'exports', code)(mod, mod.exports);
const {
  TARGET_SHOTS, TARGET_BOARD_ASPECT, TARGET_RADIUS, TARGET_RINGS,
  createTargetGame, targetGameReducer: reduce, targetGameToken: token,
  targetForShot, targetDistanceRatio, scoreTargetPoint, coordinateToGamePoint, targetGameSummary,
} = mod.exports;

function start(mode = 'ruhig', seed = 0) {
  const state = createTargetGame({ mode, seed });
  return reduce(state, { type: 'start', generation: state.generation });
}
function shoot(state, point = state.target, inputId = `tap:${state.generation}:${state.shots.length}`) {
  return reduce(state, { type: 'shot', ...token(state), x: point.x, y: point.y, inputId });
}
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}
function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
}

test('No game begins during initial render and only an explicit current start begins ten-shot play', () => {
  const state = createTargetGame();
  assert.equal(state.status, 'ready');
  assert.equal(state.score, 0);
  assert.equal(state.shots.length, 0);
  assert.deepEqual(state.target, { x: 0.5, y: 0.5, radius: TARGET_RADIUS });
  assert.strictEqual(shoot(state), state);
  for (const action of [null, {}, { type: 'start' }, { type: 'start', generation: 1 },
    { type: 'start', generation: 0, mode: 'unknown' }, { type: 'start', generation: 0, seed: -1 },
    { type: 'restart', generation: 0 }]) assert.strictEqual(reduce(state, action), state);
  const playing = reduce(state, { type: 'start', generation: 0, mode: 'wechsel', seed: 91 });
  assert.equal(playing.status, 'playing');
  assert.equal(playing.generation, 1);
  assert.equal(playing.mode, 'wechsel');
  assert.equal(playing.seed, 91);
  assert.strictEqual(reduce(playing, { type: 'start', generation: 1 }), playing);
  assert.equal(TARGET_SHOTS, 10);
});

test('Rendered circular boundaries award ring points consistently in all directions', () => {
  const target = targetForShot();
  assert.deepEqual(TARGET_RINGS.map(ring => ring.score), [2, 5, 8, 10]);
  assert.equal(scoreTargetPoint(target, target), 10);
  for (const ring of TARGET_RINGS) {
    for (const angle of [0, Math.PI / 4, Math.PI / 2, Math.PI, 1.5 * Math.PI]) {
      const point = {
        x: target.x + Math.cos(angle) * target.radius * ring.radius / TARGET_BOARD_ASPECT,
        y: target.y + Math.sin(angle) * target.radius * ring.radius,
      };
      near(targetDistanceRatio(point, target), ring.radius);
      assert.equal(scoreTargetPoint(point, target), ring.score);
    }
  }
  for (const [radius, expected] of [[0.180000001, 8], [0.380000001, 5], [0.650000001, 2], [1.000000001, 0]]) {
    assert.equal(scoreTargetPoint({ x: target.x, y: target.y + target.radius * radius }, target), expected);
  }
  assert.equal(scoreTargetPoint({ x: 0, y: 0 }, target), 0);
  assert.equal(scoreTargetPoint({ x: 1, y: 1 }, target), 0);
});

test('Screen points preserve the same geometry when scaled, offset or SVG-letterboxed', () => {
  const target = targetForShot();
  const point = { x: target.x + target.radius * 0.5 / TARGET_BOARD_ASPECT, y: target.y };
  for (const rect of [
    { left: 0, top: 0, width: 1000, height: 600 },
    { left: 31, top: 280, width: 320, height: 192 },
    { left: -200, top: 17, width: 1000, height: 1000 },
    { left: 140, top: -90, width: 2000, height: 600 },
  ]) {
    const width = Math.min(rect.width, rect.height * TARGET_BOARD_ASPECT);
    const height = width / TARGET_BOARD_ASPECT;
    const projected = coordinateToGamePoint({
      clientX: rect.left + (rect.width - width) / 2 + point.x * width,
      clientY: rect.top + (rect.height - height) / 2 + point.y * height,
    }, rect);
    near(projected.x, point.x);
    near(projected.y, point.y);
    assert.equal(scoreTargetPoint(projected, target), 5);
  }
  assert.equal(coordinateToGamePoint({ clientX: 500, clientY: 100 }, { left: 0, top: 0, width: 1000, height: 1000 }), null);
  assert.equal(coordinateToGamePoint({ clientX: 100, clientY: 300 }, { left: 0, top: 0, width: 2000, height: 600 }), null);
  assert.deepEqual(coordinateToGamePoint({ clientX: 0, clientY: 0 }, { left: 0, top: 0, width: 1000, height: 600 }), { x: 0, y: 0 });
  assert.deepEqual(coordinateToGamePoint({ clientX: 1000, clientY: 600 }, { left: 0, top: 0, width: 1000, height: 600 }), { x: 1, y: 1 });
});

test('Invalid and outside-board inputs do not consume attempts or create nonfinite game state', () => {
  const state = freeze(start());
  const valid = { type: 'shot', ...token(state), x: 0.5, y: 0.5, inputId: 'tap:1' };
  for (const change of [
    { x: NaN }, { x: Infinity }, { y: -Infinity }, { x: -0.001 }, { x: 1.001 }, { y: -0.001 }, { y: 1.001 },
    { x: '0.5' }, { y: null }, { generation: 0 }, { generation: NaN }, { shotIndex: -1 }, { shotIndex: 0.5 },
    { inputId: '' }, { inputId: null }, { inputId: 1 }, { inputId: 'x'.repeat(65) }, { inputId: 'tap\n1' },
  ]) assert.strictEqual(reduce(state, { ...valid, ...change }), state);
  for (const rect of [null, {}, { left: 0, top: 0, width: 0, height: 100 },
    { left: 0, top: 0, width: 100, height: -1 }, { left: NaN, top: 0, width: 100, height: 100 }]) {
    assert.equal(coordinateToGamePoint({ clientX: 10, clientY: 10 }, rect), null);
  }
  assert.equal(coordinateToGamePoint({ clientX: NaN, clientY: 10 }, { left: 0, top: 0, width: 100, height: 60 }), null);
  assert.equal(targetDistanceRatio({ x: NaN, y: 0.5 }, state.target), null);
  assert.equal(targetDistanceRatio(state.target, { x: 0.5, y: 0.5, radius: 0 }), null);
  assert.equal(scoreTargetPoint({ x: NaN, y: 0.5 }, state.target), 0);
});

test('One input is accepted once even with duplicate, rapid or stale dispatches', () => {
  const before = freeze(start('wechsel', 123));
  const event = { type: 'shot', ...token(before), x: before.target.x, y: before.target.y, inputId: 'pointer:7:12.5' };
  const first = reduce(before, event);
  assert.equal(first.shots.length, 1);
  assert.equal(first.score, 10);
  for (let index = 0; index < 100; index += 1) assert.strictEqual(reduce(first, event), first);
  assert.strictEqual(reduce(first, { ...event, ...token(first) }), first);
  assert.strictEqual(reduce(first, { ...event, inputId: 'other-input' }), first);
  const second = shoot(first, first.target, 'keyboard:2');
  assert.equal(second.shots.length, 2);
  assert.equal(second.score, 20);
  assert.equal(before.shots.length, 0);
  assert.deepEqual(first.shots[0].target, before.target);
});

test('Exactly ten accepted shots finish a bounded round, including zero-point misses', () => {
  let state = start();
  for (let index = 0; index < TARGET_SHOTS; index += 1) {
    state = shoot(freeze(state), index % 2 ? { x: 0, y: 0 } : state.target);
    assert.equal(state.shots.length, index + 1);
    assert.equal(state.status, index === TARGET_SHOTS - 1 ? 'finished' : 'playing');
  }
  assert.equal(state.score, 50);
  assert.equal(state.shots.filter(shot => shot.score === 0).length, 5);
  assert.deepEqual(state.shots.map(shot => shot.index), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (let index = 0; index < 100; index += 1) assert.strictEqual(shoot(state, state.target, `extra:${index}`), state);
  assert.deepEqual(targetGameSummary(state), {
    score: 50, maxScore: 100, shotsUsed: 10, shotsRemaining: 0, hits: 5,
    centerHits: 5, bestScore: 10, completed: true,
  });
});

test('Explicit restart clears local score and invalidates every event from an earlier generation', () => {
  let state = start('wechsel', 0xffffffff);
  const staleEvent = { type: 'shot', ...token(state), ...state.target, inputId: 'old-input' };
  state = shoot(state);
  const beforeRestart = freeze(state);
  const restarted = reduce(state, { type: 'restart', generation: state.generation });
  assert.equal(restarted.generation, state.generation + 1);
  assert.equal(restarted.seed, 0);
  assert.equal(restarted.status, 'playing');
  assert.equal(restarted.shots.length, 0);
  assert.equal(restarted.score, 0);
  assert.equal(restarted.lastInputId, null);
  assert.strictEqual(reduce(restarted, staleEvent), restarted);
  assert.strictEqual(reduce(restarted, { type: 'restart', generation: beforeRestart.generation }), restarted);
  assert.equal(beforeRestart.shots.length, 1);
  assert.equal(shoot(restarted, restarted.target, 'old-input').score, 10);
  let completed = start();
  for (let index = 0; index < 10; index += 1) completed = shoot(completed);
  const changedMode = reduce(completed, { type: 'restart', generation: completed.generation, mode: 'wechsel', seed: 8 });
  assert.equal(changedMode.mode, 'wechsel');
  assert.equal(changedMode.status, 'playing');
  assert.equal(changedMode.score, 0);
});

test('Changing targets stay entirely on the board and change only after an accepted input', () => {
  const seen = new Set();
  for (let seed = 0; seed < 100; seed += 1) {
    let state = start('wechsel', seed);
    for (let index = 0; index < TARGET_SHOTS; index += 1) {
      const { x, y, radius } = state.target;
      assert.ok(x - radius / TARGET_BOARD_ASPECT > 0 && x + radius / TARGET_BOARD_ASPECT < 1);
      assert.ok(y - radius > 0 && y + radius < 1);
      seen.add(`${x}:${y}`);
      const snapshot = { ...state.target };
      assert.deepEqual(targetForShot('wechsel', seed, index), snapshot);
      assert.strictEqual(reduce(state, { type: 'tick' }), state);
      assert.strictEqual(shoot(state, { x: -1, y: 0.5 }), state);
      const after = shoot(state);
      assert.deepEqual(after.shots[index].target, snapshot);
      if (after.status === 'playing') assert.notDeepEqual(after.target, snapshot);
      state = after;
    }
    assert.equal(state.score, 100);
  }
  assert.ok(seen.size > 990);
  const staticStart = start('ruhig', 99);
  assert.deepEqual(shoot(staticStart).target, staticStart.target);
});

test('Seeded replay is deterministic without clocks, randomness, storage or network', () => {
  const oldRandom = Math.random;
  const oldNow = Date.now;
  Math.random = () => { throw new Error('Unseeded random access'); };
  Date.now = () => { throw new Error('Clock access'); };
  try {
    function play() {
      let state = start('wechsel', 20261016);
      for (let index = 0; index < 10; index += 1) {
        const point = index % 3 === 0 ? { x: 0, y: 0 } : state.target;
        state = shoot(state, point);
      }
      return state;
    }
    assert.deepEqual(play(), play());
    assert.deepEqual(createTargetGame({ mode: 'unknown', seed: -1 }), createTargetGame());
    assert.deepEqual(createTargetGame(null), createTargetGame());
  } finally {
    Math.random = oldRandom;
    Date.now = oldNow;
  }
});
