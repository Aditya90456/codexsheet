import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("src/CsLabs.tsx", "utf8");

const swaps = [
  ['const [topicId, setTopicId] = useState<CsTopicId>("cpu-scheduling");',
   "const [topicId, setTopicId] = useState<CsTopicId>(globalThis.__CSL_T);"],
  ["const [index, setIndex] = useState(0);",
   "const [index, setIndex] = useState(globalThis.__CSL_I | 0);"],
  ['const [algorithm, setAlgorithm] = useState<CpuAlgorithmId>("fcfs");',
   "const [algorithm, setAlgorithm] = useState<CpuAlgorithmId>(globalThis.__CSL_A);"],
  ["const [input, setInput] = useState(topic.defaultInput);",
   "const [input, setInput] = useState(globalThis.__CSL_INPUT ?? topic.defaultInput);"],
];

let probe = src;
for (const [from, to] of swaps) {
  if (!probe.includes(from)) {
    console.error("ANCHOR MISSING: " + from.slice(0, 60));
    process.exit(1);
  }
  probe = probe.replace(from, to);
}
probe = probe.replace(/^\s*import "\.\/cslabs\.css";\s*$/m, "");
probe = probe.replace(/export default function CsLabs\(/, "export default function CsLabs(");
writeFileSync("src/__csl_probe.tsx", probe);
console.log("probe written");
