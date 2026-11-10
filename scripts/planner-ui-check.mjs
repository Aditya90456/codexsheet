// Proves the two surfaces that read the saved plan - /roadmap's planner and the
// daily rail on /problems - without a browser. A student who picks the 10-day
// sprint must see the sprint in both places, on the same rows, and neither is
// allowed to name a problem the sheet does not carry. A config that came from
// somewhere hostile has to fall back to the ladder, not to a window that
// does not exist.
//   npx vite build --ssr scripts/planner-ui-check.mjs --outDir .study-ssr
//   node .study-ssr/planner-ui-check.js
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import StudyPlanner from "../src/StudyPlanner.tsx";
import DailyTaskRail from "../src/DailyTaskRail.tsx";
import { patterns, problems } from "../src/dsaSheet.ts";
import { taskForDay } from "../src/dailyTasks.ts";
import { buildPlan, planOnDay, studyTracks } from "../src/studyPlan.ts";

const store = {};
globalThis.localStorage = {
  getItem: (key) => (key in store ? store[key] : null),
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
};

const failures = [];
const fails = (label, broken) => { if (broken) failures.push(label); };
const count = (html, re) => (html.match(re) ?? []).length;

const startKey = "2026-11-08";
const nowKey = "2026-11-09";
const dayNumber = 2;
const solvedNumbers = problems.slice(0, 12).map((problem) => problem.number);
const statusOf = (number) => (solvedNumbers.includes(number) ? "Solved" : "Todo");
const patternStats = patterns.map((name) => ({ name, total: 20, completed: 4 }));
const noop = () => undefined;

const plannerHtml = () => renderToStaticMarkup(createElement(StudyPlanner, {
  startKey, nowKey, solvedNumbers, statusOf, onStatus: noop, patternStats,
}));
const railHtml = () => renderToStaticMarkup(createElement(DailyTaskRail, {
  startKey, nowKey, statusOf, onOpen: noop, onToggleSolved: noop, onRestart: noop,
}));

/** Which window card carries aria-checked="true". */
const activeWindow = (html) => {
  const at = html.indexOf('aria-checked="true"');
  if (at < 0) return "";
  const around = html.slice(at, at + 400);
  return studyTracks.find((track) => around.includes(track.label))?.id ?? "";
};
const rowNumbers = (html) => [...html.matchAll(/planner-row-no">(\d{3})/g)].map((match) => Number(match[1]));

const fresh = plannerHtml();
fails("the planner does not offer all three windows", studyTracks.some((track) => !fresh.includes(track.label)));
fails(`the window marked chosen is ${activeWindow(fresh) || "nothing"}`, activeWindow(fresh) !== "m3");
fails("two windows look chosen", count(fresh, /aria-checked="true"/g) !== 1);
fails("the AI brief is missing", !fresh.includes("Build my plan") || !fresh.includes("<textarea"));
fails(`only ${count(fresh, /planner-weak-chip/g)} weak-area chips`, count(fresh, /planner-weak-chip/g) !== patterns.length);
fails("the old dropdown controls are still on the page", fresh.includes("roadmap-controls"));

const realLinks = new Set(problems.map((problem) => problem.link));
const hrefs = [...fresh.matchAll(/href="(https:[^"]+)"/g)].map((match) => match[1]);
fails(`${hrefs.filter((href) => !realLinks.has(href)).length} links on the page are not sheet problems`, hrefs.length === 0 || hrefs.some((href) => !realLinks.has(href)));
fails("the markup leaks a value that is not there", /undefined|NaN|\[object Object\]/.test(fresh));

/** The untouched student gets the sheet's own ladder, day for day, on both rails. */
const ladderToday = planOnDay(buildPlan({ solved: solvedNumbers }), dayNumber);
/* study-plan-check.mjs owns the byte-for-byte claim; this one owns the rendering,
   and a solved row has to stay on screen so the rail can tick it. */
const ladderRows = taskForDay(dayNumber).rows.map((row) => row.number).join(",");
fails(`the planner shows ${ladderToday.rows.map((row) => row.number).join(",")} where the sheet says ${ladderRows}`, ladderToday.rows.map((row) => row.number).join(",") !== ladderRows);
fails(`the planner renders ${rowNumbers(fresh).join(",")}, not its own day ${dayNumber}`, rowNumbers(fresh).join(",") !== ladderRows);
fails("the rail lost the ladder's day count", !railHtml().includes(`Day ${dayNumber} / ${studyTracks[1].days}`));

/** Now choose the sprint and check both surfaces move with it. */
store["codexsheet-study-plan"] = JSON.stringify({ track: "sprint10", daysPerWeek: 7, dailyTarget: 0, weakPatterns: ["Graphs"], goal: "", solved: [] });
const sprintPlan = buildPlan({ track: "sprint10", weakPatterns: ["Graphs"], solved: solvedNumbers });
const sprint = plannerHtml();
const sprintRail = railHtml();
const sprintRows = planOnDay(sprintPlan, dayNumber).rows.map((row) => row.number).join(",");
fails(`the sprint card is not the chosen one (${activeWindow(sprint)})`, activeWindow(sprint) !== "sprint10");
fails(`the planner shows ${rowNumbers(sprint).join(",")} instead of ${sprintRows}`, rowNumbers(sprint).join(",") !== sprintRows);
fails(`the rail is still counting ${studyTracks[1].days} days`, !sprintRail.includes(`Day ${dayNumber} / ${studyTracks[0].days}`));
fails("the rail ignored the custom window", !sprintRail.includes("10 days"));
fails("the weak pattern is not switched on", !sprint.includes("planner-weak-chip active"));
fails("the sprint re-served a solved problem", rowNumbers(sprint).some((number) => solvedNumbers.slice(0, 20).includes(number)));
fails("the rail leaked a value that is not there", /undefined|NaN|\[object Object\]/.test(sprintRail));

/** A config that arrived from somewhere hostile falls back to the ladder. */
store["codexsheet-study-plan"] = '{"track":"drop-tables","daysPerWeek":80,"dailyTarget":9000,"weakPatterns":["DROP TABLE","1-D DP"],"goal":"' + "x".repeat(900) + '","solved":[7,9999]}';
const hostile = plannerHtml();
fails(`a junk window survived: ${activeWindow(hostile) || "nothing chosen"}`, activeWindow(hostile) !== "m3");
const paceGroup = hostile.slice(hostile.indexOf("DAYS A WEEK"), hostile.indexOf("PER DAY"));
const targetGroup = hostile.slice(hostile.indexOf("PER DAY"), hostile.indexOf("planner-summary"));
const chosenIn = (chunk) => [...chunk.matchAll(/planner-chip active[^>]*>\s*(\w+)/g)].map((match) => match[1]);
fails(`a junk pace survived: ${chosenIn(paceGroup).join("/")}`, chosenIn(paceGroup).join(",") !== "7");
fails(`a junk target survived: ${chosenIn(targetGroup).join("/")}`, chosenIn(targetGroup).join(",") !== "8");
const hostileWeak = [...hostile.matchAll(/planner-weak-chip active[^>]*>\s*<span>([^<]+)/g)].map((match) => match[1]);
fails(`a junk pattern survived the read: ${hostileWeak.join("/")}`, hostileWeak.length !== 1 || hostileWeak[0] !== "1-D DP");
fails("the junk page is not the ladder either", rowNumbers(hostile).join(",") !== ladderRows);

console.log(`windows: ${studyTracks.map((track) => `${track.id}=${track.days}d`).join(" ")}`);
console.log(`day ${dayNumber}: ladder ${ladderRows.split(",").length} rows ${ladderRows} · sprint ${sprintRows.split(",").length} rows ${sprintRows}`);
console.log(`markup: ${fresh.length} default · ${sprint.length} sprint · ${count(sprint, /<a href="https/g)} sheet links on the sprint page`);
console.log(failures.length ? `FAILURES (${failures.length}):\n` + failures.join("\n") : "no failures");
if (failures.length) process.exitCode = 1;
