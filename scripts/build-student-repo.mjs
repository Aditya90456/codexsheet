// Builds the git repository students clone: the 250-problem sheet, one folder per
// problem, with the same starter code the Deva editor gives them.
//   npx vite build --ssr scripts/build-student-repo.mjs --outDir .student-repo-ssr
//   node .student-repo-ssr/build-student-repo.js
// The output is student-repo/, a repository of its own - the app repo ignores it,
// because what students clone has to be published on its own.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { problems, sheetTopicFor, topics } from "../src/dsaSheet.ts";
import { fileNames, languages, starterFor } from "../src/deva-starters.ts";
import { gitLogCommand, repoFolder, studentRepoUrl, tierLabels, topicFolder } from "../src/studentRepo.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "student-repo");
const appUrl = "https://codexsheet.in/problems";

// Everything the sheet counts has to be here, or a path on /problems 404s in the clone.
if (problems.length !== 250) throw new Error(`src/dsaSheet.ts has ${problems.length} problems`);

// .git stays so re-running this does not throw away the commit history.
rmSync(join(out, "problems"), { recursive: true, force: true });
mkdirSync(join(out, "problems"), { recursive: true });

let files = 0;
const write = (path, text) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
  files += 1;
};

const levelOf = (problem) => problem.difficulty.toUpperCase();
const linkOf = (problem) => `[${problem.title}](${problem.link})`;

for (const problem of problems) {
  const folder = join(out, repoFolder(problem));
  const free = problem.freeLink ? ` · [${problem.title} without a paid plan](${problem.freeLink})` : "";
  write(join(folder, "README.md"), `# ${String(problem.number).padStart(3, "0")}. ${problem.title}

| | |
| --- | --- |
| **Level** | ${levelOf(problem)} |
| **Pattern** | ${problem.pattern} - see the film at [codexsheet.in/patterns](https://codexsheet.in/patterns) |
| **Topic** | ${problem.topic} |
| **Week** | ${problem.week} of the twelve-week plan |
| **Interview tier** | ${tierLabels[problem.tier]} |
| **The problem** | [LeetCode ${problem.title}](${problem.link})${free} |
| **Track it** | [Open the sheet](https://codexsheet.in/problems) |

## Solve it

Pick one file and edit it - the starter is the same code the Deva editor hands you, so
what you write here also runs there:

${languages.map((language) => `> \`${fileNames[language]}\` - ${language}`).join("\n")}

Python, Java and C++ read the judged input from stdin, one argument per line, and print
the answer separated by single spaces. JavaScript exports \`solution(data)\` and is judged
by calling it.

## Commit it

\`\`\`bash
git add ${repoFolder(problem)}
git commit -m "${String(problem.number).padStart(3, "0")}: ${problem.title}"
\`\`\`
`);
  for (const language of languages) {
    write(join(folder, fileNames[language]), `${starterFor(language, problem)}\n`);
  }
}

const indexSections = topics.map((topic) => {
  const rows = problems.filter((problem) => sheetTopicFor(problem.pattern) === topic);
  return [`### ${topic} — \`problems/${topicFolder(topic)}/\``, "",
    "| # | Problem | Level | Pattern | Week |", "| --- | --- | --- | --- | --- |",
    ...rows.map((problem) => `| ${problem.number} | ${linkOf(problem)} | ${problem.difficulty} | ${problem.pattern} | ${problem.week} |`),
  ].join("\n");
});

const counts = { Easy: 0, Medium: 0, Hard: 0 };
for (const problem of problems) counts[problem.difficulty] += 1;

write(join(out, "README.md"), `# CodexSheet 250

The [CodexSheet](https://codexsheet.in) DSA sheet as a repository: 250 real LeetCode
questions, grouped the three ways the sheet groups them, each with starter code you can
run offline and commit as you go.

\`\`\`bash
git clone ${studentRepoUrl}.git
cd codexsheet-250
\`\`\`

${problems.length} problems - ${counts.Easy} Easy, ${counts.Medium} Medium, ${counts.Hard} Hard.
Titles, slugs and difficulty levels are read from LeetCode's public problem index, not typed
out by hand, and the folder path of every problem is the path the sheet shows you.

## Layout

\`\`\`
problems/
  ${topicFolder(topics[0])}/
    ${repoFolder(problems[0]).split("/").pop()}/
      README.md      the brief: level, pattern, week, tier and links
      solution.py    Python starter, reads stdin
      solution.js    JavaScript starter, solution(data)
      Main.java      Java starter, reads stdin
      solution.cpp   C++ starter, reads stdin
\`\`\`

## How to use it

1. Open the sheet at [codexsheet.in/problems](${appUrl}) and pick a problem.
2. \`cd\` into its folder, edit the file for your language, run it against the input.
3. Commit with the problem number in front - that prefix is what the site reads:

   \`\`\`bash
   git commit -m "${String(problems[1].number).padStart(3, "0")}: ${problems[1].title}"
   \`\`\`

4. Paste your log into the **Import my commits** box on the sheet:

   \`\`\`bash
   ${gitLogCommand}
   \`\`\`

   Every commit you paste is marked solved there, so the XP, the streak, the
   leaderboard and the certificate all follow the repository. The commit history is
   also your practice log - recruiters read it, and so does Aditya before a 1:1.

Twelve topics, sixteen patterns, twelve weeks: the same problem appears in all three
views on the site, so pick whichever one your brain plans by.

## The index
`
  + indexSections.join("\n\n")
  + `\n\n---\n\nGenerated from \`src/dsaSheet.ts\` by \`scripts/build-student-repo.mjs\`. Send corrections to [adityabakshi1011@gmail.com](mailto:adityabakshi1011@gmail.com).\n`,
);

write(join(out, ".gitignore"), `__pycache__/
*.pyc
.venv/
venv/
node_modules/
*.class
*.o
*.out
*.exe
build/
.idea/
.vscode/
.DS_Store
Thumbs.db
`);

console.log(`student-repo: ${files} files across ${problems.length} problem folders, ${topics.length} topic folders`);
