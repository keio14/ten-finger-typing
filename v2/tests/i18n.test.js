import { test, assert, assertEqual } from "./harness.js";
import { t, LANGUAGES, STRINGS } from "../js/i18n.js";

test("three languages are offered", () => {
  assertEqual(LANGUAGES.length, 3);
  const codes = LANGUAGES.map((l) => l.code).sort();
  assert(codes.join(",") === "en,vi,zh", `unexpected language codes: ${codes}`);
});

test("every language defines exactly the same keys as English", () => {
  const enKeys = Object.keys(STRINGS.en).sort();
  for (const code of ["zh", "vi"]) {
    const keys = Object.keys(STRINGS[code]).sort();
    assertEqual(keys.length, enKeys.length, `${code} has a different key count`);
    for (const k of enKeys) assert(k in STRINGS[code], `${code} is missing key "${k}"`);
  }
});

test("t() returns a string and interpolates params", () => {
  // default language is English when nothing is saved
  const s = t("home.bestScore", { n: 7 });
  assert(s.includes("7"), `expected the score interpolated, got "${s}"`);
});

test("t() falls back to the key itself when unknown", () => {
  assertEqual(t("nope.not.a.key"), "nope.not.a.key");
});

test("no English string is left with an un-replaced {param} placeholder after interpolation", () => {
  // nextKey uses {ch} and {finger}; both should be replaced
  const s = t("lesson.nextKey", { ch: "f", finger: "left index finger" });
  assert(!s.includes("{"), `placeholder left behind: "${s}"`);
});
