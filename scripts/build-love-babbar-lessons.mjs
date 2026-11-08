// Builds src/love-babbar-lessons.ts from the real CodeHelp playlist dump.
//
// The source of truth is scripts/data/love-babbar-playlist.json, scraped from
// https://www.youtube.com/playlist?list=PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA and
// then checked one-by-one against YouTube's public oEmbed endpoint (149/149
// resolved to a CodeHelp video whose title carries the same lecture number).
// Nothing is invented here: the lecture number, the title and the duration come
// from the playlist, and the week comes from the sheet rows themselves.
//
// Run:  npx --yes vite build --ssr scripts/build-love-babbar-lessons.mjs --outDir .study-ssr
//       node .study-ssr/build-love-babbar-lessons.js
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { problems, topics, patterns } from "../src/dsaSheet.ts";

// The bundle runs from .study-ssr, so paths are resolved from the repo root.
const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\.study-ssr\/$/, "");
const raw = JSON.parse(readFileSync(`${root}scripts/data/love-babbar-playlist.json`, "utf8"));

const secondsOf = (runtime) => {
  const parts = String(runtime).split(":").map(Number);
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
};

/** The sheet's own week for a topic: the week most of its rows sit in. */
const weekOfTopic = Object.fromEntries(topics.map((topic) => {
  const weeks = problems.filter((problem) => problem.topic === topic).map((problem) => problem.week);
  const counts = new Map();
  for (const week of weeks) counts.set(week, (counts.get(week) ?? 0) + 1);
  return [topic, [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0];
}));

// Ordered: the first rule whose pattern appears in the title wins. Rules name a
// sheet topic and, where the lecture really is about one of the sheet's 16
// patterns, that pattern too.
const rules = [
  { re: /Weekly Contest|Phase-1 Completed/i, kind: "series", topic: null, patterns: [], label: "Series update" },
  { re: /Largest Rectangular Area in Histogram|Max Rectangle in Binary Matrix/i, kind: "lecture", topic: "Stacks & Queues", patterns: ["Monotonic Stack"] },
  { re: /Introduction to Stacks|Stack Interview Questions|Celebrity Problem|"N" Stacks|Design Special Stack/i, kind: "lecture", topic: "Stacks & Queues", patterns: ["Stack"] },
  { re: /Queues in C\+\+|Queue FAANG/i, kind: "lecture", topic: "Stacks & Queues", patterns: [] },
  { re: /Binary SearchTree|Binary Search Tree|Largest BST in a Binary|Unique Binary Search Trees/i, kind: "lecture", topic: "Trees & BSTs", patterns: ["Trees"] },
  { re: /Binary Tree|Burn the Entire Binary|Morris Traversal|Construct a Binary Tree|Merge 2 Binary/i, kind: "lecture", topic: "Trees & BSTs", patterns: ["Trees"] },
  { re: /Linked List|Reverse LL|find Middle of LL|Check LL is Circular|Detect & Remove Loop|Remove Duplicates from a Sorted|Sort 0s, 1s and 2s|Check Palindrome in Linked|Add 2 Numbers represented by Linked|Clone a Linked List/i, kind: "lecture", topic: "Linked Lists", patterns: ["Linked List"] },
  { re: /Heaps in C\+\+|Heap Sort|Priority Queue|Heaps Hard Interview/i, kind: "lecture", topic: "Heaps & Priority Queues", patterns: ["Heaps"] },
  { re: /Topological Sort|Kosaraju|Kruskal|Prim's Algorithm|Dijkstra|Bellman Ford|Shortest Path|Cycle Detection|Bridges in a Graph|Articulation Points|BFS Traversal|DFS Traversal|Introduction to Graphs/i, kind: "lecture", topic: "Graphs & Topological Sort", patterns: ["Graphs"] },
  { re: /GREEDY ALGORITHMS/i, kind: "lecture", topic: "Greedy & Intervals", patterns: ["Greedy"] },
  { re: /0\/1 KnapSack|Largest Square area in Matrix|Minimum Sideways Jump|Reducing Dishes|Pizza with 3n|Maximum Rectangle with all|EDIT Distance|Longest Common Subsequence|Longest Palindromic Subsequence|Wildcard Pattern/i, kind: "lecture", topic: "Dynamic Programming", patterns: ["2-D DP"] },
  { re: /Dynamic Programming|DP Series|Memoization|Combination Sum IV|Perfect Squares|Count derangements|Painting Fence|Cut Rod|Climbing Stairs|Non-Adjacent|House Robbery|Minimum Number of Coins|Cost for Tickets|Increasing Subsequence|Cuboid|Dice Rolls|Partition Equal Subset|Minimum Swaps|Longest Arithmetic|Longest AP|Catalan|Guess Number|Cost Tree From Leaf|Buy and Sell Stock/i, kind: "lecture", topic: "Dynamic Programming", patterns: ["1-D DP"] },
  { re: /Rat in\s+?a?\s*Maze|N-Queen|Sudoku Solver|Subsets \/ Subsequences|Phone Keypad Problem|Permutations of a String/i, kind: "lecture", topic: "Backtracking", patterns: ["Backtracking"] },
  { re: /Learning Recursion|Understanding Recursion|Recursion with Strings|Recursion and Binary Search|Recursion the Best/i, kind: "lecture", topic: "Backtracking", patterns: ["Backtracking"] },
  { re: /Trie|Longest Common Prefix|Phone Directory Using Trie/i, kind: "lecture", topic: "Strings & Two Pointers", patterns: ["Two Pointers"] },
  { re: /Char Arrays, Strings/i, kind: "lecture", topic: "Strings & Two Pointers", patterns: ["Two Pointers", "Sliding Window"] },
  { re: /Bitwise Operators/i, kind: "lecture", topic: "Bit Manipulation", patterns: ["Bit Manipulation"] },
  { re: /Binary & Decimal/i, kind: "lecture", topic: "Bit Manipulation", patterns: [] },
  { re: /Binary Search|Book Allocation|Aggressive Cows/i, kind: "lecture", topic: "Sorting & Searching", patterns: ["Binary Search"] },
  { re: /Selection Sort|BUBBLE SORT|INSERTION SORT|Merge Sort using|Quick Sort using/i, kind: "lecture", topic: "Sorting & Searching", patterns: [] },
  { re: /Hashmaps/i, kind: "lecture", topic: "Arrays & Hashing", patterns: ["Arrays & Hashing"] },
  { re: /Introduction to Arrays|Introduction to 2D Arrays|\[Arrays\]|Solving LeetCode\/CodeStudio Questions/i, kind: "lecture", topic: "Arrays & Hashing", patterns: ["Arrays & Hashing"] },
  { re: /Time & Space Complexity/i, kind: "lecture", topic: null, patterns: [], label: "Complexity" },
  { re: /Basic Maths for DSA|Sieve|Modular Arithmetics|Euclid/i, kind: "lecture", topic: null, patterns: [], label: "Maths for DSA" },
  { re: /Pointers in C\+\+|Double Pointers|Reference Variable|Dynamic Memory Allocation/i, kind: "lecture", topic: null, patterns: [], label: "C++ basics" },
  { re: /OOPs|4 Pillars of OOPs/i, kind: "lecture", topic: null, patterns: [], label: "OOPs" },
  { re: /Intro to Programming|First Program|If-Else|Switch Statement|C\+\+ STL|Macros|LeetCode Problem Solving Session|Pattern Questions/i, kind: "lecture", topic: null, patterns: [], label: "C++ basics" },
];

// Anything the rules above did not catch still gets a row: the rail shows it
// under "Course extra" rather than dropping a lecture the playlist really has.
const FALLBACK = { kind: "lecture", topic: null, patterns: [], label: "Course extra" };

// Series noise comes in chains ("... || 2D-DP || DP Series"), so the strip runs
// until the title stops changing.
const NOISE = /\s*\|\|?\s*(C\+\+ )?(Placement (Series|Course)( 2022)?|DP Series|Backtracking Day \d+|Day-\d+|10 Days? Recursion Challenge|Catalan Number|DP on Strings|Tries|2D-DP|2D - DP|DP \+ Binary Search|Learn 2-D DP Concept)$/i;

function cleanTitle(rawTitle) {
  let title = rawTitle.replace(/^Lecture\s*\d+\s*:\s*/i, "").replace(/Lecture\s*\d+\s*:\s*/i, "");
  for (let pass = 0; pass < 6; pass += 1) {
    const next = title.replace(/[-|]\s*(Love Babbar|CodeHelp).*$/i, "").replace(NOISE, "").replace(/\s*[|\-]\s*$/, "").trim();
    if (next === title) break;
    title = next;
  }
  return title.trim();
}

const rows = raw.map((item) => {
  const matched = rules.find((rule) => rule.re.test(item.title)) ?? FALLBACK;
  const lecture = Number((item.title.match(/^Lecture\s*(\d+)/i) ?? [])[1] ?? 0);
  const topic = matched.topic;
  if (topic && !topics.includes(topic)) throw new Error(`rule for "${item.title}" names unknown topic ${topic}`);
  for (const name of matched.patterns) if (!patterns.includes(name)) throw new Error(`rule for "${item.title}" names unknown pattern ${name}`);
  return {
    lecture,
    n: item.index,
    title: cleanTitle(item.title) || item.title,
    videoId: item.id,
    runtime: item.runtime,
    seconds: secondsOf(item.runtime),
    kind: matched.kind,
    topic,
    patterns: matched.patterns,
    week: topic ? weekOfTopic[topic] : 0,
    label: matched.label ?? null,
  };
});

const unmapped = rows.filter((row) => row.kind === "series");
const orphan = rows.filter((row) => row.kind === "lecture" && !row.topic);
const table = rows.filter((row) => row.kind === "lecture").map((row) =>
  `${String(row.lecture).padStart(3)} | ${row.runtime.padEnd(7)} | ${(row.topic ?? row.label ?? "-").padEnd(24)} | ${(row.patterns.join(", ") || "-").padEnd(20)} | w${row.week} | ${row.title}`);

console.log(`lectures ${rows.filter((r) => r.kind === "lecture").length} · series items ${unmapped.length} · topic-less ${orphan.length}`);
console.log(`hours ${(rows.filter((r) => r.kind === "lecture").reduce((s, r) => s + r.seconds, 0) / 3600).toFixed(1)}`);
console.log("\nper-topic counts");
for (const topic of topics) {
  const list = rows.filter((row) => row.topic === topic);
  console.log(`  ${topic.padEnd(26)} ${String(list.length).padStart(3)}  ${list.length ? `w${list[0].week}` : "--"}  ${list.reduce((s, r) => s + r.seconds, 0) ? `${(list.reduce((s, r) => s + r.seconds, 0) / 3600).toFixed(1)}h` : ""}`);
}
console.log("\n" + table.join("\n"));
console.log("\nseries items kept out of the topic rail:\n" + unmapped.map((r) => `  ${r.n}. ${r.title} (${r.runtime})`).join("\n"));

const body = rows.map((row) =>
  `  { lecture: ${row.lecture}, order: ${row.n}, title: ${JSON.stringify(row.title)}, videoId: ${JSON.stringify(row.videoId)}, runtime: ${JSON.stringify(row.runtime)}, seconds: ${row.seconds}, kind: ${JSON.stringify(row.kind)}, topic: ${row.topic ? JSON.stringify(row.topic) : "null"}, patternLabel: ${row.label ? JSON.stringify(row.label) : "null"}, patterns: [${row.patterns.map((p) => JSON.stringify(p)).join(", ")}], week: ${row.week} },`);

const file = `// love-babbar-lessons.ts — the CodeHelp / Love Babbar DSA placement series as a
// lesson table, one row per video in the real playlist.
//
// Generated by scripts/build-love-babbar-lessons.mjs — do not hand-edit.
//   source  scripts/data/love-babbar-playlist.json (playlist PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA)
//   verified every videoId resolves through https://www.youtube.com/oembed and the
//   returned title carries the same lecture number (149/149, checked 2026-11-08)
//   re-run the live check with: node scripts/verify-lesson-videos.mjs
//   topic + pattern rules are the ones in that script; week comes from the sheet
//   rows of the same topic, so a lesson lands in the week the sheet teaches it.

import type { SheetTopic } from "./dsaSheet";

export type LessonVideoKind = "lecture" | "series";

export type LessonVideo = {
  /** Number in the series title, 0 for contests and course announcements. */
  lecture: number;
  /** Position in the playlist, so the rail can show the order they were published. */
  order: number;
  title: string;
  videoId: string;
  runtime: string;
  /** Seconds, parsed from the runtime YouTube shows on the thumbnail. */
  seconds: number;
  kind: LessonVideoKind;
  /** Which of the sheet's 12 topics this lecture belongs to. */
  topic: SheetTopic | null;
  /** What a topic-less entry is instead - "C++ basics", "OOPs", "Series update". */
  patternLabel: string | null;
  /** The sheet patterns it actually teaches, empty when the lecture is broader. */
  patterns: string[];
  week: number;
};

export const lessonVideos: LessonVideo[] = [
${body.join("\n")}
];

export const youTubeChannel = "CodeHelp - by Babbar";

export const watchUrl = (videoId: string) => \`https://www.youtube.com/watch?v=\${videoId}\`;
export const embedUrl = (videoId: string) => \`https://www.youtube-nocookie.com/embed/\${videoId}?rel=0&modestbranding=1\`;

/** The numbered lectures, in playlist order - the contests and announcements are
 * series housekeeping, not lessons, so the rail lists only these. */
export const lessonLectures = lessonVideos.filter((video) => video.kind === "lecture");

/** Whole hours of lecture, rounded the way the rail says it out loud. */
export const lessonHours = Math.round(lessonLectures.reduce((total, video) => total + video.seconds, 0) / 3600);
`;

writeFileSync(`${root}src/love-babbar-lessons.ts`, file);
console.log("\nwrote src/love-babbar-lessons.ts");
