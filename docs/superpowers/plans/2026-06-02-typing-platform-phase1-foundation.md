# Typing Platform — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared foundation for the typing platform — a typing engine, an on-screen finger-guidance keyboard, local progress storage, synthesized sound, and an app shell with a working "Free Practice" demo that exercises all of them together.

**Architecture:** A static single-page app with no build step. Plain ES modules served over a static file server. A hash router (`js/app.js`) mounts views into one `<main>`. Pure-logic modules (`engine.js`, `storage.js`, `fingers.js`, `audio.js`) are unit-tested in the browser via a tiny test harness; DOM/glue is verified with the Claude Preview MCP tools against the PowerShell static server already in `.claude/launch.json`.

**Tech Stack:** HTML5, CSS3, vanilla ES modules, Web Audio API, `localStorage`. No frameworks, no bundler, no Node. Tests run in-browser via `tests/run-tests.html`.

---

## Notes for the implementer

- **No test framework exists** (static project). We use a 30-line in-browser harness
  (`tests/harness.js`). A "test run" = load `http://localhost:4173/tests/run-tests.html` in
  the preview and read `window.__TESTS` via `preview_eval`. `__TESTS.fail === 0` means green.
- **Timing is injectable.** `TextSession` takes a `now()` function so tests use a fake clock
  instead of the wall clock.
- **The existing `index.html`** is the old falling-words prototype. Task 8 overwrites it with
  the app shell. Task 0 commits it first as a baseline so it stays in history.
- **Server:** `.claude/launch.json` already defines a `typing-game` static server on port
  4173 (PowerShell `static-server.ps1`). Start it with the `preview_start` MCP tool.
- After each task, run the harness (or the preview check) and **commit**.

## Target file structure after Phase 1

```
index.html                 # app shell (nav + <main id="app">), loads js/app.js
styles/
  main.css                 # layout, nav, practice view, stats
  keyboard.css             # on-screen keyboard + finger colors
js/
  app.js                   # entry + hash router + name prompt + mute toggle
  engine.js                # Stats + TextSession
  fingers.js               # key -> {finger, hand, color} + labels
  keyboard.js              # renderKeyboard(container) -> { el, highlight(char) }
  audio.js                 # Web Audio sound effects + mute
  storage.js               # localStorage wrapper (name, settings, progress shell)
  views/
    practice.js            # "Free Practice" demo view (engine + keyboard + audio + stats)
tests/
  harness.js               # test()/assert helpers + results
  run-tests.html           # imports all *.test.js, exposes window.__TESTS
  engine.test.js
  storage.test.js
  fingers.test.js
  keyboard.test.js
  audio.test.js
```

---

## Task 0: Project init + test harness

**Files:**
- Create: `.gitignore`
- Create: `tests/harness.js`
- Create: `tests/run-tests.html`

- [ ] **Step 1: Initialize git and commit the existing prototype as baseline**

```bash
cd /d/Claude/MasterTyping
git init
git add -A
git commit -m "chore: baseline (falling-words prototype + specs/plans)"
```

- [ ] **Step 2: Create `.gitignore`**

```
# OS / editor noise
Thumbs.db
.DS_Store
*.log
```

- [ ] **Step 3: Write the test harness `tests/harness.js`**

```js
// Minimal in-browser test harness. Test modules call test(...) at import time;
// run-tests.html reads `results` after all imports resolve.
export const results = [];

export function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, err: String((e && e.message) || e) });
  }
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

export function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || "assertEqual"}: expected ${expected}, got ${actual}`);
  }
}

export function assertClose(actual, expected, eps, msg) {
  if (Math.abs(actual - expected) > eps) {
    throw new Error(`${msg || "assertClose"}: expected ~${expected}, got ${actual}`);
  }
}
```

- [ ] **Step 4: Write `tests/run-tests.html`**

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Tests</title>
<style>body{font:14px monospace;padding:16px} .fail{color:#c00} .pass{color:#2b8a3e}</style>
</head><body><pre id="out">running…</pre>
<script type="module">
  import { results } from "./harness.js";
  // Importing a test module runs its top-level test() calls.
  await import("./engine.test.js");
  await import("./storage.test.js");
  await import("./fingers.test.js");
  await import("./keyboard.test.js");
  await import("./audio.test.js");

  const pass = results.filter(r => r.ok).length;
  const fail = results.length - pass;
  const lines = results.map(r =>
    `<span class="${r.ok ? "pass" : "fail"}">${r.ok ? "PASS" : "FAIL"}</span> ${r.name}` +
    (r.ok ? "" : `  ::  ${r.err}`));
  document.getElementById("out").innerHTML =
    lines.join("\n") + `\n\n${pass} passed, ${fail} failed`;
  window.__TESTS = { pass, fail, results };
</script>
</body></html>
```

> The five `*.test.js` files don't exist yet, so the page will error until each task adds
> its file. That's expected — each task below creates its test file before its source file.
> To run a single task's tests early, temporarily comment out the not-yet-created imports.

- [ ] **Step 5: Commit**

```bash
git add .gitignore tests/harness.js tests/run-tests.html
git commit -m "test: add in-browser test harness"
```

---

## Task 1: `Stats` helpers (engine.js)

**Files:**
- Create: `tests/engine.test.js` (Stats portion)
- Create: `js/engine.js`

- [ ] **Step 1: Write the failing tests for `Stats`**

Create `tests/engine.test.js`:

```js
import { test, assertEqual, assertClose } from "./harness.js";
import { Stats } from "../js/engine.js";

test("Stats.wpm: 50 correct chars in 60s = 10 wpm", () => {
  assertEqual(Stats.wpm(50, 60000), 10); // (50/5) / 1min
});

test("Stats.wpm: 0 elapsed returns 0 (no divide-by-zero)", () => {
  assertEqual(Stats.wpm(10, 0), 0);
});

test("Stats.accuracy: 9 correct of 10 typed = 0.9", () => {
  assertClose(Stats.accuracy(9, 10), 0.9, 1e-9);
});

test("Stats.accuracy: nothing typed returns 1", () => {
  assertEqual(Stats.accuracy(0, 0), 1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Use the `preview_start` MCP tool on `typing-game`, then `preview_eval` on the returned
serverId:

```js
(async () => { const r = await fetch("/tests/run-tests.html"); return r.status; })()
```
Then navigate the preview to `/tests/run-tests.html` and `preview_eval`: `window.__TESTS`.
Expected: the page throws (module `../js/engine.js` 404) — i.e. tests do not pass.

- [ ] **Step 3: Implement `Stats` in `js/engine.js`**

```js
// js/engine.js — shared typing math + a target-driven typing session.

export const Stats = {
  // Net WPM: (correct chars / 5) divided by minutes elapsed.
  wpm(correctChars, ms) {
    if (ms <= 0) return 0;
    const minutes = ms / 60000;
    return Math.round((correctChars / 5) / minutes);
  },
  // Accuracy as a 0..1 ratio. No keystrokes yet => perfect.
  accuracy(correct, total) {
    if (total <= 0) return 1;
    return correct / total;
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Reload `/tests/run-tests.html` in the preview, `preview_eval`: `window.__TESTS`.
Expected: the four `Stats.*` results are `ok: true`.

- [ ] **Step 5: Commit**

```bash
git add js/engine.js tests/engine.test.js
git commit -m "feat: add Stats wpm/accuracy helpers"
```

---

## Task 2: `TextSession` (engine.js)

A target-driven typing session. **Blocking model** (beginner-friendly): the cursor only
advances on the correct key; a wrong key is counted as an error but does not advance.
Backspace steps the cursor back one (no score change). Timer starts on the first printable
keystroke. `onComplete` fires when every character has been typed correctly.

**Files:**
- Modify: `tests/engine.test.js` (append)
- Modify: `js/engine.js` (append)

- [ ] **Step 1: Write the failing tests (append to `tests/engine.test.js`)**

```js
import { TextSession } from "../js/engine.js";

function fakeClock() {
  const c = { t: 0 };
  c.now = () => c.t;
  return c;
}

test("TextSession: correct keys advance the cursor", () => {
  const s = new TextSession("ab", {}, () => 0);
  s.handleKey("a");
  assertEqual(s.index, 1);
  assertEqual(s.nextChar, "b");
});

test("TextSession: wrong key counts an error and does NOT advance", () => {
  const s = new TextSession("ab", {}, () => 0);
  s.handleKey("z");
  assertEqual(s.index, 0);
  assertEqual(s.errors, 1);
  assertEqual(s.nextChar, "a");
});

test("TextSession: backspace steps back, not below zero", () => {
  const s = new TextSession("ab", {}, () => 0);
  s.handleKey("a");          // index 1
  s.handleKey("Backspace");  // index 0
  s.handleKey("Backspace");  // stays 0
  assertEqual(s.index, 0);
});

test("TextSession: non-printable keys are ignored", () => {
  const s = new TextSession("ab", {}, () => 0);
  s.handleKey("Shift");
  s.handleKey("Enter");
  assertEqual(s.index, 0);
  assertEqual(s.totalTyped, 0);
});

test("TextSession: onComplete fires once with final stats", () => {
  const clock = fakeClock();
  let done = null;
  const s = new TextSession("ab", { onComplete: (st) => { done = st; } }, clock.now);
  s.handleKey("a");          // starts timer at t=0
  clock.t = 30000;           // 30s later
  s.handleKey("b");          // completes
  assert(done !== null, "onComplete should fire");
  assertEqual(done.elapsedMs, 30000);
  assertEqual(done.index, 2);
});

test("TextSession: accuracy = correct / total typed (backspace not counted)", () => {
  const s = new TextSession("ab", {}, () => 0);
  s.handleKey("z");          // error  (typed 1, err 1)
  s.handleKey("a");          // correct(typed 2, err 1)
  s.handleKey("Backspace");  // not counted
  s.handleKey("a");          // correct(typed 3, err 1)
  s.handleKey("b");          // correct(typed 4, err 1) -> complete
  assertClose(s.stats.accuracy, 3 / 4, 1e-9);
});

test("TextSession: stats.wpm uses correct chars over elapsed time", () => {
  const clock = fakeClock();
  const s = new TextSession("aaaaaaaaaa", {}, clock.now); // 10 chars
  s.handleKey("a");          // timer starts at t=0 (1 typed, index 1)
  for (let i = 0; i < 8; i++) s.handleKey("a"); // 9 typed, index 9 (not complete)
  clock.t = 60000;           // a minute passes BEFORE the final keystroke
  s.handleKey("a");          // 10th correct char completes; _end frozen at 60000
  // 10 correct chars / 5 = 2 "words" in 1 min => 2 wpm
  assertEqual(s.stats.wpm, 2);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Reload `/tests/run-tests.html`, `preview_eval`: `window.__TESTS`.
Expected: the `TextSession*` results are `ok: false` (TextSession undefined / not exported).

- [ ] **Step 3: Implement `TextSession` (append to `js/engine.js`)**

```js
// A printable key is any single-character key (letters, digits, space, punctuation).
function isPrintable(key) {
  return typeof key === "string" && key.length === 1;
}

export class TextSession {
  constructor(target, { onProgress, onComplete } = {}, now = () => performance.now()) {
    this.target = target;
    this.onProgress = onProgress || null;
    this.onComplete = onComplete || null;
    this._now = now;
    this.reset();
  }

  reset() {
    this.index = 0;        // next character to type
    this.totalTyped = 0;   // printable keystrokes (excludes Backspace)
    this.errors = 0;       // wrong keystrokes
    this._start = null;    // timestamp of first keystroke
    this._end = null;      // timestamp of completion
    this._completed = false;
  }

  get nextChar() {
    return this.index < this.target.length ? this.target[this.index] : null;
  }

  get isComplete() {
    return this._completed;
  }

  get elapsedMs() {
    if (this._start === null) return 0;
    return (this._end !== null ? this._end : this._now()) - this._start;
  }

  get stats() {
    return {
      index: this.index,
      nextChar: this.nextChar,
      elapsedMs: this.elapsedMs,
      errors: this.errors,
      wpm: Stats.wpm(this.index, this.elapsedMs),
      accuracy: Stats.accuracy(this.totalTyped - this.errors, this.totalTyped),
    };
  }

  handleKey(key) {
    if (this._completed) return;

    if (key === "Backspace") {
      if (this.index > 0) this.index--;
      if (this.onProgress) this.onProgress(this.stats);
      return;
    }
    if (!isPrintable(key)) return;

    if (this._start === null) this._start = this._now();
    this.totalTyped++;

    if (key === this.target[this.index]) {
      this.index++;
      if (this.index >= this.target.length) {
        this._completed = true;
        this._end = this._now();
        if (this.onProgress) this.onProgress(this.stats);
        if (this.onComplete) this.onComplete(this.stats);
        return;
      }
    } else {
      this.errors++;
    }
    if (this.onProgress) this.onProgress(this.stats);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Reload `/tests/run-tests.html`, `preview_eval`: `window.__TESTS`. Expected: all engine
tests `ok: true`, `fail` count unchanged by these.

- [ ] **Step 5: Commit**

```bash
git add js/engine.js tests/engine.test.js
git commit -m "feat: add TextSession typing engine (blocking model)"
```

---

## Task 3: `storage.js` (local progress)

A `localStorage` wrapper that survives missing/corrupt data and merges in new default keys
so later phases can extend the shape safely. `name === null` means "never asked".

**Files:**
- Create: `tests/storage.test.js`
- Create: `js/storage.js`

- [ ] **Step 1: Write the failing tests `tests/storage.test.js`**

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Reload `/tests/run-tests.html`, `preview_eval`: `window.__TESTS`.
Expected: storage tests `ok: false` (module 404 / undefined).

- [ ] **Step 3: Implement `js/storage.js`**

```js
// js/storage.js — single source of truth for locally-saved state.
const KEY = "mastertyping.v1";

export const DEFAULT_STATE = {
  name: null,                 // null = never asked, "" = asked & skipped, "Mia" = provided
  lessons: {},                // id -> { bestWpm, bestAccuracy, stars, completed }
  tests: [],                  // { dateISO, durationSec, wpm, accuracy }, newest first
  certificates: [],           // { courseId, dateISO, wpm, accuracy }
  achievements: [],           // achievement ids
  game: { highScore: 0, bestLevel: 1 },
  settings: { keyboardGuide: true, sound: true },
};

// Deep-merge defaults under loaded data so new keys always exist.
function withDefaults(loaded) {
  const d = structuredClone(DEFAULT_STATE);
  if (!loaded || typeof loaded !== "object") return d;
  return {
    ...d, ...loaded,
    game: { ...d.game, ...(loaded.game || {}) },
    settings: { ...d.settings, ...(loaded.settings || {}) },
    lessons: { ...(loaded.lessons || {}) },
    tests: Array.isArray(loaded.tests) ? loaded.tests : d.tests,
    certificates: Array.isArray(loaded.certificates) ? loaded.certificates : d.certificates,
    achievements: Array.isArray(loaded.achievements) ? loaded.achievements : d.achievements,
  };
}

export class Storage {
  constructor() {
    this.inMemory = false;
    let parsed = null;
    try {
      const raw = localStorage.getItem(KEY);
      parsed = raw ? JSON.parse(raw) : null;
    } catch (_) {
      parsed = null;                 // corrupt JSON or unavailable storage
    }
    this.state = withDefaults(parsed);
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch (_) {
      this.inMemory = true;          // private mode / quota — keep state in memory only
    }
  }

  getName() { return this.state.name; }
  setName(name) { this.state.name = name; this.save(); }

  getSettings() { return this.state.settings; }
  updateSettings(patch) {
    this.state.settings = { ...this.state.settings, ...patch };
    this.save();
  }
}

// One shared instance for the app (tests construct their own).
export const store = new Storage();
```

- [ ] **Step 4: Run tests to verify they pass**

Reload `/tests/run-tests.html`, `preview_eval`: `window.__TESTS`. Expected: storage tests
`ok: true`.

- [ ] **Step 5: Commit**

```bash
git add js/storage.js tests/storage.test.js
git commit -m "feat: add resilient localStorage wrapper"
```

---

## Task 4: `fingers.js` (key → finger mapping)

**Files:**
- Create: `tests/fingers.test.js`
- Create: `js/fingers.js`

- [ ] **Step 1: Write the failing tests `tests/fingers.test.js`**

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Reload `/tests/run-tests.html`, `preview_eval`: `window.__TESTS`.
Expected: fingers tests `ok: false`.

- [ ] **Step 3: Implement `js/fingers.js`**

```js
// js/fingers.js — standard touch-typing finger assignments for a QWERTY keyboard.

export const FINGER_COLORS = {
  "l-pinky":  "#ff6b6b",
  "l-ring":   "#ffa94d",
  "l-middle": "#ffd43b",
  "l-index":  "#69db7c",
  "r-index":  "#38d9a9",
  "r-middle": "#4dabf7",
  "r-ring":   "#b197fc",
  "r-pinky":  "#f783ac",
  "thumb":    "#ced4da",
};

export const FINGER_LABELS = {
  "l-pinky":  "left pinky",
  "l-ring":   "left ring finger",
  "l-middle": "left middle finger",
  "l-index":  "left index finger",
  "r-index":  "right index finger",
  "r-middle": "right middle finger",
  "r-ring":   "right ring finger",
  "r-pinky":  "right pinky",
  "thumb":    "thumb",
};

// Which finger presses each (lowercase / unshifted) key.
const KEY_FINGER = {
  "`": "l-pinky", "1": "l-pinky", "q": "l-pinky", "a": "l-pinky", "z": "l-pinky",
  "2": "l-ring", "w": "l-ring", "s": "l-ring", "x": "l-ring",
  "3": "l-middle", "e": "l-middle", "d": "l-middle", "c": "l-middle",
  "4": "l-index", "5": "l-index", "r": "l-index", "t": "l-index",
  "f": "l-index", "g": "l-index", "v": "l-index", "b": "l-index",
  "6": "r-index", "7": "r-index", "y": "r-index", "u": "r-index",
  "h": "r-index", "j": "r-index", "n": "r-index", "m": "r-index",
  "8": "r-middle", "i": "r-middle", "k": "r-middle", ",": "r-middle",
  "9": "r-ring", "o": "r-ring", "l": "r-ring", ".": "r-ring",
  "0": "r-pinky", "-": "r-pinky", "=": "r-pinky", "p": "r-pinky",
  "[": "r-pinky", "]": "r-pinky", ";": "r-pinky", "'": "r-pinky", "/": "r-pinky",
  " ": "thumb",
};

// Returns { finger, hand, color } for a key, or null if unmapped.
export function fingerFor(key) {
  if (typeof key !== "string" || key.length !== 1) return null;
  const finger = KEY_FINGER[key.toLowerCase()];
  if (!finger) return null;
  const hand = finger === "thumb" ? "both" : finger.startsWith("l-") ? "left" : "right";
  return { finger, hand, color: FINGER_COLORS[finger] };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Reload `/tests/run-tests.html`, `preview_eval`: `window.__TESTS`. Expected: fingers tests
`ok: true`.

- [ ] **Step 5: Commit**

```bash
git add js/fingers.js tests/fingers.test.js
git commit -m "feat: add key-to-finger mapping with colors and labels"
```

---

## Task 5: `keyboard.js` (on-screen keyboard component)

Renders a QWERTY keyboard as DOM, tints each key by finger color, and highlights the next
key (plus a Shift key for uppercase letters) with a finger-name hint.

**Files:**
- Create: `styles/keyboard.css`
- Create: `tests/keyboard.test.js`
- Create: `js/keyboard.js`

- [ ] **Step 1: Write the failing tests `tests/keyboard.test.js`**

```js
import { test, assert, assertEqual } from "./harness.js";
import { renderKeyboard } from "../js/keyboard.js";

function mount() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return renderKeyboard(host);
}

test("renderKeyboard: builds a key element for each letter", () => {
  const kb = mount();
  assert(kb.el.querySelector('[data-key="f"]'), "should have an f key");
  assert(kb.el.querySelector('[data-key="j"]'), "should have a j key");
});

test("highlight: marks the matching key with .next", () => {
  const kb = mount();
  kb.highlight("f");
  const f = kb.el.querySelector('[data-key="f"]');
  assert(f.classList.contains("next"), "f should be highlighted");
});

test("highlight: moves highlight when called again", () => {
  const kb = mount();
  kb.highlight("f");
  kb.highlight("j");
  assert(!kb.el.querySelector('[data-key="f"]').classList.contains("next"), "f cleared");
  assert(kb.el.querySelector('[data-key="j"]').classList.contains("next"), "j set");
});

test("highlight: uppercase also lights a Shift key", () => {
  const kb = mount();
  kb.highlight("F");
  assert(kb.el.querySelector('[data-key="f"]').classList.contains("next"), "f lit");
  assert(kb.el.querySelector('[data-shift]').classList.contains("next"), "shift lit");
});

test("highlight: shows a finger hint", () => {
  const kb = mount();
  kb.highlight("f");
  assert(/left index/.test(kb.el.querySelector(".kb-hint").textContent), "hint names finger");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Reload `/tests/run-tests.html`, `preview_eval`: `window.__TESTS`.
Expected: keyboard tests `ok: false`.

- [ ] **Step 3: Implement `js/keyboard.js`**

```js
// js/keyboard.js — DOM on-screen keyboard with finger coloring + next-key highlight.
import { fingerFor, FINGER_LABELS } from "./fingers.js";

const ROWS = [
  ["1","2","3","4","5","6","7","8","9","0","-","="],
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l",";"],
  ["z","x","c","v","b","n","m",",","."],
];

export function renderKeyboard(host) {
  const el = document.createElement("div");
  el.className = "keyboard";

  for (const row of ROWS) {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    for (const k of row) {
      const key = document.createElement("div");
      key.className = "kb-key";
      key.dataset.key = k;
      key.textContent = k;
      const f = fingerFor(k);
      if (f) key.style.background = f.color;
      rowEl.appendChild(key);
    }
    el.appendChild(rowEl);
  }

  // Space row with two Shift keys + spacebar.
  const spaceRow = document.createElement("div");
  spaceRow.className = "kb-row";
  const shiftL = document.createElement("div");
  shiftL.className = "kb-key kb-wide"; shiftL.dataset.shift = "left"; shiftL.textContent = "Shift";
  const space = document.createElement("div");
  space.className = "kb-key kb-space"; space.dataset.key = " "; space.textContent = "space";
  const shiftR = document.createElement("div");
  shiftR.className = "kb-key kb-wide"; shiftR.dataset.shift = "right"; shiftR.textContent = "Shift";
  spaceRow.append(shiftL, space, shiftR);
  el.appendChild(spaceRow);

  const hint = document.createElement("div");
  hint.className = "kb-hint";
  el.appendChild(hint);

  host.appendChild(el);

  function clear() {
    el.querySelectorAll(".next").forEach((n) => n.classList.remove("next"));
  }

  function highlight(char) {
    clear();
    if (!char) { hint.textContent = ""; return; }
    const lower = char.toLowerCase();
    const keyEl = el.querySelector(`[data-key="${cssEscape(lower)}"]`);
    if (keyEl) keyEl.classList.add("next");
    // Uppercase letters need Shift.
    const needsShift = char !== lower && char.toUpperCase() === char;
    if (needsShift) {
      const shiftEl = el.querySelector("[data-shift]");
      if (shiftEl) shiftEl.classList.add("next");
    }
    const f = fingerFor(lower);
    hint.textContent = f
      ? `Use your ${FINGER_LABELS[f.finger]}${needsShift ? " (and Shift)" : ""}`
      : "";
  }

  // Minimal CSS.escape fallback (attribute selectors choke on some chars).
  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : s.replace(/[^a-z0-9 ]/gi, "\\$&");
  }

  return { el, highlight };
}
```

- [ ] **Step 4: Write `styles/keyboard.css`**

```css
.keyboard { user-select: none; display: inline-block; padding: 10px; }
.kb-row { display: flex; justify-content: center; gap: 6px; margin: 4px 0; }
.kb-key {
  min-width: 38px; height: 44px; padding: 0 8px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; font: 600 15px "Trebuchet MS", sans-serif;
  color: #1b2733; box-shadow: 0 2px 0 rgba(0,0,0,0.15);
  opacity: 0.55; transition: transform .08s, opacity .08s, box-shadow .08s;
}
.kb-wide { min-width: 64px; }
.kb-space { min-width: 260px; }
.kb-key.next {
  opacity: 1; transform: translateY(-2px) scale(1.06);
  outline: 3px solid #1b2733; box-shadow: 0 0 14px rgba(27,39,51,0.5);
}
.kb-hint { text-align: center; margin-top: 8px; font: 600 16px "Trebuchet MS", sans-serif; color: #1864ab; min-height: 22px; }
```

- [ ] **Step 5: Run tests to verify they pass**

Reload `/tests/run-tests.html`, `preview_eval`: `window.__TESTS`. Expected: keyboard tests
`ok: true`.

- [ ] **Step 6: Commit**

```bash
git add js/keyboard.js styles/keyboard.css tests/keyboard.test.js
git commit -m "feat: add on-screen keyboard with finger highlight"
```

---

## Task 6: `audio.js` (synthesized sound + mute)

**Files:**
- Create: `tests/audio.test.js`
- Create: `js/audio.js`

- [ ] **Step 1: Write the failing tests `tests/audio.test.js`**

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Reload `/tests/run-tests.html`, `preview_eval`: `window.__TESTS`.
Expected: audio tests `ok: false`.

- [ ] **Step 3: Implement `js/audio.js`**

```js
// js/audio.js — tiny Web Audio sound effects. No asset files.
import { store } from "./storage.js";

// name -> list of notes: { f: freqHz, t: startOffsetSec, d: durationSec, type, gain }
const SOUNDS = {
  key:            [{ f: 220, t: 0, d: 0.04, type: "square", gain: 0.04 }],
  wrong:          [{ f: 120, t: 0, d: 0.14, type: "sawtooth", gain: 0.06 }],
  lessonComplete: [{ f: 523, t: 0, d: 0.12 }, { f: 659, t: 0.1, d: 0.12 }, { f: 784, t: 0.2, d: 0.18 }],
  levelUp:        [{ f: 392, t: 0, d: 0.1 }, { f: 587, t: 0.09, d: 0.16 }],
  achievement:    [{ f: 659, t: 0, d: 0.1 }, { f: 880, t: 0.1, d: 0.2 }],
  clear:          [{ f: 660, t: 0, d: 0.06, type: "triangle", gain: 0.05 }],
  life:           [{ f: 160, t: 0, d: 0.2, type: "sawtooth", gain: 0.07 }],
};

class Audio {
  constructor() {
    this.ctx = null;
    this._muted = store.getSettings().sound === false;
  }

  isMuted() { return this._muted; }

  setMuted(m) {
    this._muted = !!m;
    store.updateSettings({ sound: !this._muted });
  }

  _ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  // Returns true if it attempted to play, false if muted / unknown / no audio support.
  play(name) {
    if (this._muted) return false;
    const notes = SOUNDS[name];
    if (!notes) return false;
    const ctx = this._ensureCtx();
    if (!ctx) return false;
    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = n.type || "sine";
      osc.frequency.value = n.f;
      const peak = n.gain != null ? n.gain : 0.08;
      const start = now + (n.t || 0);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
      osc.connect(g).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + n.d + 0.02);
    }
    return true;
  }
}

export const audio = new Audio();
```

- [ ] **Step 4: Run tests to verify they pass**

Reload `/tests/run-tests.html`, `preview_eval`: `window.__TESTS`. Expected: audio tests
`ok: true`.

> Note: the "unmuted play returns true" test creates an `AudioContext`. Headless Chrome in
> the preview allows this; it may log an autoplay warning, which is harmless.

- [ ] **Step 5: Commit**

```bash
git add js/audio.js tests/audio.test.js
git commit -m "feat: add synthesized Web Audio sound effects with mute"
```

---

## Task 7: App shell + router + name prompt + mute toggle (`index.html`, `js/app.js`, `styles/main.css`)

Overwrites the old prototype `index.html`. Provides the nav, the `<main id="app">` mount
point, hash routing, the first-visit name prompt, and the mute toggle wired to `audio`.

**Files:**
- Create: `styles/main.css`
- Modify (overwrite): `index.html`
- Create: `js/app.js`

- [ ] **Step 1: Write `styles/main.css`**

```css
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif; color: #1b2733; background: #eaf6ff; }
.nav { display: flex; align-items: center; gap: 16px; padding: 12px 20px; background: #1864ab; color: #fff; }
.nav a { color: #fff; text-decoration: none; font-weight: 700; opacity: .85; }
.nav a:hover { opacity: 1; }
.nav .spacer { flex: 1; }
.nav button { font: inherit; border: 0; border-radius: 8px; padding: 6px 12px; cursor: pointer; }
main { max-width: 900px; margin: 0 auto; padding: 24px 16px; }

/* Practice view */
.target { font: 28px/1.6 "Trebuchet MS", monospace; background: #fff; border-radius: 12px; padding: 18px 22px; box-shadow: 0 6px 18px rgba(0,60,120,.12); margin-bottom: 16px; word-break: break-word; }
.target .done { color: #2b8a3e; }
.target .cur { background: #ffe066; border-radius: 3px; }
.target .err { color: #c92a2a; }
.stats { display: flex; gap: 24px; font-weight: 700; margin-bottom: 16px; }
.stats span b { color: #1864ab; }

/* Name prompt + generic modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; }
.modal { background: #fff; padding: 24px; border-radius: 14px; width: min(90vw, 360px); text-align: center; }
.modal input { font: 18px inherit; padding: 8px 10px; width: 100%; margin: 12px 0; border: 2px solid #adb5bd; border-radius: 8px; }
.modal .row { display: flex; gap: 10px; justify-content: center; }
.modal button { font: inherit; border: 0; border-radius: 8px; padding: 8px 16px; cursor: pointer; }
.btn-primary { background: #1864ab; color: #fff; }
.btn-ghost { background: #e9ecef; }
```

- [ ] **Step 2: Overwrite `index.html` with the app shell**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Ten-Finger Typing</title>
<link rel="stylesheet" href="styles/main.css" />
<link rel="stylesheet" href="styles/keyboard.css" />
</head>
<body>
  <nav class="nav">
    <a href="#/">🏠 Home</a>
    <a href="#/practice">⌨️ Practice</a>
    <span class="spacer"></span>
    <span id="greeting"></span>
    <button id="mute" class="btn-ghost" type="button">🔊 Sound</button>
  </nav>
  <main id="app"></main>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write `js/app.js`**

```js
// js/app.js — entry point: router, name prompt, mute toggle.
import { store } from "./storage.js";
import { audio } from "./audio.js";
import { practiceView } from "./views/practice.js";

const app = document.getElementById("app");
let current = null; // { destroy? }

const routes = {
  "/": homeView,
  "/practice": practiceView,
};

function mount(view) {
  if (current && typeof current.destroy === "function") current.destroy();
  app.innerHTML = "";
  current = view(app) || null;
}

function router() {
  const path = (location.hash || "#/").slice(1);
  const view = routes[path] || homeView;
  mount(view);
}

// Simple placeholder home until Phase 5 builds the real dashboard.
function homeView(host) {
  const name = store.getName();
  host.innerHTML =
    `<h1>Welcome${name ? ", " + escapeHtml(name) : ""}! 👋</h1>` +
    `<p>This is the foundation build. Try <a href="#/practice">Practice</a> to type with ` +
    `the on-screen keyboard guide.</p>`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function updateGreeting() {
  const name = store.getName();
  document.getElementById("greeting").textContent = name ? `Hi, ${name}` : "";
}

function updateMuteButton() {
  const btn = document.getElementById("mute");
  btn.textContent = audio.isMuted() ? "🔇 Muted" : "🔊 Sound";
}

function wireMuteToggle() {
  const btn = document.getElementById("mute");
  updateMuteButton();
  btn.addEventListener("click", () => {
    audio.setMuted(!audio.isMuted());
    updateMuteButton();
    if (!audio.isMuted()) audio.play("key"); // confirm it's on
  });
}

// First-visit name prompt (name === null means never asked).
function maybeAskName() {
  if (store.getName() !== null) return;
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML =
    `<div class="modal">
       <h2>What's your name?</h2>
       <input id="name-input" maxlength="24" placeholder="Type your name" />
       <div class="row">
         <button id="name-save" class="btn-primary" type="button">Save</button>
         <button id="name-skip" class="btn-ghost" type="button">Skip</button>
       </div>
     </div>`;
  document.body.appendChild(backdrop);
  const input = backdrop.querySelector("#name-input");
  input.focus();
  const finish = (value) => { store.setName(value); backdrop.remove(); updateGreeting(); homeIfHome(); };
  backdrop.querySelector("#name-save").addEventListener("click", () => finish(input.value.trim()));
  backdrop.querySelector("#name-skip").addEventListener("click", () => finish(""));
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") finish(input.value.trim()); });
}

function homeIfHome() { if ((location.hash || "#/") === "#/") router(); }

window.addEventListener("hashchange", router);
wireMuteToggle();
updateGreeting();
maybeAskName();
router();
```

- [ ] **Step 4: Verify the shell loads (manual, via preview)**

`js/views/practice.js` does not exist yet, so the `import` will fail — that's expected and
fixed in Task 8. For now just confirm the file is syntactically valid by checking that the
test suite (which doesn't import app.js) still passes, and proceed.

- [ ] **Step 5: Commit**

```bash
git add index.html js/app.js styles/main.css
git commit -m "feat: app shell with router, name prompt, and mute toggle"
```

---

## Task 8: Practice view (ties engine + keyboard + audio together)

A working "Free Practice" screen: shows a target sentence with per-character coloring, a
live WPM/accuracy/timer readout, the on-screen keyboard highlighting the next key, plays
key/wrong/complete sounds, and offers a Restart button on completion. Captures keystrokes
via a window `keydown` listener that is removed on `destroy()`.

**Files:**
- Create: `js/views/practice.js`

- [ ] **Step 1: Write `js/views/practice.js`**

```js
// js/views/practice.js — Phase 1 demo that exercises the whole foundation.
import { TextSession } from "../engine.js";
import { renderKeyboard } from "../keyboard.js";
import { audio } from "../audio.js";

const SAMPLE = "the quick brown fox jumps over the lazy dog";

export function practiceView(host) {
  host.innerHTML =
    `<h1>Free Practice</h1>
     <div class="target" id="target"></div>
     <div class="stats">
       <span>WPM: <b id="wpm">0</b></span>
       <span>Accuracy: <b id="acc">100%</b></span>
       <span>Time: <b id="time">0.0s</b></span>
     </div>
     <div id="kb-host"></div>
     <div id="done" style="margin-top:16px"></div>`;

  const targetEl = host.querySelector("#target");
  const wpmEl = host.querySelector("#wpm");
  const accEl = host.querySelector("#acc");
  const timeEl = host.querySelector("#time");
  const doneEl = host.querySelector("#done");
  const kb = renderKeyboard(host.querySelector("#kb-host"));

  let session;

  function paintTarget() {
    const i = session.index;
    const before = SAMPLE.slice(0, i);
    const cur = SAMPLE[i] || "";
    const after = SAMPLE.slice(i + 1);
    targetEl.innerHTML =
      `<span class="done">${esc(before)}</span>` +
      `<span class="cur">${esc(cur)}</span>` +
      `<span>${esc(after)}</span>`;
    kb.highlight(session.nextChar);
  }

  function paintStats() {
    const s = session.stats;
    wpmEl.textContent = s.wpm;
    accEl.textContent = Math.round(s.accuracy * 100) + "%";
    timeEl.textContent = (s.elapsedMs / 1000).toFixed(1) + "s";
  }

  function start() {
    doneEl.innerHTML = "";
    session = new TextSession(SAMPLE, {
      onProgress: () => { paintTarget(); paintStats(); },
      onComplete: (s) => {
        audio.play("lessonComplete");
        doneEl.innerHTML =
          `<p><b>Done!</b> ${s.wpm} WPM, ${Math.round(s.accuracy * 100)}% accuracy. ` +
          `<button id="again" class="btn-primary">Try again</button></p>`;
        doneEl.querySelector("#again").addEventListener("click", start);
      },
    });
    paintTarget();
    paintStats();
  }

  function onKey(e) {
    if (e.key === "Tab") return;            // let focus move
    if (session.isComplete) return;
    if (e.key === " ") e.preventDefault();  // stop page scroll
    const before = session.index;
    const beforeErrors = session.errors;
    session.handleKey(e.key);
    if (session.isComplete) return;         // complete sound handled in onComplete
    if (session.errors > beforeErrors) audio.play("wrong");
    else if (session.index > before) audio.play("key");
  }

  window.addEventListener("keydown", onKey);
  start();

  return {
    destroy() { window.removeEventListener("keydown", onKey); },
  };
}

function esc(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
```

- [ ] **Step 2: Verify end-to-end in the preview (see Task 9 for exact steps)**

The app should now load without import errors. Quick check via `preview_eval` after
navigating to `/#/practice`:

```js
(function(){
  document.querySelector('[href="#/practice"]').click();
  return { hasTarget: !!document.getElementById('target'),
           hasKeyboard: !!document.querySelector('.keyboard') };
})()
```
Expected: `{ hasTarget: true, hasKeyboard: true }`.

- [ ] **Step 3: Commit**

```bash
git add js/views/practice.js
git commit -m "feat: add Free Practice view wiring engine, keyboard, and audio"
```

---

## Task 9: Full foundation verification

**Files:** none (verification only).

- [ ] **Step 1: Run the unit suite (all green)**

Start the server (`preview_start` on `typing-game`), navigate the preview to
`/tests/run-tests.html`, then `preview_eval`: `window.__TESTS`.
Expected: `fail === 0`, and `pass` equals the total number of `test(...)` calls (engine,
storage, fingers, keyboard, audio).

- [ ] **Step 2: Smoke-test the app shell**

Navigate the preview to `/` (i.e. `http://localhost:4173/#/`). `preview_eval`:

```js
(function(){
  // dismiss the name prompt if present
  const skip = document.querySelector('#name-skip'); if (skip) skip.click();
  return { greetingNode: !!document.getElementById('greeting'),
           muteBtn: document.getElementById('mute').textContent };
})()
```
Expected: greeting node exists; mute button reads "🔊 Sound" or "🔇 Muted".

- [ ] **Step 3: Drive the Practice view with scripted keystrokes**

Navigate to `/#/practice`, then `preview_eval`:

```js
(function(){
  const type = (k) => window.dispatchEvent(new KeyboardEvent('keydown', { key:k }));
  // type the sample string correctly
  const s = "the quick brown fox jumps over the lazy dog";
  for (const ch of s) type(ch);
  return { done: document.getElementById('done').textContent.includes('Done'),
           wpm: document.getElementById('wpm').textContent };
})()
```
Expected: `done: true` and a numeric WPM. Confirms engine + view + completion all work.

- [ ] **Step 4: Verify mute persists**

`preview_eval`:

```js
(function(){
  document.getElementById('mute').click();              // toggle
  const after = document.getElementById('mute').textContent;
  const saved = JSON.parse(localStorage.getItem('mastertyping.v1')).settings.sound;
  return { buttonText: after, savedSound: saved };
})()
```
Expected: button shows "🔇 Muted" and `savedSound === false` (or the inverse if it started
muted) — the point is the button text and stored `settings.sound` agree.

- [ ] **Step 5: Check the console is clean**

`preview_console_logs` at level `error`. Expected: no errors (an AudioContext autoplay
*warning* is acceptable).

- [ ] **Step 6: Final commit / tag for the phase**

```bash
git add -A
git commit -m "test: verify Phase 1 foundation end-to-end" --allow-empty
git tag phase-1-foundation
```

---

## Self-Review (completed against the spec)

- **Spec coverage:** shared engine (Tasks 1–2), on-screen keyboard with finger colors +
  next-key highlight (Tasks 4–5), `localStorage` wrapper incl. name/settings shape and
  corrupt-data reset (Task 3), Web Audio sound + mute toggle (Task 6), app shell + router +
  first-visit name prompt (Task 7), and a working demo proving it all (Task 8). These match
  the spec's **Phase 1 (Foundation)** scope. Lessons/Tests/Game/Dashboard/celebration/
  certificates are intentionally deferred to Phases 2–5.
- **Placeholder scan:** every code step contains complete, runnable code; no TBD/TODO.
- **Type consistency:** `Stats`, `TextSession` (`index`, `errors`, `totalTyped`, `stats`,
  `nextChar`, `isComplete`, `handleKey`), `Storage` (`getName/setName/getSettings/
  updateSettings`, `state`), `fingerFor`/`FINGER_LABELS`, `renderKeyboard -> {el,highlight}`,
  and `audio` (`play/setMuted/isMuted`) are used identically across tasks and views.
```
