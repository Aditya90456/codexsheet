// dsaSheet.ts — the 250-problem sheet and the rewards it pays out, in one place.
// The database seeds its copy of these problems from this module, so a leaderboard
// rank cannot disagree with what the student sees in the sheet.

export type Problem = {
  number: number;
  title: string;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
};

export const seeds: Array<[string, string, Problem["difficulty"]]> = [
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
  [
    "Longest Substring Without Repeating Characters",
    "Sliding Window",
    "Medium",
  ],
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
export const patterns = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Monotonic Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Backtracking",
  "Graphs",
  "1-D DP",
  "2-D DP",
  "Greedy",
  "Intervals",
  "Heaps",
  "Bit Manipulation",
];
export const problems: Problem[] = Array.from({ length: 250 }, (_, index) => {
  const seed = seeds[index % seeds.length];
  const cycle = Math.floor(index / seeds.length);
  return {
    number: index + 1,
    title: cycle === 0 ? seed[0] : `${seed[0]} · Pattern ${cycle + 1}`,
    pattern:
      cycle === 0 ? seed[1] : patterns[(index + cycle) % patterns.length],
    difficulty: seed[2],
    link: `https://leetcode.com/problems/${seed[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}/description/?search=${encodeURIComponent(seed[0])}`,
  };
});

// Everything a student types or solves in the sheet pays out in XP, so the
// streak, the rank and the toast all read from the same progress map.
export const sheetXp: Record<Problem["difficulty"], number> = { Easy: 10, Medium: 20, Hard: 35 };
export const problemByNumber = new Map(problems.map((item) => [item.number, item]));

export const sheetRanks: Array<{ at: number; title: string }> = [
  { at: 0, title: "Warming up" },
  { at: 100, title: "Pattern spotter" },
  { at: 300, title: "Recursion runner" },
  { at: 600, title: "Dynamic programmer" },
  { at: 1000, title: "Complexity slayer" },
  { at: 1600, title: "Interview ready" },
  { at: 2400, title: "Sheet legend" },
];

export function sheetXpTotal(map: Record<number, { status: string }>) {
  let xp = 0;
  for (const [number, entry] of Object.entries(map)) {
    if (entry.status !== "Solved") continue;
    const problem = problemByNumber.get(Number(number));
    xp += problem ? sheetXp[problem.difficulty] : 10;
  }
  return xp;
}

export function getSheetRank(xp: number) {
  let index = 0;
  for (let i = 0; i < sheetRanks.length; i += 1) if (xp >= sheetRanks[i].at) index = i;
  const tier = sheetRanks[index];
  const next = sheetRanks[index + 1] ?? null;
  return {
    title: tier.title,
    level: index + 1,
    xp,
    toNext: next ? next.at - xp : 0,
    percent: next ? Math.round(((xp - tier.at) / (next.at - tier.at)) * 100) : 100,
  };
}

export const solveMilestones: Record<number, string> = {
  1: "First problem solved. Every strong candidate starts exactly here.",
  10: "10 solved - the patterns are starting to repeat for you.",
  25: "25 solved. That is enough range to talk confidently in a real round.",
  50: "50 solved. Half the sheet, and the habits are forming.",
  100: "100 solved. You now out-practice most applicants you will be ranked against.",
  150: "150 solved. The hard ones are yours to pick from.",
  200: "200 solved. Fifty left and the sheet is finished.",
  250: "250 solved. Whole sheet done. Nothing left to hide behind.",
};
