// Renders the landing page both ways - signed-out visitor and signed-in student -
// without a browser, then reads the markup back. The point is that the page cannot
// drift: every count comes from the data modules, the price comes from products.ts,
// the day-one card is what the plan really assigns, the mentor block is the résumé
// module, and no GSAP selector is left pointing at markup that no longer exists.
//   npx vite build --ssr scripts/home-check.mjs --outDir .study-ssr
//   node .study-ssr/home-check.js
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { HomePage } from "../src/App.tsx";
import { patterns, problems } from "../src/dsaSheet.ts";
import { roadmapStages } from "../src/dsaPatterns.ts";
import { lessonLectures } from "../src/love-babbar-lessons.ts";
import { expectedByDay, planDays, taskForDay } from "../src/dailyTasks.ts";
import { uiLanguages } from "../src/i18n.ts";
import { mentorProfile, rupees } from "../src/mentorship.ts";
import { accessPass, soldProducts } from "../src/products.ts";

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const appSource = read("../src/App.tsx");
const homeCss = read("../src/home.css");

/** Fails the run when the page stopped being true about itself. */
const failures = [];
const fails = (label, broken) => { if (broken) failures.push(label); };
const count = (html, re) => (html.match(re) ?? []).length;

const taps = [];
const markup = (signedIn) => renderToStaticMarkup(createElement(HomePage, {
  signedIn,
  signInSlot: createElement("button", { className: "home-primary" }, "SIGN_IN_SLOT"),
  onNavigate: (view) => taps.push(String(view)),
  onOpenProduct: (product) => taps.push(String(product)),
}));

const visitor = markup(false);
const student = markup(true);

/* The numbers on the page are the numbers in the sheet. */
fails("the problem count did not reach the page", !visitor.includes(`>${problems.length}<`));
fails("the pattern count did not reach the page", !visitor.includes(`>${patterns.length}<`));
fails("the stage count did not reach the page", !visitor.includes(`>${roadmapStages.length}<`));
fails("the language count did not reach the page", !visitor.includes(`>${uiLanguages.length}<`));
fails("the lesson count did not reach the page", !visitor.includes(`${lessonLectures.length} video lessons`));

/* One price, read from the catalogue rather than typed into the copy. */
const priceCta = `Unlock everything · ${rupees(accessPass.price)}`;
fails(`the pass CTA does not quote products.ts (${priceCta})`, !student.includes(priceCta) && !visitor.includes(priceCta));
fails("a rupee figure on the page is not a catalogue price", !(visitor.match(/₹[\d,]+/g) ?? []).every((shown) => [accessPass, ...soldProducts].some((item) => shown === rupees(item.price))));
fails(`the tier list is not ${soldProducts.length} products plus free`, count(visitor, /class="home-tier[ "]/g) !== soldProducts.length + 1);

/* The day-one card is the plan's own answer for day 1. */
const firstDay = taskForDay(1);
fails("the plan card is not day 1 of the plan", !visitor.includes(`DAY 1 OF ${planDays}`));
for (const problem of firstDay.rows.slice(0, 4)) fails(`day-1 row "${problem.title}" is missing`, !visitor.includes(problem.title));
fails(`the tonight count is not expectedByDay(1) = ${expectedByDay(1)}`, !visitor.includes(`${expectedByDay(1)} done by tonight`));

/* The mentor block quotes the résumé module, not a second copy of it. */
fails("the mentor's name is missing", !visitor.includes(mentorProfile.name));
fails("the mentor's own numbers are missing", !mentorProfile.stats.every((stat) => visitor.includes(stat.value)));
fails("the mentor's stack line is missing", !visitor.includes(mentorProfile.stack[0]));

/* Signed-out gets the Clerk button; signed-in gets straight to the sheet. */
fails("a signed-out visitor does not get the sign-in button", !visitor.includes("SIGN_IN_SLOT"));
fails("a signed-in student still sees the sign-in button", student.includes("SIGN_IN_SLOT"));
fails("a signed-in student does not get the open-the-sheet button", !student.includes("Open the sheet"));

/* Nothing from a missing prop or an empty array leaks into the copy. */
const leakContext = (leak) => [visitor, student].map((html) => {
  const index = html.indexOf(leak);
  return index < 0 ? "" : JSON.stringify(html.slice(Math.max(0, index - 160), index + 60));
}).find(Boolean);
for (const leak of ["undefined", "NaN", "[object Object]", "Infinity"]) {
  const where = leakContext(leak);
  fails(`the markup leaked "${leak}" -> …${where}…`, Boolean(where));
}

/* Every selector the GSAP effect asks for is markup the component renders. */
const body = appSource.slice(appSource.indexOf("export function HomePage"), appSource.indexOf("\nconst dsaArticles"));
const effect = body.slice(0, body.indexOf("\n  return ("));
for (const selector of new Set([...effect.matchAll(/"\.(home-[a-z0-9 -]+)"/g)].map((match) => match[1].trim()))) {
  const classes = selector.match(/home-[a-z0-9-]+/g) ?? [];
  fails(`the effect animates "${selector}", which the page no longer renders`, !classes.every((name) => visitor.includes(`class="${name}`)));
}

/* home.css has to carry the sections the new markup introduces. */
const styledByHomeCss = ["home-numbers", "home-plan", "home-plan-rows", "home-plan-foot", "home-path-list", "home-path-row", "home-path-foot", "home-link", "home-tier-list", "home-tier", "home-builder", "home-builder-stats", "home-builder-side", "home-builder-project"];
for (const name of styledByHomeCss) fails(`.home-simple .${name} is not styled in home.css`, !homeCss.includes(`.home-simple .${name}`));
fails("the signed-out canvas is not styled", !homeCss.includes(".home-public"));

console.log(`markup: ${visitor.length} chars signed-out · ${student.length} signed-in · ${count(visitor, /<(button|a)[ >]/g)} taps`);
console.log(`derived: ${problems.length} problems · ${patterns.length} patterns · ${roadmapStages.length} stages · ${uiLanguages.length} languages · ${lessonLectures.length} lessons · day 1 = ${firstDay.rows.length} rows`);
console.log(`prices on the page: ${(visitor.match(/₹[\d,]+/g) ?? []).join(" ")}`);
console.log(`gsap selectors: ${new Set([...effect.matchAll(/"\.(home-[a-z0-9 -]+)"/g)].map((m) => m[1])).size}`);
console.log(failures.length ? `FAILURES (${failures.length}):\n` + failures.join("\n") : "no failures");
if (failures.length) process.exitCode = 1;
