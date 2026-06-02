import { test, assert, assertEqual } from "./harness.js";
import {
  WORDS_PER_LEVEL,
  speedForLevel,
  spawnIntervalForLevel,
  levelForScore,
  advance,
  findMisses,
  removeMisses,
  applyKey,
  loseHeart,
  isGameOver,
} from "../js/gamelogic.js";

const word = (id, text, y, typed = 0) => ({ id, text, x: 0, y, typed });

test("speedForLevel increases with level", () => {
  assert(speedForLevel(2) > speedForLevel(1), "level 2 should be faster");
  assert(speedForLevel(5) > speedForLevel(3), "level 5 should be faster");
});

test("spawnIntervalForLevel shrinks but has a floor", () => {
  assert(spawnIntervalForLevel(2) < spawnIntervalForLevel(1), "should spawn faster");
  assert(spawnIntervalForLevel(50) >= 1.2, "should never go below the floor");
});

test("levelForScore advances every WORDS_PER_LEVEL clears", () => {
  assertEqual(levelForScore(0), 1);
  assertEqual(levelForScore(WORDS_PER_LEVEL - 1), 1);
  assertEqual(levelForScore(WORDS_PER_LEVEL), 2);
  assertEqual(levelForScore(WORDS_PER_LEVEL * 2), 3);
});

test("advance moves words down by speed*dt without mutating", () => {
  const words = [word(1, "cat", 0)];
  const next = advance(words, 0.5, 100); // 50px
  assertEqual(next[0].y, 50);
  assertEqual(words[0].y, 0, "original array must not change");
});

test("findMisses / removeMisses split at the bottom edge", () => {
  const words = [word(1, "cat", 425), word(2, "dog", 100)];
  assertEqual(findMisses(words, 420).length, 1);
  assertEqual(findMisses(words, 420)[0].text, "cat");
  assertEqual(removeMisses(words, 420).length, 1);
  assertEqual(removeMisses(words, 420)[0].text, "dog");
});

test("applyKey locks onto the lowest word whose first letter matches", () => {
  const words = [word(1, "cat", 50), word(2, "cup", 300)]; // both start with c
  const res = applyKey(words, null, "c");
  assertEqual(res.activeId, 2, "should lock the lower word (cup at y=300)");
  assertEqual(res.cleared, false);
  assertEqual(res.scored, 0);
  // 'cup' should now have typed=1
  assertEqual(res.words.find((w) => w.id === 2).typed, 1);
});

test("applyKey advances the active word letter by letter", () => {
  let words = [word(1, "go", 100)];
  let r = applyKey(words, null, "g"); // lock + first letter
  assertEqual(r.activeId, 1);
  assertEqual(r.words[0].typed, 1);
  r = applyKey(r.words, r.activeId, "o"); // final letter -> clear
  assertEqual(r.cleared, true);
  assertEqual(r.scored, 1);
  assertEqual(r.words.length, 0, "completed word is removed");
  assertEqual(r.activeId, null, "lock is released after clearing");
});

test("applyKey ignores a wrong next letter while locked (no penalty)", () => {
  const words = [word(1, "cat", 100, 1)]; // already typed 'c'
  const res = applyKey(words, 1, "z"); // expected 'a'
  assertEqual(res.cleared, false);
  assertEqual(res.scored, 0);
  assertEqual(res.activeId, 1, "stays locked on the word");
  assertEqual(res.words[0].typed, 1, "typed count unchanged");
});

test("applyKey with no match and no lock does nothing", () => {
  const words = [word(1, "cat", 100)];
  const res = applyKey(words, null, "z");
  assertEqual(res.activeId, null);
  assertEqual(res.cleared, false);
  assertEqual(res.words.length, 1);
});

test("loseHeart never goes below zero; isGameOver at zero", () => {
  assertEqual(loseHeart(3), 2);
  assertEqual(loseHeart(0), 0);
  assert(!isGameOver(1));
  assert(isGameOver(0));
});
