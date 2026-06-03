// app.js — boot. Wire up the nav (translated links, language switcher, mute
// button, greeting), then start the router. Everything else loads on demand.

import { startRouter, rerender } from "./router.js";
import { getSettings, setMuted, isMuted } from "./state.js";
import { t, LANGUAGES, getLang, setLang } from "./i18n.js";

// Paint all nav text for the current language + state. Safe: nav labels are
// trusted constants, and the name is set via textContent (never raw HTML).
function paintNav() {
  const byId = (id) => document.getElementById(id);
  byId("nav-home").textContent = t("nav.home");
  byId("nav-lessons").textContent = t("nav.lessons");
  byId("nav-speed").textContent = t("nav.speed");
  byId("nav-game").textContent = t("nav.game");

  const greeting = byId("greeting");
  const { name } = getSettings();
  greeting.textContent = name ? t("greeting", { name }) : "";

  const muteBtn = byId("mute");
  muteBtn.textContent = isMuted() ? t("nav.muted") : t("nav.sound");
}

function initLangSelect() {
  const select = document.getElementById("lang");
  select.innerHTML = LANGUAGES.map(
    (l) => `<option value="${l.code}">${l.label}</option>`
  ).join("");
  select.value = getLang();
  select.addEventListener("change", () => {
    setLang(select.value);
    document.documentElement.lang = select.value;
    paintNav();
    rerender(); // re-render the current view in the new language
  });
}

function initMute() {
  document.getElementById("mute").addEventListener("click", () => {
    setMuted(!isMuted());
    paintNav();
  });
}

// Views can ask the nav to refresh (e.g. after the name is saved on Home).
window.addEventListener("app:settings-changed", paintNav);

document.documentElement.lang = getLang();
initLangSelect();
initMute();
paintNav();
startRouter();
