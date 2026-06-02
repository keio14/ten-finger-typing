import { test, assert } from "./harness.js";
import { confetti, celebrateLesson } from "../js/celebrate.js";
import { audio } from "../js/audio.js";

test("confetti: appends a canvas overlay and returns it", () => {
  const c = confetti(60);
  assert(c && c.tagName === "CANVAS", "returns a canvas element");
  assert(c.classList.contains("confetti-canvas"), "has the overlay class");
  assert(document.body.contains(c), "attached to the document");
});

test("celebrateLesson: returns a confetti canvas without throwing (muted)", () => {
  audio.setMuted(true);            // avoid making noise during tests
  const c = celebrateLesson(60);
  assert(c && c.tagName === "CANVAS", "returns a canvas element");
});
