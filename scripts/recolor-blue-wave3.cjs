// Wave 3: the few light-mode and rgba() leftovers the hue pass could not see,
// plus the last orange glows around focus rings and the landing hero.
const fs = require("fs");

const edits = {
  "src/redesign.css": [
    ["rgba(255, 132, 46, .25)", "rgba(96, 165, 250, .3)"],
    ["rgba(233,107,24,.2)", "rgba(59,130,246,.28)"],
    ["rgba(233,107,24,.36)", "rgba(96,165,250,.4)"],
    ["rgba(233,107,24,.19)", "rgba(59,130,246,.2)"],
    ["rgba(255,124,43,.17)", "rgba(59,130,246,.2)"],
    ["rgba(255,124,43,.2)", "rgba(59,130,246,.26)"],
    ["rgba(255,153,91,.15)", "rgba(147,197,253,.16)"],
    ["rgba(255,153,91,.025)", "rgba(147,197,253,.03)"],
    ["rgba(255,153,91,.018)", "rgba(147,197,253,.02)"],
    ["rgba(255,135,56,.13)", "rgba(96,165,250,.16)"],
    ["border-bottom: 1px solid #e1e7ef", "border-bottom: 1px solid var(--ui-line)"],
    [".private-pill { border-color: #dce4f1; color: #5870a6; background: #f8faff; font-size: 8px; }",
     ".private-pill { border-color: #2c4058; color: #9dc0f5; background: #16233a; font-size: 8px; }"],
    [".secondary-button { border-color: #dce4ee; color: #43526b; background: #fff; }",
     ".secondary-button { border-color: #2c4058; color: #dbe6f4; background: #172439; }"],
    [".secondary-button:hover { border-color: #bcc9dc; background: #f8faff; }",
     ".secondary-button:hover { border-color: #3d5e91; background: #1b2b44; }"],
    [".home-services { background: #eef2f7; }", ".home-services { background: #0d1524; }"],
    ["border-color: #d8e0f3; color: var(--ui-primary); background: var(--ui-primary-soft);",
     "border-color: #2f5f92; color: #bfdbfe; background: var(--ui-primary-soft);"],
    ["color: #eff2f6; border-color: #2e353f; background: #181c21;",
     "color: #eff2f6; border-color: #2c4058; background: #16233a;"],
  ],
  "src/styles.css": [
    ["rgba(217, 166, 93", "rgba(125, 211, 252"],
  ],
};

for (const [file, pairs] of Object.entries(edits)) {
  let text = fs.readFileSync(file, "utf8");
  for (const [from, to] of pairs) {
    if (!text.includes(from)) { console.log(`!! not found in ${file}: ${from}`); continue; }
    text = text.split(from).join(to);
  }
  fs.writeFileSync(file, text);
  console.log(`${file}: ${pairs.length} targeted edits`);
}
