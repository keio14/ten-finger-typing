import { test, assert, assertEqual } from "./harness.js";
import { computeStars, isUnlocked, firstIncompleteLessonId, courseProgress, lessonText, practiceKeys } from "../js/lessons.js";
import { allLessons } from "../js/curriculum.js";

// A fake store: maps id -> {completed}. getLesson mirrors the real Storage interface.
function fakeStore(completedMap = {}) {
  return {
    _d: Object.fromEntries(
      Object.keys(completedMap).map((k) => [k, { completed: completedMap[k], stars: 1, bestWpm: 0, bestAccuracy: 0 }])
    ),
    getLesson(id) { return this._d[id] || null; },
  };
}

const PASS = { minAccuracy: 0.9, minWpm: 8 };

test("computeStars: 0 stars when below either threshold", () => {
  assertEqual(computeStars({ accuracy: 0.8, wpm: 20 }, PASS), 0);
  assertEqual(computeStars({ accuracy: 0.95, wpm: 5 }, PASS), 0);
});

test("computeStars: 1, 2, and 3 star tiers", () => {
  assertEqual(computeStars({ accuracy: 0.92, wpm: 10 }, PASS), 1);
  assertEqual(computeStars({ accuracy: 0.96, wpm: 10 }, PASS), 2);
  assertEqual(computeStars({ accuracy: 0.99, wpm: 12 }, PASS), 3); // wpm >= 8*1.5
  assertEqual(computeStars({ accuracy: 0.99, wpm: 11 }, PASS), 2); // wpm below 3-star bar
});

test("isUnlocked: first lesson is always unlocked; later needs previous completed", () => {
  const list = allLessons();
  const none = fakeStore({});
  assertEqual(isUnlocked(none, list[0].id), true);
  assertEqual(isUnlocked(none, list[1].id), false);
  const first = fakeStore({ [list[0].id]: true });
  assertEqual(isUnlocked(first, list[1].id), true);
  assertEqual(isUnlocked(none, "unknown-id"), false);
});

test("firstIncompleteLessonId walks the ladder", () => {
  const list = allLessons();
  assertEqual(firstIncompleteLessonId(fakeStore({})), list[0].id);
  assertEqual(firstIncompleteLessonId(fakeStore({ [list[0].id]: true })), list[1].id);
});

test("courseProgress counts completed lessons within a course", () => {
  const beginner = allLessons().filter((l) => l.courseId === "beginner");
  const p = courseProgress(fakeStore({ [beginner[0].id]: true, [beginner[1].id]: true }), "beginner");
  assertEqual(p.total, beginner.length);
  assertEqual(p.done, 2);
});

test("lessonText returns content, or generates a drill from newKeys", () => {
  assertEqual(lessonText({ content: "abc" }), "abc");
  const gen = lessonText({ newKeys: ["f", "j"] });
  assert(gen.includes("fff") && gen.includes("jjj"), "generated drill repeats the keys");
});

test("practiceKeys: home-row fallback when little is unlocked", () => {
  const keys = practiceKeys(fakeStore({}));
  assert(keys.length >= 3, "fallback provides several keys");
  assert(keys.includes("f") && keys.includes("j"), "includes home anchors");
});

test("practiceKeys: includes keys from unlocked lessons and excludes punctuation", () => {
  // completing the first few home-row lessons unlocks through home-asemi
  const keys = practiceKeys(fakeStore({ "home-fj": true, "home-dk": true, "home-sl": true }));
  assert(keys.includes("s") && keys.includes("l"), "includes unlocked keys");
  assert(!keys.includes(";"), "punctuation filtered out");
});
