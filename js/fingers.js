// fingers.js — maps a typing key to the finger that should press it,
// which hand, and a color used everywhere we show finger guidance.
//
// Ten-finger touch typing: thumbs handle the space bar, the other eight
// fingers each "own" columns of the keyboard. Colors are grouped so the
// two pinkies share a color, the two ring fingers share a color, etc.,
// which makes the on-screen keyboard easy to read at a glance.

export const FINGERS = {
  "L-pinky": { hand: "left", color: "#ef4444", label: "left pinky" },
  "L-ring": { hand: "left", color: "#f59e0b", label: "left ring" },
  "L-middle": { hand: "left", color: "#10b981", label: "left middle" },
  "L-index": { hand: "left", color: "#3b82f6", label: "left index" },
  "R-index": { hand: "right", color: "#8b5cf6", label: "right index" },
  "R-middle": { hand: "right", color: "#10b981", label: "right middle" },
  "R-ring": { hand: "right", color: "#f59e0b", label: "right ring" },
  "R-pinky": { hand: "right", color: "#ef4444", label: "right pinky" },
  thumb: { hand: "both", color: "#64748b", label: "thumb" },
};

// Each key -> finger id. Lowercase letters only (v1 has no Shift).
const KEY_FINGER = {
  // number row
  "1": "L-pinky", "2": "L-ring", "3": "L-middle", "4": "L-index", "5": "L-index",
  "6": "R-index", "7": "R-index", "8": "R-middle", "9": "R-ring", "0": "R-pinky",
  // top row
  q: "L-pinky", w: "L-ring", e: "L-middle", r: "L-index", t: "L-index",
  y: "R-index", u: "R-index", i: "R-middle", o: "R-ring", p: "R-pinky",
  // home row
  a: "L-pinky", s: "L-ring", d: "L-middle", f: "L-index", g: "L-index",
  h: "R-index", j: "R-index", k: "R-middle", l: "R-ring", ";": "R-pinky",
  // bottom row
  z: "L-pinky", x: "L-ring", c: "L-middle", v: "L-index", b: "L-index",
  n: "R-index", m: "R-index", ",": "R-middle", ".": "R-ring", "/": "R-pinky",
  " ": "thumb",
};

// Return finger info for a key, or null if we don't teach that key.
export function fingerFor(key) {
  const id = KEY_FINGER[key];
  if (!id) return null;
  const f = FINGERS[id];
  return { id, hand: f.hand, color: f.color, label: f.label };
}

// Convenience: just the color (used by the keyboard + falling letters).
export function colorFor(key) {
  const f = fingerFor(key);
  return f ? f.color : "#64748b";
}
