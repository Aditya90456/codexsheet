// CodexSheet sells four things. This module is the only place a price is written
// down, because the last time pricing lived in strings the page said ₹199 while
// the database still refused anything under ₹800 — and the student who paid the
// advertised price got nothing.
//
// Two rules keep this honest:
//   1. Every price here has a matching CHECK on public.mentorship_orders
//      (supabase/migrations/20261106_codexsheet_products.sql). The row cannot land
//      at any other figure, so the page cannot over-promise.
//   2. `gate` says exactly which view the product opens. Copy may describe more,
//      but only what is in `gate` is locked, and what was already free stays free
//      for anyone who paid under the old Sheet Pass — they are grandfathered by
//      `unlocks_all` in the same migration.

import { rupees } from "./mentorship";

export type ProductId = "dsa250" | "roadmap" | "patterns" | "session";

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
};

/** The views a product can lock. Mirrors WorkspaceView in App.tsx, without the union. */
export type WorkspaceGate = "problems" | "roadmap" | "patterns" | "mentees";

export const codexSheetProducts: CodexSheetProduct[] = [
  {
    id: "dsa250",
    name: "CodexSheet 250",
    cadence: "one payment · never expires",
    price: 100,
    tag: "SHEET",
    oneLine: "The 250-problem DSA sheet, every pattern and every difficulty.",
    includes: [
      "All 250 problems with your notes, status, XP and streak saved to your account",
      "Every pattern filter, the 12-week stage ladder and the timed sets",
      "Solve milestones that feed the leaderboard and your certificate",
      "Refund inside 5 days of the confirmed payment if it was not worth it",
    ],
    gate: ["problems"],
    repeatable: false,
  },
  {
    id: "roadmap",
    name: "CodexSheet Roadmap",
    cadence: "one payment · never expires",
    price: 159,
    tag: "PLAN",
    oneLine: "The 12-week roadmap board: what to study in which week, and why.",
    includes: [
      "The node-graph board with all 12 weeks, their patterns and their outcomes",
      "The pace counted from the real sheet, so no week promises a number that does not exist",
      "Your target placement season and the gap between plan and practice",
      "Refund inside 5 days of the confirmed payment",
    ],
    gate: ["roadmap"],
    repeatable: false,
  },
  {
    id: "patterns",
    name: "CodexSheet Pattern Course",
    cadence: "one payment · never expires",
    price: 200,
    tag: "COURSE",
    oneLine: "Sixteen patterns as spoken lesson films, with the deck for each.",
    includes: [
      "All 16 pattern films: the mechanism runs on screen while the captions read themselves",
      "Narration in eight Indian languages, with the skeleton line spoken as it highlights",
      "The .pptx deck per pattern — speaker notes and the assignment set already inside it",
      "The 4-question pattern test on every card",
      "Refund inside 5 days of the confirmed payment",
    ],
    gate: ["patterns"],
    repeatable: false,
  },
  {
    id: "session",
    name: "CodexSheet Mentor Session",
    cadence: "per session · buy as many as you need",
    price: 100,
    tag: "1:1",
    oneLine: "One 45-minute Google Meet with Aditya, on a slot you pick.",
    includes: [
      "A real calendar slot you choose; the Meet link is saved to your lane",
      "He reads your code line by line on the judged submission, not on a slide",
      "A written note after the call: what broke, what to fix this week",
      "The link arrives by email when the session moves",
    ],
    gate: ["mentees"],
    repeatable: true,
  },
];

export function productById(id: string): CodexSheetProduct | undefined {
  return codexSheetProducts.find((product) => product.id === id);
}

/** The rails a product opens, said the way a student would say it. */
export const gateLabels: Record<WorkspaceGate, string> = {
  problems: "the 250-problem sheet on /problems",
  roadmap: "the 12-week board on /roadmap",
  patterns: "the 16 films and PPT decks on /patterns",
  mentees: "your chat lane and 1:1 Meet slot on /mentees",
};

/** What buying this product opens, or the delivery promise when it buys a service. */
export function railLabel(product: CodexSheetProduct): string {
  const gate = product.gate[0];
  return gate ? gateLabels[gate] : "the delivery Aditya sends you";
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
export const catalogueTotal = codexSheetProducts.reduce((sum, product) => sum + product.price, 0);
