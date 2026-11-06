// The sheet as a git repository. scripts/build-student-repo.mjs writes the repo
// from these same helpers, so a path shown on /problems is the path that exists
// in the clone - and both are derived from the sheet, never typed out by hand.
import { topics, type Problem, type SheetTopic } from "./dsaSheet";

export const studentRepoName = "codexsheet-250";
export const studentRepoUrl = `https://github.com/Aditya90456/${studentRepoName}`;
export const studentRepoCloneCommand = `git clone ${studentRepoUrl}.git`;

/** `01-arrays-hashing` - the twelve topic folders, in sheet order. */
export function topicFolder(topic: SheetTopic): string {
  const slug = topic.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${String(topics.indexOf(topic) + 1).padStart(2, "0")}-${slug}`;
}

export type RepoProblem = Pick<Problem, "number" | "slug" | "topic">;

/** `problems/01-arrays-hashing/001-two-sum/` */
export function repoFolder(problem: RepoProblem): string {
  return `problems/${topicFolder(problem.topic)}/${String(problem.number).padStart(3, "0")}-${problem.slug}`;
}

export const tierLabels: Record<Problem["tier"], string> = {
  1: "Blind 75 - must know",
  2: "NeetCode 150 - expected",
  3: "Extra reps - depth",
};

/** The folder for a rail name, or null when the sheet is grouped by week or pattern. */
export function topicFolderFor(name: string): string | null {
  const topic = topics.find((item) => item === name);
  return topic ? topicFolder(topic) : null;
}

export const gitLogCommand = "git log --pretty=%s | sort -u";

// The commit subject the repo tells students to write is `001: Two Sum`, so the
// number in front is the sheet's own problem number. Anything outside 1-250 is
// a normal commit message and is ignored, and one problem solved in six commits
// still counts once.
export function parseCommitSubjects(text: string): number[] {
  const found = new Set<number>();
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*0*(\d{1,3})\s*[:-]\s*\S/.exec(line);
    if (!match) continue;
    const number = Number(match[1]);
    if (number >= 1 && number <= 250) found.add(number);
  }
  return [...found].sort((a, b) => a - b);
}
