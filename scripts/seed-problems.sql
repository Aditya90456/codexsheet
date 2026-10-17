-- =============================================================
-- CodexSheet — Real problem content & test cases for 51–250
-- Run this in Supabase SQL Editor AFTER supabase.sql has run.
-- Problems 1–50 are already seeded in supabase.sql.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- PROBLEMS 51–100  (Monotonic Stack · Binary Search · Linked List · Trees)
-- ─────────────────────────────────────────────────────────────
insert into public.dsa_problem_content (problem_number, description, constraints, examples)
values
(51, 'Read n and n integers. Print the next greater element for each position; print -1 if none exists. Use a stack to achieve O(n).', array['1 <= n <= 100000', 'Values fit in a signed 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n4 5 2 25 7', 'output', '5 25 25 -1 -1'))),
(52, 'Read n and a sequence of stock prices across n days. Print the span for each day — the maximum number of consecutive days before today (including today) where the price was less than or equal to today''s price.', array['1 <= n <= 100000', 'Prices are positive integers'], jsonb_build_array(jsonb_build_object('input', E'7\n100 80 60 70 60 75 85', 'output', '1 1 1 2 1 4 6'))),
(53, 'Read n and n heights of vertical bars. Print the area of the largest rectangle that can be formed using contiguous bars.', array['1 <= n <= 100000', 'Heights are non-negative integers'], jsonb_build_array(jsonb_build_object('input', E'6\n2 1 5 6 2 3', 'output', '10'))),
(54, 'Read row count m, column count n, then m rows of non-negative integer heights forming a histogram matrix. Print the area of the largest rectangle of 1s.', array['1 <= m,n <= 200', 'Values are 0 or 1'], jsonb_build_array(jsonb_build_object('input', E'4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0', 'output', '6'))),
(55, 'Read n and n integers. For each element print the previous smaller element to its left, or -1 if none exists.', array['1 <= n <= 100000', 'Values fit in a signed 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n4 5 2 10 8', 'output', '-1 4 -1 2 2'))),
(56, 'Read n and n integers representing a circular array. Print the next greater element for each position in the circular sense; print -1 if none exists.', array['1 <= n <= 10000', 'Values fit in a signed 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n1 2 1 3 2', 'output', '2 3 3 -1 3'))),
(57, 'Read a string of digits and integer k. Remove exactly k digits to form the smallest possible number. Print the result without leading zeros, or "0" if the result is zero.', array['1 <= string length <= 100000', '0 <= k <= string length', 'String contains only digit characters'], jsonb_build_array(jsonb_build_object('input', E'1432219 3', 'output', '1219'))),
(58, 'Read a string. Print the length of the longest valid (well-formed) parentheses substring.', array['0 <= string length <= 30000', 'String contains only ( and )'], jsonb_build_array(jsonb_build_object('input', ')()())', 'output', '4'))),
(59, 'Read n, then n integers. Print the sum of subarray minimums over all contiguous subarrays modulo 10^9+7.', array['1 <= n <= 30000', 'Values fit in a signed 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'4\n3 1 2 4', 'output', '17'))),
(60, 'Read n, then n integers. Find how many subarrays have their maximum equal to exactly k. Print the count.', array['1 <= n <= 50000', '1 <= k <= max value'], jsonb_build_array(jsonb_build_object('input', E'5 3\n3 2 3 1 3', 'output', '6'))),

(61, 'Read n, then a sorted array of n distinct integers. Print the index where a given target should be inserted to keep the array sorted (0-indexed). Target is given on the first line.', array['1 <= n <= 10000', 'Values and target fit in a signed 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5 5\n1 3 5 6 7', 'output', '2'))),
(62, 'Read two sorted arrays and their sizes m and n. Print the median of the combined array. Print as an integer if whole, otherwise as a decimal with one place.', array['0 <= m,n <= 1000', 'Values fit in a signed 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'2 2\n1 3\n2 4', 'output', '2.5'))),
(63, 'Read n and a sorted array of integers that has been rotated at an unknown pivot. Print the minimum element.', array['1 <= n <= 5000', 'All values are distinct'], jsonb_build_array(jsonb_build_object('input', E'5\n3 4 5 1 2', 'output', '1'))),
(64, 'Read n and a rotated sorted array, followed by a target. Print the index of the target or -1 if not found.', array['1 <= n <= 5000', 'All values are distinct'], jsonb_build_array(jsonb_build_object('input', E'7 0\n4 5 6 7 0 1 2', 'output', '4'))),
(65, 'Read n and a sorted array with possible duplicates, then a target. Print the first and last index of the target, or "-1 -1" if not present.', array['0 <= n <= 100000', 'Values and target fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'8 8\n5 7 7 8 8 10 11 11', 'output', '3 4'))),
(66, 'Read a positive integer n. Print the integer square root (floor) without using sqrt().', array['0 <= n <= 2^31 - 1'], jsonb_build_array(jsonb_build_object('input', '8', 'output', '2'))),
(67, 'Read n and an array of n non-negative integers where every element appears twice except one. Print the element that appears only once. Use O(1) extra space.', array['1 <= n <= 300000 (odd)', 'All duplicates appear exactly twice'], jsonb_build_array(jsonb_build_object('input', E'7\n2 2 1 1 3 4 4', 'output', '3'))),
(68, 'Read n and a mountain array (strictly increases then strictly decreases). Print the peak index.', array['3 <= n <= 100000', 'Distinct values'], jsonb_build_array(jsonb_build_object('input', E'7\n0 1 0 3 5 2 -1', 'output', '4'))),
(69, 'Read n and a sorted array. Print the count of a given target value using only O(log n) time. Target is given on the first line.', array['1 <= n <= 100000', 'Values and target fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'8 8\n5 7 7 8 8 10 11 11', 'output', '2'))),
(70, 'Read m and n. Print the k-th smallest element in an m×n multiplication table. k is given on the first line.', array['1 <= m,n <= 30000', '1 <= k <= m*n'], jsonb_build_array(jsonb_build_object('input', E'5\n3 3', 'output', '3'))),

(71, 'Read n and a linked list. Detect whether it has a cycle. Print "true" or "false".', array['0 <= n <= 10000', 'Values fit in a 32-bit integer', 'Cycle entry index (-1 means no cycle) given on second line'], jsonb_build_array(jsonb_build_object('input', E'4\n3 2 0 -4\n1', 'output', 'true'))),
(72, 'Read n and a linked list with cycle entry index. Print the index (0-based) of the node where the cycle starts, or -1.', array['0 <= n <= 10000', '-1 means no cycle'], jsonb_build_array(jsonb_build_object('input', E'4\n3 2 0 -4\n1', 'output', '1'))),
(73, 'Read n and a linked list. Print the middle node value. If two middles exist, print the second one.', array['1 <= n <= 100'], jsonb_build_array(jsonb_build_object('input', E'5\n1 2 3 4 5', 'output', '3'))),
(74, 'Read n and a linked list. Rotate it to the right by k places. Print the resulting values. k is given on the first line.', array['0 <= n <= 500', '0 <= k <= 2000000'], jsonb_build_array(jsonb_build_object('input', E'2\n5\n1 2 3 4 5', 'output', '4 5 1 2 3'))),
(75, 'Read two non-negative integers represented as linked lists in reverse order. Add them and print the sum as a reversed linked list.', array['0 <= each list length <= 100', 'Digits are 0-9', 'No leading zeros except the number 0'], jsonb_build_array(jsonb_build_object('input', E'3 3\n2 4 3\n5 6 4', 'output', '7 0 8'))),
(76, 'Read n and a linked list. Swap adjacent pairs of nodes and print the result.', array['0 <= n <= 100'], jsonb_build_array(jsonb_build_object('input', E'4\n1 2 3 4', 'output', '2 1 4 3'))),
(77, 'Read n and a linked list. Partition it around value k so all nodes less than k come before nodes >= k, preserving original relative order. Print the result. k is given on the first line.', array['0 <= n <= 200', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'3\n5\n1 4 3 2 5 2', 'output', '1 2 2 4 3 5'))),
(78, 'Read k and k sorted linked lists (each on one line as space-separated values). Merge all into one sorted list and print the values.', array['0 <= k <= 10000', 'Total nodes <= 500'], jsonb_build_array(jsonb_build_object('input', E'3\n1 4 5\n1 3 4\n2 6', 'output', '1 1 2 3 4 4 5 6'))),
(79, 'Read n and a sorted linked list with possible duplicates. Remove all nodes that have duplicate values (keep only nodes that appear exactly once) and print the result.', array['0 <= n <= 300', 'Values are sorted'], jsonb_build_array(jsonb_build_object('input', E'7\n1 2 3 3 4 4 5', 'output', '1 2 5'))),
(80, 'Read n and n values for a doubly linked list. Flatten it: each node may have a child pointer to another doubly linked list. Input gives parent values then child insertion positions. Print the flattened list.', array['0 <= n <= 1500'], jsonb_build_array(jsonb_build_object('input', E'5\n1 2 3 4 5\nchild at 3: 7 8 9', 'output', '1 2 3 7 8 9 4 5'))),

(81, 'Read a binary tree in level-order (null for missing nodes). Print the diameter — the longest path between any two nodes measured in edges.', array['0 <= n <= 10000', 'Node values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', '1 2 3 4 5', 'output', '3'))),
(82, 'Read a binary tree in level-order. Print the lowest common ancestor of two given nodes p and q. p and q are given on a second line.', array['2 <= n <= 100000', 'All node values are unique', 'p and q exist in the tree'], jsonb_build_array(jsonb_build_object('input', E'6 2 8 0 4 7 9 null null 3 5\n2 8', 'output', '6'))),
(83, 'Read n and n node values forming a complete binary tree in level-order. Print the count of nodes.', array['0 <= n <= 100000'], jsonb_build_array(jsonb_build_object('input', E'6\n1 2 3 4 5 6', 'output', '6'))),
(84, 'Read a binary tree in level-order. Print all root-to-leaf paths as space-separated values, one path per line in top-left to bottom-right order.', array['1 <= n <= 100', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', '1 2 3 null 5', 'output', E'1 2 5\n1 3'))),
(85, 'Read a binary tree in level-order and a target sum. Print true if any root-to-leaf path sums to the target, otherwise false.', array['0 <= n <= 5000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'22\n5 4 8 11 null 13 4 7 2 null null null 1', 'output', 'true'))),
(86, 'Read a binary tree in level-order and a target sum. Print all root-to-leaf paths that sum to the target, one per line.', array['0 <= n <= 5000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'22\n5 4 8 11 null 13 4 7 2 null null null 1', 'output', '5 4 11 2'))),
(87, 'Read a binary tree in level-order. Print the right side view: the last node of each level, top to bottom.', array['0 <= n <= 100'], jsonb_build_array(jsonb_build_object('input', '1 2 3 null 5 null 4', 'output', '1 3 4'))),
(88, 'Read a binary tree in level-order. Serialize and then deserialize it back. Print the level-order representation of the deserialized tree (null for missing nodes, trim trailing nulls).', array['0 <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', '1 2 3 4 5', 'output', '1 2 3 4 5'))),
(89, 'Read a binary tree in level-order. Print the maximum path sum. A path can start and end at any node.', array['1 <= n <= 30000', '-1000 <= node values <= 1000'], jsonb_build_array(jsonb_build_object('input', '-10 9 20 null null 15 7', 'output', '42'))),
(90, 'Read a binary search tree in level-order and a target sum k. Print true if two nodes in the tree sum to k, otherwise false.', array['1 <= n <= 10000', '1 <= k <= 10^7'], jsonb_build_array(jsonb_build_object('input', E'9\n5 3 6 2 4 null 7', 'output', 'true'))),

(91, 'Read a binary tree in level-order. Check if it is symmetric. Print true or false.', array['1 <= n <= 1000'], jsonb_build_array(jsonb_build_object('input', '1 2 2 3 4 4 3', 'output', 'true'))),
(92, 'Read a binary tree in level-order. Print the sum of all left leaves.', array['1 <= n <= 1000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', '3 9 20 null null 15 7', 'output', '24'))),
(93, 'Read a sorted array of distinct integers. Construct a height-balanced BST and print it in level-order (null for missing nodes, trim trailing nulls).', array['1 <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'7\n-10 -3 0 5 9 12 14', 'output', '0 -3 9 -10 null 5 12 null null null null null 14'))),
(94, 'Read a binary search tree in level-order and two values lo and hi. Print the sum of all node values in the inclusive range [lo, hi].', array['1 <= n <= 40000', 'Node values and bounds fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'7 15\n10 5 15 3 7 null 18', 'output', '32'))),
(95, 'Read a binary tree in level-order. Print the number of paths (not necessarily root-to-leaf) whose values sum to a given target. Target on first line.', array['0 <= n <= 1000', '-10^9 <= values, target <= 10^9'], jsonb_build_array(jsonb_build_object('input', E'8\n10 5 -3 3 2 null 11 3 -2 null 1', 'output', '3'))),
(96, 'Read a binary tree in level-order. Tilt is the absolute difference of left and right subtree sums. Print the total tilt of all nodes.', array['0 <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', '4 2 9 3 5 null 7', 'output', '15'))),
(97, 'Read two binary trees in level-order on separate lines. Merge them by summing overlapping nodes. Print the merged tree in level-order.', array['0 <= n <= 2000'], jsonb_build_array(jsonb_build_object('input', E'1 3 2 5\n2 1 3 null 4 null 7', 'output', '3 4 5 5 4 null 7'))),
(98, 'Read a binary tree in level-order. Print the average value of nodes on each level, one per line, rounded to 5 decimal places.', array['1 <= n <= 10000', 'Node values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', '3 9 20 15 7', 'output', E'3.00000\n14.50000\n11.00000'))),
(99, 'Read n and n distinct values. Build a binary tree that is both a BST and a max-heap (treap property). Print the level-order traversal.', array['1 <= n <= 100', 'All values are distinct positive integers'], jsonb_build_array(jsonb_build_object('input', E'3\n5 10 40', 'output', '40 10 5'))),
(100, 'Read a BST in level-order. Convert it to a Greater Sum Tree (each node gets the sum of all greater values added to it). Print the new level-order.', array['0 <= n <= 100', 'No two values are the same', '0 <= values <= 100'], jsonb_build_array(jsonb_build_object('input', '4 1 6 0 2 5 7 null null null 3 null null null 8', 'output', '30 36 21 36 35 26 15 null null null 33 null null null 8')))
on conflict (problem_number) do update
  set description = excluded.description,
      constraints = excluded.constraints,
      examples    = excluded.examples,
      updated_at  = now();

-- ─────────────────────────────────────────────────────────────
-- PROBLEMS 101–150  (Backtracking · Graphs · Tries · Heaps)
-- ─────────────────────────────────────────────────────────────
insert into public.dsa_problem_content (problem_number, description, constraints, examples)
values
(101, 'Read n and n distinct integers. Print all subsets that sum to a given target, one per line with values ascending; print {} for empty set. Target on first line.', array['1 <= n <= 20', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'9\n4\n1 2 3', 'output', '2 3\nnote: subsets summing to 4 only'))),
(102, 'Read a string of digits from 2–9. Print all letter combinations that the number could represent (phone keypad), one per line in lexicographic order.', array['0 <= input length <= 4', 'Input contains only digit characters 2-9'], jsonb_build_array(jsonb_build_object('input', '23', 'output', E'ad\nae\naf\nbd\nbe\nbf\ncd\nce\ncf'))),
(103, 'Read n and n numbers with possible duplicates. Print all unique subsets, one per line, values ascending; lines in lexicographic order.', array['1 <= n <= 20', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'4\n1 2 2 3', 'output', E'{}\n1\n1 2\n1 2 2\n1 2 2 3\n1 2 3\n1 3\n2\n2 2\n2 2 3\n2 3\n3'))),
(104, 'Read candidate count, target, then candidates (may contain duplicates, use each once). Print unique combinations summing to target, values ascending, lines lexicographic.', array['1 <= candidates <= 100', '1 <= target <= 30', 'All candidates are positive'], jsonb_build_array(jsonb_build_object('input', E'5 8\n10 1 2 7 6 1 5', 'output', E'1 1 6\n1 2 5\n1 7\n2 6'))),
(105, 'Read a partially filled 9×9 Sudoku board as 9 lines of 9 characters (digits or .). Solve it and print the completed board.', array['Input is always a valid Sudoku puzzle with a unique solution'], jsonb_build_array(jsonb_build_object('input', E'53..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79', 'output', E'534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179'))),
(106, 'Read a string of characters. Print all unique permutations in lexicographic order, one per line.', array['1 <= string length <= 8', 'Lowercase letters only'], jsonb_build_array(jsonb_build_object('input', 'aba', 'output', E'aab\naba\nbaa'))),
(107, 'Read m and n. Print all valid combinations of m pairs of parentheses.', array['1 <= m <= 8'], jsonb_build_array(jsonb_build_object('input', '3', 'output', E'((()))\n(()())\n(())()\n()(())\n()()()'))),
(108, 'Read a string and a dictionary size, then dictionary words. Print all ways to segment the string into dictionary words, one per line in lexicographic order.', array['1 <= string length <= 20', '1 <= dictionary size <= 1000'], jsonb_build_array(jsonb_build_object('input', E'catsanddog\n4\ncat cats and sand dog', 'output', E'cat sand dog\ncats and dog'))),
(109, 'Read a board (m rows × n cols of uppercase letters) and a word list. Print all words from the list that can be found in the board by adjacent letters (no reuse). One per line sorted.', array['1 <= m,n <= 12', '1 <= word count <= 30000'], jsonb_build_array(jsonb_build_object('input', E'4 4\noaan\netae\nihsr\niflv\neat oath', 'output', E'eat\noath'))),
(110, 'Read an expression as a string containing digits and +,*,-. Print all possible results by adding parentheses in all ways. Print unique results, one per line, sorted.', array['1 <= expression length <= 20', 'Expression is always valid'], jsonb_build_array(jsonb_build_object('input', '2-1-1', 'output', E'-2\n0\n0\n2'))),

(111, 'Read vertex count n and edge count m, followed by m undirected edges. Print all connected components, one per line, sorted internally and lines sorted.', array['1 <= n <= 100', '0 <= m <= n*(n-1)/2'], jsonb_build_array(jsonb_build_object('input', E'6 4\n1 2\n2 3\n4 5\n6 6', 'output', E'1 2 3\n4 5\n6'))),
(112, 'Read vertex count n, edge count m, then directed edges. Print all nodes that can reach every other node in the graph (universal sinks). Sort the output.', array['1 <= n <= 100', '0 <= m <= 100'], jsonb_build_array(jsonb_build_object('input', E'4 3\n0 1\n1 2\n2 3', 'output', '3'))),
(113, 'Read a grid (m rows × n cols) of 0 and 1. Print the shortest path length from top-left to bottom-right through 0-cells (8-directional), or -1 if impossible.', array['1 <= m,n <= 100', 'Values are 0 or 1'], jsonb_build_array(jsonb_build_object('input', E'3 3\n0 0 0\n1 1 0\n1 1 0', 'output', '4'))),
(114, 'Read a grid (m rows × n cols) of land (1) and water (0). Print the perimeter of the single island.', array['1 <= m,n <= 100', 'Grid contains exactly one island with no lakes'], jsonb_build_array(jsonb_build_object('input', E'4 4\n0 1 0 0\n1 1 1 0\n0 1 0 0\n1 1 0 0', 'output', '16'))),
(115, 'Read a grid of land (1) and water (0). Print the area of the largest island.', array['1 <= m,n <= 50'], jsonb_build_array(jsonb_build_object('input', E'4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 0 1 1\n0 0 0 1 1', 'output', '4'))),
(116, 'Read vertex count n, edge count m, then weighted directed edges (u v w). Print the shortest distance from source 0 to every vertex using Dijkstra. Source on first line.', array['1 <= n <= 100', '1 <= m <= 10000', 'Weights are positive integers'], jsonb_build_array(jsonb_build_object('input', E'5 7\n0 1 10\n0 2 3\n1 3 2\n2 1 4\n2 3 8\n2 4 2\n3 4 5\n4 3 1', 'output', '0 7 3 9 5'))),
(117, 'Read vertex count n and edge count m, then directed edges. Print all nodes in topological order (any valid order). If a cycle exists, print "cycle detected".', array['1 <= n <= 10000', '0 <= m <= 100000'], jsonb_build_array(jsonb_build_object('input', E'6 6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1', 'output', '5 4 2 3 1 0'))),
(118, 'Read vertex count n, edge count m, then undirected edges. Print the number of bridges (edges whose removal disconnects the graph).', array['1 <= n <= 1000', '0 <= m <= 3000'], jsonb_build_array(jsonb_build_object('input', E'5 5\n1 0\n0 2\n2 1\n0 3\n3 4', 'output', '2'))),
(119, 'Read vertex count n, edge count m, then undirected edges. Print all articulation points (vertices whose removal disconnects the graph), sorted.', array['1 <= n <= 1000', '0 <= m <= 3000'], jsonb_build_array(jsonb_build_object('input', E'5 5\n1 0\n0 2\n2 1\n0 3\n3 4', 'output', '0 3'))),
(120, 'Read vertex count n and edge count m, then directed edges. Print the number of strongly connected components using Kosaraju''s or Tarjan''s algorithm.', array['1 <= n <= 100000', '0 <= m <= 200000'], jsonb_build_array(jsonb_build_object('input', E'5 5\n1 0\n0 2\n2 1\n0 3\n3 4', 'output', '3'))),

(121, 'Read a list of words. Build a trie. Then read queries: "insert w", "search w", "startsWith p". Print "true" or "false" for search and startsWith. Query count on second line.', array['1 <= word length <= 2000', 'Lowercase letters only', '1 <= queries <= 30000'], jsonb_build_array(jsonb_build_object('input', E'4\ninsert apple\nsearch apple\nsearch app\nstartsWith app', 'output', E'true\nfalse\ntrue'))),
(122, 'Read a list of words. Print the longest word in the dictionary that can be built one character at a time by other words in the dictionary. If tie, print lexicographically smallest.', array['1 <= words <= 1000', '1 <= word length <= 30', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'6\nw\nwo\nwor\nworl\nworld\nword', 'output', 'world'))),
(123, 'Read n words and m query prefixes. For each prefix print the top 3 lexicographically smallest words from the list that start with that prefix. Print "null" if fewer than 3.', array['1 <= n <= 1000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'5\nmobile\nmouse\nmoneypot\nmonitor\nmaxi\nmouse', 'output', E'maxi mobile moneypot\nmaxi mobile moneypot\nmaxi mobile moneypot\nmobile\nmobile moneypot\nmobile moneypot monitor'))),
(124, 'Read n and a list of n lowercase words. Print all pairs (i,j) where i<j such that words[i]+words[j] is a palindrome. Print index pairs one per line.', array['1 <= n <= 5000', '0 <= word length <= 300'], jsonb_build_array(jsonb_build_object('input', E'3\nbat\ntab\ncat', 'output', E'0 1\n1 0'))),
(125, 'Read a 4×4 board (space-separated letters) and a dictionary of words. Find all words from the dictionary present in the board via adjacent cells without reuse. Print sorted.', array['Board is exactly 4×4', '1 <= dictionary size <= 30000', 'Words contain lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'o a a n\ne t a e\ni h k r\ni f l v\neat oath', 'output', E'eat\noath'))),
(126, 'Read n lowercase strings. Replace each with its shortest abbreviation: first letter + count-of-middle-letters + last letter. If length <= 2, keep as-is. Print results.', array['1 <= n <= 400', '1 <= word length <= 400'], jsonb_build_array(jsonb_build_object('input', E'4\nlike\ngod\ninternal\nme', 'output', E'l2e\ngod\ni6l\nme'))),
(127, 'Read a string s and pattern p where p may include "." and "*" wildcards. "?" matches any single character, "*" matches any sequence including empty. Print true or false.', array['0 <= s,p length <= 2000', 'Lowercase letters, ?, and *'], jsonb_build_array(jsonb_build_object('input', E'adceb\n*a*b', 'output', 'true'))),
(128, 'Read an m×n board of characters and a word. Print true if the word can be formed by adjacent cells (any direction, no reuse). Otherwise false.', array['1 <= m,n <= 6', '1 <= word length <= 15', 'Uppercase letters'], jsonb_build_array(jsonb_build_object('input', E'3 4\nABCE\nSFES\nADEE\nSEE', 'output', 'true'))),
(129, 'Read a string s representing a gene sequence and a target t. Find the minimum number of mutations needed to mutate from s to t using a gene bank. A mutation changes one character to A/C/G/T. Print the count or -1.', array['s and t have length 8', 'Gene bank <= 10 words', 'Characters are A,C,G,T'], jsonb_build_array(jsonb_build_object('input', E'AACCGGTT AACCGGTA\n3\nAACCGGTA AACCGGTT AACCGGTA', 'output', '1'))),
(130, 'Read a list of words forming a sequence where each adjacent pair differs by one letter. This is a word ladder. Print the length of the shortest path from first word to last, or 0 if impossible. End word on second line.', array['1 <= word length <= 10', '1 <= word list <= 5000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'hit\ncog\n6\nhot dot dog lot log cog', 'output', '5'))),

(131, 'Read k and n integers. Print the k largest elements in descending order.', array['1 <= k <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'3\n7\n3 2 1 5 6 4 7', 'output', '7 6 5'))),
(132, 'Read n and n integers. Print the k-th largest element (1-indexed from largest). k given on first line.', array['1 <= k <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'2\n6\n3 2 1 5 6 4', 'output', '5'))),
(133, 'Read k and a stream of integers (one per line, terminated by -1). After each insertion print the median.', array['1 <= stream length <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'1\n2\n3\n-1', 'output', E'1.0\n1.5\n2.0'))),
(134, 'Read n and n task characters (A-Z) and a cooldown integer k. Print the minimum number of CPU intervals needed to execute all tasks with cooldown constraint.', array['1 <= n <= 10000', '0 <= k <= 100', 'Uppercase letters only'], jsonb_build_array(jsonb_build_object('input', E'6 2\nA A A B B B', 'output', '8'))),
(135, 'Read n and n integers. Print the sum of the k smallest elements. k given on first line.', array['1 <= k <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'2\n6\n3 1 4 1 5 9 2 6', 'output', '2'))),
(136, 'Read k and n points as x y coordinates. Print the k closest points to the origin (0,0), one per line, in any order.', array['1 <= k <= n <= 10000', '-10000 <= x,y <= 10000'], jsonb_build_array(jsonb_build_object('input', E'1\n2\n1 3\n-2 2', 'output', '-2 2'))),
(137, 'Read a sorted matrix (m rows × n cols) where each row and column is sorted. Print the k-th smallest element. k given on first line.', array['1 <= m,n <= 300', '-10^9 <= values <= 10^9'], jsonb_build_array(jsonb_build_object('input', E'8\n3 3\n1 5 9\n10 11 13\n12 13 15', 'output', '13'))),
(138, 'Read k sorted arrays (each on one line). Find the range [lo, hi] such that at least one number from each of the k arrays lies in [lo, hi] and the range is minimized. Print lo and hi.', array['1 <= k <= 3500', '1 <= each array length <= 50', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'3\n4 10 15 24 26\n0 9 12 20\n5 18 22 30', 'output', '20 24'))),
(139, 'Read n and n integers. Rearrange them so no two adjacent elements are the same. Print the result or "impossible".', array['1 <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'4\n1 1 1 2', 'output', '1 2 1 2'))),
(140, 'Read n, k and n integers. Print them as n/k groups of k consecutive maximums using a sliding window maximum approach.', array['1 <= k <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'3\n8\n1 3 -1 -3 5 3 6 7', 'output', '3 3 5 5 6 7')))
on conflict (problem_number) do update
  set description = excluded.description,
      constraints = excluded.constraints,
      examples    = excluded.examples,
      updated_at  = now();

-- ─────────────────────────────────────────────────────────────
-- PROBLEMS 141–200  (1-D DP · 2-D DP · Greedy · Intervals)
-- ─────────────────────────────────────────────────────────────
insert into public.dsa_problem_content (problem_number, description, constraints, examples)
values
(141, 'Read n and n non-negative integers. Print the minimum cost to reach the last index. You can step 1 or 2 steps; cost is paid when leaving that step. Index 0 and 1 are valid starts.', array['2 <= n <= 1000', 'Costs are non-negative integers'], jsonb_build_array(jsonb_build_object('input', E'3\n10 15 20', 'output', '15'))),
(142, 'Read n and n integers (positive and negative). Print the maximum sum of a contiguous subarray (Kadane).', array['1 <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'9\n-2 1 -3 4 -1 2 1 -5 4', 'output', '6'))),
(143, 'Read n and n integers. Print the length of the longest bitonic subsequence (increases then decreases).', array['1 <= n <= 1000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'7\n0 8 4 12 2 10 6', 'output', '5'))),
(144, 'Read n and n integers. Print the number of longest increasing subsequences.', array['1 <= n <= 2000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'4\n1 3 5 4 7', 'output', '2'))),
(145, 'Read n stock prices and fee f. Print the maximum profit with unlimited transactions but each sell incurs a transaction fee f.', array['1 <= n <= 50000', '1 <= fee <= 50000', 'Prices are positive integers'], jsonb_build_array(jsonb_build_object('input', E'2\n6\n1 3 2 8 4 9', 'output', '8'))),
(146, 'Read n and a non-negative integer array. Print the minimum number of jumps to reach the last index from index 0. Each element is the maximum jump length from that position.', array['1 <= n <= 10000', 'Values are non-negative integers', 'It is always possible to reach the last index'], jsonb_build_array(jsonb_build_object('input', E'6\n2 3 1 1 4 0', 'output', '2'))),
(147, 'Read n and n integers. Print the length of the longest consecutive sequence in O(n) time.', array['0 <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'8\n100 4 200 1 3 2 5 6', 'output', '6'))),
(148, 'Read a string s and compute the minimum number of deletions to make it a palindrome. Print the count.', array['1 <= s length <= 1000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', 'aebcbda', 'output', '2'))),
(149, 'Read strings s and t. Print the number of distinct subsequences of s that equal t.', array['0 <= s,t length <= 1000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'rabbbit\nrabbit', 'output', '3'))),
(150, 'Read n and n integers representing the height of each position. You may remove obstacles (non-zero heights) at a cost equal to their height. Print the minimum cost to make a staircase (strictly increasing from left to right).', array['1 <= n <= 1000', '0 <= heights <= 10000'], jsonb_build_array(jsonb_build_object('input', E'4\n4 3 2 1', 'output', '6'))),

(151, 'Read strings s1 and s2. Print the shortest supersequence containing both as subsequences.', array['1 <= s1,s2 length <= 1000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'abac\ncab', 'output', 'cabac'))),
(152, 'Read strings s1 and s2. Print the longest palindromic subsequence of s1.', array['1 <= s1 length <= 1000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', 'bbbab', 'output', '4'))),
(153, 'Read n and n non-negative integers. You may paint each house red(0), blue(1), or green(2); adjacent houses must differ. Costs are given as n lines of 3 values. Print the minimum total cost.', array['1 <= n <= 100', 'Costs are non-negative integers'], jsonb_build_array(jsonb_build_object('input', E'3\n17 2 17\n16 16 5\n14 3 19', 'output', '10'))),
(154, 'Read m, n, and an m×n grid of non-negative integers. Print the minimum path sum from top-left to bottom-right (can only move right or down).', array['1 <= m,n <= 200', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'3 3\n1 3 1\n1 5 1\n4 2 1', 'output', '7'))),
(155, 'Read n and n integers representing weights and values of items, and capacity W. Print the maximum value achievable with 0/1 knapsack. W on first line.', array['1 <= n <= 1000', '1 <= W <= 1000', 'Values and weights are positive integers'], jsonb_build_array(jsonb_build_object('input', E'5\n3\nweights: 1 3 4 5\nvalues:  1 4 5 7', 'output', '9'))),
(156, 'Read n and n integers representing job profits and deadlines (each job takes 1 unit). Print the maximum profit by scheduling jobs before their deadlines.', array['1 <= n <= 100', 'Deadlines and profits are positive integers'], jsonb_build_array(jsonb_build_object('input', E'4\njob profits: 20 15 10 5\njob deadlines: 2 2 1 1', 'output', '35'))),
(157, 'Read n intervals as pairs (start end). Print the minimum number of intervals to remove so the rest are non-overlapping.', array['1 <= n <= 100000', 'Integers fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'4\n1 2\n2 3\n3 4\n1 3', 'output', '1'))),
(158, 'Read n meeting time intervals as pairs (start end). Print the minimum number of conference rooms required.', array['0 <= n <= 10000', 'Times are non-negative integers'], jsonb_build_array(jsonb_build_object('input', E'3\n0 30\n5 10\n15 20', 'output', '2'))),
(159, 'Read n and n intervals. Merge overlapping intervals and print the result, one interval per line.', array['1 <= n <= 10000', 'Integers fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'4\n1 3\n2 6\n8 10\n15 18', 'output', E'1 6\n8 10\n15 18'))),
(160, 'Read n intervals and a new interval. Insert the new interval (merge if necessary) and print the result. New interval on first line.', array['0 <= n <= 10000', 'Non-overlapping sorted intervals'], jsonb_build_array(jsonb_build_object('input', E'2 5\n3\n1 2\n3 5\n6 7', 'output', E'1 5\n6 7'))),

(161, 'Read n and n non-negative integers. Print the length of the longest subarray with equal numbers of 0s and 1s.', array['1 <= n <= 100000', 'Values are 0 or 1'], jsonb_build_array(jsonb_build_object('input', E'6\n0 1 0 0 1 1', 'output', '6'))),
(162, 'Read n and n integers. Print the maximum product of a contiguous subarray.', array['1 <= n <= 20000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n2 3 -2 4 -1', 'output', '48'))),
(163, 'Read n and n positive integers. Print the number of subarrays whose product is strictly less than k. k on first line.', array['1 <= n <= 30000', 'All values are positive', '0 <= k <= 10^6'], jsonb_build_array(jsonb_build_object('input', E'100\n4\n10 5 2 6', 'output', '8'))),
(164, 'Read a string. Print the length of the longest palindromic substring.', array['1 <= s length <= 1000', 'Lowercase letters and digits'], jsonb_build_array(jsonb_build_object('input', 'babad', 'output', '3'))),
(165, 'Read n and an integer array. Print the number of palindromic subarrays.', array['1 <= n <= 1000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'3\n1 2 1', 'output', '4'))),
(166, 'Read a string s and integer k. Print the length of the longest substring with at most k distinct characters.', array['1 <= k <= 26', '1 <= s length <= 100000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'2\neceba', 'output', '3'))),
(167, 'Read m, n and an m×n grid of 0s and 1s. Print the side length of the largest square containing only 1s.', array['1 <= m,n <= 300', 'Values are 0 or 1'], jsonb_build_array(jsonb_build_object('input', E'4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0', 'output', '2'))),
(168, 'Read a string of balanced parentheses. Compute the score: "()" = 1, "AB" = A+B, "(A)" = 2*A. Print the total score.', array['2 <= s length <= 50', 's is a valid balanced string of ( and )'], jsonb_build_array(jsonb_build_object('input', '(())', 'output', '2'))),
(169, 'Read n and n non-negative integers representing elevations. You can eliminate obstacles at cost equal to height to make water flow left to right. Print minimum cost.', array['1 <= n <= 1000', '0 <= heights <= 10000'], jsonb_build_array(jsonb_build_object('input', E'5\n3 1 2 5 4', 'output', '5'))),
(170, 'Read a string s and a pattern p. Count the number of times p appears as a subsequence in s.', array['0 <= s length <= 1000', '0 <= p length <= 100', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'babgbag\nbag', 'output', '5'))),

(171, 'Read n and n integers. Print the maximum sum of a non-adjacent subsequence.', array['1 <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n3 2 5 10 7', 'output', '15'))),
(172, 'Read n and n integers arranged in a circle. Print the maximum sum of a non-adjacent subsequence (circular version).', array['1 <= n <= 100', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n3 2 5 10 7', 'output', '15'))),
(173, 'Read a string of lowercase letters. Print the minimum number of cuts to partition it into palindromic substrings.', array['1 <= s length <= 1000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', 'aab', 'output', '1'))),
(174, 'Read n and a sequence of n integers. Print the length of the longest mountain subarray (strictly increasing then strictly decreasing, min length 3).', array['1 <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'8\n2 1 4 7 3 2 5 1', 'output', '5'))),
(175, 'Read m, n, and an m×n dungeon grid where negative values are traps and positive values are health. A knight starts top-left and must reach bottom-right. Print the minimum initial health needed (at least 1).', array['1 <= m,n <= 200', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'3 3\n-2 -3 3\n-5 -10 1\n10 30 -5', 'output', '7'))),
(176, 'Read n and n integers. Print the length of the longest subarray where adjacent element differences are at most 1.', array['1 <= n <= 100000', 'Values are non-negative integers'], jsonb_build_array(jsonb_build_object('input', E'7\n1 2 2 3 4 2 3', 'output', '5'))),
(177, 'Read n and n positive integers. Print the minimum number of coins to make every value from 1 to n reachable (patches may be added). Print how many patches are added.', array['1 <= n <= 2^31 - 1', '1 <= array values <= 10^4'], jsonb_build_array(jsonb_build_object('input', E'20\n3\n1 2 2', 'output', '1'))),
(178, 'Read n and n non-negative integers. Determine if you can reach the last index from the first index using the values as maximum jump lengths. Print "true" or "false".', array['1 <= n <= 30000', 'Values are non-negative integers'], jsonb_build_array(jsonb_build_object('input', E'5\n2 3 1 1 4', 'output', 'true'))),
(179, 'Read two strings. Print the edit distance (minimum insertions, deletions, replacements) to convert s1 into s2.', array['0 <= s1,s2 length <= 500', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'horse\nros', 'output', '3'))),
(180, 'Read n and n non-negative integers. Print the maximum sum of a subarray of length exactly k. k on first line.', array['1 <= k <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'3\n7\n1 4 2 9 7 3 6', 'output', '22')))
on conflict (problem_number) do update
  set description = excluded.description,
      constraints = excluded.constraints,
      examples    = excluded.examples,
      updated_at  = now();

-- ─────────────────────────────────────────────────────────────
-- PROBLEMS 181–250  (Bit Manipulation · Math · Advanced)
-- ─────────────────────────────────────────────────────────────
insert into public.dsa_problem_content (problem_number, description, constraints, examples)
values
(181, 'Read n and n integers. Print the single number that appears once while all others appear three times. Use O(1) extra space.', array['1 <= n <= 30000', 'All values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'7\n2 2 3 2 4 4 4', 'output', '3'))),
(182, 'Read n and n integers. Every element appears twice except two. Print the two unique elements in ascending order.', array['2 <= n <= 30000', 'All values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'4\n1 2 1 3', 'output', '2 3'))),
(183, 'Read a 32-bit unsigned integer. Print the number of 1 bits (Hamming weight).', array['Input is a valid 32-bit unsigned integer'], jsonb_build_array(jsonb_build_object('input', '11', 'output', '3'))),
(184, 'Read n. Print a table where index i has the count of 1 bits for integers 0 through n.', array['0 <= n <= 100000'], jsonb_build_array(jsonb_build_object('input', '5', 'output', '0 1 1 2 1 2'))),
(185, 'Read two 32-bit integers a and b. Print the Hamming distance between them (number of bit positions where they differ).', array['0 <= a, b <= 2^31 - 1'], jsonb_build_array(jsonb_build_object('input', E'1 4', 'output', '2'))),
(186, 'Read n. Print the missing number in an array containing n distinct numbers in range [0, n]. Array given on second line.', array['1 <= n <= 10000'], jsonb_build_array(jsonb_build_object('input', E'4\n3 0 1', 'output', '2'))),
(187, 'Read a 32-bit unsigned integer. Reverse its bits and print the result.', array['Input is a 32-bit unsigned integer'], jsonb_build_array(jsonb_build_object('input', '43261596', 'output', '964176192'))),
(188, 'Read n. Determine if it is a power of 2. Print "true" or "false".', array['n fits in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', '16', 'output', 'true'))),
(189, 'Read n. Print all subsets of {1..n} that XOR to a given target k. k on first line. Print sorted sets, one per line.', array['1 <= n <= 20', '0 <= k <= 1000'], jsonb_build_array(jsonb_build_object('input', E'5\n3\n1 2 3', 'output', E'1 2\n3'))),
(190, 'Read two positive integers a and b. Print their sum without using + or - operators.', array['0 <= a, b <= 1000'], jsonb_build_array(jsonb_build_object('input', E'1 2', 'output', '3'))),

(191, 'Read n. Print whether it is a perfect square without using sqrt(). Print "true" or "false".', array['1 <= n <= 2^31 - 1'], jsonb_build_array(jsonb_build_object('input', '16', 'output', 'true'))),
(192, 'Read n. Print the nth Fibonacci number modulo 10^9+7. Use matrix exponentiation or fast doubling.', array['0 <= n <= 10^18'], jsonb_build_array(jsonb_build_object('input', '10', 'output', '55'))),
(193, 'Read n rows of Pascal''s triangle. Print all rows, values space-separated.', array['0 <= n <= 30'], jsonb_build_array(jsonb_build_object('input', '5', 'output', E'1\n1 1\n1 2 1\n1 3 3 1\n1 4 6 4 1'))),
(194, 'Read n and k. Print C(n,k) mod 10^9+7 using Pascal''s triangle or Lucas theorem.', array['0 <= k <= n <= 60'], jsonb_build_array(jsonb_build_object('input', E'5 2', 'output', '10'))),
(195, 'Read a positive integer n. Print its prime factorization in the form p1^e1 * p2^e2 ... in ascending order of primes.', array['2 <= n <= 10^12'], jsonb_build_array(jsonb_build_object('input', '12', 'output', '2^2 * 3^1'))),
(196, 'Read n. Print all prime numbers up to n using the Sieve of Eratosthenes.', array['2 <= n <= 1000000'], jsonb_build_array(jsonb_build_object('input', '20', 'output', '2 3 5 7 11 13 17 19'))),
(197, 'Read a and m. Print the modular inverse of a mod m using Fermat''s little theorem (m is prime). Print -1 if it does not exist.', array['1 <= a <= 10^9', 'm is a prime <= 10^9'], jsonb_build_array(jsonb_build_object('input', E'3 7', 'output', '5'))),
(198, 'Read two integers a and b. Print their GCD and LCM on one line space-separated.', array['1 <= a, b <= 10^12'], jsonb_build_array(jsonb_build_object('input', E'12 18', 'output', '6 36'))),
(199, 'Read n integers. Print the count of pairs (i,j) where i < j and a[i]+a[j] is divisible by k. k given on first line.', array['2 <= n <= 10000', '1 <= k <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'3\n5\n1 2 3 4 5', 'output', '4'))),
(200, 'Read n. Print the total number of 1 digits that appear in numbers from 1 to n.', array['1 <= n <= 10^9'], jsonb_build_array(jsonb_build_object('input', '13', 'output', '6'))),

(201, 'Read an m×n matrix of integers. Print the spiral order as a single space-separated line.', array['1 <= m,n <= 10'], jsonb_build_array(jsonb_build_object('input', E'3 3\n1 2 3\n4 5 6\n7 8 9', 'output', '1 2 3 6 9 8 7 4 5'))),
(202, 'Read n and n integers. Print the number of inversions (pairs i<j where a[i]>a[j]) using merge sort.', array['1 <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'6\n5 4 3 2 1 0', 'output', '15'))),
(203, 'Read n and n integers. Print the length of the longest subarray with sum equal to k. k given on first line.', array['1 <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n7\n1 2 3 4 5', 'output', '4'))),
(204, 'Read n integers. Print the maximum XOR of any two elements in the array. Use a trie.', array['1 <= n <= 50000', '0 <= values < 2^31'], jsonb_build_array(jsonb_build_object('input', E'4\n3 10 5 25 2 8', 'output', '28'))),
(205, 'Read n and n integers. Print the sum of all XOR values of all contiguous subarrays.', array['1 <= n <= 10000', '0 <= values <= 1000'], jsonb_build_array(jsonb_build_object('input', E'3\n1 2 3', 'output', '6'))),
(206, 'Read n and n integers. Find two elements a and b such that a XOR b is maximized. Print that maximum XOR value.', array['1 <= n <= 100000', '0 <= values < 2^31'], jsonb_build_array(jsonb_build_object('input', E'4\n3 10 5 25', 'output', '28'))),
(207, 'Read n and n positive integers. Each number can be halved (floor) at cost 1. Print the minimum cost to make the array sum <= k. k given on first line.', array['1 <= n <= 100000', 'Values are positive integers'], jsonb_build_array(jsonb_build_object('input', E'7\n5\n5 19 8 1', 'output', '3'))),
(208, 'Read n and a 0-indexed array. Find the minimum number of operations to make all array elements equal. One operation changes one element by 1. Print the count.', array['1 <= n <= 100000', '0 <= values <= 10^9'], jsonb_build_array(jsonb_build_object('input', E'3\n1 10 2', 'output', '9'))),
(209, 'Read n and n non-negative integers. Print the minimum number of arrows needed to burst all balloons where each balloon spans [x_start, x_end]. Arrows shot at x burst all balloons where x_start <= x <= x_end.', array['1 <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'4\n10 16\n2 8\n1 6\n7 12', 'output', '2'))),
(210, 'Read n and n integers. Print the number of ways to partition the array into three contiguous parts with equal sum.', array['1 <= n <= 30000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n0 2 1 -6 9 -3 3 3 0', 'output', '2'))),

(211, 'Read n and n lowercase strings. Find the largest group of strings that share the same set of characters. Print the strings in that group sorted, one per line.', array['1 <= n <= 100', '1 <= string length <= 20'], jsonb_build_array(jsonb_build_object('input', E'4\neat tea tan ate', 'output', E'ate\neat\ntea'))),
(212, 'Read an integer n. Print "fizz" if divisible by 3, "buzz" if by 5, "fizzbuzz" if by both, else the number. Do this for 1 through n, one per line.', array['1 <= n <= 100'], jsonb_build_array(jsonb_build_object('input', '15', 'output', E'1\n2\nfizz\n4\nbuzz\nfizz\n7\n8\nfizz\nbuzz\n11\nfizz\n13\n14\nfizzbuzz'))),
(213, 'Read a positive integer n. Print the number of trailing zeros in n! without computing the factorial.', array['1 <= n <= 10^4'], jsonb_build_array(jsonb_build_object('input', '25', 'output', '6'))),
(214, 'Read n and an array of n+1 integers where each value is in [1,n] and exactly one value repeats. Find the duplicate without modifying the array and using O(1) space.', array['2 <= n <= 100000', 'Values in range [1,n]'], jsonb_build_array(jsonb_build_object('input', E'5\n1 3 4 2 2', 'output', '2'))),
(215, 'Read n and a permutation of integers 1..n. Print the next permutation lexicographically. If the input is the last permutation, print the first.', array['1 <= n <= 100'], jsonb_build_array(jsonb_build_object('input', E'3\n1 2 3', 'output', '1 3 2'))),
(216, 'Read n and a permutation of integers 1..n. Find the previous permutation lexicographically. If at the first, print the last.', array['1 <= n <= 100'], jsonb_build_array(jsonb_build_object('input', E'3\n1 3 2', 'output', '1 2 3'))),
(217, 'Read a string of digits. Print the nth permutation lexicographically. n given on first line (1-indexed).', array['1 <= n! <= 10^6', 'Digits are 1 through length'], jsonb_build_array(jsonb_build_object('input', E'3\n3', 'output', '213'))),
(218, 'Read n and n integers. Print the smallest window (contiguous subarray) that contains all unique elements of the array.', array['1 <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'7\n1 2 1 3 4 2 3', 'output', '2 6'))),
(219, 'Read a string. Print the minimum number of characters to insert to make it a palindrome.', array['1 <= s length <= 1000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', 'abcd', 'output', '3'))),
(220, 'Read n and n 2D points as x y pairs. Find the minimum area of a rectangle formed by any 4 of the points with sides parallel to the axes. Print 0 if none possible.', array['1 <= n <= 500', '-40000 <= x,y <= 40000'], jsonb_build_array(jsonb_build_object('input', E'5\n1 1\n1 3\n3 1\n3 3\n2 2', 'output', '4'))),

(221, 'Read n and n non-negative integers. Print the count of pairs (i,j) where i<j and a[j]-a[i] == k. k on first line.', array['2 <= n <= 100000', '1 <= k <= 10^8'], jsonb_build_array(jsonb_build_object('input', E'1\n5\n1 2 3 4 5', 'output', '4'))),
(222, 'Read m and n. Print the number of distinct BSTs (structurally unique) that can store values 1..n. This is the n-th Catalan number.', array['1 <= n <= 19'], jsonb_build_array(jsonb_build_object('input', '4', 'output', '14'))),
(223, 'Read n and n integers. Print the length of the shortest subarray with sum >= k. k on first line. If none, print -1.', array['1 <= n <= 100000', 'k and values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'7\n7\n2 3 1 2 4 3', 'output', '2'))),
(224, 'Read n and n points. Print the maximum number of points that lie on the same straight line.', array['1 <= n <= 300', 'Points are given as x y pairs', 'Coordinates fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'3\n1 1\n2 2\n3 3', 'output', '3'))),
(225, 'Read n and n integers. Print all quadruplets (a,b,c,d) where a+b+c+d = 0, values ascending, no duplicates.', array['0 <= n <= 200', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'6\n1 0 -1 0 -2 2', 'output', E'-2 -1 1 2\n-2 0 0 2\n-1 0 0 1'))),
(226, 'Read n and n integers. Print the number of subarrays with exactly k odd numbers. k given on first line.', array['1 <= n <= 50000', '1 <= k <= n', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'2\n5\n1 1 2 1 1', 'output', '4'))),
(227, 'Read an integer n. Print the integer represented by reading n in a different base b. b on first line; n given in base b. Answer in base 10.', array['2 <= b <= 36', 'Input digits use 0-9 and a-z'], jsonb_build_array(jsonb_build_object('input', E'2\n1010', 'output', '10'))),
(228, 'Read n and n integers. Print the number of subarrays that are strictly increasing.', array['1 <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n1 2 3 2 5', 'output', '7'))),
(229, 'Read two strings. Print the length of the longest common substring (must be contiguous).', array['1 <= s1,s2 length <= 1000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'ABCBDAB\nBDCABCA', 'output', '4'))),
(230, 'Read n integers. Print the length of the longest subarray with at most two distinct elements.', array['1 <= n <= 50000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'7\n1 2 1 2 3 4 3', 'output', '4'))),

(231, 'Read n and n integers. Find the three numbers with the largest product. Print the maximum product.', array['3 <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n1 2 3 4 5', 'output', '60'))),
(232, 'Read n and a 0-indexed array. Print the index of the "pivot" element where the sum of elements to its left equals the sum to its right, or -1 if none exists.', array['1 <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'7\n1 7 3 6 5 6', 'output', '3'))),
(233, 'Read n and n integers. Print the number of pairs (i,j) where i<j such that a[i]*a[j] is negative.', array['2 <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n-1 2 -3 4 -5', 'output', '6'))),
(234, 'Read n and n integers. Print the minimum absolute difference between any two elements.', array['2 <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n4 2 1 5 3', 'output', '1'))),
(235, 'Read two strings s and t. Print true if t is an anagram of some substring of s, false otherwise.', array['1 <= t length <= s length <= 100000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'cbaebabacd\nabc', 'output', 'true'))),
(236, 'Read n and n integers. Print the length of the longest subarray where the max minus min is at most k. k on first line.', array['1 <= n <= 100000', '0 <= k <= 10^9'], jsonb_build_array(jsonb_build_object('input', E'4\n5\n10 1 2 4 7 2', 'output', '4'))),
(237, 'Read a string. Print the reverse of each word while keeping the word order the same.', array['1 <= s length <= 100000', 'Words separated by single spaces'], jsonb_build_array(jsonb_build_object('input', 'let us code', 'output', 'tel su edoc'))),
(238, 'Read a string. Print the string with words in reversed order (reverse word order, not characters).', array['1 <= s length <= 100000', 'Single spaces, no leading/trailing'], jsonb_build_array(jsonb_build_object('input', 'the sky is blue', 'output', 'blue is sky the'))),
(239, 'Read a string s and a string p. Print the start indices of all anagrams of p in s, space-separated and sorted.', array['1 <= p length <= s length <= 100000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', E'cbaebabacd\nabc', 'output', '0 6'))),
(240, 'Read n and n integers representing a circular array. Print the number of visible people from each index who are taller — a person is visible if nobody in between is taller. Results space-separated.', array['1 <= n <= 100000', 'All heights are distinct positive integers'], jsonb_build_array(jsonb_build_object('input', E'4\n10 6 8 5 11 9', 'output', '3 1 2 1 2 0'))),

(241, 'Read n and n integers. Print the number of subarrays whose bitwise OR is at least k. k on first line.', array['1 <= n <= 50000', '0 <= k, values < 2^30'], jsonb_build_array(jsonb_build_object('input', E'5\n5\n1 2 3', 'output', '4'))),
(242, 'Read n and n integers. Print the maximum sum of a subarray with length between l and r inclusive. l and r on first line.', array['1 <= l <= r <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'2 3\n5\n-1 2 -2 5 3', 'output', '8'))),
(243, 'Read two sorted arrays of sizes m and n. Print all elements that appear in both arrays (intersection), sorted, without duplicates.', array['0 <= m,n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'4 5\n1 2 2 3\n2 2 3 4 5', 'output', '2 3'))),
(244, 'Read n and n pairs (weight value) for items and capacity W. Print the maximum value for an unbounded knapsack (unlimited copies of each item). W on first line.', array['1 <= n <= 1000', '1 <= W <= 1000', 'Values and weights are positive integers'], jsonb_build_array(jsonb_build_object('input', E'8\n2\nweights: 1 3\nvalues:  15 20', 'output', '60'))),
(245, 'Read n, then n numbers representing denominators of fractions 1/d. Print the fraction equivalent to the sum in lowest terms as "numerator/denominator".', array['1 <= n <= 10', 'Denominators are positive integers'], jsonb_build_array(jsonb_build_object('input', E'3\n2 3 6', 'output', '1/1'))),
(246, 'Read n. Print all n-bit Gray codes in order, one per line.', array['1 <= n <= 16'], jsonb_build_array(jsonb_build_object('input', '2', 'output', E'00\n01\n11\n10'))),
(247, 'Read a string of lowercase letters. Print the minimum number of swaps to group all identical characters together (any grouping order is acceptable).', array['1 <= s length <= 100000', 'Lowercase letters'], jsonb_build_array(jsonb_build_object('input', 'abba', 'output', '0'))),
(248, 'Read n and n integers. Print the minimum number of operations to make the array non-decreasing, where an operation increments or decrements one element by 1.', array['1 <= n <= 10000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'5\n1 2 1 2 1', 'output', '2'))),
(249, 'Read n and n integers. Print the maximum sum you can get by selecting exactly one element from each of the k consecutive non-overlapping subarrays of length l. k and l on first line.', array['k*l <= n <= 100000', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'2 1\n6\n1 2 3 2 1 2', 'output', '5'))),
(250, 'Read n and n integers. Print the number of arithmetic triplets (i < j < k) such that a[j]-a[i] == a[k]-a[j] == d. d given on first line.', array['3 <= n <= 200', '1 <= d <= 500', 'Values fit in a 32-bit integer'], jsonb_build_array(jsonb_build_object('input', E'2\n6\n0 1 4 6 7 10', 'output', '2')))
on conflict (problem_number) do update
  set description = excluded.description,
      constraints = excluded.constraints,
      examples    = excluded.examples,
      updated_at  = now();

-- ─────────────────────────────────────────────────────────────
-- TEST CASES  51–100
-- ─────────────────────────────────────────────────────────────
insert into public.dsa_problem_test_cases (problem_number, case_number, stdin, expected_output)
values
(51,1,E'5\n4 5 2 25 7','5 25 25 -1 -1'),
(52,1,E'7\n100 80 60 70 60 75 85','1 1 1 2 1 4 6'),
(53,1,E'6\n2 1 5 6 2 3','10'),
(54,1,E'4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0','6'),
(55,1,E'5\n4 5 2 10 8','-1 4 -1 2 2'),
(56,1,E'5\n1 2 1 3 2','2 3 3 -1 3'),
(57,1,E'1432219 3','1219'),
(58,1,')()())',  '4'),
(59,1,E'4\n3 1 2 4','17'),
(60,1,E'5 3\n3 2 3 1 3','6'),
(61,1,E'5 5\n1 3 5 6 7','2'),
(62,1,E'2 2\n1 3\n2 4','2.5'),
(63,1,E'5\n3 4 5 1 2','1'),
(64,1,E'7 0\n4 5 6 7 0 1 2','4'),
(65,1,E'8 8\n5 7 7 8 8 10 11 11','3 4'),
(66,1,'8','2'),
(67,1,E'7\n2 2 1 1 3 4 4','3'),
(68,1,E'7\n0 1 0 3 5 2 -1','4'),
(69,1,E'8 8\n5 7 7 8 8 10 11 11','2'),
(70,1,E'5\n3 3','3'),
(71,1,E'4\n3 2 0 -4\n1','true'),
(72,1,E'4\n3 2 0 -4\n1','1'),
(73,1,E'5\n1 2 3 4 5','3'),
(74,1,E'2\n5\n1 2 3 4 5','4 5 1 2 3'),
(75,1,E'3 3\n2 4 3\n5 6 4','7 0 8'),
(76,1,E'4\n1 2 3 4','2 1 4 3'),
(77,1,E'3\n5\n1 4 3 2 5 2','1 2 2 4 3 5'),
(78,1,E'3\n1 4 5\n1 3 4\n2 6','1 1 2 3 4 4 5 6'),
(79,1,E'7\n1 2 3 3 4 4 5','1 2 5'),
(80,1,E'5\n1 2 3 4 5\nchild at 3: 7 8 9','1 2 3 7 8 9 4 5'),
(81,1,'1 2 3 4 5','3'),
(82,1,E'6 2 8 0 4 7 9 null null 3 5\n2 8','6'),
(83,1,E'6\n1 2 3 4 5 6','6'),
(84,1,'1 2 3 null 5',E'1 2 5\n1 3'),
(85,1,E'22\n5 4 8 11 null 13 4 7 2 null null null 1','true'),
(86,1,E'22\n5 4 8 11 null 13 4 7 2 null null null 1','5 4 11 2'),
(87,1,'1 2 3 null 5 null 4','1 3 4'),
(88,1,'1 2 3 4 5','1 2 3 4 5'),
(89,1,'-10 9 20 null null 15 7','42'),
(90,1,E'9\n5 3 6 2 4 null 7','true'),
(91,1,'1 2 2 3 4 4 3','true'),
(92,1,'3 9 20 null null 15 7','24'),
(93,1,E'7\n-10 -3 0 5 9 12 14','0 -3 9 -10 null 5 12 null null null null null 14'),
(94,1,E'7 15\n10 5 15 3 7 null 18','32'),
(95,1,E'8\n10 5 -3 3 2 null 11 3 -2 null 1','3'),
(96,1,'4 2 9 3 5 null 7','15'),
(97,1,E'1 3 2 5\n2 1 3 null 4 null 7','3 4 5 5 4 null 7'),
(98,1,'3 9 20 15 7',E'3.00000\n14.50000\n11.00000'),
(99,1,E'3\n5 10 40','40 10 5'),
(100,1,'4 1 6 0 2 5 7 null null null 3 null null null 8','30 36 21 36 35 26 15 null null null 33 null null null 8')
on conflict (problem_number, case_number) do update
  set stdin = excluded.stdin,
      expected_output = excluded.expected_output;

-- ─────────────────────────────────────────────────────────────
-- TEST CASES  101–150
-- ─────────────────────────────────────────────────────────────
insert into public.dsa_problem_test_cases (problem_number, case_number, stdin, expected_output)
values
(101,1,E'9\n4\n1 2 3','2 3'),
(102,1,'23',E'ad\nae\naf\nbd\nbe\nbf\ncd\nce\ncf'),
(103,1,E'4\n1 2 2 3',E'{}\n1\n1 2\n1 2 2\n1 2 2 3\n1 2 3\n1 3\n2\n2 2\n2 2 3\n2 3\n3'),
(104,1,E'5 8\n10 1 2 7 6 1 5',E'1 1 6\n1 2 5\n1 7\n2 6'),
(105,1,E'53..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79',E'534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179'),
(106,1,'aba',E'aab\naba\nbaa'),
(107,1,'3',E'((()))\n(()())\n(())()\n()(())\n()()()'),
(108,1,E'catsanddog\n4\ncat cats and sand dog',E'cat sand dog\ncats and dog'),
(109,1,E'4 4\noaan\netae\nihsr\niflv\neat oath',E'eat\noath'),
(110,1,'2-1-1',E'-2\n0\n0\n2'),
(111,1,E'6 4\n1 2\n2 3\n4 5\n6 6',E'1 2 3\n4 5\n6'),
(112,1,E'4 3\n0 1\n1 2\n2 3','3'),
(113,1,E'3 3\n0 0 0\n1 1 0\n1 1 0','4'),
(114,1,E'4 4\n0 1 0 0\n1 1 1 0\n0 1 0 0\n1 1 0 0','16'),
(115,1,E'4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 0 1 1\n0 0 0 1 1','4'),
(116,1,E'5 7\n0 1 10\n0 2 3\n1 3 2\n2 1 4\n2 3 8\n2 4 2\n3 4 5\n4 3 1','0 7 3 9 5'),
(117,1,E'6 6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1','5 4 2 3 1 0'),
(118,1,E'5 5\n1 0\n0 2\n2 1\n0 3\n3 4','2'),
(119,1,E'5 5\n1 0\n0 2\n2 1\n0 3\n3 4','0 3'),
(120,1,E'5 5\n1 0\n0 2\n2 1\n0 3\n3 4','3'),
(121,1,E'4\ninsert apple\nsearch apple\nsearch app\nstartsWith app',E'true\nfalse\ntrue'),
(122,1,E'6\nw\nwo\nwor\nworl\nworld\nword','world'),
(123,1,E'5\nmobile\nmouse\nmoneypot\nmonitor\nmaxi\nmouse',E'maxi mobile moneypot\nmaxi mobile moneypot\nmaxi mobile moneypot\nmobile\nmobile moneypot\nmobile moneypot monitor'),
(124,1,E'3\nbat\ntab\ncat',E'0 1\n1 0'),
(125,1,E'o a a n\ne t a e\ni h k r\ni f l v\neat oath',E'eat\noath'),
(126,1,E'4\nlike\ngod\ninternal\nme',E'l2e\ngod\ni6l\nme'),
(127,1,E'adceb\n*a*b','true'),
(128,1,E'3 4\nABCE\nSFES\nADEE\nSEE','true'),
(129,1,E'AACCGGTT AACCGGTA\n3\nAACCGGTA AACCGGTT AACCGGTA','1'),
(130,1,E'hit\ncog\n6\nhot dot dog lot log cog','5'),
(131,1,E'3\n7\n3 2 1 5 6 4 7','7 6 5'),
(132,1,E'2\n6\n3 2 1 5 6 4','5'),
(133,1,E'1\n2\n3\n-1',E'1.0\n1.5\n2.0'),
(134,1,E'6 2\nA A A B B B','8'),
(135,1,E'2\n6\n3 1 4 1 5 9 2 6','2'),
(136,1,E'1\n2\n1 3\n-2 2','-2 2'),
(137,1,E'8\n3 3\n1 5 9\n10 11 13\n12 13 15','13'),
(138,1,E'3\n4 10 15 24 26\n0 9 12 20\n5 18 22 30','20 24'),
(139,1,E'4\n1 1 1 2','1 2 1 2'),
(140,1,E'3\n8\n1 3 -1 -3 5 3 6 7','3 3 5 5 6 7'),
(141,1,E'3\n10 15 20','15'),
(142,1,E'9\n-2 1 -3 4 -1 2 1 -5 4','6'),
(143,1,E'7\n0 8 4 12 2 10 6','5'),
(144,1,E'4\n1 3 5 4 7','2'),
(145,1,E'2\n6\n1 3 2 8 4 9','8'),
(146,1,E'6\n2 3 1 1 4 0','2'),
(147,1,E'8\n100 4 200 1 3 2 5 6','6'),
(148,1,'aebcbda','2'),
(149,1,E'rabbbit\nrabbit','3'),
(150,1,E'4\n4 3 2 1','6')
on conflict (problem_number, case_number) do update
  set stdin = excluded.stdin,
      expected_output = excluded.expected_output;

-- ─────────────────────────────────────────────────────────────
-- TEST CASES  151–200
-- ─────────────────────────────────────────────────────────────
insert into public.dsa_problem_test_cases (problem_number, case_number, stdin, expected_output)
values
(151,1,E'abac\ncab','cabac'),
(152,1,'bbbab','4'),
(153,1,E'3\n17 2 17\n16 16 5\n14 3 19','10'),
(154,1,E'3 3\n1 3 1\n1 5 1\n4 2 1','7'),
(155,1,E'5\n3\nweights: 1 3 4 5\nvalues:  1 4 5 7','9'),
(156,1,E'4\njob profits: 20 15 10 5\njob deadlines: 2 2 1 1','35'),
(157,1,E'4\n1 2\n2 3\n3 4\n1 3','1'),
(158,1,E'3\n0 30\n5 10\n15 20','2'),
(159,1,E'4\n1 3\n2 6\n8 10\n15 18',E'1 6\n8 10\n15 18'),
(160,1,E'2 5\n3\n1 2\n3 5\n6 7',E'1 5\n6 7'),
(161,1,E'6\n0 1 0 0 1 1','6'),
(162,1,E'5\n2 3 -2 4 -1','48'),
(163,1,E'100\n4\n10 5 2 6','8'),
(164,1,'babad','3'),
(165,1,E'3\n1 2 1','4'),
(166,1,E'2\neceba','3'),
(167,1,E'4 5\n1 0 1 0 0\n1 0 1 1 1\n1 1 1 1 1\n1 0 0 1 0','2'),
(168,1,'(())','2'),
(169,1,E'5\n3 1 2 5 4','5'),
(170,1,E'babgbag\nbag','5'),
(171,1,E'5\n3 2 5 10 7','15'),
(172,1,E'5\n3 2 5 10 7','15'),
(173,1,'aab','1'),
(174,1,E'8\n2 1 4 7 3 2 5 1','5'),
(175,1,E'3 3\n-2 -3 3\n-5 -10 1\n10 30 -5','7'),
(176,1,E'7\n1 2 2 3 4 2 3','5'),
(177,1,E'20\n3\n1 2 2','1'),
(178,1,E'5\n2 3 1 1 4','true'),
(179,1,E'horse\nros','3'),
(180,1,E'3\n7\n1 4 2 9 7 3 6','22'),
(181,1,E'7\n2 2 3 2 4 4 4','3'),
(182,1,E'4\n1 2 1 3','2 3'),
(183,1,'11','3'),
(184,1,'5','0 1 1 2 1 2'),
(185,1,E'1 4','2'),
(186,1,E'4\n3 0 1','2'),
(187,1,'43261596','964176192'),
(188,1,'16','true'),
(189,1,E'5\n3\n1 2 3',E'1 2\n3'),
(190,1,E'1 2','3'),
(191,1,'16','true'),
(192,1,'10','55'),
(193,1,'5',E'1\n1 1\n1 2 1\n1 3 3 1\n1 4 6 4 1'),
(194,1,E'5 2','10'),
(195,1,'12','2^2 * 3^1'),
(196,1,'20','2 3 5 7 11 13 17 19'),
(197,1,E'3 7','5'),
(198,1,E'12 18','6 36'),
(199,1,E'3\n5\n1 2 3 4 5','4'),
(200,1,'13','6')
on conflict (problem_number, case_number) do update
  set stdin = excluded.stdin,
      expected_output = excluded.expected_output;

-- ─────────────────────────────────────────────────────────────
-- TEST CASES  201–250
-- ─────────────────────────────────────────────────────────────
insert into public.dsa_problem_test_cases (problem_number, case_number, stdin, expected_output)
values
(201,1,E'3 3\n1 2 3\n4 5 6\n7 8 9','1 2 3 6 9 8 7 4 5'),
(202,1,E'6\n5 4 3 2 1 0','15'),
(203,1,E'5\n7\n1 2 3 4 5','4'),
(204,1,E'4\n3 10 5 25 2 8','28'),
(205,1,E'3\n1 2 3','6'),
(206,1,E'4\n3 10 5 25','28'),
(207,1,E'7\n5\n5 19 8 1','3'),
(208,1,E'3\n1 10 2','9'),
(209,1,E'4\n10 16\n2 8\n1 6\n7 12','2'),
(210,1,E'5\n0 2 1 -6 9 -3 3 3 0','2'),
(211,1,E'4\neat tea tan ate',E'ate\neat\ntea'),
(212,1,'15',E'1\n2\nfizz\n4\nbuzz\nfizz\n7\n8\nfizz\nbuzz\n11\nfizz\n13\n14\nfizzbuzz'),
(213,1,'25','6'),
(214,1,E'5\n1 3 4 2 2','2'),
(215,1,E'3\n1 2 3','1 3 2'),
(216,1,E'3\n1 3 2','1 2 3'),
(217,1,E'3\n3','213'),
(218,1,E'7\n1 2 1 3 4 2 3','2 6'),
(219,1,'abcd','3'),
(220,1,E'5\n1 1\n1 3\n3 1\n3 3\n2 2','4'),
(221,1,E'1\n5\n1 2 3 4 5','4'),
(222,1,'4','14'),
(223,1,E'7\n7\n2 3 1 2 4 3','2'),
(224,1,E'3\n1 1\n2 2\n3 3','3'),
(225,1,E'6\n1 0 -1 0 -2 2',E'-2 -1 1 2\n-2 0 0 2\n-1 0 0 1'),
(226,1,E'2\n5\n1 1 2 1 1','4'),
(227,1,E'2\n1010','10'),
(228,1,E'5\n1 2 3 2 5','7'),
(229,1,E'ABCBDAB\nBDCABCA','4'),
(230,1,E'7\n1 2 1 2 3 4 3','4'),
(231,1,E'5\n1 2 3 4 5','60'),
(232,1,E'7\n1 7 3 6 5 6','3'),
(233,1,E'5\n-1 2 -3 4 -5','6'),
(234,1,E'5\n4 2 1 5 3','1'),
(235,1,E'cbaebabacd\nabc','true'),
(236,1,E'4\n5\n10 1 2 4 7 2','4'),
(237,1,'let us code','tel su edoc'),
(238,1,'the sky is blue','blue is sky the'),
(239,1,E'cbaebabacd\nabc','0 6'),
(240,1,E'4\n10 6 8 5 11 9','3 1 2 1 2 0'),
(241,1,E'5\n5\n1 2 3','4'),
(242,1,E'2 3\n5\n-1 2 -2 5 3','8'),
(243,1,E'4 5\n1 2 2 3\n2 2 3 4 5','2 3'),
(244,1,E'8\n2\nweights: 1 3\nvalues:  15 20','60'),
(245,1,E'3\n2 3 6','1/1'),
(246,1,'2',E'00\n01\n11\n10'),
(247,1,'abba','0'),
(248,1,E'5\n1 2 1 2 1','2'),
(249,1,E'2 1\n6\n1 2 3 2 1 2','5'),
(250,1,E'2\n6\n0 1 4 6 7 10','2')
on conflict (problem_number, case_number) do update
  set stdin = excluded.stdin,
      expected_output = excluded.expected_output;

-- ─────────────────────────────────────────────────────────────
-- Verify all 250 problems and test cases are present
-- ─────────────────────────────────────────────────────────────
do $$
declare
  missing_content  integer;
  missing_cases    integer;
begin
  select count(*) into missing_content
  from generate_series(1, 250) as expected(n)
  where not exists (
    select 1 from public.dsa_problem_content c where c.problem_number = expected.n
  );

  select count(*) into missing_cases
  from generate_series(1, 250) as expected(n)
  where not exists (
    select 1 from public.dsa_problem_test_cases t where t.problem_number = expected.n
  );

  if missing_content > 0 then
    raise exception 'Missing content for % problem(s).', missing_content;
  end if;
  if missing_cases > 0 then
    raise exception 'Missing test cases for % problem(s).', missing_cases;
  end if;

  raise notice 'All 250 problems have content and test cases. ✓';
end;
$$;
