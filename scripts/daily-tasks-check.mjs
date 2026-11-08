// Proves the daily plan is the sheet and nothing more: all 250 rows land on
// exactly one of the 84 days, no day is empty, no day is invented, and the strip
// a student actually sees prints those rows. Also runs every dailyVoice slot the
// way the page calls it, so a label cannot exist and still print nothing.
//   npx vite build --ssr scripts/daily-tasks-check.mjs --outDir .study-ssr
//   node .study-ssr/daily-tasks-check.js
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { problems } from "../src/dsaSheet.ts";
import {
  daysSince,
  expectedByDay,
  planCalendar,
  planDays,
  planStanding,
  planWeeks,
  taskForDay,
  todayTask,
  weekRows,
} from "../src/dailyTasks.ts";
import { dailyVoice } from "../src/sheetVoice.ts";
import DailyTaskRail from "../src/DailyTaskRail.tsx";

const failures = [];
const calendar = planCalendar();

// 1. The calendar is the sheet, cut up. Every row once, every day non-empty.
if (calendar.length !== planDays) failures.push(`the calendar has ${calendar.length} days, plan says ${planDays}`);
if (planWeeks * 7 !== planDays) failures.push(`planWeeks x 7 (${planWeeks * 7}) does not equal planDays (${planDays})`);

const seen = new Map();
for (const day of calendar) {
  if (day.day !== calendar.indexOf(day) + 1) failures.push(`day ${day.day} is out of order at position ${calendar.indexOf(day) + 1}`);
  if (day.rows.length === 0) failures.push(`day ${day.day} asks for nothing`);
  if (day.finished) failures.push(`day ${day.day} is marked finished inside the plan`);
  if (day.week !== Math.ceil(day.day / 7)) failures.push(`day ${day.day} claims week ${day.week}`);
  if (day.slot !== ((day.day - 1) % 7)) failures.push(`day ${day.day} claims slot ${day.slot}`);
  let previous = 0;
  for (const row of day.rows) {
    if (row.number <= previous) failures.push(`day ${day.day} is not sorted (${previous} then ${row.number})`);
    previous = row.number;
    if (row.week !== day.week) failures.push(`day ${day.day} (week ${day.week}) contains row ${row.number} from week ${row.week}`);
    if (seen.has(row.number)) failures.push(`row ${row.number} is assigned twice: day ${seen.get(row.number)} and day ${day.day}`);
    seen.set(row.number, day.day);
    if (!row.link.startsWith("https://leetcode.com/problems/")) failures.push(`row ${row.number} has no openable link`);
  }
}
if (seen.size !== problems.length) failures.push(`${seen.size} of ${problems.length} sheet rows are assigned`);
for (const problem of problems) if (!seen.has(problem.number)) failures.push(`row ${problem.number} never appears in any day`);

// 2. Within a week the days are as even as whole problems allow - max difference of 1.
for (let week = 1; week <= planWeeks; week += 1) {
  const days = calendar.filter((day) => day.week === week).map((day) => day.rows.length);
  const total = weekRows(week).length;
  if (days.reduce((a, b) => a + b, 0) !== total) failures.push(`week ${week} days add to ${days.reduce((a, b) => a + b, 0)}, the week has ${total}`);
  if (Math.max(...days) - Math.min(...days) > 1) failures.push(`week ${week} days are uneven: ${days.join(",")}`);
  if (days.length !== 7) failures.push(`week ${week} has ${days.length} days`);
}

// 3. Nothing outside the plan can break it.
const emptyDays = [taskForDay(0), taskForDay(-3), taskForDay(1.9)];
for (const task of emptyDays) if (task.day !== 1 || task.rows.length !== calendar[0].rows.length) failures.push(`day ${task.day} clamped wrong`);
for (const over of [planDays + 1, planDays + 400, 1e9]) {
  const task = taskForDay(over);
  if (!task.finished) failures.push(`day ${over} should be past the plan`);
  if (task.rows.length !== 0) failures.push(`day ${over} still assigns ${task.rows.length} rows`);
  if (task.week !== planWeeks) failures.push(`day ${over} reports week ${task.week}`);
}
if (expectedByDay(planDays) !== problems.length) failures.push(`the plan expects ${expectedByDay(planDays)} by day ${planDays}, the sheet has ${problems.length}`);
if (expectedByDay(planDays + 900) !== problems.length) failures.push("expectedByDay runs past the end of the sheet");
if (expectedByDay(0) !== 0) failures.push(`day 0 expects ${expectedByDay(0)}`);
if (expectedByDay(1) !== calendar[0].rows.length) failures.push("day 1 expects the wrong number");
if (expectedByDay(8) !== calendar.slice(0, 8).reduce((t, d) => t + d.rows.length, 0)) failures.push("expectedByDay is not the running total of the calendar");

// 4. Calendar maths across month and year edges, because day 1 is a date key.
const dateCases = [
  ["2026-01-01", "2026-01-01", 0],
  ["2026-01-01", "2026-01-02", 1],
  ["2026-01-31", "2026-02-01", 1],
  ["2026-02-28", "2026-03-01", 1],
  ["2028-02-28", "2028-03-01", 2],
  ["2026-12-31", "2027-01-01", 1],
  ["2026-05-01", "2026-04-01", -30],
];
for (const [start, now, want] of dateCases) {
  const got = daysSince(start, now);
  if (got !== want) failures.push(`daysSince(${start}, ${now}) = ${got}, expected ${want}`);
}
if (todayTask("2026-01-01", "2026-03-01").day !== taskForDay(daysSince("2026-01-01", "2026-03-01") + 1).day) failures.push("todayTask and taskForDay disagree");

// 5. The standing the strip reports is arithmetic on the same two sets.
const solvedAll = new Set(problems.map((problem) => problem.number));
const none = planStanding("2026-01-01", "2026-01-01", new Set());
if (none.behind !== expectedByDay(1)) failures.push(`a fresh student is ${none.behind} behind, plan day 1 expects ${expectedByDay(1)}`);
if (none.solved !== 0) failures.push("a fresh student is credited with solves");
const all = planStanding("2026-01-01", "2026-01-01", solvedAll);
if (all.behind > 0) failures.push("a student with the whole sheet solved is called behind");
if (all.behind !== expectedByDay(1) - problems.length) failures.push("ahead is not the mirror of the plan");
const mid = problems.slice(0, 40).map((problem) => problem.number);
const some = planStanding("2026-01-01", "2026-01-01", new Set(mid));
if (some.solved !== 40) failures.push(`planStanding counted ${some.solved} of 40`);
const past = planStanding("2020-01-01", "2026-01-01", new Set());
if (!past.task.finished) failures.push("a plan started in 2020 is not finished");
if (past.expected !== problems.length) failures.push(`a finished plan expects ${past.expected}, the sheet has ${problems.length}`);

// 6. Every voice slot, called the way the page calls it.
const slots = {
  day: [5, planDays],
  week: [3, 2],
  count: [4],
  solvedToday: [2, 4],
  behind: [7],
  ahead: [7],
  dueBy: [40, 33],
  finished: [planDays],
  anchor: ["2026-01-01"],
};
for (const [key, value] of Object.entries(dailyVoice)) {
  if (typeof value === "function") {
    const args = slots[key];
    if (!args) failures.push(`dailyVoice.${key} has no sample call in the check`);
    else if (!String(value(...args)).trim()) failures.push(`dailyVoice.${key} printed nothing`);
    continue;
  }
  if (!String(value).trim()) failures.push(`dailyVoice.${key} is empty`);
}

// 7. The strip a student sees. Rendered server-side, no browser, no stubs.
const nowKey = "2026-11-08";
const render = (startKey, statusOf) => renderToString(createElement(DailyTaskRail, { startKey, nowKey, statusOf, onOpen: () => {}, onRestart: () => {} }));
const dayOne = render("2026-11-08", () => "Todo");
const dayEight = render("2026-11-01", () => "Todo");
const caughtUp = render("2026-11-01", () => "Solved");
const pastPlan = render("2026-05-01", () => "Todo");
const rowsOnDayOne = calendar[0].rows.length;
const dayOf = (key) => daysSince(key, nowKey) + 1;
if ((dayOne.match(/daily-task-row[" ]/g) ?? []).length !== rowsOnDayOne) failures.push(`day 1 printed ${(dayOne.match(/daily-task-row[" ]/g) ?? []).length} rows, the plan says ${rowsOnDayOne}`);
if (!dayOne.includes(dailyVoice.eyebrow)) failures.push("the strip does not say what it is");
if (!dayOne.includes(`Day 1 /`)) failures.push("day 1 does not know it is day 1");
if (!dayEight.includes(`Day ${dayOf("2026-11-01")} /`)) failures.push("the day number is not the distance from day 1");
if (!dayOne.includes(dailyVoice.count(rowsOnDayOne))) failures.push("the day count is not the number of rows printed");
if (dayOne.includes("daily-task-empty")) failures.push("a fresh student is told the plan is over");
for (const row of calendar[0].rows) if (!dayOne.includes(row.title)) failures.push(`day 1 did not print row ${row.number}`);
if ((dayOne.match(/daily-task-tick/g) ?? []).length !== rowsOnDayOne) failures.push(`day 1 offers ${(dayOne.match(/daily-task-tick/g) ?? []).length} tick buttons for ${rowsOnDayOne} rows`);
if (!dayOne.includes('aria-pressed="false"')) failures.push("an unsolved row cannot be ticked off from the strip");
if (render("2026-11-08", () => "Solved").match(/aria-pressed="true"/g)?.length !== rowsOnDayOne) failures.push("a solved row does not show as ticked");
if (!dayEight.includes("daily-task-badge behind")) failures.push(`a student with 0 solves on day ${dayOf("2026-11-01")} is not marked behind`);
if (!dayEight.includes(dailyVoice.dueBy(expectedByDay(dayOf("2026-11-01")), 0))) failures.push("the strip does not state what the plan expected by today");
if (!caughtUp.includes("daily-task-badge ahead")) failures.push("a student who finished every row is not credited");
if (!pastPlan.includes("daily-task-empty")) failures.push("a plan past day 84 still shows a daily list");
if (!pastPlan.includes(dailyVoice.finished(planDays))) failures.push("the finished plan does not say how long it was");
if (!dayEight.includes(dailyVoice.restart)) failures.push("the plan offers no way to restart");
if (!dayOne.includes("Plan ka din 1 = 2026-11-08")) failures.push("the anchor date is not the day-1 key it was given");

const perWeek = calendar.map((day) => day.rows.length);
console.log(`days: ${calendar.length} · rows assigned: ${seen.size}/${problems.length} · per-day ${Math.min(...perWeek)}-${Math.max(...perWeek)}`);
console.log(`week sizes: ${Array.from({ length: planWeeks }, (_, i) => weekRows(i + 1).length).join(",")}`);
console.log(`expected by day 1 / 30 / 84: ${expectedByDay(1)} / ${expectedByDay(30)} / ${expectedByDay(84)}`);
console.log(`day 1 rows: ${calendar[0].rows.map((row) => row.number).join(",")}`);
console.log(`markup: day 1 renders ${(dayOne.match(/daily-task-row[" ]/g) ?? []).length} clickable rows · day 8 badge: ${dayEight.match(/daily-task-badge[a-z ]*/)?.[0]} · past-plan branch: ${pastPlan.includes("daily-task-empty")}`);
console.log(failures.length ? `FAILURES (${failures.length}):\n` + failures.join("\n") : "no failures");
if (failures.length) process.exitCode = 1;
