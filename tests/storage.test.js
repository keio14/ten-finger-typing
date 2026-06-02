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
