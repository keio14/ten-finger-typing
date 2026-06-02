import { test, assert, assertEqual } from "./harness.js";
import { audio } from "../js/audio.js";

test("audio: muted play() is a no-op and returns false", () => {
  audio.setMuted(true);
  assertEqual(audio.isMuted(), true);
  assertEqual(audio.play("key"), false);
});

test("audio: unmuted play() of a known sound returns true (does not throw)", () => {
  audio.setMuted(false);
  assertEqual(audio.isMuted(), false);
  const r = audio.play("lessonComplete");
  assert(r === true, "play should report it attempted to sound");
});

test("audio: unknown sound name returns false", () => {
  audio.setMuted(false);
  assertEqual(audio.play("does-not-exist"), false);
});
