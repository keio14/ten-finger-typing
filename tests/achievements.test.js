import { test, assert, assertEqual } from "./harness.js";
import { evaluate, syncAchievements, achievementById, ACHIEVEMENTS } from "../js/achievements.js";
import { Storage } from "../js/storage.js";
import { allLessons } from "../js/curriculum.js";

function freshStore() { localStorage.removeItem("mastertyping.v1"); return new Storage(); }

test("achievements: fresh store has none earned", () => {
  assertEqual(evaluate(freshStore()).length, 0);
});

test("achievements: completing a lesson earns first-lesson", () => {
  const s = freshStore();
  s.recordLessonResult(allLessons()[0].id, { wpm: 10, accuracy: 0.95, stars: 2 });
  assert(evaluate(s).some((a) => a.id === "first-lesson"), "first-lesson earned");
});

test("achievements: a 20+ WPM test earns speedy", () => {
  const s = freshStore();
  s.addTest({ durationSec: 60, wpm: 25, accuracy: 0.9 });
  assert(evaluate(s).some((a) => a.id === "speedy"), "speedy earned");
});

test("achievements: syncAchievements persists and is idempotent", () => {
  const s = freshStore();
  s.recordLessonResult(allLessons()[0].id, { wpm: 10, accuracy: 0.95, stars: 2 });
  const newly = syncAchievements(s);
  assert(newly.includes("first-lesson"), "newly includes first-lesson");
  assertEqual(syncAchievements(s).length, 0, "second sync earns nothing new");
  assert(s.getAchievements().includes("first-lesson"), "persisted");
});

test("achievementById resolves and every achievement has icon+label", () => {
  assertEqual(achievementById("speedy").icon, "⚡");
  assertEqual(achievementById("nope"), null);
  for (const a of ACHIEVEMENTS) { assert(a.icon && a.label && typeof a.earned === "function", a.id + " well-formed"); }
});
