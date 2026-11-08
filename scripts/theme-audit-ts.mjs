// The stylesheets are not the only place a colour is written: the three.js stages
// pass numeric hex (0x3b82f6), a few components build a CSS string in TS, and the
// payment rails name brand colours that are deliberately NOT the app palette.
// This reports every literal in src/*.ts(x) that the theme transform would still
// move, so a recolour cannot leave one blue island behind.
//   node scripts/theme-audit-ts.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { hexToRgb, rgbToHex, shiftRgb } from "./color-shift.mjs";

const RULE = { from: 196, band: 72, offset: 138, blacken: true };

let total = 0;
for (const file of readdirSync("src").filter((f) => /\.tsx?$/.test(f))) {
  const text = readFileSync(join("src", file), "utf8");
  const hits = [];
  const line = (index) => text.slice(0, index).split("\n").length;
  for (const match of text.matchAll(/(?<![0-9a-zA-Z])#([0-9a-fA-F]{6})[0-9a-fA-F]{2}\b|(?<![0-9a-zA-Z])#([0-9a-fA-F]{6})\b|(?<![0-9a-zA-Z])#([0-9a-fA-F]{3})\b|0x([0-9a-fA-F]{6})\b|rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
    const rgb = match[5] !== undefined
      ? [Number(match[5]), Number(match[6]), Number(match[7])]
      : hexToRgb((match[1] ?? match[2] ?? match[3] ?? match[4]).toLowerCase());
    const token = match[5] !== undefined ? `rgb(${rgb.join(",")})` : `#${rgbToHex(rgb).slice(1)}`;
    const next = shiftRgb(rgb, RULE);
    if (next) hits.push(`${token} -> ${rgbToHex(next)}  @line ${line(match.index)}`);
  }
  if (hits.length) {
    total += hits.length;
    console.log(`src/${file}`);
    for (const hit of hits) console.log(`   ${hit}`);
  }
}
console.log(`\nblue literals left in src/*.ts(x): ${total}`);
