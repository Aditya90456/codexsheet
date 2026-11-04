import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check, Copy, GraduationCap, LoaderCircle, Mail, QrCode, RefreshCw, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import adityaPortrait from "./assets/aditya-bakshi.jpg";
import { supabase, supabaseConfigurationError } from "./lib/supabase";
import {
  curriculum,
  mentorCraft,
  mentorEmail,
  mentorshipPlans,
  refundWindow,
  orderReference,
  freeFeatureCount,
  sessionFlow,
  payee,
  payeeQrSrc,
  sessionPrice,
  paytmAppUri,
  paytmIntentUri,
  paymentBadge,
  planLabel,
  queuedOrders,
  recordOrder,
  rupees,
  utrValid,
  upiUri,
  type MentorshipOrder,
} from "./mentorship";

type Order = { reference: string; plan: string; amount: number; status: string; filed_at: string; paytm_reference?: string };
type Payment = Order & { due: boolean; paid: boolean };

const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

const contactHref = (reference: string) =>
  `mailto:${mentorEmail}?subject=${encodeURIComponent(`CodexSheet mentorship payment ${reference}`)}&body=${encodeURIComponent(`Reference: ${reference}\nPaytm UTR:\nWhat I want to work on:`)}`;

function usePlatform() {
  return useMemo(() => {
    const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
    return { android: /android/i.test(userAgent), ios: /iphone|ipad|ipod/i.test(userAgent) };
  }, []);
}

export default function MentorshipPayments({ userId = null, userName = "", userEmail = "" }: { userId?: string | null; userName?: string; userEmail?: string }) {
  const plan = mentorshipPlans[0]!;
  const [reference, setReference] = useState(() => orderReference(plan));
  const [superseded, setSuperseded] = useState("");
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

  // The QR is his own Paytm code and never changes, so only the note reference is
  // the student's. A code they may already have paid against stays reachable.
  function newReference() {
    setSuperseded(reference);
    setReference(orderReference(plan));
  }

  function restoreSuperseded() {
    setReference(superseded);
    setSuperseded("");
  }

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
    if (!utrValid(paytmReference)) {
      setSaved({ ok: false, message: "The Paytm UTR is what proves the payment. Copy the 12-digit transaction reference from the Paytm receipt - it is shown under the amount, not the phone number." });
      return;
    }
    const order: MentorshipOrder = {
      reference,
      plan: plan.id,
      amount: sessionPrice,
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
      ? { ok: true, message: `Recorded as ${reference}. Aditya searches his Paytm statement for your UTR, then your session slot opens.` }
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
      ? { text: `${order.reference} · ${rupees(Number(order.amount))} · ${order.status}`, order }
      : { text: `No request found for ${value.toUpperCase()}. Paytm note codes are case-insensitive.` });
  }

  return (
    <section className="mentorship" aria-label="Mentorship payment">
      <header className="mentorship-head">
        <span className="mentorship-kicker">ONE 60-MINUTE SESSION · {rupees(plan.price)}</span>
        <h1>The workspace is free. <em>His hour costs {rupees(plan.price)}.</em></h1>
        <p>All {freeFeatureCount} features — the 250-problem sheet, the Deva editor with judged submissions, the animated course, the roadmap board, notes, chat and Guru — open the moment you sign in. No card, no code. This page is the one thing money still buys: sixty minutes of Aditya&apos;s own time on Google Meet. Paytm QR only, no card forms, no gateway.</p>
      </header>

      <div className="mentorship-plans">
        <article className="mentorship-plan selected">
          <span className="mentorship-plan-price">{rupees(plan.price)}</span>
          <strong>{plan.title}</strong>
          <span className="mentorship-plan-subtitle">{plan.subtitle}</span>
          <span className="mentorship-plan-cadence">{plan.cadence}</span>
          <p className="mentorship-amount-note">
            {rupees(plan.price)} is the price, not a starting point. Type it into the Paytm app yourself -
            the server refuses a claim for any other amount, so there is nothing to negotiate and nothing to underpay.
          </p>
          <ul>{plan.includes.map((line) => <li key={line}>{line}</li>)}</ul>
        </article>
      </div>

      <section className="mentorship-flow" aria-label="What happens after you pay">
        {sessionFlow.map((step, index) => (
          <article key={step.title}>
            <span className="mentorship-flow-index">{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </div>
            {index < sessionFlow.length - 1 && <ArrowRight size={15} className="mentorship-flow-arrow" aria-hidden="true" />}
          </article>
        ))}
      </section>

      <section className="mentorship-syllabus" aria-label="Your twelve-week plan">
        <header>
          <span className="mentorship-syllabus-kicker"><GraduationCap size={15} /> THE 12-WEEK PLAN</span>
          <h2>Twelve weeks, 250 problems, one pattern at a time</h2>
          <p>The same order the roadmap board uses, at about 21 problems a week with revision and a timed set at the end. DSA only - no LLD or HLD units in this plan.</p>
        </header>
        <div className="mentorship-weeks">
          {curriculum.map((week) => (
            <article className="mentorship-week" key={week.label}>
              <span className="mentorship-week-label">{week.label}<i>{week.pace}</i></span>
              <h3>{week.title}</h3>
              <ul className="mentorship-week-focus">{week.focus.map((pattern) => <li key={pattern}><BookOpen size={12} /> {pattern}</li>)}</ul>
              <p>{week.outcome}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mentorship-split">
        <article className="mentorship-pay">
          <h2><span className="mentorship-step">1</span> Pay {rupees(plan.price)} on his Paytm QR</h2>
          <p className="mentorship-pay-note">This is Aditya&apos;s own Paytm code, straight from his app. It carries his UPI id and nothing else, so the amount is not filled in for you: type <strong>{rupees(plan.price)}</strong>, put <strong>{reference}</strong> in the note, then keep the UTR from the receipt - step 2 needs it.</p>

          <div className="mentorship-qr">
            <div className="payqr">
              <img
                className="payqr-img"
                src={payeeQrSrc}
                width={248}
                height={256}
                loading="lazy"
                alt={`Aditya Bakshi's Paytm QR, UPI id ${payee.upiId}`}
              />
              <p className="payqr-meter"><QrCode size={12} /><span>His Paytm QR · payee {payee.upiId}</span></p>
            </div>
            <div>
              <span className="mentorship-qr-label"><Smartphone size={15} /> Scan with any UPI app</span>
              <p>Paytm, PhonePe, GPay or BHIM all read this code. Desktop students: scan it with your phone.</p>
              <p className="mentorship-manual">
                No camera handy? Pick <strong>Pay to UPI ID</strong> instead of Scan, send exactly {rupees(plan.price)} to{" "}
                <button type="button" className="mentorship-handle" onClick={() => void copy("handle", payee.upiId)}>
                  {copied === "handle" ? <Check size={13} /> : <Copy size={13} />} {payee.upiId}
                </button>{" "}
                and type <strong>{reference}</strong> as the note.
              </p>
              <p className="mentorship-qr-restore">
                <button type="button" onClick={newReference}><RefreshCw size={13} /> New reference code</button>
                {superseded && (
                  <> Already paid against <strong>{superseded}</strong>?{" "}<button type="button" onClick={restoreSuperseded}>Use that reference again</button></>
                )}
              </p>
            </div>
          </div>

          <div className="mentorship-pay-buttons">
            {platform.android || platform.ios ? (
              <>
                <a className="mentorship-primary" href={paytmUri}><Smartphone size={16} /> Open in Paytm</a>
                <a className="mentorship-secondary" href={upiUri(plan, reference)}><Wallet size={16} /> Any UPI app</a>
              </>
            ) : (
              <button type="button" className="mentorship-primary" onClick={() => void copy("uri", upiUri(plan, reference))}>
                {copied === "uri" ? <Check size={16} /> : <Wallet size={16} />} {copied === "uri" ? "UPI link copied" : "Copy the UPI link"}
              </button>
            )}
          </div>

          <div className="mentorship-refund">
            <ShieldCheck size={17} />
            <div>
              <strong>{refundWindow.headline}</strong>
              <p>{refundWindow.body.replace("{price}", rupees(plan.price))}</p>
            </div>
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
                      ? `Aditya confirmed ${rupees(Number(watched.amount))} for ${planLabel(watched.plan)}. ${watched.status === "delivered" ? "The session was delivered." : "Your weekly session and chat lane are live on /mentees."}`
                      : paymentBadge(watched).cls === "off"
                        ? "This request was cancelled. Record a new one if you still want the session."
                        : `${rupees(Number(watched.amount))} is still due: Aditya has not ticked ${reference} against his Paytm statement yet. Keep the UTR until he does.`}</p>
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
              <label>Paytm UTR / transaction reference (required)<input value={paytmReference} onChange={(event) => setPaytmReference(event.target.value)} placeholder="the 12-digit reference on your Paytm receipt" maxLength={80} /></label>
              <label>What do you want to work on<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="DSA roadmap, system design, mock interviews…" maxLength={1000} /></label>
              <p className="mentorship-summary">Plan: <strong>{plan.title} · {plan.subtitle}</strong> · {rupees(plan.price)} · ref {reference}</p>
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
            <h2>Your payments <span className={`mentorship-ledger-count${dueRows.length ? " due" : ""}`}>{ledger === null ? "not signed in" : dueRows.length ? `${dueRows.length} due · ${rupees(dueSum)}` : "nothing due"}</span></h2>
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
                    <strong>{planLabel(row.plan)} · {rupees(Number(row.amount))}</strong>
                    <span>{row.reference} · recorded {shortDay(row.filed_at)}{row.paytm_reference ? ` · UTR ${row.paytm_reference}` : ""}</span>
                  </div>
                </li>
              );
            })}
            {deviceOnly.map((row) => (
              <li className="local" key={row.reference}>
                <span className="mentorship-badge local">NOT RECORDED</span>
                <div>
                  <strong>{planLabel(row.plan)} · {rupees(Number(row.amount))}</strong>
                  <span>{row.reference} · this one is stuck on your device, so it is still due. Email Aditya the reference with the Paytm receipt.</span>
                </div>
              </li>
            ))}
          </ul>
          {!userId && ledger === null && pendingOnThisDevice === 0 && (
            <p className="mentorship-small">Sign in and the page tracks your own references, so you can see which payment is still due without retyping the code.</p>
          )}
          <p className="mentorship-small">DUE means Aditya has not found your UTR in his Paytm statement yet. DONE means he has, and your session is on the calendar. Nothing here charges you twice: one {rupees(plan.price)} payment buys one session against one reference, and a second claim on a paid account is rejected.</p>
        </section>
      )}

      <section className="mentorship-mentor" aria-label="Who mentors you">
        <img src={adityaPortrait} alt="Aditya Bakshi, your mentor" width={132} height={132} loading="lazy" />
        <div>
          <span className="mentorship-syllabus-kicker"><GraduationCap size={15} /> YOUR MENTOR</span>
          <h2>Aditya Bakshi</h2>
          <ul>{mentorCraft.map((line) => <li key={line}>{line}</li>)}</ul>
        </div>
      </section>
      <section className="mentorship-faq" aria-label="How mentorship works">
        <article><strong>One session at a time</strong><p>{rupees(plan.price)} buys sixty minutes with Aditya, and you pick the hour yourself from the times he publishes.</p></article>
        <article><strong>DM anytime</strong><p>Stuck at 2am on a sliding window? Message Aditya between sessions, no extra charge.</p></article>
        <article><strong>How payment is confirmed</strong><p>Pay the ₹199 on Paytm, record your reference and UTR here, and Aditya marks it confirmed only when that UTR appears in his statement - before the call.</p></article>
        <article><strong>Refund within {refundWindow.days} days</strong><p>Full money back if the session was not worth it, asked inside {refundWindow.days} days of confirmation - refunded on Paytm to the UPI id you paid from.</p></article>
      </section>
    </section>
  );
}
