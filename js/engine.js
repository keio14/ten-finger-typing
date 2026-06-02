// js/engine.js — shared typing math + a target-driven typing session.

export const Stats = {
  // Net WPM: (correct chars / 5) divided by minutes elapsed.
  wpm(correctChars, ms) {
    if (ms <= 0) return 0;
    const minutes = ms / 60000;
    return Math.round((correctChars / 5) / minutes);
  },
  // Accuracy as a 0..1 ratio. No keystrokes yet => perfect.
  accuracy(correct, total) {
    if (total <= 0) return 1;
    return correct / total;
  },
};

// A printable key is any single-character key (letters, digits, space, punctuation).
function isPrintable(key) {
  return typeof key === "string" && key.length === 1;
}

export class TextSession {
  constructor(target, { onProgress, onComplete } = {}, now = () => performance.now()) {
    this.target = target;
    this.onProgress = onProgress || null;
    this.onComplete = onComplete || null;
    this._now = now;
    this.reset();
  }

  reset() {
    this.index = 0;        // next character to type
    this.totalTyped = 0;   // printable keystrokes (excludes Backspace)
    this.errors = 0;       // wrong keystrokes
    this._start = null;    // timestamp of first keystroke
    this._end = null;      // timestamp of completion
    this._completed = false;
  }

  get nextChar() {
    return this.index < this.target.length ? this.target[this.index] : null;
  }

  get isComplete() {
    return this._completed;
  }

  get elapsedMs() {
    if (this._start === null) return 0;
    return (this._end !== null ? this._end : this._now()) - this._start;
  }

  get stats() {
    return {
      index: this.index,
      nextChar: this.nextChar,
      elapsedMs: this.elapsedMs,
      errors: this.errors,
      wpm: Stats.wpm(this.index, this.elapsedMs),
      accuracy: Stats.accuracy(this.totalTyped - this.errors, this.totalTyped),
    };
  }

  handleKey(key) {
    if (this._completed) return;

    if (key === "Backspace") {
      if (this.index > 0) this.index--;
      if (this.onProgress) this.onProgress(this.stats);
      return;
    }
    if (!isPrintable(key)) return;

    if (this._start === null) this._start = this._now();
    this.totalTyped++;

    if (key === this.target[this.index]) {
      this.index++;
      if (this.index >= this.target.length) {
        this._completed = true;
        this._end = this._now();
        if (this.onProgress) this.onProgress(this.stats);
        if (this.onComplete) this.onComplete(this.stats);
        return;
      }
    } else {
      this.errors++;
    }
    if (this.onProgress) this.onProgress(this.stats);
  }
}
