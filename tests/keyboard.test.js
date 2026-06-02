import { test, assert, assertEqual } from "./harness.js";
import { renderKeyboard } from "../js/keyboard.js";

function mount() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return renderKeyboard(host);
}

test("renderKeyboard: builds a key element for each letter", () => {
  const kb = mount();
  assert(kb.el.querySelector('[data-key="f"]'), "should have an f key");
  assert(kb.el.querySelector('[data-key="j"]'), "should have a j key");
});

test("highlight: marks the matching key with .next", () => {
  const kb = mount();
  kb.highlight("f");
  const f = kb.el.querySelector('[data-key="f"]');
  assert(f.classList.contains("next"), "f should be highlighted");
});

test("highlight: moves highlight when called again", () => {
  const kb = mount();
  kb.highlight("f");
  kb.highlight("j");
  assert(!kb.el.querySelector('[data-key="f"]').classList.contains("next"), "f cleared");
  assert(kb.el.querySelector('[data-key="j"]').classList.contains("next"), "j set");
});

test("highlight: uppercase lights the opposite-hand Shift key", () => {
  const kb = mount();
  kb.highlight("F"); // F is a left-hand letter -> right Shift
  assert(kb.el.querySelector('[data-key="f"]').classList.contains("next"), "f lit");
  assert(kb.el.querySelector('[data-shift="right"]').classList.contains("next"), "right shift lit");
  assert(!kb.el.querySelector('[data-shift="left"]').classList.contains("next"), "left shift not lit");
});

test("highlight: shows a finger hint", () => {
  const kb = mount();
  kb.highlight("f");
  assert(/left index/.test(kb.el.querySelector(".kb-hint").textContent), "hint names finger");
});
