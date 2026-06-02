// gamelogic.js — PURE game math for the falling-letters game.
// No DOM, no canvas, no requestAnimationFrame, no randomness baked in.
// Everything here is a plain function so it can be unit-tested in isolation.
//
// Units: positions in pixels, speed in pixels-per-second, time in seconds (dt),
// spawn interval in seconds. A "letter" is { id, char, x, y }.

export const HITS_PER_LEVEL = 8; // clear this many letters to advance a level
export const START_HEARTS = 3;

// Fall speed grows gently with level. Level 1 is slow enough for a beginner.
export function speedForLevel(level) {
  return 55 + (level - 1) * 18; // px/s: L1=55, L2=73, L3=91 ...
}

// Time between spawns shrinks with level but never gets frantic.
export function spawnIntervalForLevel(level) {
  return Math.max(0.7, 1.8 - (level - 1) * 0.15); // seconds
}

// Level is derived from how many letters have been cleared (score = clears).
export function levelForScore(score) {
  return Math.floor(score / HITS_PER_LEVEL) + 1;
}

// Move every letter down by speed * dt. Returns a NEW array (no mutation).
export function advance(letters, dt, fallSpeed) {
  const dy = fallSpeed * dt;
  return letters.map((l) => ({ ...l, y: l.y + dy }));
}

// Letters whose vertical position has crossed the bottom edge.
export function findMisses(letters, canvasHeight) {
  return letters.filter((l) => l.y >= canvasHeight);
}

// Letters still on screen (the complement of findMisses).
export function removeMisses(letters, canvasHeight) {
  return letters.filter((l) => l.y < canvasHeight);
}

// Apply a typed key. Removes the LOWEST (closest to bottom) matching letter,
// so the most urgent letter clears first. Returns:
//   { hit: bool, letters: newArray, gained: 0|1 }
export function applyHit(letters, char) {
  let targetIdx = -1;
  let lowestY = -Infinity;
  for (let i = 0; i < letters.length; i++) {
    if (letters[i].char === char && letters[i].y > lowestY) {
      lowestY = letters[i].y;
      targetIdx = i;
    }
  }
  if (targetIdx === -1) return { hit: false, letters, gained: 0 };
  const next = letters.slice();
  next.splice(targetIdx, 1);
  return { hit: true, letters: next, gained: 1 };
}

export function loseHeart(hearts) {
  return Math.max(0, hearts - 1);
}

export function isGameOver(hearts) {
  return hearts <= 0;
}
