import { test, assert, assertEqual } from "./harness.js";
import { COURSES, allLessons, lessonById, courseOfLesson, nextLessonId, isLastInCourse } from "../js/curriculum.js";

test("curriculum: has three courses in order", () => {
  assertEqual(COURSES.length, 3);
  assertEqual(COURSES[0].id, "beginner");
  assertEqual(COURSES[2].id, "advanced");
});

test("curriculum: allLessons is a flat ordered list, each with id + courseId", () => {
  const list = allLessons();
  assert(list.length > 15, "should have many lessons");
  assertEqual(list[0].id, "home-fj");
  assert(list.every((l) => l.id && l.courseId && l.title), "each lesson has id, courseId, title");
});

test("curriculum: lesson ids are unique", () => {
  const ids = allLessons().map((l) => l.id);
  assertEqual(new Set(ids).size, ids.length);
});

test("curriculum: lessonById and courseOfLesson resolve correctly", () => {
  assertEqual(lessonById("home-fj").title, "F and J");
  assertEqual(courseOfLesson("home-fj").id, "beginner");
  assertEqual(lessonById("does-not-exist"), null);
});

test("curriculum: nextLessonId returns the following lesson, null at the end", () => {
  const list = allLessons();
  assertEqual(nextLessonId(list[0].id), list[1].id);
  assertEqual(nextLessonId(list[list.length - 1].id), null);
});

test("curriculum: isLastInCourse marks the final lesson of a course", () => {
  assertEqual(isLastInCourse("num-mix"), true);   // last Beginner lesson
  assertEqual(isLastInCourse("home-fj"), false);
});

test("curriculum: every course has a pass threshold", () => {
  for (const c of COURSES) {
    assert(typeof c.pass.minAccuracy === "number", c.id + " has minAccuracy");
    assert(typeof c.pass.minWpm === "number", c.id + " has minWpm");
  }
});
