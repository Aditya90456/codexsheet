// Regenerates supabase/seed/dsa_sheet_problems.sql from src/dsaSheet.ts.
// Run `node scripts/seed-dsa-sheet.mjs` after touching the sheet, then apply the
// seed to the linked project. The leaderboard RPCs read the seeded table, so a
// stale seed silently pays out the wrong XP for a problem.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sheet = await import(pathToFileURL(path.join(repo, "src", "dsaSheet.ts")).href);

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;

// The RPCs refuse to rank anyone until the seeded sheet holds 250 rows.
if (sheet.problems.length !== 250) {
  throw new Error(`src/dsaSheet.ts has ${sheet.problems.length} problems; the database rails expect 250`);
}
const rows = sheet.problems.map((problem) =>
  `  (${problem.number}, ${quote(problem.title)}, ${quote(problem.pattern)}, ${quote(problem.difficulty)})`,
);

const sql = `-- Generated from src/dsaSheet.ts by scripts/seed-dsa-sheet.mjs. Do not hand-edit:
-- the app and the database have to agree on which problem number is Easy, Medium or
-- Hard, or a leaderboard XP total stops matching the sheet the student is looking at.
insert into public.dsa_sheet_problems (number, title, pattern, difficulty)
values
${rows.join(",\n")}
on conflict (number) do update
set title = excluded.title, pattern = excluded.pattern, difficulty = excluded.difficulty;
`;

const target = path.join(repo, "supabase", "seed", "dsa_sheet_problems.sql");fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, sql, "utf8");

const tally = sheet.problems.reduce(
  (map, problem) => ({ ...map, [problem.difficulty]: (map[problem.difficulty] ?? 0) + 1 }),
  {},
);
const fullXp = sheet.problems.reduce((total, problem) => total + sheet.sheetXp[problem.difficulty], 0);
console.log(
  `${sheet.problems.length} problems · ${sheet.patterns.length} patterns · ${JSON.stringify(tally)} · ${fullXp} XP for the whole sheet -> ${path.relative(repo, target)}`,
);
