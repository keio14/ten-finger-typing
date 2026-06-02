// audio.js — tiny WebAudio sound effects. No files, just generated tones,
// so there is nothing to download and it works offline.

import { isMuted } from "./state.js";

let ctx = null;

// The AudioContext can only start after a user gesture; we lazily create it
// on the first sound, by which point the user has clicked/typed.
function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (C) ctx = new C();
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Play a short beep. freq in Hz, dur in seconds.
function beep(freq, dur, type = "sine", gain = 0.12) {
  if (isMuted()) return;
  const a = ac();
  if (!a) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(a.destination);
  const t = a.currentTime;
  // quick fade-out so it doesn't click
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur);
}

export function correct() {
  beep(660, 0.08, "triangle");
}

export function wrong() {
  beep(160, 0.12, "sawtooth", 0.08);
}

// A little three-note rising arpeggio for finishing a lesson.
export function win() {
  if (isMuted()) return;
  [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.16, "triangle"), i * 120));
}
