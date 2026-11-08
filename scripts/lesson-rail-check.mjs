// Renders the lesson rail the way /problems does, without a browser, and reads
// the markup back. The point: the numbers the rail says out loud come from the
// table, and nothing from YouTube is on the page until a lecture is picked.
//   npx vite build --ssr scripts/lesson-rail-check.mjs --outDir .study-ssr
//   node .study-ssr/lesson-rail-check.js
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { problems } from "../src/dsaSheet.ts";
import LessonVideoRail from "../src/LessonVideoRail.tsx";
import { lessonLectures, lessonVideos } from "../src/love-babbar-lessons.ts";

// The list opens at the first 40 lectures, so the probe pattern has to be one of
// those - otherwise the flag check passes by rendering nothing.
const first = lessonLectures.slice(0, 40);
const probePattern = first.flatMap((video) => video.patterns).find((name, index, all) => all.indexOf(name) === index && all.filter((x) => x === name).length < first.length);

const html = renderToString(createElement(LessonVideoRail, { problems, pattern: probePattern, sheetLocked: false, onOpenTopic: () => {} }));
// The locked sheet still has to show its own lessons - that is the pitch.
const lockedHtml = renderToString(createElement(LessonVideoRail, { problems, pattern: probePattern, sheetLocked: true, onOpenTopic: () => {} }));
const count = (re) => (html.match(re) ?? []).length;

const failures = [];
if (!lockedHtml.includes(`${lessonLectures.length} free video lessons`)) failures.push("a student who has not bought the ₹10 pass sees no lessons at all");
if (lockedHtml.includes("lesson-video-jump")) failures.push("the locked rail offers a jump into a sheet it will not open");
if (!html.includes(`${lessonLectures.length} free video lessons`)) failures.push("the heading does not count the lectures");
if (!html.includes("96 ghante")) failures.push(`the heading lost the hours (${lessonLectures.reduce((t, v) => t + v.seconds, 0) / 3600}h raw)`);
if (count(/lesson-video-row[" ]/g) !== 40) failures.push(`${count(/lesson-video-row[" ]/g)} rows rendered, expected the first 40`);
if (!html.includes("Saare")) failures.push("the show-all button did not render");
if (/youtube-nocookie|youtube\.com|i\.ytimg\.com/.test(html)) failures.push("YouTube was fetched before a lecture was picked");
if (count(/lesson-video-row matched/g) !== first.filter((video) => video.patterns.includes(probePattern)).length) failures.push(`the ${probePattern} filter flagged the wrong rows`);
if (!html.includes("PATTERN FILTER SE MATCH")) failures.push("the pattern filter printed no flag");
if (!html.includes("FREE")) failures.push("the rail does not say it is free");

console.log(`rows rendered: ${count(/lesson-video-row[" ]/g)} of ${lessonLectures.length} lectures (${lessonVideos.length} playlist items)`);
console.log(`pattern filter open: "${probePattern}" · rows it flagged: ${count(/lesson-video-row matched/g)}`);
console.log(`external hosts in markup: ${count(/https:\/\/[a-z0-9.-]+/gi)}`);
console.log(failures.length ? `FAILURES (${failures.length}):\n` + failures.join("\n") : "no failures");
if (failures.length) process.exitCode = 1;
