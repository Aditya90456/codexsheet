// src/cs-labs-kernels.ts
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

// src/dsa-labs-kernels.ts
var dsaSubjects = [{ id: "dsa", label: "Data structures & algorithms" }];
var numList = (value, fallback) => {
  const parsed = (value ?? "").split(/[,\s;]+/).filter(Boolean).map((token) => Number.parseFloat(token));
  return parsed.length && parsed.every((n) => Number.isFinite(n)) ? parsed : fallback;
};
var wordList = (value, fallback) => {
  const words = (value ?? "").split(/[,;\s]+/).map((w) => w.trim()).filter(Boolean);
  return words.length ? words : fallback;
};
var cells = (values) => values.map((v) => String(v));
function barsFrame(step, values, caption, detail, extra = {}) {
  return {
    kind: "bars",
    step,
    values: values.map((v) => String(v)),
    marks: [],
    band: null,
    pair: null,
    pairTone: "active",
    settled: [],
    lanes: [],
    tally: { comparisons: 0, writes: 0, probes: 0 },
    caption,
    detail,
    ...extra
  };
}
var emptyTally = () => ({ comparisons: 0, writes: 0, probes: 0 });
var sortAlgorithms = [
  { id: "bubble", label: "Bubble", note: "adjacent swaps - swaps equal the inversion count" },
  { id: "insertion", label: "Insertion", note: "shift into a sorted prefix - best on almost-sorted data" },
  { id: "selection", label: "Selection", note: "one swap per pass - fewest writes, always O(n squared)" },
  { id: "merge", label: "Merge", note: "divide then merge - stable, guaranteed O(n log n)" },
  { id: "quick", label: "Quick", note: "Lomuto partition - fastest in practice, O(n squared) worst case" }
];
function runSort(algorithm, input) {
  const fields = fieldMap(input);
  const start = numList(fields.get("arr"), [8, 5, 3, 9, 1, 7, 2, 6]).map(Math.round);
  const frames = [];
  const tally = emptyTally();
  const push = (a2, caption, detail, extra = {}) => frames.push(barsFrame(frames.length, a2, caption, detail, { tally: { ...tally }, ...extra }));
  if (algorithm === "insertion") {
    const a2 = [...start];
    push(
      a2,
      `${a2.length} keys \xB7 insertion sort keeps a sorted prefix`,
      `Insertion sort is the one you use in real life for a hand of cards: the left block is always sorted, and each new card is slid left until it lands. Frames are shifts, so nearly-sorted input is nearly free.`,
      { settled: [0] }
    );
    for (let i = 1; i < a2.length; i++) {
      const key = a2[i];
      let j = i - 1;
      push(a2, `pick key ${key} at index ${i}`, `Everything left of ${i} is already in order. Find where ${key} belongs by walking left, shifting bigger values right as we go.`, { marks: [{ index: i, label: "key", tone: "active" }], settled: range(0, i - 1), band: [0, i] });
      while (j >= 0 && a2[j] > key) {
        tally.comparisons++;
        tally.writes++;
        a2[j + 1] = a2[j];
        push(
          a2,
          `${a2[j]} > ${key} \xB7 shift right to index ${j + 1}`,
          `A shift, not a swap: the hole moves left. Each shift removes one inversion, which is why the running time is O(n + inversions) - 10 sorted items with 3 inversions cost 13 steps, not 45.`,
          { marks: [{ index: j, label: "hole", tone: "danger" }, { index: j + 1, label: "moved", tone: "done" }], pair: [j, j + 1], pairTone: "danger", settled: range(0, i - 1) }
        );
        j--;
      }
      if (j >= 0) tally.comparisons++;
      a2[j + 1] = key;
      tally.writes++;
      push(
        a2,
        `key ${key} lands at index ${j + 1}`,
        `Stopped at ${j + 1} because ${j < 0 ? "we ran off the left end - the key is the smallest so far" : `${a2[j]} <= ${key}, so the order is correct here`}. Sorted prefix is now 0..${i}.`,
        { marks: [{ index: j + 1, label: "placed", tone: "good" }], settled: range(0, i) }
      );
    }
    push(
      a2,
      `sorted - ${tally.comparisons} comparisons, ${tally.writes} writes`,
      `No extra array and stable: equal keys keep their input order, which is what makes sort-by-then-sort-by work. Worst case is the reverse-sorted input where every key walks all the way left.`,
      { settled: range(0, a2.length - 1) }
    );
    return frames;
  }
  if (algorithm === "selection") {
    const a2 = [...start];
    push(a2, `${a2.length} keys \xB7 selection sort`, `It does n passes, and each pass answers one question only: which is the smallest of what is left? Position in the pass number is never guessed twice.`, { settled: [] });
    for (let i = 0; i < a2.length - 1; i++) {
      let min = i;
      for (let j = i + 1; j < a2.length; j++) {
        tally.comparisons++;
        if (a2[j] < a2[min]) {
          min = j;
          push(
            a2,
            `pass ${i + 1}: new minimum ${a2[j]} at index ${j}`,
            `Tracking an index, not swapping. Swapping on every improvement would cost O(n squared) writes; selection sort deliberately defers the single write to the end of the pass.`,
            { marks: [{ index: i, label: "swap in", tone: "active" }, { index: j, label: "min", tone: "danger" }, { index: min, label: "candidate", tone: "done" }], pair: [i, j], settled: range(0, i - 1), band: [i, a2.length - 1] }
          );
        }
      }
      if (min !== i) {
        const t = a2[i];
        a2[i] = a2[min];
        a2[min] = t;
        tally.writes += 2;
      }
      push(
        a2,
        `pass ${i + 1} done: ${a2[i]} is the ${i + 1}${ord(i + 1)} smallest - one swap`,
        `Index ${i} is now final forever. Exactly ${a2.length - 1} swaps maximum for the whole sort, which is why selection sort is the answer when writes are expensive - flash erases or a memory-bound embedded system.`,
        { marks: [{ index: i, label: "final", tone: "good" }, { index: min, label: "from", tone: "ghost" }], settled: range(0, i) }
      );
    }
    push(
      a2,
      `sorted - ${tally.comparisons} comparisons, ${tally.writes} writes`,
      `n(n-1)/2 comparisons no matter the input: sorted, reverse, random - identical work. That refusal to adapt is both its weakness and the reason its worst case is easy to predict.`,
      { settled: range(0, a2.length - 1) }
    );
    return frames;
  }
  if (algorithm === "bubble") {
    const a2 = [...start];
    const inversions = countInversions(start);
    push(
      a2,
      `${a2.length} keys \xB7 ${inversions} inversions to remove`,
      `A bubble sort pass pushes the largest remaining value to the right by swapping adjacent pairs. The number of swaps it performs is exactly the inversion count, because every adjacent swap removes exactly one inversion and the array is sorted when none remain.`,
      { settled: [] }
    );
    for (let i = 0; i < a2.length - 1; i++) {
      let swapped = false;
      for (let j = 0; j < a2.length - 1 - i; j++) {
        tally.comparisons++;
        if (a2[j] > a2[j + 1]) {
          const t = a2[j];
          a2[j] = a2[j + 1];
          a2[j + 1] = t;
          tally.writes += 2;
          swapped = true;
          push(
            a2,
            `pass ${i + 1}: ${a2[j + 1]} > ${a2[j]} \xB7 swap`,
            `One inversion removed (${inversions - tally.writes / 2} still to go). The big value just moved one step right per comparison - that is why bubble sort is O(n squared) and why a value that starts at the far left crawls.`,
            { pair: [j, j + 1], pairTone: "danger", marks: [{ index: j, label: ">", tone: "danger" }, { index: j + 1, label: "<", tone: "done" }], settled: range(a2.length - i, a2.length - 1) }
          );
        } else {
          push(
            a2,
            `pass ${i + 1}: ${a2[j]} <= ${a2[j + 1]} \xB7 already in order`,
            `No swap. Adjacent pairs that are already ordered are exactly the runs insertion sort would exploit - bubble sort still pays a comparison for each, so it cannot beat O(n squared) even on sorted input without the early exit.`,
            { pair: [j, j + 1], pairTone: "idle", settled: range(a2.length - i, a2.length - 1) }
          );
        }
      }
      push(
        a2,
        `pass ${i + 1} done: ${a2[a2.length - 1 - i]} is final at index ${a2.length - 1 - i}`,
        `The pass guarantee: after pass k the last k slots are correct and never touched again. ${swapped ? "A swap happened, so another pass is needed." : "No swaps in this pass - the array is already sorted and the early exit saves the remaining passes."}`,
        { marks: [{ index: a2.length - 1 - i, label: "final", tone: "good" }], settled: range(a2.length - 1 - i, a2.length - 1) }
      );
      if (!swapped) break;
    }
    push(
      a2,
      `sorted - ${tally.comparisons} comparisons, ${tally.writes / 2} swaps`,
      `Swaps = ${tally.writes / 2}, inversions in the input = ${inversions}. Stable, in-place, and the classic interview answer for "why is this terrible" - the inner loop rescans the whole unsorted tail for one piece of information.`,
      { settled: range(0, a2.length - 1) }
    );
    return frames;
  }
  if (algorithm === "merge") {
    const a2 = [...start];
    push(
      a2,
      `${a2.length} keys \xB7 merge sort splits first, compares later`,
      `Merge sort does not look at the values to decide how to divide - it halves blindly, which is what guarantees O(n log n) even on sorted or adversarial input. The cost is a second array.`,
      { settled: [] }
    );
    const scratch = new Array(a2.length).fill(0);
    const sortRange = (lo, hi) => {
      if (lo >= hi) return;
      const mid = Math.floor((lo + hi) / 2);
      push(
        a2,
        `split ${lo}..${hi} at ${mid}`,
        `Divide: left half ${lo}..${mid}, right half ${mid + 1}..${hi}. Recursion bottoms out at single elements, which are sorted by definition.`,
        { band: [lo, hi], marks: [{ index: mid, label: "mid", tone: "active" }, { index: lo, label: "lo", tone: "done" }, { index: hi, label: "hi", tone: "done" }] }
      );
      sortRange(lo, mid);
      sortRange(mid + 1, hi);
      let i = lo;
      let j = mid + 1;
      let k = lo;
      while (i <= mid || j <= hi) {
        if (i <= mid && j <= hi) tally.comparisons++;
        const takeLeft = i <= mid && (j > hi || a2[i] <= a2[j]);
        scratch[k] = takeLeft ? a2[i] : a2[j];
        tally.writes++;
        if (takeLeft) i++;
        else j++;
        k++;
        push(
          a2,
          `merge ${lo}..${hi}: write ${scratch[k - 1]} into slot ${k - 1}`,
          takeLeft ? `Left wins (or the right side is exhausted). Taking from the left on ties is exactly what makes merge sort stable - equal keys come out in input order.` : `Right wins because its head is smaller than the left head. Every element still in the untouched half is copied without further comparisons.`,
          { band: [lo, hi], pair: [Math.min(mid, i), Math.min(hi, j)], pairTone: takeLeft ? "active" : "danger", marks: [{ index: k - 1, label: "write", tone: "good" }], settled: range(lo, k - 1) }
        );
      }
      for (let x = lo; x <= hi; x++) a2[x] = scratch[x];
      push(
        a2,
        `merged ${lo}..${hi} is sorted`,
        `${hi - lo + 1} elements ordered with at most ${hi - lo} comparisons. Copying back from the scratch array is the O(n) merge that the recurrence T(n)=2T(n/2)+O(n) solves to O(n log n).`,
        { band: [lo, hi], settled: range(lo, hi) }
      );
    };
    sortRange(0, a2.length - 1);
    push(
      a2,
      `sorted - ${tally.comparisons} comparisons, ${tally.writes} writes`,
      `Guaranteed O(n log n), stable, and the only O(n log n) sort that works on a linked list without random access. Its weakness is the extra O(n) buffer - heap sort gets O(1) space but loses stability.`,
      { settled: range(0, a2.length - 1) }
    );
    return frames;
  }
  const a = [...start];
  push(
    a,
    `${a.length} keys \xB7 quick sort, pivot = last element`,
    `Quick sort picks a pivot and drives one pass that puts the pivot in its final slot with everything smaller to the left. The split depends on the values, which is why the average is O(n log n) and the worst case - always picking the smallest - is O(n squared).`,
    { settled: [] }
  );
  const partition = (lo, hi) => {
    const pivot = a[hi];
    let i = lo;
    push(
      a,
      `partition ${lo}..${hi} \xB7 pivot ${pivot}`,
      `Invariant: a[${lo}..${i - 1}] are all <= pivot and everything the scan has passed since then is > pivot. One left-to-right sweep closes the gap.`,
      { band: [lo, hi], marks: [{ index: hi, label: "pivot", tone: "active" }, { index: i, label: "border", tone: "done" }] }
    );
    for (let j = lo; j < hi; j++) {
      tally.comparisons++;
      if (a[j] <= pivot) {
        if (i !== j) {
          const t = a[i];
          a[i] = a[j];
          a[j] = t;
          tally.writes += 2;
          push(
            a,
            `${a[i]} <= ${pivot} \xB7 swap into the small side at ${i}`,
            `The value at ${j} is small enough, so it joins the left group; whatever was at the border goes back to ${j}, which we know was too big. Border moves to ${i + 1}.`,
            { band: [lo, hi], pair: [i, j], pairTone: "danger", marks: [{ index: hi, label: "pivot", tone: "active" }, { index: i + 1, label: "border", tone: "done" }] }
          );
        } else {
          push(
            a,
            `${a[i]} <= ${pivot} \xB7 already on the small side`,
            `No swap needed - the border and the scanner point at the same slot, which is the cheap case that makes quick sort fast on runs of small values.`,
            { band: [lo, hi], pair: [i, j], pairTone: "idle", marks: [{ index: hi, label: "pivot", tone: "active" }, { index: i + 1, label: "border", tone: "done" }] }
          );
        }
        i++;
      } else {
        push(
          a,
          `${a[j]} > ${pivot} \xB7 leave it on the big side`,
          `Nothing moves. The scanner steps over it and the invariant still holds because the big group is allowed to grow rightwards.`,
          { band: [lo, hi], pair: [j, j], pairTone: "idle", marks: [{ index: hi, label: "pivot", tone: "active" }, { index: i, label: "border", tone: "done" }] }
        );
      }
    }
    if (i !== hi) {
      const t = a[i];
      a[i] = a[hi];
      a[hi] = t;
      tally.writes += 2;
    }
    push(
      a,
      `pivot ${pivot} is final at index ${i}`,
      `Everything left of ${i} is <= ${pivot}, everything right is greater. That slot will never be revisited - which is the free information quick sort gets per partition.`,
      { band: [lo, hi], marks: [{ index: i, label: "final", tone: "good" }], settled: [...lastSettled(frames, a.length), i] }
    );
    return i;
  };
  const quick = (lo, hi) => {
    if (lo > hi) return;
    if (lo === hi) {
      push(a, `single element at ${lo} is sorted`, `Base case: one element is trivially ordered. Recursing to empty ranges is what a lo >= hi guard prevents.`, { marks: [{ index: lo, label: "final", tone: "good" }], settled: [...lastSettled(frames, a.length), lo] });
      return;
    }
    const p = partition(lo, hi);
    quick(lo, p - 1);
    quick(p + 1, hi);
  };
  quick(0, a.length - 1);
  push(
    a,
    `sorted - ${tally.comparisons} comparisons, ${tally.writes} writes`,
    `In-place and cache-friendly because the scan is sequential - that is why it beats merge sort in practice despite the same average complexity. Randomised or median-of-three pivots are the defence against the O(n squared) sorted-input trap.`,
    { settled: range(0, a.length - 1) }
  );
  return frames;
}
var lastSettled = (frames, n) => {
  const prev = frames[frames.length - 1];
  if (!prev) return [];
  const inside = prev.settled.filter((i) => i >= 0 && i < n);
  return inside;
};
function ord(n) {
  const suffix = n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}
function countInversions(values) {
  let count = 0;
  for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) if (values[i] > values[j]) count++;
  return count;
}
function sortSummary(input) {
  const start = [...numList(fieldMap(input).get("arr"), [8, 5, 3, 9, 1, 7, 2, 6]).map(Math.round)];
  return sortAlgorithms.map((option) => {
    const frames = runSort(option.id, `arr=${start.join(",")}`);
    const last = frames[frames.length - 1];
    return { ...option, comparisons: last.tally.comparisons, writes: last.tally.writes, cost: Math.max(last.tally.comparisons, 1) };
  });
}
function runTwoPointers(input) {
  const fields = fieldMap(input);
  const values = numList(fields.get("arr"), [1, 2, 4, 5, 7, 9, 11, 15]);
  const target = intOf(fields.get("target") ?? "", 13);
  const frames = [];
  const sorted = [...values].sort((a, b) => a - b);
  let left = 0;
  let right = sorted.length - 1;
  let comparisons = 0;
  frames.push(barsFrame(
    0,
    sorted,
    `Target ${target} \xB7 sorted input, one pointer at each end`,
    `The array must be sorted for this to work: because the numbers ascend left to right, moving the left pointer right always increases the sum and moving the right pointer left always decreases it. That monotonicity is what lets one pass replace two.`,
    { marks: [{ index: left, label: "L", tone: "active" }, { index: right, label: "R", tone: "active" }], band: [left, right] }
  ));
  while (left < right) {
    comparisons++;
    const sum = sorted[left] + sorted[right];
    const tone = sum === target ? "good" : sum > target ? "danger" : "active";
    frames.push(barsFrame(
      frames.length,
      sorted,
      `L+R = ${sorted[left]}+${sorted[right]} = ${sum} vs target ${target}`,
      sum === target ? `Exactly the target. Any pair strictly inside L..R is no larger than this one and any pair reaching outside is no smaller, so the search can stop here when one answer is enough. Counting every pair that hits the target means walking both pointers inwards past the duplicates instead.` : sum < target ? `Too small. The pair using the current L with anything left of R is even smaller, so no partner exists for L at all - discard L and move right.` : `Too big. The pair using the current R with anything right of L is bigger still, so R cannot pair with anyone at or beyond L - discard R and move left.`,
      {
        marks: [{ index: left, label: "L", tone }, { index: right, label: "R", tone }],
        band: [left, right],
        pair: [left, right],
        pairTone: tone,
        tally: { ...emptyTally(), comparisons }
      }
    ));
    if (sum === target) break;
    if (sum < target) left++;
    else right--;
  }
  const hit = left < right && sorted[left] + sorted[right] === target;
  frames.push(barsFrame(
    frames.length,
    sorted,
    hit ? `Found ${sorted[left]}+${sorted[right]} = ${target} in ${comparisons} comparisons` : `No pair sums to ${target} after ${comparisons} comparisons`,
    hit ? `Every step threw away one candidate for one pointer, so the loop ran at most n-1 times: O(n) time and O(1) extra space. The naive double loop would have needed ${Math.round(sorted.length * (sorted.length - 1) / 2)} pair checks.` : `Exhausted the window: L met R. O(n) time, and the negative answer is as valuable as a positive one - it proves no pair exists.`,
    {
      marks: hit ? [{ index: left, label: "hit", tone: "good" }, { index: right, label: "hit", tone: "good" }] : [{ index: left, label: "L", tone: "idle" }, { index: right, label: "R", tone: "idle" }],
      settled: hit ? [left, right] : sorted.map((_, i) => i),
      tally: { ...emptyTally(), comparisons }
    }
  ));
  return frames;
}
function runSlidingWindow(input) {
  const fields = fieldMap(input);
  const values = numList(fields.get("arr"), [1, 4, 2, 10, 23, 3, 1, 12]);
  const k = Math.max(1, Math.min(values.length, intOf(fields.get("k") ?? "", 3)));
  const frames = [];
  let windowSum = 0;
  let best = -Infinity;
  let bestStart = 0;
  for (let i = 0; i < values.length; i++) {
    windowSum += values[i];
    if (i >= k) windowSum -= values[i - k];
    if (i >= k - 1) {
      const start = i - k + 1;
      const beat = windowSum > best;
      if (beat) {
        best = windowSum;
        bestStart = start;
      }
      frames.push(barsFrame(
        frames.length,
        values,
        `window [${start}..${i}] sums to ${windowSum}`,
        beat ? `New maximum: ${windowSum}. The window left ${values[start - 1] ?? 0} behind and took ${values[i]} on, so the sum was updated with two arithmetic operations instead of re-adding ${k} elements.` : `Not better than ${best}. Note what the window did NOT do: it never re-summed its own ${k} elements - each element is added once and removed once.`,
        {
          band: [start, i],
          marks: [{ index: start, label: "in", tone: "active" }, { index: i, label: "out", tone: "done" }, ...start > 0 ? [{ index: start - 1, label: "left", tone: "ghost" }] : []],
          settled: beat ? range(start, i) : [],
          tally: { ...emptyTally(), writes: i + 1 }
        }
      ));
    } else {
      frames.push(barsFrame(
        frames.length,
        values,
        `filling the window: ${i + 1} of ${k} elements`,
        `Nothing is compared until the window is full. The first ${k} elements are one sum; after that every slide is add-one, drop-one.`,
        { band: [0, i], marks: [{ index: i, label: "+", tone: "active" }], tally: { ...emptyTally(), writes: i + 1 } }
      ));
    }
  }
  frames.push(barsFrame(
    frames.length,
    values,
    `maximum window sum = ${best} at [${bestStart}..${bestStart + k - 1}]`,
    `Answer in ${values.length} add/subtract steps, not ${values.length} * ${k}. That is the whole point of a sliding window: the sub-problems overlap by k-1 elements, so the work of one is reused by the next.`,
    { band: [bestStart, bestStart + k - 1], settled: range(bestStart, bestStart + k - 1), tally: { ...emptyTally(), writes: values.length } }
  ));
  return frames;
}
var range = (from, to) => {
  const out = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
};
function runPrefixSum(input) {
  const fields = fieldMap(input);
  const values = numList(fields.get("arr"), [3, 2, 0, 6, 7, 1, -2, 4]);
  const raw = (fields.get("queries") ?? "").split(/[;/]+/).map((q) => q.trim()).filter(Boolean);
  const queries = (raw.length ? raw : ["1:4", "0:2", "5:7"]).map((q) => q.split(/[^0-9]+/).filter(Boolean).map((n) => intOf(n, 0))).map((pair) => [pair[0] ?? 0, pair.length > 1 ? pair[1] : pair[0]]);
  const frames = [];
  const prefix = [0];
  for (let i = 0; i < values.length; i++) prefix.push(prefix[i] + values[i]);
  frames.push(barsFrame(
    0,
    values,
    `the array - ${values.length} numbers`,
    `Query: "sum of a[i..j]". Recomputing it costs j-i+1 additions every time. Prefix sums cost n additions once, then every query is O(1) however many queries you get.`,
    {}
  ));
  for (let i = 0; i < values.length; i++) {
    frames.push(barsFrame(
      frames.length,
      prefix,
      `prefix[${i + 1}] = prefix[${i}] + a[${i}] = ${prefix[i]}+(${values[i]}) = ${prefix[i + 1]}`,
      i === 0 ? `prefix[0] is deliberately 0 so that a query starting at index 0 needs no special case: sum(0..j) = prefix[j+1] - prefix[0] = prefix[j+1].` : `Each entry now holds the sum of everything up to but not including it. Think of it as a running total you can subtract two of.`,
      { marks: [{ index: i + 1, label: "new", tone: "active" }, ...i > 0 ? [{ index: i, label: "prev", tone: "done" }] : []], settled: range(0, i + 1), lanes: [{ label: "array", items: cells(values), hot: i, tone: "done", note: "a[i]" }], tally: { ...emptyTally(), writes: i + 1 } }
    ));
  }
  const answers = queries.map(([a, b]) => {
    const l = Math.max(0, Math.min(values.length - 1, a));
    const r = Math.max(0, Math.min(values.length - 1, b));
    return prefix[r + 1] - prefix[l];
  });
  queries.forEach(([lo, hi], qi) => {
    const l = Math.max(0, Math.min(values.length - 1, lo));
    const r = Math.max(0, Math.min(values.length - 1, hi));
    const answer = answers[qi];
    frames.push(barsFrame(
      frames.length,
      prefix,
      `query sum a[${l}..${r}] = prefix[${r + 1}] - prefix[${l}] = ${prefix[r + 1]} - ${prefix[l]} = ${answer}`,
      `One subtraction. prefix[${r + 1}] carries everything up to index ${r}; subtracting prefix[${l}] removes the part before index ${l}. Across ${queries.length} queries that is ${queries.length} subtractions against ${queries.reduce((s, q) => s + (Math.max(0, Math.min(values.length - 1, q[1])) - Math.max(0, Math.min(values.length - 1, q[0])) + 1), 0)} additions for the naive way.`,
      {
        marks: [{ index: l, label: "minus", tone: "danger" }, { index: r + 1, label: "keep", tone: "good" }],
        band: [l, r + 1],
        settled: range(l, r + 1),
        lanes: [{ label: "query answers", items: queries.map((q, i) => `${q[0]}..${q[1]}=${answers[i]}`), hot: qi, tone: "done", note: `query ${qi + 1}/${queries.length}` }],
        tally: { ...emptyTally(), probes: 2 }
      }
    ));
  });
  return frames;
}
function runBinarySearch(input) {
  const fields = fieldMap(input);
  const values = [...numList(fields.get("arr"), [-1, 0, 3, 5, 9, 12]).sort((a, b) => a - b)];
  const target = intOf(fields.get("target") ?? "", 9);
  const frames = [];
  let lo = 0;
  let hi = values.length - 1;
  let probes = 0;
  let found = -1;
  frames.push(barsFrame(
    0,
    values,
    `search for ${target} in a sorted array of ${values.length}`,
    `Binary search needs two things: the array sorted, and random access. It is O(log n) because each comparison throws away half of what is left - on ${values.length} elements at most ${Math.ceil(Math.log2(values.length + 1)) || 1} comparisons are possible.`,
    { band: [lo, hi], marks: [{ index: lo, label: "lo", tone: "active" }, { index: hi, label: "hi", tone: "active" }], settled: [] }
  ));
  while (lo <= hi) {
    probes++;
    const mid = Math.floor((lo + hi) / 2);
    const v = values[mid];
    const tone = v === target ? "good" : "active";
    frames.push(barsFrame(
      frames.length,
      values,
      `mid = ${mid} \xB7 a[mid] = ${v} vs target ${target}`,
      v === target ? `Match, and it took probe ${probes}. Note the interval sizes: ${hi - lo + 1} elements were still candidates going in.` : v < target ? `${v} is smaller, and everything left of mid is smaller still, so the answer is strictly right of mid. lo = mid+1.` : `${v} is bigger, and everything right of mid is bigger still, so the answer is strictly left of mid. hi = mid-1.`,
      {
        band: [lo, hi],
        marks: [{ index: lo, label: "lo", tone: "done" }, { index: hi, label: "hi", tone: "done" }, { index: mid, label: "mid", tone }],
        pair: [mid, mid],
        pairTone: tone,
        settled: values.map((_, i) => i).filter((i) => i < lo || i > hi),
        tally: { ...emptyTally(), comparisons: probes, probes }
      }
    ));
    if (v === target) {
      found = mid;
      break;
    }
    if (v < target) lo = mid + 1;
    else hi = mid - 1;
  }
  frames.push(barsFrame(
    frames.length,
    values,
    found >= 0 ? `found ${target} at index ${found} after ${probes} probes` : `${target} is absent; would insert at index ${lo} after ${probes} probes`,
    found >= 0 ? `A linear scan needed up to ${values.length} comparisons on this array; binary search needed ${probes}. The trade-off is that the array must stay sorted, so it suits read-heavy data.` : `When the loop ends lo > hi, and lo is exactly where ${target} belongs. Returning that index instead of -1 is what makes lower_bound useful in problems like "first element >= x".`,
    {
      marks: found >= 0 ? [{ index: found, label: "hit", tone: "good" }] : [{ index: Math.min(values.length - 1, lo), label: "insert", tone: "danger" }],
      settled: values.map((_, i) => i),
      tally: { ...emptyTally(), comparisons: probes, probes }
    }
  ));
  return frames;
}
var stackAlgorithms = [
  { id: "brackets", label: "Balanced brackets", note: "push openers, pop on a matching closer" },
  { id: "postfix", label: "Postfix evaluation", note: "no precedence table needed - the order carries it" },
  { id: "minstack", label: "Min stack", note: "push the running minimum alongside every value" }
];
var CLOSER = { ")": "(", "]": "[", "}": "{" };
function runStack(input, algorithm = "brackets") {
  const fields = fieldMap(input);
  const frames = [];
  const tally = emptyTally();
  let barValues = [];
  const push = (caption, detail, extra = {}) => frames.push(barsFrame(frames.length, barValues, caption, detail, { tally: { ...tally }, ...extra }));
  if (algorithm === "postfix") {
    const tokens = (fields.get("expr") ?? "5 1 2 + 4 * 3 -").split(/\s+/).filter(Boolean);
    barValues = tokens;
    const stack2 = [];
    push(
      `${tokens.join(" ")} \xB7 read left to right`,
      `Postfix needs no precedence rules and no parentheses because the position of each operator already encodes the tree. The stack holds the sub-expressions whose operator has not been read yet.`,
      { lanes: [{ label: "stack", items: [], hot: null, tone: "idle", note: "empty" }] }
    );
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (/^[-+]?\d+(\.\d+)?$/.test(token)) {
        stack2.push(Number(token));
        push(
          `push operand ${token}`,
          `${token} cannot be evaluated on its own yet, so it waits on the stack. Top of stack is always the most recently unread value.`,
          { lanes: [{ label: "stack (top right)", items: stack2.map(String), hot: stack2.length - 1, tone: "active", note: `${stack2.length} held` }], marks: [{ index: i, label: "read", tone: "done" }] }
        );
      } else {
        if (stack2.length < 2) {
          push(
            `malformed: ${token} needs two operands, only ${stack2.length} on the stack`,
            `A postfix expression is invalid exactly when an operator runs out of operands. This is the same stack-underflow check a real evaluator returns an error on.`,
            { lanes: [{ label: "stack", items: stack2.map(String), hot: null, tone: "danger", note: "not enough operands" }] }
          );
          return frames;
        }
        const right = stack2.pop();
        const left = stack2.pop();
        const value = token === "+" ? left + right : token === "-" ? left - right : token === "*" ? left * right : right === 0 ? NaN : left / right;
        stack2.push(value);
        tally.comparisons++;
        push(
          `${token} pops ${left} and ${right} -> ${left} ${token} ${right} = ${value}`,
          `Order matters: the first pop is the RIGHT operand. Popping the other way round breaks ${token === "-" || token === "/" ? "this operator" : "any non-commutative operator"}. Push the result and it becomes available to the next operator.`,
          { lanes: [{ label: "stack (top right)", items: stack2.map(String), hot: stack2.length - 1, tone: "good", note: `${stack2.length} held` }] }
        );
      }
    }
    push(
      `result ${stack2[0]} \xB7 ${tally.comparisons} operator applications`,
      `One pass, O(n), O(n) space worst case. The mirror trick is how a compiler turns infix into postfix: an operator stack holds whatever is waiting on precedence.`,
      { lanes: [{ label: "final", items: stack2.map(String), hot: 0, tone: "done", note: "answer" }] }
    );
    return frames;
  }
  if (algorithm === "minstack") {
    const ops = (fields.get("ops") ?? "push 5, push 3, min, push 7, min, pop, min").split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    barValues = ops;
    const stack2 = [];
    const mins = [];
    push(
      `${ops.length} operations on a stack that also answers "what is the smallest thing on me?"`,
      `A plain stack cannot do that without rescanning. Keeping a parallel history of minimums costs one extra push per element and makes min O(1) - the standard trade of space for time on a real interview question.`,
      { lanes: [{ label: "stack", items: [], hot: null, tone: "idle", note: "empty" }, { label: "min history", items: [], hot: null, tone: "idle", note: "empty" }] }
    );
    for (let oi = 0; oi < ops.length; oi++) {
      const op = ops[oi];
      const parts = op.split(/\s+/);
      const verb = parts[0].toLowerCase();
      if (verb === "push") {
        const value = intOf(parts[1] ?? "", 0);
        stack2.push(value);
        mins.push(Math.min(value, mins.length ? mins[mins.length - 1] : value));
        push(
          `push ${value}`,
          `The new minimum is min(${value}, ${mins.length > 1 ? mins[mins.length - 2] : "+inf"}) = ${mins[mins.length - 1]}. Storing the minimum *at that moment* rather than only a running scalar is what lets pop restore the previous answer for free.`,
          { marks: [{ index: oi, label: "op", tone: "active" }], settled: range(0, oi - 1), lanes: [{ label: "stack (top right)", items: stack2.map(String), hot: stack2.length - 1, tone: "active", note: `${stack2.length} deep` }, { label: "min history", items: mins.map(String), hot: mins.length - 1, tone: "done", note: `min = ${mins[mins.length - 1]}` }] }
        );
      } else if (verb === "pop") {
        if (!stack2.length) {
          push(
            `pop on an empty stack - nothing to remove`,
            `Underflow is the error path. Any stack simulation that skips it silently gets out of sync with the real data structure.`,
            { marks: [{ index: oi, label: "op", tone: "danger" }], lanes: [{ label: "stack", items: [], hot: null, tone: "danger", note: "empty" }, { label: "min history", items: [], hot: null, tone: "idle", note: "empty" }] }
          );
          continue;
        }
        const value = stack2.pop();
        mins.pop();
        tally.writes++;
        push(
          `pop ${value}`,
          `Both arrays shrink together, so the minimum reverts to whatever it was before ${value} arrived: ${mins.length ? mins[mins.length - 1] : "no elements left"}. That is why the whole operation stays O(1).`,
          { marks: [{ index: oi, label: "op", tone: "done" }], settled: range(0, oi - 1), lanes: [{ label: "stack (top right)", items: stack2.map(String), hot: stack2.length ? stack2.length - 1 : null, tone: "done", note: `${stack2.length} deep` }, { label: "min history", items: mins.map(String), hot: mins.length ? mins.length - 1 : null, tone: "done", note: mins.length ? `min = ${mins[mins.length - 1]}` : "empty" }] }
        );
      } else {
        tally.comparisons++;
        push(
          `min() = ${mins.length ? mins[mins.length - 1] : "undefined"}`,
          mins.length ? `Read straight off the top of the history - no scan. A naive min() would compare ${stack2.length} values; this one compares zero.` : `Empty stack, so there is no minimum. Real implementations throw or return a sentinel here.`,
          { marks: [{ index: oi, label: "query", tone: "good" }], settled: range(0, oi - 1), lanes: [{ label: "stack (top right)", items: stack2.map(String), hot: stack2.length ? stack2.length - 1 : null, tone: mins.length ? "good" : "danger", note: `${stack2.length} deep` }, { label: "min history", items: mins.map(String), hot: mins.length ? mins.length - 1 : null, tone: "good", note: mins.length ? `top = ${mins[mins.length - 1]}` : "empty" }] }
        );
      }
    }
    push(
      `final stack [${stack2.join(", ")}] \xB7 min ${mins.length ? mins[mins.length - 1] : "n/a"}`,
      `push, pop and min are all O(1); space is O(n) in the worst case. If instead you only ever need the global minimum you can store deltas and get O(1) extra space in expectation - the follow-up interviewers ask for.`,
      { lanes: [{ label: "stack", items: stack2.map(String), hot: null, tone: "done", note: "final" }, { label: "min history", items: mins.map(String), hot: null, tone: "done", note: "final" }] }
    );
    return frames;
  }
  const text = fields.get("seq") ?? "{[()]}";
  const chars = [...text].filter((c) => "()[]{}".includes(c));
  barValues = chars;
  const raw = (fields.get("seq") ?? "").trim() || "{[()]}";
  const stack = [];
  push(
    `${raw} \xB7 ${chars.length} bracket characters`,
    `Last opener first closer - that is exactly the stack discipline, which is why this is the canonical stack problem. Everything else (HTML tags, undo, call frames) is the same argument with bigger objects.`,
    { lanes: [{ label: "stack", items: [], hot: null, tone: "idle", note: "empty" }] }
  );
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === "(" || c === "[" || c === "{") {
      stack.push(c);
      push(
        `read ${c} \xB7 push`,
        `An opener is a promise that something must come back for it. The stack holds every unanswered promise, innermost on top.`,
        { marks: [{ index: i, label: "open", tone: "active" }], lanes: [{ label: "stack", items: [...stack], hot: stack.length - 1, tone: "active", note: `${stack.length} open` }] }
      );
    } else {
      const top = stack[stack.length - 1];
      if (!top) {
        tally.comparisons++;
        push(
          `read ${c} \xB7 nothing open - unbalanced`,
          `A closer with an empty stack means this character has no opener at all. This is the failure mode a plain counter cannot catch: a counter would happily accept ")(" .`,
          { marks: [{ index: i, label: "extra", tone: "danger" }], settled: range(0, i - 1), lanes: [{ label: "stack", items: [], hot: null, tone: "danger", note: "underflow" }] }
        );
        return frames;
      }
      tally.comparisons++;
      if (top !== CLOSER[c]) {
        push(
          `read ${c} but the top was ${top} - mismatch`,
          `Wrong type of closer. Only comparing counts passes "{]}" and "{[}]"; the identity of the top element is what makes the check correct.`,
          { marks: [{ index: i, label: "closer", tone: "danger" }], settled: range(0, i - 1), lanes: [{ label: "stack", items: [...stack], hot: stack.length - 1, tone: "danger", note: `needed ${CLOSER[c]}` }] }
        );
        return frames;
      }
      stack.pop();
      push(
        `read ${c} \xB7 pops ${top} - matched`,
        `The innermost opener is the one this closer belongs to. Pop it and the stack returns to the enclosing scope, which is the same rule that unwinds a function call.`,
        { marks: [{ index: i, label: "match", tone: "good" }], settled: range(0, i), lanes: [{ label: "stack", items: [...stack], hot: stack.length ? stack.length - 1 : null, tone: "done", note: `${stack.length} open` }] }
      );
    }
  }
  const balanced = stack.length === 0;
  push(
    balanced ? `${raw} is balanced after ${tally.comparisons} comparisons` : `${raw} is NOT balanced - ${stack.length} opener(s) never closed`,
    balanced ? `Empty at the end: every promise was answered. O(n) time, O(n) space for the deepest nesting.` : `Leftover openers are unclosed scope - the string ends inside a block. Checking emptiness at the end is the second half of the algorithm; forgetting it is the most common bug in this problem.`,
    { settled: range(0, chars.length - 1), lanes: [{ label: "stack", items: [...stack], hot: null, tone: balanced ? "good" : "danger", note: balanced ? "empty - accepted" : "not empty - rejected" }] }
  );
  return frames;
}
var queueAlgorithms = [
  { id: "circular", label: "Circular array queue", note: "head and tail wrap - fixed capacity, O(1) both ends" },
  { id: "twostack", label: "Queue from two stacks", note: "amortised O(1) dequeue with two LIFOs" }
];
function runQueue(input, algorithm = "circular") {
  const fields = fieldMap(input);
  const ops = (fields.get("ops") ?? "e1,e2,e3,d,d,e4,e5,d,d,d,e6").split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  const capacity = Math.max(2, intOf(fields.get("cap") ?? "", 5));
  const frames = [];
  const tally = emptyTally();
  const slots = new Array(capacity).fill("");
  if (algorithm === "twostack") {
    const inbox = [];
    const outbox = [];
    const push2 = (caption, detail, hotIn, hotOut, tone) => frames.push(barsFrame(frames.length, [], caption, detail, {
      tally: { ...tally },
      lanes: [{ label: "in (push here)", items: [...inbox], hot: hotIn, tone: hotIn === null ? "idle" : "active", note: `${inbox.length}` }, { label: "out (pop here)", items: [...outbox], hot: hotOut, tone: hotOut === null ? "idle" : "good", note: `${outbox.length}` }]
    }));
    push2(
      `two stacks, one queue \xB7 capacity is unbounded here`,
      `Enqueue goes onto the input stack. Dequeue takes from the output stack; when the output stack is empty, the input stack is poured over - which reverses it once, restoring FIFO.`,
      null,
      null,
      "idle"
    );
    for (const op of ops) {
      const verb = op[0].toLowerCase();
      const value = op.slice(1) || String(tally.writes + 1);
      if (verb === "e") {
        inbox.push(value);
        push2(`enqueue ${value}`, `${value} sits on top of in. Nothing is reordered yet - the cost is deferred.`, inbox.length - 1, null, "active");
      } else if (verb === "f") {
        if (!outbox.length) {
          if (!inbox.length) {
            push2(`front on an empty queue - no answer`, `Both stacks are empty, so the queue genuinely has nothing. front() and dequeue() share this check.`, null, null, "danger");
            continue;
          }
          outbox.push(inbox[inbox.length - 1]);
          inbox.pop();
        }
        push2(`front = ${outbox[outbox.length - 1]}`, `Peeking costs one transfer at most, and the element stays put.`, null, outbox.length - 1, "good");
      } else {
        if (!outbox.length && inbox.length) {
          tally.writes += inbox.length;
          while (inbox.length) outbox.push(inbox.pop());
          push2(
            `out empty \xB7 pour all ${outbox.length} elements from in`,
            `This single step costs O(n) and is why one dequeue looks expensive in isolation. Amortised analysis spreads it over the elements it moved, so each element is pushed twice and popped twice at most across the whole run - O(1) per operation on average.`,
            null,
            outbox.length - 1,
            "done"
          );
        }
        if (!outbox.length) {
          push2(`dequeue on an empty queue - ignored`, `Underflow guard. A simulation that omits it reports success for operations that a real queue rejects.`, null, null, "danger");
          continue;
        }
        const value2 = outbox.pop();
        tally.comparisons++;
        push2(`dequeue ${value2}`, `${value2} was the oldest element still held, because pouring reversed the input stack exactly once. Order restored: first in, first out.`, null, outbox.length ? outbox.length - 1 : null, "good");
      }
    }
    push2(
      `held: [${[...outbox, ...inbox.reverse()].join(", ")}] in queue order`,
      `Two stacks give amortised O(1). If you need worst-case O(1) instead, that is what a real deque or a linked list buys - the same semantics, different guarantee.`,
      null,
      null,
      "done"
    );
    return frames;
  }
  let head = 0;
  let count = 0;
  let seq = 0;
  const log = [];
  const pushQ = (caption, detail, tone, hot) => {
    const tailSlot = (head + count - 1) % capacity;
    const live = [];
    for (let k = 0; k < count; k++) live.push((head + k) % capacity);
    frames.push(barsFrame(frames.length, slots.map((s) => s || "\xB7"), caption, detail, {
      tally: { ...tally },
      band: count && tailSlot >= head ? [head, tailSlot] : null,
      marks: [
        ...count ? [{ index: head, label: "head", tone: "done" }] : [],
        ...count ? [{ index: tailSlot, label: tailSlot < head ? "tail (wrapped)" : "tail", tone: "active" }] : [],
        ...hot !== null ? [{ index: hot, label: "touched", tone }] : []
      ],
      settled: live,
      lanes: [{ label: "operations", items: [...log], hot: log.length ? log.length - 1 : null, tone: "idle", note: `${count}/${capacity} full` }]
    }));
  };
  pushQ(
    `capacity ${capacity} \xB7 head and tail are indices that wrap`,
    `A plain array queue wastes the slots it dequeues from unless you shift everything left, which is O(n). The fix is to treat the array as a ring: head and tail advance modulo capacity, so slot 0 is reused after the last slot.`,
    "idle",
    null
  );
  for (const op of ops) {
    const verb = op[0].toLowerCase();
    if (verb === "e") {
      if (count === capacity) {
        tally.probes++;
        log.push(`enq ${op.slice(1) || "x"} -> OVERFLOW`);
        pushQ(
          `enqueue rejected: queue full (${count}/${capacity})`,
          `The tail would land on the head. With a fixed ring you must track occupancy separately from head/tail - otherwise head === tail is ambiguous between empty and full, which is the classic bug in this structure.`,
          "danger",
          null
        );
        continue;
      }
      const value = op.slice(1) || `#${++seq}`;
      const tail = (head + count) % capacity;
      slots[tail] = value;
      count++;
      tally.writes++;
      log.push(`enq ${value}`);
      pushQ(`enqueue ${value} into slot ${tail}`, tail === capacity - 1 && count < capacity ? `Filled the last slot. The next enqueue wraps to index 0 while the head is still somewhere in the middle - the queue occupies a ring, not a run.` : `${count} element(s) held. No shifting: writing at (head+count) mod ${capacity} is O(1).`, "active", tail);
    } else {
      if (!count) {
        tally.probes++;
        log.push(`deq -> EMPTY`);
        pushQ(`dequeue on an empty queue - ignored`, `Empty check first. In a circular buffer count===0 is unambiguous, which is why keeping a size field is the recommended implementation over the two-pointer trick.`, "danger", null);
        continue;
      }
      const value = slots[head];
      slots[head] = "";
      head = (head + 1) % capacity;
      count--;
      tally.comparisons++;
      log.push(`deq ${value}`);
      pushQ(
        `dequeue ${value} from slot ${(head - 1 + capacity) % capacity}`,
        head === 0 && count ? `Head wrapped past the end to index 0 and the queue continues there. Slots before the head are free but not contiguous - that is the price of the ring.` : `Oldest element removed, FIFO preserved. Both ends are O(1) with no reallocation, which is what a linked-list queue also gives you at the cost of a node per element.`,
        "good",
        null
      );
    }
  }
  const liveOrder = [];
  for (let k = 0; k < count; k++) liveOrder.push(slots[(head + k) % capacity]);
  pushQ(
    `final queue: [${liveOrder.join(", ")}] in order`,
    `Fixed memory, O(1) at both ends, and a full condition you have to detect on purpose. This is the structure behind ring buffers in audio, kernels and lock-free queues.`,
    "done",
    null
  );
  return frames;
}
var listAlgorithms = [
  { id: "reverse", label: "Reverse in place", note: "three pointers, one pass, no new nodes" },
  { id: "middle", label: "Middle node", note: "slow and fast pointers - one pass, no length needed" },
  { id: "cycle", label: "Floyd cycle detection", note: "tortoise and hare - O(1) space, finds the entry too" }
];
var chainFrame = (step, rows, marks, caption, detail, formula = "", tally = emptyTally()) => ({ kind: "chain", step, rows, marks, formula, tally, caption, detail });
function nodesOf(values, tone = "idle") {
  return values.map((text, i) => ({ id: `n${i}`, text, tone }));
}
function runList(input, algorithm = "reverse") {
  const fields = fieldMap(input);
  const values = (fields.get("list") ?? "17,2,35,1,48,63").split(/[,;\s]+/).filter(Boolean);
  const frames = [];
  const tally = emptyTally();
  const rowHead = nodesOf(values);
  const note = (i, total) => i === 0 ? "head" : i === total - 1 ? "tail -> null" : "";
  if (!values.length) {
    return [chainFrame(
      0,
      [{ label: "list", nodes: [], note: "no nodes" }],
      [],
      "empty list \xB7 head is null",
      `Type at least one value, for example list=17,2,35,1,48,63. Every list algorithm has to answer the empty case before it touches a pointer - head is null, so there is no node to read, no middle and no cycle.`,
      ""
    )];
  }
  if (algorithm === "cycle") {
    const entryRaw = (fields.get("entry") ?? "2").trim().toLowerCase();
    const entry = entryRaw === "none" || entryRaw === "null" || entryRaw === "-1" ? -1 : Math.max(0, Math.min(values.length - 1, intOf(entryRaw, 2)));
    const ids = values.map((_, i) => `n${i}`);
    const next = (n) => n < 0 ? -1 : n + 1 < values.length ? n + 1 : entry;
    frames.push(chainFrame(
      0,
      [{ label: "list", nodes: rowHead.map((n) => ({ ...n, tone: "active" })), note: entry < 0 ? "tail -> null, no back link" : `tail links back to node ${entry}` }],
      [{ id: ids[0], label: "head", tone: "active" }],
      entry < 0 ? `${values.length} nodes, tail points at null - nothing loops back` : `${values.length} nodes, and the last one points back to node ${entry}`,
      `A cycle means no node ever has next === null, so "walk to the end" never terminates. Floyd's trick uses the fact that two runners moving at different speeds must meet inside the loop - and it costs no extra memory, unlike a visited set.`,
      ""
    ));
    let slow = 0;
    let fast = 0;
    let met = -1;
    for (let step2 = 0; step2 < values.length * 3; step2++) {
      slow = next(slow);
      fast = next(next(fast));
      tally.comparisons++;
      if (slow < 0 || fast < 0) break;
      if (slow === fast) {
        met = slow;
        frames.push(chainFrame(
          frames.length,
          [{ label: "list", nodes: rowHead.map((n) => ({ ...n, tone: ids.indexOf(n.id) === slow ? "danger" : "ghost" })), note: `meet at node ${slow}` }],
          [{ id: ids[slow], label: "meet", tone: "danger" }],
          `tortoise and hare meet at node ${slow} after ${tally.comparisons} steps`,
          `They moved 2x and x; the gap closed by one each step, so a loop exists. Distance from the meeting point back to itself is a multiple of the loop length - that is the property the next phase exploits.`,
          "",
          { ...tally }
        ));
        break;
      }
      frames.push(chainFrame(
        frames.length,
        [{ label: "list", nodes: rowHead.map((n) => ({ ...n, tone: n.id === ids[slow] ? "active" : n.id === ids[fast] ? "danger" : "idle" })), note: `slow ${slow} \xB7 fast ${fast}` }],
        [{ id: ids[slow], label: "slow", tone: "active" }, { id: ids[fast], label: "fast", tone: "danger" }],
        `slow -> ${slow} \xB7 fast -> ${fast}`,
        `Hare takes two links per step, tortoise one. Inside a loop of length L they meet because their separation shrinks by exactly 1 per step - on a list with no cycle the hare simply falls off the end.`,
        "",
        { ...tally }
      ));
    }
    if (met < 0) {
      frames.push(chainFrame(
        frames.length,
        [{ label: "list", nodes: rowHead, note: "no cycle" }],
        [{ id: ids[0], label: "head", tone: "done" }],
        `no cycle - the hare reached null`,
        `Same code, no meet. The absence of a cycle is proven by fast hitting the end, which is why Floyd works for both questions at once.`,
        "",
        { ...tally }
      ));
      return frames;
    }
    let finder = 0;
    let guard = 0;
    while (finder !== met && guard++ < values.length + 1) {
      tally.writes++;
      finder = next(finder);
      met = next(met);
      frames.push(
        chainFrame(
          frames.length,
          [{ label: "list", nodes: rowHead.map((n) => ({ ...n, tone: ids.indexOf(n.id) === finder ? "active" : ids.indexOf(n.id) === met ? "done" : "ghost" })), note: `entry probe ${finder} \xB7 ring probe ${met}` }],
          [{ id: ids[finder], label: "from head", tone: "active" }, { id: ids[met], label: "from meet", tone: "done" }],
          `step ${guard}: head-side ${finder} vs meet-side ${met}`,
          `Restart one pointer at the head and move both one step at a time. Since (distance head->entry) equals (meet->entry going round the loop), they arrive at the entry together. It looks like magic and it is eight lines of algebra.`
        )
      );
      if (finder === met) break;
    }
    frames.push(chainFrame(
      frames.length,
      [{ label: "list", nodes: rowHead.map((n) => ({ ...n, tone: ids.indexOf(n.id) === finder ? "good" : "ghost" })), note: `cycle entry = node ${finder}` }],
      [{ id: ids[finder], label: "entry", tone: "good" }],
      `cycle starts at node ${finder} \xB7 ${tally.comparisons} pointer moves`,
      `O(n) time, O(1) space, and the entry located - which is exactly what LeetCode 142 asks and what a "did the pointer ever move twice" bug misses.`,
      "",
      { ...tally }
    ));
    return frames;
  }
  if (algorithm === "middle") {
    frames.push(chainFrame(
      0,
      [{ label: "list", nodes: rowHead, note: `head at 0 \xB7 ${values.length} nodes` }],
      [{ id: "n0", label: "slow", tone: "active" }, { id: "n0", label: "fast", tone: "danger" }],
      `${values.length} nodes \xB7 no length known`,
      `To find the middle you would normally count first, then walk again. Two pointers at speed 1 and 2 make the fast pointer's position encode the length, so one pass lands slow on the middle.`,
      ""
    ));
    let slow = 0;
    let fast = 0;
    while (fast < values.length - 1) {
      tally.writes += 2;
      slow++;
      fast += 2;
      frames.push(chainFrame(
        frames.length,
        [{ label: "list", nodes: rowHead.map((n) => ({ ...n, tone: Number(n.id.slice(1)) === slow ? "active" : Number(n.id.slice(1)) === fast ? "danger" : "idle" })), note: fast < values.length ? `slow ${slow} \xB7 fast ${fast}` : `slow ${slow} \xB7 fast stepped off the end` }],
        [{ id: `n${slow}`, label: "slow", tone: "active" }, ...fast < values.length ? [{ id: `n${fast}`, label: "fast", tone: "danger" }] : []],
        `slow -> index ${slow} \xB7 fast -> index ${fast}`,
        fast >= values.length - 1 ? `Fast is at or past the last node, so slow has covered exactly half the links. On an even-length list this is the second middle - move fast two at a time instead of checking fast.next to get the first one.` : `Fast is ${fast} links in, slow is ${slow}. The invariant is always fast = 2*slow, so slow is half the distance travelled so far.`,
        "",
        { ...tally }
      ));
    }
    frames.push(chainFrame(
      frames.length,
      [{ label: "list", nodes: rowHead.map((n) => ({ ...n, tone: Number(n.id.slice(1)) === slow ? "good" : "ghost" })), note: `middle = node ${slow}` }],
      [{ id: `n${slow}`, label: "middle", tone: "good" }],
      `middle is node ${slow} (value ${values[slow]}) in ${tally.writes / 2} steps`,
      `Same trick powers "is this list a palindrome" (find middle, reverse the second half, compare) and "remove the nth node from the end" (gap of n between two pointers). Once you see speed as information, the pattern stops being a trick.`,
      "",
      { ...tally }
    ));
    return frames;
  }
  const prev = [];
  for (let i = 0; i < values.length; i++) prev.push(i === 0 ? null : i - 1);
  frames.push(chainFrame(
    0,
    [{ label: "list", nodes: rowHead.map((n, i) => ({ ...n, tone: i === 0 ? "active" : "idle" })), note: "each node points right" }],
    [{ id: "n0", label: "prev=null", tone: "done" }, { id: "n0", label: "cur", tone: "active" }],
    `reverse ${values.length} nodes \xB7 three pointers`,
    `Reversing means changing where the arrows point, one node at a time. You need prev (the already-reversed part), cur (the node being flipped) and next (the survivor of the link you are about to overwrite). Losing next is the bug that destroys the list.`,
    "cur.next = prev",
    { ...tally }
  ));
  let cur = 0;
  let before = null;
  let step = 0;
  while (cur !== null) {
    const next = cur + 1 < values.length ? cur + 1 : null;
    const nodes = values.map((text, i) => {
      const tone = i === cur ? "active" : i < (cur ?? 0) ? "done" : "idle";
      return { id: `n${i}`, text, tone };
    });
    frames.push(chainFrame(
      frames.length,
      [{ label: "reversed part", nodes, note: `${next === null ? "tail" : `link to ${next}`}` }],
      [{ id: `n${cur}`, label: "cur", tone: "active" }, ...next !== null ? [{ id: `n${next}`, label: "next", tone: "danger" }] : [], ...before !== null ? [{ id: `n${before}`, label: "prev", tone: "done" }] : []],
      `flip node ${cur} (${values[cur]}): its next becomes ${before === null ? "null" : before}`,
      `The link we are about to write is the one we need for the next iteration, which is why next was captured first. After this step the segment 0..${cur} points backwards and the rest still points forwards - the boundary walks right.`,
      "cur.next = prev",
      { ...tally }
    ));
    prev[cur] = before;
    before = cur;
    cur = next;
    tally.writes++;
    step++;
  }
  const tailIndex = before ?? 0;
  const order = [];
  let walk2 = tailIndex;
  while (walk2 !== null) {
    order.push(walk2);
    walk2 = prev[walk2];
  }
  frames.push(chainFrame(
    frames.length,
    [{ label: "reversed list", nodes: order.map((i) => ({ id: `n${i}`, text: values[i], tone: "good" })), note: `new head is old node ${tailIndex}` }],
    [{ id: `n${tailIndex}`, label: "head", tone: "good" }],
    `reversed in ${step} pointer writes \xB7 [${order.map((i) => values[i]).join(" -> ")}]`,
    `O(n) time, O(1) extra space - three variables regardless of list length. Compare the naive answer of copying values into an array and rebuilding, which costs O(n) space and only looks like it works.`,
    "",
    { ...tally }
  ));
  return frames;
}
var hashAlgorithms = [
  { id: "chaining", label: "Separate chaining", note: "a collision grows the bucket's list" },
  { id: "linear", label: "Open addressing, linear probe", note: "a collision walks to the next free slot" },
  { id: "quadratic", label: "Open addressing, quadratic probe", note: "a collision steps 1, 4, 9 ... - less clustering" }
];
function hashStep(h, size, i, strategy) {
  if (strategy === "linear") return (h + i) % size;
  if (strategy === "quadratic") return (h + i * i) % size;
  return h;
}
function runHash(input, algorithm = "chaining") {
  const fields = fieldMap(input);
  const keys = numList(fields.get("keys"), [25, 72, 38, 33, 45, 71, 10]).map(Math.round);
  const size = Math.max(3, intOf(fields.get("size") ?? "", 7));
  const find = intOf(fields.get("find") ?? "", keys[keys.length - 1] ?? 0);
  const frames = [];
  const tally = emptyTally();
  const strategy = algorithm === "chaining" ? "chain" : algorithm;
  const buckets = Array.from({ length: size }, () => []);
  const table = new Array(size).fill(null);
  const hline = (k) => `h(${k}) = ${k} mod ${size} = ${(k % size + size) % size}`;
  frames.push(chainFrame(
    0,
    Array.from({ length: size }, (_, b) => ({ label: `${b}`, nodes: [], note: "empty" })),
    [],
    `${keys.length} keys into ${size} slots \xB7 ${strategy === "chain" ? "chaining" : "open addressing"}`,
    `The hash function only decides the preferred slot; the strategy decides what happens when it is taken. That second half is the interesting part - it controls clustering, probe length and when the structure degrades to a linear scan.`,
    `h(k) = k mod ${size}`
  ));
  keys.forEach((key, order) => {
    const h = (key % size + size) % size;
    if (strategy === "chain") {
      const collision = buckets[h].length > 0;
      buckets[h].push(key);
      tally.writes++;
      if (collision) tally.probes++;
      frames.push(chainFrame(
        frames.length,
        buckets.map((bucket, b) => ({
          label: `${b}`,
          nodes: bucket.map((v, idx) => ({ id: `${v}-${idx}`, text: String(v), tone: b === h ? idx === bucket.length - 1 ? "active" : "done" : "idle" })),
          note: b === h ? collision ? `${bucket.length} keys - collision` : "first key" : bucket.length ? `${bucket.length}` : "empty"
        })),
        [{ id: `${key}-${buckets[h].length - 1}`, label: collision ? "collision" : "placed", tone: collision ? "danger" : "good" }],
        `insert ${key} -> ${hline(key)}${collision ? ` \xB7 bucket ${h} already held ${bucket0(buckets, h, key)} - chain grows` : ""}`,
        collision ? `Chaining never displaces an existing key, so deletion is easy and the load factor can pass 1. The cost is that a bucket becomes a list: average search is 1 + alpha/2 comparisons where alpha = keys/slots = ${(buckets.reduce((s, b) => s + b.length, 0) / size).toFixed(2)}.` : `Empty bucket, one write. With ${keys.length} keys in ${size} slots the expected load factor ends at ${(keys.length / size).toFixed(2)} and the chance of a collision rises fast - it is roughly 1 - e^(-alpha) per key.`,
        hline(key),
        { ...tally }
      ));
    } else {
      let probes = 0;
      let slot = hashStep(h, size, probes, strategy);
      while (table[slot] !== null && probes < size) {
        probes++;
        tally.comparisons++;
        slot = hashStep(h, size, probes, strategy);
      }
      if (probes >= size) {
        frames.push(chainFrame(
          frames.length,
          rowsOf(table, buckets, h, "danger"),
          [],
          `insert ${key} FAILED: ${size} probes without a free slot`,
          table.every((t) => t !== null) ? `Open addressing cannot chain and every slot is taken, so the only moves left are rehash into a bigger table (standard: grow when load factor passes ~0.7) or fail. That is why load factor matters far more here than for chaining.` : `Look at the table: slot ${table.findIndex((t) => t === null)} is empty and this insert still failed. h + i\xB2 mod ${size} only lands on about half the residues when the size is prime, so quadratic probing can circle past a free slot forever. The rule it implies - prime size AND load factor under 0.5 - is not folklore, it is what makes the probe sequence exhaustive.`,
          hline(key),
          { ...tally }
        ));
        return;
      }
      table[slot] = key;
      tally.writes++;
      tally.probes += probes;
      frames.push(chainFrame(
        frames.length,
        rowsOf(table, buckets, slot, probes ? "danger" : "good"),
        [{ id: `s${slot}`, label: probes ? `placed after ${probes} probes` : "placed", tone: probes ? "danger" : "good" }],
        `insert ${key} -> ${hline(key)}${probes ? ` \xB7 ${probes} probe(s) to slot ${slot}` : " \xB7 slot free first try"}`,
        probes ? `${probes} preferred slots were occupied. ${strategy === "linear" ? "Linear probing is cache-friendly - consecutive memory - but it makes primary clustering: one long run of filled slots attracts every key that hashes into it, and the run grows." : "Quadratic probing hops by 1, 4, 9 ... which breaks up primary clustering, though it only guarantees a free slot if the table is at least half empty and the size is prime."}` : `No collision, so the probe sequence stopped at once - one array read per operation is the dream case for open addressing.`,
        hline(key),
        { ...tally }
      ));
    }
  });
  const total = keys.length;
  const load = strategy === "chain" ? total / size : table.filter((t) => t !== null).length / size;
  frames.push(chainFrame(
    frames.length,
    rowsOf(table, buckets, null, "idle"),
    [],
    `table built \xB7 ${total} keys in ${size} slots \xB7 load factor ${load.toFixed(2)}`,
    `Everything about hash table speed is the load factor. Below ~0.7 the average probe count stays a small constant; above 1 with open addressing inserts start failing. That constant is why "O(1) average, O(n) worst" is the honest complexity.`,
    "",
    { ...tally }
  ));
  let foundAt = null;
  let probeLog = 0;
  if (strategy === "chain") {
    const h = (find % size + size) % size;
    const chain = buckets[h];
    foundAt = chain.includes(find) ? h : null;
    chain.forEach((v, idx) => {
      probeLog++;
      tally.comparisons++;
      const hit = v === find;
      frames.push(chainFrame(
        frames.length,
        buckets.map((bucket, b) => ({
          label: `${b}`,
          nodes: bucket.map((x, i) => ({ id: `${x}-${i}`, text: String(x), tone: b === h ? i < probeLog - 1 ? "ghost" : hit && i === idx ? "good" : "active" : "idle" })),
          note: b === h ? `comparing ${probeLog}/${bucket.length}` : bucket.length ? `${bucket.length}` : "empty"
        })),
        [{ id: `${v}-${idx}`, label: hit ? "found" : "not it", tone: hit ? "good" : "active" }],
        `lookup ${find}: ${hline(find)} \xB7 walk bucket ${h}, see ${v}${hit ? " - match" : ""}`,
        hit ? `Match after ${probeLog} comparison(s) inside bucket ${h}. This is exactly the moment a hash table degenerates into "hash, then linear scan of a short list" - and why a bad hash function that dumps everything into one bucket makes the whole table O(n).` : `Not this one, keep walking the chain. Comparisons so far: ${probeLog}.`,
        hline(find),
        { ...tally }
      ));
    });
    if (!chain.includes(find)) {
      frames.push(
        chainFrame(
          frames.length,
          buckets.map((bucket, b) => ({ label: `${b}`, nodes: bucket.map((x, i) => ({ id: `${x}-${i}`, text: String(x), tone: "idle" })), note: b === h ? `${chain.length} checked, absent` : bucket.length ? `${bucket.length}` : "empty" })),
          [],
          `lookup ${find}: absent after ${chain.length} comparisons`,
          `A miss costs the same as a hit at the end of the chain, which is why lookups on hostile input are the DoS vector behind "hash flooding" attacks - and why languages randomise the hash seed.`
        )
      );
    }
  } else {
    const h = (find % size + size) % size;
    for (let i = 0; i < size; i++) {
      const slot = hashStep(h, size, i, strategy);
      const value = table[slot];
      probeLog++;
      if (value === find) {
        foundAt = slot;
        frames.push(chainFrame(
          frames.length,
          rowsOf(table, buckets, slot, "good"),
          [{ id: `s${slot}`, label: `found after ${probeLog}`, tone: "good" }],
          `lookup ${find}: found at slot ${slot} after ${probeLog} probe(s)`,
          `Terminating on the first match is only safe because of deletion bookkeeping: removing a key outright would break every probe sequence that walked through it, which is why open addressing needs a tombstone marker instead of a null.`,
          hline(find),
          { ...tally, comparisons: tally.comparisons + 1 }
        ));
        break;
      }
      if (value === null) {
        frames.push(chainFrame(
          frames.length,
          rowsOf(table, buckets, slot, "danger"),
          [{ id: `s${slot}`, label: "empty - absent", tone: "danger" }],
          `lookup ${find}: empty slot at ${slot} after ${probeLog} probe(s) - absent`,
          `An empty slot proves absence: had the key been inserted it would have stopped here. This is the invariant that tombstones quietly break, and the reason a table full of tombstones behaves like a full table.`,
          hline(find),
          { ...tally, comparisons: tally.comparisons + 1 }
        ));
        foundAt = null;
        break;
      }
      frames.push(chainFrame(
        frames.length,
        rowsOf(table, buckets, slot, "active"),
        [{ id: `s${slot}`, label: `probe ${probeLog}`, tone: "active" }],
        `lookup ${find}: slot ${slot} holds ${value}, keep probing`,
        `${value} is a different key that collided into this slot. ${strategy === "linear" ? "With linear probing every key in the run must be checked, so long runs hurt lookups for keys that hash anywhere inside them." : "Quadratic probing leaves the run immediately but pays for it with a longer, less predictable path."}`,
        hline(find),
        { ...tally, comparisons: tally.comparisons + 1 }
      ));
      if (i === size - 1) {
        frames.push(chainFrame(
          frames.length,
          rowsOf(table, buckets, null, "danger"),
          [],
          `lookup ${find}: probed all ${size} slots, absent`,
          `Full circle without a match. Only reachable in a table with no empty slot - another argument for aggressive rehashing.`,
          hline(find),
          { ...tally }
        ));
      }
    }
  }
  const chainPos = strategy === "chain" && foundAt !== null ? buckets[foundAt].indexOf(find) : -1;
  frames.push(chainFrame(
    frames.length,
    rowsOf(table, buckets, foundAt, "done"),
    foundAt === null || strategy === "chain" && chainPos < 0 ? [] : [{ id: strategy === "chain" ? `${find}-${chainPos}` : `s${foundAt}`, label: "result", tone: "good" }],
    `${find} ${foundAt === null ? "is not in the table" : strategy === "chain" ? `lives in bucket ${foundAt}, entry ${chainPos + 1}` : `lives in slot ${foundAt}`} \xB7 ${probeLog} ${strategy === "chain" ? "bucket comparison(s)" : "probe(s)"}`,
    `Read the number sideways: a perfectly uniform hash on ${size} slots costs about ${strategy === "chain" ? "1 + load/2" : "1/(1-load)"} probes at this load factor. If it were an ordered array you would have needed ${Math.ceil(Math.log2(Math.max(2, total)))} comparisons - similar! The hash table's win is that the cost does not grow with n at all.`,
    "",
    { ...tally }
  ));
  return frames;
}
var bucket0 = (buckets, h, key) => {
  const list = buckets[h].filter((v) => v !== key);
  return list.length === 1 ? `${list[0]}` : `${list.slice(-1)[0]} (+${list.length - 1} more)`;
};
function rowsOf(table, buckets, hot, tone) {
  if (table.some((t) => t !== null)) {
    return table.map((value, slot) => ({
      label: `${slot}`,
      nodes: value === null ? [] : [{ id: `s${slot}`, text: String(value), tone: slot === hot ? tone : "done" }],
      note: value === null ? "empty" : slot === hot ? "probe lands here" : "occupied"
    }));
  }
  return buckets.map((bucket, b) => ({
    label: `${b}`,
    nodes: bucket.map((v, i) => ({ id: `${v}-${i}`, text: String(v), tone: b === hot ? tone : "idle" })),
    note: bucket.length ? `${bucket.length}` : "empty"
  }));
}
function hashSummary(input) {
  const fields = fieldMap(input);
  const keys = numList(fields.get("keys"), [25, 72, 38, 33, 45, 71, 10]).map(Math.round);
  const size = Math.max(3, intOf(fields.get("size") ?? "", 7));
  const find = intOf(fields.get("find") ?? "", keys[keys.length - 1] ?? 0);
  const probe = `keys=${keys.join(",")};size=${size};find=${find}`;
  return hashAlgorithms.map((option) => {
    const frames = runHash(probe, option.id);
    const last = frames[frames.length - 1];
    return { ...option, comparisons: last.tally.comparisons + last.tally.probes, writes: last.tally.writes };
  });
}
var graphAlgorithms = [
  { id: "bfs", label: "Breadth-first", note: "queue - shortest path in hops, level by level" },
  { id: "dfs", label: "Depth-first", note: "stack or recursion - explores to the wall first" },
  { id: "dijkstra", label: "Dijkstra", note: "priority queue - shortest path in weight, no negatives" }
];
function parseGraph(input) {
  const raw = (fieldMap(input).get("edges") ?? "").trim();
  const text = raw || "A-B:4, A-D:1, B-C:2, C-D:1, B-E:5, D-E:3, E-F:2, C-F:6";
  const adj = /* @__PURE__ */ new Map();
  let weighted = false;
  for (const piece of text.split(/[,;\n]+/)) {
    const m = piece.trim().match(/^([A-Za-z0-9]+)\s*[-<>=]\s*([A-Za-z0-9]+)(?:[:/]\s*(-?\d+))?$/);
    if (!m) continue;
    const [, a, b, w] = m;
    const weight = w === void 0 ? 1 : Number.parseInt(w, 10);
    if (!Number.isFinite(weight)) continue;
    if (w !== void 0) weighted = true;
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push({ to: b, weight });
    adj.get(b).push({ to: a, weight });
  }
  for (const list of adj.values()) list.sort((x, y) => x.to.localeCompare(y.to));
  return { ids: [...adj.keys()], adj, weighted };
}
var circle = (ids) => {
  const layout = /* @__PURE__ */ new Map();
  ids.forEach((id, i) => {
    const angle = i / ids.length * Math.PI * 2 - Math.PI / 2;
    layout.set(id, { x: 130 + Math.cos(angle) * 108, y: 122 + Math.sin(angle) * 96 });
  });
  return layout;
};
function graphSnapshot(graph, step, visited, frontier, current, edgesOn, caption, detail, table, lanes, tally, nodeValue) {
  const layout = circle(graph.ids);
  const nodes = graph.ids.map((id) => ({
    id,
    x: Math.round(layout.get(id).x),
    y: Math.round(layout.get(id).y),
    tone: current === id ? "active" : visited.includes(id) ? "done" : frontier.includes(id) ? "good" : "idle",
    value: nodeValue ? nodeValue(id) : id
  }));
  const edges = [];
  for (const [from, list] of graph.adj) {
    for (const link of list) {
      if (from.localeCompare(link.to) > 0) continue;
      const on = edgesOn.some(([a, b]) => a === from && b === link.to || a === link.to && b === from);
      edges.push({ a: from, b: link.to, weight: graph.weighted ? link.weight : null, tone: on ? "good" : "idle" });
    }
  }
  return { kind: "graph", step, nodes, edges, visited, frontier, current, table, tally, caption, detail };
}
function runGraph(input, algorithm = "bfs") {
  const graph = parseGraph(input);
  const fields = fieldMap(input);
  const start = fields.get("start") || graph.ids[0] || "A";
  const target = fields.get("find") || "";
  const frames = [];
  const tally = emptyTally();
  const visited = [];
  const treeEdges = [];
  const table = [];
  if (!graph.ids.length) {
    frames.push(graphSnapshot(
      { ids: [], adj: /* @__PURE__ */ new Map(), weighted: false },
      0,
      [],
      [],
      null,
      [],
      "no edges parsed",
      `Graph edges are written A-B or A-B:weight separated by commas. Type your own adjacency list and the traversal re-runs on it.`,
      [],
      [],
      { ...tally }
    ));
    return frames;
  }
  if (!graph.adj.has(start)) {
    frames.push(graphSnapshot(
      graph,
      0,
      [],
      [],
      null,
      [],
      `"${start}" is not a node in this graph`,
      `The traversal needs a vertex that exists. Known vertices: ${graph.ids.join(", ")}.`,
      [],
      [],
      { ...tally }
    ));
    return frames;
  }
  if (algorithm === "dijkstra") {
    const dist = /* @__PURE__ */ new Map();
    const via = /* @__PURE__ */ new Map();
    const done = /* @__PURE__ */ new Set();
    for (const id of graph.ids) dist.set(id, Infinity);
    dist.set(start, 0);
    const snap = (caption, detail, current, frontier, on, nodeValue) => frames.push(graphSnapshot(
      graph,
      frames.length,
      [...done],
      frontier,
      current,
      on,
      caption,
      detail,
      graph.ids.map((id) => ({ id, dist: dist.get(id) === Infinity ? "inf" : String(dist.get(id)), via: via.get(id) ?? "-", tone: current === id ? "active" : done.has(id) ? "done" : "idle" })),
      [{ label: "priority queue (nearest first)", items: frontier, hot: 0, tone: "active", note: `${frontier.length} waiting` }],
      { ...tally },
      nodeValue ?? ((id) => dist.get(id) === Infinity ? "inf" : String(dist.get(id)))
    ));
    snap(
      `start at ${start} with distance 0, every other vertex infinite`,
      `Dijkstra keeps one invariant: the finished set holds vertices whose shortest distance is already proven. Everything else is a current best guess that may still be lowered.`,
      null,
      [],
      []
    );
    for (; ; ) {
      const frontier = graph.ids.filter((id) => !done.has(id));
      if (!frontier.length) break;
      frontier.sort((a, b) => dist.get(a) - dist.get(b) || a.localeCompare(b));
      const u = frontier[0];
      if (dist.get(u) === Infinity) {
        snap(
          `remaining vertices are unreachable from ${start}`,
          `The smallest tentative distance is still infinite, so nothing left is reachable. Real graphs are often disconnected and this exit path is the correct answer, not an error.`,
          u,
          [],
          []
        );
        break;
      }
      done.add(u);
      tally.probes++;
      snap(
        `settle ${u} at distance ${dist.get(u)}`,
        `Picking the minimum unsettled vertex is the whole algorithm. Once ${u} is settled no later path can beat ${dist.get(u)}, because any alternative route would have to go through a vertex that is at least as far away.`,
        u,
        frontier,
        []
      );
      for (const link of graph.adj.get(u)) {
        if (done.has(link.to)) continue;
        tally.comparisons++;
        const candidate = dist.get(u) + link.weight;
        const previous = dist.get(link.to);
        if (candidate < previous) {
          dist.set(link.to, candidate);
          via.set(link.to, u);
          tally.writes++;
          snap(
            `relax ${u}->${link.to}: ${dist.get(u)} + ${link.weight} = ${candidate}, better than the old ${previous === Infinity ? "infinity" : previous}`,
            `The path through ${u} is now the best known way to reach ${link.to}. Each edge is relaxed at most once from each settled endpoint, which is why the total work is O(E) relaxations plus the queue.`,
            u,
            frontier,
            [[u, link.to]]
          );
        } else {
          snap(
            `edge ${u}->${link.to} (${link.weight}) does not improve ${link.to}`,
            `Rejected: reaching ${link.to} any other settled way already costs ${dist.get(link.to)}. Not every relaxation succeeds, and the failures are what prove the distances optimal.`,
            u,
            frontier,
            [[u, link.to]]
          );
        }
      }
      if (target && done.has(target)) {
        snap(
          `target ${target} settled at ${dist.get(target)} - stop early`,
          `Once the target is popped its distance is final, so the rest of the graph never needs to be touched. That early exit is what makes Dijkstra usable for "shortest route between two places" instead of all-pairs.`,
          target,
          graph.ids.filter((id) => !done.has(id)),
          []
        );
        break;
      }
    }
    const path = [];
    if (target && dist.get(target) !== Infinity) {
      let walk = target;
      while (walk) {
        path.unshift(walk);
        walk = via.get(walk);
      }
    }
    snap(
      `done \xB7 ${start} to ${target || "all"} = ${target ? dist.get(target) === Infinity ? "unreachable" : dist.get(target) : "see table"}`,
      target ? `Route ${path.join(" -> ")} costs ${dist.get(target)}. Reconstructing it from the parent pointers is one walk up the chain - store the parents or you have recomputed the search to get the path back.` : `Every distance proven in ${tally.comparisons} relaxations. Without a priority queue this is the O(V squared) array version; a binary heap makes it O((V+E) log V).`,
      null,
      [],
      []
    );
    return frames;
  }
  const order = [];
  const level = /* @__PURE__ */ new Map();
  const parent = /* @__PURE__ */ new Map();
  if (algorithm === "dfs") {
    const stack = [start];
    const seen2 = /* @__PURE__ */ new Set();
    const snapD = (caption, detail, current, frontier, on = []) => frames.push(graphSnapshot(
      graph,
      frames.length,
      visited,
      frontier,
      current,
      on,
      caption,
      detail,
      graph.ids.map((id) => ({ id, dist: seen2.has(id) ? `depth ${level.get(id)}` : "unseen", via: parent.get(id) ?? "-", tone: current === id ? "active" : visited.includes(id) ? "done" : "idle" })),
      [{ label: "stack (last in, first out)", items: [...stack], hot: stack.length - 1, tone: "active", note: `${stack.length} pending` }],
      { ...tally }
    ));
    snapD(
      `push ${start} \xB7 depth-first explores one branch all the way down`,
      `DFS is BFS with the container swapped for a stack. That single change turns "nearest first" into "deepest first", which is why it finds a path but never the shortest one in hops.`,
      null,
      []
    );
    while (stack.length) {
      const id = stack.pop();
      if (seen2.has(id)) continue;
      seen2.add(id);
      visited.push(id);
      order.push(id);
      tally.probes++;
      snapD(
        `visit ${id} \xB7 depth ${level.get(id) ?? 0}`,
        `Marked on pop, so a vertex that was queued twice is skipped the second time. ${graph.adj.get(id).length} neighbours are now candidates - pushing them in reverse order means the alphabetically first one is explored next.`,
        id,
        [...stack]
      );
      const neighbours = graph.adj.get(id);
      const fresh = neighbours.filter((n) => !seen2.has(n.to));
      for (const link of neighbours) {
        tally.comparisons++;
        if (seen2.has(link.to) && link.to !== parent.get(id)) {
          snapD(
            `edge ${id}->${link.to} already visited \xB7 back/cross edge`,
            link.to === parent.get(id) ? `That is just the edge we came in on, so ignore it.` : `An edge to an already-seen vertex that is not the parent. In an undirected graph that means a cycle exists - DFS is the cheapest cycle detector there is.`,
            id,
            [...stack],
            [[id, link.to]]
          );
          continue;
        }
        if (!seen2.has(link.to)) {
          level.set(link.to, (level.get(id) ?? 0) + 1);
          parent.set(link.to, id);
          stack.push(link.to);
          treeEdges.push([id, link.to]);
          snapD(
            `push ${link.to} from ${id} \xB7 going deeper`,
            `${link.to} is now on top of the stack, so it is explored before any of ${fresh.length - 1} other candidate(s) at this level. That is the definition of depth-first, and why memory is O(depth) rather than O(width).`,
            id,
            [...stack],
            [[id, link.to]]
          );
        }
      }
    }
    snapD(
      `DFS order: ${order.join(" -> ")}`,
      `This is also the recursion order if you write the recursive version - the call stack IS the stack. Preorder numbers discovery, postorder numbers when a subtree finishes, and the difference is what makes topological sort possible.`,
      null,
      []
    );
    return frames;
  }
  const queue = [start];
  const seen = /* @__PURE__ */ new Set([start]);
  level.set(start, 0);
  const snapB = (caption, detail, current, on) => frames.push(graphSnapshot(
    graph,
    frames.length,
    visited,
    queue,
    current,
    on,
    caption,
    detail,
    graph.ids.map((id) => ({ id, dist: seen.has(id) ? `${level.get(id)} hop${level.get(id) === 1 ? "" : "s"}` : "unseen", via: parent.get(id) ?? "-", tone: current === id ? "active" : visited.includes(id) ? "done" : queue.includes(id) ? "good" : "idle" })),
    [{ label: "queue (first in, first out)", items: [...queue], hot: queue.length - 1, tone: "active", note: `${queue.length} waiting` }],
    { ...tally }
  ));
  snapB(
    `enqueue ${start} at level 0`,
    `BFS is a flood: the queue holds exactly the frontier - discovered but not yet expanded. Because every edge costs one hop, anything dequeued has the minimum possible hop count, and it never needs revisiting.`,
    null,
    []
  );
  while (queue.length) {
    const id = queue.shift();
    visited.push(id);
    order.push(id);
    tally.probes++;
    snapB(
      `dequeue ${id} \xB7 level ${level.get(id)}`,
      `${id}` + (level.get(id) === 0 ? ` is the source, so its distance is 0 by definition.` : ` was enqueued by ${parent.get(id)} at level ${(level.get(id) ?? 1) - 1}, so the shortest hop path to it is ${level.get(id)}. Anything discovered later is at least this far.`),
      id,
      []
    );
    for (const link of graph.adj.get(id)) {
      tally.comparisons++;
      if (seen.has(link.to)) {
        if (parent.get(id) !== link.to) {
          snapB(
            `edge ${id}->${link.to} leads to an already-seen vertex`,
            `${link.to} was reached in ${level.get(link.to)} hop(s), and reaching it through ${id} would cost ${(level.get(id) ?? 0) + 1}. No improvement, so it is skipped - and if ${link.to} is an ancestor this edge closes a cycle.`,
            id,
            [[id, link.to]]
          );
        }
        continue;
      }
      seen.add(link.to);
      level.set(link.to, (level.get(id) ?? 0) + 1);
      parent.set(link.to, id);
      queue.push(link.to);
      treeEdges.push([id, link.to]);
      snapB(
        `discover ${link.to} at level ${level.get(link.to)} via ${id}`,
        `${link.to} enters the queue behind ${queue.length - 1} other vertex/vertices at the same level. Because the queue is FIFO, all of level ${(level.get(id) ?? 0) + 1} will be dequeued before any of level ${(level.get(id) ?? 0) + 2} - that ordering IS the proof of shortest hops.`,
        id,
        [[id, link.to]]
      );
    }
    if (target && visited.includes(target)) {
      snapB(
        `target ${target} reached in ${level.get(target)} hops`,
        `Stop here for a single-pair shortest-hop question; drop the early exit to get every distance. Path: ${buildPath(parent, start, target).join(" -> ")}.`,
        target,
        []
      );
      return frames;
    }
  }
  snapB(
    `BFS order: ${order.join(" -> ")}`,
    target ? `${target} was never dequeued, so it is unreachable from ${start}. BFS proves non-existence as confidently as existence - the queue drained with vertices still unseen.` : `Levels are now final. BFS also gives you the connected component, and the same machinery with a bit-counting queue is the basis of shortest-word-ladder problems.`,
    null,
    []
  );
  return frames;
}
function buildPath(parent, start, target) {
  const path = [target];
  let walk = target;
  while (walk !== start) {
    const next = parent.get(walk);
    if (!next) break;
    path.unshift(next);
    walk = next;
  }
  return path;
}
function runUnionFind(input) {
  const fields = fieldMap(input);
  const pairsText = (fields.get("unions") ?? "0-1,2-3,4-5,1-4,0-5,3-6,2-6").split(/[,;\s]+/).filter(Boolean);
  const n = Math.max(2, intOf(fields.get("n") ?? "", 7));
  const parent = new Array(n).fill(0).map((_, i) => i);
  const rank = new Array(n).fill(0);
  const frames = [];
  const tally = emptyTally();
  const find = [];
  const draw = (focus, tone, caption, detail, lanes = []) => {
    const nodes = [];
    const edges = [];
    for (let i = 0; i < n; i++) nodes.push({ id: String(i), text: String(i), tone: tone(i), note: parent[i] === i ? "root" : `under ${parent[i]}` });
    for (let i = 0; i < n; i++) if (parent[i] !== i) edges.push({ from: String(parent[i]), to: String(i), tone: tone(i) });
    frames.push(treeFrame(frames.length, nodes, edges, focus.map(String), caption, detail, lanes, { ...tally }));
    find.length = 0;
  };
  const rootOf = (x, log) => {
    let cur = x;
    while (parent[cur] !== cur) {
      if (log) find.push(cur);
      cur = parent[cur];
    }
    if (log) find.push(cur);
    return cur;
  };
  draw(
    [],
    () => "idle",
    `${n} singleton sets \xB7 every element is its own root`,
    `Union-find answers one question only, and answers it in (practically) constant time: are these two in the same group? It does that by keeping a forest of shallow trees, so the structure is "just pointers up" - nothing about adjacency or order is preserved.`
  );
  for (const piece of pairsText) {
    const m = piece.match(/^(\d+)\D+(\d+)$/);
    if (!m) continue;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a >= n || b >= n) continue;
    const ra = rootOf(a, true);
    const pathA = [...find];
    const rb = rootOf(b, true);
    const pathB = [...find];
    draw(
      [...pathA, ...pathB],
      (i) => i === ra || i === rb ? "active" : pathA.includes(i) || pathB.includes(i) ? "done" : "idle",
      `find(${a}) = ${ra} \xB7 find(${b}) = ${rb}`,
      `Both queries walked up parent pointers. Path length here is ${pathA.length - 1} + ${pathB.length - 1}; keeping trees flat is the entire performance story of this structure.`,
      [{ label: `union ${a}-${b}`, items: [`root ${ra}`, `root ${rb}`], hot: 1, tone: "active", note: ra === rb ? "already together" : "different sets" }]
    );
    if (ra === rb) {
      tally.comparisons++;
      draw(
        [ra],
        (i) => i === ra ? "danger" : "idle",
        `${a} and ${b} are already in the same set`,
        `No union performed. This exact test - "does this edge connect two vertices that are already reachable?" - is the cycle check inside Kruskal's minimum spanning tree, which is why union-find and MST are always taught together.`
      );
      continue;
    }
    const attachHigh = rank[ra] < rank[rb];
    const big = attachHigh ? rb : ra;
    const small = attachHigh ? ra : rb;
    parent[small] = big;
    if (rank[ra] === rank[rb]) rank[big]++;
    tally.writes++;
    draw(
      [small, big],
      (i) => i === small ? "active" : i === big ? "good" : "idle",
      `link ${small} under ${big} \xB7 now ${a} and ${b} share root ${rootOf(a, false)}`,
      `Union by rank always hangs the shorter tree under the taller one, so the merged depth grows only when the two depths are equal. That single rule bounds height at log n before any path compression.`
    );
  }
  let compress = 0;
  for (let i = 0; i < n; i++) {
    const chain = [];
    let cur = i;
    while (parent[cur] !== cur) {
      chain.push(cur);
      cur = parent[cur];
    }
    if (chain.length <= 1) continue;
    for (const node of chain) parent[node] = cur;
    compress += chain.length;
    draw(
      [i, ...chain],
      (x) => x === cur ? "good" : chain.includes(x) ? "active" : "idle",
      `path compression on ${i}: ${chain.join(" -> ")} -> ${cur}`,
      `Every node on the walked path is re-parented straight to the root, so the next query on any of them costs one hop. Compression alone gives near-O(1) amortised performance; with rank the bound is the inverse Ackermann function, which is a constant for all practical n.`
    );
  }
  const roots = new Set(parent.map((_, i) => rootOf(i, false)));
  draw(
    [],
    (i) => parent[i] === i ? "good" : "idle",
    `${roots.size} component(s) remain \xB7 ${compress} edge(s) flattened`,
    `Final forest has ${roots.size} root(s): [${[...roots].join(", ")}]. Connected components, cycle detection, account merging, image segmentation and Kruskal all reduce to this: a forest you can query in almost constant time.`,
    [{ label: "components", items: [...roots].map((r) => `root ${r}`), hot: null, tone: "done", note: `${roots.size} sets` }]
  );
  return frames;
}
var dpAlgorithms = [
  { id: "knapsack", label: "0/1 knapsack", note: "take or skip each item once - best value under capacity" },
  { id: "lcs", label: "Longest common subsequence", note: "two strings, diagonal when characters match" },
  { id: "coins", label: "Coin change (count ways)", note: "unbounded - reuse a coin as often as you like" }
];
var cell = (r, c, text, tone = "idle") => ({ r, c, text, tone });
function runDp(input, algorithm = "knapsack") {
  const fields = fieldMap(input);
  const frames = [];
  const tally = emptyTally();
  const push = (cells2, rowLabels2, colLabels2, active, sources, caption, detail, lanes = [], tone = { ...tally }) => frames.push({ kind: "grid", step: frames.length, rowLabels: rowLabels2, colLabels: colLabels2, cells: cells2, active, sources, lanes, tally: tone, caption, detail });
  if (algorithm === "lcs") {
    const a = (fields.get("a") ?? "AGGTAB").trim() || "AGGTAB";
    const b = (fields.get("b") ?? "GXTXAYB").trim() || "GXTXAYB";
    const rows = a.length + 1;
    const cols = b.length + 1;
    const dp2 = Array.from({ length: rows }, () => new Array(cols).fill(0));
    const rowLabels2 = ["-"].concat([...a]);
    const colLabels2 = ["-"].concat([...b]);
    const show2 = (hot, src, caption, detail, settled2, tone = "active") => {
      const grid = [];
      for (let i = 0; i < rows; i++) {
        const rowCells = [];
        for (let j = 0; j < cols; j++) {
          const isHot = hot[0] === i && hot[1] === j;
          const isSrc = src.some(([r, c]) => r === i && c === j);
          const done = settled2.some(([r, c]) => r === i && c === j);
          rowCells.push(cell(i, j, done || isHot || isSrc ? String(dp2[i][j]) : "", isHot ? tone : isSrc ? "danger" : done ? "done" : "idle"));
        }
        grid.push(rowCells);
      }
      push(grid, rowLabels2, colLabels2, hot, src, caption, detail, [{ label: "filled", items: [`${settled2.length + 1}/${rows * cols - cols - rows + 1}`], hot: 0, tone: "idle", note: "row by row" }], { ...tally });
    };
    const settled = [];
    for (let j = 0; j < cols; j++) settled.push([0, j]);
    for (let i = 0; i < rows; i++) settled.push([i, 0]);
    show2(
      [0, 0],
      [],
      `row 0 and column 0 are all zeros`,
      `An empty prefix of either string shares nothing. Seeding the border is what lets the recurrence run without special cases - the same trick as prefix[0] = 0 in a prefix-sum array.`,
      settled
    );
    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        tally.comparisons++;
        if (a[i - 1] === b[j - 1]) {
          dp2[i][j] = dp2[i - 1][j - 1] + 1;
          tally.writes++;
          show2(
            [i, j],
            [[i - 1, j - 1]],
            `"${a[i - 1]}" matches "${b[j - 1]}" \xB7 diagonal + 1 = ${dp2[i][j]}`,
            `When the characters agree, both strings advance together, so the answer inherits the diagonal and adds one. This is the only place the matched characters are actually recorded, which is why reconstruction walks the same diagonal backwards.`,
            settled
          );
        } else {
          dp2[i][j] = Math.max(dp2[i - 1][j], dp2[i][j - 1]);
          tally.writes++;
          const from = dp2[i - 1][j] >= dp2[i][j - 1] ? [[i - 1, j]] : [[i, j - 1]];
          show2(
            [i, j],
            from,
            `no match at row ${i} / col ${j} \xB7 take the better neighbour = ${dp2[i][j]}`,
            `Mismatching tails cannot both be used, so the answer is whichever prefix pair was already better. Note which neighbour wins here: ${from[0][0] === i - 1 ? "above (drop a's character)" : "left (drop b's character)"}. diff and git use this exact table.`,
            settled
          );
        }
        settled.push([i, j]);
      }
    }
    const lcsText = backTrackLcs(a, b, dp2);
    show2(
      [rows - 1, cols - 1],
      [],
      `LCS length ${dp2[rows - 1][cols - 1]}${lcsText ? ` \xB7 "${lcsText}"` : ""}`,
      `O(n*m) time and space for the table. Space drops to O(min(n,m)) if you only need the length, but not if you need to print the sequence - that is the trade the interview question actually probes.`,
      settled
    );
    return frames;
  }
  if (algorithm === "coins") {
    const coins = numList(fields.get("coins"), [1, 2, 3]).map(Math.round).filter((v) => v > 0);
    const amount = Math.max(1, Math.min(30, intOf(fields.get("amount") ?? "", 5)));
    const dp2 = new Array(amount + 1).fill(0);
    dp2[0] = 1;
    const rowLabels2 = ["ways"];
    const colLabels2 = Array.from({ length: amount + 1 }, (_, target) => `${target}`);
    const show2 = (hot, caption, detail, tone = "active") => {
      const grid = [dp2.map((value, target) => cell(0, target, String(value), hot && hot[1] === target ? tone : "done"))];
      push(grid, rowLabels2, colLabels2, hot, [], caption, detail, [{ label: "coin being added", items: coins.map(String), hot: coins.indexOf(coins[Math.max(0, Math.floor((hot?.[1] ?? 0) / (amount + 1)))]), tone: "idle", note: "outer loop" }], { ...tally });
    };
    show2(
      [0, 0],
      `ways[0] = 1, everything else 0`,
      `One way to make amount 0: use nothing. It looks like a strange base case until you see that every combination is built by adding coins onto it, and the empty combination is the seed.`
    );
    coins.forEach((coin, ci) => {
      for (let target = coin; target <= amount; target++) {
        const before = dp2[target];
        dp2[target] += dp2[target - coin];
        tally.writes++;
        tally.comparisons++;
        show2(
          [0, target],
          `coin ${coin}: ways[${target}] += ways[${target - coin}] -> ${dp2[target]}`,
          `Every new way to make ${target} is a way to make ${target - coin} with one more ${coin} on top. Because the outer loop is the coin and the inner loop is the amount, {1,2} and {2,1} are never both counted - swap the loops and you get combinations counted as orders, the single most common bug in this problem.`,
          "good"
        );
      }
      void ci;
    });
    show2(
      [0, amount],
      `${dp2[amount]} way(s) to make ${amount} with coins [${coins.join(", ")}]`,
      `O(coins * amount) time, O(amount) space. The same table with min instead of sum is the minimum-coins problem, and the same loop order discipline appears in every unbounded knapsack variant.`
    );
    return frames;
  }
  const weights = numList(fields.get("w"), [1, 3, 4, 5]).map(Math.round).filter((v) => v > 0);
  const values = numList(fields.get("v"), [1, 4, 5, 7]).map(Math.round);
  const capacity = Math.max(1, Math.min(24, intOf(fields.get("cap") ?? "", 8)));
  const n = Math.min(weights.length, values.length);
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  const rowLabels = ["0"].concat(Array.from({ length: n }, (_, i) => `w${weights[i]}|v${values[i]}`));
  const rowNote = ["take nothing"].concat(Array.from({ length: n }, (_, i) => `item ${i + 1}`));
  const colLabels = Array.from({ length: capacity + 1 }, (_, c) => String(c));
  const filled = [];
  const show = (hot, src, caption, detail, tone = "active") => {
    const grid = [];
    for (let i = 0; i <= n; i++) {
      const line = [];
      for (let c = 0; c <= capacity; c++) {
        const isHot = hot && hot[0] === i && hot[1] === c;
        const isSrc = src.some(([r, cc]) => r === i && cc === c);
        const done = filled.some(([r, cc]) => r === i && cc === c);
        line.push(cell(i, c, isHot || isSrc || done ? String(dp[i][c]) : "", isHot ? tone : isSrc ? "danger" : done ? "done" : "idle"));
      }
      grid.push(line);
    }
    push(grid, rowLabels, colLabels, hot, src, caption, detail, [{ label: "rows", items: rowNote, hot: hot ? hot[0] : null, tone: "idle", note: "items considered" }], { ...tally });
  };
  for (let c = 0; c <= capacity; c++) filled.push([0, c]);
  show(
    [0, 0],
    [],
    `row 0 is zero: no items means no value`,
    `The recursion "best using the first i items in capacity w" needs an empty base. With row 0 filled, the loop never has to test bounds - the same reason a linked list gets a dummy head.`
  );
  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1];
    const v = values[i - 1];
    for (let c = 0; c <= capacity; c++) {
      tally.comparisons++;
      if (w > c) {
        dp[i][c] = dp[i - 1][c];
        show(
          [i, c],
          [[i - 1, c]],
          `item w=${w} does not fit capacity ${c} \xB7 copy "skip"`,
          `Nothing to decide: the item is too heavy, so the best with this item considered equals the best without it. Copying the row above is a real branch, not a shortcut - forgetting it breaks the table for every later column.`
        );
      } else {
        const skip = dp[i - 1][c];
        const take = dp[i - 1][c - w] + v;
        dp[i][c] = Math.max(skip, take);
        const took = take >= skip;
        show(
          [i, c],
          took ? [[i - 1, c - w]] : [[i - 1, c]],
          `capacity ${c}: take(w=${w},v=${v}) = ${take} vs skip = ${skip} -> ${dp[i][c]}`,
          took ? `Taking wins. Note the source cell is ${i - 1},${c - w} - the value from the row ABOVE at the leftover capacity, never the current row. Reading the current row would let the item be used twice, which turns 0/1 knapsack into the unbounded variant.` : `Skipping wins: ${v} of value is not worth ${w} of capacity given what fits better. DP records the decision, so reconstruction is a backwards walk rather than a re-search.`
        );
      }
      filled.push([i, c]);
      tally.writes++;
    }
  }
  const picked = [];
  let c2 = capacity;
  for (let i = n; i >= 1; i--) {
    if (dp[i][c2] !== dp[i - 1][c2]) {
      picked.push(`w=${weights[i - 1]} v=${values[i - 1]}`);
      c2 -= weights[i - 1];
    }
  }
  show(
    [n, capacity],
    [],
    `best value ${dp[n][capacity]} from [${picked.join(", ")}]`,
    `${n} items x ${capacity + 1} capacities = ${n * (capacity + 1)} cells, each O(1). The brute force tried ${Math.pow(2, n)} subsets; the table won because capacity - not n - is what bounds it, which is why knapsack is called pseudo-polynomial.`
  );
  return frames;
}
function backTrackLcs(a, b, dp) {
  let i = a.length;
  let j = b.length;
  let out = "";
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out = a[i - 1] + out;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return out;
}
var recursionAlgorithms = [
  { id: "naive", label: "Plain recursion", note: "the call tree shows every repeated sub-problem" },
  { id: "memo", label: "Memoised", note: "same tree, but each sub-problem is computed once" }
];
function runRecursion(input, algorithm = "naive") {
  const target = Math.max(1, Math.min(10, intOf(fieldMap(input).get("n") ?? "", 5)));
  const frames = [];
  const tally = emptyTally();
  const useMemo = algorithm === "memo";
  const memo = /* @__PURE__ */ new Map();
  const nodes = [];
  const edges = [];
  let counter = 0;
  const draw = (focus, tone, caption, detail, lanes = []) => frames.push(treeFrame(frames.length, nodes.map((n) => ({ ...n, tone: tone(n.id) })), edges.map((e) => ({ ...e, tone: tone(e.to) })), focus, caption, detail, lanes, { ...tally }));
  const stack = [];
  const solve = (n) => {
    const myId = `c${counter++}`;
    nodes.push({ id: myId, text: `fib(${n})`, tone: "active" });
    if (stack.length) edges.push({ from: stack[stack.length - 1], to: myId, tone: "active" });
    stack.push(myId);
    tally.writes++;
    if (n <= 1) {
      draw(
        [myId],
        (id) => id === myId ? "good" : "idle",
        `fib(${n}) = ${n}`,
        n === 0 ? `Base case zero. A recursion without a base case is an infinite one - and the base case being correct matters more than it being fast: fib(0)=0, fib(1)=1.` : `Base case one. The two leaves are the whole reason the tree terminates.`,
        [{ label: "call stack", items: [...stack], hot: stack.length - 1, tone: "active", note: `${stack.length} frames deep` }]
      );
      stack.pop();
      return n;
    }
    if (useMemo && memo.has(n)) {
      tally.probes++;
      draw(
        [myId],
        (id) => id === myId ? "done" : "idle",
        `fib(${n}) already known = ${memo.get(n)} \xB7 no descent`,
        `This call would have recomputed a sub-problem, and the memo turns it into one table read. Every pruned branch is a whole subtree that never happens - that is the entire difference between exponential and linear.`
      );
      stack.pop();
      return memo.get(n);
    }
    draw(
      [myId],
      (id) => id === myId ? "active" : "idle",
      `call fib(${n}) \xB7 depth ${stack.length}`,
      `Descending. Each frame holds its own n and its own return address - the call stack is real memory, and this is why a deep recursion overflows while an iterative version does not.`,
      [{ label: "call stack", items: [...stack], hot: stack.length - 1, tone: "active", note: `${stack.length} frames deep` }]
    );
    const left = solve(n - 1);
    const right = solve(n - 2);
    const value = left + right;
    if (useMemo) memo.set(n, value);
    tally.comparisons++;
    stack.pop();
    draw(
      [myId],
      (id) => id === myId ? "good" : "idle",
      `fib(${n}) returns fib(${n - 1})+fib(${n - 2}) = ${left}+${right} = ${value}`,
      `The frame pops and hands ${value} back to its caller. Watch the repeated arguments in the naive version - fib(${Math.max(0, n - 2)}) is computed twice and fib(${Math.max(0, n - 3)}) three times; the count of leaves is itself a Fibonacci number.`,
      [{ label: "memo", items: [...memo.entries()].sort((x, y) => x[0] - y[0]).map(([k, v]) => `fib(${k})=${v}`), hot: null, tone: "done", note: useMemo ? `${memo.size} stored` : "empty - plain recursion caches nothing" }]
    );
    return value;
  };
  draw(
    [],
    () => "idle",
    `fib(${target}) \xB7 ${algorithm === "memo" ? "with a memo table" : "no memo, every sub-problem recomputed"}`,
    algorithm === "memo" ? `Top-down DP is exactly this: the recursion you already wrote, plus a cache. The two hard parts are the state (which single number identifies the sub-problem) and the transition (how the answer composes) - the memo is mechanical after that.` : `Plain recursion re-derives the same sub-problems over and over. The tree shape - not the arithmetic - is what makes the exponential cost visible.`
  );
  const answer = solve(target);
  const leafCount = nodes.filter((n) => !edges.some((e) => e.from === n.id)).length;
  draw(
    [],
    () => "done",
    `fib(${target}) = ${answer} \xB7 ${nodes.length} calls, ${leafCount} base cases`,
    algorithm === "memo" ? `${nodes.length} calls for n=${target} - linear. Memoised top-down does only the work the question actually needs, which can beat a bottom-up table that fills every cell.` : `${nodes.length} calls for n=${target}, growing like 2^n. The memo version makes ${2 * target - 1} or fewer. Same function, same answer, wildly different cost - which is the point of the exercise.`
  );
  return frames;
}
function runQueens(input) {
  const n = Math.max(2, Math.min(8, intOf(fieldMap(input).get("n") ?? "", 5)));
  const frames = [];
  const tally = emptyTally();
  const placed = [];
  const solutions = [];
  const attackedFor = (rows) => {
    const cells2 = [];
    rows.forEach((queenCol, queenRow) => {
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (r === queenRow && c === queenCol) continue;
          if (r === queenRow || c === queenCol || Math.abs(r - queenRow) === Math.abs(c - queenCol)) cells2.push({ r, c });
        }
      }
    });
    return cells2;
  };
  const draw = (focusRow, tone, caption, detail, extra = [], lanes = []) => {
    const rows = extra.length ? extra : placed;
    frames.push({
      kind: "board",
      step: frames.length,
      size: n,
      queens: rows.map((col, r) => ({ r, c: col, tone: r === focusRow ? tone : "done" })),
      attacked: attackedFor(rows),
      solutions: solutions.map((s) => [...s]),
      lanes,
      tally: { ...tally },
      caption,
      detail
    });
  };
  draw(
    null,
    "idle",
    `${n}x${n} \xB7 place one queen per row`,
    `The naive count is ${n}^${n} boards. Because a queen attacks along its row, row r can hold exactly one queen, so the state is an array of columns and the search is ${n}! arrangements - a 100x reduction before any pruning.`
  );
  const ok = (row, col) => {
    tally.comparisons++;
    for (let r = 0; r < row; r++) {
      const c = placed[r];
      if (c === col || Math.abs(r - row) === Math.abs(c - col)) return false;
    }
    return true;
  };
  const search = (row) => {
    if (row === n) {
      solutions.push([...placed]);
      draw(
        row - 1,
        "good",
        `solution ${solutions.length}: columns [${placed.join(", ")}]`,
        `All ${n} queens placed with no attacks. Continuing the search finds the rest - stopping here is the usual "print one answer" variant of the problem.`,
        placed,
        [{ label: "solutions found", items: solutions.map((s, i) => `#${i + 1}`), hot: solutions.length - 1, tone: "good", note: `${solutions.length}` }]
      );
      return;
    }
    for (let col = 0; col < n; col++) {
      const safe = ok(row, col);
      if (!safe) {
        tally.probes++;
        draw(
          row,
          "danger",
          `row ${row}, column ${col} is attacked - skip`,
          `A queen here would share a column or a diagonal with one already placed, so every arrangement with it is dead. Pruning at this node throws away the ${Math.pow(n, n - row - 1)} boards below it without visiting a single one.`,
          placed.concat(col),
          [{ label: "row", items: placed.concat(col).map((c, i) => `r${i}:c${c}`), hot: row, tone: "danger", note: "rejected" }]
        );
        continue;
      }
      placed[row] = col;
      tally.writes++;
      draw(
        row,
        "active",
        `place a queen at row ${row}, column ${col}`,
        `Legal so far. The recursion moves to row ${row + 1}; if that row turns out to have no safe column at all, this placement is undone here and the loop tries column ${col + 1} - that unwinding is the backtracking, not the placing.`,
        placed.slice(0, row + 1),
        [{ label: "row", items: placed.slice(0, row + 1).map((c, i) => `r${i}:c${c}`), hot: row, tone: "active", note: "placed" }]
      );
      search(row + 1);
      placed.pop();
      tally.writes++;
      draw(
        row,
        "ghost",
        `undo row ${row}`,
        `The board returns to the state before this choice, which is what makes the same array reusable across the whole search. No copies of the board are ever cloned - mutation plus undo is the standard backtracking idiom.`,
        placed.slice(),
        [{ label: "row", items: placed.map((c, i) => `r${i}:c${c}`), hot: null, tone: "ghost", note: "undone" }]
      );
    }
    if (row !== n) draw(
      row,
      "idle",
      `row ${row} exhausted \xB7 backtrack to row ${row - 1}`,
      `Every column in this row was tried and rejected, so no solution extends the current prefix. Returning here is the "wrong path" moment the animation makes visible - you can watch the algorithm discover a dead end.`,
      placed.slice(),
      [{ label: "row", items: placed.map((c, i) => `r${i}:c${c}`), hot: null, tone: "idle", note: "dead end" }]
    );
  };
  search(0);
  draw(
    null,
    "done",
    `${solutions.length} solution(s) for n=${n} \xB7 ${tally.comparisons} safety checks, ${frames.length} frames`,
    `Known counts are n=4 -> 2, n=5 -> 10, n=6 -> 4, n=8 -> 92. Backtracking explores the search tree but never materialises it, so space is O(n) for the columns array while time stays exponential - the honest description of the technique.`
  );
  return frames;
}
function runGreedy(input) {
  const fields = fieldMap(input);
  const raw = (fields.get("acts") ?? "").trim();
  const pieces = (raw || "1-4,3-5,0-6,5-7,3-9,5-9,6-10,8-11,8-12,2-14,12-16").split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  const items = pieces.map((piece, i) => {
    const nums = piece.split(/\D+/).filter(Boolean).map(Number);
    return { id: `a${i}`, start: Number.isFinite(nums[0]) ? nums[0] : 0, end: Number.isFinite(nums[1]) ? nums[1] : 1, label: piece };
  }).filter((a) => a.end > a.start);
  const frames = [];
  const tally = emptyTally();
  if (!items.length) {
    frames.push({ kind: "interval", step: 0, span: 10, items: [], cursor: null, lastEnd: null, lanes: [], tally: { ...tally }, caption: "no activities parsed", detail: `Activities are written start-end separated by commas, e.g. 1-4,3-5,5-7. Type your own and the greedy choice is recomputed.` });
    return frames;
  }
  const span = Math.max(...items.map((a) => a.end));
  const chosen = [];
  const order = [...items].sort((a, b) => a.end - b.end || a.start - b.start);
  const draw = (cursor, lastEnd2, tones2, caption, detail, lanes = []) => frames.push({
    kind: "interval",
    step: frames.length,
    span,
    items: order.map((a) => ({ ...a, tone: tones2.get(a.id) ?? "idle" })),
    cursor,
    lastEnd: lastEnd2,
    lanes,
    tally: { ...tally },
    caption,
    detail
  });
  const tones = /* @__PURE__ */ new Map();
  draw(
    null,
    null,
    tones,
    `${items.length} activities \xB7 sorted by END time, not start`,
    `The sorting rule is the algorithm. Sorting by start time fails - a long activity starting early blocks everything after it. Sorting by end time always leaves the maximum room behind, and that is what the exchange argument proves.`
  );
  let lastEnd = -Infinity;
  for (const activity of order) {
    tally.comparisons++;
    const before = lastEnd;
    if (activity.start >= lastEnd) {
      tones.set(activity.id, "good");
      chosen.push(activity.id);
      lastEnd = activity.end;
      tally.writes++;
      draw(
        activity.id,
        lastEnd,
        tones,
        `take ${activity.label}: starts at ${activity.start}${before === -Infinity ? ", nothing taken yet" : ` which is at or after the last finish ${before}`}`,
        `Compatible, and taking it is provably safe: among all activities that could be chosen next, this one finishes earliest, so any optimal schedule can swap to it without losing a slot. Greedy correctness is exactly this argument, and it must be re-proved per problem.`
      );
    } else {
      tones.set(activity.id, "danger");
      draw(
        activity.id,
        lastEnd,
        tones,
        `skip ${activity.label}: starts at ${activity.start}, overlaps the taken activity ending at ${lastEnd}`,
        `Rejected because ${activity.start} < ${lastEnd}. Notice it was not rejected for being short or long - only for colliding with the choice already made, which is why the earlier choice mattered so much.`
      );
    }
  }
  draw(
    null,
    lastEnd,
    tones,
    `${chosen.length} activities fit \xB7 ${chosen.join(", ")}`,
    `O(n log n) for the sort, O(n) for the scan, O(1) space. Weighted versions of this problem are NOT greedy - add a weight per activity and the right answer is DP, which is the trap that makes this a favourite interview follow-up.`
  );
  return frames;
}
var treeAlgorithms = [
  { id: "bst", label: "Binary search tree", note: "ordered - shape depends on insertion order" },
  { id: "avl", label: "AVL tree", note: "rotations keep every subtree within one level" },
  { id: "heap", label: "Binary heap", note: "Floyd's build-heap in O(n), not O(n log n)" },
  { id: "trie", label: "Trie", note: "branching on characters - prefix queries in O(length)" }
];
var dsaTopics = [
  {
    id: "two-pointers",
    subject: "dsa",
    title: "Two pointers",
    blurb: "One pass from both ends replaces the nested loop.",
    inputLabel: "arr / target",
    defaultInput: "arr=1,2,4,5,7,9,11,15;target=13",
    run: (input) => runTwoPointers(input),
    read: {
      concept: "Two pointers turn a pair search into a single sweep, and the whole trick is that the array is sorted. At each step the sum tells you which pointer is useless: if L+R is too small then L cannot pair with anyone, because every other candidate is bigger than it already is. Discarding a pointer instead of a pair is what removes the inner loop, taking O(n squared) down to O(n) with no extra memory.",
      mechanism: [
        "Start L at the left end and R at the right end; the widest pair is also the largest sum available.",
        "Sum below target: L is too small to ever work, so move L right. Sum above target: R is too big, so move R left. Each step eliminates one element, not one pair.",
        "The pointers never cross until the search is genuinely exhausted, so a miss is proof that no pair exists - not just a failure to find one.",
        "The same two-pointer shape solves container-with-most-water (move the shorter wall, because the height caps the area), remove-duplicates in place, and merging two sorted arrays backwards."
      ],
      formulas: [
        "Two pointers: O(n) time, O(1) space",
        "Nested loop equivalent: n(n-1)/2 pair checks",
        "Requires sorted input - sorting first costs O(n log n)"
      ],
      traps: [
        "It needs sorted input. On an unsorted array you either sort first (and lose the original indices) or you are back to a hash set.",
        "Counting all pairs that hit the target is not the same as finding one: you must keep moving both pointers inwards past duplicates instead of breaking on the first hit.",
        "While (L <= R) versus while (L < R): with <= a single element can pair with itself, which is wrong for pair-sum and right for other problems. Decide it from the question."
      ],
      interview: [
        { q: "Why does moving one pointer at a time not miss pairs?", a: "Because of monotonicity. When L+R is too small, the pair (L, anything left of R) is even smaller, so all of those are dead at once - L is removed, not R. You are deleting a row or a column of the pair matrix per step, never an individual cell." },
        { q: "Two pointers or hash set for pair sum?", a: "Hash set works unsorted and is O(n) with O(n) space. Two pointers is O(n) space-free but needs a sorted array. If the input is already sorted or sorting is free, two pointers wins; if you must keep order and cannot sort, use the hash." }
      ]
    }
  },
  {
    id: "sliding-window",
    subject: "dsa",
    title: "Sliding window",
    blurb: "Reuse the previous sum instead of re-adding the same k elements.",
    inputLabel: "arr / k",
    defaultInput: "arr=1,4,2,10,23,3,1,12;k=3",
    run: (input) => runSlidingWindow(input),
    read: {
      concept: "Fixed-size window maximum sum is the smallest example of the pattern that dominates substring and subarray problems. Consecutive windows overlap in k-1 elements, so recomputing each from scratch repeats work that has not changed. Keeping a running total and adding one element while removing one makes the whole scan O(n). When the window size is not fixed, the right pointer advances and the left pointer only ever moves forward, which bounds the total work to two passes rather than n windows.",
      mechanism: [
        "Fill the window first: nothing is compared until k elements are held.",
        "Then each slide is add a[right], subtract a[left-1] - two operations regardless of k.",
        "Variable windows keep a condition (all unique, sum <= target) and shrink from the left only when it breaks; both pointers move right at most n times.",
        "The frequency map or the sum is the state that travels between steps; the moment you can name that state, the sliding window writes itself."
      ],
      formulas: [
        "Naive: O(n*k). Sliding: O(n) time, O(1) space for a sum, O(alphabet) for a set",
        "Window sum = previous sum + a[right] - a[left-1]",
        "Amortised cost: left moves at most n times total, so the inner while cannot make it O(n squared)"
      ],
      traps: [
        "Off-by-one on the first window: the sum is only meaningful once the window holds k elements.",
        "Shrinking with if instead of while when duplicates can stack - a single shrink can leave the window still invalid.",
        "Forgetting to remove the leaving element from the frequency map, which makes 'longest substring without repeating' return ever-growing lengths."
      ],
      interview: [
        { q: "When is a sliding window the right tool?", a: "The question is about a contiguous subarray or substring, the property being tested can be updated incrementally when one element enters and one leaves, and the answer is an extremum over windows. All three, or the pattern does not apply." },
        { q: "Why is it O(n) when there is a loop inside a loop?", a: "Because the inner loop moves the left pointer, which never moves backwards. Across the entire run the left pointer makes at most n steps, so total work is bounded by 2n regardless of how many iterations any single window spends shrinking." }
      ]
    }
  },
  {
    id: "prefix-sum",
    subject: "dsa",
    title: "Prefix sums",
    blurb: "Pay n additions once, then answer every range query with one subtraction.",
    inputLabel: "arr / queries=a:b",
    defaultInput: "arr=3,2,0,6,7,1,-2,4;queries=1:4;0:2;5:7",
    run: (input) => runPrefixSum(input),
    read: {
      concept: "A prefix sum array trades a linear scan per query for one preprocessing pass and constant-time answers. prefix[i] stores the total of everything before index i, so the sum of any range is the difference of two stored totals - the part up to the right end minus the part before the left end. It is the same idea as an integral, and it generalises: prefix products, prefix XOR, prefix counts of a bit, and 2D prefix sums for rectangle queries, where one subtraction per neighbouring edge and an inclusion-exclusion correction gives any sub-rectangle in O(1).",
      mechanism: [
        "prefix[0] = 0 deliberately, so a query starting at index 0 needs no special case.",
        "Build it left to right: prefix[i+1] = prefix[i] + a[i]. One pass, no branching.",
        "Query sum(l..r) = prefix[r+1] - prefix[l]. Both endpoints are array reads and one subtraction.",
        "The reverse reading is equally important: an element that appears in every suffix of a range cancels out, which is why a difference can encode a range update."
      ],
      formulas: [
        "Build O(n), query O(1), space O(n)",
        "sum(l..r) = prefix[r+1] - prefix[l]",
        "2D: rect = P[r2][c2] - P[r1-1][c2] - P[r2][c1-1] + P[r1-1][c1-1]"
      ],
      traps: [
        "Off-by-one on the boundary: prefix has n+1 entries and the right endpoint is r+1, not r.",
        "It only works for invertible operations. Minimum and maximum are not invertible - a range-min query needs a sparse table or a segment tree instead.",
        "Integer overflow: n values near 1e9 summed into a 32-bit int wraps and the differences become meaningless. Use 64-bit for the prefix array."
      ],
      interview: [
        { q: "Find a subarray that sums to zero, or the subarray with sum k.", a: "Both are prefix-sum statements: sum(i+1..j) = k means prefix[j] - prefix[i] = k, so scan once keeping a hash set or count map of prefix values seen. Turning a range property into a difference of two prefixes is the move being tested." },
        { q: "When would you not use prefix sums?", a: "When the data changes between queries. Rebuilding costs O(n) per update, so a Fenwick tree or segment tree takes over - both are prefix sums that support point updates in O(log n)." }
      ]
    }
  },
  {
    id: "binary-search",
    subject: "dsa",
    title: "Binary search",
    blurb: "Watch the candidate interval halve, one comparison at a time.",
    inputLabel: "arr / target",
    defaultInput: "arr=-1,0,3,5,9,12;target=9",
    run: (input) => runBinarySearch(input),
    read: {
      concept: "Binary search is not a search of the array, it is a search of the answer space: at every step one comparison destroys half of the remaining candidates. The precondition is that the array is sorted, or more precisely that some predicate is monotone - which is what makes the technique apply to 'first version that is broken' and 'minimum capacity that ships everything in D days'. Getting the loop invariant right (the answer always lives inside lo..hi) is what eliminates the classic infinite loop, not memorising the mid formula.",
      mechanism: [
        "The interval lo..hi holds every index that could still be the answer.",
        "mid = lo + (hi-lo)/2; compare once, then discard mid and everything on the wrong side of it.",
        "a[mid] < target means lo = mid+1; a[mid] > target means hi = mid-1. The half-open update is what guarantees progress.",
        "When the loop exits with lo > hi, lo is the insertion point - the first index whose value is not less than the target. That is lower_bound, and it is the more useful primitive than 'found index'."
      ],
      formulas: [
        "Comparisons <= floor(log2 n) + 1",
        "Interval size goes n, n/2, n/4 ... so the loop runs ceil(log2(n+1)) times",
        "mid = lo + (hi - lo) / 2 avoids the overflow that (lo + hi) / 2 has in C and Java"
      ],
      traps: [
        "Forgetting the +1 in lo = mid + 1. Then lo never advances past mid and the loop spins forever on a miss - the single most common binary search bug.",
        "Using < where <= is needed in the while condition, which silently misses the case where lo == hi is the answer.",
        "Searching a rotated or unsorted array directly. The predicate must be monotone; for rotated input you first decide which half is sorted."
      ],
      interview: [
        { q: "How do you binary-search an answer that is not an index?", a: "Identify the monotone predicate on the answer - 'is capacity C enough?' - and binary-search the numeric range of C. Each step is a feasibility check, so the cost is O(log range) times the check." },
        { q: "Why is binary search not always faster than a linear scan?", a: "It needs random access and a sorted collection. A linked list cannot index, so the halving costs O(n) per step; and if the array is small and searched rarely, cache misses and the sorting cost dominate." }
      ]
    }
  },
  {
    id: "sorting",
    subject: "dsa",
    title: "Sorting algorithms",
    blurb: "Five algorithms, one array - count the comparisons and writes.",
    inputLabel: "arr",
    defaultInput: "arr=8,5,3,9,1,7,2,6",
    algorithms: sortAlgorithms,
    run: (input, algorithm) => runSort(algorithm ?? "bubble", input),
    read: {
      concept: "Comparison sorts differ in one thing only: how they buy information. Bubble and insertion sort look at adjacent pairs, so they remove one inversion per swap and pay O(n squared) on reverse-sorted input. Selection sort ignores the data entirely and does the same work whatever it is given. Merge and quick sort halve the problem, which is why they reach O(n log n) - and the information-theoretic lower bound says any comparison sort needs at least log2(n!) comparisons, so nothing asymptotically better exists on comparisons alone.",
      mechanism: [
        "Bubble: repeated adjacent swaps; the number of swaps equals the inversion count, and each pass finalises one slot at the right end.",
        "Insertion: grow a sorted prefix and shift each new key left into place - O(n + inversions), so nearly-sorted input is almost free, which is why it beats quick sort on small runs.",
        "Selection: scan for the minimum and swap once per pass - n-1 swaps maximum, the cheapest writes of any comparison sort.",
        "Merge: split blindly, merge with a scratch array; ties are broken left-first, which is what makes it stable, and the recurrence solves to O(n log n) for every input.",
        "Quick: partition around a pivot so the pivot lands in its final slot; in-place and cache-friendly, but a bad pivot choice on sorted input degenerates to O(n squared)."
      ],
      formulas: [
        "log2(n!) = n log n - O(n), the lower bound for any comparison sort",
        "Bubble/insertion worst case: n(n-1)/2 comparisons",
        "Merge: O(n log n) time, O(n) extra space, stable. Quick: O(n log n) average, O(n) worst, in-place, O(log n) stack"
      ],
      traps: [
        "Comparing algorithms by big-O alone. On 10 elements insertion sort beats both merge and quick because of constants and cache behaviour - real libraries switch over at a threshold.",
        "Believing quick sort is O(n log n) always. A fixed pivot on an already-sorted array gives n + (n-1) + ... comparisons; median-of-three or randomised pivots are the fix.",
        "Losing stability. Sorting by department then by name only works if the second sort preserves the first order - so it must be stable, which rules out heapsort and plain quick sort."
      ],
      interview: [
        { q: "Which sort would you actually ship?", a: "Introsort or Timsort. Introsort is quick sort that falls back to heap sort past a recursion depth, so it keeps quick's constants with a guaranteed O(n log n). Timsort exploits existing runs, is stable, and is what Python and Java use for objects." },
        { q: "Can you sort faster than O(n log n)?", a: "Only by not comparing: counting sort, radix sort and bucket sort are linear or near-linear, and they work because the keys are small integers or bounded - the lower bound applies to comparison sorts, not to all sorts." }
      ]
    }
  },
  {
    id: "stack",
    subject: "dsa",
    title: "Stacks",
    blurb: "Bracket matching, postfix maths and an O(1) minimum.",
    inputLabel: "seq / expr / ops",
    defaultInput: "seq={[()]}{{[(])}}",
    algorithms: stackAlgorithms,
    run: (input, algorithm) => runStack(input, algorithm ?? "brackets"),
    read: {
      concept: "A stack is the shape of any problem where the most recent thing matters most: nested scope, undo, the call frames you are standing in. Bracket matching is the minimal example - an opener is a promise and a closer must answer the most recent promise, not just any promise, which is why a counter accepts the invalid sequence )( while a stack rejects it. Postfix evaluation is the same discipline applied to arithmetic: the operator order already encodes precedence, so no precedence table is needed. The min-stack variant shows the standard trade: keep a second history and turn an O(n) query into O(1).",
      mechanism: [
        "Push openers; on a closer compare the top - wrong top means mismatched type, empty stack means an extra closer.",
        "At the end the stack must be empty, otherwise openers were never closed. That second check is the half everyone forgets.",
        "Postfix: push operands, and an operator pops two - first pop is the right operand, second is the left - computes and pushes the result.",
        "Min stack: push min(new value, previous minimum) alongside every value, so popping restores the previous answer with no recomputation."
      ],
      formulas: [
        "push / pop / top / min are all O(1) with the extra history array",
        "Space O(n) worst case - depth of nesting, or the size of the expression",
        "Postfix evaluation: one pass, no recursion, no precedence table"
      ],
      traps: [
        'Counting instead of stacking. A counter accepts ")(" and "{[}]" because it never checks which bracket is open; only the identity of the top element does.',
        "Popping operands in the wrong order in postfix - subtraction and division are not commutative, and the bug is invisible on '+' tests.",
        "Min stack storing only one running minimum variable: after popping the minimum you cannot recover the second-smallest, which is exactly why it must be a parallel history."
      ],
      interview: [
        { q: "Implement a queue with two stacks - what is the complexity?", a: "Enqueue pushes onto in. Dequeue pops from out, and when out is empty it pours all of in across in reverse. One dequeue can cost O(n), but each element moves at most twice, so the amortised cost per operation is O(1) and worst-case is O(n)." },
        { q: "Where does a stack appear without the word stack?", a: "Any time you need last-in-first-out: recursion is an implicit stack, expression trees are evaluated with one, browser back history and undo are stacks, monotonic-stack problems like next-greater-element and trapping rain water are stacks wearing a disguise." }
      ]
    }
  },
  {
    id: "queue",
    subject: "dsa",
    title: "Queues",
    blurb: "Wrap-around indices, and two stacks pretending to be a FIFO.",
    inputLabel: "ops (e/d/f) / cap",
    defaultInput: "ops=e1,e2,e3,d,d,e4,e5,d,d,e6;cap=5",
    algorithms: queueAlgorithms,
    run: (input, algorithm) => runQueue(input, algorithm ?? "circular"),
    read: {
      concept: "A queue is the discipline of first-in-first-out and the structure that makes breadth-first search possible - the frontier of a BFS is literally a queue. The interesting engineering is the circular array: shifting every element left on each dequeue costs O(n), so instead head and tail advance modulo capacity and slots are recycled. That creates one ambiguity worth knowing cold - head equal to tail means either empty or full - which is resolved by keeping a count, by sacrificing a slot, or by comparing against the wrap position.",
      mechanism: [
        "Enqueue writes at (head + count) mod capacity; dequeue reads at head and advances head by one, also mod capacity.",
        "Occupancy is tracked by count, which makes empty and full unambiguous without a sentinel slot.",
        "When the tail reaches the last index it wraps to 0 while the head is still in the middle, so the live elements form a ring, not a contiguous run.",
        "Two stacks give the same semantics differently: pushing onto 'in' is free, and dequeues amortise a single reversal when 'out' runs dry."
      ],
      formulas: [
        "Circular array: O(1) both ends, O(capacity) space, fixed",
        "Two stacks: O(1) amortised dequeue, worst case O(n) on the pour",
        "Full when count == capacity; empty when count == 0"
      ],
      traps: [
        "Using head == tail as the full test. It is also the empty test after a wrap, so inserts silently fail or overwrites happen.",
        "Incrementing with head++ instead of head = (head + 1) % capacity, which walks off the end of the array.",
        "Forgetting the underflow branch on dequeue from an empty queue - the simulation looks right until the operation log contains more dequeues than enqueues."
      ],
      interview: [
        { q: "Why does BFS need a queue and DFS a stack?", a: "BFS must expand vertices in discovery order so that level k is finished before level k+1 starts; FIFO gives exactly that. DFS wants to dive, so the most recent candidate must be taken first - LIFO. Swap the container and you have swapped the algorithm." },
        { q: "What is a deque and when do you need one?", a: "A double-ended queue with O(1) at both ends. Monotonic-queue problems need it: sliding-window maximum keeps indices in decreasing value order and pops from both ends, which turns an O(nk) scan into O(n)." }
      ]
    }
  },
  {
    id: "linked-list",
    subject: "dsa",
    title: "Linked lists",
    blurb: "Reverse in place, find the middle, detect a cycle with two pointers.",
    inputLabel: "list / entry",
    defaultInput: "list=17,2,35,1,48,63;entry=2",
    algorithms: listAlgorithms,
    run: (input, algorithm) => runList(input, algorithm ?? "reverse"),
    read: {
      concept: "A linked list trades random access for cheap insertion: a node knows only its successor, so there is no index, no resizing and no shifting - but reaching the kth element costs k steps. Almost every list algorithm is about pointer surgery under that constraint. Reversal has to capture next before overwriting it, and the two-pointer and Floyd patterns exist because you cannot ask a list how long it is or jump to its middle - walking at two different speeds is how you infer structure you cannot index.",
      mechanism: [
        "Reverse keeps three pointers: prev (the already-flipped part), cur (being flipped) and next (the link about to be destroyed). Writing cur.next = prev and then advancing all three is the whole algorithm.",
        "Middle: fast advances two links per step while slow advances one, so when fast runs out slow is halfway - one pass, no length.",
        "Floyd cycle detection: two runners at speed 1 and 2 must coincide inside a loop; if there is no loop the hare simply falls off the end.",
        "After they meet, one pointer restarts at the head and both move one step; they arrive at the cycle entry together, because head-to-entry and meet-to-entry differ by a whole number of laps."
      ],
      formulas: [
        "Access O(n), insert/delete at a known node O(1)",
        "Reverse: O(n) time, O(1) space, n pointer writes",
        "Floyd: O(n) time, O(1) space - a visited set would cost O(n) memory"
      ],
      traps: [
        "Losing next before storing it. Once cur.next is overwritten the rest of the list is unreachable and the bug looks like data loss, not a logic error.",
        "Checking fast != null but not fast.next != null in the two-pointer loop, which throws on even-length lists.",
        "Only detecting the cycle in Floyd and not finding its entry, or forgetting that the meeting point is not the entry - they are different nodes."
      ],
      interview: [
        { q: "Reverse a list without extra space - what breaks?", a: "Nothing breaks, but the original head pointer becomes the tail, so any caller still holding it now sees a one-element list. The function must return the new head, and recursion would cost O(n) stack frames anyway." },
        { q: "Reverse a list without extra space - what breaks?", a: "Nothing breaks, but the original head pointer becomes the tail, so any caller still holding it now sees a one-element list. The function must return the new head, and recursion would cost O(n) stack frames anyway." },
        { q: "Why detect a cycle with two pointers instead of a visited set?", a: "Space. A hash set of visited nodes is O(n) memory and reveals the node's address; Floyd is O(1) space and answers both 'is there a cycle' and 'where does it start'." }
      ]
    }
  },
  {
    id: "hashing",
    subject: "dsa",
    title: "Hash tables",
    blurb: "Same keys, three collision strategies - watch the probe counts diverge.",
    inputLabel: "keys / size / find",
    defaultInput: "keys=25,72,38,33,45,71,10;size=7;find=38",
    algorithms: hashAlgorithms,
    run: (input, algorithm) => runHash(input, algorithm ?? "chaining"),
    read: {
      concept: "A hash table converts a key into an index and then deals with the fact that different keys collide. The hash function only picks a preferred slot; the collision strategy decides everything about performance. Chaining lets a bucket grow a list, so the load factor may exceed 1 and deletion is trivial. Open addressing keeps one array and probes for the next free slot, so it is cache-friendly but dies when the table fills, and deleting needs tombstones to keep probe sequences intact. The famous O(1) is an average over a uniform hash at low load, never a worst-case guarantee.",
      mechanism: [
        "h(k) = k mod size maps every key to a slot; the interesting behaviour starts when two keys share a slot.",
        "Chaining: the colliding key is appended to that bucket's list, so lookup is one hash plus a linear scan of a short list - about 1 + load/2 comparisons.",
        "Linear probing: on a collision, walk to slot+1, slot+2 ... One long run of occupied slots attracts every key that hashes into it, which is primary clustering.",
        "Quadratic probing: step by 1, 4, 9 ... spreads the run, but only guarantees a free slot when the table is at most half full and the size is prime.",
        "Lookup in open addressing terminates on the first empty slot, which is the proof of absence - and the reason tombstones behave like occupancy."
      ],
      formulas: [
        "load factor alpha = keys / slots",
        "Chaining: successful search 1 + alpha/2 comparisons",
        "Linear probing: about (1 + 1/(1-alpha)) / 2 probes, which explodes as alpha approaches 1",
        "Rehash when alpha passes roughly 0.7 - doubling size keeps the average constant"
      ],
      traps: [
        "Believing O(1) is guaranteed. A hash that dumps every key into one bucket makes the table a linked list, and adversarial input can be crafted to do exactly that.",
        "Deleting a key in open addressing by writing null. Every probe sequence that walked through that slot then stops early and the key beyond it becomes unreachable - use a tombstone.",
        "Changing the table size without rehashing: k mod 7 and k mod 14 place the same key in different slots, so a resize is a full re-insert, not a copy."
      ],
      interview: [
        { q: "Why does a HashMap grow by doubling rather than by a prime?", a: "Doubling lets the index be computed by masking bits instead of dividing, and one bit of the key's hash decides which half of the new table it moves to. Prime sizes with modulo avoid bad hash patterns; modern tables randomise the hash instead so they can use the cheaper power-of-two." },
        { q: "Detect the first non-repeating character - which structure?", a: "A count map is the direct answer, but the follow-up about 'two strings being anagrams' or 'is this a rotating cipher of that one' both resolve to a canonical form, which is hashing after normalisation. Say which invariant the hash encodes." }
      ]
    }
  },
  {
    id: "trees",
    subject: "dsa",
    title: "Trees: BST, AVL, heap, trie",
    blurb: "Four ways to store a set - and each one buys a different guarantee.",
    inputLabel: "keys / find / words",
    defaultInput: "keys=50,30,70,20,40,60,80;find=40;words=car,cat,care,cd",
    algorithms: treeAlgorithms,
    run: (input, algorithm) => runTree(input, algorithm ?? "bst"),
    read: {
      concept: "All four structures are trees, and the difference is which invariant they insist on. A binary search tree keeps keys ordered so a search discards half the subtree per comparison - but its height depends on insertion order, so sorted input turns it into a list. An AVL tree adds a height-balance rule and rotates the moment a subtree differs by two levels, which keeps height around 1.44 log2 n. A heap drops ordering between siblings and keeps only parent-wins, which is what lets it live in a plain array with no pointers. A trie orders by characters instead of values, so the cost of a lookup is the length of the key rather than the number of keys.",
      mechanism: [
        "BST insert always lands on a leaf, so nothing existing moves; search and insert share the same descent, which is why 'insert if absent' costs one walk.",
        "In-order traversal of a BST emits sorted keys with zero comparisons - the ordering was paid for at insert time.",
        "AVL: on the way back up from an insert, recompute heights, and if a node's balance reaches 2 rotate once (LL/RR) or twice (LR/RL). The rotation restores the subtree's previous height, so no ancestor needs a second fix.",
        "Heap: children of index i are 2i+1 and 2i+2. Floyd's build sifts down from the last internal node, and because most nodes are near the bottom the total cost is O(n), not O(n log n).",
        "Trie: shared prefixes are created once and each node records how many words pass through it, which is where autocomplete gets its counts."
      ],
      formulas: [
        "BST average O(log n), worst O(n) - height depends on arrival order",
        "AVL height <= 1.44 * log2(n+2) - 0.3",
        "Heap: build O(n), push/pop O(log n), peek O(1). Heapsort O(n log n) worst case, O(1) space, unstable",
        "Trie: O(key length) time regardless of how many keys are stored, O(total characters) space"
      ],
      traps: [
        "Drawing a BST balanced by habit. Feed sorted keys and watch it become a chain - the reason interviews ask for AVL or red-black trees.",
        "AVL rotation cases: LR and RL need two rotations. Rotating the grandparent alone leaves the tree just as unbalanced, and the symptom is a rotation that appears to do nothing.",
        "Deleting in a heap by swapping the root with the last element and stopping - you must sift the replacement down AND, if it grew, bubble it up.",
        "Forgetting the terminal flag in a trie, which silently turns the dictionary into a set of prefixes."
      ],
      interview: [
        { q: "When would you choose a heap over a sorted array?", a: "When you only ever need the extreme and the data arrives continuously. A heap gives push and pop-max in O(log n) with no shifting; a sorted array costs O(n) to insert. If you need the 500th smallest, or range queries, neither is right - use an order-statistic tree." },
        { q: "AVL or red-black tree?", a: "AVL is more strictly balanced, so lookups are faster; red-black needs fewer rotations per insert and amortises rebalancing better, which is why the standard library maps are red-black. Say which side of read-heavy versus write-heavy your workload is on." }
      ]
    }
  },
  {
    id: "graphs",
    subject: "dsa",
    title: "Graph traversal: BFS, DFS, Dijkstra",
    blurb: "The same graph, three containers - and three different answers.",
    inputLabel: "edges=A-B:4 / start / find",
    defaultInput: "edges=A-B:4,A-D:1,B-C:2,C-D:1,B-E:5,D-E:3,E-F:2,C-F:6;start=A;find=F",
    algorithms: graphAlgorithms,
    run: (input, algorithm) => runGraph(input, algorithm ?? "bfs"),
    read: {
      concept: "Traversal is one algorithm with a swappable container. A queue gives breadth-first, which visits in order of hop count and therefore proves shortest paths on unweighted graphs. A stack or recursion gives depth-first, which goes to the wall first, discovers connected components, detects cycles and orders things for topological sort. Replace the queue with a priority queue keyed by accumulated weight and the identical skeleton becomes Dijkstra - which is why 'BFS with weights' is the wrong instinct and why the algorithm is really 'always settle the closest unsettled vertex'.",
      mechanism: [
        "BFS dequeues a vertex, marks it, and enqueues unseen neighbours at level+1. FIFO ordering guarantees level k is fully expanded before level k+1 begins.",
        "An edge to an already-seen vertex that is not the parent is the signal for a cycle in the undirected case, and for a back or cross edge in the directed one.",
        "DFS pushes neighbours so the next pop is the deepest candidate; memory is proportional to depth, not width, which is why it survives graphs too wide for BFS.",
        "Dijkstra settles the minimum tentative vertex, then relaxes its edges. A settled vertex can never improve, because any alternative route would first have to pass through a vertex at least as far away.",
        "Negative weights break exactly that assumption, which is why Bellman-Ford - relax every edge n-1 times - is the answer there."
      ],
      formulas: [
        "BFS/DFS: O(V + E) time; space O(V) for the queue, stack and visited set",
        "Dijkstra with a binary heap: O((V + E) log V); with an array: O(V squared)",
        "BFS hop count = shortest path length only when every edge costs the same"
      ],
      traps: [
        "Marking visited when you enqueue rather than when you dequeue - both work, but if you mark only on dequeue a vertex can enter the queue many times and the queue blows up.",
        "Running BFS on a weighted graph and calling the result a shortest path. It is shortest in hops, not weight.",
        "Forgetting the disconnected case: a single traversal from one source does not visit everything, and the standard fix is an outer loop over all vertices.",
        "Dijkstra with a negative edge returns a confident wrong answer rather than an error - the failure is silent."
      ],
      interview: [
        { q: "Give me the shortest route between two cities.", a: "It depends on the edge weights being non-negative and the graph being static: Dijkstra, with an early exit when the target is popped. If edges are unweighted, BFS. If there are negative edges, Bellman-Ford. If you must answer many pair queries, precompute differently." },
        { q: "How do you detect a cycle in a directed graph?", a: "DFS with three colours: white unvisited, grey on the current recursion path, black finished. An edge to a grey node is a back edge and proves a cycle; an edge to a black node is just a cross edge. The parent check that works for undirected graphs is not enough when edges have direction." }
      ]
    }
  },
  {
    id: "union-find",
    subject: "dsa",
    title: "Union-find",
    blurb: "Merging groups with path compression - almost O(1) per query.",
    inputLabel: "n / unions=a-b",
    defaultInput: "n=7;unions=0-1,2-3,4-5,1-4,0-5,3-6,2-6",
    run: (input) => runUnionFind(input),
    read: {
      concept: "Union-find answers exactly one question - are these two elements in the same group? - and it answers it in near-constant time by keeping a forest of upward pointers. Naively the trees grow tall and find degrades to a chain, so two rules exist: union by rank hangs the shorter tree under the taller one, bounding height at log n, and path compression re-parents every node on a walked path straight to the root, so the next query on that path costs one hop. Together they give an inverse-Ackermann amortised cost, which is effectively a constant. The same structure is the cycle test inside Kruskal's minimum spanning tree.",
      mechanism: [
        "Every element starts as its own root, so 'are a and b connected' is answered by comparing two root ids.",
        "find walks parent pointers upward until it reaches a node that is its own parent.",
        "Union by rank: attach the smaller-rank root under the larger. Rank only increases when two equal ranks meet.",
        "Path compression: on the way back from find, point every visited node directly at the root - flattening happens as a side effect of querying.",
        "If find(a) and find(b) already agree, the union is a no-op, and that no-op is exactly the statement 'this edge closes a cycle'."
      ],
      formulas: [
        "Amortised O(alpha(n)) per operation with both heuristics, where alpha(n) <= 4 for any n you will ever use",
        "Union by rank alone: O(log n) worst case",
        "Space: two arrays of size n"
      ],
      traps: [
        "Path compression with recursion on a large n overflows the stack - use the iterative two-pass version.",
        "Compressing to a non-root. Every node must point at the root, not at its grandparent, or the flattening is only half done.",
        "Using rank as the element's size: rank bounds height, size counts members. They are different fields, and conflating them breaks union by size."
      ],
      interview: [
        { q: "Where does union-find show up outside graph problems?", a: "Account or contact merging, image connected-component labelling, network redundancy, the 'number of islands' dynamic version, and checking whether adding an edge to a graph creates a cycle before you build anything else." },
        { q: "Why is Kruskal correct with union-find?", a: "Edges are processed in increasing weight, so the first time an edge connects two different components it is the cheapest way to join them - which is the cut property. Union-find makes that test constant-ish instead of a traversal per edge." }
      ]
    }
  },
  {
    id: "dp",
    subject: "dsa",
    title: "Dynamic programming",
    blurb: "Watch the table fill: the same answer, three state definitions.",
    inputLabel: "w / v / cap, or a / b, or coins / amount",
    defaultInput: "w=1,3,4,5;v=1,4,5,7;cap=8",
    algorithms: dpAlgorithms,
    run: (input, algorithm) => runDp(input, algorithm ?? "knapsack"),
    read: {
      concept: "Dynamic programming is memoised recursion written as a table. A problem qualifies when an optimal answer is built from optimal answers to sub-problems, and each sub-problem is reached from many paths so the work must be done once. The hard part is never the loop, it is choosing the state: which small tuple of numbers identifies a sub-problem completely. 0/1 knapsack uses (item index, remaining capacity) and reads the row above - reading the current row would allow the item twice. LCS uses (prefix of a, prefix of b) and moves diagonally on a match. Coin-change uses one dimension, and its loop order decides whether {1,2} and {2,1} count as one combination or two.",
      mechanism: [
        "Fill the zero row and zero column first: the empty base case makes the recurrence run without bounds tests.",
        "Knapsack per cell: skip (copy the cell above) or take (the cell above at capacity minus weight, plus this value) - the max of two.",
        "LCS per cell: characters match, take diagonal plus one; otherwise take the better of above and left.",
        "Coin change: ways[target] += ways[target - coin], with coins outside and amounts inside to count combinations rather than permutations.",
        "Reconstruction is a backwards walk over the finished table - which is why storing the table, not just the last row, is what lets you print the answer."
      ],
      formulas: [
        "Knapsack: O(n * capacity) time and space - pseudo-polynomial, because it is polynomial in the number's value, not its digit count",
        "LCS: O(n * m), space reducible to O(min(n, m)) if only the length is needed",
        "Coin change (ways): O(coins * amount)"
      ],
      traps: [
        "Reading the current row in 0/1 knapsack - that silently converts it to unbounded knapsack, and the value comes back too high.",
        "Swapping the loops in coin change: combinations become permutations, and the number comes back too large.",
        "Space-optimising to one row before you have reconstructed the actual choices; the rolling-array trick destroys the path.",
        "Initialising the table to zero for a minimisation problem, which makes the answer zero. Unreachable states need infinity."
      ],
      interview: [
        { q: "How do you know a problem is DP and not greedy?", a: "Test whether taking the locally best choice can never hurt. In knapsack with weights it can - a heavy high-value item can crowd out two better ones - so greedy fails and DP is required. Activity selection is the mirror case where greedy is provably optimal." },
        { q: "Top-down memo or bottom-up table?", a: "Top-down is easier to derive and only computes reachable states; bottom-up avoids recursion limits and often enables the rolling-array space win. Say which the state space looks like before choosing." }
      ]
    }
  },
  {
    id: "recursion",
    subject: "dsa",
    title: "Recursion and memoisation",
    blurb: "The call tree for fib(n) - and the same tree with a memo.",
    inputLabel: "n",
    defaultInput: "n=5",
    algorithms: recursionAlgorithms,
    run: (input, algorithm) => runRecursion(input, algorithm ?? "naive"),
    read: {
      concept: "A recursive call is a tree, and drawing the tree is how you see the cost. fib(5) plain recursion makes 15 calls because fib(3) is computed twice and fib(2) three times - the number of leaves is itself a Fibonacci number, so the work is exponential. Add a memo and every distinct argument is computed once: the same function, the same answer, linear work. That is the whole of top-down dynamic programming: recognise that the recursion revisits states, give each state an identifier, and cache it.",
      mechanism: [
        "The base case is what terminates the tree - fib(0) and fib(1) are leaves and return without descending.",
        "Each stack frame holds its own n plus the return address; the call stack is real memory and is why deep recursion overflows.",
        "On the way back up, a parent combines its two returned values, which is why the answer composes rather than accumulates.",
        "With a memo, a repeated call becomes one table read and its entire subtree is never generated."
      ],
      formulas: [
        "Plain fib: calls(n) = 2 * fib(n+1) - 1, so 15 calls for n=5",
        "Memoised: O(n) calls, O(n) space for the table plus the stack",
        "Recursion depth here is n, not 2^n - depth is the max root-to-leaf length, cost is the node count"
      ],
      traps: [
        "Missing or wrong base case, which gives a stack overflow that names no line - the crash looks like it is in the middle of the recursion.",
        "Memoising on a state that is not sufficient. If two different sub-problems share an argument, the cache returns an answer for the wrong one.",
        "Assuming recursion is slow in principle. The overhead is per frame; the exponential cost came from re-deriving states, and the memo removes exactly that."
      ],
      interview: [
        { q: "Convert this recursion to DP - what are the steps?", a: "Name the state as a tuple of the parameters that fully determine the answer, write the transition in terms of smaller states, add a base case, then either cache on the way down or fill a table bottom-up. The state definition is the answer to the question; the code follows." },
        { q: "Why does memoisation not fix every recursive problem?", a: "It only helps when sub-problems overlap. A recursion that visits distinct states - enumerating all permutations, say - has no repeats to cache, so the exponential count of states is inherent, not accidental." }
      ]
    }
  },
  {
    id: "backtracking",
    subject: "dsa",
    title: "Backtracking: N-Queens",
    blurb: "Prune a whole subtree by checking legality at the node.",
    inputLabel: "n",
    defaultInput: "n=5",
    run: (input) => runQueens(input),
    read: {
      concept: "Backtracking is depth-first search over a decision tree you never build. At each row the algorithm tries a column, checks legality against the queens already placed, recurses, and then undoes the placement. The power is in the undo and the prune: a single rejected square discards every board below it, so n=8 is searchable in 2600-odd states rather than the 16.7 million raw boards. The state stays O(n) because one array is mutated in place and restored - no board is ever copied.",
      mechanism: [
        "One queen per row is forced by the row-attack rule, so the state is an array of columns, not a grid.",
        "Legality against rows 0..r-1 checks the column and the two diagonals; the diagonal test is |r - row| == |c - col|, one subtraction each.",
        "Placing and recursing goes deeper; when the deeper row has no legal column the loop continues and the placement is undone.",
        "Reaching row n means a complete solution - record it and keep going, and the enumeration continues in the same structure.",
        "Bitmask columns and the two diagonals make the legality test O(1) with bit operations, which is how n=14 stops being slow."
      ],
      formulas: [
        "Raw boards n^n; with one-per-row the search space is n! - 40320 for n=8",
        "Solutions: n=4 gives 2, n=5 gives 10, n=6 gives 4, n=8 gives 92",
        "Space O(n) for the column array plus O(n) recursion depth"
      ],
      traps: [
        "Not undoing the placement. The array then carries the previous branch's choice and the search silently invents boards with two queens in one row.",
        "Checking only columns and rows and forgetting diagonals - the symptom is solutions that look valid but overlap.",
        "Copying the whole board at each recursion level: correct, but it turns O(n) space into O(n squared) per node and is the difference between finishing and timing out."
      ],
      interview: [
        { q: "What makes a problem backtrackable rather than DP?", a: "You are enumerating arrangements under constraints, so every partial candidate matters, rather than optimising a value that satisfies optimal-substructure. Sudoku and word search are backtracking; shortest path is not." },
        { q: "How would you speed N-Queens up?", a: "Bit masks for occupied columns and diagonals, symmetry reduction - mirror halves of the first row give twice the count for free - and ordering rows by how few columns remain legal." }
      ]
    }
  },
  {
    id: "greedy",
    subject: "dsa",
    title: "Greedy: activity selection",
    blurb: "Sort by finish time, then never look back - and see why.",
    inputLabel: "acts=start-end",
    defaultInput: "acts=1-4,3-5,0-6,5-7,3-9,5-9,6-10,8-11,8-12,2-14,12-16",
    run: (input) => runGreedy(input),
    read: {
      concept: "Greedy algorithms commit to the locally best choice and never revisit it, which only works when you can prove the choice is safe. Activity selection is the cleanest proof: sorting by END time and taking the first compatible activity is optimal, because any schedule that starts with something else can be swapped to the earliest finisher without reducing the number of activities that still fit. The sorting rule is the algorithm - sort by start time or by duration and the same scan gives wrong answers on the same data.",
      mechanism: [
        "Sort activities by finish time, breaking ties by start time.",
        "Walk the sorted list keeping lastEnd; take any activity whose start is at or after lastEnd and update it.",
        "Every rejection is a pure overlap test against one number - no backtracking, no table.",
        "The exchange argument: replacing the first activity of any optimal solution with the earliest finisher keeps the solution feasible and the same length."
      ],
      formulas: [
        "O(n log n) for the sort, O(n) for the scan, O(1) extra space",
        "Greedy is safe when the problem has the greedy-choice property plus optimal substructure",
        "Adding a weight per activity destroys the greedy answer - that version is DP"
      ],
      traps: [
        "Sorting by start time. The classic counterexample is one long activity starting at 0 that blocks everything.",
        "Sorting by shortest duration: two short activities can still straddle a third that would have fit both others.",
        "Assuming greedy generalises. Fractional knapsack is greedy by value-per-weight; 0/1 knapsack is not, and the difference is exactly the divisibility of the choice."
      ],
      interview: [
        { q: "How do you prove a greedy solution is correct?", a: "Exchange argument: take any optimal solution and show you can replace its first choice with yours without making it worse, then induct on what is left. If you cannot write that sentence, you do not have a greedy algorithm - you have a heuristic." },
        { q: "Huffman coding - why is greedy right there?", a: "The two least-frequent symbols must be siblings at the deepest level in some optimal tree, so merging them is provably safe. Repeat with the merged node, and the priority queue is just the search for the two smallest each round." }
      ]
    }
  }
];
function dsaTopicById(id) {
  return dsaTopics.find((topic) => topic.id === id) ?? dsaTopics[0];
}
function dsaMetrics(frame, frames) {
  const rows = [];
  const last = frames[frames.length - 1];
  if (frame.kind === "bars" || frame.kind === "chain") {
    rows.push({ label: "comparisons", value: String(frame.tally.comparisons), hint: "each one is the cost of one decision" });
    rows.push({ label: "writes", value: String(frame.tally.writes) });
    if (frame.tally.probes) rows.push({ label: "probes", value: String(frame.tally.probes) });
  }
  if (frame.kind === "dsatree") {
    const roots = frame.nodes.filter((n) => !frame.edges.some((e) => e.to === n.id));
    const depthOf = (id) => {
      const parent = frame.edges.find((e) => e.to === id);
      return parent ? 1 + depthOf(parent.from) : 0;
    };
    const height = frame.nodes.length ? Math.max(...frame.nodes.map((n) => depthOf(n.id))) : 0;
    rows.push({ label: "nodes", value: String(frame.nodes.length) });
    rows.push({ label: "roots", value: roots.length ? roots.map((r) => r.text || r.id).join(", ") : "-" });
    rows.push({ label: "depth", value: String(height), hint: "log n is the goal - a chain means the invariant broke" });
    rows.push({ label: "comparisons", value: String(frame.tally.comparisons) });
  }
  if (frame.kind === "graph") {
    rows.push({ label: "visited", value: `${frame.visited.length}/${frame.nodes.length}` });
    rows.push({ label: "edges examined", value: String(frame.tally.comparisons) });
    rows.push({ label: "frontier", value: frame.frontier.length ? frame.frontier.join(", ") : "empty" });
  }
  if (frame.kind === "grid") {
    const filled = frame.cells.flat().filter((c) => c.text !== "").length;
    rows.push({ label: "cells filled", value: String(filled) });
    rows.push({ label: "table size", value: `${frame.rowLabels.length} x ${frame.colLabels.length}` });
    rows.push({ label: "answer", value: last && last.kind === "grid" ? last.cells[last.cells.length - 1][last.cells[last.cells.length - 1].length - 1].text : "-" });
  }
  if (frame.kind === "board") {
    rows.push({ label: "solutions found", value: String(frame.solutions.length) });
    rows.push({ label: "legality checks", value: String(frame.tally.comparisons) });
    rows.push({ label: "pruned squares", value: String(frame.tally.probes) });
  }
  if (frame.kind === "interval") {
    const chosen = frames.filter((f) => f.kind === "interval").flatMap((f) => f.items.filter((i) => i.tone === "good").map((i) => i.id));
    rows.push({ label: "activities chosen", value: String(new Set(chosen).size) });
    rows.push({ label: "overlap tests", value: String(last && last.kind === "interval" ? last.tally.comparisons : 0) });
  }
  return rows;
}
function treeFrame(step, nodes, edges, focus, caption, detail, lanes = [], tally = emptyTally()) {
  return { kind: "dsatree", step, nodes, edges, focus, lanes, tally, caption, detail };
}
function drawBin(node, tone, note, nodes, edges) {
  if (!node) return;
  nodes.push({ id: String(node.key), text: String(node.key), tone: tone(node.key), note: note(node.key) });
  if (node.left) {
    edges.push({ from: String(node.key), to: String(node.left.key), tone: tone(node.left.key) });
    drawBin(node.left, tone, note, nodes, edges);
  }
  if (node.right) {
    edges.push({ from: String(node.key), to: String(node.right.key), tone: tone(node.right.key) });
    drawBin(node.right, tone, note, nodes, edges);
  }
}
var inOrder = (node, out = []) => {
  if (!node) return out;
  inOrder(node.left, out);
  out.push(node.key);
  inOrder(node.right, out);
  return out;
};
function runTree(input, algorithm = "bst") {
  const fields = fieldMap(input);
  const keys = numList(fields.get("keys"), algorithm === "trie" ? [] : algorithm === "heap" ? [4, 10, 3, 5, 1, 2] : algorithm === "avl" ? [30, 20, 10, 40, 50, 5] : [50, 30, 70, 20, 40, 60, 80]).map(Math.round);
  const words = wordList(fields.get("words"), ["car", "cat", "care", "cd"]);
  const find = intOf(fields.get("find") ?? "", algorithm === "avl" ? 10 : 40);
  const frames = [];
  const tally = emptyTally();
  if (algorithm === "trie") {
    const root2 = { kids: /* @__PURE__ */ new Map(), end: false, count: 0 };
    const draw = (focus, tone, note) => {
      const nodes2 = [{ id: "root", text: "", tone: focus.includes("root") ? "active" : "idle", note: `${root2.count} words below` }];
      const edges2 = [];
      const walk = (node, id) => {
        for (const [ch, child] of [...node.kids.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
          const cid = `${id}/${ch}`;
          edges2.push({ from: id, to: cid, tone: tone(cid) });
          nodes2.push({ id: cid, text: ch, tone: tone(cid), note: child.end ? `word \xB7 ${child.count} below` : `${child.count} below` });
          walk(child, cid);
        }
      };
      walk(root2, "root");
      return { nodes: nodes2, edges: edges2, note };
    };
    frames.push(treeFrame(
      0,
      draw(["root"], () => "idle", () => "").nodes,
      [],
      ["root"],
      `${words.length} words \xB7 the key is the path, not the value`,
      `A trie stores the characters themselves as the structure. Searching does not compare whole strings - it follows one edge per character, so cost is O(word length) regardless of how many words are stored.`
    ));
    for (const word of words) {
      let node = root2;
      let path = "root";
      for (const ch of word) {
        tally.writes++;
        node.count++;
        if (!node.kids.has(ch)) node.kids.set(ch, { kids: /* @__PURE__ */ new Map(), end: false, count: 0 });
        node = node.kids.get(ch);
        path = `${path}/${ch}`;
        const { nodes: nodes3, edges: edges3 } = draw([path], (id) => id === path ? "active" : "idle", () => "");
        frames.push(treeFrame(
          frames.length,
          nodes3,
          edges3,
          [path],
          `insert "${word}": follow ${word.slice(0, word.indexOf(ch) + 1)}`,
          `Shared prefixes are created once. "${word.slice(0, word.indexOf(ch) + 1)}" already had ${node.count} word(s) underneath it, so the new word only pays for the characters that are genuinely new.`,
          [{ label: "words stored", items: words.slice(0, words.indexOf(word) + 1), hot: words.indexOf(word), tone: "done", note: `${words.indexOf(word) + 1}/${words.length}` }],
          { ...tally }
        ));
      }
      node.end = true;
      node.count++;
      const { nodes: nodes2, edges: edges2 } = draw([path], (id) => id === path ? "good" : "idle", () => "");
      frames.push(treeFrame(
        frames.length,
        nodes2,
        edges2,
        [path],
        `"${word}" ends here \xB7 mark terminal`,
        `Marking the end is what distinguishes "care" from "car": both paths exist, only one of them is a complete word. Without the flag you have a set of prefixes, not a dictionary.`,
        [{ label: "words stored", items: words.slice(0, words.indexOf(word) + 1), hot: words.indexOf(word), tone: "good", note: `${words.indexOf(word) + 1}/${words.length}` }],
        { ...tally }
      ));
    }
    for (const prefix of ["c", "ca", "car"]) {
      let node = root2;
      const walked = ["root"];
      for (const ch of prefix) {
        tally.comparisons++;
        node = node && node.kids.has(ch) ? node.kids.get(ch) : null;
        walked.push(`${walked[walked.length - 1]}/${ch}`);
        if (!node) break;
      }
      const { nodes: nodes2, edges: edges2 } = draw(node ? [walked[walked.length - 1]] : [], (id) => id === walked[walked.length - 1] ? "active" : "ghost", () => "");
      frames.push(treeFrame(
        frames.length,
        nodes2,
        edges2,
        node ? [walked[walked.length - 1]] : [],
        node ? `prefix "${prefix}" is a ancestor of ${node.count} word(s)` : `prefix "${prefix}" is not present`,
        `Answered by walking ${prefix.length} edges - no scanning of ${words.length} stored words, and autocomplete gets its ranking straight from the counts recorded on the way down.`,
        [{ label: "prefix", items: ["c", "ca", "car"], hot: ["c", "ca", "car"].indexOf(prefix), tone: "done", note: node ? `${node.count} matches` : "0 matches" }],
        { ...tally }
      ));
    }
    const { nodes, edges } = draw([], () => "done", () => "");
    frames.push(treeFrame(
      frames.length,
      nodes,
      edges,
      [],
      `trie built \xB7 ${nodes.length} nodes for ${words.length} words`,
      `Space is O(total characters) and lookups are O(key length). The price is that the branching factor is the alphabet size, which is why compression (radix trees) and memory-mapped tries matter for real dictionaries.`,
      [{ label: "stored", items: words, hot: null, tone: "done", note: `${words.length} words` }],
      { ...tally }
    ));
    return frames;
  }
  if (algorithm === "heap") {
    const a = [...keys];
    const treeOf = (arr, focus, tone) => {
      const nodes = [];
      const edges = [];
      arr.forEach((value, i) => {
        nodes.push({ id: String(i), text: String(value), tone: tone(i), note: i === 0 ? "root = max" : `child of ${Math.floor((i - 1) / 2)}` });
        if (i > 0) edges.push({ from: String(Math.floor((i - 1) / 2)), to: String(i), tone: tone(i) });
      });
      void focus;
      return { nodes, edges };
    };
    const lanesOf = (arr, hot, caption) => [{ label: "array (complete binary tree in level order)", items: arr.map(String), hot, tone: "done", note: caption }];
    frames.push(treeFrame(
      0,
      treeOf(a, [], () => "idle").nodes,
      treeOf(a, [], () => "idle").edges,
      [String(0)],
      `${a.length} keys \xB7 the heap is an array pretending to be a tree`,
      `Children of index i are 2i+1 and 2i+2, so a complete binary tree needs no pointers at all. That is why the heap wins on cache behaviour, and why it can only ever be a complete tree - which is exactly what keeps its height at log n.`,
      lanesOf(a, null, "input")
    ));
    for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) {
      let cur = i;
      for (; ; ) {
        const l = cur * 2 + 1;
        const r = cur * 2 + 2;
        let biggest = cur;
        if (l < a.length && a[l] > a[biggest]) biggest = l;
        if (r < a.length && a[r] > a[biggest]) biggest = r;
        tally.comparisons += (l < a.length ? 1 : 0) + (r < a.length ? 1 : 0);
        const toneOf = (idx) => idx === cur ? "active" : idx === biggest ? biggest === cur ? "done" : "danger" : "idle";
        const drawn = treeOf(a, [cur, biggest], toneOf);
        if (biggest === cur) {
          frames.push(treeFrame(
            frames.length,
            drawn.nodes,
            drawn.edges,
            [String(cur)],
            `subtree at index ${cur} (value ${a[cur]}) already satisfies the heap property`,
            `Both children are smaller, so nothing moves. ${a.length - 1 - i} subtrees have been checked so far and this one cost ${l < a.length ? 2 : 1} comparisons and zero writes.`,
            lanesOf(a, cur, `sift-down ${i}`),
            { ...tally }
          ));
          break;
        }
        const t = a[cur];
        a[cur] = a[biggest];
        a[biggest] = t;
        tally.writes += 2;
        frames.push(treeFrame(
          frames.length,
          drawn.nodes,
          drawn.edges,
          [String(biggest)],
          `sift-down: child ${a[biggest]} outweighs parent ${a[cur]} \xB7 swap index ${cur} with ${biggest}`,
          `The value that just moved down may now violate its own children, so the sift continues from ${biggest}. Cost per node is proportional to how far it falls - and most nodes are leaves that barely move, which is why the whole build is O(n) not O(n log n).`,
          lanesOf(a, biggest, `sift-down ${i}`),
          { ...tally }
        ));
        cur = biggest;
      }
    }
    frames.push(treeFrame(
      frames.length,
      treeOf(a, [], () => "good").nodes,
      treeOf(a, [], () => "good").edges,
      ["0"],
      `max-heap built: [${a.join(", ")}] \xB7 ${tally.comparisons} comparisons, ${tally.writes} writes`,
      `Root is the largest and every parent beats its children - but siblings are unordered, so a heap is a partial order. It answers "what is the extreme?" in O(1) and "what is the 500th smallest?" not at all; that needs sorting or selection.`,
      lanesOf(a, null, "heap"),
      { ...tally }
    ));
    const sorted = [];
    const rest = [...a];
    for (let pass = 0; pass < a.length; pass++) {
      const top = rest[0];
      sorted.push(top);
      rest[0] = rest[rest.length - 1];
      rest.pop();
      let cur = 0;
      for (; ; ) {
        const l = cur * 2 + 1;
        const r = cur * 2 + 2;
        let biggest = cur;
        if (l < rest.length && rest[l] > rest[biggest]) biggest = l;
        if (r < rest.length && rest[r] > rest[biggest]) biggest = r;
        if (biggest === cur) break;
        const t = rest[cur];
        rest[cur] = rest[biggest];
        rest[biggest] = t;
        tally.writes += 2;
        cur = biggest;
      }
      tally.comparisons++;
      frames.push(treeFrame(
        frames.length,
        treeOf(rest, [], () => "active").nodes,
        treeOf(rest, [], () => "active").edges,
        [],
        `pop max ${top} \xB7 heap shrinks to ${rest.length}`,
        `Heapsort = build once, then extract the root n times, sifting each replacement down. O(n log n) worst case with O(1) extra space and no recursion, which is why it is the fallback in introsort when quick sort exceeds its depth limit.`,
        [{ label: "extracted (descending)", items: sorted.map(String), hot: sorted.length - 1, tone: "done", note: `output` }, { label: "heap array", items: rest.map(String), hot: null, tone: "active", note: `${rest.length} left` }],
        { ...tally }
      ));
    }
    frames.push(treeFrame(
      frames.length,
      [],
      [],
      [],
      `heapsort output (ascending): [${[...sorted].reverse().join(", ")}]`,
      `Stable? No - equal keys can swap order. In-place? Yes. Predictable O(n log n)? Yes. Those three properties are exactly the trade against quick sort, and interviews love asking for it.`,
      [{ label: "sorted", items: [...sorted].reverse().map(String), hot: null, tone: "good", note: "final" }],
      { ...tally }
    ));
    return frames;
  }
  if (algorithm === "avl") {
    const height = (n) => n ? n.h : 0;
    const fix = (n) => {
      n.h = 1 + Math.max(height(n.left), height(n.right));
    };
    const bal = (n) => height(n.left) - height(n.right);
    const snapshot = (top, focus, toneOf, caption, detail, extraLanes = []) => {
      const nodes = [];
      const edges = [];
      const walk = (n) => {
        if (!n) return;
        nodes.push({ id: String(n.key), text: String(n.key), tone: toneOf(n.key), note: `height ${n.h} \xB7 balance ${bal(n) > 0 ? "+" : ""}${bal(n)}` });
        if (n.left) {
          edges.push({ from: String(n.key), to: String(n.left.key), tone: toneOf(n.left.key) });
          walk(n.left);
        }
        if (n.right) {
          edges.push({ from: String(n.key), to: String(n.right.key), tone: toneOf(n.right.key) });
          walk(n.right);
        }
      };
      walk(top);
      frames.push(treeFrame(frames.length, nodes, edges, focus.map(String), caption, detail, extraLanes, { ...tally }));
    };
    const rotateRight = (y) => {
      const x = y.left;
      y.left = x.right;
      x.right = y;
      fix(y);
      fix(x);
      return x;
    };
    const rotateLeft = (x) => {
      const y = x.right;
      x.right = y.left;
      y.left = x;
      fix(x);
      fix(y);
      return y;
    };
    let root2 = null;
    frames.push(treeFrame(
      0,
      [],
      [],
      [],
      `${keys.length} inserts \xB7 every node must keep |balance| <= 1`,
      `A plain BST degenerates to a linked list on sorted input. AVL trees record the height of each subtree, check the difference on the way back up from the insert, and rotate locally when it reaches 2 - one rotation repairs one subtree without disturbing anything above it.`
    ));
    for (const key of keys) {
      let rotation = "";
      const insert = (node) => {
        if (!node) {
          tally.writes++;
          return { key, left: null, right: null, h: 1 };
        }
        tally.comparisons++;
        if (key === node.key) {
          snapshot(
            root2,
            [node.key],
            (k) => k === node.key ? "danger" : "idle",
            `${key} already present - a BST rejects the duplicate`,
            `Dictionaries either keep a count on the node or refuse the insert. Silently overwriting the subtree is the third option, and the one that loses data.`
          );
          return node;
        }
        if (key < node.key) node.left = insert(node.left);
        else node.right = insert(node.right);
        fix(node);
        const b = bal(node);
        if (b > 1 || b < -1) {
          const heavy = b > 1 ? node.left : node.right;
          const childBalance = bal(heavy);
          const kind = b > 1 && childBalance >= 0 ? "LL" : b > 1 ? "LR" : b < -1 && childBalance <= 0 ? "RR" : "RL";
          rotation = `${kind} at ${node.key}`;
          snapshot(
            root2,
            [node.key, heavy.key],
            (k) => k === node.key || k === heavy.key ? "danger" : "idle",
            `imbalanced at ${node.key}: balance ${b > 0 ? "+" : ""}${b} \xB7 ${kind} case from inserting ${key}`,
            `The new key fell into the ${b > 1 ? "left" : "right"} subtree and made it ${Math.abs(b)} levels deeper. ${kind === "LL" || kind === "RR" ? "The heavy child leans the same way, so a single rotation in the opposite direction restores the height." : "The heavy child leans the other way, so one rotation would just move the problem: rotate the child first to make it an L/R shape, then rotate the node."}`
          );
          if (kind === "LL") return rotateRight(node);
          if (kind === "RR") return rotateLeft(node);
          if (kind === "LR") {
            node.left = rotateLeft(heavy);
            return rotateRight(node);
          }
          node.right = rotateRight(heavy);
          return rotateLeft(node);
        }
        return node;
      };
      root2 = insert(root2);
      snapshot(
        root2,
        [],
        () => "done",
        `after inserting ${key}: root is ${root2 ? root2.key : "-"}${rotation ? ` \xB7 rotated ${rotation}` : " \xB7 no rotation needed"}`,
        rotation ? `The rotation changed which node heads that subtree but not the subtree's height, which is why no ancestor above it needs a second fix. Every subtree now satisfies |balance| <= 1.` : `Nothing reached balance 2 on the way up, so the tree grew by one node and stayed legal. That is the common case - rotations are rare, which is what makes AVL worth the extra bookkeeping.`,
        [{ label: "inserted so far", items: keys.slice(0, keys.indexOf(key) + 1).map(String), hot: keys.indexOf(key), tone: "done", note: `${keys.indexOf(key) + 1}/${keys.length}` }]
      );
    }
    snapshot(
      root2,
      [find],
      (k) => k === find ? "good" : "active",
      `search for ${find} \xB7 height ${height(root2)}`,
      `A search walks at most height(root) nodes and discards half the remainder at each level - the same log n behaviour as binary search, but the array never has to stay sorted, so inserting costs a rotation instead of a memmove.`
    );
    snapshot(
      root2,
      [],
      () => "done",
      `AVL tree of ${keys.length} keys \xB7 height ${height(root2)} \xB7 in-order [${inOrderAvl(root2).join(", ")}]`,
      `${tally.comparisons} comparisons and ${tally.writes} writes to build it, and the in-order walk reads the keys back sorted with no comparisons at all. AVL keeps height near 1.44*log2(n) - tighter than a red-black tree, so it reads faster and rotates more on writes.`,
      [{ label: "in-order", items: inOrderAvl(root2).map(String), hot: null, tone: "good", note: "sorted" }]
    );
    return frames;
  }
  let root = null;
  frames.push(treeFrame(
    0,
    [],
    [],
    [],
    `${keys.length} inserts \xB7 order of arrival decides the shape`,
    `The BST rule is one line: smaller left, bigger right. What that costs depends entirely on the sequence you insert - the same set of keys can give a balanced tree or a linked list, and the student who has only ever drawn the balanced picture is in for a surprise.`,
    [{ label: "insertion order", items: keys.map(String), hot: null, tone: "idle", note: "arrival sequence" }]
  ));
  for (const key of keys) {
    let node = root;
    let parent = null;
    let goLeft = false;
    if (!root) {
      root = { key, left: null, right: null };
      tally.writes++;
    } else {
      for (; ; ) {
        if (!node) break;
        const at = node;
        tally.comparisons++;
        const drawn2 = [];
        const edges2 = [];
        drawBin(root, (k) => k === at.key ? "active" : k === key ? "active" : "idle", () => "", drawn2, edges2);
        if (key < at.key) {
          frames.push(treeFrame(
            frames.length,
            drawn2,
            edges2,
            [String(at.key)],
            `${key} < ${at.key} \xB7 go left`,
            `Half the tree is eliminated by one comparison, exactly like binary search - except the discarded half is a subtree, not an index range, which is why the same guarantee needs the tree to stay short.`,
            [{ label: "path", items: [parent ? String(parent.key) : "", String(at.key)].filter(Boolean), hot: parent ? 1 : 0, tone: "active", note: "descend" }],
            { ...tally }
          ));
          parent = at;
          goLeft = true;
          node = at.left;
        } else {
          frames.push(treeFrame(
            frames.length,
            drawn2,
            edges2,
            [String(at.key)],
            `${key} >= ${at.key} \xB7 go right`,
            `Everything in the left subtree is smaller than ${at.key} and therefore smaller than ${key}, so it can be ignored for the rest of the search.`,
            [{ label: "path", items: [parent ? String(parent.key) : "", String(at.key)].filter(Boolean), hot: parent ? 1 : 0, tone: "active", note: "descend" }],
            { ...tally }
          ));
          parent = at;
          goLeft = false;
          node = at.right;
        }
      }
      const child = { key, left: null, right: null };
      if (parent) {
        if (goLeft) parent.left = child;
        else parent.right = child;
      }
      tally.writes++;
    }
    const drawn = [];
    const edges = [];
    drawBin(root, (k) => k === key ? "good" : "idle", () => "", drawn, edges);
    frames.push(treeFrame(
      frames.length,
      drawn,
      edges,
      [String(key)],
      `inserted ${key} as a leaf`,
      `Insertions always happen at a leaf, so no existing structure moves - the cost is only the search path. Deleting a node with two children is where the asymmetry shows up: you must find a replacement that keeps the order.`,
      [{ label: "in the tree", items: inOrder(root).map(String), hot: inOrder(root).indexOf(key), tone: "done", note: "in-order = sorted" }],
      { ...tally }
    ));
  }
  const searchPath = [];
  let cursor = root;
  let hit = false;
  while (cursor) {
    tally.comparisons++;
    searchPath.push(String(cursor.key));
    const drawn = [];
    const edges = [];
    drawBin(root, (k) => searchPath.includes(String(k)) ? "active" : "ghost", () => "", drawn, edges);
    if (cursor.key === find) {
      hit = true;
      frames.push(treeFrame(
        frames.length,
        drawn.map((n) => n.id === String(find) ? { ...n, tone: "good" } : n),
        edges,
        [String(find)],
        `found ${find} after ${searchPath.length} comparisons`,
        `Path ${searchPath.join(" -> ")}. That is height(root) steps, and height is only logarithmic while the tree stays balanced - which nothing in the insert rule guarantees.`,
        [{ label: "search path", items: searchPath, hot: searchPath.length - 1, tone: "good", note: `${searchPath.length} nodes visited` }],
        { ...tally }
      ));
      break;
    }
    const goLeft = find < cursor.key;
    frames.push(treeFrame(
      frames.length,
      drawn,
      edges,
      searchPath,
      `${find} vs ${cursor.key} \xB7 go ${goLeft ? "left" : "right"}`,
      `One comparison per level. Insert order matters: feeding keys in sorted order gives a chain of height n, and this exact tree degenerates to a linked list - hence AVL, red-black, and treaps.`,
      [{ label: "search path", items: searchPath, hot: searchPath.length - 1, tone: "active", note: `${searchPath.length} visited` }],
      { ...tally }
    ));
    cursor = goLeft ? cursor.left : cursor.right;
  }
  if (!hit) {
    const missNodes = [];
    const missEdges = [];
    drawBin(root, (k) => searchPath.includes(String(k)) ? "ghost" : "idle", () => "", missNodes, missEdges);
    frames.push(treeFrame(
      frames.length,
      missNodes,
      missEdges,
      [],
      `${find} is not in the tree`,
      `A miss is detected by running out of nodes. Because search and insert share the descent, "insert if absent" costs exactly one walk - the basis of implementing a set as a tree with no extra bookkeeping.`,
      [{ label: "search path", items: searchPath, hot: null, tone: "danger", note: "absent" }],
      { ...tally }
    ));
  }
  const finalNodes = [];
  const finalEdges = [];
  const treeHeight = (n) => n ? 1 + Math.max(treeHeight(n.left), treeHeight(n.right)) : 0;
  drawBin(root, () => "done", () => "", finalNodes, finalEdges);
  frames.push(treeFrame(
    frames.length,
    finalNodes,
    finalEdges,
    [],
    `BST of ${keys.length} keys \xB7 height ${treeHeight(root)} \xB7 in-order [${inOrder(root).join(", ")}]`,
    `${tally.comparisons} comparisons total. The in-order walk produces sorted output without any comparisons at all - the ordering was paid for at insert time, which is the entire bargain a balanced search tree makes.`,
    [{ label: "in-order", items: inOrder(root).map(String), hot: null, tone: "done", note: "sorted for free" }],
    { ...tally }
  ));
  return frames;
}
function inOrderAvl(node, out = []) {
  if (!node) return out;
  inOrderAvl(node.left, out);
  out.push(node.key);
  inOrderAvl(node.right, out);
  return out;
}
export {
  countInversions,
  dpAlgorithms,
  dsaMetrics,
  dsaSubjects,
  dsaTopicById,
  dsaTopics,
  graphAlgorithms,
  hashAlgorithms,
  hashSummary,
  listAlgorithms,
  numList,
  parseGraph,
  queueAlgorithms,
  recursionAlgorithms,
  runBinarySearch,
  runDp,
  runGraph,
  runGreedy,
  runHash,
  runList,
  runPrefixSum,
  runQueens,
  runQueue,
  runRecursion,
  runSlidingWindow,
  runSort,
  runStack,
  runTree,
  runTwoPointers,
  runUnionFind,
  sortAlgorithms,
  sortSummary,
  stackAlgorithms,
  treeAlgorithms,
  wordList
};
