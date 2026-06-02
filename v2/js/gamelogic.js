// gamelogic.js — PURE game math for the falling-WORDS game.
// No DOM, no canvas, no requestAnimationFrame, no randomness baked in.
// Everything here is a plain function so it can be unit-tested in isolation.
//
// Units: positions in pixels, speed in pixels-per-second, time in seconds (dt),
// spawn interval in seconds. A "word" is { id, text, x, y, typed } where
// `typed` is how many leading characters the player has correctly entered.

export const WORDS_PER_LEVEL = 5; // clear this many words to advance a level
export const START_HEARTS = 3;

// Fall speed grows gently with level. Level 1 is slow enough for a beginner;
// words take longer to type than single letters, so the base is gentle.
export function speedForLevel(level) {
  return 42 + (level - 1) * 15; // px/s: L1=42, L2=57, L3=72 ...
}

// Time between spawns shrinks with level but never gets frantic.
export function spawnIntervalForLevel(level) {
  return Math.max(1.2, 2.6 - (level - 1) * 0.18); // seconds
}

// Level is derived from how many words have been cleared (score = words).
export function levelForScore(score) {
  return Math.floor(score / WORDS_PER_LEVEL) + 1;
}

// Move every word down by speed * dt. Returns a NEW array (no mutation).
export function advance(words, dt, fallSpeed) {
  const dy = fallSpeed * dt;
  return words.map((w) => ({ ...w, y: w.y + dy }));
}

// Words whose vertical position has crossed the bottom edge.
export function findMisses(words, canvasHeight) {
  return words.filter((w) => w.y >= canvasHeight);
}

// Words still on screen (the complement of findMisses).
export function removeMisses(words, canvasHeight) {
  return words.filter((w) => w.y < canvasHeight);
}

// Apply a typed character using a "lock-on" model:
//   - When no word is active, a key that matches the FIRST letter of a word
//     locks that word as the active target (the lowest such word, closest to
//     the ground, so the most urgent one is chosen).
//   - While a word is active, the key must match its next expected letter to
//     advance; a non-matching key is ignored (gentle — no penalty mid-word).
//   - Completing the last letter clears the word and scores a point.
//
// Returns: { words: newArray, activeId, cleared: bool, scored: 0|1 }
// `words` is unchanged (same reference) when nothing happens.
export function applyKey(words, activeId, char) {
  let id = activeId;

  // No active word yet: try to lock onto one whose first letter matches.
  if (id == null) {
    let pick = null;
    for (const w of words) {
      if (w.text[0] === char && (pick === null || w.y > pick.y)) pick = w;
    }
    if (pick === null) return { words, activeId: null, cleared: false, scored: 0 };
    id = pick.id;
  }

  const idx = words.findIndex((w) => w.id === id);
  if (idx === -1) return { words, activeId: null, cleared: false, scored: 0 };

  const w = words[idx];
  // wrong next letter for the active word -> ignore, stay locked on
  if (char !== w.text[w.typed]) {
    return { words, activeId: id, cleared: false, scored: 0 };
  }

  const typed = w.typed + 1;
  if (typed >= w.text.length) {
    // finished the word -> clear it and release the lock
    const next = words.slice();
    next.splice(idx, 1);
    return { words: next, activeId: null, cleared: true, scored: 1 };
  }

  // advanced one letter, still typing
  const next = words.slice();
  next[idx] = { ...w, typed };
  return { words: next, activeId: id, cleared: false, scored: 0 };
}

export function loseHeart(hearts) {
  return Math.max(0, hearts - 1);
}

export function isGameOver(hearts) {
  return hearts <= 0;
}
