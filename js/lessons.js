// js/lessons.js — lesson domain logic built on curriculum data + the storage interface.
import { allLessons } from "./curriculum.js";

// Stars from an attempt against a course pass threshold.
//  0 = did not pass; 1 = passed; 2 = high accuracy; 3 = high accuracy AND speed.
export function computeStars(result, pass) {
  const { accuracy, wpm } = result;
  if (accuracy < pass.minAccuracy || wpm < pass.minWpm) return 0;
  let stars = 1;
  if (accuracy >= 0.95) stars = 2;
  if (accuracy >= 0.98 && wpm >= pass.minWpm * 1.5) stars = 3;
  return stars;
}

// A lesson is unlocked if it is the first lesson, or the lesson before it is completed.
export function isUnlocked(store, id) {
  const list = allLessons();
  const i = list.findIndex((l) => l.id === id);
  if (i < 0) return false;
  if (i === 0) return true;
  const prev = store.getLesson(list[i - 1].id);
  return !!(prev && prev.completed);
}

// The first lesson the learner has not completed (where "Continue" should go), or null if all done.
export function firstIncompleteLessonId(store) {
  for (const l of allLessons()) {
    const p = store.getLesson(l.id);
    if (!p || !p.completed) return l.id;
  }
  return null;
}

// { total, done } completed-lesson counts for one course.
export function courseProgress(store, courseId) {
  const lessons = allLessons().filter((l) => l.courseId === courseId);
  const done = lessons.filter((l) => {
    const p = store.getLesson(l.id);
    return p && p.completed;
  }).length;
  return { total: lessons.length, done };
}

// Text the learner types: explicit content, else a deterministic drill from the new keys.
export function lessonText(lesson) {
  if (lesson.content) return lesson.content;
  const keys = lesson.newKeys || [];
  if (!keys.length) return "";
  const triples = keys.map((k) => k.repeat(3)).join(" ");
  const pairs = keys.map((k, i) => k + keys[(i + 1) % keys.length]).join(" ");
  return `${triples} ${pairs}`;
}

// Single-character keys (a-z / 0-9) from all currently-unlocked lessons.
// Falls back to the home row when the learner has barely started.
export function practiceKeys(store) {
  const keys = new Set();
  for (const l of allLessons()) {
    if (isUnlocked(store, l.id)) {
      for (const k of l.newKeys || []) keys.add(k);
    }
  }
  const filtered = [...keys].filter((k) => /^[a-z0-9]$/.test(k));
  return filtered.length >= 3 ? filtered : ["f", "j", "d", "k", "s", "l", "a"];
}
