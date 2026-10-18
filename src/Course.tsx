import { useEffect, useState, useMemo } from "react";
import {
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Video,
  CodeXml,
  Sparkles,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Layers,
  GitCommit,
  Hash,
  Database,
} from "lucide-react";

type Lesson = {
  title: string;
  duration: string;
  topics: string;
  task: string;
  relatedProblemNumber: number;
  relatedProblemTitle: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
};

type Module = {
  title: string;
  level: string;
  lessons: Lesson[];
};

const modules: Module[] = [
  {
    title: "Python foundations & complexity",
    level: "WEEK 01",
    lessons: [
      {
        title: "Python essentials for problem solving",
        duration: "35 min",
        topics: "Lists, dictionaries, sets, tuples, list comprehensions, built-ins",
        task: "Implement element frequency counting with a dictionary in O(n) time.",
        relatedProblemNumber: 1,
        relatedProblemTitle: "Two Sum",
        quiz: {
          question: "What is the average time complexity of checking membership `x in my_set` in Python?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
          correctIndex: 0,
          explanation: "Python sets use hash tables under the hood, making average membership lookup O(1).",
        },
      },
      {
        title: "Big O time and space complexity",
        duration: "32 min",
        topics: "Growth rates, asymptotic bounds, analyzing nested loops, auxiliary memory",
        task: "Compare a nested-loop pair search O(n^2) with a hash map solution O(n).",
        relatedProblemNumber: 2,
        relatedProblemTitle: "Valid Anagram",
        quiz: {
          question: "If an algorithm halves the search space at each step, what is its time complexity?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
          correctIndex: 1,
          explanation: "Repeatedly halving the problem space (like binary search) gives logarithmic O(log n) time.",
        },
      },
    ],
  },
  {
    title: "Arrays, strings & hash maps",
    level: "WEEK 02",
    lessons: [
      {
        title: "Arrays, strings and two pointers",
        duration: "48 min",
        topics: "In-place reversal, two pointers inward, fast & slow pointers, sliding window",
        task: "Solve Valid Palindrome using two pointers moving toward the center.",
        relatedProblemNumber: 6,
        relatedProblemTitle: "Valid Palindrome",
        quiz: {
          question: "When is the two-pointer technique especially useful on an array?",
          options: ["When the array is unsorted and random", "When the array is sorted or we need to partition from both ends", "Only on linked lists", "Never in linear time"],
          correctIndex: 1,
          explanation: "Two pointers allow linear O(n) scans by moving left/right pointers based on comparison against a target.",
        },
      },
      {
        title: "Hash maps and sets",
        duration: "42 min",
        topics: "Lookup, counting, hash collisions, grouping patterns",
        task: "Solve Group Anagrams using sorted tuples or character frequency keys.",
        relatedProblemNumber: 3,
        relatedProblemTitle: "Group Anagrams",
        quiz: {
          question: "Why can't a Python `list` be used as a dictionary key?",
          options: ["Lists are too slow", "Lists are mutable and unhashable", "Lists only hold numbers", "Python restricts key sizes"],
          correctIndex: 1,
          explanation: "Dict keys must be hashable and immutable. Convert lists to tuples if you need them as keys.",
        },
      },
    ],
  },
  {
    title: "Stacks, queues & linked lists",
    level: "WEEK 03",
    lessons: [
      {
        title: "Stacks, queues and monotonic patterns",
        duration: "44 min",
        topics: "LIFO, FIFO, collections.deque, monotonic stack for next greater element",
        task: "Solve Valid Parentheses using a stack to match brackets.",
        relatedProblemNumber: 14,
        relatedProblemTitle: "Valid Parentheses",
        quiz: {
          question: "Why should `collections.deque` be preferred over `list` for FIFO queue operations in Python?",
          options: ["deque popleft() is O(1), whereas list.pop(0) is O(n)", "list cannot store strings", "deque uses less memory", "list does not support append"],
          correctIndex: 0,
          explanation: "Removing from the start of a Python list requires shifting all subsequent elements O(n), while deque does it in O(1).",
        },
      },
      {
        title: "Linked lists and pointer techniques",
        duration: "50 min",
        topics: "Node references, head pointers, reversing pointers, cycle detection",
        task: "Reverse a singly linked list in-place using prev, curr, and nxt pointers.",
        relatedProblemNumber: 21,
        relatedProblemTitle: "Reverse Linked List",
        quiz: {
          question: "In reversing a linked list in-place, how much extra space is needed?",
          options: ["O(n) auxiliary space", "O(log n) call stack", "O(1) constant pointer variables", "O(n^2) space"],
          correctIndex: 2,
          explanation: "In-place iterative reversal only requires three pointer variables: prev, curr, and next.",
        },
      },
    ],
  },
  {
    title: "Binary search & trees",
    level: "WEEK 04",
    lessons: [
      {
        title: "Binary search and search space patterns",
        duration: "46 min",
        topics: "Lower and upper bounds, avoiding integer overflow, searching rotated arrays",
        task: "Implement classic binary search on a sorted integer array in O(log n).",
        relatedProblemNumber: 18,
        relatedProblemTitle: "Binary Search",
        quiz: {
          question: "What is the midpoint formula that guards against 32-bit integer overflow?",
          options: ["mid = (low + high) / 2", "mid = low + (high - low) // 2", "mid = high - low", "mid = (low * high) // 2"],
          correctIndex: 1,
          explanation: "`low + (high - low) // 2` computes the exact midpoint without adding two large numbers that could overflow.",
        },
      },
      {
        title: "Binary trees and recursive traversal",
        duration: "55 min",
        topics: "DFS (preorder, inorder, postorder), BFS level order, BST invariants",
        task: "Invert a binary tree recursively by swapping left and right subtrees.",
        relatedProblemNumber: 26,
        relatedProblemTitle: "Invert Binary Tree",
        quiz: {
          question: "Which tree traversal of a Binary Search Tree (BST) visits keys in sorted ascending order?",
          options: ["Pre-order", "In-order", "Post-order", "Level-order"],
          correctIndex: 1,
          explanation: "In-order traversal visits left subtree (smaller), current node, then right subtree (greater), producing sorted order.",
        },
      },
    ],
  },
  {
    title: "Graphs & backtracking",
    level: "WEEK 05",
    lessons: [
      {
        title: "Graph traversal and shortest paths",
        duration: "58 min",
        topics: "Adjacency lists, BFS, DFS, visited sets, connected components, grid graphs",
        task: "Solve Number of Islands by sinking visited land cells with BFS or DFS.",
        relatedProblemNumber: 36,
        relatedProblemTitle: "Number of Islands",
        quiz: {
          question: "In an unweighted graph, which algorithm finds the shortest path in terms of edge count?",
          options: ["Depth-First Search (DFS)", "Breadth-First Search (BFS)", "Binary Search", "Quicksort"],
          correctIndex: 1,
          explanation: "BFS explores nodes level by level, ensuring that the first time a destination is reached is the shortest path.",
        },
      },
      {
        title: "Backtracking and decision trees",
        duration: "45 min",
        topics: "Choose, explore, undo (backtrack); pruning invalid branches",
        task: "Generate all distinct subsets of an array using backtracking.",
        relatedProblemNumber: 31,
        relatedProblemTitle: "Subsets",
        quiz: {
          question: "Why do we `pop()` the element at the end of a backtracking step?",
          options: ["To delete it forever", "To undo the choice and restore state for the next branch", "To free Python memory", "Because lists have maximum length"],
          correctIndex: 1,
          explanation: "The hallmark of backtracking is: Choose $\\to$ Recurse $\\to$ Undo (pop), so other branches start with clean state.",
        },
      },
    ],
  },
  {
    title: "Dynamic programming & review",
    level: "WEEK 06",
    lessons: [
      {
        title: "Dynamic programming fundamentals",
        duration: "62 min",
        topics: "Overlapping subproblems, optimal substructure, memoization vs bottom-up tabulation",
        task: "Solve Climbing Stairs and Maximum Subarray with linear time DP.",
        relatedProblemNumber: 70,
        relatedProblemTitle: "Climbing Stairs",
        quiz: {
          question: "What is the relationship between Fibonacci and the Climbing Stairs problem?",
          options: ["They have identical state recurrence: dp[i] = dp[i-1] + dp[i-2]", "They are unrelated", "Climbing stairs is exponential whereas Fibonacci is constant", "Fibonacci requires graphs"],
          correctIndex: 0,
          explanation: "To reach step i, you could have come from step i-1 (1 step) or step i-2 (2 steps), yielding the exact Fibonacci recurrence.",
        },
      },
      {
        title: "Mock interview and complexity review",
        duration: "60 min",
        topics: "UMPIRE method (Understand, Match, Plan, Implement, Review, Evaluate)",
        task: "Complete Kadane's algorithm for maximum subarray and analyze O(n) time & O(1) space.",
        relatedProblemNumber: 142,
        relatedProblemTitle: "Maximum Subarray",
        quiz: {
          question: "What is the core decision in Kadane's algorithm at each element `x`?",
          options: ["current_sum = max(x, current_sum + x)", "current_sum = current_sum * x", "current_sum = 0", "current_sum = x - current_sum"],
          correctIndex: 0,
          explanation: "At each step, we either start a fresh subarray at `x` or extend the existing sum `current_sum + x`.",
        },
      },
    ],
  },
];

const storageKey = "codexsheet-python-dsa-course-v2";
const videoId = "pkYVOmU3MgA";

type ConceptKey =
  | "array"
  | "stack"
  | "queue"
  | "linked"
  | "hash"
  | "tree"
  | "heap"
  | "graph"
  | "recursion"
  | "dp"
  | "backtracking";

type Concept = {
  key: ConceptKey;
  title: string;
  tag: string;
  summary: string;
  use: string;
  complexity: string;
  code: string;
};

const concepts: Concept[] = [
  {
    key: "array",
    title: "Arrays & Lists",
    tag: "INDEXED SEQUENCE",
    summary: "Contiguous block of elements indexed by numbered positions (0-based). Python lists are dynamic arrays.",
    use: "Best for random access by index, two pointers, sliding windows, and binary search.",
    complexity: "Index Read: O(1) · Append: O(1) amortized · Insert/Delete: O(n)",
    code: `nums = [5, 8, 2, 9, 4]
first = nums[0]         # O(1) lookup
nums.append(7)          # O(1) amortized append
nums.insert(2, 99)      # O(n) shift`,
  },
  {
    key: "stack",
    title: "Stacks",
    tag: "LIFO · LAST IN, FIRST OUT",
    summary: "A stack only exposes its top element. The last element pushed is the first element popped.",
    use: "Matching parentheses, undo history, monotonic stack for next greater element, call stack execution.",
    complexity: "Push: O(1) · Pop: O(1) · Peek: O(1)",
    code: `stack = []
stack.append(42)        # push
top_val = stack[-1]     # peek
popped = stack.pop()    # pop`,
  },
  {
    key: "queue",
    title: "Queues & Deques",
    tag: "FIFO · FIRST IN, FIRST OUT",
    summary: "A queue serves items in arrival order: add at the back (enqueue), remove from the front (dequeue).",
    use: "Breadth-First Search (BFS), task scheduling, sliding window maximum.",
    complexity: "Enqueue: O(1) · Dequeue: O(1) using collections.deque",
    code: `from collections import deque
queue = deque([1, 2, 3])
queue.append(4)         # enqueue at back
first = queue.popleft() # dequeue from front: O(1)`,
  },
  {
    key: "linked",
    title: "Linked Lists",
    tag: "NODES & POINTERS",
    summary: "Chains of node objects where each node contains a value and a reference to the next node.",
    use: "In-place pointer manipulation, constant-time insertions after a known node, LRU cache implementation.",
    complexity: "Search: O(n) · Insert after node: O(1) · Prepend: O(1)",
    code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Invert pointers:
prev, curr = None, head
while curr:
    nxt = curr.next
    curr.next = prev
    prev = curr
    curr = nxt`,
  },
  {
    key: "hash",
    title: "Hash Maps & Sets",
    tag: "O(1) LOOKUP · KEY → VALUE",
    summary: "Maps keys to values using a hash function. Provides expected constant-time membership and retrieval.",
    use: "Frequency counting, Two Sum complement search, deduplication, grouping anagrams.",
    complexity: "Average Lookup / Insert / Delete: O(1)",
    code: `counts = {}
for num in nums:
    counts[num] = counts.get(num, 0) + 1

seen = set(nums)
if target - num in seen:
    return True`,
  },
  {
    key: "tree",
    title: "Binary Trees",
    tag: "HIERARCHICAL · DFS & BFS",
    summary: "Non-linear structure where each parent node connects to at most two children (left and right).",
    use: "Hierarchical data, Binary Search Trees (BST), divide and conquer, tree recursion.",
    complexity: "Traversal: O(n) · Balanced BST Search: O(log n)",
    code: `def inorder(node):
    if not node:
        return []
    return inorder(node.left) + [node.val] + inorder(node.right)`,
  },
  {
    key: "heap",
    title: "Heaps & Priority Queues",
    tag: "EXTREME VALUE · MIN/MAX",
    summary: "A complete binary tree that maintains the heap property: root is always the smallest (or largest) element.",
    use: "Top K frequent items, Dijkstra's algorithm, median of streaming data.",
    complexity: "Peek: O(1) · Push/Pop: O(log n) · Heapify: O(n)",
    code: `import heapq
heap = [7, 2, 5, 1]
heapq.heapify(heap)     # in-place min heap: O(n)
smallest = heapq.heappop(heap) # returns 1
heapq.heappush(heap, 3)`,
  },
  {
    key: "graph",
    title: "Graphs",
    tag: "VERTICES & EDGES",
    summary: "A network of vertices connected by edges (directed, undirected, weighted, or cyclic).",
    use: "Network routing, topological sort, island traversal in matrices, cycle detection.",
    complexity: "BFS / DFS: O(V + E) using adjacency lists",
    code: `from collections import deque
def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`,
  },
  {
    key: "recursion",
    title: "Recursion & Call Stack",
    tag: "BASE CASE & CALL",
    summary: "A function that solves a problem by calling itself on a strictly smaller subproblem until reaching a base case.",
    use: "Tree traversal, divide and conquer (merge sort), nested structures.",
    complexity: "Time: Depends on recurrence · Space: O(call stack depth)",
    code: `def factorial(n):
    if n <= 1:           # Base case
        return 1
    return n * factorial(n - 1) # Recursive step`,
  },
  {
    key: "dp",
    title: "Dynamic Programming",
    tag: "MEMOIZATION & TABULATION",
    summary: "Stores solutions to overlapping subproblems so each distinct state is computed only once.",
    use: "Shortest paths, knapsack problems, sequence alignment, optimization problems.",
    complexity: "Typically O(states × transitions per state)",
    code: `def climb_stairs(n):
    if n <= 2: return n
    dp = [0] * (n + 1)
    dp[1], dp[2] = 1, 2
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]`,
  },
  {
    key: "backtracking",
    title: "Backtracking",
    tag: "CHOOSE · EXPLORE · UNDO",
    summary: "Explores a decision tree step-by-step and undoes choices whenever a branch cannot yield a valid solution.",
    use: "Permutations, combinations, N-Queens, Sudoku solver.",
    complexity: "Often combinatorial / exponential (reduced by pruning)",
    code: `def subsets(nums):
    result = []
    def backtrack(start, path):
        result.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])   # Choose
            backtrack(i + 1, path) # Explore
            path.pop()             # Undo
    backtrack(0, [])
    return result`,
  },
];

export default function Course({
  onOpenProblem,
}: {
  onOpenProblem?: (problemNumber: number) => void;
}) {
  const allLessons = useMemo(
    () =>
      modules.flatMap((m, mi) =>
        m.lessons.map((l, li) => ({
          ...l,
          key: `${mi}-${li}`,
          module: m.title,
          week: m.level,
        })),
      ),
    [],
  );

  const [selectedKey, setSelectedKey] = useState("0-0");
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  // Active concept explorer state
  const [activeConceptKey, setActiveConceptKey] = useState<ConceptKey>("array");

  // Interactive sandbox states
  const [arrayItems, setArrayItems] = useState([5, 8, 2, 9, 4]);
  const [stackItems, setStackItems] = useState([10, 20, 30, 40]);
  const [queueItems, setQueueItems] = useState([1, 2, 3, 4, 5]);
  const [linkedItems, setLinkedItems] = useState([3, 7, 2, 9]);
  const [hashItems, setHashItems] = useState<Array<[string, number]>>([
    ["apple", 2],
    ["pear", 5],
    ["kiwi", 8],
    ["mango", 11],
  ]);
  const [treeInverted, setTreeInverted] = useState(false);
  const [heapItems, setHeapItems] = useState([1, 3, 4, 7, 8, 9]);
  const [graphVisited, setGraphVisited] = useState<number[]>([0]);
  const [dpSteps, setDpSteps] = useState([1, 2, 3, 5, 8]);
  const [nextNumber, setNextNumber] = useState(6);

  // Quiz state for current lesson
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(completed));
  }, [completed]);

  const currentLesson = useMemo(
    () => allLessons.find((l) => l.key === selectedKey) ?? allLessons[0],
    [allLessons, selectedKey],
  );

  // Reset quiz state when switching lessons
  useEffect(() => {
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
  }, [selectedKey]);

  const isDone = completed.includes(currentLesson.key);
  const progressPercent = Math.round((completed.length / allLessons.length) * 100);

  const toggleLessonComplete = () => {
    setCompleted((curr) =>
      curr.includes(currentLesson.key)
        ? curr.filter((k) => k !== currentLesson.key)
        : [...curr, currentLesson.key],
    );
  };

  const activeConcept = concepts.find((c) => c.key === activeConceptKey) ?? concepts[0];

  return (
    <main className="course-page">
      {/* ── Hero Banner ── */}
      <header className="course-hero">
        <div className="course-hero-copy">
          <div className="course-kicker">
            <Code2 size={15} />
            <span>PYTHON DSA MASTERCLASS · 6 WEEKS</span>
          </div>
          <h1>
            Data Structures & Algorithms <em>in Python</em>
          </h1>
          <p>
            From Python primitives to interview-ready algorithmic thinking. Master each pattern through
            interactive visualizations, deep dives, video lessons, and real coding exercises.
          </p>

          <div className="course-tags">
            <span>Beginner to Advanced</span>
            <span>12 Core Lessons</span>
            <span>
              <Clock3 size={13} /> ~9 Hours Video
            </span>
            <span>Python 3.11</span>
            <span>250 Practice Problems</span>
          </div>
        </div>

        <div className="course-progress-card">
          <span className="progress-kicker">YOUR COURSE COMPLETION</span>
          <strong className="progress-value">{progressPercent}%</strong>
          <div className="course-progress-track">
            <i style={{ width: `${progressPercent}%` }} />
          </div>
          <small>
            {completed.length} of {allLessons.length} lessons completed
          </small>
        </div>
      </header>

      {/* ── Main Layout: Video + Interactive Visuals + Curriculum ── */}
      <div className="course-layout">
        {/* Left Column: Video + Active Lesson + Concept Visualizer */}
        <section className="course-main">
          {/* Video Player */}
          <div className="course-video-shell">
            <iframe
              title="Data Structures and Algorithms in Python full course by freeCodeCamp"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <div className="course-video-caption">
              <span>
                <Video size={15} /> FREECODECAMP · COMPREHENSIVE PYTHON DSA COURSE
              </span>
              <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer">
                Open on YouTube <ChevronRight size={14} />
              </a>
            </div>
          </div>

          {/* Interactive Data Structure Visualizer Section */}
          <section className="ds-visuals" aria-labelledby="ds-visual-title">
            <header className="ds-visual-heading">
              <div>
                <span className="course-kicker">
                  <Layers size={13} /> INTERACTIVE DATA STRUCTURE LAB
                </span>
                <h2 id="ds-visual-title">
                  Touch and manipulate <em>every data structure.</em>
                </h2>
                <p>
                  Click controls to push, pop, enqueue, invert, and step through algorithms in real time.
                </p>
              </div>
            </header>

            {/* Concept Tabs */}
            <nav className="concept-tabs" aria-label="DSA concepts">
              {concepts.map((c) => (
                <button
                  type="button"
                  className={activeConceptKey === c.key ? "active" : ""}
                  onClick={() => setActiveConceptKey(c.key)}
                  key={c.key}
                >
                  {c.title}
                </button>
              ))}
            </nav>

            <div className="concept-explorer">
              {/* Left visual card with live controls */}
              <div className="concept-diagram-card">
                <div className="diagram-card-top">
                  <span className="ds-kind">{activeConcept.tag}</span>
                  <h3>{activeConcept.title}</h3>
                </div>

                {/* Render visual stage depending on active concept */}
                <div className="visual-stage">
                  {activeConceptKey === "array" && (
                    <div className="visual-array">
                      <div className="array-boxes">
                        {arrayItems.map((val, idx) => (
                          <div className="array-cell" key={idx}>
                            <strong>{val}</strong>
                            <small>idx {idx}</small>
                          </div>
                        ))}
                      </div>
                      <div className="ds-visual-controls">
                        <button
                          type="button"
                          onClick={() => {
                            if (arrayItems.length < 8) {
                              setArrayItems((curr) => [...curr, nextNumber]);
                              setNextNumber((n) => n + 1);
                            }
                          }}
                          disabled={arrayItems.length >= 8}
                        >
                          <Plus size={14} /> Append ({nextNumber})
                        </button>
                        <button
                          type="button"
                          onClick={() => setArrayItems((curr) => curr.slice(0, -1))}
                          disabled={arrayItems.length <= 1}
                        >
                          <Minus size={14} /> Pop Last
                        </button>
                        <button
                          type="button"
                          onClick={() => setArrayItems((curr) => [...curr].reverse())}
                        >
                          <RotateCcw size={14} /> Reverse
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConceptKey === "stack" && (
                    <div className="visual-stack">
                      <div className="stack-container">
                        {stackItems.slice().reverse().map((val, idx) => (
                          <div
                            className={`stack-node${idx === 0 ? " is-top" : ""}`}
                            key={stackItems.length - 1 - idx}
                          >
                            <span>{val}</span>
                            {idx === 0 && <small className="top-indicator">TOP</small>}
                          </div>
                        ))}
                        {stackItems.length === 0 && <span className="empty-label">Stack Empty</span>}
                        <div className="stack-base" />
                      </div>
                      <div className="ds-visual-controls">
                        <button
                          type="button"
                          onClick={() => {
                            if (stackItems.length < 6) {
                              setStackItems((s) => [...s, nextNumber * 10]);
                              setNextNumber((n) => n + 1);
                            }
                          }}
                          disabled={stackItems.length >= 6}
                        >
                          <Plus size={14} /> Push ({nextNumber * 10})
                        </button>
                        <button
                          type="button"
                          onClick={() => setStackItems((s) => s.slice(0, -1))}
                          disabled={stackItems.length === 0}
                        >
                          <Minus size={14} /> Pop Top
                        </button>
                        <button
                          type="button"
                          onClick={() => setStackItems([10, 20, 30])}
                        >
                          <RotateCcw size={14} /> Reset
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConceptKey === "queue" && (
                    <div className="visual-queue">
                      <div className="queue-track">
                        <span className="queue-end-label">FRONT · OUT</span>
                        <div className="queue-items">
                          {queueItems.map((val, i) => (
                            <div className="queue-node" key={i}>
                              <strong>{val}</strong>
                            </div>
                          ))}
                        </div>
                        <span className="queue-end-label">BACK · IN</span>
                      </div>
                      <div className="ds-visual-controls">
                        <button
                          type="button"
                          onClick={() => {
                            if (queueItems.length < 7) {
                              setQueueItems((q) => [...q, nextNumber]);
                              setNextNumber((n) => n + 1);
                            }
                          }}
                          disabled={queueItems.length >= 7}
                        >
                          <Plus size={14} /> Enqueue ({nextNumber})
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueueItems((q) => q.slice(1))}
                          disabled={queueItems.length <= 1}
                        >
                          <Minus size={14} /> Dequeue
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConceptKey === "linked" && (
                    <div className="visual-linked">
                      <div className="linked-chain">
                        {linkedItems.map((val, i) => (
                          <div className="linked-node-wrap" key={i}>
                            <div className="linked-node-box">
                              <span className="val">{val}</span>
                              <span className="ptr">next</span>
                            </div>
                            {i < linkedItems.length - 1 && <span className="linked-arrow">→</span>}
                            {i === linkedItems.length - 1 && <span className="null-box">NULL</span>}
                          </div>
                        ))}
                      </div>
                      <div className="ds-visual-controls">
                        <button
                          type="button"
                          onClick={() => setLinkedItems((l) => [nextNumber, ...l])}
                          disabled={linkedItems.length >= 6}
                        >
                          <Plus size={14} /> Prepend ({nextNumber})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLinkedItems((l) => [...l, nextNumber + 1])}
                          disabled={linkedItems.length >= 6}
                        >
                          <Plus size={14} /> Append ({nextNumber + 1})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLinkedItems((l) => [...l].reverse())}
                        >
                          <RotateCcw size={14} /> Reverse Pointers
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConceptKey === "hash" && (
                    <div className="visual-hash">
                      <div className="hash-table-grid">
                        {hashItems.map(([k, v], idx) => (
                          <div className="hash-bucket" key={k}>
                            <span className="bucket-index">bucket #{idx}</span>
                            <div className="bucket-entry">
                              <strong className="entry-key">"{k}"</strong>
                              <span className="entry-arrow">→</span>
                              <span className="entry-val">{v}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="ds-visual-controls">
                        <button
                          type="button"
                          onClick={() => {
                            const fruits = ["banana", "orange", "grape", "berry", "melon"];
                            const randomFruit = fruits[hashItems.length % fruits.length];
                            if (!hashItems.some(([k]) => k === randomFruit)) {
                              setHashItems((h) => [...h, [randomFruit, (h.length + 1) * 3]]);
                            }
                          }}
                          disabled={hashItems.length >= 6}
                        >
                          <Plus size={14} /> Put Key
                        </button>
                        <button
                          type="button"
                          onClick={() => setHashItems((h) => h.slice(0, -1))}
                          disabled={hashItems.length <= 1}
                        >
                          <Minus size={14} /> Remove Entry
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConceptKey === "tree" && (
                    <div className="visual-tree">
                      <div className="tree-structure">
                        <div className="tree-row">
                          <div className="tree-node is-root">4</div>
                        </div>
                        <div className="tree-connectors">
                          <span>/</span>
                          <span>\</span>
                        </div>
                        <div className="tree-row">
                          <div className="tree-node">{treeInverted ? "7" : "2"}</div>
                          <div className="tree-node">{treeInverted ? "2" : "7"}</div>
                        </div>
                        <div className="tree-connectors">
                          <span>/ \</span>
                          <span>/ \</span>
                        </div>
                        <div className="tree-row leaves">
                          <div className="tree-node">{treeInverted ? "9" : "1"}</div>
                          <div className="tree-node">{treeInverted ? "6" : "3"}</div>
                          <div className="tree-node">{treeInverted ? "3" : "6"}</div>
                          <div className="tree-node">{treeInverted ? "1" : "9"}</div>
                        </div>
                      </div>
                      <div className="ds-visual-controls">
                        <button
                          type="button"
                          className="invert-btn"
                          onClick={() => setTreeInverted((inv) => !inv)}
                        >
                          <RotateCcw size={14} /> Invert Binary Tree ({treeInverted ? "Inverted" : "Original"})
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConceptKey === "heap" && (
                    <div className="visual-heap">
                      <div className="heap-tree-view">
                        <div className="heap-node-root">min = {heapItems[0]}</div>
                        <div className="heap-row">
                          <span>{heapItems[1] ?? "-"}</span>
                          <span>{heapItems[2] ?? "-"}</span>
                        </div>
                      </div>
                      <div className="heap-array-strip">
                        <span>ARRAY:</span>
                        {heapItems.map((val, i) => (
                          <div className="heap-cell" key={i}>
                            <strong>{val}</strong>
                            <small>i={i}</small>
                          </div>
                        ))}
                      </div>
                      <div className="ds-visual-controls">
                        <button
                          type="button"
                          onClick={() => {
                            if (heapItems.length < 8) {
                              setHeapItems((h) => [...h, nextNumber + 2].sort((a, b) => a - b));
                              setNextNumber((n) => n + 1);
                            }
                          }}
                          disabled={heapItems.length >= 8}
                        >
                          <Plus size={14} /> Insert Value
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeapItems((h) => h.slice(1))}
                          disabled={heapItems.length <= 1}
                        >
                          <Minus size={14} /> Extract Min
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConceptKey === "graph" && (
                    <div className="visual-graph">
                      <svg viewBox="0 0 340 180" className="graph-svg" role="img" aria-label="Graph visualization">
                        <line x1="80" y1="50" x2="170" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                        <line x1="80" y1="50" x2="80" y2="130" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                        <line x1="170" y1="30" x2="260" y2="60" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                        <line x1="170" y1="30" x2="170" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                        <line x1="80" y1="130" x2="170" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                        <line x1="170" y1="120" x2="260" y2="140" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

                        {[
                          [80, 50, 0],
                          [170, 30, 1],
                          [260, 60, 2],
                          [80, 130, 3],
                          [170, 120, 4],
                          [260, 140, 5],
                        ].map(([cx, cy, id]) => {
                          const isVisited = graphVisited.includes(id);
                          return (
                            <g key={id} onClick={() => setGraphVisited((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]))} style={{ cursor: "pointer" }}>
                              <circle
                                cx={cx}
                                cy={cy}
                                r="18"
                                fill={isVisited ? "#6366f1" : "#1a1e24"}
                                stroke={isVisited ? "#a5b4fc" : "#4b5563"}
                                strokeWidth="2"
                              />
                              <text
                                x={cx}
                                y={cy + 5}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="12"
                                fontWeight="700"
                              >
                                {id}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                      <div className="ds-visual-controls">
                        <button
                          type="button"
                          onClick={() => {
                            if (graphVisited.length < 6) {
                              setGraphVisited((v) => [...v, v.length]);
                            } else {
                              setGraphVisited([0]);
                            }
                          }}
                        >
                          <Play size={14} /> Step BFS Traversal ({graphVisited.length}/6 visited)
                        </button>
                        <button type="button" onClick={() => setGraphVisited([0])}>
                          <RotateCcw size={14} /> Reset
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConceptKey === "recursion" && (
                    <div className="visual-recursion">
                      <div className="call-stack">
                        {[4, 3, 2, 1].map((n, i) => (
                          <div className="stack-frame" key={n} style={{ marginLeft: `${i * 14}px` }}>
                            <strong>factorial({n})</strong>
                            <small>{n === 1 ? "return 1 (BASE CASE)" : `returns ${n} * factorial(${n - 1})`}</small>
                          </div>
                        ))}
                      </div>
                      <span className="recursion-note">
                        Each recursive call pushes a new execution context onto the Call Stack. Base case unwinds the stack.
                      </span>
                    </div>
                  )}

                  {activeConceptKey === "dp" && (
                    <div className="visual-dp">
                      <div className="dp-table-strip">
                        <span className="dp-formula">Climbing Stairs: dp[i] = dp[i-1] + dp[i-2]</span>
                        <div className="dp-cells">
                          {dpSteps.map((val, idx) => (
                            <div className="dp-cell" key={idx}>
                              <span className="dp-step-lbl">dp[{idx + 1}]</span>
                              <strong className="dp-step-val">{val}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="ds-visual-controls">
                        <button
                          type="button"
                          onClick={() => {
                            if (dpSteps.length < 8) {
                              const len = dpSteps.length;
                              const nextVal = dpSteps[len - 1] + dpSteps[len - 2];
                              setDpSteps((s) => [...s, nextVal]);
                            }
                          }}
                          disabled={dpSteps.length >= 8}
                        >
                          <Plus size={14} /> Calculate Next State
                        </button>
                        <button type="button" onClick={() => setDpSteps([1, 2, 3, 5, 8])}>
                          <RotateCcw size={14} /> Reset
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConceptKey === "backtracking" && (
                    <div className="visual-backtrack">
                      <div className="bt-flow">
                        <div className="bt-node root">Start: []</div>
                        <div className="bt-branches">
                          <div className="bt-branch">
                            <span className="action">Choose 1</span>
                            <div className="bt-node">[1]</div>
                            <span className="action undo">Backtrack (pop)</span>
                          </div>
                          <div className="bt-branch">
                            <span className="action">Choose 2</span>
                            <div className="bt-node">[2]</div>
                            <span className="action undo">Backtrack (pop)</span>
                          </div>
                        </div>
                      </div>
                      <span className="recursion-note">
                        Backtracking explores candidate solution branches and systematically undoes changes (pop) to restore state.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right concept article & Python code */}
              <article className="concept-article">
                <span className="article-kicker">CONCEPT CHEATSHEET</span>
                <h3>{activeConcept.title}</h3>
                <p className="concept-summary">{activeConcept.summary}</p>

                <h4>When to use it</h4>
                <p className="concept-use">{activeConcept.use}</p>

                <h4>Complexity breakdown</h4>
                <p className="concept-complexity">{activeConcept.complexity}</p>

                <h4>Python 3 snippet</h4>
                <pre className="concept-code">
                  <code>{activeConcept.code}</code>
                </pre>
              </article>
            </div>
          </section>

          {/* Active Lesson Card */}
          <article className="course-lesson-card">
            <div className="course-lesson-heading">
              <div>
                <span className="course-kicker">
                  {currentLesson.week} · {currentLesson.module.toUpperCase()}
                </span>
                <h2>{currentLesson.title}</h2>
              </div>
              <span className="course-duration">
                <Clock3 size={14} />
                {currentLesson.duration}
              </span>
            </div>

            <p className="lesson-topics-desc">{currentLesson.topics}</p>

            <div className="course-task">
              <div className="task-header">
                <strong>PUT IT INTO PRACTICE</strong>
                {onOpenProblem && (
                  <button
                    type="button"
                    className="task-solve-button"
                    onClick={() => onOpenProblem(currentLesson.relatedProblemNumber)}
                  >
                    <CodeXml size={14} />
                    <span>
                      Solve #{currentLesson.relatedProblemNumber} ({currentLesson.relatedProblemTitle}) in Editor
                    </span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
              <span>{currentLesson.task}</span>
            </div>

            {/* Interactive Knowledge Check Quiz */}
            <div className="lesson-quiz-box">
              <div className="quiz-header">
                <span className="quiz-kicker">
                  <HelpCircle size={14} /> KNOWLEDGE CHECK
                </span>
                <strong>{currentLesson.quiz.question}</strong>
              </div>

              <div className="quiz-options">
                {currentLesson.quiz.options.map((opt, oIdx) => {
                  let cls = "quiz-option-btn";
                  if (quizSubmitted) {
                    if (oIdx === currentLesson.quiz.correctIndex) cls += " is-correct";
                    else if (oIdx === selectedQuizAnswer) cls += " is-wrong";
                  } else if (selectedQuizAnswer === oIdx) {
                    cls += " is-selected";
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      className={cls}
                      onClick={() => {
                        if (!quizSubmitted) setSelectedQuizAnswer(oIdx);
                      }}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + oIdx)}</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="quiz-footer">
                {!quizSubmitted ? (
                  <button
                    type="button"
                    className="quiz-submit-btn"
                    disabled={selectedQuizAnswer === null}
                    onClick={() => setQuizSubmitted(true)}
                  >
                    Check Answer
                  </button>
                ) : (
                  <div className="quiz-feedback">
                    <strong>
                      {selectedQuizAnswer === currentLesson.quiz.correctIndex
                        ? "✅ Correct!"
                        : "❌ Review the concept:"}
                    </strong>
                    <p>{currentLesson.quiz.explanation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Button */}
            <button
              className={`course-complete-button ${isDone ? "is-complete" : ""}`}
              onClick={toggleLessonComplete}
              type="button"
            >
              {isDone ? (
                <>
                  <Check size={16} /> Lesson completed
                </>
              ) : (
                <>
                  <Check size={16} /> Mark lesson complete
                </>
              )}
            </button>
          </article>
        </section>

        {/* Right Sidebar: Curriculum Navigation */}
        <aside className="course-curriculum">
          <div className="course-curriculum-heading">
            <div>
              <span className="course-kicker">CURRICULUM</span>
              <h2>Course content</h2>
            </div>
            <span>{allLessons.length} lessons</span>
          </div>

          <div className="course-module-list">
            {modules.map((module, mi) => (
              <section className="course-module" key={module.title}>
                <div className="course-module-title">
                  <span>{module.level}</span>
                  <strong>{module.title}</strong>
                </div>

                <div className="module-lessons">
                  {module.lessons.map((item, li) => {
                    const key = `${mi}-${li}`;
                    const done = completed.includes(key);
                    const isSelected = selectedKey === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        className={`course-lesson-row ${isSelected ? "is-selected" : ""}`}
                        onClick={() => setSelectedKey(key)}
                      >
                        <span className={`course-play-icon ${done ? "is-done" : ""}`}>
                          {done ? <Check size={14} /> : <Play size={12} />}
                        </span>
                        <div className="course-row-copy">
                          <strong>{item.title}</strong>
                          <small>
                            {item.duration} · #{item.relatedProblemNumber} {item.relatedProblemTitle}
                          </small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
