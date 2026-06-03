// typing.js — pure helpers for scoring a typing session.
// Kept separate from the DOM so it can be unit-tested directly.

// accuracy as a 0–100 percentage. No keystrokes yet -> 100 (nothing wrong).
export function accuracyPct(correct, total) {
  if (total <= 0) return 100;
  return Math.round((correct / total) * 100);
}

// Words-per-minute. One "word" = 5 characters, the standard convention.
// correctChars typed over elapsedMs. Guard against divide-by-zero.
export function wpm(correctChars, elapsedMs) {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round(correctChars / 5 / minutes);
}

// True if a keydown is a single printable character (or space) with no modifier.
export function isTypingKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  return e.key.length === 1 || e.key === " ";
}

// Stars 1–3 from accuracy vs the lesson's target.
//  >= target+8  -> 3 stars
//  >= target    -> 2 stars
//  below target -> 1 star (still completed, just keep practicing)
export function starsFor(accuracy, target) {
  if (accuracy >= target + 8) return 3;
  if (accuracy >= target) return 2;
  return 1;
}

// Stars 1–3 for a SPEED tier, based on words-per-minute vs the tier target.
// Accuracy must stay reasonable, so sloppy fast typing can't earn the top
// stars (you can't race past the target by mashing keys).
//  - accuracy below 80%        -> 1 star (slow down, type cleanly first)
//  - wpm >= target * 1.25      -> 3 stars (comfortably above the target)
//  - wpm >= target             -> 2 stars (reached the target -> tier passed)
//  - otherwise                 -> 1 star (keep practicing to get faster)
export function speedStars(achievedWpm, accuracy, targetWpm) {
  if (accuracy < 80) return 1;
  if (achievedWpm >= targetWpm * 1.25) return 3;
  if (achievedWpm >= targetWpm) return 2;
  return 1;
}
