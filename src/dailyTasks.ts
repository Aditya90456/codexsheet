// dailyTasks.ts — the same 250 rows, cut into 84 days.
//
// The sheet already carries a `week` for every problem, which is the twelve-week
// ladder the roadmap board and /mentorship quote. This module only divides each
// week's rows across its seven days, so "today's task" is not a new promise: it is
// the week the sheet already assigned, at day resolution.
//
// Two rules keep it honest:
//   1. The split is a partition. Every one of the 250 rows lands in exactly one of
//      the 84 days, and no day is ever empty. scripts/daily-tasks-check.mjs proves
//      that by rebuilding the whole calendar.
//   2. Sizes differ by at most one within a week, so a week with 36 rows (week 11,
//      Dynamic Programming) is 5-a-day with one 6, not five days then a panic.

import { problems, type Problem } from "./dsaSheet";

export const planWeeks = 12;
export const planDays = planWeeks * 7;

/** Local calendar keys (`2026-11-08`) come from the app; a plan day is the day on
 * the student's wall, not a UTC boundary. */
function keyToDate(key: string): Date {
  const [year, month, date] = key.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1);
}

/** Whole days from the start of the plan to today, so day 1 is the start day. */
export function daysSince(startKey: string, nowKey: string): number {
  const ms = keyToDate(nowKey).getTime() - keyToDate(startKey).getTime();
  return Math.floor(ms / 86_400_000);
}

/** The week's rows in sheet order - the order the sheet itself teaches them in. */
export function weekRows(week: number): Problem[] {
  return problems.filter((problem) => problem.week === week).sort((a, b) => a.number - b.number);
}

/** One of the seven slices of a week. `floor` boundaries keep the parts even. */
function sliceOfWeek(rows: Problem[], slot: number): Problem[] {
  const parts = 7;
  const safeSlot = Math.min(Math.max(slot, 0), parts - 1);
  return rows.slice(Math.floor((safeSlot * rows.length) / parts), Math.floor(((safeSlot + 1) * rows.length) / parts));
}

export type DailyTask = {
  /** 1-based day of the plan. Past the end it keeps counting, so a late student
   * sees how late they are instead of a fake "day 84". */
  day: number;
  /** Clamped to 1-12: after day 84 there is no new week to name. */
  week: number;
  /** 0-6 within the week. */
  slot: number;
  rows: Problem[];
  /** True once day 84 is behind them and the ladder has nothing left to hand out. */
  finished: boolean;
};

/** The plan's own answer for a day number, with no notion of who solved what. */
export function taskForDay(day: number): DailyTask {
  const clampedDay = Math.max(1, Math.floor(day));
  const week = Math.min(planWeeks, Math.ceil(clampedDay / 7));
  const slot = (clampedDay - 1) % 7;
  return {
    day: clampedDay,
    week,
    slot,
    rows: clampedDay > planDays ? [] : sliceOfWeek(weekRows(week), slot),
    finished: clampedDay > planDays,
  };
}

export function todayTask(startKey: string, nowKey: string): DailyTask {
  return taskForDay(daysSince(startKey, nowKey) + 1);
}

/** How many rows the plan expects done by the end of a given day. */
export function expectedByDay(day: number): number {
  const last = Math.min(Math.max(Math.floor(day), 0), planDays);
  let total = 0;
  for (let current = 1; current <= last; current += 1) total += taskForDay(current).rows.length;
  return total;
}

/** The whole plan, day by day - used by the check and by any view that needs to
 * show where a student is rather than only today. */
export function planCalendar(): DailyTask[] {
  return Array.from({ length: planDays }, (_, index) => taskForDay(index + 1));
}

export type PlanStanding = {
  task: DailyTask;
  /** Rows the plan says should be solved by the end of today. */
  expected: number;
  /** Rows actually solved. */
  solved: number;
  /** Positive means behind the plan, negative means ahead of it. */
  behind: number;
};

export function planStanding(startKey: string, nowKey: string, solvedNumbers: Set<number>): PlanStanding {
  const task = todayTask(startKey, nowKey);
  const solved = problems.filter((problem) => solvedNumbers.has(problem.number)).length;
  const expected = expectedByDay(Math.min(task.day, planDays));
  return { task, expected, solved, behind: expected - solved };
}
