// speedlevels.js — the 6 speed-practice tiers. Same kind of typing at every
// tier; what rises each level is the TARGET words-per-minute she must reach.
// The ramp is gentle at the bottom and steep at the top:
//   Beginner 15 → Amateur 20 → Intermediate 30 → Advanced 45 → Expert 60 → Master 70
// The keyboard guide is shown for the first three tiers and hidden afterwards
// so she stops looking at her hands.
//
// Passages are plain lowercase a–z + spaces (pure speed practice — no new
// symbols). One passage is used per run; "Another test" loads a different one.

export const SPEED_TIERS = [
  {
    id: "beginner",
    targetWpm: 15,
    showKeyboard: true,
    passages: [
      "the cat and the dog can run and play in the sun all day",
      "we like to go to the park to see the big red bus go by",
      "she has a fun new toy and we all want to play with it now",
    ],
  },
  {
    id: "amateur",
    targetWpm: 20,
    showKeyboard: true,
    passages: [
      "the happy little puppy likes to play with a ball in the garden",
      "every day we eat sweet apples and drink cold milk after our lunch",
      "my younger sister can jump very high and run really fast at school",
    ],
  },
  {
    id: "intermediate",
    targetWpm: 30,
    showKeyboard: true,
    passages: [
      "the quick brown fox runs over the lazy dog near the old farm gate",
      "every morning the children walk together to the small village school",
      "she loves to read a funny bedtime story before she goes to sleep",
    ],
  },
  {
    id: "advanced",
    targetWpm: 45,
    showKeyboard: false,
    passages: [
      "typing quickly takes practice every single day so try your best and keep going",
      "the busy city street was full of cars buses and many people walking around",
      "we packed our heavy bags and went on a long and happy summer holiday trip",
    ],
  },
  {
    id: "expert",
    targetWpm: 60,
    showKeyboard: false,
    passages: [
      "the more you practice your typing the faster your fingers will move across the keyboard without ever looking down at your hands",
      "a really good typist keeps a smooth and steady rhythm and tries hard not to stop in the middle of a word or a sentence",
      "with a lot of patience and daily practice almost anyone can learn to type both quickly and very accurately over time",
    ],
  },
  {
    id: "master",
    targetWpm: 70,
    showKeyboard: false,
    passages: [
      "a skilled typist can hold a steady rhythm for a long time while staying both fast and accurate without ever looking at the keyboard",
      "practice a little every day and your speed will climb higher and higher until typing feels as natural and as easy as talking to a friend",
      "the secret to typing quickly is not rushing but staying calm and smooth so your fingers can find every single key without any hesitation",
    ],
  },
];

export function getTier(id) {
  return SPEED_TIERS.find((t) => t.id === id) || null;
}

export function tierIndex(id) {
  return SPEED_TIERS.findIndex((t) => t.id === id);
}

export function nextTier(id) {
  const i = tierIndex(id);
  return i >= 0 && i < SPEED_TIERS.length - 1 ? SPEED_TIERS[i + 1] : null;
}
