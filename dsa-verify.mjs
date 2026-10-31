import { dsaTopics, dsaTopicById, runSort, countInversions, runList, runHash, runTree, runGraph, runUnionFind, runDp, runRecursion, runQueens, runGreedy, runStack, runQueue, runPrefixSum, runSlidingWindow, runBinarySearch, runTwoPointers } from "./__dsa_bundle.mjs";

let pass = 0;
const fails = [];
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; } else { fails.push(`${name} ${extra}`); }
};
const eq = (name, got, want) => ok(name, String(got) === String(want), `· got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
const last = (frames) => frames[frames.length - 1];
const cap = (frames) => last(frames).caption;

// ---------- 1. two pointers ----------
{
  const f = runTwoPointers("arr=1,2,4,5,7,9,11,15;target=13");
  ok("two-pointers finds a 13 pair", /2 \+ 11|2\+11|Found 2\+11/.test(cap(f)), `· ${cap(f)}`);
  const none = runTwoPointers("arr=1,2,4,5,7,9,11,15;target=100");
  ok("two-pointers proves a miss", /no|not|exhaust|never/i.test(cap(none)), `· ${cap(none)}`);
}

// ---------- 2. sliding window ----------
{
  const f = runSlidingWindow("arr=1,4,2,10,23,3,1,12;k=3");
  ok("window max = 36", /36/.test(cap(f)), `· ${cap(f)}`);
  const w1 = runSlidingWindow("arr=5,-2,7,1,9;k=1");
  ok("window k=1 max = 9", /9/.test(cap(w1)), `· ${cap(w1)}`);
  const allneg = runSlidingWindow("arr=-5,-2,-7,0,-1;k=2");
  ok("window handles negatives", /-1|0/.test(cap(allneg)), `· ${cap(allneg)}`);
}

// ---------- 3. prefix sums ----------
{
  const f = runPrefixSum("arr=3,2,0,6,7,1,-2,4;queries=1:4;0:2;5:7");
  const qs = f.filter((x) => x.caption.startsWith("query"));
  eq("prefix query count", qs.length, 3);
  ok("prefix 1..4 = 15", /a\[1\.\.4\].*= 15$/.test(qs[0].caption), `· ${qs[0].caption}`);
  ok("prefix 0..2 = 5", /a\[0\.\.2\].*= 5$/.test(qs[1].caption), `· ${qs[1].caption}`);
  ok("prefix 5..7 = 3", /a\[5\.\.7\].*= 3$/.test(qs[2].caption), `· ${qs[2].caption}`);
  ok("no NaN in prefix frames", !f.some((x) => /NaN|undefined/.test(x.caption + x.detail)));
  const dash = runPrefixSum("arr=1,2,3,4;queries=0-1");
  ok("prefix accepts 0-1", /= 3$/.test(cap(dash)), `· ${cap(dash)}`);
}

// ---------- 4. binary search ----------
{
  const f = runBinarySearch("arr=-1,0,3,5,9,12;target=9");
  ok("binsearch finds 9 at 4", /index 4/.test(cap(f)), `· ${cap(f)}`);
  ok("binsearch probes <= 4", last(f).tally.probes <= 4, `· ${last(f).tally.probes}`);
  const miss = runBinarySearch("arr=-1,0,3,5,9,12;target=4");
  ok("binsearch miss is honest", /not found|no|insert/i.test(cap(miss)), `· ${cap(miss)}`);
}

// ---------- 5. sorting ----------
{
  const arr = "8,5,3,9,1,7,2,6";
  const inv = countInversions([8, 5, 3, 9, 1, 7, 2, 6]);
  eq("inversion count", inv, 17);
  for (const algo of ["bubble", "insertion", "selection", "merge", "quick"]) {
    const f = runSort(algo, arr);
    const values = last(f).values.map(Number);
    ok(`${algo} output sorted`, values.every((v, i) => i === 0 || values[i - 1] <= v), `· ${values}`);
    eq(`${algo} keeps every element`, values.slice().sort((a, b) => a - b).join(), "1,2,3,5,6,7,8,9");
    ok(`${algo} no NaN`, !f.some((x) => /NaN|undefined/.test(x.caption)));
  }
  eq("bubble swaps == inversions", /(\d+) swaps/.exec(cap(runSort("bubble", arr)))[1], String(inv));
  const sorted = runSort("quick", "1,2,3,4,5,6");
  eq("quick on sorted input length", sorted.length > 0, "true");
}

// ---------- 6. stack ----------
{
  const good = runStack("seq=([{}])", "brackets");
  ok("brackets accept ([{}])", /match|balanced|ok|accept/i.test(cap(good)), `· ${cap(good)}`);
  const bad = runStack("seq=([)]", "brackets");
  ok("brackets reject ([)]", /mismatch|wrong|close|not match/i.test(cap(bad)), `· ${cap(bad)}`);
  const postfix = runStack("expr=3 4 + 2 *", "postfix");
  ok("postfix (3+4)*2 = 14", /14/.test(cap(postfix)), `· ${cap(postfix)}`);
  const mins = runStack("ops=push5,push3,pop,push7", "minstack");
  ok("minstack tracks min", /min/.test(cap(mins)), `· ${cap(mins)}`);
}

// ---------- 7. queue ----------
{
  const circular = runQueue("ops=enqueue1,enqueue2,enqueue3,dequeue,enqueue4;capacity=3", "circular");
  ok("circular queue wraps", /wrap|slot|ring|full|reject/i.test(circular.map((f) => f.caption).join(" ")), `· ${cap(circular)}`);
  ok("circular final order", /\[2, 3, 4\]|\[3, 4\]|final queue/.test(cap(circular)), `· ${cap(circular)}`);
  const two = runQueue("ops=enqueue1,enqueue2,dequeue,enqueue3,dequeue,dequeue,dequeue", "twostack");
  ok("two-stack queue FIFO", /held: \[\]|empty/i.test(cap(two)), `· ${cap(two)}`);
}

// ---------- 8. linked list ----------
{
  const rev = runList("list=17,2,35,1,48,63", "reverse");
  eq("reverse output", /\[(.*)\]/.exec(cap(rev))[1].replace(/\s/g, ""), "63->48->1->35->2->17");
  const mid = runList("list=17,2,35,1,48,63", "middle");
  ok("middle of 6 nodes", /node 3/.test(cap(mid)), `· ${cap(mid)}`);
  for (let entry = 0; entry < 6; entry++) {
    const f = runList(`list=a,b,c,d,e,f;entry=${entry}`, "cycle");
    ok(`cycle entry ${entry} found`, new RegExp(`cycle starts at node ${entry}\\b`).test(cap(f)), `· ${cap(f)}`);
  }
  const noCycle = runList("list=a,b,c,d;entry=none", "cycle");
  ok("cycle reports no cycle", /no cycle/.test(cap(noCycle)), `· ${cap(noCycle)}`);
}

// ---------- 9. hashing ----------
{
  const size = 7;
  const keys = [25, 72, 38, 33, 45, 71, 10];
  const input = `keys=${keys.join(",")};size=${size};find=38`;
  const place = (mode) => {
    const table = new Array(size).fill(null);
    return keys.map((k) => {
      const h = ((k % size) + size) % size;
      if (mode === "chaining") return { key: k, slot: h, probes: 0 };
      for (let i = 0; i <= size; i++) {
        const s = mode === "linear" ? (h + i) % size : (h + i * i) % size;
        if (table[s] === null) { table[s] = k; return { key: k, slot: s, probes: i }; }
      }
      return { key: k, slot: -1, probes: size };
    });
  };
  for (const mode of ["chaining", "linear", "quadratic"]) {
    const f = runHash(input, mode);
    for (const r of place(mode)) {
      const frame = f.find((x) => x.caption.startsWith(`insert ${r.key} `));
      if (!frame) { ok(`hash ${mode} inserted ${r.key}`, false, "· no insert frame"); continue; }
      if (r.slot < 0) {
        ok(`hash ${mode} fails honestly when the probe sequence is exhausted (${r.key})`, /FAILED/.test(frame.caption), `· ${frame.caption}`);
        continue;
      }
      const expected = mode === "chaining" ? `= ${r.slot}` : r.probes === 0 ? "slot free first try" : `${r.probes} probe(s) to slot ${r.slot}`;
      ok(`hash ${mode} places ${r.key} in slot ${r.slot}`, frame.caption.includes(expected), `· ${frame.caption}`);
    }
    const built = f.find((x) => /load factor/.test(x.caption));
    ok(`hash ${mode} reports load factor`, !!built, `· ${cap(f)}`);
    ok(`hash ${mode} has no NaN`, !f.some((x) => /NaN|undefined/.test(x.caption + x.detail)));
    ok(`hash ${mode} marks resolve to nodes`, f.every((x) => x.marks.every((m) => x.rows.some((row) => row.nodes.some((n) => n.id === m.id)))));
  }
  const linFrames = runHash(input, "linear");
  ok("linear probes counted honestly", linFrames.some((x) => /4 probe\(s\) to slot 0/.test(x.caption)), `· ${linFrames.map((x) => x.caption).filter((c) => /probe/.test(c)).join(" | ")}`);
  ok("collision explained", linFrames.some((x) => /clustering/i.test(x.detail)));
  const quadBuilt = runHash(input, "quadratic").find((x) => /table built/.test(x.caption))?.caption ?? "";
  const linBuilt = linFrames.find((x) => /table built/.test(x.caption))?.caption ?? "";
  ok("quadratic ends up with a different table", quadBuilt !== linBuilt && /table built/.test(quadBuilt), `· quad "${quadBuilt}" vs lin "${linBuilt}"`);
  ok("quadratic explains its own limit", runHash(input, "quadratic").some((x) => /half the residues/.test(x.detail)));
  const crowded = runHash("keys=1,8,15,22,29,36,43,50;size=4;find=50", "linear");
  ok("full table fails instead of looping", crowded.some((x) => /FAILED|table full/i.test(x.caption)), `· ${cap(crowded)}`);
}

// ---------- 10. trees ----------
{
  const bst = runTree("keys=50,30,70,20,40,60,80", "bst");
  ok("BST in-order sorted", /in-order \[20, 30, 40, 50, 60, 70, 80\]/.test(cap(bst)), `· ${cap(bst)}`);
  ok("BST height 3", /height 3/.test(cap(bst)), `· ${cap(bst)}`);
  const skew = runTree("keys=1,2,3,4,5,6,7", "bst");
  ok("skewed BST height 7 levels", /height 7/.test(cap(skew)), `· ${cap(skew)}`);
  const avl = runTree("keys=1,2,3,4,5,6,7", "avl");
  const h = Number(/height (\d+)/.exec(cap(avl))[1]);
  ok("AVL stays short on sorted input", h <= 3, `· height ${h} · ${cap(avl)}`);
  ok("AVL in-order sorted", /in-order \[1, 2, 3, 4, 5, 6, 7\]/.test(cap(avl)), `· ${cap(avl)}`);
  ok("AVL rotated", avl.some((f) => /rotated/.test(f.caption)));
  const heap = runTree("keys=4,10,3,5,1,2", "heap");
  ok("Floyd build gives [10, 5, 3, 4, 1, 2]", heap.some((f) => /max-heap built: \[10, 5, 3, 4, 1, 2\]/.test(f.caption)), `· ${heap.map((f) => f.caption).filter((c) => /built/.test(c)).join(" | ")}`);
  ok("heapsort ascending", /\[1, 2, 3, 4, 5, 10\]/.test(cap(heap)), `· ${cap(heap)}`);
  const heap2 = runTree("keys=17,3,12,9,1,20,7", "heap");
  const builtFrame = heap2.map((f) => f.caption).find((c) => /max-heap built/.test(c)) ?? "";
  const builtMatch = /max-heap built: \[([\d, ]+)\]/.exec(builtFrame);
  const heapArr = builtMatch ? builtMatch[1].split(",").map((x) => Number(x.trim())) : [];
  let heapOk = heapArr.length === 7;
  for (let i = 0; i < heapArr.length && heapOk; i++) {
    const lft = 2 * i + 1, rgt = 2 * i + 2;
    if (lft < heapArr.length && heapArr[lft] > heapArr[i]) heapOk = false;
    if (rgt < heapArr.length && heapArr[rgt] > heapArr[i]) heapOk = false;
  }
  ok("second build satisfies the max-heap property", heapOk, `· ${heapArr}`);
  ok("heapsort second array", /\[1, 3, 7, 9, 12, 17, 20\]/.test(cap(heap2)), `· ${cap(heap2)}`);
  ok("sift captions compare child to parent", !heap2.some((f) => /was bigger than/.test(f.caption)));
  const trie = runTree("words=cat,car,cart,dog", "trie");
  ok("trie built", /trie built/.test(cap(trie)), `· ${cap(trie)}`);
}

// ---------- 11. graphs ----------
{
  const input = "edges=A-B:4,A-C:2,B-D:3,C-D:1,D-E:2,B-E:5,E-F:6,C-F:8;start=A";
  const dij = runGraph(input, "dijkstra");
  const table = last(dij).table;
  const nodes = [...new Set(input.replace("edges=", "").split(";")[0].split(",").flatMap((e) => e.split(/[-:]/).slice(0, 2)).filter((x) => /^[A-Z]$/.test(x)))];
  const ref = (() => {
    const adj = new Map();
    for (const e of input.replace("edges=", "").split(";")[0].split(",")) {
      const m = /^([A-Za-z]+)-([A-Za-z]+):(-?\d+)$/.exec(e);
      if (!m) continue;
      (adj.get(m[1]) ?? adj.set(m[1], []).get(m[1])).push([m[2], Number(m[3])]);
      (adj.get(m[2]) ?? adj.set(m[2], []).get(m[2])).push([m[1], Number(m[3])]);
    }
    const dist = new Map(nodes.map((v) => [v, Infinity]));
    dist.set("A", 0);
    const seen = new Set();
    for (;;) {
      let u = null;
      for (const v of nodes) if (!seen.has(v) && (u === null || dist.get(v) < dist.get(u))) u = v;
      if (u === null || dist.get(u) === Infinity) break;
      seen.add(u);
      for (const [v, w] of (adj.get(u) ?? [])) if (dist.get(u) + w < dist.get(v)) dist.set(v, dist.get(u) + w);
    }
    return dist;
  })();
  eq("reference covers every node", ref.size, table.length);
  for (const row of table) eq(`dijkstra ${row.id} matches reference`, Number(row.dist), ref.get(row.id));
  const bfs = runGraph(input, "bfs");
  ok("bfs visits all 6", last(bfs).visited.length === 6, `· ${last(bfs).visited}`);
  const hops = (() => {
    const adj = new Map();
    for (const e of input.replace("edges=", "").split(";")[0].split(",")) {
      const m = /^([A-Za-z]+)-([A-Za-z]+):(-?\d+)$/.exec(e);
      if (!m) continue;
      (adj.get(m[1]) ?? adj.set(m[1], []).get(m[1])).push(m[2]);
      (adj.get(m[2]) ?? adj.set(m[2], []).get(m[2])).push(m[1]);
    }
    const d = new Map([["A", 0]]);
    const q = ["A"];
    while (q.length) {
      const u = q.shift();
      for (const v of (adj.get(u) ?? [])) if (!d.has(v)) { d.set(v, d.get(u) + 1); q.push(v); }
    }
    return d;
  })();
  for (const row of last(bfs).table) {
    const n = Number(String(row.dist).match(/\d+/)?.[0] ?? -1);
    eq(`bfs ${row.id} hops`, n, hops.get(row.id));
  }
  ok("weighted cost is never below hop count", last(bfs).table.every((r) => {
    const hop = Number(String(r.dist).match(/\d+/)?.[0] ?? NaN);
    const w = Number(String((last(dij).table.find((d) => d.id === r.id) ?? {}).dist ?? "").match(/\d+/)?.[0] ?? NaN);
    return !Number.isFinite(w) || !Number.isFinite(hop) || w >= hop;
  }));
  const dfs = runGraph(input, "dfs");
  ok("dfs visits all 6", last(dfs).visited.length === 6, `· ${last(dfs).visited}`);
  ok("dfs starts at A", /^DFS order: A/.test(cap(dfs)), `· ${cap(dfs)}`);
}

// ---------- 12. union-find ----------
{
  const f = runUnionFind("n=7;unions=0-1,2-3,4-5,1-4,0-5,3-6,2-6");
  ok("union-find 2 components", /2 component/.test(cap(f)), `· ${cap(f)}`);
  const ref = (() => {
    const p = [0, 1, 2, 3, 4, 5, 6];
    const find = (x) => (p[x] === x ? x : (p[x] = find(p[x])));
    for (const e of ["0-1", "2-3", "4-5", "1-4", "0-5", "3-6", "2-6"]) {
      const [a, b] = e.split("-").map(Number);
      p[find(a)] = find(b);
    }
    return new Set(p.map((_, i) => find(i))).size;
  })();
  eq("union-find reference", ref, 2);
  const dup = runUnionFind("n=4;unions=0-1,0-1,1-0");
  ok("union-find rejects duplicate edge", /already in the same set/.test(dup.map((x) => x.caption).join(" ")));
}

// ---------- 13. dynamic programming ----------
{
  const knap = runDp("weights=1,3,4,5;values=1,4,5,7;capacity=8", "knapsack");
  ok("knapsack = 11", /best value 11/.test(cap(knap)), `· ${cap(knap)}`);
  const lcs = runDp("a=AGGTAB;b=GXTXAYB", "lcs");
  ok("LCS = 4 GTAB", /LCS length 4 · "GTAB"/.test(cap(lcs)), `· ${cap(lcs)}`);
  const coins = runDp("coins=1,2,3;amount=5", "coins");
  ok("coin ways = 5", /5 way/.test(cap(coins)), `· ${cap(coins)}`);
  const coinsRef = (() => {
    const dp = new Array(6).fill(0);
    dp[0] = 1;
    for (const c of [1, 2, 3]) for (let a = c; a <= 5; a++) dp[a] += dp[a - c];
    return dp[5];
  })();
  eq("coin reference", coinsRef, 5);
}

// ---------- 14. recursion ----------
{
  const naive = runRecursion("n=5", "naive");
  ok("naive fib(5) = 15 calls", /15 calls/.test(cap(naive)), `· ${cap(naive)}`);
  ok("naive fib(5) = 8 base cases", /8 base cases/.test(cap(naive)), `· ${cap(naive)}`);
  const memo = runRecursion("n=5", "memo");
  ok("memo fib(5) = 9 calls", /9 calls/.test(cap(memo)), `· ${cap(memo)}`);
  ok("memo caches", /4 stored/.test(memo.map((f) => f.lanes?.map((l) => l.note).join()).filter(Boolean).join(" ")), `· ${memo.map((f) => f.lanes?.map((l) => l.note).join()).join(" ")}`);
  const naiveBig = runRecursion("n=8", "naive");
  ok("naive fib(8) = 67 calls", /67 calls/.test(cap(naiveBig)), `· ${cap(naiveBig)}`);
  ok("fib answer 5", /fib\(5\) = 5/.test(cap(naive)), `· ${cap(naive)}`);
}

// ---------- 15. backtracking ----------
{
  for (const [n, want] of [[4, 2], [5, 10], [8, 92]]) {
    const f = runQueens(`n=${n}`);
    ok(`n-queens ${n} = ${want}`, new RegExp(`${want} solution`).test(cap(f)), `· ${cap(f)}`);
  }
}

// ---------- 16. greedy ----------
{
  const f = runGreedy("start=1,3,0,5,8,5,3,7,12;end=4,5,6,7,9,9,10,11,14");
  ok("activity selection = 4", /4 activities fit/.test(cap(f)), `· ${cap(f)}`);
  const acts = cap(f).split("·")[1].trim().split(",");
  ok("greedy picks 4 ids", acts.length === 4, `· ${acts}`);
}

// ---------- 17. catalogue shape ----------
{
  eq("topic count", dsaTopics.length, 16);
  ok("every topic is dsa", dsaTopics.every((t) => t.subject === "dsa"));
  ok("ids unique", new Set(dsaTopics.map((t) => t.id)).size === dsaTopics.length);
  ok("lookup works", dsaTopicById("sorting").id === "sorting" && dsaTopicById("nope") === undefined || dsaTopicById("nope") !== null);
  for (const t of dsaTopics) {
    ok(`${t.id} has reading`, t.read.concept.length > 80 && t.read.mechanism.length >= 3 && t.read.formulas.length >= 2 && t.read.traps.length >= 2 && t.read.interview.length >= 1);
    ok(`${t.id} has a default input`, /.+=/.test(t.defaultInput));
  }
}

// ---------- 18. structural sweep: every frame, every algorithm, every odd input ----------
const TONES = new Set(["idle", "active", "done", "danger", "good", "ghost"]);
const badRef = [];
const sweep = (topic, input, algorithm) => {
  let frames;
  try { frames = topic.run(input, algorithm); } catch (e) { badRef.push(`${topic.id}/${algorithm} THREW ${e.message}`); return; }
  if (!frames.length) { badRef.push(`${topic.id}/${algorithm} produced no frames`); return; }
  for (const f of frames) {
    const label = `${topic.id}/${algorithm ?? "-"} step ${f.step}`;
    if (!f.caption || !f.detail) badRef.push(`${label} missing prose`);
    if (typeof f.step !== "number" || !Number.isFinite(f.step)) badRef.push(`${label} bad step`);
    const ids = new Set();
    if (f.kind === "bars") {
      for (const m of f.marks) if (m.index < 0 || m.index >= f.values.length) badRef.push(`${label} mark ${m.index} outside ${f.values.length}`);
      if (f.band && (f.band[0] < 0 || f.band[1] >= f.values.length || f.band[0] > f.band[1])) badRef.push(`${label} band ${f.band} outside`);
      if (f.pair && (f.pair[0] < 0 || f.pair[1] >= f.values.length)) badRef.push(`${label} pair ${f.pair} outside`);
      for (const s of f.settled) if (s < 0 || s >= f.values.length) badRef.push(`${label} settled ${s} outside`);
      for (const m of f.marks) if (!TONES.has(m.tone)) badRef.push(`${label} bad tone ${m.tone}`);
    }
    if (f.kind === "chain") for (const n of f.marks) if (!f.rows.some((r) => r.nodes.some((x) => x.id === n.id))) badRef.push(`${label} mark ${n.id} has no node`);
    if (f.kind === "dsatree") {
      for (const n of f.nodes) ids.add(n.id);
      for (const e of f.edges) if (!ids.has(e.from) || !ids.has(e.to)) badRef.push(`${label} edge ${e.from}->${e.to} dangling`);
      for (const fo of f.focus) if (!ids.has(fo)) badRef.push(`${label} focus ${fo} missing`);
      for (const n of f.nodes) if (!TONES.has(n.tone)) badRef.push(`${label} node tone ${n.tone}`);
    }
    if (f.kind === "graph") {
      for (const n of f.nodes) ids.add(n.id);
      for (const e of f.edges) if (!ids.has(e.a) || !ids.has(e.b)) badRef.push(`${label} edge ${e.a}-${e.b} dangling`);
      for (const v of f.visited) if (!ids.has(v)) badRef.push(`${label} visited ${v} missing`);
      for (const fr of f.frontier) if (!ids.has(fr)) badRef.push(`${label} frontier ${fr} missing`);
      if (f.current && !ids.has(f.current)) badRef.push(`${label} current ${f.current} missing`);
      for (const row of f.table) if (!ids.has(row.id)) badRef.push(`${label} table ${row.id} missing`);
      for (const n of f.nodes) if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) badRef.push(`${label} node ${n.id} bad geometry`);
    }
    if (f.kind === "grid") {
      if (f.cells.length !== f.rowLabels.length) badRef.push(`${label} rows ${f.cells.length} vs labels ${f.rowLabels.length}`);
      for (const row of f.cells) if (row.length !== f.colLabels.length) badRef.push(`${label} col count mismatch`);
      if (f.active && !f.cells[f.active[0]]?.[f.active[1]]) badRef.push(`${label} active ${f.active} outside`);
      for (const s of f.sources) if (!f.cells[s[0]]?.[s[1]]) badRef.push(`${label} source ${s} outside`);
    }
    if (f.kind === "board") for (const q of f.queens) if (q.r < 0 || q.r >= f.size || q.c < 0 || q.c >= f.size) badRef.push(`${label} queen ${q.r},${q.c} off board`);
    if (f.kind === "interval") for (const it of f.items) if (it.end < it.start) badRef.push(`${label} interval ${it.id} inverted`);
    for (const lane of f.lanes ?? []) {
      if (!Array.isArray(lane.items)) badRef.push(`${label} lane ${lane.label} has no items`);
      if (lane.hot !== null && lane.hot !== undefined && (lane.hot < 0 || lane.hot >= lane.items.length)) badRef.push(`${label} lane ${lane.label} hot ${lane.hot} outside ${lane.items.length}`);
      if (!TONES.has(lane.tone)) badRef.push(`${label} lane tone ${lane.tone}`);
    }
    for (const [k, v] of Object.entries(f.tally ?? {})) if (!Number.isFinite(v)) badRef.push(`${label} tally ${k} = ${v}`);
  }
};

const junk = [
  "", "arr=", "arr=abc", "arr=1", "arr=1,2,3;k=99", "arr=;;;", "arr=1,2,3;target=x",
  "keys=", "edges=A-B", "edges=;start=Z", "n=0", "n=99", "capacity=0", "slots=0",
  "ops=sideways", "words=", "a=;b=", "coins=;amount=0", "list=;entry=99", "expr=)))",
  "arr=1e9,2,-1e9;k=2", "unions=99-1,1-1", "start=;;end=", "weights=;values=;capacity=-1",
];

for (const topic of dsaTopics) {
  const algorithms = topic.algorithms ? topic.algorithms.map((a) => a.id) : [undefined];
  for (const algorithm of algorithms) sweep(topic, topic.defaultInput, algorithm);
  for (const input of junk) for (const algorithm of algorithms) sweep(topic, input, algorithm);
}
ok("structural sweep clean", badRef.length === 0, `\n  ${[...new Set(badRef.map((b) => b.replace(/step \d+/, "step N").replace(/\d+/g, "n")))].slice(0, 20).join("\n  ")}\n  (${badRef.length} problems)`);

// ---------- report ----------
console.log(`${pass} assertions passed`);
if (fails.length) {
  console.log(`${fails.length} FAILED:`);
  for (const f of fails) console.log(" -", f);
  process.exit(1);
}
const total = dsaTopics.reduce((s, t) => s + (t.algorithms?.length || 1), 0);
console.log(`all green · ${dsaTopics.length} topics · ${total} algorithm variants`);
