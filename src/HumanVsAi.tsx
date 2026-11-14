import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Flame,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import "./human-vs-ai.css";

type TestCase = { args: unknown[]; expected: unknown };
type Challenge = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium";
  pattern: string;
  prompt: string;
  fn: string;
  starter: string;
  solution: string;
  cases: TestCase[];
};
type TestStatus = "Accepted" | "Wrong Answer" | "Compile Error" | "Runtime Error" | "TLE" | "Runner Error";
type TestResult = { passed: number; total: number; details: string[]; status: TestStatus; runtimeMs?: number; error?: string };
type RoundStatus = "ready" | "running" | "human-won" | "ai-won";
type GameStats = { wins: number; losses: number; streak: number; xp: number; bestTime: number | null };

const storageKey = "codexsheet-human-vs-ai-v1";
const emptyStats: GameStats = { wins: 0, losses: 0, streak: 0, xp: 0, bestTime: null };
const challenges: Challenge[] = [
  {
    id: "palindrome",
    title: "Palindrome check",
    difficulty: "Easy",
    pattern: "Two pointers",
    prompt: "Return true if text reads the same forward and backward. Ignore spaces, punctuation, and letter case.",
    fn: "isPalindrome",
    starter: `function isPalindrome(text) {
  // Normalize the text, then compare it with its reverse.
  return false;
}`,
    solution: `function isPalindrome(text) {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === [...clean].reverse().join("");
}`,
    cases: [
      { args: ["racecar"], expected: true },
      { args: ["A man, a plan, a canal: Panama"], expected: true },
      { args: ["CodexSheet"], expected: false },
      { args: [""], expected: true },
    ],
  },
  {
    id: "two-sum",
    title: "Two sum",
    difficulty: "Easy",
    pattern: "Hash map",
    prompt: "Return the indices of the two numbers that add up to target. You can assume exactly one answer exists.",
    fn: "twoSum",
    starter: `function twoSum(nums, target) {
  // Return the two matching indices.
  return [];
}`,
    solution: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i += 1) {
    const match = target - nums[i];
    if (seen.has(match)) return [seen.get(match), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    cases: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
    ],
  },
  {
    id: "reverse-string",
    title: "Reverse a string",
    difficulty: "Easy",
    pattern: "Strings",
    prompt: "Return a new string with the characters in reverse order.",
    fn: "reverseString",
    starter: `function reverseString(text) {
  // Return the characters in reverse order.
  return text;
}`,
    solution: `function reverseString(text) {
  return [...text].reverse().join("");
}`,
    cases: [
      { args: ["hello"], expected: "olleh" },
      { args: ["CodexSheet"], expected: "teeShxedoC" },
      { args: [""], expected: "" },
    ],
  },
  {
    id: "contains-duplicate",
    title: "Contains duplicate",
    difficulty: "Easy",
    pattern: "Hash set",
    prompt: "Return true if any value appears more than once in the array.",
    fn: "containsDuplicate",
    starter: `function containsDuplicate(nums) {
  // Check whether a value has already appeared.
  return false;
}`,
    solution: `function containsDuplicate(nums) {
  return new Set(nums).size !== nums.length;
}`,
    cases: [
      { args: [[1, 2, 3, 1]], expected: true },
      { args: [[1, 2, 3, 4]], expected: false },
      { args: [[]], expected: false },
    ],
  },
  {
    id: "valid-anagram",
    title: "Valid anagram",
    difficulty: "Easy",
    pattern: "Strings",
    prompt: "Return true if the two lowercase words contain the same letters with the same frequencies.",
    fn: "isAnagram",
    starter: `function isAnagram(first, second) {
  // Compare the letters in both words.
  return false;
}`,
    solution: `function isAnagram(first, second) {
  if (first.length !== second.length) return false;
  return [...first].sort().join("") === [...second].sort().join("");
}`,
    cases: [
      { args: ["listen", "silent"], expected: true },
      { args: ["rat", "car"], expected: false },
      { args: ["aacc", "ccac"], expected: false },
    ],
  },
  {
    id: "max-subarray",
    title: "Maximum subarray",
    difficulty: "Medium",
    pattern: "Dynamic programming",
    prompt: "Find the largest possible sum of a non-empty, contiguous slice of the array.",
    fn: "maxSubArray",
    starter: `function maxSubArray(nums) {
  // Track the best slice ending at each position.
  return 0;
}`,
    solution: `function maxSubArray(nums) {
  let current = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}`,
    cases: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1 },
      { args: [[-5, -2, -7]], expected: -2 },
    ],
  },
];

const roundSeconds = 45 * 60;

function readStats(): GameStats {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
    if (typeof value !== "object" || value === null || Array.isArray(value)) return emptyStats;
    const saved = value as Partial<GameStats>;
    return {
      wins: Number.isInteger(saved.wins) && saved.wins! >= 0 ? saved.wins! : 0,
      losses: Number.isInteger(saved.losses) && saved.losses! >= 0 ? saved.losses! : 0,
      streak: Number.isInteger(saved.streak) && saved.streak! >= 0 ? saved.streak! : 0,
      xp: Number.isInteger(saved.xp) && saved.xp! >= 0 ? saved.xp! : 0,
      bestTime: typeof saved.bestTime === "number" && Number.isFinite(saved.bestTime) && saved.bestTime > 0 ? saved.bestTime : null,
    };
  } catch {
    return emptyStats;
  }
}

function readDraft(id: string, fallback: string) {
  try {
    return window.localStorage.getItem(`${storageKey}:draft:${id}`) ?? fallback;
  } catch {
    return fallback;
  }
}

function runInWorker(code: string, challenge: Challenge): Promise<TestResult> {
  return new Promise((resolve) => {
    const source = `
      self.onmessage = ({ data }) => {
        const stable = value => {
          if (Array.isArray(value)) return value.map(stable);
          if (value && typeof value === "object") return Object.fromEntries(
            Object.keys(value).sort().map(key => [key, stable(value[key])])
          );
          return value;
        };
        const display = value => {
          const json = JSON.stringify(value);
          return json === undefined ? String(value) : json;
        };
        const startedAt = performance.now();
        let createSolution;
        try {
          createSolution = new Function(data.code + "\\n; return typeof " + data.fn +
            " === 'function' ? " + data.fn + " : null;");
        } catch (error) {
          self.postMessage({
            passed: 0,
            total: data.cases.length,
            details: [],
            status: "Compile Error",
            runtimeMs: performance.now() - startedAt,
            error: error instanceof Error ? error.message : "The code could not be compiled.",
          });
          return;
        }
        let candidate;
        try {
          candidate = createSolution();
        } catch (error) {
          self.postMessage({
            passed: 0,
            total: data.cases.length,
            details: [],
            status: "Runtime Error",
            runtimeMs: performance.now() - startedAt,
            error: error instanceof Error ? error.message : "The code failed before the tests ran.",
          });
          return;
        }
        if (typeof candidate !== "function") {
          self.postMessage({
            passed: 0,
            total: data.cases.length,
            details: [],
            status: "Compile Error",
            runtimeMs: performance.now() - startedAt,
            error: "Define the requested function: " + data.fn + ".",
          });
          return;
        }
        const solution = candidate;
        try {
          let runtimeError = false;
          let passed = 0;
          const details = data.cases.map((test, index) => {
            try {
              const actual = solution(...JSON.parse(JSON.stringify(test.args)));
              const ok = JSON.stringify(stable(actual)) === JSON.stringify(stable(test.expected));
              if (ok) passed += 1;
              return ok
                ? "Test " + (index + 1) + ": passed"
                : "Test " + (index + 1) + ": expected " + display(test.expected) + ", received " + display(actual);
            } catch (error) {
              runtimeError = true;
              return "Test " + (index + 1) + ": " + (error instanceof Error ? error.message : String(error));
            }
          });
          self.postMessage({
            passed,
            total: data.cases.length,
            details,
            status: runtimeError ? "Runtime Error" : passed === data.cases.length ? "Accepted" : "Wrong Answer",
            runtimeMs: performance.now() - startedAt,
          });
        } catch (error) {
          self.postMessage({
            passed: 0,
            total: data.cases.length,
            details: [],
            status: "Runtime Error",
            runtimeMs: performance.now() - startedAt,
            error: error instanceof Error ? error.message : "The code could not run.",
          });
        }
      };
    `;
    const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    const worker = new Worker(url);
    let settled = false;
    const finish = (result: TestResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timeout = window.setTimeout(
      () => finish({ passed: 0, total: challenge.cases.length, details: [], status: "TLE", error: "Execution exceeded the 2-second time limit. Check for an infinite loop." }),
      2000,
    );
    worker.onmessage = (event: MessageEvent<TestResult>) => finish(event.data);
    worker.onerror = () => finish({ passed: 0, total: challenge.cases.length, details: [], status: "Runner Error", error: "The isolated browser runner could not start." });
    worker.postMessage({ code, fn: challenge.fn, cases: challenge.cases });
  });
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function HumanVsAi() {
  const [challengeId, setChallengeId] = useState(challenges[0].id);
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];
  const [code, setCode] = useState(() => readDraft(challenges[0].id, challenges[0].starter));
  const [stats, setStats] = useState<GameStats>(readStats);
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const [status, setStatus] = useState<RoundStatus>("ready");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [storageError, setStorageError] = useState("");
  const settledRef = useRef(false);

  useEffect(() => {
    if (status !== "running" || startedAt === null) return;
    const updateClock = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed >= roundSeconds) settleRound(false, roundSeconds);
    };
    const timer = window.setInterval(updateClock, 250);
    return () => window.clearInterval(timer);
  }, [startedAt, status]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`${storageKey}:draft:${challenge.id}`, code);
      setStorageError("");
    } catch {
      setStorageError("Draft saving is unavailable in this browser; your code will be lost when you leave.");
    }
  }, [challenge.id, code]);

  function settleRound(humanWon: boolean, time: number) {
    if (settledRef.current) return;
    settledRef.current = true;
    setStatus(humanWon ? "human-won" : "ai-won");
    setRunning(false);
    const current = statsRef.current;
    const next: GameStats = humanWon
      ? {
          ...current,
          wins: current.wins + 1,
          streak: current.streak + 1,
          xp: current.xp + 100,
          bestTime: current.bestTime === null ? time : Math.min(current.bestTime, time),
        }
      : { ...current, losses: current.losses + 1, streak: 0 };
    statsRef.current = next;
    setStats(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError("Match stats could not be saved in this browser.");
    }
  }

  function startRound() {
    settledRef.current = false;
    setTestResult(null);
    setElapsedSeconds(0);
    setStartedAt(Date.now());
    setStatus("running");
  }

  function replay() {
    const nextChallenge = challenges.filter((item) => item.id !== challenge.id)[Math.floor(Math.random() * (challenges.length - 1))] ?? challenge;
    setChallengeId(nextChallenge.id);
    setCode(readDraft(nextChallenge.id, nextChallenge.starter));
    settledRef.current = false;
    setTestResult(null);
    setElapsedSeconds(0);
    setStartedAt(null);
    setStatus("ready");
  }

  function selectChallenge(id: string) {
    const next = challenges.find((item) => item.id === id);
    if (!next || id === challenge.id || status === "running") return;
    setChallengeId(id);
    setCode(readDraft(id, next.starter));
    setTestResult(null);
    setElapsedSeconds(0);
    setStartedAt(null);
    setStatus("ready");
  }

  async function submitCode() {
    if (status !== "running" || running || settledRef.current) return;
    setRunning(true);
    setTestResult(null);
    try {
      const result = await runInWorker(code, challenge);
      setTestResult(result);
      if (result.total > 0 && result.passed === result.total && !result.error && !settledRef.current && startedAt !== null) {
        const finishedIn = Math.floor((Date.now() - startedAt) / 1000);
        setElapsedSeconds(finishedIn);
        if (finishedIn < roundSeconds) settleRound(true, finishedIn);
        else settleRound(false, roundSeconds);
      }
    } catch (error) {
      setTestResult({
        passed: 0,
        total: challenge.cases.length,
        details: [],
        status: "Runner Error",
        error: error instanceof Error ? error.message : "The tests could not run.",
      });
    } finally {
      setRunning(false);
    }
  }

  const botProgress = Math.min(100, (elapsedSeconds / roundSeconds) * 100);
  const roundFinished = status === "human-won" || status === "ai-won";

  return (
    <main className="human-ai-page">
      <header className="human-ai-hero">
        <div className="human-ai-hero-copy">
          <span className="human-ai-eyebrow"><Sparkles size={13} /> CODEXSHEET BATTLE · ROUND {stats.wins + stats.losses + 1}</span>
            <h1>CodexSheet <em>Battle</em></h1>
          <p>One problem. Two minds. Can you ship a clean solution before the bot?</p>
        </div>
        <div className="human-ai-scoreboard" aria-label="Your game stats">
          <div><Trophy size={15} /><strong>{stats.wins}</strong><span>WINS</span></div>
          <div><Flame size={15} /><strong>{stats.streak}</strong><span>STREAK</span></div>
          <div><Zap size={15} /><strong>{stats.xp}</strong><span>XP</span></div>
        </div>
      </header>

      <section className="human-ai-challenges" aria-label="Choose a challenge">
        <div className="human-ai-section-label"><span>CHOOSE YOUR DUEL</span><small>{challenges.length} questions · rematches shuffle</small></div>
        <div className="human-ai-challenge-list">
          {challenges.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={`human-ai-challenge${challenge.id === item.id ? " active" : ""}`}
              aria-pressed={challenge.id === item.id}
              disabled={status === "running"}
              onClick={() => selectChallenge(item.id)}
            >
              <span className="human-ai-challenge-number">0{index + 1}</span>
              <strong>{item.title}</strong>
              <small>{item.difficulty} · {item.pattern}</small>
              {challenge.id === item.id && <ChevronRight size={14} />}
            </button>
          ))}
        </div>
      </section>

      <div className="human-ai-arena">
        <section className="human-ai-problem">
          <div className="human-ai-section-label"><span>THE CHALLENGE</span><span className={`human-ai-difficulty ${challenge.difficulty.toLowerCase()}`}>{challenge.difficulty}</span></div>
          <h2>{challenge.title}</h2>
          <p>{challenge.prompt}</p>
          <div className="human-ai-signature"><span>YOUR FUNCTION</span><code>{challenge.fn}(…)</code></div>
          <div className="human-ai-samples">
            <span>EXAMPLE CHECKS</span>
            {challenge.cases.slice(0, 3).map((test, index) => (
              <div key={index}><code>{JSON.stringify(test.args)}</code><span>→</span><code>{JSON.stringify(test.expected)}</code></div>
            ))}
          </div>
          <div className="human-ai-round-length"><Clock3 size={14} /><span><strong>45 minutes</strong><small>One focused round. Your draft saves as you code.</small></span></div>
          <div className="human-ai-disclosure"><Bot size={14} /><span>Byte is a built-in AI rival. Its solve time is a game benchmark, not a live AI model.</span></div>
        </section>

        <section className="human-ai-match" aria-label="Human versus AI match">
          <div className="human-ai-match-head">
            <div className="human-ai-player human">
              <span className="human-ai-avatar"><Code2 size={18} /></span>
              <span><strong>YOU</strong><small>Human coder</small></span>
            </div>
            <span className="human-ai-versus">VS</span>
            <div className="human-ai-player bot">
              <span className="human-ai-avatar"><Bot size={19} /></span>
              <span><strong>BYTE</strong><small>{status === "ai-won" ? "Solved it" : status === "human-won" ? "Outcoded!" : status === "running" ? "Thinking…" : "AI rival"}</small></span>
            </div>
          </div>
          <div className="human-ai-race">
            <div className="human-ai-race-label"><span><Clock3 size={13} /> {status === "ready" ? "READY WHEN YOU ARE" : status === "running" ? "THE CLOCK IS TICKING" : status === "human-won" ? "YOU BEAT THE BOT" : "BYTE GOT THERE FIRST"}</span><strong>{formatTime(Math.max(0, roundSeconds - elapsedSeconds))}</strong></div>
            <div className="human-ai-race-track"><span style={{ width: `${botProgress}%` }} /></div>
            <small>{status === "running" ? "45-minute round · Byte is working on the same challenge" : status === "ready" ? "45:00 on the clock · solve all tests to win" : status === "human-won" ? `You solved it in ${formatTime(elapsedSeconds)} · +100 XP` : "Time's up. Review Byte's solution and try a new question."}</small>
          </div>
          <div className="human-ai-editor">
            <div className="human-ai-editor-bar"><span><i /><i /><i /></span><strong>solution.js</strong><button type="button" disabled={status === "running"} onClick={() => { setCode(challenge.starter); setTestResult(null); }}><RotateCcw size={12} /> Reset</button></div>
            <CodeMirror
              value={code}
              height="310px"
              extensions={[javascript(), EditorView.lineWrapping]}
              onChange={(value: string) => { setCode(value); setTestResult(null); }}
              readOnly={roundFinished}
              basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, bracketMatching: true }}
              aria-label="JavaScript code editor"
            />
          </div>
          <div className="human-ai-actions">
            {status === "ready" ? (
              <button type="button" className="human-ai-primary" onClick={startRound}><Play size={15} fill="currentColor" /> Start match</button>
            ) : status === "running" ? (
              <button type="button" className="human-ai-primary" onClick={submitCode} disabled={running}>
                {running ? "Running your tests…" : <><Zap size={15} /> Run all tests</>}
              </button>
            ) : (
              <button type="button" className="human-ai-primary" onClick={replay}><RotateCcw size={15} /> Rematch</button>
            )}
            {status === "running" && <span>Browser sandbox · 2-second limit</span>}
            {roundFinished && <span className={`human-ai-verdict ${status}`}><Check size={13} /> {status === "human-won" ? "100 XP earned" : "Every loss is a lesson"}</span>}
          </div>
          {testResult && (
            <div className={`human-ai-test-result${testResult.status === "Accepted" ? " success" : testResult.status === "Wrong Answer" ? "" : " error"}`} role="status">
              <strong>{testResult.status} · {testResult.passed}/{testResult.total} tests passed</strong>
              {testResult.runtimeMs !== undefined && <span>Runtime: {testResult.runtimeMs.toFixed(2)} ms</span>}
              {testResult.error && <span>{testResult.error}</span>}
              {testResult.details.map((detail) => <span key={detail}>{detail}</span>)}
            </div>
          )}
          {roundFinished && (
            <div className="human-ai-solution">
              <div><span>BYTE'S SOLUTION</span><small>Compare approaches. Take the pattern with you.</small></div>
              <pre><code>{challenge.solution}</code></pre>
            </div>
          )}
          {storageError && <p className="human-ai-storage-note" role="status">{storageError}</p>}
        </section>
      </div>
      <footer className="human-ai-footnote"><span><Sparkles size={13} /> Think clearly. Type bravely. Learn every round.</span><span>Best time · {stats.bestTime === null ? "—" : formatTime(stats.bestTime)}</span></footer>
    </main>
  );
}
