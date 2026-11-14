import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  ChevronRight,
  Code2,
  Flame,
  LoaderCircle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import "./human-vs-ai.css";

type TestCase = { args: unknown[]; expected: unknown };
type InterviewCompany = "Amazon" | "Google" | "Meta" | "Apple" | "Netflix" | "Nvidia";
type Challenge = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  pattern: string;
  companies: InterviewCompany[];
  leetcodeUrl: string;
  prompt: string;
  fn: string;
  starter: string;
  solution: string;
  cases: TestCase[];
};
type TestStatus = "Accepted" | "Wrong Answer" | "Compile Error" | "Runtime Error" | "TLE" | "Runner Error";
type TestResult = { passed: number; total: number; details: string[]; status: TestStatus; runtimeMs?: number; error?: string };
type RoundStatus = "ready" | "running" | "human-won" | "ai-won" | "tie";
type GameStats = { level: number; wins: number; losses: number; streak: number; xp: number };
type AiState = "idle" | "thinking" | "ready" | "error";
type JudgeState = "idle" | "thinking" | "error" | "done";
type JudgeScore = { correctness: number; efficiency: number; readability: number; maintainability: number; feedback: string };
type AiJudgement = { human: JudgeScore; byte: JudgeScore; summary: string };

const storageKey = "codexsheet-human-vs-ai-v1";
const emptyStats: GameStats = { level: 1, wins: 0, losses: 0, streak: 0, xp: 0 };
const companyTagSource = "https://github.com/snehasishroy/leetcode-companywise-interview-questions";
const javascriptHighlighting = syntaxHighlighting(HighlightStyle.define([
  { tag: tags.keyword, color: "#d68bd0" },
  { tag: tags.function(tags.variableName), color: "#7dcfff" },
  { tag: tags.definition(tags.variableName), color: "#f2c578" },
  { tag: tags.variableName, color: "#e6d9eb" },
  { tag: tags.propertyName, color: "#e7b77d" },
  { tag: [tags.string, tags.special(tags.string)], color: "#a6da95" },
  { tag: [tags.number, tags.bool, tags.null], color: "#fab387" },
  { tag: tags.comment, color: "#817788", fontStyle: "italic" },
  { tag: tags.operator, color: "#d6a0dd" },
  { tag: tags.typeName, color: "#9bd5b0" },
]));
const challenges: Challenge[] = [
  {
    id: "palindrome",
    title: "Palindrome check",
    difficulty: "Easy",
    pattern: "Two pointers",
    companies: ["Amazon", "Google", "Meta", "Apple"],
    leetcodeUrl: "https://leetcode.com/problems/valid-palindrome/",
    prompt: "Return true if text reads the same forward and backward. Ignore spaces, punctuation, and letter case.",
    fn: "isPalindrome",
    starter: `function isPalindrome(text) {
  // Normalize the text, then compare it with its reverse.
  return false;
}`,
    solution: `function isPalindrome(text) {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === [...clean].reverse().join("");
}`,
    cases: [
      { args: ["racecar"], expected: true },
      { args: ["A man, a plan, a canal: Panama"], expected: true },
      { args: ["CodexSheet"], expected: false },
      { args: [""], expected: true },
    ],
  },
  {
    id: "two-sum",
    title: "Two sum",
    difficulty: "Easy",
    pattern: "Hash map",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/two-sum/",
    prompt: "Return the indices of the two numbers that add up to target. You can assume exactly one answer exists.",
    fn: "twoSum",
    starter: `function twoSum(nums, target) {
  // Return the two matching indices.
  return [];
}`,
    solution: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i += 1) {
    const match = target - nums[i];
    if (seen.has(match)) return [seen.get(match), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    cases: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
    ],
  },
  {
    id: "reverse-string",
    title: "Reverse a string",
    difficulty: "Easy",
    pattern: "Strings",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/reverse-string/",
    prompt: "Return a new string with the characters in reverse order.",
    fn: "reverseString",
    starter: `function reverseString(text) {
  // Return the characters in reverse order.
  return text;
}`,
    solution: `function reverseString(text) {
  return [...text].reverse().join("");
}`,
    cases: [
      { args: ["hello"], expected: "olleh" },
      { args: ["CodexSheet"], expected: "teeShxedoC" },
      { args: [""], expected: "" },
    ],
  },
  {
    id: "contains-duplicate",
    title: "Contains duplicate",
    difficulty: "Easy",
    pattern: "Hash set",
    companies: ["Amazon", "Google", "Meta", "Apple", "Netflix", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/contains-duplicate/",
    prompt: "Return true if any value appears more than once in the array.",
    fn: "containsDuplicate",
    starter: `function containsDuplicate(nums) {
  // Check whether a value has already appeared.
  return false;
}`,
    solution: `function containsDuplicate(nums) {
  return new Set(nums).size !== nums.length;
}`,
    cases: [
      { args: [[1, 2, 3, 1]], expected: true },
      { args: [[1, 2, 3, 4]], expected: false },
      { args: [[]], expected: false },
    ],
  },
  {
    id: "valid-anagram",
    title: "Valid anagram",
    difficulty: "Easy",
    pattern: "Strings",
    companies: ["Amazon", "Google", "Meta", "Apple", "Netflix", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/valid-anagram/",
    prompt: "Return true if the two lowercase words contain the same letters with the same frequencies.",
    fn: "isAnagram",
    starter: `function isAnagram(first, second) {
  // Compare the letters in both words.
  return false;
}`,
    solution: `function isAnagram(first, second) {
  if (first.length !== second.length) return false;
  return [...first].sort().join("") === [...second].sort().join("");
}`,
    cases: [
      { args: ["listen", "silent"], expected: true },
      { args: ["rat", "car"], expected: false },
      { args: ["aacc", "ccac"], expected: false },
    ],
  },
  {
    id: "max-subarray",
    title: "Maximum subarray",
    difficulty: "Medium",
    pattern: "Dynamic programming",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/maximum-subarray/",
    prompt: "Find the largest possible sum of a non-empty, contiguous slice of the array.",
    fn: "maxSubArray",
    starter: `function maxSubArray(nums) {
  // Track the best slice ending at each position.
  return 0;
}`,
    solution: `function maxSubArray(nums) {
  let current = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}`,
    cases: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1 },
      { args: [[-5, -2, -7]], expected: -2 },
    ],
  },
  {
    id: "longest-substring",
    title: "Longest substring",
    difficulty: "Medium",
    pattern: "Sliding window",
    companies: ["Amazon", "Google", "Meta", "Apple", "Netflix", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    prompt: "Return the length of the longest substring with no repeated characters.",
    fn: "lengthOfLongestSubstring",
    starter: `function lengthOfLongestSubstring(text) {
  // Slide a window while tracking the last position of each character.
  return 0;
}`,
    solution: `function lengthOfLongestSubstring(text) {
  const lastSeen = new Map();
  let start = 0;
  let best = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (lastSeen.has(text[i]) && lastSeen.get(text[i]) >= start) {
      start = lastSeen.get(text[i]) + 1;
    }
    lastSeen.set(text[i], i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}`,
    cases: [
      { args: ["abcabcbb"], expected: 3 },
      { args: ["bbbbb"], expected: 1 },
      { args: ["pwwkew"], expected: 3 },
      { args: [""], expected: 0 },
    ],
  },
  {
    id: "valid-parentheses",
    title: "Valid parentheses",
    difficulty: "Easy",
    pattern: "Stack",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/valid-parentheses/",
    prompt: "Check whether every opening bracket is closed in the correct order.",
    fn: "isValid",
    starter: `function isValid(text) {
  // Keep track of opening brackets as you scan.
  return false;
}`,
    solution: `function isValid(text) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const char of text) {
    if (char === "(" || char === "[" || char === "{") stack.push(char);
    else if (stack.pop() !== pairs[char]) return false;
  }
  return stack.length === 0;
}`,
    cases: [
      { args: ["()"], expected: true },
      { args: ["()[]{}"], expected: true },
      { args: ["(]"], expected: false },
      { args: ["([{}])"], expected: true },
    ],
  },
  {
    id: "longest-common-prefix",
    title: "Longest common prefix",
    difficulty: "Easy",
    pattern: "Strings",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/longest-common-prefix/",
    prompt: "Find the longest prefix shared by every string in the array.",
    fn: "longestCommonPrefix",
    starter: `function longestCommonPrefix(words) {
  // Compare each word against the first one.
  return "";
}`,
    solution: `function longestCommonPrefix(words) {
  if (!words.length) return "";
  let prefix = words[0];
  for (const word of words.slice(1)) {
    while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1);
    if (!prefix) return "";
  }
  return prefix;
}`,
    cases: [
      { args: [["flower", "flow", "flight"]], expected: "fl" },
      { args: [["dog", "racecar", "car"]], expected: "" },
      { args: [["alone"]], expected: "alone" },
    ],
  },
  {
    id: "best-time-stock",
    title: "Best time to buy and sell",
    difficulty: "Easy",
    pattern: "Greedy",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    prompt: "Choose one day to buy and a later day to sell for the maximum profit. Return 0 if no profit is possible.",
    fn: "maxProfit",
    starter: `function maxProfit(prices) {
  // Track the lowest price seen so far.
  return 0;
}`,
    solution: `function maxProfit(prices) {
  let lowest = Infinity;
  let profit = 0;
  for (const price of prices) {
    lowest = Math.min(lowest, price);
    profit = Math.max(profit, price - lowest);
  }
  return profit;
}`,
    cases: [
      { args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { args: [[7, 6, 4, 3, 1]], expected: 0 },
      { args: [[2, 4, 1]], expected: 2 },
    ],
  },
  {
    id: "climbing-stairs",
    title: "Climbing stairs",
    difficulty: "Easy",
    pattern: "Dynamic programming",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/climbing-stairs/",
    prompt: "Count the distinct ways to reach step n when each move climbs either one or two steps.",
    fn: "climbStairs",
    starter: `function climbStairs(n) {
  // Build the answer from the two previous steps.
  return n;
}`,
    solution: `function climbStairs(n) {
  let oneStepBefore = 1;
  let twoStepsBefore = 1;
  for (let step = 2; step <= n; step += 1) {
    [oneStepBefore, twoStepsBefore] = [oneStepBefore + twoStepsBefore, oneStepBefore];
  }
  return oneStepBefore;
}`,
    cases: [
      { args: [1], expected: 1 },
      { args: [2], expected: 2 },
      { args: [5], expected: 8 },
      { args: [10], expected: 89 },
    ],
  },
  {
    id: "three-sum",
    title: "3Sum",
    difficulty: "Medium",
    pattern: "Two pointers",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/3sum/",
    prompt: "Return each unique triplet of values that adds up to zero.",
    fn: "threeSum",
    starter: `function threeSum(nums) {
  // Sort once, then search with two pointers.
  return [];
}`,
    solution: `function threeSum(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length - 2; i += 1) {
    if (i && sorted[i] === sorted[i - 1]) continue;
    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[i] + sorted[left] + sorted[right];
      if (sum === 0) {
        result.push([sorted[i], sorted[left], sorted[right]]);
        left += 1;
        right -= 1;
        while (left < right && sorted[left] === sorted[left - 1]) left += 1;
        while (left < right && sorted[right] === sorted[right + 1]) right -= 1;
      } else if (sum < 0) left += 1;
      else right -= 1;
    }
  }
  return result;
}`,
    cases: [
      { args: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]] },
      { args: [[0, 0, 0]], expected: [[0, 0, 0]] },
      { args: [[]], expected: [] },
    ],
  },
  {
    id: "container-water",
    title: "Container with most water",
    difficulty: "Medium",
    pattern: "Two pointers",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/",
    prompt: "Choose two vertical lines that hold the most water between them.",
    fn: "maxArea",
    starter: `function maxArea(heights) {
  // Move the pointer at the shorter line inward.
  return 0;
}`,
    solution: `function maxArea(heights) {
  let left = 0;
  let right = heights.length - 1;
  let best = 0;
  while (left < right) {
    best = Math.max(best, Math.min(heights[left], heights[right]) * (right - left));
    if (heights[left] < heights[right]) left += 1;
    else right -= 1;
  }
  return best;
}`,
    cases: [
      { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
      { args: [[1, 1]], expected: 1 },
      { args: [[1, 2, 4, 3]], expected: 4 },
    ],
  },
  {
    id: "search-rotated",
    title: "Search rotated array",
    difficulty: "Medium",
    pattern: "Binary search",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    prompt: "Find target in a rotated, sorted array in O(log n). Return -1 when it is absent.",
    fn: "search",
    starter: `function search(nums, target) {
  // Keep the half that is still sorted.
  return -1;
}`,
    solution: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    if (nums[middle] === target) return middle;
    if (nums[left] <= nums[middle]) {
      if (nums[left] <= target && target < nums[middle]) right = middle - 1;
      else left = middle + 1;
    } else {
      if (nums[middle] < target && target <= nums[right]) left = middle + 1;
      else right = middle - 1;
    }
  }
  return -1;
}`,
    cases: [
      { args: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4 },
      { args: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1 },
      { args: [[1], 0], expected: -1 },
    ],
  },
  {
    id: "merge-intervals",
    title: "Merge intervals",
    difficulty: "Medium",
    pattern: "Sorting",
    companies: ["Amazon", "Google", "Meta", "Apple", "Netflix", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/merge-intervals/",
    prompt: "Merge every overlapping interval and return the remaining disjoint intervals.",
    fn: "merge",
    starter: `function merge(intervals) {
  // Sort by start, then extend the current interval when needed.
  return [];
}`,
    solution: `function merge(intervals) {
  const sorted = intervals.map(([start, end]) => [start, end]).sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (!last || interval[0] > last[1]) merged.push(interval);
    else last[1] = Math.max(last[1], interval[1]);
  }
  return merged;
}`,
    cases: [
      { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { args: [[]], expected: [] },
    ],
  },
  {
    id: "single-number",
    title: "Single number",
    difficulty: "Easy",
    pattern: "Bit manipulation",
    companies: ["Amazon", "Google", "Meta"],
    leetcodeUrl: "https://leetcode.com/problems/single-number/",
    prompt: "Every value appears twice except one. Find that single value in linear time and constant space.",
    fn: "singleNumber",
    starter: `function singleNumber(nums) {
  // XOR cancels each matching pair.
  return 0;
}`,
    solution: `function singleNumber(nums) {
  return nums.reduce((answer, value) => answer ^ value, 0);
}`,
    cases: [
      { args: [[2, 2, 1]], expected: 1 },
      { args: [[4, 1, 2, 1, 2]], expected: 4 },
      { args: [[-1, -1, -2]], expected: -2 },
    ],
  },
  {
    id: "missing-number",
    title: "Missing number",
    difficulty: "Easy",
    pattern: "Math",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/missing-number/",
    prompt: "Find the missing value from the distinct numbers in the range [0, n].",
    fn: "missingNumber",
    starter: `function missingNumber(nums) {
  // Compare the expected sum with the actual sum.
  return 0;
}`,
    solution: `function missingNumber(nums) {
  const n = nums.length;
  return (n * (n + 1)) / 2 - nums.reduce((sum, value) => sum + value, 0);
}`,
    cases: [
      { args: [[3, 0, 1]], expected: 2 },
      { args: [[0, 1]], expected: 2 },
      { args: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], expected: 8 },
    ],
  },
  {
    id: "trapping-rain-water",
    title: "Trapping rain water",
    difficulty: "Hard",
    pattern: "Two pointers",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water/",
    prompt: "Given bar heights, compute how much rain water can be trapped between them.",
    fn: "trap",
    starter: `function trap(heights) {
  // Track the highest boundary seen from each side.
  return 0;
}`,
    solution: `function trap(heights) {
  let left = 0;
  let right = heights.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (left < right) {
    if (heights[left] <= heights[right]) {
      leftMax = Math.max(leftMax, heights[left]);
      water += leftMax - heights[left++];
    } else {
      rightMax = Math.max(rightMax, heights[right]);
      water += rightMax - heights[right--];
    }
  }
  return water;
}`,
    cases: [
      { args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
      { args: [[4, 2, 0, 3, 2, 5]], expected: 9 },
      { args: [[]], expected: 0 },
    ],
  },
  {
    id: "sliding-window-maximum",
    title: "Sliding window maximum",
    difficulty: "Hard",
    pattern: "Sliding window",
    companies: ["Amazon", "Google", "Meta", "Apple", "Netflix"],
    leetcodeUrl: "https://leetcode.com/problems/sliding-window-maximum/",
    prompt: "Return the maximum value in each contiguous window of size k.",
    fn: "maxSlidingWindow",
    starter: `function maxSlidingWindow(nums, k) {
  // Keep a deque of useful indices for each window.
  return [];
}`,
    solution: `function maxSlidingWindow(nums, k) {
  const deque = [];
  const result = [];
  for (let i = 0; i < nums.length; i += 1) {
    while (deque.length && deque[0] <= i - k) deque.shift();
    while (deque.length && nums[deque[deque.length - 1]] <= nums[i]) deque.pop();
    deque.push(i);
    if (i >= k - 1) result.push(nums[deque[0]]);
  }
  return result;
}`,
    cases: [
      { args: [[1, 3, -1, -3, 5, 3, 6, 7], 3], expected: [3, 3, 5, 5, 6, 7] },
      { args: [[1], 1], expected: [1] },
      { args: [[9, 11], 2], expected: [11] },
    ],
  },
  {
    id: "median-two-sorted-arrays",
    title: "Median of two sorted arrays",
    difficulty: "Hard",
    pattern: "Binary search",
    companies: ["Amazon", "Google", "Meta", "Apple", "Nvidia"],
    leetcodeUrl: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    prompt: "Return the median of two sorted arrays in O(log(min(m, n))) time.",
    fn: "findMedianSortedArrays",
    starter: `function findMedianSortedArrays(nums1, nums2) {
  // Binary-search the partition in the smaller array.
  return 0;
}`,
    solution: `function findMedianSortedArrays(nums1, nums2) {
  if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
  const m = nums1.length;
  const n = nums2.length;
  let low = 0;
  let high = m;
  while (low <= high) {
    const i = Math.floor((low + high) / 2);
    const j = Math.floor((m + n + 1) / 2) - i;
    const leftA = i === 0 ? -Infinity : nums1[i - 1];
    const rightA = i === m ? Infinity : nums1[i];
    const leftB = j === 0 ? -Infinity : nums2[j - 1];
    const rightB = j === n ? Infinity : nums2[j];
    if (leftA <= rightB && leftB <= rightA) {
      const left = Math.max(leftA, leftB);
      if ((m + n) % 2) return left;
      return (left + Math.min(rightA, rightB)) / 2;
    }
    if (leftA > rightB) high = i - 1;
    else low = i + 1;
  }
  return 0;
}`,
    cases: [
      { args: [[1, 3], [2]], expected: 2 },
      { args: [[1, 2], [3, 4]], expected: 2.5 },
      { args: [[], [1]], expected: 1 },
    ],
  },
  {
    id: "n-queens-ii",
    title: "N-Queens II",
    difficulty: "Hard",
    pattern: "Backtracking",
    companies: ["Amazon", "Google", "Meta", "Apple"],
    leetcodeUrl: "https://leetcode.com/problems/n-queens-ii/",
    prompt: "Count the distinct ways to place n queens on an n by n board so that none attack each other.",
    fn: "totalNQueens",
    starter: `function totalNQueens(n) {
  // Backtrack while tracking occupied columns and diagonals.
  return 0;
}`,
    solution: `function totalNQueens(n) {
  const columns = new Set();
  const descending = new Set();
  const ascending = new Set();
  let count = 0;
  function place(row) {
    if (row === n) {
      count += 1;
      return;
    }
    for (let column = 0; column < n; column += 1) {
      const down = row - column;
      const up = row + column;
      if (columns.has(column) || descending.has(down) || ascending.has(up)) continue;
      columns.add(column);
      descending.add(down);
      ascending.add(up);
      place(row + 1);
      columns.delete(column);
      descending.delete(down);
      ascending.delete(up);
    }
  }
  place(0);
  return count;
}`,
    cases: [
      { args: [1], expected: 1 },
      { args: [4], expected: 2 },
      { args: [5], expected: 10 },
    ],
  },
];

function difficultyForLevel(level: number): Challenge["difficulty"] {
  if (level <= 25) return "Easy";
  if (level <= 70) return "Medium";
  return "Hard";
}

function challengeForLevel(level: number) {
  const difficulty = difficultyForLevel(level);
  const levelChallenges = challenges.filter((item) => item.difficulty === difficulty);
  const firstLevel = difficulty === "Easy" ? 1 : difficulty === "Medium" ? 26 : 71;
  return levelChallenges[(level - firstLevel) % levelChallenges.length];
}

function readStats(): GameStats {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
    if (typeof value !== "object" || value === null || Array.isArray(value)) return emptyStats;
    const saved = value as Partial<GameStats>;
    return {
      level: Number.isInteger(saved.level) && saved.level! >= 1 && saved.level! <= 100 ? saved.level! : 1,
      wins: Number.isInteger(saved.wins) && saved.wins! >= 0 ? saved.wins! : 0,
      losses: Number.isInteger(saved.losses) && saved.losses! >= 0 ? saved.losses! : 0,
      streak: Number.isInteger(saved.streak) && saved.streak! >= 0 ? saved.streak! : 0,
      xp: Number.isInteger(saved.xp) && saved.xp! >= 0 ? saved.xp! : 0,
    };
  } catch {
    return emptyStats;
  }
}

function readDraft(id: string, fallback: string) {
  try {
    return window.localStorage.getItem(`${storageKey}:draft:${id}`) ?? fallback;
  } catch {
    return fallback;
  }
}

function runInWorker(code: string, challenge: Challenge): Promise<TestResult> {
  return new Promise((resolve) => {
    const source = `
      self.onmessage = ({ data }) => {
        const stable = value => {
          if (Array.isArray(value)) return value.map(stable);
          if (value && typeof value === "object") return Object.fromEntries(
            Object.keys(value).sort().map(key => [key, stable(value[key])])
          );
          return value;
        };
        const display = value => {
          const json = JSON.stringify(value);
          return json === undefined ? String(value) : json;
        };
        const startedAt = performance.now();
        let createSolution;
        try {
          createSolution = new Function(data.code + "\\n; return typeof " + data.fn +
            " === 'function' ? " + data.fn + " : null;");
        } catch (error) {
          self.postMessage({
            passed: 0,
            total: data.cases.length,
            details: [],
            status: "Compile Error",
            runtimeMs: performance.now() - startedAt,
            error: error instanceof Error ? error.message : "The code could not be compiled.",
          });
          return;
        }
        let candidate;
        try {
          candidate = createSolution();
        } catch (error) {
          self.postMessage({
            passed: 0,
            total: data.cases.length,
            details: [],
            status: "Runtime Error",
            runtimeMs: performance.now() - startedAt,
            error: error instanceof Error ? error.message : "The code failed before the tests ran.",
          });
          return;
        }
        if (typeof candidate !== "function") {
          self.postMessage({
            passed: 0,
            total: data.cases.length,
            details: [],
            status: "Compile Error",
            runtimeMs: performance.now() - startedAt,
            error: "Define the requested function: " + data.fn + ".",
          });
          return;
        }
        const solution = candidate;
        try {
          let runtimeError = false;
          let passed = 0;
          const details = data.cases.map((test, index) => {
            try {
              const actual = solution(...JSON.parse(JSON.stringify(test.args)));
              const ok = JSON.stringify(stable(actual)) === JSON.stringify(stable(test.expected));
              if (ok) passed += 1;
              return ok
                ? "Test " + (index + 1) + ": passed"
                : "Test " + (index + 1) + ": expected " + display(test.expected) + ", received " + display(actual);
            } catch (error) {
              runtimeError = true;
              return "Test " + (index + 1) + ": " + (error instanceof Error ? error.message : String(error));
            }
          });
          self.postMessage({
            passed,
            total: data.cases.length,
            details,
            status: runtimeError ? "Runtime Error" : passed === data.cases.length ? "Accepted" : "Wrong Answer",
            runtimeMs: performance.now() - startedAt,
          });
        } catch (error) {
          self.postMessage({
            passed: 0,
            total: data.cases.length,
            details: [],
            status: "Runtime Error",
            runtimeMs: performance.now() - startedAt,
            error: error instanceof Error ? error.message : "The code could not run.",
          });
        }
      };
    `;
    const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    const worker = new Worker(url);
    let settled = false;
    const finish = (result: TestResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timeout = window.setTimeout(
      () => finish({ passed: 0, total: challenge.cases.length, details: [], status: "TLE", error: "Execution exceeded the 2-second time limit. Check for an infinite loop." }),
      2000,
    );
    worker.onmessage = (event: MessageEvent<TestResult>) => finish(event.data);
    worker.onerror = () => finish({ passed: 0, total: challenge.cases.length, details: [], status: "Runner Error", error: "The isolated browser runner could not start." });
    worker.postMessage({ code, fn: challenge.fn, cases: challenge.cases });
  });
}

async function requestAiSolution(challenge: Challenge, level: number) {
  const prompt = [
    `Write a complete JavaScript solution for level ${level} of 100.`,
    `Problem: ${challenge.title}`,
    `Function name: ${challenge.fn}`,
    `Problem statement: ${challenge.prompt}`,
    `Examples: ${JSON.stringify(challenge.cases)}`,
    "Return only the function implementation. Do not include markdown or explanation.",
  ].join("\n");
  const response = await fetch("/api/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      persona: "battle-solver",
      model: "gemini-3.6-flash",
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const data = await response.json() as { answer?: string; error?: string };
  if (!response.ok) throw new Error(data.error ?? "Byte could not generate a solution. Try again.");
  if (!data.answer?.trim()) throw new Error("Byte returned an empty solution. Try again.");
  const fencedCode = data.answer.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);
  return (fencedCode?.[1] ?? data.answer).trim();
}

function isJudgeScore(value: unknown): value is JudgeScore {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const score = value as Partial<JudgeScore>;
  return ["correctness", "efficiency", "readability", "maintainability"].every((key) => {
    const part = score[key as keyof JudgeScore];
    return typeof part === "number" && Number.isFinite(part) && part >= 0 && part <= 100;
  }) && typeof score.feedback === "string" && score.feedback.length > 0;
}

function parseAiJudgement(answer: string): AiJudgement {
  const json = answer.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("The AI judge returned an invalid review. Retry the review.");
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new Error("The AI judge returned unreadable review data. Retry the review.");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("The AI judge returned an incomplete review. Retry the review.");
  }
  const result = value as Partial<AiJudgement>;
  if (!isJudgeScore(result.human) || !isJudgeScore(result.byte) || typeof result.summary !== "string" || !result.summary.trim()) {
    throw new Error("The AI judge returned an incomplete review. Retry the review.");
  }
  return { human: result.human, byte: result.byte, summary: result.summary.trim() };
}

function qualityScore(score: JudgeScore) {
  return Math.round(score.correctness * 0.5 + score.efficiency * 0.2 + score.readability * 0.15 + score.maintainability * 0.15);
}

async function requestAiJudgement(challenge: Challenge, humanCode: string, humanTests: TestResult, byteCode: string, byteTests: TestResult) {
  const messages = [
    `Judge both JavaScript solutions for overall code quality. Score correctness, efficiency, readability, and maintainability from 0 to 100. The app weights these as correctness 50%, efficiency 20%, readability 15%, and maintainability 15%. Return only JSON with this shape: {"human":{"correctness":0,"efficiency":0,"readability":0,"maintainability":0,"feedback":"..."},"byte":{"correctness":0,"efficiency":0,"readability":0,"maintainability":0,"feedback":"..."},"summary":"..."}.`,
    `Problem: ${challenge.title}\n${challenge.prompt}\nRequired function: ${challenge.fn}\nTest evidence for Human: ${humanTests.passed}/${humanTests.total} passed; status ${humanTests.status}; ${humanTests.error ?? humanTests.details.join("; ")}`,
    `Human submission:\n${humanCode}`,
    `Byte submission:\n${byteCode}\nTest evidence for Byte: ${byteTests.passed}/${byteTests.total} passed; status ${byteTests.status}; ${byteTests.error ?? byteTests.details.join("; ")}`,
  ];
  const response = await fetch("/api/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      persona: "battle-judge",
      model: "gemini-3.6-flash",
      messages: messages.map((content) => ({ role: "user", content })),
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const data = await response.json() as { answer?: string; error?: string };
  if (!response.ok) throw new Error(data.error ?? "The AI judge could not review the submissions. Retry the review.");
  if (!data.answer?.trim()) throw new Error("The AI judge returned an empty review. Retry the review.");
  return parseAiJudgement(data.answer);
}

export default function HumanVsAi() {
  const [stats, setStats] = useState<GameStats>(readStats);
  const [challengeId, setChallengeId] = useState(() => challengeForLevel(stats.level).id);
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];
  const [code, setCode] = useState(() => readDraft(challenge.id, challenge.starter));
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const [status, setStatus] = useState<RoundStatus>("ready");
  const [activeLevel, setActiveLevel] = useState(stats.level);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [humanSubmission, setHumanSubmission] = useState<string | null>(null);
  const [aiCode, setAiCode] = useState("");
  const [aiVisibleLength, setAiVisibleLength] = useState(0);
  const [aiResult, setAiResult] = useState<TestResult | null>(null);
  const [aiState, setAiState] = useState<AiState>("idle");
  const [aiError, setAiError] = useState("");
  const [judgement, setJudgement] = useState<AiJudgement | null>(null);
  const [judgeState, setJudgeState] = useState<JudgeState>("idle");
  const [judgeError, setJudgeError] = useState("");
  const [judgeAttempt, setJudgeAttempt] = useState(0);
  const [running, setRunning] = useState(false);
  const [storageError, setStorageError] = useState("");
  const settledRef = useRef(false);
  const roundIdRef = useRef(0);

  const targetLevel = status === "running" || status === "human-won" || status === "ai-won" || status === "tie" ? activeLevel : stats.level;
  const levelProgress = Math.min(100, stats.level);
  const roundFinished = status === "human-won" || status === "ai-won" || status === "tie";

  useEffect(() => {
    setAiVisibleLength(0);
    if (!aiCode) return;
    const timer = window.setInterval(() => {
      setAiVisibleLength((current) => {
        const next = Math.min(current + 8, aiCode.length);
        if (next >= aiCode.length) window.clearInterval(timer);
        return next;
      });
    }, 18);
    return () => window.clearInterval(timer);
  }, [aiCode]);

  useEffect(() => () => { roundIdRef.current += 1; }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(`${storageKey}:draft:${challenge.id}`, code);
      setStorageError("");
    } catch {
      setStorageError("Draft saving is unavailable in this browser; your code will be lost when you leave.");
    }
  }, [challenge.id, code]);

  function settleRound(winner: "human" | "byte" | "tie") {
    if (settledRef.current) return;
    settledRef.current = true;
    roundIdRef.current += 1;
    setStatus(winner === "human" ? "human-won" : winner === "byte" ? "ai-won" : "tie");
    setRunning(false);
    const current = statsRef.current;
    const next: GameStats = winner === "human"
      ? {
          ...current,
          level: Math.min(100, current.level + 1),
          wins: current.wins + 1,
          streak: current.streak + 1,
          xp: current.xp + 100,
        }
      : winner === "byte"
        ? { ...current, losses: current.losses + 1, streak: 0 }
        : current;
    statsRef.current = next;
    setStats(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError("Match stats could not be saved in this browser.");
    }
  }

  async function runAiOpponent(roundId: number, roundLevel: number, roundChallenge: Challenge) {
    setAiState("thinking");
    try {
      const generatedCode = await requestAiSolution(roundChallenge, roundLevel);
      if (roundIdRef.current !== roundId || settledRef.current) return;
      const result = await runInWorker(generatedCode, roundChallenge);
      if (roundIdRef.current !== roundId || settledRef.current) return;
      setAiCode(generatedCode);
      setAiResult(result);
      setAiState("ready");
    } catch (error) {
      if (roundIdRef.current !== roundId || settledRef.current) return;
      roundIdRef.current += 1;
      settledRef.current = true;
      setStatus("ready");
      setAiState("error");
      setAiError(error instanceof Error ? error.message : "Byte could not connect. Try starting the match again.");
    }
  }

  function startRound() {
    const roundLevel = statsRef.current.level;
    roundIdRef.current += 1;
    const roundId = roundIdRef.current;
    settledRef.current = false;
    setTestResult(null);
    setHumanSubmission(null);
    setAiCode("");
    setAiResult(null);
    setAiError("");
    setJudgement(null);
    setJudgeState("idle");
    setJudgeError("");
    setAiState("thinking");
    setActiveLevel(roundLevel);
    setStatus("running");
    void runAiOpponent(roundId, roundLevel, challenge);
  }

  function replay() {
    const nextChallenge = challengeForLevel(stats.level);
    roundIdRef.current += 1;
    setChallengeId(nextChallenge.id);
    setCode(readDraft(nextChallenge.id, nextChallenge.starter));
    settledRef.current = false;
    setTestResult(null);
    setHumanSubmission(null);
    setAiCode("");
    setAiResult(null);
    setAiError("");
    setJudgement(null);
    setJudgeState("idle");
    setJudgeError("");
    setAiState("idle");
    setStatus("ready");
  }

  async function submitCode() {
    if (status !== "running" || running || humanSubmission !== null || settledRef.current) return;
    setRunning(true);
    setTestResult(null);
    const submittedCode = code;
    try {
      const result = await runInWorker(submittedCode, challenge);
      setTestResult(result);
      setHumanSubmission(submittedCode);
    } catch (error) {
      const result: TestResult = {
        passed: 0,
        total: challenge.cases.length,
        details: [],
        status: "Runner Error",
        error: error instanceof Error ? error.message : "The tests could not run.",
      };
      setTestResult(result);
      setHumanSubmission(submittedCode);
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    if (status !== "running" || humanSubmission === null || !testResult || !aiCode || !aiResult || judgeState !== "idle") return;
    const roundId = roundIdRef.current;
    let cancelled = false;
    setJudgeState("thinking");
    void requestAiJudgement(challenge, humanSubmission, testResult, aiCode, aiResult).then((review) => {
      if (cancelled || roundIdRef.current !== roundId) return;
      setJudgement(review);
      setJudgeState("done");
      const humanScore = qualityScore(review.human);
      const byteScore = qualityScore(review.byte);
      settleRound(humanScore > byteScore ? "human" : byteScore > humanScore ? "byte" : "tie");
    }).catch((error: unknown) => {
      if (cancelled || roundIdRef.current !== roundId) return;
      setJudgeError(error instanceof Error ? error.message : "The AI judge could not review the submissions. Retry the review.");
      setJudgeState("error");
    });
    return () => { cancelled = true; };
  }, [status, humanSubmission, testResult, aiCode, aiResult, judgeAttempt]);

  return (
    <main className="human-ai-page">
      <header className="human-ai-hero">
        <div className="human-ai-hero-copy">
          <span className="human-ai-eyebrow"><Sparkles size={13} /> CODEXSHEET BATTLE · ROUND {stats.wins + stats.losses + 1} · LEVEL {targetLevel}</span>
          <span className="human-ai-auth-badge">SIGN IN REQUIRED · LEVELS SAVE ON THIS DEVICE</span>
          <span className="human-ai-level-badge">AI LEVEL {stats.level} / 100 · {difficultyForLevel(stats.level).toUpperCase()}</span>
          <h1>CodexSheet <em>Battle</em></h1>
          <p>You and Byte solve one question per level. Submit both solutions and an AI judge picks the stronger code.</p>
        </div>
        <div className="human-ai-scoreboard" aria-label="Your game stats">
          <div><Bot size={15} /><strong>{stats.level}</strong><span>LEVEL</span></div>
          <div><Trophy size={15} /><strong>{stats.wins}</strong><span>WINS</span></div>
          <div><Flame size={15} /><strong>{stats.streak}</strong><span>STREAK</span></div>
          <div><Zap size={15} /><strong>{stats.xp}</strong><span>XP</span></div>
        </div>
      </header>

      <section className="human-ai-challenges" aria-label={`Level ${targetLevel} question`}>
        <div className="human-ai-section-label"><span>YOUR LEVEL {targetLevel} QUESTION</span><small>One focused challenge per level</small></div>
        <div className="human-ai-challenge active" aria-current="step">
          <span className="human-ai-challenge-number">{String(targetLevel).padStart(2, "0")}</span>
          <strong>{challenge.title}</strong>
          <small>{challenge.difficulty} · {challenge.pattern}</small>
          <span className="human-ai-challenge-companies">{challenge.companies.slice(0, 3).join(" · ")}</span>
          <span className="human-ai-level-meter"><span>LEVEL {targetLevel} / 100</span><strong>{difficultyForLevel(targetLevel)} AI</strong><i><b style={{ width: `${levelProgress}%` }} /></i></span>
        </div>
      </section>

      <div className="human-ai-arena">
        <section className="human-ai-problem">
          <div className="human-ai-section-label"><span>THE CHALLENGE</span><span className={`human-ai-difficulty ${challenge.difficulty.toLowerCase()}`}>{challenge.difficulty}</span></div>
          <h2>{challenge.title}</h2>
          <p>{challenge.prompt}</p>
          <div className="human-ai-signature"><span>YOUR FUNCTION</span><code>{challenge.fn}(…)</code></div>
          <div className="human-ai-company-tags"><span>INTERVIEW TAGS</span><div>{challenge.companies.map((company) => <span key={company}>{company}</span>)}</div><a href={challenge.leetcodeUrl} target="_blank" rel="noreferrer">Open original problem <ChevronRight size={12} /></a></div>
          <div className="human-ai-samples">
            <span>EXAMPLE CHECKS</span>
            {challenge.cases.slice(0, 3).map((test, index) => (
              <div key={index}><code>{JSON.stringify(test.args)}</code><span>→</span><code>{JSON.stringify(test.expected)}</code></div>
            ))}
          </div>
          <div className="human-ai-round-length"><Code2 size={14} /><span><strong>One final submission</strong><small>The judge scores correctness, efficiency, readability, and maintainability.</small></span></div>
          <div className="human-ai-disclosure"><Bot size={14} /><span>Byte writes a competing solution. Both submissions are test-run locally, then Gemini reviews code quality. Company tags are community-reported signals, not official guarantees.</span></div>
        </section>

        <section className="human-ai-match" aria-label="Human versus AI match">
          <div className="human-ai-match-head">
            <div className="human-ai-player human">
              <span className="human-ai-avatar"><Code2 size={18} /></span>
              <span><strong>YOU</strong><small>Human coder</small></span>
            </div>
            <span className="human-ai-versus">VS</span>
            <div className="human-ai-player bot">
              <span className="human-ai-avatar"><Bot size={19} /></span>
              <span><strong>BYTE</strong><small>{status === "ai-won" ? "Judge's pick" : status === "human-won" ? "Outscored" : status === "tie" ? "Tied" : aiState === "thinking" ? "Writing code…" : aiState === "ready" ? "Submitted" : "Gemini AI"}</small></span>
            </div>
          </div>
          <div className="human-ai-review-status">
            <div className="human-ai-review-label"><span><Sparkles size={13} /> AI CODE-QUALITY JUDGE</span><strong>{judgeState === "thinking" ? "ANALYZING" : judgeState === "done" ? status === "tie" ? "TIE" : "VERDICT READY" : status === "human-won" ? "YOU WIN" : status === "ai-won" ? "BYTE WINS" : status === "tie" ? "TIE" : "AWAITING SUBMISSIONS"}</strong></div>
            <div className={`human-ai-review-track${judgeState === "thinking" ? " analyzing" : ""}`}><span style={{ width: judgeState === "done" ? "100%" : judgeState === "thinking" ? "65%" : "0%" }} /></div>
            <small>{judgeState === "thinking" ? "Gemini is comparing correctness, efficiency, readability, and maintainability." : humanSubmission !== null ? aiCode ? "Both solutions submitted. The AI judge is preparing its review." : "Your submission is in. Waiting for Byte to finish writing." : status === "ready" ? "Write your solution, then submit it for an AI quality review." : "Submit your code to start the AI judge review."}</small>
          </div>
          <div className="human-ai-editors">
            <div className="human-ai-editor">
              <div className="human-ai-editor-bar"><span><i /><i /><i /></span><strong>human-solution.js</strong><button type="button" disabled={running || (status === "running" && humanSubmission !== null)} onClick={() => { setCode(challenge.starter); setTestResult(null); }}><RotateCcw size={12} /> Reset</button></div>
              <CodeMirror
                value={code}
                height="310px"
                extensions={[javascript(), javascriptHighlighting, EditorView.lineWrapping]}
                onChange={(value: string) => { setCode(value); setTestResult(null); }}
                readOnly={roundFinished || running || humanSubmission !== null}
                basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, bracketMatching: true }}
                aria-label="Human JavaScript code editor"
              />
            </div>
            <div className="human-ai-editor human-ai-ai-editor">
              <div className="human-ai-editor-bar">
                <span><i /><i /><i /></span>
                <strong>byte-solution.js</strong>
                {aiState === "thinking" && <span className="human-ai-typing-label">writing<span className="human-ai-typing-dots"><i /><i /><i /></span></span>}
              </div>
              {aiCode ? (
                <CodeMirror
                  value={aiCode.slice(0, aiVisibleLength)}
                  height="310px"
                  extensions={[javascript(), javascriptHighlighting, EditorView.lineWrapping]}
                  readOnly
                  basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false, bracketMatching: true }}
                  aria-label="Byte's AI-generated JavaScript code"
                />
              ) : (
                <div className={`human-ai-ai-placeholder${aiState === "thinking" ? " writing" : ""}`} role={aiState === "thinking" ? "status" : undefined}>
                  <Bot size={23} />
                  <strong>{aiState === "thinking" ? "Byte is reading the challenge" : aiState === "error" ? "Byte couldn't write a solution" : status === "human-won" ? "You solved it before Byte finished" : status === "ai-won" ? "Byte's solution isn't available" : status === "running" ? "Waiting for Byte…" : "Start the match to watch Byte write code"}</strong>
                  {aiState === "thinking" && <span className="human-ai-typing-dots"><i /><i /><i /></span>}
                </div>
              )}
              {aiResult && <div className={`human-ai-ai-result${aiResult.status === "Accepted" ? " success" : ""}`}>{aiResult.status} · {aiResult.passed}/{aiResult.total} tests passed</div>}
            </div>
          </div>
          <div className="human-ai-actions">
            {status === "ready" ? (
              <button type="button" className="human-ai-primary" onClick={startRound}><Play size={15} fill="currentColor" /> {aiState === "error" ? "Retry match" : "Start match"}</button>
            ) : status === "running" ? humanSubmission === null ? (
              <button type="button" className="human-ai-primary" onClick={submitCode} disabled={running}>
                {running ? "Running tests…" : <><Zap size={15} /> Submit for AI review</>}
              </button>
            ) : judgeState === "error" ? (
              <button type="button" className="human-ai-primary" onClick={() => { setJudgeError(""); setJudgeState("idle"); setJudgeAttempt((attempt) => attempt + 1); }}><RotateCcw size={15} /> Retry AI review</button>
            ) : (
              <button type="button" className="human-ai-primary" disabled>
                {judgeState === "thinking" ? "AI judge is analyzing…" : "Submitted · waiting for review"}
              </button>
            ) : (
              <button type="button" className="human-ai-primary" onClick={replay}><RotateCcw size={15} /> {status === "tie" ? "Rematch this level" : "Next level"}</button>
            )}
            {status === "running" && <span>{humanSubmission ? "Submission locked" : "Submit once · tests run in browser"}</span>}
            {roundFinished && <span className={`human-ai-verdict ${status}`}><Check size={13} /> {status === "human-won" ? "100 XP earned" : status === "tie" ? "Scores tied · no level change" : "Every loss is a lesson"}</span>}
          </div>
          {aiState === "thinking" && status === "running" && <p className="human-ai-ai-status" role="status"><LoaderCircle size={13} className="human-ai-spinner" /> Gemini is writing Byte's solution and running its tests.</p>}
          {aiError && <p className="human-ai-ai-error" role="alert"><AlertCircle size={13} />{aiError}</p>}
          {judgeError && <p className="human-ai-ai-error" role="alert"><AlertCircle size={13} />{judgeError}</p>}
          {testResult && (
            <div className={`human-ai-test-result${testResult.status === "Accepted" ? " success" : testResult.status === "Wrong Answer" ? "" : " error"}`} role="status">
              <strong>{testResult.status} · {testResult.passed}/{testResult.total} tests passed</strong>
              {testResult.runtimeMs !== undefined && <span>Runtime: {testResult.runtimeMs.toFixed(2)} ms</span>}
              {testResult.error && <span>{testResult.error}</span>}
              {testResult.details.map((detail) => <span key={detail}>{detail}</span>)}
            </div>
          )}
          {judgement && (
            <div className="human-ai-judge-report" role="status">
              <div className="human-ai-judge-report-head"><strong>AI judge's decision</strong><span>Human {qualityScore(judgement.human)} · Byte {qualityScore(judgement.byte)}</span></div>
              <p>{judgement.summary}</p>
              <div className="human-ai-judge-scores">
                {([["Human", judgement.human], ["Byte", judgement.byte]] as const).map(([name, score]) => (
                  <section key={name}>
                    <strong>{name} · {qualityScore(score)}/100</strong>
                    <span>Correctness {score.correctness} · Efficiency {score.efficiency}</span>
                    <span>Readability {score.readability} · Maintainability {score.maintainability}</span>
                    <p>{score.feedback}</p>
                  </section>
                ))}
              </div>
            </div>
          )}
          {storageError && <p className="human-ai-storage-note" role="status">{storageError}</p>}
        </section>
      </div>
      <footer className="human-ai-footnote"><span><Sparkles size={13} /> Correctness 50% · efficiency 20% · readability 15% · maintainability 15%</span><a href={companyTagSource} target="_blank" rel="noreferrer">Company-tag source <ChevronRight size={11} /></a></footer>
    </main>
  );
}
