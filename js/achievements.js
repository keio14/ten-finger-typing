// js/achievements.js — badge definitions + earned-state evaluation over the store.
import { COURSES, allLessons } from "./curriculum.js";
import { courseProgress } from "./lessons.js";

const HOME_ROW_IDS = (COURSES[0].units.find((u) => u.id === "home")?.lessons || []).map((l) => l.id);

function anyLessonDone(store) {
  return allLessons().some((l) => { const p = store.getLesson(l.id); return p && p.completed; });
}
function unitDone(store, ids) {
  return ids.every((id) => { const p = store.getLesson(id); return p && p.completed; });
}
function courseDone(store, courseId) {
  const p = courseProgress(store, courseId);
  return p.total > 0 && p.done === p.total;
}

export const ACHIEVEMENTS = [
  { id: "first-lesson", icon: "🌱", label: "Completed your first lesson", earned: (s) => anyLessonDone(s) },
  { id: "home-row", icon: "🏠", label: "Mastered the Home Row", earned: (s) => unitDone(s, HOME_ROW_IDS) },
  { id: "beginner-course", icon: "🎓", label: "Finished the Beginner course", earned: (s) => courseDone(s, "beginner") },
  { id: "speedy", icon: "⚡", label: "Reached 20 WPM in a test", earned: (s) => s.getTests().some((t) => t.wpm >= 20) },
  { id: "sharp", icon: "🎯", label: "Scored 95%+ accuracy in a test", earned: (s) => s.getTests().some((t) => t.accuracy >= 0.95) },
  { id: "gamer", icon: "🎮", label: "Scored 20+ in Letter Rain", earned: (s) => s.getGame().highScore >= 20 },
];

export function achievementById(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}

// All currently-earned achievement objects.
export function evaluate(store) {
  return ACHIEVEMENTS.filter((a) => a.earned(store));
}

// Persist any newly-earned achievements; return the list of newly-added ids.
export function syncAchievements(store) {
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (a.earned(store) && !store.getAchievements().includes(a.id)) {
      store.addAchievement(a.id);
      newly.push(a.id);
    }
  }
  return newly;
}
