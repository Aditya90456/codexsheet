// Audit: is any blue left in the app's own stylesheet, and where is the blue
// that survives in the bundle coming from?
//   node scripts/theme-audit.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { hexToRgb, shiftRgb } from "./color-shift.mjs";

// Same band, offset and blacken the recolour ran with, so a colour that returns
// non-null here is one the transform would still move.
const RULE = { from: 196, band: 72, offset: 138, blacken: true };

const isBlue = (rgb) => shiftRgb(rgb, RULE) !== null;

const scan = (text, label) => {
  const counts = new Map();
  for (const token of text.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) {
    const body = token.slice(1);
    if (![3, 4, 6, 8].includes(body.length)) continue;
    const hex = (body.length <= 4 ? body.slice(0, 3) : body.slice(0, 6)).toLowerCase();
    const rgb = hexToRgb(hex);
    if (isBlue(rgb)) counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  for (const call of text.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\b/g) ?? []) {
    const [r, g, b] = call.match(/\d+/g).map(Number);
    if (isBlue([r, g, b])) counts.set(`rgb(${r},${g},${b})`, (counts.get(`rgb(${r},${g},${b})`) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  console.log(`${label}: ${total} blue literals`);
  for (const [token, n] of [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`   ${token} x${n}`);
  return total;
};

let appTotal = 0;
for (const file of readdirSync("src").filter((f) => f.endsWith(".css"))) {
  appTotal += scan(readFileSync(join("src", file), "utf8"), `src/${file}`);
}
appTotal += scan(readFileSync("index.html", "utf8"), "index.html");

const built = readdirSync(join("dist", "assets")).find((f) => f.endsWith(".css"));
if (built) scan(readFileSync(join("dist", "assets", built), "utf8"), `dist/assets/${built}`);

console.log(`\nin-band blue left in the app's own files: ${appTotal}`);
