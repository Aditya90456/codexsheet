import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check, Copy, GraduationCap, LoaderCircle, Mail, MessageCircle, QrCode, RefreshCw, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import adityaPortrait from "./assets/aditya-bakshi.jpg";
import { supabase, supabaseConfigurationError } from "./lib/supabase";
import {
  curriculum,
  mentorCraft,
  mentorEmail,
  mentorshipPlans,
  refundWindow,
  orderReference,
  workspaceFeatureCount,
  passAmount,
  passBand,
  passFlow,
  payee,
  payeeQrSrc,
  paytmAppUriFor,
  paytmIntentUriFor,
  paymentBadge,
  planLabel,
  queuedOrders,
  recordOrder,
  rupees,
  upiUriFor,
  utrValid,
  whatsapp,
  whatsappHref,
  type MentorshipOrder,
} from "./mentorship";

type Order = { reference: string; plan: string; amount: number; status: string; filed_at: string; paytm_reference?: string };
type Payment = Order & { due: boolean; paid: boolean };

/** Tap-a-figure shortcuts inside the band; the number box takes anything from min to max. */
const amountPresets = [passBand.min, 99, passBand.suggested, 500, passBand.max];

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
  const [amountInput, setAmountInput] = useState(String(passBand.suggested));
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

  // Pay what you can: only a whole figure inside the band is payable, and the
  // tap-to-pay intents carry that figure so the UPI app pre-fills it.
  const amount = passAmount(Number(amountInput));
  const paytmUri = amount === null
    ? "#"
    : platform.android
      ? paytmIntentUriFor(payee, reference, amount)
      : platform.ios
        ? paytmAppUriFor(payee, reference, amount)
        : upiUriFor(payee, reference, amount);
  const anyUpiUri = amount === null ? "#" : upiUriFor(payee, reference, amount);

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
    if (amount === null) { setSaved({ ok: false, message: `Pick a whole amount from ${rupees(passBand.min)} to ${rupees(passBand.max)} - the database refuses anything outside that band.` }); return; }
    if (!buyerName.trim()) { setSaved({ ok: false, message: "Add your name so Aditya knows who to schedule." }); return; }
    if (!buyerContact.trim()) { setSaved({ ok: false, message: "Add an email or phone so the sheet can be opened for you." }); return; }
    if (!utrValid(paytmReference)) {
      setSaved({ ok: false, message: "The Paytm UTR is what proves the payment. Copy the 12-digit transaction reference from the Paytm receipt - it is shown under the amount, not the phone number." });
      return;
    }
    const order: MentorshipOrder = {
      reference,
      plan: plan.id,
      amount,
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
    // Auto-approval means a second claim on a paid account is rejected by the
    // server, and that is not an error worth alarming the student about.
    const alreadyOwns = !outcome.ok && /already has a confirmed/i.test(outcome.reason);
    setSaved(outcome.ok
      ? { ok: true, message: `Recorded as ${reference}. The pass is confirmed the moment the claim lands, so /problems is open now - Aditya matches your UTR against his statement afterwards.` }
      : alreadyOwns
        ? { ok: true, message: `This account already holds a Sheet Pass, so nothing more is due and /problems stays open. One payment buys the sheet for good.` }
        : { ok: false, message: `Saved on this device (${outcome.reason}). Send the reference ${reference} and your Paytm screenshot to Aditya on WhatsApp so it is not lost.` });
    // The record is saved and the Paytm transaction is done, so show at once
    // whether the money is still due or already confirmed.
    if (outcome.ok || alreadyOwns) void refreshWatch(reference);
    else void loadLedger();
  }

  async function checkStatus() {
    const value = lookupReference.trim();
    if (!value) { setLookup({ text: "Type the reference code, for example CS-SHEET-A2B3C4." }); return; }
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
        <span className="mentorship-kicker">PAY WHAT YOU CAN · {rupees(passBand.min)}–{rupees(passBand.max)}</span>
        <h1>One pass. <em>The sheet and everything around it.</em></h1>
        <p>Your Sheet Pass covers all {workspaceFeatureCount} rails — the Deva editor with judged submissions, the animated course, the roadmap board, notes, chat and Guru — and the 250-problem sheet is the part you pay for: any whole figure from {rupees(passBand.min)} to {rupees(passBand.max)}, once, and it stays open. Paytm QR only, no card forms, no gateway.</p>
      </header>

      <div className="mentorship-plans">
        <article className="mentorship-plan selected">
          <span className="mentorship-plan-price">{rupees(amount ?? passBand.suggested)}</span>
          <strong>{plan.title}</strong>
          <span className="mentorship-plan-subtitle">{plan.subtitle}</span>
          <span className="mentorship-plan-cadence">{plan.cadence}</span>
          <div className="mentorship-amounts" role="group" aria-label="Choose what you pay">
            {amountPresets.map((figure) => (
              <button type="button" key={figure} className={amount === figure ? "active" : ""} onClick={() => setAmountInput(String(figure))}>{rupees(figure)}</button>
            ))}
            <label className="mentorship-amount-custom">
              <span>₹</span>
              <input
                type="number"
                inputMode="numeric"
                min={passBand.min}
                max={passBand.max}
                step={1}
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                aria-label={`Your own figure, from ${passBand.min} to ${passBand.max} rupees`}
              />
            </label>
          </div>
          <p className="mentorship-amount-note">
            {amount === null
              ? `Pick a whole figure between ${rupees(passBand.min)} and ${rupees(passBand.max)} - the server refuses a claim outside that band, so nothing else on this page will work yet.`
              : `${rupees(amount)} it is. Type that figure in the Paytm app yourself, because his QR carries only his UPI id. Any amount inside the band opens the same whole sheet, forever.`}
          </p>
          <ul>{plan.includes.map((line) => <li key={line}>{line}</li>)}</ul>
        </article>
      </div>

      <section className="mentorship-flow" aria-label="What happens after you pay">
        {passFlow.map((step, index) => (
          <article key={step.title}>
            <span className="mentorship-flow-index">{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </div>
            {index < passFlow.length - 1 && <ArrowRight size={15} className="mentorship-flow-arrow" aria-hidden="true" />}
          </article>
        ))}
      </section>

      <section className="mentorship-syllabus" aria-label="Your twelve-week plan">
        <header>
          <span className="mentorship-syllabus-kicker"><GraduationCap size={15} /> THE 12-WEEK PLAN</span>
          <h2>Twelve weeks, 250 problems, one pattern at a time</h2>
          <p>The same order the roadmap board uses, with the real problem count for each week on the badge and a timed set at the end. DSA only - no LLD or HLD units in this plan.</p>
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
          <h2><span className="mentorship-step">1</span> Pay {rupees(amount ?? passBand.suggested)} on his Paytm QR</h2>
          <p className="mentorship-pay-note">This is Aditya&apos;s own Paytm code, straight from his app. It carries his UPI id and nothing else, so the amount is not filled in for you: type <strong>{rupees(amount ?? passBand.suggested)}</strong>, put <strong>{reference}</strong> in the note, then keep the UTR and a screenshot of the receipt - step 2 needs both.</p>

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
                No camera handy? Pick <strong>Pay to UPI ID</strong> instead of Scan, send {rupees(amount ?? passBand.suggested)} to{" "}
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
            {amount !== null && (platform.android || platform.ios) ? (
              <>
                <a className="mentorship-primary" href={paytmUri}><Smartphone size={16} /> Open in Paytm</a>
                <a className="mentorship-secondary" href={anyUpiUri}><Wallet size={16} /> Any UPI app</a>
              </>
            ) : amount !== null ? (
              <button type="button" className="mentorship-primary" onClick={() => void copy("uri", anyUpiUri)}>
                {copied === "uri" ? <Check size={16} /> : <Wallet size={16} />} {copied === "uri" ? "UPI link copied" : "Copy the UPI link"}
              </button>
            ) : (
              <span className="mentorship-pay-wait">Pick an amount between {rupees(passBand.min)} and {rupees(passBand.max)} to get the payment link.</span>
            )}
          </div>

          <div className="mentorship-refund">
            <ShieldCheck size={17} />
            <div>
              <strong>{refundWindow.headline}</strong>
              <p>{refundWindow.body.replace("{price}", rupees(amount ?? passBand.suggested))}</p>
            </div>
          </div>

          <div className="mentorship-ref">
            <span>Your reference</span>
            <strong>{reference}</strong>
            <button type="button" className="mentorship-icon-button" onClick={() => void copy("reference", reference)} aria-label="Copy reference code">
              {copied === "reference" ? <Check size={15} /> : <Copy size={15} />}
            </button>
            <a className="mentorship-whatsapp" href={whatsappHref(reference, amount ?? passBand.suggested)} target="_blank" rel="noreferrer">
              <MessageCircle size={15} /> Send the screenshot
            </a>
          </div>
          <p className="mentorship-small">WhatsApp {whatsapp.display} - the reference and your figure are already typed in the message; attach the Paytm receipt screenshot there and Aditya can match it by hand if the UTR lookup stalls.</p>
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
                      ? `Your ${rupees(Number(watched.amount))} Sheet Pass is confirmed, so the whole 250-problem sheet is open on /problems and your chat lane is live on /mentees. Aditya reconciles the UTR against his statement afterwards - keep the receipt.`
                      : paymentBadge(watched).cls === "off"
                        ? "This request was cancelled. Record a new one if you still want the sheet."
                        : `${rupees(Number(watched.amount))} is still showing as due, which means the claim did not reach the server. Refresh, or WhatsApp the reference ${reference} and your receipt to Aditya.`}</p>
                  </>
                ) : (
                  <p className="mentorship-small">{watchNote || "Checking the record against the server…"}</p>
                )}
                <button type="button" className="mentorship-secondary" onClick={() => void refreshWatch(reference)} disabled={watching}>
                  {watching ? <LoaderCircle size={14} className="mentorship-spin" /> : <RefreshCw size={14} />} {watching ? "Checking…" : "Refresh status"}
                </button>
              </div>
              <a href={whatsappHref(reference, amount ?? passBand.suggested)} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp the screenshot to {whatsapp.display}</a>
              <a href={contactHref(reference)}><Mail size={14} /> Email Aditya the reference {reference}</a>
              <button type="button" className="mentorship-secondary" onClick={() => { setReference(orderReference(plan)); setSaved(null); setPaytmReference(""); setWatched(null); setWatchNote(""); }}>Start another request</button>
            </div>
          ) : (
            <div className="mentorship-form">
              <label>Name<input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Your name" maxLength={120} /></label>
              <label>Email or phone<input value={buyerContact} onChange={(event) => setBuyerContact(event.target.value)} placeholder="where the sheet is opened for you" maxLength={160} /></label>
              <label>Paytm UTR / transaction reference (required)<input value={paytmReference} onChange={(event) => setPaytmReference(event.target.value)} placeholder="the 12-digit reference on your Paytm receipt" maxLength={80} /></label>
              <label>What do you want to work on<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="DSA roadmap, system design, mock interviews…" maxLength={1000} /></label>
              <p className="mentorship-summary">Plan: <strong>{plan.title}</strong> · {rupees(amount ?? passBand.suggested)} · ref {reference}</p>
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
              <input value={lookupReference} onChange={(event) => setLookupReference(event.target.value)} placeholder="CS-SHEET-A2B3C4" aria-label="Reference code" />
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
                  <span>{row.reference} · this one is stuck on your device, so it is still due. WhatsApp Aditya the reference with the Paytm receipt screenshot.</span>
                </div>
              </li>
            ))}
          </ul>
          {!userId && ledger === null && pendingOnThisDevice === 0 && (
            <p className="mentorship-small">Sign in and the page tracks your own references, so you can see which payment is still due without retyping the code.</p>
          )}
          <p className="mentorship-small">DUE means the claim never reached the server - it is sitting on this device, or was cancelled. DONE means the pass is confirmed and the sheet is open. Nothing here charges you twice: one payment buys the sheet against one reference, and a second claim on a paid account is refused.</p>
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
      <section className="mentorship-faq" aria-label="How the sheet pass works">
        <article><strong>Pay what you can</strong><p>Any whole figure from {rupees(passBand.min)} to {rupees(passBand.max)} opens the same 250-problem sheet, with no expiry. {rupees(passBand.suggested)} is what he suggests, and {rupees(passBand.min)} is a real answer if that is what you have.</p></article>
        <article><strong>DM anytime</strong><p>Stuck at 2am on a sliding window? Message Aditya once you are confirmed, no extra charge and no per-question fee.</p></article>
        <article><strong>How payment is confirmed</strong><p>Pay your figure on Paytm, then record the reference and UTR here - or WhatsApp the receipt screenshot to {whatsapp.display}. The claim is confirmed as it lands, so /problems stops asking for money straight away, and Aditya reconciles your UTR against his statement afterwards. That is why the UTR and the screenshot are both required.</p></article>
        <article><strong>Refund within {refundWindow.days} days</strong><p>Full money back if the sheet was not worth it, asked inside {refundWindow.days} days of confirmation - refunded on Paytm to the UPI id you paid from.</p></article>
      </section>
    </section>
  );
}
