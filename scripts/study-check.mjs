// Proves the study layer covers every sheet row for real: runs approachFor and
// boardFor over all problems, executes the simulation kernels, and fails on any
// row that would open an empty panel.
//   npx vite build --ssr scripts/study-check.mjs --outDir .study-ssr
//   node .study-ssr/study-check.js
import { problems, patterns, topics } from "../src/dsaSheet.ts";
import { patternCardByName } from "../src/dsaPatterns.ts";
import { approachFor, boardFor, topicPlaybook, patternsForTopic } from "../src/problemCoach.ts";

const failures = [];

for (const problem of problems) {
  const approach = approachFor(problem);
  const board = boardFor(problem);
  const card = patternCardByName.get(problem.pattern);
  if (!card) failures.push(`${problem.number}: pattern "${problem.pattern}" has no card`);
  if (approach.recognize !== card?.cue) failures.push(`${problem.number}: recognition drifted from the pattern card`);
  if (approach.ladder.length < 4) failures.push(`${problem.number}: only ${approach.ladder.length} ladder moves for ${problem.pattern}`);
  if (approach.traps.length < 2) failures.push(`${problem.number}: only ${approach.traps.length} traps for ${problem.pattern}`);
  if (approach.template.length === 0) failures.push(`${problem.number}: no skeleton for ${problem.pattern}`);
  if (board.frames.length === 0) failures.push(`${problem.number}: empty whiteboard for ${problem.pattern}`);
  const first = board.frames[0];
  if (!first || typeof first.caption !== "string" || !first.caption.trim()) failures.push(`${problem.number}: board has no caption`);
  if (!board.heading) failures.push(`${problem.number}: board heading missing for ${problem.pattern}`);
  if (!/^(Easy|Medium|Hard)$/.test(problem.difficulty)) failures.push(`${problem.number}: bad difficulty`);
}

// Every pattern must be reachable from at least one row, or the panel never shows it.
const used = new Set(problems.map((problem) => problem.pattern));
for (const name of patterns) if (!used.has(name)) failures.push(`pattern ${name} has no sheet rows`);

for (const topic of topics) {
  const playbook = topicPlaybook(topic);
  if (!playbook?.shape || playbook.checks.length < 3 || !playbook.start) failures.push(`topic ${topic} has no playbook`);
  const inTopic = problems.filter((problem) => problem.topic === topic);
  if (!inTopic.length) failures.push(`topic ${topic} has no rows`);
  const listed = patternsForTopic(topic, problems);
  for (const name of listed) if (!used.has(name)) failures.push(`topic ${topic} lists unused pattern ${name}`);
}

const boards = new Map();
for (const problem of problems) boards.set(problem.pattern, boardFor(problem).frames.length);
const steps = [...boards.values()].reduce((total, count) => total + count, 0);

// The Hinglish voice layer: every label the sheet UI prints must exist, and the
// hausla line must answer for every position a student can actually be in.
const { hauslaLine, rewardVoice, sheetVoice, studyBlockVoice, studyTabVoice, sheetModeVoice } = await import("../src/sheetVoice.ts");
// Every voice slot is called the way the page calls it, so a label cannot exist and
// still print nothing.
const voiceArgs = {
  heroBody: [250, 12, 16, 12],
  railAllMeta: [250, 16, 12],
  railPick: ["week"],
  railClear: [250],
  toolbar: ["", "pattern"],
  headingTest: ["Trees"],
  notePlaceholder: ["Two Sum"],
  notePraise: [7],
  showAll: [80, "Trees & BSTs"],
  boardNote: ["Trees"],
  step: [3, 12],
};
const nonEmpty = (value) => typeof value === "string" ? Boolean(value.trim()) : Array.isArray(value) ? value.length > 0 && value.every(nonEmpty) : typeof value === "object" ? Object.values(value).every(nonEmpty) : false;
for (const [key, value] of Object.entries(sheetVoice)) {
  if (typeof value === "function") {
    const args = voiceArgs[key];
    if (!args) failures.push(`sheetVoice.${key} has no sample call in the check`);
    else if (!String(value(...args)).trim()) failures.push(`sheetVoice.${key} printed nothing`);
    continue;
  }
  if (!nonEmpty(value)) failures.push(`sheetVoice.${key} is empty`);
}
if (!nonEmpty(studyBlockVoice.step(3, 12))) failures.push("the board step label printed nothing");
for (const [key, value] of Object.entries({ ...sheetVoice.filters, ...sheetVoice.filterAll })) if (!nonEmpty(value)) failures.push(`filter label ${key} is empty`);
if (sheetVoice.searchChips.length < 4) failures.push("the weak-area search chips ran out");
for (const mode of ["week", "topic", "pattern"]) {
  if (!sheetModeVoice[mode]?.label || !sheetModeVoice[mode]?.sub) failures.push(`mode ${mode} has no voice`);
}
for (const [key, value] of Object.entries({ ...studyBlockVoice, ...studyTabVoice })) {
  if (typeof value === "function") continue;
  if (!value.trim()) failures.push(`voice label ${key} is empty`);
}
const seenLines = new Set();
for (let solved = 0; solved < problems.length; solved += 1) {
  const line = hauslaLine({ solved, total: problems.length, inProgress: solved % 6, streak: solved % 9, percent: Math.round((solved / problems.length) * 100) });
  if (!line.line.trim() || !line.sub.trim()) failures.push(`hausla empty at ${solved} solved`);
  seenLines.add(line.line);
}
const done = hauslaLine({ solved: problems.length, total: problems.length, inProgress: 0, streak: 40, percent: 100 });
if (seenLines.has(done.line)) failures.push("the finished-sheet line is used before the sheet is finished");
if (hauslaLine({ solved: 0, total: problems.length, inProgress: 0, streak: 0, percent: 0 }).line === done.line) failures.push("hausla reads the same at zero and at full");
if (seenLines.size < 8) failures.push(`hausla only has ${seenLines.size} distinct lines across the sheet`);
const toast = rewardVoice(problems[0], 10);
if (!toast.includes("+10 XP")) failures.push(`reward toast lost the XP: ${toast}`);

console.log(`rows checked: ${problems.length}`);
console.log(`patterns with a live board: ${boards.size}/${patterns.length} · total board steps: ${steps}`);
console.log(`topics with a playbook: ${topics.length}`);
console.log(`ladder range: ${Math.min(...problems.map((problem) => approachFor(problem).ladder.length))}-${Math.max(...problems.map((problem) => approachFor(problem).ladder.length))} moves`);
const sample = problems[0];
console.log(`sample row: ${sample.number} ${sample.title} · ${sample.pattern} · board "${boardFor(sample).heading}" · ${boardFor(sample).frames.length} steps`);
console.log(`hausla lines across the sheet: ${seenLines.size} · at 0: "${hauslaLine({ solved: 0, total: problems.length, inProgress: 0, streak: 0, percent: 0 }).line}"`);
console.log(failures.length ? `FAILURES (${failures.length}):\n` + failures.slice(0, 20).join("\n") : "no failures");
if (failures.length) process.exitCode = 1;
