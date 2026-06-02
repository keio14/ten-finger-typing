# Ten-Finger Typing Platform — Design Spec

**Date:** 2026-06-02
**Status:** Draft for review

## Context

We are building a free typing-learning web app for **people who have never typed on a
device before**, modeled on the core of typing.com. It is more than a game: it has three
learning pillars — **Lessons**, **Tests**, and a **Game** — sitting on one shared typing
engine, with an on-screen finger-guidance keyboard and locally-saved progress.

An early prototype exists at `index.html` (a falling-*words* arcade game). It proved out
the game-loop + particle approach. That code will be **adapted into the new Game module**
(as falling *letters*), and `index.html` will be repurposed as the app shell.

### Decisions locked in during brainstorming

- **Curriculum depth:** full **Beginner → Intermediate → Advanced** ladder.
- **Users / storage:** single learner, progress saved in the browser via `localStorage`.
  No accounts, no server.
- **On-screen keyboard:** core feature — color-coded **fingers** + **next-key highlight**.
- **Code structure:** multi-file **static** project, **no build step** (plain ES modules,
  served as files). No Node/bundler required.
- **Game mode:** curriculum-linked falling **letters**, drawn from the keys the learner
  has unlocked.
- **Build order:** Foundation → Lessons → Tests → Game → Dashboard. Each phase is usable
  as it lands.

## Goals / Non-goals

**Goals:** take a true beginner from "never typed" to confident touch typing; teach correct
finger placement; measurable WPM/accuracy progress; fun reinforcement via the game;
**celebrate progress** with sound, animation, and printable course certificates to keep a
kid motivated; works offline by opening a file.

**Non-goals (YAGNI for v1):** accounts/login, teacher/class dashboards, multi-device sync,
multiple UI themes, multilingual layouts. All are clean later additions.

## Architecture

A single-page static app. Hash-based routing swaps views into one `<main>` container.
Everything reuses a shared engine and a shared keyboard component.

```
D:\Claude\MasterTyping\
  index.html              # app shell: top nav + <main>, loads js/app.js as a module
  styles/
    main.css              # layout, dashboard, lessons/tests/game, results
    keyboard.css          # on-screen keyboard + finger colors
    celebrate.css         # confetti, celebration results, certificate (incl. print styles)
  js/
    app.js                # entry + hash router; mounts views; first-visit name prompt
    engine.js             # TypingEngine + Stats: keystroke capture, WPM/accuracy/errors
    keyboard.js           # on-screen keyboard: render, finger colors, highlight next key
    fingers.js            # data: key -> {finger, hand, color}
    audio.js              # Web Audio sound effects + mute toggle
    celebrate.js          # confetti animation + celebration helpers
    certificate.js        # builds + renders the printable/downloadable course certificate (also its route)
    storage.js            # localStorage wrapper: name, progress, bests, unlocks, tests, certs
    curriculum.js         # data: courses -> units -> lessons (full ladder)
    achievements.js       # data + checks for a small set of badges
    views/
      dashboard.js        # home: greeting by name, progress, Continue, links, certificates
      lessons.js          # curriculum browser + lesson player + celebration on complete
      tests.js            # timed test setup, runner, results, history
      game.js             # falling-letters arcade (adapted from index.html)
```

### Data flow

1. `app.js` reads the hash, mounts the matching view into `<main>`.
2. Lesson/Test views create a `TypingEngine` over a target string. Each keystroke updates
   live stats and tells `keyboard.js` which key/finger to highlight next.
3. On completion the view computes stars/result, calls `storage.js` to persist, checks
   `achievements.js`, then renders a results panel.
4. The Game view runs its own `requestAnimationFrame` loop but reuses `Stats` for the
   end-of-round WPM/accuracy, and reads unlocked keys from `storage.js`.

## Components

### TypingEngine + Stats (`engine.js`)
- `Stats`: pure helpers — `wpm(correctChars, ms)` (chars/5 ÷ minutes), `accuracy(correct,
  total)`, error count. Reused by all three modes.
- `TextSession(target, { onProgress, onComplete })`: drives typing through a target string.
  Tracks current index, correct/incorrect per char, backspace handling, start time (on
  first keystroke), elapsed time. `onProgress` fires per keystroke with `{ index,
  nextChar, wpm, accuracy, errors }`; `onComplete` fires when the last char is correct.
- Knows nothing about lessons vs tests — the view supplies the target and reacts to events.

### On-screen keyboard (`keyboard.js` + `fingers.js`)
- Renders a QWERTY layout as DOM keys (not canvas — easier to style/highlight).
- `fingers.js` maps every key to a finger, hand, and color (standard touch-typing
  assignments; 8 finger colors + thumbs for space). Keys are tinted by finger.
- `highlight(nextChar)`: glows the next expected key and shows a hint label
  (e.g. "left index finger"). For shifted characters, also glows the correct Shift key.
- Used live by Lessons (always) and Tests (optional toggle); the Game does not need it.

### Curriculum (`curriculum.js`)
Nested data: `courses[] -> units[] -> lessons[]`. Each lesson:

```js
{
  id: 'b-home-1',
  title: 'Home Row: f and j',
  type: 'keys' | 'words' | 'sentences' | 'paragraph',
  newKeys: ['f', 'j'],          // keys introduced — drives keyboard focus + Game pool
  content: 'fff jjj fj jf ...', // explicit drill text, OR
  generate: { from: [...], length: 120 }, // rule to build randomized drill text
  pass: { minAccuracy: 0.90, minWpm: 10 }
}
```

Full ladder (outline; content authored/generated in implementation):
- **Beginner:** home row (`f j`, `d k`, `s l`, `a ;`, home-row words) → top row → bottom
  row → Shift & capitals → comma/period/basic punctuation → number row → short words &
  simple sentences.
- **Intermediate:** full sentences, mixed case, common punctuation, longer words, short
  paragraphs.
- **Advanced:** long paragraphs, symbols, numbers fluency, speed/accuracy reinforcement
  drills.

Drill-type lessons (`keys`/`words`) can be **generated** from a key pool to keep the file
manageable; `sentences`/`paragraph` lessons use authored text.

### Storage (`storage.js`)
Single `localStorage` key `mastertyping.v1`:

```js
{
  name:    'Mia',                                          // learner name (or '' if skipped)
  lessons: { [id]: { bestWpm, bestAccuracy, stars, completed: true } },
  tests:   [ { dateISO, durationSec, wpm, accuracy } ],   // history, newest first
  certificates: [ { courseId, dateISO, wpm, accuracy } ], // earned course certificates
  achievements: [ 'first-lesson', 'home-row', ... ],
  game:    { highScore, bestLevel },
  settings:{ keyboardGuide: true, sound: true }
}
```
- **Unlock rule:** lessons unlock **sequentially** — the next lesson unlocks once the
  current one is `completed` (passed its `pass` threshold). First lesson always unlocked.
- **Stars:** 1 = passed threshold; 2 = +higher accuracy; 3 = +higher WPM (thresholds per
  course tier, defined in `curriculum.js`).

### Achievements (`achievements.js`)
Small fixed set checked after each result: first lesson done, home row complete, finish a
course, reach 20 WPM, 95%+ on a test, new game high score. Each has id + label + emoji.

### Sound effects (`audio.js`)
- **Web Audio API**, fully synthesized — no asset files, works offline. A tiny helper plays
  short tones/envelopes for: keypress (soft), wrong key (low buzz), lesson complete (rising
  chime), level up, achievement unlock, game letter-clear and life-lost.
- Lazily creates the `AudioContext` on first user gesture (browser autoplay rule).
- **Mute toggle** in the top nav, persisted in `settings.sound`; respects the saved value
  on load. All other modules call `audio.play('lessonComplete')` etc. — they never touch
  Web Audio directly.

### Celebration (`celebrate.js` + `celebrate.css`)
- `confetti(durationMs)`: a self-contained canvas overlay that rains colored confetti, then
  removes itself. Reuses the delta-time + particle approach proven in the prototype game.
- `celebrateLesson(result)`: shown on lesson completion — confetti + the stars animating in
  one-by-one + the lesson-complete sound. Pure presentation; the view still owns saving.

### Certificate (`certificate.js`)
- Awarded when a learner completes **every lesson in a course/level** (Beginner /
  Intermediate / Advanced). On the result that completes the final lesson of a course, the
  course id is recorded in `storage` and a "🎉 You earned a certificate!" call-to-action
  links to the certificate route.
- `#/certificate/:courseId` renders a full-screen certificate: learner **name**, course
  title, completion **date**, and headline stats (best WPM / accuracy in that course), in a
  print-friendly layout.
- **Print / download:** a Print button uses `window.print()` with `@media print` rules in
  `celebrate.css` (certificate only, no nav). Download is the browser's "Save as PDF" via
  the same print path — no extra libraries.
- Re-viewable anytime from the Dashboard (earned certificates are listed there).

## Views

- **First-visit name prompt:** on first load with no saved name, `app.js` shows a small
  skippable "What's your name?" dialog; the value is saved to `storage` and used in the
  dashboard greeting and on certificates. Changeable later from the dashboard.
- **Dashboard** (`#/`): greeting **by name**, overall progress (% lessons complete,
  average/best WPM, best test), a **Continue** button (jumps to the first incomplete
  unlocked lesson), and cards linking to Lessons / Tests / Game. Recent achievements strip
  and a list of **earned certificates** (each re-openable/printable).
- **Lessons** (`#/lessons`, `#/lessons/:id`): a curriculum tree (courses → units → lessons
  with stars and lock icons) plus the **lesson player** — target text with per-character
  coloring (correct = green, wrong = red, current = caret), the on-screen keyboard below
  highlighting the next key + finger, and live WPM / accuracy / timer. On complete:
  **celebration** (confetti + lesson-complete sound + stars animating in), then a results
  panel (stars, stats), unlock next, Retry / Next buttons. If this lesson completes its
  course, the panel also shows the **certificate** call-to-action.
- **Tests** (`#/tests`): pick duration (1 / 3 / 5 min) over randomized words/sentences;
  timed run via the engine; on time-up a results panel with WPM/accuracy, personal best,
  and a small history list.
- **Game** (`#/game`): falling-**letters** arcade adapted from `index.html`. Letters spawn
  from the learner's unlocked key set; type the letter to clear it; letters reaching the
  floor cost a life; speed ramps per level (delta-time loop + particle burst, carried over
  from the prototype). End screen shows WPM/accuracy and saves high score.

## Error handling & edge cases

- **No/empty `localStorage`** (private mode): wrap reads/writes in try/catch; fall back to
  in-memory progress for the session and show a small "progress won't be saved" notice.
- **Corrupt saved data:** validate shape on load; on failure, reset to a fresh profile
  (and warn).
- **Backspace / overtype** in the engine: allow backspace to correct; count an error once
  per wrong keystroke (don't double-penalize corrections).
- **Browser autorepeat / modifier keys:** ignore non-printable keys except Backspace;
  ignore held-key repeats for stats where appropriate.
- **Unknown hash route:** redirect to Dashboard.

## Testing / verification

No test framework (static, no build). Verify via the Claude Preview MCP tools against the
PowerShell static server already configured in `.claude/launch.json`:

1. **Engine unit checks** (run in `preview_eval`): feed scripted keystrokes to a
   `TextSession` and assert WPM/accuracy/error math and `onComplete` timing.
2. **Lessons:** open a lesson, type it correctly → confetti + sound fire, stars +
   completion saved, next unlocks; reload → progress persists; type with errors → accuracy
   reflects it, no advance below threshold.
3. **Keyboard:** assert the correct key + finger is highlighted for the next character,
   including a shifted character.
4. **Tests:** run a short test → WPM/accuracy reported and appended to history; best
   updates.
5. **Game:** dispatch key events → letters clear, misses cost lives, level/speed ramps,
   high score saved (reuse the verification approach already used for the prototype).
6. **Storage edge cases:** simulate corrupt/missing data → resets gracefully.
7. **Sound:** mute toggle silences all effects and persists across reload; audio starts
   only after a user gesture (no autoplay error in console).
8. **Name + certificate:** first visit prompts for a name (skippable) → greeting reflects
   it; completing the final lesson of a course records a certificate and reveals the CTA;
   the certificate route shows name/course/date/stats and prints cleanly (print preview =
   certificate only, no nav).

## Phased delivery

Each phase is independently usable and gets its own implementation plan.

1. **Foundation:** app shell + router, `engine.js` (+Stats), `keyboard.js`/`fingers.js`,
   `storage.js`, `audio.js` (+ mute toggle), first-visit name prompt. Demo: type a
   hardcoded string with live stats, keyboard guidance, and keypress sounds.
2. **Lessons + celebration:** `curriculum.js` (full ladder) + Lessons view + lesson player
   + unlock/stars + `celebrate.js` (confetti + sounds on completion).
3. **Tests:** Tests view + timed runner + history.
4. **Game:** adapt the prototype into the falling-letters Game view, tied to unlocked keys,
   with sound effects.
5. **Dashboard, certificates & achievements:** home overview, Continue, achievements,
   `certificate.js` (course certificates + print/download), polish.

## Open items / defaults chosen

- Pass thresholds default to **90% accuracy** for beginner drills, rising by tier; final
  numbers tunable in `curriculum.js`.
- Hands illustration on the keyboard is **out of scope for v1** (finger colors + labels are
  enough); can be added later.
- The old falling-words game is **replaced**, not kept as a second game.
