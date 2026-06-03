import { test, assert, assertEqual } from "./harness.js";
import { speedStars } from "../js/typing.js";
import { SPEED_TIERS, getTier, tierIndex, nextTier } from "../js/speedlevels.js";

test("there are 5 speed tiers with unique ids", () => {
  assertEqual(SPEED_TIERS.length, 5);
  const ids = SPEED_TIERS.map((t) => t.id);
  assertEqual(new Set(ids).size, 5, "duplicate tier id");
});

test("tier target WPM strictly increases", () => {
  for (let i = 1; i < SPEED_TIERS.length; i++) {
    assert(
      SPEED_TIERS[i].targetWpm > SPEED_TIERS[i - 1].targetWpm,
      `${SPEED_TIERS[i].id} target should be faster than the previous tier`
    );
  }
});

test("keyboard guide shows for the first three tiers, hidden after", () => {
  assertEqual(SPEED_TIERS[0].showKeyboard, true);
  assertEqual(SPEED_TIERS[1].showKeyboard, true);
  assertEqual(SPEED_TIERS[2].showKeyboard, true);
  assertEqual(SPEED_TIERS[3].showKeyboard, false);
  assertEqual(SPEED_TIERS[4].showKeyboard, false);
});

test("every passage is non-empty lowercase a–z + spaces only", () => {
  for (const tier of SPEED_TIERS) {
    assert(tier.passages.length > 0, `${tier.id} has no passages`);
    for (const p of tier.passages) {
      assert(/^[a-z ]+$/.test(p), `${tier.id} passage has non a–z/space: "${p}"`);
    }
  }
});

test("getTier / tierIndex / nextTier navigate the tiers", () => {
  assertEqual(getTier("beginner").id, "beginner");
  assertEqual(tierIndex("beginner"), 0);
  assertEqual(getTier("nope"), null);
  assertEqual(nextTier("beginner").id, "amateur");
  assertEqual(nextTier("expert"), null);
});

test("speedStars: reaching the target passes (2 stars), well above gives 3", () => {
  assertEqual(speedStars(20, 95, 20), 2, "exactly at target -> 2 stars (pass)");
  assertEqual(speedStars(25, 95, 20), 3, "25 >= 20*1.25 -> 3 stars");
  assertEqual(speedStars(15, 95, 20), 1, "below target -> 1 star");
});

test("speedStars: sloppy typing can't earn more than 1 star", () => {
  // fast but inaccurate -> capped at 1 star
  assertEqual(speedStars(40, 70, 20), 1, "accuracy below 80% caps at 1 star");
});
