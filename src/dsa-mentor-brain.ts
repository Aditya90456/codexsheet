// The teaching brain behind the free DSA mentor: it decides what a student is
// asking for, picks the 3D figure that matches, and can teach a whole turn
// without any network at all. The hosted model only ever writes the words — the
// topic detection, the figure and the hint ladder stay deterministic here so a
// student on a slow phone connection still gets a real lesson.
import { lessonCode } from "./dsa-mentor-code";
import type { MentorScene, SceneStep } from "./DsaMentorStage";

export type MentorPatternId =
  | "hashing"
  | "two-pointers"
  | "sliding-window"
  | "stack"
  | "monotonic-stack"
  | "binary-search"
  | "linked-list"
  | "trees"
  | "graphs"
  | "backtracking"
  | "heaps"
  | "intervals"
  | "dp-1d"
  | "dp-2d"
  | "greedy"
  | "bits";

export type MentorIntent = "explain" | "hint" | "complexity" | "code" | "check" | "stuck" | "next";

export type MentorTurn = {
  pattern: MentorPatternId;
  intent: MentorIntent;
  level: "beginner" | "practice";
  problem?: string;
};

export type PatternLesson = {
  id: MentorPatternId;
  label: string;
  aliases: string[];
  hook: string;
  idea: string;
  figure: MentorScene["figure"];
  walkthrough: string[];
  check: string;
  mistake: string;
  hints: string[];
  complexity: string;
  codeCue: string;
};

export const patternLessons: PatternLesson[] = [
  {
    id: "hashing",
    label: "Arrays & Hashing",
    aliases: ["hash", "hashmap", "hash map", "dictionary", "two sum", "contains duplicate", "anagram", "group"],
    hook: "A hash map is a coat rack: you hand over a token, you get your coat back instantly. No searching the whole room.",
    idea: "If you keep saying \"have I seen this before?\", store what you have seen in a hash map and stop looping.",
    figure: "hash",
    walkthrough: [
      "Every key hashes to one bucket out of eight.",
      "\"target - num\" becomes the key you ask for, so Two Sum is one pass.",
      "Two keys landing in the same bucket is a collision — the map handles it, you just stop caring.",
    ],
    check: "In Two Sum, what exactly do you put in the map: the number, or the index?",
    mistake: "Re-scanning the array for the partner value. That is the nested loop the map is here to delete.",
    hints: [
      "You are allowed to use extra memory. What would make the second loop disappear?",
      "For each number, which single value would finish the pair? Look that up instead of searching.",
      "Map from value to index while you walk, and check the map before you write.",
    ],
    complexity: "O(n) time, O(n) space. The nested version is O(n²) time, O(1) space.",
    codeCue: "Build the map in the same loop you search it — that is the one-pass version.",
  },
  {
    id: "two-pointers",
    label: "Two Pointers",
    aliases: ["two pointer", "left right", "pair", "container", "trapping rain", "3sum", "3 sum", "sorted"],
    hook: "Two people clean a table from opposite ends. Whoever is wrong for the middle steps aside, and the middle gets smaller.",
    idea: "On sorted data, if the ends are too small or too big you can throw away a whole side, not one element.",
    figure: "window",
    walkthrough: [
      "left starts at 0, right at the last index.",
      "Sum too small? left moves right. Too big? right moves left.",
      "Each element is visited once, so the loop is linear.",
    ],
    check: "Why does this break if the array is not sorted?",
    mistake: "Moving both pointers on one condition — you skip the pair that was actually correct.",
    hints: [
      "Sort first if you are allowed to, then ask what you can throw away.",
      "One condition should make left move, the opposite should make right move. Never both.",
      "Fix the third value and run two pointers on the rest — that is how 3-Sum drops to n².",
    ],
    complexity: "O(n) after sorting, so O(n log n) all in. Space O(1).",
    codeCue: "while (left < right) with an if / else on the comparison — no inner loop.",
  },
  {
    id: "sliding-window",
    label: "Sliding Window",
    aliases: ["sliding window", "window", "substring", "subarray", "longest", "k distinct", "maximum sum of k"],
    hook: "A camera on a rail. When the frame slides one step, only one pixel leaves and one enters — you reuse everything in between.",
    idea: "For contiguous subarrays or substrings, keep a window and move its left edge only when the window becomes invalid.",
    figure: "window",
    walkthrough: [
      "Right edge grows the window and adds a value.",
      "While the window is invalid, shrink from the left and remove what leaves.",
      "Record the answer after each shrink, not before.",
    ],
    check: "In \"longest substring without repeats\", which single condition makes the left edge move?",
    mistake: "Restarting the window from zero when it breaks. That is O(n²) wearing an O(n) costume.",
    hints: [
      "Ask what your window must always satisfy. That property is the whole algorithm.",
      "Keep a count map of what is inside the window so removing a leaving element is O(1).",
      "Grow with right, shrink with a while on the broken property, then measure.",
    ],
    complexity: "O(n) time — each index is entered once and left once. Space O(window states).",
    codeCue: "for right… while invalid… left++ — the while never makes it quadratic.",
  },
  {
    id: "stack",
    label: "Stack",
    aliases: ["stack", "parentheses", "valid parentheses", "reverse polish", "rpn", "min stack"],
    hook: "A pile of plates. Only the top matters, and the last thing you opened is the first thing you must close.",
    idea: "When the most recent unfinished thing is what you compare against next, that is a stack.",
    figure: "stack",
    walkthrough: [
      "Push every opener.",
      "On a closer, pop and check the top matches.",
      "Empty at the end means nothing was left hanging.",
    ],
    check: "For \"{[()]}\", which character makes a naive left-to-right counter fail?",
    mistake: "Popping from an empty stack when a closer arrives with nothing open.",
    hints: [
      "You cannot decide a closer until you know the last opener. What holds \"the last thing\"?",
      "Push openers, pop on closers, compare against a matching map.",
      "Guard the pop: if the stack is empty when a closer arrives, the string is already invalid.",
    ],
    complexity: "O(n) time, O(n) space in the worst nesting depth.",
    codeCue: "A map of closer to opener, then one stack.",
  },
  {
    id: "monotonic-stack",
    label: "Monotonic Stack",
    aliases: ["monotonic", "next greater", "daily temperatures", "histogram", "largest rectangle", "spans"],
    hook: "A queue of people waiting to be outranked. The moment someone taller arrives, everyone shorter goes home answered.",
    idea: "For \"next greater / previous smaller / how far until something bigger\", keep the stack ordered and pop while the arrival beats the top.",
    figure: "stack",
    walkthrough: [
      "Push indices, never values — you need positions for the answer.",
      "While the current value beats the stack top, pop and write the answer for the popped index.",
      "Whatever is left at the end has no answer.",
    ],
    check: "Why do you push the index instead of the temperature itself?",
    mistake: "Popping the current element instead of the top, so the stack ends up sorted backwards.",
    hints: [
      "Every element is pushed once and popped once. That is your O(n) proof.",
      "The stack holds the \"still unanswered\" elements, in decreasing order.",
      "while (stack.length && nums[i] > nums[peek]) pop and fill the result for the popped index.",
    ],
    complexity: "O(n) time because each index is pushed and popped once.",
    codeCue: "Stack of indices + a result array filled on pop.",
  },
  {
    id: "binary-search",
    label: "Binary Search",
    aliases: ["binary search", "log n", "sorted order", "peak", "sqrt", "search insert", "rotated"],
    hook: "Guess my number between 1 and 100. You never guess randomly — you always cut the room in half.",
    idea: "If the answer is monotone — everything left is false, everything right is true — search on the boundary, not on the array.",
    figure: "array",
    walkthrough: [
      "lo and hi bracket the region still possible.",
      "mid is thrown away along with the half that cannot hold the answer.",
      "When lo passes hi, lo is the insertion point — the boundary you wanted.",
    ],
    check: "Does your loop invariant say the answer is inside [lo, hi], or inside [lo, hi)?",
    mistake: "mid = (lo + hi) / 2 without thinking about which side you keep; the loop then runs forever on hi = mid.",
    hints: [
      "Write the yes/no question that splits the search space in half. That question is the algorithm.",
      "Decide once whether hi is inclusive, and keep every branch honest to that choice.",
      "while (lo < hi) with hi = mid needs mid = lo + (hi - lo) / 2 — otherwise the last two never converge.",
    ],
    complexity: "O(log n) time, O(1) space.",
    codeCue: "mid = lo + ((hi - lo) >> 1); then two branches, no loose ends.",
  },
  {
    id: "linked-list",
    label: "Linked List",
    aliases: ["linked list", "reverse list", "cycle", "floyd", "merge two", "middle", "lru", "dll"],
    hook: "A treasure hunt: each clue only tells you where the next clue is. Lose one pointer and the rest of the list is gone.",
    idea: "Pointer surgery: change where a node points, in the right order, and keep a spare pointer so you never lose the chain.",
    figure: "list",
    walkthrough: [
      "prev starts at nothing, curr at the head.",
      "Save curr.next before you overwrite it — that save is the whole trick.",
      "Point curr at prev, then slide both forward one node.",
    ],
    check: "In reversal, which line must happen before curr.next = prev, and why?",
    mistake: "Overwriting next before saving it, which cuts the list in half.",
    hints: [
      "Draw three boxes: prev, curr, next. Your code is just moving those three arrows.",
      "Always stash the successor first — you cannot read it after you have rewritten it.",
      "A dummy head node removes the \"is this the first node?\" special case.",
    ],
    complexity: "O(n) time, O(1) space for in-place reversal.",
    codeCue: "let next = curr.next; curr.next = prev; prev = curr; curr = next;",
  },
  {
    id: "trees",
    label: "Trees",
    aliases: ["tree", "bst", "binary tree", "dfs", "bfs", "level order", "depth", "diameter", "lca", "validate bst"],
    hook: "A family tree at a wedding. Either you meet each branch one generation at a time (BFS) or you go all the way to a grandchild before turning back (DFS).",
    idea: "Trees are recursion with a base case of null — or a stack you manage yourself. Ask what one node needs from its children.",
    figure: "tree",
    walkthrough: [
      "Recurse left, then combine, then recurse right.",
      "The null child returns the nothing-value: 0 for depth, -infinity for BST checks.",
      "Level order is a queue: process the nodes you counted before you add their children.",
    ],
    check: "For maximum depth, what does a leaf return, and what does a null return?",
    mistake: "Validating a BST by only comparing a node with its parent — an uncle can still break the range.",
    hints: [
      "Trust the recursion: assume the child call is correct and ask what you add on top.",
      "Write the base case first, even if it is just \"return 0 for null\".",
      "For ordered traversal, carry the allowed (low, high) range down with you.",
    ],
    complexity: "O(n) time for every node once; O(height) recursion space, worst O(n).",
    codeCue: "1 + max(depth(root.left), depth(root.right)) is a whole solution.",
  },
  {
    id: "graphs",
    label: "Graphs",
    aliases: ["graph", "bfs", "dfs", "island", "number of islands", "course schedule", "cycle detection", "dijkstra", "union find", "topological"],
    hook: "Social media. You visit a friend, then their friends. The only rule that stops you going round forever is: mark them as visited.",
    idea: "Traversals plus a visited set. BFS for fewest steps, DFS for connectivity and structure, union-find for merging groups.",
    figure: "graph",
    walkthrough: [
      "Start node goes in the queue and is marked visited immediately.",
      "Pop a node, add its unvisited neighbours, mark each one as you push.",
      "The layer count is the shortest distance when you pop it.",
    ],
    check: "What breaks if you mark visited when you pop instead of when you push?",
    mistake: "Marking visited on pop, so the same node joins the queue several times and the level count lies.",
    hints: [
      "Name the nodes and the edges first. Half of graph problems are really \"build the adjacency list\".",
      "Shortest number of anything on unweighted edges is BFS, not DFS.",
      "For ordering with dependencies, record in-degree and peel zero-in-degree nodes.",
    ],
    complexity: "O(V + E) time, O(V) space.",
    codeCue: "adjacency map + visited set + one queue.",
  },
  {
    id: "backtracking",
    label: "Backtracking",
    aliases: ["backtrack", "permutation", "subset", "combination", "n queens", "sudoku", "word search"],
    hook: "A maze. You walk until a wall, then you erase your footprints and take the other corridor.",
    idea: "Choose, explore, un-choose. The un-choose is what makes it a search instead of a mess.",
    figure: "tree",
    walkthrough: [
      "At each depth, loop over the candidates still available.",
      "Choose one, recurse to the next depth.",
      "Un-choose on the way back so the sibling branches start clean.",
    ],
    check: "Which line in your code is the undo, and what does it forget if you skip it?",
    mistake: "Passing the same array by reference so every branch mutates the answer you already collected.",
    hints: [
      "Write down the decision at one level. The whole recursion is that decision repeated.",
      "Need to avoid repeats? Sort, then skip the same value at the same depth.",
      "Collect a copy of the path, never the live array.",
    ],
    complexity: "Exponential by nature — your win is pruning, and the base case that fires early.",
    codeCue: "push / recurse / pop, symmetric three lines.",
  },
  {
    id: "heaps",
    label: "Heaps",
    aliases: ["heap", "priority queue", "kth largest", "top k", "median", "merge k", "scheduler"],
    hook: "An emergency ward. Nobody waits in arrival order — the worst case is always seen next.",
    idea: "When you keep asking for the biggest or smallest thing among many, pay O(log n) per update instead of O(n log n) re-sorting.",
    figure: "tree",
    walkthrough: [
      "A size-K min-heap keeps the K largest: anything smaller than the top is useless.",
      "Push, then pop when the heap exceeds K.",
      "The top is the K-th largest, and the heap holds your answer set.",
    ],
    check: "For the K largest elements, why is a min-heap of size K better than sorting everything?",
    mistake: "Using a max-heap of all n elements when you only ever needed K of them.",
    hints: [
      "How many answers do you need to remember at once? That number is your heap size.",
      "In JS the built-in sort is fine for small n; the interview wants the heap argument.",
      "Median streaming is two heaps: max on the left, min on the right, keep them within one.",
    ],
    complexity: "O(n log k) time, O(k) space.",
    codeCue: "Heap of size k, evict on size overflow, read the top at the end.",
  },
  {
    id: "intervals",
    label: "Intervals",
    aliases: ["interval", "merge intervals", "meeting rooms", "non-overlapping", "overlap", "calendar"],
    hook: "A day planner. Overlaps only hurt once you lay events down in the order they start.",
    idea: "Sort by start, then compare only with the last block you accepted — everything before it is already settled.",
    figure: "grid",
    walkthrough: [
      "Sort intervals by start time.",
      "If the next start is at or before the current end, they touch — merge and widen the end.",
      "Otherwise close the current block and start a new one.",
    ],
    check: "After sorting by start, which single number tells you whether two intervals still overlap?",
    mistake: "Sorting by end and wondering why merges are missed, or comparing against the first interval instead of the last kept one.",
    hints: [
      "You never need to compare every pair. Sorting buys you that.",
      "Keep the merged list in one array and mutate only its last entry.",
      "For counting rooms, sweep start and end events in one sorted timeline.",
    ],
    complexity: "O(n log n) dominated by the sort, O(n) space for the output.",
    codeCue: "sort((a,b) => a[0]-b[0]) then a last-element comparison.",
  },
  {
    id: "dp-1d",
    label: "1-D DP",
    aliases: ["dp", "dynamic programming", "climbing stairs", "fib", "house robber", "coin change", "word break", "knapsack", "memo"],
    hook: "A staircase. You do not re-climb to floor 5 to work out floor 6 — you already know floor 5.",
    idea: "The answer at i is built from answers you already computed. Define the state, then the transition, then the base case.",
    figure: "grid",
    walkthrough: [
      "dp[i] means \"best answer for the first i items\".",
      "Each cell reads the one or two cells before it.",
      "Fill left to right; the last cell is the answer.",
    ],
    check: "Say your state in one sentence: what exactly does dp[i] mean for your problem?",
    mistake: "Recursing without a memo, then calling it DP, or writing the transition before the state is defined.",
    hints: [
      "Write the brute-force recursion first. Memoising it is step two, not step one.",
      "Ask what information from the previous step you actually use — often that lets you keep two variables, not an array.",
      "Base cases are where the empty or single-element input lands. Handle them before the loop.",
    ],
    complexity: "O(n) time and O(n) space, usually reducible to O(1) space.",
    codeCue: "prev / curr pair instead of an array once the recurrence only reads backwards.",
  },
  {
    id: "dp-2d",
    label: "2-D DP",
    aliases: ["2d dp", "grid path", "longest common subsequence", "lcs", "edit distance", "unique paths", "palindrome partition"],
    hook: "A city map with one-way streets. To reach any corner you came from the left or from above — so you price each corner once.",
    idea: "The state has two coordinates. Fill the table in an order where every cell you depend on is already paid for.",
    figure: "grid",
    walkthrough: [
      "dp[r][c] is the best answer using the first r and first c things.",
      "Match case comes from the diagonal, skip case from the row or the column.",
      "The answer sits in the bottom-right corner.",
    ],
    check: "For edit distance, which cell gives \"replace\", and which two give insert and delete?",
    mistake: "Filling row by row while reading a cell in the same row that has not been computed yet.",
    hints: [
      "Name both axes on the table edges before writing any code.",
      "The first row and column are the \"one side is empty\" cases — set them by hand.",
      "If only the previous row is read, keep two rows instead of the whole grid.",
    ],
    complexity: "O(m·n) time, O(m·n) space, often O(min(m,n)) space.",
    codeCue: "Two nested loops, diagonal from the top-left.",
  },
  {
    id: "greedy",
    label: "Greedy",
    aliases: ["greedy", "activity selection", "gas station", "jump game", "minimum arrows", "candies"],
    hook: "A buffet. You take the best plate in front of you — but only if you can prove that saving room for later never helps.",
    idea: "Take the locally best choice and prove it never costs you. If you cannot prove it, greedy is the wrong tool.",
    figure: "array",
    walkthrough: [
      "Sort or scan in the order the choice actually matters.",
      "Keep one variable: how far you can still reach, or when the current choice expires.",
      "Act the moment it expires, then reset it.",
    ],
    check: "Can you say out loud why taking the biggest now never hurts the answer later?",
    mistake: "Calling something greedy when it needs DP — i.e. when today's choice changes tomorrow's options.",
    hints: [
      "Find the exchange argument: swapping your choice with the greedy choice must not make the answer worse.",
      "Sort by the thing that expires first, not by the thing that starts first.",
      "If the answer is a count of actions, track the deadline of the action you already committed to.",
    ],
    complexity: "O(n log n) with the sort, O(1) extra space.",
    codeCue: "One running variable plus an if — no table, no recursion.",
  },
  {
    id: "bits",
    label: "Bit Manipulation",
    aliases: ["bit", "bitmask", "xor", "shift", "single number", "counting bits", "subset mask"],
    hook: "A row of light switches. Each switch costs nothing to flip and can encode a yes/no choice.",
    idea: "x ^ x is 0, so XOR cancels pairs and leaves the odd one out. Shifts walk the bits; masks enumerate subsets.",
    figure: "array",
    walkthrough: [
      "XOR everything: pairs vanish, the unpaired value survives.",
      "n & (n - 1) removes the lowest set bit — that is how you count bits fast.",
      "A mask of length n is one integer holding n booleans.",
    ],
    check: "Why does XOR of the whole array leave exactly the single number behind?",
    mistake: "Using & where the property needs ^, then debugging a wrong answer for two hours.",
    hints: [
      "Ask what cancels. XOR is the operation that undoes itself.",
      "For \"is this bit set\", compare (n >> i) & 1 instead of building powers of two.",
      "Enumerate subsets with for (mask = 0; mask < 1 << n; mask++) — small n only.",
    ],
    complexity: "O(n) time, O(1) space, with a constant factor no arithmetic loop beats.",
    codeCue: "let acc = 0; for (const v of nums) acc ^= v; return acc;",
  },
];

const fallbackLesson = patternLessons[0]!;

export function lessonFor(id: MentorPatternId): PatternLesson {
  return patternLessons.find((lesson) => lesson.id === id) ?? fallbackLesson;
}

const intentWords: Array<[MentorIntent, string[]]> = [
  ["stuck", ["stuck", "can't", "cant", "no idea", "confused", "don't understand", "dont understand", "help me", "give up", "too hard", "difficult"]],
  ["hint", ["hint", "guide", "nudge", "without solution", "don't tell", "dont tell", "give me a clue", "approach"]],
  ["code", ["code", "implement", "write", "python", "javascript", "js", "solution", "function"]],
  ["complexity", ["complexity", "big o", "runtime", "time", "space", "slow", "tle", "optimi"]],
  ["check", ["am i right", "is this correct", "check my", "review my", "does this work"]],
  ["next", ["what next", "next topic", "after this", "what should i learn", "roadmap", "which pattern"]],
  ["explain", ["explain", "what is", "what's", "how does", "how do", "teach", "understand", "mean", "difference", "vs", "why"]],
];

// Deliberately ordered: "explain two sum" is a hint request disguised as a
// question, while "explain sliding window" is genuinely a lecture.
const problemNames = [
  "two sum", "valid anagram", "contains duplicate", "group anagrams", "top k frequent",
  "valid palindrome", "two sum ii", "3sum", "container with most water", "trapping rain water",
  "best time to buy", "longest substring without repeating", "permutation in string",
  "minimum window substring", "sliding window maximum", "sum of subarray ranges",
  "valid parentheses", "min stack", "eval reverse polish", "daily temperatures",
  "car fleet", "largest rectangle in histogram", "next greater element",
  "binary search", "search a 2d matrix", "koko eating bananas", "find peak element",
  "search in rotated array", "time based key value", "reverse linked list", "merge two sorted lists",
  "reorder list", "remove n-th node", "copy list with random pointer", "add two numbers",
  "linked list cycle", "number of islands", "clone graph", "max depth", "balanced binary tree",
  "same tree", "subtree of another tree", "invert binary tree", "binary tree level order",
  "validate bst", "kth smallest bst", "lowest common ancestor", "course schedule",
  "graph valid tree", "red blue ships", "network delay", "swim in rising water", "word ladder",
  "permutations", "subsets", "combination sum", "word search", "n queens", "generate parentheses",
  "climbing stairs", "min cost climbing", "house robber", "house robber ii", "longest palindromic substring",
  "palindromic substring", "decode ways", "coin change", "maximum product subarray",
  "longest increasing subsequence", "word break", "longest common subsequence", "edit distance",
  "unique paths", "jump game", "gas station", "hand of straights", "merge intervals",
  "insert interval", "non overlapping intervals", "meeting rooms", "car fleet", "single number",
  "counting bits", "reverse bits", "missing number", "sum of two integers", "kth largest",
  "last stone weight", "merge k lists", "task scheduler", "find median from data stream",
];

function normalise(text: string): string {
  return text.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
}

export function detectPattern(text: string): MentorPatternId | null {
  const value = normalise(text);
  let best: { id: MentorPatternId; score: number } | null = null;
  for (const lesson of patternLessons) {
    for (const alias of lesson.aliases) {
      const needle = alias.toLowerCase();
      if (!value.includes(needle)) continue;
      const score = needle.length + (lesson.aliases.length > 4 ? 1 : 0);
      if (!best || score > best.score) best = { id: lesson.id, score };
    }
  }
  if (best) return best.id;
  // LeetCode titles do not name their pattern, so fall back to a taught mapping.
  const title = problemNames.find((name) => value.includes(name));
  if (!title) return null;
  for (const lesson of patternLessons) if (lesson.aliases.some((alias) => title.includes(alias.toLowerCase()))) return lesson.id;
  return null;
}

export function detectIntent(text: string): MentorIntent {
  const value = normalise(text);
  for (const [intent, words] of intentWords) {
    if (words.some((word) => value.includes(word))) return intent;
  }
  return "explain";
}

export function detectLevel(text: string): "beginner" | "practice" {
  const value = normalise(text);
  if (/(beginner|new to|never|first time|basic|slow|weak|no idea|confused|don't get|dont get)/.test(value)) return "beginner";
  if (/(optimi|tle|msie|complex|internship|placement|interview|round|offer|practice)/.test(value)) return "practice";
  return "beginner";
}

/** A short human acknowledgement so the lesson does not begin by lecturing. */
export function openLine(turn: MentorTurn): string {
  const lesson = lessonFor(turn.pattern);
  if (turn.intent === "stuck") return "Totally normal — this one trips most people up. We will not solve it in one jump.";
  if (turn.intent === "complexity") return "Good instinct to ask before writing code.";
  if (turn.intent === "next") return `You have ${lesson.label} in front of you. That is the right next thing.`;
  if (turn.level === "beginner") return "Okay, no jargon. One idea at a time.";
  return "Right, let us get to the part that matters.";
}

function hashKeys(lesson: PatternLesson): string[] {
  if (lesson.id === "hashing") return ["7", "1", "3", "2", "9", "5"];
  return lesson.walkthrough.map((_, index) => `k${index + 1}`);
}

function sceneSteps(lesson: PatternLesson): SceneStep[] {
  const code = lessonCode[lesson.id] ?? [];
  const steps: SceneStep[] = lesson.walkthrough.map((narration, index) => ({
    narration,
    code: code[index],
    active: lesson.figure === "hash" ? [index % 8] : [index],
    span: [index, Math.min(index + 2, 5)] as [number, number],
    reveal: index + 1,
  }));
  steps.push({ narration: lesson.mistake, code: code[lesson.walkthrough.length], active: [], reveal: lesson.walkthrough.length });
  return steps;
}

/** The figure is chosen here, not by the model, so the picture always matches the lesson. */
export function sceneFor(turn: MentorTurn): MentorScene {
  const lesson = lessonFor(turn.pattern);
  const steps = sceneSteps(lesson);
  return {
    figure: lesson.figure,
    title: lesson.label,
    values: sampleValues(lesson),
    keys: lesson.figure === "hash" ? hashKeys(lesson) : undefined,
    edges: lesson.figure === "tree" || lesson.figure === "graph" ? shapeEdges(lesson) : undefined,
    cells: lesson.figure === "grid" ? shapeCells(lesson) : undefined,
    steps: steps.length ? steps : [{ narration: lesson.idea }],
  };
}

function sampleValues(lesson: PatternLesson): number[] {
  switch (lesson.id) {
    case "two-pointers":
    case "sliding-window":
      return [1, 3, 4, 6, 8, 9, 11, 14];
    case "stack":
    case "monotonic-stack":
      return [73, 51, 64, 59, 98, 33, 71];
    case "binary-search":
    case "greedy":
    case "bits":
      return [2, 4, 6, 8, 10, 12, 14, 16];
    case "linked-list":
      return [1, 2, 3, 4, 5];
    case "trees":
    case "backtracking":
    case "heaps":
      return [8, 3, 10, 1, 5, 9, 12];
    case "graphs":
      return [1, 2, 3, 4, 5, 6];
    case "dp-1d":
    case "dp-2d":
    case "intervals":
      return [1, 2, 3, 4];
    default:
      return [2, 7, 11, 15];
  }
}

function shapeEdges(lesson: PatternLesson): [number, number][] {
  if (lesson.id === "backtracking") return [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
  if (lesson.id === "heaps") return [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
  if (lesson.id === "trees") return [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
  return [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [0, 5]];
}

function shapeCells(lesson: PatternLesson): { row: number; col: number; value: string }[] {
  const rows = lesson.id === "dp-2d" || lesson.id === "intervals" ? 4 : 3;
  const cols = lesson.id === "intervals" ? 7 : 5;
  const cells: { row: number; col: number; value: string }[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const value = lesson.id === "intervals" ? (row === 0 || col === 0 ? "1" : "0") : String((row * cols + col) % 4);
      cells.push({ row, col, value });
    }
  }
  return cells;
}

/** What the mentor says when there is no network, no quota, or a weak signal. */
export function teachOffline(turn: MentorTurn, hintStep: number): string[] {
  const lesson = lessonFor(turn.pattern);
  switch (turn.intent) {
    case "hint":
      return [openLine(turn), lesson.hook, lesson.hints[Math.min(hintStep, lesson.hints.length - 1)] ?? lesson.idea];
    case "complexity":
      return [openLine(turn), `${lesson.label}: ${lesson.complexity}`, lesson.check];
    case "code":
      return [openLine(turn), lesson.codeCue, lesson.idea, "Now type it yourself — that is the part that sticks."];
    case "check":
      return [openLine(turn), lesson.check];
    case "stuck":
      return [openLine(turn), lesson.hook, lesson.walkthrough[0] ?? lesson.idea, lesson.hints[0]!];
    default:
      return [openLine(turn), lesson.hook, lesson.idea, ...lesson.walkthrough, lesson.mistake, lesson.check];
  }
}
