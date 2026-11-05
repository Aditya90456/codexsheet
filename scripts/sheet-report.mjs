import { problems, topics, patterns, sheetTopicFor, sheetWeekFor } from "../src/dsaSheet.ts";

const tally = (key) => {
  const map = new Map();
  for (const p of problems) map.set(p[key], (map.get(p[key]) ?? 0) + 1);
  return [...map].map(([name, count]) => `${name}=${count}`).join(" ");
};
console.log("total", problems.length);
console.log("by topic:", tally("topic"));
console.log("by week:", tally("week"));
console.log("by tier:", tally("tier"));
console.log("topics declared", topics.length, "patterns declared", patterns.length);
console.log("unknown topic:", problems.filter((p) => !topics.includes(p.topic)).length);
console.log("unknown pattern:", problems.filter((p) => !patterns.includes(p.pattern)).length);
console.log("sheetTopicFor/WeekFor agree:", problems.every((p) => p.topic === sheetTopicFor(p.pattern) && p.week === sheetWeekFor(p.pattern)));
console.log("links ok:", problems.every((p) => /^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/.test(p.link)));
console.log("premium:", problems.filter((p) => p.premium).map((p) => `${p.number} ${p.title} -> ${p.freeLink ? "mirror" : "NO MIRROR"}`).join(" | "));
console.log("first 3:", JSON.stringify(problems.slice(0, 3)));
for (let week = 1; week <= 12; week += 1) {
  const rows = problems.filter((p) => p.week === week);
  console.log(`week ${week}: ${rows.length} problems · patterns ${[...new Set(rows.map((r) => r.pattern))].join(", ")}`);
}
