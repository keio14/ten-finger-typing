import { test, assert, assertEqual } from "./harness.js";
import {
  LESSONS,
  getLesson,
  nextLesson,
  lessonIndex,
  lettersLearnedThrough,
} from "../js/curriculum.js";
import { fingerFor } from "../js/fingers.js";

test("every lesson has a unique id", () => {
  const ids = LESSONS.map((l) => l.id);
  assertEqual(new Set(ids).size, ids.length, "duplicate lesson id");
});

test("every lesson has drills and a target accuracy", () => {
  for (const l of LESSONS) {
    assert(Array.isArray(l.drills) && l.drills.length > 0, `${l.id} has no drills`);
    assert(l.targetAccuracy > 0 && l.targetAccuracy <= 100, `${l.id} bad target`);
  }
});

test("every character in every drill is a typeable key", () => {
  for (const l of LESSONS) {
    for (const ch of l.drills.join("")) {
      assert(fingerFor(ch) !== null, `${l.id} uses untypeable char "${ch}"`);
    }
  }
});

test("getLesson / lessonIndex find lessons", () => {
  assertEqual(getLesson("home-fj").id, "home-fj");
  assertEqual(lessonIndex("home-fj"), 0);
  assertEqual(getLesson("nope"), null);
});

test("nextLesson chains forward and stops at the end", () => {
  assertEqual(nextLesson(LESSONS[0].id).id, LESSONS[1].id);
  assertEqual(nextLesson(LESSONS[LESSONS.length - 1].id), null);
});

test("lettersLearnedThrough grows as you progress", () => {
  const first = lettersLearnedThrough("home-fj");
  const later = lettersLearnedThrough("words-mix");
  assert(first.includes("f") && first.includes("j"), "first lesson should teach f and j");
  assert(later.length >= first.length, "later should know at least as many letters");
});
