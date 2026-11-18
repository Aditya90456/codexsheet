// CodexSheet sells named products and Aditya's own time. This module is the only
// place a price is written down, because the last
// time pricing lived in strings the page said ₹199 while the database still
// refused anything under ₹800 — and the student who paid the advertised price got
// nothing.
//
// Three rules keep this honest:
//   1. Every active price has a matching CHECK on public.mentorship_orders.
//      The row cannot land at any other figure, so the page cannot over-promise.
//   2. `gate` says exactly which view the product opens. Copy may describe more,
//      but only what is in `gate` is locked, and what was already free stays free.
//   3. Retired product ids stay in this list so old payment history and
//      entitlements continue to resolve. Legacy all-access claims remain valid.

import { rupees } from "./mentorship";

export type ProductId = "dsa250" | "interview-research" | "roadmap" | "patterns" | "battle" | "session";

export type CodexSheetProduct = {
  id: ProductId;
  /** The name a student sees on the checkout page and on their receipt. */
  name: string;
  /** The word that goes before the name in a sentence: "one-time", "per session". */
  cadence: string;
  price: number;
  tag: string;
  oneLine: string;
  includes: string[];
  /** The views this product opens. Empty means it buys a service, not a rail. */
  gate: WorkspaceGate[];
  /** A session is bought again for every call; a sheet is bought once and kept. */
  repeatable: boolean;
  /** On the checkout page. The rest of the list is entitlement history, not stock. */
  sold: boolean;
};

/** The views a product can lock. Mirrors WorkspaceView in App.tsx, without the union. */
export type WorkspaceGate = "problems" | "interview-research" | "roadmap" | "patterns" | "arena" | "mentees";

export const codexSheetProducts: CodexSheetProduct[] = [
  {
    id: "dsa250",
    name: "Legacy CodexSheet DSA Sheet",
    cadence: "retired",
    price: 100,
    tag: "RETIRED",
    oneLine: "This product is no longer available. Existing claims remain in the payment history.",
    includes: [
      "All 250 DSA problems with your notes, status, XP and streak saved to your account",
    ],
    gate: ["problems"],
    repeatable: false,
    sold: false,
  },
  {
    id: "interview-research",
    name: "CodexSheet Interview Questions Research",
    cadence: "one payment · never expires",
    price: 100,
    tag: "INTERVIEW RESEARCH",
    oneLine: "Original company-grouped interview practice prompts, with official guide links.",
    includes: [
      "Original CodexSheet prompts for coding, system design, debugging and behavioral practice",
      "Company and question-type filters, plus follow-up prompts",
      "Official company interview-guide links for further preparation",
      "Evaluation guidance explaining what each practice prompt exercises",
      "Clear notice that prompts are not official or reported company questions",
      "Refund inside 5 days of the confirmed payment if it was not worth it",
    ],
    gate: ["interview-research"],
    repeatable: false,
    sold: true,
  },
  {
    id: "roadmap",
    name: "CodexSheet Roadmap",
    cadence: "retired · kept for existing claims",
    price: 159,
    tag: "PLAN",
    oneLine: "The 12-week roadmap board - no longer sold separately; kept for existing claims.",
    includes: [
      "The node-graph board with all 12 weeks, their patterns and their outcomes",
      "The pace counted from the real sheet, so no week promises a number that does not exist",
      "Your target placement season and the gap between plan and practice",
      "Refund inside 5 days of the confirmed payment",
    ],
    gate: ["roadmap"],
    repeatable: false,
    sold: false,
  },
  {
    id: "patterns",
    name: "CodexSheet Pattern Course",
    cadence: "retired · kept for existing claims",
    price: 200,
    tag: "COURSE",
    oneLine: "Sixteen patterns as spoken lesson films - no longer sold separately; kept for existing claims.",
    includes: [
      "All 16 pattern films: the mechanism runs on screen while the captions read themselves",
      "Narration in eight Indian languages, with the skeleton line spoken as it highlights",
      "The .pptx deck per pattern — speaker notes and the assignment set already inside it",
      "The 4-question pattern test on every card",
      "Refund inside 5 days of the confirmed payment",
    ],
    gate: ["patterns"],
    repeatable: false,
    sold: false,
  },
  {
    id: "battle",
    name: "CodexSheet Battle",
    cadence: "one payment · never expires",
    price: 200,
    tag: "AI DUEL",
    oneLine: "Play the 45-minute JavaScript battle against AI and unlock every battle level for ₹200.",
    includes: [
      "JavaScript-only battle challenges with hidden tests",
      "The full 100-level progression",
      "Character selection, wins, streaks and battle XP",
      "AI opponent solutions and post-match review",
    ],
    gate: ["arena"],
    repeatable: false,
    sold: true,
  },
  {
    id: "session",
    name: "CodexSheet Mentor Session",
    cadence: "per session · buy as many as you need",
    price: 100,
    tag: "1:1",
    oneLine: "Book a 45-minute 1:1 with Aditya on Topmate — pick your slot, pay there.",
    includes: [
      "Pick your slot on Topmate — payment is handled there, not on CodexSheet",
      "He reads your code line by line on the judged submission, not on a slide",
      "A written note after the call: what broke, what to fix this week",
      "The Meet link arrives from Topmate once you book",
    ],
    gate: ["mentees"],
    repeatable: true,
    sold: true,
  },
];

/** What a student can actually buy today, in the order the checkout shows it. */
export const soldProducts = codexSheetProducts.filter((product) => product.sold);

/** The current research product shown in the catalog and its lock card. */
export const interviewResearch = productById("interview-research")!;

export function productById(id: string): CodexSheetProduct | undefined {
  return codexSheetProducts.find((product) => product.id === id);
}

/** The rails a product opens, said the way a student would say it. */
export const gateLabels: Record<WorkspaceGate, string> = {
  problems: "the 250-problem sheet on /problems",
  "interview-research": "Interview Questions Research on /interviews",
  roadmap: "the 12-week board on /roadmap",
  patterns: "the 16 films and PPT decks on /patterns",
  arena: "CodexSheet Battle on /battle",
  mentees: "your chat lane and 1:1 Meet slot on /mentees",
};

/** What buying this product opens, or the delivery promise when it buys a service. */
export function railLabel(product: CodexSheetProduct): string {
  if (!product.gate.length) return "the delivery Aditya sends you";
  return product.gate.map((gate) => gateLabels[gate]).join(", ");
}

export function productPrice(id: ProductId): number {
  return productById(id)?.price ?? 0;
}

/** The figure a claim must carry for this plan, or null when the plan is unknown. */
export function expectedAmount(id: string): number | null {
  return productById(id)?.price ?? null;
}

export function productLabel(id: ProductId): string {
  const product = productById(id);
  return product ? `${product.name} · ${rupees(product.price)}` : "";
}

/**
 * Plans the ledger still carries from earlier prices. They are not sold here and
 * they are not deleted: an old confirmed claim must keep opening what it bought,
 * so the migration leaves them legal on the table.
 */
export const legacyPlans: Record<string, string> = {
  family: "the old pay-what-you-can Sheet Pass (₹10–₹800), which opened every rail",
  "one-to-one": "₹19",
  "ltm-3-months": "₹100",
  "ltm-6-months": "₹499",
};

/** Everything a first-time buyer can get in one sitting, for the checkout page. */
export const catalogueTotal = soldProducts.reduce((sum, product) => sum + product.price, 0);
