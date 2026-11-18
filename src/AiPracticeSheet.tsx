import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Compass, ExternalLink, GraduationCap, LoaderCircle, Sparkles, Target } from "lucide-react";
import type { Problem } from "./dsaSheet";
import { planFromAi } from "./planAi";
import { buildPlan, type PlanConfig } from "./studyPlan";
import { readPlanConfig, writePlanConfig } from "./savedPlan";

type Props = {
  solvedNumbers: number[];
  statusOf: (number: number) => string;
  onStatus: (number: number, status: "Todo" | "In progress" | "Solved") => void;
};

const promptIdeas = [
  {
    icon: Clock3,
    title: "Interview tomorrow",
    detail: "A calm, focused last-day review",
    prompt: "My interview is tomorrow and my DSA is weak. Give me a small, realistic review plan.",
  },
  {
    icon: Target,
    title: "Interview coming up",
    detail: "Make the most of a short timeline",
    prompt: "My interview is in 4 weeks. I can practice 5 days a week; focus on graphs and DP.",
  },
  {
    icon: GraduationCap,
    title: "Stronger after past interviews",
    detail: "Build DSA fundamentals at a steady pace",
    prompt: "I've given a few interviews, but my DSA is weak. Help me build stronger fundamentals at a steady pace; I have no interview date yet.",
  },
  {
    icon: Compass,
    title: "Focus on weak topics",
    detail: "Spend more reps where you need them",
    prompt: "Placements are in 10 days. Give me the must-know problems, especially arrays and trees.",
  },
];

export default function AiPracticeSheet({ solvedNumbers, statusOf, onStatus }: Props) {
  const [config, setConfig] = useState<PlanConfig>(() => ({ ...readPlanConfig(), solved: solvedNumbers }));
  const [brief, setBrief] = useState(config.goal);
  const [generated, setGenerated] = useState(Boolean(config.goal.trim()));
  const [editing, setEditing] = useState(!config.goal.trim());
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [source, setSource] = useState<"ai" | "local" | null>(null);
  const [dayOffset, setDayOffset] = useState(0);

  const plan = useMemo(() => buildPlan(config), [config]);
  const selectedNumbers = useMemo(
    () => new Set(plan.days.filter((day) => day.phase === "learn").flatMap((day) => day.rows.map((problem) => problem.number))),
    [plan.days],
  );
  const completed = [...selectedNumbers].filter((number) => statusOf(number) === "Solved").length;
  const visibleDays = plan.days.slice(dayOffset, dayOffset + 7);
  const rangeStart = visibleDays[0]?.day ?? 0;
  const rangeEnd = visibleDays[visibleDays.length - 1]?.day ?? 0;

  async function generateSheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = brief.trim();
    if (!request || busy) return;
    setBusy(true);
    setFeedback("");
    try {
      const suggestion = await planFromAi(request, { solved: solvedNumbers });
      setConfig(suggestion.config);
      setBrief(request);
      setGenerated(true);
      setEditing(false);
      setSource(suggestion.source);
      setFeedback(suggestion.note);
      setDayOffset(0);
      writePlanConfig(suggestion.config);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ai-sheet-page" aria-label="AI-generated practice sheet">
      <header className="ai-sheet-hero">
        <div className="ai-sheet-hero-copy">
          <span className="ai-sheet-eyebrow"><Sparkles size={14} /> YOUR PERSONAL DSA COACH</span>
          <h2>A plan made for<br /><em>your next big step.</em></h2>
          <p>Tell us your goal, your timeline, and what feels tough. We’ll turn the 250-question library into a practice plan that fits your life.</p>
          <div className="ai-sheet-hero-trust"><span><Check size={13} /> Built from real sheet problems</span><i /><span>Progress saves as you solve</span></div>
        </div>
        <div className="ai-sheet-hero-art" aria-hidden="true"><div className="ai-sheet-orbit ai-sheet-orbit-one" /><div className="ai-sheet-orbit ai-sheet-orbit-two" /><div className="ai-sheet-orbit-center"><Target size={28} /></div><span className="ai-sheet-art-label">ONE REP AT A TIME</span></div>
      </header>

      {generated && !editing && (
        <div className="ai-sheet-current-goal">
          <span className="ai-sheet-current-icon"><CalendarDays size={16} /></span>
          <div><small>YOUR PLAN IS BUILT AROUND</small><strong>{brief}</strong></div>
          <button type="button" onClick={() => setEditing(true)}>Edit goal</button>
        </div>
      )}

      {(!generated || editing) && <div className="ai-sheet-builder">
      <div className="ai-sheet-builder-heading"><span>01</span><div><h3>What are you working toward?</h3><p>Share as much or as little as you like. You can mention time, pace, or topics.</p></div></div>
      <form className="ai-sheet-prompt" onSubmit={(event) => void generateSheet(event)}>
        <label htmlFor="ai-sheet-brief">
          <textarea
            id="ai-sheet-brief"
            value={brief}
            maxLength={400}
            onChange={(event) => setBrief(event.target.value)}
            placeholder="e.g. I have 8 weeks until placements. I can practice 4 days a week, and trees are my weak spot…"
            rows={4}
            aria-describedby="ai-sheet-prompt-help"
          />
        </label>
        <div className="ai-sheet-prompt-footer">
          <span id="ai-sheet-prompt-help">{brief.length}/400 <i /> Include your timeline, weekly pace, and topics you want to focus on.</span>
          <div className="ai-sheet-prompt-actions">
            {editing && generated && <button className="ai-sheet-cancel-edit" type="button" onClick={() => { setBrief(config.goal); setEditing(false); }}>Back to my plan</button>}
            <button type="submit" disabled={!brief.trim() || busy}>
              {busy ? <><LoaderCircle size={16} className="ai-sheet-spinner" /> Building your plan…</> : <><Sparkles size={15} /> Create my plan <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      </form>

      {!generated && (
        <div className="ai-sheet-ideas">
          <span className="ai-sheet-ideas-label">OR PICK A STARTING POINT</span>
          <div className="ai-sheet-idea-grid">{promptIdeas.map(({ icon: Icon, title, detail, prompt }) => <button key={title} type="button" onClick={() => setBrief(prompt)}><span className="ai-sheet-idea-icon"><Icon size={16} /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={14} /></button>)}</div>
        </div>
      )}
      </div>}

      {generated && (
        <div className="ai-sheet-results">
          <div className="ai-sheet-section-heading"><span>02</span><div><h3>Your practice path</h3><p>A manageable next step, built around your schedule.</p></div></div>
          <header className="ai-sheet-result-heading">
            <div>
              <span className="ai-sheet-result-kicker"><span className={source === "ai" ? "ai-sheet-status-dot" : "ai-sheet-status-dot local"} />{source === "ai" ? "AI PERSONALIZED" : source === "local" ? "PERSONALIZED FROM YOUR WORDS" : "SAVED PERSONALIZED PLAN"}</span>
              <h4>{plan.track.label}</h4>
              <p>{feedback}{source === "local" ? " The AI service is unavailable, so we used the details we could read locally." : ""}</p>
            </div>
            <div className="ai-sheet-completion"><strong>{completed}<small>/{selectedNumbers.size}</small></strong><span>problems solved</span></div>
          </header>

          <div className="ai-sheet-progress-track" role="progressbar" aria-label="Personalized plan progress" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={selectedNumbers.size}><span style={{ width: `${selectedNumbers.size ? (completed / selectedNumbers.size) * 100 : 0}%` }} /></div>

          <div className="ai-sheet-summary">
            <div><CalendarDays size={15} /><span>{plan.track.days} days</span></div>
            <div><Clock3 size={15} /><span>{plan.perStudyDay} problems / study day</span></div>
            <div><Target size={15} /><span>{plan.config.daysPerWeek} practice days / week</span></div>
            <div><Check size={15} /><span>{plan.learnTotal} problems in your plan</span></div>
            {config.weakPatterns.map((pattern) => <span className="ai-sheet-focus-chip" key={pattern}>{pattern}</span>)}
          </div>

          <div className="ai-sheet-plan-toolbar">
            <div><span>YOUR FIRST WEEK</span><strong>Days {rangeStart}–{rangeEnd} <small>of {plan.days.length}</small></strong></div>
            <div className="ai-sheet-plan-nav">
              <button type="button" aria-label="Previous days" disabled={dayOffset === 0} onClick={() => setDayOffset((offset) => Math.max(0, offset - 7))}><ArrowLeft size={15} /></button>
              <button type="button" aria-label="Next days" disabled={dayOffset + 7 >= plan.days.length} onClick={() => setDayOffset((offset) => Math.min(Math.max(0, plan.days.length - 7), offset + 7))}><ArrowRight size={15} /></button>
            </div>
          </div>

          <div className="ai-sheet-day-list">
            {visibleDays.map((day) => (
              <section className={`ai-sheet-day${day.rows.length ? "" : " empty"}${day.day === 1 ? " first" : ""}`} key={day.day}>
                <header><span>DAY {String(day.day).padStart(2, "0")}</span><strong>{day.focus}</strong><small>{day.phase === "learn" ? "PRACTICE" : day.phase === "revise" ? "REVIEW" : day.phase === "mock" ? "TIMED SET" : "REST"}</small></header>
                {day.rows.length ? (
                  <ul>{day.rows.map((problem: Problem) => {
                    const solved = statusOf(problem.number) === "Solved";
                    return (
                      <li className={solved ? "solved" : ""} key={problem.number}>
                        <button type="button" className="ai-sheet-tick" aria-label={`${solved ? "Unmark" : "Mark"} ${problem.title} ${solved ? "unsolved" : "solved"}`} aria-pressed={solved} onClick={() => onStatus(problem.number, solved ? "Todo" : "Solved")}>{solved && <Check size={13} />}</button>
                        <span className="ai-sheet-problem-number">{String(problem.number).padStart(3, "0")}</span>
                        <a href={problem.link} target="_blank" rel="noreferrer"><strong>{problem.title}</strong><ExternalLink size={12} /></a>
                        <span className="ai-sheet-problem-meta">{problem.pattern} · {problem.difficulty}</span>
                      </li>
                    );
                  })}</ul>
                ) : <p>{day.phase === "rest" ? "Rest day. Let the patterns settle." : "No new problems scheduled for this day."}</p>}
              </section>
            ))}
          </div>
          <footer className="ai-sheet-disclaimer"><span>✳</span> Problems come from the curated CodexSheet library. This plan is a practice guide, not a hiring guarantee.</footer>
        </div>
      )}
    </section>
  );
}
