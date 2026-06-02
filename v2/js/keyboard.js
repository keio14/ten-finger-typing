// keyboard.js — draws an on-screen QWERTY keyboard and can highlight the
// "next key to press", tinted with that key's finger color. This is the
// visual guide that teaches a beginner where each finger goes.

import { colorFor, fingerFor } from "./fingers.js";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

// Build the keyboard DOM inside `container`. Returns an API to highlight keys.
export function renderKeyboard(container) {
  container.innerHTML = "";
  container.classList.add("keyboard");

  const keyEls = new Map(); // char -> element

  for (const row of ROWS) {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    for (const ch of row) {
      const k = document.createElement("div");
      k.className = "kb-key";
      k.textContent = ch === ";" ? ";" : ch.toUpperCase();
      k.style.setProperty("--finger", colorFor(ch));
      // home-row bumps on F and J
      if (ch === "f" || ch === "j") k.classList.add("kb-home");
      keyEls.set(ch, k);
      rowEl.appendChild(k);
    }
    container.appendChild(rowEl);
  }

  // space bar row
  const spaceRow = document.createElement("div");
  spaceRow.className = "kb-row";
  const space = document.createElement("div");
  space.className = "kb-key kb-space";
  space.textContent = "space";
  space.style.setProperty("--finger", colorFor(" "));
  keyEls.set(" ", space);
  spaceRow.appendChild(space);
  container.appendChild(spaceRow);

  let current = null;

  function clearHighlight() {
    if (current) {
      current.classList.remove("kb-next");
      current = null;
    }
  }

  // Highlight the key for `char` as the next one to press.
  function highlight(char) {
    clearHighlight();
    const el = keyEls.get(char);
    if (el) {
      el.classList.add("kb-next");
      current = el;
    }
  }

  // Briefly flash a key green (correct) or red (wrong) on a keypress.
  function flash(char, ok) {
    const el = keyEls.get(char);
    if (!el) return;
    const cls = ok ? "kb-ok" : "kb-bad";
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 150);
  }

  return { highlight, clearHighlight, flash };
}

// Small helper for views that want to name the finger for a key in text.
export function fingerLabel(char) {
  const f = fingerFor(char);
  return f ? f.label : "";
}
