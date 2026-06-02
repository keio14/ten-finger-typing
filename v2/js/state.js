// state.js — single source of truth, persisted to localStorage.
// One object under one key. All reads/writes go through here.

const KEY = "tenfinger.v2";

const DEFAULT_STATE = {
  settings: { name: "", muted: false },
  // lessons keyed by lesson id -> { completed, stars, bestAccuracy }
  lessons: {},
  game: { bestScore: 0, bestLevel: 1 },
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    // shallow-merge so new fields appear for old saves
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      game: { ...DEFAULT_STATE.game, ...(parsed.game || {}) },
      lessons: { ...(parsed.lessons || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — ignore, game still works in-memory */
  }
}

export function getState() {
  return state;
}

// --- settings ---
export function getSettings() {
  return state.settings;
}
export function setName(name) {
  state.settings.name = String(name || "").trim().slice(0, 20);
  save();
}
export function setMuted(muted) {
  state.settings.muted = !!muted;
  save();
}
export function isMuted() {
  return state.settings.muted;
}

// --- lessons ---
export function getLessonProgress(id) {
  return state.lessons[id] || { completed: false, stars: 0, bestAccuracy: 0 };
}

// Record a lesson result. Keeps the best stars/accuracy seen.
export function recordLesson(id, { stars, accuracy }) {
  const prev = getLessonProgress(id);
  state.lessons[id] = {
    completed: true,
    stars: Math.max(prev.stars, stars),
    bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
  };
  save();
  return state.lessons[id];
}

// --- game ---
export function getGameBest() {
  return state.game;
}
export function recordGame({ score, level }) {
  state.game.bestScore = Math.max(state.game.bestScore, score);
  state.game.bestLevel = Math.max(state.game.bestLevel, level);
  save();
  return state.game;
}

// --- danger zone ---
export function resetAll() {
  state = structuredClone(DEFAULT_STATE);
  save();
}
