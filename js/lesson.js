// lesson.js — the typing trainer view for a single lesson.
// Shows the drill text with a moving caret, captures keystrokes, gives
// per-key green/red feedback, drives the on-screen keyboard guide, and on
// completion awards 1–3 stars, saves progress, and unlocks the next lesson.

import { getLesson, nextLesson } from "./curriculum.js";
import { renderKeyboard } from "./keyboard.js";
import { fingerFor } from "./fingers.js";
import { accuracyPct, wpm, starsFor, isTypingKey } from "./typing.js";
import { recordLesson } from "./state.js";
import { t } from "./i18n.js";
import * as audio from "./audio.js";
import { celebrate } from "./celebrate.js";

export function renderLesson(app, id) {
  const lesson = getLesson(id);
  if (!lesson) {
    app.innerHTML = `<p class="empty">Lesson not found. <a href="#/lessons">${t("lesson.allLessons")}</a></p>`;
    return;
  }

  // Join the drill lines into one target string separated by spaces.
  const target = lesson.drills.join(" ");

  app.innerHTML = `
    <section class="lesson">
      <a class="back" href="#/lessons">${t("lesson.back")}</a>
      <h1>${t("title." + lesson.id)}</h1>
      <p class="lesson-hint" id="finger-hint"></p>
      <div class="typed-line" id="typed-line" aria-label="drill text"></div>
      <div class="stats">
        <span>✅ ${t("lesson.accuracy")}: <b id="acc">100</b>%</span>
        <span>⚡ ${t("lesson.speed")}: <b id="wpm">0</b> ${t("lesson.wpmUnit")}</span>
        <span>📍 <b id="pos">0</b>/${target.length}</span>
      </div>
      <div id="kb"></div>
      <p class="tip">${t("lesson.tip")}</p>
    </section>
  `;

  const lineEl = app.querySelector("#typed-line");
  const accEl = app.querySelector("#acc");
  const wpmEl = app.querySelector("#wpm");
  const posEl = app.querySelector("#pos");
  const hintEl = app.querySelector("#finger-hint");
  const kb = renderKeyboard(app.querySelector("#kb"));

  // Render each target char as its own span so we can color it as typed.
  const charEls = [...target].map((ch) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.textContent = ch === " " ? " " : ch; // visible space
    if (ch === " ") s.classList.add("ch-space");
    lineEl.appendChild(s);
    return s;
  });

  let pos = 0;
  let correct = 0;
  let total = 0;
  let startedAt = 0; // set on first keypress
  let done = false;

  function expectedChar() {
    return target[pos];
  }

  function updateGuide() {
    const ch = expectedChar();
    charEls.forEach((el, i) => el.classList.toggle("ch-current", i === pos));
    kb.highlight(ch);
    if (ch === " ") {
      hintEl.textContent = t("lesson.nextSpace");
    } else {
      const f = fingerFor(ch);
      hintEl.textContent = f ? t("lesson.nextKey", { ch, finger: t("finger." + f.id) }) : "";
    }
  }

  function refreshStats() {
    accEl.textContent = accuracyPct(correct, total);
    posEl.textContent = pos;
    wpmEl.textContent = startedAt ? wpm(correct, performance.now() - startedAt) : 0;
  }

  function finish() {
    done = true;
    window.removeEventListener("keydown", onKey);
    kb.clearHighlight();
    const accuracy = accuracyPct(correct, total);
    const stars = starsFor(accuracy, lesson.targetAccuracy);
    recordLesson(lesson.id, { stars, accuracy });
    audio.win();
    celebrate(stars);

    const next = nextLesson(lesson.id);
    hintEl.textContent = "";
    lineEl.insertAdjacentHTML(
      "afterend",
      `<div class="lesson-done">
        <h2>${"⭐".repeat(stars)}</h2>
        <p>${t("lesson.doneMsg", { acc: accuracy })}</p>
        ${next
          ? `<a class="btn" href="#/lesson/${next.id}">${t("lesson.next")}</a>`
          : `<p>${t("lesson.finishedAll")}</p>`}
        <button class="btn-ghost" id="lesson-again" type="button">${t("lesson.tryAgain")}</button>
        <a class="btn-ghost" href="#/lessons">${t("lesson.allLessons")}</a>
      </div>`
    );
    // "Try again" re-runs THIS lesson. It points at the page we're already on,
    // so a plain link wouldn't reload — re-render through the router instead.
    app.querySelector("#lesson-again").addEventListener("click", () => {
      window.dispatchEvent(new Event("app:rerender"));
    });
  }

  function onKey(e) {
    if (done) return;
    // only single printable chars + space; ignore modifiers/navigation keys
    if (!isTypingKey(e)) return;
    e.preventDefault();

    if (!startedAt) startedAt = performance.now();
    const want = expectedChar();
    const got = e.key;
    total++;

    if (got === want) {
      correct++;
      charEls[pos].classList.remove("ch-wrong");
      charEls[pos].classList.add("ch-right");
      kb.flash(got, true);
      pos++;
      if (pos >= target.length) {
        refreshStats();
        finish(); // plays audio.win(); the per-key correct beep is skipped here
        return;
      }
      audio.correct();
    } else {
      // wrong key: mark current char, play a buzz, do NOT advance
      charEls[pos].classList.add("ch-wrong");
      kb.flash(got, false);
      audio.wrong();
    }
    updateGuide();
    refreshStats();
  }

  window.addEventListener("keydown", onKey);
  updateGuide();
  refreshStats();

  // Let the router stop listening when navigating away.
  return () => window.removeEventListener("keydown", onKey);
}
