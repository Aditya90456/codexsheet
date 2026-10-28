import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Code2, ExternalLink, LayoutDashboard, LoaderCircle, Pause, Play, RotateCcw, Save, Search, Send, Sparkles, TriangleAlert, X } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { EditorView, keymap, type ViewUpdate } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import DsaCourseStudio from "./DsaCourseStudio";
import ShivaTandavPreloader from "./ShivaTandavPreloader";
import { devaTestCaseCount, devaTestCases } from "./deva-test-cases";
import { judgeCases, judgedStarter, outputsMatch, parseTestLiteral, splitTestArguments, type JudgeCase } from "./deva-judge";
import { supabase } from "./lib/supabase";

type Language = "JavaScript" | "Python" | "Java" | "C++";
type Problem = { number: number; title: string; pattern: string; difficulty: "Easy" | "Medium" | "Hard"; link?: string };
type TraceStep = { index: number; value: number; variable: string; arrayName: string; logic: string; memory: string[] };
type FlowStep = { line: number | null; source: string; title: string; detail: string; kind: "call" | "function" | "array" | "loop" | "branch" | "return" | "statement" | "error" };
type TreeNode = { id: number; value: number; depth: number; x: number; left: number | null; right: number | null };
type InvokeError = { message: string; context?: Response };
type SubmissionResult = { passed: number; total: number; details: string[]; error?: string; verdict?: string; time?: number; memory?: number };
const runtimes: Record<Language, string> = { JavaScript: "javascript", Python: "python", Java: "java", "C++": "cpp" };
const codeMirrorLanguage: Record<Language, () => Extension> = {
  JavaScript: () => javascript(), Python: () => python(), Java: () => java(), "C++": () => cpp(),
};
// oneDark supplies the syntax palette; this layer only restyles the surfaces so
// the editor keeps the workspace's warm #101010 chrome instead of oneDark's grey.
const devaEditorTheme = EditorView.theme({
  "&": { backgroundColor: "#101010", color: "#e9e3dc", fontSize: "12px", height: "100%" },
  ".cm-scroller": { fontFamily: "'DM Mono', Consolas, monospace", lineHeight: "1.8", overflow: "auto" },
  ".cm-content": { padding: "17px 0", caretColor: "#f0a36d" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#f0a36d" },
  ".cm-gutters": { minWidth: "44px", borderRight: "1px solid #241f1c", backgroundColor: "#101010", color: "#6b5d51" },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 11px 0 13px" },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#ffffff0a", color: "#d8c9bb" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "#805336aa" },
  ".cm-matchingBracket, .cm-nonmatchingBracket": { backgroundColor: "transparent", outline: "none" },
  ".cm-matchingBracket": { backgroundColor: "#4d3a26" },
  ".cm-tooltip, .cm-tooltip-autocomplete": { border: "1px solid #493a31", backgroundColor: "#1b1917", color: "#e9e3dc", fontFamily: "'DM Mono', Consolas, monospace", fontSize: "12px" },
  ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "#95542f", color: "#fff" },
  ".cm-panels, .cm-panel.cm-search": { backgroundColor: "#1b1917", color: "#d1c2b7", fontSize: "11px" },
  ".cm-textfield": { border: "1px solid #493a31", backgroundColor: "#101010", color: "#e9e3dc" },
  ".cm-button": { border: "1px solid #493a31", backgroundColor: "#211e1b", color: "#d1c2b7", backgroundImage: "none" },
}, { dark: true });
const starters: Record<Language, string> = {
  JavaScript: `function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}`,
  Python: `def two_sum(nums, target):\n    seen = {}\n    for i, value in enumerate(nums):\n        need = target - value\n        if need in seen:\n            return [seen[need], i]\n        seen[value] = i\n    return []\nprint(two_sum([2, 7, 11, 15], 9))`,
  Java: `import java.util.*;\n\nclass Main {\n  static int[] twoSum(int[] nums, int target) {\n    Map<Integer, Integer> seen = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n      int need = target - nums[i];\n      if (seen.containsKey(need)) return new int[] {seen.get(need), i};\n      seen.put(nums[i], i);\n    }\n    return new int[] {};\n  }\n\n  public static void main(String[] args) {\n    System.out.println(Arrays.toString(twoSum(new int[] {2, 7, 11, 15}, 9)));\n  }\n}`,
  "C++": `#include <iostream>\n#include <unordered_map>\n#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n  unordered_map<int, int> seen;\n  for (int i = 0; i < nums.size(); i++) {\n    int need = target - nums[i];\n    if (seen.count(need)) return {seen[need], i};\n    seen[nums[i]] = i;\n  }\n  return {};\n}\n\nint main() {\n  vector<int> nums = {2, 7, 11, 15};\n  for (int index : twoSum(nums, 9)) cout << index << " ";\n  return 0;\n}`,
};

function runJavaScriptInBrowser(source: string, stdin: string): Promise<{ status: string; stdout: string; stderr?: string }> {
  return new Promise((resolve, reject) => {
    const workerSource = `
      const format = value => typeof value === 'string' ? value : (() => { try { return JSON.stringify(value); } catch { return String(value); } })();
      self.onmessage = async ({ data }) => {
        const output = [];
        const write = (...values) => output.push(values.map(format).join(' '));
        const sandboxConsole = { log: write, info: write, warn: write, error: write, table: value => write(value) };
        const sandboxProcess = { stdout: { write: value => { output.push(String(value)); return true; } }, env: {} };
        try {
          const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
          await new AsyncFunction('console', 'stdin', 'input', 'process', data.source)(sandboxConsole, data.stdin, data.stdin, sandboxProcess);
          self.postMessage({ status: 'Finished in browser', stdout: output.join('\\n') });
        } catch (error) {
          self.postMessage({ status: 'Runtime error', stdout: output.join('\\n'), stderr: error instanceof Error ? error.stack || error.message : String(error) });
        }
      };
    `;
    const url = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
    const worker = new Worker(url);
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      callback();
    };
    const timeout = window.setTimeout(() => finish(() => reject(new Error("JavaScript timed out after 8 seconds. Check for an infinite loop."))), 8000);
    worker.onmessage = (event: MessageEvent<{ status: string; stdout: string; stderr?: string }>) => finish(() => resolve(event.data));
    worker.onerror = () => finish(() => reject(new Error("JavaScript could not run in this browser. Check the syntax and try again.")));
    worker.postMessage({ source, stdin });
  });
}

function starterFor(language: Language, problem: Problem | undefined) {
  // Compiled languages are judged through stdin/stdout, so their starter has to
  // read the input; JavaScript is judged by calling the function directly.
  if (problem && language !== "JavaScript") {
    const judged = judgedStarter(language, problem.number);
    if (judged) return judged;
  }
  if (!problem || problem.number === 1) return starters[language];
  const comment = language === "Python" ? `# ${problem.title}\n` : `// ${problem.title}\n`;
  if (language === "Python") return `${comment}def solution(data):\n    # Write your solution here\n    pass\n`;
  if (language === "JavaScript") return `${comment}function solution(data) {\n  // Write your solution here\n  return null;\n}\n`;
  if (language === "Java") return `${comment}class Solution {\n  public Object solve(int[] data) {\n    // Write your solution here\n    return null;\n  }\n}`;
  return `${comment}#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n  int solve(vector<int>& data) {\n    // Write your solution here\n    return 0;\n  }\n};`;
}

function readProblemNumbers(key: string): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is number => Number.isInteger(item)) : [];
  } catch { return []; }
}

function submissionCases(problemNumber: number) {
  const examples = devaTestCases[problemNumber]?.examples ?? [];
  const cases: { args: unknown[]; expected: unknown }[] = [];
  for (const example of examples) {
    try {
      const assignments = splitTestArguments(example.input);
      const values = assignments.map((assignment) => {
        const separator = assignment.indexOf("=");
        if (separator < 0) throw new Error("Unsupported input");
        return assignment.slice(separator + 1).trim();
      });
      const args = parseTestLiteral(`[${values.join(",")}]`);
      const expected = parseTestLiteral(example.output);
      if (Array.isArray(args)) cases.push({ args, expected });
    } catch {
      // Ignore display-only examples such as operation notation and prose outputs.
    }
  }
  return cases.slice(0, 12);
}

function solutionFunction(source: string): { fn: string; code: string } | null {
  const namedFunction = source.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/)?.[1]
    ?? source.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/)?.[1];
  if (namedFunction) return { fn: namedFunction, code: source };

  // GeeksforGeeks commonly gives JavaScript tasks as a method on Solution.
  const classBody = source.match(/\bclass\s+Solution\b[^{]*\{([\s\S]*)/i)?.[1];
  const method = classBody?.match(/(?:^|\n)\s*(?:static\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/m)?.[1];
  if (method && method !== "constructor") {
    return {
      fn: "__devaInvoke",
      code: `${source}\nfunction __devaInvoke(...args) { return new Solution().${method}(...args); }`,
    };
  }
  return null;
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
  const [page, setPage] = useState<"workspace" | "dashboard">("workspace");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [structure, setStructure] = useState<"array" | "linked-list" | "bst" | "stack" | "queue" | "hash-map" | "graph">("array");
  const [language, setLanguage] = useState<Language>("JavaScript");
  const [problemNumber, setProblemNumber] = useState(1);
  const [code, setCode] = useState(starters.JavaScript);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [stdin, setStdin] = useState("");
  const [runOutput, setRunOutput] = useState<{ status?: string; stdout?: string; stderr?: string; compile_output?: string; time?: string | null; memory?: number | null; error?: string } | null>(null);
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [runningCode, setRunningCode] = useState(false);
  const [solvedProblems, setSolvedProblems] = useState<number[]>(() => readProblemNumbers(`deva-solved:${userId ?? "local"}`));
  const [attemptedProblems, setAttemptedProblems] = useState<number[]>(() => readProblemNumbers(`deva-attempted:${userId ?? "local"}`));
  const [saveMessage, setSaveMessage] = useState("Saved locally");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const challenges = useMemo(() => problems.filter((item) => !/ · Pattern \d+$/.test(item.title)), [problems]);
  const trace = useMemo(() => traceCode(code), [code]);
  const sourceFlow = useMemo(() => buildSourceFlow(code), [code]);
  const playbackLength = trace.steps.length || sourceFlow.length;
  const problem = challenges.find((item) => item.number === problemNumber) ?? challenges[0];
  const runCodeRef = useRef<() => Promise<void>>(runCode);
  runCodeRef.current = runCode;
  const editorExtensions = useMemo<Extension[]>(() => [
    codeMirrorLanguage[language](),
    keymap.of([{ key: "Mod-Enter", run: () => { void runCodeRef.current(); return true; } }]),
    devaEditorTheme,
  ], [language]);

  async function runCode() {
    setSubmission(null);
    setRunningCode(true);
    setRunOutput(null);
    try {
      if (language === "JavaScript") {
        const solution = solutionFunction(code);
        const cases = submissionCases(problemNumber);
        if (solution && cases.length) {
          const response = await fetch("/api/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: solution.code, fn: solution.fn, cases }),
            signal: AbortSignal.timeout(30_000),
          });
          const result = await response.json() as SubmissionResult;
          if (!response.ok) throw new Error(result.error ?? "The sample cases could not be run.");
          setSubmission(result);
          return;
        }
        const result = await runJavaScriptInBrowser(code, stdin);
        setRunOutput(result);
        return;
      }
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: runtimes[language], source_code: code, stdin }),
        signal: AbortSignal.timeout(30_000),
      });
      const result = await response.json() as NonNullable<typeof runOutput>;
      if (!response.ok) throw new Error(result.error ?? "The code could not be run.");
      setRunOutput(result);
    } catch (error) {
      setRunOutput({ error: error instanceof Error ? error.message : "The compiler request failed." });
    } finally {
      setRunningCode(false);
    }
  }

  function markAttempted() {
    const next = [...new Set([...attemptedProblems, problemNumber])];
    setAttemptedProblems(next);
    try { localStorage.setItem(`deva-attempted:${userId ?? "local"}`, JSON.stringify(next)); } catch { /* local progress is optional */ }
    if (supabase && userId) void supabase.from("dsa_progress").upsert({ user_id: userId, problem_number: problemNumber, status: solvedProblems.includes(problemNumber) ? "Solved" : "In progress", notes: "", updated_at: new Date().toISOString() }, { onConflict: "user_id,problem_number" });
  }

  function toggleSolved() {
    const next = solvedProblems.includes(problemNumber)
      ? solvedProblems.filter((number) => number !== problemNumber)
      : [...solvedProblems, problemNumber];
    setSolvedProblems(next);
    try { localStorage.setItem(`deva-solved:${userId ?? "local"}`, JSON.stringify(next)); } catch { /* local progress is optional */ }
    if (supabase && userId) void supabase.from("dsa_progress").upsert({ user_id: userId, problem_number: problemNumber, status: next.includes(problemNumber) ? "Solved" : "Todo", notes: "", updated_at: new Date().toISOString() }, { onConflict: "user_id,problem_number" });
  }

  async function askDevaAi(question: string) {
    const prompt = question.trim();
    if (!prompt || aiBusy) return;
    setAiBusy(true); setAiError(""); setAiReply("");
    const context = `Problem: ${problem?.title ?? "DSA problem"} (${problem?.pattern ?? ""}, ${problem?.difficulty ?? ""})\nLanguage: ${language}\nStudent request: ${prompt}\n\nCurrent code:\n${code.slice(0, 1_350)}`;
    try {
      const response = await fetch("/api/tutor", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gemini-3.6-flash", messages: [{ role: "user", content: context }] }),
        signal: AbortSignal.timeout(45_000),
      });
      const data = await response.json() as { answer?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Gemini could not respond. Try again.");
      setAiReply(data.answer ?? "No response returned."); setAiQuestion("");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Could not reach Google Gemini. Try again.");
    } finally { setAiBusy(false); }
  }

  async function saveCurrentCode() {
    try {
      localStorage.setItem(`codexsheet-live-code:${userId ?? "local"}:${problemNumber}:${language}`, code);
      if (supabase && userId) {
        setSaveMessage("Saving…");
        const { error } = await supabase.from("dsa_code_drafts").upsert({ user_id: userId, problem_number: problemNumber, language, source_code: code, updated_at: new Date().toISOString() }, { onConflict: "user_id,problem_number,language" });
        if (error) throw error;
      }
      setSaveMessage(userId ? "Saved to account" : "Saved locally");
      window.setTimeout(() => setSaveMessage(userId ? "Synced to account" : "Saved locally"), 1600);
    } catch { setSaveMessage("Could not save"); }
  }

  async function submitCompiledLanguage(cases: JudgeCase[]): Promise<SubmissionResult> {
    const details: string[] = [];
    let passed = 0;
    let error: string | undefined;
    let verdict: string | undefined;
    let slowest = 0;
    let peakMemory = 0;
    for (let index = 0; index < cases.length; index++) {
      const testCase = cases[index];
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: runtimes[language], source_code: code, stdin: testCase.stdin }),
        signal: AbortSignal.timeout(30_000),
      });
      const result = await response.json() as { status?: string; stdout?: string; stderr?: string; compile_output?: string; time?: string | null; memory?: number | null; error?: string };
      if (!response.ok) { error = result.error ?? "The compiler service could not check this submission."; break; }
      if (result.compile_output?.trim()) {
        verdict = "Compile Error";
        error = result.compile_output.trim().split("\n").slice(0, 8).join("\n");
        break;
      }
      const status = result.status ?? "";
      if (/time limit|timeout/i.test(status)) { verdict = "Time Limit Exceeded"; error = `Case ${index + 1} ran past the time limit.`; break; }
      if (/runtime error|signal|internal error/i.test(status)) {
        verdict = "Runtime Error";
        error = (result.stderr || result.stdout || status).trim().split("\n").slice(0, 8).join("\n");
        break;
      }
      slowest = Math.max(slowest, Number(result.time) || 0);
      peakMemory = Math.max(peakMemory, Number(result.memory) || 0);
      const actual = (result.stdout ?? "").trim();
      if (outputsMatch(actual, testCase.expected)) { passed += 1; continue; }
      verdict = verdict ?? "Wrong Answer";
      if (details.length < 3) details.push(`Case ${index + 1}\ninput:\n${testCase.stdin.trim()}\nexpected: ${testCase.expected}\ngot: ${actual || "(no output)"}`);
    }
    return { passed, total: cases.length, details, error, verdict, time: slowest || undefined, memory: peakMemory || undefined };
  }

  async function submitSolution() {
    markAttempted();
    setSubmission(null);
    if (language !== "JavaScript") {
      const cases = judgeCases(problemNumber);
      if (!cases?.length) {
        setSubmission({ passed: 0, total: 0, details: [], error: "This problem’s examples use an input shape the line-based judge cannot express yet, such as a nested list or a string containing spaces. Use Run to execute your code." });
        return;
      }
      setRunningCode(true);
      setRunOutput(null);
      try {
        const result = await submitCompiledLanguage(cases);
        setSubmission(result);
        if (result.total > 0 && result.passed === result.total && !result.error && !solvedProblems.includes(problemNumber)) toggleSolved();
      } catch (submitError) {
        setSubmission({ passed: 0, total: cases.length, details: [], error: submitError instanceof Error ? submitError.message : "The submission could not be checked." });
      } finally {
        setRunningCode(false);
      }
      return;
    }
    const solution = solutionFunction(code);
    const cases = submissionCases(problemNumber);
    if (!solution) {
      setSubmission({ passed: 0, total: 0, details: [], error: "Use a named function or a method inside class Solution so Submit can call it." });
      return;
    }
    if (!cases.length) {
      setSubmission({ passed: 0, total: 0, details: [], error: "This problem's displayed examples cannot be used as automatic tests yet. Use Run to execute your code." });
      return;
    }
    setRunningCode(true);
    setRunOutput(null);
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: solution.code, fn: solution.fn, cases }),
        signal: AbortSignal.timeout(30_000),
      });
      const result = await response.json() as SubmissionResult;
      if (!response.ok) throw new Error(result.error ?? "The submission could not be checked.");
      setSubmission(result);
      if (result.total > 0 && result.passed === result.total && !result.error && !solvedProblems.includes(problemNumber)) toggleSolved();
    } catch (error) {
      setSubmission({ passed: 0, total: cases.length, details: [], error: error instanceof Error ? error.message : "The submission could not be checked." });
    } finally {
      setRunningCode(false);
    }
  }

  useEffect(() => {
    const key = `codexsheet-live-code:${userId ?? "local"}:${problemNumber}:${language}`;
    try { setCode(localStorage.getItem(key) ?? starterFor(language, problem)); } catch { setCode(starterFor(language, problem)); }
    setCursor({ line: 1, column: 1 });
    setStep(0); setPlaying(true);
    if (!supabase || !userId) return;
    let current = true;
    void supabase.from("dsa_code_drafts").select("source_code").eq("user_id", userId).eq("problem_number", problemNumber).eq("language", language).maybeSingle().then(({ data }) => {
      if (!current || !data?.source_code) return;
      setCode(data.source_code);
      try { localStorage.setItem(key, data.source_code); } catch { /* browser storage is optional */ }
    });
    return () => { current = false; };
  }, [language, problemNumber, userId]);
  useEffect(() => {
    setSolvedProblems(readProblemNumbers(`deva-solved:${userId ?? "local"}`));
    setAttemptedProblems(readProblemNumbers(`deva-attempted:${userId ?? "local"}`));
    if (!supabase || !userId) return;
    let current = true;
    void supabase.from("dsa_progress").select("problem_number,status").eq("user_id", userId).then(({ data, error }) => {
      if (error || !current || !data) return;
      const solved = data.filter((row) => row.status === "Solved").map((row) => row.problem_number);
      const attempted = data.filter((row) => row.status === "Solved" || row.status === "In progress").map((row) => row.problem_number);
      setSolvedProblems((local) => [...new Set([...local, ...solved])]);
      setAttemptedProblems((local) => [...new Set([...local, ...attempted])]);
    });
    return () => { current = false; };
  }, [userId]);
  useEffect(() => {
    if (!playing || playbackLength < 2) return;
    const timer = window.setInterval(() => setStep((current) => {
      if (current >= playbackLength - 1) { setPlaying(false); return current; }
      return current + 1;
    }), 850);
    return () => window.clearInterval(timer);
  }, [playing, playbackLength]);

  function editCode(value: string) {
    setCode(value); setStep(0); setPlaying(true); setRunOutput(null);
    try { localStorage.setItem(`codexsheet-live-code:${userId ?? "local"}:${problemNumber}:${language}`, value); } catch { /* browser storage is optional */ }
  }
  const bstNodes = useMemo(() => buildBst(trace.values), [trace.values]);
  const treeHeight = Math.max(1, ...bstNodes.map((node) => node.depth + 1));
  const currentProblemIndex = Math.max(0, challenges.findIndex((item) => item.number === problem?.number));
  const twoSum = problem?.title === "Two Sum";

  return <main className="dsa-live-page">
    <ShivaTandavPreloader />
    <header className="dsa-live-header deva-topbar"><div className="dsa-live-title"><span><Code2 size={14}/> DEVA · DSA CODE LAB</span><h1>Practice, run, <em>understand.</em></h1><p>A focused coding workspace with a live trace and multi-language runner.</p></div>
      <div className="dsa-live-problem"><label htmlFor="dsa-live-problem">CHOOSE A CHALLENGE · {challenges.length} UNIQUE PROBLEMS</label><div className="deva-problem-picker"><button type="button" aria-label="Previous problem" title="Previous problem" onClick={() => setProblemNumber(challenges[(currentProblemIndex - 1 + challenges.length) % challenges.length]?.number ?? 1)}><ChevronLeft size={16}/></button><select id="dsa-live-problem" value={problemNumber} onChange={(event) => setProblemNumber(Number(event.target.value))}>{challenges.map((item) => <option key={item.number} value={item.number}>{String(item.number).padStart(3, "0")} · {item.title}</option>)}</select><button type="button" aria-label="Next problem" title="Next problem" onClick={() => setProblemNumber(challenges[(currentProblemIndex + 1) % challenges.length]?.number ?? 1)}><ChevronRight size={16}/></button></div><small>{problem?.pattern} <i/> {problem?.difficulty}</small></div>
    </header>
    <div className="deva-commandbar"><button type="button" className={libraryOpen ? "active" : ""} onClick={() => { setLibraryOpen((open) => !open); setPage("workspace"); }}><BookOpen size={15}/> Problem library</button><button type="button" className={page === "dashboard" ? "active" : ""} onClick={() => { setPage("dashboard"); setLibraryOpen(false); }}><LayoutDashboard size={15}/> Dashboard <span>{solvedProblems.length}/{challenges.length}</span></button><div className="deva-command-spacer"/><span>{attemptedProblems.length} attempted</span></div>
    {libraryOpen && <section className="deva-library" aria-label="Problem library"><header><div><strong>Problem library</strong><small>{challenges.length} DSA problems</small></div><button type="button" onClick={() => setLibraryOpen(false)} aria-label="Close problem library">×</button></header><label><Search size={14}/><input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search problems or patterns"/></label><div className="deva-library-list">{challenges.filter((item) => `${item.title} ${item.pattern} ${item.difficulty}`.toLowerCase().includes(librarySearch.toLowerCase())).map((item) => <button type="button" key={item.number} className={item.number === problemNumber ? "active" : ""} onClick={() => { setProblemNumber(item.number); setLibraryOpen(false); setPage("workspace"); }}><span>{solvedProblems.includes(item.number) ? <Check size={13}/> : String(item.number).padStart(2, "0")}</span><span><strong>{item.title}</strong><small>{item.pattern}</small></span><i className={`difficulty ${(item.difficulty ?? "Easy").toLowerCase()}`}>{item.difficulty}</i></button>)}</div></section>}
    <nav className="dsa-live-tabs"><button className={page === "workspace" && tab === "code" ? "active" : ""} onClick={() => { setPage("workspace"); setTab("code"); }}><Code2 size={14}/> Code editor</button><button className={page === "workspace" && tab === "lessons" ? "active" : ""} onClick={() => { setPage("workspace"); setTab("lessons"); }}><Sparkles size={14}/> Guided visual lessons</button></nav>
    {page === "dashboard" ? <section className="deva-dashboard"><header><span>YOUR PRACTICE</span><h2>DSA dashboard</h2><p>{userId ? "Progress and saved solutions sync to your account." : "Progress and saved solutions stay in this browser until you sign in."}</p></header><div className="deva-dashboard-stats"><article><small>SOLVED</small><strong>{solvedProblems.length}<i> / {challenges.length}</i></strong><span>Problems marked solved</span></article><article><small>ATTEMPTED</small><strong>{attemptedProblems.length}<i> / {challenges.length}</i></strong><span>Problems you have submitted</span></article><article><small>REMAINING</small><strong>{Math.max(0, challenges.length - solvedProblems.length)}</strong><span>Problems left to practice</span></article></div><div className="deva-dashboard-progress"><div><strong>Completion</strong><span>{challenges.length ? Math.round((solvedProblems.length / challenges.length) * 100) : 0}%</span></div><div><i style={{ width: `${challenges.length ? (solvedProblems.length / challenges.length) * 100 : 0}%` }}/></div></div><div className="deva-dashboard-list"><header><strong>Continue practicing</strong><button type="button" onClick={() => { setPage("workspace"); setLibraryOpen(true); }}>Browse all problems <ArrowRight size={14}/></button></header>{challenges.filter((item) => !solvedProblems.includes(item.number)).slice(0, 8).map((item) => <button type="button" key={item.number} onClick={() => { setProblemNumber(item.number); setPage("workspace"); }}><span>{String(item.number).padStart(3, "0")}</span><strong>{item.title}</strong><small>{item.pattern}</small><i className={`difficulty ${(item.difficulty ?? "Easy").toLowerCase()}`}>{item.difficulty}</i><ArrowRight size={14}/></button>)}</div></section> : tab === "lessons" ? <DsaCourseStudio/> : <div className="deva-split-layout">
      <section className="deva-challenge" aria-labelledby="deva-challenge-title"><div className="deva-challenge-main"><div className="deva-challenge-meta"><span>PROBLEM {String(problem?.number ?? 1).padStart(3, "0")}</span><span className={`difficulty ${(problem?.difficulty ?? "Easy").toLowerCase()}`}>{problem?.difficulty}</span><span>{problem?.pattern}</span></div><h2 id="deva-challenge-title">{problem?.title ?? "Choose a problem"}</h2>{twoSum ? <><p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return the indices of the two numbers that add up to <code>target</code>.</p><p>You may assume each input has exactly one solution, and you may not use the same element twice.</p></> : <><p>Work through this {problem?.pattern?.toLowerCase() ?? "DSA"} challenge. Read the original statement and examples before coding, then use the editor to build and run your solution.</p><div className="deva-challenge-note"><Sparkles size={15}/><span>Think about the input shape, the invariant your approach maintains, and the time and space cost.</span></div></>}
        <div className="deva-lc-examples"><header><strong>Test cases</strong><span>{devaTestCaseCount} total · 5 for this problem</span></header><p>{devaTestCases[problem?.number ?? 1]?.prompt}</p>{(devaTestCases[problem?.number ?? 1]?.examples ?? []).map((example, index) => <article key={`${problem?.number}-${index}`}><strong>Example {index + 1}</strong><pre><b>Input:</b> {example.input}{"\n"}<b>Output:</b> {example.output}</pre></article>)}</div>
      </div><div className="deva-challenge-side"><span>YOUR WORKFLOW</span><ol><li>Understand the input and expected output</li><li>Choose a pattern and state its invariant</li><li>Run your code, then inspect the trace</li></ol>{problem?.link && <a href={problem.link} target="_blank" rel="noreferrer">Full problem on LeetCode <ExternalLink size={14}/></a>}</div></section>
      <div className="deva-workspace-pane"><div className="deva-problem-toolbar"><span><i className={`difficulty ${(problem?.difficulty ?? "Easy").toLowerCase()}`}/>{problem?.difficulty} <b>·</b> {problem?.pattern}</span><button type="button" className={solvedProblems.includes(problemNumber) ? "solved" : ""} onClick={toggleSolved}>{solvedProblems.includes(problemNumber) ? <Check size={14}/> : <Check size={14}/>} {solvedProblems.includes(problemNumber) ? "Solved" : "Mark solved"}</button></div><section className="dsa-live-workspace">
      <div className="dsa-live-editor">
        <div className="pattern-editor-shell deva-pattern-editor"><div className="pattern-editor-toolbar"><span><i/><i/><i/></span><strong>solution.{language === "Python" ? "py" : language === "C++" ? "cpp" : language === "Java" ? "java" : "js"}</strong><label className="deva-pattern-language"><span>{language === "JavaScript" ? "JS" : language}</span><select aria-label="Programming language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{(["JavaScript", "Python", "Java", "C++"] as Language[]).map((item) => <option key={item}>{item}</option>)}</select></label><span className="deva-pattern-saved"><i/> {saveMessage}</span><button type="button" onClick={() => setAiOpen((open) => !open)}><Sparkles size={12}/> AI help</button><button type="button" onClick={() => void saveCurrentCode()}><Save size={12}/> Save</button><button type="button" onClick={() => { editCode(starterFor(language, problem)); setCursor({ line: 1, column: 1 }); }}><RotateCcw size={12}/> Reset</button></div>{aiOpen && <section className="deva-ai-panel" aria-label="Gemini editor help"><header><div><strong><Sparkles size={14}/> Ask Gemini 3.6 Flash</strong><small>Get a hint, explain your approach, or debug the current code.</small></div><button type="button" aria-label="Close AI help" onClick={() => setAiOpen(false)}><X size={15}/></button></header>{aiReply && <p className="deva-ai-reply">{aiReply}</p>}{aiError && <p className="deva-ai-error" role="alert">{aiError}</p>}<form onSubmit={(event) => { event.preventDefault(); void askDevaAi(aiQuestion); }}><input value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} placeholder="e.g. Give me a hint for this problem" maxLength={300} disabled={aiBusy}/><button type="submit" disabled={aiBusy || !aiQuestion.trim()}>{aiBusy ? <LoaderCircle className="deva-spinner" size={14}/> : <Send size={14}/>} {aiBusy ? "Thinking…" : "Ask"}</button></form></section>}<CodeMirror
          className="deva-source-editor deva-codemirror"
          value={code}
          theme="dark"
          extensions={editorExtensions}
          placeholder="Write your solution"
          basicSetup={{ tabSize: 2, lineNumbers: true, foldGutter: true, autocompletion: true, bracketMatching: true, closeBrackets: true, highlightActiveLine: true, highlightSelectionMatches: true, searchKeymap: true, history: true }}
          onChange={(value: string) => editCode(value)}
          onUpdate={(update: ViewUpdate) => {
            if (!update.selectionSet && !update.docChanged) return;
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            setCursor({ line: line.number, column: head - line.from + 1 });
          }}
        /></div>
        <div className="dsa-live-editor-status"><span><i/> {trace.message ? "TRACE READY · ADD A LOOP" : "READY"}</span><span>Ln {cursor.line}, Col {cursor.column}</span><span>{language}</span><span>UTF-8</span><span>Ctrl/⌘ Enter · Run</span></div>
        <section className="deva-run-panel" aria-label="Run code">
          <div className="deva-run-input"><label htmlFor="deva-stdin">STANDARD INPUT</label><textarea id="deva-stdin" value={stdin} onChange={(event) => setStdin(event.target.value)} placeholder="Optional input for your program" rows={2}/></div>
          <button className="deva-run-button" type="button" onClick={runCode} disabled={runningCode || !code.trim()}>{runningCode ? <LoaderCircle className="deva-spinner" size={14}/> : <Play size={14}/>} {runningCode ? "Running…" : "Run"}<kbd>Ctrl ↵</kbd></button><button className="deva-submit-button" type="button" onClick={submitSolution} disabled={runningCode || !code.trim()}>{runningCode ? <LoaderCircle className="deva-spinner" size={14}/> : <Send size={14}/>} Submit</button>
          {submission && <div className={`deva-run-output${submission.error || submission.passed < submission.total ? " has-error" : ""}`} aria-live="polite">
            <div className="deva-run-output-head"><strong>{submission.verdict ?? (submission.error ? (submission.total > 0 ? "Runtime Error" : "Submission error") : submission.passed === submission.total ? "Accepted" : "Wrong Answer")}</strong><small>{submission.passed} / {submission.total} tests passed{submission.time ? ` · ${submission.time.toFixed(3)}s` : ""}{submission.memory ? ` · ${Math.round(submission.memory / 1024)} MB` : ""}</small></div>
            {submission.error && <pre>{submission.error}</pre>}
            {submission.details.map((detail, index) => <pre key={`${index}-${detail}`}>{detail}</pre>)}
          </div>}
          {runOutput && <div className={`deva-run-output${runOutput.error || runOutput.stderr || runOutput.compile_output || (runOutput.status && !/accepted|success|finished|complete/i.test(runOutput.status)) ? " has-error" : ""}`} aria-live="polite">
            <div className="deva-run-output-head"><strong>{runOutput.error ? "Runner error" : runOutput.status ?? "Run complete"}</strong>{runOutput.time && <small>{runOutput.time}s{runOutput.memory ? ` · ${Math.round(runOutput.memory / 1024)} MB` : ""}</small>}</div>
            {runOutput.error && <pre>{runOutput.error}</pre>}
            {runOutput.compile_output && <><span>COMPILER</span><pre>{runOutput.compile_output}</pre></>}
            {runOutput.stdout && <><span>OUTPUT</span><pre>{runOutput.stdout}</pre></>}
            {runOutput.stderr && <><span>ERROR OUTPUT</span><pre>{runOutput.stderr}</pre></>}
            {!runOutput.error && !runOutput.compile_output && !runOutput.stdout && !runOutput.stderr && <pre>(no output)</pre>}
          </div>}
        </section>
      </div>
      <section className="dsa-live-visual"><header className="dsa-live-visual-head"><div><span>LIVE VISUALIZER <i/></span><h2>{trace.steps.length ? "Algorithm logic" : trace.values.length ? "Data structure view" : sourceFlow.length ? "Code flow preview" : "Waiting for code"}</h2><small>{trace.steps.length ? "Follow your current value, pointer movement, and working memory." : "Choose a structure. The diagram updates directly from your code."}</small></div><div className="dsa-live-visual-buttons"><button title="Restart trace" onClick={() => { setStep(0); setPlaying(true); }}><RotateCcw size={14}/></button><button onClick={() => { if (step >= playbackLength - 1) setStep(0); setPlaying((value) => !value); }} disabled={playbackLength < 2}>{playing ? <Pause size={14}/> : <Play size={14}/>}{playing ? "Pause" : "Play"}</button></div></header>
        {trace.values.length > 0 && <><div className="dsa-live-structure-tabs" role="tablist" aria-label="Data structure visualization">{([ ["array", "Array"], ["linked-list", "Linked list"], ["stack", "Stack"], ["queue", "Queue"], ["hash-map", "Hash map"], ["bst", "BST"], ["graph", "Graph"] ] as const).map(([key, label]) => <button type="button" role="tab" aria-selected={structure === key} className={structure === key ? "active" : ""} key={key} onClick={() => setStructure(key)}>{label}</button>)}</div>{structure === "array" && <div className="dsa-live-array" style={{ "--array-length": trace.values.length } as CSSProperties & { "--array-length": number }}><div className="dsa-live-cursor" style={{ left: `${(((trace.steps[step]?.index ?? 0) + .5) / trace.values.length) * 100}%` }}><span>{trace.steps[step]?.variable ?? "array"}</span><i/></div>{trace.values.map((value, index) => <div className={`dsa-live-cell${index === trace.steps[step]?.index ? " active" : index < (trace.steps[step]?.index ?? -1) ? " visited" : ""}`} key={`${index}-${value}`}><small>{trace.steps[step]?.arrayName ?? "data"}[{index}]</small><strong>{value}</strong></div>)}</div>}{structure === "linked-list" && <div className="dsa-live-list-wrap"><div className="dsa-live-list">{trace.values.map((value, index) => <div className="dsa-live-list-item" key={`${index}-${value}`}><div className={`dsa-live-list-node${index === trace.steps[step]?.index ? " active" : index < (trace.steps[step]?.index ?? -1) ? " visited" : ""}`}><small>{index}</small><strong>{value}</strong></div>{index < trace.values.length - 1 && <div className="dsa-live-list-link"><span/><ArrowRight size={16}/></div>}</div>)}<div className="dsa-live-null">NULL</div></div></div>}{structure === "stack" && <div className="dsa-live-stack-wrap"><span className="dsa-live-structure-label">TOP ↓</span>{[...trace.values].reverse().map((value, offset) => { const index = trace.values.length - offset - 1; return <div className={`dsa-live-stack-cell${index === trace.steps[step]?.index ? " active" : ""}`} key={`${index}-${value}`}>{value}<small>index {index}</small></div>; })}<span className="dsa-live-structure-label">BOTTOM</span></div>}{structure === "queue" && <div className="dsa-live-queue-wrap"><span className="dsa-live-structure-label">FRONT</span><div className="dsa-live-array" style={{ "--array-length": trace.values.length } as CSSProperties & { "--array-length": number }}>{trace.values.map((value, index) => <div className={`dsa-live-cell${index === trace.steps[step]?.index ? " active" : ""}`} key={`${index}-${value}`}><small>{index}</small><strong>{value}</strong></div>)}</div><span className="dsa-live-structure-label">REAR</span></div>}{structure === "hash-map" && <div className="dsa-live-hash-wrap">{trace.values.map((value, index) => <div className={`dsa-live-hash-row${index === trace.steps[step]?.index ? " active" : ""}`} key={`${index}-${value}`}><span>key</span><strong>{value}</strong><i>→</i><span>value</span><strong>{index}</strong></div>)}</div>}{structure === "bst" && <div className="dsa-live-tree-wrap"><svg className="dsa-live-tree" viewBox={`0 0 1000 ${Math.max(170, treeHeight * 92)}`} role="img" aria-label="Binary search tree built from the values in your code">{bstNodes.map((node) => [node.left, node.right].filter((child): child is number => child !== null).map((child) => { const target = bstNodes.find((item) => item.id === child)!; return <line key={`${node.id}-${child}`} x1={node.x} y1={42 + node.depth * 92} x2={target.x} y2={42 + target.depth * 92}/>; }))}{bstNodes.map((node) => <g key={`${node.id}-${node.value}`} className={node.id === trace.steps[step]?.index ? "active" : node.id < (trace.steps[step]?.index ?? -1) ? "visited" : ""}><circle cx={node.x} cy={42 + node.depth * 92} r="25"/><text x={node.x} y={42 + node.depth * 92 + 5}>{node.value}</text><text className="dsa-live-tree-index" x={node.x} y={42 + node.depth * 92 + 43}>#{node.id}</text></g>)}</svg></div>}{structure === "graph" && <div className="dsa-live-graph-wrap"><svg className="dsa-live-graph" viewBox="0 0 500 250" role="img" aria-label="Graph view of the code values">{trace.values.map((_, index) => index < trace.values.length - 1 ? <line key={`e${index}`} x1={70 + index * (360 / Math.max(1, trace.values.length - 1))} y1={125} x2={70 + (index + 1) * (360 / Math.max(1, trace.values.length - 1))} y2={125}/> : null)}{trace.values.map((value, index) => { const angle = (index / trace.values.length) * Math.PI * 2 - Math.PI / 2; const x = 250 + Math.cos(angle) * 90; const y = 125 + Math.sin(angle) * 80; return <g key={`${index}-${value}`} className={index === trace.steps[step]?.index ? "active" : ""}><circle cx={x} cy={y} r="24"/><text x={x} y={y + 5}>{value}</text><text className="dsa-live-tree-index" x={x} y={y + 40}>node {index}</text></g>; })}</svg><small>Edges connect adjacent values. Replace with your graph’s edge list in code to trace custom connections.</small></div>}{trace.steps[step] && <div className="dsa-live-variable-strip"><span>LIVE VARIABLES · STEP {step + 1}</span><div>{trace.steps[step].memory.map((value, index) => <code key={`${value}-${index}`}>{value}</code>)}</div></div>}</>}
        {trace.steps.length ? <><div className="dsa-live-step-info"><span>ITERATION {step + 1} / {trace.steps.length}</span><strong>{trace.steps[step]?.variable}</strong><code>{trace.steps[step]?.arrayName}[{trace.steps[step]?.index}] = {trace.steps[step]?.value}</code></div><div className="dsa-live-logic-card"><span>LOGIC AT THIS STEP</span><strong>{trace.steps[step]?.logic}</strong><div>{trace.steps[step]?.memory.map((value) => <code key={value}>{value}</code>)}</div></div><div className="dsa-live-step-buttons"><button onClick={() => { setPlaying(false); setStep((value) => Math.max(0, value - 1)); }} disabled={step === 0}>Previous</button><button onClick={() => { setPlaying(false); setStep((value) => Math.min(trace.steps.length - 1, value + 1)); }} disabled={step === trace.steps.length - 1}>Next iteration</button></div></> : sourceFlow.length ? <><div className="dsa-live-flow-counter">SOURCE FLOW <span>STEP {step + 1} / {sourceFlow.length}</span></div><div className="dsa-live-source-flow">{sourceFlow.map((item, index) => <button type="button" key={`${item.line}-${item.title}-${index}`} className={`dsa-live-flow-node kind-${item.kind}${step === index ? " active" : index < step ? " complete" : ""}`} onClick={() => { setPlaying(false); setStep(index); }}><span className="dsa-live-flow-index">{item.line ? `L${String(item.line).padStart(2, "0")}` : "↳"}</span><span className="dsa-live-flow-copy"><strong>{item.title}</strong><code>{item.source}</code><small>{item.detail}</small></span><i/></button>)}</div><div className="dsa-live-step-buttons"><button onClick={() => { setPlaying(false); setStep((value) => Math.max(0, value - 1)); }} disabled={step === 0}>Previous</button><button onClick={() => { setPlaying(false); setStep((value) => Math.min(sourceFlow.length - 1, value + 1)); }} disabled={step === sourceFlow.length - 1}>Next code step</button></div></> : <div className="dsa-live-empty"><div><TriangleAlert size={20}/></div><strong>Write code to begin</strong><p>The code flow will appear here as soon as you start typing.</p></div>}
      </section>
      </section>
      </div></div>
    }
    <footer className="dsa-live-footnote"><span>Structure diagrams and code flow update as you type.</span><span>{challenges.length} unique problems in this editor</span></footer>
  </main>;
}
