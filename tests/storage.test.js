import { test, assert, assertEqual } from "./harness.js";
import { Storage, DEFAULT_STATE } from "../js/storage.js";

function freshStorage() {
  localStorage.removeItem("mastertyping.v1");
  return new Storage();
}

test("Storage: fresh load returns defaults (name null, sound true)", () => {
  const s = freshStorage();
  assertEqual(s.getName(), null);
  assertEqual(s.getSettings().sound, true);
});

test("Storage: setName persists across instances", () => {
  const s = freshStorage();
  s.setName("Mia");
  const s2 = new Storage();
  assertEqual(s2.getName(), "Mia");
});

test("Storage: updateSettings merges and persists", () => {
  const s = freshStorage();
  s.updateSettings({ sound: false });
  const s2 = new Storage();
  assertEqual(s2.getSettings().sound, false);
  assertEqual(s2.getSettings().keyboardGuide, true); // untouched default
});

test("Storage: corrupt JSON resets to defaults without throwing", () => {
  localStorage.setItem("mastertyping.v1", "{not valid json");
  const s = new Storage();
  assertEqual(s.getName(), null);
  assertEqual(s.getSettings().sound, true);
});

test("Storage: missing keys are backfilled from defaults", () => {
  localStorage.setItem("mastertyping.v1", JSON.stringify({ name: "Ada" }));
  const s = new Storage();
  assertEqual(s.getName(), "Ada");
  assert(Array.isArray(s.state.tests), "tests array should be backfilled");
  assert(typeof s.state.game.highScore === "number", "game.highScore backfilled");
});

test("Storage: recordLessonResult stores best values and marks completion", () => {
  const s = freshStorage();
  s.recordLessonResult("home-fj", { wpm: 12, accuracy: 0.9, stars: 1 });
  let p = s.getLesson("home-fj");
  assertEqual(p.completed, true);
  assertEqual(p.stars, 1);
  assertEqual(p.bestWpm, 12);
  // a worse later attempt must not lower bests or un-complete
  s.recordLessonResult("home-fj", { wpm: 5, accuracy: 0.5, stars: 0 });
  p = s.getLesson("home-fj");
  assertEqual(p.bestWpm, 12);
  assertEqual(p.stars, 1);
  assertEqual(p.completed, true);
});

test("Storage: a failing first attempt (0 stars) does not mark completed", () => {
  const s = freshStorage();
  s.recordLessonResult("top-ei", { wpm: 4, accuracy: 0.5, stars: 0 });
  assertEqual(s.getLesson("top-ei").completed, false);
});

test("Storage: getLesson returns null for an unknown lesson", () => {
  const s = freshStorage();
  assertEqual(s.getLesson("nope"), null);
});

test("Storage: lesson progress persists across instances", () => {
  const s = freshStorage();
  s.recordLessonResult("home-dk", { wpm: 20, accuracy: 0.97, stars: 2 });
  const s2 = new Storage();
  assertEqual(s2.getLesson("home-dk").stars, 2);
});

test("Storage: addTest stores newest-first and getTests returns them", () => {
  const s = freshStorage();
  s.addTest({ durationSec: 60, wpm: 20, accuracy: 0.9 });
  s.addTest({ durationSec: 60, wpm: 30, accuracy: 0.95 });
  const tests = s.getTests();
  assertEqual(tests.length, 2);
  assertEqual(tests[0].wpm, 30); // newest first
  assert(typeof tests[0].dateISO === "string", "records a date");
});

test("Storage: bestTest returns the highest-wpm result, or null when empty", () => {
  const s = freshStorage();
  assertEqual(s.bestTest(), null);
  s.addTest({ durationSec: 60, wpm: 20, accuracy: 0.9 });
  s.addTest({ durationSec: 180, wpm: 45, accuracy: 0.92 });
  s.addTest({ durationSec: 60, wpm: 33, accuracy: 0.99 });
  assertEqual(s.bestTest().wpm, 45);
});

test("Storage: test history is capped at 20 entries", () => {
  const s = freshStorage();
  for (let i = 0; i < 25; i++) s.addTest({ durationSec: 60, wpm: i, accuracy: 0.9 });
  assertEqual(s.getTests().length, 20);
  assertEqual(s.getTests()[0].wpm, 24); // newest kept
});

test("Storage: tests persist across instances", () => {
  const s = freshStorage();
  s.addTest({ durationSec: 60, wpm: 25, accuracy: 0.9 });
  assertEqual(new Storage().getTests().length, 1);
});

test("Storage: recordGame keeps the max high score and best level", () => {
  const s = freshStorage();
  s.recordGame({ score: 30, level: 3 });
  s.recordGame({ score: 12, level: 5 });
  assertEqual(s.getGame().highScore, 30);
  assertEqual(s.getGame().bestLevel, 5);
});

test("Storage: addAchievement is deduped and persists", () => {
  const s = freshStorage();
  assertEqual(s.addAchievement("first-lesson"), true);
  assertEqual(s.addAchievement("first-lesson"), false); // already earned
  assertEqual(s.getAchievements().length, 1);
  assertEqual(new Storage().getAchievements()[0], "first-lesson");
});

test("Storage: addCertificate is one-per-course and persists", () => {
  const s = freshStorage();
  assertEqual(s.addCertificate({ courseId: "beginner", dateISO: "2026-01-01", wpm: 20, accuracy: 0.95 }), true);
  assertEqual(s.addCertificate({ courseId: "beginner", dateISO: "2026-02-02", wpm: 99, accuracy: 1 }), false);
  assertEqual(s.getCertificates().length, 1);
  assertEqual(new Storage().getCertificates()[0].wpm, 20);
});
