// Proves the planner on the real sheet, with no browser and no model. The claims
// it has to hold: a three-month seven-day plan IS the ladder the sheet already
// ships; a ten-day sprint never repeats a row and still reaches the back of the
// subject; no track ever hands out a problem that is not on the sheet; and neither
// a student's words nor a hostile model answer can push a plan out of range.
//   npx vite build --ssr scripts/study-plan-check.mjs --outDir .study-ssr
//   node .study-ssr/study-plan-check.js
import { buildPlan, configFromBrief, normaliseConfig, planOnDay, studyTracks } from "../src/studyPlan.ts";
import { patterns, problems } from "../src/dsaSheet.ts";
import { interviewTier, roadmapStages } from "../src/dsaPatterns.ts";
import { planDays, taskForDay } from "../src/dailyTasks.ts";
import { planFromAi } from "../src/planAi.ts";

const sheet = new Map(problems.map((problem) => [problem.number, problem]));
const failures = [];
const fails = (label, broken) => { if (broken) failures.push(label); };
const planFor = (config) => buildPlan({ solved: [], ...config });

for (const track of studyTracks) {
  const plan = planFor({ track: track.id });
  fails(`${track.id}: ${plan.days.length} days, expected ${track.days}`, plan.days.length !== track.days);

  const handed = plan.days.flatMap((day) => day.phase === "learn" ? day.rows.map((row) => row.number) : []);
  fails(`${track.id}: a learn row is not on the sheet`, handed.some((number) => !sheet.has(number)));
  fails(`${track.id}: ${new Set(handed).size} of ${handed.length} learn rows are repeats`, track.scope === "ladder" && new Set(handed).size !== handed.length);
  fails(`${track.id}: the ladder lost rows (${handed.length} of ${problems.length})`, track.scope === "ladder" && plan.config.daysPerWeek === 7 && handed.length !== problems.length);
  fails(`${track.id}: an empty study day in the middle of the plan`, plan.days.some((day, index) => day.study && day.phase === "learn" && !day.rows.length && index < plan.days.length - 1 && handed.length));
  fails(`${track.id}: no phase after learn`, track.id === "m6" && !plan.phases.some((phase) => phase.phase === "mock"));
  fails(`${track.id}: a study day has no focus text`, plan.days.some((day) => day.study && !day.focus));

  const covered = new Set(handed.map((number) => sheet.get(number).pattern));
  fails(`${track.id}: only ${covered.size} patterns covered`, track.id === "sprint10" && covered.size < 8);
  const tiers = handed.map((number) => interviewTier(sheet.get(number)));
  fails(`sprint10: ${tiers.filter((tier) => tier === 1).length} of ${tiers.length} rows are must-know`, track.id === "sprint10" && tiers.filter((tier) => tier === 1).length < tiers.length * 0.6);
  // Sorting the pick list by interview value must not leak into the day order: a
  // sprint still runs the stages in the order the sheet teaches them.
  const stageIndex = new Map(roadmapStages.flatMap((stage, index) => stage.patterns.map((name) => [name, index])));
  const perDay = plan.days.filter((day) => day.phase === "learn" && day.rows.length).map((day) => Math.min(...day.rows.map((row) => stageIndex.get(row.pattern) ?? 0)));
  fails("sprint10: a later day starts earlier than the day before it", track.id === "sprint10" && perDay.some((stage, index) => index > 0 && stage < perDay[index - 1]));
}

// The three-month, seven-day plan must not drift from dailyTasks.ts at all.
const ladder = planFor({ track: "m3" });
for (let day = 1; day <= planDays; day += 1) {
  const mine = ladder.days[day - 1].rows.map((row) => row.number).join(",");
  const theirs = taskForDay(day).rows.map((row) => row.number).join(",");
  if (mine !== theirs) {
    fails(`day ${day} differs from the sheet's own plan (${mine} vs ${theirs})`, true);
    break;
  }
}

// A five-day week is a real choice, not a slower plan with holes in it.
const weekdays = planFor({ track: "m3", daysPerWeek: 5 });
const restDays = weekdays.days.filter((day) => !day.study);
fails(`a five-day week left ${restDays.filter((day) => !day.rows.length && day.day < 40).length} empty rest days early on`, restDays.some((day) => day.day > 3 && day.day < 40 && !day.rows.length));
fails(`a five-day week lost rows: ${weekdays.learnTotal} of ${problems.length}`, weekdays.learnTotal < problems.length);

// A sprint does not make you redo what you already did. The ladder keeps its own
// days untouched, because the rail has to be able to show them ticked.
const did = problems.slice(0, 60).map((problem) => problem.number);
const sprintPartway = planFor({ track: "sprint10", solved: did });
const sprintServed = new Set(sprintPartway.days.flatMap((day) => day.rows.map((row) => row.number)));
fails(`the sprint re-served ${did.filter((number) => sprintServed.has(number)).length} solved rows`, did.some((number) => sprintServed.has(number)));
const ladderPartway = planFor({ track: "m3", solved: did });
const firstFortnight = (plan) => plan.days.slice(0, 14).map((day) => day.rows.map((row) => row.number).join(",")).join("|");
fails("the ladder moved rows off the day the sheet assigned them", firstFortnight(ladderPartway) !== firstFortway_plan());
function firstFortway_plan() { return Array.from({ length: 14 }, (_, index) => taskForDay(index + 1).rows.map((row) => row.number).join(",")).join("|"); }

// What the planner hears when a student writes instead of clicking.
const hears = [
  ["I have an interview in 10 days and I am weak at DP", "sprint10", "1-D DP"],
  ["placements in 3 months, college means 5 days a week", "m3", null],
  ["starting now, 6 months, 2 hours a day", "m6", null],
  ["2 weeks left, graphs kill me", "sprint10", "Graphs"],
];
for (const [brief, track, pattern] of hears) {
  const config = configFromBrief(brief);
  fails(`"${brief}" -> ${config.track}, expected ${track}`, config.track !== track);
  if (pattern) fails(`"${brief}" did not hear ${pattern} (${config.weakPatterns.join("/")})`, !config.weakPatterns.includes(pattern));
}
fails("the 6-month brief did not set a pace", configFromBrief("starting now, 6 months, 2 hours a day").dailyTarget !== 3);

// Neither a hostile model nor a hostile student gets past the clamps.
const junk = normaliseConfig({
  track: "drop-tables",
  daysPerWeek: 80,
  dailyTarget: 9_000,
  weakPatterns: ["DROP TABLE", "1-D DP", "1-D DP", ...patterns, ...patterns],
  goal: "x".repeat(900),
  solved: [-3, 1.5, 7, 7, 9_999, Number.NaN],
});
fails(`junk track survived: ${junk.track}`, junk.track !== "m3");
fails(`junk week survived: ${junk.daysPerWeek}`, junk.daysPerWeek !== 7);
fails(`junk target survived: ${junk.dailyTarget}`, junk.dailyTarget !== 8);
fails(`junk patterns survived: ${junk.weakPatterns.join("/")}`, junk.weakPatterns.length > 6 || junk.weakPatterns.includes("DROP TABLE") || new Set(junk.weakPatterns).size !== junk.weakPatterns.length);
fails(`junk solved survived: ${junk.solved.join(",")}`, junk.solved.join(",") !== "7");
fails("the goal text is not capped", junk.goal.length > 400);

const offline = await planFromAi("I have 10 days and DP is weak", { solved: [] });
fails("no network, no plan", offline.source !== "local" || offline.config.track !== "sprint10");

const sprint = planFor({ track: "sprint10" });
fails("planOnDay does not clamp", planOnDay(sprint, 99)?.day !== 10 || planOnDay(sprint, -4)?.day !== 1);

console.log(`tracks: ${studyTracks.map((track) => `${track.short}=${track.days}d`).join(" ")}`);
for (const track of studyTracks) {
  const plan = planFor({ track: track.id });
  const learn = plan.days.filter((day) => day.phase === "learn" && day.rows.length);
  console.log(`${track.id.padEnd(9)} rows ${String(plan.learnTotal).padStart(3)} · study days ${String(learn.length).padStart(3)} · ${plan.perStudyDay}/day · patterns ${new Set(plan.days.flatMap((day) => day.rows.map((row) => row.pattern))).size}/${patterns.length} · phases ${plan.phases.map((phase) => `${phase.phase}(${phase.from}-${phase.to})`).join(" ")}`);
}
console.log(`brief parse: ${hears.map(([text]) => `${text.split(",")[0]} -> ${configFromBrief(text).track}`).join(" | ")}`);
console.log(`five-day week: ${weekdays.days.filter((day) => day.study).length} study days, ${restDays.length} rest days holding revision`);
console.log(failures.length ? `FAILURES (${failures.length}):\n` + failures.join("\n") : "no failures");
if (failures.length) process.exitCode = 1;
