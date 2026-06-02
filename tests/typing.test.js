import { test, assertEqual } from "./harness.js";
import { accuracyPct, wpm, starsFor } from "../js/typing.js";

test("accuracyPct: nothing typed yet is 100%", () => {
  assertEqual(accuracyPct(0, 0), 100);
});

test("accuracyPct: rounds to whole percent", () => {
  assertEqual(accuracyPct(9, 10), 90);
  assertEqual(accuracyPct(2, 3), 67);
});

test("wpm: 25 correct chars in 60s = 5 wpm", () => {
  assertEqual(wpm(25, 60000), 5);
});

test("wpm: zero elapsed time is 0 (no divide by zero)", () => {
  assertEqual(wpm(10, 0), 0);
});

test("starsFor: well above target = 3 stars", () => {
  assertEqual(starsFor(98, 90), 3);
});

test("starsFor: meeting target = 2 stars", () => {
  assertEqual(starsFor(91, 90), 2);
});

test("starsFor: below target still completes with 1 star", () => {
  assertEqual(starsFor(80, 90), 1);
});
