// Minimal in-browser test harness. Test modules call test(...) at import time;
// run-tests.html reads `results` after all imports resolve.
export const results = [];

export function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, err: String((e && e.message) || e) });
  }
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

export function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || "assertEqual"}: expected ${expected}, got ${actual}`);
  }
}

export function assertClose(actual, expected, eps, msg) {
  if (Math.abs(actual - expected) > eps) {
    throw new Error(`${msg || "assertClose"}: expected ~${expected}, got ${actual}`);
  }
}
