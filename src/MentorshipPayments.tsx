import { useEffect, useMemo, useState } from "react";
import { Check, Copy, LoaderCircle, Mail, QrCode, RefreshCw, Smartphone, Wallet } from "lucide-react";
import { supabase, supabaseConfigurationError } from "./lib/supabase";
import {
  mentorEmail,
  mentorshipPlans,
  orderReference,
  paytmAppUri,
  paytmIntentUri,
  paymentBadge,
  planLabel,
  qrImageUrl,
  queuedOrders,
  recordOrder,
  upiUri,
  type MentorshipOrder,
} from "./mentorship";

type Order = { reference: string; plan: string; amount: number; status: string; filed_at: string; paytm_reference?: string };
type Payment = Order & { due: boolean; paid: boolean };

const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

const contactHref = (reference: string) =>
  `mailto:${mentorEmail}?subject=${encodeURIComponent(`CodexSheet mentorship payment ${reference}`)}&body=${encodeURIComponent(`Reference: ${reference}\nPaytm transaction ID:\nWhat I want to work on:`)}`;

function usePlatform() {
  return useMemo(() => {
    const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
    return { android: /android/i.test(userAgent), ios: /iphone|ipad|ipod/i.test(userAgent) };
  }, []);
}

export default function MentorshipPayments({ userId = null, userName = "", userEmail = "" }: { userId?: string | null; userName?: string; userEmail?: string }) {
  const plan = mentorshipPlans[0]!;
  const [reference, setReference] = useState(() => orderReference(plan));
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
  const [watched, setWatched] = useState<Order | null>(null);
  const [watching, setWatching] = useState(false);
  const [watchNote, setWatchNote] = useState("");
  const [ledger, setLedger] = useState<Payment[] | null>(null);
  const [ledgerBusy, setLedgerBusy] = useState(false);
  const [ledgerNote, setLedgerNote] = useState("");
  const platform = usePlatform();
  const pendingOnThisDevice = queuedOrders().length;
  const deviceOnly = queuedOrders().filter((item) => !(ledger ?? []).some((row) => row.reference === item.reference));
  const dueRows = (ledger ?? []).filter((row) => row.due);
  const dueSum = dueRows.reduce((total, row) => total + Number(row.amount), 0);

  async function loadLedger() {
    if (!supabase || !userId) { setLedger(null); setLedgerNote(""); return; }
    setLedgerBusy(true);
    const { data, error } = await supabase.rpc("my_mentorship_payments");
    setLedgerBusy(false);
    if (error) { setLedger(null); setLedgerNote(`Could not read your payment status: ${error.message}`); return; }
    setLedgerNote("");
    setLedger((data ?? []) as Payment[]);
  }

  // The ledger is keyed on the signed-in Clerk id (or the verified email of an
  // order paid without signing in), so it only exists once there is an id.
  useEffect(() => { void loadLedger(); }, [userId]);

  async function refreshWatch(code: string) {
    if (!supabase) { setWatchNote(supabaseConfigurationError ?? "Supabase is not configured."); return; }
    setWatching(true);
    const { data, error } = await supabase.rpc("mentorship_order_status", { p_reference: code });
    setWatching(false);
    if (error) { setWatchNote(`Status check failed: ${error.message}`); return; }
    const rows = (data ?? []) as Order[];
    const found = rows.find((item) => item.reference.toLowerCase() === code.toLowerCase());
    setWatched(found ?? null);
    setWatchNote(found
      ? ""
      : "Saved, but the server has not returned it yet. Refresh in a moment, or email the reference so Aditya can match it by hand.");
    void loadLedger();
  }

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
    setWatched(null);
    setWatchNote("");
    const insert = supabase
      ? (row: Record<string, unknown>) => supabase!.from("mentorship_orders").insert(row)
      : async () => ({ error: { message: supabaseConfigurationError ?? "Supabase is not configured." } });
    const outcome = await recordOrder(order, insert as (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>);
    setSaving(false);
    setSaved(outcome.ok
      ? { ok: true, message: `Recorded as ${reference}. Aditya confirms it against the Paytm statement, then the whole workspace unlocks.` }
      : { ok: false, message: `Saved on this device (${outcome.reason}). Email the reference ${reference} with your Paytm screenshot so it is not lost.` });
    // The record is saved and the Paytm transaction is done, so show at once
    // whether the money is still due or already confirmed.
    if (outcome.ok) void refreshWatch(reference);
    else void loadLedger();
  }

  async function checkStatus() {
    const value = lookupReference.trim();
    if (!value) { setLookup({ text: "Type the reference code, for example CS-FAM-A2B3C4." }); return; }
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
        <span className="mentorship-kicker">ALL 19 FEATURES · ONE PASS · ₹10</span>
        <h1>Everything on CodexSheet. <em>₹10, once, on Paytm.</em></h1>
        <p>₹{plan.price} opens the whole workspace — all 250 patterns and the problem library, the Deva editor with judged submissions, the animated course, the AI tutor, the roadmap board, notes, chat, calls, and a 1:1 session with Aditya that you book yourself. Paytm only, no card forms, no gateway.</p>
      </header>

      <div className="mentorship-plans">
        <article className="mentorship-plan selected">
          <span className="mentorship-plan-price">₹{plan.price}</span>
          <strong>{plan.title}</strong>
          <span className="mentorship-plan-subtitle">{plan.subtitle}</span>
          <span className="mentorship-plan-cadence">{plan.cadence}</span>
          <ul>{plan.includes.map((line) => <li key={line}>{line}</li>)}</ul>
        </article>
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
              <div className="mentorship-due">
                {watched ? (
                  <>
                    <span className={`mentorship-badge ${paymentBadge(watched).cls}`}>{paymentBadge(watched).label}</span>
                    <p>{paymentBadge(watched).cls === "done"
                      ? `Aditya confirmed ₹${Number(watched.amount)} for ${planLabel(watched.plan)}. ${watched.status === "delivered" ? "The session was delivered." : "Your weekly session and chat lane are live on /mentees."}`
                      : paymentBadge(watched).cls === "off"
                        ? "This request was cancelled. Record a new one if you still want the session."
                        : `₹${Number(watched.amount)} is still due: Aditya has not ticked ${reference} against his Paytm statement yet. Keep the transaction ID until he does.`}</p>
                  </>
                ) : (
                  <p className="mentorship-small">{watchNote || "Checking the record against the server…"}</p>
                )}
                <button type="button" className="mentorship-secondary" onClick={() => void refreshWatch(reference)} disabled={watching}>
                  {watching ? <LoaderCircle size={14} className="mentorship-spin" /> : <RefreshCw size={14} />} {watching ? "Checking…" : "Refresh status"}
                </button>
              </div>
              <a href={contactHref(reference)}><Mail size={14} /> Email Aditya the reference {reference}</a>
              <button type="button" className="mentorship-secondary" onClick={() => { setReference(orderReference(plan)); setSaved(null); setPaytmReference(""); setWatched(null); setWatchNote(""); }}>Start another request</button>
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
            {lookup && (
              <p className="mentorship-small mentorship-lookup-row">
                {lookup.order && <span className={`mentorship-badge ${paymentBadge(lookup.order).cls}`}>{paymentBadge(lookup.order).label}</span>}
                <strong>{lookup.text}</strong>
              </p>
            )}
          </div>
        </article>
      </div>

      {(ledger !== null || deviceOnly.length > 0) && (
        <section className="mentorship-ledger" aria-label="Your payments, due or done">
          <header className="mentorship-ledger-head">
            <h2>Your payments <span className={`mentorship-ledger-count${dueRows.length ? " due" : ""}`}>{ledger === null ? "not signed in" : dueRows.length ? `${dueRows.length} due · ₹${dueSum}` : "nothing due"}</span></h2>
            {userId && (
              <button type="button" className="mentorship-secondary" onClick={() => void loadLedger()} disabled={ledgerBusy}>
                {ledgerBusy ? <LoaderCircle size={14} className="mentorship-spin" /> : <RefreshCw size={14} />} {ledgerBusy ? "Checking…" : "Refresh"}
              </button>
            )}
          </header>
          {ledgerNote && <p className="mentorship-warning">{ledgerNote}</p>}
          <ul className="mentorship-ledger-list">
            {(ledger ?? []).map((row) => {
              const state = paymentBadge(row);
              return (
                <li key={row.reference}>
                  <span className={`mentorship-badge ${state.cls}`}>{state.label}</span>
                  <div>
                    <strong>{planLabel(row.plan)} · ₹{Number(row.amount)}</strong>
                    <span>{row.reference} · recorded {shortDay(row.filed_at)}{row.paytm_reference ? ` · UTR ${row.paytm_reference}` : ""}</span>
                  </div>
                </li>
              );
            })}
            {deviceOnly.map((row) => (
              <li className="local" key={row.reference}>
                <span className="mentorship-badge local">NOT RECORDED</span>
                <div>
                  <strong>{planLabel(row.plan)} · ₹{row.amount}</strong>
                  <span>{row.reference} · this one is stuck on your device, so it is still due. Email Aditya the reference with the Paytm receipt.</span>
                </div>
              </li>
            ))}
          </ul>
          {!userId && ledger === null && pendingOnThisDevice === 0 && (
            <p className="mentorship-small">Sign in and the page tracks your own references, so you can see which payment is still due without retyping the code.</p>
          )}
          <p className="mentorship-small">DUE means Aditya has not matched your Paytm transaction against his statement yet. DONE means he has, and all 19 features unlock with it. Nothing here charges you twice: you pay once by scanning the QR.</p>
        </section>
      )}

      <section className="mentorship-faq" aria-label="How mentorship works">
        <article><strong>Weekly session</strong><p>Every pass covers a 1:1 call, and you pick the hour yourself from the times Aditya publishes.</p></article>
        <article><strong>DM anytime</strong><p>Stuck at 2am on a sliding window? Message Aditya between sessions, no extra charge.</p></article>
        <article><strong>How payment is confirmed</strong><p>Pay on Paytm, record the reference here, and Aditya marks it confirmed against his Paytm statement before the first call.</p></article>
      </section>
    </section>
  );
}
