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
