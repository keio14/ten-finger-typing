// i18n.js — UI translations for English, Simplified Chinese, and Vietnamese.
// Only the interface text is translated; the keys/words the child TYPES stay
// English a–z (Chinese needs an IME and Vietnamese needs diacritics, neither of
// which a beginner can produce on a plain QWERTY keyboard).
//
// Usage: t("home.save") -> string for the current language; t supports
// {param} interpolation, e.g. t("home.bestScore", { n: 12 }).

import { getLang, setLang } from "./state.js";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "vi", label: "Tiếng Việt" },
];

// Exported so tests can verify every language defines the same set of keys.
export const STRINGS = {
  en: {
    "nav.home": "🏠 Home",
    "nav.lessons": "📚 Lessons",
    "nav.game": "🎮 Game",
    "nav.sound": "🔊 Sound",
    "nav.muted": "🔇 Muted",
    greeting: "Hi, {name}!",

    "home.title": "⌨️ Ten-Finger Typing",
    "home.welcome": "Welcome! 👋 Let's learn to type with all ten fingers.",
    "home.welcomeNamed": "Hi, {name}! 👋 Let's learn to type with all ten fingers.",
    "home.lessons": "Lessons",
    "home.lessonsDesc": "Learn the keys, row by row.",
    "home.game": "Falling Words",
    "home.gameDesc": "Type the words before they land!",
    "home.bestScore": "Best score: {n}",
    "home.yourName": "Your name:",
    "home.namePlaceholder": "type your name",
    "home.save": "Save",
    "home.progress": "Your progress",
    "home.stars": "Stars",
    "home.completed": "Lessons done",
    "home.next": "Up next",
    "home.allDone": "All lessons complete! 🎉",

    "lessons.title": "📚 Lessons",
    "lessons.sub": "Start at the top. Each lesson unlocks the next one.",
    "lessons.locked": "Finish the lesson before this one to unlock it",

    "group.Home row": "Home row",
    "group.Top row": "Top row",
    "group.Bottom row": "Bottom row",
    "group.Words": "Words",

    "title.home-fj": "F and J (home keys)",
    "title.home-dk": "D and K",
    "title.home-sl": "S and L",
    "title.home-all": "Whole home row",
    "title.top-ruei": "R U E I",
    "title.top-all": "Whole top row",
    "title.bottom-vbnm": "V B N M",
    "title.bottom-all": "Whole bottom row",
    "title.words-easy": "Easy words",
    "title.words-mix": "Mixed words",

    "lesson.back": "← All lessons",
    "lesson.accuracy": "Accuracy",
    "lesson.speed": "Speed",
    "lesson.wpmUnit": "wpm",
    "lesson.tip": "Rest your fingers on the home row (F and J have little bumps) and look at the screen, not your hands!",
    "lesson.nextSpace": "Next: press the space bar with a thumb",
    "lesson.nextKey": "Next: “{ch}” — use your {finger}",
    "lesson.doneMsg": "Nice work! Accuracy {acc}%.",
    "lesson.next": "Next lesson →",
    "lesson.finishedAll": "You finished every lesson! 🎉",
    "lesson.tryAgain": "Try again",
    "lesson.allLessons": "All lessons",

    "finger.L-pinky": "left pinky",
    "finger.L-ring": "left ring finger",
    "finger.L-middle": "left middle finger",
    "finger.L-index": "left index finger",
    "finger.R-index": "right index finger",
    "finger.R-middle": "right middle finger",
    "finger.R-ring": "right ring finger",
    "finger.R-pinky": "right pinky",
    "finger.thumb": "thumb",

    "game.score": "Score",
    "game.level": "Level",
    "game.best": "Best",
    "game.tip": "Type the whole word before it reaches the ground! Each level falls a little faster.",
    "game.levelUp": "Level {n}! 🚀",
    "game.over": "Game over!",
    "game.result": "You scored {score} and reached level {level}.",
    "game.bestScore": "Best score: {best}",
    "game.again": "Play again ↺",
    "game.home": "Home",
  },

  zh: {
    "nav.home": "🏠 主页",
    "nav.lessons": "📚 课程",
    "nav.game": "🎮 游戏",
    "nav.sound": "🔊 声音",
    "nav.muted": "🔇 静音",
    greeting: "你好，{name}！",

    "home.title": "⌨️ 十指打字",
    "home.welcome": "欢迎！👋 一起用十个手指学打字吧。",
    "home.welcomeNamed": "你好，{name}！👋 一起用十个手指学打字吧。",
    "home.lessons": "课程",
    "home.lessonsDesc": "一排一排地学习按键。",
    "home.game": "下落单词",
    "home.gameDesc": "在单词落地前把它打出来！",
    "home.bestScore": "最高分：{n}",
    "home.yourName": "你的名字：",
    "home.namePlaceholder": "输入名字",
    "home.save": "保存",
    "home.progress": "你的进度",
    "home.stars": "星星",
    "home.completed": "完成课程",
    "home.next": "接下来",
    "home.allDone": "所有课程都完成啦！🎉",

    "lessons.title": "📚 课程",
    "lessons.sub": "从最上面开始。每完成一课就解锁下一课。",
    "lessons.locked": "先完成前一课才能解锁",

    "group.Home row": "基准键行",
    "group.Top row": "上排",
    "group.Bottom row": "下排",
    "group.Words": "单词",

    "title.home-fj": "F 和 J（基准键）",
    "title.home-dk": "D 和 K",
    "title.home-sl": "S 和 L",
    "title.home-all": "整个基准键行",
    "title.top-ruei": "R U E I",
    "title.top-all": "整个上排",
    "title.bottom-vbnm": "V B N M",
    "title.bottom-all": "整个下排",
    "title.words-easy": "简单单词",
    "title.words-mix": "混合单词",

    "lesson.back": "← 所有课程",
    "lesson.accuracy": "正确率",
    "lesson.speed": "速度",
    "lesson.wpmUnit": "词/分",
    "lesson.tip": "把手指放在基准键上（F 和 J 上有小凸点），看着屏幕，不要看手！",
    "lesson.nextSpace": "下一个：用拇指按空格键",
    "lesson.nextKey": "下一个：“{ch}” — 用你的{finger}",
    "lesson.doneMsg": "做得好！正确率 {acc}%。",
    "lesson.next": "下一课 →",
    "lesson.finishedAll": "你完成了所有课程！🎉",
    "lesson.tryAgain": "再试一次",
    "lesson.allLessons": "所有课程",

    "finger.L-pinky": "左手小指",
    "finger.L-ring": "左手无名指",
    "finger.L-middle": "左手中指",
    "finger.L-index": "左手食指",
    "finger.R-index": "右手食指",
    "finger.R-middle": "右手中指",
    "finger.R-ring": "右手无名指",
    "finger.R-pinky": "右手小指",
    "finger.thumb": "拇指",

    "game.score": "得分",
    "game.level": "等级",
    "game.best": "最高",
    "game.tip": "在单词落地前把整个单词打出来！每升一级会快一点。",
    "game.levelUp": "第 {n} 级！🚀",
    "game.over": "游戏结束！",
    "game.result": "你得了 {score} 分，到达第 {level} 级。",
    "game.bestScore": "最高分：{best}",
    "game.again": "再玩一次 ↺",
    "game.home": "主页",
  },

  vi: {
    "nav.home": "🏠 Trang chủ",
    "nav.lessons": "📚 Bài học",
    "nav.game": "🎮 Trò chơi",
    "nav.sound": "🔊 Âm thanh",
    "nav.muted": "🔇 Tắt tiếng",
    greeting: "Chào {name}!",

    "home.title": "⌨️ Gõ Mười Ngón",
    "home.welcome": "Chào mừng! 👋 Cùng học gõ bằng cả mười ngón tay nhé.",
    "home.welcomeNamed": "Chào {name}! 👋 Cùng học gõ bằng cả mười ngón tay nhé.",
    "home.lessons": "Bài học",
    "home.lessonsDesc": "Học từng phím, từng hàng một.",
    "home.game": "Từ Rơi",
    "home.gameDesc": "Gõ các từ trước khi chúng rơi xuống đất!",
    "home.bestScore": "Điểm cao nhất: {n}",
    "home.yourName": "Tên của bạn:",
    "home.namePlaceholder": "nhập tên của bạn",
    "home.save": "Lưu",
    "home.progress": "Tiến độ của bạn",
    "home.stars": "Sao",
    "home.completed": "Bài đã xong",
    "home.next": "Tiếp theo",
    "home.allDone": "Đã hoàn thành tất cả bài học! 🎉",

    "lessons.title": "📚 Bài học",
    "lessons.sub": "Bắt đầu từ trên xuống. Mỗi bài học mở khóa bài tiếp theo.",
    "lessons.locked": "Hoàn thành bài trước để mở khóa bài này",

    "group.Home row": "Hàng phím chính",
    "group.Top row": "Hàng trên",
    "group.Bottom row": "Hàng dưới",
    "group.Words": "Từ ngữ",

    "title.home-fj": "F và J (phím chính)",
    "title.home-dk": "D và K",
    "title.home-sl": "S và L",
    "title.home-all": "Cả hàng phím chính",
    "title.top-ruei": "R U E I",
    "title.top-all": "Cả hàng trên",
    "title.bottom-vbnm": "V B N M",
    "title.bottom-all": "Cả hàng dưới",
    "title.words-easy": "Từ dễ",
    "title.words-mix": "Từ hỗn hợp",

    "lesson.back": "← Tất cả bài học",
    "lesson.accuracy": "Độ chính xác",
    "lesson.speed": "Tốc độ",
    "lesson.wpmUnit": "từ/phút",
    "lesson.tip": "Đặt ngón tay lên hàng phím chính (F và J có gờ nhỏ) và nhìn màn hình, đừng nhìn tay!",
    "lesson.nextSpace": "Tiếp theo: nhấn phím cách bằng ngón cái",
    "lesson.nextKey": "Tiếp theo: “{ch}” — dùng {finger}",
    "lesson.doneMsg": "Làm tốt lắm! Độ chính xác {acc}%.",
    "lesson.next": "Bài tiếp theo →",
    "lesson.finishedAll": "Bạn đã hoàn thành mọi bài học! 🎉",
    "lesson.tryAgain": "Thử lại",
    "lesson.allLessons": "Tất cả bài học",

    "finger.L-pinky": "ngón út trái",
    "finger.L-ring": "ngón áp út trái",
    "finger.L-middle": "ngón giữa trái",
    "finger.L-index": "ngón trỏ trái",
    "finger.R-index": "ngón trỏ phải",
    "finger.R-middle": "ngón giữa phải",
    "finger.R-ring": "ngón áp út phải",
    "finger.R-pinky": "ngón út phải",
    "finger.thumb": "ngón cái",

    "game.score": "Điểm",
    "game.level": "Cấp",
    "game.best": "Cao nhất",
    "game.tip": "Gõ trọn cả từ trước khi nó chạm đất! Mỗi cấp sẽ rơi nhanh hơn một chút.",
    "game.levelUp": "Cấp {n}! 🚀",
    "game.over": "Kết thúc trò chơi!",
    "game.result": "Bạn được {score} điểm và đạt cấp {level}.",
    "game.bestScore": "Điểm cao nhất: {best}",
    "game.again": "Chơi lại ↺",
    "game.home": "Trang chủ",
  },
};

// Translate a key for the current language, with {param} interpolation.
// Falls back to English, then to the raw key, so a missing string is visible
// rather than blank.
export function t(key, params) {
  const lang = getLang();
  const table = STRINGS[lang] || STRINGS.en;
  let str = table[key];
  if (str == null) str = STRINGS.en[key];
  if (str == null) return key;
  if (params) {
    for (const p of Object.keys(params)) {
      str = str.split(`{${p}}`).join(String(params[p]));
    }
  }
  return str;
}

// Re-export the language setters/getters so views import everything i18n
// from one place.
export { getLang, setLang };
