import { useEffect, useMemo, useState } from "react";
import { Check, Copy, LoaderCircle, Mail, QrCode, Smartphone, Wallet } from "lucide-react";
import { supabase, supabaseConfigurationError } from "./lib/supabase";
import {
  mentorEmail,
  mentorshipPlans,
  orderReference,
  paytmAppUri,
  paytmIntentUri,
  planById,
  qrImageUrl,
  queuedOrders,
  recordOrder,
  upiUri,
  type MentorshipOrder,
} from "./mentorship";

type Order = { reference: string; plan: string; amount: number; status: string; filed_at: string };

const contactHref = (reference: string) =>
  `mailto:${mentorEmail}?subject=${encodeURIComponent(`CodexSheet mentorship payment ${reference}`)}&body=${encodeURIComponent(`Reference: ${reference}\nPaytm transaction ID:\nWhat I want to work on:`)}`;

function usePlatform() {
  return useMemo(() => {
    const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
    return { android: /android/i.test(userAgent), ios: /iphone|ipad|ipod/i.test(userAgent) };
  }, []);
}

export default function MentorshipPayments({ userId = null, userName = "", userEmail = "", initialPlanId = null }: { userId?: string | null; userName?: string; userEmail?: string; initialPlanId?: string | null }) {
  const chosenPlan = planById(initialPlanId ?? "") ?? mentorshipPlans[1]!;
  const [planId, setPlanId] = useState(chosenPlan.id);
  const plan = planById(planId) ?? chosenPlan;
  const [reference, setReference] = useState(() => orderReference(chosenPlan));
  const [buyerName, setBuyerName] = useState(userName);
  const [buyerContact, setBuyerContact] = useState(userEmail);
  const [paytmReference, setPaytmReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [lookupReference, setLookupReference] = useState("");
  const [lookup, setLookup] = useState<{ text: string; order?: Order } | null>(null);
  const [looking, setLooking] = useState(false);
  const platform = usePlatform();
  const pendingOnThisDevice = queuedOrders().length;

  useEffect(() => {
    setReference(orderReference(plan));
    setSaved(null);
  }, [plan]);

  const paytmUri = platform.android ? paytmIntentUri(plan, reference) : platform.ios ? paytmAppUri(plan, reference) : upiUri(plan, reference);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied((current) => (current === label ? null : current)), 1800);
    } catch {
      setCopied("unavailable");
    }
  }

  async function submit() {
    if (!buyerName.trim()) { setSaved({ ok: false, message: "Add your name so Aditya knows who to schedule." }); return; }
    if (!buyerContact.trim()) { setSaved({ ok: false, message: "Add an email or phone so the session link can reach you." }); return; }
    const order: MentorshipOrder = {
      reference,
      plan: plan.id,
      amount: plan.price,
      buyerName,
      buyerContact,
      buyerEmail: /.+@.+\..+/.test(buyerContact.trim()) ? buyerContact.trim() : userEmail.trim(),
      paytmReference,
      status: "awaiting",
      userId: userId ?? "",
      note,
    };
    setSaving(true);
    setSaved(null);
    const insert = supabase
      ? (row: Record<string, unknown>) => supabase!.from("mentorship_orders").insert(row)
      : async () => ({ error: { message: supabaseConfigurationError ?? "Supabase is not configured." } });
    const outcome = await recordOrder(order, insert as (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>);
    setSaving(false);
    setSaved(outcome.ok
      ? { ok: true, message: `Recorded as ${reference}. Aditya confirms it against the Paytm statement, then sends your session link or roadmap file.` }
      : { ok: false, message: `Saved on this device (${outcome.reason}). Email the reference ${reference} with your Paytm screenshot so it is not lost.` });
  }

  async function checkStatus() {
    const value = lookupReference.trim();
    if (!value) { setLookup({ text: "Type the reference code, for example CS-LT3-A2B3C4." }); return; }
    if (!supabase) { setLookup({ text: supabaseConfigurationError ?? "Supabase is not configured." }); return; }
    setLooking(true);
    const { data, error } = await supabase.rpc("mentorship_order_status", { p_reference: value });
    setLooking(false);
    if (error) { setLookup({ text: `Status lookup failed: ${error.message}` }); return; }
    const rows = (data ?? []) as Order[];
    const order = rows.find((item) => item.reference.toLowerCase() === value.toLowerCase());
    setLookup(order
      ? { text: `${order.reference} · ₹${order.amount} · ${order.status}`, order }
      : { text: `No request found for ${value.toUpperCase()}. Paytm note codes are case-insensitive.` });
  }

  return (
    <section className="mentorship" aria-label="Mentorship payment">
      <header className="mentorship-head">
        <span className="mentorship-kicker">1:1 MENTORSHIP · LONG-TERM MENTORSHIP · DSA ROADMAP</span>
        <h1>Learn with Aditya. <em>Pay once on Paytm.</em></h1>
        <p>One 1:1 session for ₹19, long-term mentorship with a weekly session and DMs anytime, or the 250-pattern DSA roadmap for ₹19. Paytm only, no card forms, no gateway.</p>
      </header>

      <div className="mentorship-plans" role="radiogroup" aria-label="Choose what to buy">
        {mentorshipPlans.map((item) => (
          <button
            type="button"
            key={item.id}
            role="radio"
            aria-checked={item.id === plan.id}
            className={`mentorship-plan${item.id === plan.id ? " selected" : ""}${item.highlight ? " featured" : ""}`}
            onClick={() => setPlanId(item.id)}
          >
            {item.highlight && <span className="mentorship-plan-flag">MOST CHOSEN</span>}
            <span className="mentorship-plan-price">₹{item.price}</span>
            <strong>{item.title}</strong>
            <span className="mentorship-plan-subtitle">{item.subtitle}</span>
            <span className="mentorship-plan-cadence">{item.cadence}</span>
            <ul>{item.includes.map((line) => <li key={line}>{line}</li>)}</ul>
          </button>
        ))}
      </div>

      <div className="mentorship-split">
        <article className="mentorship-pay">
          <h2><span className="mentorship-step">1</span> Pay ₹{plan.price} by scanning the QR</h2>
          <p className="mentorship-pay-note">The amount and the payee are locked inside the code below, and the reference goes in the Paytm note so Aditya can match your payment.</p>

          <div className="mentorship-qr">
            <img src={qrImageUrl(upiUri(plan, reference))} alt={`Pay ₹${plan.price} to Aditya Bakshi on Paytm, reference ${reference}`} width={240} height={240} loading="lazy" />
            <div>
              <span className="mentorship-qr-label"><QrCode size={15} /> Scan with any UPI app</span>
              <p>Paytm, PhonePe, GPay or BHIM all read this code. Desktop students: scan it with your phone.</p>
            </div>
          </div>

          <div className="mentorship-pay-buttons">
            <a className="mentorship-primary" href={paytmUri}><Smartphone size={16} /> Open in Paytm</a>
            <a className="mentorship-secondary" href={upiUri(plan, reference)}><Wallet size={16} /> Any UPI app</a>
          </div>

          <div className="mentorship-ref">
            <span>Your reference</span>
            <strong>{reference}</strong>
            <button type="button" className="mentorship-icon-button" onClick={() => void copy("reference", reference)} aria-label="Copy reference code">
              {copied === "reference" ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </article>

        <article className="mentorship-claim">
          <h2><span className="mentorship-step">2</span> Tell Aditya you paid</h2>
          {saved?.ok ? (
            <div className="mentorship-confirm">
              <Check size={18} />
              <strong>Request {reference} recorded</strong>
              <p>{saved.message}</p>
              <a href={contactHref(reference)}><Mail size={14} /> Email Aditya the reference {reference}</a>
              <button type="button" className="mentorship-secondary" onClick={() => { setReference(orderReference(plan)); setSaved(null); setPaytmReference(""); }}>Start another request</button>
            </div>
          ) : (
            <div className="mentorship-form">
              <label>Name<input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Your name" maxLength={120} /></label>
              <label>Email or phone<input value={buyerContact} onChange={(event) => setBuyerContact(event.target.value)} placeholder="where the session link goes" maxLength={160} /></label>
              <label>Paytm reference / UTR<input value={paytmReference} onChange={(event) => setPaytmReference(event.target.value)} placeholder="from the Paytm receipt, optional" maxLength={80} /></label>
              <label>What do you want to work on<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="DSA roadmap, system design, mock interviews…" maxLength={1000} /></label>
              <p className="mentorship-summary">Plan: <strong>{plan.title} · {plan.subtitle}</strong> · ₹{plan.price} · ref {reference}</p>
              <button type="button" className="mentorship-primary" onClick={() => void submit()} disabled={saving}>
                {saving ? <LoaderCircle size={16} className="mentorship-spin" /> : <Check size={16} />} {saving ? "Recording…" : "Record my payment"}
              </button>
              {saved && <p className="mentorship-warning">{saved.message}</p>}
              {!saved && pendingOnThisDevice > 0 && <p className="mentorship-small">{pendingOnThisDevice} request{pendingOnThisDevice > 1 ? "s" : ""} still queued on this device.</p>}
            </div>
          )}

          <div className="mentorship-lookup">
            <h3>Already paid?</h3>
            <div>
              <input value={lookupReference} onChange={(event) => setLookupReference(event.target.value)} placeholder="CS-ONE-A1B2C3" aria-label="Reference code" />
              <button type="button" className="mentorship-secondary" onClick={() => void checkStatus()} disabled={looking}>{looking ? "Checking…" : "Check status"}</button>
            </div>
            {lookup && <p className="mentorship-small"><strong>{lookup.text}</strong>{lookup.order?.status === "confirmed" ? " · your weekly session is scheduled" : ""}</p>}
          </div>
        </article>
      </div>

      <section className="mentorship-faq" aria-label="How mentorship works">
        <article><strong>Weekly session</strong><p>Long-term plans get one 1:1 call every week, at a time that fits your schedule.</p></article>
        <article><strong>DM anytime</strong><p>Stuck at 2am on a sliding window? Message Aditya between sessions, no extra charge.</p></article>
        <article><strong>How payment is confirmed</strong><p>Pay on Paytm, record the reference here, and Aditya marks it confirmed against his Paytm statement before the first call.</p></article>
      </section>
    </section>
  );
}
