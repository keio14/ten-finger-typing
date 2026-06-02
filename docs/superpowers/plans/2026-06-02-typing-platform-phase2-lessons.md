# Typing Platform — Phase 2 (Lessons + Celebration) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Beginner→Advanced lesson curriculum with a lesson player that tracks stars and sequential unlocks, and celebrate each completed lesson with confetti + sound.

**Architecture:** Builds on the Phase 1 foundation. Curriculum is plain data (`curriculum.js`) with pure lookup helpers; lesson domain logic (stars, unlock state, progress, drill-text) lives in `lessons.js`. The shared typing UI is extracted from the Phase 1 practice view into `typing-runner.js` and reused by both the practice view and the new lesson player. Progress persists through the existing `storage.js` (extended with lesson methods). A `celebrate.js` confetti overlay fires on completion.

**Tech Stack:** Same as Phase 1 — vanilla ES modules, Canvas (confetti), `localStorage`, in-browser test harness.

---

## Notes for the implementer

- **No test framework.** Unit tests run in the browser via `tests/run-tests.html`. You do **not** need to run them yourself — the controller verifies each task by importing the module directly in a real browser (Preview MCP). Just write the code + tests + commit, matching the spec verbatim, and reason through each test by hand.
- **Do not open `tests/run-tests.html` yourself** mid-phase — it imports sibling test files that may not all exist until the phase is done; it will abort. The controller runs the full suite at the end.
- **End every commit message body with:** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Use the **Write** tool for new files and **Edit** for surgical changes (never `New-Item -Force`).
- Phase 1 modules already exist and export: `engine.js` → `Stats`, `TextSession`; `storage.js` → `Storage`, `store`, `DEFAULT_STATE`; `keyboard.js` → `renderKeyboard`; `audio.js` → `audio`; `util.js` → `escapeHtml`.

## File structure after Phase 2

```
js/
  curriculum.js          # NEW: COURSES data + lookups (allLessons, lessonById, ...)
  lessons.js             # NEW: domain logic (computeStars, isUnlocked, lessonText, ...)
  celebrate.js           # NEW: confetti(durationMs) + celebrateLesson()
  typing-runner.js       # NEW: shared typing UI (extracted from practice.js)
  storage.js             # MODIFY: add getLesson(), recordLessonResult()
  app.js                 # MODIFY: route /lessons and /lessons/:id; Lessons link on home
  views/
    practice.js          # MODIFY: re-implement on top of typing-runner.js
    lessons.js           # NEW: curriculum browser + lesson player
styles/
  celebrate.css          # NEW: confetti overlay, results panel, stars, lesson tree
index.html               # MODIFY: add Lessons nav link + link celebrate.css
tests/
  curriculum.test.js     # NEW
  lessons.test.js        # NEW
  typing-runner.test.js  # NEW
  celebrate.test.js      # NEW
  storage.test.js        # MODIFY: add lesson-method tests
  run-tests.html         # MODIFY: import the four new test files
```

---

## Task 1: Extend `storage.js` with lesson progress methods

**Files:**
- Modify: `js/storage.js`
- Modify: `tests/storage.test.js`

- [ ] **Step 1: Append failing tests to `tests/storage.test.js`**

Add at the end of the file:

```js
test("Storage: recordLessonResult stores best values and marks completion", () => {
  const s = freshStorage();
  s.recordLessonResult("home-fj", { wpm: 12, accuracy: 0.9, stars: 1 });
  let p = s.getLesson("home-fj");
  assertEqual(p.completed, true);
  assertEqual(p.stars, 1);
  assertEqual(p.bestWpm, 12);
  // a worse later attempt must not lower bests or un-complete
  s.recordLessonResult("home-fj", { wpm: 5, accuracy: 0.5, stars: 0 });
  p = s.getLesson("home-fj");
  assertEqual(p.bestWpm, 12);
  assertEqual(p.stars, 1);
  assertEqual(p.completed, true);
});

test("Storage: a failing first attempt (0 stars) does not mark completed", () => {
  const s = freshStorage();
  s.recordLessonResult("top-ei", { wpm: 4, accuracy: 0.5, stars: 0 });
  assertEqual(s.getLesson("top-ei").completed, false);
});

test("Storage: getLesson returns null for an unknown lesson", () => {
  const s = freshStorage();
  assertEqual(s.getLesson("nope"), null);
});

test("Storage: lesson progress persists across instances", () => {
  const s = freshStorage();
  s.recordLessonResult("home-dk", { wpm: 20, accuracy: 0.97, stars: 2 });
  const s2 = new Storage();
  assertEqual(s2.getLesson("home-dk").stars, 2);
});
```

- [ ] **Step 2: Verify they fail** — controller runs them; expected FAIL (`recordLessonResult`/`getLesson` undefined).

- [ ] **Step 3: Add the methods to `js/storage.js`**

Insert these two methods inside the `Storage` class, immediately after the `updateSettings(patch) { ... }` method (before the closing `}` of the class):

```js

  getLesson(id) {
    return this.state.lessons[id] || null;
  }

  // Merge a lesson attempt: keep the best wpm/accuracy/stars; complete once stars >= 1.
  recordLessonResult(id, { wpm, accuracy, stars }) {
    const prev = this.state.lessons[id] || { bestWpm: 0, bestAccuracy: 0, stars: 0, completed: false };
    this.state.lessons[id] = {
      bestWpm: Math.max(prev.bestWpm, wpm),
      bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
      stars: Math.max(prev.stars, stars),
      completed: prev.completed || stars >= 1,
    };
    this.save();
    return this.state.lessons[id];
  }
```

- [ ] **Step 4: Verify they pass** — controller re-runs; expected PASS.

- [ ] **Step 5: Commit**

```bash
git add js/storage.js tests/storage.test.js
git commit -m "feat: add lesson progress methods to storage"
```

---

## Task 2: `curriculum.js` — the full ladder + lookups

**Files:**
- Create: `js/curriculum.js`
- Create: `tests/curriculum.test.js`
- Modify: `tests/run-tests.html`

- [ ] **Step 1: Create `tests/curriculum.test.js`**

```js
import { test, assert, assertEqual } from "./harness.js";
import { COURSES, allLessons, lessonById, courseOfLesson, nextLessonId, isLastInCourse } from "../js/curriculum.js";

test("curriculum: has three courses in order", () => {
  assertEqual(COURSES.length, 3);
  assertEqual(COURSES[0].id, "beginner");
  assertEqual(COURSES[2].id, "advanced");
});

test("curriculum: allLessons is a flat ordered list, each with id + courseId", () => {
  const list = allLessons();
  assert(list.length > 15, "should have many lessons");
  assertEqual(list[0].id, "home-fj");
  assert(list.every((l) => l.id && l.courseId && l.title), "each lesson has id, courseId, title");
});

test("curriculum: lesson ids are unique", () => {
  const ids = allLessons().map((l) => l.id);
  assertEqual(new Set(ids).size, ids.length);
});

test("curriculum: lessonById and courseOfLesson resolve correctly", () => {
  assertEqual(lessonById("home-fj").title, "F and J");
  assertEqual(courseOfLesson("home-fj").id, "beginner");
  assertEqual(lessonById("does-not-exist"), null);
});

test("curriculum: nextLessonId returns the following lesson, null at the end", () => {
  const list = allLessons();
  assertEqual(nextLessonId(list[0].id), list[1].id);
  assertEqual(nextLessonId(list[list.length - 1].id), null);
});

test("curriculum: isLastInCourse marks the final lesson of a course", () => {
  assertEqual(isLastInCourse("num-mix"), true);   // last Beginner lesson
  assertEqual(isLastInCourse("home-fj"), false);
});

test("curriculum: every course has a pass threshold", () => {
  for (const c of COURSES) {
    assert(typeof c.pass.minAccuracy === "number", c.id + " has minAccuracy");
    assert(typeof c.pass.minWpm === "number", c.id + " has minWpm");
  }
});
```

- [ ] **Step 2: Verify it fails** — controller runs; expected FAIL (module 404).

- [ ] **Step 3: Create `js/curriculum.js`**

```js
// js/curriculum.js — the lesson ladder (data) plus pure lookup helpers.
// Lesson shape: { id, title, type, newKeys, content }
//   type: "keys" | "words" | "sentences" | "paragraph"
// Pass thresholds live on the COURSE (shared by all its lessons).

export const COURSES = [
  {
    id: "beginner",
    title: "Beginner",
    pass: { minAccuracy: 0.90, minWpm: 8 },
    units: [
      {
        id: "home", title: "Home Row", lessons: [
          { id: "home-fj", title: "F and J", type: "keys", newKeys: ["f", "j"], content: "fff jjj fj jf fjf jfj ffj jjf jf fj" },
          { id: "home-dk", title: "D and K", type: "keys", newKeys: ["d", "k"], content: "ddd kkk dk kd dkd kdk ddk kkd kd dk" },
          { id: "home-sl", title: "S and L", type: "keys", newKeys: ["s", "l"], content: "sss lll sl ls sls lsl ssl lls ls sl" },
          { id: "home-asemi", title: "A and ;", type: "keys", newKeys: ["a", ";"], content: "aaa ;;; a; ;a a;a ;a; aa; ;;a ;a a;" },
          { id: "home-gh", title: "G and H", type: "keys", newKeys: ["g", "h"], content: "ggg hhh gh hg ghg hgh ggh hhg hg gh" },
          { id: "home-words", title: "Home Row Words", type: "words", newKeys: [], content: "as ask dad fall flag glad half hall lad sad salad gash" },
        ],
      },
      {
        id: "top", title: "Top Row", lessons: [
          { id: "top-ei", title: "E and I", type: "keys", newKeys: ["e", "i"], content: "eee iii ei ie eie iei eei iie ie ei" },
          { id: "top-ru", title: "R and U", type: "keys", newKeys: ["r", "u"], content: "rrr uuu ru ur rur uru rru uur ur ru" },
          { id: "top-ty", title: "T and Y", type: "keys", newKeys: ["t", "y"], content: "ttt yyy ty yt tyt yty tty yyt yt ty" },
          { id: "top-wo", title: "W and O", type: "keys", newKeys: ["w", "o"], content: "www ooo wo ow wow owo wwo oow ow wo" },
          { id: "top-qp", title: "Q and P", type: "keys", newKeys: ["q", "p"], content: "qqq ppp qp pq qpq pqp qqp ppq pq qp" },
          { id: "top-words", title: "Top Row Words", type: "words", newKeys: [], content: "we it our top type were quiet power party your tour write" },
        ],
      },
      {
        id: "bottom", title: "Bottom Row", lessons: [
          { id: "bot-vn", title: "V and N", type: "keys", newKeys: ["v", "n"], content: "vvv nnn vn nv vnv nvn vvn nnv nv vn" },
          { id: "bot-cm", title: "C and M", type: "keys", newKeys: ["c", "m"], content: "ccc mmm cm mc cmc mcm ccm mmc mc cm" },
          { id: "bot-bx", title: "B and X", type: "keys", newKeys: ["b", "x"], content: "bbb xxx bx xb bxb xbx bbx xxb xb bx" },
          { id: "bot-words", title: "Bottom Row Words", type: "words", newKeys: [], content: "van can man box mix verb cave numb climb brave vacuum minimum" },
        ],
      },
      {
        id: "caps", title: "Capitals & Punctuation", lessons: [
          { id: "caps-letters", title: "Capital Letters", type: "sentences", newKeys: [], content: "Sam And Pat Go. The Big Dog Ran. We Like To Play. A Cat Sat." },
          { id: "punct-basic", title: "Periods and Commas", type: "sentences", newKeys: [], content: "I see a cat, a dog, and a bird. We run, jump, and play. Yes, it is fun." },
          { id: "sent-simple", title: "Simple Sentences", type: "sentences", newKeys: [], content: "the sun is hot. we go to the park. a dog can run fast. i like to read books." },
        ],
      },
      {
        id: "numbers", title: "Numbers", lessons: [
          { id: "num-left", title: "Numbers 1-5", type: "keys", newKeys: ["1", "2", "3", "4", "5"], content: "111 222 333 444 555 12 34 5 13 24 35" },
          { id: "num-right", title: "Numbers 6-0", type: "keys", newKeys: ["6", "7", "8", "9", "0"], content: "666 777 888 999 000 67 89 0 68 79 90" },
          { id: "num-mix", title: "All Numbers", type: "keys", newKeys: [], content: "1 2 3 4 5 6 7 8 9 0 19 28 37 46 50" },
        ],
      },
    ],
  },
  {
    id: "intermediate",
    title: "Intermediate",
    pass: { minAccuracy: 0.92, minWpm: 15 },
    units: [
      {
        id: "common", title: "Common Words", lessons: [
          { id: "words-common1", title: "Common Words", type: "words", newKeys: [], content: "the and that have with this from they will would there their what about which" },
          { id: "words-common2", title: "More Common Words", type: "words", newKeys: [], content: "people because through different important children system program question between" },
        ],
      },
      {
        id: "sentences2", title: "Sentences", lessons: [
          { id: "sent-medium", title: "Everyday Sentences", type: "sentences", newKeys: [], content: "She walked to the store to buy some fresh bread. They watched a movie after dinner last night." },
          { id: "sent-names", title: "Names and Places", type: "sentences", newKeys: [], content: "John lives in New York City. Maria visited Paris and London in the summer." },
        ],
      },
      {
        id: "punct2", title: "Punctuation", lessons: [
          { id: "punct-marks", title: "Questions and Exclamations", type: "sentences", newKeys: [], content: "Where are you going? That is amazing! Can we go now? What a beautiful day!" },
          { id: "punct-quotes", title: "Quotes and Apostrophes", type: "sentences", newKeys: [], content: "She said, \"Let's go home.\" It's a wonderful day. Don't forget your keys." },
        ],
      },
      {
        id: "para1", title: "Paragraphs", lessons: [
          { id: "para-short", title: "Short Paragraph", type: "paragraph", newKeys: [], content: "Reading every day is a great habit. It helps you learn new words and ideas. The more you read, the better you understand the world around you." },
        ],
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    pass: { minAccuracy: 0.94, minWpm: 22 },
    units: [
      {
        id: "speed", title: "Speed", lessons: [
          { id: "speed-words", title: "Speed Words", type: "words", newKeys: [], content: "time year work people way day man thing woman life child world school state family" },
          { id: "speed-sentences", title: "Speed Sentences", type: "sentences", newKeys: [], content: "The quick brown fox jumps over the lazy dog while the bright sun shines over the calm blue sea." },
        ],
      },
      {
        id: "symbols", title: "Symbols", lessons: [
          { id: "sym-common", title: "Common Symbols", type: "keys", newKeys: [], content: "@ # $ % & * 50% $100 a&b #1 50*2 m@x" },
          { id: "sym-code", title: "Code Symbols", type: "keys", newKeys: [], content: "( ) { } [ ] ; = () {x} [i] a = b; x = y;" },
        ],
      },
      {
        id: "reinforce", title: "Reinforcement", lessons: [
          { id: "para-long", title: "Long Paragraph", type: "paragraph", newKeys: [], content: "Learning to type without looking at the keyboard takes patience and practice. At first your fingers feel slow and clumsy, but with steady effort they begin to move on their own. Soon you will type quickly and accurately, freeing your mind to focus on your ideas instead of the keys." },
        ],
      },
    ],
  },
];

// Flat, ordered list of lessons, each annotated with its courseId and unitId.
export function allLessons() {
  const out = [];
  for (const course of COURSES) {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        out.push({ ...lesson, courseId: course.id, unitId: unit.id });
      }
    }
  }
  return out;
}

export function lessonById(id) {
  return allLessons().find((l) => l.id === id) || null;
}

export function courseById(id) {
  return COURSES.find((c) => c.id === id) || null;
}

export function courseOfLesson(id) {
  const l = lessonById(id);
  return l ? courseById(l.courseId) : null;
}

export function nextLessonId(id) {
  const list = allLessons();
  const i = list.findIndex((l) => l.id === id);
  return i >= 0 && i < list.length - 1 ? list[i + 1].id : null;
}

// True if `id` is the last lesson of its course (next lesson is in a different course, or none).
export function isLastInCourse(id) {
  const l = lessonById(id);
  if (!l) return false;
  const nextId = nextLessonId(id);
  if (!nextId) return true;
  return lessonById(nextId).courseId !== l.courseId;
}
```

- [ ] **Step 4: Verify it passes** — controller runs the curriculum tests; expected PASS.

- [ ] **Step 5: Register the test file** — Edit `tests/run-tests.html`: find the line `  await import("./audio.test.js");` and add immediately after it:

```html
  await import("./curriculum.test.js");
```

- [ ] **Step 6: Commit**

```bash
git add js/curriculum.js tests/curriculum.test.js tests/run-tests.html
git commit -m "feat: add full Beginner-Advanced curriculum data and lookups"
```

---

## Task 3: `lessons.js` — domain logic (stars, unlocks, progress, text)

**Files:**
- Create: `js/lessons.js`
- Create: `tests/lessons.test.js`
- Modify: `tests/run-tests.html`

- [ ] **Step 1: Create `tests/lessons.test.js`**

```js
import { test, assert, assertEqual } from "./harness.js";
import { computeStars, isUnlocked, firstIncompleteLessonId, courseProgress, lessonText } from "../js/lessons.js";
import { allLessons } from "../js/curriculum.js";

// A fake store: maps id -> {completed}. getLesson mirrors the real Storage interface.
function fakeStore(completedMap = {}) {
  return {
    _d: Object.fromEntries(
      Object.keys(completedMap).map((k) => [k, { completed: completedMap[k], stars: 1, bestWpm: 0, bestAccuracy: 0 }])
    ),
    getLesson(id) { return this._d[id] || null; },
  };
}

const PASS = { minAccuracy: 0.9, minWpm: 8 };

test("computeStars: 0 stars when below either threshold", () => {
  assertEqual(computeStars({ accuracy: 0.8, wpm: 20 }, PASS), 0);
  assertEqual(computeStars({ accuracy: 0.95, wpm: 5 }, PASS), 0);
});

test("computeStars: 1, 2, and 3 star tiers", () => {
  assertEqual(computeStars({ accuracy: 0.92, wpm: 10 }, PASS), 1);
  assertEqual(computeStars({ accuracy: 0.96, wpm: 10 }, PASS), 2);
  assertEqual(computeStars({ accuracy: 0.99, wpm: 12 }, PASS), 3); // wpm >= 8*1.5
  assertEqual(computeStars({ accuracy: 0.99, wpm: 11 }, PASS), 2); // wpm below 3-star bar
});

test("isUnlocked: first lesson is always unlocked; later needs previous completed", () => {
  const list = allLessons();
  const none = fakeStore({});
  assertEqual(isUnlocked(none, list[0].id), true);
  assertEqual(isUnlocked(none, list[1].id), false);
  const first = fakeStore({ [list[0].id]: true });
  assertEqual(isUnlocked(first, list[1].id), true);
  assertEqual(isUnlocked(none, "unknown-id"), false);
});

test("firstIncompleteLessonId walks the ladder", () => {
  const list = allLessons();
  assertEqual(firstIncompleteLessonId(fakeStore({})), list[0].id);
  assertEqual(firstIncompleteLessonId(fakeStore({ [list[0].id]: true })), list[1].id);
});

test("courseProgress counts completed lessons within a course", () => {
  const beginner = allLessons().filter((l) => l.courseId === "beginner");
  const p = courseProgress(fakeStore({ [beginner[0].id]: true, [beginner[1].id]: true }), "beginner");
  assertEqual(p.total, beginner.length);
  assertEqual(p.done, 2);
});

test("lessonText returns content, or generates a drill from newKeys", () => {
  assertEqual(lessonText({ content: "abc" }), "abc");
  const gen = lessonText({ newKeys: ["f", "j"] });
  assert(gen.includes("fff") && gen.includes("jjj"), "generated drill repeats the keys");
});
```

- [ ] **Step 2: Verify it fails** — controller runs; expected FAIL (module 404).

- [ ] **Step 3: Create `js/lessons.js`**

```js
// js/lessons.js — lesson domain logic built on curriculum data + the storage interface.
import { allLessons } from "./curriculum.js";

// Stars from an attempt against a course pass threshold.
//  0 = did not pass; 1 = passed; 2 = high accuracy; 3 = high accuracy AND speed.
export function computeStars(result, pass) {
  const { accuracy, wpm } = result;
  if (accuracy < pass.minAccuracy || wpm < pass.minWpm) return 0;
  let stars = 1;
  if (accuracy >= 0.95) stars = 2;
  if (accuracy >= 0.98 && wpm >= pass.minWpm * 1.5) stars = 3;
  return stars;
}

// A lesson is unlocked if it is the first lesson, or the lesson before it is completed.
export function isUnlocked(store, id) {
  const list = allLessons();
  const i = list.findIndex((l) => l.id === id);
  if (i < 0) return false;
  if (i === 0) return true;
  const prev = store.getLesson(list[i - 1].id);
  return !!(prev && prev.completed);
}

// The first lesson the learner has not completed (where "Continue" should go), or null if all done.
export function firstIncompleteLessonId(store) {
  for (const l of allLessons()) {
    const p = store.getLesson(l.id);
    if (!p || !p.completed) return l.id;
  }
  return null;
}

// { total, done } completed-lesson counts for one course.
export function courseProgress(store, courseId) {
  const lessons = allLessons().filter((l) => l.courseId === courseId);
  const done = lessons.filter((l) => {
    const p = store.getLesson(l.id);
    return p && p.completed;
  }).length;
  return { total: lessons.length, done };
}

// Text the learner types: explicit content, else a deterministic drill from the new keys.
export function lessonText(lesson) {
  if (lesson.content) return lesson.content;
  const keys = lesson.newKeys || [];
  if (!keys.length) return "";
  const triples = keys.map((k) => k.repeat(3)).join(" ");
  const pairs = keys.map((k, i) => k + keys[(i + 1) % keys.length]).join(" ");
  return `${triples} ${pairs}`;
}
```

- [ ] **Step 4: Verify it passes** — controller runs; expected PASS.

- [ ] **Step 5: Register the test file** — Edit `tests/run-tests.html`: find `  await import("./curriculum.test.js");` and add immediately after it:

```html
  await import("./lessons.test.js");
```

- [ ] **Step 6: Commit**

```bash
git add js/lessons.js tests/lessons.test.js tests/run-tests.html
git commit -m "feat: add lesson domain logic (stars, unlocks, progress, text)"
```

---

## Task 4: `typing-runner.js` — shared typing UI (and refactor practice.js onto it)

The lesson player needs the exact typing UX the practice view already has (target painting, live stats, keyboard highlight, key/wrong sounds, error flash, listener lifecycle). Extract it once, reuse it twice.

**Files:**
- Create: `js/typing-runner.js`
- Create: `tests/typing-runner.test.js`
- Modify: `js/views/practice.js`
- Modify: `tests/run-tests.html`

- [ ] **Step 1: Create `tests/typing-runner.test.js`**

```js
import { test, assert, assertEqual } from "./harness.js";
import { runTyping } from "../js/typing-runner.js";

function mount() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host;
}

test("runTyping: builds target + stats + keyboard into the host", () => {
  const host = mount();
  const r = runTyping(host, "hi", {});
  assert(host.querySelector("#tr-target"), "has target");
  assert(host.querySelector("#tr-wpm"), "has wpm readout");
  assert(host.querySelector(".keyboard"), "has on-screen keyboard");
  r.destroy(); host.remove();
});

test("runTyping: typing the target calls onComplete with stats", () => {
  const host = mount();
  let done = null;
  const r = runTyping(host, "hi", { onComplete: (s) => { done = s; } });
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "i" }));
  assert(done !== null, "onComplete fired");
  assertEqual(done.index, 2);
  r.destroy(); host.remove();
});

test("runTyping: destroy removes the key listener", () => {
  const host = mount();
  let done = null;
  const r = runTyping(host, "hi", { onComplete: () => { done = true; } });
  r.destroy();
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "i" }));
  assertEqual(done, null, "no completion after destroy");
  host.remove();
});

test("runTyping: restart resets progress", () => {
  const host = mount();
  const r = runTyping(host, "hi", {});
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
  r.restart();
  assertEqual(host.querySelector("#tr-wpm").textContent, "0");
  r.destroy(); host.remove();
});
```

- [ ] **Step 2: Verify it fails** — controller runs; expected FAIL (module 404).

- [ ] **Step 3: Create `js/typing-runner.js`**

```js
// js/typing-runner.js — reusable typing UI: target + live stats + on-screen keyboard.
// Used by the Free Practice view and the lesson player.
import { TextSession } from "./engine.js";
import { renderKeyboard } from "./keyboard.js";
import { audio } from "./audio.js";
import { escapeHtml } from "./util.js";

// runTyping(host, target, { onComplete?, keyboard? }) -> { destroy, restart, get stats }
export function runTyping(host, target, opts = {}) {
  const showKeyboard = opts.keyboard !== false;
  host.innerHTML =
    `<div class="target" id="tr-target"></div>
     <div class="stats">
       <span>WPM: <b id="tr-wpm">0</b></span>
       <span>Accuracy: <b id="tr-acc">100%</b></span>
       <span>Time: <b id="tr-time">0.0s</b></span>
     </div>
     <div id="tr-kb"></div>`;

  const targetEl = host.querySelector("#tr-target");
  const wpmEl = host.querySelector("#tr-wpm");
  const accEl = host.querySelector("#tr-acc");
  const timeEl = host.querySelector("#tr-time");
  const kb = showKeyboard ? renderKeyboard(host.querySelector("#tr-kb")) : null;

  let session;
  let flashTimer = null;

  function paintTarget() {
    const i = session.index;
    targetEl.innerHTML =
      `<span class="done">${escapeHtml(target.slice(0, i))}</span>` +
      `<span class="cur">${escapeHtml(target[i] || "")}</span>` +
      `<span>${escapeHtml(target.slice(i + 1))}</span>`;
    if (kb) kb.highlight(session.nextChar);
  }

  function paintStats() {
    const s = session.stats;
    wpmEl.textContent = s.wpm;
    accEl.textContent = Math.round(s.accuracy * 100) + "%";
    timeEl.textContent = (s.elapsedMs / 1000).toFixed(1) + "s";
  }

  function flashError() {
    const curEl = targetEl.querySelector(".cur");
    if (!curEl) return;
    curEl.classList.add("err");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      const c = targetEl.querySelector(".cur");
      if (c) c.classList.remove("err");
    }, 220);
  }

  function start() {
    session = new TextSession(target, {
      onProgress: () => { paintTarget(); paintStats(); },
      onComplete: (s) => { if (opts.onComplete) opts.onComplete(s); },
    });
    paintTarget();
    paintStats();
  }

  function onKey(e) {
    if (e.key === "Tab") return;
    if (session.isComplete) return;
    if (e.key === " ") e.preventDefault();
    const before = session.index;
    const beforeErrors = session.errors;
    session.handleKey(e.key);
    if (session.isComplete) return; // completion handled by onComplete
    if (session.errors > beforeErrors) { audio.play("wrong"); flashError(); }
    else if (session.index > before) audio.play("key");
  }

  window.addEventListener("keydown", onKey);
  start();

  return {
    destroy() { window.removeEventListener("keydown", onKey); },
    restart() { start(); },
    get stats() { return session.stats; },
  };
}
```

- [ ] **Step 4: Re-implement `js/views/practice.js` on top of the runner** — replace the ENTIRE file with:

```js
// js/views/practice.js — Free Practice: type a fixed sample using the shared runner.
import { runTyping } from "../typing-runner.js";
import { audio } from "../audio.js";

const SAMPLE = "the quick brown fox jumps over the lazy dog";

export function practiceView(host) {
  host.innerHTML =
    `<h1>Free Practice</h1>
     <div id="run"></div>
     <div id="done" style="margin-top:16px"></div>`;

  const runHost = host.querySelector("#run");
  const doneEl = host.querySelector("#done");
  let runner;

  function onComplete(s) {
    audio.play("lessonComplete");
    doneEl.innerHTML =
      `<p><b>Done!</b> ${s.wpm} WPM, ${Math.round(s.accuracy * 100)}% accuracy. ` +
      `<button id="again" class="btn-primary">Try again</button></p>`;
    doneEl.querySelector("#again").addEventListener("click", () => {
      doneEl.innerHTML = "";
      runner.restart();
    });
  }

  runner = runTyping(runHost, SAMPLE, { onComplete });

  return { destroy() { runner.destroy(); } };
}
```

- [ ] **Step 5: Verify** — controller runs the runner tests (PASS) and re-checks Free Practice end-to-end in the browser (types the sample → "Done!" appears, keyboard highlights, no console errors).

- [ ] **Step 6: Register the test file** — Edit `tests/run-tests.html`: find `  await import("./lessons.test.js");` and add immediately after it:

```html
  await import("./typing-runner.test.js");
```

- [ ] **Step 7: Commit**

```bash
git add js/typing-runner.js js/views/practice.js tests/typing-runner.test.js tests/run-tests.html
git commit -m "refactor: extract shared typing-runner; reuse in practice view"
```

---

## Task 5: `celebrate.js` + `celebrate.css`

**Files:**
- Create: `js/celebrate.js`
- Create: `styles/celebrate.css`
- Create: `tests/celebrate.test.js`
- Modify: `index.html`
- Modify: `tests/run-tests.html`

- [ ] **Step 1: Create `tests/celebrate.test.js`**

```js
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
```

- [ ] **Step 2: Verify it fails** — controller runs; expected FAIL (module 404).

- [ ] **Step 3: Create `js/celebrate.js`**

```js
// js/celebrate.js — confetti overlay + a one-call lesson celebration.
import { audio } from "./audio.js";

const COLORS = ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7", "#b197fc", "#f783ac"];

// Rain confetti for durationMs, then clean up. Returns the canvas (also used by tests).
export function confetti(durationMs = 1600) {
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const N = 140;
  const parts = Array.from({ length: N }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    vx: (Math.random() - 0.5) * 140,
    vy: 120 + Math.random() * 200,
    size: 6 + Math.random() * 7,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 9,
  }));

  let last = null;
  let elapsed = 0;
  let raf = 0;
  let cleaned = false;

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    cancelAnimationFrame(raf);
    canvas.remove();
  }

  function frame(t) {
    if (cleaned) return;
    if (last === null) last = t;
    let dt = (t - last) / 1000;
    last = t;
    if (dt > 0.05) dt = 0.05;
    elapsed += dt * 1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.rot += p.vr * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    if (elapsed < durationMs) raf = requestAnimationFrame(frame);
    else cleanup();
  }
  raf = requestAnimationFrame(frame);
  // Guaranteed cleanup even if rAF is throttled (e.g. the tab is hidden).
  setTimeout(cleanup, durationMs + 150);
  return canvas;
}

// Play the completion chime and rain confetti. Returns the confetti canvas.
export function celebrateLesson(durationMs = 1600) {
  audio.play("lessonComplete");
  return confetti(durationMs);
}
```

- [ ] **Step 4: Create `styles/celebrate.css`**

```css
.confetti-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }

/* Lesson results panel */
.lesson-result { background: #fff; border-radius: 14px; padding: 20px 24px; margin-top: 16px;
  box-shadow: 0 8px 24px rgba(0,60,120,.15); text-align: center; }
.lesson-result h2 { margin: 0 0 6px; color: #1864ab; }
.lesson-result .stat { font-weight: 700; margin: 0 10px; }
.lesson-result .stat b { color: #1864ab; }
.lesson-result .actions { margin-top: 14px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.lesson-result .actions a, .lesson-result .actions button {
  font: inherit; text-decoration: none; border: 0; border-radius: 8px; padding: 8px 16px; cursor: pointer; }

/* Animated stars */
.stars { font-size: 40px; letter-spacing: 6px; height: 48px; }
.stars .star { display: inline-block; opacity: 0; transform: scale(.3); animation: star-pop .4s ease forwards; }
.stars .star:nth-child(2) { animation-delay: .15s; }
.stars .star:nth-child(3) { animation-delay: .3s; }
.stars .dim { opacity: .25; }
@keyframes star-pop { to { opacity: 1; transform: scale(1); } }

/* Curriculum browser */
.course { margin-bottom: 26px; }
.course h2 { color: #1864ab; margin-bottom: 4px; }
.course .progress { color: #495057; font-size: 14px; margin-bottom: 10px; }
.unit h3 { margin: 12px 0 6px; font-size: 16px; color: #343a40; }
.lesson-list { display: flex; flex-wrap: wrap; gap: 10px; }
.lesson-chip { display: flex; flex-direction: column; gap: 4px; min-width: 150px; padding: 10px 14px;
  background: #fff; border-radius: 12px; box-shadow: 0 3px 10px rgba(0,60,120,.1);
  text-decoration: none; color: #1b2733; }
.lesson-chip .chip-stars { font-size: 14px; color: #f59f00; }
.lesson-chip.locked { opacity: .5; cursor: not-allowed; }
.lesson-chip:not(.locked):hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,60,120,.18); }
```

- [ ] **Step 5: Link the stylesheet** — Edit `index.html`: find the line `<link rel="stylesheet" href="styles/keyboard.css" />` and add immediately after it:

```html
<link rel="stylesheet" href="styles/celebrate.css" />
```

- [ ] **Step 6: Verify it passes** — controller runs the celebrate tests; expected PASS.

- [ ] **Step 7: Register the test file** — Edit `tests/run-tests.html`: find `  await import("./typing-runner.test.js");` and add immediately after it:

```html
  await import("./celebrate.test.js");
```

- [ ] **Step 8: Commit**

```bash
git add js/celebrate.js styles/celebrate.css tests/celebrate.test.js index.html tests/run-tests.html
git commit -m "feat: add confetti celebration and lesson celebration helper"
```

---

## Task 6: Lessons view (curriculum browser + lesson player) + routing

**Files:**
- Create: `js/views/lessons.js`
- Modify: `js/app.js`
- Modify: `index.html`

This is integration — verified in a real browser, not the harness.

- [ ] **Step 1: Create `js/views/lessons.js`**

```js
// js/views/lessons.js — curriculum browser (#/lessons) and lesson player (#/lessons/:id).
import { store } from "../storage.js";
import { COURSES, lessonById, courseOfLesson, nextLessonId } from "../curriculum.js";
import { isUnlocked, computeStars, lessonText, courseProgress } from "../lessons.js";
import { runTyping } from "../typing-runner.js";
import { celebrateLesson } from "../celebrate.js";
import { escapeHtml } from "../util.js";

export function lessonsView(host) {
  const path = (location.hash || "").slice(1);          // "/lessons" or "/lessons/<id>"
  const m = path.match(/^\/lessons\/(.+)$/);
  return m ? playerView(host, decodeURIComponent(m[1])) : browserView(host);
}

// ---- Curriculum browser ----
function browserView(host) {
  const starStr = (n) => "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n);
  let html = `<h1>Lessons</h1>`;
  for (const course of COURSES) {
    const prog = courseProgress(store, course.id);
    html += `<section class="course"><h2>${escapeHtml(course.title)}</h2>` +
      `<div class="progress">${prog.done} / ${prog.total} lessons complete</div>`;
    for (const unit of course.units) {
      html += `<div class="unit"><h3>${escapeHtml(unit.title)}</h3><div class="lesson-list">`;
      for (const lesson of unit.lessons) {
        const unlocked = isUnlocked(store, lesson.id);
        const rec = store.getLesson(lesson.id);
        const stars = rec ? rec.stars : 0;
        if (unlocked) {
          html += `<a class="lesson-chip" href="#/lessons/${encodeURIComponent(lesson.id)}">` +
            `<span>${escapeHtml(lesson.title)}</span>` +
            `<span class="chip-stars">${starStr(stars)}</span></a>`;
        } else {
          html += `<span class="lesson-chip locked"><span>🔒 ${escapeHtml(lesson.title)}</span>` +
            `<span class="chip-stars">${starStr(0)}</span></span>`;
        }
      }
      html += `</div></div>`;
    }
    html += `</section>`;
  }
  host.innerHTML = html;
  return { destroy() {} };
}

// ---- Lesson player ----
function playerView(host, id) {
  const lesson = lessonById(id);
  if (!lesson || !isUnlocked(store, id)) {
    location.hash = "#/lessons";
    return { destroy() {} };
  }
  const course = courseOfLesson(id);
  const target = lessonText(lesson);

  host.innerHTML =
    `<h1>${escapeHtml(lesson.title)}</h1>` +
    `<p><a href="#/lessons">← All lessons</a></p>` +
    `<div id="run"></div>` +
    `<div id="result"></div>`;

  const runHost = host.querySelector("#run");
  const resultEl = host.querySelector("#result");
  let runner;

  function finish(stats) {
    const stars = computeStars({ accuracy: stats.accuracy, wpm: stats.wpm }, course.pass);
    store.recordLessonResult(id, { wpm: stats.wpm, accuracy: stats.accuracy, stars });
    // everCompleted reflects the stored best, so re-practicing a passed lesson
    // never shows a discouraging message or hides the Next button.
    const rec = store.getLesson(id);
    const everCompleted = !!(rec && rec.completed);
    if (stars >= 1) celebrateLesson();

    const starHtml = [0, 1, 2].map((i) =>
      `<span class="star${i < stars ? "" : " dim"}">★</span>`).join("");
    const nextId = nextLessonId(id);
    const passed = stars >= 1;
    const headline = passed ? "Great job!" : everCompleted ? "Nice practice!" : "Keep practicing!";

    resultEl.innerHTML =
      `<div class="lesson-result">
         <h2>${headline}</h2>
         <div class="stars">${starHtml}</div>
         <p><span class="stat">WPM <b>${stats.wpm}</b></span>
            <span class="stat">Accuracy <b>${Math.round(stats.accuracy * 100)}%</b></span></p>
         ${passed || everCompleted ? "" : `<p>Reach ${Math.round(course.pass.minAccuracy * 100)}% accuracy and ${course.pass.minWpm} WPM to pass.</p>`}
         <div class="actions">
           <button id="retry" class="btn-ghost" type="button">Try again</button>
           ${everCompleted && nextId ? `<a id="next" class="btn-primary" href="#/lessons/${encodeURIComponent(nextId)}">Next lesson →</a>` : ""}
           <a class="btn-ghost" href="#/lessons">Back to lessons</a>
         </div>
       </div>`;

    resultEl.querySelector("#retry").addEventListener("click", () => {
      resultEl.innerHTML = "";
      runner.restart();
    });
  }

  runner = runTyping(runHost, target, { onComplete: finish });
  return { destroy() { runner.destroy(); } };
}
```

- [ ] **Step 2: Wire routing in `js/app.js`**

(a) Add the import. Find:
```js
import { practiceView } from "./views/practice.js";
```
Add immediately after it:
```js
import { lessonsView } from "./views/lessons.js";
```

(b) Handle the lessons routes. Find the `router` function:
```js
function router() {
  const path = (location.hash || "#/").slice(1);
  const view = routes[path] || homeView;
  mount(view);
}
```
Replace it with:
```js
function router() {
  const path = (location.hash || "#/").slice(1);
  if (path === "/lessons" || path.startsWith("/lessons/")) { mount(lessonsView); return; }
  const view = routes[path] || homeView;
  mount(view);
}
```

(c) Add a Lessons link to the placeholder home. Find:
```js
  host.innerHTML =
    `<h1>Welcome${name ? ", " + escapeHtml(name) : ""}! 👋</h1>` +
    `<p>This is the foundation build. Try <a href="#/practice">Practice</a> to type with ` +
    `the on-screen keyboard guide.</p>`;
```
Replace it with:
```js
  host.innerHTML =
    `<h1>Welcome${name ? ", " + escapeHtml(name) : ""}! 👋</h1>` +
    `<p>Start the <a href="#/lessons">Lessons</a> to learn touch typing step by step, ` +
    `or try <a href="#/practice">Free Practice</a>.</p>`;
```

- [ ] **Step 3: Add the Lessons nav link** — Edit `index.html`. Find:
```html
    <a href="#/practice">⌨️ Practice</a>
```
Replace with:
```html
    <a href="#/lessons">📚 Lessons</a>
    <a href="#/practice">⌨️ Practice</a>
```

- [ ] **Step 4: Verify in the browser** (controller, via Preview MCP). Expected:
  - `#/lessons` shows three courses; only `home-fj` is unlocked, the rest show 🔒.
  - Open `home-fj`, type its content correctly → confetti + chime, results panel with stars, progress saved.
  - Back to `#/lessons` → `home-fj` shows stars and `home-dk` is now unlocked.
  - Reload → progress persists.
  - Navigating away from a lesson mid-type removes its key listener (no double-typing).

- [ ] **Step 5: Commit**

```bash
git add js/views/lessons.js js/app.js index.html
git commit -m "feat: add lessons browser and player with stars, unlocks, celebration"
```

---

## Task 7: Full Phase 2 verification + final review

**Files:** none (verification only).

- [ ] **Step 1: Run the full unit suite.** Controller navigates the preview to `/tests/run-tests.html` and reads `window.__TESTS`. Expected: `fail === 0`; pass count includes the new curriculum, lessons, typing-runner, and celebrate tests plus the Phase 1 suite.

- [ ] **Step 2: End-to-end lesson flow** (controller, scripted in the browser):
  - Reset storage, go to `#/lessons`, confirm only the first lesson is unlocked.
  - Complete `home-fj` by dispatching its exact characters; confirm a confetti canvas appears, the result panel shows ≥1 star, and `store` records `home-fj.completed === true`.
  - Confirm `home-dk` becomes unlocked and `firstIncompleteLessonId(store)` advances.
  - Reload and confirm persistence.

- [ ] **Step 3: Practice regression.** Confirm `#/practice` still completes and shows "Done!" (the runner refactor didn't break it).

- [ ] **Step 4: Console clean.** `preview_console_logs` at error level → no errors (AudioContext autoplay warning is acceptable).

- [ ] **Step 5: Final code-quality review** of the Phase 2 diff (BASE = the Phase 1 tag `phase-1-foundation`, HEAD = current) via an independent reviewer. Address any Critical/Important findings; minor items at the controller's discretion.

- [ ] **Step 6: Tag the phase.**

```bash
git tag phase-2-lessons
```

---

## Self-Review (completed against the spec)

- **Spec coverage:**
  - *Curriculum (full Beginner→Advanced ladder, home→top→bottom→caps/punct/numbers→words→sentences→paragraphs):* Task 2 (`curriculum.js`, 31 lessons across 3 courses).
  - *Lesson player with per-character target, on-screen keyboard, live WPM/accuracy:* Tasks 4 + 6 (`typing-runner.js`, `views/lessons.js`).
  - *Sequential unlock + 1–3 stars per lesson:* Task 3 (`isUnlocked`, `computeStars`) + Task 1 (`recordLessonResult`).
  - *Celebration (confetti + sound on completion):* Task 5 (`celebrate.js`) wired in Task 6.
  - *Curriculum browser with stars/lock icons + course progress:* Task 6 (`browserView`, `courseProgress`).
  - *Certificate CTA on course completion:* intentionally deferred to **Phase 5** per the spec's phasing (course-completion detection helper `isLastInCourse` is provided now for Phase 5 to use).
- **Placeholder scan:** every code step contains complete code; no TBD/TODO.
- **Type consistency:** `store.getLesson`/`recordLessonResult`, `allLessons`/`lessonById`/`courseOfLesson`/`nextLessonId`/`isLastInCourse`, `computeStars`/`isUnlocked`/`firstIncompleteLessonId`/`courseProgress`/`lessonText`, `runTyping(host,target,{onComplete})→{destroy,restart,stats}`, `confetti`/`celebrateLesson`, and the `lessonsView` route handling are used consistently across tasks. Lesson record shape `{bestWpm,bestAccuracy,stars,completed}` matches the Phase 1 `DEFAULT_STATE.lessons` comment.
```
