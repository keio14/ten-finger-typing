import { test, assert, assertEqual } from "./harness.js";
import { runTyping } from "../js/typing-runner.js";

function mount() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host;
}

test("runTyping: builds target + stats + keyboard into the host", () => {
  const host = mount();
  const r = runTyping(host, "hi", {});
  assert(host.querySelector("#tr-target"), "has target");
  assert(host.querySelector("#tr-wpm"), "has wpm readout");
  assert(host.querySelector(".keyboard"), "has on-screen keyboard");
  r.destroy(); host.remove();
});

test("runTyping: typing the target calls onComplete with stats", () => {
  const host = mount();
  let done = null;
  const r = runTyping(host, "hi", { onComplete: (s) => { done = s; } });
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "i" }));
  assert(done !== null, "onComplete fired");
  assertEqual(done.index, 2);
  r.destroy(); host.remove();
});

test("runTyping: destroy removes the key listener", () => {
  const host = mount();
  let done = null;
  const r = runTyping(host, "hi", { onComplete: () => { done = true; } });
  r.destroy();
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "i" }));
  assertEqual(done, null, "no completion after destroy");
  host.remove();
});

test("runTyping: restart resets progress", () => {
  const host = mount();
  const r = runTyping(host, "hi", {});
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
  r.restart();
  assertEqual(host.querySelector("#tr-wpm").textContent, "0");
  r.destroy(); host.remove();
});
