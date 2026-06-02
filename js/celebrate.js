// js/celebrate.js — confetti overlay + a one-call lesson celebration.
import { audio } from "./audio.js";

const COLORS = ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7", "#b197fc", "#f783ac"];

// Rain confetti for durationMs, then clean up. Returns the canvas (also used by tests).
export function confetti(durationMs = 1600) {
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const N = 140;
  const parts = Array.from({ length: N }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    vx: (Math.random() - 0.5) * 140,
    vy: 120 + Math.random() * 200,
    size: 6 + Math.random() * 7,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 9,
  }));

  let last = null;
  let elapsed = 0;
  let raf = 0;
  let cleaned = false;

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    cancelAnimationFrame(raf);
    canvas.remove();
  }

  function frame(t) {
    if (cleaned) return;
    if (last === null) last = t;
    let dt = (t - last) / 1000;
    last = t;
    if (dt > 0.05) dt = 0.05;
    elapsed += dt * 1000;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.rot += p.vr * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    if (elapsed < durationMs) raf = requestAnimationFrame(frame);
    else cleanup();
  }
  raf = requestAnimationFrame(frame);
  // Guaranteed cleanup even if rAF is throttled (e.g. the tab is hidden).
  setTimeout(cleanup, durationMs + 150);
  return canvas;
}

// Play the completion chime and rain confetti. Returns the confetti canvas.
export function celebrateLesson(durationMs = 1600) {
  audio.play("lessonComplete");
  return confetti(durationMs);
}
