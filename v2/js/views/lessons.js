// views/lessons.js — the lesson list, grouped by row, showing stars earned
// and a lock on lessons that aren't reachable yet. A lesson unlocks once the
// previous one has been completed.

import { LESSONS } from "../curriculum.js";
import { getLessonProgress } from "../state.js";
import { t } from "../i18n.js";

// A lesson is unlocked if it's the first one, or the previous is completed.
function isUnlocked(index) {
  if (index === 0) return true;
  return getLessonProgress(LESSONS[index - 1].id).completed;
}

export function renderLessons(app) {
  // group lessons in order, remembering each one's global index
  const groups = [];
  LESSONS.forEach((lesson, index) => {
    let g = groups.find((x) => x.name === lesson.group);
    if (!g) {
      g = { name: lesson.group, items: [] };
      groups.push(g);
    }
    g.items.push({ lesson, index });
  });

  const groupHtml = groups
    .map((g) => {
      const items = g.items
        .map(({ lesson, index }) => {
          const prog = getLessonProgress(lesson.id);
          const unlocked = isUnlocked(index);
          const title = t("title." + lesson.id);
          const stars = prog.stars
            ? "⭐".repeat(prog.stars) + "☆".repeat(3 - prog.stars)
            : "☆☆☆";
          if (!unlocked) {
            return `<li class="lesson-item locked" title="${t("lessons.locked")}">
                <span class="lock">🔒</span>
                <span class="lesson-name">${title}</span>
                <span class="lesson-stars">${stars}</span>
              </li>`;
          }
          return `<li class="lesson-item ${prog.completed ? "completed" : ""}">
              <a href="#/lesson/${lesson.id}">
                <span class="lesson-name">${title}</span>
                <span class="lesson-keys">${lesson.keys.map((k) => k.toUpperCase()).join(" ")}</span>
                <span class="lesson-stars">${stars}</span>
              </a>
            </li>`;
        })
        .join("");
      return `<div class="lesson-group">
          <h2>${t("group." + g.name)}</h2>
          <ul class="lesson-list">${items}</ul>
        </div>`;
    })
    .join("");

  app.innerHTML = `
    <section class="lessons">
      <h1>${t("lessons.title")}</h1>
      <p class="sub">${t("lessons.sub")}</p>
      ${groupHtml}
    </section>
  `;
}
