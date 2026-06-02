import { test, assertEqual, assertClose, assert } from "./harness.js";
import { Stats, TextSession } from "../js/engine.js";

test("Stats.wpm: 50 correct chars in 60s = 10 wpm", () => {
  assertEqual(Stats.wpm(50, 60000), 10); // (50/5) / 1min
});

test("Stats.wpm: 0 elapsed returns 0 (no divide-by-zero)", () => {
  assertEqual(Stats.wpm(10, 0), 0);
});

test("Stats.accuracy: 9 correct of 10 typed = 0.9", () => {
  assertClose(Stats.accuracy(9, 10), 0.9, 1e-9);
});

test("Stats.accuracy: nothing typed returns 1", () => {
  assertEqual(Stats.accuracy(0, 0), 1);
});

function fakeClock() {
  const c = { t: 0 };
  c.now = () => c.t;
  return c;
}

test("TextSession: correct keys advance the cursor", () => {
  const s = new TextSession("ab", {}, () => 0);
  s.handleKey("a");
  assertEqual(s.index, 1);
  assertEqual(s.nextChar, "b");
});

test("TextSession: wrong key counts an error and does NOT advance", () => {
  const s = new TextSession("ab", {}, () => 0);
  s.handleKey("z");
  assertEqual(s.index, 0);
  assertEqual(s.errors, 1);
  assertEqual(s.nextChar, "a");
});

test("TextSession: backspace steps back, not below zero", () => {
  const s = new TextSession("ab", {}, () => 0);
  s.handleKey("a");          // index 1
  s.handleKey("Backspace");  // index 0
  s.handleKey("Backspace");  // stays 0
  assertEqual(s.index, 0);
});

test("TextSession: non-printable keys are ignored", () => {
  const s = new TextSession("ab", {}, () => 0);
  s.handleKey("Shift");
  s.handleKey("Enter");
  assertEqual(s.index, 0);
  assertEqual(s.totalTyped, 0);
});

test("TextSession: onComplete fires once with final stats", () => {
  const clock = fakeClock();
  let done = null;
  const s = new TextSession("ab", { onComplete: (st) => { done = st; } }, clock.now);
  s.handleKey("a");          // starts timer at t=0
  clock.t = 30000;           // 30s later
  s.handleKey("b");          // completes
  assert(done !== null, "onComplete should fire");
  assertEqual(done.elapsedMs, 30000);
  assertEqual(done.index, 2);
});

test("TextSession: accuracy = correct / total typed (backspace not counted)", () => {
  const s = new TextSession("ab", {}, () => 0);
  s.handleKey("z");          // error  (typed 1, err 1)
  s.handleKey("a");          // correct(typed 2, err 1)
  s.handleKey("Backspace");  // not counted
  s.handleKey("a");          // correct(typed 3, err 1)
  s.handleKey("b");          // correct(typed 4, err 1) -> complete
  assertClose(s.stats.accuracy, 3 / 4, 1e-9);
});

test("TextSession: stats.wpm uses correct chars over elapsed time", () => {
  const clock = fakeClock();
  const s = new TextSession("aaaaaaaaaa", {}, clock.now); // 10 chars
  s.handleKey("a");          // timer starts at t=0
  for (let i = 0; i < 9; i++) s.handleKey("a");
  clock.t = 60000;           // pretend a minute passed
  // 10 correct chars / 5 = 2 "words" in 1 min => 2 wpm
  assertEqual(s.stats.wpm, 2);
});
