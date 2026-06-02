# Ten-Finger Typing

A friendly, colorful typing game that teaches **ten-finger touch typing** to a
beginner (designed for an 8–10 year old). It has structured **lessons** with an
on-screen finger-colored keyboard guide, plus a lively **falling-words game**.

Built as a plain **vanilla HTML/CSS/JavaScript** app (ES modules, no build step,
no dependencies). The interface is available in **English, 简体中文, and Tiếng Việt**
(the keys you type are always English a–z).

## Play it

It's a static site, so it must be served over `http(s)` (opening the file
directly with `file://` won't work — browsers block ES modules there).

- **Hosted:** open the GitHub Pages link for this repo.
- **Locally:** serve this folder and open it, e.g.
  ```
  python -m http.server 8000
  ```
  then visit `http://localhost:8000/`.

## Run the tests

Open `tests/run-tests.html` through the same local server
(`http://localhost:8000/tests/run-tests.html`). It runs the unit suite in the
browser and prints pass/fail. Pure logic (curriculum, finger map, accuracy/WPM,
game logic, words, i18n) is covered.

## How progress is saved

All progress lives in the **browser's localStorage** under one key
(`tenfinger.v2`) — there are no accounts or server. It's per-browser and
per-device: a different browser, device, or a private window each gets its own
separate progress, and clearing site data erases it.

## Project structure

```
index.html          # app shell + nav
js/
  app.js            # boot: nav, language switcher, mute, router
  router.js         # hash routes -> views
  state.js          # localStorage-backed store
  i18n.js           # en / zh / vi UI translations
  curriculum.js     # lesson data
  fingers.js        # key -> finger + color map
  keyboard.js       # on-screen QWERTY guide
  lesson.js         # typing-trainer view
  words.js          # falling-words bank
  gamelogic.js      # PURE game math (unit-tested)
  game.js           # canvas requestAnimationFrame game loop
  typing.js         # accuracy / WPM / stars helpers
  audio.js          # WebAudio sound effects
  celebrate.js      # confetti on lesson complete
  views/            # home + lessons list
styles/             # main / keyboard / game / celebrate CSS
tests/              # in-browser test harness + suites
```
