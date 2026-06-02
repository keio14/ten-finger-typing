// js/app.js — entry point: router, name prompt, mute toggle.
import { store } from "./storage.js";
import { audio } from "./audio.js";
import { practiceView } from "./views/practice.js";
import { lessonsView } from "./views/lessons.js";
import { escapeHtml } from "./util.js";

const app = document.getElementById("app");
let current = null; // { destroy? }

const routes = {
  "/": homeView,
  "/practice": practiceView,
};

function mount(view) {
  if (current && typeof current.destroy === "function") current.destroy();
  app.innerHTML = "";
  current = view(app) || null;
}

function router() {
  const path = (location.hash || "#/").slice(1);
  if (path === "/lessons" || path.startsWith("/lessons/")) { mount(lessonsView); return; }
  const view = routes[path] || homeView;
  mount(view);
}

// Simple placeholder home until Phase 5 builds the real dashboard.
function homeView(host) {
  const name = store.getName();
  host.innerHTML =
    `<h1>Welcome${name ? ", " + escapeHtml(name) : ""}! 👋</h1>` +
    `<p>Start the <a href="#/lessons">Lessons</a> to learn touch typing step by step, ` +
    `or try <a href="#/practice">Free Practice</a>.</p>`;
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
