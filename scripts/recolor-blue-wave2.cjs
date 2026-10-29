// Wave 2: rotate every remaining warm hue to the blue family and give dark
// neutrals a navy cast, so the workspace reads as one blue theme instead of
// grey-with-orange. Semantic colors are excluded so "wrong", "solved" and
// "payment due" keep their meaning.
const fs = require("fs");

const keep = new Set([
  "#c2622c", "#d08b2c", "#e8b04b", // payment due / attention tokens
  "#ef9e8d", "#edc3c1", "#ffb0a0", "#d95757", "#e57373", "#ff8080", // errors
]);

const toRgb = (h) => {
  const hex = h.slice(1);
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
};

function rgbToHsl([r, g, b]) {
  const rs = r / 255, gs = g / 255, bs = b / 255;
  const max = Math.max(rs, gs, bs), min = Math.min(rs, gs, bs);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === rs) h = 60 * (((gs - bs) / d) % 6);
  else if (max === gs) h = 60 * ((bs - rs) / d + 2);
  else h = 60 * ((rs - gs) / d + 4);
  return { h: (h + 360) % 360, s, l };
}

function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = [[0, c, x], [0, x, c], [h < 180 ? x : 0, h < 120 ? c : x], [0]][0];
  const table = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  void seg;
  return table.map((v) => Math.round((v + m) * 255));
}

let changes = 0;
function convert(hex) {
  const lower = hex.toLowerCase();
  if (keep.has(lower)) return hex;
  const rgb = toRgb(hex);
  const { h, s, l } = rgbToHsl(rgb);
  const alpha = hex.length > 7 ? hex.slice(7) : "";
  const body = hex.length > 7 ? hex.slice(0, 7) : hex;
  if (h >= 8 && h <= 70 && s >= 0.12) {
    // orange, amber, tan, gold accent -> blue family
    const next = hslToRgb({ h: 214, s: Math.min(1, s * 0.92), l });
    return "#" + next.map((v) => v.toString(16).padStart(2, "0")).join("") + alpha;
  }
  if (s < 0.08 && l > 0.02 && l < 0.42) {
    // near-neutral dark surface -> same lightness, navy cast
    const next = hslToRgb({ h: 216, s: 0.26, l });
    return "#" + next.map((v) => v.toString(16).padStart(2, "0")).join("") + alpha;
  }
  void body;
  return hex;
}

// App.tsx is deliberately skipped: it carries real company brand colours in
// jobListings, which must not be re-tinted.
for (const file of ["src/styles.css", "src/redesign.css", "src/deva-runner.css", "src/deva-course.css", "src/mentorship.css", "src/mentees.css", "src/roadmap-board.css"]) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?(?![0-9a-fA-F])/g, (m) => {
    const out = convert(m);
    if (out !== m) changes++;
    return out;
  });
  if (before !== after) fs.writeFileSync(file, after);
  console.log(`${file}: ${before === after ? "unchanged" : "rewritten"}`);
}
console.log("total color rewrites", changes);
