// views/home.js — the friendly dashboard: greeting, overall progress,
// and big buttons into the lessons and the game.

import { LESSONS } from "../curriculum.js";
import { getLessonProgress, getSettings, setName, getGameBest } from "../state.js";

export function renderHome(app) {
  const { name } = getSettings();
  const best = getGameBest();

  const completed = LESSONS.filter((l) => getLessonProgress(l.id).completed).length;
  const totalStars = LESSONS.reduce((n, l) => n + getLessonProgress(l.id).stars, 0);
  const maxStars = LESSONS.length * 3;

  app.innerHTML = `
    <section class="home">
      <h1>⌨️ Ten-Finger Typing</h1>
      <p class="welcome">
        ${name ? `Hi, <span id="player-name"></span>! 👋` : "Welcome! 👋"}
        Let's learn to type with all ten fingers.
      </p>

      <div class="cards">
        <a class="card card-lessons" href="#/lessons">
          <div class="card-emoji">📚</div>
          <h2>Lessons</h2>
          <p>Learn the keys, row by row.</p>
          <p class="card-stat">${completed}/${LESSONS.length} done · ⭐ ${totalStars}/${maxStars}</p>
        </a>
        <a class="card card-game" href="#/game">
          <div class="card-emoji">🎮</div>
          <h2>Falling Letters</h2>
          <p>Type the letters before they land!</p>
          <p class="card-stat">Best score: ${best.bestScore}</p>
        </a>
      </div>

      <div class="name-row">
        <label>Your name: <input id="name-input" maxlength="20" placeholder="type your name" /></label>
        <button class="btn-ghost" id="save-name" type="button">Save</button>
      </div>
    </section>
  `;

  // Set the saved name via safe DOM APIs (textContent / value property), never
  // raw HTML interpolation — the name is user-controlled and would otherwise XSS.
  if (name) app.querySelector("#player-name").textContent = name;

  const input = app.querySelector("#name-input");
  input.value = name || "";
  app.querySelector("#save-name").addEventListener("click", () => {
    setName(input.value);
    renderHome(app); // re-render to show the new greeting
  });
}
