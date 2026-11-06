// Prints the actual structure the /problems UI renders: every topic, the patterns
// inside it, the week ladder, and the tier split. Run:
//   npx vite build --ssr scripts/sheet-structure.mjs --outDir .study-ssr
//   node .study-ssr/sheet-structure.js
import { problems, patterns, topics } from "../src/dsaSheet.ts";

const rowsOf = (predicate) => problems.filter(predicate);
const tierSplit = (rows) => ({
  t1: rows.filter((row) => row.tier === 1).length,
  t2: rows.filter((row) => row.tier === 2).length,
  t3: rows.filter((row) => row.tier === 3).length,
});
const levels = (rows) => ({
  Easy: rows.filter((row) => row.difficulty === "Easy").length,
  Medium: rows.filter((row) => row.difficulty === "Medium").length,
  Hard: rows.filter((row) => row.difficulty === "Hard").length,
});

const byTopic = topics.map((topic) => {
  const rows = rowsOf((problem) => problem.topic === topic);
  const inside = patterns.filter((name) => rows.some((problem) => problem.pattern === name));
  return {
    topic,
    count: rows.length,
    patterns: inside.map((name) => ({ name, count: rows.filter((row) => row.pattern === name).length })),
    weeks: [...new Set(rows.map((row) => row.week))].sort((a, b) => a - b),
    ...tierSplit(rows),
    ...levels(rows),
  };
});

const byPattern = patterns.map((name) => {
  const rows = rowsOf((problem) => problem.pattern === name);
  return { pattern: name, count: rows.length, topic: rows[0]?.topic, ...tierSplit(rows), ...levels(rows) };
});

const byWeek = Array.from({ length: 12 }, (_, index) => {
  const rows = rowsOf((problem) => problem.week === index + 1);
  return { week: index + 1, count: rows.length, topics: [...new Set(rows.map((row) => row.topic))].length, patterns: [...new Set(rows.map((row) => row.pattern))].length };
});

console.log(JSON.stringify({ total: problems.length, byTopic, byPattern, byWeek }, null, 1));
