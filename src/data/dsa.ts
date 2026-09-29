import { buildExtraProblems } from "./extra-problems";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Topic {
  slug: string;
  name: string;
  description: string;
}

export interface Pattern {
  slug: string;
  name: string;
  topic: string; // topic slug
  description: string;
  identification: string;
  whenToUse: string;
  template: string;
  complexity: string;
  relatedPatterns: string[];
  commonMistakes: string[];
}

export interface Problem {
  slug: string;
  title: string;
  topic: string; // topic slug
  pattern: string; // pattern slug
  difficulty: Difficulty;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
  bruteForce: string;
  optimizedApproach: string;
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  starterCode: Record<"cpp" | "javascript" | "python" | "java", string>;
  solutionCode: string;
  externalUrl: string;
  isPremium: boolean;
}

export const TOPICS: Topic[] = [
  { slug: "arrays", name: "Arrays", description: "Indexing, prefix sums, in-place tricks." },
  { slug: "strings", name: "Strings", description: "Parsing, comparison and character counting." },
  { slug: "hashing", name: "Hashing", description: "Maps and sets for O(1) lookups." },
  { slug: "two-pointers", name: "Two Pointers", description: "Converging and chasing indices." },
  { slug: "sliding-window", name: "Sliding Window", description: "Contiguous subarray optimisation." },
  { slug: "binary-search", name: "Binary Search", description: "Halving a monotonic search space." },
  { slug: "linked-list", name: "Linked List", description: "Pointer surgery and cycle detection." },
  { slug: "stack", name: "Stack", description: "LIFO, monotonic stacks, parsing." },
  { slug: "queue", name: "Queue", description: "FIFO, deque and BFS frontiers." },
  { slug: "recursion", name: "Recursion", description: "Base cases and recursive trust." },
  { slug: "backtracking", name: "Backtracking", description: "Choose, explore, un-choose." },
  { slug: "trees", name: "Trees", description: "Traversals and divide-and-conquer on nodes." },
  { slug: "bst", name: "BST", description: "Ordered trees and inorder properties." },
  { slug: "heap", name: "Heap", description: "Top-K and streaming medians." },
  { slug: "greedy", name: "Greedy", description: "Local choices that stay globally optimal." },
  { slug: "graphs", name: "Graphs", description: "BFS, DFS, topological order, shortest paths." },
  { slug: "dynamic-programming", name: "Dynamic Programming", description: "Overlapping subproblems." },
  { slug: "bit-manipulation", name: "Bit Manipulation", description: "XOR tricks and masks." },
  { slug: "trie", name: "Trie", description: "Prefix trees for word problems." },
  { slug: "advanced", name: "Advanced Algorithms", description: "Union-Find, segment trees, and more." },
];

export const PATTERNS: Pattern[] = [
  {
    slug: "hash-map-lookup",
    name: "Hash Map Complement Lookup",
    topic: "hashing",
    description:
      "Store what you have already seen in a hash map so each new element can be matched in constant time.",
    identification:
      "You need to find a pair/target relationship and the brute force is a nested loop over the same array.",
    whenToUse: "Pair sums, duplicate detection, frequency comparisons, anagram grouping.",
    template: `seen = {}
for i, x in enumerate(nums):
    if target - x in seen:
        return [seen[target - x], i]
    seen[x] = i`,
    complexity: "Time O(n) · Space O(n)",
    relatedPatterns: ["frequency-counter", "two-pointer-converging"],
    commonMistakes: [
      "Inserting the current element before checking for its complement.",
      "Assuming the array is sorted when it is not.",
    ],
  },
  {
    slug: "frequency-counter",
    name: "Frequency Counter",
    topic: "hashing",
    description: "Count occurrences in a map and compare counts instead of comparing elements pairwise.",
    identification: "The question mentions duplicates, anagrams, 'k most', or character counts.",
    whenToUse: "Contains Duplicate, Valid Anagram, Top K Frequent.",
    template: `count = {}
for x in arr:
    count[x] = count.get(x, 0) + 1`,
    complexity: "Time O(n) · Space O(n)",
    relatedPatterns: ["hash-map-lookup", "top-k-heap"],
    commonMistakes: ["Sorting when counting is enough.", "Forgetting case sensitivity in strings."],
  },
  {
    slug: "two-pointer-converging",
    name: "Converging Two Pointers",
    topic: "two-pointers",
    description: "Start pointers at both ends and move the one that cannot improve the answer.",
    identification: "Sorted input plus a target condition, or a palindrome/reversal question.",
    whenToUse: "Two Sum II, container with most water, palindrome checks.",
    template: `l, r = 0, len(a) - 1
while l < r:
    if condition: l += 1
    else: r -= 1`,
    complexity: "Time O(n) · Space O(1)",
    relatedPatterns: ["fast-slow-pointers", "hash-map-lookup"],
    commonMistakes: ["Moving both pointers at once.", "Using it on unsorted data."],
  },
  {
    slug: "fast-slow-pointers",
    name: "Fast & Slow Pointers",
    topic: "linked-list",
    description: "Two pointers at different speeds reveal cycles, midpoints and nth-from-end nodes.",
    identification: "Linked list question about a cycle, middle node, or a single pass with O(1) memory.",
    whenToUse: "Cycle detection, middle of list, palindrome linked list.",
    template: `slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next`,
    complexity: "Time O(n) · Space O(1)",
    relatedPatterns: ["pointer-reversal", "two-pointer-converging"],
    commonMistakes: ["Not null-checking fast.next.", "Returning slow before the loop ends."],
  },
  {
    slug: "pointer-reversal",
    name: "Iterative Pointer Reversal",
    topic: "linked-list",
    description: "Walk the list once, flipping each next pointer with a saved reference.",
    identification: "You must reverse a list or a sublist in place.",
    whenToUse: "Reverse Linked List, reverse in k-groups, palindrome list.",
    template: `prev = None
while head:
    nxt = head.next
    head.next = prev
    prev, head = head, nxt`,
    complexity: "Time O(n) · Space O(1)",
    relatedPatterns: ["fast-slow-pointers", "merge-two-lists"],
    commonMistakes: ["Losing the next pointer before reassigning.", "Returning head instead of prev."],
  },
  {
    slug: "merge-two-lists",
    name: "Merge Sorted Sequences",
    topic: "linked-list",
    description: "Use a dummy head and always attach the smaller front element.",
    identification: "Two already-sorted sequences must become one sorted sequence.",
    whenToUse: "Merge Two Sorted Lists, merge intervals pre-step, merge sort.",
    template: `dummy = tail = Node()
while a and b:
    if a.val <= b.val: tail.next, a = a, a.next
    else: tail.next, b = b, b.next
    tail = tail.next
tail.next = a or b`,
    complexity: "Time O(n + m) · Space O(1)",
    relatedPatterns: ["pointer-reversal", "top-k-heap"],
    commonMistakes: ["Forgetting the leftover tail.", "Allocating a new list instead of relinking."],
  },
  {
    slug: "variable-sliding-window",
    name: "Variable-Size Sliding Window",
    topic: "sliding-window",
    description: "Expand the right edge, and shrink from the left while the window is invalid.",
    identification: "Longest/shortest contiguous subarray or substring satisfying a constraint.",
    whenToUse: "Longest substring without repeats, minimum window substring.",
    template: `l = 0
for r, ch in enumerate(s):
    add(ch)
    while invalid():
        remove(s[l]); l += 1
    best = max(best, r - l + 1)`,
    complexity: "Time O(n) · Space O(k)",
    relatedPatterns: ["fixed-sliding-window", "frequency-counter"],
    commonMistakes: ["Using if instead of while when shrinking.", "Updating the answer before restoring validity."],
  },
  {
    slug: "fixed-sliding-window",
    name: "Fixed-Size Sliding Window",
    topic: "sliding-window",
    description: "Slide a window of constant width, adding one element and removing one each step.",
    identification: "The problem gives you a window size k.",
    whenToUse: "Max sum subarray of size k, averages, anagram search.",
    template: `for r in range(n):
    add(a[r])
    if r >= k: remove(a[r - k])
    if r >= k - 1: best = max(best, cur)`,
    complexity: "Time O(n) · Space O(1)",
    relatedPatterns: ["variable-sliding-window", "kadane"],
    commonMistakes: ["Off-by-one when removing the outgoing element."],
  },
  {
    slug: "kadane",
    name: "Kadane's Algorithm",
    topic: "dynamic-programming",
    description: "Track the best subarray ending at each index; restart when the running sum turns negative.",
    identification: "Maximum/minimum sum or product of a contiguous subarray.",
    whenToUse: "Maximum Subarray, max product subarray, best time to buy and sell stock.",
    template: `cur = best = a[0]
for x in a[1:]:
    cur = max(x, cur + x)
    best = max(best, cur)`,
    complexity: "Time O(n) · Space O(1)",
    relatedPatterns: ["one-pass-min-tracking", "linear-dp"],
    commonMistakes: ["Initialising best to 0 with all-negative input."],
  },
  {
    slug: "one-pass-min-tracking",
    name: "One-Pass Min/Max Tracking",
    topic: "arrays",
    description: "Keep the best value seen so far and evaluate each new element against it.",
    identification: "You need the best difference/profit between a later and an earlier element.",
    whenToUse: "Best Time to Buy and Sell Stock, max difference problems.",
    template: `best_so_far = a[0]
for x in a[1:]:
    ans = max(ans, x - best_so_far)
    best_so_far = min(best_so_far, x)`,
    complexity: "Time O(n) · Space O(1)",
    relatedPatterns: ["kadane"],
    commonMistakes: ["Updating the minimum before computing the answer."],
  },
  {
    slug: "classic-binary-search",
    name: "Classic Binary Search",
    topic: "binary-search",
    description: "Halve a sorted search space by comparing against the middle element.",
    identification: "Sorted array + O(log n) requirement, or 'find the boundary' phrasing.",
    whenToUse: "Search in sorted array, first/last occurrence, search insert position.",
    template: `l, r = 0, n - 1
while l <= r:
    m = (l + r) // 2
    if a[m] == t: return m
    if a[m] < t: l = m + 1
    else: r = m - 1`,
    complexity: "Time O(log n) · Space O(1)",
    relatedPatterns: ["rotated-binary-search", "binary-search-on-answer"],
    commonMistakes: ["Infinite loops from wrong bound updates.", "Overflow with (l + r) in C++/Java."],
  },
  {
    slug: "rotated-binary-search",
    name: "Binary Search on Rotated Array",
    topic: "binary-search",
    description: "One half of a rotated sorted array is always sorted — decide which and recurse there.",
    identification: "Sorted array that has been rotated at an unknown pivot.",
    whenToUse: "Search in Rotated Sorted Array, find minimum in rotated array.",
    template: `if a[l] <= a[m]:
    # left half sorted
else:
    # right half sorted`,
    complexity: "Time O(log n) · Space O(1)",
    relatedPatterns: ["classic-binary-search"],
    commonMistakes: ["Comparing with a[m] instead of the sorted-half bounds."],
  },
  {
    slug: "binary-search-on-answer",
    name: "Binary Search on the Answer",
    topic: "binary-search",
    description: "Search over the answer range with a monotonic feasibility predicate.",
    identification: "'Minimum largest ...' or 'maximum minimum ...' phrasing.",
    whenToUse: "Koko eating bananas, split array largest sum, ship packages.",
    template: `while lo < hi:
    mid = (lo + hi) // 2
    if feasible(mid): hi = mid
    else: lo = mid + 1`,
    complexity: "Time O(n log range) · Space O(1)",
    relatedPatterns: ["classic-binary-search"],
    commonMistakes: ["A predicate that is not monotonic."],
  },
  {
    slug: "monotonic-stack",
    name: "Monotonic Stack",
    topic: "stack",
    description: "Keep a stack in sorted order, popping whenever the new element breaks the order.",
    identification: "Next greater/smaller element, spans, histogram areas.",
    whenToUse: "Daily temperatures, largest rectangle in histogram.",
    template: `for i, x in enumerate(a):
    while st and a[st[-1]] < x:
        j = st.pop(); ans[j] = i - j
    st.append(i)`,
    complexity: "Time O(n) · Space O(n)",
    relatedPatterns: ["bracket-matching", "auxiliary-stack"],
    commonMistakes: ["Storing values instead of indices when distances matter."],
  },
  {
    slug: "bracket-matching",
    name: "Bracket Matching Stack",
    topic: "stack",
    description: "Push openers, pop and verify on each closer, and require an empty stack at the end.",
    identification: "Balanced parentheses, nested structures, expression validity.",
    whenToUse: "Valid Parentheses, remove invalid parentheses, decode string.",
    template: `for ch in s:
    if ch in pairs: st.append(ch)
    elif not st or pairs[st.pop()] != ch: return False
return not st`,
    complexity: "Time O(n) · Space O(n)",
    relatedPatterns: ["monotonic-stack"],
    commonMistakes: ["Forgetting the final emptiness check."],
  },
  {
    slug: "auxiliary-stack",
    name: "Auxiliary / Paired Stack",
    topic: "stack",
    description: "Carry extra state alongside each pushed value so queries stay O(1).",
    identification: "A stack that must also answer min/max in constant time.",
    whenToUse: "Min Stack, max stack, stack with increments.",
    template: `push(x): st.append((x, min(x, st[-1][1] if st else x)))`,
    complexity: "Time O(1) per op · Space O(n)",
    relatedPatterns: ["monotonic-stack"],
    commonMistakes: ["Popping the value stack but not the min stack."],
  },
  {
    slug: "dfs-tree-traversal",
    name: "DFS Tree Traversal",
    topic: "trees",
    description: "Recursively visit nodes in pre/in/post order and combine child results.",
    identification: "Anything that must touch every node of a tree.",
    whenToUse: "Inorder traversal, depth, path sums, subtree checks.",
    template: `def dfs(node):
    if not node: return
    dfs(node.left); visit(node); dfs(node.right)`,
    complexity: "Time O(n) · Space O(h)",
    relatedPatterns: ["bfs-level-order", "bst-ordering"],
    commonMistakes: ["Missing the null base case.", "Mixing up traversal order."],
  },
  {
    slug: "bfs-level-order",
    name: "BFS Level Order",
    topic: "trees",
    description: "Process a queue level by level, capturing the size of each level before expanding it.",
    identification: "The answer is grouped by depth, or you need the shortest number of steps.",
    whenToUse: "Level order traversal, right side view, shortest path in unweighted graphs.",
    template: `q = [root]
while q:
    level = []
    for _ in range(len(q)):
        n = q.pop(0); level.append(n.val)
        q += [c for c in (n.left, n.right) if c]`,
    complexity: "Time O(n) · Space O(n)",
    relatedPatterns: ["dfs-tree-traversal", "grid-flood-fill"],
    commonMistakes: ["Not snapshotting the level size before the inner loop."],
  },
  {
    slug: "bst-ordering",
    name: "BST Ordering Property",
    topic: "bst",
    description: "Use the left < node < right invariant to descend to exactly one child.",
    identification: "The tree is a BST and you can discard half the tree at each step.",
    whenToUse: "BST search/insert, lowest common ancestor, validate BST.",
    template: `while node:
    if p < node and q < node: node = node.left
    elif p > node and q > node: node = node.right
    else: return node`,
    complexity: "Time O(h) · Space O(1)",
    relatedPatterns: ["dfs-tree-traversal", "classic-binary-search"],
    commonMistakes: ["Using the BST rule on a plain binary tree."],
  },
  {
    slug: "grid-flood-fill",
    name: "Grid Flood Fill (DFS/BFS)",
    topic: "graphs",
    description: "Treat the grid as a graph and sink each connected region once visited.",
    identification: "2D grid with connected components, islands, regions or areas.",
    whenToUse: "Number of Islands, max area of island, surrounded regions.",
    template: `def fill(r, c):
    if out_of_bounds or grid[r][c] != '1': return
    grid[r][c] = '0'
    for dr, dc in DIRS: fill(r + dr, c + dc)`,
    complexity: "Time O(rows·cols) · Space O(rows·cols)",
    relatedPatterns: ["bfs-level-order", "graph-clone-traversal", "union-find"],
    commonMistakes: ["Marking visited after recursion, causing infinite loops."],
  },
  {
    slug: "graph-clone-traversal",
    name: "Graph Traversal with Visited Map",
    topic: "graphs",
    description: "Track visited nodes in a map so cycles terminate and shared nodes are reused.",
    identification: "General graph, possible cycles, need identity of already-seen nodes.",
    whenToUse: "Clone Graph, course schedule, connected components.",
    template: `def dfs(node):
    if node in seen: return seen[node]
    copy = Node(node.val); seen[node] = copy
    copy.neighbors = [dfs(n) for n in node.neighbors]
    return copy`,
    complexity: "Time O(V + E) · Space O(V)",
    relatedPatterns: ["grid-flood-fill", "union-find"],
    commonMistakes: ["Registering the clone after recursing, which loops forever."],
  },
  {
    slug: "union-find",
    name: "Union-Find (Disjoint Set)",
    topic: "advanced",
    description: "Near-constant-time merging and connectivity queries with path compression.",
    identification: "Dynamic connectivity, grouping, cycle detection in undirected graphs.",
    whenToUse: "Number of provinces, redundant connection, Kruskal's MST.",
    template: `def find(x):
    while p[x] != x:
        p[x] = p[p[x]]; x = p[x]
    return x`,
    complexity: "Time ~O(α(n)) per op · Space O(n)",
    relatedPatterns: ["grid-flood-fill", "graph-clone-traversal"],
    commonMistakes: ["Skipping union by rank/size and degrading to O(n)."],
  },
  {
    slug: "linear-dp",
    name: "1-D Linear DP",
    topic: "dynamic-programming",
    description: "Define dp[i] from a constant number of earlier states and iterate forward.",
    identification: "Count ways / best value where state i depends on i-1, i-2, ...",
    whenToUse: "Climbing Stairs, House Robber, decode ways.",
    template: `dp[0], dp[1] = base0, base1
for i in range(2, n + 1):
    dp[i] = combine(dp[i - 1], dp[i - 2])`,
    complexity: "Time O(n) · Space O(1) with rolling variables",
    relatedPatterns: ["kadane", "unbounded-knapsack", "lis-dp"],
    commonMistakes: ["Wrong base cases.", "Keeping a full array when two variables suffice."],
  },
  {
    slug: "unbounded-knapsack",
    name: "Unbounded Knapsack / Coin DP",
    topic: "dynamic-programming",
    description: "Each item can be reused, so iterate amounts outward and relax with every item.",
    identification: "Unlimited supply of items, minimise count or count combinations.",
    whenToUse: "Coin Change, combination sum IV, rod cutting.",
    template: `for a in range(1, amount + 1):
    for c in coins:
        if c <= a: dp[a] = min(dp[a], dp[a - c] + 1)`,
    complexity: "Time O(amount · coins) · Space O(amount)",
    relatedPatterns: ["linear-dp", "lis-dp"],
    commonMistakes: ["Using the 0/1 knapsack loop order by mistake."],
  },
  {
    slug: "lis-dp",
    name: "Longest Increasing Subsequence DP",
    topic: "dynamic-programming",
    description: "dp[i] is the best subsequence ending at i; optionally use patience sorting for O(n log n).",
    identification: "Subsequence (not subarray) with an ordering constraint.",
    whenToUse: "LIS, russian doll envelopes, longest chain.",
    template: `for i in range(n):
    for j in range(i):
        if a[j] < a[i]: dp[i] = max(dp[i], dp[j] + 1)`,
    complexity: "Time O(n²) or O(n log n) · Space O(n)",
    relatedPatterns: ["linear-dp", "classic-binary-search"],
    commonMistakes: ["Confusing subsequence with subarray."],
  },
  {
    slug: "top-k-heap",
    name: "Top-K with a Heap",
    topic: "heap",
    description: "Maintain a size-k heap so each element costs only log k.",
    identification: "'K largest/smallest/most frequent' or a streaming input.",
    whenToUse: "Kth largest element, top k frequent, merge k sorted lists.",
    template: `for x in a:
    heappush(h, x)
    if len(h) > k: heappop(h)`,
    complexity: "Time O(n log k) · Space O(k)",
    relatedPatterns: ["frequency-counter", "merge-two-lists"],
    commonMistakes: ["Using a max-heap when a min-heap of size k is needed."],
  },
  {
    slug: "backtracking-choose-explore",
    name: "Choose · Explore · Un-choose",
    topic: "backtracking",
    description: "Build a candidate incrementally and undo the last decision when the branch fails.",
    identification: "Generate all subsets/permutations/combinations or solve a constraint puzzle.",
    whenToUse: "Subsets, permutations, N-Queens, word search.",
    template: `def bt(path, start):
    res.append(path[:])
    for i in range(start, n):
        path.append(a[i]); bt(path, i + 1); path.pop()`,
    complexity: "Time O(2ⁿ)–O(n!) · Space O(n)",
    relatedPatterns: ["dfs-tree-traversal", "trie-prefix"],
    commonMistakes: ["Appending the path by reference instead of copying."],
  },
  {
    slug: "trie-prefix",
    name: "Trie Prefix Tree",
    topic: "trie",
    description: "Store words character by character so prefix queries cost O(word length).",
    identification: "Many prefix or dictionary lookups over a fixed word set.",
    whenToUse: "Implement Trie, word search II, autocomplete.",
    template: `node = root
for ch in word:
    node = node.children.setdefault(ch, {})
node['#'] = True`,
    complexity: "Time O(L) per op · Space O(total chars)",
    relatedPatterns: ["backtracking-choose-explore"],
    commonMistakes: ["No end-of-word marker, so prefixes count as words."],
  },
  {
    slug: "xor-trick",
    name: "XOR Pairing Trick",
    topic: "bit-manipulation",
    description: "a ^ a = 0 and a ^ 0 = a, so paired values cancel out.",
    identification: "Find the single/missing number with O(1) space.",
    whenToUse: "Single number, missing number, swap without temp.",
    template: `res = 0
for x in a: res ^= x`,
    complexity: "Time O(n) · Space O(1)",
    relatedPatterns: ["frequency-counter"],
    commonMistakes: ["Using XOR when more than one element is unpaired."],
  },
  {
    slug: "greedy-interval",
    name: "Greedy Interval Selection",
    topic: "greedy",
    description: "Sort by end time (or start) and take whatever is still compatible.",
    identification: "Scheduling, non-overlapping intervals, minimum removals.",
    whenToUse: "Merge intervals, non-overlapping intervals, meeting rooms.",
    template: `a.sort(key=lambda x: x[1])
for s, e in a:
    if s >= last_end: take(); last_end = e`,
    complexity: "Time O(n log n) · Space O(1)",
    relatedPatterns: ["linear-dp"],
    commonMistakes: ["Sorting by the wrong endpoint."],
  },
];

const cppStarter = (sig: string) => `class Solution {\npublic:\n    ${sig} {\n        // your code here\n    }\n};`;

function starter(
  cpp: string,
  js: string,
  py: string,
  java: string,
): Problem["starterCode"] {
  return { cpp, javascript: js, python: py, java };
}

const CORE_PROBLEMS: Problem[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    topic: "hashing",
    pattern: "hash-map-lookup",
    difficulty: "Easy",
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Each input has exactly one solution and you may not use the same element twice.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 9." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Exactly one valid answer exists"],
    hints: [
      "What would you need to look up for each element?",
      "A hash map turns 'have I seen x?' into an O(1) question.",
    ],
    bruteForce:
      "Check every pair with two nested loops and return the first pair that sums to target. O(n²) time, O(1) space.",
    optimizedApproach:
      "Walk the array once. For each value x, check whether target - x is already in a hash map of value → index. If it is, you have the answer; otherwise store x and continue.",
    explanation:
      "The nested loop repeats work: for each element it rescans elements it has already visited. A hash map remembers those visits, so the second loop disappears.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    starterCode: starter(
      cppStarter("vector<int> twoSum(vector<int>& nums, int target)"),
      "function twoSum(nums, target) {\n  // your code here\n}",
      "class Solution:\n    def twoSum(self, nums, target):\n        # your code here\n        pass",
      "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    externalUrl: "https://leetcode.com/problems/two-sum/",
    isPremium: false,
  },
  {
    slug: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    topic: "arrays",
    pattern: "one-pass-min-tracking",
    difficulty: "Easy",
    description:
      "You are given an array prices where prices[i] is the price of a stock on day i. Choose one day to buy and a later day to sell. Return the maximum profit, or 0 if no profit is possible.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy at 1, sell at 6." },
      { input: "prices = [7,6,4,3,1]", output: "0" },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    hints: ["Selling today, what is the best day you could have bought?", "Track the minimum price so far."],
    bruteForce: "Try every buy/sell pair with nested loops. O(n²) time.",
    optimizedApproach:
      "Scan once keeping the smallest price seen so far. At each day, the best profit ending today is price - minSoFar.",
    explanation:
      "Profit only depends on the cheapest earlier day, so a single running minimum replaces the inner loop.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    starterCode: starter(
      cppStarter("int maxProfit(vector<int>& prices)"),
      "function maxProfit(prices) {\n  // your code here\n}",
      "class Solution:\n    def maxProfit(self, prices):\n        pass",
      "class Solution {\n    public int maxProfit(int[] prices) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function maxProfit(prices) {
  let min = Infinity, best = 0;
  for (const p of prices) {
    min = Math.min(min, p);
    best = Math.max(best, p - min);
  }
  return best;
}`,
    externalUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    isPremium: false,
  },
  {
    slug: "maximum-subarray",
    title: "Maximum Subarray",
    topic: "dynamic-programming",
    pattern: "kadane",
    difficulty: "Medium",
    description:
      "Given an integer array nums, find the contiguous subarray with the largest sum and return that sum.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "[4,-1,2,1] has sum 6." },
      { input: "nums = [5,4,-1,7,8]", output: "23" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["Is a negative running sum ever worth keeping?", "Define the best subarray ending at index i."],
    bruteForce: "Sum every subarray with two loops. O(n²) time.",
    optimizedApproach:
      "Kadane's algorithm: cur = max(x, cur + x). If the running sum drops below the element itself, restart from that element.",
    explanation:
      "A prefix with negative sum can only hurt any extension, so dropping it is always safe — that is the greedy insight behind the DP.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    starterCode: starter(
      cppStarter("int maxSubArray(vector<int>& nums)"),
      "function maxSubArray(nums) {\n  // your code here\n}",
      "class Solution:\n    def maxSubArray(self, nums):\n        pass",
      "class Solution {\n    public int maxSubArray(int[] nums) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function maxSubArray(nums) {
  let cur = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}`,
    externalUrl: "https://leetcode.com/problems/maximum-subarray/",
    isPremium: false,
  },
  {
    slug: "contains-duplicate",
    title: "Contains Duplicate",
    topic: "hashing",
    pattern: "frequency-counter",
    difficulty: "Easy",
    description: "Return true if any value appears at least twice in the array, and false if every element is distinct.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "true" },
      { input: "nums = [1,2,3,4]", output: "false" },
    ],
    constraints: ["1 <= nums.length <= 10^5"],
    hints: ["A set answers membership in O(1)."],
    bruteForce: "Compare every pair. O(n²) time.",
    optimizedApproach: "Insert into a set while scanning; if an insert finds an existing value, return true.",
    explanation: "Sorting also works in O(n log n), but hashing trades memory for a single linear pass.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    starterCode: starter(
      cppStarter("bool containsDuplicate(vector<int>& nums)"),
      "function containsDuplicate(nums) {\n  // your code here\n}",
      "class Solution:\n    def containsDuplicate(self, nums):\n        pass",
      "class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function containsDuplicate(nums) {
  return new Set(nums).size !== nums.length;
}`,
    externalUrl: "https://leetcode.com/problems/contains-duplicate/",
    isPremium: false,
  },
  {
    slug: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    topic: "sliding-window",
    pattern: "variable-sliding-window",
    difficulty: "Medium",
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: '"abc" is the longest.' },
      { input: 's = "bbbbb"', output: "1" },
    ],
    constraints: ["0 <= s.length <= 5 * 10^4"],
    hints: ["What must happen when the new character is already inside the window?"],
    bruteForce: "Check every substring for uniqueness. O(n³) time.",
    optimizedApproach:
      "Grow a window to the right; whenever a duplicate appears, shrink from the left until the window is valid again.",
    explanation:
      "Each index enters and leaves the window at most once, so the two pointers together do linear work.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(min(n, charset))",
    starterCode: starter(
      cppStarter("int lengthOfLongestSubstring(string s)"),
      "function lengthOfLongestSubstring(s) {\n  // your code here\n}",
      "class Solution:\n    def lengthOfLongestSubstring(self, s):\n        pass",
      "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    while (seen.has(s[r])) seen.delete(s[l++]);
    seen.add(s[r]);
    best = Math.max(best, r - l + 1);
  }
  return best;
}`,
    externalUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    isPremium: false,
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    topic: "binary-search",
    pattern: "classic-binary-search",
    difficulty: "Easy",
    description:
      "Given a sorted array of distinct integers and a target, return its index or -1 if it does not exist. The algorithm must run in O(log n).",
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "nums is sorted ascending"],
    hints: ["Keep the invariant: the target, if present, is inside [l, r]."],
    bruteForce: "Linear scan. O(n) time.",
    optimizedApproach: "Compare with the middle element and discard the impossible half each iteration.",
    explanation: "Halving the search space log₂ n times is what produces the logarithmic bound.",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    starterCode: starter(
      cppStarter("int search(vector<int>& nums, int target)"),
      "function search(nums, target) {\n  // your code here\n}",
      "class Solution:\n    def search(self, nums, target):\n        pass",
      "class Solution {\n    public int search(int[] nums, int target) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function search(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const m = (l + r) >> 1;
    if (nums[m] === target) return m;
    if (nums[m] < target) l = m + 1;
    else r = m - 1;
  }
  return -1;
}`,
    externalUrl: "https://leetcode.com/problems/binary-search/",
    isPremium: false,
  },
  {
    slug: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    topic: "binary-search",
    pattern: "rotated-binary-search",
    difficulty: "Medium",
    description:
      "A sorted array was rotated at an unknown pivot. Given the rotated array and a target, return its index or -1, in O(log n).",
    examples: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1" },
    ],
    constraints: ["1 <= nums.length <= 5000", "All values are unique"],
    hints: ["At least one half around mid is always properly sorted."],
    bruteForce: "Linear scan. O(n) time.",
    optimizedApproach:
      "Find which half is sorted, test whether the target lies inside that sorted range, and move into the correct half.",
    explanation:
      "Rotation breaks global order but not local order — exploiting the sorted half preserves the logarithmic split.",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    starterCode: starter(
      cppStarter("int search(vector<int>& nums, int target)"),
      "function search(nums, target) {\n  // your code here\n}",
      "class Solution:\n    def search(self, nums, target):\n        pass",
      "class Solution {\n    public int search(int[] nums, int target) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function search(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const m = (l + r) >> 1;
    if (nums[m] === target) return m;
    if (nums[l] <= nums[m]) {
      if (nums[l] <= target && target < nums[m]) r = m - 1; else l = m + 1;
    } else {
      if (nums[m] < target && target <= nums[r]) l = m + 1; else r = m - 1;
    }
  }
  return -1;
}`,
    externalUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    isPremium: false,
  },
  {
    slug: "reverse-linked-list",
    title: "Reverse Linked List",
    topic: "linked-list",
    pattern: "pointer-reversal",
    difficulty: "Easy",
    description: "Given the head of a singly linked list, reverse the list and return the new head.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = []", output: "[]" },
    ],
    constraints: ["0 <= nodes <= 5000"],
    hints: ["You need three references: previous, current and next."],
    bruteForce: "Copy values into an array, reverse it, rebuild the list. O(n) time and O(n) space.",
    optimizedApproach: "Relink pointers in place while walking the list once.",
    explanation: "Saving next before overwriting head.next is the whole trick; everything else is bookkeeping.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    starterCode: starter(
      cppStarter("ListNode* reverseList(ListNode* head)"),
      "function reverseList(head) {\n  // your code here\n}",
      "class Solution:\n    def reverseList(self, head):\n        pass",
      "class Solution {\n    public ListNode reverseList(ListNode head) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function reverseList(head) {
  let prev = null;
  while (head) {
    const next = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}`,
    externalUrl: "https://leetcode.com/problems/reverse-linked-list/",
    isPremium: false,
  },
  {
    slug: "merge-two-sorted-lists",
    title: "Merge Two Sorted Lists",
    topic: "linked-list",
    pattern: "merge-two-lists",
    difficulty: "Easy",
    description: "Merge two sorted linked lists into one sorted list by splicing the nodes together.",
    examples: [{ input: "l1 = [1,2,4], l2 = [1,3,4]", output: "[1,1,2,3,4,4]" }],
    constraints: ["0 <= nodes <= 50 per list", "Both lists are sorted ascending"],
    hints: ["A dummy head removes every special case for the first node."],
    bruteForce: "Collect all values, sort, rebuild. O((n+m) log(n+m)).",
    optimizedApproach: "Walk both lists with a tail pointer, always attaching the smaller head.",
    explanation: "Because both inputs are already sorted, one comparison per node is enough.",
    timeComplexity: "O(n + m)",
    spaceComplexity: "O(1)",
    starterCode: starter(
      cppStarter("ListNode* mergeTwoLists(ListNode* a, ListNode* b)"),
      "function mergeTwoLists(a, b) {\n  // your code here\n}",
      "class Solution:\n    def mergeTwoLists(self, a, b):\n        pass",
      "class Solution {\n    public ListNode mergeTwoLists(ListNode a, ListNode b) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function mergeTwoLists(a, b) {
  const dummy = { next: null };
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a || b;
  return dummy.next;
}`,
    externalUrl: "https://leetcode.com/problems/merge-two-sorted-lists/",
    isPremium: false,
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    topic: "stack",
    pattern: "bracket-matching",
    difficulty: "Easy",
    description:
      "Given a string containing (), [] and {}, determine whether the brackets are closed in the correct order.",
    examples: [
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 <= s.length <= 10^4"],
    hints: ["The most recent opener must close first — that is a stack."],
    bruteForce: "Repeatedly delete adjacent matching pairs until nothing changes. O(n²).",
    optimizedApproach: "Push openers, and on each closer pop and verify the match. The stack must end empty.",
    explanation: "Nesting is inherently last-in-first-out, which maps directly onto a stack.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    starterCode: starter(
      cppStarter("bool isValid(string s)"),
      "function isValid(s) {\n  // your code here\n}",
      "class Solution:\n    def isValid(self, s):\n        pass",
      "class Solution {\n    public boolean isValid(String s) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function isValid(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const st = [];
  for (const ch of s) {
    if (!pairs[ch]) st.push(ch);
    else if (st.pop() !== pairs[ch]) return false;
  }
  return st.length === 0;
}`,
    externalUrl: "https://leetcode.com/problems/valid-parentheses/",
    isPremium: false,
  },
  {
    slug: "min-stack",
    title: "Min Stack",
    topic: "stack",
    pattern: "auxiliary-stack",
    difficulty: "Medium",
    description:
      "Design a stack supporting push, pop, top and retrieving the minimum element, each in constant time.",
    examples: [{ input: "push(-2), push(0), push(-3), getMin()", output: "-3" }],
    constraints: ["Methods are always called on a non-empty stack for pop/top/getMin"],
    hints: ["Store the minimum alongside each element."],
    bruteForce: "Scan the stack on every getMin call. O(n) per query.",
    optimizedApproach: "Push pairs of (value, min-so-far), or keep a parallel min stack.",
    explanation: "The minimum for a prefix never changes once pushed, so it can be cached per level.",
    timeComplexity: "O(1) per operation",
    spaceComplexity: "O(n)",
    starterCode: starter(
      "class MinStack {\npublic:\n    MinStack() {}\n    void push(int val) {}\n    void pop() {}\n    int top() {}\n    int getMin() {}\n};",
      "class MinStack {\n  constructor() {}\n  push(val) {}\n  pop() {}\n  top() {}\n  getMin() {}\n}",
      "class MinStack:\n    def __init__(self):\n        pass",
      "class MinStack {\n    public MinStack() {}\n}",
    ),
    solutionCode: `class MinStack {
  constructor() { this.st = []; }
  push(val) {
    const min = this.st.length ? Math.min(val, this.getMin()) : val;
    this.st.push([val, min]);
  }
  pop() { this.st.pop(); }
  top() { return this.st[this.st.length - 1][0]; }
  getMin() { return this.st[this.st.length - 1][1]; }
}`,
    externalUrl: "https://leetcode.com/problems/min-stack/",
    isPremium: false,
  },
  {
    slug: "binary-tree-inorder-traversal",
    title: "Binary Tree Inorder Traversal",
    topic: "trees",
    pattern: "dfs-tree-traversal",
    difficulty: "Easy",
    description: "Given the root of a binary tree, return the inorder (left, node, right) traversal of its values.",
    examples: [{ input: "root = [1,null,2,3]", output: "[1,3,2]" }],
    constraints: ["0 <= nodes <= 100"],
    hints: ["Recursion first; then try the explicit stack version."],
    bruteForce: "There is no slower sensible approach — every node must be visited.",
    optimizedApproach: "Recurse left, visit the node, recurse right. Iteratively, push left spine onto a stack.",
    explanation: "Traversal order is a choice of when you 'visit' relative to the recursive calls.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(h)",
    starterCode: starter(
      cppStarter("vector<int> inorderTraversal(TreeNode* root)"),
      "function inorderTraversal(root) {\n  // your code here\n}",
      "class Solution:\n    def inorderTraversal(self, root):\n        pass",
      "class Solution {\n    public List<Integer> inorderTraversal(TreeNode root) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function inorderTraversal(root) {
  const res = [], st = [];
  let node = root;
  while (node || st.length) {
    while (node) { st.push(node); node = node.left; }
    node = st.pop();
    res.push(node.val);
    node = node.right;
  }
  return res;
}`,
    externalUrl: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
    isPremium: false,
  },
  {
    slug: "binary-tree-level-order-traversal",
    title: "Binary Tree Level Order Traversal",
    topic: "trees",
    pattern: "bfs-level-order",
    difficulty: "Medium",
    description: "Return the values of a binary tree level by level, from left to right.",
    examples: [{ input: "root = [3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]" }],
    constraints: ["0 <= nodes <= 2000"],
    hints: ["Record the queue length before expanding a level."],
    bruteForce: "Compute the depth of every node with repeated DFS passes. O(n·h).",
    optimizedApproach: "BFS with a queue, processing exactly one level per outer iteration.",
    explanation: "Snapshotting the queue size separates levels without storing depth on each node.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    starterCode: starter(
      cppStarter("vector<vector<int>> levelOrder(TreeNode* root)"),
      "function levelOrder(root) {\n  // your code here\n}",
      "class Solution:\n    def levelOrder(self, root):\n        pass",
      "class Solution {\n    public List<List<Integer>> levelOrder(TreeNode root) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function levelOrder(root) {
  if (!root) return [];
  const res = [];
  let q = [root];
  while (q.length) {
    const level = [], next = [];
    for (const n of q) {
      level.push(n.val);
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    res.push(level);
    q = next;
  }
  return res;
}`,
    externalUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    isPremium: false,
  },
  {
    slug: "lowest-common-ancestor-of-a-bst",
    title: "Lowest Common Ancestor of a BST",
    topic: "bst",
    pattern: "bst-ordering",
    difficulty: "Medium",
    description: "Given a BST and two nodes, find their lowest common ancestor.",
    examples: [{ input: "root = [6,2,8,0,4,7,9], p = 2, q = 8", output: "6" }],
    constraints: ["All node values are unique", "p and q exist in the tree"],
    hints: ["The split point is where p and q fall on opposite sides."],
    bruteForce: "Find both root-to-node paths and compare them. O(n) time and space.",
    optimizedApproach:
      "Descend from the root: go left if both values are smaller, right if both are larger, otherwise you are at the LCA.",
    explanation: "The BST ordering tells you the answer without exploring subtrees that cannot contain it.",
    timeComplexity: "O(h)",
    spaceComplexity: "O(1)",
    starterCode: starter(
      cppStarter("TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q)"),
      "function lowestCommonAncestor(root, p, q) {\n  // your code here\n}",
      "class Solution:\n    def lowestCommonAncestor(self, root, p, q):\n        pass",
      "class Solution {\n    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function lowestCommonAncestor(root, p, q) {
  let node = root;
  while (node) {
    if (p.val < node.val && q.val < node.val) node = node.left;
    else if (p.val > node.val && q.val > node.val) node = node.right;
    else return node;
  }
  return null;
}`,
    externalUrl: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
    isPremium: false,
  },
  {
    slug: "number-of-islands",
    title: "Number of Islands",
    topic: "graphs",
    pattern: "grid-flood-fill",
    difficulty: "Medium",
    description:
      "Given a 2D grid of '1' (land) and '0' (water), count the number of islands. An island is surrounded by water and formed by connecting adjacent land horizontally or vertically.",
    examples: [{ input: 'grid = [["1","1","0"],["0","1","0"],["0","0","1"]]', output: "2" }],
    constraints: ["1 <= m, n <= 300"],
    hints: ["Every time you find unvisited land, you have found a new island."],
    bruteForce: "Union every land cell pairwise. Far slower than a traversal.",
    optimizedApproach:
      "Scan the grid; on each unvisited land cell, increment the counter and flood fill the whole component with DFS or BFS.",
    explanation: "Each cell is visited once during exactly one flood fill, so the total work is linear in cells.",
    timeComplexity: "O(m·n)",
    spaceComplexity: "O(m·n)",
    starterCode: starter(
      cppStarter("int numIslands(vector<vector<char>>& grid)"),
      "function numIslands(grid) {\n  // your code here\n}",
      "class Solution:\n    def numIslands(self, grid):\n        pass",
      "class Solution {\n    public int numIslands(char[][] grid) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function numIslands(grid) {
  let count = 0;
  const fill = (r, c) => {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1);
  };
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++)
      if (grid[r][c] === "1") { count++; fill(r, c); }
  return count;
}`,
    externalUrl: "https://leetcode.com/problems/number-of-islands/",
    isPremium: false,
  },
  {
    slug: "clone-graph",
    title: "Clone Graph",
    topic: "graphs",
    pattern: "graph-clone-traversal",
    difficulty: "Medium",
    description: "Given a reference to a node in a connected undirected graph, return a deep copy of the graph.",
    examples: [{ input: "adjList = [[2,4],[1,3],[2,4],[1,3]]", output: "[[2,4],[1,3],[2,4],[1,3]]" }],
    constraints: ["0 <= nodes <= 100", "The graph is connected and has no repeated edges"],
    hints: ["Map original node → cloned node before recursing."],
    bruteForce: "Copy nodes then re-link by searching for matches. O(V²).",
    optimizedApproach: "DFS with a visited map that registers each clone before exploring its neighbours.",
    explanation: "Registering early is what makes cycles terminate instead of recursing forever.",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    starterCode: starter(
      cppStarter("Node* cloneGraph(Node* node)"),
      "function cloneGraph(node) {\n  // your code here\n}",
      "class Solution:\n    def cloneGraph(self, node):\n        pass",
      "class Solution {\n    public Node cloneGraph(Node node) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function cloneGraph(node, seen = new Map()) {
  if (!node) return null;
  if (seen.has(node)) return seen.get(node);
  const copy = { val: node.val, neighbors: [] };
  seen.set(node, copy);
  for (const n of node.neighbors) copy.neighbors.push(cloneGraph(n, seen));
  return copy;
}`,
    externalUrl: "https://leetcode.com/problems/clone-graph/",
    isPremium: true,
  },
  {
    slug: "climbing-stairs",
    title: "Climbing Stairs",
    topic: "dynamic-programming",
    pattern: "linear-dp",
    difficulty: "Easy",
    description: "You can climb 1 or 2 steps at a time. In how many distinct ways can you climb n stairs?",
    examples: [
      { input: "n = 2", output: "2" },
      { input: "n = 3", output: "3" },
    ],
    constraints: ["1 <= n <= 45"],
    hints: ["How many ways reach step n? Only from n-1 and n-2."],
    bruteForce: "Plain recursion explores an exponential tree. O(2ⁿ).",
    optimizedApproach: "dp[i] = dp[i-1] + dp[i-2], computed bottom-up with two rolling variables.",
    explanation: "This is Fibonacci in disguise; memoising the overlapping subproblems collapses the tree.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    starterCode: starter(
      cppStarter("int climbStairs(int n)"),
      "function climbStairs(n) {\n  // your code here\n}",
      "class Solution:\n    def climbStairs(self, n):\n        pass",
      "class Solution {\n    public int climbStairs(int n) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function climbStairs(n) {
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}`,
    externalUrl: "https://leetcode.com/problems/climbing-stairs/",
    isPremium: false,
  },
  {
    slug: "house-robber",
    title: "House Robber",
    topic: "dynamic-programming",
    pattern: "linear-dp",
    difficulty: "Medium",
    description:
      "Each house holds some money, but you cannot rob two adjacent houses. Return the maximum you can rob.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "4" },
      { input: "nums = [2,7,9,3,1]", output: "12" },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
    hints: ["At each house: rob it and skip one, or skip it."],
    bruteForce: "Enumerate all valid subsets. O(2ⁿ).",
    optimizedApproach: "dp[i] = max(dp[i-1], dp[i-2] + nums[i]) with rolling variables.",
    explanation: "The decision at house i only depends on two earlier states, so memory is constant.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    starterCode: starter(
      cppStarter("int rob(vector<int>& nums)"),
      "function rob(nums) {\n  // your code here\n}",
      "class Solution:\n    def rob(self, nums):\n        pass",
      "class Solution {\n    public int rob(int[] nums) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function rob(nums) {
  let prev = 0, cur = 0;
  for (const n of nums) [prev, cur] = [cur, Math.max(cur, prev + n)];
  return cur;
}`,
    externalUrl: "https://leetcode.com/problems/house-robber/",
    isPremium: false,
  },
  {
    slug: "coin-change",
    title: "Coin Change",
    topic: "dynamic-programming",
    pattern: "unbounded-knapsack",
    difficulty: "Medium",
    description:
      "Given coin denominations and an amount, return the fewest coins needed to make that amount, or -1 if impossible.",
    examples: [
      { input: "coins = [1,2,5], amount = 11", output: "3" },
      { input: "coins = [2], amount = 3", output: "-1" },
    ],
    constraints: ["1 <= coins.length <= 12", "0 <= amount <= 10^4"],
    hints: ["Greedy fails — try [1,3,4] with amount 6."],
    bruteForce: "Recurse over every coin choice. Exponential.",
    optimizedApproach: "Bottom-up DP over amounts: dp[a] = min(dp[a - c] + 1) across all coins.",
    explanation: "Every amount is solved once and reused, turning exponential recursion into a table fill.",
    timeComplexity: "O(amount · coins)",
    spaceComplexity: "O(amount)",
    starterCode: starter(
      cppStarter("int coinChange(vector<int>& coins, int amount)"),
      "function coinChange(coins, amount) {\n  // your code here\n}",
      "class Solution:\n    def coinChange(self, coins, amount):\n        pass",
      "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++)
    for (const c of coins)
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
    externalUrl: "https://leetcode.com/problems/coin-change/",
    isPremium: true,
  },
  {
    slug: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    topic: "dynamic-programming",
    pattern: "lis-dp",
    difficulty: "Medium",
    description: "Given an integer array, return the length of the longest strictly increasing subsequence.",
    examples: [{ input: "nums = [10,9,2,5,3,7,101,18]", output: "4", explanation: "[2,3,7,101]" }],
    constraints: ["1 <= nums.length <= 2500"],
    hints: ["dp[i] = best subsequence ending at i.", "Patience sorting gets you O(n log n)."],
    bruteForce: "Enumerate all subsequences. O(2ⁿ).",
    optimizedApproach:
      "O(n²) DP comparing each i against every earlier j, or keep a tails array and binary search for O(n log n).",
    explanation:
      "The tails array stores the smallest possible tail for each length — binary search places each element in O(log n).",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    starterCode: starter(
      cppStarter("int lengthOfLIS(vector<int>& nums)"),
      "function lengthOfLIS(nums) {\n  // your code here\n}",
      "class Solution:\n    def lengthOfLIS(self, nums):\n        pass",
      "class Solution {\n    public int lengthOfLIS(int[] nums) {\n        // your code here\n    }\n}",
    ),
    solutionCode: `function lengthOfLIS(nums) {
  const tails = [];
  for (const n of nums) {
    let l = 0, r = tails.length;
    while (l < r) {
      const m = (l + r) >> 1;
      if (tails[m] < n) l = m + 1; else r = m;
    }
    tails[l] = n;
  }
  return tails.length;
}`,
    externalUrl: "https://leetcode.com/problems/longest-increasing-subsequence/",
    isPremium: true,
  },
];

export const PROBLEMS: Problem[] = [
  ...CORE_PROBLEMS,
  ...buildExtraProblems().filter((e) => !CORE_PROBLEMS.some((c) => c.slug === e.slug)),
];

export const topicBySlug = (slug: string) => TOPICS.find((t) => t.slug === slug);
export const patternBySlug = (slug: string) => PATTERNS.find((p) => p.slug === slug);
export const problemBySlug = (slug: string) => PROBLEMS.find((p) => p.slug === slug);

export const PLATFORM_STATS = [
  { label: "Patterns", value: "250+", detail: "Reusable problem-solving templates" },
  { label: "DSA Problems", value: "250+", detail: "Curated, pattern-tagged and growing" },
  { label: "CodeX Playground", value: "4 langs", detail: "C++, JavaScript, Python, Java" },
  { label: "Progress Tracking", value: "Live", detail: "Streaks, topics and revision" },
];

export const LEARNING_FLOW = [
  "Understand Problem",
  "Identify Pattern",
  "Think Brute Force",
  "Optimize",
  "Write Code",
  "Run Test Cases",
  "Mark Solved",
  "Revise",
];
