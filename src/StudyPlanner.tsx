// StudyPlanner.tsx - the roadmap page, rebuilt around the window a student has.
//
// The old page asked three questions with three dropdowns and then drew a board.
// This one asks what actually decides a plan - how long you have, how many days a
// week you can sit down, and where you are weak - and offers the AI brief on top.
// Whatever it shows is built by src/studyPlan.ts from the 250 real rows, so the
// sprint, the ladder and the six-month build cannot drift from the sheet; the
// three-month seven-day plan is byte-identical to the daily rail on /problems.
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Check, ChevronLeft, ChevronRight, Sparkles, Target } from "lucide-react";
import type { Problem } from "./dsaSheet";
import { interviewTier, tierLabels } from "./dsaPatterns";
import { daysSince } from "./dailyTasks";
import { buildPlan, planOnDay, studyTracks, type PlanConfig, type TrackId } from "./studyPlan";
import { planFromAi } from "./planAi";
import { readPlanConfig, writePlanConfig } from "./savedPlan";

type Props = {
  startKey: string;
  nowKey: string;
  solvedNumbers: number[];
  statusOf: (number: number) => string;
  onStatus: (number: number, status: "Todo" | "In progress" | "Solved") => void;
  patternStats: Array<{ name: string; completed: number; total: number }>;
};

const paceOptions = [3, 5, 7];
const phaseLabels: Record<string, string> = { learn: "Learn", revise: "Revise", mock: "Timed sets", rest: "Rest" };

export default function StudyPlanner({ startKey, nowKey, solvedNumbers, statusOf, onStatus, patternStats }: Props) {
  const [config, setConfig] = useState<PlanConfig>(() => readPlanConfig());
  const [brief, setBrief] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [windowStart, setWindowStart] = useState(0);

  const solved = useMemo(() => new Set(solvedNumbers), [solvedNumbers]);
  const plan = useMemo(() => buildPlan({ ...config, solved: solvedNumbers }), [config, solvedNumbers]);
  const dayNumber = Math.max(1, daysSince(startKey, nowKey) + 1);
  const today = planOnDay(plan, dayNumber);
  const beyondPlan = dayNumber > plan.days.length;

  useEffect(() => { writePlanConfig(config); }, [config]);
  useEffect(() => { setWindowStart(Math.max(0, Math.floor((today?.day ?? 1) / 21) * 21 - 1)); }, [plan.track.id, config.daysPerWeek, today?.day]);

  const patch = (partial: Partial<PlanConfig>) => setConfig((current) => ({ ...current, ...partial }));

  const toggleWeak = (name: string) => setConfig((current) => ({
    ...current,
    weakPatterns: current.weakPatterns.includes(name) ? current.weakPatterns.filter((item) => item !== name) : [...current.weakPatterns, name].slice(0, 6),
  }));

  async function askPlanner() {
    if (!brief.trim() || busy) return;
    setBusy(true);
    setNote("");
    try {
      const suggestion = await planFromAi(brief.trim(), { solved: solvedNumbers });
      setConfig(suggestion.config);
      setNote(`${suggestion.note} · ${suggestion.source === "ai" ? "read by the planner" : "read from your words"}`);
    } catch {
      setNote("The planner could not reach the server, so nothing changed.");
    } finally {
      setBusy(false);
    }
  }

  const progressOf = (rows: Problem[]) => rows.filter((problem) => statusOf(problem.number) === "Solved").length;
  const daysToShow = plan.days.slice(windowStart, windowStart + 21);
  const learnDays = plan.days.filter((day) => day.phase === "learn" && day.rows.length).length;

  return (
    <div className="planner">
      <div className="planner-tracks" role="radiogroup" aria-label="Study window">
        {studyTracks.map((track) => {
          const active = config.track === track.id;
          const preview = buildPlan({ track: track.id, daysPerWeek: config.daysPerWeek, solved: solvedNumbers });
          return (
            <button
              key={track.id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`planner-track${active ? " active" : ""}`}
              onClick={() => { patch({ track: track.id as TrackId }); setWindowStart(0); }}
            >
              <span className="planner-track-kicker">{track.kicker}</span>
              <strong>{track.label}</strong>
              <p>{track.promise}</p>
              <span className="planner-track-foot">{preview.learnTotal} problems · {preview.perStudyDay} a study day · {track.days} days</span>
              {active && <span className="planner-track-picked"><Check size={13}/> your plan</span>}
            </button>
          );
        })}
      </div>

      <section className="planner-brief" aria-label="Tell the planner how you study">
        <label className="planner-brief-field">
          <span className="planner-eyebrow">OR JUST TELL IT</span>
          <textarea
            rows={2}
            value={brief}
            placeholder="placements in 6 weeks, I can do 5 days a week, DP and graphs kill me"
            onChange={(event) => setBrief(event.target.value)}
          />
        </label>
        <button className="planner-brief-go" type="button" onClick={() => void askPlanner()} disabled={busy || !brief.trim()}>
          <Sparkles size={15}/> {busy ? "Reading…" : "Build my plan"}
        </button>
        <p className="planner-brief-note" aria-live="polite">{note}</p>
      </section>

      <div className="planner-controls">
        <div className="planner-control" role="group" aria-label="Study days each week">
          <span className="planner-control-label">DAYS A WEEK</span>
          {paceOptions.map((pace) => (
            <button key={pace} type="button" className={`planner-chip${config.daysPerWeek === pace ? " active" : ""}`} aria-pressed={config.daysPerWeek === pace} onClick={() => patch({ daysPerWeek: pace })}>
              {pace}
            </button>
          ))}
        </div>
        <div className="planner-control" role="group" aria-label="Problems each study day">
          <span className="planner-control-label">PER DAY</span>
          {[...new Set([0, 2, 4, 6, config.dailyTarget])].sort((a, b) => a - b).map((target) => (
            <button key={target} type="button" className={`planner-chip${config.dailyTarget === target ? " active" : ""}`} aria-pressed={config.dailyTarget === target} onClick={() => patch({ dailyTarget: target })}>
              {target === 0 ? "auto" : target}
            </button>
          ))}
        </div>
        <div className="planner-summary">
          <strong>{plan.learnTotal}</strong><span>problems in the learn pass</span>
          <strong>{learnDays}</strong><span>study days used</span>
          <strong>{plan.perStudyDay}</strong><span>each study day</span>
        </div>
      </div>

      <section className="planner-weak" aria-label="Patterns you want pulled forward">
        <span className="planner-control-label">WEAK AREAS · PULLED INSIDE THEIR OWN STAGE</span>
        <div className="planner-weak-list">
          {patternStats.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`planner-weak-chip${config.weakPatterns.includes(item.name) ? " active" : ""}`}
              aria-pressed={config.weakPatterns.includes(item.name)}
              onClick={() => toggleWeak(item.name)}
            >
              <span>{item.name}</span>
              <small>{item.completed}/{item.total}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="planner-phases" aria-label="Shape of the plan">
        {plan.phases.filter((phase) => phase.rows > 0 || phase.phase === "learn").map((phase) => (
          <div key={`${phase.phase}-${phase.from}`} className={`planner-phase ${phase.phase}`} style={{ flexGrow: phase.to - phase.from + 1 }}>
            <strong>{phaseLabels[phase.phase]}</strong>
            <span>day {phase.from}-{phase.to} · {phase.rows} rows</span>
          </div>
        ))}
      </div>

      <section className={`planner-today${today?.study ? "" : " rest"}`} aria-label="Today in your plan">
        <div className="planner-today-head">
          <span className="planner-eyebrow"><CalendarClock size={13}/> {plan.track.label.toUpperCase()}</span>
          <h3>{beyondPlan ? "Your window is behind you" : `Day ${today?.day} · ${today?.focus}`}</h3>
          <p>{beyondPlan
            ? `${dayNumber - plan.days.length} days past the end of a ${plan.track.days}-day plan. Pick the ladder and keep going, or restart the day counter.`
            : today?.study
              ? `${progressOf(today.rows)} of ${today.rows.length} done today.`
              : "No new problems. Two from yesterday, then stop."}</p>
        </div>
        {!beyondPlan && (
          <ol className="planner-rows">
            {(today?.rows ?? []).map((problem) => {
              const done = statusOf(problem.number) === "Solved";
              return (
                <li key={problem.number} className={`planner-row${done ? " done" : ""}`}>
                  <button type="button" className="planner-tick" aria-pressed={done} onClick={() => onStatus(problem.number, done ? "In progress" : "Solved")}>
                    {done && <Check size={13}/>}
                  </button>
                  <a href={problem.link} target="_blank" rel="noreferrer">
                    <span className="planner-row-no">{String(problem.number).padStart(3, "0")}</span>
                    <strong>{problem.title}</strong>
                    <small>{problem.pattern} · {problem.difficulty} · {tierLabels[interviewTier(problem)].toLowerCase()}</small>
                  </a>
                </li>
              );
            })}
            {!today?.rows.length && <li className="planner-row-empty">Nothing scheduled. The next set starts on day {(today?.day ?? 0) + 1}.</li>}
          </ol>
        )}
      </section>

      <section className="planner-days" aria-label="Every day of the plan">
        <header className="planner-days-head">
          <span className="planner-eyebrow">THE WHOLE WINDOW</span>
          <div className="planner-days-nav">
            <button type="button" className="planner-days-arrow" aria-label="Earlier days" disabled={windowStart === 0} onClick={() => setWindowStart((current) => Math.max(0, current - 21))}><ChevronLeft size={15}/></button>
            <strong>days {plan.days[windowStart]?.day}–{daysToShow[daysToShow.length - 1]?.day}</strong>
            <button type="button" className="planner-days-arrow" aria-label="Later days" disabled={windowStart + 21 >= plan.days.length} onClick={() => setWindowStart((current) => Math.min(plan.days.length - 21, current + 21))}><ChevronRight size={15}/></button>
            <button type="button" className="planner-days-today" onClick={() => setWindowStart(Math.max(0, Math.floor(((today?.day ?? 1) - 1) / 21) * 21))}><Target size={14}/> today</button>
          </div>
        </header>
        <ul className="planner-days-list">
          {daysToShow.map((day) => {
            const done = progressOf(day.rows);
            return (
              <li key={day.day} className={`planner-day${day.day === today?.day ? " now" : ""}${!day.study ? " rest" : ""}${day.rows.length && done === day.rows.length ? " complete" : ""}`}>
                <span className="planner-day-no">{String(day.day).padStart(3, "0")}</span>
                <span className={`planner-day-phase ${day.phase}`}>{phaseLabels[day.phase]}</span>
                <span className="planner-day-focus">{day.focus}</span>
                <span className="planner-day-count">{done}/{day.rows.length}</span>
              </li>
            );
          })}
        </ul>
        <footer className="planner-days-foot">
          <span>{solved.size ? `${solved.size} marked solved - they never come back.` : "Nothing marked solved yet."}</span>
          <button type="button" className="planner-days-open" onClick={() => patch({ track: "m3", daysPerWeek: 7, dailyTarget: 0, weakPatterns: [] })}>
            Reset to the 12-week ladder <ArrowRight size={14}/>
          </button>
        </footer>
      </section>
    </div>
  );
}
