// sheetVoice.ts — the Hinglish layer of the 250-sheet UI. The library page talks the
// way the student actually thinks at 1 a.m.: Hindi grammar, English technical words,
// no Devanagari, so it reads the same on every keyboard. Anything a real interview
// answer needs to say stays in English; this file only carries the labels, prompts and
// the hausla line that reacts to what has been solved so far.

export type SheetVoiceMode = "week" | "topic" | "pattern";

/** The three ways the rail cuts the sheet, said the way a student says them. The
 * count in front of each noun comes from the sheet itself, never from here. */
export const sheetModeVoice: Record<SheetVoiceMode, { label: string; sub: string }> = {
  week: { label: "Week", sub: "stage" },
  topic: { label: "Topic", sub: "topic" },
  pattern: { label: "Pattern", sub: "pattern" },
};

export const sheetVoice = {
  eyebrow: "TERI PRACTICE, AAPKE HAATH MEIN",
  heroLine1: "Instinct banao,",
  heroLine2: "har question tod do.",
  heroBody: (total: number, topicCount: number, patternCount: number, weeks: number) =>
    `Saare ${total} problem real LeetCode question hain, public index pe verify kiye hue. Library do tarah se cut hoti hai - ${topicCount} topic aur ${patternCount} pattern, upar se ${weeks}-week ka stage ladder. Koi bhi row kholo: pehchaan, seedhi ke steps, us pattern ke trap, aur ek live board jo algorithm tumhare saamne chalata hai.`,
  heroOpen: "Library kholo",
  heroSaveNote: "Progress apne aap save hoti rehti hai",
  stats: { solved: "SOLVE KIYE", progress: "CHAL RAHA HAI", patterns: "CORE PATTERN" },
  statsNote: { solved: "Ek rep at a time", progress: "Momentum mat todo", patterns: "Problem aise connect hote hain" },
  heading: "PRACTICE LIBRARY",
  headingTest: (pattern: string) => `${pattern} ka 4-sawal test`,
  headingTestIdle: "Pehle ek pattern chuno",
  railAll: "Pura sheet",
  railAllMeta: (total: number, patternCount: number, topicCount: number) =>
    `${total} problems · ${patternCount} pattern · ${topicCount} topic`,
  railPick: (mode: SheetVoiceMode) => `Ek ${sheetModeVoice[mode].label.toLowerCase()} chun lo - ya jo weak lag raha hai wo search karo.`,
  railClear: (total: number) => `Poora ${total} dikha do`,
  railFilteredTo: "Filter laga diya",
  searchHint: "Pattern, topic ya problem ka naam likho",
  searchChips: ["dp", "graph", "easy unsolved", "sliding window", "monotonic"],
  searchLead: "Jo weak lage, wo type karo",
  searchFoot: "sheet pattern, level aur status padh leti hai - har solve pe XP milta hai",
  filters: { pattern: "PATTERN", difficulty: "LEVEL", status: "STATUS" },
  filterAll: { pattern: "Sab pattern", difficulty: "Sab level", status: "Sab status" },
  toolbar: (group: string, mode: SheetVoiceMode) => group || `saare ${sheetModeVoice[mode].label.toLowerCase()}`,
  verified: "TITLE, SLUG AUR LEVEL LEETCODE PE SE VERIFY KIYE HUE",
  approach: "Approach",
  studying: "Padh raha hai",
  solveNow: "Ho gaya",
  undoSolve: "Solve hata do",
  notePlaceholder: (title: string) => `Ek line - ${title} ke baare mein jo interview mein yaad rahe.`,
  noteSave: "Note save karo",
  noteClose: "Band karo",
  notePraise: (words: number) =>
    words >= 12 ? "Interview-ready note. Aise hi likho." : words > 0 ? "Likhna shuru kiya - future tu isko padhega." : "Poora solution mat likho, sirf trick likho.",
  empty: "Kuch nahi mila",
  emptyFoot: "Filter hata ke dobara dekh.",
  clearFilters: "Filter hatao",
  showAll: (count: number, key: string) => `Saare ${count} dikha do - ${key}`,
  keyboardHint: "↑ ↓ se row hilao · Enter pe approach khulega · S se solve mark · Esc se band",
  openEditor: "Editor mein kholo",
  boardNote: (pattern: string) => `${pattern} ka worked example - is question ka test case nahi`,
  boardEmpty: "Is pattern ka live board abhi nahi bana.",
  syncLocal: "Progress isi device pe save ho raha hai",
  syncCloud: "Progress account ke saath sync hai",
} as const;

/** Panel tabs, said short. */
export const studyTabVoice = { approach: "Kaise approach karein", board: "Whiteboard" } as const;

/** Panel section labels. The teaching text under them stays in English on purpose -
 * it is the language the interview itself will be in. */
export const studyBlockVoice = {
  recognise: "PEHCHANO",
  ladder: "SEEDHI, CRAM SE",
  traps: "IS PATTERN KE TRAP",
  skeleton: "YEH HAI STRUCTURE",
  topic: "TOPIC EK LINE MEIN",
  start: "Yahan se shuru",
  cost: "Cost",
  step: (step: number, total: number) => `STEP ${step} / ${total}`,
} as const;

/** Everything the Love Babbar video rail under the sheet prints. The lecture
 * titles stay exactly as YouTube writes them; only the chrome is Hinglish. */
export const videoVoice = {
  eyebrow: "VIDEO LESSONS · LOVE BABBAR",
  heading: (lessons: number, hours: number) => `${lessons} free video lessons, ${hours} ghante.`,
  headingTail: "Playlist block khatam - ab lesson row se khulta hai.",
  body: (topics: number, channel: string) => `Har lecture ${channel} ki official series ka, alag khulta hai - ${topics} sheet topics pe bera hua. Pehle video pe tap karo, poora player yahin khulega, page chhod ke nahi.`,
  free: "FREE",
  filterAll: "Sab lessons",
  nowPlaying: "CHAL RAHA HAI",
  pickPrompt: "Neeche se lesson chuno - player yahin khulega.",
  playFirst: (topic: string) => `${topic} ka pehla lesson chalao`,
  play: "Chalao",
  openYouTube: "YouTube pe kholo",
  nextLesson: "Agla lesson",
  prevLesson: "Pichla lesson",
  lessonLabel: (lecture: number) => `LECTURE ${lecture}`,
  basicsLabel: "C++ & basics",
  sheetJump: (count: number, topic: string) => `Sheet mein ${count} problems - ${topic}`,
  matched: "PATTERN FILTER SE MATCH",
  showAll: (count: number) => `Saare ${count} lesson dikha do`,
  totalNote: (hours: number, lessons: number, extras: number) => `${hours} ghante · ${lessons} lecture · ${extras} series update`,
  privacy: "Play dabane tak player embed khaali rehta hai - poster ke alawa YouTube se kuch nahi aata.",
} as const;

/** What the day strip above the sheet says. The plan is not a new promise - it is
 * the sheet's own 12 weeks cut into 84 days, so this copy only ever reports what
 * those rows already say. */
export const dailyVoice = {
  eyebrow: "AAJ KA TASK",
  day: (day: number, total: number) => `Day ${day} / ${total}`,
  week: (week: number, slot: number) => `Week ${week} ka din ${slot + 1}`,
  count: (rows: number) => (rows === 1 ? "1 problem aaj" : `${rows} problems aaj`),
  open: "Kholo",
  markDone: "Aaj ke liye ho gaya",
  undo: "Wapas Todo pe rakho",
  solvedToday: (done: number, rows: number) => `${done} / ${rows} aaj ho gaye`,
  allDone: "Aaj ka set poora. Kal ka task raat 12 se.",
  behind: (rows: number) => `Plan se ${rows} peeche`,
  ahead: (rows: number) => `Plan se ${rows} aage`,
  even: "Bilkul plan pe ho.",
  dueBy: (expected: number, solved: number) => `Aaj tak plan ${expected} solve karne maange tha - tum ${solved} kar chuke ho.`,
  finished: (total: number) => `${total} din ka plan poora. Ab naya plan shuru karo ya pattern films dohrao.`,
  restart: "Naya plan aaj se",
  anchor: (start: string) => `Plan ka din 1 = ${start}.`,
  note: "Ye 250 sheet ke apne 12 hafte hain - bas din ke hisab se baante hue. Koi naya waada nahi.",
  custom: (label: string) => `Ye tumhara chuna hua window hai (${label}). Rows wahi 250 sheet se aate hain - bas baant badli hai.`,
  restDay: "Aaj koi naya problem nahi. Kal ke do dohrao, phir band karo.",
} as const;

export type HauslaState = {  solved: number;
  total: number;
  inProgress: number;
  streak: number;
  percent: number;
};

type Hausla = { line: string; sub: string };

const START: Hausla = { line: "Pehla problem aaj hi khol do. Shuruat sabse badi baat hai.", sub: "Week 1, row 001 - Arrays & Hashing se aaram milta hai." };
const WARMING: Hausla[] = [
  { line: "Haath garam ho raha hai. Ab pattern repeat dikhne lagega.", sub: " Roz ek naya problem, roz ek naya reflex." },
  { line: "Tu solve kar raha hai, soch bhi raha hai. Yehi farak hai.", sub: "Note likh liya karo - wahi line interview mein kaam aayegi." },
  { line: "Dheere mat chhod. Aaj ka ek solve kal ki confidence hai.", sub: "Streak tootne se pehle, ek easy bhi kaafi hai." },
];
const MID: Hausla[] = [
  { line: "Ek-teen hawa badal gaya - ab tujhe question dekh ke pattern dikhta hai.", sub: "Ab hard pe ja, wahi seekhne ka asli jagah hai." },
  { line: "Ab 50 ke paar hai. Ye woh range hai jahan log interview clear karte hain.", sub: "Jo chhoot gaya, usko week ke hisaab se wapas aao." },
  { line: "DP ne bahut ko haraya. Tune nahi hara. Yehi difference hai.", sub: "Ek din mein 2 DP se zyada mat - depth > speed." },
];
const STRONG: Hausla[] = [
  { line: "100 ke paar. Ab tu un logon se aage hai jo sirf video dekhte hain.", sub: "Khud se explain karna shuru karo - wahin se clarity pakki hoti hai." },
  { line: "Ab sheet tuje pehchanne lagi hai. Tu sheet ko nahi.", sub: "Mock interview ka time aa gaya hai." },
];
const FINAL: Hausla[] = [
  { line: "Bas thoda sa bacha hai. Rukna mat, ab speed badhti hai.", sub: "Jo bache hain, unko week ke order mein khatam karo." },
  { line: "Aakhir ke 50 sabse hard hote hain. Tere liye banaye gaye hain.", sub: "Ek-ek karke khatam - sheet adhuri chhodna sabse mehnga hai." },
];
const DONE: Hausla = { line: "Sheet khatam. Ab interview jaake baat karo.", sub: "Certificate utha lo, leaderboard pe naam hai." };

/**
 * The line under the hero. Chosen from where the student actually is, and rotated by
 * the solved count so it never reads frozen on a long session.
 */
export function hauslaLine(state: HauslaState): Hausla {
  const { solved, total, streak } = state;
  const bucket = solved === 0 ? [START]
    : solved >= total ? [DONE]
    : solved < 15 ? WARMING
    : solved < 50 ? MID
    : solved < 125 ? STRONG
    : FINAL;
  const picked = bucket[solved % bucket.length];
  if (solved > 0 && streak >= 3) return { ...picked, sub: `${streak} din ki streak chal rahi hai - ${picked.sub}` };
  if (state.inProgress >= 4 && solved < total) return { ...picked, sub: `${state.inProgress} problem currently chal rahe hain - pehle ek khatam karo.` };
  return picked;
}

/** Short Hinglish for the XP toast, so the reward reads in the same voice. */
export function rewardVoice(problem: { title: string; pattern: string; difficulty: string }, xp: number): string {
  const level = problem.difficulty === "Easy" ? "easy" : problem.difficulty === "Medium" ? "medium" : "hard";
  const lines = [
    `${problem.title} solved. ${problem.pattern} ab tujhe aata hai. +${xp} XP`,
    `${level} clear kiya - ${problem.pattern} ek baar aur practice ho gayi. +${xp} XP`,
    `Done. ${problem.title} ab tere note ke laayak hai. +${xp} XP`,
  ];
  return lines[problem.title.length % lines.length];
}
