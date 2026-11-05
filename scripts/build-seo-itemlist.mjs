// Rewrites the ItemList JSON-LD in index.html from the real sheet, so the schema
// Google reads lists the same 250 problems the page renders - same titles, same
// patterns, same difficulties, same #slug anchors the rows actually carry.
//
//   node scripts/build-seo-itemlist.mjs
//
// Run it after scripts/build-dsa-sheet.mjs. The script parses every JSON-LD block in
// the file when it is done, so a broken quote can never ship.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sheet = await import(pathToFileURL(path.join(repo, "src", "dsaSheet.ts")).href);
const file = path.join(repo, "index.html");
const html = fs.readFileSync(file, "utf8");

const anchor = '"@id": "https://www.codexsheet.in/problems#dsa-sheet-problems"';
const start = html.indexOf(anchor);
const listStart = html.indexOf('"itemListElement": [', start);
const listEnd = html.indexOf("\n            ]", listStart);
if (start < 0 || listStart < start || listEnd < listStart) throw new Error("the sheet ItemList block is not in index.html");

const rows = sheet.problems.map((problem, index) =>
  `              { "@type": "ListItem", "position": ${index + 1}, "item": { "@type": "LearningResource", "name": ${JSON.stringify(problem.title)}, "url": "https://www.codexsheet.in/problems#${problem.slug}", "learningResourceType": ${JSON.stringify(problem.pattern)}, "teaches": ${JSON.stringify(`${problem.pattern} - ${problem.difficulty}`)}, "difficulty": "${problem.difficulty}", "provider": { "@id": "https://www.codexsheet.in/#organization" } } }`,
);

const head = html.slice(0, listStart);
const replaced = head.replace(/"numberOfItems": \d+/, `"numberOfItems": ${sheet.problems.length}`);
if (!replaced.includes(`"numberOfItems": ${sheet.problems.length}`)) throw new Error("numberOfItems was not found next to the ItemList");
const next = `${replaced}"itemListElement": [\n${rows.join(",\n")}${html.slice(listEnd)}`;
fs.writeFileSync(file, next, "utf8");

const blocks = [...next.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
if (!blocks.length) throw new Error("no JSON-LD blocks survived the rewrite");
let itemList = null;
for (const [, body] of blocks) {
  const parsed = JSON.parse(body);
  const nodes = [parsed, ...(Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [])];
  const found = nodes.flat(Infinity).find((node) => node?.["@id"]?.endsWith("#dsa-sheet-problems"));
  if (found) itemList = found;
}
if (!itemList) throw new Error("the sheet ItemList is not parseable JSON any more");
const titles = new Set(itemList.itemListElement.map((entry) => entry.item.name));
if (itemList.numberOfItems !== sheet.problems.length || itemList.itemListElement.length !== sheet.problems.length)
  throw new Error(`ItemList says ${itemList.numberOfItems}/${itemList.itemListElement.length}, sheet has ${sheet.problems.length}`);
if (titles.size !== sheet.problems.length) throw new Error("the ItemList has duplicate titles");
console.log(`${itemList.itemListElement.length} problems in the JSON-LD ItemList · ${blocks.length} JSON-LD blocks all parse`);
