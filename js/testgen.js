// js/testgen.js — generate test text from a bank of common words.
const WORDS = [
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "time", "year",
  "people", "way", "day", "man", "world", "life", "hand", "part", "child", "eye",
  "work", "week", "case", "point", "number", "group", "fact", "money", "story", "idea",
  "while", "night", "study", "game", "line", "team", "minute", "body", "water", "month",
  "city", "name", "place", "where", "again", "great", "small", "every", "found", "thing",
];

// Space-joined string of `wordCount` random words. rng is injectable for tests.
export function testText(wordCount = 60, rng = Math.random) {
  const out = [];
  for (let i = 0; i < wordCount; i++) {
    out.push(WORDS[Math.floor(rng() * WORDS.length)]);
  }
  return out.join(" ");
}
