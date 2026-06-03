// views/speedlist.js — the list of 5 speed tiers, showing each tier's target
// WPM, the stars + best WPM earned, and a lock on tiers not yet reached. A
// tier unlocks once the previous one has been PASSED (>= 2 stars = target hit).

import { SPEED_TIERS } from "../speedlevels.js";
import { getSpeedProgress } from "../state.js";
import { t } from "../i18n.js";

// First tier is always open; later tiers need the previous one passed (2+ stars).
function isUnlocked(index) {
  if (index === 0) return true;
  return getSpeedProgress(SPEED_TIERS[index - 1].id).stars >= 2;
}

export function renderSpeedList(app) {
  const items = SPEED_TIERS.map((tier, index) => {
    const prog = getSpeedProgress(tier.id);
    const unlocked = isUnlocked(index);
    const name = t("speedtier." + tier.id);
    const stars = prog.stars
      ? "⭐".repeat(prog.stars) + "☆".repeat(3 - prog.stars)
      : "☆☆☆";
    const best = prog.bestWpm
      ? `<span class="speed-bestwpm">${t("speed.best")} ${prog.bestWpm} ${t("speed.wpm")}</span>`
      : "";

    if (!unlocked) {
      return `<li class="lesson-item locked" title="${t("speed.locked")}">
          <span class="lock">🔒</span>
          <span class="lesson-name">${name}</span>
          <span class="speed-tiertarget">🎯 ${tier.targetWpm} ${t("speed.wpm")}</span>
          <span class="lesson-stars">${stars}</span>
        </li>`;
    }
    return `<li class="lesson-item ${prog.completed ? "completed" : ""}">
        <a href="#/speed/${tier.id}">
          <span class="lesson-name">${name}</span>
          <span class="speed-tiertarget">🎯 ${tier.targetWpm} ${t("speed.wpm")}</span>
          ${best}
          <span class="lesson-stars">${stars}</span>
        </a>
      </li>`;
  }).join("");

  app.innerHTML = `
    <section class="lessons">
      <h1>${t("speed.title")}</h1>
      <p class="sub">${t("speed.sub")}</p>
      <ul class="lesson-list">${items}</ul>
    </section>
  `;
}
