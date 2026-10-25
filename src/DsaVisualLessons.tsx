import { useEffect, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Braces, CirclePlay, Pause, RotateCcw, Sparkles, Target, Lightbulb, TriangleAlert } from "lucide-react";

type LessonStep = { active: number[]; pointers: string[]; memory: string[]; title: string; narration: string; codeLine: number };
type Lesson = { id: string; title: string; pattern: string; complexity: string; input: number[]; code: { JavaScript: string[]; Python: string[] }; steps: LessonStep[]; goal: string; concept: string; whenToUse: string; pitfalls: string[]; practice: string };

const lessons: Lesson[] = [
  {
    id: "two-sum", title: "Two Sum", pattern: "Hash map", complexity: "O(n) time · O(n) space", input: [2, 7, 11, 15], goal: "Find two distinct indices whose values add up to the target.", concept: "Instead of trying every pair, keep a map of values already visited. For each value x, the only partner that can work is target − x. Check whether that complement is in the map, then store x for later. Checking before inserting prevents the current element from matching itself.", whenToUse: "Use a hash map when a problem asks for fast membership, counts, grouping, or a relationship between the current item and something seen earlier.", pitfalls: ["Inserting before checking can reuse the same index when the target is twice the current value.", "Store the information the answer needs: a value alone is not enough when the result asks for indices.", "Account for duplicates; a map may need a count or a list of indices instead of one entry."], practice: "Adapt the pattern to return every unique value pair that sums to a target.",
    code: {
      JavaScript: ["function twoSum(nums, target) {", "  const seen = new Map();", "  for (let i = 0; i < nums.length; i++) {", "    const need = target - nums[i];", "    if (seen.has(need)) return [seen.get(need), i];", "    seen.set(nums[i], i);", "  }", "}", "twoSum([2, 7, 11, 15], 9);"],
      Python: ["def two_sum(nums, target):", "    seen = {}", "    for i, value in enumerate(nums):", "        need = target - value", "        if need in seen:", "            return [seen[need], i]", "        seen[value] = i", "", "two_sum([2, 7, 11, 15], 9)"],
    },
    steps: [
      { active: [0], pointers: ["i = 0"], memory: ["seen = {}"], title: "Start with the first value", narration: "We need two numbers that add to 9. At each index, ask what partner would complete the target.", codeLine: 2 },
      { active: [0], pointers: ["i = 0"], memory: ["need = 9 − 2 = 7", "seen = {}"], title: "Look for its complement", narration: "The current value is 2, so its complement is 7. The map is empty, which means we have not seen that partner yet.", codeLine: 3 },
      { active: [0], pointers: ["i = 0"], memory: ["seen: 2 → index 0", "need 7 is not here"], title: "Remember what we passed", narration: "Store 2 with its index. This lets a later number find its partner in constant time.", codeLine: 5 },
      { active: [1], pointers: ["i = 1"], memory: ["need = 9 − 7 = 2", "seen: 2 → index 0"], title: "The next value completes the pair", narration: "Now the value is 7. Its complement is 2, and 2 is already in the map at index 0.", codeLine: 4 },
      { active: [0, 1], pointers: ["answer = [0, 1]"], memory: ["nums[0] + nums[1] = 2 + 7 = 9"], title: "Return the matching indices", narration: "We found the answer in one pass: indices 0 and 1. Each array value is visited once.", codeLine: 4 },
    ],
  },
  {
    id: "binary-search", title: "Binary Search", pattern: "Divide and conquer", complexity: "O(log n) time · O(1) space", input: [1, 3, 5, 7, 9, 11, 13], goal: "Find a target in sorted data while discarding impossible candidates.", concept: "Maintain a candidate interval that is guaranteed to contain the answer. Inspect its midpoint, then use the ordering to discard one half. The key idea is the invariant: after every boundary update, every possible answer remains inside the range.", whenToUse: "Use binary search on sorted data or on a monotonic yes/no condition, such as the smallest capacity that makes a schedule feasible.", pitfalls: ["Mixing inclusive and exclusive bounds causes off-by-one errors; choose one convention and keep it throughout.", "When moving past mid, use mid + 1 or mid − 1 so the range gets smaller.", "Binary search needs a monotonic property; an unsorted array alone does not qualify."], practice: "Return the first index whose value is greater than or equal to a target, including when the target is absent.",
    code: {
      JavaScript: ["function search(nums, target) {", "  let left = 0, right = nums.length - 1;", "  while (left <= right) {", "    const mid = Math.floor((left + right) / 2);", "    if (nums[mid] === target) return mid;", "    if (nums[mid] < target) left = mid + 1;", "    else right = mid - 1;", "  }", "  return -1;", "}", "search([1, 3, 5, 7, 9, 11, 13], 9);"],
      Python: ["def search(nums, target):", "    left, right = 0, len(nums) - 1", "    while left <= right:", "        mid = (left + right) // 2", "        if nums[mid] == target:", "            return mid", "        if nums[mid] < target:", "            left = mid + 1", "        else:", "            right = mid - 1", "    return -1", "search([1, 3, 5, 7, 9, 11, 13], 9)"],
    },
    steps: [
      { active: [0, 1, 2, 3, 4, 5, 6], pointers: ["left = 0", "right = 6"], memory: ["target = 9"], title: "Start with the full sorted range", narration: "Binary search only works on sorted data. We keep a left and right boundary around the values that could still contain 9.", codeLine: 1 },
      { active: [3], pointers: ["mid = 3"], memory: ["nums[mid] = 7", "7 < 9 → discard left half"], title: "Check the middle value", narration: "The middle value is 7. Since 7 is smaller than 9, every value at or left of the middle can be discarded.", codeLine: 3 },
      { active: [4, 5, 6], pointers: ["left = 4", "right = 6"], memory: ["remaining range = [9, 11, 13]"], title: "Shrink the search range", narration: "Move the left boundary just past the midpoint. The remaining candidates are 9, 11, and 13.", codeLine: 5 },
      { active: [5], pointers: ["mid = 5"], memory: ["nums[mid] = 11", "11 > 9 → discard right half"], title: "Check the new middle", narration: "The new midpoint is 11, which is too large. Discard 11 and everything to its right.", codeLine: 6 },
      { active: [4], pointers: ["mid = 4"], memory: ["nums[4] = 9", "target found at index 4"], title: "Find the target", narration: "The next midpoint is 9, so we return index 4. Each comparison cut the remaining range roughly in half.", codeLine: 4 },
    ],
  },
  {
    id: "sliding-window", title: "Sliding Window", pattern: "Fixed-size window", complexity: "O(n) time · O(1) space", input: [2, 1, 5, 1, 3, 2], goal: "Find the largest sum among all contiguous windows of length three.", concept: "A window represents a contiguous range. When it shifts one position, remove the outgoing value and add the incoming value. Reusing the previous sum avoids recomputing all k values for every window, reducing O(nk) work to O(n).", whenToUse: "Use a fixed window for contiguous ranges of a known size. Use a variable window when the range expands and contracts to satisfy a condition.", pitfalls: ["A window must stay contiguous; this pattern does not select arbitrary subsequences.", "Initialize the first full window before comparing later windows.", "For variable windows, confirm the validity condition is monotonic as the left edge moves; negative values can break common sum-based assumptions."], practice: "Change the walkthrough to find the minimum sum window of length three, then extend it to a variable length with sum at least a target.",
    code: {
      JavaScript: ["function maxWindowSum(nums, k) {", "  let sum = 0;", "  for (let i = 0; i < k; i++) sum += nums[i];", "  let best = sum;", "  for (let right = k; right < nums.length; right++) {", "    sum += nums[right] - nums[right - k];", "    best = Math.max(best, sum);", "  }", "  return best;", "}", "maxWindowSum([2, 1, 5, 1, 3, 2], 3);"],
      Python: ["def max_window_sum(nums, k):", "    window = sum(nums[:k])", "    best = window", "    for right in range(k, len(nums)):", "        window += nums[right] - nums[right - k]", "        best = max(best, window)", "    return best", "max_window_sum([2, 1, 5, 1, 3, 2], 3)"],
    },
    steps: [
      { active: [0, 1, 2], pointers: ["window = [0…2]"], memory: ["sum = 2 + 1 + 5 = 8", "best = 8"], title: "Build the first window", narration: "We want the largest sum of 3 consecutive values. Add the first three once to create our starting window.", codeLine: 2 },
      { active: [1, 2, 3], pointers: ["window = [1…3]"], memory: ["remove 2", "add 1", "sum = 7", "best = 8"], title: "Slide one place to the right", narration: "When the window moves, subtract the value that left and add the new value that entered. No need to sum all three again.", codeLine: 5 },
      { active: [2, 3, 4], pointers: ["window = [2…4]"], memory: ["remove 1", "add 3", "sum = 9", "best = 9"], title: "Update the best sum", narration: "The new window totals 9, which beats our previous best of 8. Save the improved answer.", codeLine: 6 },
      { active: [3, 4, 5], pointers: ["window = [3…5]"], memory: ["remove 5", "add 2", "sum = 6", "best = 9"], title: "Finish in one pass", narration: "The last window totals 6, so the best stays 9. Reusing each sum keeps the scan linear.", codeLine: 7 },
    ],
  },
  {
    id: "two-pointers", title: "Two Pointers", pattern: "Sorted arrays", complexity: "O(n) time · O(1) space", input: [1, 2, 4, 6, 8], goal: "Find two values in a sorted array that add up to 10.", concept: "Start one pointer at each end of the sorted array. If the sum is too small, move the left pointer right to increase it; if it is too large, move the right pointer left to decrease it. Each move rules out a set of pairs, so both pointers only travel across the array once.", whenToUse: "Use opposing pointers for pair or partition questions on sorted data. Use same-direction pointers for in-place compaction, deduplication, or merging.", pitfalls: ["The sorted order is what makes each pointer move safe; without it, moving a pointer can skip a valid answer.", "Move a pointer after every unsuccessful comparison to guarantee progress.", "Check whether the problem asks for values, indices, unique pairs, or all pairs; each has different duplicate handling."], practice: "Return all unique pairs whose sum is 10, even when the array contains duplicate values.",
    code: {
      JavaScript: ["function pairSum(nums, target) {", "  let left = 0, right = nums.length - 1;", "  while (left < right) {", "    const sum = nums[left] + nums[right];", "    if (sum === target) return [left, right];", "    if (sum < target) left++;", "    else right--;", "  }", "  return [];", "}", "pairSum([1, 2, 4, 6, 8], 10);"],
      Python: ["def pair_sum(nums, target):", "    left, right = 0, len(nums) - 1", "    while left < right:", "        total = nums[left] + nums[right]", "        if total == target:", "            return [left, right]", "        if total < target:", "            left += 1", "        else:", "            right -= 1", "    return []", "pair_sum([1, 2, 4, 6, 8], 10)"],
    },
    steps: [
      { active: [0, 4], pointers: ["left = 0", "right = 4"], memory: ["1 + 8 = 9", "9 < 10 → move left"], title: "Compare the outside values", narration: "The array is sorted. The smallest and largest values total 9, which is too small, so no pair using 1 can reach 10 with a value to its right.", codeLine: 5 },
      { active: [1, 4], pointers: ["left = 1", "right = 4"], memory: ["2 + 8 = 10", "target found"], title: "Move the left pointer", narration: "Move left to 2. The sum is now exactly 10, so these two indices are the answer.", codeLine: 4 },
    ],
  },
  {
    id: "stack", title: "Stack", pattern: "Last in, first out", complexity: "O(n) time · O(n) space", input: [40, 30, 20, 10], goal: "Reverse a sequence by pushing each value and popping them back out.", concept: "A stack only exposes its top. Push adds an item there; pop removes that same item. Because the newest item leaves first (LIFO), pushing a sequence and then popping it naturally reverses the order.", whenToUse: "Use a stack for nested structures, undo history, expression parsing, depth-first search, and problems involving the most recent unmatched item.", pitfalls: ["Check for an empty stack before reading or popping its top.", "The top changes after each push or pop; update it before reasoning about the next operation.", "A stack is not a queue: it cannot efficiently remove the oldest item."], practice: "Use a stack to check whether a string of parentheses and brackets is correctly nested.",
    code: {
      JavaScript: ["function reverse(values) {", "  const stack = [];", "  for (const value of values) stack.push(value);", "  const result = [];", "  while (stack.length) result.push(stack.pop());", "  return result;", "}", "reverse([40, 30, 20, 10]);"],
      Python: ["def reverse(values):", "    stack = []", "    for value in values:", "        stack.append(value)", "    result = []", "    while stack:", "        result.append(stack.pop())", "    return result", "reverse([40, 30, 20, 10])"],
    },
    steps: [
      { active: [0, 1, 2, 3], pointers: ["push each value"], memory: ["stack = [40, 30, 20, 10]", "top = 10"], title: "Push values onto the stack", narration: "Each new value goes on top. The last value pushed is now the first one available to remove.", codeLine: 2 },
      { active: [3], pointers: ["top → 10"], memory: ["pop 10", "result = [10]"], title: "Pop the top value", narration: "Remove 10 first, even though it was added last. This last-in, first-out rule creates the reversed order.", codeLine: 4 },
      { active: [2], pointers: ["top → 20"], memory: ["pop 20", "result = [10, 20]"], title: "Continue until empty", narration: "The next top is 20. Repeat until every item has moved to the result.", codeLine: 4 },
      { active: [0, 1, 2, 3], pointers: ["stack = empty"], memory: ["result = [10, 20, 30, 40]"], title: "Read the reversed sequence", narration: "The stack is empty and the result is reversed. Each value was pushed once and popped once.", codeLine: 5 },
    ],
  },
];

function renderCodeLine(line: string, language: "JavaScript" | "Python") {
  const tokenPattern = /(\/\/.*|#.*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:function|return|const|let|var|new|for|while|if|else|in|def|range|True|False|null|None)\b)|(\b\d+\b)|(\b(?:console|Math|Map|len|sum|enumerate|max|min)\b)/g;
  const parts: Array<{ text: string; kind: string }> = [];
  let cursor = 0;
  for (const match of line.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ text: line.slice(cursor, index), kind: "" });
    const kind = match[1] ? "comment" : match[2] ? "string" : match[3] ? "keyword" : match[4] ? "number" : "builtin";
    parts.push({ text: match[0], kind });
    cursor = index + match[0].length;
  }
  if (cursor < line.length) parts.push({ text: line.slice(cursor), kind: "" });
  return parts.map((part, index) => <span className={part.kind ? `syntax-${part.kind}` : undefined} key={`${language}-${index}`}>{part.text}</span>);
}

export default function DsaVisualLessons() {
  const [lessonId, setLessonId] = useState(lessons[0].id);
  const [language, setLanguage] = useState<"JavaScript" | "Python">("JavaScript");
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lesson = lessons.find((item) => item.id === lessonId) ?? lessons[0];
  const step = lesson.steps[stepIndex];

  useEffect(() => { setStepIndex(0); setPlaying(false); }, [lessonId]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStepIndex((index) => {
      if (index >= lesson.steps.length - 1) { setPlaying(false); return index; }
      return index + 1;
    }), 3600);
    return () => window.clearInterval(timer);
  }, [lesson.steps.length, playing]);

  return <section className="dsa-lesson" aria-label="Visual DSA lesson">
    <header className="dsa-lesson-header">
      <div className="dsa-lesson-heading"><span><BookOpen size={13}/> DSA COURSE · CONCEPTS, VISUALS, PRACTICE</span><h2>Learn the pattern. <em>See it work.</em></h2><p>Work through each topic with a goal, a step-by-step trace, complexity notes, common pitfalls, and a practice challenge.</p></div>
      <label className="dsa-lesson-picker"><span>COURSE TOPIC · {lessons.findIndex((item) => item.id === lessonId) + 1} OF {lessons.length}</span><select value={lessonId} onChange={(event) => setLessonId(event.target.value)}>{lessons.map((item, index) => <option key={item.id} value={item.id}>{String(index + 1).padStart(2, "0")} · {item.title}</option>)}</select></label>
    </header>
    <div className="dsa-course-outline" aria-label="Course topics">{lessons.map((item, index) => <button type="button" key={item.id} className={item.id === lessonId ? "active" : index < lessons.findIndex((entry) => entry.id === lessonId) ? "complete" : ""} onClick={() => setLessonId(item.id)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><small>{item.pattern}</small></button>)}</div>
    <section className="dsa-course-goal"><Target size={16}/><div><span>LESSON GOAL</span><strong>{lesson.goal}</strong></div><span className="dsa-course-complexity">{lesson.complexity}</span></section>
    <div className="dsa-lesson-meta"><span><BookOpen size={13}/>{lesson.pattern}</span><span>{lesson.complexity}</span><label>CODE<select value={language} onChange={(event) => setLanguage(event.target.value as "JavaScript" | "Python")}><option>JavaScript</option><option>Python</option></select></label></div>
    <div className="dsa-lesson-grid">
      <section className="dsa-lesson-visual" aria-live="polite">
        <div className="dsa-lesson-visual-top"><span>LIVE TRACE <i/> STEP {String(stepIndex + 1).padStart(2, "0")} / {String(lesson.steps.length).padStart(2, "0")}</span><span>INPUT ARRAY</span></div>
        <div className="dsa-lesson-array" style={{ "--lesson-array-size": lesson.input.length } as CSSProperties & { "--lesson-array-size": number }}>
          <div className="dsa-lesson-loop-pointer" style={{ left: `${((step.active[0] + 0.5) / lesson.input.length) * 100}%` }}><span>LOOP POINTER</span><strong>{step.pointers[0]}</strong><i/></div>
          {lesson.input.map((value, index) => <div key={`${lesson.id}-${index}`} className={`dsa-lesson-cell${step.active.includes(index) ? " active" : ""}`}><small>index {index}</small><strong>{value}</strong><span>{step.active.includes(index) ? "in focus" : ""}</span></div>)}
        </div>
        <div className="dsa-lesson-state"><div><span>ALGORITHM STATE</span><strong>{step.title}</strong><p>{step.narration}</p></div><div className="dsa-lesson-memory"><span>VARIABLES &amp; MEMORY</span>{step.memory.map((item) => <code key={item}>{item}</code>)}</div></div>
        <div className="dsa-lesson-progress">{lesson.steps.map((item, index) => <button key={item.title} type="button" aria-label={`Go to step ${index + 1}: ${item.title}`} className={index === stepIndex ? "active" : index < stepIndex ? "complete" : ""} onClick={() => { setPlaying(false); setStepIndex(index); }}/>)}</div>
        <div className="dsa-lesson-controls"><button type="button" className="dsa-lesson-reset" onClick={() => { setPlaying(false); setStepIndex(0); }} aria-label="Restart lesson"><RotateCcw size={15}/></button><button type="button" onClick={() => { setPlaying((value) => !value); if (stepIndex === lesson.steps.length - 1) setStepIndex(0); }}>{playing ? <Pause size={15}/> : <CirclePlay size={15}/>} {playing ? "Pause" : "Play walkthrough"}</button><button type="button" onClick={() => { setPlaying(false); setStepIndex((index) => Math.min(lesson.steps.length - 1, index + 1)); }} disabled={stepIndex === lesson.steps.length - 1}>Next step <ArrowRight size={14}/></button></div>
      </section>
      <section className="dsa-lesson-code" aria-label={`${language} walkthrough code`}>
        <div className="dsa-editor-titlebar"><span className="dsa-editor-dots"><i/><i/><i/></span><strong><Braces size={12}/> CODEXSHEET DSA LAB</strong><span>EXPLORER</span></div>
        <div className="dsa-lesson-code-head"><span><i/>{lesson.title.toLowerCase().replace(/ /g, "-")}.{language === "Python" ? "py" : "js"}</span><span>READ ONLY · STEP {stepIndex + 1}</span></div>
        <pre>{lesson.code[language].map((line, index) => <span className={index === step.codeLine ? "active" : ""} key={`${index}-${line}`}><i>{index === step.codeLine ? "›" : ""}</i><b>{String(index + 1).padStart(2, "0")}</b><code>{renderCodeLine(line || " ", language)}</code></span>)}</pre>
        <div className="dsa-lesson-code-foot"><span><span/> The highlighted line is running now</span><span>{lesson.complexity}</span></div>
      </section>
    </div>
    <section className="dsa-course-notes" aria-label={`${lesson.title} course notes`}>
      <article><span><Lightbulb size={14}/> THE IDEA</span><p>{lesson.concept}</p></article>
      <article><span><BookOpen size={14}/> WHEN TO USE IT</span><p>{lesson.whenToUse}</p></article>
      <article><span><TriangleAlert size={14}/> COMMON PITFALLS</span><ul>{lesson.pitfalls.map((item) => <li key={item}>{item}</li>)}</ul></article>
      <article className="dsa-course-practice"><span><Target size={14}/> PRACTICE CHALLENGE</span><p>{lesson.practice}</p></article>
    </section>
    <div className="dsa-lesson-footnote"><span><Sparkles size={13}/> Built for learning: every step is visible and reversible.</span><span>{stepIndex + 1} of {lesson.steps.length} <button type="button" onClick={() => setStepIndex((index) => Math.max(0, index - 1))} disabled={stepIndex === 0}><ArrowLeft size={13}/> Previous</button></span></div>
  </section>;
}
