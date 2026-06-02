// js/fingers.js — standard touch-typing finger assignments for a QWERTY keyboard.

export const FINGER_COLORS = {
  "l-pinky":  "#ff6b6b",
  "l-ring":   "#ffa94d",
  "l-middle": "#ffd43b",
  "l-index":  "#69db7c",
  "r-index":  "#38d9a9",
  "r-middle": "#4dabf7",
  "r-ring":   "#b197fc",
  "r-pinky":  "#f783ac",
  "thumb":    "#ced4da",
};

export const FINGER_LABELS = {
  "l-pinky":  "left pinky",
  "l-ring":   "left ring finger",
  "l-middle": "left middle finger",
  "l-index":  "left index finger",
  "r-index":  "right index finger",
  "r-middle": "right middle finger",
  "r-ring":   "right ring finger",
  "r-pinky":  "right pinky",
  "thumb":    "thumb",
};

// Which finger presses each (lowercase / unshifted) key.
const KEY_FINGER = {
  "`": "l-pinky", "1": "l-pinky", "q": "l-pinky", "a": "l-pinky", "z": "l-pinky",
  "2": "l-ring", "w": "l-ring", "s": "l-ring", "x": "l-ring",
  "3": "l-middle", "e": "l-middle", "d": "l-middle", "c": "l-middle",
  "4": "l-index", "5": "l-index", "r": "l-index", "t": "l-index",
  "f": "l-index", "g": "l-index", "v": "l-index", "b": "l-index",
  "6": "r-index", "7": "r-index", "y": "r-index", "u": "r-index",
  "h": "r-index", "j": "r-index", "n": "r-index", "m": "r-index",
  "8": "r-middle", "i": "r-middle", "k": "r-middle", ",": "r-middle",
  "9": "r-ring", "o": "r-ring", "l": "r-ring", ".": "r-ring",
  "0": "r-pinky", "-": "r-pinky", "=": "r-pinky", "p": "r-pinky",
  "[": "r-pinky", "]": "r-pinky", ";": "r-pinky", "'": "r-pinky", "/": "r-pinky",
  " ": "thumb",
};

// Returns { finger, hand, color } for a key, or null if unmapped.
export function fingerFor(key) {
  if (typeof key !== "string" || key.length !== 1) return null;
  const finger = KEY_FINGER[key.toLowerCase()];
  if (!finger) return null;
  const hand = finger === "thumb" ? "both" : finger.startsWith("l-") ? "left" : "right";
  return { finger, hand, color: FINGER_COLORS[finger] };
}
