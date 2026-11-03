import { readFileSync, writeFileSync } from "node:fs";

const dead = new Set([
  "home-feature-card", "home-feature-description", "home-feature-grid", "home-feature-icon",
  "home-feature-index", "home-feature-link", "home-features", "home-lab-scene", "home-loop",
  "home-loop-grid", "home-loop-number", "home-loop-step", "home-offer-roadmap", "home-portfolio",
  "home-portfolio-art", "home-portfolio-card", "home-portfolio-grid", "home-portfolio-label",
  "home-service-bottom", "home-service-card", "home-service-icon", "home-service-index",
  "home-service-link", "home-service-top", "home-service-type", "home-services-cta",
  "home-services-grid", "home-step-link", "home-three-canvas",
  "portfolio-art-sheet", "portfolio-art-roadmap", "portfolio-art-journal", "portfolio-featured",
]);

/** Split on `sep` only at bracket depth 0 so ":is(.a,.b)" stays one piece. */
function splitTop(text, sep) {
  const out = [];
  let depth = 0, start = 0, quote = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) { if (ch === quote && text[i - 1] !== "\\") quote = ""; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "(" || ch === "[" || ch === "{") depth += 1;
    else if (ch === ")" || ch === "]" || ch === "}") depth -= 1;
    else if (ch === sep && depth === 0) { out.push(text.slice(start, i)); start = i + 1; }
  }
  out.push(text.slice(start));
  return out;
}

// ":not(.gone)" is inert once the class is gone, and blanking it would make the
// selector invalid, so exclusion lists are masked out instead of pruned.
const maskNot = (text) => text.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, (match) => " ".repeat(match.length));
const mentionsDead = (text) => [...maskNot(text).matchAll(/\.([a-zA-Z0-9_-]+)/g)].some(([, name]) => dead.has(name));

/** Prune dead classes from :is()/:where() lists; return null when nothing survives. */
function cleanSelector(selector) {
  let emptied = false;
  const result = selector.replace(/:(is|where)\((?:[^()]|\([^()]*\))*\)/g, (whole) => {
    const fn = whole.slice(1, whole.indexOf("("));
    const inner = whole.slice(whole.indexOf("(") + 1, whole.length - 1);
    if (!mentionsDead(inner)) return whole;
    const kept = splitTop(inner, ",").filter((part) => !mentionsDead(part));
    if (!kept.length) { emptied = true; return whole; }
    return `:${fn}(${kept.join(",")})`;
  });
  if (emptied || mentionsDead(result)) return null;
  return result.trim();
}

/** Split one level of a stylesheet into { head, body, text }; comments and at-statements stay opaque. */
function splitRules(body) {
  const parts = [];
  let i = 0;
  while (i < body.length) {
    if (body.startsWith("/*", i)) {
      const end = body.indexOf("*/", i + 2);
      const stop = end === -1 ? body.length : end + 2;
      parts.push({ text: body.slice(i, stop), head: "", body: null });
      i = stop;
      continue;
    }
    const start = i;
    let brace = -1, semis = -1, depth = 0;
    for (; i < body.length; i += 1) {
      if (body.startsWith("/*", i)) {
        const end = body.indexOf("*/", i + 2);
        i = end === -1 ? body.length : end + 1;
        continue;
      }
      const ch = body[i];
      if (ch === "{") { depth += 1; if (depth === 1 && brace === -1) brace = i; continue; }
      if (ch === "}") { depth -= 1; if (depth === 0) { i += 1; break; } continue; }
      if (ch === ";" && depth === 0) { semis = i; i += 1; break; }
    }
    if (brace !== -1 && (semis === -1 || semis > brace)) {
      parts.push({ text: body.slice(start, i), head: body.slice(start, brace), body: body.slice(brace + 1, i - 1) });
    } else {
      parts.push({ text: body.slice(start, i), head: body.slice(start, i), body: null });
    }
  }
  return parts;
}

function prune(body, report) {
  let out = "";
  for (const part of splitRules(body)) {
    if (part.body === null) { out += part.text; continue; }
    const head = part.head.trim();
    if (/^@(media|supports|layer)/.test(head)) {
      const inner = prune(part.body, report);
      if (!inner.trim()) { report.removed.push(`${head} { <empty> }`); continue; }
      out += `${part.head}{${inner}}`;
      continue;
    }
    if (head.startsWith("@")) { out += part.text; continue; }
    const selectors = splitTop(part.head, ",");
    const kept = [];
    for (const selector of selectors) {
      if (!mentionsDead(selector)) { kept.push(selector); continue; }
      const cleaned = cleanSelector(selector);
      if (cleaned === null) { report.removed.push(selector.trim()); continue; }
      report.trimmed.push(`${selector.trim()}  ->  ${cleaned}`);
      kept.push(cleaned);
    }
    if (!kept.length) continue;
    const rebuilt = kept.join(",");
    out += rebuilt.replace(/\s+/g, " ") === head.replace(/\s+/g, " ") ? part.text : `${rebuilt} {${part.body}}`;
  }
  return out;
}

const report = { removed: [], trimmed: [] };
for (const file of process.argv.slice(2)) {
  const before = readFileSync(file, "utf8");
  const after = prune(before, report);
  writeFileSync(file, after);
  console.log(`${file}: ${before.split("\n").length} -> ${after.split("\n").length} lines`);
}
console.log(`dropped ${report.removed.length} selectors, trimmed ${report.trimmed.length}`);
for (const line of report.trimmed) console.log(`  ~ ${line}`);
