// csl-shim.mjs
var noop = () => {
};
var synth = { getVoices: () => [], onvoiceschanged: null, speaking: false, pending: false, cancel: noop, resume: noop, pause: noop, speak: noop };
var root = { dataset: {}, style: {}, lang: "", setAttribute: noop };
globalThis.window = globalThis.window || globalThis;
globalThis.speechSynthesis = synth;
try {
  Object.defineProperty(globalThis, "navigator", { value: { language: "en-IN" }, configurable: true });
} catch {
}
globalThis.document = { documentElement: root, createElement: () => ({ style: {}, setAttribute: noop }), body: { appendChild: noop } };
globalThis.setTimeout = setTimeout;
globalThis.clearTimeout = clearTimeout;
globalThis.SpeechSynthesisUtterance = function() {
  return { setAttribute: noop };
};
globalThis.window.speechSynthesis = synth;
globalThis.window.setTimeout = setTimeout;
globalThis.window.clearTimeout = clearTimeout;
globalThis.window.addEventListener = noop;
globalThis.window.removeEventListener = noop;
globalThis.window.document = globalThis.document;

// csl-render-check.mjs.ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// src/__csl_probe.tsx
import { useEffect as useEffect2, useMemo, useState as useState2 } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  GitBranch,
  HardDrive,
  Lightbulb,
  Network,
  Pause,
  Play,
  RotateCcw,
  Sigma,
  Sparkles,
  TriangleAlert,
  Volume2,
  VolumeX
} from "lucide-react";

// src/cs-labs-kernels.ts
var cpuAlgorithms = [
  { id: "fcfs", label: "FCFS", note: "First come first served - non-preemptive, convoy effect" },
  { id: "sjf", label: "SJF", note: "Shortest job first - optimal average wait, needs burst length" },
  { id: "srtf", label: "SRTF", note: "Shortest remaining time first - preemptive SJF" },
  { id: "rr", label: "Round robin", note: "Time slicing - response time is what you buy" }
];
function parseProcs(input) {
  const rows = input.split(/[,\n;]+/).map((row) => row.trim()).filter(Boolean);
  return rows.map((row, index) => {
    const parts = row.split(/[\s:]+/).filter(Boolean);
    const named = parts.length >= 3;
    const pid = named ? parts[0] : `P${index + 1}`;
    const arrival = named ? Number(parts[1]) : Number(parts[0]);
    const burst = named ? Number(parts[2]) : Number(parts[1]);
    return { pid, arrival: Number.isFinite(arrival) ? arrival : 0, burst: Number.isFinite(burst) ? burst : 0, remaining: Number.isFinite(burst) ? burst : 0 };
  }).filter((p) => p.burst > 0);
}
function labelList(list) {
  return list.length ? list.join(", ") : "none";
}
function pushBlock(gantt, pid, t) {
  const last = gantt[gantt.length - 1];
  if (last && last.pid === (pid ?? "idle") && last.end === t) {
    last.end = t + 1;
    return;
  }
  gantt.push({ pid: pid ?? "idle", start: t, end: t + 1, idle: pid === null });
}
function runCpu(algorithm, input, quantum = 2) {
  const procs = parseProcs(input);
  if (!procs.length) return [];
  for (const p of procs) {
    p.completion = 0;
    p.served = 0;
  }
  const frames = [];
  const gantt = [];
  const totalBurst = procs.reduce((sum, p) => sum + p.burst, 0);
  const horizon = totalBurst + Math.max(...procs.map((p) => p.arrival)) + 4;
  const queue = procs.slice().sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid));
  const fifo = [];
  let fillIndex = 0;
  let sliceLeft = 0;
  let current2 = null;
  for (let t = 0; t <= horizon; t += 1) {
    const arrived = queue.filter((p) => p.arrival <= t);
    const pending = arrived.filter((p) => p.remaining > 0);
    if (pending.length === 0) {
      if (procs.every((p) => p.remaining <= 0)) break;
      pushBlock(gantt, null, t);
      frames.push({
        kind: "cpu",
        time: t,
        running: null,
        ready: [],
        gantt: gantt.map((b) => ({ ...b })),
        finished: doneRows(procs),
        caption: `t = ${t} \xB7 CPU idle`,
        detail: algorithm === "rr" ? `Nothing has arrived yet or everything is finished; an idle tick is pure lost throughput, which is why the scheduler never blocks holding the CPU.` : `No runnable process at t = ${t}. Idle time is charged to nobody, but it inflates average turnaround for the ones that came later.`
      });
      continue;
    }
    if (algorithm === "rr") {
      while (fillIndex < queue.length && queue[fillIndex].arrival <= t) fifo.push(queue[fillIndex++]);
      if (current2 && current2.remaining <= 0) current2 = null;
      if (!current2) {
        current2 = fifo.shift() ?? null;
        if (current2) sliceLeft = quantum;
      }
    } else if (algorithm === "srtf") {
      current2 = pending.slice().sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival)[0];
    } else if (algorithm === "sjf") {
      if (!current2 || current2.remaining === 0 || !pending.includes(current2)) {
        current2 = pending.slice().sort((a, b) => a.burst - b.burst || a.arrival - b.arrival)[0];
      }
    } else {
      if (!current2 || current2.remaining === 0 || !pending.includes(current2)) {
        current2 = pending.slice().sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid))[0];
      }
    }
    if (!current2) continue;
    const running = current2;
    running.remaining -= 1;
    running.served = (running.served ?? 0) + 1;
    const served = running.served ?? 0;
    const wasPreempted = algorithm === "srtf" || algorithm === "rr" && served % quantum === 1 && running.burst > quantum;
    pushBlock(gantt, running.pid, t);
    if (running.remaining === 0) running.completion = t + 1;
    if (algorithm === "rr") {
      sliceLeft -= 1;
      if (running.remaining > 0 && sliceLeft <= 0) fifo.push(running);
      if (running.remaining === 0 || sliceLeft <= 0) current2 = null;
    }
    const ready = algorithm === "rr" ? [...fifo, ...current2 && current2 !== running && current2.remaining > 0 ? [current2] : []].filter((p) => p !== running && p.remaining > 0).map((p) => p.pid) : pending.filter((p) => p !== running).map((p) => p.pid);
    const choice = algorithm === "srtf" ? `Smallest remaining time wins: ${running.pid} had ${running.remaining + 1} unit${running.remaining + 1 > 1 ? "s" : ""} left.` : algorithm === "sjf" ? `Shortest total burst among the arrived jobs: ${running.pid} needs ${running.burst} units.` : algorithm === "rr" ? `Round robin with quantum q = ${quantum}: ${running.pid} owns slice slot ${quantum - sliceLeft}/${quantum}.` : `FCFS never looks at length: ${running.pid} is simply the earliest arrival still unfinished.`;
    frames.push({
      kind: "cpu",
      time: t + 1,
      running: running.pid,
      ready,
      gantt: gantt.map((b) => ({ ...b })),
      finished: doneRows(procs),
      caption: running.remaining === 0 ? `t = ${t + 1} \xB7 ${running.pid} completes` : wasPreempted ? `t = ${t + 1} \xB7 ${running.pid} runs${algorithm === "rr" ? " (new slice)" : " (pre-empted in)"}` : `t = ${t + 1} \xB7 ${running.pid} runs`,
      detail: running.remaining === 0 ? `${running.pid} finished at ${t + 1}: turnaround ${t + 1 - running.arrival}, waiting ${t + 1 - running.arrival - running.burst}. ${labelList(ready)} are still waiting, so their wait grows by this unit too.` : `${choice} Ready queue: ${labelList(ready)}.`
    });
  }
  if (frames.length && procs.every((p) => p.remaining <= 0)) {
    const end = gantt.length ? gantt[gantt.length - 1].end : 0;
    const rows = doneRows(procs);
    const avg = rows.reduce((sum, r) => sum + r.waiting, 0) / Math.max(1, rows.length);
    frames.push({
      kind: "cpu",
      time: end,
      running: null,
      ready: [],
      gantt: gantt.map((b) => ({ ...b })),
      finished: rows,
      caption: `Schedule complete at t = ${end} \xB7 average wait ${avg.toFixed(2)}`,
      detail: `Every job is off the CPU. Average waiting time is the sum of (turnaround - burst) divided by ${rows.length} processes, and ${algorithm === "sjf" || algorithm === "srtf" ? "shortest-job-first is provably the minimum this workload allows - no other order of these same arrivals can beat it" : "the order chosen here is exactly what the policy promised, which is why the same four jobs give a different average under SJF and SRTF"}. The CPU was busy the whole time, so throughput is saturated and only ordering cost anything.`
    });
  }
  return frames;
}
function doneRows(procs) {
  return procs.filter((p) => p.remaining === 0).map((p) => {
    const completion = p.completion ?? 0;
    const turnaround = completion - p.arrival;
    return { pid: p.pid, arrival: p.arrival, burst: p.burst, completion, turnaround, waiting: turnaround - p.burst };
  });
}
function cpuMetrics(frames) {
  const last = frames[frames.length - 1];
  if (!last || !last.finished.length) return { avgWait: 0, avgTurnaround: 0, cpuUse: 0, count: 0 };
  const avgWait = last.finished.reduce((sum, f) => sum + f.waiting, 0) / last.finished.length;
  const avgTurnaround = last.finished.reduce((sum, f) => sum + f.turnaround, 0) / last.finished.length;
  const span = last.gantt.length ? last.gantt[last.gantt.length - 1].end - last.gantt[0].start : frames.length;
  const busy = last.gantt.filter((b) => !b.idle).reduce((sum, b) => sum + (b.end - b.start), 0);
  return { avgWait, avgTurnaround, cpuUse: span ? busy / span : 0, count: last.finished.length };
}
var intOf = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
function fieldMap(input) {
  const map = /* @__PURE__ */ new Map();
  const pattern = /([a-z][a-z0-9_]*)\s*=\s*([\s\S]*?)(?=[,;\n]+\s*[a-z][a-z0-9_]*\s*=|$)/gi;
  let match = pattern.exec(input);
  while (match) {
    const key = match[1].toLowerCase().replace(/\s/g, "");
    if (!map.has(key)) map.set(key, match[2].trim());
    match = pattern.exec(input);
  }
  return map;
}
var numList = (value) => value.split(/[,\s;]+/).filter(Boolean).map((token) => Number.parseInt(token, 10)).filter((n) => Number.isFinite(n));
function parsePaging(input) {
  const fields = fieldMap(input);
  const pageSize = Math.max(2, intOf(fields.get("pagesize") ?? "16", 16));
  const table = numList(fields.get("table") ?? "3,7,1,5,0,6,2,4");
  const tlbSize = Math.max(1, intOf(fields.get("tlb") ?? "2", 2));
  const addresses = numList(fields.get("addrs") ?? "5,20,100,21,116,5");
  return { pageSize, table, tlbSize, addresses };
}
function bits(value, width) {
  return value.toString(2).padStart(width, "0");
}
function runPaging(input) {
  const config = parsePaging(input);
  const offsetBits = Math.floor(Math.log2(config.pageSize));
  const pageBits = Math.max(1, Math.ceil(Math.log2(Math.max(2, config.table.length))));
  const tlb = [];
  const frames = [];
  let hits = 0;
  let misses = 0;
  config.addresses.forEach((address, index) => {
    const page = Math.floor(address / config.pageSize);
    const offset = address % config.pageSize;
    if (page >= config.table.length) {
      frames.push({
        kind: "paging",
        index,
        address,
        page,
        offset,
        pageBin: bits(page, pageBits),
        offsetBin: bits(offset, offsetBits),
        tlbHit: false,
        walked: false,
        tlb: tlb.map((e) => ({ ...e })),
        table: [...config.table],
        frame: -1,
        physical: -1,
        hits,
        misses,
        caption: `Address ${address} \xB7 page ${page} has no entry`,
        detail: `The page table only has ${config.table.length} entries, so this reference is out of range - a real MMU raises a page fault (or a segmentation fault when the page is unmapped).`
      });
      return;
    }
    const tlbSlot = tlb.findIndex((entry) => entry.page === page);
    const tlbHit = tlbSlot >= 0;
    let frame;
    if (tlbHit) {
      frame = tlb[tlbSlot].frame;
      hits += 1;
      const [entry] = tlb.splice(tlbSlot, 1);
      tlb.push(entry);
    } else {
      frame = config.table[page];
      misses += 1;
      tlb.push({ page, frame });
      while (tlb.length > config.tlbSize) tlb.shift();
    }
    const physical = frame * config.pageSize + offset;
    frames.push({
      kind: "paging",
      index,
      address,
      page,
      offset,
      pageBin: bits(page, pageBits),
      offsetBin: bits(offset, offsetBits),
      tlbHit,
      walked: !tlbHit,
      tlb: tlb.map((e) => ({ ...e })),
      table: [...config.table],
      frame,
      physical,
      hits,
      misses,
      caption: `Address ${address} \xB7 page ${page} offset ${offset} -> frame ${frame} -> physical ${physical}`,
      detail: tlbHit ? `TLB hit on page ${page}: ${hits} hits so far, and one memory access instead of two. Cached translations are the whole reason virtual memory is affordable - ${Math.round(hits / (hits + misses) * 100)}% hit rate at ${config.addresses.length} references.` : `TLB miss on page ${page}: the hardware walks the page table entry (frame ${frame}), which doubles the access cost, then installs the pair in the ${config.tlbSize}-entry TLB and evicts ${config.tlbSize < tlb.length + 1 ? "the least recently used" : "nothing"}.`
    });
  });
  return frames;
}
function parseBanker(input) {
  const fields = fieldMap(input);
  const rows = (value) => value.split(/[;\s,]+/).filter(Boolean).map((row) => row.split("").filter((c) => /\d/.test(c)).map(Number));
  const allocation = rows(fields.get("alloc") ?? "010 200 302 211 002");
  const max = rows(fields.get("max") ?? "753 322 902 222 433");
  const available = (fields.get("avail") ?? "332").split("").filter((c) => /\d/.test(c)).map(Number);
  const processes = (fields.get("procs") ?? allocation.map((_, i) => `P${i}`).join(" ")).split(/[ ,]+/).filter(Boolean);
  const resources = (fields.get("res") ?? "ABC").split("").filter(Boolean);
  const requests = (fields.get("req") ?? "P1:102,P0:020,P4:330").split(/[,\n]+/).filter(Boolean).map((token) => {
    const [pid = "", digits = ""] = token.split(":");
    return { pid: pid.trim(), need: digits.split("").filter((c) => /\d/.test(c)).map(Number) };
  });
  return { processes, resources, allocation, max, available, requests };
}
function runBanker(input) {
  const config = parseBanker(input);
  const need = config.allocation.map((row, i) => row.map((value, r) => config.max[i][r] - value));
  const frames = [];
  let available = [...config.available];
  let allocation = config.allocation.map((row) => [...row]);
  let needMatrix = need.map((row) => [...row]);
  const base = () => ({
    processes: config.processes,
    resources: config.resources,
    allocation: allocation.map((row) => [...row]),
    need: needMatrix.map((row) => [...row]),
    available: [...available]
  });
  frames.push({
    kind: "banker",
    ...base(),
    work: [...available],
    finish: config.processes.map(() => false),
    sequence: [],
    examining: null,
    requested: null,
    phase: "trial",
    granted: null,
    caption: "Start \xB7 NEED = MAX - ALLOCATION",
    detail: `Available = (${available.join(", ")}) across (${config.resources.join(", ")}). Each process declares its worst case in MAX, so the most it can still ask for is NEED = MAX - ALLOCATION. Every decision below is made against those two matrices only.`
  });
  for (const request of config.requests) {
    const pidIndex = config.processes.indexOf(request.pid);
    if (pidIndex < 0) continue;
    const exceeds = request.need.some((value, r) => value > needMatrix[pidIndex][r]);
    const unavailable = request.need.some((value, r) => value > available[r]);
    frames.push({
      kind: "banker",
      ...base(),
      work: [...available],
      finish: config.processes.map(() => false),
      sequence: [],
      examining: request.pid,
      requested: request.need,
      phase: "request",
      granted: null,
      caption: `${request.pid} requests (${request.need.join(", ")})`,
      detail: exceeds ? `Rejected immediately: (${request.need.join(", ")}) is more than ${request.pid}'s remaining NEED (${needMatrix[pidIndex].join(", ")}), so the request itself is illegal - the process exceeded its declared maximum.` : unavailable ? `${request.pid} stays blocked: the system does not physically hold (${request.need.join(", ")}) right now, available is only (${available.join(", ")}). It waits without pretending to have been granted.` : `Request is within NEED and within AVAILABLE, so the bank can consider it - but only if the state after pretending to grant it is still safe.`
    });
    if (exceeds || unavailable) continue;
    const trialAvailable = available.map((value, r) => value - request.need[r]);
    const trialAllocation = allocation.map((row, i) => i === pidIndex ? row.map((value, r) => value + request.need[r]) : [...row]);
    const trialNeed = needMatrix.map((row, i) => i === pidIndex ? row.map((value, r) => value - request.need[r]) : [...row]);
    const finish2 = config.processes.map(() => false);
    const sequence = [];
    let work = [...trialAvailable];
    for (let pass = 0; pass < config.processes.length; pass += 1) {
      let progressed = false;
      for (let i = 0; i < config.processes.length; i += 1) {
        if (finish2[i]) continue;
        const fits = trialNeed[i].every((value, r) => value <= work[r]);
        frames.push({
          kind: "banker",
          processes: config.processes,
          resources: config.resources,
          allocation: trialAllocation.map((row) => [...row]),
          need: trialNeed.map((row) => [...row]),
          available: [...trialAvailable],
          work: [...work],
          finish: [...finish2],
          sequence: [...sequence],
          examining: config.processes[i],
          requested: request.need,
          phase: "trial",
          granted: null,
          caption: `Safety check \xB7 can ${config.processes[i]} finish with work = (${work.join(", ")})?`,
          detail: fits ? `NEED (${trialNeed[i].join(", ")}) <= work (${work.join(", ")}), so ${config.processes[i]} can run to completion on the hypothetical grant and then release its whole allocation (${trialAllocation[i].join(", ")}). Work grows to (${work.map((value, r) => value + trialAllocation[i][r]).join(", ")}).` : `NEED (${trialNeed[i].join(", ")}) is not <= work (${work.join(", ")}) yet, so ${config.processes[i]} must wait behind somebody who can already finish.`
        });
        if (!fits) continue;
        finish2[i] = true;
        sequence.push(config.processes[i]);
        work = work.map((value, r) => value + trialAllocation[i][r]);
        progressed = true;
      }
      if (!progressed) break;
    }
    const safe = finish2.every(Boolean);
    frames.push({
      kind: "banker",
      ...base(),
      work: [...work],
      finish: [...finish2],
      sequence,
      examining: null,
      requested: request.need,
      phase: "verdict",
      granted: safe,
      caption: safe ? `GRANTED \xB7 safe sequence <${sequence.join(", ")}>` : `DENIED \xB7 no safe sequence exists, request rolled back`,
      detail: safe ? `Granting (${request.need.join(", ")}) to ${request.pid} leaves at least one order in which every process can still finish, so the bank grants it: AVAILABLE becomes (${trialAvailable.join(", ")}). Safe does not mean nothing waits - it means a deadlock is provably avoidable from here.` : `Every order leaves at least one process whose NEED exceeds the work it could ever reclaim, so granting this request would enter an unsafe state. Unsafe is not deadlock, but it is where deadlock becomes possible - so the request is denied and nothing changes.`
    });
    if (safe) {
      available = trialAvailable;
      allocation = trialAllocation;
      needMatrix = trialNeed;
    }
  }
  return frames;
}
var BPLUS_ORDER = 4;
function runBplus(input) {
  const keys = input.split(/[,\s]+/).map((token) => Number.parseInt(token, 10)).filter(Number.isFinite);
  const maxLeaf = BPLUS_ORDER - 1;
  const maxInternal = BPLUS_ORDER - 1;
  let nextId = 0;
  const nodes = /* @__PURE__ */ new Map();
  const rootLeaf = { id: nextId++, leaf: true, keys: [], children: [] };
  nodes.set(rootLeaf.id, rootLeaf);
  let rootId = rootLeaf.id;
  const frames = [];
  const snapshot = () => [...nodes.values()].map((node) => ({ id: node.id, leaf: node.leaf, keys: [...node.keys], children: [...node.children] }));
  const emit = (step2, inserted, touched, action, split, caption, detail) => {
    frames.push({ kind: "tree", step: step2, inserted, keys: keys.slice(0, step2), nodes: snapshot(), root: rootId, touched, split, action, caption, detail });
  };
  const descend = (node, key) => {
    let index = node.keys.length;
    for (let i = 0; i < node.keys.length; i += 1) {
      if (key < node.keys[i]) {
        index = i;
        break;
      }
    }
    return index;
  };
  let step = 0;
  const insertInto = (node, key, at, path) => {
    if (node.leaf) {
      path.push(node.id);
      emit(
        at,
        key,
        [...path],
        "descend",
        false,
        `Insert ${key} \xB7 routed to leaf [${node.keys.join(", ") || "empty"}]`,
        `Search descends using separators and stops at a leaf; internal nodes are signposts only. ${key} belongs in this leaf because its range covers the key.`
      );
      node.keys.push(key);
      node.keys.sort((a, b) => a - b);
      emit(
        at,
        key,
        [...path],
        "insert",
        node.keys.length > maxLeaf,
        `${key} placed in leaf [${node.keys.join(", ")}]`,
        `Leaves hold the sorted payload plus a row pointer per key in a real engine. This leaf now holds ${node.keys.length} of ${maxLeaf} keys.`
      );
      if (node.keys.length <= maxLeaf) return null;
      const mid2 = Math.ceil(node.keys.length / 2);
      const rightKeys2 = node.keys.splice(mid2);
      const right2 = { id: nextId++, leaf: true, keys: rightKeys2, children: [] };
      nodes.set(right2.id, right2);
      emit(
        at,
        key,
        [...path, right2.id],
        "split",
        true,
        `Leaf overflow \xB7 split into [${node.keys.join(", ")}] and [${rightKeys2.join(", ")}]`,
        `A full leaf splits at the middle and ${rightKeys2[0]} is COPIED up, not moved - leaves must keep a complete index. The left leaf also gains a forward sibling pointer to [${rightKeys2.join(", ")}], which is exactly why a range scan walks sideways instead of climbing back to the root.`
      );
      return { promote: rightKeys2[0], right: right2 };
    }
    const index = descend(node, key);
    const child = nodes.get(node.children[index]) ?? node;
    const split = insertInto(child, key, at, path);
    if (!split) return null;
    node.keys.splice(index, 0, split.promote);
    node.children.splice(index + 1, 0, split.right.id);
    emit(
      at,
      key,
      [...path, node.id],
      "promote",
      node.keys.length > maxInternal,
      `Separator ${split.promote} rises into internal [${node.keys.join(", ")}]`,
      `The parent links the new child and routes ${split.promote} to it. This node now holds ${node.keys.length} separators and ${node.children.length} children, against a limit of ${maxInternal} separators and ${BPLUS_ORDER} children.`
    );
    if (node.keys.length <= maxInternal) return null;
    const mid = Math.ceil(node.keys.length / 2);
    const upKey = node.keys[mid];
    const rightKeys = node.keys.splice(mid + 1);
    node.keys.splice(mid, 1);
    const rightChildren = node.children.splice(mid + 1);
    const right = { id: nextId++, leaf: false, keys: rightKeys, children: rightChildren };
    nodes.set(right.id, right);
    emit(
      at,
      key,
      [...path, right.id],
      "split",
      true,
      `Internal overflow \xB7 ${upKey} moves up, right half [${rightKeys.join(", ")}]`,
      `An internal split MOVES the middle separator up because separators exist only to route. Left keeps [${node.keys.join(", ")}] with ${node.children.length} children, right takes [${rightKeys.join(", ")}] with ${rightChildren.length}.`
    );
    return { promote: upKey, right };
  };
  for (const key of keys) {
    step += 1;
    const split = insertInto(nodes.get(rootId), key, step, []);
    if (!split) continue;
    const newRoot = { id: nextId++, leaf: false, keys: [split.promote], children: [rootId, split.right.id] };
    nodes.set(newRoot.id, newRoot);
    rootId = newRoot.id;
    emit(
      step,
      key,
      [newRoot.id],
      "newroot",
      false,
      `Root split \xB7 new root [${newRoot.keys.join(", ")}], the tree grows one level`,
      `Height is added only at the top, which is what guarantees every leaf stays at the same depth and every lookup costs the same number of page reads.`
    );
  }
  return frames;
}
function parseTcp(input) {
  const fields = fieldMap(input);
  return {
    ssthresh: intOf(fields.get("ssthresh") ?? "16", 16),
    dupAt: intOf(fields.get("dupat") ?? "8", 8),
    timeoutAt: intOf(fields.get("timeoutat") ?? "20", 20),
    rtts: Math.max(4, intOf(fields.get("rtts") ?? "26", 26))
  };
}
function runTcp(input) {
  const config = parseTcp(input);
  const frames = [];
  const points = [];
  let cwnd = 1;
  let ssthresh = config.ssthresh;
  let phase = "slow-start";
  let event = null;
  points.push({ rtt: 0, cwnd });
  frames.push({
    kind: "tcp",
    rtt: 0,
    cwnd,
    ssthresh,
    phase,
    event: null,
    points: [...points],
    caption: "RTT 0 \xB7 the connection opens with one segment in flight",
    detail: `The sender has no measurement of the path yet, so it puts exactly ${cwnd} MSS on the wire and lets the ACKs tell it the truth. ssthresh = ${ssthresh} is the ceiling above which doubling is considered reckless; everything below it is exponential, everything above is cautious.`
  });
  for (let rtt = 1; rtt <= config.rtts; rtt += 1) {
    event = null;
    if (rtt === config.dupAt && cwnd > 3) {
      const before = cwnd;
      ssthresh = Math.max(2, Math.floor(cwnd / 2));
      cwnd = ssthresh + 3;
      phase = "recovery";
      event = "3 duplicate ACKs";
      frames.push({
        kind: "tcp",
        rtt,
        cwnd,
        ssthresh,
        phase,
        event,
        points: [...points, { rtt, cwnd }],
        caption: `RTT ${rtt} \xB7 fast retransmit, cwnd ${before} -> ${ssthresh} (+3)`,
        detail: `Three duplicate ACKs say one segment is missing but the rest kept arriving, so the network is congested but not dead. Reno halves the window to ssthresh = ${ssthresh} and keeps ${cwnd} in flight to honour the outstanding ACKs. Cutting to 1 here would throw away a working path.`
      });
      points.push({ rtt, cwnd });
      continue;
    }
    if (rtt === config.timeoutAt) {
      const before = cwnd;
      ssthresh = Math.max(2, Math.floor(cwnd / 2));
      cwnd = 1;
      phase = "slow-start";
      event = "retransmission timeout";
      frames.push({
        kind: "tcp",
        rtt,
        cwnd,
        ssthresh,
        phase,
        event,
        points: [...points, { rtt, cwnd }],
        caption: `RTT ${rtt} \xB7 timeout, cwnd ${before} -> 1`,
        detail: `No ACK at all means the sender cannot tell whether the network is congested or the segment is simply lost, so it behaves defensively: ssthresh = ${ssthresh} and a restart from one segment. This is the single most expensive congestion event - the RTO timer also doubles each time it misfires.`
      });
      points.push({ rtt, cwnd });
      continue;
    }
    if (cwnd < ssthresh) {
      phase = "slow-start";
      cwnd = Math.min(ssthresh, cwnd * 2);
    } else {
      phase = "congestion-avoidance";
      cwnd = cwnd + 1;
    }
    points.push({ rtt, cwnd });
    frames.push({
      kind: "tcp",
      rtt,
      cwnd,
      ssthresh,
      phase,
      event,
      points: [...points],
      caption: `RTT ${rtt} \xB7 ${phase === "slow-start" ? "slow start" : "congestion avoidance"} \xB7 cwnd = ${cwnd}`,
      detail: phase === "slow-start" ? `Every ACK received in this round releases a new one, so a window of ${cwnd / 2} becomes ${cwnd}: exponential growth, and it stops the moment cwnd reaches ssthresh = ${ssthresh}. Slow start is not slow - it is the fastest safe ramp the sender knows.` : `Above ssthresh = ${ssthresh} one window of ${cwnd} grows by exactly one segment per RTT. That additive increase, plus multiplicative decrease on loss, is what makes TCP converge to fairness: many flows sharing a bottleneck settle on equal windows because each halves at the same signal.`
    });
  }
  return frames;
}
function parseCache(input) {
  const fields = fieldMap(input);
  const sets = Math.max(1, intOf(fields.get("sets") ?? "4", 4));
  const ways = Math.max(1, intOf(fields.get("ways") ?? "1", 1));
  const sequence = numList(fields.get("seq") ?? "0,8,16,8,40,4,16,12,1,9");
  return { sets, ways, sequence };
}
function runCache(input) {
  const config = parseCache(input);
  const ways = [];
  for (let s = 0; s < config.sets; s += 1) ways.push(Array.from({ length: config.ways }, () => ({ tag: null, stamp: -1 })));
  const frames = [];
  let hits = 0;
  let misses = 0;
  const trace = [];
  config.sequence.forEach((address, step) => {
    const set = address % config.sets;
    const tag = Math.floor(address / config.sets);
    const bucket = ways[set];
    const hitIndex = bucket.findIndex((entry) => entry.tag === tag);
    const hit = hitIndex >= 0;
    let evicted = null;
    if (hit) {
      hits += 1;
      bucket[hitIndex].stamp = step;
      trace.push(`hit  ${address} -> set ${set}, tag ${tag}`);
    } else {
      misses += 1;
      const victim = bucket.findIndex((entry) => entry.tag === null);
      const lru = bucket.reduce((worst, entry, index) => entry.stamp < bucket[worst].stamp ? index : worst, 0);
      const target = victim >= 0 ? victim : lru;
      evicted = bucket[target].tag;
      if (evicted !== null) trace.push(`miss ${address} -> set ${set}, evicts ${evicted * config.sets + set} (conflict)`);
      else trace.push(`miss ${address} -> set ${set}, cold fill`);
      bucket[target] = { tag, stamp: step };
    }
    frames.push({
      kind: "cache",
      step,
      address,
      tag,
      set,
      ways: ways.map((bucketRows) => bucketRows.map((entry) => ({ ...entry }))),
      hit,
      evicted,
      hits,
      misses,
      trace: [...trace],
      caption: `Access ${address} \xB7 set ${set} \xB7 tag ${tag} \xB7 ${hit ? "HIT" : "MISS"}`,
      detail: hit ? `Tag ${tag} already sits in set ${set}, so the line is reused and the LRU rank of that way moves to the front. Total: ${hits} hits, ${misses} misses.` : evicted !== null ? `Set ${set} is full (${config.ways} way${config.ways > 1 ? "s" : ""}) and tag ${tag} is absent, so ${config.ways === 1 ? "the only way" : "the least recently used way"} is thrown out even though it was still valid - a conflict miss, not a capacity one. This is exactly the thrash a direct-mapped cache cannot avoid when two hot lines share a set.` : `No compulsory conflict yet: way is empty, so tag ${tag} is installed without evicting anything. Still a miss - the block had to come from memory either way.`
    });
  });
  return frames;
}
function cacheSummary(input) {
  const config = parseCache(input);
  const total = Math.max(1, config.sequence.length);
  const rate = (frames) => {
    const last = frames[frames.length - 1];
    return last ? last.hits / total : 0;
  };
  const asConfigured = runCache(input);
  const direct = rate(runCache(`sets=${config.sets},ways=1,seq=${config.sequence.join(",")}`));
  const twoWay = rate(runCache(`sets=${config.sets},ways=2,seq=${config.sequence.join(",")}`));
  const fourWay = rate(runCache(`sets=${config.sets},ways=4,seq=${config.sequence.join(",")}`));
  return { configured: rate(asConfigured), direct, twoWay, fourWay };
}
var csSubjects = [
  { id: "os", label: "Operating systems" },
  { id: "db", label: "Databases" },
  { id: "network", label: "Networks" },
  { id: "arch", label: "Architecture" }
];
var csTopics = [
  {
    id: "cpu-scheduling",
    subject: "os",
    title: "CPU scheduling",
    blurb: "Watch FCFS, SJF, SRTF and round robin run the same workload and compare average wait.",
    inputLabel: "Processes as name:arrival:burst",
    defaultInput: "P1:0:5,P2:1:3,P3:2:8,P4:4:6",
    hasAlgorithm: true,
    run: (input, algorithm = "fcfs") => runCpu(algorithm, input, 2),
    read: {
      concept: "The ready queue is a policy problem, not a data-structure problem. All four algorithms below run the identical workload; only the selection rule changes, and the average waiting time moves by double digits. Interviewers ask this because the same trade-off - fairness against throughput, response time against turnaround - reappears in load balancers, thread pools and Kubernetes scheduling.",
      mechanism: [
        "FCFS dispatches the earliest arrival and never preempts. One long job behind short ones drags everyone: that is the convoy effect, and it makes average wait arrival-order dependent.",
        "SJF picks the smallest total burst among processes that have already arrived. It is provably optimal for average waiting time when burst lengths are known, because moving a short job earlier unblocks more jobs per unit of time.",
        "SRTF re-decides every tick on remaining time, so a long job is pushed aside repeatedly. Same workload, usually lower average wait, and it costs context switches plus starvation of the long job.",
        "Round robin runs each ready process for one quantum then requeues it. Turnaround gets worse as the quantum shrinks toward the context-switch cost, but no process ever waits longer than (n-1) quanta, which is why interactive systems use it."
      ],
      formulas: [
        "Turnaround time = Completion - Arrival",
        "Waiting time = Turnaround - Burst",
        "Response time = first CPU grant - Arrival (round robin sells response, SJF sells turnaround)",
        "Throughput rises as the quantum rises until the quantum is large enough that preemption stops mattering"
      ],
      traps: [
        "Comparing SJF to FCFS without saying burst lengths must be known or predicted (exponential smoothing in real schedulers).",
        "Calling SRTF 'optimal' - SJF is optimal for average wait; SRTF just reaches further with preemption and can starve.",
        "Forgetting idle ticks: an empty ready queue inflates CPU utilisation, not waiting time.",
        "Quantum too small: with a 4 ms context switch and q = 1 ms the CPU spends most of its time switching, so overhead dominates."
      ],
      interview: [
        { q: "Why can SJF be unfair and how do real systems fix it?", a: "A stream of short jobs keeps arriving, so a long job is indefinitely deferred - starvation. Fixing it is ageing: raise a waiting job's priority as a function of its wait, which is what Multilevel Feedback Queue schedulers do implicitly by demoting CPU hogs." },
        { q: "Which scheduler would Linux actually use?", a: "CFS - completely fair scheduling. It has no fixed timeslice: it tracks each task's weighted virtual runtime and always runs the one with the least, so 'fair' is defined against the CPU's proportional share instead of a policy tuned per workload." },
        { q: "A system feels laggy under load and you can change one scheduling parameter. Which?", a: "The round-robin quantum, or priority ageing. Laggy means response time is high, so shrink the quantum and increase preemption of CPU-bound tasks - but stop before context-switch overhead becomes visible in the total CPU time." }
      ]
    }
  },
  {
    id: "paging-tlb",
    subject: "os",
    title: "Paging + TLB",
    blurb: "Break a logical address into page and offset, then hit the TLB or walk the page table.",
    inputLabel: "pagesize, table frames, tlb entries, addresses",
    defaultInput: "pagesize=16,table=3,7,1,5,0,6,2,4,tlb=2,addrs=5,20,100,21,116,5",
    run: (input) => runPaging(input),
    read: {
      concept: "Virtual addresses are a per-process numbering of fixed-size pages; the page table maps page -> physical frame. Without a cache of translations every memory access would cost two - one to read the entry, one to read the data. The TLB is why demand paging is usable at all, and TLB hit rate is the single number that explains why context switching between processes is expensive.",
      mechanism: [
        "Split the address: offset bits = log2(page size), page number = the remaining high bits. Offset is never translated, it is copied straight into the physical address.",
        "Look up the page number in the TLB. A hit yields the frame in one access, and refreshes that entry's LRU rank.",
        "A miss walks the page table, installs (page, frame) in the TLB, and evicts the least recently used entry when it is full.",
        "Physical address = frame * pageSize + offset. An unmapped or out-of-range page raises a page fault and the OS brings the page in from disk - the slow path by three orders of magnitude."
      ],
      formulas: [
        "offset bits = log2(page size), page bits = log2(page table entries)",
        "EAT = hitRate * 1 + (1 - hitRate) * 2 accesses (TLB walk aside, page fault ignored)",
        "Internal fragmentation = (page size - (process size mod page size)) mod page size, worst case one page per process",
        "Physical address = frame * pageSize + offset"
      ],
      traps: [
        "Translating the offset too - it is a straight copy; only the page number is mapped.",
        "Confusing a TLB miss (hardware walk, ~1 extra access) with a page fault (OS involvement, disk I/O, tens of microseconds).",
        "Claiming a bigger page is always better: fewer table entries and a bigger TLB reach, but more internal fragmentation and coarser I/O.",
        "Ignoring ASIDs: without an address-space tag, every context switch would have to flush the whole TLB."
      ],
      interview: [
        { q: "Why is page size a power of two?", a: "So the split is free in hardware: the offset is the low bits, the page number is the rest, and the arithmetic becomes shift and mask instead of divide. Translation happens on every memory access, so it must be wire-delay cheap." },
        { q: "4 KB pages, 48-bit virtual address, how deep is the page table and what fixes it?", a: "48 - 12 = 36 bits of page number, so a flat table would need 2^36 entries. Multilevel page tables only materialise the branches a process actually touches, and inverted page tables (one entry per physical frame, hashed by address space) trade per-process memory for a lookup hash." },
        { q: "A process thrashes. What do you look at first?", a: "TLB reach and working set. If the hot set exceeds frames * page size, or the access pattern is a strided jump larger than page size, each access touches a new page. Fixes are bigger pages, better locality, or more memory - not more CPU." }
      ]
    }
  },
  {
    id: "bankers",
    subject: "os",
    title: "Banker's algorithm",
    blurb: "Grant a request only when a safe sequence still exists afterwards.",
    inputLabel: "alloc / max / avail / requests",
    defaultInput: "alloc=010 200 302 211 002;max=753 322 902 222 433;avail=332;req=P1:102,P0:020,P4:330",
    run: (input) => runBanker(input),
    read: {
      concept: "Deadlock avoidance is the optimistic cousin of prevention. The system trusts each process to declare its maximum claim up front, then refuses any grant that could lead to deadlock. The safety algorithm is the interesting part: it is a greedy fixpoint, and the order in which processes can finish is a proof, not a hope.",
      mechanism: [
        "NEED = MAX - ALLOCATION, elementwise. Only NEED and AVAILABLE matter after that.",
        "A request is rejected outright if it exceeds NEED (illegal claim) or exceeds AVAILABLE (nothing to give yet - the process just blocks).",
        "Otherwise pretend to grant it: AVAILABLE -= request, ALLOCATION += request, NEED -= request.",
        "Run the safety scan: repeatedly find a not-yet-finished process whose NEED <= WORK, mark it finished, and add its whole ALLOCATION to WORK. If every process finishes, the state is safe and there is a sequence.",
        "Grant only if safe; otherwise roll the pretend-grant back completely."
      ],
      formulas: [
        "NEED[i][r] = MAX[i][r] - ALLOCATION[i][r]",
        "Safety scan cost = O(processes^2 * resources)",
        "Safe => deadlock-free. Unsafe =/= deadlock: it means the system can no longer guarantee escape.",
        "Four Coffman conditions: mutual exclusion, hold-and-wait, no preemption, circular wait - avoidance only attacks hold-and-wait."
      ],
      traps: [
        "Saying unsafe means deadlocked. It does not - no cycle exists yet; the guarantee is simply gone.",
        "Forgetting the rollback: a denied request must leave all three matrices untouched.",
        "Not knowing why real operating systems never implement it: maximum claims are unknowable, the process count makes it expensive per request, and blocking a grant reduces utilisation. No OS can promise a worst case it hasn't measured.",
        "Confusing it with deadlock detection, which grants freely and then breaks cycles by killing or preempting."
      ],
      interview: [
        { q: "What does the work vector actually represent?", a: "Resources reclaimable in the hypothetical future where the processes already marked FINISH run to completion and release everything they hold, including what they would still need to request. It is a promise, not a current stock." },
        { q: "Two safe sequences exist - does the OS commit to one?", a: "No. Safety only proves that some order exists. The scheduler is free to run them in any order; the bank only promised the resources would be there when needed, which is why the guarantee survives scheduling nondeterminism." },
        { q: "How is this different from a semaphore or a lock ordering rule?", a: "Lock ordering is deadlock PREVENTION: it structurally forbids circular wait and costs nothing at request time. Banker's is AVOIDANCE: it permits arbitrary ordering but inspects each request, and it needs the maximum claim, which applications rarely know." }
      ]
    }
  },
  {
    id: "bplus-tree",
    subject: "db",
    title: "B+ tree inserts",
    blurb: "Insert keys into an order-4 index and watch leaf splits, separators and the root grow.",
    inputLabel: "Keys to insert",
    defaultInput: "10,20,5,6,12,30,7,17,3,25,40,1",
    run: (input) => runBplus(input),
    read: {
      concept: "Every database index, and every filesystem that needs ordered lookup, is a B+ tree. It is the data structure that optimises for a storage hierarchy instead of for RAM: one node per disk block, so height equals I/Os, and every leaf links to its neighbour so a range scan never climbs back up. Understanding splits is understanding why writes have amortised cost and why the tree stays balanced without rebalancing passes.",
      mechanism: [
        "Descend: at each internal node take the child before the first separator greater than the key. Internal keys are routing separators, not payload.",
        "Insert into the leaf in sorted position. Leaves hold the actual keys (and row pointers or heap TIDs).",
        "On overflow, split the leaf at the middle; the right half's first key is COPIED into the parent so the leaf keeps a complete index.",
        "On internal overflow, split and MOVE the middle separator up to the parent - it exists only to route.",
        "Only a root split adds height, which is why all leaves stay at the same depth and lookups are the same cost."
      ],
      formulas: [
        "fanout = floor(block size / (key size + pointer size))",
        "height = ceil(log_fanout(rows)) - and height is the number of page reads per lookup",
        "A 16 KB block with 8-byte keys and 6-byte row pointers gives a fanout near 1100, so three levels index hundreds of millions of rows",
        "Amortised insert = one leaf write plus a handful of internal page writes that only happen on 1/fanout of inserts"
      ],
      traps: [
        "Saying 'balanced' means perfectly full. It means same-depth leaves and >= half-full nodes, which is why sequential inserts leave nodes lightly populated unless the engine compacts.",
        "Confusing B-tree (keys at every level, stop early) with B+ tree (keys only in leaves, uniform lookup, linked leaves for ranges).",
        "Forgetting the right sibling pointer: without it, ORDER BY ... LIMIT ranges and index-only scans degrade to root-to-leaf hops per row.",
        "Ignoring that the split point depends on insert order; the same set of keys produces different trees, which matters for point-lookup stability under churn."
      ],
      interview: [
        { q: "Why not a hash index?", a: "A hash index gives O(1) equality but cannot answer a range, an ORDER BY, a prefix LIKE, or a NOT EXISTS without scanning, and its buckets have to be re-when-resized. B+ tree pays log n for query flexibility that real workloads need. Most engines keep both." },
        { q: "What makes an index 'covering'?", a: "The index leaf already contains every column the query needs, so the engine reads only index pages and never follows the row pointer to the heap. That converts random I/O into sequential I/O over a much smaller structure." },
        { q: "Why does an UPDATE on an indexed column cost more than on a heap column?", a: "An index key change is a delete plus an insert in a different position, potentially splitting two more pages, plus WAL for each modified page. That is why wide indexes and indexes on frequently updated columns hurt write throughput." }
      ]
    }
  },
  {
    id: "tcp-congestion",
    subject: "network",
    title: "TCP congestion control",
    blurb: "Slow start, congestion avoidance, fast recovery and a timeout on one link.",
    inputLabel: "ssthresh, dupAt, timeoutAt, rtts",
    defaultInput: "ssthresh=16,dupAt=8,timeoutAt=20,rtts=26",
    run: (input) => runTcp(input),
    read: {
      concept: "TCP has no feedback channel about bandwidth. It probes, and it reads loss as the only congestion signal, so its whole design is a control loop: increase additively, decrease multiplicatively, back off exponentially when a timer fires. Every transfer on the internet is this loop, and it is why a shared bottleneck ends up fair without anyone negotiating.",
      mechanism: [
        "Slow start: for each round, every ACK releases a new segment, so the window doubles. It is exponential, not slow - it is the ramp to find available bandwidth fast.",
        "At ssthresh the sender switches to congestion avoidance: +1 maximum segment size per round trip, so growth becomes linear and careful.",
        "Three duplicate ACKs mean one segment is missing but later ones arrived: retransmit immediately, set ssthresh = cwnd / 2, and continue from roughly the new ssthresh. This is fast recovery.",
        "A retransmission timeout means no information at all: ssthresh = cwnd / 2 and cwnd = 1, restarting slow start. This is the expensive event.",
        "RTT keeps rising as the bottleneck queue fills, so bufferbloat is a leading indicator that loss is coming."
      ],
      formulas: [
        "Throughput ~= 1.22 * MSS / (RTT * sqrt(p)) for Reno under loss rate p",
        "Bandwidth-delay product = the number of unacknowledged bytes that fills the pipe",
        "AIMD: additive increase (+1 MSS per RTT) + multiplicative decrease (/2) converges to equal shares",
        "RTO >= SRTT + 4 * RTTVAR, and it doubles on every retransmission (Karn's algorithm excludes retransmitted samples from RTT)"
      ],
      traps: [
        "Saying TCP measures available bandwidth. It does not - it infers capacity from loss and delay; that is why it overshoots buffers.",
        "Confusing the receive window with the congestion window: the sender is limited by min(cwnd, rwnd), and a slow receiver throttles cwnd without any loss.",
        "Calling slow start an algorithm for going slowly, or thinking it is disabled when cwnd starts below ssthresh.",
        "Blaming packet loss for 'bad network' when it can be a corrupted frame on a link with no checksum offload or a policy drop from a firewall."
      ],
      interview: [
        { q: "Why halve on three duplicate ACKs but go to 1 on a timeout?", a: "Duplicate ACKs prove the path still delivers later segments, so congestion is mild and the flow can stay near half the window. A timeout means the sender has no delivery evidence at all, so it must assume collapse - the difference is information, not severity of a single loss." },
        { q: "What is BBR doing differently?", a: "It builds an explicit model of the bottleneck bandwidth and round-trip propagation delay and aims to fill the pipe at bandwidth * RTprop without filling the queue, so it treats queue growth, not loss, as the limit. On lossy long-haul links that is a large win; it also raises fairness questions because it does not back off like AIMD." },
        { q: "One TCP flow is fine but the link still underdelivers. Where else do you look?", a: "Small receive window or window scaling disabled (no scale option means a 64 KB ceiling), buffering at the middlebox, and Nagle plus delayed-ACK interaction adding roughly an extra RTT per request-response pair." }
      ]
    }
  },
  {
    id: "cache-lru",
    subject: "arch",
    title: "Set-associative cache",
    blurb: "Address -> index -> tag, with LRU eviction and conflict misses you can compare across associativity.",
    inputLabel: "sets, ways, access sequence",
    defaultInput: "sets=8,ways=1,seq=0,8,16,8,40,4,16,12,1,9",
    run: (input) => runCache(input),
    read: {
      concept: "The memory hierarchy only works because programs access nearby things repeatedly. A cache keeps copies of blocks, addressed by the low bits (index) and validated by the high bits (tag). Associativity is the knob that decides how many blocks may share a set, and this lab lets you see the exact access pattern where direct mapping thrashes and 2-way does not - that is the whole reason set associativity exists.",
      mechanism: [
        "Split the address into tag, set index and block offset. With block size 1 the offset disappears, so index = address mod sets and tag = address / sets.",
        "Look up the tag in every way of that set in parallel. A match is a hit and refreshes that way's recency.",
        "On a miss with a free way, install the line. With all ways valid, evict the least recently used way.",
        "A miss that evicts a still-valid line because two hot addresses share a set is a conflict miss. Adding ways to that set removes it; adding cache capacity does not."
      ],
      formulas: [
        "AMAT = hit time + miss rate * miss penalty",
        "Capacity = sets * ways * block size; index bits = log2(sets), block offset bits = log2(block size)",
        "LRU distance / stack distance predicts misses for any larger fully associative cache",
        "Compulsory + capacity + conflict = total misses (the 3 Cs)"
      ],
      traps: [
        "Attributing every miss to slowness. First-touch compulsory misses are unavoidable for the working set.",
        "Saying LRU is free: true LRU on n ways needs ordering metadata (tree or counters) and becomes expensive past 4-8 ways, which is why real caches use pseudo-LRU or random replacement.",
        "Ignoring Belady's anomaly: FIFO can miss more with a bigger cache; LRU is stack-distance based so it cannot.",
        "Assuming false sharing is a cache miss problem you can fix by tuning associativity - it is a line-granularity problem, solved by padding.",
        "Forgetting that write-back with dirty lines costs two memory writes on eviction, so hit rate alone does not predict bandwidth."
      ],
      interview: [
        { q: "Why is direct-mapped still used for L1 instruction caches?", a: "One way means one comparison and one possible line to invalidate, so hit latency is a single cycle and the hardware is trivially simple. Instruction streams rarely self-conflict, so the thrash risk is low while the latency win is real." },
        { q: "How would you raise hit rate without adding capacity?", a: "Increase associativity to kill conflict misses, enlarge the block to exploit spatial locality if the stride allows it, pin or colour hot data so it lands in distinct sets, and reduce false sharing with padding." },
        { q: "A cache is 95% hit with a 300-cycle miss penalty. What is effective access time?", a: "0.95 * 1 + 0.05 * 300 = roughly 16 cycles, so the miss penalty dominates even though the hit rate sounds excellent. That arithmetic is why engineers care more about the last few percent than the first." }
      ]
    }
  }
];
function csTopicById(id) {
  return csTopics.find((topic) => topic.id === id) ?? csTopics[0];
}

// src/i18n.ts
import { useEffect, useState } from "react";
var languageInstruction = {
  en: "Answer in simple Indian English. Keep technical names (hash map, two pointers, DP) in English.",
  hi: "\u0906\u0938\u093E\u0928 \u0939\u093F\u0928\u094D\u0926\u0940 \u092E\u0947\u0902 \u091C\u0935\u093E\u092C \u0926\u094B, \u0926\u0947\u0935\u0928\u093E\u0917\u0930\u0940 \u0932\u093F\u092A\u093F \u092E\u0947\u0902\u0964 \u0924\u0915\u0928\u0940\u0915\u0940 \u0928\u093E\u092E (hash map, two pointers, DP, array) \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u093C\u0940 \u092E\u0947\u0902 \u0939\u0940 \u0930\u0916\u094B\u0964",
  bn: "\u09B8\u09B9\u099C \u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09BE\u0993\u0964 \u09AA\u09CD\u09B0\u09AF\u09C1\u0995\u09CD\u09A4\u09BF\u09B0 \u09A8\u09BE\u09AE (hash map, two pointers, DP, array) \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7\u0987 \u09B0\u09BE\u0996\u09CB\u0964",
  ta: "\u0B8E\u0BB3\u0BBF\u0BAF \u0BA4\u0BAE\u0BBF\u0BB4\u0BBF\u0BB2\u0BCD \u0BAA\u0BA4\u0BBF\u0BB2\u0BCD \u0B9A\u0BCA\u0BB2\u0BCD\u0BB2\u0BC1. \u0BA4\u0BCA\u0BB4\u0BBF\u0BB2\u0BCD\u0BA8\u0BC1\u0B9F\u0BCD\u0BAA \u0BAA\u0BC6\u0BAF\u0BB0\u0BCD\u0B95\u0BB3\u0BC8 (hash map, two pointers, DP, array) \u0B86\u0B99\u0BCD\u0B95\u0BBF\u0BB2\u0BA4\u0BCD\u0BA4\u0BBF\u0BB2\u0BC7\u0BAF\u0BC7 \u0BB5\u0BC8.",
  te: "\u0C38\u0C41\u0C32\u0C2D\u0C2E\u0C48\u0C28 \u0C24\u0C46\u0C32\u0C41\u0C17\u0C41\u0C32\u0C4B \u0C38\u0C2E\u0C3E\u0C27\u0C3E\u0C28\u0C02 \u0C1A\u0C46\u0C2A\u0C4D\u0C2A\u0C41. \u0C38\u0C3E\u0C02\u0C15\u0C47\u0C24\u0C3F\u0C15 \u0C2A\u0C47\u0C30\u0C4D\u0C32\u0C28\u0C41 (hash map, two pointers, DP, array) \u0C07\u0C02\u0C17\u0C4D\u0C32\u0C40\u0C37\u0C41\u0C32\u0C4B\u0C28\u0C47 \u0C09\u0C02\u0C1A\u0C41. ",
  mr: "\u0938\u094B\u092A\u094D\u092F\u093E \u092E\u0930\u093E\u0920\u0940\u0924 \u0909\u0924\u094D\u0924\u0930 \u0926\u0947, \u0926\u0947\u0935\u0928\u093E\u0917\u0930\u0940 \u0932\u093F\u092A\u0940\u0924. \u0924\u093E\u0902\u0924\u094D\u0930\u093F\u0915 \u0928\u093E\u0935\u0947 (hash map, two pointers, DP, array) \u0907\u0902\u0917\u094D\u0930\u091C\u0940\u0924\u091A \u0920\u0947\u0935.",
  gu: "\u0AB8\u0AB0\u0AB3 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0\u0AAE\u0ABE\u0A82 \u0A9C\u0AB5\u0ABE\u0AAC \u0A86\u0AAA. \u0AA4\u0A95\u0AA8\u0AC0\u0A95\u0AC0 \u0AA8\u0ABE\u0AAE\u0ACB (hash map, two pointers, DP, array) \u0A85\u0A82\u0A97\u0ACD\u0AB0\u0AC7\u0A9C\u0AC0\u0AAE\u0ABE\u0A82 \u0A9C \u0AB0\u0ABE\u0A96."
};
var languageSpeechName = {
  en: "English (India)",
  hi: "Hindi (India)",
  bn: "Bengali (India)",
  ta: "Tamil (India)",
  te: "Telugu (India)",
  mr: "Marathi (India)",
  gu: "Gujarati (India)"
};
var messages = {
  "lang.label": { en: "Language", hi: "\u092D\u093E\u0937\u093E", bn: "\u09AD\u09BE\u09B7\u09BE", ta: "\u0BAE\u0BCA\u0BB4\u0BBF", te: "\u0C2D\u0C3E\u0C37", mr: "\u092D\u093E\u0937\u093E", gu: "\u0AAD\u0ABE\u0AB7\u0ABE" },
  "nav.home": { en: "Home", hi: "\u0939\u094B\u092E", bn: "\u09B9\u09CB\u09AE", ta: "\u0BAE\u0BC1\u0B95\u0BAA\u0BCD\u0BAA\u0BC1", te: "\u0C39\u0C4B\u0C2E\u0C4D", mr: "\u092E\u0941\u0916\u094D\u092F\u092A\u0943\u0937\u094D\u0920", gu: "\u0AB9\u0ACB\u0AAE" },
  "nav.problems": { en: "Problems", hi: "\u092A\u094D\u0930\u0949\u092C\u094D\u0932\u092E", bn: "\u09AA\u09CD\u09B0\u09AC\u09B2\u09C7\u09AE", ta: "\u0BAA\u0BBF\u0BB0\u0B9A\u0BCD\u0B9A\u0BBF\u0BA9\u0BC8\u0B95\u0BB3\u0BCD", te: "\u0C38\u0C2E\u0C38\u0C4D\u0C2F\u0C32\u0C41", mr: "\u092A\u094D\u0930\u0936\u094D\u0928", gu: "\u0AAA\u0ACD\u0AB0\u0AB6\u0ACD\u0AA8\u0ACB" },
  "nav.deva": { en: "Deva", hi: "\u0926\u0947\u0935\u093E", bn: "\u09A6\u09C7\u09AC\u09BE", ta: "\u0BA4\u0BC7\u0BB5\u0BBE", te: "\u0C26\u0C47\u0C35", mr: "\u0926\u0947\u0935\u093E", gu: "\u0AA6\u0AC7\u0AB5" },
  "nav.course": { en: "DSA Course", hi: "\u0921\u0940\u090F\u0938\u090F \u0915\u094B\u0930\u094D\u0938", bn: "\u09A1\u09BF\u098F\u09B8\u098F \u0995\u09CB\u09B0\u09CD\u09B8", ta: "\u0B9F\u0BBF\u0B8E\u0BB8\u0BCD\u0B8E \u0BAA\u0B9F\u0BBF\u0BAA\u0BCD\u0BAA", te: "\u0C21\u0C40\u0C0E\u0C38\u0C4D\u0C0F \u0C15\u0C4B\u0C30\u0C4D\u0C38\u0C41", mr: "\u0921\u0940\u090F\u0938\u090F \u0905\u092D\u094D\u092F\u093E\u0938\u0915\u094D\u0930\u092E", gu: "\u0AA1\u0AC0\u0A8F\u0AB8\u0A8F \u0A95\u0ACB\u0AB0\u0ACD\u0AB8" },
  "nav.tutor": { en: "Ask Tutor", hi: "\u091F\u0940\u091A\u0930 \u0938\u0947 \u092A\u0942\u091B\u094B", bn: "\u09B6\u09BF\u0995\u09CD\u09B7\u0995\u0995\u09C7 \u099C\u09BF\u099C\u09CD\u099E\u09BE\u09B8\u09BE", ta: "\u0B86\u0B9A\u0BBF\u0BB0\u0BBF\u0BAF\u0BB0\u0BBF\u0B9F\u0BAE\u0BCD \u0B95\u0BC7\u0BB3\u0BCD", te: "\u0C1F\u0C4D\u0C2F\u0C42\u0C1F\u0C30\u0C4D\u200C\u0C28\u0C41 \u0C05\u0C21\u0C17\u0C3F", mr: "\u0936\u093F\u0915\u094D\u0937\u0915\u093E\u0902\u0928\u093E \u0935\u093F\u091A\u093E\u0930\u093E", gu: "\u0A9F\u0ACD\u0AAF\u0AC1\u0A9F\u0AB0\u0AA8\u0AC7 \u0AAA\u0AC2\u0A9B\u0ACB" },
  "nav.guru": { en: "Guru \xB7 free AI teacher", hi: "\u0917\u0941\u0930\u0941 \xB7 \u092E\u0941\u092B\u093C\u094D\u0924 AI \u091F\u0940\u091A\u0930", bn: "\u0997\u09C1\u09B0\u09C1 \xB7 \u09AB\u09CD\u09B0\u09BF AI \u09B6\u09BF\u0995\u09CD\u09B7\u0995", ta: "\u0B95\u0BC1\u0BB0\u0BC1 \xB7 \u0B87\u0BB2\u0BB5\u0B9A AI \u0B86\u0B9A\u0BBF\u0BB0\u0BBF\u0BAF\u0BB0\u0BCD", te: "\u0C17\u0C41\u0C30\u0C41 \xB7 \u0C09\u0C1A\u0C3F\u0C24 AI \u0C09\u0C2A\u0C3E\u0C27\u0C4D\u0C2F\u0C3E\u0C2F\u0C41\u0C21\u0C41", mr: "\u0917\u0941\u0930\u0941 \xB7 \u092E\u094B\u092B\u0924 AI \u0936\u093F\u0915\u094D\u0937\u0915", gu: "\u0A97\u0AC1\u0AB0\u0AC1 \xB7 \u0AAE\u0AAB\u0AA4 AI \u0AB6\u0ABF\u0A95\u0ACD\u0AB7\u0A95" },
  "nav.more": { en: "More", hi: "\u0914\u0930", bn: "\u0986\u09B0\u0993", ta: "\u0BAE\u0BC7\u0BB2\u0BC1\u0BAE\u0BCD", te: "\u0C2E\u0C30\u0C3F\u0C02\u0C24", mr: "\u0905\u0927\u093F\u0915", gu: "\u0AB5\u0AA7\u0AC1" },
  "top.pass": { en: "Pass \u20B910\u2013\u20B9800", hi: "\u092A\u093E\u0938 \u20B910\u2013\u20B9800", bn: "\u09AA\u09BE\u09B8 \u20B910\u2013\u20B9800", ta: "\u0BAA\u0BBE\u0BB8\u0BCD \u20B910\u2013\u20B9800", te: "\u0C2A\u0C3E\u0C38\u0C4D \u20B910\u2013\u20B9800", mr: "\u092A\u093E\u0938 \u20B910\u2013\u20B9800", gu: "\u0AAA\u0ABE\u0AB8 \u20B910\u2013\u20B9800" },
  "home.eyebrow": { en: "YOUR NEXT INTERVIEW STARTS HERE", hi: "\u0906\u092A\u0915\u093E \u0905\u0917\u0932\u093E \u0907\u0902\u091F\u0930\u0935\u094D\u092F\u0942 \u092F\u0939\u0940\u0902 \u0938\u0947 \u0936\u0941\u0930\u0942", bn: "\u09A4\u09CB\u09AE\u09BE\u09B0 \u09AA\u09B0\u09C7\u09B0 \u0987\u09A8\u09CD\u099F\u09BE\u09B0\u09AD\u09BF\u0989 \u098F\u0996\u09BE\u09A8 \u09A5\u09C7\u0995\u09C7", ta: "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B85\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4 \u0BA8\u0BC7\u0BB0\u0BCD\u0B95\u0BBE\u0BA3\u0BB2\u0BCD \u0B87\u0B99\u0BCD\u0B95\u0BC7 \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95\u0BC1\u0B95\u0BBF\u0BB1\u0BA4\u0BC1", te: "\u0C2E\u0C40 \u0C24\u0C26\u0C41\u0C2A\u0C30\u0C3F \u0C07\u0C02\u0C1F\u0C30\u0C4D\u0C35\u0C4D\u0C2F\u0C42 \u0C07\u0C15\u0C4D\u0C15\u0C21\u0C47 \u0C2E\u0C4A\u0C26\u0C32\u0C35\u0C41\u0C24\u0C41\u0C02\u0C26\u0C3F", mr: "\u0924\u0941\u092E\u091A\u093E \u092A\u0941\u0922\u091A\u093E \u0907\u0902\u091F\u0930\u0935\u094D\u092F\u0942 \u0907\u0925\u0942\u0928\u091A", gu: "\u0AA4\u0AAE\u0ABE\u0AB0\u0AC0 \u0A86\u0A97\u0AB2\u0AC0 \u0A88\u0AA8\u0ACD\u0A9F\u0AB0\u0AB5\u0ACD\u0AAF\u0AC2 \u0A85\u0AB9\u0AC0\u0A82\u0AA5\u0AC0 \u0AB6\u0AB0\u0AC2" },
  "home.title1": { en: "DSA interview practice", hi: "\u0921\u0940\u090F\u0938\u090F \u0907\u0902\u091F\u0930\u0935\u094D\u092F\u0942 \u0915\u0940 \u0924\u0948\u092F\u093E\u0930\u0940", bn: "\u09A1\u09BF\u098F\u09B8\u098F \u0987\u09A8\u09CD\u099F\u09BE\u09B0\u09AD\u09BF\u0989 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4\u09BF", ta: "\u0B9F\u0BBF\u0B8E\u0BB8\u0BCD\u0B8E \u0BA8\u0BC7\u0BB0\u0BCD\u0B95\u0BBE\u0BA3\u0BB2\u0BCD \u0BAA\u0BAF\u0BBF\u0BB1\u0BCD\u0B9A\u0BBF", te: "\u0C21\u0C40\u0C0E\u0C38\u0C4D\u0C0F \u0C07\u0C02\u0C1F\u0C30\u0C4D\u0C35\u0C4D\u0C2F\u0C42 \u0C38\u0C28\u0C4D\u0C28\u0C3E\u0C39\u0C02", mr: "\u0921\u0940\u090F\u0938\u090F \u0907\u0902\u091F\u0930\u0935\u094D\u092F\u0942 \u0938\u0930\u093E\u0935", gu: "\u0AA1\u0AC0\u0A8F\u0AB8\u0A8F \u0A88\u0AA8\u0ACD\u0A9F\u0AB0\u0AB5\u0ACD\u0AAF\u0AC2 \u0A85\u0AAD\u0ACD\u0AAF\u0ABE\u0AB8" },
  "home.title2": { en: "with a plan.", hi: "\u090F\u0915 \u092A\u094D\u0932\u093E\u0928 \u0915\u0947 \u0938\u093E\u0925\u0964", bn: "\u098F\u0995\u099F\u09BF \u09AA\u09B0\u09BF\u0995\u09B2\u09CD\u09AA\u09A8\u09BE \u09A8\u09BF\u09AF\u09BC\u09C7\u0964", ta: "\u0B92\u0BB0\u0BC1 \u0BA4\u0BBF\u0B9F\u0BCD\u0B9F\u0BA4\u0BCD\u0BA4\u0BC1\u0B9F\u0BA9\u0BCD.", te: " \u0C12\u0C15 \u0C2A\u0C4D\u0C32\u0C3E\u0C28\u0C4D\u200C\u0C24\u0C4B.", mr: "\u090F\u0915 \u092F\u094B\u091C\u0928\u0947\u0938\u0939.", gu: "\u0A8F\u0A95 \u0AAF\u0ACB\u0A9C\u0AA8\u0ABE \u0AB8\u0ABE\u0AA5\u0AC7." },
  "home.body": {
    en: "Build problem-solving fluency one pattern at a time. Keep your practice, progress, and study group in one focused workspace.",
    hi: "\u090F\u0915-\u090F\u0915 \u092A\u0948\u091F\u0930\u094D\u0928 \u0938\u0940\u0916\u0915\u0930 \u092A\u094D\u0930\u0949\u092C\u094D\u0932\u092E \u0938\u0949\u0932\u094D\u0935\u093F\u0902\u0917 \u092E\u0947\u0902 \u092E\u091C\u093C\u092C\u0942\u0924 \u092C\u0928\u094B\u0964 \u0905\u092A\u0928\u093E \u092A\u094D\u0930\u0948\u0915\u094D\u091F\u093F\u0938, \u092A\u094D\u0930\u094B\u0917\u094D\u0930\u0947\u0938 \u0914\u0930 \u0938\u094D\u091F\u0921\u0940 \u0917\u094D\u0930\u0941\u092A \u090F\u0915 \u091C\u0917\u0939 \u0930\u0916\u094B\u0964",
    bn: "\u098F\u0995\u09AC\u09BE\u09B0\u09C7 \u098F\u0995\u099F\u09BF \u09AA\u09C7\u099F\u09BE\u09B0\u09CD\u09A8 \u09B6\u09BF\u0996\u09C7 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B8\u09AE\u09BE\u09A7\u09BE\u09A8\u09C7 \u09A6\u0995\u09CD\u09B7 \u09B9\u0993\u0964 \u09A4\u09CB\u09AE\u09BE\u09B0 \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8, \u09AA\u09CD\u09B0\u0997\u09CD\u09B0\u09C7\u09B8 \u0986\u09B0 \u09B8\u09CD\u099F\u09BE\u09A1\u09BF \u0997\u09CD\u09B0\u09C1\u09AA \u098F\u0995 \u099C\u09BE\u09AF\u09BC\u0997\u09BE\u09AF\u09BC \u09B0\u09BE\u0996\u09CB\u0964",
    ta: "\u0B92\u0BB0\u0BC1 \u0BA8\u0BC7\u0BB0\u0BA4\u0BCD\u0BA4\u0BBF\u0BB2\u0BCD \u0B92\u0BB0\u0BC1 \u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BB0\u0BCD\u0BA9\u0BCD \u0B95\u0BB1\u0BCD\u0BB1\u0BC1, \u0B9A\u0BBF\u0B95\u0BCD\u0B95\u0BB2\u0BCD \u0BA4\u0BC0\u0BB0\u0BCD\u0BB5\u0BBF\u0BB2\u0BCD \u0BB5\u0BB2\u0BC1\u0BB5\u0BBE\u0B95\u0BC1. \u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BAA\u0BBF\u0BB0\u0BBE\u0B95\u0BCD\u0B9F\u0BBF\u0BB8\u0BCD, \u0BAE\u0BC1\u0BA9\u0BCD\u0BA9\u0BC7\u0BB1\u0BCD\u0BB1\u0BAE\u0BCD, \u0BAA\u0B9F\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1 \u0B95\u0BC1\u0BB4\u0BC1 \u0B92\u0BB0\u0BC7 \u0B87\u0B9F\u0BA4\u0BCD\u0BA4\u0BBF\u0BB2\u0BCD \u0BB5\u0BC8.",
    te: "\u0C12\u0C15\u0C4D\u0C15\u0C4B \u0C2A\u0C3E\u0C1F\u0C30\u0C4D\u0C28\u0C4D \u0C28\u0C47\u0C30\u0C4D\u0C1A\u0C41\u0C15\u0C41\u0C02\u0C1F\u0C42 \u0C38\u0C2E\u0C38\u0C4D\u0C2F \u0C2A\u0C30\u0C3F\u0C37\u0C4D\u0C15\u0C3E\u0C30\u0C02\u0C32\u0C4B \u0C2C\u0C32\u0C2A\u0C21\u0C41. \u0C2E\u0C40 \u0C2A\u0C4D\u0C30\u0C3E\u0C15\u0C4D\u0C1F\u0C40\u0C38\u0C4D, \u0C2A\u0C4D\u0C30\u0C17\u0C24\u0C3F, \u0C38\u0C4D\u0C1F\u0C21\u0C40 \u0C17\u0C4D\u0C30\u0C42\u0C2A\u0C4D \u0C12\u0C15\u0C47 \u0C1A\u0C4B\u0C1F \u0C09\u0C02\u0C1A\u0C41.",
    mr: "\u090F\u0915\u0926\u093E\u0924 \u090F\u0915 \u092A\u0945\u091F\u0930\u094D\u0928 \u0936\u093F\u0915\u0942\u0928 \u092A\u094D\u0930\u0949\u092C\u094D\u0932\u092E-\u0938\u0949\u0932\u094D\u0935\u093F\u0902\u0917 \u092E\u091C\u092C\u0942\u0924 \u092C\u0928. \u0924\u0941\u091D\u093E \u0938\u0930\u093E\u0935, \u092A\u094D\u0930\u0917\u0924\u0940 \u0906\u0923\u093F \u0905\u092D\u094D\u092F\u093E\u0938 \u0917\u091F \u090F\u0915\u093E\u091A \u0920\u093F\u0915\u093E\u0923\u0940 \u0920\u0947\u0935.",
    gu: "\u0A8F\u0A95 \u0AB5\u0A96\u0AA4\u0AC7 \u0A8F\u0A95 \u0AAA\u0AC7\u0A9F\u0AB0\u0ACD\u0AA8 \u0AB6\u0AC0\u0A96\u0AC0\u0AA8\u0AC7 \u0AAA\u0ACD\u0AB0\u0ACB\u0AAC\u0ACD\u0AB2\u0AAE \u0AB8\u0ACB\u0AB2\u0ACD\u0AB5\u0ABF\u0A82\u0A97\u0AAE\u0ABE\u0A82 \u0AAE\u0A9C\u0AAC\u0AC2\u0AA4 \u0AAC\u0AA8\u0ACB. \u0AA4\u0AAE\u0ABE\u0AB0\u0ACB \u0AB8\u0AB0\u0AB3 \u0A85\u0AAD\u0ACD\u0AAF\u0ABE\u0AB8, \u0AAA\u0ACD\u0AB0\u0A97\u0AA4\u0ABF \u0A85\u0AA8\u0AC7 \u0AB8\u0ACD\u0A9F\u0AA1\u0AC0 \u0A97\u0ACD\u0AB0\u0AC1\u0AAA \u0A8F\u0A95 \u0A9C \u0A9C\u0A97\u0ACD\u0AAF\u0ABE\u0A8F \u0AB0\u0ABE\u0A96\u0ACB."
  },
  "home.cta1": { en: "Open Deva editor", hi: "\u0926\u0947\u0935\u093E \u090F\u0921\u093F\u091F\u0930 \u0916\u094B\u0932\u094B", bn: "\u09A6\u09C7\u09AC\u09BE \u098F\u09A1\u09BF\u099F\u09B0 \u0996\u09CB\u09B2\u09CB", ta: "\u0BA4\u0BC7\u0BB5\u0BBE \u0B8E\u0B9F\u0BBF\u0B9F\u0BCD\u0B9F\u0BB0\u0BCD \u0BA4\u0BBF\u0BB1", te: "\u0C26\u0C47\u0C35 \u0C0E\u0C21\u0C3F\u0C1F\u0C30\u0C4D \u0C24\u0C46\u0C30\u0C35\u0C02\u0C21\u0C3F", mr: "\u0926\u0947\u0935\u093E \u090F\u0921\u093F\u091F\u0930 \u0909\u0918\u0921\u093E", gu: "\u0AA6\u0AC7\u0AB5 \u0A8F\u0AA1\u0ABF\u0A9F\u0AB0 \u0A96\u0ACB\u0AB2\u0ACB" },
  "home.cta2": { en: "Meet your AI teacher", hi: "\u0905\u092A\u0928\u0947 AI \u091F\u0940\u091A\u0930 \u0938\u0947 \u092E\u093F\u0932\u094B", bn: "\u09A4\u09CB\u09AE\u09BE\u09B0 AI \u09B6\u09BF\u0995\u09CD\u09B7\u0995\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09A6\u09C7\u0996\u09BE", ta: "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD AI \u0B86\u0B9A\u0BBF\u0BB0\u0BBF\u0BAF\u0BB0\u0BC8 \u0B9A\u0BA8\u0BCD\u0BA4\u0BBF", te: "\u0C2E\u0C40 AI \u0C09\u0C2A\u0C3E\u0C27\u0C4D\u0C2F\u0C3E\u0C2F\u0C41\u0C21\u0C3F\u0C28\u0C3F \u0C15\u0C32\u0C35\u0C02\u0C21\u0C3F", mr: "\u0924\u0941\u092E\u091A\u094D\u092F\u093E AI \u0936\u093F\u0915\u094D\u0937\u0915\u093E\u0932\u093E \u092D\u0947\u091F\u093E", gu: "\u0AA4\u0AAE\u0ABE\u0AB0\u0ABE AI \u0AB6\u0ABF\u0A95\u0ACD\u0AB7\u0A95\u0AA8\u0AC7 \u0AAE\u0AB3\u0ACB" },
  "home.proof1": { en: "250 curated problems", hi: "250 \u091A\u0941\u0928\u0947 \u0939\u0941\u090F \u092A\u094D\u0930\u0949\u092C\u094D\u0932\u092E", bn: "\u09E8\u09EB\u09E6 \u09AC\u09BE\u099B\u09BE\u0987 \u0995\u09B0\u09BE \u09AA\u09CD\u09B0\u09AC\u09B2\u09C7\u09AE", ta: "250 \u0BA4\u0BC7\u0BB0\u0BCD\u0BA8\u0BCD\u0BA4 \u0BAA\u0BBF\u0BB0\u0B9A\u0BCD\u0B9A\u0BBF\u0BA9\u0BC8\u0B95\u0BB3\u0BCD", te: "250 \u0C0E\u0C02\u0C2A\u0C3F\u0C15 \u0C1A\u0C47\u0C38\u0C3F\u0C28 \u0C38\u0C2E\u0C38\u0C4D\u0C2F\u0C32\u0C41", mr: "250 \u0928\u093F\u0935\u0921\u0932\u0947\u0932\u0947 \u092A\u094D\u0930\u0936\u094D\u0928", gu: "250 \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0AC7\u0AB2\u0ABE \u0AAA\u0ACD\u0AB0\u0AB6\u0ACD\u0AA8\u0ACB" },
  "home.proof2": { en: "Free AI teacher, 7 languages", hi: "\u092E\u0941\u092B\u093C\u094D\u0924 AI \u091F\u0940\u091A\u0930, 7 \u092D\u093E\u0937\u093E\u090F\u0901", bn: "\u09AB\u09CD\u09B0\u09BF AI \u09B6\u09BF\u0995\u09CD\u09B7\u0995, \u09ED\u099F\u09BF \u09AD\u09BE\u09B7\u09BE", ta: "\u0B87\u0BB2\u0BB5\u0B9A AI \u0B86\u0B9A\u0BBF\u0BB0\u0BBF\u0BAF\u0BB0\u0BCD, 7 \u0BAE\u0BCA\u0BB4\u0BBF\u0B95\u0BB3\u0BCD", te: "\u0C09\u0C1A\u0C3F\u0C24 AI \u0C09\u0C2A\u0C3E\u0C27\u0C4D\u0C2F\u0C3E\u0C2F\u0C41\u0C21\u0C41, 7 \u0C2D\u0C3E\u0C37\u0C32\u0C41", mr: "\u092E\u094B\u092B\u0924 AI \u0936\u093F\u0915\u094D\u0937\u0915, 7 \u092D\u093E\u0937\u093E", gu: "\u0AAE\u0AAB\u0AA4 AI \u0AB6\u0ABF\u0A95\u0ACD\u0AB7\u0A95, 7 \u0AAD\u0ABE\u0AB7\u0ABE\u0A93" },
  "lock.kicker": { en: "CODEXSHEET FAMILY PASS \xB7 \u20B910\u2013\u20B9800", hi: "CODEXSHEET FAMILY PASS \xB7 \u20B910\u2013\u20B9800", bn: "CODEXSHEET FAMILY PASS \xB7 \u20B910\u2013\u20B9800", ta: "CODEXSHEET FAMILY PASS \xB7 \u20B910\u2013\u20B9800", te: "CODEXSHEET FAMILY PASS \xB7 \u20B910\u2013\u20B9800", mr: "CODEXSHEET FAMILY PASS \xB7 \u20B910\u2013\u20B9800", gu: "CODEXSHEET FAMILY PASS \xB7 \u20B910\u2013\u20B9800" },
  "lock.title": { en: "One payment opens all 19 features.", hi: "\u090F\u0915 payment, \u0938\u093E\u0930\u0947 19 features \u0916\u0941\u0932 \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u0964", bn: "\u098F\u0995\u099F\u09BF \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F\u09C7\u0987 \u0996\u09C1\u09B2\u09C7 \u09AF\u09BE\u09AF\u09BC \u09E7\u09EF\u099F\u09BF \u09AB\u09BF\u099A\u09BE\u09B0\u0964", ta: "\u0B92\u0BB0\u0BC1 \u0B95\u0B9F\u0BCD\u0B9F\u0BA3\u0BAE\u0BC7, 19 \u0B85\u0BAE\u0BCD\u0B9A\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0BAE\u0BCD \u0BA4\u0BBF\u0BB1\u0B95\u0BCD\u0B95\u0BC1\u0BAE\u0BCD.", te: "\u0C12\u0C15 \u0C1A\u0C46\u0C32\u0C4D\u0C32\u0C3F\u0C02\u0C2A\u0C41\u0C24\u0C4B\u0C28\u0C47 19 \u0C2B\u0C40\u0C1A\u0C30\u0C4D\u0C32\u0C41 \u0C24\u0C46\u0C30\u0C41\u0C1A\u0C41\u0C15\u0C41\u0C02\u0C1F\u0C3E\u0C2F\u0C3F.", mr: "\u090F\u0915\u091A \u092A\u0947\u092E\u0947\u0902\u091F, \u0938\u0930\u094D\u0935 19 \u092B\u0940\u091A\u0930\u094D\u0938 \u0909\u0918\u0921\u0924\u093E\u0924.", gu: "\u0A8F\u0A95 \u0A9C \u0AAA\u0AC7\u0AAE\u0AC7\u0AA8\u0ACD\u0A9F, \u0AAC\u0AA7\u0ABE 19 \u0AAB\u0AC0\u0A9A\u0AB0 \u0A96\u0AC2\u0AB2\u0AC0 \u0A9C\u0ABE\u0AAF." },
  "lock.body": {
    en: "The 250-problem sheet is the product. \u20B910\u2013\u20B9800 on Paytm opens it in full, along with the Deva editor, the animated course, notes, chat, calls and your 1:1 session. Guru, the free AI teacher, stays free forever.",
    hi: "250 \u092A\u094D\u0930\u0949\u092C\u094D\u0932\u092E \u0935\u093E\u0932\u0940 \u0936\u0940\u091F \u0939\u0940 \u092A\u094D\u0930\u094B\u0921\u0915\u094D\u091F \u0939\u0948\u0964 Paytm \u092A\u0930 \u20B910\u2013\u20B9800 \u0938\u0947 \u092F\u0939 \u092A\u0942\u0930\u093E \u0916\u0941\u0932\u0924\u093E \u0939\u0948 \u2014 \u0926\u0947\u0935\u093E \u090F\u0921\u093F\u091F\u0930, \u090F\u0928\u093F\u092E\u0947\u091F\u0947\u0921 \u0915\u094B\u0930\u094D\u0938, \u0928\u094B\u091F\u094D\u0938, \u091A\u0948\u091F, \u0915\u0949\u0932\u094D\u0938 \u0914\u0930 \u0924\u0941\u092E\u094D\u0939\u093E\u0930\u0940 1:1 \u0938\u0940\u091F\u093F\u0902\u0917 \u092D\u0940\u0964 \u0917\u0941\u0930\u0941, \u092F\u093E\u0928\u0940 AI \u091F\u0940\u091A\u0930, \u0939\u092E\u0947\u0936\u093E \u092E\u0941\u092B\u093C\u094D\u0924 \u0930\u0939\u0947\u0917\u093E\u0964",
    bn: "\u09E8\u09EB\u09E6 \u09AA\u09CD\u09B0\u09AC\u09B2\u09C7\u09AE\u09C7\u09B0 \u09B6\u09C0\u099F\u0987 \u0986\u09B8\u09B2 \u09AA\u09CD\u09B0\u09CB\u09A1\u09BE\u0995\u09CD\u099F\u0964 Paytm-\u098F \u20B910\u2013\u20B9800 \u09A6\u09BF\u09B2\u09C7 \u09B8\u09AC \u0996\u09CB\u09B2\u09C7 \u2014 \u09A6\u09C7\u09AC\u09BE \u098F\u09A1\u09BF\u099F\u09B0, \u0985\u09CD\u09AF\u09BE\u09A8\u09BF\u09AE\u09C7\u099F\u09C7\u09A1 \u0995\u09CB\u09B0\u09CD\u09B8, \u09A8\u09CB\u099F, \u099A\u09CD\u09AF\u09BE\u099F, \u0995\u09B2 \u0986\u09B0 1:1 \u09B8\u09C7\u09B6\u09A8\u0993\u0964 \u0997\u09C1\u09B0\u09C1, \u09A4\u09CB\u09AE\u09BE\u09B0 AI \u09B6\u09BF\u0995\u09CD\u09B7\u0995, \u09B8\u09AC\u09B8\u09AE\u09AF\u09BC \u09AB\u09CD\u09B0\u09BF \u09A5\u09BE\u0995\u09AC\u09C7\u0964",
    ta: "250 \u0BAA\u0BBF\u0BB0\u0B9A\u0BCD\u0B9A\u0BBF\u0BA9\u0BC8\u0B95\u0BB3\u0BCD \u0B89\u0BB3\u0BCD\u0BB3 \u0BB7\u0BC0\u0B9F\u0BCD \u0BA4\u0BBE\u0BA9\u0BCD \u0BAA\u0BBF\u0BB0\u0BCB\u0B9F\u0B95\u0BCD\u0B9F\u0BCD. Paytm-\u0BB2\u0BCD \u20B910\u2013\u20B9800 \u0B95\u0BCA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BBE\u0BB2\u0BCD \u0BA4\u0BC7\u0BB5\u0BBE \u0B8E\u0B9F\u0BBF\u0B9F\u0BCD\u0B9F\u0BB0\u0BCD, \u0B85\u0BA9\u0BBF\u0BAE\u0BC7\u0B9F\u0BCD\u0B9F\u0B9F\u0BCD \u0BAA\u0B9F\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1, \u0B95\u0BC1\u0BB1\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD, \u0B9A\u0BBE\u0B9F\u0BCD, \u0B85\u0BB4\u0BC8\u0BAA\u0BCD\u0BAA\u0BC1, 1:1 \u0B85\u0BAE\u0BB0\u0BCD\u0BB5\u0BC1 \u0B85\u0BA9\u0BC8\u0BA4\u0BCD\u0BA4\u0BC1\u0BAE\u0BCD \u0BA4\u0BBF\u0BB1\u0B95\u0BCD\u0B95\u0BC1\u0BAE\u0BCD. \u0B95\u0BC1\u0BB0\u0BC1 (AI \u0B86\u0B9A\u0BBF\u0BB0\u0BBF\u0BAF\u0BB0\u0BCD) \u0B8E\u0BAA\u0BCD\u0BAA\u0BCB\u0BA4\u0BC1\u0BAE\u0BCD \u0B87\u0BB2\u0BB5\u0B9A\u0BAE\u0BCD.",
    te: "250 \u0C38\u0C2E\u0C38\u0C4D\u0C2F\u0C32 \u0C37\u0C40\u0C1F\u0C47 \u0C05\u0C38\u0C32\u0C48\u0C28 \u0C2A\u0C4D\u0C30\u0C4B\u0C21\u0C15\u0C4D\u0C1F\u0C4D. Paytm \u0C2A\u0C48 \u20B910\u2013\u20B9800 \u0C07\u0C38\u0C4D\u0C24\u0C47 \u0C26\u0C47\u0C35 \u0C0E\u0C21\u0C3F\u0C1F\u0C30\u0C4D, \u0C2F\u0C3E\u0C28\u0C3F\u0C2E\u0C47\u0C1F\u0C46\u0C21\u0C4D \u0C15\u0C4B\u0C30\u0C4D\u0C38\u0C41, \u0C28\u0C4B\u0C1F\u0C4D\u0C38\u0C4D, \u0C1A\u0C3E\u0C1F\u0C4D, \u0C15\u0C3E\u0C32\u0C4D\u0C38\u0C4D, 1:1 \u0C38\u0C46\u0C37\u0C28\u0C4D \u0C05\u0C28\u0C4D\u0C28\u0C40 \u0C24\u0C46\u0C30\u0C41\u0C1A\u0C41\u0C15\u0C41\u0C02\u0C1F\u0C3E\u0C2F\u0C3F. \u0C17\u0C41\u0C30\u0C41 (AI \u0C09\u0C2A\u0C3E\u0C27\u0C4D\u0C2F\u0C3E\u0C2F\u0C41\u0C21\u0C41) \u0C0E\u0C2A\u0C4D\u0C2A\u0C41\u0C21\u0C42 \u0C09\u0C1A\u0C3F\u0C24\u0C02.",
    mr: "250 \u092A\u094D\u0930\u0936\u094D\u0928\u093E\u0902\u091A\u0940 \u0936\u0940\u091F\u091A \u0916\u0930\u0947 \u092A\u094D\u0930\u094B\u0921\u0915\u094D\u091F. Paytm \u0935\u0930 \u20B910\u2013\u20B9800 \u0926\u094D\u092F\u093E \u092E\u094D\u0939\u0923\u091C\u0947 \u0926\u0947\u0935\u093E \u090F\u0921\u093F\u091F\u0930, \u0905\u200D\u0945\u0928\u093F\u092E\u0947\u091F\u0947\u0921 \u0905\u092D\u094D\u092F\u093E\u0938\u0915\u094D\u0930\u092E, \u0928\u094B\u091F\u0940\u0938, \u091A\u0945\u091F, \u0915\u0949\u0932\u094D\u0938 \u0906\u0923\u093F 1:1 \u0938\u0947\u0936\u0928\u094D\u0938 \u0938\u0930\u094D\u0935 \u0909\u0918\u0921\u0947\u0932. \u0917\u0941\u0930\u0941 (AI \u0936\u093F\u0915\u094D\u0937\u0915) \u0928\u0947\u0939\u092E\u0940 \u092E\u094B\u092B\u0924 \u0930\u093E\u0939\u0940\u0932.",
    gu: "250 \u0AAA\u0ACD\u0AB0\u0AB6\u0ACD\u0AA8\u0ACB\u0AA8\u0AC0 \u0AB6\u0AC0\u0A9F \u0A9C \u0AB8\u0ABE\u0A9A\u0AC0 \u0AAA\u0ACD\u0AB0\u0ACB\u0AA1\u0A95\u0ACD\u0A9F. Paytm \u0AAA\u0AB0 \u20B910\u2013\u20B9800 \u0A86\u0AAA\u0ACB \u0A8F\u0A9F\u0AB2\u0AC7 \u0AA6\u0AC7\u0AB5 \u0A8F\u0AA1\u0ABF\u0A9F\u0AB0, \u0A8F\u0AA8\u0ABF\u0AAE\u0AC7\u0A9F\u0AC7\u0AA1 \u0A95\u0ACB\u0AB0\u0ACD\u0AB8, \u0AA8\u0ACB\u0A9F\u0ACD\u0AB8, \u0A9A\u0AC7\u0A9F, \u0A95\u0AC9\u0AB2\u0ACD\u0AB8 \u0A85\u0AA8\u0AC7 1:1 \u0AB8\u0AC7\u0AB6\u0AA8 \u0AAC\u0AA7\u0AC1\u0A82 \u0A96\u0AC2\u0AB2\u0AC0 \u0A9C\u0AB6\u0AC7. \u0A97\u0AC1\u0AB0\u0AC1 (AI \u0AB6\u0ABF\u0A95\u0ACD\u0AB7\u0A95) \u0AB9\u0A82\u0AAE\u0AC7\u0AB6\u0ABE \u0AAE\u0AAB\u0AA4 \u0AB0\u0AB9\u0AC7\u0AB6\u0AC7."
  },
  "lock.note": {
    en: "Aditya matches every payment against his own Paytm statement, usually the same day. Your reference starts with CS-FAM-. Not for you? Say so within 5 days of confirmation and he refunds whatever you paid, straight back on Paytm.",
    hi: "Aditya \u0939\u0930 payment \u0905\u092A\u0928\u0940 Paytm statement \u0938\u0947 \u092E\u093F\u0932\u093E\u0924\u093E \u0939\u0948, \u0905\u0915\u094D\u0938\u0930 \u0909\u0938\u0940 \u0926\u093F\u0928\u0964 \u0924\u0941\u092E\u094D\u0939\u093E\u0930\u093E reference CS-FAM- \u0938\u0947 \u0936\u0941\u0930\u0942 \u0939\u094B\u0924\u093E \u0939\u0948\u0964 \u0915\u093E\u092E \u0928\u0939\u0940\u0902 \u0915\u0930\u0928\u093E? confirm \u0939\u094B\u0928\u0947 \u0915\u0947 5 \u0926\u093F\u0928 \u092E\u0947\u0902 \u092C\u0924\u093E\u0928\u093E, \u091C\u093F\u0924\u0928\u093E \u092D\u0930\u093E \u0925\u093E \u0909\u0924\u0928\u093E Paytm \u092A\u0930 \u0935\u093E\u092A\u0938 \u092E\u093F\u0932\u0947\u0917\u093E\u0964",
    bn: "Aditya \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09A8\u09BF\u099C\u09C7\u09B0 Paytm statement-\u098F\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AE\u09BF\u09B2\u09BF\u09AF\u09BC\u09C7 \u09A8\u09C7\u09A8, \u09AA\u09CD\u09B0\u09BE\u09AF\u09BC \u098F\u0995\u0987 \u09A6\u09BF\u09A8\u09C7\u0964 \u09A4\u09CB\u09AE\u09BE\u09B0 reference \u09B6\u09C1\u09B0\u09C1 \u09B9\u09AF\u09BC CS-FAM- \u09A6\u09BF\u09AF\u09BC\u09C7\u0964 \u09A6\u09B0\u0995\u09BE\u09B0 \u09A8\u09C7\u0987? confirm \u09B9\u0993\u09AF\u09BC\u09BE\u09B0 \u09EB \u09A6\u09BF\u09A8\u09C7\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 \u09AC\u09B2\u09CB, \u09AF\u09BE \u09A6\u09BF\u09AF\u09BC\u09C7\u099B\u09BF\u09B2\u09C7 \u09A4\u09BE-\u0987 Paytm-\u098F \u09AB\u09C7\u09B0\u09A4 \u09AA\u09BE\u09AC\u09C7\u0964",
    ta: "Aditya \u0B92\u0BB5\u0BCD\u0BB5\u0BCA\u0BB0\u0BC1 payment-\u0B90\u0BAF\u0BC1\u0BAE\u0BCD \u0BA4\u0BA9\u0BCD Paytm statement-\u0B89\u0B9F\u0BA9\u0BCD \u0B92\u0BAA\u0BCD\u0BAA\u0BBF\u0B9F\u0BC1\u0BB5\u0BBE\u0BB0\u0BCD, \u0BAA\u0BC6\u0BB0\u0BC1\u0BAE\u0BCD\u0BAA\u0BBE\u0BB2\u0BC1\u0BAE\u0BCD \u0B85\u0BA9\u0BCD\u0BB1\u0BC7. \u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD reference CS-FAM- \u0B8E\u0BA9 \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BCD. \u0BA4\u0BC7\u0BB5\u0BC8\u0BAF\u0BBF\u0BB2\u0BCD\u0BB2\u0BC8\u0BAF\u0BBE? \u0B89\u0BB1\u0BC1\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4 5 \u0BA8\u0BBE\u0B9F\u0BCD\u0B95\u0BB3\u0BCD \u0B89\u0BB3\u0BCD\u0BB3\u0BC7 \u0B9A\u0BCA\u0BB2\u0BCD\u0BB2\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD, \u0BA8\u0BC0\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B95\u0BCA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BA4\u0BC8 Paytm-\u0BB2\u0BCD \u0BA4\u0BBF\u0BB0\u0BC1\u0BAE\u0BCD\u0BAA\u0BAA\u0BCD \u0BAA\u0BC6\u0BB1\u0BC1\u0BB5\u0BC0\u0BB0\u0BCD\u0B95\u0BB3\u0BCD.",
    te: "Aditya \u0C2A\u0C4D\u0C30\u0C24\u0C3F payment \u0C28\u0C41 \u0C24\u0C28 Paytm statement \u0C24\u0C4B \u0C2A\u0C4B\u0C32\u0C4D\u0C1A\u0C3F \u0C1A\u0C42\u0C38\u0C4D\u0C24\u0C3E\u0C21\u0C41, \u0C1A\u0C3E\u0C32\u0C3E\u0C38\u0C3E\u0C30\u0C4D\u0C32 \u0C05\u0C26\u0C47 \u0C30\u0C4B\u0C1C\u0C41. \u0C2E\u0C40 reference CS-FAM- \u0C24\u0C4B \u0C2E\u0C4A\u0C26\u0C32\u0C35\u0C41\u0C24\u0C41\u0C02\u0C26\u0C3F. \u0C05\u0C35\u0C38\u0C30\u0C02 \u0C32\u0C47\u0C26\u0C3E? confirm \u0C05\u0C2F\u0C3F\u0C28 5 \u0C30\u0C4B\u0C1C\u0C41\u0C32\u0C4D\u0C32\u0C4B \u0C1A\u0C46\u0C2A\u0C4D\u0C2A\u0C02\u0C21\u0C3F, \u0C2E\u0C40\u0C30\u0C41 \u0C1A\u0C46\u0C32\u0C4D\u0C32\u0C3F\u0C02\u0C1A\u0C3F\u0C02\u0C26\u0C3F Paytm \u0C32\u0C4B \u0C24\u0C3F\u0C30\u0C3F\u0C17\u0C3F \u0C07\u0C2A\u0C4D\u0C2A\u0C3F\u0C38\u0C4D\u0C24\u0C3E\u0C21\u0C41.",
    mr: "Aditya \u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 payment \u0906\u092A\u0932\u094D\u092F\u093E Paytm statement \u0936\u0940 \u091C\u0941\u0933\u0935\u0924\u094B, \u092C\u0939\u0941\u0924\u0947\u0915 \u0924\u094D\u092F\u093E\u091A \u0926\u093F\u0935\u0936\u0940. \u0924\u0941\u091D\u093E reference CS-FAM- \u0928\u0947 \u0938\u0941\u0930\u0942 \u0939\u094B\u0924\u094B. \u0939\u0935\u093E \u0928\u093E\u0939\u0940? confirm \u091D\u093E\u0932\u094D\u092F\u093E\u091A\u094D\u092F\u093E 5 \u0926\u093F\u0938\u093E\u0902\u0924 \u0938\u093E\u0902\u0917, \u0924\u0942 \u092D\u0930\u0932\u0932\u0940 \u0930\u0915\u092E Paytm \u0935\u0930 \u092A\u0930\u0924 \u092E\u093F\u0933\u0947\u0932.",
    gu: "Aditya \u0AA6\u0AB0\u0AC7\u0A95 payment \u0AAA\u0ACB\u0AA4\u0ABE\u0AA8\u0AC0 Paytm statement \u0AB8\u0ABE\u0AA5\u0AC7 \u0AAE\u0AC7\u0AB3\u0AB5\u0AC7 \u0A9B\u0AC7, \u0A98\u0AA3\u0AC0\u0AB5\u0ABE\u0AB0 \u0A8F \u0A9C \u0AA6\u0ABF\u0AB5\u0AB8\u0AC7. \u0AA4\u0AAE\u0ABE\u0AB0\u0ACB reference CS-FAM- \u0AA5\u0AC0 \u0AB6\u0AB0\u0AC2 \u0AA5\u0ABE\u0AAF \u0A9B\u0AC7. \u0A9C\u0ACB\u0A88\u0AA4\u0ACB \u0AA8\u0AA5\u0AC0? confirm \u0AA5\u0AAF\u0ABE\u0AA8\u0ABE 5 \u0AA6\u0ABF\u0AB5\u0AB8\u0AAE\u0ABE\u0A82 \u0A95\u0AB9\u0ACB, \u0AA4\u0AAE\u0AC7 \u0AAD\u0AB0\u0AC7\u0AB2\u0AC0 \u0AB0\u0A95\u0AAE Paytm \u0AAA\u0AB0 \u0AAA\u0ABE\u0A9B\u0AC0 \u0AAE\u0AB3\u0AB6\u0AC7."
  },
  "lock.pay": { en: "Pay \u20B910\u2013\u20B9800 on Paytm", hi: "Paytm \u092A\u0930 \u20B910\u2013\u20B9800 \u092D\u0941\u0917\u0924\u093E\u0928 \u0915\u0930\u094B", bn: "Paytm-\u098F \u20B910\u2013\u20B9800 \u09A6\u09BF\u09A8", ta: "Paytm-\u0BB2\u0BCD \u20B910\u2013\u20B9800 \u0B9A\u0BC6\u0BB2\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1", te: "Paytm \u0C2A\u0C48 \u20B910\u2013\u20B9800 \u0C1A\u0C46\u0C32\u0C4D\u0C32\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F", mr: "Paytm \u0935\u0930 \u20B910\u2013\u20B9800 \u092D\u0930\u093E", gu: "Paytm \u0AAA\u0AB0 \u20B910\u2013\u20B9800 \u0AAD\u0AC1\u0A97\u0A9F\u0ABE\u0AB5\u0ACB" },
  "lock.paid": { en: "I paid \u2014 unlock", hi: "\u092E\u0948\u0902\u0928\u0947 pay \u0915\u093F\u092F\u093E \u2014 \u0916\u094B\u0932\u094B", bn: "\u0986\u09AE\u09BF \u09A6\u09BF\u09AF\u09BC\u09C7\u099B\u09BF \u2014 \u0996\u09CB\u09B2\u09CB", ta: "\u0BA8\u0BBE\u0BA9\u0BCD \u0B9A\u0BC6\u0BB2\u0BC1\u0BA4\u0BCD\u0BA4\u0BBF\u0BA9\u0BC7\u0BA9\u0BCD \u2014 \u0BA4\u0BBF\u0BB1", te: "\u0C1A\u0C46\u0C32\u0C4D\u0C32\u0C3F\u0C02\u0C1A\u0C3E\u0C28\u0C41 \u2014 \u0C24\u0C46\u0C30\u0C35\u0C02\u0C21\u0C3F", mr: "\u092E\u0940 \u092D\u0930\u0932\u0947 \u2014 \u0909\u0918\u0921\u093E", gu: "\u0AAE\u0AC7 \u0AAD\u0AB0\u0ACD\u0AAF\u0AC1\u0A82 \u2014 \u0A96\u0ACB\u0AB2\u0ACB" },
  "lock.checking": { en: "Checking\u2026", hi: "\u0926\u0947\u0916 \u0930\u0939\u0947 \u0939\u0948\u0902\u2026", bn: "\u09A6\u09C7\u0996\u099B\u09BF\u2026", ta: "\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BBF\u0BB1\u0BC7\u0BA9\u0BCD\u2026", te: "\u0C1A\u0C42\u0C38\u0C4D\u0C24\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C28\u0C41\u2026", mr: "\u0924\u092A\u093E\u0938\u0924 \u0906\u0939\u0947\u2026", gu: "\u0AA4\u0AAA\u0ABE\u0AB8\u0AC0 \u0AB0\u0AB9\u0ACD\u0AAF\u0AC1\u0A82 \u0A9B\u0AC7\u2026" },
  "lock.free": { en: "No money? Ask Guru for free", hi: "\u092A\u0948\u0938\u0947 \u0928\u0939\u0940\u0902? \u0917\u0941\u0930\u0941 \u0938\u0947 \u092E\u0941\u092B\u093C\u094D\u0924 \u092A\u0942\u091B\u094B", bn: "\u099F\u09BE\u0995\u09BE \u09A8\u09C7\u0987? \u0997\u09C1\u09B0\u09C1\u0995\u09C7 \u09AB\u09CD\u09B0\u09BF \u099C\u09BF\u099C\u09CD\u099E\u09BE\u09B8\u09BE \u0995\u09B0\u09CB", ta: "\u0BAA\u0BA3\u0BAE\u0BCD \u0B87\u0BB2\u0BCD\u0BB2\u0BC8? \u0B95\u0BC1\u0BB0\u0BC1\u0BB5\u0BBF\u0B9F\u0BAE\u0BCD \u0B87\u0BB2\u0BB5\u0B9A\u0BAE\u0BBE\u0B95 \u0B95\u0BC7\u0BB3\u0BCD", te: "\u0C21\u0C2C\u0C4D\u0C2C\u0C41 \u0C32\u0C47\u0C26\u0C3E? \u0C17\u0C41\u0C30\u0C41 \u0C09\u0C1A\u0C3F\u0C24\u0C02\u0C17\u0C3E \u0C05\u0C21\u0C17\u0C24\u0C3E\u0C21\u0C41", mr: "\u092A\u0948\u0938\u0947 \u0928\u093E\u0939\u0940\u0924? \u0917\u0941\u0930\u0941\u0932\u093E \u092E\u094B\u092B\u0924 \u0935\u093F\u091A\u093E\u0930", gu: "\u0AAA\u0AC8\u0AB8\u0ABE \u0AA8\u0AA5\u0AC0? \u0A97\u0AC1\u0AB0\u0AC1\u0AA8\u0AC7 \u0AAE\u0AAB\u0AA4 \u0AAA\u0AC2\u0A9B\u0ACB" },
  "guru.kicker": { en: "FREE \xB7 AI TEACHER \xB7 7 INDIAN LANGUAGES", hi: "\u092E\u0941\u092B\u093C\u094D\u0924 \xB7 AI \u091F\u0940\u091A\u0930 \xB7 7 \u092D\u093E\u0930\u0924\u0940\u092F \u092D\u093E\u0937\u093E\u090F\u0901", bn: "\u09AB\u09CD\u09B0\u09BF \xB7 AI \u09B6\u09BF\u0995\u09CD\u09B7\u0995 \xB7 \u09ED\u099F\u09BF \u09AD\u09BE\u09B0\u09A4\u09C0\u09AF\u09BC \u09AD\u09BE\u09B7\u09BE", ta: "\u0B87\u0BB2\u0BB5\u0B9A\u0BAE\u0BCD \xB7 AI \u0B86\u0B9A\u0BBF\u0BB0\u0BBF\u0BAF\u0BB0\u0BCD \xB7 7 \u0B87\u0BA8\u0BCD\u0BA4\u0BBF\u0BAF \u0BAE\u0BCA\u0BB4\u0BBF\u0B95\u0BB3\u0BCD", te: "\u0C09\u0C1A\u0C3F\u0C24\u0C02 \xB7 AI \u0C09\u0C2A\u0C3E\u0C27\u0C4D\u0C2F\u0C3E\u0C2F\u0C41\u0C21\u0C41 \xB7 7 \u0C2D\u0C3E\u0C30\u0C24\u0C40\u0C2F \u0C2D\u0C3E\u0C37\u0C32\u0C41", mr: "\u092E\u094B\u092B\u0924 \xB7 AI \u0936\u093F\u0915\u094D\u0937\u0915 \xB7 7 \u092D\u093E\u0930\u0924\u0940\u092F \u092D\u093E\u0937\u093E", gu: "\u0AAE\u0AAB\u0AA4 \xB7 AI \u0AB6\u0ABF\u0A95\u0ACD\u0AB7\u0A95 \xB7 7 \u0AAD\u0ABE\u0AB0\u0AA4\u0AC0\u0AAF \u0AAD\u0ABE\u0AB7\u0ABE\u0A93" },
  "guru.title": { en: "Guru teaches you DSA out loud.", hi: "\u0917\u0941\u0930\u0941 \u0924\u0941\u092E\u094D\u0939\u0947\u0902 DSA \u092C\u094B\u0932\u0915\u0930 \u0938\u093F\u0916\u093E\u0924\u093E \u0939\u0948\u0964", bn: "\u0997\u09C1\u09B0\u09C1 \u09A4\u09CB\u09AE\u09BE\u0995\u09C7 DSA \u09AC\u09B2\u09C7 \u09AC\u09C1\u099D\u09BF\u09AF\u09BC\u09C7 \u09B6\u09C7\u0996\u09BE\u09AF\u09BC\u0964", ta: "\u0B95\u0BC1\u0BB0\u0BC1 \u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 DSA \u0B9A\u0BCA\u0BB2\u0BCD\u0BB2\u0BBF\u0BA4\u0BCD \u0BA4\u0BB0\u0BC1\u0BB5\u0BBE\u0BB0\u0BCD.", te: "\u0C17\u0C41\u0C30\u0C41 \u0C2E\u0C40\u0C15\u0C41 DSA \u0C28\u0C4B\u0C1F\u0C3F\u0C24\u0C4B\u0C28\u0C47 \u0C2C\u0C4B\u0C27\u0C3F\u0C38\u0C4D\u0C24\u0C3E\u0C21\u0C41.", mr: "\u0917\u0941\u0930\u0941 \u0924\u0941\u0932\u093E DSA \u092C\u094B\u0932\u0942\u0928 \u0936\u093F\u0915\u0935\u0924\u094B.", gu: "\u0A97\u0AC1\u0AB0\u0AC1 \u0AA4\u0AAE\u0AA8\u0AC7 DSA \u0AAC\u0ACB\u0AB2\u0AC0\u0AA8\u0AC7 \u0AB6\u0AC0\u0A96\u0AB5\u0AC7 \u0A9B\u0AC7." },
  "guru.body": {
    en: "Ask in your language, get a 3D figure on the board, and hear the lesson spoken. Guru shows his face \u2014 he smiles when you get it, frowns when you skip the basics, and never judges you for being poor.",
    hi: "\u0905\u092A\u0928\u0940 \u092D\u093E\u0937\u093E \u092E\u0947\u0902 \u092A\u0942\u091B\u094B, \u092C\u094B\u0930\u094D\u0921 \u092A\u0930 3D \u0906\u0915\u0943\u0924\u093F \u0926\u0947\u0916\u094B \u0914\u0930 lesson \u0938\u0941\u0928\u094B\u0964 \u0917\u0941\u0930\u0941 \u0915\u093E \u091A\u0947\u0939\u0930\u093E \u0939\u0948 \u2014 \u0924\u0941\u092E \u0938\u092E\u091D \u091C\u093E\u0913 \u0924\u094B \u092E\u0941\u0938\u094D\u0915\u0941\u0930\u093E\u0924\u093E \u0939\u0948, \u092C\u0947\u0938\u093F\u0915\u094D\u0938 \u091B\u094B\u0921\u093C\u094B \u0924\u094B \u092D\u094C\u0902\u0939 \u091A\u0922\u093C\u093E\u0924\u093E \u0939\u0948, \u0914\u0930 \u092A\u0948\u0938\u0947 \u0928 \u0939\u094B\u0928\u0947 \u0915\u093E \u092E\u091C\u093C\u093E\u0915 \u0915\u092D\u0940 \u0928\u0939\u0940\u0902 \u0909\u0921\u093C\u093E\u0924\u093E\u0964",
    bn: "\u09A8\u09BF\u099C\u09C7\u09B0 \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC \u099C\u09BF\u099C\u09CD\u099E\u09BE\u09B8\u09BE \u0995\u09B0\u09CB, \u09AC\u09CB\u09B0\u09CD\u09A1\u09C7 3D \u099B\u09AC\u09BF \u09A6\u09C7\u0996\u09CB, \u0986\u09B0 \u09AA\u09BE\u09A0 \u09B6\u09CB\u09A8\u09CB\u0964 \u0997\u09C1\u09B0\u09C1\u09B0 \u09AE\u09C1\u0996 \u0986\u099B\u09C7 \u2014 \u09AC\u09C1\u099D\u09A4\u09C7 \u09AA\u09BE\u09B0\u09B2\u09C7 \u09B9\u09BE\u09B8\u09C7, \u09AC\u09C7\u09B8\u09BF\u0995 \u098F\u09A1\u09BC\u09BE\u09B2\u09C7 \u09AD\u09CD\u09B0\u09C1 \u0995\u09C1\u0981\u099A\u0995\u09BE\u09AF\u09BC, \u0997\u09B0\u09BF\u09AC \u09AC\u09B2\u09C7 \u0995\u0996\u09A8\u09CB \u0996\u09BE\u09AA\u09CD\u09AA\u09BE \u09B9\u09AF\u09BC \u09A8\u09BE\u0964",
    ta: "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BAE\u0BCA\u0BB4\u0BBF\u0BAF\u0BBF\u0BB2\u0BCD \u0B95\u0BC7\u0BB3\u0BC1, \u0BAA\u0BCB\u0BB0\u0BCD\u0B9F\u0BBF\u0BB2\u0BCD 3D \u0BAA\u0B9F\u0BA4\u0BCD\u0BA4\u0BC8\u0BAA\u0BCD \u0BAA\u0BBE\u0BB0\u0BCD, \u0BAA\u0BBE\u0B9F\u0BA4\u0BCD\u0BA4\u0BC8\u0B95\u0BCD \u0B95\u0BC7\u0BB3\u0BC1. \u0B95\u0BC1\u0BB0\u0BC1\u0BB5\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0BAE\u0BC1\u0B95\u0BAE\u0BCD \u0B89\u0BA3\u0BCD\u0B9F\u0BC1 \u2014 \u0BAA\u0BC1\u0BB0\u0BBF\u0BA8\u0BCD\u0BA4\u0BBE\u0BB2\u0BCD \u0B9A\u0BBF\u0BB0\u0BBF\u0BAA\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD, \u0B85\u0B9F\u0BBF\u0BAA\u0BCD\u0BAA\u0B9F\u0BC8\u0BAF\u0BC8\u0BA4\u0BCD \u0BA4\u0BB5\u0BBF\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBE\u0BB2\u0BCD \u0B95\u0BCB\u0BAA\u0BAE\u0BBE\u0BB5\u0BBE\u0BB0\u0BCD, \u0BAA\u0BA3\u0BAE\u0BBF\u0BB2\u0BCD\u0BB2\u0BC8 \u0B8E\u0BA9\u0BCD\u0BB1\u0BC1 \u0B92\u0BB0\u0BC1\u0BAA\u0BCB\u0BA4\u0BC1\u0BAE\u0BCD \u0B95\u0BC7\u0BB2\u0BBF \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF\u0BAE\u0BBE\u0B9F\u0BCD\u0B9F\u0BBE\u0BB0\u0BCD.",
    te: "\u0C2E\u0C40 \u0C2D\u0C3E\u0C37\u0C32\u0C4B \u0C05\u0C21\u0C17\u0C02\u0C21\u0C3F, \u0C2C\u0C4B\u0C30\u0C4D\u0C21\u0C41\u0C2A\u0C48 3D \u0C1A\u0C3F\u0C24\u0C4D\u0C30\u0C02 \u0C1A\u0C42\u0C21\u0C02\u0C21\u0C3F, \u0C2A\u0C3E\u0C20\u0C3E\u0C28\u0C4D\u0C28\u0C3F \u0C35\u0C3F\u0C28\u0C02\u0C21\u0C3F. \u0C17\u0C41\u0C30\u0C41\u0C15\u0C3F \u0C2E\u0C41\u0C16\u0C02 \u0C09\u0C02\u0C26\u0C3F \u2014 \u0C05\u0C30\u0C4D\u0C25\u0C2E\u0C48\u0C24\u0C47 \u0C28\u0C35\u0C4D\u0C35\u0C24\u0C3E\u0C21\u0C41, \u0C2C\u0C47\u0C38\u0C3F\u0C15\u0C4D\u0C38\u0C4D \u0C24\u0C2A\u0C4D\u0C2A\u0C3F\u0C24\u0C47 \u0C15\u0C4B\u0C2A\u0C02\u0C17\u0C3E \u0C1A\u0C42\u0C38\u0C4D\u0C24\u0C3E\u0C21\u0C41, \u0C21\u0C2C\u0C4D\u0C2C\u0C41 \u0C32\u0C47\u0C26\u0C28\u0C3F \u0C0E\u0C2A\u0C4D\u0C2A\u0C1F\u0C3F\u0C15\u0C40 \u0C39\u0C47\u0C33\u0C28 \u0C1A\u0C47\u0C2F\u0C21\u0C41.",
    mr: "\u0924\u0941\u091D\u094D\u092F\u093E \u092D\u093E\u0937\u0947\u0924 \u0935\u093F\u091A\u093E\u0930, \u092C\u094B\u0930\u094D\u0921\u093E\u0935\u0930 3D \u0906\u0915\u0943\u0924\u0940 \u092A\u0939\u093E, \u0BAA\u0BBE\u0920 \u092C\u094B\u0932\u0942\u0928 \u0910\u0915. \u0917\u0941\u0930\u0941\u0932\u093E \u091A\u0947\u0939\u0930\u093E \u0906\u0939\u0947 \u2014 \u0938\u092E\u091C\u0932\u0947 \u0915\u0940 \u0939\u0938\u0924\u094B, \u092C\u0947\u0938\u093F\u0915 \u091A\u0941\u0915\u0932\u0947 \u0915\u0940 \u0930\u093E\u0917\u0935\u0924\u094B, \u0906\u0923\u093F \u092A\u0948\u0938\u0947 \u0928\u093E\u0939\u0940\u0924 \u092E\u094D\u0939\u0923\u0942\u0928 \u0915\u0927\u0940\u091A \u0924\u0941\u0932\u0928\u093E \u0915\u0930\u0924 \u0928\u093E\u0939\u0940.",
    gu: "\u0AA4\u0AAE\u0ABE\u0AB0\u0AC0 \u0AAD\u0ABE\u0AB7\u0ABE\u0AAE\u0ABE\u0A82 \u0AAA\u0AC2\u0A9B\u0ACB, \u0AAC\u0ACB\u0AB0\u0ACD\u0AA1 \u0AAA\u0AB0 3D \u0A86\u0A95\u0AC3\u0AA4\u0ABF \u0A9C\u0AC1\u0A93, \u0AAA\u0ABE\u0AA0 \u0AB8\u0ABE\u0A82\u0AAD\u0AB3\u0ACB. \u0A97\u0AC1\u0AB0\u0AC1 \u0AAA\u0ABE\u0AB8\u0AC7 \u0AAE\u0AC1\u0A96 \u0A9B\u0AC7 \u2014 \u0AB8\u0AAE\u0A9C\u0ABE\u0AAF \u0AA4\u0ACB \u0AB9\u0A82\u0AB8\u0AC7, \u0AAC\u0AC7\u0A9D\u0ABF\u0A95 \u0A9B\u0ACB\u0AA1\u0AC7 \u0AA4\u0ACB \u0A97\u0AC1\u0AB8\u0ACD\u0AB8\u0AC7 \u0AA5\u0ABE\u0AAF, \u0A85\u0AA8\u0AC7 \u0AAA\u0AC8\u0AB8\u0ABE \u0AA8\u0AA5\u0AC0 \u0A8F\u0A9F\u0AB2\u0AC7 \u0A95\u0ACD\u0AAF\u0ABE\u0AB0\u0AC7\u0AAF \u0AAE\u0A9C\u0ABE\u0A95 \u0A89\u0AA1\u0ABE\u0AA1\u0AC7 \u0AA8\u0AB9\u0AC0\u0A82."
  },
  "guru.placeholder": { en: "Ask in your language\u2026", hi: "\u0905\u092A\u0928\u0940 \u092D\u093E\u0937\u093E \u092E\u0947\u0902 \u092A\u0942\u091B\u094B\u2026", bn: "\u09A8\u09BF\u099C\u09C7\u09B0 \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC \u099C\u09BF\u099C\u09CD\u099E\u09BE\u09B8\u09BE \u0995\u09B0\u09CB\u2026", ta: "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BAE\u0BCA\u0BB4\u0BBF\u0BAF\u0BBF\u0BB2\u0BCD \u0B95\u0BC7\u0BB3\u0BC1\u2026", te: "\u0C2E\u0C40 \u0C2D\u0C3E\u0C37\u0C32\u0C4B \u0C05\u0C21\u0C17\u0C02\u0C21\u0C3F\u2026", mr: "\u0924\u0941\u091D\u094D\u092F\u093E \u092D\u093E\u0937\u0947\u0924 \u0935\u093F\u091A\u093E\u0930\u2026", gu: "\u0AA4\u0AAE\u0ABE\u0AB0\u0AC0 \u0AAD\u0ABE\u0AB7\u0ABE\u0AAE\u0ABE\u0A82 \u0AAA\u0AC2\u0A9B\u0ACB\u2026" },
  "guru.send": { en: "Ask", hi: "\u092A\u0942\u091B\u094B", bn: "\u099C\u09BF\u099C\u09CD\u099E\u09BE\u09B8\u09BE", ta: "\u0B95\u0BC7\u0BB3\u0BC1", te: "\u0C05\u0C21\u0C17\u0C02\u0C21\u0C3F", mr: "\u0935\u093F\u091A\u093E\u0930\u093E", gu: "\u0AAA\u0AC2\u0A9B\u0ACB" },
  "guru.next": { en: "Next move", hi: "\u0905\u0917\u0932\u093E \u0915\u0926\u092E", bn: "\u09AA\u09B0\u09C7\u09B0 \u09A7\u09BE\u09AA", ta: "\u0B85\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4 \u0BAA\u0B9F\u0BBF", te: "\u0C24\u0C30\u0C4D\u0C35\u0C3E\u0C24\u0C3F \u0C05\u0C21\u0C41\u0C17\u0C41", mr: "\u092A\u0941\u0922\u091A\u093E \u091F\u092A\u094D\u092A\u093E", gu: "\u0A86\u0A97\u0AB2\u0AC1\u0A82 \u0AAA\u0A97\u0AB2\u0AC1\u0A82" },
  "guru.prev": { en: "Back", hi: "\u092A\u0940\u091B\u0947", bn: "\u09AA\u09C7\u099B\u09A8\u09C7", ta: "\u0BAA\u0BBF\u0BA9\u0BCD", te: "\u0C35\u0C46\u0C28\u0C41\u0C15", mr: "\u092E\u093E\u0917\u0947", gu: "\u0AAA\u0ABE\u0A9B\u0AB3" },
  "guru.hint": { en: "Give me a hint", hi: "\u090F\u0915 \u0939\u093F\u0902\u091F \u0926\u094B", bn: "\u098F\u0995\u099F\u09BF \u09B9\u09BF\u09A8\u09CD\u099F \u09A6\u09BE\u0993", ta: "\u0B92\u0BB0\u0BC1 \u0BB9\u0BBF\u0BA3\u0BCD\u0B9F\u0BCD \u09A6\u09C7", te: "\u0C12\u0C15 \u0C39\u0C3F\u0C02\u0C1F\u0C4D \u0C07\u0C35\u0C4D\u0C35\u0C41", mr: " \u090F\u0915 \u0939\u093F\u0902\u091F \u0926\u0947", gu: "\u0A8F\u0A95 \u0AB9\u0ABF\u0AA8\u0ACD\u0A9F \u0A86\u0AAA\u0ACB" },
  "guru.solve": { en: "Show the solution", hi: "\u0938\u0949\u0932\u094D\u092F\u0942\u0936\u0928 \u0926\u093F\u0916\u093E\u0913", bn: "\u09B8\u09AE\u09BE\u09A7\u09BE\u09A8 \u09A6\u09C7\u0996\u09BE\u0993", ta: "\u0BA4\u0BC0\u0BB0\u0BCD\u0BB5\u0BC1 \u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1", te: "\u0C2A\u0C30\u0C3F\u0C37\u0C4D\u0C15\u0C3E\u0C30\u0C02 \u0C1A\u0C42\u0C2A\u0C3F\u0C02\u0C1A\u0C41", mr: "\u0909\u092A\u093E\u092F \u0926\u093E\u0916\u0935", gu: "\u0A89\u0A95\u0AC7\u0AB2 \u0AAC\u0AA4\u0ABE\u0AB5\u0ACB" },
  "guru.speakOn": { en: "Voice on", hi: "\u0906\u0935\u093E\u091C\u093C \u091A\u093E\u0932\u0942", bn: "\u0995\u09A3\u09CD\u09A0 \u099A\u09BE\u09B2\u09C1", ta: "\u0B95\u0BC1\u0BB0\u0BB2\u0BCD \u0B87\u0BAF\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BCD", te: "\u0C35\u0C3E\u0C2F\u0C3F\u0C38\u0C4D \u0C06\u0C28\u0C4D", mr: "\u0906\u0935\u093E\u091C \u091A\u093E\u0932\u0942", gu: "\u0A86\u0AB5\u0ABE\u0A9C \u0A9A\u0ABE\u0AB2\u0AC1" },
  "guru.speakOff": { en: "Voice off", hi: "\u0906\u0935\u093E\u091C\u093C \u092C\u0902\u0926", bn: "\u0995\u09A3\u09CD\u09A0 \u09AC\u09A8\u09CD\u09A7", ta: "\u0B95\u0BC1\u0BB0\u0BB2\u0BCD \u0BA8\u0BBF\u0BB1\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1", te: "\u0C35\u0C3E\u0C2F\u0C3F\u0C38\u0C4D \u0C06\u0C2B\u0C4D", mr: "\u0906\u0935\u093E\u091C \u092C\u0902\u0926", gu: "\u0A86\u0AB5\u0ABE\u0A9C \u0AAC\u0A82\u0AA7" },
  "guru.thinking": { en: "Guru is thinking\u2026", hi: "\u0917\u0941\u0930\u0941 \u0938\u094B\u091A \u0930\u0939\u093E \u0939\u0948\u2026", bn: "\u0997\u09C1\u09B0\u09C1 \u09AD\u09BE\u09AC\u099B\u09C7\u2026", ta: "\u0B95\u0BC1\u0BB0\u0BC1 \u0BAF\u0BCB\u0B9A\u0BBF\u0B95\u0BCD\u0B95\u0BBF\u0BB1\u0BBE\u0BB0\u0BCD\u2026", te: "\u0C17\u0C41\u0C30\u0C41 \u0C06\u0C32\u0C4B\u0C1A\u0C3F\u0C38\u0C4D\u0C24\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C21\u0C41\u2026", mr: "\u0917\u0941\u0930\u0941 \u0935\u093F\u091A\u093E\u0930\u0924\u094B\u092F\u2026", gu: "\u0A97\u0AC1\u0AB0\u0AC1 \u0AB5\u0ABF\u0A9A\u0ABE\u0AB0\u0AC7 \u0A9B\u0AC7\u2026" },
  "guru.offline": { en: "No network \u2014 teaching from the offline brain", hi: "\u0D28\u0D46\u0D31\u0D4D\u0D31\u0D4D\u200C\u0935\u0930\u094D\u0915 \u0928\u0939\u0940\u0902 \u2014 \u0911\u092B\u093C\u0932\u093E\u0907\u0928 \u091F\u0940\u091A\u093F\u0902\u0917 \u091A\u0932 \u0930\u0939\u0940 \u0939\u0948", bn: "\u09A8\u09C7\u099F\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u0995 \u09A8\u09C7\u0987 \u2014 \u0985\u09AB\u09B2\u09BE\u0987\u09A8 \u09AA\u09BE\u09A0 \u099A\u09B2\u099B\u09C7", ta: "\u0BA8\u0BC6\u0B9F\u0BCD\u0BB5\u0BCA\u0BB0\u0BCD\u0B95\u0BCD \u0B87\u0BB2\u0BCD\u0BB2\u0BC8 \u2014 \u0B86\u0B83\u0BAA\u0BCD\u0BB2\u0BC8\u0BA9\u0BCD \u0BAA\u0BBE\u0B9F\u0BAE\u0BCD", te: "\u0C28\u0C46\u0C1F\u0C4D\u200C\u0C35\u0C30\u0C4D\u0C15\u0C4D \u0C32\u0C47\u0C26\u0C41 \u2014 \u0C06\u0C2B\u0C4D\u200C\u0C32\u0C48\u0C28\u0C4D \u0C2C\u0C4B\u0C27\u0C28", mr: "\u0928\u0947\u091F\u0935\u0930\u094D\u0915 \u0928\u093E\u0939\u0940 \u2014 \u0911\u092B\u0932\u093E\u0907\u0928 \u0936\u093F\u0915\u0935\u0923\u0940", gu: "\u0AA8\u0AC7\u0A9F\u0AB5\u0AB0\u0ACD\u0A95 \u0AA8\u0AA5\u0AC0 \u2014 \u0A93\u0AAB\u0AB2\u0ABE\u0A87\u0AA8 \u0AB6\u0AC0\u0A96\u0AB5\u0AA3\u0AC0" },
  "guru.s1": { en: "Two Sum \u2014 how do I even start?", hi: "Two Sum \u2014 \u0936\u0941\u0930\u0942 \u0915\u0939\u093E\u0901 \u0938\u0947 \u0915\u0930\u0942\u0901?", bn: "Two Sum \u2014 \u0995\u09CB\u09A5\u09BE \u09A5\u09C7\u0995\u09C7 \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09AC?", ta: "Two Sum \u2014 \u0B8E\u0B99\u0BCD\u0B95\u0BC7\u0BAF\u0BBF\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1 \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95\u0BC1?", te: "Two Sum \u2014 \u0C0E\u0C15\u0C4D\u0C15\u0C21\u0C3F\u0C28\u0C41\u0C02\u0C21\u0C3F \u0C2E\u0C4A\u0C26\u0C32\u0C41\u0C2A\u0C46\u0C1F\u0C4D\u0C1F\u0C3E\u0C32\u0C3F?", mr: "Two Sum \u2014 \u0938\u0941\u0930\u0941\u0935\u093E\u0924 \u0915\u0936\u0940 \u0915\u0930\u0942?", gu: "Two Sum \u2014 \u0AB6\u0AC1\u0A82 \u0A95\u0AB0\u0AC0\u0AA8\u0AC7 \u0AB6\u0AB0\u0AC2 \u0A95\u0AB0\u0AC1\u0A82?" },
  "guru.s2": { en: "Explain sliding window", hi: "sliding window \u0938\u092E\u091D\u093E\u0913", bn: "sliding window \u09AC\u09CB\u099D\u09BE\u0993", ta: "sliding window \u0BB5\u0BBF\u0BB3\u0B95\u0BCD\u0B95\u0BC1", te: "sliding window \u0C35\u0C3F\u0C35\u0C30\u0C3F\u0C02\u0C1A\u0C41", mr: "sliding window \u0938\u092E\u091C\u093E\u0935", gu: "sliding window \u0AB8\u0AAE\u0A9C\u0ABE\u0AB5\u0ACB" },
  "guru.s3": { en: "Reverse a linked list", hi: "linked list \u0915\u094B \u092A\u0932\u091F\u094B", bn: "linked list \u0989\u09B2\u09CD\u099F\u09CB \u0995\u09B0\u09CB", ta: "linked list \u0BA4\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1", te: "linked list \u0C24\u0C3F\u0C2A\u0C4D\u0C2A\u0C41", mr: "linked list \u0909\u0932\u091F\u093E", gu: "linked list \u0A89\u0AB2\u0A9F\u0ABE\u0AB5\u0ACB" },
  "guru.s4": { en: "I always fail at DP", hi: "DP \u092E\u0947\u0902 \u0939\u092E\u0947\u0936\u093E \u0905\u091F\u0915 \u091C\u093E\u0924\u093E \u0939\u0942\u0901", bn: "DP-\u09A4\u09C7 \u09B8\u09AC\u09B8\u09AE\u09AF\u09BC \u0986\u099F\u0995\u09C7 \u09AF\u09BE\u0987", ta: "DP-\u0BB2\u0BCD \u0BA8\u0BBE\u0BA9\u0BCD \u0B8E\u0BAA\u0BCD\u0BAA\u0BCB\u0BA4\u0BC1\u0BAE\u0BCD \u0BA4\u0B9F\u0BC1\u0BAE\u0BBE\u0BB1\u0BC1\u0BB5\u0BC7\u0BA9\u0BCD", te: "DP \u0C32\u0C4B \u0C0E\u0C2A\u0C4D\u0C2A\u0C41\u0C21\u0C42 \u0C07\u0C30\u0C41\u0C15\u0C4D\u0C15\u0C41\u0C2A\u0C4B\u0C24\u0C3E\u0C28\u0C41", mr: "DP \u092E\u0927\u094D\u092F\u0947 \u0928\u0947\u0939\u092E\u0940 \u0905\u0921\u0915\u0924\u094B", gu: "DP \u0AAE\u0ABE\u0A82 \u0AB9\u0A82\u0AAE\u0AC7\u0AB6\u0ABE \u0A85\u0A9F\u0A95\u0AC0 \u0A9C\u0ABE\u0A89\u0A82" },
  "mood.calm": { en: "calm", hi: "\u0936\u093E\u0902\u0924", bn: "\u09B6\u09BE\u09A8\u09CD\u09A4", ta: "\u0B85\u0BAE\u0BC8\u0BA4\u0BBF", te: "\u0C38\u0C3E\u0C2E\u0C40\u0C2A\u0C4D\u0C2F\u0C02", mr: "\u0936\u093E\u0902\u0924", gu: "\u0AB6\u0ABE\u0A82\u0AA4" },
  "mood.happy": { en: "smiling", hi: "\u092E\u0941\u0938\u094D\u0915\u0941\u0930\u093E \u0930\u0939\u093E \u0939\u0948", bn: "\u09B9\u09BE\u09B8\u099B\u09C7", ta: "\u0B9A\u0BBF\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BBF\u0BB1\u0BA4\u0BC1", te: "\u0C28\u0C35\u0C41\u0C24\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C21\u0C41", mr: "\u0939\u0938\u0924\u094B\u092F", gu: "\u0AB9\u0AB8\u0AC7 \u0A9B\u0AC7" },
  "mood.laugh": { en: "laughing", hi: "\u0939\u0901\u0938 \u0930\u0939\u093E \u0939\u0948", bn: "\u099C\u09CB\u09B0\u09C7 \u09B9\u09BE\u09B8\u099B\u09C7", ta: "\u0B9A\u0BBF\u0BB0\u0BBF\u0BA4\u0BCD\u0BA4\u0BC1 \u0B9A\u0BBF\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BBF\u0BB1\u0BA4\u0BC1", te: "\u0C28\u0C35\u0C4D\u0C35\u0C41\u0C24\u0C4B\u0C02\u0C26\u0C3F", mr: "\u0939\u0938\u0942\u0928 \u0930\u0921\u0924\u094B\u092F", gu: "\u0AB9\u0AB8\u0AC0 \u0AB0\u0AB9\u0ACD\u0AAF\u0AC1\u0A82 \u0A9B\u0AC7" },
  "mood.angry": { en: "annoyed", hi: "\u0928\u093E\u0930\u093E\u091C\u093C", bn: "\u09B0\u09BE\u0997 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7", ta: "\u0B95\u0BCB\u0BAA\u0BAE\u0BCD", te: "\u0C15\u0C4B\u0C2A\u0C02", mr: "\u0930\u093E\u0917\u093E\u0932\u093E", gu: "\u0A97\u0AC1\u0AB8\u0ACD\u0AB8\u0AC7" },
  "mood.think": { en: "thinking", hi: "\u0938\u094B\u091A \u0930\u0939\u093E \u0939\u0948", bn: "\u09AD\u09BE\u09AC\u099B\u09C7", ta: "\u0BAF\u0BCB\u0B9A\u0BBF\u0B95\u0BCD\u0B95\u0BBF\u0BB1\u0BA4\u0BC1", te: "\u0C06\u0C32\u0C4B\u0C1A\u0C3F\u0C38\u0C4D\u0C24\u0C4B\u0C02\u0C26\u0C3F", mr: "\u0935\u093F\u091A\u093E\u0930\u0924\u094B\u092F", gu: "\u0AB5\u0ABF\u0A9A\u0ABE\u0AB0\u0AC7 \u0A9B\u0AC7" },
  "mood.proud": { en: "proud of you", hi: "\u0924\u0941\u092E \u092A\u0930 \u0917\u0930\u094D\u0935 \u0939\u0948", bn: "\u09A4\u09CB\u09AE\u09BE\u09B0 \u0989\u09AA\u09B0 \u0997\u09B0\u09CD\u09AC", ta: "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BC8\u0BAA\u0BCD \u0BAA\u0BB1\u0BCD\u0BB1\u0BBF \u0BAA\u0BC6\u0BB0\u0BC1\u0BAE\u0BBF\u0BA4\u0BAE\u0BCD", te: "\u0C2E\u0C40\u0C2A\u0C48 \u0C17\u0C30\u0C4D\u0C35\u0C02", mr: "\u0924\u0941\u091D\u093E \u0905\u092D\u093F\u092E\u093E\u0928", gu: "\u0AA4\u0AAE\u0ABE\u0AB0\u0ABE \u0AAA\u0AB0 \u0A97\u0AB0\u0ACD\u0AB5" },
  "guru.board": { en: "The board", hi: "\u092C\u094B\u0930\u094D\u0921", bn: "\u09AC\u09CB\u09B0\u09CD\u09A1", ta: "\u0BAA\u0BCB\u0BB0\u0BCD\u0B9F\u0BC1", te: "\u0C2C\u0C4B\u0C30\u0C4D\u0C21\u0C41", mr: "\u092B\u0932\u0915", gu: "\u0AAC\u0ACB\u0AB0\u0ACD\u0AA1" },
  "guru.chat": { en: "Ask Guru", hi: "\u0917\u0941\u0930\u0941 \u0938\u0947 \u092A\u0942\u091B\u094B", bn: "\u0997\u09C1\u09B0\u09C1\u0995\u09C7 \u099C\u09BF\u099C\u09CD\u099E\u09BE\u09B8\u09BE", ta: "\u0B95\u0BC1\u0BB0\u0BC1\u0BB5\u0BBF\u0B9F\u0BAE\u0BCD \u0B95\u0BC7\u0BB3\u0BCD", te: "\u0C17\u0C41\u0C30\u0C41\u0C15\u0C3F \u0C05\u0C21\u0C17\u0C3F", mr: "\u0917\u0941\u0930\u0941\u0932\u093E \u0935\u093F\u091A\u093E\u0930\u093E", gu: "\u0A97\u0AC1\u0AB0\u0AC1\u0AA8\u0AC7 \u0AAA\u0AC2\u0A9B\u0ACB" },
  "guru.langNote": { en: "Guru replies in {language}.", hi: "\u0917\u0941\u0930\u0941 {language} \u092E\u0947\u0902 \u091C\u0935\u093E\u092C \u0926\u0947\u0917\u093E\u0964", bn: "\u0997\u09C1\u09B0\u09C1 {language}-\u098F \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09C7\u09AC\u09C7\u0964", ta: "\u0B95\u0BC1\u0BB0\u0BC1 {language} \u0B87\u0BB2\u0BCD \u0BAA\u0BA4\u0BBF\u0BB2\u0BCD \u0B9A\u0BCA\u0BB2\u0BCD\u0BB5\u0BBE\u0BB0\u0BCD.", te: "\u0C17\u0C41\u0C30\u0C41 {language} \u0C32\u0C4B \u0C38\u0C2E\u0C3E\u0C27\u0C3E\u0C28\u0C02 \u0C07\u0C38\u0C4D\u0C24\u0C3E\u0C21\u0C41.", mr: "\u0917\u0941\u0930\u0941 {language} \u092E\u0927\u094D\u092F\u0947 \u0909\u0924\u094D\u0924\u0930 \u0926\u0947\u0924\u094B.", gu: "\u0A97\u0AC1\u0AB0\u0AC1 {language} \u0AAE\u0ABE\u0A82 \u0A9C\u0AB5\u0ABE\u0AAC \u0A86\u0AAA\u0AC7 \u0A9B\u0AC7." },
  "guru.passCta": { en: "Want the whole CodexSheet too?", hi: "\u092A\u0942\u0930\u093E CodexSheet \u092D\u0940 \u091A\u093E\u0939\u093F\u090F?", bn: "\u09AA\u09C1\u09B0\u09CB CodexSheet-\u0993 \u099A\u09BE\u0987?", ta: "\u0BAE\u0BC1\u0BB4\u0BC1 CodexSheet \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BBE?", te: "\u0C2E\u0C4A\u0C24\u0C4D\u0C24\u0C02 CodexSheet \u0C15\u0C3E\u0C35\u0C3E\u0C32\u0C3E?", mr: "\u092A\u0942\u0930\u094D\u0923 CodexSheet \u0939\u0935\u093E \u0906\u0939\u0947?", gu: "\u0A86\u0A96\u0AC1\u0A82 CodexSheet \u0AAA\u0AA3 \u0A9C\u0ACB\u0A88\u0A8F?" },
  "guru.free": { en: "Guru is free forever, in every language he speaks.", hi: "\u0917\u0941\u0930\u0941 \u0939\u092E\u0947\u0936\u093E \u092E\u0941\u092B\u093C\u094D\u0924 \u0939\u0948, \u0939\u0930 \u0909\u0938 \u092D\u093E\u0937\u093E \u092E\u0947\u0902 \u091C\u094B \u0935\u094B \u092C\u094B\u0932\u0924\u093E \u0939\u0948\u0964", bn: "\u0997\u09C1\u09B0\u09C1 \u099A\u09BF\u09B0\u0995\u09BE\u09B2 \u09AB\u09CD\u09B0\u09BF, \u09AF\u09C7 \u09B8\u09AC \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC \u0995\u09A5\u09BE \u09AC\u09B2\u09C7\u0964", ta: "\u0B95\u0BC1\u0BB0\u0BC1 \u0B8E\u0BAA\u0BCD\u0BAA\u0BCB\u0BA4\u0BC1\u0BAE\u0BCD \u0B87\u0BB2\u0BB5\u0B9A\u0BAE\u0BCD, \u0B85\u0BB5\u0BB0\u0BCD \u0BAA\u0BC7\u0B9A\u0BC1\u0BAE\u0BCD \u0B92\u0BB5\u0BCD\u0BB5\u0BCA\u0BB0\u0BC1 \u0BAE\u0BCA\u0BB4\u0BBF\u0BAF\u0BBF\u0BB2\u0BC1\u0BAE\u0BCD.", te: "\u0C17\u0C41\u0C30\u0C41 \u0C0E\u0C2A\u0C4D\u0C2A\u0C41\u0C21\u0C42 \u0C09\u0C1A\u0C3F\u0C24\u0C02, \u0C05\u0C24\u0C28\u0C41 \u0C2E\u0C3E\u0C1F\u0C4D\u0C32\u0C3E\u0C21\u0C47 \u0C2A\u0C4D\u0C30\u0C24\u0C3F \u0C2D\u0C3E\u0C37\u0C32\u0C4B.", mr: "\u0917\u0941\u0930\u0941 \u0928\u0947\u0939\u092E\u0940 \u092E\u094B\u092B\u0924, \u091C\u094D\u092F\u093E \u092D\u093E\u0937\u093E \u0924\u094B \u092C\u094B\u0932\u0924\u094B \u0924\u094D\u092F\u093E\u0924.", gu: "\u0A97\u0AC1\u0AB0\u0AC1 \u0AB9\u0A82\u0AAE\u0AC7\u0AB6\u0ABE \u0AAE\u0AAB\u0AA4, \u0A9C\u0AC7 \u0AAD\u0ABE\u0AB7\u0ABE\u0A93 \u0AAC\u0ACB\u0AB2\u0AC7 \u0A9B\u0AC7 \u0AA4\u0AC7\u0AAE\u0ABE\u0A82." },
  "guru.topics": { en: "Every topic Guru can teach you", hi: "\u0917\u0941\u0930\u0941 \u091C\u094B \u0939\u0930 \u091F\u0949\u092A\u093F\u0915 \u092A\u0922\u093C\u093E\u0924\u093E \u0939\u0948", bn: "\u0997\u09C1\u09B0\u09C1 \u09AF\u09C7 \u09B8\u09AC \u099F\u09AA\u09BF\u0995 \u09B6\u0996\u09BE\u09AF\u09BC", ta: "\u0B95\u0BC1\u0BB0\u0BC1 \u0B9A\u0BCA\u0BB2\u0BCD\u0BB2\u0BC1\u0BAE\u0BCD \u0B92\u0BB5\u0BCD\u0BB5\u0BCA\u0BB0\u0BC1 \u0BA4\u0BB2\u0BC8\u0BAA\u0BCD\u0BAA\u0BC1\u0BAE\u0BCD", te: "\u0C17\u0C41\u0C30\u0C41 \u0C28\u0C47\u0C30\u0C4D\u0C2A\u0C3F\u0C02\u0C1A\u0C47 \u0C2A\u0C4D\u0C30\u0C24\u0C3F \u0C05\u0C02\u0C36\u0C02", mr: "\u0917\u0941\u0930\u0941 \u091C\u0947 \u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u0935\u093F\u0937\u092F \u0936\u093F\u0915\u0935\u0924\u094B", gu: "\u0A97\u0AC1\u0AB0\u0AC1 \u0A9C\u0AC7 \u0AA6\u0AB0\u0AC7\u0A95 \u0AB5\u0ABF\u0AB7\u0AAF \u0AB6\u0AC0\u0A96\u0AB5\u0AC7 \u0A9B\u0AC7" },
  "guru.nextUp": { en: "Next up", hi: "\u0906\u0917\u0947 \u092F\u0939", bn: "\u098F\u09B0\u09AA\u09B0", ta: "\u0B85\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1", te: "\u0C24\u0C30\u0C4D\u0C35\u0C3E\u0C24", mr: "\u092A\u0941\u0922\u0947", gu: "\u0A86\u0A97\u0AB3" },
  "guru.covered": { en: "{count} of {total} topics covered", hi: "{total} \u092E\u0947\u0902 \u0938\u0947 {count} \u091F\u0949\u092A\u093F\u0915 \u092A\u0942\u0930\u0947", bn: "{total}-\u098F\u09B0 {count} \u099F\u09AA\u09BF\u0995 \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8", ta: "{total} \u0B87\u0BB2\u0BCD {count} \u0BA4\u0BB2\u0BC8\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD \u0BAE\u0BC1\u0B9F\u0BBF\u0BA8\u0BCD\u0BA4\u0BA9", te: "{total} \u0C32\u0C4B {count} \u0C05\u0C02\u0C36\u0C3E\u0C32\u0C41 \u0C2A\u0C42\u0C30\u0C4D\u0C24\u0C2F\u0C4D\u0C2F\u0C3E\u0C2F\u0C3F", mr: "{total} \u092A\u0948\u0915\u0940 {count} \u0935\u093F\u0937\u092F \u092A\u0942\u0930\u094D\u0923", gu: "{total} \u0AAE\u0ABE\u0A82\u0AA5\u0AC0 {count} \u0AB5\u0ABF\u0AB7\u0AAF \u0AAA\u0AC2\u0AB0\u0ABE" },
  "guru.mentor": { en: "Still stuck? Send this topic to a human mentor", hi: "\u092B\u093F\u0930 \u092D\u0940 \u0905\u091F\u0915\u0947? \u092F\u0939\u0940 \u091F\u0949\u092A\u093F\u0915 \u0907\u0902\u0938\u093E\u0928 \u092E\u0947\u0902\u091F\u0930 \u0915\u094B \u092D\u0947\u091C\u094B", bn: "\u09A4\u09AC\u09C1 \u0986\u099F\u0995\u09C7 \u0997\u09C7\u09B2\u09C7? \u098F\u0987 \u099F\u09AA\u09BF\u0995 \u09AE\u09BE\u09A8\u09C1\u09B7 \u09AE\u09C7\u09A8\u09CD\u099F\u09B0\u0995\u09C7 \u09AA\u09BE\u09A0\u09BE\u0993", ta: "\u0B87\u0BA9\u0BCD\u0BA9\u0BC1\u0BAE\u0BCD \u0B9A\u0BBF\u0B95\u0BCD\u0B95\u0BBF\u0BA9\u0BBE? \u0B87\u0BA8\u0BCD\u0BA4\u0BA4\u0BCD \u0BA4\u0BB2\u0BC8\u0BAA\u0BCD\u0BAA\u0BC8 \u0BAE\u0BA9\u0BBF\u0BA4 \u0BAE\u0BC6\u0BA9\u0BCD\u0B9F\u0BCD\u0B9F\u0BB0\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0B85\u0BA9\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1", te: "\u0C07\u0C02\u0C15\u0C3E \u0C07\u0C32\u0C3E\u0C17\u0C47 \u0C09\u0C02\u0C1F\u0C47? \u0C08 \u0C05\u0C02\u0C36\u0C3E\u0C28\u0C4D\u0C28\u0C3F \u0C2E\u0C3E\u0C28\u0C35 \u0C2E\u0C46\u0C02\u0C1F\u0C3E\u0C30\u0C4D\u200C\u0C15\u0C3F \u0C2A\u0C02\u0C2A\u0C02\u0C21\u0C3F", mr: "\u0905\u091C\u0942\u0928 \u0905\u0921\u0915\u0932\u093E? \u0939\u093E \u0935\u093F\u0937\u092F \u092E\u093E\u0928\u0935\u0940 \u092E\u0947\u0902\u091F\u0930\u0932\u093E \u092A\u093E\u0920\u0935\u093E", gu: "\u0AB9\u0A9C\u0AC0 \u0A85\u0A9F\u0A95\u0ACD\u0AAF\u0ABE? \u0A86 \u0AB5\u0ABF\u0AB7\u0AAF \u0AAE\u0ABE\u0AA8\u0AB8\u0ABF\u0A95 \u0AAE\u0AC7\u0AA8\u0ACD\u0A9F\u0AB0\u0AA8\u0AC7 \u0AAE\u0ACB\u0A95\u0AB2\u0ACB" },
  "footer.feedbackTitle": { en: "STUDENT FEEDBACK", hi: "\u0935\u093F\u0926\u094D\u092F\u093E\u0930\u094D\u0925\u0940 \u092B\u0940\u0921\u092C\u0948\u0915", bn: "\u099B\u09BE\u09A4\u09CD\u09B0\u09A6\u09C7\u09B0 \u09AE\u09A4\u09BE\u09AE\u09A4", ta: "\u0BAE\u0BBE\u0BA3\u0BB5\u0BB0\u0BCD \u0B95\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1", te: "\u0C35\u0C3F\u0C26\u0C4D\u0C2F\u0C3E\u0C30\u0C4D\u0C25\u0C3F \u0C05\u0C2D\u0C3F\u0C2A\u0C4D\u0C30\u0C3E\u0C2F\u0C02", mr: "\u0935\u093F\u0926\u094D\u092F\u093E\u0930\u094D\u0925\u0940 \u0905\u092D\u093F\u092A\u094D\u0930\u093E\u092F", gu: "\u0AB5\u0ABF\u0AA6\u0ACD\u0AAF\u0ABE\u0AB0\u0ACD\u0AA5\u0AC0 \u0AAA\u0ACD\u0AB0\u0AA4\u0ABF\u0AB8\u0ABE\u0AA6" },
  "footer.feedbackBody": { en: "Tell Aditya what worked, what confused you and what to teach next. No sign-in needed.", hi: "\u0905\u0926\u093F\u0924\u094D\u092F \u0915\u094B \u092C\u0924\u093E\u0907\u090F \u0915\u094D\u092F\u093E \u0915\u093E\u092E \u0915\u093F\u092F\u093E, \u0915\u094D\u092F\u093E \u092D\u094D\u0930\u092E \u0939\u0941\u0906 \u0914\u0930 \u0906\u0917\u0947 \u0915\u094D\u092F\u093E \u092A\u0922\u093C\u093E\u090F\u0901\u0964 \u0938\u093E\u0907\u0928-\u0907\u0928 \u0915\u0940 \u091C\u093C\u0930\u0942\u0930\u0924 \u0928\u0939\u0940\u0902\u0964", bn: "\u0985\u09A6\u09BF\u09A4\u09CD\u09AF\u0995\u09C7 \u09AC\u09B2\u09C1\u09A8 \u0995\u09C0 \u0995\u09BE\u099C \u0995\u09B0\u09B2, \u0995\u09CB\u09A5\u09BE\u09AF\u09BC \u0997\u09CB\u09B2\u09AE\u09BE\u09B2, \u098F\u09B0\u09AA\u09B0 \u0995\u09C0 \u09AA\u09A1\u09BC\u09BE\u09A8\u09CB \u09A6\u09B0\u0995\u09BE\u09B0\u0964 \u09B8\u09BE\u0987\u09A8-\u0987\u09A8 \u09B2\u09BE\u0997\u09AC\u09C7 \u09A8\u09BE\u0964", ta: "\u0B8E\u0BA9\u0BCD\u0BA9 \u0BB5\u0BC7\u0BB2\u0BC8 \u0B9A\u0BC6\u0BAF\u0BCD\u0BA4\u0BA4\u0BC1, \u0B8E\u0B99\u0BCD\u0B95\u0BC1 \u0B95\u0BC1\u0BB4\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD, \u0B85\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1 \u0B8E\u0BA9\u0BCD\u0BA9 \u0B9A\u0BCA\u0BB2\u0BCD\u0BB2\u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD \u0B8E\u0BA9\u0BCD\u0BAA\u0BA4\u0BC8 \u0B85\u0BA4\u0BBF\u0BA4\u0BCD\u0BA4\u0BBF\u0BAF\u0BBF\u0B9F\u0BAE\u0BCD \u0B9A\u0BCA\u0BB2\u0BCD\u0BB2\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD. \u0B9A\u0BC8\u0BA9\u0BCD-\u0B87\u0BA9\u0BCD \u0BA4\u0BC7\u0BB5\u0BC8\u0BAF\u0BBF\u0BB2\u0BCD\u0BB2\u0BC8.", te: "\u0C0F\u0C26\u0C3F \u0C2A\u0C28\u0C3F\u0C1A\u0C47\u0C38\u0C3F\u0C02\u0C26\u0C3F, \u0C0E\u0C15\u0C4D\u0C15\u0C21 \u0C15\u0C28\u0C4D\u0C2B\u0C4D\u0C2F\u0C42\u0C1C\u0C28\u0C4D, \u0C24\u0C30\u0C4D\u0C35\u0C3E\u0C24 \u0C0F\u0C02 \u0C28\u0C47\u0C30\u0C4D\u0C2A\u0C3E\u0C32\u0C3F \u2014 \u0C05\u0C26\u0C3F\u0C24\u0C4D\u0C2F\u0C15\u0C3F \u0C1A\u0C46\u0C2A\u0C4D\u0C2A\u0C02\u0C21\u0C3F. \u0C38\u0C48\u0C28\u0C4D-\u0C07\u0C28\u0C4D \u0C05\u0C35\u0C38\u0C30\u0C02 \u0C32\u0C47\u0C26\u0C41.", mr: "\u0915\u093E\u092F \u091C\u092E\u0932\u0902, \u0915\u0941\u0920\u0947 \u0917\u094B\u0902\u0927\u0933 \u091D\u093E\u0932\u093E, \u092A\u0941\u0922\u0947 \u0915\u093E\u092F \u0936\u093F\u0915\u0935\u093E\u0935\u0947 \u2014 \u0905\u0926\u093F\u0924\u094D\u092F\u0932\u093E \u0938\u093E\u0902\u0917\u093E. \u0938\u093E\u0907\u0928-\u0907\u0928\u091A\u0940 \u0917\u0930\u091C \u0928\u093E\u0939\u0940.", gu: "\u0AB6\u0AC1\u0A82 \u0AB8\u0ABE\u0AB0\u0AC1\u0A82 \u0AB0\u0AB9\u0ACD\u0AAF\u0AC1\u0A82, \u0A95\u0ACD\u0AAF\u0ABE\u0A82 \u0A95\u0AA8\u0ACD\u0AAB\u0ACD\u0AAF\u0AC1\u0A9D\u0AA8 \u0AA5\u0AAF\u0AC1\u0A82, \u0A86\u0A97\u0AB3 \u0AB6\u0AC1\u0A82 \u0AB6\u0AC0\u0A96\u0AB5\u0AB5\u0AC1\u0A82 \u2014 \u0A86\u0AA6\u0ABF\u0AA4\u0ACD\u0AAF\u0AA8\u0AC7 \u0A95\u0AB9\u0ACB. \u0AB8\u0ABE\u0A87\u0AA8-\u0A87\u0AA8 \u0A9C\u0AB0\u0AC2\u0AB0\u0AC0 \u0AA8\u0AA5\u0AC0." },
  "footer.feedbackName": { en: "Your name (optional)", hi: "\u0906\u092A\u0915\u093E \u0928\u093E\u092E (\u0935\u0948\u0915\u0932\u094D\u092A\u093F\u0915)", bn: "\u0986\u09AA\u09A8\u09BE\u09B0 \u09A8\u09BE\u09AE (\u0990\u099A\u09CD\u099B\u09BF\u0995)", ta: "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BAA\u0BC6\u0BAF\u0BB0\u0BCD (\u0BB5\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD)", te: "\u0C2E\u0C40 \u0C2A\u0C47\u0C30\u0C41 (\u0C10\u0C1A\u0C4D\u0C1B\u0C3F\u0C15\u0C02)", mr: "\u0924\u0941\u092E\u094D\u0939\u093E\u0932\u0947 \u0928\u093E\u0935 (\u0910\u091A\u094D\u091B\u093F\u0915)", gu: "\u0AA4\u0AAE\u0ABE\u0AB0\u0AC1\u0A82 \u0AA8\u0ABE\u0AAE (\u0AB5\u0AC8\u0A95\u0AB2\u0ACD\u0AAA\u0ABF\u0A95)" },
  "footer.feedbackEmail": { en: "Your email", hi: "\u0906\u092A\u0915\u093E \u0908\u092E\u0947\u0932", bn: "\u0986\u09AA\u09A8\u09BE\u09B0 \u0987\u09AE\u09C7\u0987\u09B2", ta: "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BAE\u0BBF\u0BA9\u0BCD\u0BA9\u0B9E\u0BCD\u0B9A\u0BB2\u0BCD", te: "\u0C2E\u0C40 \u0C07\u0C2E\u0C46\u0C2F\u0C3F\u0C32\u0C4D", mr: "\u0924\u0941\u092E\u094D\u0939\u093E\u0932\u093E \u0908\u092E\u0947\u0932", gu: "\u0AA4\u0AAE\u0ABE\u0AB0\u0AC1\u0A82 \u0A88\u0AAE\u0AC7\u0AB2" },
  "footer.feedbackMessage": { en: "What should change here?", hi: "\u092F\u0939\u093E\u0901 \u0915\u094D\u092F\u093E \u092C\u0926\u0932\u0928\u093E \u091A\u093E\u0939\u093F\u090F?", bn: "\u098F\u0996\u09BE\u09A8\u09C7 \u0995\u09C0 \u09AC\u09A6\u09B2\u09BE\u09A8\u09CB \u09A6\u09B0\u0995\u09BE\u09B0?", ta: "\u0B87\u0B99\u0BCD\u0B95\u0BC7 \u0B8E\u0BA9\u0BCD\u0BA9 \u0BAE\u0BBE\u0BB1\u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD?", te: "\u0C07\u0C15\u0C4D\u0C15\u0C21 \u0C0F\u0C02 \u0C2E\u0C3E\u0C30\u0C3E\u0C32\u0C3F?", mr: "\u092F\u0947\u0925\u0947 \u0915\u093E \u092C\u0926\u0932\u093E\u092F\u0932\u093E \u0939\u0935\u0902?", gu: "\u0A85\u0AB9\u0AC0\u0A82 \u0AB6\u0AC1\u0A82 \u0AAC\u0AA6\u0AB2\u0AB5\u0AC1\u0A82 \u0A9C\u0ACB\u0A88\u0A8F?" },
  "footer.feedbackSend": { en: "Send feedback", hi: "\u092B\u0940\u0921\u092C\u0948\u0915 \u092D\u0947\u091C\u0947\u0902", bn: "\u09AE\u09A4\u09BE\u09AE\u09A4 \u09AA\u09BE\u09A0\u09BE\u09A8", ta: "\u0B95\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BC8 \u0B85\u0BA9\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD", te: "\u0C05\u0C2D\u0C3F\u0C2A\u0C4D\u0C30\u0C3E\u0C2F\u0C02 \u0C2A\u0C02\u0C2A\u0C02\u0C21\u0C3F", mr: "\u0905\u092D\u093F\u092A\u094D\u0930\u093E\u092F \u092A\u093E\u0920\u0935\u093E", gu: "\u0AAA\u0ACD\u0AB0\u0AA4\u0ABF\u0AB8\u0ABE\u0AA6 \u0AAE\u0ACB\u0A95\u0AB2\u0ACB" },
  "footer.feedbackSending": { en: "Sending\u2026", hi: "\u092D\u0947\u091C\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948\u2026", bn: "\u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u099A\u09CD\u099B\u09C7\u2026", ta: "\u0B85\u0BA9\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BBF\u0BB1\u0BCB\u0BAE\u0BCD\u2026", te: "\u0C2A\u0C02\u0C2A\u0C41\u0C24\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C2E\u0C41\u2026", mr: "\u092A\u093E\u0920\u0935\u0924 \u0906\u0939\u0947\u2026", gu: "\u0AAE\u0ACB\u0A95\u0AB2\u0ABE\u0A88 \u0AB0\u0AB9\u0ACD\u0AAF\u0AC1\u0A82 \u0A9B\u0AC7\u2026" },
  "footer.feedbackSent": { en: "Thank you \u2014 it is on its way to Aditya.", hi: "\u0927\u0928\u094D\u092F\u0935\u093E\u0926 \u2014 \u092F\u0939 \u0905\u0926\u093F\u0924\u094D\u092F \u0924\u0915 \u092A\u0939\u0941\u0901\u091A \u0930\u0939\u093E \u0939\u0948\u0964", bn: "\u09A7\u09A8\u09CD\u09AF\u09AC\u09BE\u09A6 \u2014 \u098F\u099F\u09BF \u0985\u09A6\u09BF\u09A4\u09CD\u09AF\u09C7\u09B0 \u0995\u09BE\u099B\u09C7 \u09AF\u09BE\u099A\u09CD\u099B\u09C7\u0964", ta: "\u0BA8\u0BA9\u0BCD\u0BB1\u0BBF \u2014 \u0B85\u0BA4\u0BC1 \u0B85\u0BA4\u0BBF\u0BA4\u0BCD\u0BA4\u0BBF\u0BAF\u0BBF\u0B9F\u0BAE\u0BCD \u0B9A\u0BC6\u0BB2\u0BCD\u0B95\u0BBF\u0BB1\u0BA4\u0BC1.", te: "\u0C27\u0C28\u0C4D\u0C2F\u0C35\u0C3E\u0C26\u0C3E\u0C32\u0C41 \u2014 \u0C05\u0C26\u0C3F \u0C05\u0C26\u0C3F\u0C24\u0C4D\u0C2F \u0C35\u0C26\u0C4D\u0C26\u0C15\u0C41 \u0C35\u0C46\u0C33\u0C4D\u0C24\u0C4B\u0C02\u0C26\u0C3F.", mr: "\u0906\u092D\u093E\u0930\u0940 \u2014 \u0905\u0926\u093F\u0924\u094D\u092F \u0915\u0921\u0947 \u092A\u094B\u091A\u0924 \u0906\u0939\u0947.", gu: "\u0A86\u0AAD\u0ABE\u0AB0 \u2014 \u0A86 \u0A86\u0AA6\u0ABF\u0AA4\u0ACD\u0AAF \u0AAA\u0ABE\u0AB8\u0AC7 \u0A9C\u0A88 \u0AB0\u0AB9\u0ACD\u0AAF\u0AC1\u0A82 \u0A9B\u0AC7." },
  "footer.feedbackError": { en: "Could not send that.", hi: "\u092F\u0939 \u0928\u0939\u0940\u0902 \u092D\u0947\u091C\u093E \u091C\u093E \u0938\u0915\u093E\u0964", bn: "\u098F\u099F\u09BF \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964", ta: "\u0B85\u0BA4\u0BC8 \u0B85\u0BA9\u0BC1\u0BAA\u0BCD\u0BAA \u0BAE\u0BC1\u0B9F\u0BBF\u0BAF\u0BB5\u0BBF\u0BB2\u0BCD\u0BB2\u0BC8.", te: "\u0C05\u0C26\u0C3F \u0C2A\u0C02\u0C2A\u0C32\u0C47\u0C15\u0C2A\u0C4B\u0C2F\u0C3E\u0C2E\u0C41.", mr: "\u0939\u0947 \u092A\u093E\u0935\u0924\u093E \u0906\u0932\u0947 \u0928\u093E\u0939\u0940.", gu: "\u0A86 \u0AAE\u0ACB\u0A95\u0AB2\u0AC0 \u0AB6\u0A95\u0ACD\u0AAF\u0AC1\u0A82 \u0AA8\u0AA5\u0AC0." },
  "footer.feedbackMail": { en: "Email it instead", hi: "\u0908\u092E\u0947\u0932 \u0938\u0947 \u092D\u0947\u091C\u0947\u0902", bn: "\u0987\u09AE\u09C7\u0987\u09B2\u09C7 \u09AA\u09BE\u09A0\u09BE\u09A8", ta: "\u0BAE\u0BBF\u0BA9\u0BCD\u0BA9\u0B9E\u0BCD\u0B9A\u0BB2\u0BBF\u0BB2\u0BCD \u0B85\u0BA9\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD", te: "\u0C07\u0C2E\u0C46\u0C2F\u0C3F\u0C32\u0C4D\u200C\u0C24\u0C4B \u0C2A\u0C02\u0C2A\u0C02\u0C21\u0C3F", mr: "\u0908\u092E\u0947\u0932\u0928\u0947 \u092A\u093E\u0920\u0935\u093E", gu: "\u0A88\u0AAE\u0AC7\u0AB2\u0AA5\u0AC0 \u0AAE\u0ACB\u0A95\u0AB2\u0ACB" },
  "footer.feedbackBadInput": { en: "Check the email and write at least 5 characters.", hi: "\u0908\u092E\u0947\u0932 \u091C\u093E\u0907\u090F \u0914\u0930 \u0915\u092E \u0938\u0947 \u0915\u092E 5 \u0905\u0915\u094D\u0937\u0930 \u0932\u093F\u0916\u093F\u090F\u0964", bn: "\u0987\u09AE\u09C7\u0987\u09B2 \u09A6\u09C7\u0996\u09C7 \u09A8\u09BF\u09A8 \u098F\u09AC\u0982 \u0985\u09A8\u09CD\u09A4\u09A4 \u09EB \u0985\u0995\u09CD\u09B7\u09B0 \u09B2\u09BF\u0996\u09C1\u09A8\u0964", ta: "\u0BAE\u0BBF\u0BA9\u0BCD\u0BA9\u0B9E\u0BCD\u0B9A\u0BB2\u0BC8\u0B9A\u0BCD \u0B9A\u0BB0\u0BBF\u0BAA\u0BBE\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BC1 \u0B95\u0BC1\u0BB1\u0BC8\u0BA8\u0BCD\u0BA4\u0BA4\u0BC1 5 \u0B8E\u0BB4\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1 \u0B8E\u0BB4\u0BC1\u0BA4\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.", te: "\u0C07\u0C2E\u0C46\u0C2F\u0C3F\u0C32\u0C4D \u0C24\u0C28\u0C3F\u0C16\u0C40 \u0C1A\u0C47\u0C38\u0C3F \u0C15\u0C28\u0C40\u0C38\u0C02 5 \u0C05\u0C15\u0C4D\u0C37\u0C30\u0C3E\u0C32\u0C41 \u0C30\u0C3E\u0C2F\u0C02\u0C21\u0C3F.", mr: "\u0908\u092E\u0947\u0932 \u0924\u092A\u093E\u0938\u093E \u0906\u0923\u093F \u0915\u093F\u092E\u093E\u0928 \u096B \u0905\u0915\u094D\u0937\u0930\u0947 \u0932\u093F\u0939\u093E.", gu: "\u0A88\u0AAE\u0AC7\u0AB2 \u0AA4\u0AAA\u0ABE\u0AB8\u0ACB \u0A85\u0AA8\u0AC7 \u0A93\u0A9B\u0ABE\u0AAE\u0ABE\u0A82 \u0A93\u0A9B\u0ABE \u0AEB \u0A85\u0A95\u0ACD\u0AB7\u0AB0 \u0AB2\u0A96\u0ACB." },
  "footer.feedbackOffline": { en: "The feedback service is not connected on this build.", hi: "\u0907\u0938 \u092C\u093F\u0932\u094D\u0921 \u092A\u0930 \u092B\u0940\u0921\u092C\u0948\u0915 \u0938\u0947\u0935\u093E \u091C\u0941\u0921\u093C\u0940 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964", bn: "\u098F\u0987 \u09AC\u09BF\u09B2\u09CD\u09A1\u09C7 \u09AE\u09A4\u09BE\u09AE\u09A4 \u0938\u0947\u0935\u093E \u09B8\u0982\u09AF\u09C1\u0995\u09CD\u09A4 \u09A8\u09AF\u09BC\u0964", ta: "\u0B87\u0BA8\u0BCD\u0BA4 \u0BAA\u0BBF\u0BB2\u0BCD\u0B9F\u0BBF\u0BB2\u0BCD \u0B95\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1 \u0B9A\u0BC7\u0BB5\u0BC8 \u0B87\u0BA3\u0BC8\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BB5\u0BBF\u0BB2\u0BCD\u0BB2\u0BC8.", te: "\u0C08 \u0C2C\u0C3F\u0C32\u0C4D\u0C21\u0C4D\u200C\u0C32\u0C4B \u0C05\u0C2D\u0C3F\u0C2A\u0C4D\u0C30\u0C3E\u0C2F \u0C38\u0C47\u0C35 \u0C15\u0C28\u0C46\u0C15\u0C4D\u0C1F\u0C4D\u0C1F\u0C4D \u0C15\u0C3E\u0C32\u0C47\u0C26\u0C41.", mr: "\u092F\u093E \u092C\u093F\u0932\u094D\u0921\u0935\u0930 \u092B\u0940\u0921\u092C\u0945\u0915 \u0938\u0947\u0935\u093E \u091C\u094B\u0921\u0932\u0947\u0932\u0940 \u0928\u093E\u0939\u0940.", gu: "\u0A86 \u0AAC\u0ABF\u0AB2\u0ACD\u0AA1\u0AAE\u0ABE\u0A82 \u0AAA\u0ACD\u0AB0\u0AA4\u0ABF\u0AB8\u0ABE\u0AA6 \u0AB8\u0AC7\u0AB5\u0ABE \u0A9C\u0ACB\u0AA1\u0ABE\u0AAF\u0AC7\u0AB2\u0AC0 \u0AA8\u0AA5\u0AC0." },
  "cslabs.sub": { en: "Six core algorithms - scheduling, paging, deadlock safety, B+ trees, TCP and caches. Paste your own numbers and watch the real algorithm decide.", hi: "\u091B\u0939 core algorithms - scheduling, paging, deadlock safety, B+ tree, TCP, cache. \u0905\u092A\u0928\u0947 numbers \u0921\u093E\u0932\u093F\u090F \u0914\u0930 \u0905\u0938\u0932\u0940 algorithm \u0915\u094B decide \u0915\u0930\u0924\u0947 \u0926\u0947\u0916\u093F\u090F\u0964", bn: "\u099B\u09AF\u09BC\u099F\u09BF core algorithm - scheduling, paging, deadlock safety, B+ tree, TCP, cache\u0964 \u09A8\u09BF\u099C\u09C7\u09B0 \u09B8\u0982\u0996\u09CD\u09AF\u09BE \u09AC\u09B8\u09BE\u09A8, \u0986\u09B8\u09B2 algorithm-\u098F\u09B0 \u09B8\u09BF\u09A6\u09CD\u09A7\u09BE\u09A8\u09CD\u09A4 \u09A6\u09C7\u0996\u09C1\u09A8\u0964", ta: "\u0B86\u0BB1\u0BC1 core algorithm - scheduling, paging, deadlock safety, B+ tree, TCP, cache. \u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B8E\u0BA3\u0BCD\u0B95\u0BB3\u0BC8 \u0B87\u0B9F\u0BCD\u0B9F\u0BC1 \u0B89\u0BA3\u0BCD\u0BAE\u0BC8\u0BAF\u0BBE\u0BA9 algorithm \u0BAE\u0BC1\u0B9F\u0BBF\u0BB5\u0BC6\u0B9F\u0BC1\u0BAA\u0BCD\u0BAA\u0BA4\u0BC8\u0BAA\u0BCD \u0BAA\u0BBE\u0BB0\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.", te: "\u0C06\u0C30\u0C41 core algorithms - scheduling, paging, deadlock safety, B+ tree, TCP, cache. \u0C2E\u0C40 \u0C38\u0C02\u0C16\u0C4D\u0C2F\u0C32\u0C41 \u0C2A\u0C46\u0C1F\u0C4D\u0C1F\u0C3F \u0C28\u0C3F\u0C1C\u0C2E\u0C48\u0C28 algorithm \u0C28\u0C3F\u0C30\u0C4D\u0C23\u0C2F\u0C02 \u0C1A\u0C42\u0C21\u0C02\u0C21\u0C3F.", mr: "\u0938\u0939\u093E core algorithms - scheduling, paging, deadlock safety, B+ tree, TCP, cache. \u0924\u0941\u092E\u091A\u0947 \u0906\u0915\u0921\u0947 \u091F\u093E\u0915\u093E \u0906\u0923\u093F \u0916\u0931\u094D\u092F\u093E algorithm \u091A\u093E \u0928\u093F\u0930\u094D\u0923\u092F \u092A\u0939\u093E.", gu: "\u0A9B\u0AC7 core algorithms - scheduling, paging, deadlock safety, B+ tree, TCP, cache. \u0AA4\u0AAE\u0ABE\u0AB0\u0ABE \u0A86\u0A82\u0A95\u0AA1\u0ABE \u0AAE\u0AC2\u0A95\u0ACB \u0A85\u0AA8\u0AC7 \u0AB8\u0ABE\u0A9A\u0ABE algorithm \u0AA8\u0ACB \u0AA8\u0ABF\u0AB0\u0ACD\u0AA3\u0AAF \u0A9C\u0AC1\u0A93." },
  "cslabs.workload": { en: "Your workload", hi: "\u0906\u092A\u0915\u093E workload", bn: "\u0986\u09AA\u09A8\u09BE\u09B0 workload", ta: "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD workload", te: "\u0C2E\u0C40 workload", mr: "\u0924\u0941\u092E\u091A\u093E workload", gu: "\u0AA4\u0AAE\u0ABE\u0AB0\u0AC1\u0A82 workload" },
  "cslabs.sample": { en: "Sample data", hi: "\u0928\u092E\u0942\u0928\u093E \u0921\u0947\u091F\u093E", bn: "\u09A8\u09AE\u09C1\u09A8\u09BE \u09A4\u09A5\u09CD\u09AF", ta: "\u0BAE\u0BBE\u0BA4\u0BBF\u0BB0\u0BBF \u0BA4\u0BB0\u0BB5\u0BC1", te: "\u0C28\u0C2E\u0C42\u0C28\u0C3E \u0C21\u0C47\u0C1F\u0C3E", mr: "\u0928\u092E\u0941\u0928\u093E \u0921\u0947\u091F\u093E", gu: "\u0AA8\u0AAE\u0AC2\u0AA8\u0ABE \u0AA1\u0AC7\u0A9F\u0ABE" },
  "cslabs.steps": { en: "steps", hi: "\u091A\u0930\u0923", bn: "\u09A7\u09BE\u09AA", ta: "\u0BAA\u0B9F\u0BBF\u0B95\u0BB3\u0BCD", te: "\u0C26\u0C36\u0C32\u0C41", mr: "\u092A\u093E\u092F\u0931\u094D\u092F\u093E", gu: "\u0AAA\u0A97\u0AB2\u0ABE\u0A82" },
  "cslabs.algorithm": { en: "Scheduling policy", hi: "Scheduling policy", bn: "Scheduling policy", ta: "Scheduling policy", te: "Scheduling policy", mr: "Scheduling policy", gu: "Scheduling policy" },
  "cslabs.play": { en: "Play", hi: "\u091A\u0932\u093E\u090F\u0901", bn: "\u099A\u09BE\u09B2\u09BE\u09A8", ta: "\u0B87\u0BAF\u0B95\u0BCD\u0B95\u0BC1", te: "\u0C2A\u0C4D\u0C32\u0C47", mr: "\u091A\u093E\u0932\u0942 \u0915\u0930\u093E", gu: "\u0A9A\u0AB2\u0ABE\u0AB5\u0ACB" },
  "cslabs.pause": { en: "Pause", hi: "\u0930\u094B\u0915\u0947\u0902", bn: "\u09A5\u09BE\u09AE\u09BE\u09A8", ta: "\u0BA8\u0BBF\u0BB1\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1", te: "\u0C2A\u0C3E\u0C1C\u0C4D", mr: "\u0925\u093E\u0902\u092C\u093E", gu: "\u0AA5\u0ACB\u0AAD\u0ACB" },
  "cslabs.prev": { en: "Previous step", hi: "\u092A\u093F\u091B\u0932\u093E \u091A\u0930\u0923", bn: "\u09AA\u09C2\u09B0\u09CD\u09AC\u09AC\u09B0\u09CD\u09A4\u09C0 \u09A7\u09BE\u09AA", ta: "\u0BAE\u0BC1\u0BA8\u0BCD\u0BA4\u0BC8\u0BAF \u0BAA\u0B9F\u0BBF", te: "\u0C2E\u0C41\u0C28\u0C41\u0C2A\u0C1F\u0C3F \u0C26\u0C36", mr: "\u092E\u093E\u0917\u0940\u0932 \u092A\u093E\u092F\u0930\u0940", gu: "\u0AAA\u0ABE\u0A9B\u0AB2\u0AC1\u0A82 \u0AAA\u0A97\u0AB2\u0AC1\u0A82" },
  "cslabs.next": { en: "Next step", hi: "\u0905\u0917\u0932\u093E \u091A\u0930\u0923", bn: "\u09AA\u09B0\u09AC\u09B0\u09CD\u09A4\u09C0 \u09A7\u09BE\u09AA", ta: "\u0B85\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4 \u0BAA\u0B9F\u0BBF", te: "\u0C24\u0C26\u0C41\u0C2A\u0C30\u0C3F \u0C26\u0C36", mr: "\u092A\u0941\u0922\u0940\u0932 \u092A\u093E\u092F\u0930\u0940", gu: "\u0A86\u0A97\u0AB3\u0AA8\u0AC1\u0A82 \u0AAA\u0A97\u0AB2\u0AC1\u0A82" },
  "cslabs.reset": { en: "Restart", hi: "\u092B\u093F\u0930 \u0938\u0947 \u0936\u0941\u0930\u0942", bn: "\u0986\u09AC\u09BE\u09B0 \u09B6\u09C1\u09B0\u09C1", ta: "\u0BAE\u0BC0\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95\u0BC1", te: "\u0C2E\u0C33\u0C4D\u0C32\u0C40 \u0C2A\u0C4D\u0C30\u0C3E\u0C30\u0C02\u0C2D\u0C02", mr: "\u092A\u0941\u0928\u094D\u0939\u093E \u0938\u0941\u0930\u0942", gu: "\u0AAB\u0AB0\u0AC0 \u0AB6\u0AB0\u0AC2" },
  "cslabs.speed": { en: "Speed", hi: "\u0917\u0924\u093F", bn: "\u0997\u09A4\u09BF", ta: "\u0BB5\u0BC7\u0B95\u0BAE\u0BCD", te: "\u0C35\u0C47\u0C17\u0C02", mr: "\u0935\u0947\u0917", gu: "\u0A9D\u0AA1\u0AAA" },
  "cslabs.why": { en: "Why this step", hi: "\u092F\u0939 \u091A\u0930\u0923 \u0915\u094D\u092F\u094B\u0902", bn: "\u098F\u0987 \u09A7\u09BE\u09AA\u099F\u09BF \u0995\u09C7\u09A8", ta: "\u0B87\u0BA8\u0BCD\u0BA4 \u0BAA\u0B9F\u0BBF \u0B8F\u0BA9\u0BCD", te: "\u0C08 \u0C26\u0C36 \u0C0E\u0C02\u0C26\u0C41\u0C15\u0C41", mr: "\u0939\u0940 \u092A\u093E\u092F\u0930\u0940 \u0915\u093E", gu: "\u0A86 \u0AAA\u0A97\u0AB2\u0AC1\u0A82 \u0AB6\u0ABE \u0AAE\u0ABE\u0A9F\u0AC7" },
  "cslabs.metrics": { en: "What the run proves", hi: "\u0907\u0938 run \u0938\u0947 \u0915\u094D\u092F\u093E \u0938\u093E\u092C\u093F\u0924 \u0939\u094B\u0924\u093E \u0939\u0948", bn: "\u098F\u0987 run \u0995\u09C0 \u09AA\u09CD\u09B0\u09AE\u09BE\u09A3 \u0995\u09B0\u09C7", ta: "\u0B87\u0BA8\u0BCD\u0BA4 run \u0BA8\u0BBF\u0BB0\u0BC2\u0BAA\u0BBF\u0BAA\u0BCD\u0BAA\u0BA4\u0BC1", te: "\u0C08 run \u0C28\u0C3F\u0C30\u0C42\u0C2A\u0C3F\u0C02\u0C1A\u0C47\u0C26\u0C3F", mr: "\u092F\u093E run \u0928\u0947 \u0938\u093F\u0926\u094D\u0927 \u0939\u094B\u0924\u0947", gu: "\u0A86 run \u0AB6\u0AC1\u0A82 \u0AB8\u0ABE\u0AAC\u0ABF\u0AA4 \u0A95\u0AB0\u0AC7 \u0A9B\u0AC7" },
  "cslabs.deep": { en: "Deep dive", hi: "\u0917\u0939\u0930\u093E\u0908 \u0938\u0947", bn: "\u0997\u09AD\u09C0\u09B0\u09C7", ta: "\u0B86\u0BB4\u0BCD\u0BA8\u0BCD\u0BA4\u0BC1", te: "\u0C32\u0C4B\u0C24\u0C41\u0C17\u0C3E", mr: "\u0916\u094B\u09B2\u09BE\u0C2F\u093F", gu: "\u0A8A\u0A82\u0AA1\u0ABE\u0AA3\u0AA5\u0AC0" },
  "cslabs.mechanism": { en: "How it works", hi: "\u0915\u0948\u0938\u0947 \u0915\u093E\u092E \u0915\u0930\u0924\u093E \u0939\u0948", bn: "\u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u0995\u09BE\u099C \u0995\u09B0\u09C7", ta: "\u0B8E\u0BAA\u0BCD\u0BAA\u0B9F\u0BBF \u0BB5\u0BC7\u0BB2\u0BC8 \u0B9A\u0BC6\u0BAF\u0BCD\u0B95\u0BBF\u0BB1\u0BA4\u0BC1", te: "\u0C0E\u0C32\u0C3E \u0C2A\u0C28\u0C3F\u0C1A\u0C47\u0C38\u0C4D\u0C24\u0C41\u0C02\u0C26\u0C3F", mr: "\u0915\u0938\u0947 \u0915\u093E\u092E \u0915\u0930\u0924\u0947", gu: "\u0A95\u0AC7\u0AB5\u0AC0 \u0AB0\u0AC0\u0AA4\u0AC7 \u0A95\u0ABE\u0AAE \u0A95\u0AB0\u0AC7 \u0A9B\u0AC7" },
  "cslabs.formulas": { en: "Formulas", hi: "Formulas", bn: "Formulas", ta: "Formulas", te: "Formulas", mr: "Formulas", gu: "Formulas" },
  "cslabs.traps": { en: "Traps", hi: "\u0917\u0932\u0924\u093F\u092F\u093E\u0901", bn: "\u09AD\u09C1\u09B2", ta: "\u0BAA\u0BBF\u0BB4\u0BC8\u0B95\u0BB3\u0BCD", te: "\u0C24\u0C2A\u0C4D\u0C2A\u0C41\u0C32\u0C41", mr: "\u091A\u0941\u0915\u093E", gu: "\u0AAD\u0AC2\u0AB2\u0ACB" },
  "cslabs.interview": { en: "Interview", hi: "Interview", bn: "Interview", ta: "Interview", te: "Interview", mr: "Interview", gu: "Interview" },
  "ms.kicker": { en: "ALL 19 FEATURES \xB7 ONE PASS \xB7 \u20B910\u2013\u20B9800", hi: "\u0938\u093E\u0930\u0947 19 features \xB7 \u090F\u0915 \u092A\u093E\u0938 \xB7 \u20B910\u2013\u20B9800", bn: "\u09B8\u09AC \u09E7\u09EF \u09AB\u09BF\u099A\u09BE\u09B0 \xB7 \u098F\u0995 \u09AA\u09BE\u09B8 \xB7 \u20B910\u2013\u20B9800", ta: "\u0B85\u0BA9\u0BC8\u0BA4\u0BCD\u0BA4\u0BC1 19 \u0B85\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD \xB7 \u0B92\u0BB0\u0BC7 \u0BAA\u0BBE\u0BB8\u0BCD \xB7 \u20B910\u2013\u20B9800", te: "\u0C05\u0C28\u0C4D\u0C28\u0C3F 19 \u0C2B\u0C40\u0C1A\u0C30\u0C4D\u0C32\u0C41 \xB7 \u0C12\u0C15 \u0C2A\u0C3E\u0C38\u0C4D \xB7 \u20B910\u2013\u20B9800", mr: "\u0938\u0930\u094D\u0935 19 \u092B\u0940\u091A\u0930\u094D\u0938 \xB7 \u090F\u0915 \u092A\u093E\u0938 \xB7 \u20B910\u2013\u20B9800", gu: "\u0AAC\u0AA7\u0ABE 19 \u0AAB\u0AC0\u0A9A\u0AB0 \xB7 \u0A8F\u0A95 \u0AAA\u0ABE\u0AB8 \xB7 \u20B910\u2013\u20B9800" }
};
function translate(key, lang) {
  const entry = messages[key];
  return entry[lang] ?? entry.en;
}
var STORAGE_KEY = "codexsheet.language";
var listeners = /* @__PURE__ */ new Set();
function inferLanguage() {
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored && stored in languageInstruction) return stored;
  const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en";
  const match = Object.keys(languageInstruction).find((id) => id !== "en" && nav.startsWith(id));
  return match ?? "en";
}
var current = inferLanguage();
if (typeof document !== "undefined") {
  document.documentElement.dataset.lang = current;
  document.documentElement.lang = current === "en" ? "en-IN" : `${current}-IN`;
}
function getUiLanguage() {
  return current;
}
function useUiLanguage() {
  const [lang, setLang] = useState(current);
  useEffect(() => {
    const refresh = () => setLang(getUiLanguage());
    listeners.add(refresh);
    refresh();
    return () => {
      listeners.delete(refresh);
    };
  }, []);
  return lang;
}
function useT() {
  const lang = useUiLanguage();
  return (key, vars) => {
    let value = translate(key, lang);
    if (vars) for (const [name, replacement] of Object.entries(vars)) value = value.split(`{${name}}`).join(replacement);
    return value;
  };
}

// src/mentor-mood.ts
var moodProfiles = {
  calm: { label: "calm", browAngle: 0, browLift: 0, mouthCurve: 0.22, mouthWidth: 0.62, eyeOpen: 1, blush: 0, headTilt: -2, glow: "#3b82f6", rate: 0.95, pitch: 0.98, stepSeconds: 6.5 },
  happy: { label: "smiling", browAngle: -4, browLift: 2, mouthCurve: 0.72, mouthWidth: 0.74, eyeOpen: 0.86, blush: 0.35, headTilt: 3, glow: "#60a5fa", rate: 1.04, pitch: 1.12, stepSeconds: 6 },
  laugh: { label: "laughing", browAngle: -8, browLift: 4, mouthCurve: 1, mouthWidth: 0.9, eyeOpen: 0.34, blush: 0.75, headTilt: 6, glow: "#fbbf24", rate: 1.14, pitch: 1.32, stepSeconds: 5 },
  angry: { label: "annoyed", browAngle: 16, browLift: -3, mouthCurve: -0.5, mouthWidth: 0.5, eyeOpen: 0.78, blush: 0, headTilt: -6, glow: "#f87171", rate: 1.22, pitch: 0.82, stepSeconds: 5.5 },
  think: { label: "thinking", browAngle: -10, browLift: 3, mouthCurve: 0.05, mouthWidth: 0.42, eyeOpen: 0.92, blush: 0, headTilt: 8, glow: "#a78bfa", rate: 0.86, pitch: 0.94, stepSeconds: 7.5 },
  proud: { label: "proud of you", browAngle: -6, browLift: 4, mouthCurve: 0.86, mouthWidth: 0.8, eyeOpen: 0.9, blush: 0.5, headTilt: -4, glow: "#34d399", rate: 1.02, pitch: 1.2, stepSeconds: 6 }
};
var mentorMoods = Object.keys(moodProfiles);

// src/mentor-voice.ts
var voiceSupported = typeof window !== "undefined" && "speechSynthesis" in window;
var voices = [];
var currentWord = "";
var mouthPeak = 0;
var generation = 0;
var stateListeners = /* @__PURE__ */ new Set();
function refreshVoices() {
  if (!voiceSupported) return;
  voices = window.speechSynthesis.getVoices();
}
if (voiceSupported) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}
function pickVoice(lang) {
  if (!voiceSupported) return null;
  if (!voices.length) refreshVoices();
  const locale = `${lang}-IN`.toLowerCase();
  const wanted = languageSpeechName[lang].split(" (")[0].toLowerCase();
  return voices.find((voice) => voice.lang.replace("_", "-").toLowerCase() === locale) ?? voices.find((voice) => voice.name.toLowerCase().includes(wanted)) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(lang.toLowerCase())) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en-in")) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ?? null;
}
function speechText(raw) {
  return raw.replace(/```[\s\S]*?```/g, " There is code for this \u2014 I will put it on the board. ").replace(/```[a-z]*\s*/gi, " ").replace(/`([^`]*)`/g, "$1").replace(/\[mood:[a-z]+\]/gi, " ").replace(/<\/?[^>]+>/g, " ").replace(/[*_#>|~-]+/g, " ").replace(/https?:\/\/\S+/g, " ").replace(/\s+/g, " ").trim();
}
function toChunks(text) {
  const parts = text.match(/[^.!?。！？\n]+[.!?。!?]?/g) ?? [text];
  const out = [];
  for (const part of parts) {
    let chunk = part.trim();
    if (!chunk) continue;
    while (chunk.length > 220) {
      const cut = chunk.lastIndexOf(" ", 220);
      out.push(chunk.slice(0, cut > 60 ? cut : 220).trim());
      chunk = chunk.slice(cut > 60 ? cut : 220).trim();
    }
    if (chunk) out.push(chunk);
  }
  return out.slice(0, 30);
}
var speaking = false;
function announce(next) {
  if (speaking === next) return;
  speaking = next;
  stateListeners.forEach((listener) => listener(next));
}
function finish() {
  generation += 1;
  currentWord = "";
  mouthPeak = 0;
  announce(false);
}
function speak(raw, options) {
  if (!voiceSupported) return false;
  const text = speechText(raw);
  if (!text) return false;
  const chunks = toChunks(text);
  if (!chunks.length) return false;
  const busy = window.speechSynthesis.speaking || window.speechSynthesis.pending;
  finish();
  if (busy) window.speechSynthesis.cancel();
  const profile = moodProfiles[options.mood];
  const voice = pickVoice(options.lang);
  const token = generation;
  let ended = 0;
  const utterances = chunks.map((chunk) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = `${options.lang}-IN`;
    }
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = 1;
    utterance.onstart = () => {
      if (token !== generation) return;
      mouthPeak = 1;
    };
    utterance.onboundary = (event) => {
      if (token !== generation) return;
      if (event.name && event.name !== "word") return;
      const word = utterance.text.slice(event.charIndex, event.charIndex + (event.charLength || 12)).trim();
      if (!word) return;
      currentWord = word;
      mouthPeak = 1;
      options.onWord?.(word);
    };
    const settle = () => {
      if (token !== generation) return;
      ended += 1;
      if (ended < chunks.length) {
        mouthPeak = 0.25;
        return;
      }
      finish();
      options.onEnd?.();
    };
    utterance.onend = settle;
    utterance.onerror = settle;
    return utterance;
  });
  const enqueue = () => {
    if (token !== generation) return;
    announce(true);
    window.speechSynthesis.resume();
    for (const utterance of utterances) window.speechSynthesis.speak(utterance);
  };
  if (busy) window.setTimeout(enqueue, 90);
  else enqueue();
  return true;
}
function stopSpeaking() {
  if (!voiceSupported) return;
  finish();
  window.speechSynthesis.cancel();
}

// src/__csl_probe.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var palette = ["#3b82f6", "#34d399", "#fbbf24", "#a78bfa", "#60a5fa", "#f472b6", "#22d3ee", "#fb923c"];
var subjectIcon = { os: Cpu, db: Database, network: Network, arch: HardDrive };
var colorFor = (key) => palette[[...key].reduce((sum, c) => sum + c.charCodeAt(0), 0) % palette.length];
var pad = (value, width) => {
  const text = value.toFixed(width);
  return text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
};
function ticksUpTo(end) {
  const step = end > 30 ? Math.ceil(end / 15) : end > 14 ? 2 : 1;
  const marks = [];
  for (let t = 0; t <= end; t += step) marks.push(t);
  if (marks[marks.length - 1] !== end) marks.push(end);
  return marks;
}
function GanttView({ frame }) {
  const end = Math.max(1, ...frame.gantt.map((b) => b.end));
  const width = 900;
  const left = 34;
  const usable = width - left - 14;
  const px = (t) => left + t / end * usable;
  return /* @__PURE__ */ jsxs("div", { className: "csl-viz", children: [
    /* @__PURE__ */ jsxs("svg", { viewBox: `0 0 ${width} 108`, className: "csl-svg", role: "img", "aria-label": "Gantt chart of the schedule", children: [
      ticksUpTo(end).map((t) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("line", { x1: px(t), y1: 14, x2: px(t), y2: 62, className: "csl-grid-line" }),
        /* @__PURE__ */ jsx("text", { x: px(t), y: 76, className: "csl-tick", textAnchor: "middle", children: t })
      ] }, t)),
      /* @__PURE__ */ jsx("text", { x: left - 26, y: 40, className: "csl-axis-label", children: "CPU" }),
      frame.gantt.map((block, i) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx(
          "rect",
          {
            x: px(block.start) + 1,
            y: 20,
            width: Math.max(2, px(block.end) - px(block.start) - 2),
            height: 34,
            rx: 5,
            fill: block.idle ? "transparent" : colorFor(block.pid),
            className: `csl-gantt-block${block.idle ? " idle" : ""}${block.pid === frame.running ? " live" : ""}`
          }
        ),
        !block.idle && px(block.end) - px(block.start) > 22 && /* @__PURE__ */ jsx("text", { x: (px(block.start) + px(block.end)) / 2, y: 41, className: "csl-block-label", textAnchor: "middle", children: block.pid }),
        /* @__PURE__ */ jsx("title", { children: `${block.idle ? "idle" : block.pid}: t ${block.start} to ${block.end}` }),
        i === frame.gantt.length - 1 && !block.idle && /* @__PURE__ */ jsx("line", { x1: px(block.end), y1: 16, x2: px(block.end), y2: 58, className: "csl-now" })
      ] }, `${block.pid}-${block.start}`)),
      /* @__PURE__ */ jsx("line", { x1: left, y1: 62, x2: width - 14, y2: 62, className: "csl-axis" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "csl-queues", children: [
      /* @__PURE__ */ jsxs("div", { className: "csl-chiprow", children: [
        /* @__PURE__ */ jsx("span", { className: "csl-chip-label", children: "running" }),
        frame.running ? /* @__PURE__ */ jsx("em", { className: "csl-chip live", style: { borderColor: colorFor(frame.running) }, children: frame.running }) : /* @__PURE__ */ jsx("em", { className: "csl-chip idle", children: "idle" }),
        /* @__PURE__ */ jsx("span", { className: "csl-chip-label", children: "ready" }),
        frame.ready.length ? frame.ready.map((pid, i) => /* @__PURE__ */ jsxs("em", { className: "csl-chip", style: { borderColor: colorFor(pid) }, children: [
          /* @__PURE__ */ jsx("b", { children: i + 1 }),
          " ",
          pid
        ] }, pid)) : /* @__PURE__ */ jsx("em", { className: "csl-chip empty", children: "empty" })
      ] }),
      frame.finished.length > 0 && /* @__PURE__ */ jsxs("table", { className: "csl-table", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { children: "pid" }),
          /* @__PURE__ */ jsx("th", { children: "arrival" }),
          /* @__PURE__ */ jsx("th", { children: "burst" }),
          /* @__PURE__ */ jsx("th", { children: "completion" }),
          /* @__PURE__ */ jsx("th", { children: "turnaround" }),
          /* @__PURE__ */ jsx("th", { children: "waiting" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: frame.finished.map((row) => /* @__PURE__ */ jsxs("tr", { className: row.pid === frame.running ? "live" : "", children: [
          /* @__PURE__ */ jsxs("td", { children: [
            /* @__PURE__ */ jsx("i", { style: { background: colorFor(row.pid) } }),
            row.pid
          ] }),
          /* @__PURE__ */ jsx("td", { children: row.arrival }),
          /* @__PURE__ */ jsx("td", { children: row.burst }),
          /* @__PURE__ */ jsx("td", { children: row.completion }),
          /* @__PURE__ */ jsx("td", { children: row.turnaround }),
          /* @__PURE__ */ jsx("td", { children: row.waiting })
        ] }, row.pid)) })
      ] })
    ] })
  ] });
}
function BitBar({ parts }) {
  const total = parts.reduce((sum, p) => sum + p.text.length, 0);
  return /* @__PURE__ */ jsx("div", { className: "csl-bitbar", children: parts.map((part) => /* @__PURE__ */ jsxs("div", { className: `csl-bit ${part.tone}`, style: { flexGrow: part.text.length / Math.max(1, total) }, children: [
    /* @__PURE__ */ jsx("span", { className: "csl-bit-bits", children: part.text }),
    /* @__PURE__ */ jsx("span", { className: "csl-bit-label", children: part.label })
  ] }, part.label)) });
}
function PagingView({ frame }) {
  return /* @__PURE__ */ jsxs("div", { className: "csl-viz", children: [
    /* @__PURE__ */ jsxs("div", { className: "csl-flow", children: [
      /* @__PURE__ */ jsxs("section", { className: "csl-card", children: [
        /* @__PURE__ */ jsxs("h4", { children: [
          "virtual address ",
          /* @__PURE__ */ jsx("b", { children: frame.address })
        ] }),
        /* @__PURE__ */ jsx(BitBar, { parts: [
          { text: frame.pageBin, label: `page number (${frame.pageBin.length} bits) = ${frame.page}`, tone: "page" },
          { text: frame.offsetBin, label: `offset (${frame.offsetBin.length} bits) = ${frame.offset}`, tone: "offset" }
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "csl-card", children: [
        /* @__PURE__ */ jsxs("h4", { children: [
          "TLB \xB7 ",
          frame.tlb.length,
          " entries ",
          /* @__PURE__ */ jsx("em", { className: frame.tlbHit ? "hit" : "miss", children: frame.tlbHit ? "HIT" : "MISS" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "csl-slots", children: [
          frame.tlb.map((entry, i) => /* @__PURE__ */ jsxs("div", { className: `csl-slot${entry.page === frame.page && frame.tlbHit ? " live" : ""}`, children: [
            /* @__PURE__ */ jsxs("b", { children: [
              "p",
              entry.page
            ] }),
            /* @__PURE__ */ jsx("span", { children: "\u2192" }),
            /* @__PURE__ */ jsxs("b", { children: [
              "f",
              entry.frame
            ] })
          ] }, `${entry.page}-${i}`)),
          frame.tlb.length === 0 && /* @__PURE__ */ jsx("div", { className: "csl-slot empty", children: /* @__PURE__ */ jsx("span", { children: "cold - nothing cached yet" }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "csl-hint", children: frame.walked ? "TLB missed, so the table was walked - two memory accesses instead of one." : "Translation served from the TLB - one access." })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "csl-card", children: [
        /* @__PURE__ */ jsxs("h4", { children: [
          "page table ",
          /* @__PURE__ */ jsxs("b", { children: [
            frame.table.length,
            " entries"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "csl-slots wrap", children: frame.table.map((value, i) => /* @__PURE__ */ jsxs("div", { className: `csl-cell${i === frame.page ? " live" : ""}${value === frame.frame && !frame.tlbHit ? " chosen" : ""}`, children: [
          /* @__PURE__ */ jsx("span", { className: "csl-cell-index", children: i }),
          /* @__PURE__ */ jsx("b", { children: value })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "csl-card", children: [
        /* @__PURE__ */ jsxs("h4", { children: [
          "physical address ",
          /* @__PURE__ */ jsx("b", { children: frame.physical < 0 ? "unmapped" : frame.physical })
        ] }),
        /* @__PURE__ */ jsx(BitBar, { parts: frame.frame < 0 ? [{ text: "-", label: "no frame - page fault", tone: "bad" }] : [
          { text: String(frame.frame), label: `frame ${frame.frame}`, tone: "frame" },
          { text: String(frame.offset), label: `offset ${frame.offset}`, tone: "offset" }
        ] }),
        /* @__PURE__ */ jsx("p", { className: "csl-hint", children: frame.frame < 0 ? "The reference is outside the table." : `${frame.frame} x page size + ${frame.offset} = ${frame.physical}` })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "csl-meter", children: [
      /* @__PURE__ */ jsx("div", { className: "csl-meterbar", children: /* @__PURE__ */ jsx("span", { className: "hit", style: { width: `${frame.hits / Math.max(1, frame.hits + frame.misses) * 100}%` } }) }),
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("b", { children: frame.hits }),
        " TLB hits \xB7 ",
        /* @__PURE__ */ jsx("b", { children: frame.misses }),
        " walks \xB7 hit ratio ",
        /* @__PURE__ */ jsxs("b", { children: [
          Math.round(frame.hits / Math.max(1, frame.hits + frame.misses) * 100),
          "%"
        ] }),
        " after ",
        frame.index + 1,
        " references"
      ] })
    ] })
  ] });
}
function BankerView({ frame }) {
  const header = (cols) => /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
    /* @__PURE__ */ jsx("th", {}),
    cols.map((c) => /* @__PURE__ */ jsx("th", { children: c }, c))
  ] }) });
  const letters = frame.resources;
  const matrix = (title, rows, highlight) => /* @__PURE__ */ jsxs("section", { className: `csl-card csl-matrix${highlight ? " focus" : ""}`, children: [
    /* @__PURE__ */ jsx("h4", { children: title }),
    /* @__PURE__ */ jsxs("table", { children: [
      header(letters),
      /* @__PURE__ */ jsx("tbody", { children: rows.map((row, i) => /* @__PURE__ */ jsxs("tr", { className: frame.examining === frame.processes[i] ? "live" : "", children: [
        /* @__PURE__ */ jsx("th", { children: frame.processes[i] }),
        row.map((value, r) => /* @__PURE__ */ jsx("td", { children: value }, r))
      ] }, frame.processes[i] ?? i)) })
    ] })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "csl-viz", children: [
    /* @__PURE__ */ jsxs("div", { className: "csl-flow wide", children: [
      matrix("ALLOCATION", frame.allocation, false),
      matrix("MAX \u2192 NEED", frame.need, true),
      /* @__PURE__ */ jsxs("section", { className: "csl-card", children: [
        /* @__PURE__ */ jsx("h4", { children: "resources" }),
        /* @__PURE__ */ jsxs("div", { className: "csl-vectors", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { children: "AVAILABLE" }),
            frame.available.map((value, r) => /* @__PURE__ */ jsxs("b", { children: [
              letters[r],
              value
            ] }, r))
          ] }),
          /* @__PURE__ */ jsxs("div", { className: frame.phase === "trial" ? "work" : "", children: [
            /* @__PURE__ */ jsx("span", { children: frame.phase === "trial" ? "WORK (hypothetical)" : "WORK" }),
            frame.work.map((value, r) => /* @__PURE__ */ jsxs("b", { children: [
              letters[r],
              value
            ] }, r))
          ] })
        ] }),
        frame.requested && /* @__PURE__ */ jsxs("p", { className: "csl-hint", children: [
          "request: ",
          frame.requested.map((value, r) => `${letters[r]}=${value}`).join("  ")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "csl-card", children: [
        /* @__PURE__ */ jsx("h4", { children: "finish flags" }),
        /* @__PURE__ */ jsx("div", { className: "csl-slots wrap", children: frame.finish.map((done, i) => /* @__PURE__ */ jsxs("div", { className: `csl-slot${done ? " done" : ""}${frame.examining === frame.processes[i] ? " live" : ""}`, children: [
          /* @__PURE__ */ jsx("b", { children: frame.processes[i] }),
          /* @__PURE__ */ jsx("span", { children: done ? "TRUE" : "false" })
        ] }, i)) }),
        /* @__PURE__ */ jsx("div", { className: "csl-sequence", children: frame.sequence.length ? frame.sequence.map((pid, i) => /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("i", { children: i + 1 }),
          pid,
          i < frame.sequence.length - 1 && /* @__PURE__ */ jsx("em", { children: "\u2192" })
        ] }, pid)) : /* @__PURE__ */ jsx("em", { className: "csl-chip empty", children: "no sequence yet" }) })
      ] })
    ] }),
    frame.phase === "verdict" && /* @__PURE__ */ jsx("div", { className: `csl-verdict ${frame.granted ? "yes" : "no"}`, children: frame.granted ? "SAFE - the bank grants it" : "UNSAFE - the request is rolled back" })
  ] });
}
function TreeView({ frame }) {
  const byId = useMemo(() => new Map(frame.nodes.map((node) => [node.id, node])), [frame.nodes]);
  const layout = useMemo(() => {
    const placed = /* @__PURE__ */ new Map();
    const widths = /* @__PURE__ */ new Map();
    const widthOf = (node) => Math.max(58, node.keys.length * 26 + 14);
    const depthOf = (id) => {
      const node = byId.get(id);
      if (!node) return 0;
      return node.leaf ? 0 : 1 + Math.max(...node.children.map(depthOf), 0);
    };
    const maxDepth = depthOf(frame.root);
    let cursor = 0;
    const visit = (id) => {
      const node = byId.get(id);
      if (!node) return cursor;
      const w = widthOf(node);
      widths.set(id, w);
      let x;
      if (node.leaf) {
        x = cursor + w / 2;
        cursor += w + 12;
      } else {
        const kids = node.children.map(visit);
        x = (kids[0] + kids[kids.length - 1]) / 2;
      }
      placed.set(id, { x, y: (maxDepth - depthOf(id)) * 92 + 30, node });
      return x;
    };
    visit(frame.root);
    return { placed, widths, maxDepth, span: cursor };
  }, [byId, frame.root]);
  const height = 92 * (layout.maxDepth + 1) + 60;
  const viewBoxWidth = Math.max(420, layout.span + 30);
  return /* @__PURE__ */ jsxs("div", { className: "csl-viz", children: [
    /* @__PURE__ */ jsxs("svg", { viewBox: `0 0 ${viewBoxWidth} ${height}`, className: "csl-svg tree", role: "img", "aria-label": "B+ tree after each insert", children: [
      [...layout.placed.entries()].map(([id, { node, x, y }]) => /* @__PURE__ */ jsx("g", { children: node.children.map((child) => {
        const target = layout.placed.get(child);
        if (!target) return null;
        return /* @__PURE__ */ jsx("line", { x1: x, y1: y + 14, x2: target.x, y2: target.y - 14, className: `csl-edge${frame.touched.includes(id) && frame.touched.includes(child) ? " live" : ""}` }, `${id}-${child}`);
      }) }, `edges-${id}`)),
      [...layout.placed.values()].map(({ node, x, y }) => {
        const w = layout.widths.get(node.id) ?? 60;
        const touched = frame.touched.includes(node.id);
        return /* @__PURE__ */ jsxs("g", { children: [
          /* @__PURE__ */ jsx("rect", { x: x - w / 2, y: y - 16, width: w, height: 32, rx: 6, className: `csl-node${node.leaf ? " leaf" : ""}${touched ? " live" : ""}${frame.split && touched ? " split" : ""}` }),
          node.keys.map((key, i) => /* @__PURE__ */ jsx("text", { x: x - w / 2 + 14 + i * 26, y: y + 4, className: "csl-key", textAnchor: "middle", children: key }, `${key}-${i}`)),
          !node.keys.length && /* @__PURE__ */ jsx("text", { x, y: y + 4, className: "csl-key empty", textAnchor: "middle", children: "\xB7" })
        ] }, node.id);
      })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "csl-keys-row", children: [
      /* @__PURE__ */ jsx("span", { className: "csl-chip-label", children: "insert order" }),
      frame.keys.map((key, i) => /* @__PURE__ */ jsx("em", { className: `csl-chip${i === frame.step - 1 ? " live" : ""}${i >= frame.step ? " future" : ""}`, children: key }, `${key}-${i}`))
    ] })
  ] });
}
function TcpView({ frame, history }) {
  const points = frame.points;
  const maxRtt = Math.max(1, points[points.length - 1].rtt);
  const maxCwnd = Math.max(4, ...points.map((p) => p.cwnd), ...history.map((f) => f.ssthresh));
  const width = 900;
  const height = 260;
  const left = 40;
  const bottom = height - 30;
  const x = (rtt) => left + rtt / maxRtt * (width - left - 16);
  const y = (cwnd) => bottom - cwnd / maxCwnd * (bottom - 18);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.rtt)},${y(p.cwnd)}`).join(" ");
  const area = `${path} L${x(maxRtt)},${bottom} L${left},${bottom} Z`;
  const seen = history.filter((f) => f.rtt <= frame.rtt);
  const threshold = seen.length ? seen.map((p, i) => `${i ? "L" : "M"}${x(p.rtt)},${y(p.ssthresh)}`).join(" ") : `M${left},${y(frame.ssthresh)} L${width - 16},${y(frame.ssthresh)}`;
  return /* @__PURE__ */ jsxs("div", { className: "csl-viz", children: [
    /* @__PURE__ */ jsxs("svg", { viewBox: `0 0 ${width} ${height}`, className: "csl-svg", role: "img", "aria-label": "Congestion window over time", children: [
      Array.from({ length: 5 }).map((_, i) => {
        const value = Math.round(maxCwnd / 4 * i);
        return /* @__PURE__ */ jsxs("g", { children: [
          /* @__PURE__ */ jsx("line", { x1: left, y1: y(value), x2: width - 16, y2: y(value), className: "csl-grid-line" }),
          /* @__PURE__ */ jsx("text", { x: left - 8, y: y(value) + 4, className: "csl-tick", textAnchor: "end", children: value })
        ] }, i);
      }),
      /* @__PURE__ */ jsx("path", { d: area, className: "csl-area" }),
      /* @__PURE__ */ jsx("path", { d: threshold, className: "csl-ssthresh" }),
      /* @__PURE__ */ jsxs("text", { x: width - 18, y: y(frame.ssthresh) - 6, className: "csl-ssthresh-label", textAnchor: "end", children: [
        "ssthresh ",
        frame.ssthresh
      ] }),
      /* @__PURE__ */ jsx("path", { d: path, className: "csl-cwnd" }),
      points.map((p) => /* @__PURE__ */ jsx("circle", { cx: x(p.rtt), cy: y(p.cwnd), r: p.rtt === frame.rtt ? 5 : 2.6, className: `csl-dot${p.rtt === frame.rtt ? " live" : ""}` }, p.rtt)),
      [0, Math.round(maxRtt / 2), maxRtt].map((rtt) => /* @__PURE__ */ jsxs("text", { x: x(rtt), y: bottom + 18, className: "csl-tick", textAnchor: "middle", children: [
        "RTT ",
        rtt
      ] }, rtt)),
      /* @__PURE__ */ jsx("line", { x1: left, y1: bottom, x2: width - 16, y2: bottom, className: "csl-axis" }),
      /* @__PURE__ */ jsx("text", { x: left - 30, y: 18, className: "csl-axis-label", children: "cwnd (MSS)" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "csl-queues", children: /* @__PURE__ */ jsxs("div", { className: "csl-chiprow", children: [
      /* @__PURE__ */ jsx("span", { className: "csl-chip-label", children: "phase" }),
      /* @__PURE__ */ jsx("em", { className: `csl-chip phase-${frame.phase}`, children: frame.phase.replace("-", " ") }),
      /* @__PURE__ */ jsx("span", { className: "csl-chip-label", children: "cwnd" }),
      /* @__PURE__ */ jsxs("em", { className: "csl-chip live", children: [
        frame.cwnd,
        " MSS"
      ] }),
      /* @__PURE__ */ jsx("span", { className: "csl-chip-label", children: "ssthresh" }),
      /* @__PURE__ */ jsx("em", { className: "csl-chip", children: frame.ssthresh }),
      frame.event && /* @__PURE__ */ jsx("em", { className: "csl-chip event", children: frame.event })
    ] }) })
  ] });
}
function CacheView({ frame }) {
  return /* @__PURE__ */ jsxs("div", { className: "csl-viz", children: [
    /* @__PURE__ */ jsxs("div", { className: "csl-cachehead", children: [
      /* @__PURE__ */ jsx(BitBar, { parts: [
        { text: String(frame.tag), label: `tag = ${frame.tag}`, tone: "frame" },
        { text: String(frame.set), label: `set index = ${frame.set}`, tone: "page" }
      ] }),
      /* @__PURE__ */ jsx("em", { className: `csl-chip ${frame.hit ? "hit" : "miss"}`, children: frame.hit ? "HIT" : frame.evicted === null ? "MISS \xB7 cold fill" : "MISS \xB7 conflict" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "csl-cache", children: [
      /* @__PURE__ */ jsx("div", { className: "csl-cache-col head", children: frame.ways.map((_, i) => /* @__PURE__ */ jsxs("span", { className: "csl-wayname", children: [
        "set ",
        i
      ] }, i)) }),
      /* @__PURE__ */ jsx("div", { className: "csl-cache-grid", children: frame.ways.map((bucket, setIndex) => /* @__PURE__ */ jsxs("div", { className: `csl-cache-row${setIndex === frame.set ? " live" : ""}`, children: [
        /* @__PURE__ */ jsx("span", { className: "csl-wayname", children: setIndex }),
        bucket.map((entry, wayIndex) => {
          const isTarget = setIndex === frame.set;
          const evictedHere = isTarget && !frame.hit && frame.evicted !== null && entry.tag !== null && entry.tag !== frame.tag;
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: `csl-cachecell${entry.tag === null ? " empty" : ""}${isTarget && entry.tag === frame.tag ? " filled" : ""}${evictedHere ? " ghost" : ""}`,
              style: { borderColor: entry.tag === null ? void 0 : colorFor(String(entry.tag)) },
              children: [
                entry.tag === null ? /* @__PURE__ */ jsx("span", { children: "\xB7" }) : /* @__PURE__ */ jsxs("b", { children: [
                  "tag ",
                  entry.tag
                ] }),
                /* @__PURE__ */ jsx("small", { children: entry.tag === null ? "free" : entry.stamp === frame.step ? "used now" : `${frame.step - entry.stamp} access${frame.step - entry.stamp === 1 ? "" : "es"} ago` })
              ]
            },
            wayIndex
          );
        })
      ] }, setIndex)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "csl-trace", children: frame.trace.slice(-6).map((line, i) => /* @__PURE__ */ jsx("span", { className: line.startsWith("hit") ? "hit" : "miss", children: line }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "csl-meter", children: [
      /* @__PURE__ */ jsx("div", { className: "csl-meterbar", children: /* @__PURE__ */ jsx("span", { className: "hit", style: { width: `${frame.hits / Math.max(1, frame.hits + frame.misses) * 100}%` } }) }),
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("b", { children: frame.hits }),
        " hits \xB7 ",
        /* @__PURE__ */ jsx("b", { children: frame.misses }),
        " misses \xB7 hit ratio ",
        /* @__PURE__ */ jsxs("b", { children: [
          Math.round(frame.hits / Math.max(1, frame.hits + frame.misses) * 100),
          "%"
        ] })
      ] })
    ] })
  ] });
}
function renderFrame(frame, history) {
  switch (frame.kind) {
    case "cpu":
      return /* @__PURE__ */ jsx(GanttView, { frame });
    case "paging":
      return /* @__PURE__ */ jsx(PagingView, { frame });
    case "banker":
      return /* @__PURE__ */ jsx(BankerView, { frame });
    case "tree":
      return /* @__PURE__ */ jsx(TreeView, { frame });
    case "tcp":
      return /* @__PURE__ */ jsx(TcpView, { frame, history: history.filter((f) => f.kind === "tcp") });
    case "cache":
      return /* @__PURE__ */ jsx(CacheView, { frame });
  }
}
function metricsOf(frame, frames) {
  const rows = [];
  if (frame.kind === "cpu") {
    const cpuFrames = frames;
    const m = cpuMetrics(cpuFrames);
    const last = cpuFrames[cpuFrames.length - 1];
    rows.push({ label: "average waiting time", value: `${pad(m.avgWait, 2)} units`, hint: "sum of (turnaround - burst) per process" });
    rows.push({ label: "average turnaround", value: `${pad(m.avgTurnaround, 2)} units` });
    rows.push({ label: "CPU utilisation", value: `${Math.round(m.cpuUse * 100)}%` });
    rows.push({ label: "context switches", value: String(Math.max(0, last.gantt.filter((b, i, arr) => !b.idle && (i === 0 || arr[i - 1].pid !== b.pid)).length - 1)) });
  } else if (frame.kind === "paging") {
    const total = frame.hits + frame.misses;
    rows.push({ label: "TLB hit ratio", value: `${Math.round(frame.hits / Math.max(1, total) * 100)}%` });
    rows.push({ label: "memory accesses paid", value: String(total + frame.misses), hint: "a walk costs the table read plus the real read" });
    rows.push({ label: "page size", value: `${2 ** frame.offsetBin.length} bytes`, hint: `${frame.offsetBin.length} offset bits` });
  } else if (frame.kind === "banker") {
    const verdicts = frames.filter((f) => f.kind === "banker" && f.phase === "verdict");
    rows.push({ label: "requests granted", value: String(verdicts.filter((v) => v.granted).length) });
    rows.push({ label: "requests denied", value: String(verdicts.filter((v) => !v.granted).length) });
    rows.push({ label: "safe sequence", value: frame.sequence.length ? `<${frame.sequence.join(", ")}>` : "none found" });
  } else if (frame.kind === "tree") {
    const leaves = frame.nodes.filter((n) => n.leaf);
    const heightOf = (id) => {
      const node = frame.nodes.find((n) => n.id === id);
      if (!node || node.leaf) return 0;
      return 1 + Math.max(...node.children.map(heightOf));
    };
    rows.push({ label: "tree height", value: String(heightOf(frame.root)), hint: "grows only when the root splits" });
    rows.push({ label: "leaf nodes", value: String(leaves.length) });
    rows.push({ label: "keys stored", value: String(leaves.reduce((sum, n) => sum + n.keys.length, 0)) });
    rows.push({ label: "order", value: "4", hint: "max 3 keys in a leaf, 2 in an internal node" });
  } else if (frame.kind === "tcp") {
    const tcpFrames = frames;
    const events = tcpFrames.filter((f) => f.event);
    const peak = Math.max(...tcpFrames.map((f) => f.cwnd));
    const avg = tcpFrames.reduce((sum, f) => sum + f.cwnd, 0) / tcpFrames.length;
    rows.push({ label: "peak window", value: `${peak} MSS` });
    rows.push({ label: "mean window", value: `${pad(avg, 1)} MSS` });
    rows.push({ label: "congestion events", value: String(events.length), hint: events.map((e) => `${e.rtt}: ${e.event}`).join(" \xB7 ") });
  } else if (frame.kind === "cache") {
    const total = frame.hits + frame.misses;
    rows.push({ label: "hit ratio", value: `${Math.round(frame.hits / Math.max(1, total) * 100)}%` });
    rows.push({ label: "conflict misses", value: String(frames.filter((f) => f.kind === "cache" && !f.hit && f.evicted !== null).length) });
    rows.push({ label: "cold misses", value: String(frames.filter((f) => f.kind === "cache" && !f.hit && f.evicted === null).length) });
  }
  return rows;
}
function CsLabs({ onOpenPass }) {
  const tr = useT();
  const lang = useUiLanguage();
  const [subject, setSubject] = useState2("all");
  const [topicId, setTopicId] = useState2(globalThis.__CSL_T);
  const topic = csTopicById(topicId);
  const [input, setInput] = useState2(globalThis.__CSL_INPUT ?? topic.defaultInput);
  const [algorithm, setAlgorithm] = useState2(globalThis.__CSL_A);
  const [index, setIndex] = useState2(globalThis.__CSL_I | 0);
  const [playing, setPlaying] = useState2(false);
  const [speed, setSpeed] = useState2(1);
  const [spoken, setSpoken] = useState2(false);
  const [tab, setTab] = useState2("deep");
  const frames = useMemo(() => topic.run(input, algorithm), [topic, input, algorithm]);
  const atEnd = index >= frames.length - 1;
  const frame = frames[Math.min(index, Math.max(0, frames.length - 1))];
  useEffect2(() => {
    setInput(topic.defaultInput);
    setIndex(0);
    setPlaying(false);
  }, [topicId, topic.defaultInput]);
  useEffect2(() => {
    if (!playing) return;
    if (index >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setIndex((i) => Math.min(i + 1, frames.length - 1)), 1500 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, index, frames.length, speed]);
  useEffect2(() => {
    if (!spoken) {
      stopSpeaking();
      return;
    }
    if (!frame) return;
    speak(`${frame.caption}. ${frame.detail}`, { lang, mood: "think" });
  }, [spoken, frame, lang]);
  useEffect2(() => () => stopSpeaking(), []);
  useEffect2(() => {
    const onKey = (event) => {
      const target = event.target;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPlaying(false);
        setIndex((i) => Math.min(i + 1, frames.length - 1));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPlaying(false);
        setIndex((i) => Math.max(0, i - 1));
      }
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [frames.length]);
  const visibleTopics = subject === "all" ? csTopics : csTopics.filter((t) => t.subject === subject);
  const compare = useMemo(() => {
    if (topic.id !== "cpu-scheduling") return [];
    return cpuAlgorithms.map((option) => {
      const run = runCpu(option.id, input, 2);
      const m = cpuMetrics(run);
      return { ...option, avgWait: m.avgWait, avgTurnaround: m.avgTurnaround };
    });
  }, [topic.id, input]);
  const associativity = useMemo(() => topic.id === "cache-lru" ? cacheSummary(input) : null, [topic.id, input]);
  const worstWait = Math.max(1e-3, ...compare.map((c) => c.avgWait));
  return /* @__PURE__ */ jsxs("section", { className: "cslabs", children: [
    /* @__PURE__ */ jsxs("header", { className: "csl-top", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("span", { className: "csl-kicker", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 12 }),
          " CORE COMPUTER SCIENCE \xB7 SIMULATED"
        ] }),
        /* @__PURE__ */ jsx("h1", { children: "CS Labs" }),
        /* @__PURE__ */ jsx("p", { children: tr("cslabs.sub") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "csl-subjects", role: "group", "aria-label": "Subjects", children: [
        /* @__PURE__ */ jsx("button", { className: subject === "all" ? "active" : "", onClick: () => setSubject("all"), children: "All" }),
        csSubjects.map((entry) => {
          const Icon = subjectIcon[entry.id];
          return /* @__PURE__ */ jsxs("button", { className: subject === entry.id ? "active" : "", onClick: () => setSubject(entry.id), children: [
            /* @__PURE__ */ jsx(Icon, { size: 14 }),
            " ",
            entry.label
          ] }, entry.id);
        })
      ] })
    ] }),
    /* @__PURE__ */ jsx("nav", { className: "csl-topics", "aria-label": "Topics", children: visibleTopics.map((entry) => /* @__PURE__ */ jsxs("button", { className: entry.id === topicId ? "active" : "", onClick: () => setTopicId(entry.id), "aria-pressed": entry.id === topicId, children: [
      /* @__PURE__ */ jsx("strong", { children: entry.title }),
      /* @__PURE__ */ jsx("small", { children: entry.blurb })
    ] }, entry.id)) }),
    /* @__PURE__ */ jsxs("div", { className: "csl-board", children: [
      /* @__PURE__ */ jsxs("aside", { className: "csl-panel csl-side", children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          tr("cslabs.workload"),
          " ",
          /* @__PURE__ */ jsx("em", { children: topic.inputLabel })
        ] }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: input,
            onChange: (event) => {
              setInput(event.target.value);
              setIndex(0);
              setPlaying(false);
            },
            rows: 4,
            spellCheck: false,
            "aria-label": topic.inputLabel
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "csl-side-actions", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => {
            setInput(topic.defaultInput);
            setIndex(0);
          }, children: [
            /* @__PURE__ */ jsx(RotateCcw, { size: 13 }),
            " ",
            tr("cslabs.sample")
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            frames.length,
            " ",
            tr("cslabs.steps")
          ] })
        ] }),
        topic.hasAlgorithm && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("h3", { className: "spaced", children: tr("cslabs.algorithm") }),
          /* @__PURE__ */ jsx("div", { className: "csl-algos", children: cpuAlgorithms.map((option) => /* @__PURE__ */ jsx("button", { className: option.id === algorithm ? "active" : "", onClick: () => {
            setAlgorithm(option.id);
            setIndex(0);
            setPlaying(false);
          }, title: option.note, children: option.label }, option.id)) }),
          /* @__PURE__ */ jsx("p", { className: "csl-note", children: cpuAlgorithms.find((o) => o.id === algorithm)?.note }),
          /* @__PURE__ */ jsx("h3", { className: "spaced", children: "Same workload, four policies" }),
          /* @__PURE__ */ jsx("ul", { className: "csl-compare", children: compare.map((row) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", { onClick: () => {
            setAlgorithm(row.id);
            setIndex(0);
          }, className: row.id === algorithm ? "active" : "", children: [
            /* @__PURE__ */ jsx("span", { className: "csl-compare-label", children: row.label }),
            /* @__PURE__ */ jsx("span", { className: "csl-compare-bar", style: { width: `${row.avgWait / worstWait * 100}%`, background: colorFor(row.id) } }),
            /* @__PURE__ */ jsx("b", { children: pad(row.avgWait, 2) })
          ] }) }, row.id)) }),
          /* @__PURE__ */ jsx("p", { className: "csl-note", children: "Average waiting time in units. Lower is better - SJF is the provable minimum for this set of jobs." })
        ] }),
        associativity && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("h3", { className: "spaced", children: "What associativity buys" }),
          /* @__PURE__ */ jsx("ul", { className: "csl-compare", children: [["direct-mapped", associativity.direct], ["2-way", associativity.twoWay], ["4-way", associativity.fourWay], ["as configured", associativity.configured]].map(([label, value]) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("span", { className: "csl-compare-label", children: label }),
            /* @__PURE__ */ jsx("span", { className: "csl-compare-bar", style: { width: `${Math.max(3, value * 100)}%`, background: colorFor(label) } }),
            /* @__PURE__ */ jsxs("b", { children: [
              Math.round(value * 100),
              "%"
            ] })
          ] }, label)) }),
          /* @__PURE__ */ jsx("p", { className: "csl-note", children: "Identical trace, identical capacity. Only the number of ways changed - the difference is conflict misses." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "csl-stage", children: [
        /* @__PURE__ */ jsx("div", { className: "csl-canvas", children: frame ? renderFrame(frame, frames) : /* @__PURE__ */ jsx("div", { className: "csl-empty", children: "Type a workload above to run the simulation." }) }),
        /* @__PURE__ */ jsxs("div", { className: "csl-transport", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setPlaying(false);
            setIndex(0);
          }, title: tr("cslabs.reset"), "aria-label": tr("cslabs.reset"), children: /* @__PURE__ */ jsx(RotateCcw, { size: 15 }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setPlaying(false);
            setIndex((i) => Math.max(0, i - 1));
          }, disabled: index === 0, title: tr("cslabs.prev"), "aria-label": tr("cslabs.prev"), children: /* @__PURE__ */ jsx(ChevronLeft, { size: 16 }) }),
          /* @__PURE__ */ jsxs("button", { className: "csl-play", onClick: () => {
            if (atEnd) setIndex(0);
            setPlaying((p) => !p);
          }, children: [
            playing ? /* @__PURE__ */ jsx(Pause, { size: 15 }) : /* @__PURE__ */ jsx(Play, { size: 15 }),
            " ",
            playing ? tr("cslabs.pause") : tr("cslabs.play")
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setPlaying(false);
            setIndex((i) => Math.min(frames.length - 1, i + 1));
          }, disabled: atEnd, title: tr("cslabs.next"), "aria-label": tr("cslabs.next"), children: /* @__PURE__ */ jsx(ChevronRight, { size: 16 }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              min: 0,
              max: Math.max(0, frames.length - 1),
              value: Math.min(index, Math.max(0, frames.length - 1)),
              onChange: (event) => {
                setPlaying(false);
                setIndex(Number(event.target.value));
              },
              "aria-label": tr("cslabs.steps")
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "csl-count", children: [
            frames.length ? index + 1 : 0,
            /* @__PURE__ */ jsxs("i", { children: [
              "/",
              frames.length
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "csl-speed", children: [
            tr("cslabs.speed"),
            /* @__PURE__ */ jsx("select", { value: speed, onChange: (event) => setSpeed(Number(event.target.value)), children: [0.5, 1, 2, 4].map((value) => /* @__PURE__ */ jsxs("option", { value, children: [
              value,
              "x"
            ] }, value)) })
          ] })
        ] }),
        frame && /* @__PURE__ */ jsxs("article", { className: "csl-why", children: [
          /* @__PURE__ */ jsxs("header", { children: [
            /* @__PURE__ */ jsx("span", { className: "csl-why-kicker", children: tr("cslabs.why") }),
            /* @__PURE__ */ jsx("h2", { children: frame.caption }),
            voiceSupported && /* @__PURE__ */ jsx("button", { className: "csl-voice", onClick: () => {
              if (spoken) {
                setSpoken(false);
                stopSpeaking();
              } else {
                setSpoken(true);
                speak(`${frame.caption}. ${frame.detail}`, { lang, mood: "think" });
              }
            }, "aria-pressed": spoken, children: spoken ? /* @__PURE__ */ jsx(VolumeX, { size: 14 }) : /* @__PURE__ */ jsx(Volume2, { size: 14 }) })
          ] }),
          /* @__PURE__ */ jsx("p", { children: frame.detail })
        ] }),
        frame && /* @__PURE__ */ jsxs("div", { className: "csl-metrics", children: [
          /* @__PURE__ */ jsxs("h3", { children: [
            /* @__PURE__ */ jsx(Activity, { size: 14 }),
            " ",
            tr("cslabs.metrics")
          ] }),
          /* @__PURE__ */ jsx("div", { children: metricsOf(frame, frames).map((row) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { children: row.label }),
            /* @__PURE__ */ jsx("strong", { children: row.value }),
            row.hint && /* @__PURE__ */ jsx("small", { children: row.hint })
          ] }, row.label)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "csl-panel csl-read", children: [
        /* @__PURE__ */ jsxs("div", { className: "csl-tabs", children: [
          /* @__PURE__ */ jsxs("button", { className: tab === "deep" ? "active" : "", onClick: () => setTab("deep"), children: [
            /* @__PURE__ */ jsx(Lightbulb, { size: 13 }),
            " ",
            tr("cslabs.deep")
          ] }),
          /* @__PURE__ */ jsxs("button", { className: tab === "traps" ? "active" : "", onClick: () => setTab("traps"), children: [
            /* @__PURE__ */ jsx(TriangleAlert, { size: 13 }),
            " ",
            tr("cslabs.traps")
          ] }),
          /* @__PURE__ */ jsxs("button", { className: tab === "interview" ? "active" : "", onClick: () => setTab("interview"), children: [
            /* @__PURE__ */ jsx(Sigma, { size: 13 }),
            " ",
            tr("cslabs.interview")
          ] })
        ] }),
        tab === "deep" && /* @__PURE__ */ jsxs("div", { className: "csl-readbody", children: [
          /* @__PURE__ */ jsx("p", { className: "csl-concept", children: topic.read.concept }),
          /* @__PURE__ */ jsx("h4", { children: tr("cslabs.mechanism") }),
          /* @__PURE__ */ jsx("ol", { children: topic.read.mechanism.map((line) => /* @__PURE__ */ jsx("li", { children: line }, line)) }),
          /* @__PURE__ */ jsx("h4", { children: tr("cslabs.formulas") }),
          /* @__PURE__ */ jsx("ul", { className: "csl-formulas", children: topic.read.formulas.map((line) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("code", { children: line }) }, line)) })
        ] }),
        tab === "traps" && /* @__PURE__ */ jsxs("div", { className: "csl-readbody", children: [
          /* @__PURE__ */ jsx("h4", { children: "The mistakes interviewers listen for" }),
          /* @__PURE__ */ jsx("ul", { className: "csl-traps", children: topic.read.traps.map((line) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx(TriangleAlert, { size: 12 }),
            " ",
            line
          ] }, line)) })
        ] }),
        tab === "interview" && /* @__PURE__ */ jsx("div", { className: "csl-readbody", children: topic.read.interview.map((qa) => /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsx("summary", { children: qa.q }),
          /* @__PURE__ */ jsx("p", { children: qa.a })
        ] }, qa.q)) }),
        /* @__PURE__ */ jsxs("button", { className: "csl-bridge", onClick: onOpenPass, children: [
          /* @__PURE__ */ jsx(GitBranch, { size: 13 }),
          " ",
          tr("guru.mentor")
        ] })
      ] })
    ] })
  ] });
}

// csl-render-check.mjs.ts
var g = globalThis;
g.__CSL_T = "cpu-scheduling";
g.__CSL_I = 0;
g.__CSL_A = "fcfs";
g.__CSL_INPUT = void 0;
var origWarn = console.warn;
var origError = console.error;
var failures = 0;
var ok = (label, pass, extra) => {
  if (!pass) failures++;
  console.log((pass ? "ok   " : "FAIL ") + label + (extra === void 0 || extra === "" ? "" : "  [" + extra + "]"));
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
    html = renderToStaticMarkup(createElement(CsLabs, { key: topic + "-" + index + "-" + algo, onOpenPass: () => {
    } }));
  } catch (e) {
    crash = String(e && e.message ? e.message : e);
  }
  console.warn = origWarn;
  console.error = origError;
  return { html, crash, noise: noise.filter((n) => !/useLayoutEffect|server renderer/.test(n)) };
}
var dirty = [/\bNaN\b/, /Infinity/, />undefined[ <]/, /"undefined"/, /\bundefinedpx\b/];
for (const topic of csTopics) {
  const algos = topic.hasAlgorithm ? ["fcfs", "sjf", "srtf", "rr"] : ["fcfs"];
  for (const algo of algos) {
    const r = mount(topic.id, 0, algo);
    ok(topic.id + "/" + algo + " mounts", !r.crash, r.crash || r.html.length + "b");
    if (r.crash) continue;
    ok(topic.id + "/" + algo + " draws the stage", /<svg/.test(r.html));
    ok(topic.id + "/" + algo + " draws the explanation", r.html.includes(topic.title));
    ok(topic.id + "/" + algo + " no react warnings", r.noise.length === 0, r.noise.slice(0, 1).join("").slice(0, 90));
    const hits = dirty.filter((re) => re.test(r.html));
    ok(topic.id + "/" + algo + " geometry is finite", hits.length === 0, hits.map(String).join(" "));
  }
}
for (const topic of csTopics) {
  const issues = [];
  let last = 0;
  for (let i = 0; i < 260; i++) {
    const r = mount(topic.id, i, "srtf");
    last = i;
    if (r.crash) {
      issues.push("#" + i + " crash: " + r.crash.slice(0, 70));
      break;
    }
    if (dirty.some((re) => re.test(r.html))) issues.push("#" + i + " dirty");
    if (r.noise.length) issues.push("#" + i + " warn: " + r.noise[0].slice(0, 60));
  }
  ok(topic.id + " swept " + last + " frames clean", issues.length === 0, issues.slice(0, 3).join(" ~ "));
}
var junk = ["", "x", "P1:0:5,", "5,5,5,5", "alloc=;max=;avail=", "sets=0,ways=0,seq=", "a=b=c", ";;;;", "P1:abc:def"];
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
