// Core CS simulations. Every frame is computed, never faked: these functions
// are pure and deterministic so the numbers on screen are the real algorithm's
// numbers. A student can paste their own workload and the animation re-derives.

export type CsSubject = "os" | "db" | "network" | "arch" | "dsa";

export type GanttBlock = { pid: string; start: number; end: number; idle?: boolean };

export type CpuFrame = {
  kind: "cpu";
  time: number;
  running: string | null;
  ready: string[];
  gantt: GanttBlock[];
  finished: { pid: string; arrival: number; burst: number; completion: number; turnaround: number; waiting: number }[];
  caption: string;
  detail: string;
};

export type PagingFrame = {
  kind: "paging";
  index: number;
  address: number;
  page: number;
  offset: number;
  pageBin: string;
  offsetBin: string;
  tlbHit: boolean;
  walked: boolean;
  tlb: { page: number; frame: number }[];
  table: number[];
  frame: number;
  physical: number;
  hits: number;
  misses: number;
  caption: string;
  detail: string;
};

export type BankerFrame = {
  kind: "banker";
  processes: string[];
  resources: string[];
  allocation: number[][];
  need: number[][];
  available: number[];
  work: number[];
  finish: boolean[];
  sequence: string[];
  examining: string | null;
  requested: number[] | null;
  phase: "request" | "trial" | "verdict";
  granted: boolean | null;
  caption: string;
  detail: string;
};

export type TreeNode = { id: number; leaf: boolean; keys: number[]; children: number[] };
export type TreeFrame = {
  kind: "tree";
  step: number;
  inserted: number;
  keys: number[];
  nodes: TreeNode[];
  root: number;
  touched: number[];
  split: boolean;
  action: "descend" | "insert" | "split" | "promote" | "newroot";
  caption: string;
  detail: string;
};

export type TcpFrame = {
  kind: "tcp";
  rtt: number;
  cwnd: number;
  ssthresh: number;
  phase: "slow-start" | "congestion-avoidance" | "recovery";
  event: string | null;
  points: { rtt: number; cwnd: number }[];
  caption: string;
  detail: string;
};

export type CacheFrame = {
  kind: "cache";
  step: number;
  address: number;
  tag: number;
  set: number;
  ways: ({ tag: number | null; stamp: number }[])[];
  hit: boolean;
  evicted: number | null;
  hits: number;
  misses: number;
  trace: string[];
  caption: string;
  detail: string;
};

export type CsFrame = CpuFrame | PagingFrame | BankerFrame | TreeFrame | TcpFrame | CacheFrame;

export type CsReading = {
  concept: string;
  mechanism: string[];
  formulas: string[];
  traps: string[];
  interview: { q: string; a: string }[];
};

export type CpuAlgorithmId = "fcfs" | "sjf" | "srtf" | "rr";

export const cpuAlgorithms: { id: CpuAlgorithmId; label: string; note: string }[] = [
  { id: "fcfs", label: "FCFS", note: "First come first served - non-preemptive, convoy effect" },
  { id: "sjf", label: "SJF", note: "Shortest job first - optimal average wait, needs burst length" },
  { id: "srtf", label: "SRTF", note: "Shortest remaining time first - preemptive SJF" },
  { id: "rr", label: "Round robin", note: "Time slicing - response time is what you buy" },
];

type Proc = { pid: string; arrival: number; burst: number; remaining: number };

function parseProcs(input: string): Proc[] {
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

function labelList(list: string[]) {
  return list.length ? list.join(", ") : "none";
}

function pushBlock(gantt: GanttBlock[], pid: string | null, t: number) {
  const last = gantt[gantt.length - 1];
  if (last && last.pid === (pid ?? "idle") && last.end === t) {
    last.end = t + 1;
    return;
  }
  gantt.push({ pid: pid ?? "idle", start: t, end: t + 1, idle: pid === null });
}

export function runCpu(algorithm: CpuAlgorithmId, input: string, quantum = 2): CpuFrame[] {
  const procs = parseProcs(input);
  if (!procs.length) return [];
  for (const p of procs) {
    (p as Proc & { completion?: number; served?: number }).completion = 0;
    (p as Proc & { completion?: number; served?: number }).served = 0;
  }
  const frames: CpuFrame[] = [];
  const gantt: GanttBlock[] = [];
  const totalBurst = procs.reduce((sum, p) => sum + p.burst, 0);
  const horizon = totalBurst + Math.max(...procs.map((p) => p.arrival)) + 4;
  const queue = procs.slice().sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid));
  const fifo: Proc[] = [];
  let fillIndex = 0;
  let sliceLeft = 0;
  let current: Proc | null = null;

  for (let t = 0; t <= horizon; t += 1) {
    const arrived = queue.filter((p) => p.arrival <= t);
    const pending = arrived.filter((p) => p.remaining > 0);
    if (pending.length === 0) {
      if (procs.every((p) => p.remaining <= 0)) break;
      pushBlock(gantt, null, t);
      frames.push({
        kind: "cpu", time: t, running: null, ready: [],
        gantt: gantt.map((b) => ({ ...b })), finished: doneRows(procs),
        caption: `t = ${t} · CPU idle`,
        detail: algorithm === "rr"
          ? `Nothing has arrived yet or everything is finished; an idle tick is pure lost throughput, which is why the scheduler never blocks holding the CPU.`
          : `No runnable process at t = ${t}. Idle time is charged to nobody, but it inflates average turnaround for the ones that came later.`,
      });
      continue;
    }

    if (algorithm === "rr") {
      while (fillIndex < queue.length && queue[fillIndex].arrival <= t) fifo.push(queue[fillIndex++]);
      if (current && current.remaining <= 0) current = null;
      if (!current) {
        current = fifo.shift() ?? null;
        if (current) sliceLeft = quantum;
      }
    } else if (algorithm === "srtf") {
      current = pending.slice().sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival)[0];
    } else if (algorithm === "sjf") {
      if (!current || current.remaining === 0 || !pending.includes(current)) {
        current = pending.slice().sort((a, b) => a.burst - b.burst || a.arrival - b.arrival)[0];
      }
    } else {
      if (!current || current.remaining === 0 || !pending.includes(current)) {
        current = pending.slice().sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid))[0];
      }
    }

    if (!current) continue;
    const running = current;
    running.remaining -= 1;
    (running as Proc & { served?: number }).served = ((running as Proc & { served?: number }).served ?? 0) + 1;
    const served = (running as Proc & { served?: number }).served ?? 0;
    const wasPreempted = algorithm === "srtf" || (algorithm === "rr" && served % quantum === 1 && running.burst > quantum);
    pushBlock(gantt, running.pid, t);
    if (running.remaining === 0) (running as Proc & { completion?: number }).completion = t + 1;
    if (algorithm === "rr") {
      sliceLeft -= 1;
      if (running.remaining > 0 && sliceLeft <= 0) fifo.push(running);
      if (running.remaining === 0 || sliceLeft <= 0) current = null;
    }

    const ready = algorithm === "rr"
      ? [...fifo, ...(current && current !== running && current.remaining > 0 ? [current] : [])].filter((p) => p !== running && p.remaining > 0).map((p) => p.pid)
      : pending.filter((p) => p !== running).map((p) => p.pid);
    const choice = algorithm === "srtf"
      ? `Smallest remaining time wins: ${running.pid} had ${running.remaining + 1} unit${running.remaining + 1 > 1 ? "s" : ""} left.`
      : algorithm === "sjf"
        ? `Shortest total burst among the arrived jobs: ${running.pid} needs ${running.burst} units.`
        : algorithm === "rr"
          ? `Round robin with quantum q = ${quantum}: ${running.pid} owns slice slot ${quantum - sliceLeft}/${quantum}.`
          : `FCFS never looks at length: ${running.pid} is simply the earliest arrival still unfinished.`;
    frames.push({
      kind: "cpu", time: t + 1, running: running.pid, ready,
      gantt: gantt.map((b) => ({ ...b })), finished: doneRows(procs),
      caption: running.remaining === 0
        ? `t = ${t + 1} · ${running.pid} completes`
        : wasPreempted
          ? `t = ${t + 1} · ${running.pid} runs${algorithm === "rr" ? " (new slice)" : " (pre-empted in)"}`
          : `t = ${t + 1} · ${running.pid} runs`,
      detail: running.remaining === 0
        ? `${running.pid} finished at ${t + 1}: turnaround ${t + 1 - running.arrival}, waiting ${t + 1 - running.arrival - running.burst}. ${labelList(ready)} are still waiting, so their wait grows by this unit too.`
        : `${choice} Ready queue: ${labelList(ready)}.`,
    });
  }

  if (frames.length && procs.every((p) => p.remaining <= 0)) {
    const end = gantt.length ? gantt[gantt.length - 1].end : 0;
    const rows = doneRows(procs);
    const avg = rows.reduce((sum, r) => sum + r.waiting, 0) / Math.max(1, rows.length);
    frames.push({
      kind: "cpu", time: end, running: null, ready: [],
      gantt: gantt.map((b) => ({ ...b })), finished: rows,
      caption: `Schedule complete at t = ${end} · average wait ${avg.toFixed(2)}`,
      detail: `Every job is off the CPU. Average waiting time is the sum of (turnaround - burst) divided by ${rows.length} processes, and ${algorithm === "sjf" || algorithm === "srtf" ? "shortest-job-first is provably the minimum this workload allows - no other order of these same arrivals can beat it" : "the order chosen here is exactly what the policy promised, which is why the same four jobs give a different average under SJF and SRTF"}. The CPU was busy the whole time, so throughput is saturated and only ordering cost anything.`,
    });
  }
  return frames;
}

function doneRows(procs: Proc[]): CpuFrame["finished"] {
  return procs.filter((p) => p.remaining === 0).map((p) => {
    const completion = (p as Proc & { completion?: number }).completion ?? 0;
    const turnaround = completion - p.arrival;
    return { pid: p.pid, arrival: p.arrival, burst: p.burst, completion, turnaround, waiting: turnaround - p.burst };
  });
}

export function cpuMetrics(frames: CpuFrame[]) {
  const last = frames[frames.length - 1];
  if (!last || !last.finished.length) return { avgWait: 0, avgTurnaround: 0, cpuUse: 0, count: 0 };
  const avgWait = last.finished.reduce((sum, f) => sum + f.waiting, 0) / last.finished.length;
  const avgTurnaround = last.finished.reduce((sum, f) => sum + f.turnaround, 0) / last.finished.length;
  const span = last.gantt.length ? last.gantt[last.gantt.length - 1].end - last.gantt[0].start : frames.length;
  const busy = last.gantt.filter((b) => !b.idle).reduce((sum, b) => sum + (b.end - b.start), 0);
  return { avgWait, avgTurnaround, cpuUse: span ? busy / span : 0, count: last.finished.length };
}

export const intOf = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// A value is itself often a comma-separated list, so a field only ends at a
// separator that is followed by another `key=`.
export function fieldMap(input: string): Map<string, string> {
  const map = new Map<string, string>();
  const pattern = /([a-z][a-z0-9_]*)\s*=\s*([\s\S]*?)(?=[,;\n]+\s*[a-z][a-z0-9_]*\s*=|$)/gi;
  let match = pattern.exec(input);
  while (match) {
    const key = match[1].toLowerCase().replace(/\s/g, "");
    if (!map.has(key)) map.set(key, match[2].trim());
    match = pattern.exec(input);
  }
  return map;
}

const numList = (value: string) => value.split(/[,\s;]+/).filter(Boolean).map((token) => Number.parseInt(token, 10)).filter((n) => Number.isFinite(n));

export type PagingConfig = { pageSize: number; table: number[]; tlbSize: number; addresses: number[] };

export function parsePaging(input: string): PagingConfig {
  const fields = fieldMap(input);
  const pageSize = Math.max(2, intOf(fields.get("pagesize") ?? "16", 16));
  const table = numList(fields.get("table") ?? "3,7,1,5,0,6,2,4");
  const tlbSize = Math.max(1, intOf(fields.get("tlb") ?? "2", 2));
  const addresses = numList(fields.get("addrs") ?? "5,20,100,21,116,5");
  return { pageSize, table, tlbSize, addresses };
}

function bits(value: number, width: number) {
  return value.toString(2).padStart(width, "0");
}

export function runPaging(input: string): PagingFrame[] {
  const config = parsePaging(input);
  const offsetBits = Math.floor(Math.log2(config.pageSize));
  const pageBits = Math.max(1, Math.ceil(Math.log2(Math.max(2, config.table.length))));
  const tlb: { page: number; frame: number }[] = [];
  const frames: PagingFrame[] = [];
  let hits = 0;
  let misses = 0;

  config.addresses.forEach((address, index) => {
    const page = Math.floor(address / config.pageSize);
    const offset = address % config.pageSize;
    if (page >= config.table.length) {
      frames.push({
        kind: "paging", index, address, page, offset, pageBin: bits(page, pageBits), offsetBin: bits(offset, offsetBits),
        tlbHit: false, walked: false, tlb: tlb.map((e) => ({ ...e })), table: [...config.table], frame: -1, physical: -1,
        hits, misses,
        caption: `Address ${address} · page ${page} has no entry`,
        detail: `The page table only has ${config.table.length} entries, so this reference is out of range - a real MMU raises a page fault (or a segmentation fault when the page is unmapped).`,
      });
      return;
    }
    const tlbSlot = tlb.findIndex((entry) => entry.page === page);
    const tlbHit = tlbSlot >= 0;
    let frame: number;
    if (tlbHit) {
      frame = tlb[tlbSlot].frame;
      hits += 1;
      // LRU refresh: move the entry to the back.
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
      kind: "paging", index, address, page, offset, pageBin: bits(page, pageBits), offsetBin: bits(offset, offsetBits),
      tlbHit, walked: !tlbHit, tlb: tlb.map((e) => ({ ...e })), table: [...config.table], frame, physical, hits, misses,
      caption: `Address ${address} · page ${page} offset ${offset} -> frame ${frame} -> physical ${physical}`,
      detail: tlbHit
        ? `TLB hit on page ${page}: ${hits} hits so far, and one memory access instead of two. Cached translations are the whole reason virtual memory is affordable - ${Math.round((hits / (hits + misses)) * 100)}% hit rate at ${config.addresses.length} references.`
        : `TLB miss on page ${page}: the hardware walks the page table entry (frame ${frame}), which doubles the access cost, then installs the pair in the ${config.tlbSize}-entry TLB and evicts ${config.tlbSize < tlb.length + 1 ? "the least recently used" : "nothing"}.`,
    });
  });
  return frames;
}

export type BankerConfig = { processes: string[]; resources: string[]; allocation: number[][]; max: number[][]; available: number[]; requests: { pid: string; need: number[] }[] };

export function parseBanker(input: string): BankerConfig {
  const fields = fieldMap(input);
  const rows = (value: string) => value.split(/[;\s,]+/).filter(Boolean).map((row) => row.split("").filter((c) => /\d/.test(c)).map(Number));
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

export function runBanker(input: string): BankerFrame[] {
  const config = parseBanker(input);
  const need = config.allocation.map((row, i) => row.map((value, r) => config.max[i][r] - value));
  const frames: BankerFrame[] = [];
  let available = [...config.available];
  let allocation = config.allocation.map((row) => [...row]);
  let needMatrix = need.map((row) => [...row]);
  const base = () => ({
    processes: config.processes, resources: config.resources,
    allocation: allocation.map((row) => [...row]), need: needMatrix.map((row) => [...row]),
    available: [...available],
  });

  frames.push({
    kind: "banker", ...base(), work: [...available], finish: config.processes.map(() => false),
    sequence: [], examining: null, requested: null, phase: "trial", granted: null,
    caption: "Start · NEED = MAX - ALLOCATION",
    detail: `Available = (${available.join(", ")}) across (${config.resources.join(", ")}). Each process declares its worst case in MAX, so the most it can still ask for is NEED = MAX - ALLOCATION. Every decision below is made against those two matrices only.`,
  });

  for (const request of config.requests) {
    const pidIndex = config.processes.indexOf(request.pid);
    if (pidIndex < 0) continue;
    const exceeds = request.need.some((value, r) => value > needMatrix[pidIndex][r]);
    const unavailable = request.need.some((value, r) => value > available[r]);
    frames.push({
      kind: "banker", ...base(), work: [...available], finish: config.processes.map(() => false),
      sequence: [], examining: request.pid, requested: request.need, phase: "request", granted: null,
      caption: `${request.pid} requests (${request.need.join(", ")})`,
      detail: exceeds
        ? `Rejected immediately: (${request.need.join(", ")}) is more than ${request.pid}'s remaining NEED (${needMatrix[pidIndex].join(", ")}), so the request itself is illegal - the process exceeded its declared maximum.`
        : unavailable
          ? `${request.pid} stays blocked: the system does not physically hold (${request.need.join(", ")}) right now, available is only (${available.join(", ")}). It waits without pretending to have been granted.`
          : `Request is within NEED and within AVAILABLE, so the bank can consider it - but only if the state after pretending to grant it is still safe.`,
    });
    if (exceeds || unavailable) continue;

    const trialAvailable = available.map((value, r) => value - request.need[r]);
    const trialAllocation = allocation.map((row, i) => (i === pidIndex ? row.map((value, r) => value + request.need[r]) : [...row]));
    const trialNeed = needMatrix.map((row, i) => (i === pidIndex ? row.map((value, r) => value - request.need[r]) : [...row]));
    const finish = config.processes.map(() => false);
    const sequence: string[] = [];
    let work = [...trialAvailable];

    for (let pass = 0; pass < config.processes.length; pass += 1) {
      let progressed = false;
      for (let i = 0; i < config.processes.length; i += 1) {
        if (finish[i]) continue;
        const fits = trialNeed[i].every((value, r) => value <= work[r]);
        frames.push({
          kind: "banker",
          processes: config.processes, resources: config.resources,
          allocation: trialAllocation.map((row) => [...row]), need: trialNeed.map((row) => [...row]),
          available: [...trialAvailable], work: [...work], finish: [...finish], sequence: [...sequence],
          examining: config.processes[i], requested: request.need, phase: "trial", granted: null,
          caption: `Safety check · can ${config.processes[i]} finish with work = (${work.join(", ")})?`,
          detail: fits
            ? `NEED (${trialNeed[i].join(", ")}) <= work (${work.join(", ")}), so ${config.processes[i]} can run to completion on the hypothetical grant and then release its whole allocation (${trialAllocation[i].join(", ")}). Work grows to (${work.map((value, r) => value + trialAllocation[i][r]).join(", ")}).`
            : `NEED (${trialNeed[i].join(", ")}) is not <= work (${work.join(", ")}) yet, so ${config.processes[i]} must wait behind somebody who can already finish.`,
        });
        if (!fits) continue;
        finish[i] = true;
        sequence.push(config.processes[i]);
        work = work.map((value, r) => value + trialAllocation[i][r]);
        progressed = true;
      }
      if (!progressed) break;
    }

    const safe = finish.every(Boolean);
    frames.push({
      kind: "banker", ...base(), work: [...work], finish: [...finish], sequence,
      examining: null, requested: request.need, phase: "verdict", granted: safe,
      caption: safe
        ? `GRANTED · safe sequence <${sequence.join(", ")}>`
        : `DENIED · no safe sequence exists, request rolled back`,
      detail: safe
        ? `Granting (${request.need.join(", ")}) to ${request.pid} leaves at least one order in which every process can still finish, so the bank grants it: AVAILABLE becomes (${trialAvailable.join(", ")}). Safe does not mean nothing waits - it means a deadlock is provably avoidable from here.`
        : `Every order leaves at least one process whose NEED exceeds the work it could ever reclaim, so granting this request would enter an unsafe state. Unsafe is not deadlock, but it is where deadlock becomes possible - so the request is denied and nothing changes.`,
    });
    if (safe) {
      available = trialAvailable;
      allocation = trialAllocation;
      needMatrix = trialNeed;
    }
  }
  return frames;
}

const BPLUS_ORDER = 4;

export function runBplus(input: string): TreeFrame[] {
  const keys = input.split(/[,\s]+/).map((token) => Number.parseInt(token, 10)).filter(Number.isFinite);
  const maxLeaf = BPLUS_ORDER - 1;
  const maxInternal = BPLUS_ORDER - 1;
  let nextId = 0;
  const nodes = new Map<number, TreeNode>();
  const rootLeaf: TreeNode = { id: nextId++, leaf: true, keys: [], children: [] };
  nodes.set(rootLeaf.id, rootLeaf);
  let rootId = rootLeaf.id;
  const frames: TreeFrame[] = [];

  const snapshot = () => [...nodes.values()].map((node) => ({ id: node.id, leaf: node.leaf, keys: [...node.keys], children: [...node.children] }));
  const emit = (step: number, inserted: number, touched: number[], action: TreeFrame["action"], split: boolean, caption: string, detail: string) => {
    frames.push({ kind: "tree", step, inserted, keys: keys.slice(0, step), nodes: snapshot(), root: rootId, touched, split, action, caption, detail });
  };

  const descend = (node: TreeNode, key: number) => {
    let index = node.keys.length;
    for (let i = 0; i < node.keys.length; i += 1) {
      if (key < node.keys[i]) { index = i; break; }
    }
    return index;
  };

  let step = 0;

  const insertInto = (node: TreeNode, key: number, at: number, path: number[]): { promote: number; right: TreeNode } | null => {
    if (node.leaf) {
      path.push(node.id);
      emit(at, key, [...path], "descend", false,
        `Insert ${key} · routed to leaf [${node.keys.join(", ") || "empty"}]`,
        `Search descends using separators and stops at a leaf; internal nodes are signposts only. ${key} belongs in this leaf because its range covers the key.`);
      node.keys.push(key);
      node.keys.sort((a, b) => a - b);
      emit(at, key, [...path], "insert", node.keys.length > maxLeaf,
        `${key} placed in leaf [${node.keys.join(", ")}]`,
        `Leaves hold the sorted payload plus a row pointer per key in a real engine. This leaf now holds ${node.keys.length} of ${maxLeaf} keys.`);
      if (node.keys.length <= maxLeaf) return null;
      const mid = Math.ceil(node.keys.length / 2);
      const rightKeys = node.keys.splice(mid);
      const right: TreeNode = { id: nextId++, leaf: true, keys: rightKeys, children: [] };
      nodes.set(right.id, right);
      emit(at, key, [...path, right.id], "split", true,
        `Leaf overflow · split into [${node.keys.join(", ")}] and [${rightKeys.join(", ")}]`,
        `A full leaf splits at the middle and ${rightKeys[0]} is COPIED up, not moved - leaves must keep a complete index. The left leaf also gains a forward sibling pointer to [${rightKeys.join(", ")}], which is exactly why a range scan walks sideways instead of climbing back to the root.`);
      return { promote: rightKeys[0], right };
    }

    const index = descend(node, key);
    const child = nodes.get(node.children[index]) ?? node;
    const split = insertInto(child, key, at, path);
    if (!split) return null;

    node.keys.splice(index, 0, split.promote);
    node.children.splice(index + 1, 0, split.right.id);
    emit(at, key, [...path, node.id], "promote", node.keys.length > maxInternal,
      `Separator ${split.promote} rises into internal [${node.keys.join(", ")}]`,
      `The parent links the new child and routes ${split.promote} to it. This node now holds ${node.keys.length} separators and ${node.children.length} children, against a limit of ${maxInternal} separators and ${BPLUS_ORDER} children.`);
    if (node.keys.length <= maxInternal) return null;

    const mid = Math.ceil(node.keys.length / 2);
    const upKey = node.keys[mid];
    const rightKeys = node.keys.splice(mid + 1);
    node.keys.splice(mid, 1);
    const rightChildren = node.children.splice(mid + 1);
    const right: TreeNode = { id: nextId++, leaf: false, keys: rightKeys, children: rightChildren };
    nodes.set(right.id, right);
    emit(at, key, [...path, right.id], "split", true,
      `Internal overflow · ${upKey} moves up, right half [${rightKeys.join(", ")}]`,
      `An internal split MOVES the middle separator up because separators exist only to route. Left keeps [${node.keys.join(", ")}] with ${node.children.length} children, right takes [${rightKeys.join(", ")}] with ${rightChildren.length}.`);
    return { promote: upKey, right };
  };

  for (const key of keys) {
    step += 1;
    const split = insertInto(nodes.get(rootId)!, key, step, []);
    if (!split) continue;
    const newRoot: TreeNode = { id: nextId++, leaf: false, keys: [split.promote], children: [rootId, split.right.id] };
    nodes.set(newRoot.id, newRoot);
    rootId = newRoot.id;
    emit(step, key, [newRoot.id], "newroot", false,
      `Root split · new root [${newRoot.keys.join(", ")}], the tree grows one level`,
      `Height is added only at the top, which is what guarantees every leaf stays at the same depth and every lookup costs the same number of page reads.`);
  }
  return frames;
}

export type TcpConfig = { ssthresh: number; dupAt: number; timeoutAt: number; rtts: number };

export function parseTcp(input: string): TcpConfig {
  const fields = fieldMap(input);
  return {
    ssthresh: intOf(fields.get("ssthresh") ?? "16", 16),
    dupAt: intOf(fields.get("dupat") ?? "8", 8),
    timeoutAt: intOf(fields.get("timeoutat") ?? "20", 20),
    rtts: Math.max(4, intOf(fields.get("rtts") ?? "26", 26)),
  };
}

export function runTcp(input: string): TcpFrame[] {
  const config = parseTcp(input);
  const frames: TcpFrame[] = [];
  const points: { rtt: number; cwnd: number }[] = [];
  let cwnd = 1;
  let ssthresh = config.ssthresh;
  let phase: TcpFrame["phase"] = "slow-start";
  let event: string | null = null;

  points.push({ rtt: 0, cwnd });
  frames.push({
    kind: "tcp", rtt: 0, cwnd, ssthresh, phase, event: null, points: [...points],
    caption: "RTT 0 · the connection opens with one segment in flight",
    detail: `The sender has no measurement of the path yet, so it puts exactly ${cwnd} MSS on the wire and lets the ACKs tell it the truth. ssthresh = ${ssthresh} is the ceiling above which doubling is considered reckless; everything below it is exponential, everything above is cautious.`,
  });

  for (let rtt = 1; rtt <= config.rtts; rtt += 1) {
    event = null;
    if (rtt === config.dupAt && cwnd > 3) {
      const before = cwnd;
      ssthresh = Math.max(2, Math.floor(cwnd / 2));
      cwnd = ssthresh + 3;
      phase = "recovery";
      event = "3 duplicate ACKs";
      frames.push({ kind: "tcp", rtt, cwnd, ssthresh, phase, event, points: [...points, { rtt, cwnd }],
        caption: `RTT ${rtt} · fast retransmit, cwnd ${before} -> ${ssthresh} (+3)`,
        detail: `Three duplicate ACKs say one segment is missing but the rest kept arriving, so the network is congested but not dead. Reno halves the window to ssthresh = ${ssthresh} and keeps ${cwnd} in flight to honour the outstanding ACKs. Cutting to 1 here would throw away a working path.` });
      points.push({ rtt, cwnd });
      continue;
    }
    if (rtt === config.timeoutAt) {
      const before = cwnd;
      ssthresh = Math.max(2, Math.floor(cwnd / 2));
      cwnd = 1;
      phase = "slow-start";
      event = "retransmission timeout";
      frames.push({ kind: "tcp", rtt, cwnd, ssthresh, phase, event, points: [...points, { rtt, cwnd }],
        caption: `RTT ${rtt} · timeout, cwnd ${before} -> 1`,
        detail: `No ACK at all means the sender cannot tell whether the network is congested or the segment is simply lost, so it behaves defensively: ssthresh = ${ssthresh} and a restart from one segment. This is the single most expensive congestion event - the RTO timer also doubles each time it misfires.` });
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
    frames.push({ kind: "tcp", rtt, cwnd, ssthresh, phase, event, points: [...points],
      caption: `RTT ${rtt} · ${phase === "slow-start" ? "slow start" : "congestion avoidance"} · cwnd = ${cwnd}`,
      detail: phase === "slow-start"
        ? `Every ACK received in this round releases a new one, so a window of ${cwnd / 2} becomes ${cwnd}: exponential growth, and it stops the moment cwnd reaches ssthresh = ${ssthresh}. Slow start is not slow - it is the fastest safe ramp the sender knows.`
        : `Above ssthresh = ${ssthresh} one window of ${cwnd} grows by exactly one segment per RTT. That additive increase, plus multiplicative decrease on loss, is what makes TCP converge to fairness: many flows sharing a bottleneck settle on equal windows because each halves at the same signal.` });
  }
  return frames;
}

export type CacheConfig = { sets: number; ways: number; sequence: number[] };

export function parseCache(input: string): CacheConfig {
  const fields = fieldMap(input);
  const sets = Math.max(1, intOf(fields.get("sets") ?? "4", 4));
  const ways = Math.max(1, intOf(fields.get("ways") ?? "1", 1));
  const sequence = numList(fields.get("seq") ?? "0,8,16,8,40,4,16,12,1,9");
  return { sets, ways, sequence };
}

export function runCache(input: string): CacheFrame[] {
  const config = parseCache(input);
  const ways: ({ tag: number | null; stamp: number }[])[] = [];
  for (let s = 0; s < config.sets; s += 1) ways.push(Array.from({ length: config.ways }, () => ({ tag: null, stamp: -1 })));
  const frames: CacheFrame[] = [];
  let hits = 0;
  let misses = 0;
  const trace: string[] = [];

  config.sequence.forEach((address, step) => {
    const set = address % config.sets;
    const tag = Math.floor(address / config.sets);
    const bucket = ways[set];
    const hitIndex = bucket.findIndex((entry) => entry.tag === tag);
    const hit = hitIndex >= 0;
    let evicted: number | null = null;
    if (hit) {
      hits += 1;
      bucket[hitIndex].stamp = step;
      trace.push(`hit  ${address} -> set ${set}, tag ${tag}`);
    } else {
      misses += 1;
      const victim = bucket.findIndex((entry) => entry.tag === null);
      const lru = bucket.reduce((worst, entry, index) => (entry.stamp < bucket[worst].stamp ? index : worst), 0);
      const target = victim >= 0 ? victim : lru;
      evicted = bucket[target].tag;
      if (evicted !== null) trace.push(`miss ${address} -> set ${set}, evicts ${evicted * config.sets + set} (conflict)`);
      else trace.push(`miss ${address} -> set ${set}, cold fill`);
      bucket[target] = { tag, stamp: step };
    }
    frames.push({
      kind: "cache", step, address, tag, set,
      ways: ways.map((bucketRows) => bucketRows.map((entry) => ({ ...entry }))),
      hit, evicted, hits, misses, trace: [...trace],
      caption: `Access ${address} · set ${set} · tag ${tag} · ${hit ? "HIT" : "MISS"}`,
      detail: hit
        ? `Tag ${tag} already sits in set ${set}, so the line is reused and the LRU rank of that way moves to the front. Total: ${hits} hits, ${misses} misses.`
        : evicted !== null
          ? `Set ${set} is full (${config.ways} way${config.ways > 1 ? "s" : ""}) and tag ${tag} is absent, so ${config.ways === 1 ? "the only way" : "the least recently used way"} is thrown out even though it was still valid - a conflict miss, not a capacity one. This is exactly the thrash a direct-mapped cache cannot avoid when two hot lines share a set.`
          : `No compulsory conflict yet: way is empty, so tag ${tag} is installed without evicting anything. Still a miss - the block had to come from memory either way.`,
    });
  });
  return frames;
}

export function cacheSummary(input: string) {
  const config = parseCache(input);
  const total = Math.max(1, config.sequence.length);
  const rate = (frames: CacheFrame[]) => {
    const last = frames[frames.length - 1];
    return last ? last.hits / total : 0;
  };
  const asConfigured = runCache(input);
  const direct = rate(runCache(`sets=${config.sets},ways=1,seq=${config.sequence.join(",")}`));
  const twoWay = rate(runCache(`sets=${config.sets},ways=2,seq=${config.sequence.join(",")}`));
  const fourWay = rate(runCache(`sets=${config.sets},ways=4,seq=${config.sequence.join(",")}`));
  return { configured: rate(asConfigured), direct, twoWay, fourWay };
}

export type CsTopicId = "cpu-scheduling" | "paging-tlb" | "bankers" | "bplus-tree" | "tcp-congestion" | "cache-lru";

export type CsTopic = {
  id: CsTopicId;
  subject: CsSubject;
  title: string;
  blurb: string;
  inputLabel: string;
  defaultInput: string;
  hasAlgorithm?: boolean;
  run: (input: string, algorithm?: CpuAlgorithmId) => CsFrame[];
  read: CsReading;
};

export const csSubjects: { id: CsSubject; label: string }[] = [
  { id: "os", label: "Operating systems" },
  { id: "db", label: "Databases" },
  { id: "network", label: "Networks" },
  { id: "arch", label: "Architecture" },
];

export const csTopics: CsTopic[] = [
  {
    id: "cpu-scheduling", subject: "os", title: "CPU scheduling",
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
        "Round robin runs each ready process for one quantum then requeues it. Turnaround gets worse as the quantum shrinks toward the context-switch cost, but no process ever waits longer than (n-1) quanta, which is why interactive systems use it.",
      ],
      formulas: [
        "Turnaround time = Completion - Arrival",
        "Waiting time = Turnaround - Burst",
        "Response time = first CPU grant - Arrival (round robin sells response, SJF sells turnaround)",
        "Throughput rises as the quantum rises until the quantum is large enough that preemption stops mattering",
      ],
      traps: [
        "Comparing SJF to FCFS without saying burst lengths must be known or predicted (exponential smoothing in real schedulers).",
        "Calling SRTF 'optimal' - SJF is optimal for average wait; SRTF just reaches further with preemption and can starve.",
        "Forgetting idle ticks: an empty ready queue inflates CPU utilisation, not waiting time.",
        "Quantum too small: with a 4 ms context switch and q = 1 ms the CPU spends most of its time switching, so overhead dominates.",
      ],
      interview: [
        { q: "Why can SJF be unfair and how do real systems fix it?", a: "A stream of short jobs keeps arriving, so a long job is indefinitely deferred - starvation. Fixing it is ageing: raise a waiting job's priority as a function of its wait, which is what Multilevel Feedback Queue schedulers do implicitly by demoting CPU hogs." },
        { q: "Which scheduler would Linux actually use?", a: "CFS - completely fair scheduling. It has no fixed timeslice: it tracks each task's weighted virtual runtime and always runs the one with the least, so 'fair' is defined against the CPU's proportional share instead of a policy tuned per workload." },
        { q: "A system feels laggy under load and you can change one scheduling parameter. Which?", a: "The round-robin quantum, or priority ageing. Laggy means response time is high, so shrink the quantum and increase preemption of CPU-bound tasks - but stop before context-switch overhead becomes visible in the total CPU time." },
      ],
    },
  },
  {
    id: "paging-tlb", subject: "os", title: "Paging + TLB",
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
        "Physical address = frame * pageSize + offset. An unmapped or out-of-range page raises a page fault and the OS brings the page in from disk - the slow path by three orders of magnitude.",
      ],
      formulas: [
        "offset bits = log2(page size), page bits = log2(page table entries)",
        "EAT = hitRate * 1 + (1 - hitRate) * 2 accesses (TLB walk aside, page fault ignored)",
        "Internal fragmentation = (page size - (process size mod page size)) mod page size, worst case one page per process",
        "Physical address = frame * pageSize + offset",
      ],
      traps: [
        "Translating the offset too - it is a straight copy; only the page number is mapped.",
        "Confusing a TLB miss (hardware walk, ~1 extra access) with a page fault (OS involvement, disk I/O, tens of microseconds).",
        "Claiming a bigger page is always better: fewer table entries and a bigger TLB reach, but more internal fragmentation and coarser I/O.",
        "Ignoring ASIDs: without an address-space tag, every context switch would have to flush the whole TLB.",
      ],
      interview: [
        { q: "Why is page size a power of two?", a: "So the split is free in hardware: the offset is the low bits, the page number is the rest, and the arithmetic becomes shift and mask instead of divide. Translation happens on every memory access, so it must be wire-delay cheap." },
        { q: "4 KB pages, 48-bit virtual address, how deep is the page table and what fixes it?", a: "48 - 12 = 36 bits of page number, so a flat table would need 2^36 entries. Multilevel page tables only materialise the branches a process actually touches, and inverted page tables (one entry per physical frame, hashed by address space) trade per-process memory for a lookup hash." },
        { q: "A process thrashes. What do you look at first?", a: "TLB reach and working set. If the hot set exceeds frames * page size, or the access pattern is a strided jump larger than page size, each access touches a new page. Fixes are bigger pages, better locality, or more memory - not more CPU." },
      ],
    },
  },
  {
    id: "bankers", subject: "os", title: "Banker's algorithm",
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
        "Grant only if safe; otherwise roll the pretend-grant back completely.",
      ],
      formulas: [
        "NEED[i][r] = MAX[i][r] - ALLOCATION[i][r]",
        "Safety scan cost = O(processes^2 * resources)",
        "Safe => deadlock-free. Unsafe =/= deadlock: it means the system can no longer guarantee escape.",
        "Four Coffman conditions: mutual exclusion, hold-and-wait, no preemption, circular wait - avoidance only attacks hold-and-wait.",
      ],
      traps: [
        "Saying unsafe means deadlocked. It does not - no cycle exists yet; the guarantee is simply gone.",
        "Forgetting the rollback: a denied request must leave all three matrices untouched.",
        "Not knowing why real operating systems never implement it: maximum claims are unknowable, the process count makes it expensive per request, and blocking a grant reduces utilisation. No OS can promise a worst case it hasn't measured.",
        "Confusing it with deadlock detection, which grants freely and then breaks cycles by killing or preempting.",
      ],
      interview: [
        { q: "What does the work vector actually represent?", a: "Resources reclaimable in the hypothetical future where the processes already marked FINISH run to completion and release everything they hold, including what they would still need to request. It is a promise, not a current stock." },
        { q: "Two safe sequences exist - does the OS commit to one?", a: "No. Safety only proves that some order exists. The scheduler is free to run them in any order; the bank only promised the resources would be there when needed, which is why the guarantee survives scheduling nondeterminism." },
        { q: "How is this different from a semaphore or a lock ordering rule?", a: "Lock ordering is deadlock PREVENTION: it structurally forbids circular wait and costs nothing at request time. Banker's is AVOIDANCE: it permits arbitrary ordering but inspects each request, and it needs the maximum claim, which applications rarely know." },
      ],
    },
  },
  {
    id: "bplus-tree", subject: "db", title: "B+ tree inserts",
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
        "Only a root split adds height, which is why all leaves stay at the same depth and lookups are the same cost.",
      ],
      formulas: [
        "fanout = floor(block size / (key size + pointer size))",
        "height = ceil(log_fanout(rows)) - and height is the number of page reads per lookup",
        "A 16 KB block with 8-byte keys and 6-byte row pointers gives a fanout near 1100, so three levels index hundreds of millions of rows",
        "Amortised insert = one leaf write plus a handful of internal page writes that only happen on 1/fanout of inserts",
      ],
      traps: [
        "Saying 'balanced' means perfectly full. It means same-depth leaves and >= half-full nodes, which is why sequential inserts leave nodes lightly populated unless the engine compacts.",
        "Confusing B-tree (keys at every level, stop early) with B+ tree (keys only in leaves, uniform lookup, linked leaves for ranges).",
        "Forgetting the right sibling pointer: without it, ORDER BY ... LIMIT ranges and index-only scans degrade to root-to-leaf hops per row.",
        "Ignoring that the split point depends on insert order; the same set of keys produces different trees, which matters for point-lookup stability under churn.",
      ],
      interview: [
        { q: "Why not a hash index?", a: "A hash index gives O(1) equality but cannot answer a range, an ORDER BY, a prefix LIKE, or a NOT EXISTS without scanning, and its buckets have to be re-when-resized. B+ tree pays log n for query flexibility that real workloads need. Most engines keep both." },
        { q: "What makes an index 'covering'?", a: "The index leaf already contains every column the query needs, so the engine reads only index pages and never follows the row pointer to the heap. That converts random I/O into sequential I/O over a much smaller structure." },
        { q: "Why does an UPDATE on an indexed column cost more than on a heap column?", a: "An index key change is a delete plus an insert in a different position, potentially splitting two more pages, plus WAL for each modified page. That is why wide indexes and indexes on frequently updated columns hurt write throughput." },
      ],
    },
  },
  {
    id: "tcp-congestion", subject: "network", title: "TCP congestion control",
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
        "RTT keeps rising as the bottleneck queue fills, so bufferbloat is a leading indicator that loss is coming.",
      ],
      formulas: [
        "Throughput ~= 1.22 * MSS / (RTT * sqrt(p)) for Reno under loss rate p",
        "Bandwidth-delay product = the number of unacknowledged bytes that fills the pipe",
        "AIMD: additive increase (+1 MSS per RTT) + multiplicative decrease (/2) converges to equal shares",
        "RTO >= SRTT + 4 * RTTVAR, and it doubles on every retransmission (Karn's algorithm excludes retransmitted samples from RTT)",
      ],
      traps: [
        "Saying TCP measures available bandwidth. It does not - it infers capacity from loss and delay; that is why it overshoots buffers.",
        "Confusing the receive window with the congestion window: the sender is limited by min(cwnd, rwnd), and a slow receiver throttles cwnd without any loss.",
        "Calling slow start an algorithm for going slowly, or thinking it is disabled when cwnd starts below ssthresh.",
        "Blaming packet loss for 'bad network' when it can be a corrupted frame on a link with no checksum offload or a policy drop from a firewall.",
      ],
      interview: [
        { q: "Why halve on three duplicate ACKs but go to 1 on a timeout?", a: "Duplicate ACKs prove the path still delivers later segments, so congestion is mild and the flow can stay near half the window. A timeout means the sender has no delivery evidence at all, so it must assume collapse - the difference is information, not severity of a single loss." },
        { q: "What is BBR doing differently?", a: "It builds an explicit model of the bottleneck bandwidth and round-trip propagation delay and aims to fill the pipe at bandwidth * RTprop without filling the queue, so it treats queue growth, not loss, as the limit. On lossy long-haul links that is a large win; it also raises fairness questions because it does not back off like AIMD." },
        { q: "One TCP flow is fine but the link still underdelivers. Where else do you look?", a: "Small receive window or window scaling disabled (no scale option means a 64 KB ceiling), buffering at the middlebox, and Nagle plus delayed-ACK interaction adding roughly an extra RTT per request-response pair." },
      ],
    },
  },
  {
    id: "cache-lru", subject: "arch", title: "Set-associative cache",
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
        "A miss that evicts a still-valid line because two hot addresses share a set is a conflict miss. Adding ways to that set removes it; adding cache capacity does not.",
      ],
      formulas: [
        "AMAT = hit time + miss rate * miss penalty",
        "Capacity = sets * ways * block size; index bits = log2(sets), block offset bits = log2(block size)",
        "LRU distance / stack distance predicts misses for any larger fully associative cache",
        "Compulsory + capacity + conflict = total misses (the 3 Cs)",
      ],
      traps: [
        "Attributing every miss to slowness. First-touch compulsory misses are unavoidable for the working set.",
        "Saying LRU is free: true LRU on n ways needs ordering metadata (tree or counters) and becomes expensive past 4-8 ways, which is why real caches use pseudo-LRU or random replacement.",
        "Ignoring Belady's anomaly: FIFO can miss more with a bigger cache; LRU is stack-distance based so it cannot.",
        "Assuming false sharing is a cache miss problem you can fix by tuning associativity - it is a line-granularity problem, solved by padding.",
        "Forgetting that write-back with dirty lines costs two memory writes on eviction, so hit rate alone does not predict bandwidth.",
      ],
      interview: [
        { q: "Why is direct-mapped still used for L1 instruction caches?", a: "One way means one comparison and one possible line to invalidate, so hit latency is a single cycle and the hardware is trivially simple. Instruction streams rarely self-conflict, so the thrash risk is low while the latency win is real." },
        { q: "How would you raise hit rate without adding capacity?", a: "Increase associativity to kill conflict misses, enlarge the block to exploit spatial locality if the stride allows it, pin or colour hot data so it lands in distinct sets, and reduce false sharing with padding." },
        { q: "A cache is 95% hit with a 300-cycle miss penalty. What is effective access time?", a: "0.95 * 1 + 0.05 * 300 = roughly 16 cycles, so the miss penalty dominates even though the hit rate sounds excellent. That arithmetic is why engineers care more about the last few percent than the first." },
      ],
    },
  },
];

export function csTopicById(id: string) {
  return csTopics.find((topic) => topic.id === id) ?? csTopics[0];
}
