# Typing Platform — Phase 4 (Falling-Letters Game) Plan

> Executed via superpowers:subagent-driven-development. Full verbatim code lives in the per-task implementer dispatches; this doc is the design record + task list.

**Goal:** A falling-letters arcade game whose letter pool is drawn from the keys the learner has unlocked; type a letter to clear it, missed letters cost a life, speed ramps each level, and the high score is saved.

**Architecture:** Pure game logic in `gameengine.js` (state machine: spawn / update(dt) / handleKey, rng-injectable, no DOM) mirrors the engine/view split used elsewhere — fully unit-testable. `views/game.js` wraps it with a Canvas + `requestAnimationFrame` loop and a `keydown` listener. The letter pool comes from `practiceKeys(store)` (keys from unlocked lessons, home-row fallback). High score persists via `storage.recordGame`.

**Tech stack:** unchanged; Canvas 2D for rendering.

## Files
- `js/lessons.js` (MODIFY): `practiceKeys(store)` → unlocked lessons' single-char keys (a-z/0-9), home-row fallback when sparse.
- `js/storage.js` (MODIFY): `getGame()`, `recordGame({score,level})` (max highScore/bestLevel).
- `js/gameengine.js` (NEW): `createGame`, `spawn`, `update`, `handleKey`, `fallSpeed`, `spawnInterval`, `accuracy`, `wpm`.
- `js/views/game.js` (NEW): start → canvas loop → game over; route `/game`.
- `js/app.js` (MODIFY): route `/game`. `index.html` (MODIFY): Game nav link. `styles/main.css` (MODIFY): canvas frame.
- Tests: `tests/gameengine.test.js`, additions to `tests/lessons.test.js` + `tests/storage.test.js`, register in `tests/run-tests.html`.

## Tasks
1. **Game logic** — `practiceKeys`, `recordGame`/`getGame`, `gameengine.js`, all unit tests. Controller verifies via direct import.
2. **Game view + routing** — `views/game.js` (canvas + rAF + keydown + HUD + start/over screens), route, nav, styles. Controller verifies in browser (drive the engine via the view's keydown; confirm clear/miss/level/lives/gameover/highscore).
3. **Verify + review + tag** — full suite, e2e, console clean, independent review, tag `phase-4-game`.

## Key signatures
- `practiceKeys(store)` → `string[]` (filtered to `/^[a-z0-9]$/`; home-row set when < 3).
- `createGame({pool, level?, lives?, rng?})` → state `{pool,rng,status,score,lives,level,cleared,mistakes,typed,letters,spawnTimer,elapsed}`; letters `{ch, x(0..1), y(px, 0=top)}`; floor at `HEIGHT=600`.
- `update(state, dt)` moves letters by `fallSpeed(level)`, spawns per `spawnInterval(level)`, floor hit → `lives--` (0 → status "over").
- `handleKey(state, key)` clears the lowest matching letter (score/cleared++, level up every 10) else `mistakes++`.
- `recordGame({score,level})` keeps max highScore/bestLevel.

## Verification
Full harness green; in-browser: start game, letters fall and spawn, typing a present letter clears the lowest match and scores, a missed letter at the floor costs a life, lives→0 ends the game and saves `game.highScore`, console clean.
