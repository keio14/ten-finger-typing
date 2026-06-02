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
