// dsaSheet.ts — the 250-problem sheet and the rewards it pays out, in one place.
// The problem table itself is generated: `node scripts/build-dsa-sheet.mjs` rebuilds
// it from the NeetCode problem index (LeetCode's own titles, slugs and difficulties),
// then `node scripts/seed-dsa-sheet.mjs` regenerates the database's copy. The
// leaderboard RPCs read that seeded table, so the sheet a student sees and the XP the
// server counts are always the same 250 rows.
//
// Every problem carries three independent groupings, because students plan by all of
// them: `pattern` (the 16 teaching patterns behind /patterns), `topic` (the 12
// subject families the sheet is browsed by) and `week` (the twelve-week plan the
// roadmap board and /mentorship both quote).

export type InterviewTier = 1 | 2 | 3;

export const topics = [
  "Arrays & Hashing",
  "Strings & Two Pointers",
  "Sorting & Searching",
  "Stacks & Queues",
  "Linked Lists",
  "Trees & BSTs",
  "Heaps & Priority Queues",
  "Graphs & Topological Sort",
  "Backtracking",
  "Dynamic Programming",
  "Greedy & Intervals",
  "Bit Manipulation",
] as const;

export type SheetTopic = (typeof topics)[number];

export type Problem = {
  number: number;
  title: string;
  slug: string;
  pattern: string;
  topic: SheetTopic;
  difficulty: "Easy" | "Medium" | "Hard";
  tier: InterviewTier;
  week: number;
  premium: boolean;
  link: string;
  /** Premium questions only: the same problem, playable without a paid LeetCode plan. */
  freeLink?: string;
};

// A problem's pattern must be one of the /patterns cards, so the film, the drills and
// the sheet rows agree on what a problem is teaching.
const topicByPattern: Record<string, SheetTopic> = {
  "Arrays & Hashing": "Arrays & Hashing",
  "Two Pointers": "Strings & Two Pointers",
  "Sliding Window": "Strings & Two Pointers",
  "Binary Search": "Sorting & Searching",
  Stack: "Stacks & Queues",
  "Monotonic Stack": "Stacks & Queues",
  "Linked List": "Linked Lists",
  Trees: "Trees & BSTs",
  Heaps: "Heaps & Priority Queues",
  Graphs: "Graphs & Topological Sort",
  Backtracking: "Backtracking",
  "1-D DP": "Dynamic Programming",
  "2-D DP": "Dynamic Programming",
  Greedy: "Greedy & Intervals",
  Intervals: "Greedy & Intervals",
  "Bit Manipulation": "Bit Manipulation",
};

/** Which week of the twelve-week plan teaches the pattern. Same order as `curriculum`. */
const weekByPattern: Record<string, number> = {
  "Arrays & Hashing": 1,
  "Two Pointers": 2,
  "Sliding Window": 3,
  Stack: 4,
  "Monotonic Stack": 4,
  "Binary Search": 5,
  "Linked List": 6,
  Trees: 7,
  Graphs: 8,
  Backtracking: 9,
  Heaps: 10,
  Intervals: 10,
  "1-D DP": 11,
  "2-D DP": 11,
  Greedy: 12,
  "Bit Manipulation": 12,
};

export function sheetTopicFor(pattern: string): SheetTopic {
  return topicByPattern[pattern] ?? "Arrays & Hashing";
}

export function sheetWeekFor(pattern: string): number {
  return weekByPattern[pattern] ?? 12;
}

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

/** The problems that need a paid LeetCode plan, and where the same question runs free. */
// <generated-sheet>
// Every row below is [title, leetcode slug, pattern, difficulty, tier, needs paid plan]
// and was read straight out of the NeetCode index by scripts/build-dsa-sheet.mjs -
// never typed by hand. Tier 1 is the Blind 75 list, tier 2 the NeetCode 150, tier 3
// everything else. Numbers 1-50 are frozen; the rest are ordered by pattern block,
// must-know first.
const freeMirrorBySlug: Record<string, string> = {
  "encode-and-decode-strings": "https://www.lintcode.com/problem/659/",
  "wiggle-sort": "https://www.lintcode.com/problem/508/",
  "walls-and-gates": "https://www.lintcode.com/problem/663/",
  "number-of-connected-components-in-an-undirected-graph": "https://www.lintcode.com/problem/3651/",
  "graph-valid-tree": "https://www.lintcode.com/problem/178/",
  "alien-dictionary": "https://www.lintcode.com/problem/892/",
  "meeting-rooms": "https://www.lintcode.com/problem/920/",
  "meeting-rooms-ii": "https://www.lintcode.com/problem/919/",
};
const sheetTable: Array<[string, string, string, Problem["difficulty"], InterviewTier, boolean]> = [
  ["Two Sum", "two-sum", "Arrays & Hashing", "Easy", 1, false],
  ["Valid Anagram", "valid-anagram", "Arrays & Hashing", "Easy", 1, false],
  ["Group Anagrams", "group-anagrams", "Arrays & Hashing", "Medium", 1, false],
  ["Top K Frequent Elements", "top-k-frequent-elements", "Arrays & Hashing", "Medium", 1, false],
  ["Product of Array Except Self", "product-of-array-except-self", "Arrays & Hashing", "Medium", 1, false],
  ["Valid Palindrome", "valid-palindrome", "Two Pointers", "Easy", 1, false],
  ["3Sum", "3sum", "Two Pointers", "Medium", 1, false],
  ["Container With Most Water", "container-with-most-water", "Two Pointers", "Medium", 1, false],
  ["Trapping Rain Water", "trapping-rain-water", "Two Pointers", "Hard", 2, false],
  ["Best Time to Buy And Sell Stock", "best-time-to-buy-and-sell-stock", "Sliding Window", "Easy", 1, false],
  ["Longest Substring Without Repeating Characters", "longest-substring-without-repeating-characters", "Sliding Window", "Medium", 1, false],
  ["Longest Repeating Character Replacement", "longest-repeating-character-replacement", "Sliding Window", "Medium", 1, false],
  ["Minimum Window Substring", "minimum-window-substring", "Sliding Window", "Hard", 1, false],
  ["Valid Parentheses", "valid-parentheses", "Stack", "Easy", 1, false],
  ["Min Stack", "min-stack", "Stack", "Medium", 2, false],
  ["Evaluate Reverse Polish Notation", "evaluate-reverse-polish-notation", "Stack", "Medium", 2, false],
  ["Daily Temperatures", "daily-temperatures", "Monotonic Stack", "Medium", 2, false],
  ["Binary Search", "binary-search", "Binary Search", "Easy", 2, false],
  ["Search a 2D Matrix", "search-a-2d-matrix", "Binary Search", "Medium", 2, false],
  ["Koko Eating Bananas", "koko-eating-bananas", "Binary Search", "Medium", 2, false],
  ["Reverse Linked List", "reverse-linked-list", "Linked List", "Easy", 1, false],
  ["Merge Two Sorted Lists", "merge-two-sorted-lists", "Linked List", "Easy", 1, false],
  ["Reorder List", "reorder-list", "Linked List", "Medium", 1, false],
  ["Remove Nth Node From End of List", "remove-nth-node-from-end-of-list", "Linked List", "Medium", 1, false],
  ["LRU Cache", "lru-cache", "Linked List", "Medium", 2, false],
  ["Invert Binary Tree", "invert-binary-tree", "Trees", "Easy", 1, false],
  ["Maximum Depth of Binary Tree", "maximum-depth-of-binary-tree", "Trees", "Easy", 1, false],
  ["Binary Tree Level Order Traversal", "binary-tree-level-order-traversal", "Trees", "Medium", 1, false],
  ["Validate Binary Search Tree", "validate-binary-search-tree", "Trees", "Medium", 1, false],
  ["Kth Smallest Element In a Bst", "kth-smallest-element-in-a-bst", "Trees", "Medium", 1, false],
  ["Subsets", "subsets", "Backtracking", "Medium", 2, false],
  ["Combination Sum", "combination-sum", "Backtracking", "Medium", 1, false],
  ["Permutations", "permutations", "Backtracking", "Medium", 2, false],
  ["Word Search", "word-search", "Backtracking", "Medium", 1, false],
  ["N Queens", "n-queens", "Backtracking", "Hard", 2, false],
  ["Number of Islands", "number-of-islands", "Graphs", "Medium", 1, false],
  ["Clone Graph", "clone-graph", "Graphs", "Medium", 1, false],
  ["Rotting Oranges", "rotting-oranges", "Graphs", "Medium", 2, false],
  ["Course Schedule", "course-schedule", "Graphs", "Medium", 1, false],
  ["Graph Valid Tree", "graph-valid-tree", "Graphs", "Medium", 1, true],
  ["Climbing Stairs", "climbing-stairs", "1-D DP", "Easy", 1, false],
  ["House Robber", "house-robber", "1-D DP", "Medium", 1, false],
  ["Coin Change", "coin-change", "1-D DP", "Medium", 1, false],
  ["Longest Increasing Subsequence", "longest-increasing-subsequence", "1-D DP", "Medium", 1, false],
  ["Word Break", "word-break", "1-D DP", "Medium", 1, false],
  ["Unique Paths", "unique-paths", "2-D DP", "Medium", 1, false],
  ["Longest Common Subsequence", "longest-common-subsequence", "2-D DP", "Medium", 1, false],
  ["Best Time to Buy And Sell Stock With Cooldown", "best-time-to-buy-and-sell-stock-with-cooldown", "2-D DP", "Medium", 2, false],
  ["Burst Balloons", "burst-balloons", "2-D DP", "Hard", 2, false],
  ["Regular Expression Matching", "regular-expression-matching", "2-D DP", "Hard", 2, false],
  ["Contains Duplicate", "contains-duplicate", "Arrays & Hashing", "Easy", 1, false],
  ["Encode and Decode Strings", "encode-and-decode-strings", "Arrays & Hashing", "Medium", 1, true],
  ["Longest Consecutive Sequence", "longest-consecutive-sequence", "Arrays & Hashing", "Medium", 1, false],
  ["Valid Sudoku", "valid-sudoku", "Arrays & Hashing", "Medium", 2, false],
  ["Can Place Flowers", "can-place-flowers", "Arrays & Hashing", "Easy", 3, false],
  ["Concatenation of Array", "concatenation-of-array", "Arrays & Hashing", "Easy", 3, false],
  ["Design HashMap", "design-hashmap", "Arrays & Hashing", "Easy", 3, false],
  ["Design HashSet", "design-hashset", "Arrays & Hashing", "Easy", 3, false],
  ["Design Parking System", "design-parking-system", "Arrays & Hashing", "Easy", 3, false],
  ["Find All Numbers Disappeared in An Array", "find-all-numbers-disappeared-in-an-array", "Arrays & Hashing", "Easy", 3, false],
  ["Find Pivot Index", "find-pivot-index", "Arrays & Hashing", "Easy", 3, false],
  ["Find the Difference of Two Arrays", "find-the-difference-of-two-arrays", "Arrays & Hashing", "Easy", 3, false],
  ["Find The Index of The First Occurrence in a String", "find-the-index-of-the-first-occurrence-in-a-string", "Arrays & Hashing", "Easy", 3, false],
  ["Is Subsequence", "is-subsequence", "Arrays & Hashing", "Easy", 3, false],
  ["Isomorphic Strings", "isomorphic-strings", "Arrays & Hashing", "Easy", 3, false],
  ["Length of Last Word", "length-of-last-word", "Arrays & Hashing", "Easy", 3, false],
  ["Longest Common Prefix", "longest-common-prefix", "Arrays & Hashing", "Easy", 3, false],
  ["Majority Element", "majority-element", "Arrays & Hashing", "Easy", 3, false],
  ["Maximum Number of Balloons", "maximum-number-of-balloons", "Arrays & Hashing", "Easy", 3, false],
  ["Next Greater Element I", "next-greater-element-i", "Arrays & Hashing", "Easy", 3, false],
  ["Two Sum II Input Array Is Sorted", "two-sum-ii-input-array-is-sorted", "Two Pointers", "Medium", 2, false],
  ["Merge Sorted Array", "merge-sorted-array", "Two Pointers", "Easy", 3, false],
  ["Merge Strings Alternately", "merge-strings-alternately", "Two Pointers", "Easy", 3, false],
  ["Minimum Difference Between Highest And Lowest of K Scores", "minimum-difference-between-highest-and-lowest-of-k-scores", "Two Pointers", "Easy", 3, false],
  ["Move Zeroes", "move-zeroes", "Two Pointers", "Easy", 3, false],
  ["Remove Duplicates From Sorted Array", "remove-duplicates-from-sorted-array", "Two Pointers", "Easy", 3, false],
  ["Reverse String", "reverse-string", "Two Pointers", "Easy", 3, false],
  ["Valid Palindrome II", "valid-palindrome-ii", "Two Pointers", "Easy", 3, false],
  ["4Sum", "4sum", "Two Pointers", "Medium", 3, false],
  ["Array With Elements Not Equal to Average of Neighbors", "array-with-elements-not-equal-to-average-of-neighbors", "Two Pointers", "Medium", 3, false],
  ["Boats to Save People", "boats-to-save-people", "Two Pointers", "Medium", 3, false],
  ["Number of Subsequences That Satisfy The Given Sum Condition", "number-of-subsequences-that-satisfy-the-given-sum-condition", "Two Pointers", "Medium", 3, false],
  ["Permutation In String", "permutation-in-string", "Sliding Window", "Medium", 2, false],
  ["Contains Duplicate II", "contains-duplicate-ii", "Sliding Window", "Easy", 3, false],
  ["Find K Closest Elements", "find-k-closest-elements", "Sliding Window", "Medium", 3, false],
  ["Frequency of The Most Frequent Element", "frequency-of-the-most-frequent-element", "Sliding Window", "Medium", 3, false],
  ["Fruits into Basket", "fruit-into-baskets", "Sliding Window", "Medium", 3, false],
  ["Maximum Number of Vowels in a Substring of Given Length", "maximum-number-of-vowels-in-a-substring-of-given-length", "Sliding Window", "Medium", 3, false],
  ["Minimum Number of Flips to Make The Binary String Alternating", "minimum-number-of-flips-to-make-the-binary-string-alternating", "Sliding Window", "Medium", 3, false],
  ["Minimum Operations to Reduce X to Zero", "minimum-operations-to-reduce-x-to-zero", "Sliding Window", "Medium", 3, false],
  ["Minimum Size Subarray Sum", "minimum-size-subarray-sum", "Sliding Window", "Medium", 3, false],
  ["Generate Parentheses", "generate-parentheses", "Stack", "Medium", 2, false],
  ["Baseball Game", "baseball-game", "Stack", "Easy", 3, false],
  ["Implement Stack Using Queues", "implement-stack-using-queues", "Stack", "Easy", 3, false],
  ["Asteroid Collision", "asteroid-collision", "Stack", "Medium", 3, false],
  ["Decode String", "decode-string", "Stack", "Medium", 3, false],
  ["Remove All Adjacent Duplicates In String II", "remove-all-adjacent-duplicates-in-string-ii", "Stack", "Medium", 3, false],
  ["Removing Stars From a String", "removing-stars-from-a-string", "Stack", "Medium", 3, false],
  ["Simplify Path", "simplify-path", "Stack", "Medium", 3, false],
  ["Car Fleet", "car-fleet", "Monotonic Stack", "Medium", 2, false],
  ["Largest Rectangle In Histogram", "largest-rectangle-in-histogram", "Monotonic Stack", "Hard", 2, false],
  ["Sliding Window Maximum", "sliding-window-maximum", "Monotonic Stack", "Hard", 2, false],
  ["132 Pattern", "132-pattern", "Monotonic Stack", "Medium", 3, false],
  ["Online Stock Span", "online-stock-span", "Monotonic Stack", "Medium", 3, false],
  ["Remove K Digits", "remove-k-digits", "Monotonic Stack", "Medium", 3, false],
  ["Maximum Frequency Stack", "maximum-frequency-stack", "Monotonic Stack", "Hard", 3, false],
  ["Find Minimum In Rotated Sorted Array", "find-minimum-in-rotated-sorted-array", "Binary Search", "Medium", 1, false],
  ["Search In Rotated Sorted Array", "search-in-rotated-sorted-array", "Binary Search", "Medium", 1, false],
  ["Time Based Key Value Store", "time-based-key-value-store", "Binary Search", "Medium", 2, false],
  ["Median of Two Sorted Arrays", "median-of-two-sorted-arrays", "Binary Search", "Hard", 2, false],
  ["Arranging Coins", "arranging-coins", "Binary Search", "Easy", 3, false],
  ["Guess Number Higher Or Lower", "guess-number-higher-or-lower", "Binary Search", "Easy", 3, false],
  ["Search Insert Position", "search-insert-position", "Binary Search", "Easy", 3, false],
  ["Sqrt(x) ", "sqrtx", "Binary Search", "Easy", 3, false],
  ["Squares of a Sorted Array", "squares-of-a-sorted-array", "Binary Search", "Easy", 3, false],
  ["Valid Perfect Square", "valid-perfect-square", "Binary Search", "Easy", 3, false],
  ["Capacity to Ship Packages", "capacity-to-ship-packages-within-d-days", "Binary Search", "Medium", 3, false],
  ["Find First And Last Position of Element In Sorted Array", "find-first-and-last-position-of-element-in-sorted-array", "Binary Search", "Medium", 3, false],
  ["Find Peak Element", "find-peak-element", "Binary Search", "Medium", 3, false],
  ["Linked List Cycle", "linked-list-cycle", "Linked List", "Easy", 1, false],
  ["Merge K Sorted Lists", "merge-k-sorted-lists", "Linked List", "Hard", 1, false],
  ["Add Two Numbers", "add-two-numbers", "Linked List", "Medium", 2, false],
  ["Copy List With Random Pointer", "copy-list-with-random-pointer", "Linked List", "Medium", 2, false],
  ["Find The Duplicate Number", "find-the-duplicate-number", "Linked List", "Medium", 2, false],
  ["Reverse Nodes In K Group", "reverse-nodes-in-k-group", "Linked List", "Hard", 2, false],
  ["Intersection of Two Linked Lists", "intersection-of-two-linked-lists", "Linked List", "Easy", 3, false],
  ["Middle of the Linked List", "middle-of-the-linked-list", "Linked List", "Easy", 3, false],
  ["Palindrome Linked List", "palindrome-linked-list", "Linked List", "Easy", 3, false],
  ["Remove Duplicates From Sorted List", "remove-duplicates-from-sorted-list", "Linked List", "Easy", 3, false],
  ["Remove Linked List Elements", "remove-linked-list-elements", "Linked List", "Easy", 3, false],
  ["Design Browser History", "design-browser-history", "Linked List", "Medium", 3, false],
  ["Design Circular Queue", "design-circular-queue", "Linked List", "Medium", 3, false],
  ["Same Tree", "same-tree", "Trees", "Easy", 1, false],
  ["Subtree of Another Tree", "subtree-of-another-tree", "Trees", "Easy", 1, false],
  ["Construct Binary Tree From Preorder And Inorder Traversal", "construct-binary-tree-from-preorder-and-inorder-traversal", "Trees", "Medium", 1, false],
  ["Lowest Common Ancestor of a Binary Search Tree", "lowest-common-ancestor-of-a-binary-search-tree", "Trees", "Medium", 1, false],
  ["Binary Tree Maximum Path Sum", "binary-tree-maximum-path-sum", "Trees", "Hard", 1, false],
  ["Serialize And Deserialize Binary Tree", "serialize-and-deserialize-binary-tree", "Trees", "Hard", 1, false],
  ["Balanced Binary Tree", "balanced-binary-tree", "Trees", "Easy", 2, false],
  ["Diameter of Binary Tree", "diameter-of-binary-tree", "Trees", "Easy", 2, false],
  ["Binary Tree Right Side View", "binary-tree-right-side-view", "Trees", "Medium", 2, false],
  ["Count Good Nodes In Binary Tree", "count-good-nodes-in-binary-tree", "Trees", "Medium", 2, false],
  ["Binary Tree Inorder Traversal", "binary-tree-inorder-traversal", "Trees", "Easy", 3, false],
  ["Binary Tree Postorder Traversal", "binary-tree-postorder-traversal", "Trees", "Easy", 3, false],
  ["Binary Tree Preorder Traversal", "binary-tree-preorder-traversal", "Trees", "Easy", 3, false],
  ["Construct String From Binary Tree", "construct-string-from-binary-tree", "Trees", "Easy", 3, false],
  ["Convert Sorted Array to Binary Search Tree", "convert-sorted-array-to-binary-search-tree", "Trees", "Easy", 3, false],
  ["Merge Two Binary Trees", "merge-two-binary-trees", "Trees", "Easy", 3, false],
  ["Minimum Distance between BST Nodes", "minimum-distance-between-bst-nodes", "Trees", "Easy", 3, false],
  ["Path Sum", "path-sum", "Trees", "Easy", 3, false],
  ["Symmetric Tree ", "symmetric-tree", "Trees", "Easy", 3, false],
  ["Number of Connected Components In An Undirected Graph", "number-of-connected-components-in-an-undirected-graph", "Graphs", "Medium", 1, true],
  ["Pacific Atlantic Water Flow", "pacific-atlantic-water-flow", "Graphs", "Medium", 1, false],
  ["Alien Dictionary", "alien-dictionary", "Graphs", "Hard", 1, true],
  ["Cheapest Flights Within K Stops", "cheapest-flights-within-k-stops", "Graphs", "Medium", 2, false],
  ["Course Schedule II", "course-schedule-ii", "Graphs", "Medium", 2, false],
  ["Max Area of Island", "max-area-of-island", "Graphs", "Medium", 2, false],
  ["Min Cost to Connect All Points", "min-cost-to-connect-all-points", "Graphs", "Medium", 2, false],
  ["Network Delay Time", "network-delay-time", "Graphs", "Medium", 2, false],
  ["Redundant Connection", "redundant-connection", "Graphs", "Medium", 2, false],
  ["Surrounded Regions", "surrounded-regions", "Graphs", "Medium", 2, false],
  ["Walls And Gates", "walls-and-gates", "Graphs", "Medium", 2, true],
  ["Reconstruct Itinerary", "reconstruct-itinerary", "Graphs", "Hard", 2, false],
  ["Swim In Rising Water", "swim-in-rising-water", "Graphs", "Hard", 2, false],
  ["Word Ladder", "word-ladder", "Graphs", "Hard", 2, false],
  ["Island Perimeter", "island-perimeter", "Graphs", "Easy", 3, false],
  ["Verifying An Alien Dictionary", "verifying-an-alien-dictionary", "Graphs", "Easy", 3, false],
  ["Accounts Merge", "accounts-merge", "Graphs", "Medium", 3, false],
  ["Combination Sum II", "combination-sum-ii", "Backtracking", "Medium", 2, false],
  ["Letter Combinations of a Phone Number", "letter-combinations-of-a-phone-number", "Backtracking", "Medium", 2, false],
  ["Palindrome Partitioning", "palindrome-partitioning", "Backtracking", "Medium", 2, false],
  ["Subsets II", "subsets-ii", "Backtracking", "Medium", 2, false],
  ["Combinations", "combinations", "Backtracking", "Medium", 3, false],
  ["Find Unique Binary String", "find-unique-binary-string", "Backtracking", "Medium", 3, false],
  ["Matchsticks to Square", "matchsticks-to-square", "Backtracking", "Medium", 3, false],
  ["Maximum Length of a Concatenated String With Unique Characters", "maximum-length-of-a-concatenated-string-with-unique-characters", "Backtracking", "Medium", 3, false],
  ["Partition to K Equal Sum Subsets", "partition-to-k-equal-sum-subsets", "Backtracking", "Medium", 3, false],
  ["Permutations II", "permutations-ii", "Backtracking", "Medium", 3, false],
  ["Restore IP Addresses", "restore-ip-addresses", "Backtracking", "Medium", 3, false],
  ["Find Median From Data Stream", "find-median-from-data-stream", "Heaps", "Hard", 1, false],
  ["Kth Largest Element In a Stream", "kth-largest-element-in-a-stream", "Heaps", "Easy", 2, false],
  ["Last Stone Weight", "last-stone-weight", "Heaps", "Easy", 2, false],
  ["Design Twitter", "design-twitter", "Heaps", "Medium", 2, false],
  ["K Closest Points to Origin", "k-closest-points-to-origin", "Heaps", "Medium", 2, false],
  ["Kth Largest Element In An Array", "kth-largest-element-in-an-array", "Heaps", "Medium", 2, false],
  ["Task Scheduler", "task-scheduler", "Heaps", "Medium", 2, false],
  ["Car Pooling", "car-pooling", "Heaps", "Medium", 3, false],
  ["Find The Kth Largest Integer In The Array", "find-the-kth-largest-integer-in-the-array", "Heaps", "Medium", 3, false],
  ["Longest Happy String", "longest-happy-string", "Heaps", "Medium", 3, false],
  ["Maximum Subsequence Score", "maximum-subsequence-score", "Heaps", "Medium", 3, false],
  ["Process Tasks Using Servers", "process-tasks-using-servers", "Heaps", "Medium", 3, false],
  ["Reorganize String", "reorganize-string", "Heaps", "Medium", 3, false],
  ["Seat Reservation Manager", "seat-reservation-manager", "Heaps", "Medium", 3, false],
  ["Single Threaded Cpu", "single-threaded-cpu", "Heaps", "Medium", 3, false],
  ["Meeting Rooms", "meeting-rooms", "Intervals", "Easy", 1, true],
  ["Insert Interval", "insert-interval", "Intervals", "Medium", 1, false],
  ["Meeting Rooms II", "meeting-rooms-ii", "Intervals", "Medium", 1, true],
  ["Merge Intervals", "merge-intervals", "Intervals", "Medium", 1, false],
  ["Non Overlapping Intervals", "non-overlapping-intervals", "Intervals", "Medium", 1, false],
  ["Minimum Interval to Include Each Query", "minimum-interval-to-include-each-query", "Intervals", "Hard", 2, false],
  ["Remove Covered Intervals", "remove-covered-intervals", "Intervals", "Medium", 3, false],
  ["Data Stream as Disjoint Intervals", "data-stream-as-disjoint-intervals", "Intervals", "Hard", 3, false],
  ["Decode Ways", "decode-ways", "1-D DP", "Medium", 1, false],
  ["House Robber II", "house-robber-ii", "1-D DP", "Medium", 1, false],
  ["Longest Palindromic Substring", "longest-palindromic-substring", "1-D DP", "Medium", 1, false],
  ["Maximum Product Subarray", "maximum-product-subarray", "1-D DP", "Medium", 1, false],
  ["Palindromic Substrings", "palindromic-substrings", "1-D DP", "Medium", 1, false],
  ["Min Cost Climbing Stairs", "min-cost-climbing-stairs", "1-D DP", "Easy", 2, false],
  ["Partition Equal Subset Sum", "partition-equal-subset-sum", "1-D DP", "Medium", 2, false],
  ["N-th Tribonacci Number", "n-th-tribonacci-number", "1-D DP", "Easy", 3, false],
  ["Best Team with no Conflicts", "best-team-with-no-conflicts", "1-D DP", "Medium", 3, false],
  ["Check if There is a Valid Partition For The Array", "check-if-there-is-a-valid-partition-for-the-array", "1-D DP", "Medium", 3, false],
  ["Combination Sum IV", "combination-sum-iv", "1-D DP", "Medium", 3, false],
  ["Count Ways to Build Good Strings", "count-ways-to-build-good-strings", "1-D DP", "Medium", 3, false],
  ["Delete And Earn", "delete-and-earn", "1-D DP", "Medium", 3, false],
  ["Integer Break", "integer-break", "1-D DP", "Medium", 3, false],
  ["Maximum Subarray Min Product", "maximum-subarray-min-product", "1-D DP", "Medium", 3, false],
  ["Coin Change II", "coin-change-ii", "2-D DP", "Medium", 2, false],
  ["Edit Distance", "edit-distance", "2-D DP", "Medium", 2, false],
  ["Interleaving String", "interleaving-string", "2-D DP", "Medium", 2, false],
  ["Target Sum", "target-sum", "2-D DP", "Medium", 2, false],
  ["Distinct Subsequences", "distinct-subsequences", "2-D DP", "Hard", 2, false],
  ["Longest Increasing Path In a Matrix", "longest-increasing-path-in-a-matrix", "2-D DP", "Hard", 2, false],
  ["Flip String to Monotone Increasing", "flip-string-to-monotone-increasing", "2-D DP", "Medium", 3, false],
  ["Last Stone Weight II", "last-stone-weight-ii", "2-D DP", "Medium", 3, false],
  ["Longest Palindromic Subsequence", "longest-palindromic-subsequence", "2-D DP", "Medium", 3, false],
  ["Maximal Square", "maximal-square", "2-D DP", "Medium", 3, false],
  ["Maximum Alternating Subsequence Sum", "maximum-alternating-subsequence-sum", "2-D DP", "Medium", 3, false],
  ["Jump Game", "jump-game", "Greedy", "Medium", 1, false],
  ["Maximum Subarray", "maximum-subarray", "Greedy", "Medium", 1, false],
  ["Gas Station", "gas-station", "Greedy", "Medium", 2, false],
  ["Hand of Straights", "hand-of-straights", "Greedy", "Medium", 2, false],
  ["Jump Game II", "jump-game-ii", "Greedy", "Medium", 2, false],
  ["Merge Triplets to Form Target Triplet", "merge-triplets-to-form-target-triplet", "Greedy", "Medium", 2, false],
  ["Partition Labels", "partition-labels", "Greedy", "Medium", 2, false],
  ["Valid Parenthesis String", "valid-parenthesis-string", "Greedy", "Medium", 2, false],
  ["Dota2 Senate", "dota2-senate", "Greedy", "Medium", 3, false],
  ["Eliminate Maximum Number of Monsters", "eliminate-maximum-number-of-monsters", "Greedy", "Medium", 3, false],
  ["Jump Game VII", "jump-game-vii", "Greedy", "Medium", 3, false],
  ["Longest Turbulent Array", "longest-turbulent-subarray", "Greedy", "Medium", 3, false],
  ["Maximum Length of Pair Chain", "maximum-length-of-pair-chain", "Greedy", "Medium", 3, false],
  ["Maximum Points You Can Obtain From Cards", "maximum-points-you-can-obtain-from-cards", "Greedy", "Medium", 3, false],
  ["Counting Bits", "counting-bits", "Bit Manipulation", "Easy", 1, false],
  ["Missing Number", "missing-number", "Bit Manipulation", "Easy", 1, false],
  ["Number of 1 Bits", "number-of-1-bits", "Bit Manipulation", "Easy", 1, false],
  ["Reverse Bits", "reverse-bits", "Bit Manipulation", "Easy", 1, false],
  ["Sum of Two Integers", "sum-of-two-integers", "Bit Manipulation", "Medium", 1, false],
  ["Single Number", "single-number", "Bit Manipulation", "Easy", 2, false],
  ["Reverse Integer", "reverse-integer", "Bit Manipulation", "Medium", 2, false],
  ["Add Binary", "add-binary", "Bit Manipulation", "Easy", 3, false],
];
// </generated-sheet>

export const problems: Problem[] = sheetTable.map((row, index) => {
  const [title, slug, pattern, difficulty, tier, premium] = row;
  return {
    number: index + 1,
    title,
    slug,
    pattern,
    topic: sheetTopicFor(pattern),
    difficulty,
    tier,
    week: sheetWeekFor(pattern),
    premium,
    link: `https://leetcode.com/problems/${slug}/`,
    freeLink: freeMirrorBySlug[slug],
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
