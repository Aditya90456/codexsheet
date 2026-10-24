import { useEffect, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Braces, CirclePlay, Pause, RotateCcw, Sparkles } from "lucide-react";

type LessonStep = { active: number[]; pointers: string[]; memory: string[]; title: string; narration: string; codeLine: number };
type Lesson = { id: string; title: string; pattern: string; complexity: string; input: number[]; code: { JavaScript: string[]; Python: string[] }; steps: LessonStep[] };

const lessons: Lesson[] = [
  {
    id: "two-sum", title: "Two Sum", pattern: "Hash map", complexity: "O(n) time · O(n) space", input: [2, 7, 11, 15],
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
    id: "binary-search", title: "Binary Search", pattern: "Divide and conquer", complexity: "O(log n) time · O(1) space", input: [1, 3, 5, 7, 9, 11, 13],
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
    id: "sliding-window", title: "Sliding Window", pattern: "Fixed-size window", complexity: "O(n) time · O(1) space", input: [2, 1, 5, 1, 3, 2],
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
      <div className="dsa-lesson-heading"><span><Sparkles size={13}/> VISUAL LEARNING · INTERACTIVE WALKTHROUGHS</span><h2>See the algorithm <em>think.</em></h2><p>Follow the code, watch the data change, and move at your own pace.</p></div>
      <label className="dsa-lesson-picker"><span>CHOOSE A LESSON</span><select value={lessonId} onChange={(event) => setLessonId(event.target.value)}>{lessons.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.pattern}</option>)}</select></label>
    </header>
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
    <div className="dsa-lesson-footnote"><span><Sparkles size={13}/> Built for learning: every step is visible and reversible.</span><span>{stepIndex + 1} of {lesson.steps.length} <button type="button" onClick={() => setStepIndex((index) => Math.max(0, index - 1))} disabled={stepIndex === 0}><ArrowLeft size={13}/> Previous</button></span></div>
  </section>;
}
