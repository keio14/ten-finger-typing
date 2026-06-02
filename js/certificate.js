// js/certificate.js — course-completion certificate logic over the store.
import { COURSES, allLessons } from "./curriculum.js";
import { courseProgress } from "./lessons.js";

// Course ids whose every lesson is completed.
export function earnedCourseIds(store) {
  return COURSES
    .filter((c) => { const p = courseProgress(store, c.id); return p.total > 0 && p.done === p.total; })
    .map((c) => c.id);
}

// Best WPM and average best-accuracy across the course's lessons with a recorded attempt.
// (Certificates are only minted once a course is fully complete, so this covers every lesson.)
export function courseBest(store, courseId) {
  const lessons = allLessons().filter((l) => l.courseId === courseId);
  let wpm = 0, accSum = 0, n = 0;
  for (const l of lessons) {
    const p = store.getLesson(l.id);
    if (p) { wpm = Math.max(wpm, p.bestWpm); accSum += p.bestAccuracy; n += 1; }
  }
  return { wpm, accuracy: n ? accSum / n : 0 };
}

// Record certificates for newly-completed courses. dateISO is injected for testability.
// Returns the list of newly-earned course ids.
export function syncCertificates(store, dateISO) {
  const newly = [];
  for (const courseId of earnedCourseIds(store)) {
    if (!store.getCertificates().some((c) => c.courseId === courseId)) {
      const best = courseBest(store, courseId);
      store.addCertificate({ courseId, dateISO, wpm: best.wpm, accuracy: best.accuracy });
      newly.push(courseId);
    }
  }
  return newly;
}
