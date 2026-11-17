"""Server-only stdin/stdout fixtures for CodexSheet tournament judging."""

from __future__ import annotations

AI_TOURNAMENT_PROBLEMS = {
    "pair-sum": "Given an integer array and a target, determine whether two different elements add up to the target. Input: n and target, then n integers. Print YES or NO.",
    "max-run": "Given a binary array, print the maximum number of consecutive 1s. Input: n, then n values.",
    "balanced-brackets": "Given a string of '(' and ')', determine whether the brackets are balanced. Print YES or NO.",
    "ship-capacity": "Packages must be shipped in their given order within d days. Find the minimum capacity. Input: n and d, then n positive weights.",
    "subarray-sum": "Count contiguous subarrays whose elements sum exactly to target; values may be negative. Input: n and target, then n integers.",
    "minimum-jumps": "Each array value is the maximum forward jump from that position. Find the fewest jumps to the last index, or print -1 if unreachable. Input: n, then n non-negative integers.",
    "shortest-path": "Given an undirected, unweighted graph, find the shortest distance from vertex 1 to vertex n. Input: n and m, then m edges.",
    "climb-count": "You can climb 1 or 2 steps at a time. Count the distinct ways to reach step n modulo 1,000,000,007. Input: one integer n.",
    "even-sum-count": "Count the contiguous subarrays whose sum is even. Input: n, then n integers. Print the count.",
}

AI_TOURNAMENT_REFERENCE_SOLUTIONS = {
    "pair-sum": (
        """const fs = require("fs");
const values = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
const n = values[0];
const target = values[1];
const seen = new Set();
let found = false;
for (let i = 0; i < n; i++) {
  const value = values[i + 2];
  if (seen.has(target - value)) {
    found = true;
    break;
  }
  seen.add(value);
}
console.log(found ? "YES" : "NO");""",
        "Approach: Track prior values in a set and check for the complement.\\n"
        "Time complexity: O(n).\\n"
        "Space complexity: O(n).",
    ),
    "max-run": (
        """const fs = require("fs");
const values = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
const n = values[0];
let current = 0;
let longest = 0;
for (let i = 1; i <= n; i++) {
  current = values[i] === 1 ? current + 1 : 0;
  longest = Math.max(longest, current);
}
console.log(longest);""",
        "Approach: Count each run of ones and keep the longest.\\n"
        "Time complexity: O(n).\\n"
        "Space complexity: O(1).",
    ),
    "balanced-brackets": (
        """const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim();
let balance = 0;
let valid = true;
for (const bracket of input) {
  balance += bracket === "(" ? 1 : -1;
  if (balance < 0) {
    valid = false;
    break;
  }
}
console.log(valid && balance === 0 ? "YES" : "NO");""",
        "Approach: Track the open-bracket balance and reject any negative prefix.\\n"
        "Time complexity: O(n).\\n"
        "Space complexity: O(1).",
    ),
    "ship-capacity": (
        """const fs = require("fs");
const values = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
const n = values[0];
const days = values[1];
const weights = values.slice(2, n + 2);
let low = 0;
let high = 0;
for (const weight of weights) {
  low = Math.max(low, weight);
  high += weight;
}
while (low < high) {
  const capacity = Math.floor((low + high) / 2);
  let usedDays = 1;
  let load = 0;
  for (const weight of weights) {
    if (load + weight > capacity) {
      usedDays++;
      load = 0;
    }
    load += weight;
  }
  if (usedDays <= days) high = capacity;
  else low = capacity + 1;
}
console.log(low);""",
        "Approach: Binary-search capacity and greedily count the days it needs.\\n"
        "Time complexity: O(n log(sum of weights)).\\n"
        "Space complexity: O(n).",
    ),
    "subarray-sum": (
        """const fs = require("fs");
const values = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
const n = values[0];
const target = values[1];
const frequency = new Map([[0, 1]]);
let prefix = 0;
let count = 0;
for (let i = 0; i < n; i++) {
  prefix += values[i + 2];
  count += frequency.get(prefix - target) || 0;
  frequency.set(prefix, (frequency.get(prefix) || 0) + 1);
}
console.log(count);""",
        "Approach: Count earlier prefix sums that differ by the target.\\n"
        "Time complexity: O(n).\\n"
        "Space complexity: O(n).",
    ),
    "minimum-jumps": (
        """const fs = require("fs");
const values = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
const n = values[0];
if (n <= 1) {
  console.log(0);
} else {
  let jumps = 0;
  let currentEnd = 0;
  let farthest = 0;
  let reachable = true;
  for (let i = 0; i < n - 1; i++) {
    farthest = Math.max(farthest, i + values[i + 1]);
    if (i === currentEnd) {
      if (farthest <= i) {
        reachable = false;
        break;
      }
      jumps++;
      currentEnd = farthest;
      if (currentEnd >= n - 1) break;
    }
  }
  console.log(reachable ? jumps : -1);
}""",
        "Approach: Expand each greedy jump range to the farthest reachable index.\\n"
        "Time complexity: O(n).\\n"
        "Space complexity: O(1).",
    ),
    "shortest-path": (
        """const fs = require("fs");
const values = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
const n = values[0];
const m = values[1];
const graph = Array.from({ length: n }, () => []);
for (let i = 0; i < m; i++) {
  const a = values[2 + 2 * i] - 1;
  const b = values[3 + 2 * i] - 1;
  graph[a].push(b);
  graph[b].push(a);
}
const distance = new Int32Array(n);
distance.fill(-1);
const queue = new Int32Array(n);
let head = 0;
let tail = 0;
distance[0] = 0;
queue[tail++] = 0;
while (head < tail && distance[n - 1] === -1) {
  const node = queue[head++];
  for (const next of graph[node]) {
    if (distance[next] === -1) {
      distance[next] = distance[node] + 1;
      queue[tail++] = next;
    }
  }
}
console.log(distance[n - 1]);""",
        "Approach: Run breadth-first search from vertex one.\\n"
        "Time complexity: O(n + m).\\n"
        "Space complexity: O(n + m).",
    ),
    "climb-count": (
        """const fs = require("fs");
const n = Number(fs.readFileSync(0, "utf8").trim());
const mod = 1000000007;
let previous = 1;
let current = 1;
for (let step = 2; step <= n; step++) {
  const next = (previous + current) % mod;
  previous = current;
  current = next;
}
console.log(n === 0 ? 1 : current);""",
        "Approach: Build the stair counts iteratively from the two previous counts.\\n"
        "Time complexity: O(n).\\n"
        "Space complexity: O(1).",
    ),
    "even-sum-count": (
        """const fs = require("fs");
const values = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
const n = values[0];
let parity = 0;
let evenPrefixes = 1;
let oddPrefixes = 0;
let count = 0;
for (let i = 1; i <= n; i++) {
  parity ^= Math.abs(values[i] % 2);
  if (parity === 0) {
    count += evenPrefixes++;
  } else {
    count += oddPrefixes++;
  }
}
console.log(count);""",
        "Approach: Count earlier prefixes with the same sum parity.\\n"
        "Time complexity: O(n).\\n"
        "Space complexity: O(1).",
    ),
}

QUALIFIER_CASES = {
    "pair-sum": [
        ("5 9\n2 7 11 15 1\n", "YES"),
        ("4 3\n1 2 4 8\n", "YES"),
        ("3 10\n1 2 3\n", "NO"),
        ("6 0\n-4 4 9 2 -2 1\n", "YES"),
    ],
    "max-run": [
        ("8\n1 1 0 1 1 1 0 1\n", "3"),
        ("5\n0 0 0 0 0\n", "0"),
        ("4\n1 1 1 1\n", "4"),
        ("7\n1 0 1 1 0 1 1\n", "2"),
    ],
    "balanced-brackets": [
        ("(()())\n", "YES"),
        (")(\n", "NO"),
        ("((()))()\n", "YES"),
        ("(()\n", "NO"),
    ],
    "ship-capacity": [
        ("5 3\n1 2 3 4 5\n", "6"),
        ("3 3\n3 2 2\n", "3"),
        ("4 1\n1 2 3 4\n", "10"),
        ("6 2\n7 2 5 10 8 1\n", "19"),
    ],
    "subarray-sum": [
        ("5 3\n1 2 1 -1 3\n", "5"),
        ("5 0\n0 0 0 0 0\n", "15"),
        ("5 7\n1 2 3 4 5\n", "1"),
        ("4 -1\n-1 0 -1 1\n", "5"),
    ],
}

PLAYOFF_CASES = {
    "minimum-jumps": [
        ("5\n2 3 1 1 4\n", "2"),
        ("5\n3 2 1 0 4\n", "-1"),
        ("1\n0\n", "0"),
        ("6\n1 2 0 3 0 1\n", "3"),
    ],
    "shortest-path": [
        ("5 5\n1 2\n1 3\n2 4\n3 4\n4 5\n", "3"),
        ("4 2\n1 2\n3 4\n", "-1"),
        ("1 0\n", "0"),
        ("6 6\n1 2\n2 3\n3 4\n4 5\n5 6\n1 6\n", "1"),
    ],
    "climb-count": [
        ("5\n", "8"),
        ("0\n", "1"),
        ("1\n", "1"),
        ("10\n", "89"),
    ],
    "even-sum-count": [
        ("4\n1 2 3 4\n", "4"),
        ("2\n2 4\n", "3"),
        ("3\n1 1 1\n", "2"),
        ("3\n-1 3 2\n", "3"),
    ],
}
