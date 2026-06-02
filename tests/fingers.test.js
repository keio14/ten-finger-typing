import { test, assert, assertEqual } from "./harness.js";
import { fingerFor, colorFor, FINGERS } from "../js/fingers.js";

test("fingerFor: home keys map to index fingers", () => {
  assertEqual(fingerFor("f").id, "L-index");
  assertEqual(fingerFor("j").id, "R-index");
});

test("fingerFor: pinkies own the outer keys", () => {
  assertEqual(fingerFor("a").id, "L-pinky");
  assertEqual(fingerFor(";").id, "R-pinky");
});

test("fingerFor: space is a thumb", () => {
  assertEqual(fingerFor(" ").id, "thumb");
});

test("fingerFor: unknown key returns null", () => {
  assertEqual(fingerFor("£"), null);
});

test("colorFor: every letter a–z has a finger color", () => {
  for (let c = 97; c <= 122; c++) {
    const ch = String.fromCharCode(c);
    assert(typeof colorFor(ch) === "string" && colorFor(ch)[0] === "#", `no color for ${ch}`);
  }
});

test("FINGERS has all ten finger groups", () => {
  // 8 fingers + thumb entry = 9 keys (pinkies/rings/middles share colors, not ids)
  assertEqual(Object.keys(FINGERS).length, 9);
});
