import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Clock3, Code2, RotateCcw, X } from "lucide-react";

type TestCase = { args: unknown[]; expected: unknown };
type Challenge = { title: string; prompt: string; fn: string; params: string; cases: TestCase[]; unordered?: boolean };
type TestResult = { passed: number; total: number; details: string[]; error?: string };
const q = (title: string, prompt: string, fn: string, params: string, cases: Array<[unknown[], unknown]>, unordered = false): Challenge => ({
  title, prompt, fn, params, cases: cases.map(([args, expected]) => ({ args, expected })), unordered,
});
const tc = (args: unknown[], expected: unknown): [unknown[], unknown] => [args, expected];

const patternTests: Record<string, Challenge[]> = {
  "Arrays & Hashing": [
    q("Contains Duplicate", "Return true when any value appears more than once.", "containsDuplicate", "nums", [tc([[1, 2, 3, 1]], true), tc([[1, 2, 3]], false)]),
    q("Two Sum", "Return the two indices whose values add to target.", "twoSum", "nums, target", [tc([[2, 7, 11, 15], 9], [0, 1]), tc([[3, 2, 4], 6], [1, 2])]),
    q("Valid Anagram", "Return true when both strings contain the same letters with the same counts.", "isAnagram", "s, t", [tc(["anagram", "nagaram"], true), tc(["rat", "car"], false)]),
    q("Product Except Self", "Return an array where each index contains the product of every other number. Do not use division.", "productExceptSelf", "nums", [tc([[1, 2, 3, 4]], [24, 12, 8, 6]), tc([[-1, 1, 0, -3, 3]], [0, 0, 9, 0, 0])]),
  ],
  "Two Pointers": [
    q("Valid Palindrome", "Ignore spaces and punctuation. Compare letters without case sensitivity.", "isPalindrome", "s", [tc(["A man, a plan, a canal: Panama"], true), tc(["race a car"], false)]),
    q("Two Sum II", "The input is sorted. Return the matching pair of indices using 1-based indexing.", "twoSumSorted", "numbers, target", [tc([[2, 7, 11, 15], 9], [1, 2]), tc([[2, 3, 4], 6], [1, 3])]),
    q("Container With Most Water", "Choose two lines that hold the most water. Return the maximum area.", "maxArea", "height", [tc([[1, 8, 6, 2, 5, 4, 8, 3, 7]], 49), tc([[1, 1]], 1)]),
    q("Reverse a String", "Reverse the array of characters in place and return it.", "reverseString", "chars", [tc([["h", "e", "l", "l", "o"]], ["o", "l", "l", "e", "h"]), tc([["a", "b"]], ["b", "a"])]),
  ],
  "Sliding Window": [
    q("Maximum Window Sum", "Return the largest sum of any contiguous window of length k.", "maxWindowSum", "nums, k", [tc([[2, 1, 5, 1, 3, 2], 3], 9), tc([[2, 3], 2], 5)]),
    q("Longest Unique Substring", "Return the length of the longest substring with no repeated characters.", "lengthOfLongestSubstring", "s", [tc(["abcabcbb"], 3), tc(["bbbbb"], 1)]),
    q("Minimum Size Subarray", "For positive numbers, return the shortest contiguous subarray with sum at least target, or 0.", "minSubArrayLen", "target, nums", [tc([7, [2, 3, 1, 2]], 2), tc([5, [1, 1, 1]], 0)]),
    q("Maximum Vowels", "Return the maximum number of vowels in any substring of length k.", "maxVowels", "s, k", [tc(["abciiidef", 3], 3), tc(["aeiou", 2], 2)]),
  ],
  Stack: [
    q("Valid Brackets", "Return true when every opening bracket is closed in the correct order.", "isValid", "s", [tc(['()[]{}'], true), tc(['(]'], false)]),
    q("Evaluate Reverse Polish", "Evaluate an expression whose operators are +, -, *, and /. Division truncates toward zero.", "evalRPN", "tokens", [tc([["2", "1", "+", "3", "*"],], 9), tc([["4", "13", "5", "/", "+"]], 6)]),
    q("Daily Temperatures", "For each day, return how many days until a warmer temperature; use 0 if none.", "dailyTemperatures", "temperatures", [tc([[73, 74, 75, 71, 69, 72, 76, 73]], [1, 1, 4, 2, 1, 1, 0, 0]), tc([[30, 40, 50]], [1, 1, 0])]),
    q("Remove Adjacent Duplicates", "Repeatedly remove pairs of adjacent equal characters and return the remaining string.", "removeDuplicates", "s", [tc(["abbaca"], "ca"), tc(["azxxzy"], "ay")]),
  ],
  "Monotonic Stack": [
    q("Next Greater Element", "For each value in nums1, find its next greater value to the right in nums2, or -1.", "nextGreaterElement", "nums1, nums2", [tc([[4, 1, 2], [1, 3, 4, 2]], [-1, 3, -1]), tc([[2, 4], [1, 2, 3, 4]], [3, -1])]),
    q("Largest Histogram Rectangle", "Each bar has width 1. Return the largest rectangle area in the histogram.", "largestRectangleArea", "heights", [tc([[2, 1, 5, 6, 2, 3]], 10), tc([[2, 4]], 4)]),
    q("Remove K Digits", "Remove k digits so the remaining number is as small as possible. Return it as a string.", "removeKdigits", "num, k", [tc(["1432219", 3], "1219"), tc(["10200", 1], "200")]),
    q("Sum of Subarray Minimums", "Return the sum of every subarray's minimum value, modulo 1,000,000,007.", "sumSubarrayMins", "arr", [tc([[3, 1, 2, 4]], 17), tc([[11, 81, 94, 43, 3]], 444)]),
  ],
  "Binary Search": [
    q("Binary Search", "Return the index of target in a sorted array, or -1 if it is absent.", "search", "nums, target", [[[[ -1, 0, 3, 5, 9, 12], 9], 4], [[[1, 2, 3], 5], -1]]),
    q("Lower Bound", "Return the first index whose value is greater than or equal to target.", "lowerBound", "nums, target", [[[[1, 2, 2, 4], 2], 1], [[[1, 3, 5], 4], 2]]),
    q("Find Minimum Rotated", "Find the smallest value in a rotated sorted array with unique values.", "findMin", "nums", [[[[3, 4, 5, 1, 2]], 1], [[[11, 13, 15, 17]], 11]]),
    q("Integer Square Root", "Return the floor of the square root of a non-negative integer without using Math.sqrt.", "mySqrt", "x", [tc([8], 2), tc([16], 4)]),
  ],
  "Linked List": [
    q("Reverse a List", "Represent the linked list as an array. Return the values in reversed order.", "reverseList", "values", [[[[1, 2, 3, 4]], [4, 3, 2, 1]], [[[1]], [1]]]),
    q("Merge Sorted Lists", "The two sorted linked lists are arrays. Return one merged sorted array.", "mergeTwoLists", "a, b", [[[[1, 2, 4], [1, 3, 4]], [1, 1, 2, 3, 4, 4]], [[[0], []], [0]]]),
    q("Middle of a List", "Return the middle value. For an even length, return the second middle value.", "middleNode", "values", [[[[1, 2, 3, 4, 5]], 3], [[[1, 2, 3, 4, 5, 6]], 4]]),
    q("Remove Nth from End", "The list is represented as an array. Remove the nth value from the end and return the result.", "removeNthFromEnd", "values, n", [[[[1, 2, 3, 4, 5], 2], [1, 2, 3, 5]], [[[1], 1], []]]),
  ],
  Trees: [
    q("Maximum Tree Depth", "The tree is a nested object with value, left, and right fields. Return its maximum depth.", "maxDepth", "root", [tc([{ value: 1, left: { value: 2, left: null, right: null }, right: { value: 3, left: null, right: null } }], 2), tc([{ value: 1, left: null, right: null }], 1)]),
    q("Validate BST", "Return true when every node follows the binary search tree ordering rule.", "isValidBST", "root", [tc([{ value: 2, left: { value: 1, left: null, right: null }, right: { value: 3, left: null, right: null } }], true), tc([{ value: 5, left: { value: 1, left: null, right: null }, right: { value: 4, left: { value: 3, left: null, right: null }, right: { value: 6, left: null, right: null } } }], false)]),
    q("Invert a Tree", "Swap the left and right children of every node. Return the updated tree.", "invertTree", "root", [tc([{ value: 1, left: { value: 2, left: null, right: null }, right: { value: 3, left: null, right: null } }], { value: 1, left: { value: 3, left: null, right: null }, right: { value: 2, left: null, right: null } }), tc([null], null)]),
    q("Level Order Traversal", "Return each tree level as an array. The tree uses nested value, left, and right fields.", "levelOrder", "root", [tc([{ value: 1, left: { value: 2, left: null, right: null }, right: { value: 3, left: null, right: null } }], [[1], [2, 3]]), tc([null], [])]),
  ],
  Backtracking: [
    q("Subsets", "Return every subset of the input array.", "subsets", "nums", [[[[1, 2]], [[], [1], [2], [1, 2]]], [[[0]], [[], [0]]]], true),
    q("Combination Sum", "Return unique combinations that add to target. A candidate may be reused.", "combinationSum", "candidates, target", [[[[2, 3, 6, 7], 7], [[2, 2, 3], [7]]], [[[2, 3, 5], 8], [[2, 2, 2, 2], [2, 3, 3], [3, 5]]]], true),
    q("Permutations", "Return every ordering of the distinct input values.", "permute", "nums", [[[[1, 2, 3]], [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]], [[[0, 1]], [[0, 1], [1, 0]]]], true),
    q("Generate Parentheses", "Return all strings containing n pairs of valid parentheses.", "generateParenthesis", "n", [[[[3]], ['((()))', '(()())', '(())()', '()(())', '()()()']], [[[1]], ['()']]], true),
  ],
  Graphs: [
    q("Number of Islands", "Count connected groups of '1' cells. Adjacent means up, down, left, or right.", "numIslands", "grid", [[[[['1','1','0'], ['0','1','0'], ['1','0','1']]], 3], [[[['1','1'], ['1','1']]], 1]]),
    q("Course Schedule", "Prerequisites are [course, prerequisite]. Return whether all courses can be completed.", "canFinish", "numCourses, prerequisites", [[[[2, [[1, 0]]], true], [[2, [[1, 0], [0, 1]]], false]]]),
    q("Path Exists", "Edges are undirected pairs. Return whether a path connects source and destination.", "validPath", "n, edges, source, destination", [[[[3, [[0, 1], [1, 2]], 0, 2], true], [[6, [[0, 1], [2, 3]], 0, 5], false]]]),
    q("Connected Components", "Count connected components in an undirected graph with vertices 0 through n - 1.", "countComponents", "n, edges", [[[[5, [[0, 1], [1, 2], [3, 4]]], 2], [[4, []], 4]]]),
  ],
  "1-D DP": [
    q("Climbing Stairs", "You can climb one or two steps at a time. Return the number of distinct ways to reach step n.", "climbStairs", "n", [[[2, 2], [5, 8]]]),
    q("House Robber", "Return the maximum amount you can take without robbing adjacent houses.", "rob", "nums", [[[[1, 2, 3, 1]], 4], [[[2, 7, 9, 3, 1]], 12]]),
    q("Coin Change", "Return the fewest coins needed to make amount, or -1 when it is impossible.", "coinChange", "coins, amount", [[[[1, 2, 5], 11], 3], [[[2], 3], -1]]),
    q("Longest Increasing Subsequence", "Return the length of the longest strictly increasing subsequence.", "lengthOfLIS", "nums", [[[[10, 9, 2, 5, 3, 7, 101, 18]], 4], [[[0, 1, 0, 3, 2, 3]], 4]]),
  ],
  "2-D DP": [
    q("Unique Paths", "A robot moves only right or down on an m by n grid. Return the number of paths.", "uniquePaths", "m, n", [tc([3, 7], 28), tc([3, 2], 3)]),
    q("Minimum Path Sum", "Return the minimum sum path from the top left to the bottom right, moving right or down.", "minPathSum", "grid", [tc([[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], 7), tc([[[1, 2], [3, 4]]], 7)]),
    q("Longest Common Subsequence", "Return the length of the longest subsequence shared by both strings.", "longestCommonSubsequence", "text1, text2", [tc(["abcde", "ace"], 3), tc(["abc", "def"], 0)]),
    q("Edit Distance", "Return the fewest insertions, deletions, and replacements needed to change word1 into word2.", "minDistance", "word1, word2", [tc(["horse", "ros"], 3), tc(["intention", "execution"], 5)]),
  ],
  Greedy: [
    q("Best Time to Trade", "Choose one buy and one later sell. Return the greatest possible profit.", "maxProfit", "prices", [[[[7, 1, 5, 3, 6, 4]], 5], [[[7, 6, 4, 3, 1]], 0]]),
    q("Can Jump", "Each value is the maximum jump length from that index. Return whether the last index is reachable.", "canJump", "nums", [[[[2, 3, 1, 1, 4]], true], [[[3, 2, 1, 0, 4]], false]]),
    q("Minimum Jumps", "Return the minimum jumps needed to reach the last index. Assume it is reachable.", "jump", "nums", [[[[2, 3, 1, 1, 4]], 2], [[[2, 3, 0, 1, 4]], 2]]),
    q("Assign Cookies", "Give each child at most one cookie. Return the most children whose greed can be satisfied.", "findContentChildren", "greed, cookies", [[[[1, 2, 3], [1, 1]], 1], [[[1, 2], [1, 2, 3]], 2]]),
  ],
  Intervals: [
    q("Merge Intervals", "Merge every overlapping interval and return the merged intervals.", "merge", "intervals", [[[[[1, 3], [2, 6], [8, 10], [15, 18]]], [[1, 6], [8, 10], [15, 18]]], [[[[1, 4], [4, 5]]], [[1, 5]]]]),
    q("Insert Interval", "Insert a new interval into sorted, non-overlapping intervals and merge if needed.", "insert", "intervals, newInterval", [[[[[1, 3], [6, 9]], [2, 5]], [[1, 5], [6, 9]]], [[[[1, 2], [3, 5], [6, 7], [8, 10]], [4, 8]], [[1, 2], [3, 10]]]]),
    q("Meeting Rooms", "Return true when a person can attend every meeting without a time conflict.", "canAttendMeetings", "intervals", [[[[[0, 30], [5, 10], [15, 20]]], false], [[[[7, 10], [2, 4]]], true]]),
    q("Meeting Rooms II", "Return the minimum number of rooms needed for all meetings.", "minMeetingRooms", "intervals", [[[[[0, 30], [5, 10], [15, 20]]], 2], [[[[7, 10], [2, 4]]], 1]]),
  ],
  Heaps: [
    q("Kth Largest Value", "Return the kth largest value in an unsorted array.", "findKthLargest", "nums, k", [[[[3, 2, 1, 5, 6, 4], 2], 5], [[[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], 4]]),
    q("Top K Frequent", "Return the k most frequent values. Any order is accepted.", "topKFrequent", "nums, k", [[[[1, 1, 1, 2, 2, 3], 2], [1, 2]], [[[1], 1], [1]]], true),
    q("K Closest Points", "Return the k points closest to the origin. Any result order is accepted.", "kClosest", "points, k", [[[[[1, 3], [-2, 2]], 1], [[-2, 2]]], [[[[3, 3], [5, -1], [-2, 4]], 2], [[3, 3], [-2, 4]]]], true),
    q("Last Stone Weight", "Repeatedly smash the two heaviest stones. Return the final weight, or 0.", "lastStoneWeight", "stones", [[[[2, 7, 4, 1, 8, 1]], 1], [[[1]], 1]]),
  ],
  "Bit Manipulation": [
    q("Single Number", "Every value appears twice except one. Return the value that appears once.", "singleNumber", "nums", [[[[2, 2, 1]], 1], [[[4, 1, 2, 1, 2]], 4]]),
    q("Count Set Bits", "Return the number of 1 bits in the non-negative integer.", "hammingWeight", "n", [[[11, 3], [128, 1]]]),
    q("Count Bits", "For every number from 0 through n, return its number of 1 bits.", "countBits", "n", [[[2, [0, 1, 1]], [5, [0, 1, 1, 2, 1, 2]]]]),
    q("Missing Number", "The array contains distinct values from 0 through n with one value missing. Find it.", "missingNumber", "nums", [[[[3, 0, 1]], 2], [[[0, 1]], 2]]),
  ],
};

function editorStarter(challenge: Challenge) {
  return `function ${challenge.fn}(${challenge.params}) {\n  // Write your solution here\n  return null;\n}`;
}

const runnerSource = `
const stable = (value, unordered) => {
  if (Array.isArray(value)) {
    const items = value.map(item => stable(item, unordered));
    return unordered ? items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : items;
  }
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key], unordered)]));
  return value;
};
self.onmessage = ({ data }) => {
  try {
    const fn = new Function(data.code + '\\n; return typeof ' + data.fn + ' === "function" ? ' + data.fn + ' : null;')();
    if (!fn) throw new Error('Define the requested function: ' + data.fn + '.');
    const details = data.cases.map((test, index) => {
      const actual = fn(...JSON.parse(JSON.stringify(test.args)));
      const pass = JSON.stringify(stable(actual, data.unordered)) === JSON.stringify(stable(test.expected, data.unordered));
      return { pass, label: 'Test ' + (index + 1), actual: JSON.stringify(actual), expected: JSON.stringify(test.expected) };
    });
    self.postMessage({ passed: details.filter(test => test.pass).length, total: details.length, details: details.map(test => test.pass ? test.label + ': passed' : test.label + ': expected ' + test.expected + ', received ' + test.actual) });
  } catch (error) {
    self.postMessage({ passed: 0, total: data.cases.length, details: [], error: error instanceof Error ? error.message : 'Could not run this solution.' });
  }
};`;

export default function PatternTest({ pattern, onClose }: { pattern: string; onClose: () => void }) {
  const questions = useMemo(() => patternTests[pattern] ?? [], [pattern]);
  const [active, setActive] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const expired = timeLeft === 0;
  const challenge = questions[active];
  const code = drafts[active] ?? (challenge ? editorStarter(challenge) : "");

  useEffect(() => { setActive(0); setDrafts({}); setResult(null); setCompleted([]); setTimeLeft(45 * 60); }, [pattern]);
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = window.setInterval(() => setTimeLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [timeLeft]);

  function runInBrowser(): Promise<TestResult> {
    if (!challenge) return Promise.resolve({ passed: 0, total: 0, details: [], error: "No question selected." });
    return new Promise((resolve) => {
      const url = URL.createObjectURL(new Blob([runnerSource], { type: "text/javascript" }));
      const worker = new Worker(url);
      const finish = (result: TestResult) => { window.clearTimeout(timeout); worker.terminate(); URL.revokeObjectURL(url); resolve(result); };
      const timeout = window.setTimeout(() => finish({ passed: 0, total: challenge.cases.length, details: [], error: "Execution timed out. Check for an infinite loop." }), 1800);
      worker.onmessage = (event: MessageEvent<TestResult>) => finish(event.data);
      worker.onerror = () => finish({ passed: 0, total: challenge.cases.length, details: [], error: "The code could not run. Check its syntax and try again." });
      worker.postMessage({ code, fn: challenge.fn, cases: challenge.cases, unordered: challenge.unordered ?? false });
    });
  }

  async function runTests() {
    if (!challenge || running || expired) return;
    setRunning(true); setResult(null);
    let testResult: TestResult;
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, fn: challenge.fn, cases: challenge.cases, unordered: challenge.unordered ?? false }),
        signal: AbortSignal.timeout(9000),
      });
      if (!response.ok) throw new Error("Local Flask runner is unavailable.");
      testResult = await response.json() as TestResult;
    } catch {
      testResult = await runInBrowser();
    }
    setRunning(false);
    setResult(testResult);
    if (testResult.passed === testResult.total && testResult.total > 0) setCompleted((current) => current.includes(active) ? current : [...current, active]);
  }

  function selectQuestion(index: number) { setActive(index); setResult(null); }

  return <div className="pattern-test-backdrop" role="presentation">
    <section className="pattern-test-modal" role="dialog" aria-modal="true" aria-labelledby="pattern-test-title">
      <header className="pattern-test-header"><div><span>DSA PATTERN TEST · {completed.length}/4 COMPLETE</span><h2 id="pattern-test-title">{pattern}</h2></div><div className={`pattern-test-countdown ${timeLeft <= 300 ? "urgent" : ""}`} aria-label={`${Math.floor(timeLeft / 60)} minutes ${timeLeft % 60} seconds remaining`}><Clock3 size={14}/>{String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}</div><button type="button" onClick={onClose} aria-label="Close test"><X size={18}/></button></header>
      <div className="pattern-test-layout">
        <nav className="pattern-test-nav" aria-label="Test questions"><span>FOUR QUESTIONS</span>{questions.map((item, index) => <button type="button" key={item.title} className={active === index ? "active" : ""} onClick={() => selectQuestion(index)}><span>{completed.includes(index) ? <Check size={13}/> : String(index + 1).padStart(2, "0")}</span><b>{item.title}</b><small>{completed.includes(index) ? "PASSED" : "QUESTION"}</small></button>)}<div><strong>JavaScript only</strong><span>Write one function, then run its sample checks.</span></div></nav>
        {challenge && <main className="pattern-test-content">
          <div className="pattern-test-question-head"><div><span>QUESTION {String(active + 1).padStart(2, "0")} / 04</span><h3>{challenge.title}</h3></div><span className="pattern-test-js"><Code2 size={13}/> JS</span></div>
          <p className="pattern-test-prompt">{challenge.prompt}</p>
          <div className="pattern-test-signature"><span>FUNCTION</span><code>{challenge.fn}({challenge.params})</code></div>
          <div className="pattern-editor-shell"><div className="pattern-editor-toolbar"><span><i/> <i/> <i/></span><strong>solution.js</strong><button type="button" onClick={() => { setDrafts((current) => ({ ...current, [active]: editorStarter(challenge) })); setResult(null); }} disabled={expired}><RotateCcw size={12}/> Reset</button></div><textarea aria-label="JavaScript solution editor" spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off" value={code} disabled={expired} onChange={(event) => { setDrafts((current) => ({ ...current, [active]: event.target.value })); setResult(null); }} /></div>
          {expired && <div className="pattern-test-result error" role="status"><strong>Time is up</strong><span>Your 45-minute test window has ended.</span></div>}
          {result && <div className={`pattern-test-result ${result.error ? "error" : result.passed === result.total ? "success" : "incomplete"}`} role="status"><strong>{result.error ?? `${result.passed} of ${result.total} tests passed`}</strong>{result.details.map((detail) => <span key={detail}>{detail}</span>)}</div>}
          <div className="pattern-test-actions"><button className="pattern-test-run" type="button" onClick={runTests} disabled={running || expired}>{running ? "Running…" : expired ? "Test ended" : "Run tests"} <ArrowRight size={14}/></button><div><button type="button" onClick={() => selectQuestion(Math.max(0, active - 1))} disabled={active === 0}><ChevronLeft size={14}/> Previous</button><button type="button" onClick={() => selectQuestion(Math.min(questions.length - 1, active + 1))} disabled={active === questions.length - 1}>Next <ChevronRight size={14}/></button></div></div>
          <div className="pattern-test-cases"><span>SAMPLE INPUTS</span>{challenge.cases.map((test, index) => <div key={index}><code>{JSON.stringify(test.args)}</code><span>→</span><code>{JSON.stringify(test.expected)}</code></div>)}</div>
        </main>}
      </div>
    </section>
  </div>;
}
