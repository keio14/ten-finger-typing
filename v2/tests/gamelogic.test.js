import { test, assert, assertEqual } from "./harness.js";
import {
  HITS_PER_LEVEL,
  speedForLevel,
  spawnIntervalForLevel,
  levelForScore,
  advance,
  findMisses,
  removeMisses,
  applyHit,
  loseHeart,
  isGameOver,
} from "../js/gamelogic.js";

test("speedForLevel increases with level", () => {
  assert(speedForLevel(2) > speedForLevel(1), "level 2 should be faster");
  assert(speedForLevel(5) > speedForLevel(3), "level 5 should be faster");
});

test("spawnIntervalForLevel shrinks but has a floor", () => {
  assert(spawnIntervalForLevel(2) < spawnIntervalForLevel(1), "should spawn faster");
  assert(spawnIntervalForLevel(50) >= 0.7, "should never go below the floor");
});

test("levelForScore advances every HITS_PER_LEVEL clears", () => {
  assertEqual(levelForScore(0), 1);
  assertEqual(levelForScore(HITS_PER_LEVEL - 1), 1);
  assertEqual(levelForScore(HITS_PER_LEVEL), 2);
  assertEqual(levelForScore(HITS_PER_LEVEL * 2), 3);
});

test("advance moves letters down by speed*dt without mutating", () => {
  const letters = [{ id: 1, char: "a", x: 10, y: 0 }];
  const next = advance(letters, 0.5, 100); // 50px
  assertEqual(next[0].y, 50);
  assertEqual(letters[0].y, 0, "original array must not change");
});

test("findMisses / removeMisses split at the bottom edge", () => {
  const letters = [
    { id: 1, char: "a", x: 0, y: 425 }, // crossed the 420px floor
    { id: 2, char: "b", x: 0, y: 100 },
  ];
  assertEqual(findMisses(letters, 420).length, 1);
  assertEqual(findMisses(letters, 420)[0].char, "a");
  assertEqual(removeMisses(letters, 420).length, 1);
  assertEqual(removeMisses(letters, 420)[0].char, "b");
});

test("applyHit removes the lowest matching letter and scores", () => {
  const letters = [
    { id: 1, char: "a", x: 0, y: 50 },
    { id: 2, char: "a", x: 0, y: 300 }, // lowest 'a'
    { id: 3, char: "b", x: 0, y: 200 },
  ];
  const res = applyHit(letters, "a");
  assert(res.hit, "should hit");
  assertEqual(res.gained, 1);
  assertEqual(res.letters.length, 2);
  // the y=300 'a' should be gone; the y=50 'a' remains
  assert(res.letters.some((l) => l.char === "a" && l.y === 50), "wrong 'a' removed");
  assert(!res.letters.some((l) => l.y === 300), "lowest 'a' should be cleared");
});

test("applyHit misses when no letter matches", () => {
  const letters = [{ id: 1, char: "a", x: 0, y: 50 }];
  const res = applyHit(letters, "z");
  assert(!res.hit, "should not hit");
  assertEqual(res.gained, 0);
  assertEqual(res.letters.length, 1, "nothing removed on a miss");
});

test("loseHeart never goes below zero; isGameOver at zero", () => {
  assertEqual(loseHeart(3), 2);
  assertEqual(loseHeart(0), 0);
  assert(!isGameOver(1));
  assert(isGameOver(0));
});
