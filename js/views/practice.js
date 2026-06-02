// js/views/practice.js — Free Practice: type a fixed sample using the shared runner.
import { runTyping } from "../typing-runner.js";
import { audio } from "../audio.js";

const SAMPLE = "the quick brown fox jumps over the lazy dog";

export function practiceView(host) {
  host.innerHTML =
    `<h1>Free Practice</h1>
     <div id="run"></div>
     <div id="done" style="margin-top:16px"></div>`;

  const runHost = host.querySelector("#run");
  const doneEl = host.querySelector("#done");
  let runner;

  function onComplete(s) {
    audio.play("lessonComplete");
    doneEl.innerHTML =
      `<p><b>Done!</b> ${s.wpm} WPM, ${Math.round(s.accuracy * 100)}% accuracy. ` +
      `<button id="again" class="btn-primary">Try again</button></p>`;
    doneEl.querySelector("#again").addEventListener("click", () => {
      doneEl.innerHTML = "";
      runner.restart();
    });
  }

  runner = runTyping(runHost, SAMPLE, { onComplete });

  return { destroy() { runner.destroy(); } };
}
