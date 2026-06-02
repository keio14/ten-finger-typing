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
    if (stars >= 1) celebrateLesson();

    const starHtml = [0, 1, 2].map((i) =>
      `<span class="star${i < stars ? "" : " dim"}">★</span>`).join("");
    const nextId = nextLessonId(id);
    const passed = stars >= 1;

    resultEl.innerHTML =
      `<div class="lesson-result">
         <h2>${passed ? "Great job!" : "Keep practicing!"}</h2>
         <div class="stars">${starHtml}</div>
         <p><span class="stat">WPM <b>${stats.wpm}</b></span>
            <span class="stat">Accuracy <b>${Math.round(stats.accuracy * 100)}%</b></span></p>
         ${passed ? "" : `<p>Reach ${Math.round(course.pass.minAccuracy * 100)}% accuracy and ${course.pass.minWpm} WPM to pass.</p>`}
         <div class="actions">
           <button id="retry" class="btn-ghost" type="button">Try again</button>
           ${passed && nextId ? `<a id="next" class="btn-primary" href="#/lessons/${encodeURIComponent(nextId)}">Next lesson →</a>` : ""}
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
