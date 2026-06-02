// router.js — tiny hash router. Maps the URL hash to a view and renders it
// into #app. Views may return a cleanup function (e.g. the game/lesson remove
// their keydown listeners + stop their loop); we call it before each switch.

import { renderHome } from "./views/home.js";
import { renderLessons } from "./views/lessons.js";
import { renderLesson } from "./lesson.js";
import { renderGame } from "./game.js";

let cleanup = null; // teardown for the current view, if any

function parse(hash) {
  const h = (hash || "").replace(/^#/, "");
  if (h === "" || h === "/") return { name: "home" };
  if (h === "/lessons") return { name: "lessons" };
  if (h === "/game") return { name: "game" };
  const m = h.match(/^\/lesson\/(.+)$/);
  if (m) return { name: "lesson", id: m[1] };
  return { name: "home" };
}

function render() {
  const app = document.getElementById("app");
  if (cleanup) {
    try { cleanup(); } catch { /* ignore teardown errors */ }
    cleanup = null;
  }
  const route = parse(location.hash);
  switch (route.name) {
    case "lessons":
      renderLessons(app);
      break;
    case "lesson":
      cleanup = renderLesson(app, route.id) || null;
      break;
    case "game":
      cleanup = renderGame(app) || null;
      break;
    case "home":
    default:
      renderHome(app);
  }
  highlightNav(route.name);
  window.scrollTo(0, 0);
}

// Mark the active nav link.
function highlightNav(name) {
  const map = { home: "#/", lessons: "#/lessons", game: "#/game" };
  document.querySelectorAll(".nav a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === (map[name] || "#/"));
  });
}

export function startRouter() {
  window.addEventListener("hashchange", render);
  render();
}
