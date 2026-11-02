// pattern-sims.ts — the live simulation behind each pattern film.
// Every frame comes from the same kernels the DSA labs run, so a film shows the
// real algorithm on a worked input instead of a canned animation. The inputs are
// curated to keep each run short enough to read at film pace.

import { speakCode } from "./code-speech";
import { fieldMap } from "./cs-labs-kernels";
import {
  dsaTopicById,
  numList,
  type BarsFrame,
  type DsaFrame,
} from "./dsa-labs-kernels";
import { filmLength, type PatternCard } from "./dsaPatterns";

export type PatternSim = {
  topicId: string;
  algorithm?: string;
  /** Names the exact run when the parent lab title is too broad for the card. */
  heading?: string;
  input: string;
  lens: string;
};

const BIT_RUN = "bit-manipulation";

/** 8-bit group, printed as two nibbles so the eye can follow single bits. */
const bits = (value: number) =>
  (value >>> 0).toString(2).padStart(8, "0").replace(/^(....)(?=.)/, "$1 ");

/**
 * The one pattern with no lab kernel. XOR pair-cancellation, then the
 * n & (n - 1) trick, both drawn as bars so it renders in the same views.
 */
export function runBits(input: string): BarsFrame[] {
  const fields = fieldMap(input);
  const values = numList(fields.get("arr"), [4, 1, 2, 1, 2]).map(Math.round);
  const labels = values.map((value) => String(value));
  const frames: BarsFrame[] = [];
  const tally = { comparisons: 0, writes: 0, probes: 0 };

  const push = (caption: string, detail: string, extra: Partial<BarsFrame> = {}) =>
    frames.push({
      kind: "bars",
      step: frames.length,
      values: labels,
      marks: [],
      band: null,
      pair: null,
      pairTone: "idle",
      settled: [],
      lanes: [],
      tally: { ...tally },
      caption,
      detail,
      ...extra,
    });

  push(
    `${labels.join(", ")} · every value appears twice except one`,
    `XOR is the only arithmetic in the machine that erases a pair: a ^ a = 0 and a ^ 0 = a. So folding it across the whole array leaves exactly the value that had no partner, with no hash set and no extra memory.`
  );

  let running = 0;
  for (let i = 0; i < values.length; i += 1) {
    const before = running;
    running ^= values[i];
    tally.comparisons += 1;
    tally.writes += 1;
    const settled: number[] = [];
    for (let j = 0; j < i; j += 1) settled.push(j);
    push(
      `${bits(before)} ^ ${bits(values[i])} = ${bits(running)}`,
      values[i] === before
        ? `Nothing changes when a value meets its own copy: x ^ x is zero. That is the cancellation doing the work.`
        : `The running total absorbs ${values[i]}. Order does not matter - XOR is commutative and associative, which is why a single pass over an unsorted array is enough.`
      ,
      {
        marks: [{ index: i, label: "xor", tone: "active" }],
        settled,
        lanes: [
          {
            label: "running xor",
            items: [bits(running)],
            hot: 0,
            tone: running === 0 ? "done" : "good",
            note: running === 0 ? "every pair has cancelled" : `= ${running}`,
          },
        ],
      }
    );
  }

  const answer = running;
  push(
    `answer ${answer} · ${bits(answer)} in one pass, O(1) space`,
    `The whole problem cost n XOR gates and no memory beyond one register. The same argument solves "find the number that appears once while others appear three times" only if you switch to counting bits modulo 3 - plain XOR cancels pairs, not triples.`
  );

  let rest = answer;
  let ones = 0;
  while (rest) {
    const before = rest;
    rest &= rest - 1;
    ones += 1;
    tally.probes += 1;
    push(
      `count set bits: ${bits(before)} & ${bits(before - 1)} = ${bits(rest)}`,
      `${before - 1} flips every bit below the lowest set one, so the AND clears exactly that lowest bit. Repeating it ${ones} time${ones === 1 ? "" : "s"} counted the ones - the loop runs once per set bit, not once per position. This is also how you test whether a number is a power of two: n & (n - 1) === 0.`
    );
  }

  return frames;
}

export const patternSimByName: Record<string, PatternSim> = {
  "Arrays & Hashing": {
    topicId: "hashing",
    algorithm: "chaining",
    input: "keys=25,72,38,33,45,71,10;size=7;find=38",
    lens: "Seven slots, seven keys: watch collisions grow a bucket instead of a scan.",
  },
  "Two Pointers": {
    topicId: "two-pointers",
    input: "arr=1,2,4,5,7,9,11,15;target=13",
    lens: "Sorted array, one pair to find. Each step deletes a whole row of the pair table.",
  },
  "Sliding Window": {
    topicId: "sliding-window",
    input: "arr=1,4,2,10,23,3,1,12;k=3",
    lens: "A three-wide window slides once per element: add one, drop one, never re-add.",
  },
  Stack: {
    topicId: "stack",
    algorithm: "brackets",
    input: "seq={[()]}{{[(])}}",
    lens: "Brackets on a stack - and the exact moment a counter would have lied.",
  },
  "Monotonic Stack": {
    topicId: "stack",
    algorithm: "minstack",
    heading: "Stacks: monotone min history",
    input: "ops=push 5, push 3, min, push 7, min, pop, min",
    lens: "A stack that keeps a monotone history, so the extreme is a top-of-stack read.",
  },
  "Binary Search": {
    topicId: "binary-search",
    input: "arr=-1,0,3,5,9,12;target=9",
    lens: "Halving a sorted array: every comparison throws away half of what is left.",
  },
  "Linked List": {
    topicId: "linked-list",
    algorithm: "reverse",
    input: "list=17,2,35,1,48,63",
    lens: "Three pointers, one pass, no new nodes - the in-place reversal frame by frame.",
  },
  Trees: {
    topicId: "trees",
    algorithm: "bst",
    input: "keys=50,30,70,20,40,60,80;find=40",
    lens: "Inserting builds the shape, then a search walks one root-to-leaf path.",
  },
  Backtracking: {
    topicId: "backtracking",
    input: "n=4",
    lens: "Queens on a 4x4 board: place, prune, and step back the moment a square is attacked.",
  },
  Graphs: {
    topicId: "graphs",
    algorithm: "bfs",
    input: "edges=A-B,A-D,B-C,C-D,B-E,D-E,E-F,C-F;start=A;find=F",
    lens: "Level by level from A - the frontier is the queue, and hops are shortest.",
  },
  "1-D DP": {
    topicId: "dp",
    algorithm: "coins",
    heading: "DP: coin change in one row",
    input: "coins=1,2,5;amount=6",
    lens: "One row of ways, grown coin by coin: each cell reads the cell behind it.",
  },
  "2-D DP": {
    topicId: "dp",
    algorithm: "lcs",
    heading: "DP: longest common subsequence",
    input: "a=ABCDF;b=AECDF",
    lens: "Two strings, one table: diagonal on a match, better neighbour on a miss.",
  },
  Greedy: {
    topicId: "greedy",
    input: "acts=1-4,3-5,0-6,5-7,3-9,5-9,6-10,8-11,8-12,2-14,12-16",
    lens: "Activity selection: always take the activity that finishes earliest.",
  },
  Intervals: {
    topicId: "greedy",
    heading: "Greedy: intervals by end time",
    input: "acts=1-3,2-6,8-10,15-18",
    lens: "Sorted by end time: take the next interval only once the last one has finished.",
  },
  Heaps: {
    topicId: "trees",
    algorithm: "heap",
    heading: "Binary heap: build and heapsort",
    input: "keys=4,10,3,5,1,2",
    lens: "Floyd's build-heap: sift down from the bottom, and the max lands on top.",
  },
  "Bit Manipulation": {
    topicId: BIT_RUN,
    input: "arr=4,1,2,1,2",
    lens: "XOR cancels the pairs, then n & (n - 1) counts what is left.",
  },
};

const framesByPattern = new Map<string, DsaFrame[]>();

/** A film has ~50 seconds of captions; more steps than this stops being readable. */
const MAX_FILM_STEPS = 30;

/**
 * One run per pattern, cached: the kernels are deterministic, so every viewing of
 * a film shows the same worked example and the work happens once per session.
 * Long runs are thinned to film pace - real states, fewer of them, always the last.
 */
export function patternSimFrames(name: string): DsaFrame[] {
  const cached = framesByPattern.get(name);
  if (cached) return cached;
  const sim = patternSimByName[name];
  const run: DsaFrame[] = sim
    ? sim.topicId === BIT_RUN
      ? runBits(sim.input)
      : dsaTopicById(sim.topicId).run(sim.input, sim.algorithm)
    : [];
  const stride = Math.max(1, Math.ceil(run.length / MAX_FILM_STEPS));
  const frames = run.length <= MAX_FILM_STEPS
    ? run
    : run.filter((_, index) => index % stride === 0 || index === run.length - 1);
  framesByPattern.set(name, frames);
  return frames;
}

/**
 * Where the simulation is at a given moment of the film. The run is cut to the
 * captions: each step owns a slice of frames proportional to how long it stays up,
 * so the code line, the sentence and the algorithm state move together and the
 * last frame lands on the last caption instead of racing ahead of it.
 */
export function simCut(card: PatternCard, count: number, elapsed: number, stepIndex: number): { index: number; head: number } {
  if (!count) return { index: 0, head: 1 };
  const total = filmLength(card);
  const durations = card.film.map((step, i) => Math.max(0.001, (card.film[i + 1]?.at ?? total) - step.at));
  const sum = durations.reduce((a, b) => a + b, 0);
  const before = durations.slice(0, stepIndex).reduce((a, b) => a + b, 0);
  const start = Math.floor((before / sum) * count);
  const end = Math.floor(((before + durations[stepIndex]) / sum) * count);
  const span = Math.max(1, end - start);
  const windowLength = durations[stepIndex];
  const within = Math.min(1, Math.max(0, (elapsed - card.film[stepIndex].at) / windowLength));
  return {
    index: Math.min(count - 1, start + Math.floor(within * span)),
    head: windowLength / span,
  };
}

/** Name of the exact run the film shows. */
export const patternSimHeading = (name: string) => {
  const sim = patternSimByName[name];
  if (!sim) return "";
  if (sim.heading) return sim.heading;
  return sim.topicId === BIT_RUN ? "XOR and bit tricks" : dsaTopicById(sim.topicId).title;
};

export type FilmNarration = { code: string; board: string; lines: string[]; script: string };

const BRACKET_WORDS: Record<string, string> = {
  "(": "an open parenthesis", ")": "a close parenthesis",
  "[": "an open bracket", "]": "a close bracket",
  "{": "an open brace", "}": "a close brace",
};

/**
 * A spaced dash is subtraction inside a bracketed expression and a pause outside:
 * "left + (right - left) / 2" must not be read as "right, left", but "level by
 * level - the frontier" must not be read as subtraction. A bracket that never
 * closes is decoration in a caption, so it does not make the dash arithmetic.
 */
function dashSpoken(src: string): string {
  const openers: number[] = [];
  const closed = new Set<number>();
  for (let i = 0; i < src.length; i += 1) {
    if ("([{".includes(src[i])) openers.push(i);
    else if (")]}".includes(src[i])) {
      const open = openers.pop();
      if (open !== undefined) closed.add(open);
    }
  }
  const groups: boolean[] = [];
  let out = "";
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if ("([{".includes(ch)) { groups.push(closed.has(i)); out += ch; continue; }
    if (")]}".includes(ch)) { groups.pop(); out += ch; continue; }
    const spaced = ch === "-" && /\s/.test(src[i - 1] ?? "") && /\s/.test(src[i + 1] ?? "");
    out += spaced && groups.includes(true) ? "minus " : spaced ? "," : ch;
  }
  return out;
}

/**
 * Captions and frame labels are written to be read, not heard: `·`, `->`, `a[i]`,
 * `O(n)`, `1..3`, a lone `[`. This turns one into a phrase a speech engine says
 * correctly, and only the spoken track gets it - the screen keeps the compact text.
 */
export function speakable(text: string): string {
  const maths = text
    .replace(/[()[\]{}]{4,}/g, "the bracket sequence")
    .replace(/\[(\d+)\.\.(\d+)\]/g, "from $1 to $2")
    .replace(/·/g, ",")
    .replace(/[—–]/g, ",")
    .replace(/->|→/g, " gives ")
    .replace(/&/g, " and ")
    .replace(/\|\|?/g, " or ")
    .replace(/\bO\(([^)]+)\)/g, " order $1")
    .replace(/\(\s*\)/g, "")
    .replace(/\[(\d+(?:,\s*\d+)*)\]/g, "the list $1")
    .replace(/([A-Za-z0-9_)\]])\[([^\]]+)\]\[([^\]]+)\]/g, "$1 at $2 and $3")
    .replace(/([A-Za-z0-9_)\]])\[([^\]]+)\]/g, "$1 at $2")
    .replace(/([A-Za-z])\(([^)]*)\)/g, "$1 of $2")
    // A tight dash between two numbers labels a span (the activity 3-5); a spaced
    // one is subtraction. `i-1` is an offset, so it reads as minus.
    .replace(/(\d)-(\d)/g, "$1 to $2")
    .replace(/([A-Za-z0-9_])-(\d)/g, "$1 minus $2")
    .replace(/\b0\/1\b/g, "zero one")
    .replace(/([A-Za-z0-9_)\]])\s*\/\s*(\d+)/g, "$1 divided by $2")
    .replace(/(\d)\s*\/\s*(?=[A-Za-z])/g, "$1,")
    .replace(/([A-Za-z0-9_)\]])\s*\^\s*(?=[A-Za-z0-9_(])/g, "$1 xored with ")
    .replace(/>>/g, " shifted right ")
    .replace(/<</g, " shifted left ")
    .replace(/!==/g, " is not ")
    .replace(/===/g, " is exactly ")
    .replace(/<=/g, " is at most ")
    .replace(/>=/g, " is at least ")
    .replace(/(\d)\s*<\s*(?=[\dA-Za-z])/g, "$1 is less than ")
    .replace(/(\d)\s*>\s*(?=[\dA-Za-z])/g, "$1 is more than ")
    .replace(/\+=/g, " increases by ")
    .replace(/-=/g, " decreases by ")
    .replace(/=/g, " is ")
    .replace(/(\d)\s*-\s*(\d)/g, "$1 minus $2")
    .replace(/([A-Za-z0-9_)\]])\s*\+\s*(?=[\dA-Za-z_(])/g, "$1 plus ");
  const said = dashSpoken(maths)
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/ ([.,;:])/g, "$1")
    .replace(/(,\s*){2,}/g, ", ");
  return said
    .split(" ")
    .map((word) => {
      const bare = word.replace(/[.,;:!?]+$/, "");
      const named = BRACKET_WORDS[word] ?? BRACKET_WORDS[bare];
      return named ? `${named}${word.slice(bare.length)}` : word;
    })
    .join(" ")
    .trim();
}

/** One sentence of the spoken track: cleaned up and ending in exactly one point. */
const say = (text: string) => {
  const said = speakable(text).replace(/(?:["'”’]|\s)+$/, "").replace(/[.,;:]+$/, "");
  return /[?!]$/.test(said) ? said : `${said}.`;
};

/**
 * What one caption step says. The sentence teaches the idea, the code reading
 * says what the highlighted line does, and the board line names the exact state
 * the kernel is in when that step starts - all three are derived, nothing is
 * authored per step, so a caption, a skeleton line and a simulation can't drift.
 * `board` stays as written for the screen; the voice gets the speakable form.
 */
export function filmNarration(card: PatternCard, stepIndex: number): FilmNarration {
  const step = card.film[stepIndex];
  const code = speakCode(card.template[step.line] ?? "");
  const frames = patternSimFrames(card.name);
  const board = (frames[simCut(card, frames.length, step.at, stepIndex).index]?.caption ?? "").replace(/\.+$/, "");
  const lines = [
    code ? `In the code: ${code}` : "",
    board ? `On the board: ${say(board)}` : "",
  ].filter(Boolean);
  const script = [
    stepIndex === 0 ? `${card.name}. ${say(card.tagline)}` : "",
    `${say(step.title)} ${say(step.caption)}`,
    ...lines,
  ].filter(Boolean).join(" ");
  return { code, board, lines, script };
}
