// One-shot palette migration: the workspace keeps exactly one theme, a deep
// blue dark shell. Charcoal goes navy, orange goes blue, warm greys go cool.
// Ambers used as syntax tokens keep contrast by moving to cyan/sky, not to one flat blue.
const fs = require("fs");

const map = {
  // brand orange family -> blue
  "#e96b18": "#3b82f6", "#ca5410": "#2563eb", "#fff1e6": "#16283f",
  "#ff842e": "#3b82f6", "#ff9b53": "#60a5fa", "#ff8a3b": "#4f8ff7",
  "#ff9a58": "#60a5fa", "#ff9853": "#60a5fa", "#ff8738": "#3b82f6",
  "#ff8c42": "#3b82f6", "#ffa15e": "#7cb3fb", "#ffb780": "#bfdbfe",
  "#ffb47c": "#bfdbfe", "#f5c09b": "#a9c9f5", "#ffc294": "#bfdbfe",
  "#ffa05d": "#93c5fd", "#e88743": "#60a5fa", "#ed985e": "#60a5fa",
  "#bd784d": "#4c7fd0", "#ffbd8b": "#bfdbfe", "#c47743": "#4a7fd4",
  "#9e6039": "#2c5a9c", "#e7a273": "#7cb3fb", "#ffad73": "#93c5fd",
  "#dd7432": "#3b82f6", "#f0782b": "#3b82f6", "#e96d25": "#2f6fd0",
  "#ff8136": "#3b82f6", "#ff8a3d": "#4f8ff7", "#e28c55": "#6f9fe0",
  "#ff8438": "#3b82f6", "#ff9a5a": "#60a5fa", "#ffab77": "#a9c9f5",
  "#ffac78": "#a9c9f5", "#ffad79": "#a9c9f5", "#ffd1b2": "#dbeafe",
  "#f0b08a": "#a9c9f5", "#d4946c": "#7fa8dc", "#f0d4bd": "#bfdbfe",
  "#b95b20": "#34d399",
  // amber accents used as attention tokens -> sky/cyan keep them legible on navy
  "#c99c54": "#67e8f9", "#d19a48": "#7dd3fc", "#d1a55e": "#7dd3fc",
  "#d9a64f": "#67e8f9", "#e4cda0": "#a5f3fc", "#ead8a9": "#a5f3fc",
  "#d7cba8": "#a5f3fc", "#e2b875": "#7dd3fc", "#f0a86a": "#7dd3fc",
  // warm dark neutrals -> navy
  "#11100f": "#0a1220", "#111110": "#0a1220", "#151413": "#0d1524",
  "#191715": "#101b2e", "#171513": "#0e1829", "#1c1a18": "#131f33",
  "#1b1917": "#121d30", "#1b1725": "#131f33", "#141220": "#0c1526",
  "#211d19": "#172439", "#211e1b": "#17243a", "#201c18": "#162236",
  "#1d1915": "#142134", "#1d1b19": "#142030", "#24211e": "#1a2840",
  "#28211b": "#1d2c46", "#211a15": "#15233a", "#2c1e14": "#1b3050",
  "#322318": "#22395e", "#372216": "#1c2f4e", "#302016": "#1a2b48",
  "#392417": "#1d2f4e", "#241a13": "#16263f", "#2b1d14": "#1b2f4d",
  "#2a1c13": "#18283f", "#2b1e15": "#1a2c47", "#3a2113": "#1f3352",
  "#241f14": "#16263f", "#3c3423": "#1e3350", "#21130b": "#0f1e33",
  "#20130b": "#0f1e33", "#161320": "#0d1524", "#100e15": "#0a1220",
  "#171615": "#0e1829", "#191620": "#111d31", "#211b2b": "#14213a",
  "#17141e": "#101c2f",
  // warm borders (mostly orange-tinted) -> steel blue
  "#37312c": "#243449", "#40372f": "#2c4058", "#453b32": "#33496a",
  "#34261e": "#1d2e46", "#342116": "#1d3050", "#3b3128": "#263854",
  "#30271f": "#1f2f48", "#332b25": "#213349", "#3c3026": "#243753",
  "#46372c": "#2a3f5f", "#534033": "#314868", "#443a32": "#2b4060",
  "#443329": "#2b4063", "#45362a": "#2c4264", "#563b27": "#33517a",
  "#644125": "#3a5a8a", "#5b3925": "#35537e", "#693819": "#3d5f92",
  "#75421f": "#3f6497", "#a14d1c": "#3f74bd", "#8a4b25": "#3f6a9e",
  "#9b4e20": "#3f6fa8", "#965021": "#3f70a8", "#8d451b": "#3a679c",
  "#9a4d20": "#3f6fa8", "#a65929": "#456f9e", "#354737": "#22354f",
  "#62402e": "#2a3f5c", "#49352a": "#243852", "#66452f": "#2c4360",
  "#493426": "#25395a", "#995b35": "#4a76a8", "#835234": "#42699a",
  "#a07929": "#4e86b8", "#62583e": "#2f4664", "#665536": "#31496a",
  "#9a896b": "#4d6c90", "#bba99b": "#8ea6c4", "#c4b0a0": "#9bb1cd",
  "#c69b7d": "#8fb0d8", "#33261e": "#1d2e46", "#365676": "#2f5f92",
  // warm light greys / text -> cool
  "#f0ece7": "#e2eaf5", "#eee8e2": "#dbe6f4", "#f5f3f0": "#e8eff9",
  "#f7f4f0": "#eaf1fa", "#f4f0eb": "#e5edf8", "#e6dfd8": "#cfdcee",
  "#c2bbb4": "#a9bad2", "#bdb5ad": "#9fb2cd", "#ada49c": "#93a8c4",
  "#a9a39d": "#8ea4c1", "#b9b4ae": "#98adc9", "#cec7c0": "#b7c7de",
  "#d8cfc6": "#c2d2e8", "#aaa5a0": "#8fa5c2", "#b6aea6": "#93a8c4",
  "#c9c2bb": "#a9bad2", "#c5beb8": "#a4b7d1", "#c0cde0": "#c0cde0",
  "#f8f6f3": "#eaf1fa", "#ede7e1": "#d5e1f1", "#f1edf8": "#e6eefb",
  "#e7e0ef": "#cfdff2", "#aaa1b8": "#9db2cf", "#9d93aa": "#8ea5c3",
  "#92889f": "#879cb9", "#e2e9de": "#dbe7f4",
  // purples used as the accent in mentor surfaces -> blue
  "#c4a7ff": "#7cb3fb", "#7653bd": "#2f6fd0", "#3b3347": "#1c2b45",
  "#40364e": "#243a5a", "#30283b": "#22354f", "#c3d9ff": "#c3d9ff",
};

const files = [
  "src/styles.css", "src/redesign.css", "src/mentorship.css", "src/mentees.css",
  "src/roadmap-board.css", "src/deva-runner.css", "src/deva-course.css",
];

// Longest keys first so a 6-digit hex is never half-matched by a shorter entry.
const keys = Object.keys(map).sort((a, b) => b.length - a.length);

for (const file of files) {
  let text = fs.readFileSync(file, "utf8");
  const before = text;
  let hits = 0;
  for (const from of keys) {
    const pattern = new RegExp(from.replace("#", "#") + "(?![0-9a-fA-F])", "gi");
    text = text.replace(pattern, (m) => { hits++; return map[from.toLowerCase()]; });
  }
  const changed = before !== text;
  if (changed) fs.writeFileSync(file, text);
  console.log(`${file}: ${changed ? "updated" : "unchanged"} (${hits} replacements)`);
}
