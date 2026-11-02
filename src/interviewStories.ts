// interviewStories.ts — what a candidate actually sat through, in their own
// words. There is no seeded content here on purpose: every "real interview
// experience" dataset on the internet turned out to be a scrape of
// GeeksforGeeks, Glassdoor or LeetCode Discuss, so the text belongs to somebody
// else and the counts do not add up. The only honest version of this feature is
// the one candidates offer themselves, and nothing reaches the public page until
// a platform mentor has read it.
import { supabase } from "./lib/supabase";

export type ExperienceRound = { name: string; questions: string[] };

export type ExperienceOutcome = "selected" | "rejected" | "ongoing" | "withdrew";

export type ExperienceDraft = {
  company: string;
  role: string;
  location: string;
  interviewYear: string;
  outcome: ExperienceOutcome;
  rounds: ExperienceRound[];
  narrative: string;
  handle: string;
  consent: boolean;
};

export type ExperienceRow = {
  id: number;
  company: string;
  role: string;
  location: string;
  interview_year: number;
  outcome: ExperienceOutcome;
  rounds: ExperienceRound[];
  narrative: string;
  handle: string;
  user_id: string;
  visible: boolean;
  created_at: string;
  reviewed_at: string | null;
};

export const outcomeLabel: Record<ExperienceOutcome, string> = {
  selected: "Offer in hand",
  rejected: "Did not clear it",
  ongoing: "Still in the loop",
  withdrew: "Walked away",
};

export const outcomeChoices: ExperienceOutcome[] = ["selected", "rejected", "ongoing", "withdrew"];

/** Autocomplete only — a list of who hires in India is not invented content. */
export const suggestedCompanies = [
  "TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Capgemini", "Deloitte",
  "Amazon", "Microsoft", "Google", "Adobe", "Oracle", "Samsung", "CodeNation",
  "Arcus", "Beta Rupee", "Zoho", "Freshworks", "Flipkart", "Swiggy", "Zepto",
];

export const emptyExperience = (): ExperienceDraft => ({
  company: "",
  role: "",
  location: "",
  interviewYear: String(new Date().getFullYear()),
  outcome: "selected",
  rounds: [{ name: "", questions: [""] }],
  narrative: "",
  handle: "",
  consent: false,
});

export function tidyRounds(rounds: ExperienceRound[]): ExperienceRound[] {
  return rounds
    .map((round) => ({
      name: round.name.trim().slice(0, 60),
      questions: round.questions
        .map((question) => question.trim())
        .filter((question) => question.length >= 4 && question.length <= 400)
        .slice(0, 25),
    }))
    .filter((round) => round.name.length > 0)
    .slice(0, 12);
}

/** The same rails the database enforces, so a student reads a sentence instead of a 400. */
export function experienceProblem(draft: ExperienceDraft): string {
  const company = draft.company.trim();
  const role = draft.role.trim();
  const narrative = draft.narrative.trim();
  const year = Number(draft.interviewYear);
  if (company.length < 2) return "Which company was it?";
  if (company.length > 60) return "Keep the company name under 60 characters.";
  if (role.length < 2) return "Which role did you interview for?";
  if (!Number.isInteger(year) || year < 2015 || year > 2100) return "Which year was the interview?";
  if (draft.rounds.filter((round) => round.name.trim().length > 0).length > 12) {
    return "Twelve rounds is the cap - merge the extras.";
  }
  if (draft.rounds.some((round) => round.questions.some((question) => question.trim().length > 400))) {
    return "One of those questions runs past 400 characters - shorten it to what they actually said.";
  }
  if (tidyRounds(draft.rounds).length === 0 && narrative.length < 40) return "Describe at least one round, or tell the story in your own words.";
  if (narrative.length > 4000) return `That is ${narrative.length} characters - the cap is 4,000.`;
  if (!draft.consent) return "Tick the box before sending it: CodexSheet may publish what you wrote.";
  return "";
}

function toRow(record: Record<string, unknown>): ExperienceRow {
  const raw = record.rounds;
  let rounds: ExperienceRound[] = [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    rounds = Array.isArray(parsed) ? (parsed as ExperienceRound[]) : [];
  } catch {
    rounds = [];
  }
  return {
    id: Number(record.id),
    company: String(record.company ?? ""),
    role: String(record.role ?? ""),
    location: String(record.location ?? ""),
    interview_year: Number(record.interview_year ?? 0),
    outcome: (String(record.outcome ?? "ongoing") as ExperienceOutcome),
    rounds: rounds.map((round) => ({ name: String(round.name ?? ""), questions: (round.questions ?? []).map(String) })),
    narrative: String(record.narrative ?? ""),
    handle: String(record.handle ?? ""),
    user_id: String(record.user_id ?? ""),
    visible: Boolean(record.visible),
    created_at: String(record.created_at ?? ""),
    reviewed_at: record.reviewed_at ? String(record.reviewed_at) : null,
  };
}

export async function loadExperiences(): Promise<{ rows: ExperienceRow[]; problem: string }> {
  if (!supabase) return { rows: [], problem: "Supabase is not configured, so there is nothing to read yet." };
  const { data, error } = await supabase
    .from("interview_experiences")
    .select("*")
    .eq("visible", true)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return { rows: [], problem: error.message };
  return { rows: (data ?? []).map(toRow), problem: "" };
}

/** The review queue: everything a platform mentor can see, unpublished first. */
export async function loadExperienceQueue(): Promise<{ rows: ExperienceRow[]; problem: string }> {
  if (!supabase) return { rows: [], problem: "Supabase is not configured." };
  const { data, error } = await supabase
    .from("interview_experiences")
    .select("*")
    .order("visible", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { rows: [], problem: error.message };
  return { rows: (data ?? []).map(toRow), problem: "" };
}

export async function submitExperience(
  draft: ExperienceDraft,
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  const problem = experienceProblem(draft);
  if (problem) return { ok: false, message: problem };
  if (!supabase) return { ok: false, message: "CodexSheet cannot store it right now - Supabase is not configured." };

  const { error } = await supabase.from("interview_experiences").insert({
    company: draft.company.trim().slice(0, 60),
    role: draft.role.trim().slice(0, 80),
    location: draft.location.trim().slice(0, 80),
    interview_year: Number(draft.interviewYear),
    outcome: draft.outcome,
    rounds: tidyRounds(draft.rounds),
    narrative: draft.narrative.trim(),
    consent: true,
    handle: draft.handle.trim().slice(0, 60),
    user_id: userId,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Received. A platform mentor reads it before it goes on the public page." };
}

export async function setExperienceVisibility(id: number, visible: boolean): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  const { error } = await supabase.from("interview_experiences").update({ visible }).eq("id", id);
  return error ? error.message : null;
}

/** Company chips, built from what is actually on the page rather than a wish list. */
export function experienceCompanies(rows: ExperienceRow[]): { name: string; count: number }[] {
  const tally = new Map<string, { name: string; count: number }>();
  for (const row of rows) {
    const key = row.company.toLowerCase();
    const found = tally.get(key);
    if (found) found.count += 1;
    else tally.set(key, { name: row.company, count: 1 });
  }
  return [...tally.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
