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
