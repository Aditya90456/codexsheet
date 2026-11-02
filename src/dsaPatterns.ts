// dsaPatterns.ts — the teaching layer that sits under the 250-problem sheet.
// The sheet says *which* problem belongs to which pattern; this says how to spot
// the pattern, what the skeleton looks like, and how to explain it on screen
// without ever recording a voice. Every card carries a timed film: the caption is
// the script, so it plays muted, reads itself aloud through the browser's speech
// engine, and exports to WebVTT for a recording made anywhere else.

import type { Problem } from "./dsaSheet";

export type FilmStep = { at: number; title: string; caption: string; line: number };
export type PatternCard = {
  name: string;
  tagline: string;
  cue: string;
  complexity: string;
  template: string[];
  variants: string[];
  tier: 1 | 2 | 3;
  film: FilmStep[];
};

const f = (at: number, title: string, caption: string, line: number): FilmStep => ({ at, title, caption, line });

export const patternCards: PatternCard[] = [
  {
    name: "Arrays & Hashing",
    tagline: "Trade space for time: stop scanning, start looking up.",
    cue: "The question asks you to find, count, group or deduplicate values, and an O(n²) brute force is obvious. That is the signal to remember what you have already seen in a hash map or set.",
    complexity: "O(n) time · O(n) space, replacing an O(n²) scan",
    tier: 1,
    template: [
      "function grouping(nums) {",
      "  const seen = new Map();          // value -> what the answer needs",
      "  for (const value of nums) {",
      "    const key = canonicalForm(value);",
      "    if (!seen.has(key)) seen.set(key, []);",
      "    seen.get(key).push(value);",
      "  }",
      "  return [...seen.values()];",
      "}",
    ],
    variants: ["Membership (Set)", "Counting (Map of counts)", "Grouping (Map of lists)", "Prefix-sum lookups"],
    film: [
      f(0, "The brute force is the warning", "Two nested loops over the same array means the interviewer wants a lookup, not a scan.", 2),
      f(7, "Remember what you have seen", "A hash map keeps every value you already passed, in constant-time reach.", 1),
      f(14, "Choose the key carefully", "Grouping works when you can turn equivalent items into one canonical key, like a sorted word or a count vector.", 3),
      f(22, "Check before you insert", "Look up first, then store. Inserting early lets an element match itself.", 4),
      f(30, "One pass, one answer", "Every element is visited once. That is O(n) time for O(n) memory.", 5),
      f(38, "Interview line to say", "\u201cI will trade space for time: a hash map turns the inner search into an O(1) lookup.\u201d", 7),
    ],
  },
  {
    name: "Two Pointers",
    tagline: "Walk from both ends and throw away half the work each step.",
    cue: "The input is sorted, or the answer is about a pair or a range, and you are allowed to move indices instead of looping twice. Sorting first is fair game when the order of the answer does not matter.",
    complexity: "O(n) time · O(1) space after an O(n log n) sort",
    tier: 1,
    template: [
      "function twoPointers(nums) {",
      "  let left = 0, right = nums.length - 1;",
      "  while (left < right) {",
      "    const sum = nums[left] + nums[right];",
      "    if (sum === target) return [left, right];",
      "    if (sum < target) left++;",
      "    else right--;",
      "  }",
      "  return [];",
      "}",
    ],
    variants: ["Opposite ends (pair, container, trapping water)", "Same direction (remove duplicates)", "Fast and slow (cycle, middle node)"],
    film: [
      f(0, "Two pointers, one pass", "Instead of testing every pair, keep one pointer at each end and move the one that cannot help.", 1),
      f(8, "Sorted input is the unlock", "With order available, a too-small sum tells you the left value is useless for every remaining right value.", 3),
      f(16, "Move the loser, keep the winner", "One comparison per step, so the search space shrinks linearly instead of quadratically.", 5),
      f(24, "Why it is safe", "Skipping a pointer discards only pairs that are provably worse, never the answer.", 6),
      f(32, "The in-place cousin", "Same-direction pointers rewrite an array without extra memory, as in remove-duplicates.", 2),
      f(40, "Interview line to say", "\u201cBecause the array is sorted I can discard a candidate with each step, so this is O(n) with two pointers.\u201d", 4),
    ],
  },
  {
    name: "Sliding Window",
    tagline: "A range that moves: add one element, drop one element.",
    cue: "The answer lives in a contiguous subarray or substring, often of fixed length k, or the longest/shortest range satisfying a condition. Non-contiguous means this is not the pattern.",
    complexity: "O(n) time · O(k) or O(alphabet) space",
    tier: 1,
    template: [
      "function slidingWindow(s, k) {",
      "  let sum = 0, best = 0;",
      "  for (let i = 0; i < k; i++) sum += s[i].charCodeAt(0);",
      "  best = sum;",
      "  for (let right = k; right < s.length; right++) {",
      "    sum += s[right].charCodeAt(0) - s[right - k].charCodeAt(0);",
      "    best = Math.max(best, sum);",
      "  }",
      "  return best;",
      "}",
    ],
    variants: ["Fixed size k", "Variable window with a left pointer", "At-most-k distinct (shrink on violation)"],
    film: [
      f(0, "The window is a range, not a subset", "Contiguous only. The moment gaps are allowed you are in prefix sums or DP territory.", 1),
      f(8, "Seed the first window", "Compute the full window once. Skipping this is the usual off-by-one bug.", 2),
      f(16, "Slide, do not recompute", "Entering value minus leaving value keeps the running total correct in constant work.", 5),
      f(24, "Variable windows", "Grow the right edge, then shrink the left edge until the window is valid again. Each index moves at most n times.", 6),
      f(32, "State you carry", "A count map, a max, or a set of characters in the window is what makes validity O(1).", 3),
      f(40, "Interview line to say", "\u201cBoth edges only move forward, so even with a while loop inside, the whole pass is O(n).\u201d", 4),
    ],
  },
  {
    name: "Stack",
    tagline: "Last in, first out: the pattern for matching and nesting.",
    cue: "Brackets, tags, undo, history, expression evaluation, anything where the most recent open thing must close first. If the rule is \u201cthe nearest unmatched item\u201d, it is a stack.",
    complexity: "O(n) time · O(n) space",
    tier: 1,
    template: [
      "function validParentheses(s) {",
      "  const pairs = { ')': '(', ']': '[', '}': '{' };",
      "  const stack = [];",
      "  for (const char of s) {",
      "    if (char in pairs) {",
      "      if (stack.pop() !== pairs[char]) return false;",
      "    } else stack.push(char);",
      "  }",
      "  return stack.length === 0;",
      "}",
    ],
    variants: ["Balanced symbols", "Postfix evaluation", "Undo / history", "Bracketed text parsing"],
    film: [
      f(0, "Nesting is a stack", "Whatever opened most recently must close first. That is literally LIFO.", 2),
      f(8, "Push on open, pop on close", "Openers go on the stack; a closer must match the top or the string is invalid.", 6),
      f(16, "The trap of the empty pop", "A closer with nothing on the stack fails. Check before popping or JS returns undefined.", 5),
      f(24, "Finish by draining", "At the end the stack must be empty, otherwise openers never closed.", 8),
      f(32, "Where else it appears", "Undo, browser history, call frames, postfix calculators, expression trees.", 4),
      f(40, "Interview line to say", "\u201cI will keep unmatched openers on a stack so each closer pairs with the most recent one.\u201d", 3),
    ],
  },
  {
    name: "Monotonic Stack",
    tagline: "Keep the stack sorted, and the answer is whatever you just popped.",
    cue: "Ask yourself: for each element, what is the next greater, smaller, or nearest element that beats it? \u201cNext greater\u201d, \u201cdays until warmer\u201d, \u201clargest rectangle\u201d \u2014 all the same trick.",
    complexity: "O(n) time · O(n) space, versus an O(n²) scan",
    tier: 2,
    template: [
      "function dailyTemperatures(temps) {",
      "  const answer = temps.map(() => 0);",
      "  const stack = [];                  // indices, decreasing temperature",
      "  for (let i = 0; i < temps.length; i++) {",
      "    while (stack.length && temps[i] > temps[stack.at(-1)]) {",
      "      const j = stack.pop();",
      "      answer[j] = i - j;",
      "    }",
      "    stack.push(i);",
      "  }",
      "  return answer;",
      "}",
    ],
    variants: ["Next greater element", "Largest rectangle in a histogram", "Stock span", "Sum of subarray minimums"],
    film: [
      f(0, "The stack stays ordered", "We hold candidates in decreasing order, so the top is always the nearest thing still waiting.", 2),
      f(8, "A new value settles old debts", "While the newcomer is bigger, everything on top has just found its answer.", 4),
      f(16, "Pop and record the distance", "The index we pop is the question, the current index is the answer, distance is the difference.", 6),
      f(24, "Amortised linearity", "Each index is pushed once and popped once, so the inner while never costs more than O(n) total.", 5),
      f(32, "Left and right bounds", "For histograms you pop twice, once for the right edge and once for the left, then multiply the width.", 3),
      f(40, "Interview line to say", "\u201cI keep a decreasing stack so each element resolves the ones it dominates \u2014 that is O(n) amortised.\u201d", 8),
    ],
  },
  {
    name: "Binary Search",
    tagline: "Not just sorted arrays: any monotonic yes-or-no question.",
    cue: "Sorted data, or an answer that is the smallest or largest value making a condition true. Once you can write a check(x) that flips from false to false to true, you can binary search it.",
    complexity: "O(log n) time · O(1) space",
    tier: 1,
    template: [
      "function binarySearch(nums, target) {",
      "  let left = 0, right = nums.length - 1;",
      "  while (left <= right) {",
      "    const mid = left + Math.floor((right - left) / 2);",
      "    if (nums[mid] === target) return mid;",
      "    if (nums[mid] < target) left = mid + 1;",
      "    else right = mid - 1;",
      "  }",
      "  return -1;",
      "}",
    ],
    variants: ["Exact match", "Lower bound / first true", "Answer on a range (minimise capacity)", "Search in rotated array"],
    film: [
      f(0, "A range that must shrink", "Keep the interval where the answer is guaranteed to still live.", 1),
      f(8, "One check kills half", "Compare the midpoint, then discard the side that cannot contain the target.", 4),
      f(16, "The invariant is the whole trick", "Pick inclusive or exclusive bounds and never mix them. That choice fixes every off-by-one.", 2),
      f(24, "Avoid the overflow habit", "left + (right - left) / 2 instead of (left + right) / 2 \u2014 interviewers still ask why.", 3),
      f(32, "Beyond sorted arrays", "Binary search on the answer: capacity, speed, days. If check(x) is monotonic, search it.", 6),
      f(40, "Interview line to say", "\u201cThe predicate is monotone, so I can binary search the answer space instead of the input.\u201d", 5),
    ],
  },
  {
    name: "Linked List",
    tagline: "Pointer rewiring, in place, with no random access.",
    cue: "Reversal, merging, cycle detection, k-th from the end, or an in-place edit that must not use extra arrays. No indexing means you move pointers instead of subscripts.",
    complexity: "O(n) time · O(1) space",
    tier: 1,
    template: [
      "function reverse(head) {",
      "  let prev = null, curr = head;",
      "  while (curr) {",
      "    const next = curr.next;          // save before you cut",
      "    curr.next = prev;",
      "    prev = curr;",
      "    curr = next;",
      "  }",
      "  return prev;",
      "}",
    ],
    variants: ["Reverse (iterative and recursive)", "Merge two sorted lists", "Fast and slow pointer", "Dummy head for edge-free edits"],
    film: [
      f(0, "Save the next pointer first", "The moment you rewire curr.next the rest of the list is gone. Read it into a variable before you write.", 3),
      f(9, "Three names, one loop", "prev, curr, next. Rewind the arrow, then slide all three forward.", 4),
      f(18, "The answer is prev", "When curr reaches null, prev is the new head. That is the invariant worth saying out loud.", 8),
      f(26, "Dummy head", "Prepend a sentinel node and head-deletion and insertion stop being special cases.", 2),
      f(34, "Fast and slow", "Advance one pointer twice as fast: middle node, cycle detection, n-th from the end.", 5),
      f(42, "Interview line to say", "\u201cI keep prev, curr and next so the rewire never loses the remaining list \u2014 O(1) extra space.\u201d", 6),
    ],
  },
  {
    name: "Trees",
    tagline: "Recursion plus one traversal choice.",
    cue: "Any hierarchical structure: depth, paths, level order, validity, or the k-th something. Decide what each node needs from its children, then pick DFS or BFS.",
    complexity: "O(n) time · O(h) recursion stack, O(n) for level order",
    tier: 1,
    template: [
      "function maxDepth(root) {",
      "  if (!root) return 0;",
      "  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));",
      "}",
    ],
    variants: ["DFS pre / in / post order", "BFS level order (queue)", "BST in-order = sorted", "Path and subtree recursion"],
    film: [
      f(0, "Base case first", "An empty tree answers with zero or null. Write it before anything else.", 1),
      f(8, "Ask the children", "Trust recursion to return what each subtree knows, then combine at the current node.", 2),
      f(16, "Pick the traversal by the question", "In-order for BST ordering, level order for breadth and depth-by-level, post-order when a node needs aggregate results.", 2),
      f(25, "Carry state down", "Pass a path, a range bound or a depth argument downward when a node must know its context.", 2),
      f(33, "BST validity trap", "Compare against a legal range inherited from ancestors, not only against the parent.", 1),
      f(41, "Interview line to say", "\u201cEach node combines what its two subtrees report, so the recursion is O(n) with O(h) stack.\u201d", 2),
    ],
  },
  {
    name: "Backtracking",
    tagline: "Depth-first search with an undo.",
    cue: "Enumerate combinations, permutations, subsets or all valid placements. The word \u201call\u201d or \u201cevery\u201d in the question is the tell, and so is a small input size.",
    complexity: "Exponential by nature; prune to survive",
    tier: 2,
    template: [
      "function backtrack(path, choices) {",
      "  if (isComplete(path)) { results.push([...path]); return; }",
      "  for (const choice of choices) {",
      "    if (!isValid(path, choice)) continue;",
      "    path.push(choice);",
      "    backtrack(path, remaining(choice));",
      "    path.pop();                       // undo, exactly once",
      "  }",
      "}",
    ],
    variants: ["Subsets and combinations (start index)", "Permutations (used set)", "Grid and constraint search (N-Queens, word search)", "Prune on partial totals"],
    film: [
      f(0, "Choose, explore, unchoose", "Every recursion level does exactly three things, and the third one is what people forget.", 5),
      f(9, "Copy at the leaf", "path is shared, so push a snapshot when you record an answer.", 1),
      f(18, "Start index prevents duplicates", "For combinations, only recurse forward, so [1,2] and [2,1] are not both produced.", 6),
      f(26, "Validity check is your prune", "Reject before you descend. One early continue saves an entire subtree.", 3),
      f(34, "Grid version", "Mark the cell as visited, recurse to four neighbours, then unmark on the way out.", 4),
      f(42, "Interview line to say", "\u201cThis is DFS over the decision tree with explicit undo, so space is the recursion depth, not the output count.\u201d", 5),
    ],
  },
  {
    name: "Graphs",
    tagline: "Nodes, edges, and a visited set you never forget.",
    cue: "Dependencies, shortest hops, connectivity, regions, cycles, or anything you can redraw as \u201cthings connected to things\u201d. A grid of cells is a graph where edges are the four neighbours.",
    complexity: "O(V + E) time · O(V) space",
    tier: 1,
    template: [
      "function bfs(start, neighbours) {",
      "  const queue = [start], seen = new Set([start]);",
      "  while (queue.length) {",
      "    const node = queue.shift();",
      "    for (const next of neighbours(node)) {",
      "      if (seen.has(next)) continue;",
      "      seen.add(next);",
      "      queue.push(next);",
      "    }",
      "  }",
      "}",
    ],
    variants: ["BFS for unweighted distance", "DFS for connectivity and regions", "Topological sort for prerequisites", "Union-Find for dynamic connectivity"],
    film: [
      f(0, "Mark when you enqueue", "Adding to the queue twice before visiting is the classic duplicate-work bug. Mark at push time.", 1),
      f(9, "Visited is the termination proof", "Without it a cycle loops forever. Say that out loud; interviewers listen for it.", 2),
      f(18, "BFS or DFS, decided by the question", "Fewest steps means BFS. Reachability, components and regions are happy with either.", 3),
      f(27, "Grids are graphs", "Neighbours are the four directions, filtered by bounds and by cell value.", 5),
      f(35, "Dependencies", "Prerequisite chains want a topological order; a leftover cycle is your false answer.", 6),
      f(43, "Interview line to say", "\u201cThis is V plus E work because every node and edge is touched once, and I mark on enqueue to avoid re-queueing.\u201d", 4),
    ],
  },
  {
    name: "1-D DP",
    tagline: "Solve the small version first, then never recompute it.",
    cue: "Optimum or count over a sequence, where the choice at each step depends only on a few earlier steps. Overlapping subproblems plus an optimal substructure, and you have DP.",
    complexity: "O(n) or O(n²) time · reducible to O(1) or O(n) space",
    tier: 1,
    template: [
      "function rob(nums) {",
      "  let skip = 0, take = 0;",
      "  for (const value of nums) {",
      "    const next = Math.max(skip + value, take);",
      "    skip = take;",
      "    take = next;",
      "  }",
      "  return Math.max(skip, take);",
      "}",
    ],
    variants: ["Climbing stairs (count ways)", "House robber (take or skip)", "Coin change (min coins for an amount)", "LIS and word break (prefix scans)"],
    film: [
      f(0, "Name the state", "Write what dp[i] means in one sentence. If you cannot, the recurrence will not come.", 1),
      f(9, "State the transition", "Each step is a choice between a small set of earlier states, usually i-1, i-2, or the best below i.", 4),
      f(18, "Base cases are not filler", "dp[0] often means the empty prefix and must be legal, not zero by accident.", 2),
      f(27, "Two variables beat an array", "When only the last two states matter, rolling variables cut space from O(n) to O(1).", 3),
      f(35, "Prove greed fails", "House robber shows why: a locally best pick can block two better later picks. That is the DP argument.", 5),
      f(43, "Interview line to say", "\u201cdp[i] is the best answer for the first i items; the transition tries taking and skipping, so this is O(n) time.\u201d", 7),
    ],
  },
  {
    name: "2-D DP",
    tagline: "Two sequences, one grid of subproblems.",
    cue: "Compare two strings or arrays, walk a grid with obstacles, or spend a budget. Two independent indices means two DP dimensions.",
    complexity: "O(m·n) time · O(m·n), or O(n) with one rolling row",
    tier: 2,
    template: [
      "function lcs(a, b) {",
      "  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));",
      "  for (let i = 1; i <= a.length; i++) {",
      "    for (let j = 1; j <= b.length; j++) {",
      "      dp[i][j] = a[i - 1] === b[j - 1]",
      "        ? dp[i - 1][j - 1] + 1",
      "        : Math.max(dp[i - 1][j], dp[i][j - 1]);",
      "    }",
      "  }",
      "  return dp[a.length][b.length];",
      "}",
    ],
    variants: ["Longest common subsequence", "Edit distance", "Unique paths in a grid", "Knapsack over capacity"],
    film: [
      f(0, "Two indices, two dimensions", "dp[i][j] is the answer for the first i of one input and the first j of the other.", 1),
      f(9, "Read the grid as a walk", "Each cell comes from the top, the left, or the diagonal \u2014 that is the whole recurrence picture.", 6),
      f(18, "Match versus mismatch", "On a match you extend the diagonal; otherwise you take the better of top and left.", 5),
      f(27, "The offset trap", "dp has an extra row and column for the empty prefix, which is why we read a[i-1].", 2),
      f(35, "Rolling rows", "Only the previous row is needed, so space drops to one dimension. Say it, then show it.", 3),
      f(43, "Interview line to say", "\u201cSubproblems are prefix pairs, so it is m times n cells with three transitions each.\u201d", 4),
    ],
  },
  {
    name: "Greedy",
    tagline: "Take the best available choice, and prove it never hurts.",
    cue: "A single pass that picks locally optimal items, where you can argue an exchange: any optimal answer can be rewritten to include your choice without getting worse.",
    complexity: "O(n log n) with a sort · O(n) if already ordered",
    tier: 2,
    template: [
      "function maxNonOverlapping(intervals) {",
      "  intervals.sort((a, b) => a[1] - b[1]);",
      "  let count = 0, end = -Infinity;",
      "  for (const [start, finish] of intervals) {",
      "    if (start >= end) { count++; end = finish; }",
      "  }",
      "  return count;",
      "}",
    ],
    variants: ["Interval scheduling", "Jump game reachability", "Gas station circuit", "Refuel / use-the-best-last"],
    film: [
      f(0, "Greedy needs a proof", "The claim is: choosing this now costs nothing later. That is the sentence interviewers want.", 4),
      f(9, "Sort to expose the choice", "Most greedy solutions become trivial after sorting by end time, by gain, or by gap.", 1),
      f(18, "The exchange argument", "Take any optimal solution; swap its first pick for yours. It stays valid and stays optimal.", 4),
      f(27, "Where greedy breaks", "Knapsack with fractions yes, with 0/1 items no. Knowing the boundary is the skill.", 2),
      f(35, "One running state", "Keep only the current best or the current boundary, not a table \u2014 that is why space is O(1).", 3),
      f(43, "Interview line to say", "\u201cI sort by earliest finish and take anything that still fits; an exchange argument shows this is optimal.\u201d", 6),
    ],
  },
  {
    name: "Intervals",
    tagline: "Sort by start, then decide overlap or no overlap.",
    cue: "Time ranges, meetings, ranges to cover, or anything with a start and an end. Overlap is always a comparison between the current start and the previous end.",
    complexity: "O(n log n) time · O(n) space",
    tier: 2,
    template: [
      "function mergeIntervals(intervals) {",
      "  intervals.sort((a, b) => a[0] - b[0]);",
      "  const merged = [];",
      "  for (const current of intervals) {",
      "    const last = merged.at(-1);",
      "    if (last && current[0] <= last[1]) last[1] = Math.max(last[1], current[1]);",
      "    else merged.push([...current]);",
      "  }",
      "  return merged;",
      "}",
    ],
    variants: ["Merge overlapping", "Insert into a sorted list", "Meeting rooms (sweep line)", "Non-overlapping minimum removals"],
    film: [
      f(0, "Sort by start first", "Ordering turns a global problem into a local comparison with one previous interval.", 1),
      f(8, "Overlap test", "current.start <= last.end. Everything else follows from that one line.", 5),
      f(17, "Extend, do not append", "On overlap widen the end to the maximum of both ends, not the latest end.", 6),
      f(26, "Counting rooms", "Sweep start and end events in time order; the peak concurrent count is the answer.", 3),
      f(35, "Binary search cousin", "Inserting into a sorted disjoint list finds the first overlapping index with lower bound.", 4),
      f(43, "Interview line to say", "\u201cAfter sorting by start, I only compare against the interval I just kept, so the merge is one pass.\u201d", 8),
    ],
  },
  {
    name: "Heaps",
    tagline: "A priority queue when you only ever need the extreme.",
    cue: "Top k, k-th largest, median of a stream, merge k sorted lists, earliest finishing task. You do not want everything sorted \u2014 only the best one, repeatedly.",
    complexity: "O(n log k) time · O(k) space",
    tier: 2,
    template: [
      "// JavaScript has no heap: sort once, or use an array as a min-heap.",
      "function topK(nums, k) {",
      "  const heap = [];",
      "  for (const value of nums) {",
      "    heap.push(value);",
      "    if (heap.length > k) heap.splice(heap.indexOf(Math.min(...heap)), 1);",
      "  }",
      "  return heap;",
      "}",
    ],
    variants: ["Kth largest / smallest", "Top k frequent", "Two heaps for a running median", "Merge k sorted lists"],
    film: [
      f(0, "Only the extreme matters", "A heap keeps the next-best item at the top for a constant-time peek.", 2),
      f(9, "Size k, not size n", "For top k, hold a heap of k and evict the smallest. That is the O(n log k) claim.", 5),
      f(18, "Two heaps for a median", "A max-heap for the lower half, a min-heap for the upper, balanced to within one element.", 3),
      f(27, "Merge k lists", "Seed the heap with one node per list, pop the smallest, push its successor.", 4),
      f(36, "The JS caveat worth naming", "There is no built-in heap. Say you would implement one, or sort once if k is static.", 0),
      f(44, "Interview line to say", "\u201cA size-k heap gives log k per insertion, so the whole pass is n log k with k memory.\u201d", 7),
    ],
  },
  {
    name: "Bit Manipulation",
    tagline: "Use the word itself as storage.",
    cue: "Parity, single number that appears once, subsets of a small set, counting bits, or a hard memory limit. \u201cWithout extra space\u201d plus \u201conly two values\u201d usually means XOR.",
    complexity: "O(n) time · O(1) space",
    tier: 3,
    template: [
      "function singleNumber(nums) {",
      "  let answer = 0;",
      "  for (const value of nums) {",
      "    answer ^= value;                 // pairs cancel, the survivor stays",
      "  }",
      "  return answer;",
      "}",
    ],
    variants: ["XOR to cancel pairs", "Bit counting and shifts", "Masks and subsets (n <= 20)", "Power-of-two and parity tests"],
    film: [
      f(0, "XOR cancels duplicates", "x ^ x is zero and x ^ 0 is x, so every pair disappears and the lone value survives.", 3),
      f(9, "Shifts walk the bits", "value >> 1 moves right; value & 1 reads the lowest bit. Together they count set bits.", 2),
      f(18, "Masks enumerate subsets", "For up to about twenty items, an integer is a membership vector and 1 << n is a new subset.", 1),
      f(27, "Clear and set", "x & (x - 1) drops the lowest set bit; x | mask adds one. Both are constant time.", 5),
      f(36, "When it is the wrong tool", "If readability suffers and a set costs a few kilobytes, use the set and say so.", 5),
      f(44, "Interview line to say", "\u201cXOR is associative and commutative, so pairs cancel regardless of order and I need no extra memory.\u201d", 3),
    ],
  },
];

export const patternCardByName = new Map(patternCards.map((card) => [card.name, card]));

// The 50 canonical titles in dsaSheet.ts. The sheet repeats them as numbered
// reps, so a canonical problem is what an interviewer actually asks and a rep is
// practice volume on top of that. The tiers follow that split.
export const mustKnowTitles: string[] = [
  "Two Sum", "Valid Anagram", "Group Anagrams", "Top K Frequent Elements", "Product of Array Except Self",
  "Valid Palindrome", "3Sum", "Container With Most Water", "Trapping Rain Water", "Best Time to Buy and Sell Stock",
  "Longest Repeating Character Replacement", "Longest Substring Without Repeating Characters", "Minimum Window Substring",
  "Valid Parentheses", "Min Stack",
  "Daily Temperatures", "Binary Search", "Koko Eating Bananas", "Reverse Linked List", "Merge Two Sorted Lists",
  "Remove Nth Node From End of List", "LRU Cache", "Invert Binary Tree", "Maximum Depth of Binary Tree",
  "Binary Tree Level Order Traversal", "Validate Binary Search Tree", "Kth Smallest Element in a BST",
  "Subsets", "Combination Sum", "Permutations",
  "Number of Islands", "Clone Graph", "Rotting Oranges", "Course Schedule", "Climbing Stairs", "House Robber",
  "Coin Change", "Longest Increasing Subsequence", "Word Break", "Unique Paths", "Longest Common Subsequence",
];

const mustKnow = new Set(mustKnowTitles);

export type InterviewTier = 1 | 2 | 3;

export function interviewTier(problem: Problem): InterviewTier {
  if (problem.title.includes(" · Pattern ")) return 3;
  return mustKnow.has(problem.title) ? 1 : 2;
}

export const tierLabels: Record<InterviewTier, string> = {
  1: "Must know",
  2: "Strong signal",
  3: "Extra reps",
};

export const interviewPlan: Array<{ week: number; focus: string[]; goal: string }> = [
  { week: 1, focus: ["Arrays & Hashing", "Two Pointers"], goal: "Lookups and single-pass scans. This pair alone covers most screening rounds." },
  { week: 2, focus: ["Sliding Window", "Stack"], goal: "Contiguous ranges and nesting. Both are one-pass patterns you can say aloud." },
  { week: 3, focus: ["Binary Search", "Linked List"], goal: "Halving and pointer rewiring. Boundaries and invariants are the graded part." },
  { week: 4, focus: ["Trees"], goal: "Recursion, traversals and BST ranges. Every downstream pattern borrows this." },
  { week: 5, focus: ["Graphs"], goal: "BFS for distance, DFS for regions, topological order for dependencies." },
  { week: 6, focus: ["1-D DP", "Monotonic Stack"], goal: "State, transition, base case. Then the amortised argument for the stack." },
  { week: 7, focus: ["Backtracking", "2-D DP"], goal: "Choose-explore-unchoose, then the prefix-pair grid." },
  { week: 8, focus: ["Heaps", "Intervals", "Greedy", "Bit Manipulation"], goal: "The polish round: priority queues, sweeps, exchange proofs, masks." },
];

export const filmLength = (card: PatternCard) => card.film[card.film.length - 1].at + 8;

function stamp(seconds: number) {
  const pad = (value: number, size = 2) => String(Math.floor(value)).padStart(size, "0");
  return `${pad(seconds / 3600)}:${pad((seconds % 3600) / 60)}:${pad(seconds % 60)}.000`;
}

/**
 * WebVTT for the silent film, so a muted screen recording can ship with
 * subtitles. `say` adds whatever the voice reads beyond the caption - the code
 * line and the live state - which keeps the file and the spoken track identical.
 */
export function vttFor(card: PatternCard, say?: (stepIndex: number) => string) {
  const cues = card.film.map((step, index) => {
    const start = step.at;
    const end = index + 1 < card.film.length ? card.film[index + 1].at : filmLength(card);
    const extra = say?.(index);
    return `${index + 1}\n${stamp(start)} --> ${stamp(end)}\n${step.title}\n${step.caption}${extra ? `\n${extra}` : ""}`;
  });
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}
