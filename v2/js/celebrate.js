// celebrate.js — a quick confetti + star burst overlay shown when a lesson
// is finished. Pure DOM/CSS; cleans itself up after the animation.

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

// Show `stars` (1–3) big in the middle and rain confetti for ~1.5s.
export function celebrate(stars = 3) {
  const overlay = document.createElement("div");
  overlay.className = "celebrate";

  const starRow = document.createElement("div");
  starRow.className = "celebrate-stars";
  starRow.textContent = "⭐".repeat(Math.max(1, Math.min(3, stars)));
  overlay.appendChild(starRow);

  // confetti pieces fall from the top at random x positions
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    const left = Math.floor((i / 40) * 100) + (i % 3) * 4; // spread, no Math.random needed
    piece.style.left = `${left % 100}%`;
    piece.style.background = COLORS[i % COLORS.length];
    piece.style.animationDelay = `${(i % 10) * 0.05}s`;
    overlay.appendChild(piece);
  }

  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1800);
}
