import { test, assert, assertEqual } from "./harness.js";
import { earnedCourseIds, courseBest, syncCertificates } from "../js/certificate.js";
import { Storage } from "../js/storage.js";
import { allLessons } from "../js/curriculum.js";

function freshStore() { localStorage.removeItem("mastertyping.v1"); return new Storage(); }
function completeCourse(store, courseId) {
  for (const l of allLessons().filter((l) => l.courseId === courseId)) {
    store.recordLessonResult(l.id, { wpm: 20, accuracy: 0.96, stars: 2 });
  }
}

test("earnedCourseIds: none until a course is fully complete", () => {
  const s = freshStore();
  assertEqual(earnedCourseIds(s).length, 0);
  completeCourse(s, "beginner");
  assert(earnedCourseIds(s).includes("beginner"), "beginner earned once complete");
});

test("courseBest: max wpm + average accuracy across completed lessons", () => {
  const s = freshStore();
  completeCourse(s, "beginner");
  const b = courseBest(s, "beginner");
  assertEqual(b.wpm, 20);
  assert(Math.abs(b.accuracy - 0.96) < 1e-9, "average accuracy");
});

test("syncCertificates: records once per course with the given date", () => {
  const s = freshStore();
  completeCourse(s, "beginner");
  const newly = syncCertificates(s, "2026-06-02T00:00:00.000Z");
  assert(newly.includes("beginner"), "beginner certificate earned");
  assertEqual(syncCertificates(s, "2026-06-02T00:00:00.000Z").length, 0, "no duplicate");
  const cert = s.getCertificates().find((c) => c.courseId === "beginner");
  assertEqual(cert.dateISO, "2026-06-02T00:00:00.000Z");
  assertEqual(cert.wpm, 20);
});
