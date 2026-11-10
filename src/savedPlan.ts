// savedPlan.ts - the one place the student's chosen window is stored.
//
// /roadmap writes it, /problems' daily rail reads it, and both run the same
// buildPlan over the sheet, so the two surfaces cannot disagree about today. An
// untouched student gets the ladder: the default config is the 12-week seven-day
// plan, which scripts/study-plan-check.mjs proves equals taskForDay() row for row.
import { daysSince } from "./dailyTasks";
import { buildPlan, normaliseConfig, planOnDay, type PlanConfig, type PlanDay, type StudyPlan } from "./studyPlan";

export const planConfigKey = "codexsheet-study-plan";

export function readPlanConfig(): PlanConfig {
  try {
    const raw = localStorage.getItem(planConfigKey);
    return raw ? normaliseConfig(JSON.parse(raw) as Partial<PlanConfig>) : normaliseConfig({});
  } catch {
    return normaliseConfig({});
  }
}

export function writePlanConfig(config: PlanConfig): void {
  try {
    localStorage.setItem(planConfigKey, JSON.stringify(config));
  } catch {
    /* storage that is full or private only costs the student their own choice */
  }
}

export function hasCustomPlan(): boolean {
  const config = readPlanConfig();
  return config.track !== "m3" || config.daysPerWeek !== 7 || config.dailyTarget !== 0 || config.weakPatterns.length > 0;
}

export type PlanStandingOnWindow = {
  plan: StudyPlan;
  /** Which day of the window today is - past the end it keeps counting, so a late
   * student sees how late they are. */
  dayNumber: number;
  today: PlanDay;
  /** Learn rows the window expected by today, revision duplicates excluded. */
  due: number;
  finished: boolean;
};

/** Where the student stands in the window they chose. With the default config this
 * is the 12-week ladder, and study-plan-check.mjs proves it row for row. */
export function standingOnPlan(startKey: string, nowKey: string, solvedNumbers: number[]): PlanStandingOnWindow {
  const plan = buildPlan({ ...readPlanConfig(), solved: solvedNumbers });
  const dayNumber = Math.max(1, daysSince(startKey, nowKey) + 1);
  const clamped = Math.min(dayNumber, plan.days.length);
  const today = planOnDay(plan, clamped)!;
  const due = plan.days.slice(0, clamped).reduce((total, day) => total + (day.phase === "learn" ? day.rows.length : 0), 0);
  return { plan, dayNumber, today, due, finished: dayNumber > plan.days.length };
}
