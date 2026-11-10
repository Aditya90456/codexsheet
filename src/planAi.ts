// planAi.ts - the one place the AI is allowed to change a study plan.
//
// The model never writes problems. It gets the student's words, the real track list
// and the real pattern names, and answers with a shape this module clamps before
// anything sees it: an unknown track, a 40-a-day target or a pattern that is not on
// the sheet is dropped, and the local brief parser (studyPlan.configFromBrief) is
// what the student gets instead. Guru is a suggestion, never the source of truth.

import { patterns } from "./dsaSheet";
import { configFromBrief, normaliseConfig, studyTracks, type PlanConfig, type TrackId } from "./studyPlan";

export type PlanSuggestion = { config: PlanConfig; note: string; source: "ai" | "local" };

type AiPlan = {
  track?: unknown;
  daysPerWeek?: unknown;
  dailyTarget?: unknown;
  weakPatterns?: unknown;
  note?: unknown;
};

const trackIds = new Set<string>(studyTracks.map((track) => track.id));
const patternNames = new Set(patterns);
const weekly = new Set([3, 5, 7]);

/** Only keys the planner understands, each inside its own legal range. */
function clamp(answer: AiPlan): Partial<PlanConfig> & { note?: string } {
  const picked: Partial<PlanConfig> & { note?: string } = {};
  if (typeof answer.track === "string" && trackIds.has(answer.track)) picked.track = answer.track as TrackId;
  if (typeof answer.daysPerWeek === "number" && weekly.has(answer.daysPerWeek)) picked.daysPerWeek = answer.daysPerWeek;
  if (typeof answer.dailyTarget === "number" && Number.isFinite(answer.dailyTarget)) picked.dailyTarget = Math.min(8, Math.max(0, Math.round(answer.dailyTarget)));
  if (Array.isArray(answer.weakPatterns)) picked.weakPatterns = answer.weakPatterns.filter((name): name is string => typeof name === "string" && patternNames.has(name)).slice(0, 6);
  if (typeof answer.note === "string" && answer.note.trim()) picked.note = answer.note.trim().slice(0, 320);
  return picked;
}

export async function planFromAi(brief: string, base: Partial<PlanConfig> = {}, language = "en"): Promise<PlanSuggestion> {
  const local = configFromBrief(brief, base);
  const fallbackNote = `Read from your words: ${studyTracks.find((track) => track.id === local.track)?.label ?? "the 12-week ladder"}.`;
  try {
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        brief: local.goal.slice(0, 400),
        solved: local.solved.length,
        tracks: studyTracks.map((track) => ({ id: track.id, days: track.days, label: track.label })),
        patterns,
      }),
      signal: AbortSignal.timeout(90_000),
    });
    const result = (await response.json()) as { plan?: AiPlan; error?: string };
    if (!response.ok || !result.plan) throw new Error(result.error ?? "The planner did not answer.");
    const { note, ...answer } = clamp(result.plan);
    const config = normaliseConfig({ ...local, ...answer });
    return { config, note: note ?? "Guru set the pace from what you wrote.", source: "ai" };
  } catch {
    return { config: local, note: fallbackNote, source: "local" };
  }
}
