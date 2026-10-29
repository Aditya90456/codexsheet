// The theme picker is gone, so its rules go with it; the two new header and
// dashboard controls get the same blue shell treatment as the rest.
const fs = require("fs");

const strip = (file, patterns) => {
  let text = fs.readFileSync(file, "utf8");
  for (const p of patterns) {
    const before = text.length;
    text = text.replace(p, "");
    if (text.length === before) console.log(`!! ${file}: pattern not found: ${p}`);
  }
  fs.writeFileSync(file, text);
};

// Whole rules that only ever styled the picker.
strip("src/styles.css", [
  /^\.theme-picker \{[^}]*\}\n/gm,
  /^\.theme-picker select \{[^}]*\}\n/gm,
  /^\.theme-picker select:focus-visible \{[^}]*\}\n/gm,
  /^@media\(max-width:600px\) \{ \.theme-picker[^@]*?\}\n/gm,
  /,\s*:root\[data-theme="blue"\] \.theme-picker/g,
  /:root\[data-theme="blue"\] \.theme-picker select option \{[^}]*\}\n/gm,
]);

strip("src/redesign.css", [
  /^ {2}\.theme-picker \{[^}]*\}\n/gm,
  /^ {2}\.theme-picker select \{[^}]*\}\n/gm,
  /^ {2}\.top-actions \.theme-picker \{[^}]*\}\n/gm,
  /,\.theme-picker/g,
  /,\s*:root\[data-theme="blue"\] \.theme-picker select/g,
  /:root\[data-theme="blue"\] \.app-shell \.theme-picker select option \{[^}]*\}\n/gm,
]);

const appended = `
/* Header AI launcher and the dashboard's secondary tool links. */
.assistant-launcher {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #2c4058;
  border-radius: 9px;
  color: #bfdbfe;
  background: #16233a;
  font: 650 11px/1 "DM Sans", sans-serif;
  letter-spacing: .04em;
  cursor: pointer;
}
.assistant-launcher:hover { border-color: #3d5e91; color: #fff; background: #1c2f4e; }
.dashboard-tool-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 13px;
  border: 1px solid #2c4058;
  border-radius: 10px;
  color: #cddcf0;
  background: #16233a;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.dashboard-tool-link:hover { border-color: #3d5e91; color: #fff; background: #1c2f4e; }
`;
fs.appendFileSync("src/redesign.css", appended);
console.log("appended header/dashboard controls to redesign.css");
