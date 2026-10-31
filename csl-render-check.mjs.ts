import "./csl-shim.mjs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CsLabs from "./src/__csl_probe";
import { csTopics } from "./src/cs-labs-kernels";

const g = globalThis;
g.__CSL_T = "cpu-scheduling";
g.__CSL_I = 0;
g.__CSL_A = "fcfs";
g.__CSL_INPUT = undefined;

const origWarn = console.warn;
const origError = console.error;
let failures = 0;

const ok = (label, pass, extra) => {
  if (!pass) failures++;
  console.log((pass ? "ok   " : "FAIL ") + label + (extra === undefined || extra === "" ? "" : "  [" + extra + "]"));
};

function mount(topic, index, algo, input) {
  g.__CSL_T = topic;
  g.__CSL_I = index;
  g.__CSL_A = algo;
  g.__CSL_INPUT = input;
  const noise = [];
  console.warn = (...a) => noise.push(String(a[0]));
  console.error = (...a) => noise.push(String(a[0]));
  let html = "";
  let crash = null;
  try {
    html = renderToStaticMarkup(createElement(CsLabs, { key: topic + "-" + index + "-" + algo, onOpenPass: () => {} }));
  } catch (e) {
    crash = String(e && e.message ? e.message : e);
  }
  console.warn = origWarn;
  console.error = origError;
  return { html, crash, noise: noise.filter((n) => !/useLayoutEffect|server renderer/.test(n)) };
}

const dirty = [/\bNaN\b/, /Infinity/, />undefined[ <]/, /"undefined"/, /\bundefinedpx\b/];

for (const topic of csTopics) {
  const algos = topic.hasAlgorithm ? ["fcfs", "sjf", "srtf", "rr"] : ["fcfs"];
  for (const algo of algos) {
    const r = mount(topic.id, 0, algo);
    ok(topic.id + "/" + algo + " mounts", !r.crash, r.crash || r.html.length + "b");
    if (r.crash) continue;
    ok(topic.id + "/" + algo + " draws the stage", /<svg/.test(r.html));
    ok(topic.id + "/" + algo + " draws the explanation", r.html.includes(topic.title.replace("'", "&#x27;")));
    ok(topic.id + "/" + algo + " no react warnings", r.noise.length === 0, r.noise.slice(0, 1).join("").slice(0, 90));
    const hits = dirty.filter((re) => re.test(r.html));
    ok(topic.id + "/" + algo + " geometry is finite", hits.length === 0, hits.map(String).join(" "));
  }
}

// Every reachable frame of every topic, plus indices past the end that the
// scrubber can land on after the workload changes length.
for (const topic of csTopics) {
  const issues = [];
  let last = 0;
  for (let i = 0; i < 260; i++) {
    const r = mount(topic.id, i, "srtf");
    last = i;
    if (r.crash) { issues.push("#" + i + " crash: " + r.crash.slice(0, 70)); break; }
    if (dirty.some((re) => re.test(r.html))) issues.push("#" + i + " dirty");
    if (r.noise.length) issues.push("#" + i + " warn: " + r.noise[0].slice(0, 60));
  }
  ok(topic.id + " swept " + last + " frames clean", issues.length === 0, issues.slice(0, 3).join(" ~ "));
}

const junk = ["", "x", "P1:0:5,", "5,5,5,5", "alloc=;max=;avail=", "sets=0,ways=0,seq=", "a=b=c", ";;;;", "P1:abc:def"];
for (const topic of csTopics) {
  const issues = [];
  for (const q of junk) {
    const r = mount(topic.id, 3, "fcfs", q);
    if (r.crash) issues.push(JSON.stringify(q) + " -> " + r.crash.slice(0, 60));
  }
  ok(topic.id + " survives " + junk.length + " malformed workloads", issues.length === 0, issues.slice(0, 2).join(" ~ "));
}

console.log(failures ? "\n" + failures + " RENDER CHECKS FAILED" : "\nALL RENDER CHECKS PASSED");
process.exit(failures ? 1 : 0);
