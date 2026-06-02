# Typing Platform — Phase 3 (Timed Tests) Plan

> Executed via superpowers:subagent-driven-development. Full verbatim code lives in the per-task implementer dispatches; this doc is the design record + task list.

**Goal:** Timed typing speed tests (1/3/5 min) reporting WPM + accuracy, with a saved personal-best and recent-results history.

**Architecture:** Reuse the Phase 1/2 foundation. A timed test = `runTyping` over a long generated word stream, bounded by a countdown timer instead of target completion. On time-up, read `runner.stats`, persist via new `storage` test methods, and show results + history. Test text comes from a small `testgen.js` generator (rng-injectable for tests).

**Tech stack:** unchanged (vanilla ES modules, in-browser test harness).

## Files
- `js/storage.js` (MODIFY): `addTest({durationSec,wpm,accuracy})`, `getTests()`, `bestTest()`.
- `js/testgen.js` (NEW): `testText(wordCount, rng)` → space-joined random words.
- `js/views/tests.js` (NEW): duration picker → timed run (reuses `runTyping`) → results + history.
- `js/app.js` (MODIFY): route `/tests` → `testsView`.
- `index.html` (MODIFY): Tests nav link.
- `styles/main.css` (MODIFY): test picker / timer / history styles.
- Tests: `tests/testgen.test.js` (NEW), additions to `tests/storage.test.js`, register in `tests/run-tests.html`.

## Tasks
1. **storage test methods + testgen** — `addTest`/`getTests`/`bestTest` (+tests); `testgen.js` (+tests); register test files. Controller verifies via direct import.
2. **tests view + routing + styles** — `views/tests.js`, route, nav link, CSS. Controller verifies end-to-end in browser (run a short test, results + history persist).
3. **Verify + review + tag** — full suite, e2e, console clean, independent review, tag `phase-3-tests`.

## Key signatures
- `addTest({durationSec,wpm,accuracy})` → unshift `{dateISO,durationSec,wpm,accuracy}`, cap 20, returns the record.
- `bestTest()` → highest-wpm record or `null`.
- `testText(wordCount=60, rng=Math.random)` → string of `wordCount` words.
- `testsView(host)` → `{destroy}`; uses a `setInterval` countdown + `runTyping`; cleans up both on destroy/time-up.

## Verification
Full harness green; in-browser: pick 1 min (or a controller-shortened run), type, confirm WPM/accuracy shown, record saved newest-first, best computed, history renders, console clean.
