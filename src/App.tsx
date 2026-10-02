import { useEffect, useMemo, useState } from "react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/clerk-react";
import {
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  ExternalLink,
  Filter,
  GitBranch,
  ListFilter,
  Search,
  Sparkles,
  Target,
  Trophy,
  Wifi,
  WifiOff,
} from "lucide-react";
import { setClerkTokenGetter, supabase } from "./lib/supabase";

type Status = "Todo" | "In progress" | "Solved";
type Problem = {
  number: number;
  title: string;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
};
type ProgressMap = Record<number, { status: Status; notes: string }>;

const seeds: Array<[string, string, Problem["difficulty"]]> = [
  ["Two Sum", "Arrays & Hashing", "Easy"],
  ["Valid Anagram", "Arrays & Hashing", "Easy"],
  ["Group Anagrams", "Arrays & Hashing", "Medium"],
  ["Top K Frequent Elements", "Arrays & Hashing", "Medium"],
  ["Product of Array Except Self", "Arrays & Hashing", "Medium"],
  ["Valid Palindrome", "Two Pointers", "Easy"],
  ["3Sum", "Two Pointers", "Medium"],
  ["Container With Most Water", "Two Pointers", "Medium"],
  ["Trapping Rain Water", "Two Pointers", "Hard"],
  ["Best Time to Buy and Sell Stock", "Sliding Window", "Easy"],
  [
    "Longest Substring Without Repeating Characters",
    "Sliding Window",
    "Medium",
  ],
  ["Longest Repeating Character Replacement", "Sliding Window", "Medium"],
  ["Minimum Window Substring", "Sliding Window", "Hard"],
  ["Valid Parentheses", "Stack", "Easy"],
  ["Min Stack", "Stack", "Medium"],
  ["Evaluate Reverse Polish Notation", "Stack", "Medium"],
  ["Daily Temperatures", "Monotonic Stack", "Medium"],
  ["Binary Search", "Binary Search", "Easy"],
  ["Search a 2D Matrix", "Binary Search", "Medium"],
  ["Koko Eating Bananas", "Binary Search", "Medium"],
  ["Reverse Linked List", "Linked List", "Easy"],
  ["Merge Two Sorted Lists", "Linked List", "Easy"],
  ["Reorder List", "Linked List", "Medium"],
  ["Remove Nth Node From End of List", "Linked List", "Medium"],
  ["LRU Cache", "Linked List", "Medium"],
  ["Invert Binary Tree", "Trees", "Easy"],
  ["Maximum Depth of Binary Tree", "Trees", "Easy"],
  ["Binary Tree Level Order Traversal", "Trees", "Medium"],
  ["Validate Binary Search Tree", "Trees", "Medium"],
  ["Kth Smallest Element in a BST", "Trees", "Medium"],
  ["Subsets", "Backtracking", "Medium"],
  ["Combination Sum", "Backtracking", "Medium"],
  ["Permutations", "Backtracking", "Medium"],
  ["Word Search", "Backtracking", "Medium"],
  ["N-Queens", "Backtracking", "Hard"],
  ["Number of Islands", "Graphs", "Medium"],
  ["Clone Graph", "Graphs", "Medium"],
  ["Rotting Oranges", "Graphs", "Medium"],
  ["Course Schedule", "Graphs", "Medium"],
  ["Graph Valid Tree", "Graphs", "Medium"],
  ["Climbing Stairs", "1-D DP", "Easy"],
  ["House Robber", "1-D DP", "Medium"],
  ["Coin Change", "1-D DP", "Medium"],
  ["Longest Increasing Subsequence", "1-D DP", "Medium"],
  ["Word Break", "1-D DP", "Medium"],
  ["Unique Paths", "2-D DP", "Medium"],
  ["Longest Common Subsequence", "2-D DP", "Medium"],
  ["Best Time to Buy and Sell Stock with Cooldown", "2-D DP", "Medium"],
  ["Burst Balloons", "Intervals DP", "Hard"],
  ["Regular Expression Matching", "2-D DP", "Hard"],
];
const patterns = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Backtracking",
  "Graphs",
  "1-D DP",
  "2-D DP",
  "Greedy",
  "Intervals",
  "Heaps",
  "Bit Manipulation",
];
const problems: Problem[] = Array.from({ length: 250 }, (_, index) => {
  const seed = seeds[index % seeds.length];
  const cycle = Math.floor(index / seeds.length);
  return {
    number: index + 1,
    title: cycle === 0 ? seed[0] : `${seed[0]} · Pattern ${cycle + 1}`,
    pattern:
      cycle === 0 ? seed[1] : patterns[(index + cycle) % patterns.length],
    difficulty: seed[2],
    link: `https://leetcode.com/problemset/all/?search=${encodeURIComponent(seed[0])}`,
  };
});

function App() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const user =
    isSignedIn && userId
      ? { id: userId, email: clerkUser?.primaryEmailAddress?.emailAddress }
      : null;
  const [progress, setProgress] = useState<ProgressMap>(
    () =>
      JSON.parse(
        localStorage.getItem("codexsheet-dsa-progress") ?? "{}",
      ) as ProgressMap,
  );
  const [query, setQuery] = useState("");
  const [pattern, setPattern] = useState("All patterns");
  const [difficulty, setDifficulty] = useState("All levels");
  const [status, setStatus] = useState("All status");
  const [notice, setNotice] = useState("Saved locally");

  const visibleProblems = useMemo(
    () =>
      problems.filter((problem) => {
        const current = progress[problem.number]?.status ?? "Todo";
        return (
          (!query ||
            `${problem.title} ${problem.pattern}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (pattern === "All patterns" || problem.pattern === pattern) &&
          (difficulty === "All levels" || problem.difficulty === difficulty) &&
          (status === "All status" || current === status)
        );
      }),
    [difficulty, pattern, progress, query, status],
  );
  const solved = Object.values(progress).filter(
    (item) => item.status === "Solved",
  ).length;
  const inProgress = Object.values(progress).filter(
    (item) => item.status === "In progress",
  ).length;
  const percent = Math.round((solved / 250) * 100);

  useEffect(() => {
    setClerkTokenGetter(() => getToken({ template: "supabase" }));
    return () => setClerkTokenGetter(null);
  }, [getToken]);

  useEffect(() => {
    localStorage.setItem("codexsheet-dsa-progress", JSON.stringify(progress));
    if (!isLoaded) {
      setNotice("Loading account");
      return;
    }
    if (!supabase || !user) {
      setNotice(user ? "Supabase not configured" : "Sign in to sync");
      return;
    }
    const changes = Object.entries(progress).slice(-1);
    if (changes.length === 0) return;
    const [number, value] = changes[0];
    void supabase
      .from("dsa_progress")
      .upsert(
        {
          user_id: user.id,
          problem_number: Number(number),
          status: value.status,
          notes: value.notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,problem_number" },
      )
      .then(({ error }) =>
        setNotice(error ? "Saved locally · sync failed" : "Synced to Supabase"),
      );
  }, [isLoaded, progress, user]);

  function setProblemStatus(number: number, nextStatus: Status) {
    setProgress((current) => ({
      ...current,
      [number]: { status: nextStatus, notes: current[number]?.notes ?? "" },
    }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Code2 size={17} />
          </div>
          <span className="brand-name">
            codex<span>sheet</span>
          </span>
          <span className="workspace-name">DSA practice workspace</span>
          <ChevronDown size={14} className="muted-icon" />
        </div>
        <div className="top-actions">
          <span className="save-state">
            {supabase && user ? <Wifi size={14} /> : <WifiOff size={14} />}{" "}
            {notice}
          </span>
          <CircleHelp size={18} className="muted-icon" />
            {isLoaded ? user ? (
              <UserButton />
          ) : (
            <>
                <SignInButton mode="modal">
                  <button className="secondary-button">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="primary-button">Create account</button>
                </SignUpButton>
            </>
            ) : null}
        </div>
      </header>
      <section className="workspace-header">
        <div className="title-row">
          <div>
            <div className="breadcrumb">
              <span>Library</span>
              <span>/</span>
              <span>Interview prep</span>
            </div>
            <h1>
              DSA 250 <span className="private-pill">Curated sheet</span>
            </h1>
            <p>A focused path through the patterns that show up most.</p>
          </div>
          <div className="title-actions">
            <button className="secondary-button">
              <GitBranch size={16} /> View repo
            </button>
            <button className="primary-button">
              <Sparkles size={16} /> Ask Codex
            </button>
          </div>
        </div>
        <nav className="toolbar">
          <button className="tool-button">
            <ListFilter size={16} /> Views
          </button>
          <button className="tool-button">
            <Filter size={16} /> Saved filters
          </button>
          <span className="toolbar-spacer" />
          <span className="sync-note">
            {visibleProblems.length} problems shown
          </span>
        </nav>
      </section>
      <section className="insight-strip">
        <div className="insight">
          <span className="insight-label">Solved</span>
          <strong>
            {solved}
            <small>/250</small>
          </strong>
          <span className="progress-line">
            <i style={{ width: `${percent}%` }} />
          </span>
        </div>
        <div className="insight">
          <span className="insight-label">In progress</span>
          <strong>{inProgress}</strong>
          <span className="insight-detail">keep the streak alive</span>
        </div>
        <div className="insight">
          <span className="insight-label">Completion</span>
          <strong>{percent}%</strong>
          <span className="insight-detail">of the full sheet</span>
        </div>
        <div className="insight-ai">
          <Trophy size={16} />
          <span>{250 - solved} problems left in your path</span>
        </div>
      </section>
      <section className="sheet-card">
        <div className="sheet-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search problems or patterns"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
          >
            <option>All patterns</option>
            {patterns.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option>All levels</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option>All status</option>
            <option>Todo</option>
            <option>In progress</option>
            <option>Solved</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Problem</th>
                <th>Pattern</th>
                <th>Level</th>
                <th>Status</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {visibleProblems.map((problem) => {
                const current = progress[problem.number]?.status ?? "Todo";
                return (
                  <tr key={problem.number}>
                    <td className="number-cell">
                      {String(problem.number).padStart(3, "0")}
                    </td>
                    <td className="problem-cell">
                      <span
                        className={`status-dot ${current.toLowerCase().replace(" ", "-")}`}
                      />
                      <strong>{problem.title}</strong>
                    </td>
                    <td>
                      <span className="pattern-pill">{problem.pattern}</span>
                    </td>
                    <td>
                      <span
                        className={`difficulty ${problem.difficulty.toLowerCase()}`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <select
                        className={`status-select ${current.toLowerCase().replace(" ", "-")}`}
                        value={current}
                        onChange={(event) =>
                          setProblemStatus(
                            problem.number,
                            event.target.value as Status,
                          )
                        }
                      >
                        <option>Todo</option>
                        <option>In progress</option>
                        <option>Solved</option>
                      </select>
                    </td>
                    <td>
                      <a
                        className="external-link"
                        href={problem.link}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${problem.title}`}
                      >
                        <ExternalLink size={15} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="sheet-footer">
          <span>
            <Target size={14} /> Showing {visibleProblems.length} of 250
            problems
          </span>
          <span className="footer-hint">
            <Check size={14} />{" "}
            {user ? "Synced progress" : "Sign in to sync progress"}
          </span>
        </div>
      </section>
      <footer className="footer-note">
        Use the patterns, then make the problem yours.
      </footer>
    </main>
  );
}

export default App;
