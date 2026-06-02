// js/storage.js — single source of truth for locally-saved state.
const KEY = "mastertyping.v1";

export const DEFAULT_STATE = {
  name: null,                 // null = never asked, "" = asked & skipped, "Mia" = provided
  lessons: {},                // id -> { bestWpm, bestAccuracy, stars, completed }
  tests: [],                  // { dateISO, durationSec, wpm, accuracy }, newest first
  certificates: [],           // { courseId, dateISO, wpm, accuracy }
  achievements: [],           // achievement ids
  game: { highScore: 0, bestLevel: 1 },
  settings: { keyboardGuide: true, sound: true },
};

// Deep-merge defaults under loaded data so new keys always exist.
function withDefaults(loaded) {
  const d = structuredClone(DEFAULT_STATE);
  if (!loaded || typeof loaded !== "object") return d;
  return {
    ...d, ...loaded,
    game: { ...d.game, ...(loaded.game || {}) },
    settings: { ...d.settings, ...(loaded.settings || {}) },
    lessons: { ...(loaded.lessons || {}) },
    tests: Array.isArray(loaded.tests) ? loaded.tests : d.tests,
    certificates: Array.isArray(loaded.certificates) ? loaded.certificates : d.certificates,
    achievements: Array.isArray(loaded.achievements) ? loaded.achievements : d.achievements,
  };
}

export class Storage {
  constructor() {
    this.inMemory = false;
    let parsed = null;
    try {
      const raw = localStorage.getItem(KEY);
      parsed = raw ? JSON.parse(raw) : null;
    } catch (_) {
      parsed = null;                 // corrupt JSON or unavailable storage
    }
    this.state = withDefaults(parsed);
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch (_) {
      this.inMemory = true;          // private mode / quota — keep state in memory only
    }
  }

  getName() { return this.state.name; }
  setName(name) { this.state.name = name; this.save(); }

  getSettings() { return this.state.settings; }
  updateSettings(patch) {
    this.state.settings = { ...this.state.settings, ...patch };
    this.save();
  }

  getLesson(id) {
    return this.state.lessons[id] || null;
  }

  // Merge a lesson attempt: keep the best wpm/accuracy/stars; complete once stars >= 1.
  recordLessonResult(id, { wpm, accuracy, stars }) {
    const prev = this.state.lessons[id] || { bestWpm: 0, bestAccuracy: 0, stars: 0, completed: false };
    this.state.lessons[id] = {
      bestWpm: Math.max(prev.bestWpm, wpm),
      bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
      stars: Math.max(prev.stars, stars),
      completed: prev.completed || stars >= 1,
    };
    this.save();
    return this.state.lessons[id];
  }

  addTest({ durationSec, wpm, accuracy }) {
    this.state.tests.unshift({ dateISO: new Date().toISOString(), durationSec, wpm, accuracy });
    this.state.tests = this.state.tests.slice(0, 20);
    this.save();
    return this.state.tests[0];
  }

  getTests() {
    return this.state.tests;
  }

  bestTest() {
    if (!this.state.tests.length) return null;
    return this.state.tests.reduce((best, t) => (t.wpm > best.wpm ? t : best));
  }

  getGame() {
    return this.state.game;
  }

  recordGame({ score, level }) {
    this.state.game = {
      highScore: Math.max(this.state.game.highScore, score),
      bestLevel: Math.max(this.state.game.bestLevel, level),
    };
    this.save();
    return this.state.game;
  }

  getAchievements() {
    return this.state.achievements;
  }

  addAchievement(id) {
    if (this.state.achievements.includes(id)) return false;
    this.state.achievements.push(id);
    this.save();
    return true;
  }

  getCertificates() {
    return this.state.certificates;
  }

  addCertificate(cert) {
    if (this.state.certificates.some((c) => c.courseId === cert.courseId)) return false;
    this.state.certificates.push(cert);
    this.save();
    return true;
  }
}

// One shared instance for the app (tests construct their own).
export const store = new Storage();
