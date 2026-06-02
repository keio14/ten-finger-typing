// js/gameengine.js — pure falling-letters game logic (no DOM, no rAF).
// Letters fall from y=0 toward the floor at HEIGHT; x is normalized 0..1.

export const HEIGHT = 600;
const LEVEL_UP_EVERY = 10;
const HOME_ROW = ["f", "j", "d", "k", "s", "l", "a"];

export function fallSpeed(level) {
  return 40 + (level - 1) * 14; // px/sec
}

export function spawnInterval(level) {
  return Math.max(0.6, 1.8 - (level - 1) * 0.12); // seconds
}

export function createGame({ pool, level = 1, lives = 3, rng = Math.random } = {}) {
  return {
    pool: pool && pool.length ? pool : HOME_ROW.slice(),
    rng,
    status: "playing", // "playing" | "over"
    score: 0,
    lives,
    level,
    cleared: 0,
    mistakes: 0,
    typed: 0,
    letters: [], // { ch, x (0..1), y (px) }
    spawnTimer: 0,
    elapsed: 0,
  };
}

export function spawn(state) {
  const ch = state.pool[Math.floor(state.rng() * state.pool.length)];
  state.letters.push({ ch, x: state.rng(), y: 0 });
}

export function update(state, dt) {
  if (state.status !== "playing") return state;
  state.elapsed += dt;
  state.spawnTimer += dt;
  if (state.spawnTimer >= spawnInterval(state.level)) {
    state.spawnTimer = 0;
    spawn(state);
  }
  const speed = fallSpeed(state.level);
  const survivors = [];
  for (const L of state.letters) {
    L.y += speed * dt;
    if (L.y >= HEIGHT) {
      state.lives -= 1;
      if (state.lives <= 0) state.status = "over";
    } else {
      survivors.push(L);
    }
  }
  state.letters = survivors;
  return state;
}

export function handleKey(state, key) {
  if (state.status !== "playing") return state;
  if (typeof key !== "string" || key.length !== 1) return state;
  state.typed += 1;
  // Clear the lowest (closest to the floor) letter matching the key.
  let idx = -1;
  let maxY = -Infinity;
  for (let i = 0; i < state.letters.length; i++) {
    if (state.letters[i].ch === key && state.letters[i].y > maxY) {
      maxY = state.letters[i].y;
      idx = i;
    }
  }
  if (idx >= 0) {
    state.letters.splice(idx, 1);
    state.score += 1;
    state.cleared += 1;
    if (state.cleared % LEVEL_UP_EVERY === 0) state.level += 1;
  } else {
    state.mistakes += 1;
  }
  return state;
}

export function accuracy(state) {
  return state.typed ? (state.typed - state.mistakes) / state.typed : 1;
}

export function wpm(state) {
  if (state.elapsed <= 0) return 0;
  return Math.round((state.cleared / 5) / (state.elapsed / 60));
}
