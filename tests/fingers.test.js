import { test, assert, assertEqual } from "./harness.js";
import { fingerFor, FINGER_LABELS } from "../js/fingers.js";

test("fingerFor: home-row anchors map to index fingers", () => {
  assertEqual(fingerFor("f").finger, "l-index");
  assertEqual(fingerFor("j").finger, "r-index");
});

test("fingerFor: pinky keys", () => {
  assertEqual(fingerFor("a").finger, "l-pinky");
  assertEqual(fingerFor(";").finger, "r-pinky");
});

test("fingerFor: space is a thumb", () => {
  assertEqual(fingerFor(" ").finger, "thumb");
});

test("fingerFor: uppercase maps to same finger as lowercase", () => {
  assertEqual(fingerFor("F").finger, fingerFor("f").finger);
});

test("fingerFor: every finger has a color and a human label", () => {
  const f = fingerFor("d");
  assert(/^#/.test(f.color), "color should be a hex string");
  assert(typeof FINGER_LABELS[f.finger] === "string", "finger has a label");
});

test("fingerFor: unknown key returns null", () => {
  assertEqual(fingerFor("\t"), null);
});
