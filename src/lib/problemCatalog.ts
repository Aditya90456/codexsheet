export type ProblemDetail = {
  number: number;
  title: string;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  constraints: string[];
  examples: Array<{ input: string; output: string; explanation?: string }>;
  testCases: Array<{ stdin: string; expected: string }>;
};

export const problemCatalog: Record<number, ProblemDetail> = {
  1: {
    number: 1,
    title: "Two Sum",
    pattern: "Two Pointers / Hash Map",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Read n and target on line 1, then the n numbers on line 2. Print the two indices ascending, space-separated.",
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Exactly one valid answer exists."],
    examples: [
      { input: "4 9\n2 7 11 15", output: "0 1", explanation: "nums[0] + nums[1] == 9, so return 0 1." },
      { input: "3 6\n3 2 4", output: "1 2", explanation: "nums[1] + nums[2] == 6, so return 1 2." },
      { input: "2 6\n3 3", output: "0 1", explanation: "nums[0] + nums[1] == 6, so return 0 1." },
    ],
    testCases: [
      { stdin: "4 9\n2 7 11 15", expected: "0 1" },
      { stdin: "3 6\n3 2 4", expected: "1 2" },
      { stdin: "2 6\n3 3", expected: "0 1" },
      { stdin: "5 10\n1 4 5 6 9", expected: "0 4" },
    ],
  },
  2: {
    number: 2,
    title: "Valid Anagram",
    pattern: "Arrays & Hashing",
    difficulty: "Easy",
    description: "Given two strings s and t on separate lines, print 'true' if t is an anagram of s, and 'false' otherwise. An anagram is a word formed by rearranging the letters of a different word, using all original letters exactly once.",
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    examples: [
      { input: "anagram\nnagaram", output: "true", explanation: "Both strings have the same letter frequencies." },
      { input: "rat\ncar", output: "false", explanation: "Characters differ." },
    ],
    testCases: [
      { stdin: "anagram\nnagaram", expected: "true" },
      { stdin: "rat\ncar", expected: "false" },
      { stdin: "listen\nsilent", expected: "true" },
    ],
  },
  3: {
    number: 3,
    title: "Group Anagrams",
    pattern: "Arrays & Hashing",
    difficulty: "Medium",
    description: "Given an array of strings, group the anagrams together. Read n on line 1, then space-separated strings on line 2. Print each sorted anagram group on its own line.",
    constraints: ["1 <= n <= 10^4", "0 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters."],
    examples: [
      { input: "6\neat tea tan ate nat bat", output: "ant nat tan\nate eat tea\nbat", explanation: "Words with same character counts are grouped together." },
    ],
    testCases: [
      { stdin: "6\neat tea tan ate nat bat", expected: "ant nat tan\nate eat tea\nbat" },
      { stdin: "1\na", expected: "a" },
    ],
  },
  4: {
    number: 4,
    title: "Top K Frequent Elements",
    pattern: "Heaps / Hash Map",
    difficulty: "Medium",
    description: "Given an integer array nums and an integer k, return the k most frequent elements. Print the elements space-separated, sorted in ascending order. Input starts with n and k on line 1, then n integers on line 2.",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4", "k is in the range [1, the number of unique elements in the array]."],
    examples: [
      { input: "6 2\n1 1 1 2 2 3", output: "1 2", explanation: "1 occurs 3 times, 2 occurs 2 times." },
    ],
    testCases: [
      { stdin: "6 2\n1 1 1 2 2 3", expected: "1 2" },
      { stdin: "1 1\n1", expected: "1" },
    ],
  },
  5: {
    number: 5,
    title: "Product of Array Except Self",
    pattern: "Prefix & Suffix",
    difficulty: "Medium",
    description: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all elements of nums except nums[i]. You must solve it in O(n) without using the division operation. Read n on line 1, then n integers on line 2. Print result space-separated.",
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30", "The product of any prefix or suffix of nums fits in a 32-bit integer."],
    examples: [
      { input: "4\n1 2 3 4", output: "24 12 8 6", explanation: "Prefix products * suffix products." },
    ],
    testCases: [
      { stdin: "4\n1 2 3 4", expected: "24 12 8 6" },
      { stdin: "5\n-1 1 0 -3 3", expected: "0 0 9 0 0" },
    ],
  },
  6: {
    number: 6,
    title: "Valid Palindrome",
    pattern: "Two Pointers",
    difficulty: "Easy",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Print 'true' or 'false'.",
    constraints: ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters."],
    examples: [
      { input: "A man, a plan, a canal: Panama", output: "true", explanation: "'amanaplanacanalpanama' is a palindrome." },
      { input: "race a car", output: "false", explanation: "'raceacar' is not a palindrome." },
    ],
    testCases: [
      { stdin: "A man, a plan, a canal: Panama", expected: "true" },
      { stdin: "race a car", expected: "false" },
      { stdin: " ", expected: "true" },
    ],
  },
  11: {
    number: 11,
    title: "Longest Substring Without Repeating Characters",
    pattern: "Sliding Window",
    difficulty: "Medium",
    description: "Given a string s, find the length of the longest substring without repeating characters. Print the length integer.",
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
    examples: [
      { input: "abcabcbb", output: "3", explanation: "The answer is 'abc', with the length of 3." },
      { input: "bbbbb", output: "1", explanation: "The answer is 'b', with the length of 1." },
      { input: "pwwkew", output: "3", explanation: "The answer is 'wke', with length 3." },
    ],
    testCases: [
      { stdin: "abcabcbb", expected: "3" },
      { stdin: "bbbbb", expected: "1" },
      { stdin: "pwwkew", expected: "3" },
    ],
  },
  14: {
    number: 14,
    title: "Valid Parentheses",
    pattern: "Stack",
    difficulty: "Easy",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets, in the correct order. Print 'true' or 'false'.",
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
    examples: [
      { input: "()[]{}", output: "true" },
      { input: "(]", output: "false" },
      { input: "([{}])", output: "true" },
    ],
    testCases: [
      { stdin: "()[]{}", expected: "true" },
      { stdin: "(]", expected: "false" },
      { stdin: "([{}])", expected: "true" },
      { stdin: "((", expected: "false" },
    ],
  },
  17: {
    number: 17,
    title: "Daily Temperatures",
    pattern: "Monotonic Stack",
    difficulty: "Medium",
    description: "Given an array of integers temperatures represents the daily temperatures, print an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day for which this is possible, keep answer[i] == 0. Read n on line 1, then n temperatures on line 2. Print result space-separated.",
    constraints: ["1 <= temperatures.length <= 10^5", "30 <= temperatures[i] <= 100"],
    examples: [
      { input: "8\n73 74 75 71 69 72 76 73", output: "1 1 4 2 1 1 0 0" },
    ],
    testCases: [
      { stdin: "8\n73 74 75 71 69 72 76 73", expected: "1 1 4 2 1 1 0 0" },
      { stdin: "4\n30 40 50 60", expected: "1 1 1 0" },
    ],
  },
  18: {
    number: 18,
    title: "Binary Search",
    pattern: "Binary Search",
    difficulty: "Easy",
    description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its 0-based index. Otherwise, return -1. Line 1: n and target. Line 2: n sorted integers.",
    constraints: ["1 <= nums.length <= 10^4", "-10^4 < nums[i], target < 10^4", "All integers in nums are unique.", "nums is sorted in ascending order."],
    examples: [
      { input: "6 9\n-1 0 3 5 9 12", output: "4", explanation: "9 exists in nums and its index is 4." },
      { input: "6 2\n-1 0 3 5 9 12", output: "-1", explanation: "2 does not exist in nums." },
    ],
    testCases: [
      { stdin: "6 9\n-1 0 3 5 9 12", expected: "4" },
      { stdin: "6 2\n-1 0 3 5 9 12", expected: "-1" },
    ],
  },
  21: {
    number: 21,
    title: "Reverse Linked List",
    pattern: "Linked List",
    difficulty: "Easy",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list. Input: n on line 1, followed by n values on line 2. Output: space-separated reversed values.",
    constraints: ["0 <= number of nodes <= 5000", "-5000 <= Node.val <= 5000"],
    examples: [
      { input: "5\n1 2 3 4 5", output: "5 4 3 2 1" },
      { input: "2\n1 2", output: "2 1" },
    ],
    testCases: [
      { stdin: "5\n1 2 3 4 5", expected: "5 4 3 2 1" },
      { stdin: "2\n1 2", expected: "2 1" },
    ],
  },
  26: {
    number: 26,
    title: "Invert Binary Tree",
    pattern: "Trees",
    difficulty: "Easy",
    description: "Given the root of a binary tree, invert the tree, and return its root. Level-order input on line 1 using 'null' for missing nodes. Output level-order space-separated values.",
    constraints: ["0 <= number of nodes <= 100", "-100 <= Node.val <= 100"],
    examples: [
      { input: "4 2 7 1 3 6 9", output: "4 7 2 9 6 3 1" },
      { input: "2 1 3", output: "2 3 1" },
    ],
    testCases: [
      { stdin: "4 2 7 1 3 6 9", expected: "4 7 2 9 6 3 1" },
      { stdin: "2 1 3", expected: "2 3 1" },
    ],
  },
  27: {
    number: 27,
    title: "Maximum Depth of Binary Tree",
    pattern: "Trees",
    difficulty: "Easy",
    description: "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    constraints: ["0 <= number of nodes <= 10^4", "-100 <= Node.val <= 100"],
    examples: [
      { input: "3 9 20 null null 15 7", output: "3" },
      { input: "1 null 2", output: "2" },
    ],
    testCases: [
      { stdin: "3 9 20 null null 15 7", expected: "3" },
      { stdin: "1 null 2", expected: "2" },
    ],
  },
  31: {
    number: 31,
    title: "Subsets",
    pattern: "Backtracking",
    difficulty: "Medium",
    description: "Given an integer array nums of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets. Print subsets one per line, with values space-separated. Print {} for empty set.",
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10", "All numbers are unique."],
    examples: [
      { input: "2\n1 2", output: "{}\n1\n2\n1 2" },
    ],
    testCases: [
      { stdin: "2\n1 2", expected: "{}\n1\n2\n1 2" },
    ],
  },
  36: {
    number: 36,
    title: "Number of Islands",
    pattern: "Graphs / BFS / DFS",
    difficulty: "Medium",
    description: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. Read m and n on line 1, then m rows of 0/1 strings.",
    constraints: ["1 <= m, n <= 300", "grid[i][j] is '0' or '1'."],
    examples: [
      { input: "4 5\n11000\n11000\n00100\n00011", output: "3" },
    ],
    testCases: [
      { stdin: "4 5\n11000\n11000\n00100\n00011", expected: "3" },
      { stdin: "4 5\n11110\n11010\n11000\n00000", expected: "1" },
    ],
  },
  70: {
    number: 70,
    title: "Climbing Stairs",
    pattern: "Dynamic Programming",
    difficulty: "Easy",
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top? Read n from standard input and print the number of distinct ways.",
    constraints: ["1 <= n <= 45"],
    examples: [
      { input: "2", output: "2", explanation: "1 step + 1 step, or 2 steps." },
      { input: "3", output: "3", explanation: "1+1+1, 1+2, 2+1." },
    ],
    testCases: [
      { stdin: "2", expected: "2" },
      { stdin: "3", expected: "3" },
      { stdin: "5", expected: "8" },
    ],
  },
  142: {
    number: 142,
    title: "Maximum Subarray (Kadane's Algorithm)",
    pattern: "Dynamic Programming",
    difficulty: "Medium",
    description: "Given an integer array nums, find the subarray with the largest sum, and return its sum. Read n on line 1, then n integers on line 2.",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
    ],
    testCases: [
      { stdin: "9\n-2 1 -3 4 -1 2 1 -5 4", expected: "6" },
      { stdin: "1\n1", expected: "1" },
      { stdin: "5\n5 4 -1 7 8", expected: "23" },
    ],
  },
};

export function getProblemDetail(problemNumber: number, title?: string, pattern?: string, difficulty?: "Easy" | "Medium" | "Hard"): ProblemDetail {
  if (problemCatalog[problemNumber]) {
    return problemCatalog[problemNumber];
  }
  const cleanTitle = title ?? `Problem ${problemNumber}`;
  const cleanPattern = pattern ?? "Data Structures & Algorithms";
  const cleanDiff = difficulty ?? "Medium";
  return {
    number: problemNumber,
    title: cleanTitle,
    pattern: cleanPattern,
    difficulty: cleanDiff,
    description: `Given the input stream according to the ${cleanPattern} pattern, solve "${cleanTitle}" with optimal time and space complexity. Read standard input and print the exact expected result to standard output.`,
    constraints: [
      "1 <= input size <= 10^5",
      "Values fit in standard 32-bit signed integers unless specified",
      "Optimal runtime complexity expected",
    ],
    examples: [
      {
        input: "Sample input for " + cleanTitle,
        output: "Expected output",
        explanation: `Demonstrates the core ${cleanPattern} transition.`,
      },
    ],
    testCases: [
      {
        stdin: "Sample input for " + cleanTitle,
        expected: "Expected output",
      },
    ],
  };
}
