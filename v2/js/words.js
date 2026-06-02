// words.js — the falling-words bank for the game, plus a progress-aware
// selector. Pure (no DOM), so it can be unit-tested.
//
// All words are lowercase a–z (the only keys a beginner types on QWERTY).

// A bank of simple, kid-friendly words, ordered roughly easy -> harder.
export const WORD_BANK = [
  // home-row friendly (a s d f g h j k l)
  "as", "ask", "add", "dad", "sad", "lad", "all", "fall", "hall", "lash",
  "dash", "flask", "salad", "glass", "flash", "shall", "half",
  // + top row
  "the", "type", "tree", "true", "your", "quiet", "power", "write",
  "later", "world", "happy", "apple", "water", "paper", "tiger",
  // + bottom row
  "cat", "dog", "sun", "fun", "run", "big", "red", "box", "fox", "van",
  "jump", "brave", "movie", "number", "zebra", "music", "money",
];

// A tiny fallback set so the game is always playable, even at the very
// start when almost no letters have been learned yet.
const FALLBACK = ["as", "at", "it", "up", "go", "cat", "dog", "sun", "fun", "run"];

// How many distinct words we want available before falling back.
const MIN_POOL = 8;

// Words typeable using ONLY the given learned letters, with a fallback so the
// pool is never too small to play. `letters` is an array of lowercase chars.
export function wordsFor(letters) {
  const set = new Set(letters);
  const canType = (w) => [...w].every((c) => set.has(c));
  let pool = WORD_BANK.filter(canType);
  if (pool.length < MIN_POOL) {
    for (const w of FALLBACK) if (!pool.includes(w)) pool.push(w);
  }
  return pool.length ? pool : FALLBACK.slice();
}
