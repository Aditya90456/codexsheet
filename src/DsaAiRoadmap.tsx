import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BrainCircuit, BookOpen, Check, Code2, ExternalLink, Lightbulb, Pause, Play, Target } from "lucide-react";

type ArticleSection = { title: string; body: string };
type ResourceLink = { label: string; url: string };
type Diagram = { title: string; steps: string[]; explanations?: string[] };
type Phase = {
  duration: number;
  weeks: string;
  title: string;
  summary: string;
  dsa: string[];
  dsaGoal: string;
  dsaArticle: ArticleSection[];
  dsaDiagram: Diagram;
  dsaQuestions: string[];
  dsaResources: ResourceLink[];
  aiPractice: string;
  project?: string;
  mission: DsaMission;
};
type DsaMission = {
  title: string;
  task: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

const phases: Phase[] = [
  {
    duration: 6,
    weeks: "WEEKS 01–06",
    title: "Foundations",
    summary: "Build fluency, learn to reason about complexity, and get comfortable turning small ideas into working code.",
    dsa: [
      "Python or C++ fluency, plus Big-O analysis",
      "Arrays, strings, hashing: maps and sets",
      "Two pointers, sliding window, and prefix sums",
      "Recursion, basic sorting and binary search",
    ],
    dsaGoal: "Target: 60–80 easy and medium problems.",
    dsaArticle: [
      { title: "Get fluent in one language", body: "Choose Python or C++ and make it your interview language for this track. Practise writing functions, loops, conditionals, and using strings, arrays, maps, and sets without looking up basic syntax. For every solution, estimate time and extra space: a nested scan is often O(n²), while one hash-map pass is usually O(n)." },
      { title: "Learn to read arrays and strings", body: "Start with a direct scan and name the state you need to remember. Use a map or set for frequencies and fast membership checks. Two pointers are useful when a sorted order or a left/right boundary lets you discard possibilities; sliding windows maintain a range as it moves; prefix sums turn repeated range totals into differences of accumulated values." },
      { title: "Make recursion and binary search precise", body: "For recursion, define what one call promises, identify the base case, and check that every call moves toward it. For binary search, write down the invariant before coding—for example, which half may still contain the answer—and keep the boundary updates consistent with that invariant. Learn a small number of basic sorting methods, then focus on when library sorting is appropriate." },
    ],
    dsaDiagram: {
      title: "A first problem-solving loop",
      steps: ["Read constraints", "Choose a pattern", "Write the invariant", "Code and test"],
      explanations: [
        "Identify input size, limits, and edge cases before choosing an algorithm.",
        "Use the constraints and problem signals to compare candidate data structures or patterns.",
        "State what must remain true as your algorithm processes the input.",
        "Test a normal case and an edge case, then confirm the complexity fits.",
      ],
    },
    dsaQuestions: [
      "When does a hash map improve a repeated search, and what extra space does it use?",
      "What property makes a sliding window valid for the problem you are solving?",
      "For binary search, what is your interval invariant and how does each update preserve it?",
    ],
    dsaResources: [
      { label: "Python tutorial", url: "https://docs.python.org/3/tutorial/" },
      { label: "LeetCode problem patterns", url: "https://leetcode.com/explore/" },
    ],
    aiPractice: "Ask an AI tutor for a hint about whether hashing or a two-pointer approach fits a problem. First make it explain the clue and complexity; then solve it yourself and verify with tests.",
    project: "Build a DSA practice log that records patterns, complexity, test cases, and spaced re-solves.",
    mission: {
      title: "Two pointers under constraints",
      task: "Implement two-sum for a sorted array without nested loops. Test a valid pair, duplicates, and a target that does not exist.",
      question: "For a sorted array, which approach finds a pair in O(n) time with O(1) extra space?",
      choices: ["Check every pair", "Move two pointers from opposite ends", "Store every value in a hash map", "Sort the array again"],
      answer: 1,
      explanation: "The sorted order lets you safely move the left pointer to increase the sum or the right pointer to decrease it. Each pointer moves at most n times.",
    },
  },
  {
    duration: 8,
    weeks: "WEEKS 07–14",
    title: "Core data structures",
    summary: "Choose the right structure for each operation, then practise explaining its invariant and trade-offs.",
    dsa: [
      "Linked lists, stacks, queues, and monotonic stacks",
      "Trees and BSTs, heaps, and priority queues",
      "Graphs: BFS, DFS, and topological sort",
      "Union-find and timed interview practice",
    ],
    dsaGoal: "Target: 100+ medium problems; practise solving in 45 minutes.",
    dsaArticle: [
      { title: "Choose a structure from the operations", body: "Linked lists teach pointer updates and careful edge-case handling; stacks and queues model last-in-first-out and first-in-first-out work. A monotonic stack keeps values ordered so the next greater or smaller element can be found in linear time. State what each pointer or stack entry represents before changing it." },
      { title: "Use trees and heaps for ordered decisions", body: "Practise recursive and iterative tree traversals, and understand the BST ordering invariant. A heap gives quick access to the current minimum or maximum, making it useful for repeated scheduling and top-k tasks. Compare its O(log n) insertion/removal with sorting everything when only a few best candidates are needed." },
      { title: "Model graph problems explicitly", body: "Represent vertices and edges, then use BFS for shortest paths in unweighted graphs and DFS for reachability and component exploration. Topological ordering applies to directed acyclic dependencies. Union-find tracks connected components as edges are added; path compression and union by rank make repeated connectivity checks efficient. Practise explaining the traversal state and visited rule." },
    ],
    dsaDiagram: {
      title: "Breadth-first graph traversal",
      steps: ["Start node", "Queue", "Visit once", "Add neighbors", "Next layer"],
      explanations: [
        "Choose a starting vertex and mark it as discovered.",
        "Put discovered vertices in a FIFO queue so earlier layers are processed first.",
        "Mark a node when it is enqueued to avoid duplicate work.",
        "Add each unvisited neighbor to the queue and record its predecessor if needed.",
        "The queue order explores all vertices at distance d before distance d + 1.",
      ],
    },
    dsaQuestions: [
      "Why does BFS find shortest paths in an unweighted graph?",
      "What can go wrong if a node is marked visited only after it leaves the queue?",
      "When is topological ordering valid, and when would you use union-find instead?",
    ],
    dsaResources: [
      { label: "CP-Algorithms: graph search", url: "https://cp-algorithms.com/graph/search-for-connected-components.html" },
      { label: "LeetCode graph problems", url: "https://leetcode.com/tag/graph/" },
    ],
    aiPractice: "Use AI to generate a small graph or tree trace, then independently check the queue/stack contents and visited set after every operation. Ask it to explain mistakes rather than give a complete solution.",
    project: "Build a visualizer for stacks, queues, trees, and BFS that animates operations and shows their complexity.",
    mission: {
      title: "Trace BFS like a queue",
      task: "Use the graph visualizer above. Starting at A, write down the queue and visited set after each removal. Then explain why this order finds shortest paths in an unweighted graph.",
      question: "When should BFS mark a neighbor as visited?",
      choices: ["When it is first enqueued", "Only after it is removed from the queue", "After the entire traversal", "Only if it is the target"],
      answer: 0,
      explanation: "Marking on enqueue prevents the same vertex from being added repeatedly by multiple neighbors, while preserving the layer-by-layer traversal.",
    },
  },
  {
    duration: 8,
    weeks: "WEEKS 15–22",
    title: "Advanced algorithms",
    summary: "Learn to model state, search choices, and reason about algorithmic trade-offs under constraints.",
    dsa: [
      "Dynamic programming: 1D, 2D, knapsack, LIS, and grid problems",
      "Backtracking, tries, Dijkstra, and intervals",
      "Bit manipulation and weekly LeetCode or Codeforces contests",
      "Practise spotting the pattern before writing code",
    ],
    dsaGoal: "Target: 250–300 problems total, with patterns becoming familiar.",
    dsaArticle: [
      { title: "Turn dynamic programming into explicit state", body: "Define the state in plain language before writing a recurrence: what information is enough to describe the remaining subproblem? Write the transition, base cases, and evaluation order, then estimate the number of states and work per state. Begin with a recursive version for clarity, memoize repeated states, and only then consider a bottom-up table or space optimization." },
      { title: "Separate search from optimization", body: "Backtracking explores choices and undoes them when returning; use pruning only when you can justify that a branch cannot lead to a valid answer. A trie shares prefixes for string queries. Dijkstra’s algorithm uses a priority queue for non-negative edge weights. Interval problems often depend on sorting endpoints, while bit manipulation is clearest when each mask’s meaning is stated explicitly." },
      { title: "Practise recognizing patterns under time", body: "Mix topics in weekly contests so you must identify the useful structure before coding. After each attempt, write down the clue you missed, the invariant or state that unlocked it, and one variation. Re-solve selected problems later without notes; recognition is reliable only when you can reconstruct the idea, not just remember a final implementation." },
    ],
    dsaDiagram: {
      title: "Build a dynamic-programming solution",
      steps: ["Define state", "Write transition", "Set base cases", "Memoize or tabulate", "Read answer"],
      explanations: [
        "Describe exactly what one subproblem or table cell represents.",
        "Express the current state using smaller states and the available choices.",
        "Set answers for the smallest subproblems that need no further work.",
        "Compute each state once, using memoization or a valid bottom-up order.",
        "Identify which state contains the requested result and estimate total work.",
      ],
    },
    dsaQuestions: [
      "What does one state in your DP table mean, and what is the transition?",
      "How do you know the base cases cover the smallest valid subproblems?",
      "Why does Dijkstra require non-negative edge weights?",
    ],
    dsaResources: [
      { label: "CP-Algorithms: dynamic programming", url: "https://cp-algorithms.com/dynamic_programming/intro-to-dp.html" },
      { label: "LeetCode dynamic programming", url: "https://leetcode.com/tag/dynamic-programming/" },
    ],
    aiPractice: "Treat AI as a debugging partner, not an oracle: ask for counterexamples to a DP recurrence or a proof gap in a greedy idea. Confirm the result with your own derivation and a brute-force checker on small inputs.",
    project: "Create a DSA study assistant that gives progressive hints from your own notes and checks examples against reference tests.",
    mission: {
      title: "Write a DP recurrence",
      task: "For climbing n stairs with steps of size 1 or 2, define dp[i], state base cases, then implement a bottom-up solution. Compare small n values with a recursive version.",
      question: "If dp[i] counts ways to reach stair i, which recurrence is correct?",
      choices: ["dp[i] = dp[i - 1] + dp[i - 2]", "dp[i] = i × dp[i - 1]", "dp[i] = dp[i - 1] - dp[i - 2]", "dp[i] = dp[i + 1] + 1"],
      answer: 0,
      explanation: "The final move to stair i comes from i - 1 or i - 2, so the two disjoint sets of ways add together. Set base cases before applying this transition.",
    },
  },
  {
    duration: 4,
    weeks: "WEEKS 23–26",
    title: "Interview readiness & capstone",
    summary: "Bring the full DSA toolkit together, explain your decisions, and ship an AI-assisted DSA learning product.",
    dsa: [
      "Mock interviews and revisiting weak patterns",
      "Mixed-topic problem sets under time pressure",
      "System-design basics and explaining trade-offs",
    ],
    dsaGoal: "Target: explain your approach clearly, then code it under pressure.",
    dsaArticle: [
      { title: "Run realistic mock interviews", body: "Choose a mixed problem, clarify inputs and constraints, explain a baseline, then improve it before coding. Speak through invariants and test edge cases aloud. At the end, review correctness, complexity, communication, and time use separately. Revisit weak patterns in spaced sessions instead of attempting a large unstructured set." },
      { title: "Practise a repeatable system-design outline", body: "For a small interview design, clarify functional and non-functional requirements, sketch the main components and data flow, and identify likely bottlenecks. Explain trade-offs and failure behavior rather than listing technologies. Keep the design proportional to the prompt and state assumptions so the interviewer can challenge them." },
    ],
    dsaDiagram: {
      title: "A clear interview solution",
      steps: ["Clarify", "Choose approach", "Code", "Test edge cases", "Explain trade-offs"],
      explanations: [
        "Confirm the input, output, constraints, and assumptions with the interviewer.",
        "Explain a baseline and why the chosen pattern meets the input limits.",
        "Implement in small steps while narrating the key invariant.",
        "Trace representative and boundary cases, including empty or duplicate values.",
        "State time and space costs and discuss alternatives only when relevant.",
      ],
    },
    dsaQuestions: [
      "What constraints should you clarify before proposing an algorithm?",
      "How will you test empty, minimal, maximum-size, and duplicate inputs?",
      "Can you explain the time and space complexity and why it meets the constraints?",
    ],
    dsaResources: [
      { label: "LeetCode interview study plans", url: "https://leetcode.com/studyplan/" },
      { label: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
    ],
    aiPractice: "Use AI for mock interviews and targeted hints. Ask it to challenge your complexity analysis, then check every claim against constraints, edge cases, and tests before accepting it.",
    project: "Deploy an AI-assisted DSA mentor with problem recommendations, progressive hints, test cases, and spaced review.",
    mission: {
      title: "Make the interview trade-off",
      task: "Pick one medium problem and run a 45-minute mock. Explain the brute-force baseline, improve it, test edge cases, and finish by stating time and space complexity.",
      question: "You need fast frequency counts while scanning n values once. What is the usual time/space trade-off?",
      choices: ["O(n²) time and O(1) extra space", "O(n) average time and O(n) extra space with a hash map", "O(log n) time and O(log n) extra space", "O(1) time and O(1) extra space"],
      answer: 1,
      explanation: "A hash map gives average O(1) updates/lookups, so one pass is O(n) time and the stored frequencies can use O(n) space.",
    },
  },
];

const connections = [
  ["Heaps", "Rank candidate problems or hints by difficulty and relevance."],
  ["Graphs", "Model topic prerequisites and recommend a valid next learning path."],
  ["Hashing", "Find repeated mistakes, patterns, and related practice problems quickly."],
  ["Dynamic programming", "Schedule spaced review by reusing subproblem and priority ideas."],
  ["Trees", "Organize topic hierarchies and support efficient exploration of a DSA curriculum."],
];

const weeklyRhythm = [
  { day: "Mon–Fri", dsa: "1–2 hours · 2–3 problems", ai: "Hints, traces, and test ideas only after trying", focus: "Keep the reasoning yours" },
  { day: "Saturday", dsa: "Contest or mock interview", ai: "Ask AI to challenge your explanation", focus: "Apply the week’s learning" },
  { day: "Sunday", dsa: "Re-solve mistakes and plan", ai: "Summarize patterns; verify every claim", focus: "Choose next week’s priorities" },
];

const habits = [
  "Keep a notebook of patterns and mistakes; retry failed problems a week later.",
  "Struggle with a problem for 20–30 minutes before reading its solution.",
  "Ship every project to GitHub with a README—your portfolio matters as much as your problem count.",
  "Use projects to apply what you learn; tutorial-only learning fades quickly.",
];

const dataStructureGuide = [
  { name: "Array / string", use: "Use for ordered data, indexed access, or a sequence you scan and transform.", how: "Read or update index i directly in O(1). A full scan is O(n); inserting or deleting in the middle usually shifts elements and costs O(n).", watch: "Check bounds, empty inputs, and whether mutation is allowed." },
  { name: "Hash map / set", use: "Use for fast membership checks, counting frequencies, or mapping a key to associated data.", how: "Store a key or value as you scan. Lookup and insertion are O(1) on average, with O(n) extra space in the worst case.", watch: "Account for duplicate keys, key equality, and whether ordering matters." },
  { name: "Stack / queue / deque", use: "Use a stack for nested or last-in-first-out work; a queue for first-in-first-out processing; a deque when both ends matter.", how: "Push/pop at the stack end or enqueue/dequeue at opposite queue ends are usually O(1). They support DFS, BFS, parsing, and task scheduling.", watch: "Choose the removal order deliberately; a normal queue is not a priority queue." },
  { name: "Monotonic stack / deque", use: "Use when each item needs its next greater/smaller value, or a moving window needs its minimum/maximum.", how: "Keep candidate indices in increasing or decreasing value order, removing candidates that can no longer be answers. Each index enters and leaves once: O(n) amortized.", watch: "Store indices when you need window boundaries, and discard expired indices." },
  { name: "Linked list", use: "Use when links are part of the problem or insertion/removal is frequent after the relevant node is already known.", how: "Update next/previous pointers in O(1) locally. Finding a position or accessing the kth item is O(n).", watch: "Draw pointer changes; handle head, tail, one-node, and sentinel cases." },
  { name: "Tree / BST", use: "Use for hierarchical data, recursive subproblems, or ordered lookup when the BST invariant is maintained.", how: "Traversals visit nodes in O(n). A balanced BST searches and updates in O(log n); an unbalanced tree can degrade to O(n).", watch: "State what each traversal returns and do not assume a BST is balanced." },
  { name: "Heap / priority queue", use: "Use when you repeatedly need the smallest or largest current item, such as top-k, scheduling, or Dijkstra.", how: "Peek at the extreme in O(1); push and pop take O(log n). Finding an arbitrary element is generally O(n).", watch: "A heap is only partially ordered; it does not keep every item globally sorted." },
  { name: "Graph (adjacency list)", use: "Use for networks, dependencies, routes, or any data where relationships are not a simple hierarchy.", how: "Store each vertex’s neighbors. BFS/DFS take O(V + E); an adjacency list uses O(V + E) space.", watch: "Track visited state; identify direction, weights, disconnected components, and cycles." },
  { name: "Union-find / DSU", use: "Use to answer whether two items are connected while edges or unions are added.", how: "Find a representative for each component; union combines components. Path compression and union by rank give near-constant amortized operations.", watch: "It does not directly handle edge removal or return full paths." },
  { name: "Trie", use: "Use for prefix queries, dictionaries, and autocomplete over strings.", how: "Follow one edge per character; lookup or insertion takes O(L) for a word of length L.", watch: "Memory can be large; share prefixes and use sparse child maps when appropriate." },
];

const dsaConceptGuide = [
  { name: "Two pointers", how: "Move two indices through a sequence while maintaining a relation between them.", use: "Sorted pair searches, partitioning, reversing, or comparing from both ends.", watch: "Each pointer movement must safely eliminate candidates; often O(n) after sorting." },
  { name: "Sliding window", how: "Maintain a contiguous range and update its counts or sum as its boundaries move.", use: "Substring/subarray questions about a longest, shortest, or fixed-size valid range.", watch: "The shrink/expand rule needs a monotonic validity property; negative values can break sum-based rules." },
  { name: "Prefix sums", how: "Store cumulative totals so a range sum is the difference of two prefixes.", use: "Many static range-sum queries or counting subarrays by a target sum.", watch: "Clarify inclusive/exclusive boundaries; use a hash map of prior prefixes for target-sum counts." },
  { name: "Binary search", how: "Repeatedly discard half of a sorted search space while preserving a boundary invariant.", use: "Searching sorted values or finding the first/last position where a monotonic condition changes.", watch: "Prove the predicate is monotonic and define whether the interval is closed or half-open." },
  { name: "Recursion", how: "Solve a problem by defining a smaller subproblem, with a base case that stops the calls.", use: "Trees, divide-and-conquer, and naturally recursive structures.", watch: "Every call must make progress; account for call-stack space and repeated work." },
  { name: "Backtracking", how: "Build a partial candidate, explore a choice, then undo it before trying the next choice.", use: "Enumerating combinations, permutations, paths, or constraint-satisfying assignments.", watch: "The search may be exponential; prune only when a branch provably cannot work." },
  { name: "BFS", how: "Visit vertices in queue order, exploring all nodes at distance d before distance d + 1.", use: "Shortest path by number of edges in an unweighted graph, or level-order traversal.", watch: "Mark nodes visited when enqueued to avoid duplicate work; weighted edges need another method." },
  { name: "DFS", how: "Explore one branch deeply using recursion or an explicit stack before backtracking.", use: "Reachability, connected components, cycle detection, and tree traversal.", watch: "Handle disconnected graphs by starting a traversal from every unvisited vertex." },
  { name: "Topological sort", how: "Order vertices so every directed edge points from an earlier item to a later one.", use: "Prerequisites, build pipelines, and other dependency ordering in a DAG.", watch: "A valid order exists only for a directed acyclic graph; detect if not all vertices are emitted." },
  { name: "Dijkstra", how: "Use a min-priority queue to repeatedly finalize the nearest known vertex and relax its outgoing edges.", use: "Shortest paths from one source when every edge weight is non-negative.", watch: "Negative edges invalidate the method; skip stale heap entries or process updates carefully." },
  { name: "Dynamic programming", how: "Define a state, recurrence, base cases, and evaluation order; memoize or tabulate overlapping subproblems.", use: "Optimization or counting where subproblems repeat and an answer can be composed from smaller answers.", watch: "State meaning must be exact; estimate states × work per state before optimizing space." },
  { name: "Intervals", how: "Sort by a chosen endpoint, then merge, select, or sweep while maintaining the active boundary.", use: "Overlapping ranges, meeting times, scheduling, and event ordering.", watch: "Decide whether touching endpoints overlap and handle equal-start/equal-end ties." },
  { name: "Greedy", how: "Make the best-looking local choice and rely on a proof that it can be part of a global optimum.", use: "Scheduling, interval selection, and problems with an exchange or cut-property proof.", watch: "A plausible local rule is not enough; prove why it cannot block a better solution." },
  { name: "Bit manipulation", how: "Represent a set or compact state with bits; use masks to test, add, remove, or combine flags.", use: "Small-universe subsets, parity, flags, and bitmask DP.", watch: "Check operator precedence, signed shifts, and the number of bits supported by the integer type." },
];

type ExplorerKind = "array" | "map" | "stack" | "queue" | "heap" | "tree" | "graph";
type ExplorerStep = { action: string; description: string; items: string[]; activeIndexes: number[] };
type StructureDemo = { id: ExplorerKind; label: string; description: string; steps: ExplorerStep[] };

const structureDemos: StructureDemo[] = [
  {
    id: "array",
    label: "Array",
    description: "Indexed sequence · O(1) access by index",
    steps: [
      { action: "Read index 2", description: "Jump directly to index 2. Arrays are useful when order and positional access matter.", items: ["7", "3", "9", "2"], activeIndexes: [2] },
      { action: "Update index 2", description: "Replace the value at index 2 without shifting the remaining elements.", items: ["7", "3", "10", "2"], activeIndexes: [2] },
    ],
  },
  {
    id: "map",
    label: "Hash map",
    description: "Key → value lookup · O(1) average",
    steps: [
      { action: "Look up “dog”", description: "Use a key to find its stored count without scanning every entry.", items: ["cat:2", "dog:1", "owl:1"], activeIndexes: [1] },
      { action: "Count another “dog”", description: "Read the existing frequency and increment it as the next item arrives.", items: ["cat:2", "dog:2", "owl:1"], activeIndexes: [1] },
    ],
  },
  {
    id: "stack",
    label: "Stack",
    description: "Last in, first out · push / pop at the top",
    steps: [
      { action: "Push D", description: "Add the new item to the top. The most recently added item is the next one removed.", items: ["A", "B", "C", "D"], activeIndexes: [3] },
      { action: "Pop D", description: "Remove the top item. This order is useful for undo, parsing, and depth-first traversal.", items: ["A", "B", "C"], activeIndexes: [2] },
    ],
  },
  {
    id: "queue",
    label: "Queue",
    description: "First in, first out · enqueue / dequeue",
    steps: [
      { action: "Enqueue D", description: "Add D at the rear; existing items stay ahead of it.", items: ["A", "B", "C", "D"], activeIndexes: [3] },
      { action: "Dequeue A", description: "Remove the front item. Processing in arrival order is the key idea behind BFS.", items: ["B", "C", "D"], activeIndexes: [0] },
    ],
  },
  {
    id: "heap",
    label: "Min-heap",
    description: "Smallest item at the root · push / pop O(log n)",
    steps: [
      { action: "Insert 1", description: "Add at the next open spot, then sift upward until each parent is no greater than its children.", items: ["1", "5", "2", "11", "8", "3"], activeIndexes: [0] },
      { action: "Remove minimum", description: "Take the root, move the last item to the top, then sift down to restore heap order.", items: ["2", "5", "3", "11", "8"], activeIndexes: [0] },
    ],
  },
  {
    id: "tree",
    label: "BST",
    description: "Left values smaller, right values larger",
    steps: [
      { action: "Search for 6", description: "Compare at the root, then follow only the side that can contain 6.", items: ["8", "4", "12", "2", "6", "10", "14"], activeIndexes: [0] },
      { action: "Go left to 4", description: "Since 6 is smaller than 8, move to the left child.", items: ["8", "4", "12", "2", "6", "10", "14"], activeIndexes: [0, 1] },
      { action: "Find 6", description: "Since 6 is larger than 4, move right and find it. A skewed BST can still take O(n).", items: ["8", "4", "12", "2", "6", "10", "14"], activeIndexes: [0, 1, 4] },
    ],
  },
  {
    id: "graph",
    label: "Graph + BFS",
    description: "Vertices connected by edges · queue explores layers",
    steps: [
      { action: "Start at A", description: "Mark A visited and add it to the queue.", items: ["A"], activeIndexes: [0] },
      { action: "Visit neighbors", description: "Remove A; discover and enqueue its unvisited neighbors B and C.", items: ["A", "B", "C"], activeIndexes: [0, 1, 2] },
      { action: "Explore next layer", description: "Continue from B and C. BFS reaches every node by the fewest edges in an unweighted graph.", items: ["A", "B", "C", "D", "E"], activeIndexes: [0, 1, 2, 3, 4] },
    ],
  },
];

const dsaApproach = [
  ["Understand", "Restate the task in your own words. Clarify input limits, expected output, and edge cases."],
  ["Work an example", "Trace a small input by hand. Include an empty, smallest, or duplicate-heavy case when relevant."],
  ["Start simple", "Describe a correct brute-force solution first, then estimate its time and extra space."],
  ["Find the pattern", "Look for repeated work or useful structure. State the invariant your chosen technique must preserve."],
  ["Implement and test", "Write the solution in small steps. Check normal and edge cases, then explain complexity."],
  ["Review the miss", "If stuck, take a hint before reading the full answer. Record the clue and re-solve later without notes."],
];

const aiApproach = [
  ["Try first", "Spend 20–30 minutes making your own attempt before asking AI for help."],
  ["Ask for a hint", "Request a clue about the pattern or invariant, not a complete solution."],
  ["Challenge the answer", "Ask for edge cases or a counterexample; verify the reasoning against constraints."],
  ["Run your own tests", "Execute the code and compare it with a brute-force approach on small inputs."],
  ["Explain it back", "Close the chat and reconstruct the algorithm, correctness argument, and complexity."],
  ["Record the lesson", "Save the pattern and mistake in your notes; revisit it later without AI assistance."],
];

function RoadmapFlowDiagram({ title, steps, explanations }: Diagram) {
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) setPlaying(false);
    };
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!playing || !explanations || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 1900);
    return () => window.clearInterval(timer);
  }, [playing, reducedMotion, steps.length, explanations]);

  return (
    <figure className={`dsa-ai-flow${explanations ? " dsa-ai-flow-animated" : ""}`}>
      <div className="dsa-ai-flow-heading">
        <figcaption>{title}</figcaption>
        {explanations && (
          <div className="dsa-ai-flow-controls">
            <button type="button" aria-label="Previous explanation step" disabled={activeStep === 0} onClick={() => setActiveStep((current) => Math.max(0, current - 1))}>
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              aria-label={playing ? "Pause AI explanation" : "Play AI explanation"}
              title={reducedMotion ? "Use the step buttons with reduced motion enabled" : undefined}
              disabled={reducedMotion}
              onClick={() => setPlaying((current) => !current)}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
              <span>{playing ? "Pause" : "Play explanation"}</span>
            </button>
            <button type="button" aria-label="Next explanation step" onClick={() => setActiveStep((current) => (current + 1) % steps.length)}>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
      <ol>{steps.map((step, index) => (
        <li
          className={explanations && index === activeStep ? "is-active" : ""}
          aria-current={explanations && index === activeStep ? "step" : undefined}
          key={step}
        >
          {step}
        </li>
      ))}</ol>
      {explanations && (
        <p className="dsa-ai-flow-explanation" aria-live={playing ? "off" : "polite"}>
          <strong>Step {activeStep + 1}: {steps[activeStep]}.</strong> {explanations[activeStep]}
        </p>
      )}
    </figure>
  );
}

function DataStructureExplorer() {
  const [selectedId, setSelectedId] = useState<ExplorerKind>("array");
  const [stepIndex, setStepIndex] = useState(0);
  const demo = structureDemos.find((item) => item.id === selectedId) ?? structureDemos[0];
  const step = demo.steps[stepIndex];

  function chooseStructure(id: ExplorerKind) {
    setSelectedId(id);
    setStepIndex(0);
  }

  return (
    <section className="dsa-ai-explorer" aria-labelledby="dsa-ai-explorer-title">
      <header className="dsa-ai-explorer-heading">
        <div><span className="dsa-ai-kicker">INTERACTIVE DSA VISUALIZER</span><h3 id="dsa-ai-explorer-title">See the structure in action</h3></div>
        <span className="dsa-ai-explorer-step">STEP {stepIndex + 1} / {demo.steps.length}</span>
      </header>
      <div className="dsa-ai-explorer-tabs" role="group" aria-label="Choose a data structure">
        {structureDemos.map((item) => (
          <button
            type="button"
            aria-pressed={selectedId === item.id}
            className={selectedId === item.id ? "active" : ""}
            key={item.id}
            onClick={() => chooseStructure(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="dsa-ai-explorer-panel">
        <div className="dsa-ai-explorer-copy">
          <span>{demo.description}</span>
          <h4>{step.action}</h4>
          <p>{step.description}</p>
          <button type="button" className="dsa-ai-explorer-next" onClick={() => setStepIndex((current) => (current + 1) % demo.steps.length)}>
            Run next operation <ArrowRight size={14} />
          </button>
        </div>
        <div className={`dsa-ai-structure-visual dsa-ai-structure-${demo.id}`} aria-live="polite">
          {demo.id === "graph" ? (
            <svg viewBox="0 0 300 180" role="img" aria-label="Graph traversal from A to B and C, then D and E">
              <g className="dsa-ai-graph-edges">
                <line x1="150" y1="34" x2="78" y2="88" /><line x1="150" y1="34" x2="222" y2="88" />
                <line x1="78" y1="98" x2="78" y2="145" /><line x1="222" y1="98" x2="222" y2="145" />
              </g>
              {[{ id: "A", x: 150, y: 28 }, { id: "B", x: 78, y: 92 }, { id: "C", x: 222, y: 92 }, { id: "D", x: 78, y: 150 }, { id: "E", x: 222, y: 150 }].map((node, index) => (
                <g className={step.activeIndexes.includes(index) ? "visited" : ""} key={node.id}>
                  <circle cx={node.x} cy={node.y} r="19" /><text x={node.x} y={node.y + 4}>{node.id}</text>
                </g>
              ))}
            </svg>
          ) : demo.id === "tree" || demo.id === "heap" ? (
            <svg viewBox="0 0 300 180" role="img" aria-label={`${demo.label} structure visualization`}>
              <g className="dsa-ai-tree-edges">
                <line x1="150" y1="34" x2="82" y2="82" /><line x1="150" y1="34" x2="218" y2="82" />
                <line x1="82" y1="90" x2="47" y2="137" /><line x1="82" y1="90" x2="117" y2="137" />
                <line x1="218" y1="90" x2="183" y2="137" /><line x1="218" y1="90" x2="253" y2="137" />
              </g>
              {demo.steps[stepIndex].items.slice(0, 7).map((value, index) => {
                const positions = [{ x: 150, y: 28 }, { x: 82, y: 86 }, { x: 218, y: 86 }, { x: 47, y: 143 }, { x: 117, y: 143 }, { x: 183, y: 143 }, { x: 253, y: 143 }];
                const node = positions[index];
                return <g className={step.activeIndexes.includes(index) ? "active" : ""} key={`${index}-${value}`}><circle cx={node.x} cy={node.y} r="18" /><text x={node.x} y={node.y + 4}>{value}</text></g>;
              })}
            </svg>
          ) : demo.id === "map" ? (
            <div className="dsa-ai-map-entries">
              {step.items.map((entry, index) => {
                const [key, value] = entry.split(":");
                return <div className={step.activeIndexes.includes(index) ? "active" : ""} key={entry}><span>{key}</span><b>{value}</b></div>;
              })}
            </div>
          ) : (
            <>
              {(demo.id === "stack" || demo.id === "queue") && <span className="dsa-ai-structure-edge">{demo.id === "stack" ? "TOP" : "FRONT"}</span>}
              <div className="dsa-ai-structure-items">
                {step.items.map((item, index) => <span className={step.activeIndexes.includes(index) ? "active" : ""} key={`${index}-${item}`}>{item}</span>)}
              </div>
              {(demo.id === "stack" || demo.id === "queue") && <span className="dsa-ai-structure-edge">{demo.id === "stack" ? "BOTTOM" : "REAR"}</span>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function StructureDiagram({ name }: { name: string }) {
  if (name.startsWith("Array")) {
    return <svg viewBox="0 0 260 92" role="img" aria-label="Indexed array cells"><g className="dsa-ai-mini-cells">{["4", "8", "2", "7"].map((item, index) => <g key={index}><rect x={20 + index * 54} y="25" width="46" height="38" rx="7" /><text x={43 + index * 54} y="49">{item}</text><text className="index" x={43 + index * 54} y="78">{index}</text></g>)}</g></svg>;
  }
  if (name.startsWith("Hash")) {
    return <svg viewBox="0 0 260 92" role="img" aria-label="Hash map key and value pairs"><g className="dsa-ai-mini-map"><rect x="18" y="18" width="102" height="50" rx="8" /><rect x="140" y="18" width="102" height="50" rx="8" /><text x="69" y="39">key</text><text x="69" y="56">“cat”</text><text x="191" y="39">value</text><text x="191" y="56">count: 3</text><path d="M121 43h17" /></g></svg>;
  }
  if (name.startsWith("Stack") || name.startsWith("Monotonic")) {
    const stack = name.startsWith("Stack") && !name.includes("queue");
    return <svg viewBox="0 0 260 92" role="img" aria-label={stack ? "Stack with top item" : "Queue with front and rear"}><g className="dsa-ai-mini-cells">{["A", "B", "C", "D"].map((item, index) => <g key={item}><rect x={stack ? 90 : 22 + index * 54} y={stack ? 60 - index * 14 : 29} width={stack ? 80 : 46} height={stack ? 14 : 36} rx="5" /><text x={stack ? 130 : 45 + index * 54} y={stack ? 70 - index * 14 : 52}>{item}</text></g>)}</g><text className="dsa-ai-mini-label" x={stack ? 130 : 20} y="17">{stack ? "TOP" : "FRONT"}</text><text className="dsa-ai-mini-label" x={stack ? 130 : 242} y="83">{stack ? "LIFO" : "REAR"}</text></svg>;
  }
  if (name.startsWith("Linked")) {
    return <svg viewBox="0 0 260 92" role="img" aria-label="Linked list nodes connected by pointers"><g className="dsa-ai-mini-edges"><path d="M55 46h42m64 0h42" /></g><g className="dsa-ai-mini-nodes">{["A", "B", "C"].map((item, index) => <g key={item}><circle cx={38 + index * 92} cy="46" r="20" /><text x={38 + index * 92} y="50">{item}</text></g>)}</g></svg>;
  }
  if (name.startsWith("Trie")) {
    return <svg viewBox="0 0 260 92" role="img" aria-label="Trie sharing word prefixes"><g className="dsa-ai-mini-edges"><path d="M40 46h52M92 46 145 22M92 46l53 25M145 22h66M145 71h66" /></g><g className="dsa-ai-mini-nodes">{[{ x: 40, y: 46, t: "root" }, { x: 92, y: 46, t: "c" }, { x: 145, y: 22, t: "a" }, { x: 145, y: 71, t: "u" }, { x: 211, y: 22, t: "t" }, { x: 211, y: 71, t: "p" }].map((node) => <g key={`${node.x}-${node.y}`}><circle cx={node.x} cy={node.y} r="12" /><text x={node.x} y={node.y + 3}>{node.t}</text></g>)}</g></svg>;
  }
  if (name.startsWith("Union")) {
    return <svg viewBox="0 0 260 92" role="img" aria-label="Disjoint sets joined into connected components"><g className="dsa-ai-mini-edges"><path d="M48 33h45m-45 0 23 37m22-37 23 37m26-37h45m-45 0 23 37m22-37 23 37" /></g><g className="dsa-ai-mini-nodes">{[{ x: 48, y: 33 }, { x: 93, y: 33 }, { x: 71, y: 70 }, { x: 142, y: 33 }, { x: 187, y: 33 }, { x: 165, y: 70 }].map((node, index) => <circle key={index} cx={node.x} cy={node.y} r="8" />)}</g></svg>;
  }
  if (name.startsWith("Graph")) {
    return <svg viewBox="0 0 260 92" role="img" aria-label="Graph vertices connected by edges"><g className="dsa-ai-mini-edges"><path d="M54 26 128 46 207 25M54 26l26 49 48-29 54 31 25-52M80 75h102" /></g><g className="dsa-ai-mini-nodes">{[{ x: 54, y: 26 }, { x: 128, y: 46 }, { x: 207, y: 25 }, { x: 80, y: 75 }, { x: 182, y: 76 }].map((node, index) => <circle key={index} cx={node.x} cy={node.y} r="9" />)}</g></svg>;
  }
  return <svg viewBox="0 0 260 92" role="img" aria-label="Tree or heap with parent and child nodes"><g className="dsa-ai-mini-edges"><path d="M130 27 79 65m51-38 51 38" /></g><g className="dsa-ai-mini-nodes">{[{ x: 130, y: 24 }, { x: 79, y: 68 }, { x: 181, y: 68 }].map((node, index) => <g key={index}><circle cx={node.x} cy={node.y} r="15" /><text x={node.x} y={node.y + 4}>{index === 0 && name.startsWith("Heap") ? "min" : index === 0 ? "root" : index}</text></g>)}</g></svg>;
}

function ConceptDiagram({ name }: { name: string }) {
  if (name === "Two pointers" || name === "Sliding window" || name === "Prefix sums" || name === "Binary search") {
    const binary = name === "Binary search";
    const prefix = name === "Prefix sums";
    const window = name === "Sliding window";
    return <svg viewBox="0 0 360 142" role="img" aria-label={`${name} array diagram`}>
      <g className="dsa-ai-concept-cells">{["2", "4", "6", "8", "10", "12"].map((item, index) => <g key={index}><rect className={binary ? (index === 2 || index === 3 ? "focus" : "faded") : window ? (index >= 2 && index <= 4 ? "focus" : "") : prefix && index < 3 ? "focus" : ""} x={18 + index * 54} y="48" width="46" height="39" rx="7" /><text x={41 + index * 54} y="72">{item}</text></g>)}</g>
      {binary ? <g className="dsa-ai-concept-markers"><text x="41" y="31">L</text><text x="203" y="31">M</text><text x="311" y="31">R</text><path d="M41 36h162M203 36h108" /></g>
        : prefix ? <g className="dsa-ai-concept-markers"><text x="41" y="113">2</text><text x="95" y="113">6</text><text x="149" y="113">12</text><text x="203" y="113">20</text><text x="257" y="113">30</text><text x="311" y="113">42</text></g>
          : <g className="dsa-ai-concept-markers"><path d={window ? "M128 37v-9h108v9" : "M40 37v-9m0 0h270m0 0v9"} /><text x={window ? "182" : "40"} y="22">{window ? "ACTIVE WINDOW" : "LEFT"}</text><text x="311" y="22">{window ? "" : "RIGHT"}</text></g>}
    </svg>;
  }
  if (name === "Dynamic programming") {
    return <svg viewBox="0 0 360 142" role="img" aria-label="Dynamic programming table with dependencies"><g className="dsa-ai-dp-grid">{Array.from({ length: 9 }, (_, index) => <g key={index}><rect className={index === 8 ? "focus" : ""} x={106 + (index % 3) * 52} y={20 + Math.floor(index / 3) * 37} width="44" height="30" rx="5" /><text x={128 + (index % 3) * 52} y={40 + Math.floor(index / 3) * 37}>{index === 8 ? "?" : index + 1}</text></g>)}</g><path className="dsa-ai-concept-arrow" d="M130 57v15m0 0 15-10m-15 10-15-10m67-27h15m0 0-10-7m10 7-10 7" /></svg>;
  }
  if (name === "Intervals" || name === "Greedy") {
    return <svg viewBox="0 0 360 142" role="img" aria-label={`${name} selection diagram`}><g className="dsa-ai-interval-bars">{[{ x: 34, y: 28, w: 118 }, { x: 94, y: 56, w: 124 }, { x: 204, y: 84, w: 112 }].map((bar, index) => <g key={index}><rect className={index === 2 ? "focus" : ""} x={bar.x} y={bar.y} width={bar.w} height="18" rx="8" /><text x={bar.x + bar.w + 8} y={bar.y + 13}>{index + 1}</text></g>)}</g><path className="dsa-ai-concept-arrow" d="M34 118h282m-7-6 7 6-7 6" /><text className="dsa-ai-concept-caption" x="35" y="135">SORT → COMPARE BOUNDARIES → CHOOSE</text></svg>;
  }
  if (name === "Bit manipulation") {
    return <svg viewBox="0 0 360 142" role="img" aria-label="Bit mask showing selected positions"><g className="dsa-ai-concept-cells">{["1", "0", "1", "1", "0", "1", "0", "0"].map((bit, index) => <g key={index}><rect className={bit === "1" ? "focus" : ""} x={34 + index * 38} y="47" width="31" height="40" rx="6" /><text x={49 + index * 38} y="72">{bit}</text></g>)}</g><text className="dsa-ai-concept-caption" x="75" y="116">MASK · TEST · SET · CLEAR</text></svg>;
  }
  if (name === "Topological sort" || name === "BFS" || name === "DFS" || name === "Dijkstra") {
    const values = name === "Topological sort" ? [{ x: 45, y: 68 }, { x: 125, y: 35 }, { x: 125, y: 100 }, { x: 220, y: 35 }, { x: 220, y: 100 }, { x: 315, y: 68 }] : [{ x: 55, y: 70 }, { x: 135, y: 35 }, { x: 135, y: 105 }, { x: 225, y: 35 }, { x: 225, y: 105 }, { x: 310, y: 70 }];
    return <svg viewBox="0 0 360 142" role="img" aria-label={`${name} graph traversal diagram`}><g className="dsa-ai-mini-edges"><path d="M55 70 135 35M55 70 135 105M135 35 225 35M135 105 225 105M225 35 310 70M225 105 310 70" /></g><g className="dsa-ai-mini-nodes">{values.map((node, index) => <g className={index < (name === "DFS" ? 4 : 3) ? "visited" : ""} key={index}><circle cx={node.x} cy={node.y} r="15" /><text x={node.x} y={node.y + 4}>{String.fromCharCode(65 + index)}</text></g>)}</g><text className="dsa-ai-concept-caption" x="114" y="137">{name === "BFS" ? "QUEUE · LEVEL BY LEVEL" : name === "DFS" ? "FOLLOW A BRANCH · BACKTRACK" : name === "Dijkstra" ? "RELAX EDGES · MIN-PRIORITY QUEUE" : "DEPENDENCIES BEFORE TASK"}</text></svg>;
  }
  return <svg viewBox="0 0 360 142" role="img" aria-label={`${name} decision tree diagram`}><g className="dsa-ai-mini-edges"><path d="M180 31 100 78m80-47 80 47M100 78 58 116m42-38 82 38" /></g><g className="dsa-ai-mini-nodes">{[{ x: 180, y: 28, t: "choice" }, { x: 100, y: 78, t: "try" }, { x: 260, y: 78, t: "undo" }, { x: 58, y: 118, t: "next" }, { x: 182, y: 118, t: "goal" }].map((node) => <g key={node.t}><circle cx={node.x} cy={node.y} r="17" /><text x={node.x} y={node.y + 3}>{node.t}</text></g>)}</g></svg>;
}

function DsaConceptExplorer() {
  const [selectedName, setSelectedName] = useState(dsaConceptGuide[0].name);
  const concept = dsaConceptGuide.find((item) => item.name === selectedName) ?? dsaConceptGuide[0];
  return (
    <section className="dsa-ai-concept-explorer" aria-labelledby="dsa-ai-concepts-title">
      <header>
        <span className="dsa-ai-kicker">INTERACTIVE ALGORITHM MAP</span>
        <h3 id="dsa-ai-concepts-title">Explore DSA patterns visually</h3>
        <p>Choose a pattern to see its core idea, the signals that suggest it, and the check that keeps your solution correct.</p>
      </header>
      <div className="dsa-ai-concept-picker" role="group" aria-label="Choose an algorithm pattern">
        {dsaConceptGuide.map((item) => <button type="button" aria-pressed={selectedName === item.name} className={selectedName === item.name ? "active" : ""} key={item.name} onClick={() => setSelectedName(item.name)}>{item.name}</button>)}
      </div>
      <div className="dsa-ai-concept-panel">
        <div className="dsa-ai-concept-copy">
          <span className="dsa-ai-concept-index">{String(dsaConceptGuide.indexOf(concept) + 1).padStart(2, "0")} / {String(dsaConceptGuide.length).padStart(2, "0")}</span>
          <h4>{concept.name}</h4>
          <p>{concept.how}</p>
          <dl><div><dt>Reach for it when</dt><dd>{concept.use}</dd></div><div><dt>Important check</dt><dd>{concept.watch}</dd></div></dl>
        </div>
        <div className="dsa-ai-concept-visual"><ConceptDiagram name={concept.name} /></div>
      </div>
    </section>
  );
}

const roadmapProgressKey = "codexsheet.dsa-ai-roadmap-progress.v1";

function readRoadmapProgress(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(roadmapProgressKey) ?? "[]");
    if (!Array.isArray(saved)) {
      console.warn("Saved DSA roadmap progress is invalid.");
      return [];
    }
    const validWeeks = saved.filter((week): week is string => typeof week === "string" && phases.some((phase) => phase.weeks === week));
    return [...new Set(validWeeks)];
  } catch (error) {
    console.warn("Could not read saved DSA roadmap progress.", error);
    return [];
  }
}

function DsaPhaseMission({ phase, completed, onComplete }: { phase: Phase; completed: boolean; onComplete: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === phase.mission.answer;

  function checkAnswer() {
    if (selected === null || completed) return;
    setChecked(true);
    if (correct) onComplete();
  }

  return (
    <section className={`dsa-ai-mission${completed ? " completed" : ""}`} aria-labelledby={`mission-${phase.weeks}`}>
      <header className="dsa-ai-mission-heading">
        <div><span className="dsa-ai-kicker">{completed ? "MISSION COMPLETE" : "YOUR TURN · DO THIS NOW"}</span><h4 id={`mission-${phase.weeks}`}>{phase.mission.title}</h4></div>
        <span className="dsa-ai-mission-badge">{completed ? <Check size={14} /> : <Target size={14} />}{completed ? "DONE" : "MISSION"}</span>
      </header>
      <p className="dsa-ai-mission-task">{phase.mission.task}</p>
      <fieldset className="dsa-ai-mission-quiz">
        <legend>{phase.mission.question}</legend>
        <div>
          {phase.mission.choices.map((choice, index) => {
            const choiceClass = [
              selected === index ? "selected" : "",
              checked && index === phase.mission.answer ? "correct" : "",
              checked && selected === index && !correct ? "incorrect" : "",
            ].filter(Boolean).join(" ");
            return (
              <button
                type="button"
                className={choiceClass}
                aria-pressed={selected === index}
                disabled={completed}
                key={choice}
                onClick={() => { setSelected(index); setChecked(false); }}
              >
                <span>{String.fromCharCode(65 + index)}</span>{choice}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="dsa-ai-mission-result">
        <button type="button" className="dsa-ai-mission-check" disabled={selected === null || completed} onClick={checkAnswer}>
          {completed ? "Completed" : "Check my answer"} <ArrowRight size={14} />
        </button>
        {checked && <p className={correct ? "success" : "try-again"} role="status">{correct ? "That’s right. " : "Not quite. "} {phase.mission.explanation}</p>}
      </div>
    </section>
  );
}

export default function DsaAiRoadmap({ onOpenDsaPractice }: { onOpenDsaPractice: () => void }) {
  const [completedMissions, setCompletedMissions] = useState<string[]>(readRoadmapProgress);
  const [storageWarning, setStorageWarning] = useState(false);
  const completedCount = completedMissions.length;
  const completionPercent = Math.round((completedCount / phases.length) * 100);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(roadmapProgressKey, JSON.stringify(completedMissions));
      setStorageWarning(false);
    } catch (error) {
      console.error("Could not save DSA roadmap progress.", error);
      setStorageWarning(true);
    }
  }, [completedMissions]);

  function completeMission(week: string) {
    setCompletedMissions((current) => current.includes(week) ? current : [...current, week]);
  }

  return (
    <section className="dsa-ai-roadmap" aria-labelledby="dsa-ai-roadmap-title">
      <header className="dsa-ai-hero">
        <div className="dsa-ai-hero-copy">
          <span className="dsa-ai-kicker"><Lightbulb size={14} /> DSA-FIRST · AI-ASSISTED LEARNING</span>
          <h2 id="dsa-ai-roadmap-title">Master DSA.<br /><em>Learn with AI.</em></h2>
          <p>A focused 26-week DSA roadmap. Use AI as a tutor, debugging partner, and project tool—while you build the reasoning yourself.</p>
          <button type="button" className="dsa-ai-practice-link" onClick={onOpenDsaPractice}>
            Start with CodexSheet DSA practice <ArrowRight size={15} />
          </button>
        </div>
        <div className="dsa-ai-hero-art" aria-hidden="true">
          <div className="dsa-ai-orbit dsa-ai-orbit-one" />
          <div className="dsa-ai-orbit dsa-ai-orbit-two" />
          <div className="dsa-ai-hero-icons"><Code2 size={26} /><BrainCircuit size={31} /></div>
          <span>26 WEEKS · ONE CORE TRACK · AI AS YOUR STUDY PARTNER</span>
        </div>
      </header>

      <figure className="dsa-ai-timeline">
        <figcaption>
          <div><span className="dsa-ai-kicker">26-WEEK DSA PROGRESSION</span><h3>One focused path, AI-assisted practice</h3></div>
          <span className="dsa-ai-timeline-total">26 weeks</span>
        </figcaption>
        <div className="dsa-ai-timeline-row dsa-ai-timeline-dsa">
          <strong>DSA</strong>
          <div className="dsa-ai-timeline-lane">
            {phases.map((phase, index) => (
              <div
                className="dsa-ai-timeline-segment"
                key={phase.weeks}
                style={{ flex: `${phase.duration} 1 0%` }}
                title={`${phase.title}: ${phase.weeks.toLowerCase()}`}
              >
                <span>PHASE 0{index + 1}</span><b>{phase.duration} wk</b>
              </div>
            ))}
          </div>
        </div>
        <div className="dsa-ai-timeline-scale" aria-hidden="true"><span>WEEK 1</span><span>WEEK 26</span></div>
      </figure>

      <section className="dsa-ai-progress" aria-label="Your roadmap progress">
        <div className="dsa-ai-progress-copy">
          <span className="dsa-ai-kicker">LEARN BY DOING</span>
          <strong>{completedCount}<small> / {phases.length} missions complete</small></strong>
          <p>{completionPercent === 100 ? "All missions complete. Keep solving and teaching what you know." : "Complete a short challenge in each phase to build your progress."}</p>
        </div>
        <div className="dsa-ai-progress-meter" role="progressbar" aria-label="Roadmap missions completed" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${completionPercent}%` }} />
        </div>
        <button type="button" className="dsa-ai-progress-reset" disabled={!completedCount} onClick={() => setCompletedMissions([])}>Reset progress</button>
        {storageWarning && <p className="dsa-ai-storage-warning" role="status">Progress is tracked for this visit but could not be saved in this browser.</p>}
      </section>

      <section className="dsa-ai-milestones" aria-labelledby="dsa-ai-milestones-title">
        <header><span className="dsa-ai-kicker">THE PLAN AT A GLANCE</span><h3 id="dsa-ai-milestones-title">Milestone map</h3></header>
        <div className="dsa-ai-milestone-grid">
          {phases.map((phase, index) => (
            <article className="dsa-ai-milestone-card" key={phase.weeks}>
              <span className="dsa-ai-milestone-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="dsa-ai-milestone-weeks">{phase.weeks}</span>
              <h4>{phase.title}</h4>
              <p>{phase.dsaGoal.replace("Target: ", "")}</p>
              <div className="dsa-ai-milestone-build"><BrainCircuit size={13} /><span>{phase.project}</span></div>
            </article>
          ))}
        </div>
      </section>

      <DataStructureExplorer />

      <section className="dsa-ai-reference" aria-labelledby="dsa-ai-structures-title">
        <header>
          <span className="dsa-ai-kicker">A PRACTICAL CHOICE GUIDE</span>
          <h3 id="dsa-ai-structures-title">Which data structure should I use?</h3>
          <p>Start from the operations your solution needs. These are common signals, not rigid rules—constraints and trade-offs decide the final choice.</p>
        </header>
        <div className="dsa-ai-structure-guide">
          {dataStructureGuide.map((item) => (
            <article className="dsa-ai-structure-card" key={item.name}>
              <div className="dsa-ai-structure-sketch"><StructureDiagram name={item.name} /></div>
              <div className="dsa-ai-structure-card-copy">
                <h4>{item.name}</h4>
                <p>{item.use}</p>
                <details>
                  <summary>Mechanics, cost & watch-outs <ArrowRight size={13} /></summary>
                  <p>{item.how}</p>
                  <p><strong>Watch for:</strong> {item.watch}</p>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>

      <DsaConceptExplorer />

      <div className="dsa-ai-phase-list">
        {phases.map((phase, index) => (
          <article className="dsa-ai-phase" key={phase.weeks}>
            <header className="dsa-ai-phase-head">
              <span className="dsa-ai-phase-number">{String(index + 1).padStart(2, "0")}</span>
              <div><span className="dsa-ai-kicker">{phase.weeks}</span><h3>{phase.title}</h3></div>
              <p>{phase.summary}</p>
            </header>
            <div className="dsa-ai-tracks">
              <section className="dsa-ai-track dsa-ai-track-dsa">
                <h4><Code2 size={16} /> DSA</h4>
                <ul>{phase.dsa.map((item) => <li key={item}>{item}</li>)}</ul>
                <details className="dsa-ai-article-toggle">
                  <summary><BookOpen size={14} /> Read the detailed DSA article <span>{phase.dsaArticle.length} sections</span></summary>
                  <article className="dsa-ai-deep-article">
                    {phase.dsaArticle.map((section) => <section key={section.title}><h5>{section.title}</h5><p>{section.body}</p></section>)}
                  </article>
                </details>
                <details className="dsa-ai-questions">
                  <summary><Target size={14} /> Check your understanding <span>{phase.dsaQuestions.length} questions</span></summary>
                  <ol>{phase.dsaQuestions.map((question) => <li key={question}>{question}</li>)}</ol>
                </details>
                <nav className="dsa-ai-resources" aria-label={`${phase.title} DSA resources`}>
                  <span>Further reading</span>
                  <ul>{phase.dsaResources.map((resource) => (
                    <li key={resource.url}><a href={resource.url} target="_blank" rel="noreferrer">{resource.label}<ExternalLink size={12} /></a></li>
                  ))}</ul>
                </nav>
                <p className="dsa-ai-goal"><Target size={14} /> {phase.dsaGoal}</p>
                <aside className="dsa-ai-study-partner">
                  <h5><BrainCircuit size={14} /> Use AI as your DSA study partner</h5>
                  <p>{phase.aiPractice}</p>
                  {phase.project && <p className="dsa-ai-project"><span>BUILD</span>{phase.project}</p>}
                </aside>
              </section>
            </div>
            <div className="dsa-ai-diagram-grid" aria-label={`${phase.title} diagrams`}>
              <RoadmapFlowDiagram {...phase.dsaDiagram} />
            </div>
            <DsaPhaseMission
              phase={phase}
              completed={completedMissions.includes(phase.weeks)}
              onComplete={() => completeMission(phase.weeks)}
            />
          </article>
        ))}
      </div>

      <section className="dsa-ai-approach" aria-labelledby="dsa-ai-approach-title">
        <header>
          <span className="dsa-ai-kicker">A METHOD YOU CAN REUSE</span>
          <h3 id="dsa-ai-approach-title">How to approach the work</h3>
          <p>Use a repeatable DSA-solving process, then let AI support your learning without replacing the reasoning.</p>
        </header>
        <div className="dsa-ai-approach-grid">
          <article className="dsa-ai-approach-card dsa-ai-approach-dsa">
            <h4><Code2 size={17} /> When you face a DSA problem</h4>
            <ol>{dsaApproach.map(([title, detail]) => <li key={title}><strong>{title}</strong><span>{detail}</span></li>)}</ol>
          </article>
          <article className="dsa-ai-approach-card dsa-ai-approach-ai">
            <h4><BrainCircuit size={17} /> How to use AI without outsourcing your thinking</h4>
            <ol>{aiApproach.map(([title, detail]) => <li key={title}><strong>{title}</strong><span>{detail}</span></li>)}</ol>
          </article>
        </div>
      </section>

      <section className="dsa-ai-connections">
        <header><span className="dsa-ai-kicker">APPLY DSA TO BUILD BETTER LEARNING TOOLS</span><h3>Where DSA powers AI-assisted study</h3></header>
        <ul>{connections.map(([concept, application]) => (
          <li key={concept}><strong>{concept}</strong><ArrowRight size={14} /><span>{application}</span></li>
        ))}</ul>
      </section>

      <div className="dsa-ai-support-grid">
        <section className="dsa-ai-support-card">
          <span className="dsa-ai-kicker">A RHYTHM YOU CAN KEEP</span>
          <h3>Your weekly rhythm</h3>
          <div className="dsa-ai-weekly-cards">
            {weeklyRhythm.map((row, index) => (
              <article className="dsa-ai-weekly-card" key={row.day}>
                <span className="dsa-ai-weekly-day">{row.day}</span>
                <div className="dsa-ai-weekly-lanes">
                  <p><Code2 size={13} /><span><b>DSA</b>{row.dsa}</span></p>
                  <p><BrainCircuit size={13} /><span><b>AI support</b>{row.ai}</span></p>
                </div>
                <div className="dsa-ai-weekly-focus"><span>{String(index + 1).padStart(2, "0")}</span>{row.focus}</div>
              </article>
            ))}
          </div>
        </section>
        <section className="dsa-ai-support-card">
          <span className="dsa-ai-kicker">SMALL HABITS, COMPOUNDING SKILL</span>
          <h3>Habits that matter</h3>
          <ul className="dsa-ai-habits">{habits.map((habit) => (
            <li key={habit}><Check size={14} /><span>{habit}</span></li>
          ))}</ul>
        </section>
      </div>
    </section>
  );
}
