import { renderToStaticMarkup } from "react-dom/server";
import { appendFileSync, writeFileSync } from "node:fs";
import { dsaTopics } from "./src/dsa-labs-kernels";
import type { DsaFrame } from "./src/dsa-labs-kernels";
import { renderDsaFrame } from "./src/DsaLabViews";

writeFileSync("dsa-render.log", "");
const say = (line: string) => appendFileSync("dsa-render.log", `${line}\n`);

const junk = [
  "",
  "arr=",
  "arr=1",
  "arr=1,2,3;target=0",
  "arr=-5,-1,7",
  "arr=999999,1,1,1,1,1,1,1,1,1",
  "list=1",
  "list=1,2,3;entry=none",
  "list=1,2,3;entry=9",
  "keys=1,2,3",
  "keys=;size=3",
  "edges=A-B;start=A",
  "edges=;start=A",
  "seq=()[]",
  "seq=(((",
  "expr=5",
  "a=abc;b=abc",
  "words=a",
  "n=0",
  "n=9",
  "intervals=1:2",
  "ops=push:1;pop;pop;pop",
  "items=1:1;cap=0",
  "coins=1;amount=0",
  "prefix=1,2,3;queries=0:0,9:9",
];

const kindClass: Record<string, string> = {
  bars: "lab-bar",
  chain: "lab-node",
  dsatree: "lab-tnode",
  graph: "lab-gnode",
  grid: "lab-grid",
  board: "lab-sq",
  interval: "lab-ibar",
};

const rows: { label: string; frames: number; chars: number; markup: string; last: DsaFrame | undefined }[] = [];
const problems: string[] = [];

const audit = (label: string, frames: DsaFrame[]) => {
  let chars = 0;
  let markup = "";
  frames.forEach((frame, i) => {
    let html = "";
    try {
      html = renderToStaticMarkup(renderDsaFrame(frame));
    } catch (error) {
      problems.push(`${label} frame ${i} threw ${String(error)}`);
      return;
    }
    chars += html.length;
    if (i === frames.length - 1) markup = html;
    if (/NaN|undefined|\[object Object\]|Infinity/.test(html)) problems.push(`${label} frame ${i} leaked ${/NaN|undefined|\[object Object\]|Infinity/.exec(html)![0]}`);
    if (!kindClass[frame.kind]) problems.push(`${label} frame ${i} unknown kind ${frame.kind}`);
    else if (!html.includes(kindClass[frame.kind]) && frame.kind !== "interval") problems.push(`${label} frame ${i} missing ${kindClass[frame.kind]}`);
    if (html.includes("lab-lane-items") && !html.match(/lab-lane-items[^"]*">([\s\S]*?)<\/div>/)) problems.push(`${label} frame ${i} lane markup empty`);
  });
  rows.push({ label, frames: frames.length, chars, markup, last: frames[frames.length - 1] });
  if (!frames.length) problems.push(`${label} produced no frames`);
};

for (const topic of dsaTopics) {
  const algos = topic.algorithms?.map((option) => option.id) ?? [""];
  for (const algo of algos) {
    audit(`${topic.id}/${algo || "default"}`, topic.run(topic.defaultInput, algo) as DsaFrame[]);
    for (const input of junk) {
      try {
        audit(`${topic.id}/${algo || "default"} junk`, topic.run(input, algo) as DsaFrame[]);
      } catch (error) {
        problems.push(`${topic.id}/${algo} crashed on "${input}": ${String(error)}`);
      }
    }
    say(`ran ${topic.id}/${algo || "default"}`);
  }
}

const byTopic = new Map(rows.filter((row) => !row.label.includes("junk")).map((row) => [row.label, row]));
for (const [label, row] of byTopic) {
  if (row.chars === 0) problems.push(`${label} rendered nothing`);
  if (row.frames < 2) problems.push(`${label} only ${row.frames} frame(s) - nothing to step through`);
  const caption = row.last?.caption ?? "";
  if (caption.length < 8) problems.push(`${label} final caption is "${caption}"`);
}

say(`\n${"=".repeat(60)}`);
say(`${rows.length} renders · ${byTopic.size} topic/algorithm pairs · ${rows.reduce((s, r) => s + r.frames, 0)} frames`);
for (const [label, row] of byTopic) say(`  ${label.padEnd(28)} ${String(row.frames).padStart(3)} frames · ${Math.round(row.chars / 1024)}k html · "${(row.last?.caption ?? "").slice(0, 58)}"`);
if (problems.length) {
  const grouped = new Map<string, number>();
  for (const p of problems) {
    const key = p.replace(/frame \d+/, "frame N").replace(/"[^"]*"/g, '"…"');
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }
  say(`\n${problems.length} PROBLEMS:`);
  for (const [key, count] of grouped) say(`  x${count} · ${key}`);
  process.exitCode = 1;
} else {
  say("\nall green · every frame rendered clean");
}
