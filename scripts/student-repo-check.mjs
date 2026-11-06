// Proves the paths and starters the site shows are the ones in the clone.
//   npx vite build --ssr scripts/student-repo-check.mjs --outDir .student-repo-ssr-check
//   node .student-repo-ssr-check/student-repo-check.js
// A card on /problems prints repoFolder(); the repo is written from the same helper,
// so this fails if either the sheet or the generator drifts.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { problems, topics } from "../src/dsaSheet.ts";
import { fileNames, languages, starterFor } from "../src/deva-starters.ts";
import { parseCommitSubjects, repoFolder, topicFolder, topicFolderFor } from "../src/studentRepo.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "student-repo");
const failures = [];

for (const problem of problems) {
  const folder = repoFolder(problem);
  if (!existsSync(join(repo, folder, "README.md"))) failures.push(`no brief at ${folder}/README.md`);
  for (const language of languages) {
    const file = join(repo, folder, fileNames[language]);
    const expected = `${starterFor(language, problem)}\n`.replace(/\r\n/g, "\n");
    if (!existsSync(file)) { failures.push(`no ${language} starter at ${folder}`); continue; }
    if (readFileSync(file, "utf8").replace(/\r\n/g, "\n") !== expected) failures.push(`${language} starter differs from the editor: ${folder}`);
  }
}

for (const topic of topics) {
  if (topicFolderFor(topic) !== topicFolder(topic)) failures.push(`the rail prints a folder that is not on disk: ${topic}`);
  if (!existsSync(join(repo, "problems", topicFolder(topic)))) failures.push(`topic folder missing: ${topicFolder(topic)}`);
}

// The box on /problems reads the same prefix the repo tells students to commit,
// so the parser is checked here too: numbers in range, duplicates once, junk ignored.
const parsed = parseCommitSubjects([
  "001: Two Sum",
  "004 - Valid Parentheses",
  "012: Binary Search",
  "012: Binary Search again",
  "chore: readme tidy",
  "999: not on the sheet",
].join("\n"));
if (parsed.join(",") !== "1,4,12") failures.push(`commit parsing returned ${parsed.join(",")} instead of 1,4,12`);

// The loop the site promises: clone the repo, commit in the documented format, and
// read that log back. This runs it for real in a throwaway clone in the temp dir.
const clone = join(tmpdir(), "codexsheet-student-repo-loop");
const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
rmSync(clone, { recursive: true, force: true });
try {
  git(["clone", "--quiet", repo, clone]);
  for (const problem of [problems[0], problems[13]]) {
    const file = join(clone, repoFolder(problem), fileNames.Python);
    writeFileSync(file, `print("solved ${problem.number}")\n`, "utf8");
    git(["add", "-A"], clone);
    git(["commit", "-qm", `${String(problem.number).padStart(3, "0")}: ${problem.title}`], clone);
  }
  const log = git(["log", "--pretty=%s"], clone);
  const roundTrip = parseCommitSubjects(`${log}\n${log}`).join(",");
  if (roundTrip !== "1,14") failures.push(`a real commit log parsed as ${roundTrip} instead of 1,14`);
} catch (error) {
  failures.push(`the clone-and-commit loop could not run: ${String(error).slice(0, 120)}`);
} finally {
  rmSync(clone, { recursive: true, force: true });
}

const lines = [
  `${problems.length} problems checked against ${join(root, "student-repo")}`,
  `${languages.length} starters per problem, compared byte for byte with starterFor()`,
  failures.length ? `${failures.length} FAILURES` : "no failures",
  ...failures.slice(0, 12),
];
console.log(lines.join("\n"));
if (failures.length) process.exitCode = 1;
