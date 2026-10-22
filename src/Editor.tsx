import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CirclePlay,
  Code2,
  Copy,
  LoaderCircle,
  RotateCcw,
  Save,
  Terminal,
  Trash2,
} from "lucide-react";
import { supabase } from "./lib/supabase";

type Language = "C++" | "Python" | "Java" | "JavaScript";
type EditorProblem = { number: number; title: string; pattern: string; difficulty: "Easy" | "Medium" | "Hard" };

const starters: Record<Language, string> = {
  "C++": `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    cout << "Ready to solve" << endl;\n    return 0;\n}`,
  Java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n        System.out.println("Ready to solve");\n    }\n}`,
  JavaScript: `// Write your solution here\nfunction twoSum(nums, target) {\n  const seen = new Map();\n\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (seen.has(complement)) {\n      return [seen.get(complement), i];\n    }\n    seen.set(nums[i], i);\n  }\n\n  return [];\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9));`,
  Python: `# Write your solution here\nprint("Ready to solve")`,
};

function starterFor(language: Language, problem: EditorProblem | undefined) {
  if (!problem || problem.number === 1) return starters[language];
  const comment = language === "Python" ? `# ${problem.title}` : `// ${problem.title}`;
  const templates: Record<Language, string> = {
    "C++": `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Implement ${problem.title}\n    cout << "Ready to solve" << endl;\n    return 0;\n}`,
    Python: `# Implement ${problem.title}\nprint("Ready to solve")`,
    Java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Implement ${problem.title}\n        System.out.println("Ready to solve");\n    }\n}`,
    JavaScript: `// Implement ${problem.title}\nconsole.log("Ready to solve");`,
  };
  return `${comment}\n${templates[language]}`;
}

const storageKey = "codexsheet-editor-v1";

function readSavedCode(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    return value && typeof value === "object" ? value as Record<string, string> : {};
  } catch {
    return {};
  }
}

export default function Editor({ problems }: { problems: EditorProblem[] }) {
  const [language, setLanguage] = useState<Language>("JavaScript");
  const [problemNumber, setProblemNumber] = useState(1);
  const [savedCode, setSavedCode] = useState(readSavedCode);
  const initialKey = `${problems[0]?.number ?? 1}:JavaScript`;
  const [code, setCode] = useState(() => savedCode[initialKey] ?? starters.JavaScript);
  const [output, setOutput] = useState<string[]>([]);
  const [runError, setRunError] = useState(false);
  const [runNotice, setRunNotice] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState("");
  const [outputOpen, setOutputOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const codeKey = `${problemNumber}:${language}`;

  useEffect(() => {
    const next = { ...savedCode, [codeKey]: code };
    const timer = window.setTimeout(() => {
      setSavedCode(next);
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* storage may be unavailable */ }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [code, codeKey]);

  const lines = useMemo(() => code.split("\n").length, [code]);
  const fileExtension = language === "Python" ? "py" : language === "C++" ? "cpp" : language === "Java" ? "java" : "js";
  const currentProblem = problems.find((problem) => problem.number === problemNumber) ?? problems[0];

  function changeLanguage(next: Language) {
    setSavedCode((current) => ({ ...current, [codeKey]: code }));
    setLanguage(next);
    setCode(savedCode[`${problemNumber}:${next}`] ?? starterFor(next, currentProblem));
    setOutput([]);
  }

  function changeProblem(nextNumber: number) {
    setSavedCode((current) => ({ ...current, [codeKey]: code }));
    setProblemNumber(nextNumber);
    const nextProblem = problems.find((problem) => problem.number === nextNumber);
    setCode(savedCode[`${nextNumber}:${language}`] ?? starterFor(language, nextProblem));
    setOutput([]);
    setRunError(false);
    setRunNotice(false);
  }

  async function runCode() {
    setOutputOpen(true);
    setRunError(false);
    setRunNotice(false);
    const languageIds: Record<Language, number> = {
      "C++": 54,
      Java: 62,
      Python: 71,
      JavaScript: 63,
    };
    const languageId = languageIds[language];
    if (!languageId) {
      setRunError(true);
      setOutput([`${language} execution is not configured yet.`]);
      return;
    }
    if (code.length > 30000 || stdin.length > 10000) {
      setRunError(true);
      setOutput(["Code is limited to 30 KB and input to 10 KB per run."]);
      return;
    }
    if (!supabase) {
      setRunError(true);
      setOutput(["The code runner is not configured. Connect Supabase to execute code."]);
      return;
    }
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-code", {
        body: { problemNumber, languageId, sourceCode: code, customInput: stdin },
      });
      if (error) throw error;
      const result = data as {
        error?: string;
        summary?: string;
        passed?: number;
        total?: number;
        results?: Array<{ label?: string; status?: string; stdout?: string; stderr?: string }>;
      } | null;
      if (!result || result.error) throw new Error(result?.error || "The code runner returned no result.");
      const caseOutput = (result.results ?? []).flatMap((item) => [
        `${item.label || "Test case"}: ${item.status || "Finished"}`,
        item.stdout?.trimEnd(),
        item.stderr?.trimEnd(),
      ].filter((line): line is string => Boolean(line)));
      const failed = (result.results ?? []).some((item) => item.status !== "Passed" && item.status !== "Executed");
      setRunError(failed);
      setOutput([result.summary, ...caseOutput].filter((line): line is string => Boolean(line)));
    } catch (error) {
      setRunError(true);
      const message = error instanceof Error && error.name === "AbortError"
        ? "Execution took too long. Try a shorter-running solution."
        : error instanceof Error && error.message === "Failed to fetch"
          ? "Could not reach the code runner. Check your connection or try again later."
          : error instanceof Error ? error.message : String(error);
      setOutput([message]);
    } finally {
      setIsRunning(false);
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
      setRunNotice(false);
      setOutput(["Clipboard access is unavailable. Select the code and copy it manually."]);
    }
  }

  return (
    <main className="editor-page">
      <header className="editor-context">
        <div className="editor-context-icon"><Code2 size={22} /></div>
        <div className="editor-context-copy">
          <span className="editor-kicker">PRACTICE WORKSPACE</span>
          <h2>Write, run, <em>refine.</em></h2>
          <p>A quiet space to work through a coding problem.</p>
        </div>
        <div className="editor-problem-chip">
          <span>PROBLEM LIBRARY · {problems.length}</span>
          <select className="editor-problem-select" value={problemNumber} onChange={(event) => changeProblem(Number(event.target.value))} aria-label="Choose a problem">
            {problems.map((problem) => <option value={problem.number} key={problem.number}>{String(problem.number).padStart(3, "0")} · {problem.title}</option>)}
          </select>
          <small>{currentProblem?.pattern} <i /> {currentProblem?.difficulty}</small>
        </div>
      </header>

      <section className="editor-workspace" aria-label="Code editor">
        <aside className="editor-rail">
          <span className="editor-rail-heading">WORKSPACE</span>
          <span className="editor-rail-group">LANGUAGE</span>
          {(["C++", "Python", "Java", "JavaScript"] as Language[]).map((item) => (
            <button className={`editor-language${language === item ? " active" : ""}`} key={item} onClick={() => changeLanguage(item)} type="button" aria-pressed={language === item}>
              <span className="editor-language-badge">{item === "JavaScript" ? "JS" : item === "Python" ? "PY" : item === "C++" ? "C+" : "JV"}</span>{item}
              {language === item && <i />}
            </button>
          ))}
          <div className="editor-rail-bottom">
            <div className="editor-rail-note-icon"><Save size={15} /></div>
            <strong>Your work is saved</strong>
            <span>Code stays in this browser while you practice.</span>
          </div>
        </aside>

        <div className="editor-main">
          <div className="editor-tabs">
            <div className="editor-tab"><span className="editor-tab-badge">{language === "JavaScript" ? "JS" : language === "Python" ? "PY" : language === "C++" ? "C+" : "JV"}</span>solution.{fileExtension}<i /></div>
            <span className="editor-saved-tag"><Check size={13} /> Autosave on</span>
          </div>
          <div className="editor-actions">
            <div className="editor-problem-label"><i className="editor-easy-dot" /> #{String(problemNumber).padStart(3, "0")} · {currentProblem?.title} <span>· {currentProblem?.difficulty}</span></div>
            <div className="editor-action-buttons">
              <button className="editor-tool-button" onClick={() => void copyCode()} type="button" title="Copy code">{copied ? <Check size={13} /> : <Copy size={13} />}<span>{copied ? "Copied" : "Copy"}</span></button>
              <button className="editor-tool-button" onClick={() => { setCode(starterFor(language, currentProblem)); setOutput([]); setRunError(false); setRunNotice(false); }} type="button" title="Reset code"><RotateCcw size={13} /><span>Reset</span></button>
              <button className="editor-run" onClick={() => void runCode()} type="button" disabled={isRunning}><span className={isRunning ? "editor-spinner" : ""}>{isRunning ? <LoaderCircle size={14} /> : <CirclePlay size={14} />}</span><span>{isRunning ? "Running…" : "Run"}</span><kbd>Ctrl ↵</kbd></button>
            </div>
          </div>
          <div className="editor-code-area">
            <div className="editor-gutter" aria-hidden="true">{Array.from({ length: lines }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
            <textarea className="editor-textarea" aria-label={`${language} code`} autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} value={code} onChange={(event) => setCode(event.target.value)} onKeyDown={(event: { ctrlKey: boolean; metaKey: boolean; key: string; preventDefault(): void; currentTarget: { selectionStart: number; selectionEnd: number } }) => {
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); runCode(); }
              if (event.key === "Tab") { event.preventDefault(); const start = event.currentTarget.selectionStart; const end = event.currentTarget.selectionEnd; const next = `${code.slice(0, start)}  ${code.slice(end)}`; setCode(next); requestAnimationFrame(() => { event.currentTarget.selectionStart = event.currentTarget.selectionEnd = start + 2; }); }
            }} />
          </div>
          <div className="editor-statusbar"><span><i className="editor-live-dot" /> Ready</span><span>Ln {lines}, Col 1 <i /> UTF-8 <i /> {language}</span></div>
          <div className="editor-stdin-panel">
            <label htmlFor="editor-stdin">CUSTOM INPUT <span>Optional · sent to stdin</span></label>
            <textarea id="editor-stdin" aria-label="Program input" value={stdin} onChange={(event) => setStdin(event.target.value)} placeholder="Add input for your program (optional)" />
            <small>Code runs in an isolated Judge0 sandbox.</small>
          </div>
          <section className={`editor-output${outputOpen ? " open" : ""}`}>
            <div className="editor-output-head">
              <button className="editor-output-toggle" type="button" onClick={() => setOutputOpen((open) => !open)}><Terminal size={14} /> OUTPUT {isRunning && <span className="editor-output-state">RUNNING</span>}{output.length > 0 && !isRunning && <span className={`editor-output-state${runError ? " is-error" : ""}`}>{runError ? "ERROR" : runNotice ? "INFO" : "DONE"}</span>}<ChevronDown size={13} className={outputOpen ? "" : "collapsed"} /></button>
              <button className="editor-output-close" type="button" aria-label="Clear output" onClick={() => { setOutput([]); setRunError(false); setRunNotice(false); }}><Trash2 size={13} /></button>
            </div>
            {outputOpen && <div className={`editor-output-body${runError ? " is-error" : ""}${runNotice ? " is-notice" : ""}`}>{isRunning ? <span><LoaderCircle size={13} className="editor-spinner" /> Compiling and running in sandbox…</span> : output.length ? <pre>{output.join("\n")}</pre> : <span><ChevronRight size={13} /> Run your code to see the output here.</span>}</div>}
          </section>
        </div>
      </section>
      <footer className="editor-footer"><span><span className="editor-footer-spark">✳</span> Start with a small example. Build from there.</span><span>Run your code with <kbd>Ctrl</kbd> + <kbd>Enter</kbd></span></footer>
    </main>
  );
}
