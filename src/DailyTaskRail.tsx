// DailyTaskRail.tsx — the day strip above the 250-problem sheet.
//
// It shows the window the student picked on /roadmap. With no choice made, that
// window is the sheet's own 12-week ladder - the `week` every row already carries,
// divided across its seven days - and scripts/study-plan-check.mjs proves the two
// are the same rows on the same days. Nothing here is stored on a server and
// nothing is invented: the rows come from src/studyPlan.ts over src/dsaSheet.ts.
import { problems } from "./dsaSheet";
import type { Problem } from "./dsaSheet";
import { planDays, taskForDay } from "./dailyTasks";
import { hasCustomPlan, standingOnPlan } from "./savedPlan";
import { dailyVoice } from "./sheetVoice";
import { CalendarClock, Check, ChevronRight, RotateCcw } from "lucide-react";

type Props = {
  /** Local date key of day 1 - the student's first practice day unless they restarted. */
  startKey: string;
  nowKey: string;
  statusOf: (number: number) => string;
  onOpen: (problem: Problem) => void;
  onToggleSolved: (problem: Problem) => void;
  onRestart: () => void;
};

const phaseVoice: Record<string, string> = { learn: "naya", revise: "dohrao", mock: "timed", rest: "aaram" };

export default function DailyTaskRail({ startKey, nowKey, statusOf, onOpen, onToggleSolved, onRestart }: Props) {
  const solvedNumbers = new Set(problems.filter((problem) => statusOf(problem.number) === "Solved").map((problem) => problem.number));
  const standing = standingOnPlan(startKey, nowKey, [...solvedNumbers]);
  const { plan, dayNumber, today, due, finished } = standing;
  const custom = hasCustomPlan();
  const solvedCount = solvedNumbers.size;
  const behind = due - solvedCount;
  const done = today.rows.filter((problem) => statusOf(problem.number) === "Solved").length;

  const ladderTask = taskForDay(Math.min(dayNumber, planDays));
  const words = finished
    ? dailyVoice.finished(plan.days.length)
    : behind > 0
      ? dailyVoice.behind(behind)
      : behind < 0
        ? dailyVoice.ahead(-behind)
        : dailyVoice.even;
  const tone = finished ? "" : behind > 0 ? " behind" : behind < 0 ? " ahead" : "";

  return (
    <section className="daily-task" aria-label="Today's problems from your plan">
      <header className="daily-task-head">
        <div className="daily-task-when">
          <span className="daily-task-eyebrow"><CalendarClock size={13}/> {dailyVoice.eyebrow}</span>
          <strong>{dailyVoice.day(Math.min(dayNumber, plan.days.length), plan.days.length)}</strong>
          {!finished && <span className="daily-task-week">{custom ? `${plan.track.short} · ${phaseVoice[today.phase] ?? "naya"}` : dailyVoice.week(ladderTask.week, ladderTask.slot)}</span>}
        </div>
        <p className="daily-task-note">{custom ? dailyVoice.custom(plan.track.label) : dailyVoice.note}</p>
        <div className="daily-task-standing">
          <em className={`daily-task-badge${tone}`}>{words}</em>
          {!finished && <span>{dailyVoice.dueBy(due, solvedCount)}</span>}
          {!finished && <span className="daily-task-slice">{dailyVoice.count(today.rows.length)}</span>}
        </div>
      </header>

      {finished ? (
        <div className="daily-task-empty">
          <Check size={18}/>
          <strong>{dailyVoice.finished(plan.days.length)}</strong>
          <button type="button" onClick={onRestart}>{dailyVoice.restart} <RotateCcw size={12}/></button>
        </div>
      ) : (
        <>
          <ol className="daily-task-rows">
            {today.rows.map((problem) => {
              const isDone = statusOf(problem.number) === "Solved";
              return (
                <li key={problem.number} className="daily-task-item">
                  <button
                    type="button"
                    className={`daily-task-tick${isDone ? " done" : ""}`}
                    aria-pressed={isDone}
                    title={isDone ? dailyVoice.undo : dailyVoice.markDone}
                    onClick={() => onToggleSolved(problem)}
                  >
                    {isDone && <Check size={13}/>}
                  </button>
                  <button type="button" className={`daily-task-row${isDone ? " done" : ""}`} title={dailyVoice.open} onClick={() => onOpen(problem)}>
                    <span className="daily-task-no">{String(problem.number).padStart(3, "0")}</span>
                    <span className="daily-task-title">
                      {problem.title}
                      <small>{problem.pattern} · {problem.difficulty}</small>
                    </span>
                    <span className="daily-task-open"><ChevronRight size={14}/></span>
                  </button>
                </li>
              );
            })}
            {!today.rows.length && <li className="daily-task-item"><span className="daily-task-title">{dailyVoice.restDay}</span></li>}
          </ol>
          <footer className="daily-task-foot">
            <span className="daily-task-count">{done === today.rows.length ? dailyVoice.allDone : dailyVoice.solvedToday(done, today.rows.length)}</span>
            <span className="daily-task-anchor">{dailyVoice.anchor(startKey)}</span>
            <button type="button" className="daily-task-restart" onClick={onRestart}>{dailyVoice.restart} <RotateCcw size={12}/></button>
          </footer>
        </>
      )}
    </section>
  );
}
