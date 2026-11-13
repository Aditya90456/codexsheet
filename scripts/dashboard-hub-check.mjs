// Renders the two new halves of /dashboard - the "pick the pattern back up"
// track and the board of every rail - and reads the markup back without a
// browser, then checks every number printed on a card against the page that
// card links to.
//
// The point is drift. A card that says "38 films" while the lessons rail
// renders 40 is a lie a student can click on, and no compiler notices. The
// second half of this file is the other half of the same promise: a rail that
// brings its own hero must never be handed the generic "Your workspace" band.
//   npx vite build --ssr scripts/dashboard-hub-check.mjs --outDir .study-ssr
//   node .study-ssr/dashboard-hub-check.js
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { DashboardHub, ResumeTrack, hubGroups, resumeRows } from "../src/DashboardHub.tsx";
import { selfHeadedViews, viewPaths } from "../src/App.tsx";
import { patterns, problems } from "../src/dsaSheet.ts";
import { courseLessons } from "../src/deva-course-lessons.ts";
import { lessonLectures } from "../src/love-babbar-lessons.ts";
import { radarQuestions } from "../src/interviewRadar2027.ts";
import { roadmapStages } from "../src/dsaPatterns.ts";
import { uiLanguages } from "../src/i18n.ts";

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const failures = [];
const is = (label, ok, detail = "") => {
  if (ok) { console.log(`  ok   ${label}`); return; }
  failures.push(detail ? `${label} — ${detail}` : label);
  console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
};

// A student mid-sheet: a few solved, a few open, nothing exotic.
const progress = {};
for (const problem of problems.slice(0, 40)) progress[problem.number] = { status: "Solved", notes: "" };
for (const problem of problems.slice(40, 47)) progress[problem.number] = { status: "In progress", notes: "" };

const patternStats = patterns
  .map((name) => {
    const matching = problems.filter((problem) => problem.pattern === name);
    const completed = matching.filter((problem) => progress[problem.number]?.status === "Solved").length;
    const active = matching.filter((problem) => progress[problem.number]?.status === "In progress").length;
    return { name, total: matching.length, completed, active };
  })
  .filter((item) => item.total > 0);

const counts = {
  solved: Object.values(progress).filter((item) => item.status === "Solved").length,
  total: problems.length,
  patterns: patternStats.length,
  activeDays: 9,
  unread: 3,
};

const rows = resumeRows(patternStats);
const opened = [];
const hubHtml = renderToStaticMarkup(createElement(DashboardHub, { counts, onOpen: (view) => opened.push(view) }));
const resumeHtml = renderToStaticMarkup(createElement(ResumeTrack, { rows, onOpen: () => {} }));
const cards = hubGroups(counts).flatMap((group) => group.cards);

console.log(`\nhub: ${cards.length} cards in ${hubGroups(counts).length} groups · resume: ${rows.length} patterns`);

// 1. Every card has to lead somewhere the router knows.
const routes = Object.keys(viewPaths);
const dead = cards.filter((card) => !routes.includes(card.view));
is("every card names a real route", dead.length === 0, dead.map((card) => card.view).join(", "));
is("no card is listed twice", new Set(cards.map((card) => card.view)).size === cards.length);

// 2. ...and every rail a student works with has to be on the board.
const required = ["problems", "patterns", "dsa-ide", "cslabs", "calendar", "notes", "dsa-course", "lessons", "articles", "guru", "roadmap", "radar", "network", "chat", "experiences", "leaderboard", "certificate", "mentorship", "marketplace", "resume"];
const missing = required.filter((view) => !cards.some((card) => card.view === view));
is("the board covers every working rail", missing.length === 0, missing.join(", "));

// 3. The numbers on the cards are the numbers the rails render.
is("the sheet card counts the real sheet", hubHtml.includes(`${counts.solved}/${counts.total}`), `${counts.solved}/${counts.total}`);
is("the course card matches the course module", hubHtml.includes(`${courseLessons.length} lessons`), `courseLessons = ${courseLessons.length}`);
is("the films card matches the lesson module", hubHtml.includes(`${lessonLectures.length} films`), `lessonLectures = ${lessonLectures.length}`);
is("the radar card matches the question bank", hubHtml.includes(`${radarQuestions.length} questions`), `radarQuestions = ${radarQuestions.length}`);
is("the roadmap card matches the stages", hubHtml.includes(`${roadmapStages.length} stages`), `roadmapStages = ${roadmapStages.length}`);
is("the guru card matches the i18n ramp", hubHtml.includes(`${uiLanguages.length} languages`), `uiLanguages = ${uiLanguages.length}`);

// 3b. Those modules are the same ones the destination pages import, so a card
//     cannot outlive a swap of the data behind it.
const sourceOf = {
  "dsa-course": ["../src/DsaCourseStudio.tsx", "courseLessons"],
  lessons: ["../src/LessonVideoRail.tsx", "lessonLectures"],
  radar: ["../src/InterviewRadar.tsx", "radarQuestions"],
};
for (const [view, [file, symbol]] of Object.entries(sourceOf)) {
  is(`${view}: the rail itself reads ${symbol}`, read(file).includes(symbol), `${file} no longer imports ${symbol}`);
}

// 4. The resume track: work open in it leads, and the bar is the real fraction.
const withWork = patternStats.filter((item) => item.active > 0);
is("every pattern with work open is on the track", withWork.every((item) => rows.some((row) => row.name === item.name)), withWork.map((w) => w.name).join(", "));
is("a pattern with work beats one without", rows.slice(0, withWork.length).every((row) => row.active > 0), `first ${withWork.length} rows: ${rows.slice(0, withWork.length).map((r) => `${r.name}/${r.active}`).join(", ")}`);
is("the percent is the real fraction", rows.every((row) => row.percent === Math.round((row.completed / row.total) * 100)), rows.map((row) => `${row.name} ${row.completed}/${row.total}`).join(", "));
is("the track never outgrows the patterns", rows.length <= patternStats.length && rows.length <= 8);
is("the markup prints the solved line", resumeHtml.includes(`${rows[0].completed} of ${rows[0].total} solved`), rows[0].name);

// 5. A rail that brings its own hero is never handed the generic band.
const app = read("../src/App.tsx");
const bandStart = app.indexOf('className="title-row"');
const bandEnd = app.indexOf("Pick up the rail you need");
is("the shared band is guarded by one list", app.includes("!selfHeadedViews.includes(activeView)"), "the title-row is not behind selfHeadedViews");
is("the band markup sits inside that guard", bandStart > 0 && bandEnd > bandStart && app.lastIndexOf("!selfHeadedViews.includes(activeView)") < bandStart);
const plainRails = routes.filter((view) => !selfHeadedViews.includes(view));
for (const view of plainRails) {
  const mentions = (app.match(new RegExp(`activeView === "${view}"`, "g")) ?? []).length;
  is(`plain rail ${view} has its own copy`, mentions >= 3, `found the view ${mentions} times in the head, expected eyebrow + h1 + blurb`);
}
for (const view of selfHeadedViews) {
  if (view === "home") continue;
  is(`self-headed ${view} is not in the band`, !(app.slice(bandStart, bandEnd).includes(`"${view}"`) && !selfHeadedViews.includes(view)));
}

console.log(failures.length ? `\nFAILURES (${failures.length}):\n${failures.join("\n")}` : "\nno failures");
if (failures.length) process.exitCode = 1;
