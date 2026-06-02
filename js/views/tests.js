// js/views/tests.js — timed typing tests (1/3/5 min) over a generated word stream.
import { store } from "../storage.js";
import { runTyping } from "../typing-runner.js";
import { testText } from "../testgen.js";

const DURATIONS = [
  { label: "1 min", sec: 60 },
  { label: "3 min", sec: 180 },
  { label: "5 min", sec: 300 },
];

export function testsView(host) {
  let runner = null;
  let timerId = null;

  function cleanup() {
    if (runner) { runner.destroy(); runner = null; }
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function setup() {
    cleanup();
    host.innerHTML =
      `<h1>Typing Test</h1>
       <p>Pick a length and type as much as you can — accuracy counts!</p>
       <div class="test-choices">
         ${DURATIONS.map((d) => `<button class="btn-primary" data-sec="${d.sec}" type="button">${d.label}</button>`).join(" ")}
       </div>
       <div id="history"></div>`;
    host.querySelectorAll("[data-sec]").forEach((b) =>
      b.addEventListener("click", () => run(Number(b.dataset.sec))));
    renderHistory();
  }

  function renderHistory() {
    const hEl = host.querySelector("#history");
    if (!hEl) return;
    const tests = store.getTests();
    if (!tests.length) { hEl.innerHTML = ""; return; }
    const best = store.bestTest();
    hEl.innerHTML =
      `<h3>Your results</h3>` +
      (best ? `<p>Best: <b>${best.wpm} WPM</b> at ${Math.round(best.accuracy * 100)}%</p>` : "") +
      `<ul class="test-history">` +
      tests.slice(0, 8).map((t) =>
        `<li>${t.wpm} WPM · ${Math.round(t.accuracy * 100)}% · ${t.durationSec / 60} min · ${new Date(t.dateISO).toLocaleDateString()}</li>`).join("") +
      `</ul>`;
  }

  function run(sec) {
    cleanup();
    const text = testText(Math.max(40, Math.ceil((sec / 60) * 45)));
    host.innerHTML =
      `<h1>Typing Test</h1>
       <div class="test-timer">Time left: <b id="tleft">${sec}</b>s</div>
       <div id="run"></div>
       <div id="result"></div>`;
    runner = runTyping(host.querySelector("#run"), text, {});
    let left = sec;
    const tEl = host.querySelector("#tleft");
    timerId = setInterval(() => {
      left -= 1;
      if (tEl) tEl.textContent = left;
      if (left <= 0) finish(sec);
    }, 1000);
  }

  function finish(sec) {
    const s = runner ? runner.stats : { wpm: 0, accuracy: 1 };
    if (timerId) { clearInterval(timerId); timerId = null; }
    if (runner) { runner.destroy(); runner = null; }
    store.addTest({ durationSec: sec, wpm: s.wpm, accuracy: s.accuracy });
    const best = store.bestTest();
    const isBest = best && best.wpm === s.wpm;
    const resultEl = host.querySelector("#result");
    resultEl.innerHTML =
      `<div class="lesson-result">
         <h2>Time!</h2>
         <p><span class="stat">WPM <b>${s.wpm}</b></span>
            <span class="stat">Accuracy <b>${Math.round(s.accuracy * 100)}%</b></span></p>
         ${isBest ? "<p>🎉 New personal best!</p>" : (best ? `<p>Best: ${best.wpm} WPM</p>` : "")}
         <div class="actions">
           <button id="again" class="btn-primary" type="button">New test</button>
           <a class="btn-ghost" href="#/">Home</a>
         </div>
       </div>`;
    resultEl.querySelector("#again").addEventListener("click", setup);
  }

  setup();
  return { destroy: cleanup };
}
