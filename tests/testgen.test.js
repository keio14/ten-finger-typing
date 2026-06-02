import { test, assert, assertEqual } from "./harness.js";
import { testText } from "../js/testgen.js";

test("testText: returns the requested number of words", () => {
  const t = testText(10, () => 0);
  assertEqual(t.split(" ").length, 10);
});

test("testText: rng selects words deterministically", () => {
  const t = testText(3, () => 0); // index 0 every time -> "the the the"
  assertEqual(t, "the the the");
});

test("testText: produces a non-empty string for the default count", () => {
  const t = testText();
  assert(t.length > 0 && t.split(" ").length === 60, "60 words by default");
});
