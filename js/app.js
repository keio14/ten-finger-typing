// js/app.js — entry point: router, name prompt, mute toggle.
import { store } from "./storage.js";
import { audio } from "./audio.js";
import { practiceView } from "./views/practice.js";
import { lessonsView } from "./views/lessons.js";
import { testsView } from "./views/tests.js";
import { gameView } from "./views/game.js";
import { dashboardView } from "./views/dashboard.js";
import { certificateView } from "./views/certificate.js";

const app = document.getElementById("app");
let current = null; // { destroy? }

const routes = {
  "/": dashboardView,
  "/practice": practiceView,
  "/tests": testsView,
  "/game": gameView,
};

function mount(view) {
  if (current && typeof current.destroy === "function") current.destroy();
  app.innerHTML = "";
  current = view(app) || null;
}

function router() {
  const path = (location.hash || "#/").slice(1);
  if (path === "/lessons" || path.startsWith("/lessons/")) { mount(lessonsView); return; }
  if (path.startsWith("/certificate/")) { mount(certificateView); return; }
  const view = routes[path] || dashboardView;
  mount(view);
}

function updateGreeting() {
  const name = store.getName();
  document.getElementById("greeting").textContent = name ? `Hi, ${name}` : "";
}

function updateMuteButton() {
  const btn = document.getElementById("mute");
  btn.textContent = audio.isMuted() ? "🔇 Muted" : "🔊 Sound";
}

function wireMuteToggle() {
  const btn = document.getElementById("mute");
  updateMuteButton();
  btn.addEventListener("click", () => {
    audio.setMuted(!audio.isMuted());
    updateMuteButton();
    if (!audio.isMuted()) audio.play("key"); // confirm it's on
  });
}

// First-visit name prompt (name === null means never asked).
function maybeAskName() {
  if (store.getName() !== null) return;
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML =
    `<div class="modal">
       <h2>What's your name?</h2>
       <input id="name-input" maxlength="24" placeholder="Type your name" />
       <div class="row">
         <button id="name-save" class="btn-primary" type="button">Save</button>
         <button id="name-skip" class="btn-ghost" type="button">Skip</button>
       </div>
     </div>`;
  document.body.appendChild(backdrop);
  const input = backdrop.querySelector("#name-input");
  input.focus();
  const finish = (value) => { store.setName(value); backdrop.remove(); updateGreeting(); homeIfHome(); };
  backdrop.querySelector("#name-save").addEventListener("click", () => finish(input.value.trim()));
  backdrop.querySelector("#name-skip").addEventListener("click", () => finish(""));
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") finish(input.value.trim()); });
}

function homeIfHome() { if ((location.hash || "#/") === "#/") router(); }

window.addEventListener("hashchange", router);
wireMuteToggle();
updateGreeting();
maybeAskName();
router();
