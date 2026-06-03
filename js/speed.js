// speed.js — the speed-practice runner for one tier. Same typing engine as a
// lesson, but the goal is SPEED: a big live words-per-minute readout and a
// target WPM to beat. The on-screen keyboard is shown only for tiers that ask
// for it (Beginner → Intermediate); Advanced/Expert hide it so she stops
// looking at her hands. A passage is chosen per run (random, or a specific one
// via #/speed/<id>/<index>): "Try again" replays the same one, "Another test"
// loads a different one at the same level.

import { getTier, nextTier } from "./speedlevels.js";
import { renderKeyboard } from "./keyboard.js";
import { accuracyPct, wpm, speedStars, isTypingKey } from "./typing.js";
import { recordSpeed } from "./state.js";
import { t } from "./i18n.js";
import * as audio from "./audio.js";
import { celebrate } from "./celebrate.js";

// A different passage index than `current` (so "Another test" actually changes
// the exercise). Falls back to the same index when there is only one passage.
function otherIndex(current, count) {
  if (count <= 1) return current;
  return (current + 1 + Math.floor(Math.random() * (count - 1))) % count;
}

export function renderSpeed(app, id, passageIndex) {
  const tier = getTier(id);
  if (!tier) {
    app.innerHTML = `<p class="empty"><a href="#/speed">${t("speed.allLevels")}</a></p>`;
    return;
  }

  const n = tier.passages.length;
  const hasIndex = typeof passageIndex === "number" && passageIndex >= 0 && passageIndex < n;
  const index = hasIndex ? passageIndex : Math.floor(Math.random() * n);
  // When we picked at random, pin the choice into the URL so "Try again"
  // replays the SAME exercise (and language switches keep it too).
  if (!hasIndex) history.replaceState(null, "", `#/speed/${id}/${index}`);

  const name = t("speedtier." + id);
  const target = tier.passages[index];

  app.innerHTML = `
    <section class="speed-run">
      <a class="back" href="#/speed">${t("speed.back")}</a>
      <h1>⚡ ${name}</h1>
      <div class="speed-readout">
        <div class="wpm-big"><b id="wpm">0</b><span>${t("speed.wpm")}</span></div>
        <div class="speed-meta">
          <span>🎯 ${t("speed.target")}: <b>${tier.targetWpm}</b> ${t("speed.wpm")}</span>
          <span>✅ ${t("speed.accuracy")}: <b id="acc">100</b>%</span>
        </div>
      </div>
      <p class="speed-go">${t("speed.go")}</p>
      <div class="typed-line" id="typed-line" aria-label="speed text"></div>
      <div id="kb"></div>
    </section>
  `;

  const lineEl = app.querySelector("#typed-line");
  const wpmEl = app.querySelector("#wpm");
  const accEl = app.querySelector("#acc");
  const kb = tier.showKeyboard ? renderKeyboard(app.querySelector("#kb")) : null;

  const charEls = [...target].map((ch) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.textContent = ch === " " ? " " : ch;
    if (ch === " ") s.classList.add("ch-space");
    lineEl.appendChild(s);
    return s;
  });

  let pos = 0;
  let correct = 0;
  let total = 0;
  let startedAt = 0;
  let done = false;

  function updateGuide() {
    charEls.forEach((el, i) => el.classList.toggle("ch-current", i === pos));
    if (kb) kb.highlight(target[pos]);
  }

  function refreshStats() {
    accEl.textContent = accuracyPct(correct, total);
    wpmEl.textContent = startedAt ? wpm(correct, performance.now() - startedAt) : 0;
  }

  function finish() {
    done = true;
    window.removeEventListener("keydown", onKey);
    if (kb) kb.clearHighlight();
    const elapsed = performance.now() - startedAt;
    const finalWpm = wpm(correct, elapsed);
    const accuracy = accuracyPct(correct, total);
    const stars = speedStars(finalWpm, accuracy, tier.targetWpm);
    const passed = stars >= 2;
    recordSpeed(tier.id, { stars, wpm: finalWpm });

    if (passed) {
      audio.win();
      celebrate(stars);
    }

    const next = passed ? nextTier(tier.id) : null;
    // After passing, recommend what the upcoming level is like.
    const rec = next
      ? t("speedrec." + next.id, { name: t("speedtier." + next.id), wpm: next.targetWpm })
      : "";
    lineEl.insertAdjacentHTML(
      "afterend",
      `<div class="lesson-done">
        <h2>${"⭐".repeat(stars)}</h2>
        <p>${t("speed.yourSpeed")}: <b>${finalWpm}</b> ${t("speed.wpm")} · ${t("speed.accuracy")} ${accuracy}%</p>
        <p>${passed ? t("speed.passed") : t("speed.tooSlow", { target: tier.targetWpm })}</p>
        ${rec ? `<p class="speed-rec">💡 ${rec}</p>` : ""}
        ${next ? `<a class="btn" href="#/speed/${next.id}">${t("speed.next")}</a>` : ""}
        ${passed && !next ? `<p>${t("speed.finishedAll")}</p>` : ""}
        <button class="btn-ghost" id="speed-another" type="button">${t("speed.another")}</button>
        <button class="btn-ghost" id="speed-again" type="button">${t("speed.retry")}</button>
        <a class="btn-ghost" href="#/speed">${t("speed.allLevels")}</a>
      </div>`
    );

    // "Try again" replays the SAME passage; "Another test" loads a new one at
    // the same level. Both go through the router (app:rerender / hashchange) so
    // the keydown listener is always cleaned up — a plain same-hash link would
    // not re-render at all (that was the old broken "Try again").
    app.querySelector("#speed-again").addEventListener("click", () => {
      window.dispatchEvent(new Event("app:rerender"));
    });
    app.querySelector("#speed-another").addEventListener("click", () => {
      const ni = otherIndex(index, n);
      if (ni === index) {
        window.dispatchEvent(new Event("app:rerender"));
      } else {
        location.hash = `#/speed/${tier.id}/${ni}`;
      }
    });
  }

  function onKey(e) {
    if (done) return;
    if (!isTypingKey(e)) return;
    e.preventDefault();

    if (!startedAt) startedAt = performance.now();
    const want = target[pos];
    const got = e.key;
    total++;

    if (got === want) {
      correct++;
      charEls[pos].classList.remove("ch-wrong");
      charEls[pos].classList.add("ch-right");
      if (kb) kb.flash(got, true);
      pos++;
      if (pos >= target.length) {
        refreshStats();
        finish();
        return;
      }
      audio.correct();
    } else {
      charEls[pos].classList.add("ch-wrong");
      if (kb) kb.flash(got, false);
      audio.wrong();
    }
    updateGuide();
    refreshStats();
  }

  window.addEventListener("keydown", onKey);
  updateGuide();
  refreshStats();

  return () => window.removeEventListener("keydown", onKey);
}
