// js/curriculum.js — the lesson ladder (data) plus pure lookup helpers.
// Lesson shape: { id, title, type, newKeys, content }
//   type: "keys" | "words" | "sentences" | "paragraph"
// Pass thresholds live on the COURSE (shared by all its lessons).

export const COURSES = [
  {
    id: "beginner",
    title: "Beginner",
    pass: { minAccuracy: 0.90, minWpm: 8 },
    units: [
      {
        id: "home", title: "Home Row", lessons: [
          { id: "home-fj", title: "F and J", type: "keys", newKeys: ["f", "j"], content: "fff jjj fj jf fjf jfj ffj jjf jf fj" },
          { id: "home-dk", title: "D and K", type: "keys", newKeys: ["d", "k"], content: "ddd kkk dk kd dkd kdk ddk kkd kd dk" },
          { id: "home-sl", title: "S and L", type: "keys", newKeys: ["s", "l"], content: "sss lll sl ls sls lsl ssl lls ls sl" },
          { id: "home-asemi", title: "A and ;", type: "keys", newKeys: ["a", ";"], content: "aaa ;;; a; ;a a;a ;a; aa; ;;a ;a a;" },
          { id: "home-gh", title: "G and H", type: "keys", newKeys: ["g", "h"], content: "ggg hhh gh hg ghg hgh ggh hhg hg gh" },
          { id: "home-words", title: "Home Row Words", type: "words", newKeys: [], content: "as ask dad fall flag glad half hall lad sad salad gash" },
        ],
      },
      {
        id: "top", title: "Top Row", lessons: [
          { id: "top-ei", title: "E and I", type: "keys", newKeys: ["e", "i"], content: "eee iii ei ie eie iei eei iie ie ei" },
          { id: "top-ru", title: "R and U", type: "keys", newKeys: ["r", "u"], content: "rrr uuu ru ur rur uru rru uur ur ru" },
          { id: "top-ty", title: "T and Y", type: "keys", newKeys: ["t", "y"], content: "ttt yyy ty yt tyt yty tty yyt yt ty" },
          { id: "top-wo", title: "W and O", type: "keys", newKeys: ["w", "o"], content: "www ooo wo ow wow owo wwo oow ow wo" },
          { id: "top-qp", title: "Q and P", type: "keys", newKeys: ["q", "p"], content: "qqq ppp qp pq qpq pqp qqp ppq pq qp" },
          { id: "top-words", title: "Top Row Words", type: "words", newKeys: [], content: "we it our top type were quiet power party your tour write" },
        ],
      },
      {
        id: "bottom", title: "Bottom Row", lessons: [
          { id: "bot-vn", title: "V and N", type: "keys", newKeys: ["v", "n"], content: "vvv nnn vn nv vnv nvn vvn nnv nv vn" },
          { id: "bot-cm", title: "C and M", type: "keys", newKeys: ["c", "m"], content: "ccc mmm cm mc cmc mcm ccm mmc mc cm" },
          { id: "bot-bx", title: "B and X", type: "keys", newKeys: ["b", "x"], content: "bbb xxx bx xb bxb xbx bbx xxb xb bx" },
          { id: "bot-words", title: "Bottom Row Words", type: "words", newKeys: [], content: "van can man box mix verb cave numb climb brave vacuum minimum" },
        ],
      },
      {
        id: "caps", title: "Capitals & Punctuation", lessons: [
          { id: "caps-letters", title: "Capital Letters", type: "sentences", newKeys: [], content: "Sam And Pat Go. The Big Dog Ran. We Like To Play. A Cat Sat." },
          { id: "punct-basic", title: "Periods and Commas", type: "sentences", newKeys: [], content: "I see a cat, a dog, and a bird. We run, jump, and play. Yes, it is fun." },
          { id: "sent-simple", title: "Simple Sentences", type: "sentences", newKeys: [], content: "the sun is hot. we go to the park. a dog can run fast. i like to read books." },
        ],
      },
      {
        id: "numbers", title: "Numbers", lessons: [
          { id: "num-left", title: "Numbers 1-5", type: "keys", newKeys: ["1", "2", "3", "4", "5"], content: "111 222 333 444 555 12 34 5 13 24 35" },
          { id: "num-right", title: "Numbers 6-0", type: "keys", newKeys: ["6", "7", "8", "9", "0"], content: "666 777 888 999 000 67 89 0 68 79 90" },
          { id: "num-mix", title: "All Numbers", type: "keys", newKeys: [], content: "1 2 3 4 5 6 7 8 9 0 19 28 37 46 50" },
        ],
      },
    ],
  },
  {
    id: "intermediate",
    title: "Intermediate",
    pass: { minAccuracy: 0.92, minWpm: 15 },
    units: [
      {
        id: "common", title: "Common Words", lessons: [
          { id: "words-common1", title: "Common Words", type: "words", newKeys: [], content: "the and that have with this from they will would there their what about which" },
          { id: "words-common2", title: "More Common Words", type: "words", newKeys: [], content: "people because through different important children system program question between" },
        ],
      },
      {
        id: "sentences2", title: "Sentences", lessons: [
          { id: "sent-medium", title: "Everyday Sentences", type: "sentences", newKeys: [], content: "She walked to the store to buy some fresh bread. They watched a movie after dinner last night." },
          { id: "sent-names", title: "Names and Places", type: "sentences", newKeys: [], content: "John lives in New York City. Maria visited Paris and London in the summer." },
        ],
      },
      {
        id: "punct2", title: "Punctuation", lessons: [
          { id: "punct-marks", title: "Questions and Exclamations", type: "sentences", newKeys: [], content: "Where are you going? That is amazing! Can we go now? What a beautiful day!" },
          { id: "punct-quotes", title: "Quotes and Apostrophes", type: "sentences", newKeys: [], content: "She said, \"Let's go home.\" It's a wonderful day. Don't forget your keys." },
        ],
      },
      {
        id: "para1", title: "Paragraphs", lessons: [
          { id: "para-short", title: "Short Paragraph", type: "paragraph", newKeys: [], content: "Reading every day is a great habit. It helps you learn new words and ideas. The more you read, the better you understand the world around you." },
        ],
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    pass: { minAccuracy: 0.94, minWpm: 22 },
    units: [
      {
        id: "speed", title: "Speed", lessons: [
          { id: "speed-words", title: "Speed Words", type: "words", newKeys: [], content: "time year work people way day man thing woman life child world school state family" },
          { id: "speed-sentences", title: "Speed Sentences", type: "sentences", newKeys: [], content: "The quick brown fox jumps over the lazy dog while the bright sun shines over the calm blue sea." },
        ],
      },
      {
        id: "symbols", title: "Symbols", lessons: [
          { id: "sym-common", title: "Common Symbols", type: "keys", newKeys: [], content: "@ # $ % & * 50% $100 a&b #1 50*2 m@x" },
          { id: "sym-code", title: "Code Symbols", type: "keys", newKeys: [], content: "( ) { } [ ] ; = () {x} [i] a = b; x = y;" },
        ],
      },
      {
        id: "reinforce", title: "Reinforcement", lessons: [
          { id: "para-long", title: "Long Paragraph", type: "paragraph", newKeys: [], content: "Learning to type without looking at the keyboard takes patience and practice. At first your fingers feel slow and clumsy, but with steady effort they begin to move on their own. Soon you will type quickly and accurately, freeing your mind to focus on your ideas instead of the keys." },
        ],
      },
    ],
  },
];

// Flat, ordered list of lessons, each annotated with its courseId and unitId.
export function allLessons() {
  const out = [];
  for (const course of COURSES) {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        out.push({ ...lesson, courseId: course.id, unitId: unit.id });
      }
    }
  }
  return out;
}

export function lessonById(id) {
  return allLessons().find((l) => l.id === id) || null;
}

export function courseById(id) {
  return COURSES.find((c) => c.id === id) || null;
}

export function courseOfLesson(id) {
  const l = lessonById(id);
  return l ? courseById(l.courseId) : null;
}

export function nextLessonId(id) {
  const list = allLessons();
  const i = list.findIndex((l) => l.id === id);
  return i >= 0 && i < list.length - 1 ? list[i + 1].id : null;
}

// True if `id` is the last lesson of its course (next lesson is in a different course, or none).
export function isLastInCourse(id) {
  const l = lessonById(id);
  if (!l) return false;
  const nextId = nextLessonId(id);
  if (!nextId) return true;
  return lessonById(nextId).courseId !== l.courseId;
}
