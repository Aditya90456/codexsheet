// Regenerates the 250-problem sheet in src/dsaSheet.ts from the NeetCode problem
// index, which is the copy of LeetCode's own title/slug/difficulty table that this
// machine can actually reach (leetcode.com answers 403 from here).
//
//   node scripts/build-dsa-sheet.mjs
//
// Then regenerate the server copy of the sheet:  node scripts/seed-dsa-sheet.mjs
//
// Sheet numbers 1-50 are frozen: dsa_progress keys on problem_number, so a student's
// saved solves must keep pointing at the same problem. They are re-verified against
// the index here rather than trusted.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const INDEX_URL = "https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json";
const MARK_START = "// <generated-sheet>";
const MARK_END = "// </generated-sheet>";

const index = JSON.parse(await (await fetch(INDEX_URL)).text());
const norm = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const byNorm = new Map(index.map((row) => [norm(row.problem), row]));
const find = (title) => byNorm.get(norm(title));

// The 50 canonical problems, in the order the sheet has always shipped them.
const CANONICAL = [
  ["Two Sum", "Arrays & Hashing", "Easy"],
  ["Valid Anagram", "Arrays & Hashing", "Easy"],
  ["Group Anagrams", "Arrays & Hashing", "Medium"],
  ["Top K Frequent Elements", "Arrays & Hashing", "Medium"],
  ["Product of Array Except Self", "Arrays & Hashing", "Medium"],
  ["Valid Palindrome", "Two Pointers", "Easy"],
  ["3Sum", "Two Pointers", "Medium"],
  ["Container With Most Water", "Two Pointers", "Medium"],
  ["Trapping Rain Water", "Two Pointers", "Hard"],
  ["Best Time to Buy and Sell Stock", "Sliding Window", "Easy"],
  ["Longest Substring Without Repeating Characters", "Sliding Window", "Medium"],
  ["Longest Repeating Character Replacement", "Sliding Window", "Medium"],
  ["Minimum Window Substring", "Sliding Window", "Hard"],
  ["Valid Parentheses", "Stack", "Easy"],
  ["Min Stack", "Stack", "Medium"],
  ["Evaluate Reverse Polish Notation", "Stack", "Medium"],
  ["Daily Temperatures", "Monotonic Stack", "Medium"],
  ["Binary Search", "Binary Search", "Easy"],
  ["Search a 2D Matrix", "Binary Search", "Medium"],
  ["Koko Eating Bananas", "Binary Search", "Medium"],
  ["Reverse Linked List", "Linked List", "Easy"],
  ["Merge Two Sorted Lists", "Linked List", "Easy"],
  ["Reorder List", "Linked List", "Medium"],
  ["Remove Nth Node From End of List", "Linked List", "Medium"],
  ["LRU Cache", "Linked List", "Medium"],
  ["Invert Binary Tree", "Trees", "Easy"],
  ["Maximum Depth of Binary Tree", "Trees", "Easy"],
  ["Binary Tree Level Order Traversal", "Trees", "Medium"],
  ["Validate Binary Search Tree", "Trees", "Medium"],
  ["Kth Smallest Element in a BST", "Trees", "Medium"],
  ["Subsets", "Backtracking", "Medium"],
  ["Combination Sum", "Backtracking", "Medium"],
  ["Permutations", "Backtracking", "Medium"],
  ["Word Search", "Backtracking", "Medium"],
  ["N-Queens", "Backtracking", "Hard"],
  ["Number of Islands", "Graphs", "Medium"],
  ["Clone Graph", "Graphs", "Medium"],
  ["Rotting Oranges", "Graphs", "Medium"],
  ["Course Schedule", "Graphs", "Medium"],
  ["Graph Valid Tree", "Graphs", "Medium"],
  ["Climbing Stairs", "1-D DP", "Easy"],
  ["House Robber", "1-D DP", "Medium"],
  ["Coin Change", "1-D DP", "Medium"],
  ["Longest Increasing Subsequence", "1-D DP", "Medium"],
  ["Word Break", "1-D DP", "Medium"],
  ["Unique Paths", "2-D DP", "Medium"],
  ["Longest Common Subsequence", "2-D DP", "Medium"],
  ["Best Time to Buy and Sell Stock with Cooldown", "2-D DP", "Medium"],
  ["Burst Balloons", "2-D DP", "Hard"],
  ["Regular Expression Matching", "2-D DP", "Hard"],
];

// NeetCode's own buckets, renamed to the 16 sheet patterns. Advanced Graphs folds
// into Graphs; Math & Geometry, Tries and the JavaScript list stay out because no
// sheet pattern card teaches them.
const PATTERN_FROM_INDEX = {
  "Arrays & Hashing": "Arrays & Hashing",
  "Two Pointers": "Two Pointers",
  "Sliding Window": "Sliding Window",
  Stack: "Stack",
  "Binary Search": "Binary Search",
  "Linked List": "Linked List",
  Trees: "Trees",
  Backtracking: "Backtracking",
  Graphs: "Graphs",
  "Advanced Graphs": "Graphs",
  "1-D Dynamic Programming": "1-D DP",
  "2-D Dynamic Programming": "2-D DP",
  Greedy: "Greedy",
  Intervals: "Intervals",
  "Heap / Priority Queue": "Heaps",
  "Bit Manipulation": "Bit Manipulation",
};

// NeetCode files these under Stack; they are the monotonic-stack teaching set.
const MONOTONIC = [
  "Daily Temperatures",
  "Online Stock Span",
  "Car Fleet",
  "Largest Rectangle in Histogram",
  "Maximum Frequency Stack",
  "Remove K Digits",
  "132 Pattern",
  "Sliding Window Maximum",
];

// Problems per sheet pattern, sized to what the index really holds and to how often
// the pattern shows up in an interview round. Sum is exactly 250.
const QUOTA = {
  "Arrays & Hashing": 25,
  "Two Pointers": 16,
  "Sliding Window": 13,
  Stack: 11,
  "Monotonic Stack": 8,
  "Binary Search": 16,
  "Linked List": 18,
  Trees: 24,
  Graphs: 22,
  Backtracking: 16,
  "1-D DP": 20,
  "2-D DP": 16,
  Heaps: 15,
  Intervals: 8,
  Greedy: 14,
  "Bit Manipulation": 8,
};

// Sheet blocks run in the order the 12-week plan teaches them.
const ORDER = [
  "Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack", "Monotonic Stack",
  "Binary Search", "Linked List", "Trees", "Graphs", "Backtracking",
  "Heaps", "Intervals", "1-D DP", "2-D DP", "Greedy", "Bit Manipulation",
];

const patternSheet = (row) => (MONOTONIC.includes(normTitle(row.problem)) ? "Monotonic Stack" : PATTERN_FROM_INDEX[row.pattern]);
const normTitle = (title) =>
  title
    .split(" ")
    .map((word) => (["and", "in", "of", "to", "the", "a", "an", "ii", "i"].includes(word.toLowerCase()) ? word.toLowerCase() : word))
    .join(" ")
    .replace(/\bi+\b/, (m) => m)
    .replace(/Ii\b/, "II").replace(/\bN Queens/, "N-Queens");

const tierOf = (row) => (row.blind75 ? 1 : row.neetcode150 ? 2 : 3);
const slugOf = (row) => row.link.replace(/\/$/, "");
const DIFFICULTY_RANK = { Easy: 0, Medium: 1, Hard: 2 };

const chosen = [];
const seen = new Set();
const problems = [];

for (const [index, [title, pattern, difficulty]] of CANONICAL.entries()) {
  const number = index + 1;
  const row = find(title);
  if (!row) throw new Error(`Canonical problem not in the index: ${title}`);
  const indexPattern = patternSheet(row);
  const drift = [];
  if (indexPattern !== pattern) drift.push(`pattern is ${indexPattern}`);
  if (row.difficulty !== difficulty) drift.push(`difficulty is ${row.difficulty}`);
  if (drift.length) console.log(`  ! #${number} ${title}: ${drift.join(", ")}`);
  seen.add(norm(row.problem));
  problems.push({ row, pattern, difficulty: row.difficulty === difficulty ? difficulty : row.difficulty, tier: tierOf(row), number });
}

const pool = (pattern) =>
  index
    .filter((row) => patternSheet(row) === pattern && !seen.has(norm(row.problem)))
    .sort((a, b) => tierOf(a) - tierOf(b) || DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] || a.problem.localeCompare(b.problem));

for (const pattern of ORDER) {
  const want = QUOTA[pattern] - problems.filter((item) => item.pattern === pattern).length;
  if (want < 0) throw new Error(`${pattern} has ${-want} more canonical problems than its quota`);
  const picked = pool(pattern).slice(0, want);
  if (picked.length !== want) throw new Error(`${pattern}: only ${picked.length} of ${want} available in the index`);
  for (const row of picked) {
    seen.add(norm(row.problem));
    chosen.push(row);
  }
}

// Numbers 51+ run in the teaching order, must-know first inside each block. The
// frozen rows keep 1-50 and are never re-sorted into the new range.
const teaching = (a, b) =>
  ORDER.indexOf(a.pattern) - ORDER.indexOf(b.pattern) ||
  a.tier - b.tier ||
  DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] ||
  a.row.problem.localeCompare(b.row.problem);
const filler = chosen
  .map((row) => ({ row, pattern: patternSheet(row), difficulty: row.difficulty, tier: tierOf(row) }))
  .sort(teaching)
  .map((item, i) => ({ ...item, number: problems.length + i + 1 }));
problems.push(...filler);
problems.sort((a, b) => a.number - b.number);

if (problems.length !== 250) throw new Error(`built ${problems.length} problems, expected 250`);
const numbers = new Set(problems.map((item) => item.number));
if (numbers.size !== 250 || Math.min(...numbers) !== 1 || Math.max(...numbers) !== 250) throw new Error("problem numbers are not exactly 1..250");
for (let i = 0; i < problems.length; i += 1) if (problems[i].number !== i + 1) throw new Error(`row ${i + 1} carries number ${problems[i].number}`);
if (problems.some((item, i) => i < 50 && norm(item.row.problem) !== norm(CANONICAL[i][0]))) throw new Error("the frozen first 50 moved");

const quote = (value) => `"${String(value).replace(/"/g, '\\"')}"`;
const premiumRows = index.filter((row) => row.premium);
const isPremium = (row) => !!row.premium;
// A premium problem is still worth solving, so the sheet keeps it and points at the
// free mirror in the same index (LintCode runs the same question) when there is one.
const freeLinkBySlug = {};
for (const row of premiumRows) if (row.freeLink) freeLinkBySlug[slugOf(row)] = row.freeLink;
const block = [
  `${MARK_START}`,
  `// Every row below is [title, leetcode slug, pattern, difficulty, tier, needs paid plan]`,
  `// and was read straight out of the NeetCode index by scripts/build-dsa-sheet.mjs -`,
  `// never typed by hand. Tier 1 is the Blind 75 list, tier 2 the NeetCode 150, tier 3`,
  `// everything else. Numbers 1-50 are frozen; the rest are ordered by pattern block,`,
  `// must-know first.`,
  `const freeMirrorBySlug: Record<string, string> = {`,
  ...Object.entries(freeLinkBySlug).map(([slug, link]) => `  ${quote(slug)}: ${quote(link)},`),
  `};`,
  `const sheetTable: Array<[string, string, string, Problem["difficulty"], InterviewTier, boolean]> = [`,
  ...problems.map((item) => `  [${quote(item.row.problem)}, ${quote(slugOf(item.row))}, ${quote(item.pattern)}, ${quote(item.difficulty)}, ${item.tier}, ${isPremium(item.row)}],`),
  `];`,
  `${MARK_END}`,
].join("\n");

const file = path.join(repo, "src", "dsaSheet.ts");
const source = fs.readFileSync(file, "utf8");
const start = source.indexOf(MARK_START);
const end = source.indexOf(MARK_END) + MARK_END.length;
if (start < 0 || end < MARK_END.length) throw new Error("src/dsaSheet.ts is missing the generated-sheet markers");
fs.writeFileSync(file, `${source.slice(0, start)}${block}${source.slice(end)}`, "utf8");

const tally = (key) => Object.entries(problems.reduce((map, item) => ({ ...map, [item[key]]: (map[item[key]] ?? 0) + 1 }), {}))
  .sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]))
  .map(([name, count]) => `${name} ${count}`);
console.log(`\n${problems.length} problems · ${new Set(problems.map((item) => norm(item.row.problem))).size} unique titles`);
console.log(`by pattern: ${tally("pattern").join(" | ")}`);
const byTier = [1, 2, 3].map((tier) => `tier ${tier}: ${problems.filter((item) => item.tier === tier).length}`);
console.log(`${byTier.join(" | ")} · ${problems.filter((item) => item.difficulty === "Easy").length} Easy / ${problems.filter((item) => item.difficulty === "Medium").length} Medium / ${problems.filter((item) => item.difficulty === "Hard").length} Hard`);
console.log(`premium problems kept: ${problems.filter((item) => item.row.premium).length}, of which ${problems.filter((item) => item.row.premium && item.row.freeLink).length} have a free mirror`);
