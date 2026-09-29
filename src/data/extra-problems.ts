import type { Difficulty, Problem } from "./dsa";

// Compact catalogue: "Title|E/M/H|topic slug|pattern slug"
const RAW = `
Remove Duplicates from Sorted Array|E|arrays|two-pointer-converging
Move Zeroes|E|arrays|two-pointer-converging
Plus One|E|arrays|one-pass-min-tracking
Merge Sorted Array|E|arrays|two-pointer-converging
Rotate Array|M|arrays|pointer-reversal
Product of Array Except Self|M|arrays|one-pass-min-tracking
Majority Element|E|arrays|frequency-counter
Pascals Triangle|E|arrays|linear-dp
Set Matrix Zeroes|M|arrays|one-pass-min-tracking
Spiral Matrix|M|arrays|one-pass-min-tracking
Rotate Image|M|arrays|pointer-reversal
Next Permutation|M|arrays|two-pointer-converging
Find the Duplicate Number|M|arrays|fast-slow-pointers
Missing Number|E|arrays|xor-trick
Find All Numbers Disappeared in an Array|E|arrays|hash-map-lookup
Maximum Product Subarray|M|arrays|kadane
Subarray Sum Equals K|M|arrays|hash-map-lookup
Range Sum Query Immutable|E|arrays|linear-dp
Maximum Subarray Sum Circular|M|arrays|kadane
First Missing Positive|H|arrays|hash-map-lookup
Trapping Rain Water|H|arrays|two-pointer-converging
Longest Consecutive Sequence|M|arrays|hash-map-lookup
Sort Colors|M|arrays|two-pointer-converging
Merge Intervals|M|arrays|greedy-interval
Insert Interval|M|arrays|greedy-interval
Game of Life|M|arrays|one-pass-min-tracking
Valid Anagram|E|strings|frequency-counter
Valid Palindrome|E|strings|two-pointer-converging
Reverse String|E|strings|two-pointer-converging
Longest Common Prefix|E|strings|trie-prefix
Group Anagrams|M|strings|frequency-counter
Longest Palindromic Substring|M|strings|two-pointer-converging
Palindromic Substrings|M|strings|two-pointer-converging
String to Integer atoi|M|strings|one-pass-min-tracking
Reverse Words in a String|M|strings|two-pointer-converging
Implement strStr|E|strings|fixed-sliding-window
Valid Palindrome II|E|strings|two-pointer-converging
Roman to Integer|E|strings|hash-map-lookup
Integer to Roman|M|strings|greedy-interval
Zigzag Conversion|M|strings|one-pass-min-tracking
Count and Say|M|strings|one-pass-min-tracking
Multiply Strings|M|strings|one-pass-min-tracking
Add Binary|E|strings|one-pass-min-tracking
Isomorphic Strings|E|strings|hash-map-lookup
Word Pattern|E|strings|hash-map-lookup
First Unique Character in a String|E|strings|frequency-counter
Ransom Note|E|strings|frequency-counter
Decode String|M|strings|auxiliary-stack
Text Justification|H|strings|greedy-interval
Minimum Window Substring|H|strings|variable-sliding-window
Happy Number|E|hashing|fast-slow-pointers
Two Sum II Input Array Is Sorted|M|hashing|two-pointer-converging
Top K Frequent Elements|M|hashing|top-k-heap
Contains Duplicate II|E|hashing|fixed-sliding-window
Intersection of Two Arrays|E|hashing|hash-map-lookup
Four Sum II|M|hashing|hash-map-lookup
Longest Harmonious Subsequence|E|hashing|frequency-counter
Encode and Decode Strings|M|hashing|frequency-counter
Valid Sudoku|M|hashing|hash-map-lookup
Continuous Subarray Sum|M|hashing|hash-map-lookup
Brick Wall|M|hashing|frequency-counter
Insert Delete GetRandom O1|M|hashing|hash-map-lookup
LRU Cache|M|hashing|hash-map-lookup
Three Sum|M|two-pointers|two-pointer-converging
Three Sum Closest|M|two-pointers|two-pointer-converging
Four Sum|M|two-pointers|two-pointer-converging
Container With Most Water|M|two-pointers|two-pointer-converging
Squares of a Sorted Array|E|two-pointers|two-pointer-converging
Boats to Save People|M|two-pointers|two-pointer-converging
Remove Element|E|two-pointers|two-pointer-converging
Is Subsequence|E|two-pointers|two-pointer-converging
Backspace String Compare|E|two-pointers|two-pointer-converging
Partition Labels|M|two-pointers|greedy-interval
Minimum Size Subarray Sum|M|sliding-window|variable-sliding-window
Longest Repeating Character Replacement|M|sliding-window|variable-sliding-window
Permutation in String|M|sliding-window|fixed-sliding-window
Find All Anagrams in a String|M|sliding-window|fixed-sliding-window
Maximum Average Subarray I|E|sliding-window|fixed-sliding-window
Sliding Window Maximum|H|sliding-window|monotonic-stack
Fruit Into Baskets|M|sliding-window|variable-sliding-window
Max Consecutive Ones III|M|sliding-window|variable-sliding-window
Subarray Product Less Than K|M|sliding-window|variable-sliding-window
Substring with Concatenation of All Words|H|sliding-window|fixed-sliding-window
Grumpy Bookstore Owner|M|sliding-window|fixed-sliding-window
Maximum Points You Can Obtain from Cards|M|sliding-window|fixed-sliding-window
Count Number of Nice Subarrays|M|sliding-window|variable-sliding-window
Search Insert Position|E|binary-search|classic-binary-search
First Bad Version|E|binary-search|classic-binary-search
Sqrt x|E|binary-search|binary-search-on-answer
Find First and Last Position of Element in Sorted Array|M|binary-search|classic-binary-search
Find Minimum in Rotated Sorted Array|M|binary-search|rotated-binary-search
Search a 2D Matrix|M|binary-search|classic-binary-search
Find Peak Element|M|binary-search|classic-binary-search
Koko Eating Bananas|M|binary-search|binary-search-on-answer
Capacity To Ship Packages Within D Days|M|binary-search|binary-search-on-answer
Time Based Key Value Store|M|binary-search|classic-binary-search
Split Array Largest Sum|H|binary-search|binary-search-on-answer
Median of Two Sorted Arrays|H|binary-search|classic-binary-search
Single Element in a Sorted Array|M|binary-search|classic-binary-search
Minimum Number of Days to Make m Bouquets|M|binary-search|binary-search-on-answer
Linked List Cycle|E|linked-list|fast-slow-pointers
Linked List Cycle II|M|linked-list|fast-slow-pointers
Middle of the Linked List|E|linked-list|fast-slow-pointers
Palindrome Linked List|E|linked-list|fast-slow-pointers
Remove Nth Node From End of List|M|linked-list|fast-slow-pointers
Reorder List|M|linked-list|pointer-reversal
Add Two Numbers|M|linked-list|merge-two-lists
Intersection of Two Linked Lists|E|linked-list|fast-slow-pointers
Remove Linked List Elements|E|linked-list|pointer-reversal
Reverse Linked List II|M|linked-list|pointer-reversal
Reverse Nodes in k Group|H|linked-list|pointer-reversal
Copy List with Random Pointer|M|linked-list|hash-map-lookup
Merge k Sorted Lists|H|linked-list|top-k-heap
Sort List|M|linked-list|merge-two-lists
Rotate List|M|linked-list|fast-slow-pointers
Odd Even Linked List|M|linked-list|pointer-reversal
Swap Nodes in Pairs|M|linked-list|pointer-reversal
Daily Temperatures|M|stack|monotonic-stack
Next Greater Element I|E|stack|monotonic-stack
Next Greater Element II|M|stack|monotonic-stack
Evaluate Reverse Polish Notation|M|stack|auxiliary-stack
Generate Parentheses|M|stack|backtracking-choose-explore
Car Fleet|M|stack|monotonic-stack
Largest Rectangle in Histogram|H|stack|monotonic-stack
Asteroid Collision|M|stack|auxiliary-stack
Simplify Path|M|stack|auxiliary-stack
Online Stock Span|M|stack|monotonic-stack
Remove K Digits|M|stack|monotonic-stack
Basic Calculator|H|stack|auxiliary-stack
Longest Valid Parentheses|H|stack|bracket-matching
Minimum Remove to Make Valid Parentheses|M|stack|bracket-matching
Implement Queue using Stacks|E|queue|auxiliary-stack
Implement Stack using Queues|E|queue|auxiliary-stack
Design Circular Queue|M|queue|auxiliary-stack
Number of Recent Calls|E|queue|bfs-level-order
Moving Average from Data Stream|E|queue|fixed-sliding-window
Task Scheduler|M|queue|top-k-heap
Shortest Subarray with Sum at Least K|H|queue|monotonic-stack
Dota2 Senate|M|queue|greedy-interval
Pow x n|M|recursion|dfs-tree-traversal
Fibonacci Number|E|recursion|linear-dp
Power of Two|E|recursion|xor-trick
K th Symbol in Grammar|M|recursion|dfs-tree-traversal
Different Ways to Add Parentheses|M|recursion|dfs-tree-traversal
Subsets|M|backtracking|backtracking-choose-explore
Subsets II|M|backtracking|backtracking-choose-explore
Permutations|M|backtracking|backtracking-choose-explore
Permutations II|M|backtracking|backtracking-choose-explore
Combination Sum|M|backtracking|backtracking-choose-explore
Combination Sum II|M|backtracking|backtracking-choose-explore
Combinations|M|backtracking|backtracking-choose-explore
Letter Combinations of a Phone Number|M|backtracking|backtracking-choose-explore
Word Search|M|backtracking|backtracking-choose-explore
Palindrome Partitioning|M|backtracking|backtracking-choose-explore
N Queens|H|backtracking|backtracking-choose-explore
Sudoku Solver|H|backtracking|backtracking-choose-explore
Restore IP Addresses|M|backtracking|backtracking-choose-explore
Maximum Depth of Binary Tree|E|trees|dfs-tree-traversal
Invert Binary Tree|E|trees|dfs-tree-traversal
Same Tree|E|trees|dfs-tree-traversal
Symmetric Tree|E|trees|dfs-tree-traversal
Subtree of Another Tree|E|trees|dfs-tree-traversal
Diameter of Binary Tree|E|trees|dfs-tree-traversal
Balanced Binary Tree|E|trees|dfs-tree-traversal
Path Sum|E|trees|dfs-tree-traversal
Path Sum II|M|trees|backtracking-choose-explore
Binary Tree Right Side View|M|trees|bfs-level-order
Binary Tree Zigzag Level Order Traversal|M|trees|bfs-level-order
Count Good Nodes in Binary Tree|M|trees|dfs-tree-traversal
Construct Binary Tree from Preorder and Inorder Traversal|M|trees|dfs-tree-traversal
Lowest Common Ancestor of a Binary Tree|M|trees|dfs-tree-traversal
Flatten Binary Tree to Linked List|M|trees|dfs-tree-traversal
Populating Next Right Pointers in Each Node|M|trees|bfs-level-order
Binary Tree Maximum Path Sum|H|trees|dfs-tree-traversal
Serialize and Deserialize Binary Tree|H|trees|bfs-level-order
Vertical Order Traversal of a Binary Tree|H|trees|bfs-level-order
Validate Binary Search Tree|M|bst|bst-ordering
Kth Smallest Element in a BST|M|bst|bst-ordering
Search in a Binary Search Tree|E|bst|bst-ordering
Insert into a Binary Search Tree|M|bst|bst-ordering
Delete Node in a BST|M|bst|bst-ordering
Convert Sorted Array to Binary Search Tree|E|bst|bst-ordering
Two Sum IV Input is a BST|E|bst|bst-ordering
Binary Search Tree Iterator|M|bst|bst-ordering
Recover Binary Search Tree|M|bst|bst-ordering
Kth Largest Element in an Array|M|heap|top-k-heap
Kth Largest Element in a Stream|E|heap|top-k-heap
Last Stone Weight|E|heap|top-k-heap
K Closest Points to Origin|M|heap|top-k-heap
Find Median from Data Stream|H|heap|top-k-heap
Reorganize String|M|heap|top-k-heap
Design Twitter|M|heap|top-k-heap
IPO|H|heap|top-k-heap
Find K Pairs with Smallest Sums|M|heap|top-k-heap
Jump Game|M|greedy|greedy-interval
Jump Game II|M|greedy|greedy-interval
Gas Station|M|greedy|greedy-interval
Hand of Straights|M|greedy|greedy-interval
Non overlapping Intervals|M|greedy|greedy-interval
Minimum Number of Arrows to Burst Balloons|M|greedy|greedy-interval
Assign Cookies|E|greedy|greedy-interval
Lemonade Change|E|greedy|greedy-interval
Candy|H|greedy|greedy-interval
Valid Parenthesis String|M|greedy|bracket-matching
Meeting Rooms II|M|greedy|greedy-interval
Max Area of Island|M|graphs|grid-flood-fill
Pacific Atlantic Water Flow|M|graphs|grid-flood-fill
Surrounded Regions|M|graphs|grid-flood-fill
Rotting Oranges|M|graphs|bfs-level-order
Walls and Gates|M|graphs|bfs-level-order
Course Schedule|M|graphs|graph-clone-traversal
Course Schedule II|M|graphs|graph-clone-traversal
Redundant Connection|M|graphs|union-find
Number of Connected Components in an Undirected Graph|M|graphs|union-find
Graph Valid Tree|M|graphs|union-find
Word Ladder|H|graphs|bfs-level-order
Network Delay Time|M|graphs|bfs-level-order
Cheapest Flights Within K Stops|M|graphs|bfs-level-order
Min Cost to Connect All Points|M|graphs|union-find
Swim in Rising Water|H|graphs|top-k-heap
Alien Dictionary|H|graphs|graph-clone-traversal
Is Graph Bipartite|M|graphs|bfs-level-order
Flood Fill|E|graphs|grid-flood-fill
Shortest Path in Binary Matrix|M|graphs|bfs-level-order
Unique Paths|M|dynamic-programming|linear-dp
Unique Paths II|M|dynamic-programming|linear-dp
Min Cost Climbing Stairs|E|dynamic-programming|linear-dp
House Robber II|M|dynamic-programming|linear-dp
Decode Ways|M|dynamic-programming|linear-dp
Word Break|M|dynamic-programming|linear-dp
Longest Common Subsequence|M|dynamic-programming|lis-dp
Edit Distance|H|dynamic-programming|lis-dp
Partition Equal Subset Sum|M|dynamic-programming|unbounded-knapsack
Coin Change II|M|dynamic-programming|unbounded-knapsack
Target Sum|M|dynamic-programming|unbounded-knapsack
Perfect Squares|M|dynamic-programming|unbounded-knapsack
Minimum Path Sum|M|dynamic-programming|linear-dp
Maximal Square|M|dynamic-programming|linear-dp
Triangle|M|dynamic-programming|linear-dp
Interleaving String|M|dynamic-programming|lis-dp
Distinct Subsequences|H|dynamic-programming|lis-dp
Burst Balloons|H|dynamic-programming|linear-dp
Regular Expression Matching|H|dynamic-programming|lis-dp
Best Time to Buy and Sell Stock with Cooldown|M|dynamic-programming|linear-dp
Longest Palindromic Subsequence|M|dynamic-programming|lis-dp
Russian Doll Envelopes|H|dynamic-programming|lis-dp
Single Number|E|bit-manipulation|xor-trick
Number of 1 Bits|E|bit-manipulation|xor-trick
Counting Bits|E|bit-manipulation|xor-trick
Reverse Bits|E|bit-manipulation|xor-trick
Sum of Two Integers|M|bit-manipulation|xor-trick
Single Number II|M|bit-manipulation|xor-trick
Single Number III|M|bit-manipulation|xor-trick
Reverse Integer|M|bit-manipulation|xor-trick
Implement Trie Prefix Tree|M|trie|trie-prefix
Design Add and Search Words Data Structure|M|trie|trie-prefix
Word Search II|H|trie|trie-prefix
Replace Words|M|trie|trie-prefix
Search Suggestions System|M|trie|trie-prefix
Maximum XOR of Two Numbers in an Array|M|trie|trie-prefix
Number of Provinces|M|advanced|union-find
Accounts Merge|M|advanced|union-find
Range Sum Query Mutable|M|advanced|union-find
Count of Smaller Numbers After Self|H|advanced|union-find
Longest Increasing Path in a Matrix|H|advanced|grid-flood-fill
Critical Connections in a Network|H|advanced|graph-clone-traversal
Making A Large Island|H|advanced|union-find
Reconstruct Itinerary|H|advanced|graph-clone-traversal
`;

const D: Record<string, Difficulty> = { E: "Easy", M: "Medium", H: "Hard" };

export function buildExtraProblems(): Problem[] {
  return RAW.trim()
    .split("\n")
    .map((line, i) => {
      const [title, d, topic, pattern] = line.split("|");
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const name = pattern.replace(/-/g, " ");
      return {
        slug,
        title,
        topic,
        pattern,
        difficulty: D[d],
        description: `Solve "${title}". Read the full statement on the linked practice page, then work through the steps here.`,
        examples: [],
        constraints: [],
        hints: [
          `This problem is a classic use of the ${name} pattern.`,
          "Start with a brute force solution, then find the repeated work you can remove.",
        ],
        bruteForce: "Try every possibility directly and check each one. Note its time cost.",
        optimizedApproach: `Apply the ${name} pattern to avoid the repeated work of the brute force.`,
        explanation: `Identify why ${name} fits: look at the input shape and what the question asks you to find.`,
        timeComplexity: "Depends on approach — aim to beat brute force",
        spaceComplexity: "Depends on approach",
        starterCode: {
          cpp: "class Solution {\npublic:\n    // your code here\n};",
          javascript: "// your code here\n",
          python: "class Solution:\n    pass\n",
          java: "class Solution {\n    // your code here\n}",
        },
        solutionCode: "",
        externalUrl: `https://leetcode.com/problems/${slug}/`,
        isPremium: d === "H" && i % 2 === 0,
      } satisfies Problem;
    });
}
