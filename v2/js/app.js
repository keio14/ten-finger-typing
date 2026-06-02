// app.js — boot. Wire up the mute button + greeting in the nav, then start
// the router. Everything else is loaded on demand by the router.

import { startRouter } from "./router.js";
import { getSettings, setMuted, isMuted } from "./state.js";

function initNav() {
  const greeting = document.getElementById("greeting");
  const { name } = getSettings();
  if (greeting) greeting.textContent = name ? `Hi, ${name}!` : "";

  const muteBtn = document.getElementById("mute");
  if (muteBtn) {
    const paint = () => {
      muteBtn.textContent = isMuted() ? "🔇 Muted" : "🔊 Sound";
    };
    paint();
    muteBtn.addEventListener("click", () => {
      setMuted(!isMuted());
      paint();
    });
  }
}

initNav();
startRouter();
