// CodexSheet sells five named products, priced in src/products.ts and enforced by
// a CHECK constraint on public.mentorship_orders. Each one is one exact figure,
// paid once to Aditya's personal Paytm UPI handle, so the app never touches a
// gateway: his own QR carries the payee only, the UPI intent carries the figure,
// and the server refuses a claim that does not match the price on the card. The
// UTR from the receipt is required. The claim is confirmed by the database as it
// lands, so the rail opens immediately and Aditya reconciles the UTR against his
// statement afterwards.
export const payee = {
  phone: "8882118279",
  upiId: "8882118279@fam",
  displayName: "Aditya Bakshi CodexSheet",
} as const;

/** His real Paytm QR, saved from his own app. It encodes the payee only - no amount. */
export const payeeQrSrc = "/paytm-qr.jpg";

/** His WhatsApp. The screenshot of the Paytm receipt lands here, not in a form field. */
export const whatsapp = { number: "918335873311", display: "+91 833587 3311" } as const;

/** A wa.me link that already names the reference, the product and the figure, so one tap sends the proof. */
export function whatsappHref(reference: string, product: string, amount: number): string {
  const body = `${product}\nReference: ${reference}\nAmount paid: ${rupees(amount)}\n(attach the Paytm receipt screenshot here)`;
  return `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(body)}`;
}

export const mentorEmail = "adityabakshi1011@gmail.com";

/** The plan id written on a claim is the product id - the ledger has no separate vocabulary. */
export type MentorshipPlanId = ProductId;

/**
 * Every figure a student can pay lives in src/products.ts, and this module reads
 * from it, so the page and the database can never disagree about a price.
 */
import { productById, type ProductId } from "./products";

/** Twelve weeks over the sheet - patterns and interviews only, no LLD or HLD. */
import { problems } from "./dsaSheet";

export type CurriculumWeek = {
  label: string;
  title: string;
  focus: string[];
  pace: string;
  outcome: string;
};

// The pace is not invented: it is what the sheet really carries for that week,
// counted from dsaSheet.ts, so /mentorship can never promise a number the /problems
// page does not have.
const problemsPerWeek = problems.reduce((map, problem) => {
  map[problem.week] = (map[problem.week] ?? 0) + 1;
  return map;
}, {} as Record<number, number>);

const curriculumWeeks: Array<Omit<CurriculumWeek, "pace">> = [
  { label: "Week 1", title: "Build the lookup reflex", focus: ["Arrays & Hashing"], outcome: "You stop writing a loop before asking what a hash map already answers." },
  { label: "Week 2", title: "Move two ends, not one", focus: ["Two Pointers"], outcome: "Sorted input becomes a reflex: pair sums, containers, trapped water." },
  { label: "Week 3", title: "Windows you can shrink", focus: ["Sliding Window"], outcome: "Longest, shortest and at-most-K questions collapse into one template you own." },
  { label: "Week 4", title: "What is still open", focus: ["Stack", "Monotonic Stack"], outcome: "Next-greater, valid parentheses and histogram problems stop being guesses." },
  { label: "Week 5", title: "Boundaries without off-by-ones", focus: ["Binary Search"], outcome: "You write the predicate first and let the search fall out of it." },
  { label: "Week 6", title: "Pointers that must not leak", focus: ["Linked List"], outcome: "Fast and slow pointers, in-place reversal and cycle detection, drawn before coded." },
  { label: "Week 7", title: "Recursion you can draw", focus: ["Trees"], outcome: "BFS, DFS, paths and tree DP with the call stack visible on paper." },
  { label: "Week 8", title: "Traversals on real graphs", focus: ["Graphs"], outcome: "Islands, course schedules, shortest unweighted path - you pick the traversal from the question." },
  { label: "Week 9", title: "Choose, explore, undo", focus: ["Backtracking"], outcome: "Subsets, permutations and pruning, and you can explain the state you carry." },
  { label: "Week 10", title: "Order things under pressure", focus: ["Heaps", "Intervals"], outcome: "Top-K, merge intervals and scheduling: sort by end, then sweep." },
  { label: "Week 11", title: "States and transitions", focus: ["1-D DP", "2-D DP"], outcome: "You define the state before the recurrence and memoise what you actually proved." },
  { label: "Week 12", title: "Mixed set, then a real mock", focus: ["Greedy", "Bit Manipulation"], outcome: "One recorded 1:1 mock interview with Aditya and a written feedback note on your code." },
];

export const curriculum: CurriculumWeek[] = curriculumWeeks.map((week) => {
  const number = Number(week.label.replace(/\D+/g, ""));
  const count = problemsPerWeek[number] ?? 0;
  return { ...week, pace: number === 12 ? `${count} problems + a timed set` : `${count} problems` };
});

/** Five days from a confirmed payment to ask for the money back. */
export const refundWindow = {
  days: 5,
  headline: "Five days to decide",
  body: "If it was not worth it, tell Aditya within 5 days of the confirmed payment and he refunds the full {price} on Paytm, straight back to the UPI id you paid from. No form, no clawback call.",
};

/** Only promises the product actually keeps — no invented résumé. */
export const mentorCraft: string[] = [
  "He reads your solution line by line, on the real judged submission in the Deva editor — not a paragraph of advice.",
  "Confirmed students get a private chat lane; he publishes 1:1 Google Meet slots and you pick the hour.",
  "Stuck at 2am on a sliding window? Message him; there is no per-question charge.",
  "Your pass opens the moment the claim is recorded, and he reconciles the UTR against his own Paytm statement after the fact.",
];

/**
 * Aditya's own credentials, the ones he publishes on his GitHub profile. The
 * mentor card and the home page quote this instead of restating numbers.
 */
export const mentorProfile = {
  name: "Aditya Bakshi",
  role: "Software developer, competitive programmer and founder of CodexSheet",
  stats: [
    { value: "700+", label: "problems solved on LeetCode" },
    { value: "300+", label: "students mentored" },
    { value: "600+", label: "1:1 sessions booked" },
  ],
  stack: ["MERN", "Java", "Spring Boot", "Kafka", "Python", "DSA", "Generative AI"],
  projects: [
    { name: "Codex Playground", href: "https://codex-playground-editor.vercel.app/", blurb: "The editor and learning workspace this grew out of." },
    { name: "BharatFlow AI", href: "https://bharatflow-ai.vercel.app/", blurb: "An AI-assisted traffic and police-support project." },
  ],
};

/** Rupee display with Indian grouping, so 1000 reads as ₹1,000. */
export function rupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Sessions and webinars happen on Google Meet. The same pattern the database uses
 * is applied client-side so a mentor is told before the RPC rejects the link.
 */
export function isMeetLink(value: string): boolean {
  return /^https:\/\/meet\.google\.com\/[a-z0-9/?=&%._-]+$/i.test(value.trim());
}

/**
 * The UPI UTR is the only string that appears on both the student's Paytm receipt
 * and Aditya's merchant statement, so it is what makes a claim searchable instead
 * of eyeballed. A real one is a 12-digit bank reference and can arrive prefixed
 * ("UTR2134...", "PAY..."), so length plus a digit count gates it rather than a
 * strict pattern - a phone number must not pass as proof of payment.
 */
export function utrValid(value: string): boolean {
  const cleaned = value.replace(/[\s-]/g, "");
  return /^[A-Za-z0-9]{12,30}$/.test(cleaned) && (cleaned.match(/\d/g) ?? []).length >= 11;
}

/** Names a plan for a student, including the passes retired before the catalogue. */
export function planLabel(plan: string): string {
  const legacy: Record<string, string> = {
    family: "CodexSheet Sheet Pass (retired)",
    "one-to-one": "1:1 Mentorship (retired)",
    "ltm-3-months": "Long-Term Mentorship · 3 months (retired)",
    "ltm-6-months": "Long-Term Mentorship · 6 months (retired)",
  };
  return productById(plan)?.name ?? legacy[plan] ?? plan;
}

/** DUE = Aditya has not ticked the money against his Paytm statement. DONE = he has. */
export function paymentBadge(order: { status: string }): { cls: "due" | "done" | "off"; label: string } {
  if (order.status === "confirmed" || order.status === "delivered") return { cls: "done", label: "PAYMENT DONE" };
  if (order.status === "cancelled") return { cls: "off", label: "CANCELLED" };
  return { cls: "due", label: "PAYMENT DUE" };
}

const referenceAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A collection handle. Aditya's Paytm id is one; every approved mentor brings their own. */
export type UpiPayee = { upiId: string; displayName: string };

/** Short, human-safe code that travels in the UPI note so a statement entry maps back to one student. */
export function referenceCode(tag: string): string {
  let random = "";
  const values = new Uint32Array(8);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) crypto.getRandomValues(values);
  else for (let index = 0; index < values.length; index++) values[index] = Math.floor(Math.random() * 0xffffffff);
  for (const value of values) random += referenceAlphabet[value % referenceAlphabet.length];
  return `CS-${tag}-${random}`;
}

export function orderReference(product: { tag: string }): string {
  // Marketplace tags are free text, and a colon or space in the UPI note makes
  // the code painful to retype - only letters and digits survive into it.
  return referenceCode(product.tag.toUpperCase().replace(/[^A-Z0-9]/g, ""));
}

/** NPCI UPI intent URI — every UPI app (Paytm, PhonePe, GPay, BHIM) resolves this. */
export function upiUriFor(payee: UpiPayee, reference: string, amount: number): string {
  // UPI apps decode query values percent-style only, so `+` must never appear
  // for a space and the `@` in a VPA stays literal.
  const encode = (value: string) => encodeURIComponent(value).replace(/%40/g, "@");
  const params = [
    `pa=${encode(payee.upiId)}`,
    `pn=${encode(payee.displayName)}`,
    `am=${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`,
    "cu=INR",
    `tn=${encode(reference)}`,
  ].join("&");
  // `tr` is optional and carried the same string as `tn`, so it was pure payload
  // weight. Measured against a real encoder, a mentor with a long payee name went
  // from QR version 5 to 6 the moment `tr` was added, and a higher version means
  // thinner modules a phone camera will not read off a laptop screen. `tn` is the
  // one that reaches the statement, so that is the one that stays.
  return `upi://pay?${params}`;
}

/** Android intent URL that opens the Paytm app directly instead of the picker. */
export function paytmIntentUriFor(payee: UpiPayee, reference: string, amount: number): string {
  const query = upiUriFor(payee, reference, amount).slice("upi://pay?".length);
  return `intent://pay?${query}#Intent;scheme=upi;package=net.one97.paytm;end`;
}

/** iOS Paytm scheme, for students on an iPhone where `upi://` has no handler. */
export function paytmAppUriFor(payee: UpiPayee, reference: string, amount: number): string {
  const query = upiUriFor(payee, reference, amount).slice("upi://pay?".length);
  return `paytmmp://pay?${query}`;
}

/**
 * Both encoders stretch the symbol into whatever box they are handed, so the
 * raster is asked for at twice the on-screen size (a phone camera reading a
 * laptop screen wants each module to survive the downscale as an integer number
 * of device pixels) and the quiet zone is asked for in modules, because that is
 * what the spec counts. A code drawn edge to edge with no white border is the
 * one a UPI app refuses, so `qzone=4` is not decoration.
 */
export function qrImageUrl(uri: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=4&qzone=4&data=${encodeURIComponent(uri)}`;
}

/** A second live encoder for the same payload, so one service rate-limiting us
 *  does not leave a student staring at a broken payment code. QuickChart counts
 *  its margin in modules, which is the same four-module quiet zone the primary
 *  encoder is asked for. */
export function qrImageFallbackUrl(uri: string, size = 240): string {
  return `https://quickchart.io/qr?size=${size}x${size}&margin=4&format=png&text=${encodeURIComponent(uri)}`;
}

/**
 * A payment code is good for one sitting. The reference is only ever matched by
 * hand against a statement, so a QR left open overnight is an invitation to pay
 * against a code nobody is watching. Twenty minutes covers finding the UPI app,
 * typing the PIN and coming back to record the claim.
 */
export const qrLifetimeMs = 20 * 60 * 1000;

export type QrTicket = { reference: string; issuedAt: number };

export function issueQrTicket(reference: string, issuedAt = Date.now()): QrTicket {
  return { reference, issuedAt };
}

export function qrMillisLeft(ticket: QrTicket, now = Date.now()): number {
  return Math.max(0, ticket.issuedAt + qrLifetimeMs - now);
}

export function qrExpired(ticket: QrTicket, now = Date.now()): boolean {
  return qrMillisLeft(ticket, now) === 0;
}

/** mm:ss left on the clock, so the code being scanned is visibly still live. */
export function qrCountdown(ticket: QrTicket, now = Date.now()): string {
  const seconds = Math.floor(qrMillisLeft(ticket, now) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
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
