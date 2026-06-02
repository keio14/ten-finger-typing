// js/views/game.js — falling-letters arcade rendered on a canvas.
import { store } from "../storage.js";
import { practiceKeys } from "../lessons.js";
import { createGame, update, handleKey, accuracy, wpm, HEIGHT } from "../gameengine.js";
import { audio } from "../audio.js";

const WIDTH = 800;

export function gameView(host) {
  host.innerHTML =
    `<h1>Letter Rain</h1>
     <p>Type the falling letters before they hit the ground. Miss three and it's game over!</p>
     <canvas id="game-canvas" width="${WIDTH}" height="${HEIGHT}" class="game-canvas"></canvas>`;
  const canvas = host.querySelector("#game-canvas");
  const ctx = canvas.getContext("2d");

  let state = null;       // gameengine state, or null on the start/over screens
  let screen = "start";   // "start" | "playing" | "over"
  let raf = 0;
  let lastTime = 0;

  function startGame() {
    state = createGame({ pool: practiceKeys(store) });
    screen = "playing";
    lastTime = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function endGame() {
    screen = "over";
    store.recordGame({ score: state.score, level: state.level });
  }

  function onKey(e) {
    if (screen === "start" || screen === "over") {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startGame(); }
      return;
    }
    if (e.key.length !== 1) return;
    const k = e.key.toLowerCase();
    const before = state.score;
    handleKey(state, k);
    if (state.score > before) audio.play("clear");
    else audio.play("wrong");
  }

  function loop(t) {
    if (!lastTime) lastTime = t;
    let dt = (t - lastTime) / 1000;
    lastTime = t;
    if (dt > 0.1) dt = 0.1;

    const before = state.lives;
    update(state, dt);
    if (state.lives < before) audio.play("life");
    if (state.status === "over") endGame();
    render();
    // Animate only while playing; the static start/over screens are rendered once.
    if (screen === "playing") raf = requestAnimationFrame(loop);
  }

  function render() {
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#d6efff");
    sky.addColorStop(1, "#a5d8ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // ground
    ctx.fillStyle = "#8ce99a";
    ctx.fillRect(0, HEIGHT - 8, WIDTH, 8);

    if (screen === "playing") {
      ctx.font = "bold 34px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#1b2733";
      for (const L of state.letters) {
        ctx.fillText(L.ch, 30 + L.x * (WIDTH - 60), L.y);
      }
      // HUD
      ctx.textAlign = "left";
      ctx.font = "bold 20px 'Trebuchet MS', sans-serif";
      ctx.fillStyle = "#1864ab";
      ctx.fillText("Score: " + state.score, 14, 28);
      ctx.fillText("Level: " + state.level, 14, 52);
      ctx.textAlign = "right";
      ctx.font = "20px 'Segoe UI Emoji', sans-serif";
      ctx.fillText("❤️".repeat(Math.max(0, state.lives)) || "—", WIDTH - 14, 28);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.textAlign = "center";
      ctx.fillStyle = "#1864ab";
      ctx.font = "bold 44px 'Trebuchet MS', sans-serif";
      if (screen === "start") {
        ctx.fillText("Letter Rain", WIDTH / 2, HEIGHT / 2 - 40);
        ctx.fillStyle = "#e8590c";
        ctx.font = "bold 24px 'Trebuchet MS', sans-serif";
        ctx.fillText("Press ENTER to start", WIDTH / 2, HEIGHT / 2 + 20);
      } else {
        ctx.fillText("Game Over", WIDTH / 2, HEIGHT / 2 - 60);
        ctx.fillStyle = "#212529";
        ctx.font = "22px 'Trebuchet MS', sans-serif";
        ctx.fillText(`Score ${state.score} · Level ${state.level} · ${wpm(state)} WPM · ${Math.round(accuracy(state) * 100)}% accuracy`, WIDTH / 2, HEIGHT / 2 - 10);
        ctx.fillText(`Best score: ${store.getGame().highScore}`, WIDTH / 2, HEIGHT / 2 + 24);
        ctx.fillStyle = "#e8590c";
        ctx.font = "bold 24px 'Trebuchet MS', sans-serif";
        ctx.fillText("Press ENTER to play again", WIDTH / 2, HEIGHT / 2 + 64);
      }
    }
  }

  window.addEventListener("keydown", onKey);
  render(); // draw the start screen once; the loop starts when a game begins

  return {
    destroy() {
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    },
  };
}
