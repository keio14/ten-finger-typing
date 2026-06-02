// game.js — the falling-letters game. This is the real-time-motion piece:
// a single requestAnimationFrame loop that moves letters down the canvas,
// clears them when typed, costs a heart when one reaches the bottom, and
// speeds up each level. All the math lives in gamelogic.js (pure + tested);
// this file only does canvas drawing, timing, input, and state plumbing.

import {
  START_HEARTS,
  speedForLevel,
  spawnIntervalForLevel,
  levelForScore,
  advance,
  findMisses,
  removeMisses,
  applyHit,
  loseHeart,
  isGameOver,
} from "./gamelogic.js";
import { colorFor } from "./fingers.js";
import { lettersLearnedThrough } from "./curriculum.js";
import { recordGame, getGameBest } from "./state.js";
import * as audio from "./audio.js";

// Pick a letter from a pool using a counter (no Math.random — keeps things
// deterministic-ish and avoids the banned RNG; still feels varied enough).
function makePicker(pool) {
  let i = 0;
  return () => {
    const ch = pool[i % pool.length];
    // stride by a prime so consecutive picks jump around the pool
    i += 7;
    return ch;
  };
}

export function renderGame(app) {
  const pool = lettersLearnedThrough(); // all learned letters (a–z available)
  const pickLetter = makePicker(pool.length ? pool : ["f", "j", "d", "k"]);
  const best = getGameBest();

  app.innerHTML = `
    <section class="game">
      <div class="game-hud">
        <span id="hearts">${"❤️".repeat(START_HEARTS)}</span>
        <span>⭐ Score: <b id="score">0</b></span>
        <span>🚀 Level: <b id="level">1</b></span>
        <span class="muted">Best: ${best.bestScore}</span>
      </div>
      <div class="game-stage">
        <canvas id="canvas" width="640" height="420"></canvas>
        <div class="banner" id="banner"></div>
        <div class="overlay" id="overlay" hidden></div>
      </div>
      <p class="tip">Type the falling letters before they reach the ground. Each level falls a little faster!</p>
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

  // --- mutable game state ---
  let letters = [];
  let score = 0;
  let level = 1;
  let hearts = START_HEARTS;
  let nextId = 1;
  let sinceSpawn = 0; // seconds since last spawn
  let lastTs = 0;
  let raf = 0;
  let running = true;

  function spawn() {
    const char = pickLetter();
    // spread x across the width using the id so columns vary
    const x = 40 + ((nextId * 53) % (W - 80));
    letters.push({ id: nextId++, char, x, y: -10 });
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
        <h2>Game over!</h2>
        <p>You scored <b>${score}</b> and reached level <b>${level}</b>.</p>
        <p class="muted">Best score: ${saved.bestScore}</p>
        <button class="btn" id="again" type="button">Play again ↺</button>
        <a class="btn-ghost" href="#/">Home</a>
      </div>`;
    overlay.querySelector("#again").addEventListener("click", () => renderGame(app));
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    // ground line
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 2);
    ctx.lineTo(W, H - 2);
    ctx.stroke();
    // letters
    ctx.font = "bold 34px system-ui, sans-serif";
    for (const l of letters) {
      ctx.fillStyle = colorFor(l.char);
      ctx.beginPath();
      ctx.arc(l.x, l.y, 22, 0, Math.PI * 2);
      ctx.globalAlpha = 0.15;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillText(l.char, l.x, l.y);
    }
  }

  function update(dt) {
    const speed = speedForLevel(level);
    letters = advance(letters, dt, speed);

    // spawning
    sinceSpawn += dt;
    if (sinceSpawn >= spawnIntervalForLevel(level)) {
      sinceSpawn = 0;
      spawn();
    }

    // misses (reached the bottom)
    const misses = findMisses(letters, H);
    if (misses.length) {
      letters = removeMisses(letters, H);
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
    if (e.key.length !== 1) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const ch = e.key.toLowerCase();
    const res = applyHit(letters, ch);
    if (res.hit) {
      letters = res.letters;
      score += res.gained;
      audio.correct();
      scoreEl.textContent = score;
      const newLevel = levelForScore(score);
      if (newLevel !== level) {
        level = newLevel;
        levelEl.textContent = level;
        showBanner(`Level ${level}! 🚀`);
      }
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
