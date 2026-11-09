// Removes the stylesheet rules for markup the new home page no longer renders.
//
// The old home was six sections and the new one is three, so 45 .home-* classes
// have nothing to attach to. Rules are matched by selector, not by line, because
// dead classes sit in lists with live ones: `.home-services` shares an :is(...)
// with .articles-hero, and dropping the whole rule would restyle another page.
//
//   node scripts/home-css-strip.mjs          # report only
//   node scripts/home-css-strip.mjs --apply  # write
import { readFileSync, writeFileSync } from "node:fs";

const DEAD = new Set([
  "home-creator", "home-creator-copy", "home-creator-link", "home-creator-photo",
  "home-creator-photo-caption", "home-creator-photo-wrap", "home-creator-tags",
  "home-flow", "home-flow-link", "home-flow-node", "home-lab", "home-lab-foot",
  "home-lab-head", "home-lab-scene", "home-mark-orbit", "home-node-index",
  "home-node-title", "home-offer-card", "home-offer-grid", "home-offer-icon",
  "home-offer-label", "home-offer-price", "home-offer-top", "home-pattern-list",
  "home-progress", "home-progress-bar", "home-progress-copy", "home-progress-fill",
  "home-progress-link", "home-progress-stats", "home-proof", "home-roadmap",
  "home-roadmap-foot", "home-services", "home-stage", "home-stage-body",
  "home-stage-count", "home-stage-cta", "home-stage-ghost", "home-stage-index",
  "home-stage-list", "home-stage-patterns", "home-stage-top", "home-stage-weeks",
  "home-success-dot",
]);

// Longest name first, so `.home-stage-list` is never half-matched as `.home-stage`.
const deadNames = [...DEAD].sort((a, b) => b.length - a.length);

/** Split on commas that are not inside parentheses. */
function topLevelParts(selector) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of selector) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) { parts.push(current); current = ""; continue; }
    current += char;
  }
  parts.push(current);
  return parts;
}

/** Drop the dead class from one compound selector, keeping its trailing pseudo. */
function cleanPart(part) {
  let text = part;
  for (const name of deadNames) {
    text = text.replace(new RegExp(`\\.${name}(?![\\w-])`, "g"), "");
  }
  // :is(.dead,.live) and :not(.dead,.live) hold their own comma lists.
  return text.replace(/:is\(([^)]*)\)|:not\(([^)]*)\)/g, (all, isList, notList) => {
    const list = (isList ?? notList ?? "").split(",");
    const kept = list.map((item) => cleanPart(item)).filter((item) => item.trim());
    if (!kept.length) return "";
    return `${all.startsWith(":is") ? ":is" : ":not"}(${kept.join(",")})`;
  });
}

const LIVE = /[.\w:*>[\]]/;
const files = ["src/styles.css", "src/redesign.css"];
const apply = process.argv.includes("--apply");
let totalDropped = 0;
let totalTrimmed = 0;

for (const path of files) {
  const lines = readFileSync(path, "utf8").split("\n");
  const out = [];
  let dropped = 0;
  let trimmed = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const brace = line.indexOf("{");
    if (brace === -1 || !line.slice(0, brace).includes(".home-")) { out.push(line); continue; }
    const selector = line.slice(0, brace);
    const parts = topLevelParts(selector).map((part) => ({ before: part, after: cleanPart(part) }));
    const survivors = parts.filter((part) => LIVE.test(part.after.replace(/\s*(?:\{|$)/, "")) && LIVE.test(part.after.trim()));
    if (survivors.length === parts.length && parts.every((part) => part.after === part.before)) { out.push(line); continue; }
    if (!survivors.length) {
      // The whole rule is dead; skip its declarations, however many lines they take.
      let depth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      while (depth > 0 && index + 1 < lines.length) {
        index += 1;
        depth += (lines[index].match(/\{/g) || []).length - (lines[index].match(/\}/g) || []).length;
      }
      dropped += 1;
      continue;
    }
    out.push(`${survivors.map((part) => part.after).join(",")}${line.slice(brace)}`);
    trimmed += 1;
    continue;
  }
  if (apply) writeFileSync(path, out.join("\n"), "utf8");
  const text = out.join("\n");
  const open = (text.match(/\{/g) || []).length;
  const close = (text.match(/\}/g) || []).length;
  if (open !== close) throw new Error(`${path}: braces no longer balance (${open} open, ${close} close) - nothing written`);
  console.log(`${path}: ${dropped} rules dropped, ${trimmed} selector lists trimmed`);
  totalDropped += dropped;
  totalTrimmed += trimmed;
}

console.log(apply ? `wrote ${totalDropped} dropped / ${totalTrimmed} trimmed` : "dry run - pass --apply to write");
