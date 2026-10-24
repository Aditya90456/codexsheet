import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Code2, Pause, Play, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import DsaVisualLessons from "./DsaVisualLessons";

type Language = "JavaScript" | "Python" | "Java" | "C++";
type Problem = { number: number; title: string; pattern: string; difficulty: "Easy" | "Medium" | "Hard"; link?: string };
type TraceStep = { index: number; value: number; variable: string; arrayName: string; logic: string; memory: string[] };
type FlowStep = { line: number | null; source: string; title: string; detail: string; kind: "call" | "function" | "array" | "loop" | "branch" | "return" | "statement" | "error" };
type TreeNode = { id: number; value: number; depth: number; x: number; left: number | null; right: number | null };
type InvokeError = { message: string; context?: Response };
const runtimes: Record<Language, string> = { JavaScript: "javascript", Python: "python", Java: "java", "C++": "c++" };
const starters: Record<Language, string> = {
  JavaScript: `function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}\nconsole.log(twoSum([2, 7, 11, 15], 9));`,
  Python: `def two_sum(nums, target):\n    seen = {}\n    for i, value in enumerate(nums):\n        need = target - value\n        if need in seen:\n            return [seen[need], i]\n        seen[value] = i\n    return []\nprint(two_sum([2, 7, 11, 15], 9))`,
  Java: `class Main {\n  public static void main(String[] args) {\n    int[] nums = {2, 7, 11, 15};\n    for (int i = 0; i < nums.length; i++) {\n      System.out.println(nums[i]);\n    }\n  }\n}`,
  "C++": `#include <iostream>\nusing namespace std;\nint main() {\n  int nums[] = {2, 7, 11, 15};\n  for (int i = 0; i < 4; i++) {\n    cout << nums[i] << endl;\n  }\n  return 0;\n}`,
};

function codeTokenClass(token: string, language: Language) {
  if (/^(?:\/\/|#)/.test(token)) return "comment";
  if (/^(?:"|')/.test(token)) return "string";
  if (/^\d/.test(token)) return "number";
  if (/^[+\-*\/%=<>!&|]+$/.test(token)) return "operator";
  if (/^[{}()[\].,;:]$/.test(token)) return "punctuation";
  const keywords = language === "Python" ? /^(?:def|return|for|in|if|else|elif|while|class|import|from|as|and|or|not|True|False|None|pass|break|continue|yield|with|lambda)$/ : /^(?:function|return|for|of|in|if|else|while|class|new|const|let|var|true|false|null|undefined|import|from|public|private|static|void|int|long|double|float|using|namespace|include|bool|auto|this|throw|try|catch)$/;
  if (keywords.test(token)) return "keyword";
  if (/^[A-Z][A-Z0-9_]*$/.test(token)) return "constant";
  if (/^[A-Za-z_$][\w$]*$/.test(token)) return "identifier";
  return "";
}

function renderHighlightedCode(source: string, language: Language) {
  const tokenPattern = /(\/\/.*|#.*|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|[+\-*\/%=<>!&|]+|[{}()[\].,;:]|\s+|.)/g;
  return source.split("\n").map((line, lineIndex) => <span className="dsa-live-highlight-line" key={lineIndex}>{Array.from(line.matchAll(tokenPattern), (match, index) => {
    const token = match[0];
    const tokenClass = codeTokenClass(token, language);
    return tokenClass ? <span className={`tok-${tokenClass}`} key={index}>{token}</span> : token;
  })}{lineIndex < source.split("\n").length - 1 ? "\n" : ""}</span>);
}

function starterFor(language: Language, problem: Problem | undefined) {
  if (!problem || problem.number === 1) return starters[language];
  const comment = language === "Python" ? `# ${problem.title}\n` : `// ${problem.title}\n`;
  if (language === "Python") return `${comment}def solution(data):\n    # Write your solution here\n    pass\n`;
  if (language === "JavaScript") return `${comment}function solution(data) {\n  // Write your solution here\n  return null;\n}\n`;
  if (language === "Java") return `${comment}class Solution {\n  public Object solve(int[] data) {\n    // Write your solution here\n    return null;\n  }\n}`;
  return `${comment}#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n  int solve(vector<int>& data) {\n    // Write your solution here\n    return 0;\n  }\n};`;
}

function evaluateNumber(expression: string): number | null {
  const normalized = expression.trim();
  if (!/^[\d\s.+\-*/()%]+$/.test(normalized)) return null;
  try {
    const value = Function(`"use strict"; return (${normalized});`)();
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch { return null; }
}

function evaluateCondition(condition: string, array: string, index: number, value: number, indexVariable: string, targetName: string, target: number | null) {
  let resolved = condition.replace(new RegExp(`${array}\\s*\\[\\s*${indexVariable}\\s*\\]`, "g"), String(value));
  resolved = resolved.replace(new RegExp(`\\b${indexVariable}\\b`, "g"), String(index));
  if (target !== null && targetName) resolved = resolved.replace(new RegExp(`\\b${targetName}\\b`, "g"), String(target));
  const comparison = resolved.match(/^\s*(.+?)\s*(===|!==|==|!=|<=|>=|<|>)\s*(.+?)\s*$/);
  if (!comparison) return { resolved, result: null as boolean | null };
  const left = evaluateNumber(comparison[1]);
  const right = evaluateNumber(comparison[3]);
  if (left === null || right === null) return { resolved, result: null as boolean | null };
  const [, , operator] = comparison;
  const result = operator === "===" || operator === "==" ? left === right
    : operator === "!==" || operator === "!=" ? left !== right
      : operator === "<" ? left < right : operator === ">" ? left > right
        : operator === "<=" ? left <= right : left >= right;
  return { resolved, result };
}

function traceArithmetic(source: string, array: string, index: number, value: number, indexVariable: string, targetName: string, target: number | null, valueVariable?: string) {
  const calculations: string[] = [];
  const assigned = new Map<string, number>();
  const expressionPattern = /(?:\b(?:const|let|var|int|long|double|float)\s+)?([A-Za-z_]\w*)\s*=\s*([^;\n]+)|\breturn\s+([^;\n]+)/g;
  for (const line of source.split("\n")) {
    const text = line.trim();
    if (!text || /^(?:for|if|while)\b/.test(text)) continue;
    for (const match of text.matchAll(expressionPattern)) {
      const variable = match[1];
      const rawExpression = match[2] ?? match[3] ?? "";
      if (!/[+*/%]|(?<![=<>!])-(?![=>])/.test(rawExpression)) continue;
      let resolved = rawExpression.replace(new RegExp(`${array}\\s*\\[\\s*${indexVariable}\\s*\\]`, "g"), String(value));
      resolved = resolved.replace(new RegExp(`\\b${indexVariable}\\b`, "g"), String(index));
      if (valueVariable) resolved = resolved.replace(new RegExp(`\\b${valueVariable}\\b`, "g"), String(value));
      if (target !== null && targetName) resolved = resolved.replace(new RegExp(`\\b${targetName}\\b`, "g"), String(target));
      for (const [name, assignedValue] of assigned) resolved = resolved.replace(new RegExp(`\\b${name}\\b`, "g"), String(assignedValue));
      const result = evaluateNumber(resolved);
      if (result === null) continue;
      calculations.push(`${variable ? `${variable} = ` : "return "}${resolved.trim()} = ${result}`);
      if (variable) assigned.set(variable, result);
    }
  }
  return calculations;
}

function buildSourceFlow(source: string): FlowStep[] {
  const lines = source.split("\n");
  const headerIndex = lines.findIndex((line) => /\b(?:function|def)\s+([A-Za-z_]\w*)\s*\(/.test(line));
  const header = headerIndex >= 0 ? lines[headerIndex].match(/\b(?:function|def)\s+([A-Za-z_]\w*)\s*\(/)?.[1] : null;
  const events: FlowStep[] = [];
  let bodyIndices: number[] = [];
  if (headerIndex >= 0 && header) {
    if (lines[headerIndex].includes("{")) {
      let depth = 0;
      for (let i = headerIndex; i < lines.length; i++) {
        depth += (lines[i].match(/{/g) ?? []).length - (lines[i].match(/}/g) ?? []).length;
        if (i > headerIndex && depth > 0) bodyIndices.push(i);
        if (i > headerIndex && depth <= 0) break;
      }
    } else {
      const baseIndent = lines[headerIndex].match(/^\s*/)?.[0].length ?? 0;
      for (let i = headerIndex + 1; i < lines.length; i++) {
        if (lines[i].trim() && (lines[i].match(/^\s*/)?.[0].length ?? 0) <= baseIndent) break;
        bodyIndices.push(i);
      }
    }
    const callIndex = lines.findIndex((line, index) => index !== headerIndex && new RegExp(`\\b${header}\\s*\\(`).test(line));
    if (callIndex >= 0) events.push({ line: callIndex + 1, source: lines[callIndex].trim(), title: `Call ${header}`, detail: "Execution enters this function with the supplied arguments.", kind: "call" });
    events.push({ line: null, source: header, title: `Enter ${header}`, detail: "Create a new function scope and bind its parameters.", kind: "function" });
    for (const lineIndex of bodyIndices) {
      const text = lines[lineIndex].trim();
      if (!text || /^[{}]+$/.test(text) || text.startsWith("//") || text.startsWith("#")) continue;
      const kind = /\bif\s*\(|\bif\s+/.test(text) ? "branch" : /\bfor\b|\bwhile\b/.test(text) ? "loop" : /\breturn\b/.test(text) ? "return" : /(?:=\s*\[|=\s*\{)/.test(text) ? "array" : "statement";
      const title = kind === "branch" ? "Check a condition" : kind === "loop" ? "Repeat a loop" : kind === "return" ? "Return a value" : kind === "array" ? "Create or update data" : "Run this statement";
      const detail = kind === "branch" ? "The selected branch depends on the current variable values." : kind === "loop" ? "The loop body repeats while its condition stays true." : kind === "array" ? "Update the function’s working data." : kind === "return" ? "Send the computed result back to the caller." : "This statement changes or reads the current function state.";
      events.push({ line: lineIndex + 1, source: text, title, detail, kind });
    }
    if (!bodyIndices.some((index) => /\breturn\b/.test(lines[index]))) events.push({ line: null, source: "undefined", title: "Function reaches its end", detail: "No return statement was found, so this call produces undefined (or None).", kind: "error" });
  }
  if (!events.length) {
    for (let index = 0; index < lines.length; index++) {
      const text = lines[index].trim();
      if (!text || /^[{}]+$/.test(text) || text.startsWith("//") || text.startsWith("#")) continue;
      const kind = /\bif\s*\(|\bif\s+/.test(text) ? "branch" : /\bfor\b|\bwhile\b/.test(text) ? "loop" : /\breturn\b/.test(text) ? "return" : /(?:=\s*\[|=\s*\{)/.test(text) ? "array" : "statement";
      events.push({ line: index + 1, source: text, title: kind === "branch" ? "Check a condition" : kind === "loop" ? "Repeat a loop" : kind === "array" ? "Create or update data" : "Run this statement", detail: "Source line selected for the live code walkthrough.", kind });
    }
  }
  return events;
}

function buildBst(values: number[]): TreeNode[] {
  type MutableNode = { id: number; value: number; depth: number; left: MutableNode | null; right: MutableNode | null };
  let root: MutableNode | null = null;
  let nextId = 0;
  for (const value of values) {
    const insert = (node: MutableNode | null, depth: number): MutableNode => {
      if (!node) return { id: nextId++, value, depth, left: null, right: null };
      if (value < node.value) node.left = insert(node.left, depth + 1);
      else node.right = insert(node.right, depth + 1);
      return node;
    };
    root = insert(root, 0);
  }
  const ordered: MutableNode[] = [];
  const walk = (node: MutableNode | null) => { if (!node) return; walk(node.left); ordered.push(node); walk(node.right); };
  walk(root);
  const xById = new Map(ordered.map((node, index) => [node.id, ((index + 1) / (ordered.length + 1)) * 1000]));
  const nodes: TreeNode[] = [];
  const flatten = (node: MutableNode | null) => {
    if (!node) return;
    nodes.push({ id: node.id, value: node.value, depth: node.depth, x: xById.get(node.id) ?? 500, left: node.left?.id ?? null, right: node.right?.id ?? null });
    flatten(node.left); flatten(node.right);
  };
  flatten(root);
  return nodes;
}

function traceCode(source: string) {
  const declared = source.match(/(?:\b(?:const|let|var)\s+)?([A-Za-z_]\w*)\s*=\s*\[([^\]]*)\]/)
    ?? source.match(/\b(?:int|long|double|float)\s+\[\s*\]\s*([A-Za-z_]\w*)\s*=\s*\{([^}]*)\}/)
    ?? source.match(/\b(?:int|long|double|float)\s+([A-Za-z_]\w*)\s*\[\s*\]\s*=\s*\{([^}]*)\}/);
  const inline = source.match(/\b[A-Za-z_]\w*\s*\(\s*\[([^\]]*)\]\s*,\s*(-?\d+)/);
  const raw = inline?.[1] ?? declared?.[declared.length - 1];
  if (raw === undefined) return { steps: [] as TraceStep[], values: [] as number[], message: "Add a numeric array to see it move." };
  const arrayItems = raw.split(",").map((value) => value.trim()).filter(Boolean);
  if (!arrayItems.length || arrayItems.some((value) => !Number.isFinite(Number(value)))) return { steps: [] as TraceStep[], values: [] as number[], message: "Live tracing supports numeric array values." };
  const array = inline ? source.match(/(?:function\s+\w+|def\s+\w+)\s*\(\s*([A-Za-z_]\w*)/)?.[1] ?? "nums" : declared?.[1] ?? "nums";
  const values = arrayItems.map(Number);
  const target = inline?.[2] === undefined ? null : Number(inline[2]);
  const parameters = source.match(/(?:function\s+\w+|def\s+\w+)\s*\(([^)]*)\)/)?.[1]?.split(",").map((item) => item.trim().replace(/\s*=.*$/, "")) ?? [];
  const targetName = parameters[1] ?? "target";
  const hashMapName = source.match(/(?:const|let|var)?\s*([A-Za-z_]\w*)\s*=\s*new\s+Map\s*\(/)?.[1]
    ?? source.match(/([A-Za-z_]\w*)\s*=\s*\{\s*\}/)?.[1]
    ?? source.match(/\.has\s*\(/)?.[0]?.split(".")[0]
    ?? null;
  if (target !== null && hashMapName && /target\s*-\s*(?:[A-Za-z_]\w*\s*\[|[A-Za-z_]\w*)/.test(source) && /\.has\s*\(|\bin\s+[A-Za-z_]\w*/.test(source)) {
    const seen = new Map<number, number>();
    const steps: TraceStep[] = [];
    for (let index = 0; index < values.length; index++) {
      const value = values[index];
      const need = target - value;
      const previous = seen.get(need);
      if (previous !== undefined) {
        steps.push({ index, value, variable: `i = ${index}`, arrayName: array, logic: `need = ${target} − ${value} = ${need}; ${hashMapName}.has(${need}) is true`, memory: [`${hashMapName} = { ${[...seen].map(([key, at]) => `${key}: ${at}`).join(", ")} }`, `return [${previous}, ${index}]`] });
        break;
      }
      seen.set(value, index);
      steps.push({ index, value, variable: `i = ${index}`, arrayName: array, logic: `need = ${target} − ${value} = ${need}; ${hashMapName}.has(${need}) is false → save current value`, memory: [`${hashMapName} = { ${[...seen].map(([key, at]) => `${key}: ${at}`).join(", ")} }`] });
    }
    return { steps, values, message: "" };
  }
  const name = array.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const indexLoop = source.match(new RegExp(`for\\s*\\(\\s*(?:(?:let|const|var|int|long)\\s+)?([A-Za-z_]\\w*)\\s*=\\s*0\\s*;\\s*\\1\\s*<\\s*(?:${name}\\.length|${values.length})\\s*;\\s*\\1\\s*(?:\\+\\+|\\+=\\s*1)\\s*\\)`, "i"));
  const pythonLoop = source.match(new RegExp(`for\\s+([A-Za-z_]\\w*)\\s+in\\s+range\\s*\\(\\s*(?:len\\s*\\(\\s*${name}\\s*\\)|${values.length})\\s*\\)\\s*:`, "i"));
  const enumerateLoop = source.match(new RegExp(`for\\s+([A-Za-z_]\\w*)\\s*,\\s*([A-Za-z_]\\w*)\\s+in\\s+enumerate\\s*\\(\\s*${name}\\s*\\)\\s*:`, "i"));
  const eachLoop = source.match(new RegExp(`for\\s*\\(\\s*(?:(?:const|let|var)\\s+)?([A-Za-z_]\\w*)\\s+of\\s+${name}\\s*\\)|for\\s+([A-Za-z_]\\w*)\\s+in\\s+${name}\\s*:`, "i"));
  const indexVariable = indexLoop?.[1] ?? pythonLoop?.[1];
  const branchCondition = source.match(/\bif\s*\(([^)]+)\)|\bif\s+([^:\n]+):/)?.[1] ?? source.match(/\bif\s*\(([^)]+)\)|\bif\s+([^:\n]+):/)?.[2] ?? "";
  if (indexVariable) return { steps: values.map((value, index) => {
    const branch = branchCondition ? evaluateCondition(branchCondition, array, index, value, indexVariable, targetName, target) : null;
    const decision = branch ? `Condition ${branch.resolved}${branch.result === null ? " → evaluate this branch" : ` → ${branch.result ? "true" : "false"}`}.` : "No conditional branch found in this loop body.";
    const calculations = traceArithmetic(source, array, index, value, indexVariable, targetName, target);
    return { index, value, variable: `${indexVariable} = ${index}`, arrayName: array, logic: `Read ${array}[${index}] = ${value}. ${calculations.join("; ") || decision}`, memory: [`${indexVariable} = ${index}`, `${array}[${index}] = ${value}`, ...calculations, ...(target !== null ? [`${targetName} = ${target}`] : [])] };
  }), values, message: "" };
  if (enumerateLoop) return { steps: values.map((value, index) => {
    const branch = branchCondition ? evaluateCondition(branchCondition, array, index, value, enumerateLoop[1], targetName, target) : null;
    const decision = branch ? `Condition ${branch.resolved}${branch.result === null ? " → evaluate this branch" : ` → ${branch.result ? "true" : "false"}`}.` : "No conditional branch found in this loop body.";
    const calculations = traceArithmetic(source, array, index, value, enumerateLoop[1], targetName, target, enumerateLoop[2]);
    return { index, value, variable: `${enumerateLoop[1]} = ${index} · ${enumerateLoop[2]} = ${value}`, arrayName: array, logic: `Read ${array}[${index}] = ${value}. ${calculations.join("; ") || decision}`, memory: [`${enumerateLoop[1]} = ${index}`, `${enumerateLoop[2]} = ${value}`, ...calculations, ...(target !== null ? [`${targetName} = ${target}`] : [])] };
  }), values, message: "" };
  const eachVariable = eachLoop?.[1] ?? eachLoop?.[2];
  if (eachVariable) return { steps: values.map((value, index) => { const calculations = traceArithmetic(source, array, index, value, eachVariable, targetName, target); return { index, value, variable: `${eachVariable} = ${value}`, arrayName: array, logic: `Visit ${array}[${index}] = ${value}. ${calculations.join("; ") || "Move to the next element."}`, memory: [`${eachVariable} = ${value}`, ...calculations] }; }), values, message: "" };
  return { steps: [] as TraceStep[], values, message: "Array found. Add a simple indexed or for-each loop to animate it." };
}

export default function DsaCodingWorkspace({ problems, userId }: { problems: Problem[]; userId: string | null }) {
  const [tab, setTab] = useState<"code" | "lessons">("code");
  const [structure, setStructure] = useState<"array" | "linked-list" | "bst" | "stack" | "queue" | "hash-map" | "graph">("array");
  const [language, setLanguage] = useState<Language>("JavaScript");
  const [problemNumber, setProblemNumber] = useState(1);
  const [code, setCode] = useState(starters.JavaScript);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const trace = useMemo(() => traceCode(code), [code]);
  const sourceFlow = useMemo(() => buildSourceFlow(code), [code]);
  const playbackLength = trace.steps.length || sourceFlow.length;
  const problem = problems.find((item) => item.number === problemNumber) ?? problems[0];
  const lineCount = code.split("\n").length;
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = `codexsheet-live-code:${userId ?? "local"}:${problemNumber}:${language}`;
    try { setCode(localStorage.getItem(key) ?? starterFor(language, problem)); } catch { setCode(starterFor(language, problem)); }
    setStep(0); setPlaying(true);
  }, [language, problemNumber, userId]);
  useEffect(() => {
    if (!playing || playbackLength < 2) return;
    const timer = window.setInterval(() => setStep((current) => {
      if (current >= playbackLength - 1) { setPlaying(false); return current; }
      return current + 1;
    }), 850);
    return () => window.clearInterval(timer);
  }, [playing, playbackLength]);

  function editCode(value: string) {
    setCode(value); setStep(0); setPlaying(true);
    try { localStorage.setItem(`codexsheet-live-code:${userId ?? "local"}:${problemNumber}:${language}`, value); } catch { /* browser storage is optional */ }
  }
  function handleEditorKeyDown(event: { currentTarget: HTMLTextAreaElement; key: string; preventDefault: () => void }) {
    const editor = event.currentTarget;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const insert = (text: string, cursorOffset = text.length) => {
      event.preventDefault();
      const updated = `${code.slice(0, start)}${text}${code.slice(end)}`;
      editCode(updated);
      requestAnimationFrame(() => { editor.focus(); editor.setSelectionRange(start + cursorOffset, start + cursorOffset); });
    };
    if (event.key === "Tab") { insert("  "); return; }
    if (event.key === "Enter") {
      const beforeCursor = code.slice(0, start);
      const currentLine = beforeCursor.slice(beforeCursor.lastIndexOf("\n") + 1);
      const indent = currentLine.match(/^\s*/)?.[0] ?? "";
      const extraIndent = /[({\[]\s*$/.test(beforeCursor) ? "  " : "";
      insert(`\n${indent}${extraIndent}`); return;
    }
    const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}", "\"": "\"", "'": "'" };
    if (pairs[event.key] && start === end) {
      insert(`${event.key}${pairs[event.key]}`, 1); return;
    }
    if ([")", "]", "}"].includes(event.key) && code[start] === event.key) {
      event.preventDefault(); editor.setSelectionRange(start + 1, start + 1);
    }
  }
  function syncEditorScroll() {
    const editor = editorRef.current;
    if (!editor) return;
    if (highlightRef.current) { highlightRef.current.scrollTop = editor.scrollTop; highlightRef.current.scrollLeft = editor.scrollLeft; }
    if (gutterRef.current) gutterRef.current.scrollTop = editor.scrollTop;
  }
  const bstNodes = useMemo(() => buildBst(trace.values), [trace.values]);
  const treeHeight = Math.max(1, ...bstNodes.map((node) => node.depth + 1));

  return <main className="dsa-live-page">
    <header className="dsa-live-header"><div className="dsa-live-title"><span><Code2 size={14}/> CODEXSHEET · DSA VISUAL LAB</span><h1>Write code. <em>Watch it move.</em></h1><p>Edit a solution and follow its array loop live. Run it to see test and code errors.</p></div>
      <div className="dsa-live-problem"><label htmlFor="dsa-live-problem">PROBLEM · {problems.length} QUESTIONS</label><select id="dsa-live-problem" value={problemNumber} onChange={(event) => setProblemNumber(Number(event.target.value))}>{problems.map((item) => <option key={item.number} value={item.number}>{String(item.number).padStart(3, "0")} · {item.title}</option>)}</select><small>{problem?.pattern} <i/> {problem?.difficulty}</small></div>
    </header>
    <nav className="dsa-live-tabs"><button className={tab === "code" ? "active" : ""} onClick={() => setTab("code")}><Code2 size={14}/> Code &amp; live visualizer</button><button className={tab === "lessons" ? "active" : ""} onClick={() => setTab("lessons")}><Sparkles size={14}/> Guided visual lessons</button></nav>
    {tab === "lessons" ? <DsaVisualLessons/> : <section className="dsa-live-workspace">
      <div className="dsa-live-editor"><div className="dsa-live-editor-top"><span className="dsa-live-dots"><i/><i/><i/></span><strong>CODEXSHEET EDITOR</strong><span>LIVE</span></div>
        <div className="dsa-live-editor-toolbar"><div className="dsa-live-file"><Code2 size={13}/> solution.{language === "Python" ? "py" : language === "C++" ? "cpp" : language === "Java" ? "java" : "js"}<i/></div><label>LANGUAGE<select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{(["JavaScript", "Python", "Java", "C++"] as Language[]).map((item) => <option key={item}>{item}</option>)}</select></label></div>
        <div className="dsa-live-code-box"><div className="dsa-live-gutter" ref={gutterRef} aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => <span key={index}>{String(index + 1).padStart(2, "0")}</span>)}</div><div className="dsa-live-editor-surface"><pre className="dsa-live-highlight" ref={highlightRef} aria-hidden="true">{renderHighlightedCode(code, language)}</pre><textarea ref={editorRef} aria-label="Type your solution code" spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off" value={code} onChange={(event) => editCode(event.target.value)} onKeyDown={handleEditorKeyDown} onScroll={syncEditorScroll} /></div></div>
        <div className="dsa-live-editor-status"><span><i/> {trace.message ? "VISUALIZER NEEDS A LOOP" : "LIVE TRACE READY"}</span><span>Ln {lineCount} · {language}</span></div>
      </div>
      <section className="dsa-live-visual"><header className="dsa-live-visual-head"><div><span>LIVE VISUALIZER <i/></span><h2>{trace.steps.length ? "Algorithm logic" : trace.values.length ? "Data structure view" : sourceFlow.length ? "Code flow preview" : "Waiting for code"}</h2><small>{trace.steps.length ? "Follow your current value, pointer movement, and working memory." : "Choose a structure. The diagram updates directly from your code."}</small></div><div className="dsa-live-visual-buttons"><button title="Restart trace" onClick={() => { setStep(0); setPlaying(true); }}><RotateCcw size={14}/></button><button onClick={() => { if (step >= playbackLength - 1) setStep(0); setPlaying((value) => !value); }} disabled={playbackLength < 2}>{playing ? <Pause size={14}/> : <Play size={14}/>}{playing ? "Pause" : "Play"}</button></div></header>
        {trace.values.length > 0 && <><div className="dsa-live-structure-tabs" role="tablist" aria-label="Data structure visualization">{([ ["array", "Array"], ["linked-list", "Linked list"], ["stack", "Stack"], ["queue", "Queue"], ["hash-map", "Hash map"], ["bst", "BST"], ["graph", "Graph"] ] as const).map(([key, label]) => <button type="button" role="tab" aria-selected={structure === key} className={structure === key ? "active" : ""} key={key} onClick={() => setStructure(key)}>{label}</button>)}</div>{structure === "array" && <div className="dsa-live-array" style={{ "--array-length": trace.values.length } as CSSProperties & { "--array-length": number }}><div className="dsa-live-cursor" style={{ left: `${(((trace.steps[step]?.index ?? 0) + .5) / trace.values.length) * 100}%` }}><span>{trace.steps[step]?.variable ?? "array"}</span><i/></div>{trace.values.map((value, index) => <div className={`dsa-live-cell${index === trace.steps[step]?.index ? " active" : index < (trace.steps[step]?.index ?? -1) ? " visited" : ""}`} key={`${index}-${value}`}><small>{trace.steps[step]?.arrayName ?? "data"}[{index}]</small><strong>{value}</strong></div>)}</div>}{structure === "linked-list" && <div className="dsa-live-list-wrap"><div className="dsa-live-list">{trace.values.map((value, index) => <div className="dsa-live-list-item" key={`${index}-${value}`}><div className={`dsa-live-list-node${index === trace.steps[step]?.index ? " active" : index < (trace.steps[step]?.index ?? -1) ? " visited" : ""}`}><small>{index}</small><strong>{value}</strong></div>{index < trace.values.length - 1 && <div className="dsa-live-list-link"><span/><ArrowRight size={16}/></div>}</div>)}<div className="dsa-live-null">NULL</div></div></div>}{structure === "stack" && <div className="dsa-live-stack-wrap"><span className="dsa-live-structure-label">TOP ↓</span>{[...trace.values].reverse().map((value, offset) => { const index = trace.values.length - offset - 1; return <div className={`dsa-live-stack-cell${index === trace.steps[step]?.index ? " active" : ""}`} key={`${index}-${value}`}>{value}<small>index {index}</small></div>; })}<span className="dsa-live-structure-label">BOTTOM</span></div>}{structure === "queue" && <div className="dsa-live-queue-wrap"><span className="dsa-live-structure-label">FRONT</span><div className="dsa-live-array" style={{ "--array-length": trace.values.length } as CSSProperties & { "--array-length": number }}>{trace.values.map((value, index) => <div className={`dsa-live-cell${index === trace.steps[step]?.index ? " active" : ""}`} key={`${index}-${value}`}><small>{index}</small><strong>{value}</strong></div>)}</div><span className="dsa-live-structure-label">REAR</span></div>}{structure === "hash-map" && <div className="dsa-live-hash-wrap">{trace.values.map((value, index) => <div className={`dsa-live-hash-row${index === trace.steps[step]?.index ? " active" : ""}`} key={`${index}-${value}`}><span>key</span><strong>{value}</strong><i>→</i><span>value</span><strong>{index}</strong></div>)}</div>}{structure === "bst" && <div className="dsa-live-tree-wrap"><svg className="dsa-live-tree" viewBox={`0 0 1000 ${Math.max(170, treeHeight * 92)}`} role="img" aria-label="Binary search tree built from the values in your code">{bstNodes.map((node) => [node.left, node.right].filter((child): child is number => child !== null).map((child) => { const target = bstNodes.find((item) => item.id === child)!; return <line key={`${node.id}-${child}`} x1={node.x} y1={42 + node.depth * 92} x2={target.x} y2={42 + target.depth * 92}/>; }))}{bstNodes.map((node) => <g key={`${node.id}-${node.value}`} className={node.id === trace.steps[step]?.index ? "active" : node.id < (trace.steps[step]?.index ?? -1) ? "visited" : ""}><circle cx={node.x} cy={42 + node.depth * 92} r="25"/><text x={node.x} y={42 + node.depth * 92 + 5}>{node.value}</text><text className="dsa-live-tree-index" x={node.x} y={42 + node.depth * 92 + 43}>#{node.id}</text></g>)}</svg></div>}{structure === "graph" && <div className="dsa-live-graph-wrap"><svg className="dsa-live-graph" viewBox="0 0 500 250" role="img" aria-label="Graph view of the code values">{trace.values.map((_, index) => index < trace.values.length - 1 ? <line key={`e${index}`} x1={70 + index * (360 / Math.max(1, trace.values.length - 1))} y1={125} x2={70 + (index + 1) * (360 / Math.max(1, trace.values.length - 1))} y2={125}/> : null)}{trace.values.map((value, index) => { const angle = (index / trace.values.length) * Math.PI * 2 - Math.PI / 2; const x = 250 + Math.cos(angle) * 90; const y = 125 + Math.sin(angle) * 80; return <g key={`${index}-${value}`} className={index === trace.steps[step]?.index ? "active" : ""}><circle cx={x} cy={y} r="24"/><text x={x} y={y + 5}>{value}</text><text className="dsa-live-tree-index" x={x} y={y + 40}>node {index}</text></g>; })}</svg><small>Edges connect adjacent values. Replace with your graph’s edge list in code to trace custom connections.</small></div>}{trace.steps[step] && <div className="dsa-live-variable-strip"><span>LIVE VARIABLES · STEP {step + 1}</span><div>{trace.steps[step].memory.map((value, index) => <code key={`${value}-${index}`}>{value}</code>)}</div></div>}</>}
        {trace.steps.length ? <><div className="dsa-live-step-info"><span>ITERATION {step + 1} / {trace.steps.length}</span><strong>{trace.steps[step]?.variable}</strong><code>{trace.steps[step]?.arrayName}[{trace.steps[step]?.index}] = {trace.steps[step]?.value}</code></div><div className="dsa-live-logic-card"><span>LOGIC AT THIS STEP</span><strong>{trace.steps[step]?.logic}</strong><div>{trace.steps[step]?.memory.map((value) => <code key={value}>{value}</code>)}</div></div><div className="dsa-live-step-buttons"><button onClick={() => { setPlaying(false); setStep((value) => Math.max(0, value - 1)); }} disabled={step === 0}>Previous</button><button onClick={() => { setPlaying(false); setStep((value) => Math.min(trace.steps.length - 1, value + 1)); }} disabled={step === trace.steps.length - 1}>Next iteration</button></div></> : sourceFlow.length ? <><div className="dsa-live-flow-counter">SOURCE FLOW <span>STEP {step + 1} / {sourceFlow.length}</span></div><div className="dsa-live-source-flow">{sourceFlow.map((item, index) => <button type="button" key={`${item.line}-${item.title}-${index}`} className={`dsa-live-flow-node kind-${item.kind}${step === index ? " active" : index < step ? " complete" : ""}`} onClick={() => { setPlaying(false); setStep(index); }}><span className="dsa-live-flow-index">{item.line ? `L${String(item.line).padStart(2, "0")}` : "↳"}</span><span className="dsa-live-flow-copy"><strong>{item.title}</strong><code>{item.source}</code><small>{item.detail}</small></span><i/></button>)}</div><div className="dsa-live-step-buttons"><button onClick={() => { setPlaying(false); setStep((value) => Math.max(0, value - 1)); }} disabled={step === 0}>Previous</button><button onClick={() => { setPlaying(false); setStep((value) => Math.min(sourceFlow.length - 1, value + 1)); }} disabled={step === sourceFlow.length - 1}>Next code step</button></div></> : <div className="dsa-live-empty"><div><TriangleAlert size={20}/></div><strong>Write code to begin</strong><p>The code flow will appear here as soon as you start typing.</p></div>}
      </section>
    </section>}
    <footer className="dsa-live-footnote"><span>Structure diagrams and code flow update as you type.</span><span>{problems.length} questions available</span></footer>
  </main>;
}
