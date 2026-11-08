// Repo-wide leftover-blue sweep, run as a gate.
//
// The stylesheets are only half the theme: the notify Edge Function builds the
// student's mail as inline HTML, the SQL functions build theirs inside the
// database, and the PPTX generator paints slides. A recolour that stops at
// src/*.css leaves those artefacts blue. This walks everything except build
// output and reports any literal the hue-band transform would still move.
//
// Exit code 1 means there is work left. Colours that are not the app's palette
// are listed in `kept` with the reason they stay, so the sweep cannot quietly
// decide one day that the job board's Stripe purple is a bug.
//   node scripts/theme-audit-repo.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { hexToRgb, rgbToHex, shiftRgb } from "./color-shift.mjs";

const RULE = { from: 196, band: 72, offset: 138, blacken: true };

// public/ is recoloured pixel-wise by scripts/theme-recolor-png.mjs, and every
// dot-prefixed vite --ssr scratch build is output of a run, not a source.
const skipDirs = new Set(["node_modules", "dist", ".git", ".venv", "public"]);
const kept = new Map([
  ["src/App.tsx", "the job board's Stripe and Atlassian brand chips"],
  ["src/CsLabs.tsx", "the lab chart's categorical palette - hues a reader must tell apart"],
  ["src/mentor-mood.ts", "Guru's `think` glow, which separates it from the warm moods"],
  ["supabase/migrations/20261108_email_theme_red.sql", "the retint migration has to name the colours it removes"],
]);
const textFile = /\.(css|html?|tsx?|jsx|mjs|js|sql|md|json|py|java|cpp|c|txt|yml|yaml|svg)$/i;

let left = 0;
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name) || entry.name.includes("ssr")) continue;
    const path = join(dir, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) { walk(path); continue; }
    if (!textFile.test(entry.name)) continue;
    const text = readFileSync(path, "utf8");
    const hits = new Map();
    const record = (token, rgb) => {
      const next = shiftRgb(rgb, RULE);
      if (next) hits.set(token, rgbToHex(next));
    };
    for (const m of text.matchAll(/#([0-9a-fA-F]{6})\b/g)) record(`#${m[1].toLowerCase()}`, hexToRgb(m[1]));
    for (const m of text.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
      record(`rgb(${m[1]},${m[2]},${m[3]})`, [Number(m[1]), Number(m[2]), Number(m[3])]);
    }
    const reason = [...kept].find(([where]) => path.endsWith(where))?.[1];
    for (const [token, next] of hits) {
      if (reason) console.log(`kept     ${path}: ${token} -> ${next} (${reason})`);
      else { left += 1; console.log(`LEFTOVER ${path}: ${token} -> ${next}`); }
    }
  }
};
walk(".");
console.log(left ? `\n${left} literals still to recolour` : "\nno unexpected blue left in the repository");
process.exit(left ? 1 : 0);
