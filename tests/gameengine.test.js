import { test, assert, assertEqual } from "./harness.js";
import { createGame, spawn, update, handleKey, fallSpeed, spawnInterval, accuracy, wpm, HEIGHT } from "../js/gameengine.js";

test("createGame: sensible defaults + pool fallback", () => {
  const g = createGame({ pool: [] });
  assertEqual(g.status, "playing");
  assertEqual(g.lives, 3);
  assertEqual(g.level, 1);
  assert(g.pool.length > 0, "falls back to a non-empty pool");
});

test("spawn: adds a letter from the pool using rng", () => {
  const g = createGame({ pool: ["a", "b"], rng: () => 0 });
  spawn(g);
  assertEqual(g.letters.length, 1);
  assertEqual(g.letters[0].ch, "a"); // index 0
  assertEqual(g.letters[0].y, 0);
});

test("update: letters fall and a floored letter costs a life", () => {
  const g = createGame({ pool: ["a"], rng: () => 0, lives: 2 });
  g.letters = [{ ch: "a", x: 0.5, y: HEIGHT - 1 }];
  g.spawnTimer = 0;
  update(g, 0.1); // moves well past the floor
  assertEqual(g.lives, 1);
  assertEqual(g.letters.length, 0);
  assertEqual(g.status, "playing");
});

test("update: losing the last life ends the game", () => {
  const g = createGame({ pool: ["a"], rng: () => 0, lives: 1 });
  g.letters = [{ ch: "a", x: 0.5, y: HEIGHT + 5 }];
  update(g, 0.016);
  assertEqual(g.status, "over");
});

test("handleKey: clears the lowest matching letter and scores", () => {
  const g = createGame({ pool: ["a"], rng: () => 0 });
  g.letters = [{ ch: "a", x: 0, y: 100 }, { ch: "a", x: 0, y: 300 }];
  handleKey(g, "a");
  assertEqual(g.letters.length, 1);
  assertEqual(g.letters[0].y, 100); // the lower (y=300) one was cleared
  assertEqual(g.score, 1);
  assertEqual(g.cleared, 1);
});

test("handleKey: a non-matching key counts a mistake", () => {
  const g = createGame({ pool: ["a"], rng: () => 0 });
  g.letters = [{ ch: "a", x: 0, y: 100 }];
  handleKey(g, "z");
  assertEqual(g.mistakes, 1);
  assertEqual(g.score, 0);
  assertEqual(g.letters.length, 1);
});

test("handleKey: level rises every 10 cleared", () => {
  const g = createGame({ pool: ["a"], rng: () => 0 });
  for (let i = 0; i < 10; i++) { g.letters = [{ ch: "a", x: 0, y: 10 }]; handleKey(g, "a"); }
  assertEqual(g.level, 2);
});

test("fallSpeed and spawnInterval scale with level", () => {
  assert(fallSpeed(5) > fallSpeed(1), "faster at higher level");
  assert(spawnInterval(5) < spawnInterval(1), "more frequent at higher level");
});

test("accuracy and wpm", () => {
  const g = createGame({ pool: ["a"], rng: () => 0 });
  g.typed = 10; g.mistakes = 2;
  assert(Math.abs(accuracy(g) - 0.8) < 1e-9, "accuracy 0.8");
  g.cleared = 10; g.elapsed = 60;
  assertEqual(wpm(g), 2); // 10/5 over 1 minute
});
