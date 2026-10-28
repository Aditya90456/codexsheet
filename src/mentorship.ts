// Mentorship plans and the Paytm-only payment contract.
// Money moves through Aditya's personal Paytm UPI handle, so the app never
// touches a gateway: it locks the amount, builds the UPI intent, and records
// the claim for him to confirm against his Paytm statement.
export const payee = {
  phone: "8335873311",
  upiId: "8335873311@paytm",
  displayName: "Aditya Bakshi CodexSheet",
} as const;

export const mentorEmail = "adityabakshi1011@gmail.com";

export type MentorshipPlanId = "one-to-one" | "ltm-3-months" | "ltm-6-months" | "roadmap";

export type MentorshipPlan = {
  id: MentorshipPlanId;
  tag: string;
  title: string;
  subtitle: string;
  price: number;
  cadence: string;
  includes: string[];
  highlight?: boolean;
};

export const mentorshipPlans: MentorshipPlan[] = [
  {
    id: "one-to-one",
    tag: "ONE",
    title: "1:1 Mentorship",
    subtitle: "One focused call, booked after you pay",
    price: 19,
    cadence: "single session",
    includes: ["30–45 min 1:1 video call", "Your DSA roadblock, solved live", "Follow-up DM after the call"],
  },
  {
    id: "ltm-3-months",
    tag: "LT3",
    title: "Long-Term Mentorship",
    subtitle: "Weekly sessions for 3 months",
    price: 100,
    cadence: "weekly session · 3 months",
    includes: ["Weekly 1:1 session", "DM Aditya anytime", "Pattern roadmap and review of your solutions"],
    highlight: true,
  },
  {
    id: "ltm-6-months",
    tag: "LT6",
    title: "Long-Term Mentorship",
    subtitle: "Weekly sessions for 6 months",
    price: 499,
    cadence: "weekly session · 6 months",
    includes: ["Weekly 1:1 session", "DM Aditya anytime", "Interview prep and mock rounds included"],
  },
  {
    id: "roadmap",
    tag: "RMAP",
    title: "250-Pattern DSA Roadmap",
    subtitle: "Digital download, delivered by email",
    price: 19,
    cadence: "one-time purchase",
    includes: ["Every pattern with its problems in order", "Beginner to interview-ready sequence", "Emailed within 24 hours of payment"],
  },
];

export function planById(id: string): MentorshipPlan | undefined {
  return mentorshipPlans.find((plan) => plan.id === id);
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
export function upiUri(plan: MentorshipPlan, reference: string): string {
  // UPI apps decode query values percent-style only, so `+` must never appear
  // for a space and the `@` in a VPA stays literal.
  const encode = (value: string) => encodeURIComponent(value).replace(/%40/g, "@");
  const params = [
    `pa=${encode(payee.upiId)}`,
    `pn=${encode(payee.displayName)}`,
    `am=${plan.price.toFixed(2)}`,
    "cu=INR",
    `tn=${encode(reference)}`,
    `tr=${encode(reference)}`,
  ].join("&");
  return `upi://pay?${params}`;
}

/** Android intent URL that opens the Paytm app directly instead of the picker. */
export function paytmIntentUri(plan: MentorshipPlan, reference: string): string {
  const query = upiUri(plan, reference).slice("upi://pay?".length);
  return `intent://pay?${query}#Intent;scheme=upi;package=net.one97.paytm;end`;
}

/** iOS Paytm scheme, for students on an iPhone where `upi://` has no handler. */
export function paytmAppUri(plan: MentorshipPlan, reference: string): string {
  const query = upiUri(plan, reference).slice("upi://pay?".length);
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
