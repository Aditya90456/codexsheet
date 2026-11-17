export type TournamentQuestion = {
  id: string;
  title: string;
  category: "DSA" | "CP";
  difficulty: "Easy" | "Medium" | "Hard";
  statement: string;
  input: string;
  output: string;
  constraints: string[];
  examples: { stdin: string; stdout: string }[];
};

export const qualifierQuestions: TournamentQuestion[] = [
  {
    id: "pair-sum",
    title: "Pair Match",
    category: "DSA",
    difficulty: "Easy",
    statement: "Given an integer array and a target, determine whether two different elements add up to the target.",
    input: "The first line contains n and target. The second line contains n integers.",
    output: "Print YES if such a pair exists; otherwise print NO.",
    constraints: ["1 <= n <= 200,000", "-10^9 <= value, target <= 10^9"],
    examples: [{ stdin: "5 9\n2 7 11 15 1", stdout: "YES" }],
  },
  {
    id: "max-run",
    title: "Longest Signal",
    category: "CP",
    difficulty: "Easy",
    statement: "A signal is a sequence of 1s. Find the length of the longest consecutive signal in a binary array.",
    input: "The first line contains n. The second line contains n values, each 0 or 1.",
    output: "Print the maximum number of consecutive 1s.",
    constraints: ["1 <= n <= 200,000"],
    examples: [{ stdin: "8\n1 1 0 1 1 1 0 1", stdout: "3" }],
  },
  {
    id: "balanced-brackets",
    title: "Bracket Check",
    category: "DSA",
    difficulty: "Medium",
    statement: "Given a string of parentheses, determine whether every opening bracket is closed in the correct order.",
    input: "One line containing a string of '(' and ')'.",
    output: "Print YES if the brackets are balanced; otherwise print NO.",
    constraints: ["1 <= string length <= 200,000"],
    examples: [{ stdin: "(()())", stdout: "YES" }],
  },
  {
    id: "ship-capacity",
    title: "Delivery Window",
    category: "CP",
    difficulty: "Medium",
    statement: "Packages must be shipped in their given order within d days. Find the minimum ship capacity that makes this possible.",
    input: "The first line contains n and d. The second line contains n positive package weights.",
    output: "Print the minimum required capacity.",
    constraints: ["1 <= n <= 200,000", "1 <= d <= n", "1 <= weight <= 10^9"],
    examples: [{ stdin: "5 3\n1 2 3 4 5", stdout: "6" }],
  },
  {
    id: "subarray-sum",
    title: "Target Intervals",
    category: "DSA",
    difficulty: "Hard",
    statement: "Count the contiguous subarrays whose elements sum exactly to target. Values may be negative.",
    input: "The first line contains n and target. The second line contains n integers.",
    output: "Print the number of matching subarrays.",
    constraints: ["1 <= n <= 200,000", "-10^9 <= value, target <= 10^9"],
    examples: [{ stdin: "5 3\n1 2 1 -1 3", stdout: "4" }],
  },
];

export const playoffQuestions: TournamentQuestion[] = [
  {
    id: "minimum-jumps",
    title: "Final Stretch",
    category: "DSA",
    difficulty: "Medium",
    statement: "Each array value is the maximum forward jump from that position. Find the fewest jumps needed to reach the last index, or print -1 if it is unreachable.",
    input: "The first line contains n. The second line contains n non-negative integers.",
    output: "Print the minimum number of jumps, or -1.",
    constraints: ["1 <= n <= 200,000", "0 <= value <= 10^9"],
    examples: [{ stdin: "5\n2 3 1 1 4", stdout: "2" }],
  },
  {
    id: "shortest-path",
    title: "Campus Routes",
    category: "CP",
    difficulty: "Hard",
    statement: "Given an undirected, unweighted graph, find the shortest distance from vertex 1 to vertex n.",
    input: "The first line contains n and m. The next m lines each contain two 1-indexed vertices.",
    output: "Print the shortest distance, or -1 if n is unreachable.",
    constraints: ["1 <= n <= 200,000", "0 <= m <= 300,000"],
    examples: [{ stdin: "5 5\n1 2\n1 3\n2 4\n3 4\n4 5", stdout: "3" }],
  },
  {
    id: "climb-count",
    title: "Staircase Count",
    category: "DSA",
    difficulty: "Hard",
    statement: "You can climb 1 or 2 steps at a time. Count the distinct ways to reach step n modulo 1,000,000,007.",
    input: "One integer n.",
    output: "Print the number of distinct ways modulo 1,000,000,007.",
    constraints: ["0 <= n <= 10,000,000"],
    examples: [{ stdin: "5", stdout: "8" }],
  },
  {
    id: "even-sum-count",
    title: "Even Run Rate",
    category: "DSA",
    difficulty: "Hard",
    statement: "Count the contiguous subarrays whose sum is even. Values may be negative.",
    input: "The first line contains n. The second line contains n integers.",
    output: "Print the number of subarrays with an even sum.",
    constraints: ["1 <= n <= 200,000", "-10^9 <= value <= 10^9"],
    examples: [{ stdin: "4\n1 2 3 4", stdout: "4" }],
  },
];

export const playoffStages = [
  { id: "quarterfinal", label: "Quarterfinal", question: playoffQuestions[0] },
  { id: "semifinal", label: "Semifinal", question: playoffQuestions[1] },
  { id: "final", label: "Final", question: playoffQuestions[2] },
] as const;

export function tournamentQuestion(phase: "qualifier" | "playoff", round: number): TournamentQuestion | null {
  return phase === "qualifier"
    ? qualifierQuestions[round - 1] ?? null
    : playoffStages[round - 1]?.question ?? null;
}

export function tournamentStarter(question: TournamentQuestion): string {
  return `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\n// Write your JavaScript solution for: ${question.title}\n`;
}
