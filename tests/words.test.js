import { test, assert } from "./harness.js";
import { wordsFor, WORD_BANK } from "../js/words.js";

const ALL = "abcdefghijklmnopqrstuvwxyz".split("");
const HOME_ROW = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];

test("wordsFor with the whole alphabet returns many words", () => {
  const pool = wordsFor(ALL);
  assert(pool.length > 10, `expected a rich pool, got ${pool.length}`);
});

test("wordsFor with full alphabet only returns bank words", () => {
  const pool = wordsFor(ALL);
  for (const w of pool) assert(WORD_BANK.includes(w), `${w} not in bank`);
});

test("wordsFor with home-row letters only yields home-row-typeable words", () => {
  const set = new Set(HOME_ROW);
  const pool = wordsFor(HOME_ROW);
  assert(pool.length > 0, "home row should have words");
  for (const w of pool) {
    for (const ch of w) assert(set.has(ch), `"${w}" uses non-home-row letter "${ch}"`);
  }
});

test("wordsFor with almost no letters still returns a playable fallback", () => {
  const pool = wordsFor(["f", "j"]); // basically no real words
  assert(pool.length >= 5, `fallback should keep the game playable, got ${pool.length}`);
});

test("every bank word is lowercase a–z", () => {
  for (const w of WORD_BANK) assert(/^[a-z]+$/.test(w), `"${w}" is not plain a–z`);
});
