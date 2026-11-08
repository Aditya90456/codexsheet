// DailyTaskRail.tsx — the day strip above the 250-problem sheet.
//
// It reports the sheet's own plan: the `week` every row already carries, divided
// across its seven days, so a student opening the sheet sees which rows today is
// asking for and how far that is from where the plan says they should be. Nothing
// here is stored on a server and nothing is invented - the numbers come from
// src/dailyTasks.ts, and scripts/daily-tasks-check.mjs proves that file is a real
// partition of all 250 rows.
import { problems } from "./dsaSheet";
import type { Problem } from "./dsaSheet";
import { planStanding, planDays } from "./dailyTasks";
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

export default function DailyTaskRail({ startKey, nowKey, statusOf, onOpen, onToggleSolved, onRestart }: Props) {
  const solvedNumbers = new Set(problems.filter((problem) => statusOf(problem.number) === "Solved").map((problem) => problem.number));
  const { task, expected, solved, behind } = planStanding(startKey, nowKey, solvedNumbers);
  const done = task.rows.filter((problem) => statusOf(problem.number) === "Solved").length;

  const standing = task.finished
    ? dailyVoice.finished(planDays)
    : behind > 0
      ? dailyVoice.behind(behind)
      : behind < 0
        ? dailyVoice.ahead(-behind)
        : dailyVoice.even;
  const tone = task.finished ? "" : behind > 0 ? " behind" : behind < 0 ? " ahead" : "";

  return (
    <section className="daily-task" aria-label="Today's problems from the 250 sheet">
      <header className="daily-task-head">
        <div className="daily-task-when">
          <span className="daily-task-eyebrow"><CalendarClock size={13}/> {dailyVoice.eyebrow}</span>
          <strong>{dailyVoice.day(Math.min(task.day, planDays), planDays)}</strong>
          {!task.finished && <span className="daily-task-week">{dailyVoice.week(task.week, task.slot)}</span>}
        </div>
        <p className="daily-task-note">{dailyVoice.note}</p>
        <div className="daily-task-standing">
          <em className={`daily-task-badge${tone}`}>{standing}</em>
          {!task.finished && <span>{dailyVoice.dueBy(expected, solved)}</span>}
          {!task.finished && <span className="daily-task-slice">{dailyVoice.count(task.rows.length)}</span>}
        </div>
      </header>

      {task.finished ? (
        <div className="daily-task-empty">
          <Check size={18}/>
          <strong>{dailyVoice.finished(planDays)}</strong>
          <button type="button" onClick={onRestart}>{dailyVoice.restart} <RotateCcw size={12}/></button>
        </div>
      ) : (
        <>
          <ol className="daily-task-rows">
            {task.rows.map((problem) => {
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
          </ol>
          <footer className="daily-task-foot">
            <span className="daily-task-count">{done === task.rows.length ? dailyVoice.allDone : dailyVoice.solvedToday(done, task.rows.length)}</span>
            <span className="daily-task-anchor">{dailyVoice.anchor(startKey)}</span>
            <button type="button" className="daily-task-restart" onClick={onRestart}>{dailyVoice.restart} <RotateCcw size={12}/></button>
          </footer>
        </>
      )}
    </section>
  );
}
