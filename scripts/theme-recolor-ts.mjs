// Recolour the literals that live in TypeScript instead of a stylesheet - the
// three.js stages pass numeric hex (0x3b82f6) and the mentor mood table carries
// CSS strings - with exactly the same rule scripts/theme-recolor.mjs uses on CSS.
//
// Brand colours that are not the app's palette are left alone, so this is run on a
// named file list rather than over all of src/.
//   node scripts/theme-recolor-ts.mjs --files DsaMentorStage.tsx,DevaStage.tsx --blacken
import { readFileSync, writeFileSync } from "node:fs";
import { hexToRgb, rgbToHex, shiftRgb } from "./color-shift.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};
const number = (name, fallback) => {
  const value = Number(arg(name, fallback));
  if (!Number.isFinite(value)) {
    console.error(`--${name} must be a number, got ${arg(name, fallback)}`);
    process.exit(1);
  }
  return value;
};
const from = number("from", 196);
const to = number("to", 334);
const band = number("band", 72);
const blacken = args.includes("--blacken");
const files = arg("files", "").split(",").filter(Boolean);
if (!files.length) {
  console.error("usage: node scripts/theme-recolor-ts.mjs --files A.tsx,B.ts [--blacken]");
  process.exit(1);
}

const rule = { from, band, offset: (to - from + 360) % 360, blacken };

for (const file of files) {
  const path = `src/${file}`;
  const changes = [];
  const note = (before, after) => {
    if (after !== before) changes.push(`${before} -> ${after}`);
    return after;
  };
  const hexPass = (text) => text.replace(
    /(?<![0-9a-zA-Z])#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?\b|(?<![0-9a-zA-Z])#([0-9a-fA-F]{3})\b|0x([0-9a-fA-F]{6})\b/g,
    (token, six, alpha, three, numeric) => {
      const next = shiftRgb(hexToRgb((six ?? three ?? numeric).toLowerCase()), rule);
      if (!next) return token;
      const hex = rgbToHex(next).slice(1);
      return note(token, `${numeric ? "0x" : "#"}${hex}${alpha ?? ""}`);
    },
  );
  const rgbaPass = (text) => text.replace(
    /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*((?:,[^)]*)?)\)/g,
    (token, r, g, b, rest) => {
      const next = shiftRgb([Number(r), Number(g), Number(b)], rule);
      return next ? note(token, `rgba(${next.join(", ")}${rest})`) : token;
    },
  );
  const before = readFileSync(path, "utf8");
  const after = hexPass(rgbaPass(before));
  if (after.includes("NaN")) {
    console.error(`${path}: transform produced NaN - nothing written`);
    process.exit(1);
  }
  if (changes.length) writeFileSync(path, after);
  console.log(`${path}: ${changes.length} recoloured`);
  for (const change of changes) console.log(`   ${change}`);
}
