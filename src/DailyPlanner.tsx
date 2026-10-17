import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ArrowRight, Check, Clock3, LoaderCircle, Sparkles } from "lucide-react";
import { supabase } from "./lib/supabase";

type Problem = { number: number; title: string; pattern: string; difficulty: "Easy" | "Medium" | "Hard"; link: string };
type Status = "Todo" | "In progress" | "Solved";
type ProgressMap = Record<number, { status: Status; notes: string }>;
type PlanItem = { number: number; reason: string };
type SavedPlan = { date: string; minutes: number; items: PlanItem[]; source: "ai" | "personalized" };
type ChatMessage = { role: "user" | "assistant"; content: string };

function parsePlannerAnswer(answer: unknown, candidates: Array<Pick<Problem, "number" | "title">>): { items: PlanItem[]; message?: string } {
  if (typeof answer !== "string" || !answer.trim()) throw new Error("The AI planner returned an empty response.");
  const text = answer.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  // Primary: try to find and parse the JSON object the planner is instructed to return.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed: unknown = JSON.parse(text.slice(start, end + 1));
      if (parsed && typeof parsed === "object" && "items" in parsed && Array.isArray(parsed.items)) {
        const candidateIds = new Set(candidates.map((c) => c.number));
        const items = parsed.items.filter((item): item is PlanItem =>
          !!item && typeof item === "object" &&
          "number" in item && Number.isInteger(item.number) && candidateIds.has(item.number) &&
          "reason" in item && typeof item.reason === "string" && item.reason.trim().length > 0,
        );
        if (items.length > 0) {
          return { items, message: "message" in parsed && typeof parsed.message === "string" ? parsed.message.trim() || undefined : undefined };
        }
      }
    } catch { /* Fall through to prose-matching below. */ }
  }

  // Fallback: Gemini replied in prose despite instructions. Match candidate titles
  // mentioned verbatim in the reply; never accept invented problem numbers.
  const titleMatches = candidates.filter((problem) => {
    const title = problem.title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const reply = text.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ");
    return title.length > 2 && reply.includes(title);
  }).map((problem) => ({ number: problem.number, reason: "Suggested by CodexLIYA" }));

  return { items: titleMatches, message: text };
}

function dayKey() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; }

async function plannerErrorMessage(error: unknown) {
  const context = error && typeof error === "object" && "context" in error
    ? (error as { context?: unknown }).context
    : null;
  if (context instanceof Response) {
    const body = await context.clone().json().catch(() => null) as { error?: unknown; message?: unknown; msg?: unknown } | null;
    const detail = [body?.error, body?.message, body?.msg].find((value) => typeof value === "string" && value.trim());
    if (typeof detail === "string") return detail;
    return `The AI planner returned an HTTP ${context.status} response.`;
  }
  return error instanceof Error ? error.message : "The AI planner is unavailable right now.";
}

export default function DailyPlanner({ problems, progress, onStatusChange, onOpenProblem }: {
  problems: Problem[]; progress: ProgressMap; onStatusChange: (number: number, status: Status) => void; onOpenProblem: (number: number) => void;
}) {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [minutes, setMinutes] = useState(45);
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([{ role: "assistant", content: "Hi, I’m CodexLIYA. Tell me how much time you have, what feels difficult, or what you want to practice. I’ll shape today’s problem set around you." }]);
  const solved = useMemo(() => Object.entries(progress).filter(([, item]) => item.status === "Solved").map(([number]) => Number(number)), [progress]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("codexsheet-daily-plan") || "null") as SavedPlan | null;
      if (saved?.date === dayKey()) { setPlan(saved); setMinutes(saved.minutes); }
    } catch { /* Ignore a malformed cached plan. */ }
  }, []);

  function buildPersonalizedPlan(): SavedPlan {
    const patternCounts = new Map<string, { solved: number; total: number }>();
    for (const problem of problems) {
      const value = patternCounts.get(problem.pattern) ?? { solved: 0, total: 0 };
      value.total += 1;
      if (progress[problem.number]?.status === "Solved") value.solved += 1;
      patternCounts.set(problem.pattern, value);
    }
    const candidates = problems.filter((problem) => progress[problem.number]?.status !== "Solved");
    candidates.sort((left, right) => {
      const l = patternCounts.get(left.pattern)!; const r = patternCounts.get(right.pattern)!;
      const score = (item: Problem, stats: { solved: number; total: number }) => (progress[item.number]?.status === "In progress" ? 2 : 0) + (1 - stats.solved / Math.max(stats.total, 1)) + (item.difficulty === "Easy" ? 0.2 : item.difficulty === "Medium" ? 0.1 : 0);
      return score(right, r) - score(left, l) || left.number - right.number;
    });
    const count = Math.max(1, Math.min(5, Math.floor(minutes / 20) || 1));
    const selected: Problem[] = []; const seen = new Set<string>();
    for (const item of candidates) if (!seen.has(item.pattern) && selected.length < count) { selected.push(item); seen.add(item.pattern); }
    for (const item of candidates) if (!selected.some((picked) => picked.number === item.number) && selected.length < count) selected.push(item);
    return { date: dayKey(), minutes, source: "personalized", items: selected.map((item) => ({ number: item.number, reason: progress[item.number]?.status === "In progress" ? "Pick up where you left off" : `${item.pattern} needs more practice` })) };
  }

  async function createPlan(request = prompt.trim() || "Build my best study plan for today.") {
    setLoading(true); setMessage("");
    setChat((items) => [...items, { role: "user", content: request }]);
    setPrompt("");
    const fallback = buildPersonalizedPlan();
    try {
      if (!supabase || !authLoaded || !isSignedIn) throw new Error(authLoaded ? "Sign in to generate an AI plan." : "Still loading your session — please try again in a moment.");
      const candidates = problems.filter((item) => progress[item.number]?.status !== "Solved").slice(0, 32).map((item) => ({ number: item.number, title: item.title, pattern: item.pattern, difficulty: item.difficulty, status: progress[item.number]?.status ?? "Todo" }));
      const context = JSON.stringify({ availableMinutes: minutes, totalSolved: solved.length, weakestPatterns: [...new Set(candidates.map((item) => item.pattern))].slice(0, 8), candidates });
      const history = chat.slice(-7).map(({ role, content }) => ({ role, content }));
      const { data, error } = await supabase.functions.invoke("dsa-tutor", { body: { mode: "planner", messages: [...history, { role: "user", content: `${request}\n\nStudy data: ${context}` }] } });
      if (error) throw error;
      const parsed = parsePlannerAnswer(data?.answer, candidates);
      const ids = new Set(candidates.map((item) => item.number));
      const items = (parsed.items ?? []).filter((item) => ids.has(item.number)).slice(0, Math.max(1, Math.floor(minutes / 20)));
      if (!items.length) {
        setPlan(fallback); localStorage.setItem("codexsheet-daily-plan", JSON.stringify(fallback));
        setMessage("I received CodexLIYA’s reply, but couldn’t match its suggestions to your problem list. I’ve kept your personalized plan ready below.");
        setChat((items) => [...items, { role: "assistant", content: parsed.message || "I couldn’t match my suggestions to the problem library, so your personalized plan is ready below." }]);
        return;
      }
      const next = { ...fallback, source: "ai" as const, items };
      setPlan(next); localStorage.setItem("codexsheet-daily-plan", JSON.stringify(next));
      setMessage("AI plan ready. Adjust the time and regenerate whenever you like.");
      setChat((items) => [...items, { role: "assistant", content: parsed.message || `I put together ${items.length} focused ${items.length === 1 ? "problem" : "problems"} for your ${minutes}-minute session. Your list is ready below.` }]);
    } catch (error) {
      setPlan(fallback); localStorage.setItem("codexsheet-daily-plan", JSON.stringify(fallback));
      const detail = await plannerErrorMessage(error);
      setMessage(`AI plan unavailable: ${detail} Showing your personalized plan instead.`);
      setChat((items) => [...items, { role: "assistant", content: `I couldn’t reach the AI planner just now (${detail}), so I made a personalized plan from your progress instead. You can still start any problem below.` }]);
    } finally { setLoading(false); }
  }

  const plannedProblems = plan?.items.map((item) => ({ item, problem: problems.find((problem) => problem.number === item.number) })).filter((entry): entry is { item: PlanItem; problem: Problem } => Boolean(entry.problem)) ?? [];
  const done = plannedProblems.filter(({ problem }) => progress[problem.number]?.status === "Solved").length;

  return <section className="daily-plan-card" aria-label="CodexLIYA AI daily study planner">
    <div className="daily-plan-heading"><div><span className="daily-plan-kicker"><Sparkles size={14} /> CODEXLIYA · YOUR AI STUDY PARTNER</span><h2>Let’s plan your next session.</h2><p>A conversational planner that adapts to your time, goals, and progress.</p></div><div className="daily-plan-progress"><strong>{done}<small> / {plannedProblems.length || "—"}</small></strong><span>completed</span></div></div>
    <div className="daily-plan-controls"><label htmlFor="daily-plan-minutes"><Clock3 size={15} /> Session length</label><select id="daily-plan-minutes" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))}><option value={20}>20 minutes</option><option value={45}>45 minutes</option><option value={60}>1 hour</option><option value={90}>90 minutes</option></select></div>
    <div className="daily-chat-thread" aria-live="polite">{chat.map((item, index) => <div className={`daily-chat-message is-${item.role}`} key={`${index}-${item.role}`}><span className="daily-chat-avatar">{item.role === "assistant" ? <Sparkles size={14} /> : "Y"}</span><p>{item.content}</p></div>)}{loading && <div className="daily-chat-message is-assistant"><span className="daily-chat-avatar"><Sparkles size={14} /></span><p className="daily-chat-thinking"><LoaderCircle size={14} className="spin" /> Thinking through your study plan…</p></div>}</div>
    <form className="daily-chat-composer" onSubmit={(event) => { event.preventDefault(); if (!loading && authLoaded) void createPlan(); }}><input value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Message CodexLIYA" placeholder="e.g. I have 30 minutes. Focus on arrays and keep it beginner-friendly…" disabled={loading || !authLoaded} /><button type="submit" aria-label="Send message" disabled={loading || !authLoaded}>{loading ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={17} />}</button></form>
    <div className="daily-chat-suggestions"><span>Try</span>{["Help me build consistency", "Focus on my weakest patterns", "Give me a gentle warm-up"].map((idea) => <button type="button" key={idea} onClick={() => { setPrompt(idea); }} disabled={loading || !authLoaded}>{idea}</button>)}</div>
    {message && <p className="daily-plan-message" aria-live="polite">{message}</p>}
    {!plan ? <div className="daily-plan-empty"><span>01</span><p>Tell us how much time you have and get a short, personalized set of problems with a reason for each pick.</p></div> : <div className="daily-plan-list">{plannedProblems.map(({ item, problem }, index) => { const status = progress[problem.number]?.status ?? "Todo"; return <article className="daily-plan-item" key={problem.number}><span className="daily-plan-index">{String(index + 1).padStart(2, "0")}</span><div className="daily-plan-item-copy"><strong>{problem.title}</strong><span>{problem.pattern} · {problem.difficulty}</span><small>{item.reason}</small></div><button type="button" className={status === "Solved" ? "daily-plan-done" : "daily-plan-start"} onClick={() => status === "Solved" ? onStatusChange(problem.number, "In progress") : onOpenProblem(problem.number)}>{status === "Solved" ? <><Check size={15} /> Done</> : <>Start <ArrowRight size={14} /></>}</button></article>; })}</div>}
    <footer className="daily-plan-foot"><span>{plan?.source === "ai" ? "AI planned from your progress" : "Personalized from your progress"}</span><span>{isSignedIn ? "Progress syncs with your account" : "Sign in to sync progress"}</span></footer>
  </section>;
}
