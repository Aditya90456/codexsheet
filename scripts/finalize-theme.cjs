// Collapses the shell onto one theme: the alternate palettes are unreachable
// once the picker is gone, so their rules are removed and the surviving
// selector renamed to what it actually is.
const fs = require("fs");

let dropped = 0;
for (const file of ["src/styles.css", "src/redesign.css", "src/mentorship.css", "src/mentees.css", "src/roadmap-board.css"]) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const themes = [...lines[i].matchAll(/data-theme="([a-z]+)"/g)].map((m) => m[1]);
    const isAlternate = themes.length > 0 && themes.every((t) => t === "forest" || t === "light");
    if (!isAlternate) { out.push(lines[i]); continue; }
    // Consume the whole rule, including multi-line bodies, by brace balance.
    let depth = (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
    dropped++;
    while (depth > 0 && i + 1 < lines.length) {
      i++;
      depth += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
    }
  }
  fs.writeFileSync(file, out.join("\n").replace(/data-theme="midnight"/g, 'data-theme="blue"'));
  console.log(`${file}: ${lines.length - out.length} source lines removed (rules: ${out.length ? "" : ""})`);
}
console.log("alternate-theme rules removed:", dropped);
