// words.js — the falling-words bank for the game, plus a progress-aware
// selector. Pure (no DOM), so it can be unit-tested.
//
// All words are lowercase a–z (the only keys a beginner types on QWERTY).

// A bank of kid-friendly words, ordered roughly easy -> harder. Words only
// appear once every letter in them has been learned, so longer words show up
// naturally as the player progresses through the lessons.
export const WORD_BANK = [
  // home-row friendly (a s d f g h j k l)
  "as", "ask", "add", "dad", "sad", "lad", "all", "fall", "hall", "lash",
  "dash", "flask", "salad", "glass", "flash", "shall", "half", "gash",
  // short common words
  "the", "and", "you", "for", "out", "day", "new", "old", "big", "red",
  "hot", "sun", "fun", "run", "cat", "dog", "box", "fox", "van", "cup",
  "top", "sit", "map", "pen", "bed", "toy", "egg", "bus", "hat", "leg",
  "net", "owl", "pig", "jam", "kid", "yes", "wet", "cry", "sky", "fly",
  // medium words
  "tree", "true", "type", "your", "quiet", "power", "write", "water",
  "paper", "happy", "apple", "world", "later", "tiger", "music", "money",
  "movie", "brave", "zebra", "lemon", "ocean", "robot", "smile", "cloud",
  "green", "house", "table", "chair", "story", "magic", "candy", "pizza",
  "number", "school", "friend", "animal", "garden", "orange", "purple",
  "yellow", "planet", "rocket", "dragon", "jungle", "castle", "flower",
  "summer", "winter", "family", "sister", "monkey", "rabbit", "pencil",
  // harder / longer words
  "monster", "picture", "kitchen", "rainbow", "dolphin", "penguin",
  "library", "birthday", "favorite", "sandwich", "umbrella", "treasure",
  "mountain", "computer", "dinosaur", "elephant", "kangaroo", "crocodile",
  "butterfly", "chocolate", "beautiful", "adventure", "wonderful",
  "fantastic", "strawberry", "vegetable", "telephone", "basketball",
];

// A small fallback set of easy common words so the game is always playable,
// even at the very start when almost no letters have been learned yet.
const FALLBACK = [
  "as", "at", "it", "up", "go", "yes", "the", "and", "you", "cat",
  "dog", "sun", "fun", "run", "top", "big", "red", "toy",
];

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
