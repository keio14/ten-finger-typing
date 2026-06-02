// js/keyboard.js — DOM on-screen keyboard with finger coloring + next-key highlight.
import { fingerFor, FINGER_LABELS } from "./fingers.js";

const ROWS = [
  ["1","2","3","4","5","6","7","8","9","0","-","="],
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l",";"],
  ["z","x","c","v","b","n","m",",","."],
];

export function renderKeyboard(host) {
  const el = document.createElement("div");
  el.className = "keyboard";

  for (const row of ROWS) {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    for (const k of row) {
      const key = document.createElement("div");
      key.className = "kb-key";
      key.dataset.key = k;
      key.textContent = k;
      const f = fingerFor(k);
      if (f) key.style.background = f.color;
      rowEl.appendChild(key);
    }
    el.appendChild(rowEl);
  }

  // Space row with two Shift keys + spacebar.
  const spaceRow = document.createElement("div");
  spaceRow.className = "kb-row";
  const shiftL = document.createElement("div");
  shiftL.className = "kb-key kb-wide"; shiftL.dataset.shift = "left"; shiftL.textContent = "Shift";
  const space = document.createElement("div");
  space.className = "kb-key kb-space"; space.dataset.key = " "; space.textContent = "space";
  const shiftR = document.createElement("div");
  shiftR.className = "kb-key kb-wide"; shiftR.dataset.shift = "right"; shiftR.textContent = "Shift";
  spaceRow.append(shiftL, space, shiftR);
  el.appendChild(spaceRow);

  const hint = document.createElement("div");
  hint.className = "kb-hint";
  el.appendChild(hint);

  host.appendChild(el);

  function clear() {
    el.querySelectorAll(".next").forEach((n) => n.classList.remove("next"));
  }

  function highlight(char) {
    clear();
    if (!char) { hint.textContent = ""; return; }
    const lower = char.toLowerCase();
    const keyEl = el.querySelector(`[data-key="${cssEscape(lower)}"]`);
    if (keyEl) keyEl.classList.add("next");
    // Uppercase letters need Shift.
    const needsShift = char !== lower && char.toUpperCase() === char;
    if (needsShift) {
      const shiftEl = el.querySelector("[data-shift]");
      if (shiftEl) shiftEl.classList.add("next");
    }
    const f = fingerFor(lower);
    hint.textContent = f
      ? `Use your ${FINGER_LABELS[f.finger]}${needsShift ? " (and Shift)" : ""}`
      : "";
  }

  // Minimal CSS.escape fallback (attribute selectors choke on some chars).
  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : s.replace(/[^a-z0-9 ]/gi, "\\$&");
  }

  return { el, highlight };
}
