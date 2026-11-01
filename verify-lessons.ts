import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { courseLessons, lessonDemoStdin, starterFor } from "./src/deva-course-lessons";
import { judgeCases, outputsMatch } from "./src/deva-judge";

const problems: string[] = [];
const lines: string[] = [];
const seen = new Set<string>();
const push = (message: string) => { if (!seen.has(message)) { seen.add(message); problems.push(message); } };

function run(file: string, command: string, args: string[], stdin: string): { out: string; error: string } {
  const result = spawnSync(command, [...args, file], { input: stdin, encoding: "utf8", timeout: 20000 });
  if (result.error) return { out: "", error: String(result.error.message) };
  if (result.status !== 0) return { out: result.stdout ?? "", error: (result.stderr || `exit ${result.status}`).trim().split("\n").slice(-3).join(" | ") };
  return { out: (result.stdout ?? "").trim(), error: "" };
}

for (const lesson of courseLessons) {
  const cases = lesson.problemNumber ? judgeCases(lesson.problemNumber) : null;
  for (const language of ["JavaScript", "Python"] as const) {
    const source = starterFor(lesson, language);
    const file = language === "Python" ? `__lesson_${lesson.id}.py` : `__lesson_${lesson.id}.cjs`;
    writeFileSync(file, source);
    if (cases?.length) {
      let passed = 0;
      for (const item of cases) {
        const outcome = run(file, language === "Python" ? "python" : "node", [], item.stdin);
        if (outcome.error) { push(`${lesson.id} ${language}: ${outcome.error}`); continue; }
        if (outputsMatch(outcome.out, item.expected)) passed += 1;
        else push(`${lesson.id} ${language}: got "${outcome.out}" expected "${item.expected}"`);
      }
      lines.push(`${lesson.id.padEnd(16)} ${language.padEnd(10)} judged ${passed}/${cases.length} (problem ${lesson.problemNumber})`);
    } else {
      const outcome = run(file, language === "Python" ? "python" : "node", [], lessonDemoStdin(lesson));
      if (outcome.error) push(`${lesson.id} ${language} demo: ${outcome.error}`);
      else lines.push(`${lesson.id.padEnd(16)} ${language.padEnd(10)} run-only -> ${outcome.out.slice(0, 46)}`);
    }
    unlinkSync(file);
  }
}

for (const line of lines) console.log(line);
if (problems.length) {
  console.log(`\n${problems.length} FAILURES:`);
  for (const problem of problems) console.log(`  ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`\nall green · ${courseLessons.length} lessons · both languages`);
}
