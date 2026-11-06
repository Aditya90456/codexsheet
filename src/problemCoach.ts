// problemCoach.ts — the "how do I approach this?" layer under every sheet row.
// A sheet row says which problem; a pattern card says how to spot the pattern.
// This says what to actually do, in order, once you are staring at the question -
// and which live board proves the idea. The recognition line, skeleton, variants
// and complexity all come from the pattern card, so nothing here can drift away
// from what /patterns teaches; only the ladder and the traps are authored here.

import type { Problem, SheetTopic } from "./dsaSheet";
import { patternCardByName, tierLabels } from "./dsaPatterns";
import { patternSimByName, patternSimFrames, patternSimHeading, type PatternSim } from "./pattern-sims";
import { dsaMetrics, type DsaFrame } from "./dsa-labs-kernels";

export type Approach = {
  problem: Problem;
  pattern: string;
  recognize: string;
  ladder: string[];
  traps: string[];
  template: string[];
  variants: string[];
  complexity: string;
  tierLabel: string;
};

type Ladder = { ladder: string[]; traps: string[] };

const LADDERS: Record<string, Ladder> = {
  "Arrays & Hashing": {
    ladder: [
      "Say the brute force out first - if it is two loops over the same array, a lookup is what the question wants.",
      "Decide what you need to remember while you scan: a count, a list of members, or an index you may need again.",
      "Pick the container for that: Set for membership, Map<value, count> for counting, Map<key, bucket> for grouping.",
      "Choose the key before the loop. Sorting a word, a prefix sum, or (row, col) are all keys - the key is the whole trick.",
      "One pass, then read the answer off the map. Only take a second pass if the answer needs the array itself.",
    ],
    traps: [
      "Re-building the map inside the loop turns O(n) back into O(n²).",
      "Counting the answer while iterating the map double-counts pairs; count per element as you go.",
      "A prefix-sum lookup must be seeded with 0 : 1 or you lose the subarray that starts at index 0.",
    ],
  },
  "Two Pointers": {
    ladder: [
      "Ask what the two indices are measuring - the ends of a region, a pair, or slow/fast over the same array.",
      "Sort first only if the question does not need the original indices; two pointers on unsorted data is almost always wrong.",
      "Write the move rule: which pointer moves, and why the other one never has to move back.",
      "Shrink the answer at every step instead of trying to spot the right pair at the end.",
      "Handle the duplicates the question asks you to skip, either before you move or after you record.",
    ],
    traps: [
      "Moving both pointers because the last case worked - one rule, applied every step, is the proof.",
      "Forgetting left <= right in a swap loop, which silently reverses the array twice.",
      "Skipping duplicates with `while (i + 1 < n)` and reading past the end on the last element.",
    ],
  },
  "Sliding Window": {
    ladder: [
      "Fix what the window must contain, and write the condition that makes it valid or invalid.",
      "Add the entering element to your state before you test, and drop the leaving element before you move on.",
      "Grow `right` every step; only move `left` while the condition is broken (or while it still holds, for a max).",
      "Record the answer inside the loop at the moment the window is legal, not after the loop.",
      "For 'at most K' problems, keep the window valid by shrinking; for exact-K, keep its size constant.",
    ],
    traps: [
      "Recounting the whole window at each step - that is O(n·k) and the point of the window is that you never recount.",
      "Advancing `left` with an `if` when the condition can need several pops; it must be a `while`.",
      "Off-by-one in the length: the window is `right - left + 1` elements, not `right - left`.",
    ],
  },
  Stack: {
    ladder: [
      "Find the pairing or nesting rule: what closes what, and does order matter.",
      "Push the opener (or its index); the top is always the thing the next element has to agree with.",
      "On a closer, pop and compare - if the stack is empty first, the input is malformed.",
      "Whatever is left on the stack at the end is unfinished business; that is usually part of the answer.",
      "Indices on the stack beat values when the answer needs a distance, not a symbol.",
    ],
    traps: [
      "Popping without an empty check throws on the first stray closer.",
      "Storing values when the question asks for a span - you lose the position you needed.",
      "Recursion instead of an explicit stack on a deep input, then a stack overflow you cannot see in a small test.",
    ],
  },
  "Monotonic Stack": {
    ladder: [
      "Say which extreme you are waiting for: the next greater element or the next smaller one. That decides the direction.",
      "Keep the stack monotone by popping everything that the new element makes obsolete, and settle each pop as you do it.",
      "Push the current index, so a pop knows the distance it just closed.",
      "Anything still on the stack at the end never found its answer - fill those with the default.",
      "Check the invariant every step: the stack must stay sorted in one direction, or the whole argument collapses.",
    ],
    traps: [
      "Popping on `>=` versus `>` silently changes which equal element owns the answer.",
      "Pushing without settling the popped ones first, so the answer array is filled in the wrong slot.",
      "Running the pass twice when one pass plus the leftover stack already covers the wrap-around.",
    ],
  },
  "Binary Search": {
    ladder: [
      "Find the thing that is monotone. It is often not the array but the answer space - 'can it be done in X?' is the sorted sequence.",
      "Write the predicate, then search for the first position where it flips from false to true.",
      "Pick the loop shape once: `while (lo < hi)` with `hi = mid`, or `while (lo <= hi)` with `lo = mid + 1`, and never mix them.",
      "Compute `mid` as `lo + ((hi - lo) >> 1)` and prove every step halves the range.",
      "After the loop, `lo` is your boundary - test the two neighbours off-by-one on paper before coding.",
    ],
    traps: [
      "`(lo + hi) / 2` overflowing on large indices in a typed language.",
      "Looping forever because the update did not exclude `mid` in one branch.",
      "Binary searching an array you never sorted, or a rotated one without checking which side is ordered.",
    ],
  },
  "Linked List": {
    ladder: [
      "Draw three boxes: what came before, where you are, and where you are going. That is the whole algorithm.",
      "Add a dummy head whenever the answer may change the first node - it deletes a whole branch of special cases.",
      "Save `next` before you overwrite any pointer, then move forward.",
      "For middle, cycle or kth-from-end, use two pointers with the right head start instead of counting length.",
      "Reconnect the tail at the end; a list that does not end in null passes the logic and fails the judge.",
    ],
    traps: [
      "Reading `node.next.val` after you already reassigned `node.next`.",
      "Losing the head you were about to return when you move the pointer first.",
      "A cycle test that never advances the slow pointer's comparison, so it runs forever on a self-loop.",
    ],
  },
  Trees: {
    ladder: [
      "Decide the direction of information: top-down (pass state into children) or bottom-up (combine what children return).",
      "Write the base case for a null child before anything else; it is the identity your combine step needs.",
      "Name what a call returns in one sentence, and make every branch return that same thing.",
      "Ask whether the answer at a node depends on both subtrees - if yes, check it on the way up, not on the way in.",
      "Walk one small tree by hand and print each return value; that catches most errors before you type the code.",
    ],
    traps: [
      "Returning the height from a function whose contract was the diameter.",
      "Rechecking BST validity with only parent-child comparisons, which misses an ancestor's bound.",
      "Forgetting that a 'path' may start and end at non-root nodes, so a negative subtree should be dropped rather than added.",
    ],
  },
  Heaps: {
    ladder: [
      "Identify what must be reachable in O(1) at every step - the max, the min, or the k-th something.",
      "Fix k first: a size-k min-heap keeps the k largest, and a size-k max-heap keeps the k smallest.",
      "Push, then pop when the heap exceeds k. The invariant is the size, not the value.",
      "Store the comparator's key with the item, so ties are resolved without a second lookup.",
      "Read the answer off the heap at the end; if you emptied it into a list you paid for a sort you did not need.",
    ],
    traps: [
      "Pushing all n items then popping k - O(n) memory when O(k) was the whole point.",
      "Using the array's natural ordering when the question wants a custom key, so the top is the wrong item.",
      "Mutating the objects inside the heap without re-heapifying; the order is a promise, not a property.",
    ],
  },
  Graphs: {
    ladder: [
      "Name the nodes and the edges out loud, including the implicit ones - indices, states, words, cells can all be nodes.",
      "Choose BFS for shortest hops on unweighted edges, DFS for reachability, paths and cycles, and an indegree count for ordering.",
      "Write the representation before the algorithm: adjacency list, or a grid you walk with (dr, dc).",
      "Mark visited when you enqueue, not when you dequeue, or the queue grows faster than the graph.",
      "For 'how many components', the answer is how many times you had to start the search.",
    ],
    traps: [
      "Re-visiting through a back edge and recursing until the stack dies.",
      "Assuming the input is connected, then reporting the wrong component count.",
      "Treating a directed graph as undirected - half the topological answers flip.",
    ],
  },
  Backtracking: {
    ladder: [
      "Define one decision, and how the partial answer is extended by it - a position, a pick, or a direction.",
      "Write the base case that records a complete answer before you write any pruning.",
      "Structure it as choose, explore, unchoose. The unchoose must be the exact inverse of the choose.",
      "Prune where you can prove the branch is dead, and say the proof in a comment - that is what the interviewer grades.",
      "Keep a used-set for permutations, a start index for combinations, and a board for grids; they are the three shapes.",
    ],
    traps: [
      "Passing the shared array by reference and collecting references to it instead of copies.",
      "Forgetting the un-choose, which makes every branch see the previous branch's state.",
      "Counting duplicates as different answers when the question wants unique ones - sort and skip, or use a set.",
    ],
  },
  "1-D DP": {
    ladder: [
      "Say what one number means: 'dp[i] = the best answer using only the first i items'. If you cannot say it, you do not have a DP yet.",
      "Find how the last item is used or not used - that split is almost always the recurrence.",
      "Write the base case, then check it by hand for i = 0 and i = 1.",
      "Derive the loop order from the recurrence: every cell must read only cells already finished.",
      "Shrink the storage to the window the recurrence actually reads, then re-read it and confirm nothing else is referenced.",
    ],
    traps: [
      "Recursion without memoisation on a 250-length input, which is exponential and looks like a hang.",
      "Initialising with 0 when the answer is a minimum, so 0 silently wins every comparison.",
      "Off-by-one between 'i items' and 'index i' in both the recurrence and the final return.",
    ],
  },
  "2-D DP": {
    ladder: [
      "Name the two things the state is indexed by - usually 'first i of A' and 'first j of B'.",
      "Write the transition for one cell from its neighbours, with the match and the mismatch as separate branches.",
      "Fill row 0 and column 0 from the base case first; they carry the 'one side is empty' meaning.",
      "Fix the fill order so every dependency is already computed - row-major works for the standard neighbours.",
      "Print a small table by hand (3x3) and compare it to what the recurrence claims; a wrong state shows up immediately.",
    ],
    traps: [
      "Reading a diagonal you never filled because the loop started at the wrong index.",
      "Allocating m x n for an m+1 x n+1 table and losing the empty-string base case.",
      "Reconstructing the answer from the wrong cell when the question asks for a path rather than a count.",
    ],
  },
  Greedy: {
    ladder: [
      "Guess a greedy rule, then try to prove it: if the best local choice can never cost you a better global answer, it is greedy.",
      "Look for the exchange argument - swap one choice with the optimal solution's and show nothing gets worse.",
      "Sort by the quantity the proof actually compares, not by the field the input happens to lead with.",
      "Maintain one running value (the last end, the current balance, the best so far) and update it per item.",
      "If you cannot prove it, find the counter-example; a failing case tells you it is a DP or a heap instead.",
    ],
    traps: [
      "Greedy on a problem that needs every subset considered - one crafted counter-example settles it.",
      "Sorting by start when the proof needs earliest finish, which is the usual reason the rule fails.",
      "Updating the running value before testing the current item, so the comparison uses the wrong baseline.",
    ],
  },
  Intervals: {
    ladder: [
      "Sort by start for overlap-and-merge questions, and by end for scheduling questions - the sort is the decision.",
      "Keep the answer as a list you extend or grow in place; the last interval in it is your only state.",
      "Compare the incoming interval to the last one by start and end separately, and write down what each comparison means.",
      "For 'how many rooms', switch to boundaries: sweep the starts and ends in time order with a counter or heap.",
      "Return the list you built, not the sorted input; merging must be visible in the output.",
    ],
    traps: [
      "Merging with `<=` versus `<` and leaving touching intervals apart, or overlapping ones joined.",
      "Forgetting to widen the last end after a merge, so a later interval fails to join.",
      "Sorting only by start and then assuming the ends are ordered too.",
    ],
  },
  "Bit Manipulation": {
    ladder: [
      "Write the bits down for a small number and watch what the operation actually did to them.",
      "Reach for the standard tools: x & (x - 1) drops the lowest set bit, x & -x isolates it, XOR cancels pairs.",
      "For 'one number is different', XOR over everything - pairs vanish and the odd one survives.",
      "For counting or masks, loop over set bits only (`while (x) { x &= x - 1 }`) instead of over all 32.",
      "Fix the width: JavaScript's bitwise operators work on 32-bit signed integers, so unsigned shifts need `>>> 0`.",
    ],
    traps: [
      "Using `^` on values that appear three times - it only cancels pairs.",
      "Sign-extension after a left shift turning a positive into a negative.",
      "Testing `n & 1 == 1` without parentheses, where `==` binds tighter than `&` in most C-family languages.",
    ],
  },
};

const TOPIC_PLAYBOOK: Record<SheetTopic, { shape: string; checks: string[]; start: string }> = {
  "Arrays & Hashing": {
    shape: "You are given values and asked what is present, how often, or which ones belong together.",
    checks: [
      "Can I trade memory for a constant-time lookup?",
      "What is the key that makes two different-looking items the same item?",
      "Is a prefix sum the thing I should be looking up?",
    ],
    start: "Two Sum, then Group Anagrams, then Top K Frequent Elements.",
  },
  "Strings & Two Pointers": {
    shape: "One sequence, two ends or two readers, and a rule about which one moves.",
    checks: [
      "Does the answer need a pair or a region rather than a single element?",
      "Can I sort, or do the indices matter?",
      "Is the window's validity check the thing I should be shrinking on?",
    ],
    start: "Valid Palindrome, then 3Sum, then Longest Substring Without Repeating Characters.",
  },
  "Sorting & Searching": {
    shape: "Something is already ordered, or the answer space is ordered even when the input is not.",
    checks: [
      "What predicate flips from false to true exactly once?",
      "Am I searching an array, or searching the range of possible answers?",
      "Which half can I throw away after one comparison?",
    ],
    start: "Binary Search, then Search in Rotated Sorted Array, then Koko Eating Bananas.",
  },
  "Stacks & Queues": {
    shape: "The most recent thing is the only thing that matters, or the oldest is next out.",
    checks: [
      "Does the question pair or nest things?",
      "Am I waiting for the next greater or smaller element?",
      "Would an explicit stack replace recursion I cannot control?",
    ],
    start: "Valid Parentheses, then Min Stack, then Daily Temperatures.",
  },
  "Linked Lists": {
    shape: "Pointers, one node of lookahead, and no random access.",
    checks: [
      "Does the head itself change - do I need a dummy?",
      "Can two pointers find the middle or the cycle without counting?",
      "Which pointer do I have to save before I overwrite it?",
    ],
    start: "Reverse Linked List, then Merge Two Sorted Lists, then Linked List Cycle.",
  },
  "Trees & BSTs": {
    shape: "A recursive shape: the answer at a node is built from the answers below it.",
    checks: [
      "Does information flow down from the parent or up from the children?",
      "What does one call return, in one sentence?",
      "Does the answer cross through a node rather than start at the root?",
    ],
    start: "Maximum Depth, then Invert Binary Tree, then Lowest Common Ancestor.",
  },
  "Heaps & Priority Queues": {
    shape: "You keep needing the largest or smallest thing, and the set changes as you go.",
    checks: [
      "What must be reachable in constant time at every step?",
      "Do I only need k of them - so can the heap be size k?",
      "Is the order defined by a computed key rather than the item's own value?",
    ],
    start: "Kth Largest Element, then Top K Frequent Elements, then Reorganize String.",
  },
  "Graphs & Topological Sort": {
    shape: "Nodes and edges, sometimes hidden inside grids, states or dependencies.",
    checks: [
      "What is a node here, and what makes two nodes adjacent?",
      "Do I need shortest hops (BFS), reachability (DFS) or an ordering (indegree)?",
      "Is a cycle the answer, or the reason there is no answer?",
    ],
    start: "Number of Islands, then Clone Graph, then Course Schedule.",
  },
  "Backtracking": {
    shape: "Enumerate choices, and the tree of choices is the search space.",
    checks: [
      "What is the single decision at each level?",
      "When is a partial answer complete enough to record?",
      "What branch can I prove is dead before I explore it?",
    ],
    start: "Subsets, then Combination Sum, then Permutations.",
  },
  "Dynamic Programming": {
    shape: "The big answer is built from smaller answers that repeat - so you only compute each once.",
    checks: [
      "State: what does one number mean, in one sentence?",
      "Recurrence: how does the last item get used or not used?",
      "Order: does every cell read only cells already finished?",
    ],
    start: "Climbing Stairs, then House Robber, then Longest Increasing Subsequence.",
  },
  "Greedy & Intervals": {
    shape: "Pick in some order, never look back - if you can prove the local choice is safe.",
    checks: [
      "What exactly do I sort by, and can I prove that choice?",
      "What one running value holds the state?",
      "Is there a counter-example where greedy loses?",
    ],
    start: "Best Time to Buy and Sell Stock, then Merge Intervals, then Non-Overlapping Intervals.",
  },
  "Bit Manipulation": {
    shape: "The answer lives in the bits: flags, masks, parity, or powers of two.",
    checks: [
      "Does the problem only ask about set or unset bits?",
      "Is there a pair-cancelling property I can exploit?",
      "How wide is my type, and does a shift change the sign?",
    ],
    start: "Single Number, then Counting Bits, then Reverse Bits.",
  },
};

export type Board = {
  heading: string;
  lens: string;
  input: string;
  frames: DsaFrame[];
  metrics: { label: string; value: string; hint?: string }[];
};

/** Everything a student needs to answer "how would I approach this one?". */
export function approachFor(problem: Problem): Approach {
  const card = patternCardByName.get(problem.pattern);
  const authored = LADDERS[problem.pattern];
  return {
    problem,
    pattern: problem.pattern,
    recognize: card?.cue ?? "Spot the pattern first: what does the question ask you to remember, order, or halve?",
    ladder: authored?.ladder ?? ["Write the brute force, then find the work it repeats and cache exactly that."],
    traps: authored?.traps ?? ["Re-check the boundary cases: empty input, one element, and all-equal elements."],
    template: card?.template ?? [],
    variants: card?.variants ?? [],
    complexity: card?.complexity ?? "",
    tierLabel: tierLabels[problem.tier],
  };
}

/** Which patterns a topic actually contains, read from the sheet rather than typed twice. */
export function patternsForTopic(topic: SheetTopic, rows: Problem[]): string[] {
  return [...new Set(rows.filter((problem) => problem.topic === topic).map((problem) => problem.pattern))];
}

export function topicPlaybook(topic: SheetTopic) {
  return TOPIC_PLAYBOOK[topic];
}

/**
 * The board for one question: the same deterministic kernel run the /patterns film
 * uses, so the whiteboard and the pattern lesson can never disagree. Cached per
 * pattern by patternSimFrames, so opening 900 rows does not re-run 900 simulations.
 */
export function boardFor(problem: Problem): Board {
  const sim: PatternSim | undefined = patternSimByName[problem.pattern];
  const frames = patternSimFrames(problem.pattern);
  const last = frames[frames.length - 1];
  return {
    heading: patternSimHeading(problem.pattern),
    lens: sim?.lens ?? "This pattern has no live board yet.",
    input: sim?.input ?? "",
    frames,
    metrics: last ? dsaMetrics(last, frames) : [],
  };
}
