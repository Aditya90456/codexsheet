// Recolours text files - stylesheets, SVGs, inline styles in components - from one
// hue family to another, colour literal by colour literal.
//
// CodexSheet has no colour tokens: the palette is written as literals all the way
// down (about 2,000 distinct hexes in styles.css), so a theme change has to be a
// transform, not a find-and-replace of the dozen "main" colours. Each literal is
// read as HSL and anything whose hue sits in the source band is rotated by the same
// offset, which keeps the relationships - borders darker than panels, a pale tint
// still a pale tint - and leaves greys, white overlays, greens and ambers alone.
// Hexes with an alpha pair and rgba() glows are rotated the same way.
//
//   node scripts/theme-recolor.mjs --files src/styles.css --from 196 --to 334 [--blacken]
//
// --from is the first hue of the source band and --to the hue it maps to; the offset
// is (to - from) mod 360 and the band is --band degrees wide (72 by default).
// --blacken pulls dark, low-chroma colours toward true black, which is what the
// panels and page background needed to become in the red-on-black theme.
import { readFileSync, writeFileSync } from "node:fs";
import { shiftRgb, rgbToHex, hexToRgb } from "./color-shift.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
const files = arg("files", "").split(",").filter(Boolean);
if (!files.length) {
  console.error("usage: node scripts/theme-recolor.mjs --files a.css,b.css --from 196 --to 334 [--blacken]");
  process.exit(1);
}
const options = {
  from: Number(arg("from", 196)),
  band: Number(arg("band", 72)),
  offset: (((Number(arg("to", 334)) - Number(arg("from", 196))) % 360) + 360) % 360,
  blacken: args.includes("--blacken"),
};

for (const file of files) {
  const stats = { recoloured: 0, untouched: 0 };
  const hex = (match, digits, tail = "") => {
    const next = shiftRgb(hexToRgb(digits), options);
    stats[next ? "recoloured" : "untouched"] += 1;
    return next ? `${rgbToHex(next)}${tail}` : match;
  };
  const out = readFileSync(file, "utf8")
    .replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})\b/g, (match, digits, alpha) => hex(match, digits, alpha))
    .replace(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*((?:,[^)]*)?)\)/g, (match, r, g, b, rest) => {
      const next = shiftRgb([Number(r), Number(g), Number(b)], options);
      stats[next ? "recoloured" : "untouched"] += 1;
      return next ? `rgba(${next.join(",")}${rest})` : match;
    })
    .replace(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g, (match, digits) => hex(match, digits));
  if (out !== readFileSync(file, "utf8")) writeFileSync(file, out);
  console.log(`${file}: ${stats.recoloured} recoloured, ${stats.untouched} left alone`);
}
