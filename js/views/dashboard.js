// js/views/dashboard.js — home screen: progress, continue, mode cards, badges, certificates.
import { store } from "../storage.js";
import { allLessons, courseById } from "../curriculum.js";
import { firstIncompleteLessonId } from "../lessons.js";
import { evaluate, syncAchievements } from "../achievements.js";
import { syncCertificates } from "../certificate.js";
import { escapeHtml } from "../util.js";

export function dashboardView(host) {
  // Bring derived progress up to date on every visit.
  syncAchievements(store);
  syncCertificates(store, new Date().toISOString());

  const lessons = allLessons();
  const done = lessons.filter((l) => { const p = store.getLesson(l.id); return p && p.completed; }).length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  const best = store.bestTest();
  const name = store.getName();
  const contId = firstIncompleteLessonId(store);
  const earned = evaluate(store);
  const certs = store.getCertificates();

  const continueCard = contId
    ? `<a class="dash-card" href="#/lessons/${encodeURIComponent(contId)}"><h3>▶ Continue</h3><p>Pick up where you left off</p></a>`
    : `<a class="dash-card" href="#/lessons"><h3>✅ All lessons done!</h3><p>Review any lesson</p></a>`;

  host.innerHTML =
    `<h1>Hi ${name ? escapeHtml(name) : "there"}! 👋</h1>
     <div class="dash-progress">
       <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
       <span>${done} / ${lessons.length} lessons (${pct}%)</span>
     </div>
     <p class="dash-stats">${best ? `Best test: <b>${best.wpm} WPM</b> at ${Math.round(best.accuracy * 100)}%` : "No tests yet — give one a try!"}</p>
     <div class="dash-cards">
       ${continueCard}
       <a class="dash-card" href="#/lessons"><h3>📚 Lessons</h3><p>Learn step by step</p></a>
       <a class="dash-card" href="#/tests"><h3>⏱️ Tests</h3><p>Check your speed</p></a>
       <a class="dash-card" href="#/game"><h3>🎮 Game</h3><p>Letter Rain</p></a>
     </div>
     <h2>Achievements</h2>
     <div class="achv-list">${
       earned.length
         ? earned.map((a) => `<span class="achv" title="${escapeHtml(a.label)}">${a.icon} ${escapeHtml(a.label)}</span>`).join("")
         : "<p>Earn badges by completing lessons, tests, and games!</p>"
     }</div>
     ${
       certs.length
         ? `<h2>Certificates</h2><div class="cert-list">${certs
             .map((c) => { const co = courseById(c.courseId); return `<a class="cert-chip" href="#/certificate/${encodeURIComponent(c.courseId)}">🏆 ${escapeHtml(co ? co.title : c.courseId)} certificate</a>`; })
             .join("")}</div>`
         : ""
     }
     <p class="dash-name"><a href="#" id="changeName">Change name</a></p>`;

  host.querySelector("#changeName").addEventListener("click", (e) => {
    e.preventDefault();
    const n = window.prompt("What's your name?", name || "");
    if (n !== null) {
      store.setName(n.trim());
      const g = document.getElementById("greeting");
      if (g) g.textContent = n.trim() ? `Hi, ${n.trim()}` : "";
      dashboardView(host); // re-render
    }
  });

  return { destroy() {} };
}
