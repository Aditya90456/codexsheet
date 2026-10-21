import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Code2,
  BookOpen,
  Copy,
  Folder,
  FolderOpen,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Send,
  Terminal,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowRight,
  Lock,
} from "lucide-react";
import { useAuth } from "./lib/auth";
import { supabase } from "./lib/supabase";
import { getProblemDetail, ProblemDetail } from "./lib/problemCatalog";
import { runCodeWithInput, runBatchTestCases, TestCaseResult } from "./lib/codeRunner";

export type Language = "C++" | "Python" | "Java" | "JavaScript";
export type EditorProblem = {
  number: number;
  title: string;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

function starterFor(language: Language, problem: EditorProblem | undefined) {
  const title = problem?.title ?? "Problem";
  const pattern = problem?.pattern ?? "DSA";

  if (language === "Python") {
    return `# ${title} · ${pattern}
# Complete the function below to solve the problem.

import sys

def solve(input_text: str) -> str:
    """
    Parse the problem input and return the expected answer as a string.
    """
    lines = [line.strip() for line in input_text.strip().split("\\n") if line.strip()]
    if not lines:
        return ""

    # Write your solution logic here:
    pass

if __name__ == "__main__":
    result = solve(sys.stdin.read())
    if result is not None:
        print(result)`;
  }

  if (language === "JavaScript") {
    return `// ${title} · ${pattern}
// Complete the function below to solve the problem.

const fs = require("fs");

function solve(input) {
  // Read standard input and compute the solution
  const lines = input.trim().split("\\n").filter(Boolean);
  if (!lines.length) return "";

  // Write your solution logic here:
  return "";
}

const input = fs.readFileSync(0, "utf8");
const result = solve(input);
if (result !== undefined) {
  process.stdout.write(String(result));
}`;
  }

  if (language === "C++") {
    return `// ${title} · ${pattern}
#include <bits/stdc++.h>
using namespace std;

string solve(const string& input) {
    // Write your solution logic here:
    return "";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string input((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    cout << solve(input);
    return 0;
}`;
  }

  // Java
  return `// ${title} · ${pattern}
import java.io.*;
import java.nio.charset.StandardCharsets;

public class Main {
    static String solve(String input) {
        // Write your solution logic here:
        return "";
    }

    public static void main(String[] args) throws Exception {
        String input = new String(System.in.readAllBytes(), StandardCharsets.UTF_8);
        System.out.print(solve(input));
    }
}`;
}

const storageKey = "codexsheet-editor-v1";

function readSavedCode(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export default function Editor({
  problems,
  initialProblemNumber = 1,
  onStatusChange,
  progress = {},
}: {
  problems: EditorProblem[];
  initialProblemNumber?: number;
  onStatusChange?: (number: number, status: "Todo" | "In progress" | "Solved") => void;
  progress?: Record<number, { status: string; notes?: string }>;
}) {
  const { isSignedIn, openSignUp, openSignIn } = useAuth();
  const [language, setLanguage] = useState<Language>("Python");
  const [problemNumber, setProblemNumber] = useState(initialProblemNumber);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [explorerSearch, setExplorerSearch] = useState("");
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());
  const [problemDropdownOpen, setProblemDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");

  const [savedCode, setSavedCode] = useState(readSavedCode);
  const initialKey = `${initialProblemNumber}:Python`;
  const [code, setCode] = useState(
    () => savedCode[initialKey] ?? starterFor("Python", problems.find((p) => p.number === initialProblemNumber)),
  );

  const [output, setOutput] = useState<string[]>([]);
  const [runError, setRunError] = useState(false);
  const [runNotice, setRunNotice] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState("");
  const [outputOpen, setOutputOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);

  const codeKey = `${problemNumber}:${language}`;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentProblem = useMemo(() => {
    return problems.find((p) => p.number === problemNumber) ?? problems[0];
  }, [problems, problemNumber]);

  const detail = useMemo<ProblemDetail>(() => {
    const problemDetail = getProblemDetail(
      problemNumber,
      currentProblem?.title,
      currentProblem?.pattern,
      currentProblem?.difficulty,
    );
    if (problemNumber !== 250) return problemDetail;
    return {
      ...problemDetail,
      description:
        "Given an upper bound n and a hidden number pick between 1 and n, find pick using binary search. Input contains n and pick as two integers; output the hidden number.",
      constraints: ["1 <= pick <= n <= 2^31 - 1"],
      examples: [{ input: "10 6", output: "6" }],
      testCases: [
        { stdin: "10 6", expected: "6" },
        { stdin: "1 1", expected: "1" },
        { stdin: "2 1", expected: "1" },
        { stdin: "100 99", expected: "99" },
      ],
    };
  }, [problemNumber, currentProblem]);

  // Set default stdin from first example
  useEffect(() => {
    if (detail.examples && detail.examples.length > 0) {
      setStdin(detail.examples[0].input);
    } else {
      setStdin("");
    }
    setTestResults(null);
  }, [detail]);

  // Auto-save code
  useEffect(() => {
    const next = { ...savedCode, [codeKey]: code };
    const timer = window.setTimeout(() => {
      setSavedCode(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage may be full or blocked */
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [code, codeKey, savedCode]);

  // Auto-expand active pattern
  useEffect(() => {
    if (currentProblem) {
      setExpandedPatterns((prev) => new Set([...prev, currentProblem.pattern]));
    }
  }, [currentProblem]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProblemDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lines = useMemo(() => code.split("\n").length, [code]);
  const fileExtension = language === "Python" ? "py" : language === "C++" ? "cpp" : language === "Java" ? "java" : "js";

  // Filtered problems for explorer
  const explorerFiltered = useMemo(() => {
    const q = explorerSearch.trim().toLowerCase();
    if (!q) return problems;
    return problems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.pattern.toLowerCase().includes(q) ||
        String(p.number).includes(q),
    );
  }, [problems, explorerSearch]);

  const patternGroups = useMemo(() => {
    const map = new Map<string, EditorProblem[]>();
    for (const p of explorerFiltered) {
      if (!map.has(p.pattern)) map.set(p.pattern, []);
      map.get(p.pattern)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [explorerFiltered]);

  // Filtered problems for dropdown
  const dropdownFiltered = useMemo(() => {
    const q = dropdownSearch.trim().toLowerCase();
    if (!q) return problems;
    return problems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.pattern.toLowerCase().includes(q) ||
        String(p.number).includes(q),
    );
  }, [problems, dropdownSearch]);

  function changeLanguage(next: Language) {
    setSavedCode((cur) => ({ ...cur, [codeKey]: code }));
    setLanguage(next);
    setCode(savedCode[`${problemNumber}:${next}`] ?? starterFor(next, currentProblem));
    setOutput([]);
    setTestResults(null);
  }

  function changeProblem(nextNumber: number) {
    setSavedCode((cur) => ({ ...cur, [codeKey]: code }));
    setProblemNumber(nextNumber);
    const nextProb = problems.find((p) => p.number === nextNumber);
    setCode(savedCode[`${nextNumber}:${language}`] ?? starterFor(language, nextProb));
    setOutput([]);
    setRunError(false);
    setRunNotice(false);
    setTestResults(null);
    setProblemDropdownOpen(false);
  }

  async function handleRunCode(inputToRun = stdin) {
    if (!isSignedIn) {
      openSignUp();
      return;
    }
    setOutputOpen(true);
    setRunError(false);
    setRunNotice(false);
    setTestResults(null);
    setIsRunning(true);

    try {
      const result = await runCodeWithInput(code, language, inputToRun);
      setIsRunning(false);
      if (!result.success) {
        setRunError(true);
        setOutput([result.error || "Execution failed."]);
      } else {
        setRunError(false);
        const timeNote = result.executionTimeMs ? `[Finished in ${result.executionTimeMs}ms]` : "";
        setOutput([result.output, timeNote].filter(Boolean));
      }
    } catch (err) {
      setIsRunning(false);
      setRunError(true);
      setOutput([err instanceof Error ? err.message : String(err)]);
    }
  }

  async function handleSubmit() {
    if (!isSignedIn) {
      openSignUp();
      return;
    }
    setOutputOpen(true);
    setRunError(false);
    setRunNotice(false);
    setIsRunning(true);

    try {
      const cases = detail.testCases && detail.testCases.length > 0
        ? detail.testCases
        : detail.examples.map((ex) => ({ stdin: ex.input, expected: ex.output }));

      const batch = await runBatchTestCases(code, language, cases);
      setIsRunning(false);
      setTestResults(batch.results);

      if (batch.allPassed) {
        setRunError(false);
        setOutput([
          `🎉 Accepted! All ${batch.totalCount} test cases passed.`,
          `Status updated to Solved. Keep the streak going!`,
        ]);
        if (onStatusChange) {
          onStatusChange(problemNumber, "Solved");
        }
      } else {
        setRunError(true);
        const failedCase = batch.results.find((r) => !r.passed);
        setOutput([
          `❌ Test case ${failedCase?.caseIndex || 1} failed (${batch.passedCount}/${batch.totalCount} passed).`,
          failedCase?.error ? `Error: ${failedCase.error}` : `Expected:\n${failedCase?.expected}\n\nActual:\n${failedCase?.actual}`,
        ]);
      }
    } catch (err) {
      setIsRunning(false);
      setRunError(true);
      setOutput([err instanceof Error ? err.message : String(err)]);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setOutputOpen(true);
      setRunError(true);
      setOutput(["Clipboard access is unavailable. Select the code and copy manually."]);
    }
  }

  function resetCode() {
    setCode(starterFor(language, currentProblem));
    setOutput([]);
    setRunError(false);
    setRunNotice(false);
    setTestResults(null);
  }

  const problemStatus = progress[problemNumber]?.status ?? "Todo";

  return (
    <main className="editor-page">
      {/* ── Context Header ── */}
      <header className="editor-context">
        <div className="editor-context-icon">
          <Code2 size={22} />
        </div>
        <div className="editor-context-copy">
          <span className="editor-kicker">PRACTICE WORKSPACE</span>
          <h2>
            Write, run, <em>refine.</em>
          </h2>
          <p>Full in-browser sandbox for JavaScript & Python with real test case verification.</p>
        </div>

        {/* ── Problem selector dropdown (wide, searchable) ── */}
        <div className="editor-problem-chip-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="editor-problem-chip-btn"
            onClick={() => setProblemDropdownOpen((prev) => !prev)}
            aria-expanded={problemDropdownOpen}
            aria-haspopup="listbox"
          >
            <div className="chip-btn-left">
              <span className="chip-badge">#{String(problemNumber).padStart(3, "0")}</span>
              <strong className="chip-title">{currentProblem?.title}</strong>
            </div>
            <div className="chip-btn-right">
              <span className={`chip-diff diff-${currentProblem?.difficulty.toLowerCase()}`}>
                {currentProblem?.difficulty}
              </span>
              <span className={`chip-status-dot status-${problemStatus.toLowerCase().replace(" ", "-")}`} />
              <ChevronDown size={14} className={problemDropdownOpen ? "rotate-180" : ""} />
            </div>
          </button>

          {problemDropdownOpen && (
            <div className="editor-dropdown-menu" role="listbox">
              <div className="dropdown-search-box">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search 250 problems or patterns…"
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
                  autoFocus
                />
                {dropdownSearch && (
                  <button type="button" className="dropdown-clear-btn" onClick={() => setDropdownSearch("")}>
                    ✕
                  </button>
                )}
              </div>
              <div className="dropdown-list">
                {dropdownFiltered.map((p) => {
                  const stat = progress[p.number]?.status ?? "Todo";
                  const isCurrent = p.number === problemNumber;
                  return (
                    <button
                      key={p.number}
                      type="button"
                      className={`dropdown-item${isCurrent ? " is-current" : ""}`}
                      onClick={() => changeProblem(p.number)}
                      role="option"
                      aria-selected={isCurrent}
                    >
                      <span className="dropdown-num">{String(p.number).padStart(3, "0")}</span>
                      <div className="dropdown-info">
                        <strong>{p.title}</strong>
                        <small>{p.pattern}</small>
                      </div>
                      <span className={`dropdown-diff diff-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                      <span className={`dropdown-status status-${stat.toLowerCase().replace(" ", "-")}`}>
                        {stat === "Solved" ? <Check size={12} /> : null}
                      </span>
                    </button>
                  );
                })}
                {dropdownFiltered.length === 0 && (
                  <div className="dropdown-empty">No problems match "{dropdownSearch}"</div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <section className="editor-workspace" aria-label="Code editor">
        {/* ── Left Rail: Language switcher + Problem Explorer Drawer ── */}
        <aside className={`editor-rail${explorerOpen ? " has-explorer" : ""}`}>
          <div className="editor-rail-header">
            <span className="editor-rail-heading">EXPLORER</span>
            <button
              type="button"
              className="rail-toggle-btn"
              onClick={() => setExplorerOpen((o) => !o)}
              title={explorerOpen ? "Collapse problem tree" : "Expand problem tree"}
            >
              {explorerOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
            </button>
          </div>

          <div className="editor-rail-group">LANGUAGE</div>
          <div className="editor-language-list">
            {(["Python", "JavaScript", "C++", "Java"] as Language[]).map((item) => (
              <button
                className={`editor-language${language === item ? " active" : ""}`}
                key={item}
                onClick={() => changeLanguage(item)}
                type="button"
                aria-pressed={language === item}
              >
                <span className="editor-language-badge">
                  {item === "JavaScript" ? "JS" : item === "Python" ? "PY" : item === "C++" ? "C+" : "JV"}
                </span>
                <span>{item}</span>
                {language === item && <i />}
              </button>
            ))}
          </div>

          {/* Collapsible Problem Explorer Tree */}
          {explorerOpen && (
            <div className="editor-explorer-panel">
              <div className="explorer-search">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Filter problems…"
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                />
              </div>

              <div className="explorer-tree">
                {patternGroups.map(([pat, pList]) => {
                  const isExpanded = expandedPatterns.has(pat);
                  const solvedInGroup = pList.filter((p) => progress[p.number]?.status === "Solved").length;
                  return (
                    <div className="explorer-group" key={pat}>
                      <button
                        type="button"
                        className="explorer-group-head"
                        onClick={() => {
                          setExpandedPatterns((prev) => {
                            const next = new Set(prev);
                            if (next.has(pat)) next.delete(pat);
                            else next.add(pat);
                            return next;
                          });
                        }}
                      >
                        <ChevronRight size={12} className={isExpanded ? "rotate-90" : ""} />
                        {isExpanded ? <FolderOpen size={13} /> : <Folder size={13} />}
                        <span className="group-title">{pat}</span>
                        <span className="group-count">
                          {solvedInGroup}/{pList.length}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="explorer-group-items">
                          {pList.map((p) => {
                            const isCurrent = p.number === problemNumber;
                            const st = progress[p.number]?.status ?? "Todo";
                            return (
                              <button
                                key={p.number}
                                type="button"
                                className={`explorer-item${isCurrent ? " active" : ""}`}
                                onClick={() => changeProblem(p.number)}
                              >
                                <FileCode size={12} className="explorer-item-icon" />
                                <span className="explorer-item-num">{String(p.number).padStart(3, "0")}</span>
                                <span className="explorer-item-title">{p.title}</span>
                                <span className={`explorer-diff diff-${p.difficulty.toLowerCase()}`}>
                                  {p.difficulty[0]}
                                </span>
                                {st === "Solved" && <Check size={11} className="explorer-solved-icon" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="editor-rail-bottom">
            <div className="editor-rail-note-icon">
              <Check size={14} />
            </div>
            <strong>In-Browser Execution</strong>
            <span>Python 3 and JavaScript run locally with zero latency.</span>
          </div>
        </aside>

        {/* ── Editor Main (Code Canvas + Side Panels) ── */}
        <div className="editor-main">
          {/* ── Canvas ── */}
          <div className="editor-canvas">
            {/* Tabs */}
            <div className="editor-tabs">
              <div className="editor-tab">
                <span className="editor-tab-badge">
                  {language === "JavaScript" ? "JS" : language === "Python" ? "PY" : language === "C++" ? "C+" : "JV"}
                </span>
                solution.{fileExtension}
                <i />
              </div>
              <span className="editor-saved-tag">
                <Check size={13} /> Autosave on
              </span>
            </div>

            {/* Actions Bar */}
            <div className="editor-actions">
              <div className="editor-problem-label">
                <i className={`editor-dot status-${problemStatus.toLowerCase().replace(" ", "-")}`} />#
                {String(problemNumber).padStart(3, "0")} · {currentProblem?.title}
                <span>· {currentProblem?.difficulty}</span>
              </div>
              <div className="editor-action-buttons">
                {!isSignedIn && (
                  <button
                    type="button"
                    className="editor-auth-gate-badge"
                    onClick={openSignUp}
                    title="Sign up to run and edit code"
                  >
                    <Lock size={12} />
                    <span>Sign up to code</span>
                  </button>
                )}
                <button
                  className="editor-tool-button"
                  onClick={() => void copyCode()}
                  type="button"
                  title="Copy code"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  className="editor-tool-button"
                  onClick={resetCode}
                  type="button"
                  title="Reset code"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
                <button
                  className="editor-run"
                  onClick={() => void handleRunCode()}
                  type="button"
                  disabled={isRunning}
                  title={!isSignedIn ? "Sign up to run code" : "Run with Custom Input (Ctrl+Enter)"}
                >
                  <span className={isRunning ? "editor-spinner" : ""}>
                    {isRunning ? <LoaderCircle size={14} /> : <CirclePlay size={14} />}
                  </span>
                  <span>{isRunning ? "Running…" : "Run code"}</span>
                  <kbd>Ctrl ↵</kbd>
                </button>
                <button
                  className="editor-submit"
                  onClick={() => void handleSubmit()}
                  type="button"
                  disabled={isRunning}
                  title={!isSignedIn ? "Sign up to submit code" : "Run tests and verify solution"}
                >
                  <Send size={13} />
                  <span>{isRunning ? "Testing…" : "Submit"}</span>
                </button>
              </div>
            </div>

            {/* Code Textarea & Gutter */}
            <div className="editor-code-area">
              {!isSignedIn && (
                <div className="editor-auth-gate-overlay">
                  <div className="editor-auth-gate-modal">
                    <div className="editor-auth-gate-icon">
                      <Lock size={22} />
                    </div>
                    <h3>Sign up to use the Editor</h3>
                    <p>
                      You must create an account or sign in to edit code, execute algorithms, run custom test cases, and save your solutions.
                    </p>
                    <div className="editor-auth-gate-buttons">
                      <button
                        type="button"
                        className="editor-auth-primary-btn"
                        onClick={openSignUp}
                      >
                        Create Free Account
                      </button>
                      <button
                        type="button"
                        className="editor-auth-secondary-btn"
                        onClick={openSignIn}
                      >
                        Sign In
                      </button>
                    </div>
                    <div className="editor-auth-gate-features">
                      <span>✓ In-browser Python & JS runner</span>
                      <span>✓ 75+ Curated problems</span>
                      <span>✓ Custom test inputs</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="editor-gutter" aria-hidden="true">
                {Array.from({ length: lines }, (_, index) => (
                  <span key={index}>{index + 1}</span>
                ))}
              </div>
              <textarea
                className={`editor-textarea${!isSignedIn ? " locked" : ""}`}
                aria-label={`${language} code`}
                readOnly={!isSignedIn}
                onClick={() => {
                  if (!isSignedIn) openSignUp();
                }}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={code}
                onChange={(event) => {
                  if (!isSignedIn) {
                    openSignUp();
                    return;
                  }
                  setCode(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (!isSignedIn) {
                    event.preventDefault();
                    openSignUp();
                    return;
                  }
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                    event.preventDefault();
                    void handleRunCode();
                  }
                  if (event.key === "Tab") {
                    event.preventDefault();
                    const start = event.currentTarget.selectionStart;
                    const end = event.currentTarget.selectionEnd;
                    const next = `${code.slice(0, start)}  ${code.slice(end)}`;
                    setCode(next);
                    requestAnimationFrame(() => {
                      if (event.currentTarget) {
                        event.currentTarget.selectionStart = event.currentTarget.selectionEnd = start + 2;
                      }
                    });
                  }
                }}
              />
            </div>

            {/* Status bar */}
            <div className="editor-statusbar">
              <span>
                {!isSignedIn ? (
                  <span
                    className="editor-auth-status-hint"
                    onClick={openSignUp}
                    style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--c-accent-2, #818cf8)" }}
                  >
                    <Lock size={11} /> Sign up required to run code
                  </span>
                ) : (
                  <>
                    <i className="editor-live-dot" /> Ready
                  </>
                )}
              </span>
              <span>
                Ln {lines}, Col 1 <i /> UTF-8 <i /> {language}
              </span>
            </div>
          </div>

          {/* ── Side Panels (Brief + Stdin + Output) ── */}
          <aside className="editor-sidepanels">
            {/* Problem Brief */}
            <section className="editor-problem-brief" aria-label="Problem brief">
              <header>
                <span>
                  <BookOpen size={14} /> PROBLEM BRIEF
                </span>
                <small>{currentProblem?.pattern}</small>
              </header>

              <div className="brief-content">
                <p className="brief-description">{detail.description}</p>

                {detail.constraints && detail.constraints.length > 0 && (
                  <div className="brief-constraints-box">
                    <span className="brief-section-lbl">CONSTRAINTS</span>
                    <ul className="editor-constraints">
                      {detail.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {detail.examples && detail.examples.length > 0 && (
                  <div className="brief-examples-box">
                    <span className="brief-section-lbl">EXAMPLES</span>
                    {detail.examples.map((example, idx) => (
                      <div className="editor-example" key={idx}>
                        <div className="example-header">
                          <strong>Example {idx + 1}</strong>
                          <button
                            type="button"
                            className="example-use-btn"
                            onClick={() => {
                              setStdin(example.input);
                              setOutputOpen(true);
                            }}
                            title="Load this input into Custom Input below"
                          >
                            Use as Input <ArrowRight size={11} />
                          </button>
                        </div>
                        <div className="example-body">
                          <span>INPUT</span>
                          <pre>{example.input}</pre>
                          <span>OUTPUT</span>
                          <pre>{example.output}</pre>
                          {example.explanation && (
                            <small className="example-expl">{example.explanation}</small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Stdin Panel */}
            <div className="editor-stdin-panel">
              <div className="stdin-header">
                <label htmlFor="editor-stdin">
                  CUSTOM INPUT <span>sent to standard input</span>
                </label>
                {detail.examples?.[0] && (
                  <button
                    type="button"
                    className="stdin-reset-link"
                    onClick={() => setStdin(detail.examples[0].input)}
                  >
                    Load Ex 1
                  </button>
                )}
              </div>
              <textarea
                id="editor-stdin"
                aria-label="Program standard input"
                value={stdin}
                onChange={(event) => setStdin(event.target.value)}
                placeholder="Enter custom input here..."
              />
            </div>

            {/* Output Panel */}
            <section className={`editor-output${outputOpen ? " open" : ""}`}>
              <div className="editor-output-head">
                <button
                  className="editor-output-toggle"
                  type="button"
                  onClick={() => setOutputOpen((open) => !open)}
                >
                  <Terminal size={14} /> OUTPUT{" "}
                  {isRunning && <span className="editor-output-state is-running">RUNNING</span>}
                  {output.length > 0 && !isRunning && (
                    <span className={`editor-output-state${runError ? " is-error" : " is-success"}`}>
                      {runError ? "ERROR" : runNotice ? "INFO" : "DONE"}
                    </span>
                  )}
                  <ChevronDown size={13} className={outputOpen ? "" : "collapsed"} />
                </button>
                <button
                  className="editor-output-close"
                  type="button"
                  aria-label="Clear output"
                  onClick={() => {
                    setOutput([]);
                    setRunError(false);
                    setRunNotice(false);
                    setTestResults(null);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {outputOpen && (
                <div
                  className={`editor-output-body${runError ? " is-error" : ""}${runNotice ? " is-notice" : ""}`}
                >
                  {isRunning ? (
                    <span>
                      <LoaderCircle size={13} className="editor-spinner" /> Running in sandbox…
                    </span>
                  ) : testResults ? (
                    <div className="test-results-container">
                      <div className="test-results-summary">
                        <strong>
                          Test Suite:{" "}
                          {testResults.filter((t) => t.passed).length} / {testResults.length} Passed
                        </strong>
                      </div>
                      <div className="test-case-chips">
                        {testResults.map((tc) => (
                          <div
                            key={tc.caseIndex}
                            className={`test-case-item${tc.passed ? " passed" : " failed"}`}
                          >
                            <div className="case-status-row">
                              {tc.passed ? (
                                <CheckCircle2 size={13} className="tc-icon-pass" />
                              ) : (
                                <AlertCircle size={13} className="tc-icon-fail" />
                              )}
                              <span>Case {tc.caseIndex}</span>
                              <small>{tc.passed ? "Passed" : "Wrong Answer"}</small>
                              <span className="case-time">{tc.executionTimeMs}ms</span>
                            </div>
                            {!tc.passed && (
                              <div className="case-diff-details">
                                <div>
                                  <span className="lbl">Expected:</span>
                                  <pre>{tc.expected}</pre>
                                </div>
                                <div>
                                  <span className="lbl">Actual:</span>
                                  <pre>{tc.actual}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : output.length ? (
                    <pre>{output.join("\n")}</pre>
                  ) : (
                    <span>
                      <ChevronRight size={13} /> Run your code to see the output here.
                    </span>
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="editor-footer">
        <span>
          <span className="editor-footer-spark">✳</span> Tip: Start by solving the base case, then step through the examples.
        </span>
        <span>
          Run with <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
        </span>
      </footer>
    </main>
  );
}
