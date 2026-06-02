// game.js — the falling-WORDS game. This is the real-time-motion piece:
// a single requestAnimationFrame loop that moves words down the canvas. You
// "lock on" to a word by typing its first letter, then type it through before
// it reaches the ground. The pure math lives in gamelogic.js (tested); this
// file does canvas drawing, timing, input, particles, and state plumbing.

import {
  START_HEARTS,
  speedForLevel,
  spawnIntervalForLevel,
  levelForScore,
  advance,
  findMisses,
  removeMisses,
  applyKey,
  loseHeart,
  isGameOver,
} from "./gamelogic.js";
import { colorFor } from "./fingers.js";
import { wordsFor } from "./words.js";
import { recordGame, getGameBest } from "./state.js";
import { isTypingKey } from "./typing.js";
import { t } from "./i18n.js";
import * as audio from "./audio.js";

const PARTICLE_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
const ALL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export function renderGame(app) {
  // Use the whole word bank (short to long) — the game is for fun + vocabulary,
  // so it isn't restricted to the letters learned in lessons.
  const pool = wordsFor(ALL_LETTERS);
  const pickWord = () => pool[Math.floor(Math.random() * pool.length)];
  const best = getGameBest();

  app.innerHTML = `
    <section class="game">
      <div class="game-hud">
        <span id="hearts" class="hud-hearts">${"❤️".repeat(START_HEARTS)}</span>
        <span class="hud-pill">⭐ ${t("game.score")}: <b id="score">0</b></span>
        <span class="hud-pill">🚀 ${t("game.level")}: <b id="level">1</b></span>
        <span class="hud-pill muted">${t("game.best")}: ${best.bestScore}</span>
      </div>
      <div class="game-stage">
        <canvas id="canvas" width="640" height="430"></canvas>
        <div class="banner" id="banner"></div>
        <div class="overlay" id="overlay" hidden></div>
      </div>
      <p class="tip">${t("game.tip")}</p>
    </section>
  `;

  const canvas = app.querySelector("#canvas");
  const ctx = canvas.getContext("2d");
  const heartsEl = app.querySelector("#hearts");
  const scoreEl = app.querySelector("#score");
  const levelEl = app.querySelector("#level");
  const bannerEl = app.querySelector("#banner");
  const overlay = app.querySelector("#overlay");

  // Handle high-DPI screens so text is crisp.
  const W = canvas.width;
  const H = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.scale(dpr, dpr);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const FONT = "bold 34px system-ui, sans-serif";
  const NEXT_FONT = "bold 40px system-ui, sans-serif";
  const LETTER_GAP = 3; // extra px between letters so words read clearly

  // --- mutable game state ---
  let words = [];
  let activeId = null;
  let score = 0;
  let level = 1;
  let hearts = START_HEARTS;
  let nextId = 1;
  let sinceSpawn = 0; // seconds since last spawn
  let elapsed = 0; // total seconds, drives the pulse animation
  let particles = [];
  let lastTs = 0;
  let raf = 0;
  let running = true;

  function spawn() {
    const text = pickWord();
    // a roughly even spread of horizontal start positions
    const x = 90 + ((nextId * 97) % (W - 180));
    words.push({ id: nextId++, text, x, y: -16, typed: 0 });
  }

  // a little burst of colored particles where a word was cleared
  function burst(x, y) {
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      particles.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 40,
        life: 0.6,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      });
    }
  }

  function showBanner(text) {
    bannerEl.textContent = text;
    bannerEl.classList.add("show");
    setTimeout(() => bannerEl.classList.remove("show"), 700);
  }

  function gameOver() {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    const saved = recordGame({ score, level });
    overlay.hidden = false;
    overlay.innerHTML = `
      <div class="overlay-card">
        <h2>${t("game.over")}</h2>
        <p>${t("game.result", { score, level })}</p>
        <p class="muted">${t("game.bestScore", { best: saved.bestScore })}</p>
        <button class="btn" id="again" type="button">${t("game.again")}</button>
        <a class="btn-ghost" href="#/">${t("game.home")}</a>
      </div>`;
    overlay.querySelector("#again").addEventListener("click", () => renderGame(app));
  }

  // draw one word: a rounded pill, letters colored by finger; typed letters
  // dimmed; the active word glows and its next letter is emphasized.
  function drawWord(w) {
    ctx.font = FONT;
    const widths = [...w.text].map((c) => ctx.measureText(c).width);
    const gaps = LETTER_GAP * (w.text.length - 1);
    const total = widths.reduce((a, b) => a + b, 0) + gaps;
    const pad = 18;
    const active = w.id === activeId;
    const half = total / 2 + pad; // keep the whole pill on screen
    const cx = Math.max(half, Math.min(W - half, w.x));
    const pulse = active ? 1 + Math.sin(elapsed * 8) * 0.04 : 1;

    // pill: a soft drop shadow, then a SOLID white card with a clear border
    // (solid — so the colored letters never wash out against the pastel sky)
    ctx.save();
    ctx.translate(cx, w.y);
    ctx.scale(pulse, pulse);
    roundRect(ctx, -half, -24 + 5, half * 2, 48, 16); // shadow
    ctx.fillStyle = "rgba(15,23,42,0.12)";
    ctx.fill();
    roundRect(ctx, -half, -24, half * 2, 48, 16); // card
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = active ? 4 : 2;
    ctx.strokeStyle = active ? "#3b82f6" : "#cbd5e1";
    ctx.stroke();
    ctx.restore();

    // letters — bold, fully opaque, finger-colored; the active word's next
    // letter is bigger, dark, and underlined so it's obvious what to press.
    let x = cx - total / 2;
    for (let i = 0; i < w.text.length; i++) {
      const c = w.text[i];
      const cw = widths[i];
      const isNext = active && i === w.typed;
      ctx.font = isNext ? NEXT_FONT : FONT;
      if (i < w.typed) {
        ctx.fillStyle = "#94a3b8"; // already typed (dimmed but still readable)
      } else if (isNext) {
        ctx.fillStyle = "#0f172a"; // the very next letter to press
      } else {
        ctx.fillStyle = colorFor(c); // upcoming letters in finger colors
      }
      ctx.fillText(c, x + cw / 2, w.y);
      if (isNext) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 1, w.y + 17);
        ctx.lineTo(x + cw - 1, w.y + 17);
        ctx.stroke();
      }
      x += cw + LETTER_GAP;
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H); // transparent -> animated CSS gradient shows through
    // soft ground line
    ctx.strokeStyle = "rgba(148,163,184,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 2);
    ctx.lineTo(W, H - 2);
    ctx.stroke();

    for (const w of words) drawWord(w);

    // particles
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / 0.6);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function update(dt) {
    elapsed += dt;
    const speed = speedForLevel(level);
    words = advance(words, dt, speed);

    // spawning
    sinceSpawn += dt;
    if (sinceSpawn >= spawnIntervalForLevel(level)) {
      sinceSpawn = 0;
      spawn();
    }

    // particles
    if (particles.length) {
      particles = particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt,
          vy: p.vy + 320 * dt, // gravity
          life: p.life - dt,
        }))
        .filter((p) => p.life > 0);
    }

    // misses (a word reached the bottom)
    const misses = findMisses(words, H);
    if (misses.length) {
      if (misses.some((w) => w.id === activeId)) activeId = null;
      words = removeMisses(words, H);
      for (let i = 0; i < misses.length; i++) {
        hearts = loseHeart(hearts);
        audio.wrong();
      }
      heartsEl.textContent = "❤️".repeat(hearts) || "💔";
      if (isGameOver(hearts)) {
        gameOver();
        return;
      }
    }
  }

  function loop(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000; // seconds
    lastTs = ts;
    // clamp big gaps (e.g. tab was hidden) so nothing teleports past the floor
    if (dt > 0.1) dt = 0.1;

    update(dt);
    if (running) {
      render();
      raf = requestAnimationFrame(loop);
    }
  }

  function onKey(e) {
    if (!running) return;
    if (!isTypingKey(e)) return;
    const ch = e.key.toLowerCase();
    const wasLocked = activeId !== null;

    // find the active word's screen position before applyKey (for the burst)
    const activeWord = activeId !== null ? words.find((w) => w.id === activeId) : null;

    const res = applyKey(words, activeId, ch);
    words = res.words;
    activeId = res.activeId;

    if (res.scored) {
      score += res.scored;
      scoreEl.textContent = score;
      audio.correct();
      if (activeWord) burst(activeWord.x, activeWord.y);
      const newLevel = levelForScore(score);
      if (newLevel !== level) {
        level = newLevel;
        levelEl.textContent = level;
        showBanner(t("game.levelUp", { n: level }));
      }
    } else if (!wasLocked && activeId !== null) {
      // just locked onto a new word
      audio.correct();
    }
  }

  window.addEventListener("keydown", onKey);
  raf = requestAnimationFrame(loop);

  // cleanup when the router swaps views
  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
  };
}

// rounded-rectangle path helper (older canvas APIs lack ctx.roundRect)
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
