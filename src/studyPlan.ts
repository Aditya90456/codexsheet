// studyPlan.ts - the same 250 rows, cut to the window a student actually has.
//
// dailyTasks.ts answers "what does the 12-week ladder say today?". A student who
// has an interview in ten days, or who is starting in the first year and has six
// months, needs a different answer. This module builds that answer without
// inventing problems: every row it hands out comes from dsaSheet, in the order the
// sheet teaches it, and the three-month track is the ladder itself.
//
// Three things keep it honest:
//   1. The three-month plan with a seven-day week is byte-identical to taskForDay()
//      - scripts/study-plan-check.mjs proves it - so /problems and /roadmap cannot
//      disagree about today's task.
//   2. A short track does not compress the ladder. It switches to the core: the
//      tier-1 "must know" rows, spread across the whole arc instead of the first
//      stages, so ten days still teaches the subject and not just arrays.
//   3. Rest days are not empty. A student who studies five days a week gets a
//      revision card on the other two - what they did last, capped at two rows.

import { patterns, problems, type Problem } from "./dsaSheet";
import { interviewTier, roadmapStages, tierLabels } from "./dsaPatterns";
import { planDays, taskForDay } from "./dailyTasks";

export type TrackId = "sprint10" | "m3" | "m6";

export type StudyTrack = {
  id: TrackId;
  /** Calendar days the window covers. */
  days: number;
  /** "10 days" - what the chip says. */
  short: string;
  /** "10-day sprint" - what the plan calls itself. */
  label: string;
  kicker: string;
  promise: string;
  /** Where the rows come from. */
  scope: "core" | "ladder";
};

export const studyTracks: StudyTrack[] = [
  {
    id: "sprint10",
    days: 10,
    short: "10 days",
    label: "10-day sprint",
    kicker: "INTERVIEW INSIDE TWO WEEKS",
    promise: "The must-know core, spread across the whole subject. Six problems a day, no filler, nothing you can afford to skip.",
    scope: "core",
  },
  {
    id: "m3",
    days: planDays,
    short: "3 months",
    label: "12-week ladder",
    kicker: "THE FULL SHEET, ONE PASS",
    promise: "All 250 problems in the order they are taught - the plan the sheet itself is built on.",
    scope: "ladder",
  },
  {
    id: "m6",
    days: 180,
    short: "6 months",
    label: "6-month build",
    kicker: "TWO PASSES AND A MOCK",
    promise: "The same ladder at an easy pace, then a full second pass over the problems that decide interviews, then timed mixed sets.",
    scope: "ladder",
  },
];

export function trackById(id: string | undefined): StudyTrack {
  return studyTracks.find((track) => track.id === id) ?? studyTracks[1];
}

export type PlanPhase = "learn" | "revise" | "mock" | "rest";

export type PlanDay = {
  day: number;
  /** 1-7 within the plan's own week, so a rest day is always the same weekday. */
  weekday: number;
  study: boolean;
  phase: PlanPhase;
  /** What the day is about, in the sheet's own words. */
  focus: string;
  rows: Problem[];
};

export type PlanConfig = {
  track: TrackId;
  /** Study days each week: 3, 5 or 7. */
  daysPerWeek: number;
  /** 0 means "work it out from the window and the week". */
  dailyTarget: number;
  /** Pattern names the student is weak in - pulled to the front. */
  weakPatterns: string[];
  /** Free text the student typed, kept so the plan can say what it heard. */
  goal: string;
  /** Problem numbers already solved. A sprint skips them; the ladder still shows
   * them on the day the sheet assigned, so the day can read as done. */
  solved: number[];
};

export const defaultPlanConfig: PlanConfig = {
  track: "m3",
  daysPerWeek: 7,
  dailyTarget: 0,
  weakPatterns: [],
  goal: "",
  solved: [],
};

const knownPatterns = new Set(problems.map((problem) => problem.pattern));
const onSheet = new Set(problems.map((problem) => problem.number));

export function normaliseConfig(partial: Partial<PlanConfig> | null | undefined): PlanConfig {
  const config = { ...defaultPlanConfig, ...(partial ?? {}) };
  return {
    track: trackById(config.track).id,
    daysPerWeek: [3, 5, 7].includes(config.daysPerWeek) ? config.daysPerWeek : 7,
    dailyTarget: Math.min(8, Math.max(0, Math.floor(config.dailyTarget || 0))),
    weakPatterns: [...new Set((Array.isArray(config.weakPatterns) ? config.weakPatterns : []).filter((name) => knownPatterns.has(name)))].slice(0, 6),
    goal: String(config.goal ?? "").slice(0, 400),
    solved: [...new Set((Array.isArray(config.solved) ? config.solved : []).map(Number).filter((n) => onSheet.has(n)))],
  };
}

const stageOf = new Map(roadmapStages.flatMap((stage, index) => stage.patterns.map((name) => [name, index] as const)));

/** Sheet order with the student's weak patterns pulled inside their own stage. */
function ladderOrder(weak: string[]): Problem[] {
  const weakSet = new Set(weak);
  return [...problems]
    .sort((a, b) => {
      const stageGap = (stageOf.get(a.pattern) ?? 9) - (stageOf.get(b.pattern) ?? 9);
      if (stageGap !== 0) return stageGap;
      const weakGap = Number(weakSet.has(b.pattern)) - Number(weakSet.has(a.pattern));
      if (weakGap !== 0) return weakGap;
      return a.number - b.number;
    });
}

/**
 * The core a short window has to teach. One row from every pattern at a time, and
 * inside a pattern the must-know rows come first - so a ten-day sprint spends its
 * budget on the Blind-75 end of the sheet without ever dropping a stage. Weak
 * patterns get their top two rows before the rotation starts.
 */
function coreRows(count: number, weak: string[]): Problem[] {
  const pools = patterns
    .map((name) => ({ name, rows: problems.filter((problem) => problem.pattern === name).sort((a, b) => interviewTier(a) - interviewTier(b) || a.number - b.number) }))
    .filter((pool) => pool.rows.length);
  const rotation = [...pools].sort((a, b) => Number(weak.includes(b.name)) - Number(weak.includes(a.name)));
  const picked = new Set<number>();
  const take = (problem: Problem) => { if (picked.size < count) picked.add(problem.number); };
  for (const pool of rotation) if (weak.includes(pool.name)) pool.rows.slice(0, 2).forEach(take);
  for (let round = 0; picked.size < count; round += 1) {
    let added = false;
    for (const pool of rotation) {
      const row = pool.rows[round];
      if (!row || picked.has(row.number)) continue;
      picked.add(row.number);
      added = true;
      if (picked.size === count) break;
    }
    if (!added) break;
  }
  // Back in teaching order - a sprint still runs arrays before graphs.
  return ladderOrder(weak).filter((problem) => picked.has(problem.number));
}

function focusFor(rows: Problem[]): string {
  if (!rows.length) return "Rest";
  const stages = new Set(rows.map((problem) => stageOf.get(problem.pattern) ?? 0));
  if (stages.size === 1) return roadmapStages[[...stages][0]]?.name ?? rows[0].pattern;
  const top = [...new Set(rows.map((problem) => problem.pattern))];
  return top.length === 1 ? top[0] : `${top.length} patterns, mixed`;
}

export type StudyPlan = {
  track: StudyTrack;
  config: PlanConfig;
  days: PlanDay[];
  /** Distinct problems the learn pass hands out. */
  learnTotal: number;
  studyDays: number;
  perStudyDay: number;
  phases: Array<{ phase: PlanPhase; from: number; to: number; rows: number }>;
};

/** True for the first `daysPerWeek` weekdays of every week of the plan. */
function isStudyDay(day: number, daysPerWeek: number): boolean {
  return ((day - 1) % 7) < daysPerWeek;
}

/** What the ladder says for a day, ignoring the 84-day ceiling. */
function ladderDay(day: number): Problem[] {
  return day > planDays ? [] : taskForDay(day).rows;
}

export function buildPlan(rawConfig: Partial<PlanConfig>): StudyPlan {
  const config = normaliseConfig(rawConfig);
  const track = trackById(config.track);
  const solved = new Set(config.solved);
  const studySlots = Math.max(1, Math.ceil((track.days * config.daysPerWeek) / 7));

  // A sprint picks its own rows, so it skips what the student already did. The
  // ladder does not: day 9 belongs to those rows whether or not they are solved,
  // because the rail has to be able to show them ticked.
  const learnPool = track.scope === "core"
    ? coreRows(Math.min(studySlots * (config.dailyTarget || 6), problems.length), config.weakPatterns).filter((problem) => !solved.has(problem.number))
    : ladderOrder(config.weakPatterns);

  const perStudyDay = Math.max(1, config.dailyTarget || Math.ceil(learnPool.length / studySlots));
  const days: PlanDay[] = [];
  let cursor = 0;
  let learnEnd = 0;

  for (let day = 1; day <= track.days; day += 1) {
    const weekday = ((day - 1) % 7) + 1;
    if (!isStudyDay(day, config.daysPerWeek)) {
      const previous = days[day - 2]?.rows ?? [];
      const rows = previous.slice(0, 2);
      days.push({ day, weekday, study: false, phase: rows.length ? "revise" : "rest", focus: rows.length ? "Hold what you did" : "Rest", rows });
      continue;
    }
    if (cursor < learnPool.length) {
      const rows = track.scope === "ladder" && config.daysPerWeek === 7 && track.id === "m3"
        ? ladderDay(day)
        : learnPool.slice(cursor, cursor + perStudyDay);
      cursor += rows.length;
      learnEnd = day;
      days.push({ day, weekday, study: true, phase: "learn", focus: focusFor(rows), rows });
      continue;
    }
    days.push({ day, weekday, study: true, phase: "learn", focus: "Clear", rows: [] });
  }

  // A six-month window is not a slow three-month one: the ladder finishes and the
  // second pass begins, so the revision phase gets real rows instead of air.
  if (track.id === "m6") {
    const secondPass = ladderOrder(config.weakPatterns)
      .filter((problem) => interviewTier(problem) <= 2)
      .sort((a, b) => interviewTier(b) - interviewTier(a) || b.number - a.number);
    let review = 0;
    for (let day = learnEnd + 1; day <= track.days; day += 1) {
      const slot = days[day - 1];
      if (!slot?.study) continue;
      const isMock = day > track.days - 12;
      slot.phase = isMock ? "mock" : "revise";
      slot.rows = secondPass.slice(review, review + (isMock ? 4 : 2));
      slot.focus = isMock ? `Timed set ${tierLabels[1].toLowerCase()} mix` : "Second pass";
      review += slot.rows.length;
    }
  }

  const learnTotal = days.reduce((total, entry) => total + (entry.phase === "learn" ? entry.rows.length : 0), 0);
  const phases: StudyPlan["phases"] = [];
  for (const entry of days) {
    const last = phases[phases.length - 1];
    if (last && last.phase === entry.phase) {
      last.to = entry.day;
      last.rows += entry.rows.length;
    } else phases.push({ phase: entry.phase, from: entry.day, to: entry.day, rows: entry.rows.length });
  }

  return { track, config, days, learnTotal, studyDays: days.filter((entry) => entry.study).length, perStudyDay, phases };
}

export function planOnDay(plan: StudyPlan, day: number): PlanDay | null {
  return plan.days[Math.min(Math.max(Math.floor(day), 1), plan.days.length) - 1] ?? null;
}

/**
 * What the planner hears when a student writes instead of clicking. Reads a window,
 * a weekday count, a daily target and any pattern names - no network needed.
 */
export function configFromBrief(brief: string, base: Partial<PlanConfig> = {}): PlanConfig {
  const text = String(brief ?? "").toLowerCase();
  const config = normaliseConfig({ ...base, goal: String(brief ?? "").trim() });
  const weeks = text.match(/(\d{1,2})\s*(?:week|wk|hafta|هفته|सप्ताह)/);
  const months = text.match(/(\d{1,2})\s*(?:month|mahine|महीने|masa)/);
  const days = text.match(/(\d{1,3})\s*(?:day|din|दिन)/);
  let window = 0;
  if (days) window = Number(days[1]);
  if (weeks) window = Math.max(window, Number(weeks[1]) * 7);
  if (months) window = Math.max(window, Number(months[1]) * 30);
  if (/placement|off ?campus|internship|next month|june|July/i.test(brief ?? "") && !window) window = 60;
  if (window <= 0) {
    config.track = "m3";
  } else if (window <= 21) {
    config.track = "sprint10";
  } else if (window <= 120) {
    config.track = "m3";
  } else {
    config.track = "m6";
  }
  const perDay = text.match(/(\d{1,2})\s*(?:problem|question|ques|prashn)[a-z]*\s*(?:a|per|ek)\s*day/) ?? text.match(/(\d{1,2})\s*problems?\s*per\s*day/);
  if (perDay) config.dailyTarget = Number(perDay[1]);
  const hours = text.match(/(\d(?:\.\d)?)\s*(?:hr|hour)/);
  if (hours && !perDay) config.dailyTarget = Number(hours[1]) >= 4 ? 5 : Number(hours[1]) >= 2 ? 3 : 2;
  const five = text.match(/(\d)\s*(?:days?)\s*(?:a|per)\s*week/);
  if (five && [3, 5, 7].includes(Number(five[1]))) config.daysPerWeek = Number(five[1]);
  // A student writes "dp" or "graphs", not "1-D DP". Full names still win, and the
  // words that are common English ("a bit hard") are not treated as patterns.
  const tokens = new Set(text.match(/[a-z0-9-]+/g) ?? []);
  const common = new Set(["and", "or", "bit", "one", "two", "day", "days", "per", "week", "weeks"]);
  const weak = [...knownPatterns].filter((name) => {
    const lower = name.toLowerCase();
    if (text.includes(lower)) return true;
    return lower.split(/[\s&/]+/).some((word) => word.length > 1 && !common.has(word) && (tokens.has(word) || tokens.has(`${word}s`) || tokens.has(word.replace(/s$/, ""))));
  });
  config.weakPatterns = [...new Set([...weak, ...config.weakPatterns])].slice(0, 6);
  return config;
}
