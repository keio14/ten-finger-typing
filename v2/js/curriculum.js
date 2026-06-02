// curriculum.js — the lesson data, in teaching order.
//
// Path: home row first (fingers rest here), then top row, then bottom row,
// then short real words mixing the rows. Each lesson lists the new keys it
// introduces, a few drill lines to type, and the accuracy needed to pass.
//
// Drills are plain lowercase strings (spaces are real space-bar presses).

export const LESSONS = [
  // ---- Home row ----
  {
    id: "home-fj",
    group: "Home row",
    title: "F and J (home keys)",
    keys: ["f", "j"],
    targetAccuracy: 90,
    drills: ["fff jjj fjf jfj", "fj fj jf jf fjj", "jfj fjf jjf ffj"],
  },
  {
    id: "home-dk",
    group: "Home row",
    title: "D and K",
    keys: ["d", "k"],
    targetAccuracy: 90,
    drills: ["ddd kkk dkd kdk", "fd jk df kj dk", "kdk dfk jdk fkd"],
  },
  {
    id: "home-sl",
    group: "Home row",
    title: "S and L",
    keys: ["s", "l"],
    targetAccuracy: 90,
    drills: ["sss lll sls lsl", "as la sl ls sd", "lsl sas lks fsl"],
  },
  {
    id: "home-all",
    group: "Home row",
    title: "Whole home row",
    keys: ["a", "s", "d", "f", "j", "k", "l", ";"],
    targetAccuracy: 90,
    drills: ["asdf jkl; asdf", "a sad lad has; a flask", "dad falls; sass lads"],
  },

  // ---- Top row ----
  {
    id: "top-ruei",
    group: "Top row",
    title: "R U E I",
    keys: ["r", "u", "e", "i"],
    targetAccuracy: 88,
    drills: ["rur iei rei uir", "fire rise true ride", "die our use kite"],
  },
  {
    id: "top-all",
    group: "Top row",
    title: "Whole top row",
    keys: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    targetAccuracy: 88,
    drills: ["qwert yuiop", "we type our quiet", "pretty power query"],
  },

  // ---- Bottom row ----
  {
    id: "bottom-vbnm",
    group: "Bottom row",
    title: "V B N M",
    keys: ["v", "b", "n", "m"],
    targetAccuracy: 86,
    drills: ["vbv nmn vnm bmn", "van born move numb", "brave name vibe"],
  },
  {
    id: "bottom-all",
    group: "Bottom row",
    title: "Whole bottom row",
    keys: ["z", "x", "c", "v", "b", "n", "m"],
    targetAccuracy: 86,
    drills: ["zxcv bnm zxcv", "cozy zebra cabin", "maze vivid jumbo"],
  },

  // ---- Words ----
  {
    id: "words-easy",
    group: "Words",
    title: "Easy words",
    keys: [],
    targetAccuracy: 85,
    drills: ["the cat sat on a mat", "a big red dog ran fast", "we like to play and win"],
  },
  {
    id: "words-mix",
    group: "Words",
    title: "Mixed words",
    keys: [],
    targetAccuracy: 85,
    drills: ["happy kids type every day", "jump over the lazy brown fox", "you can learn to type well"],
  },
];

// Lesson lookup by id.
export function getLesson(id) {
  return LESSONS.find((l) => l.id === id) || null;
}

// The index of a lesson (for prev/next + unlock checks).
export function lessonIndex(id) {
  return LESSONS.findIndex((l) => l.id === id);
}

// The lesson after the given one, or null at the end.
export function nextLesson(id) {
  const i = lessonIndex(id);
  return i >= 0 && i < LESSONS.length - 1 ? LESSONS[i + 1] : null;
}

// All distinct lowercase letters taught up to and including a lesson id.
// Used by the game to only drop letters the player has already learned.
// An unknown/missing id returns an empty array (nothing learned yet).
export function lettersLearnedThrough(id) {
  const end = lessonIndex(id);
  if (end === -1) return [];
  const set = new Set();
  for (let i = 0; i <= end; i++) {
    for (const ch of LESSONS[i].drills.join("")) {
      if (ch >= "a" && ch <= "z") set.add(ch);
    }
  }
  return [...set];
}
