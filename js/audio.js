// js/audio.js — tiny Web Audio sound effects. No asset files.
import { store } from "./storage.js";

// name -> list of notes: { f: freqHz, t: startOffsetSec, d: durationSec, type, gain }
const SOUNDS = {
  key:            [{ f: 220, t: 0, d: 0.04, type: "square", gain: 0.04 }],
  wrong:          [{ f: 120, t: 0, d: 0.14, type: "sawtooth", gain: 0.06 }],
  lessonComplete: [{ f: 523, t: 0, d: 0.12 }, { f: 659, t: 0.1, d: 0.12 }, { f: 784, t: 0.2, d: 0.18 }],
  levelUp:        [{ f: 392, t: 0, d: 0.1 }, { f: 587, t: 0.09, d: 0.16 }],
  achievement:    [{ f: 659, t: 0, d: 0.1 }, { f: 880, t: 0.1, d: 0.2 }],
  clear:          [{ f: 660, t: 0, d: 0.06, type: "triangle", gain: 0.05 }],
  life:           [{ f: 160, t: 0, d: 0.2, type: "sawtooth", gain: 0.07 }],
};

class Audio {
  constructor() {
    this.ctx = null;
    this._muted = store.getSettings().sound === false;
  }

  isMuted() { return this._muted; }

  setMuted(m) {
    this._muted = !!m;
    store.updateSettings({ sound: !this._muted });
  }

  _ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  // Returns true if it attempted to play, false if muted / unknown / no audio support.
  play(name) {
    if (this._muted) return false;
    const notes = SOUNDS[name];
    if (!notes) return false;
    const ctx = this._ensureCtx();
    if (!ctx) return false;
    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = n.type || "sine";
      osc.frequency.value = n.f;
      const peak = n.gain != null ? n.gain : 0.08;
      const start = now + (n.t || 0);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
      osc.connect(g).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + n.d + 0.02);
    }
    return true;
  }
}

export const audio = new Audio();
