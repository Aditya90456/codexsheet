// studyPack.ts — one presentation per pattern, built in the browser.
//
// The deck is not a summary of the site: it is the teaching layer that already
// lives on /patterns and in the labs, laid out for a room. Slides carry what a
// student recites; the speaker notes carry what a mentor would say, taken from
// the film script and the labs' own mechanism, traps and interview questions.
// The assignment slides are read straight off the 250-problem sheet, tier by
// tier, so the homework is the real list and not a hand-written approximation.
import { interviewPlan, roadmapStages, tierLabels, type PatternCard } from "./dsaPatterns";
import { problems as sheet, type Problem } from "./dsaSheet";
import { dsaTopics } from "./dsa-labs-kernels";

/** Labs topic that teaches the same pattern, where one exists. */
const topicByPattern: Record<string, string> = {
  "Arrays & Hashing": "hashing",
  "Two Pointers": "two-pointers",
  "Sliding Window": "sliding-window",
  Stack: "stack",
  "Monotonic Stack": "stack",
  "Binary Search": "binary-search",
  "Linked List": "linked-list",
  Trees: "trees",
  Backtracking: "backtracking",
  Graphs: "graphs",
  "1-D DP": "dp",
  "2-D DP": "dp",
  Greedy: "greedy",
  Intervals: "greedy",
  Heaps: "trees",
};

const INK = "F2F6FF";
const MUTED = "A8B6D0";
const ACCENT = "5B8DEF";
const BG = "0A1020";
const PANEL = "121B31";
const MONO = "Consolas";

const W = 13.333;
const H = 7.5;

type TextOptions = Record<string, unknown>;
type TextRuns = Array<{ text: string; options: TextOptions }>;
type Slide = {
  background: { color: string };
  addText: (value: TextRuns, options: TextOptions) => unknown;
  addShape: (value: string, options: TextOptions) => unknown;
  addNotes: (value: string) => unknown;
};

const today = () =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date());

const kicker = (text: string): TextRuns => [
  { text, options: { fontSize: 11.5, color: ACCENT, bold: true, charSpacing: 3, fontFace: "Arial" } },
];

const heading = (text: string): TextRuns => [
  { text, options: { fontSize: 30, color: INK, bold: true, fontFace: "Arial" } },
];

/** Bullet rows on a dark panel. */
function bulletRows(items: string[]): TextRuns {
  return items.map((text) => ({
    text,
    options: {
      bullet: { code: "2022", indent: 16 },
      breakLine: true,
      color: INK,
      fontSize: 15,
      paraSpaceAfter: 9,
      fontFace: "Arial",
    },
  }));
}

const HEAD_AT = { x: 0.7, y: 0.42, w: 11.9, h: 0.34 };
const TITLE_AT = { x: 0.7, y: 0.82, w: 11.9, h: 0.8 };
const SUB_AT = { x: 0.7, y: 1.62, w: 11.9, h: 0.44 };
const FOOT_AT = { x: 0.7, y: H - 0.52, w: 8, h: 0.3 };

export type PatternDeck = { fileName: string; slides: number; assignments: number };

/**
 * Build the deck and hand back the finished file. `nodebuffer` is what the
 * generator script uses to write a real file to disk; the site asks for `blob`.
 */
export async function buildPatternDeck(
  card: PatternCard,
  outputType: "blob" | "nodebuffer" = "blob",
): Promise<{ data: Blob | Uint8Array; meta: PatternDeck }> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "CodexSheet";
  pptx.company = "CodexSheet";
  pptx.subject = `CodexSheet pattern deck · ${card.name}`;
  pptx.title = `CodexSheet · ${card.name}`;

  const topicId = topicByPattern[card.name];
  const topic = dsaTopics.find((item) => item.id === topicId);
  const reading = topic?.read;
  const sheetProblems = sheet.filter((problem) => problem.pattern === card.name);
  const byTier = (tier: 1 | 2 | 3) => sheetProblems.filter((problem) => problem.tier === tier);
  const script = card.film.map((step) => step.caption);
  const interviewLine = card.film.find((step) => step.title.startsWith("Interview line"))?.caption ?? "";
  const fileName = `codexsheet-${card.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pptx`;
  let slides = 0;

  const slide = (title?: string, sub?: string): Slide => {
    const page = pptx.addSlide() as unknown as Slide;
    page.background = { color: BG };
    slides += 1;
    if (title) {
      page.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: ACCENT } });
      page.addText(kicker(`CODEXSHEET · ${card.name.toUpperCase()}`), HEAD_AT);
      page.addText(heading(title), TITLE_AT);
      if (sub) {
        page.addText([{ text: sub, options: { fontSize: 14, italic: true, color: MUTED, fontFace: "Arial" } }], SUB_AT);
      }
    }
    page.addText([{ text: `codexsheet.in/patterns · ${today()}`, options: { fontSize: 10, color: MUTED, fontFace: "Arial" } }], FOOT_AT);
    return page;
  };

  // ── Cover ────────────────────────────────────────────────────────────────
  const cover = slide();
  cover.addShape("roundRect", { x: 0.7, y: 1.05, w: W - 1.4, h: 2.5, fill: { color: PANEL }, line: { color: "1E2C4A", width: 1 }, rectRadius: 0.08 });
  cover.addText(
    [
      { text: `Pattern ${card.tier === 1 ? "of the first hour" : card.tier === 2 ? "of the second pass" : "of the polish round"}`, options: { fontSize: 12, color: ACCENT, bold: true, charSpacing: 3, breakLine: true, fontFace: "Arial" } },
      { text: card.name, options: { fontSize: 44, bold: true, color: INK, breakLine: true, fontFace: "Arial", paraSpaceBefore: 8 } },
      { text: card.tagline, options: { fontSize: 18, color: MUTED, italic: true, fontFace: "Arial" } },
    ],
    { x: 1.15, y: 1.35, w: W - 2.4, h: 1.95, valign: "top" },
  );
  cover.addText(
    bulletRows([
      `${sheetProblems.length} problems on the CodexSheet sheet: ${byTier(1).length} must-know, ${byTier(2).length} strong signal, ${byTier(3).length} extra reps.`,
      `Cost: ${card.complexity}`,
      `${card.film.length}-step teaching film behind these slides - the notes on every slide are its script.`,
    ]),
    { x: 0.78, y: 3.95, w: W - 1.7, h: 2.3, valign: "top" },
  );
  cover.addNotes(
    `Deck: ${card.name} - ${card.tagline}\n`
    + `Built by CodexSheet on ${today()} from the live teaching layer, not a hand-typed summary.\n`
    + `Say this first: "${card.cue}"\n`
    + script.join("\n"),
  );

  // ── Spot it ──────────────────────────────────────────────────────────────
  const spot = slide("How you spot it in the wild", "Read the sentence of the question, not the numbers.");
  spot.addText(bulletRows([card.cue]), { x: 0.78, y: 2.2, w: W - 1.7, h: 2.0, valign: "top" });
  if (reading) {
    spot.addShape("roundRect", { x: 0.7, y: 4.25, w: W - 1.4, h: 2.35, fill: { color: PANEL }, line: { color: "1E2C4A", width: 1 }, rectRadius: 0.08 });
    spot.addText(
      [
        { text: "WHAT IS ACTUALLY HAPPENING", options: { fontSize: 11, bold: true, color: ACCENT, charSpacing: 2.6, breakLine: true, fontFace: "Arial" } },
        { text: reading.concept, options: { fontSize: 14.5, color: INK, paraSpaceBefore: 8, fontFace: "Arial" } },
      ],
      { x: 1.0, y: 4.5, w: W - 2.0, h: 1.9, valign: "top" },
    );
  }
  spot.addNotes(
    `Open by asking the room: what words in the question tell you this pattern applies?\n${reading ? `Concept: ${reading.concept}\n` : ""}${script[0] ?? ""}`
  );

  // ── Mechanism ────────────────────────────────────────────────────────────
  if (reading && reading.mechanism.length > 0) {
    const mechanism = slide("The mechanism, in order", "Every step is a sentence you can say out loud in an interview.");
    const steps = reading.mechanism.slice(0, 8);
    mechanism.addText(
      steps.map((text, index) => ({
        text: `${index + 1}.  ${text}`,
        options: { breakLine: true, color: INK, fontSize: 15.5, paraSpaceAfter: 11, fontFace: "Arial" },
      })),
      { x: 0.78, y: 2.2, w: W - 1.6, h: 4.3, valign: "top" },
    );
    mechanism.addNotes(`${reading.concept}\n\nScript for this slide:\n${script.slice(0, 3).join("\n")}`);
  }

  // ── Skeleton ─────────────────────────────────────────────────────────────
  const code = slide("The skeleton you memorise", "Not the answer to one problem - the shape under fifty of them.");
  code.addShape("roundRect", { x: 0.7, y: 2.15, w: W - 1.4, h: 4.45, fill: { color: PANEL }, line: { color: "1E2C4A", width: 1 }, rectRadius: 0.06 });
  code.addText(
    card.template.map((line, index) => ({
      text: `${String(index + 1).padStart(2, "0")}  ${line}`,
      options: { breakLine: true, color: index === 0 ? ACCENT : INK, fontSize: 13.5, fontFace: MONO },
    })),
    { x: 1.0, y: 2.42, w: W - 2.0, h: 3.9, valign: "top" },
  );
  code.addNotes(
    `Walk it line by line and say what each line buys.\n${card.film
      .filter((step) => step.title !== "Interview line to say")
      .map((step) => `${step.title}: ${step.caption}`)
      .join("\n")}\n${interviewLine}`
  );

  // ── Costs ────────────────────────────────────────────────────────────────
  const costs = slide("What it costs, and what that buys", card.complexity);
  const costRows = [...(reading?.formulas ?? []), `This pattern: ${card.complexity}`].slice(0, 7);
  costs.addText(bulletRows(costRows), { x: 0.78, y: 2.25, w: W - 1.6, h: 4.2, valign: "top" });
  costs.addNotes(
    `The complexity claim is the graded part of the answer, so state it before writing code.\n${script[script.length - 2] ?? ""}\n${interviewLine}`
  );

  // ── Variants ─────────────────────────────────────────────────────────────
  const variants = slide("The four shapes this pattern wears", "Same idea, different tell.");
  variants.addText(bulletRows(card.variants), { x: 0.78, y: 2.25, w: W - 1.6, h: 2.4, valign: "top" });
  if (reading && reading.traps.length > 0) {
    variants.addShape("roundRect", { x: 0.7, y: 4.55, w: W - 1.4, h: 2.1, fill: { color: PANEL }, line: { color: "1E2C4A", width: 1 }, rectRadius: 0.08 });
    variants.addText(
      [
        { text: "TRAPS THAT COST INTERVIEWS", options: { fontSize: 11, bold: true, color: ACCENT, charSpacing: 2.6, breakLine: true, fontFace: "Arial" } },
        ...reading.traps.slice(0, 3).map((text) => ({ text: `- ${text}`, options: { breakLine: true, fontSize: 13.5, color: INK, paraSpaceBefore: 7, fontFace: "Arial" } })),
      ],
      { x: 1.0, y: 4.78, w: W - 2.0, h: 1.75, valign: "top" },
    );
  }
  variants.addNotes(`${script.join("\n")}\n\nTraps: ${(reading?.traps ?? []).join(" ")}`);

  // ── The interviewer follows up ───────────────────────────────────────────
  if (reading && reading.interview.length > 0) {
    reading.interview.slice(0, 3).forEach((asked, index) => {
      const page = slide(
        reading.interview.length > 1 ? `The follow-up ${index + 1}: "${asked.q}"` : `The follow-up: "${asked.q}"`,
        index === 0 ? "The answer lives in the speaker notes - say it before you read it." : undefined,
      );
      page.addText(
        [
          { text: "Why this is asked", options: { fontSize: 11, bold: true, color: ACCENT, charSpacing: 2.6, breakLine: true, fontFace: "Arial" } },
          { text: "The interviewer is testing whether you derived the pattern or memorised it. Answer with the invariant, then the cost.", options: { breakLine: true, fontSize: 15, color: INK, paraSpaceBefore: 8, fontFace: "Arial" } },
          { text: "Recite this", options: { fontSize: 11, bold: true, color: ACCENT, charSpacing: 2.6, breakLine: true, paraSpaceBefore: 16, fontFace: "Arial" } },
          { text: interviewLine || card.tagline, options: { fontSize: 16, italic: true, color: INK, paraSpaceBefore: 8, fontFace: "Arial" } },
        ],
        { x: 0.78, y: 2.5, w: W - 1.6, h: 3.9, valign: "top" },
      );
      page.addNotes(`Q: ${asked.q}\nA: ${asked.a}`);
    });
  }

  // ── Assignments, tier by tier ────────────────────────────────────────────
  ([1, 2, 3] as const).forEach((tier) => {
    const list = byTier(tier);
    if (list.length === 0) return;
    const chunks: Problem[][] = [];
    for (let index = 0; index < list.length; index += 9) chunks.push(list.slice(index, index + 9));
    chunks.forEach((chunk, part) => {
      const page = slide(
        `Assignment ${tierLabels[tier]}${chunks.length > 1 ? ` · part ${part + 1} of ${chunks.length}` : ""}`,
        `${tier === 1 ? "Solve these before anything else on this pattern." : tier === 2 ? "The set that separates a pass from a strong pass." : "Reps. Speed and clean code, not new ideas."} ${card.name} · ${list.length} problem${list.length === 1 ? "" : "s"} on the sheet.`,
      );
      page.addText(
        chunk.map((problem) => ({
          text: `${problem.number}.  ${problem.title}  ·  ${problem.difficulty}  ·  ${problem.link.replace(/^https:\/\//, "")}`,
          options: { breakLine: true, fontSize: 13.5, color: INK, paraSpaceAfter: 8, fontFace: "Arial" },
        })),
        { x: 0.78, y: 2.35, w: W - 1.5, h: 4.4, valign: "top" },
      );
      page.addNotes(
        chunk
          .map((problem) => `${problem.number}. ${problem.title} (${problem.difficulty}) - ${problem.link}`)
          .join("\n")
        + "\n\nSet the clock: 25 minutes per must-know, 40 for a strong signal. Write the note in the sheet next to the problem - the note is what you revise from, not the code."
        + `\n${script[part] ?? script[0] ?? ""}`,
      );
    });
  });

  // ── Where this sits in the plan ──────────────────────────────────────────
  const week = interviewPlan.find((entry) => entry.focus.includes(card.name));
  const stage = roadmapStages.find((entry) => entry.patterns.includes(card.name));
  const closing = slide("Close the loop", "A pattern is only learned when you can teach it back.");
  closing.addText(
    bulletRows([
      week ? `Week ${week.week} of the eight-week plan: ${week.goal}` : "This pattern sits outside the eight-week spine - take it after the plan.",
      stage ? `${stage.name} (${stage.weeks}): ${stage.outcome}` : "Keep it in the daily mix once the plan is done.",
      `Re-solve the ${byTier(1).length} must-know problems cold, one week from today, with no notes open.`,
      "Then record yourself explaining the skeleton for 90 seconds. If it does not come out as sentences, the pattern is not yours yet.",
    ]),
    { x: 0.78, y: 2.25, w: W - 1.6, h: 4.2, valign: "top" },
  );
  closing.addNotes(
    `Homework for the next session: ${byTier(1).map((problem) => problem.title).join(", ")}.\n${interviewLine}`
  );

  const data = (await pptx.write({ outputType: outputType === "nodebuffer" ? "nodebuffer" : "blob" })) as Blob | Uint8Array;
  return { data, meta: { fileName, slides, assignments: sheetProblems.length } };
}

/** The site-facing call: build it and hand the student the file. */
export async function downloadPatternDeck(card: PatternCard): Promise<PatternDeck> {
  const { data, meta } = await buildPatternDeck(card, "blob");
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data as BlobPart]));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = meta.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 8000);
  return meta;
}
