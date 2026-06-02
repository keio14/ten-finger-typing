// views/home.js — the friendly dashboard: greeting, a colorful progress
// panel, big buttons into the lessons and the game, and a name field.

import { LESSONS } from "../curriculum.js";
import { getLessonProgress, getSettings, setName, getGameBest } from "../state.js";
import { t } from "../i18n.js";

export function renderHome(app) {
  const { name } = getSettings();
  const best = getGameBest();

  const completed = LESSONS.filter((l) => getLessonProgress(l.id).completed).length;
  const totalStars = LESSONS.reduce((n, l) => n + getLessonProgress(l.id).stars, 0);
  const maxStars = LESSONS.length * 3;
  const nextLesson = LESSONS.find((l) => !getLessonProgress(l.id).completed);
  const nextText = nextLesson ? t("title." + nextLesson.id) : t("home.allDone");
  const nextHref = nextLesson ? `#/lesson/${nextLesson.id}` : "#/lessons";

  app.innerHTML = `
    <section class="home">
      <header class="hero">
        <h1>${t("home.title")}</h1>
        <p class="welcome" id="welcome"></p>
      </header>

      <div class="progress-panel">
        <a class="progress-tile" href="#/lessons">
          <div class="tile-num">⭐ ${totalStars}<span class="tile-max">/${maxStars}</span></div>
          <div class="tile-label">${t("home.stars")}</div>
        </a>
        <a class="progress-tile" href="#/lessons">
          <div class="tile-num">${completed}<span class="tile-max">/${LESSONS.length}</span></div>
          <div class="tile-label">${t("home.completed")}</div>
        </a>
        <a class="progress-tile" href="#/game">
          <div class="tile-num">🏆 ${best.bestScore}</div>
          <div class="tile-label">${t("game.best")}</div>
        </a>
        <a class="progress-tile tile-next" href="${nextHref}">
          <div class="tile-num tile-next-text">${nextText}</div>
          <div class="tile-label">${t("home.next")}</div>
        </a>
      </div>

      <div class="cards">
        <a class="card card-lessons" href="#/lessons">
          <div class="card-emoji">📚</div>
          <h2>${t("home.lessons")}</h2>
          <p>${t("home.lessonsDesc")}</p>
        </a>
        <a class="card card-game" href="#/game">
          <div class="card-emoji">🎮</div>
          <h2>${t("home.game")}</h2>
          <p>${t("home.gameDesc")}</p>
        </a>
      </div>

      <div class="name-row">
        <label>${t("home.yourName")}
          <input id="name-input" maxlength="20" placeholder="${t("home.namePlaceholder")}" />
        </label>
        <button class="btn-ghost" id="save-name" type="button">${t("home.save")}</button>
      </div>
    </section>
  `;

  // Set name-dependent text via safe DOM APIs (never raw HTML interpolation).
  app.querySelector("#welcome").textContent = name
    ? t("home.welcomeNamed", { name })
    : t("home.welcome");

  const input = app.querySelector("#name-input");
  input.value = name || "";
  app.querySelector("#save-name").addEventListener("click", () => {
    setName(input.value);
    // tell the nav to refresh its greeting, then re-render home
    window.dispatchEvent(new Event("app:settings-changed"));
    renderHome(app);
  });
}
