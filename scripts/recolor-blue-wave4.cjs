// Wave 4: the legacy purple palette that predates the theme system still leaks
// through un-prefixed rules. Rotate violet/indigo to the blue family.
const fs = require("fs");

function hsl(hex) {
  const v = hex.slice(1);
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return { h: 0, s: 0, l: (max + min) / 2 };
  let h;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  const l = (max + min) / 2;
  return { h: (h + 360) % 360, s: d / (1 - Math.abs(2 * l - 1)), l };
}

function toHex({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return t.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
}

let n = 0;
for (const file of ["styles.css", "redesign.css", "roadmap-board.css", "mentorship.css", "mentees.css", "deva-runner.css", "deva-course.css"]) {
  const path = `src/${file}`;
  const before = fs.readFileSync(path, "utf8");
  const after = before.replace(/#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?(?![0-9a-fA-F])/g, (whole, rgb, alpha) => {
    const { h, s, l } = hsl("#" + rgb);
    if (h < 244 || h > 300 || s < 0.08) return whole;
    n++;
    return "#" + toHex({ h: 214, s: Math.min(1, s * 0.9), l }) + (alpha || "");
  });
  if (before !== after) fs.writeFileSync(path, after);
  console.log(`${file}: ${before === after ? "unchanged" : "violet rotated to blue"}`);
}
console.log("violet hexes converted:", n);
