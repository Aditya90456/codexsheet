// Mentorship pricing and the Paytm-only payment contract.
// Money moves through Aditya's personal Paytm UPI handle, so the app never
// touches a gateway: it locks the amount, builds the UPI intent, and records
// the claim for him to confirm against his Paytm statement.
export const payee = {
  phone: "8335873311",
  upiId: "8335873311@paytm",
  displayName: "Aditya Bakshi CodexSheet",
} as const;

export const mentorEmail = "adityabakshi1011@gmail.com";

/** The only thing CodexSheet sells. Older rows in the ledger still name plans below. */
export type MentorshipPlanId = "family";

/**
 * Pay what you can. Most students cannot clear a fixed fee, so the band is the
 * price: the DB trigger rejects a family order outside ₹10 to ₹800 and
 * workspace_unlocked() treats every confirmed amount as a full pass.
 */
export const passBand = { min: 10, max: 800, suggested: 250, presets: [10, 50, 100, 250, 500, 800] } as const;

export function clampAmount(value: number): number {
  if (!Number.isFinite(value)) return passBand.suggested;
  return Math.min(passBand.max, Math.max(passBand.min, Math.round(value)));
}

export type MentorshipPlan = {
  id: MentorshipPlanId;
  tag: string;
  title: string;
  subtitle: string;
  min: number;
  max: number;
  suggested: number;
  cadence: string;
  includes: string[];
  highlight?: boolean;
};

export const mentorshipPlans: MentorshipPlan[] = [
  {
    id: "family",
    tag: "FAM",
    title: "CodexSheet Family Pass",
    subtitle: "All 19 features, whatever you can pay",
    min: passBand.min,
    max: passBand.max,
    suggested: passBand.suggested,
    cadence: "one payment · no expiry",
    includes: [
      "Every one of the 19 workspace features, opened at once",
      "All 250 patterns and the full problem library",
      "Deva editor with real judged submissions, the animated course and the AI tutor",
      "Roadmap board, notes, articles, LLD path, whiteboard, calendar and job search",
      "Group chat, video calls and the personal AI",
      "A 1:1 session with Aditya you book yourself, plus the private chat lane",
    ],
  },
];

export function planById(id: string): MentorshipPlan | undefined {
  return mentorshipPlans.find((plan) => plan.id === id);
}

/** Twelve weeks over the sheet - patterns and interviews only, no LLD or HLD. */
export type CurriculumWeek = {
  label: string;
  title: string;
  focus: string[];
  pace: string;
  outcome: string;
};

export const curriculum: CurriculumWeek[] = [
  { label: "Week 1", title: "Build the lookup reflex", focus: ["Arrays & Hashing"], pace: "21 problems", outcome: "You stop writing a loop before asking what a hash map already answers." },
  { label: "Week 2", title: "Move two ends, not one", focus: ["Two Pointers"], pace: "21 problems", outcome: "Sorted input becomes a reflex: pair sums, containers, trapped water." },
  { label: "Week 3", title: "Windows you can shrink", focus: ["Sliding Window"], pace: "21 problems", outcome: "Longest, shortest and at-most-K questions collapse into one template you own." },
  { label: "Week 4", title: "What is still open", focus: ["Stack", "Monotonic Stack"], pace: "21 problems", outcome: "Next-greater, valid parentheses and histogram problems stop being guesses." },
  { label: "Week 5", title: "Boundaries without off-by-ones", focus: ["Binary Search"], pace: "21 problems", outcome: "You write the predicate first and let the search fall out of it." },
  { label: "Week 6", title: "Pointers that must not leak", focus: ["Linked List"], pace: "21 problems", outcome: "Fast and slow pointers, in-place reversal and cycle detection, drawn before coded." },
  { label: "Week 7", title: "Recursion you can draw", focus: ["Trees"], pace: "21 problems", outcome: "BFS, DFS, paths and tree DP with the call stack visible on paper." },
  { label: "Week 8", title: "Traversals on real graphs", focus: ["Graphs"], pace: "21 problems", outcome: "Islands, course schedules, shortest unweighted path - you pick the traversal from the question." },
  { label: "Week 9", title: "Choose, explore, undo", focus: ["Backtracking"], pace: "21 problems", outcome: "Subsets, permutations and pruning, and you can explain the state you carry." },
  { label: "Week 10", title: "Order things under pressure", focus: ["Heaps", "Intervals"], pace: "21 problems", outcome: "Top-K, merge intervals and scheduling: sort by end, then sweep." },
  { label: "Week 11", title: "States and transitions", focus: ["1-D DP", "2-D DP"], pace: "21 problems", outcome: "You define the state before the recurrence and memoise what you actually proved." },
  { label: "Week 12", title: "Mixed set, then a real mock", focus: ["Greedy", "Bit Manipulation"], pace: "19 problems + a timed set", outcome: "One recorded 1:1 mock interview with Aditya and a written feedback note on your code." },
];

/** Five days from a confirmed pass to ask for the money back. */
export const refundWindow = {
  days: 5,
  headline: "Five days to decide",
  body: "If the pass is not what you needed, tell Aditya within 5 days of the confirmed payment and he refunds the full {price} on Paytm, straight back to the UPI id you paid from. No form, no clawback call.",
};

/** What happens between the Paytm QR and the first call. */
export const passFlow: { title: string; body: string }[] = [
  { title: "Pay on Paytm", body: "Scan the QR. Amount and payee are locked in the code, so there is nothing to mistype." },
  { title: "Record your reference", body: "Fill the small form on this page. It files the claim with your reference code." },
  { title: "Aditya matches the money", body: "He ticks your reference against his own Paytm statement. The badge flips DUE → DONE." },
  { title: "Your lane opens", body: "All 19 features, the full 250-problem sheet, your weekly slot and the private chat." },
];

/** Only promises the product actually keeps — no invented résumé. */
export const mentorCraft: string[] = [
  "He reads your solution line by line, on the real judged submission in the Deva editor — not a paragraph of advice.",
  "One 1:1 call every week, and you pick the hour from the slots he publishes (Mon–Fri, 11:00–18:00 IST).",
  "Stuck between sessions? Message him in the private lane; there is no per-question charge.",
  "He confirms your payment himself before the first call, so the ledger and his Paytm statement always agree.",
];

/** Rupee display with Indian grouping, so 1000 reads as ₹1,000. */
export function rupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Names a plan for a student, including the products retired when the pass launched. */
export function planLabel(plan: string): string {
  const legacy: Record<string, string> = {
    "one-to-one": "1:1 Mentorship",
    "ltm-3-months": "Long-Term Mentorship · 3 months",
    "ltm-6-months": "Long-Term Mentorship · 6 months",
    roadmap: "250-Pattern DSA Roadmap",
  };
  return planById(plan)?.title ?? legacy[plan] ?? plan;
}

/** DUE = Aditya has not ticked the money against his Paytm statement. DONE = he has. */
export function paymentBadge(order: { status: string }): { cls: "due" | "done" | "off"; label: string } {
  if (order.status === "confirmed" || order.status === "delivered") return { cls: "done", label: "PAYMENT DONE" };
  if (order.status === "cancelled") return { cls: "off", label: "CANCELLED" };
  return { cls: "due", label: "PAYMENT DUE" };
}

const referenceAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short, human-safe code that travels in the UPI note so a Paytm entry maps back to one student. */
export function orderReference(plan: MentorshipPlan): string {
  let random = "";
  const values = new Uint32Array(8);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) crypto.getRandomValues(values);
  else for (let index = 0; index < values.length; index++) values[index] = Math.floor(Math.random() * 0xffffffff);
  for (const value of values) random += referenceAlphabet[value % referenceAlphabet.length];
  return `CS-${plan.tag}-${random}`;
}

/** NPCI UPI intent URI — every UPI app (Paytm, PhonePe, GPay, BHIM) resolves this. */
export function upiUri(plan: MentorshipPlan, reference: string, amount: number): string {
  // UPI apps decode query values percent-style only, so `+` must never appear
  // for a space and the `@` in a VPA stays literal.
  const encode = (value: string) => encodeURIComponent(value).replace(/%40/g, "@");
  const params = [
    `pa=${encode(payee.upiId)}`,
    `pn=${encode(payee.displayName)}`,
    `am=${clampAmount(amount).toFixed(2)}`,
    "cu=INR",
    `tn=${encode(reference)}`,
    `tr=${encode(reference)}`,
  ].join("&");
  return `upi://pay?${params}`;
}

/** Android intent URL that opens the Paytm app directly instead of the picker. */
export function paytmIntentUri(plan: MentorshipPlan, reference: string, amount: number): string {
  const query = upiUri(plan, reference, amount).slice("upi://pay?".length);
  return `intent://pay?${query}#Intent;scheme=upi;package=net.one97.paytm;end`;
}

/** iOS Paytm scheme, for students on an iPhone where `upi://` has no handler. */
export function paytmAppUri(plan: MentorshipPlan, reference: string, amount: number): string {
  const query = upiUri(plan, reference, amount).slice("upi://pay?".length);
  return `paytmmp://pay?${query}`;
}

export function qrImageUrl(uri: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(uri)}`;
}

export type MentorshipOrder = {
  reference: string;
  plan: MentorshipPlanId;
  amount: number;
  buyerName: string;
  buyerContact: string;
  buyerEmail: string;
  paytmReference: string;
  status: "awaiting" | "confirmed" | "delivered" | "cancelled";
  userId: string;
  note: string;
};

export type MentorshipOrderResult =
  | { ok: true; source: "supabase" }
  | { ok: false; source: "queued"; reason: string };

const queueKey = "codexsheet-mentorship-queue";

export function queuedOrders(): MentorshipOrder[] {
  try {
    const raw = localStorage.getItem(queueKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as MentorshipOrder[]) : [];
  } catch {
    return [];
  }
}

function enqueue(order: MentorshipOrder): void {
  const rest = queuedOrders().filter((item) => item.reference !== order.reference);
  try {
    localStorage.setItem(queueKey, JSON.stringify([order, ...rest].slice(0, 40)));
  } catch {
    /* Storage full or blocked: the reference on screen is still enough for a DM. */
  }
}

/**
 * Records a payment claim. Supabase is the source of truth; when the table is
 * missing or offline the claim is kept on the device so nothing is lost.
 */
export async function recordOrder(
  order: MentorshipOrder,
  insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>,
): Promise<MentorshipOrderResult> {
  const row = {
    reference: order.reference,
    plan: order.plan,
    amount: order.amount,
    buyer_name: order.buyerName.trim(),
    buyer_contact: order.buyerContact.trim(),
    buyer_email: order.buyerEmail.trim(),
    paytm_reference: order.paytmReference.trim(),
    status: order.status,
    user_id: order.userId,
    note: order.note.trim(),
  };
  try {
    const { error } = await insert(row);
    if (!error) return { ok: true, source: "supabase" };
    enqueue(order);
    return { ok: false, source: "queued", reason: error.message };
  } catch (error) {
    enqueue(order);
    return { ok: false, source: "queued", reason: error instanceof Error ? error.message : "Network unavailable." };
  }
}
