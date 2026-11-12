import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check, Copy, GraduationCap, LoaderCircle, Mail, MessageCircle, QrCode, RefreshCw, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import adityaPortrait from "./assets/aditya-bakshi.jpg";
import { supabase, supabaseConfigurationError } from "./lib/supabase";
import {
  curriculum,
  mentorCraft,
  mentorEmail,
  mentorProfile,
  refundWindow,
  orderReference,
  payee,
  payeeQrSrc,
  paytmAppUriFor,
  paytmIntentUriFor,
  paymentBadge,
  planLabel,
  queuedOrders,
  recordOrder,
  rupees,
  topmateSessionUrl,
  upiUriFor,
  utrValid,
  whatsapp,
  whatsappHref,
  type MentorshipOrder,
} from "./mentorship";
import { accessPass, productById, railLabel, soldProducts, type ProductId } from "./products";
import { useUnlocks, type Unlocks } from "./entitlements";

type Order = { reference: string; plan: string; amount: number; status: string; filed_at: string; paytm_reference?: string };
type Payment = Order & { due: boolean; paid: boolean };

const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

const contactHref = (reference: string) =>
  `mailto:${mentorEmail}?subject=${encodeURIComponent(`CodexSheet payment ${reference}`)}&body=${encodeURIComponent(`Reference: ${reference}\nPaytm UTR:\nWhat I want to work on:`)}`;

/** What a confirmed claim gives you, written from the row rather than the card. */
function openedLine(plan: string, amount: number): string {
  const bought = productById(plan);
  const rail = bought ? railLabel(bought) : "";
  const what = bought ? `${rail[0].toUpperCase()}${rail.slice(1)} is open now` : "Aditya will open it for you personally";
  return `Your ${rupees(amount)} ${planLabel(plan)} is confirmed, so ${what}. Aditya reconciles the UTR against his statement afterwards - keep the receipt.`;
}

function usePlatform() {
  return useMemo(() => {
    const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
    return { android: /android/i.test(userAgent), ios: /iphone|ipad|ipod/i.test(userAgent) };
  }, []);
}

/** The four steps, with the chosen product and its exact figure named in the first. */
function flowSteps(productName: string, price: number) {
  return [
    { title: "Pick one product", body: `${productName} has one price - ${rupees(price)} - so there is nothing to work out. What the card says is exactly what the server accepts.` },
    { title: "Pay it on his Paytm QR", body: "The code carries his UPI id and nothing else, so type the figure in the Paytm app yourself, or tap the button, which puts it in the UPI intent for you. Put your reference code in the note: that note is what makes the entry findable on his statement." },
    { title: "Record reference and UTR", body: "Fill the small form on this page. Your Paytm UTR is required - it is the only thing that ties your claim to a real statement entry." },
    { title: "It opens at once", body: "The claim is confirmed as it lands, so the badge reads DONE immediately and the rail stops asking for money. Aditya matches your UTR against his statement afterwards, so keep the receipt." },
  ];
}

export default function MentorshipPayments({
  userId = null,
  userName = "",
  userEmail = "",
  initialProduct = "dsa250" as ProductId,
  unlocks: fromApp,
}: {
  userId?: string | null;
  userName?: string;
  userEmail?: string;
  /** Which card is chosen when the page opens - a lock panel sets this. */
  initialProduct?: ProductId;
  /** App reads the ledger for the gates already; the checkout reads its own when handed none. */
  unlocks?: Unlocks;
}) {
  const own = useUnlocks(fromApp ? null : (userId ?? null));
  const entitlements = fromApp ?? own;
  const [productId, setProductId] = useState<ProductId>(initialProduct);
  const product = productById(productId) ?? accessPass;
  const [reference, setReference] = useState(() => orderReference(product));
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
  const owned = entitlements.mentor || entitlements.owned[product.id];

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
    // The rails ask the server for their own lock, so a paid claim has to
    // re-read the entitlement set before the page stops offering the purchase.
    void entitlements.refresh();
  }

  // One product, one price: the figure the card shows is the figure the server
  // accepts, and the tap-to-pay intents carry it so the UPI app pre-fills it.
  const amount = product.price;
  const paytmUri = platform.android
    ? paytmIntentUriFor(payee, reference, amount)
    : platform.ios
      ? paytmAppUriFor(payee, reference, amount)
      : upiUriFor(payee, reference, amount);
  const anyUpiUri = upiUriFor(payee, reference, amount);

  // The QR is his own Paytm code and never changes, so only the note reference is
  // the student's. A code they may already have paid against stays reachable.
  function newReference() {
    setSuperseded(reference);
    setReference(orderReference(product));
  }

  function restoreSuperseded() {
    setReference(superseded);
    setSuperseded("");
  }

  // Each product has its own note code, so changing the card changes the code and
  // clears any claim already written against the old one.
  function chooseProduct(id: ProductId) {
    if (id === productId) return;
    const next = productById(id);
    if (!next) return;
    setProductId(id);
    setReference(orderReference(next));
    setSuperseded("");
    setSaved(null);
    setWatched(null);
    setWatchNote("");
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
    if (!buyerContact.trim()) { setSaved({ ok: false, message: "Add an email or phone so the product can be opened for you." }); return; }
    if (!utrValid(paytmReference)) {
      setSaved({ ok: false, message: "The Paytm UTR is what proves the payment. Copy the 12-digit transaction reference from the Paytm receipt - it is shown under the amount, not the phone number." });
      return;
    }
    const order: MentorshipOrder = {
      reference,
      plan: product.id,
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
    // A repeatable product can be bought again, so only the once-off products
    // can hit the "already owns" rule — and that is not an error.
    const alreadyOwns = !outcome.ok && /already owns the CodexSheet/i.test(outcome.reason);
    setSaved(outcome.ok
      ? { ok: true, message: `Recorded as ${reference}. The ${product.name} is confirmed the moment the claim lands, so ${railLabel(product)} is open now - Aditya matches your UTR against his statement afterwards.` }
      : alreadyOwns
        ? { ok: true, message: `This account already holds ${product.name}, so nothing more is due and ${railLabel(product)} stays open. ${product.repeatable ? "You can buy it again whenever you need it." : "One payment buys it for good."}` }
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
        <span className="mentorship-kicker">{rupees(accessPass.price)} PASS · EVERY PAID RAIL</span>
        <h1>CodexSheet products. <em>One pass, then Aditya&apos;s time.</em></h1>
        <p>{soldProducts.map((item) => `${item.name} ${rupees(item.price)}`).join(" and ")}. The pass opens all three paid rails at once — the 250-problem sheet, the roadmap board and the pattern course with its decks — and a session is priced apart because it buys an hour of a person. The Deva editor, notes, chat, Guru, labs and /radar stay free for everyone, and anyone who paid for a single rail before the pass keeps every rail. Paytm QR only, no card forms, no gateway.</p>
      </header>

      <div className="mentorship-shelf" role="group" aria-label="Choose a product">
        {soldProducts.map((item) => {
          const isOwned = entitlements.mentor || entitlements.owned[item.id];
          return (
            <button
              type="button"
              key={item.id}
              className={`mentorship-shelf-card${item.id === product.id ? " selected" : ""}`}
              onClick={() => chooseProduct(item.id)}
              aria-pressed={item.id === product.id}
            >
              <span className="mentorship-shelf-tag">{item.tag}</span>
              <span className="mentorship-shelf-price">{rupees(item.price)}</span>
              <strong>{item.name}</strong>
              <span className="mentorship-shelf-line">{item.oneLine}</span>
              {isOwned && <span className="mentorship-shelf-owned"><Check size={12} /> Owned</span>}
            </button>
          );
        })}
      </div>

      <div className="mentorship-plans">
        <article className="mentorship-plan selected">
          <span className="mentorship-plan-price">{rupees(amount)}</span>
          <strong>{product.name}</strong>
          <span className="mentorship-plan-subtitle">{product.oneLine}</span>
          <span className="mentorship-plan-cadence">{product.cadence}</span>
          <p className="mentorship-amount-note">
            {owned
              ? `You already hold ${product.name}, so ${railLabel(product)} is open and nothing more is due. Buying it again only adds a receipt - pick another card if you want something you do not have yet.`
              : `${rupees(amount)} is the whole price. Type that figure in the Paytm app yourself, because his QR carries only his UPI id, or use the button below, which puts the figure in the UPI intent.`}
          </p>
          <ul>{product.includes.map((line) => <li key={line}>{line}</li>)}</ul>
        </article>
      </div>

      {/* ── Session: skip the internal payment flow, link to Topmate ── */}
      {product.id === "session" && (
        <div className="mentorship-topmate">
          <div className="mentorship-topmate-copy">
            <span className="mentorship-topmate-kicker">BOOK ON TOPMATE</span>
            <h2>Pick your slot and pay on Topmate</h2>
            <p>Sessions are booked and paid directly on Topmate — no Paytm QR needed. Choose an available hour, complete payment there, and Aditya confirms your Google Meet link.</p>
            <ul className="mentorship-topmate-list">
              {product.includes.map((line) => <li key={line}><Check size={13} /> {line}</li>)}
            </ul>
            <a
              className="mentorship-topmate-cta"
              href={topmateSessionUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a session on Topmate <ArrowRight size={15} />
            </a>
            <p className="mentorship-topmate-note">Opens topmate.io in a new tab · payment is handled by Topmate</p>
          </div>
          <div className="mentorship-topmate-portrait">
            <img src={adityaPortrait} alt="Aditya Bakshi" width={200} height={200} />
            <span>{mentorProfile.name}</span>
            <small>{mentorProfile.role}</small>
          </div>
        </div>
      )}

      {product.id !== "session" && <>
      <section className="mentorship-flow" aria-label="What happens after you pay">
        {flowSteps(product.name, amount).map((step, index) => (
          <article key={step.title}>
            <span className="mentorship-flow-index">{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </div>
            {index < 3 && <ArrowRight size={15} className="mentorship-flow-arrow" aria-hidden="true" />}
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
          <h2><span className="mentorship-step">1</span> Pay {rupees(amount)} on his Paytm QR</h2>
          <p className="mentorship-pay-note">This is Aditya&apos;s own Paytm code, straight from his app. It carries his UPI id and nothing else, so the amount is not filled in for you: type <strong>{rupees(amount)}</strong> for {product.name}, put <strong>{reference}</strong> in the note, then keep the UTR and a screenshot of the receipt - step 2 needs both.</p>

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
                No camera handy? Pick <strong>Pay to UPI ID</strong> instead of Scan, send {rupees(amount)} to{" "}
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
                <a className="mentorship-secondary" href={anyUpiUri}><Wallet size={16} /> Any UPI app</a>
              </>
            ) : (
              <button type="button" className="mentorship-primary" onClick={() => void copy("uri", anyUpiUri)}>
                {copied === "uri" ? <Check size={16} /> : <Wallet size={16} />} {copied === "uri" ? "UPI link copied" : "Copy the UPI link"}
              </button>
            )}
          </div>

          <div className="mentorship-refund">
            <ShieldCheck size={17} />
            <div>
              <strong>{refundWindow.headline}</strong>
              <p>{refundWindow.body.replace("{price}", rupees(amount))}</p>
            </div>
          </div>

          <div className="mentorship-ref">
            <span>Your reference</span>
            <strong>{reference}</strong>
            <button type="button" className="mentorship-icon-button" onClick={() => void copy("reference", reference)} aria-label="Copy reference code">
              {copied === "reference" ? <Check size={15} /> : <Copy size={15} />}
            </button>
            <a className="mentorship-whatsapp" href={whatsappHref(reference, product.name, amount)} target="_blank" rel="noreferrer">
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
                      ? openedLine(watched.plan, Number(watched.amount))
                      : paymentBadge(watched).cls === "off"
                        ? "This request was cancelled. Record a new one if you still want it."
                        : `${rupees(Number(watched.amount))} is still showing as due, which means the claim did not reach the server. Refresh, or WhatsApp the reference ${reference} and your receipt to Aditya.`}</p>
                  </>
                ) : (
                  <p className="mentorship-small">{watchNote || "Checking the record against the server…"}</p>
                )}
                <button type="button" className="mentorship-secondary" onClick={() => void refreshWatch(reference)} disabled={watching}>
                  {watching ? <LoaderCircle size={14} className="mentorship-spin" /> : <RefreshCw size={14} />} {watching ? "Checking…" : "Refresh status"}
                </button>
              </div>
              <a href={whatsappHref(reference, product.name, amount)} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp the screenshot to {whatsapp.display}</a>
              <a href={contactHref(reference)}><Mail size={14} /> Email Aditya the reference {reference}</a>
              <button type="button" className="mentorship-secondary" onClick={() => { setReference(orderReference(product)); setSaved(null); setPaytmReference(""); setWatched(null); setWatchNote(""); }}>Start another request</button>
            </div>
          ) : (
            <div className="mentorship-form">
              <label>Name<input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Your name" maxLength={120} /></label>
              <label>Email or phone<input value={buyerContact} onChange={(event) => setBuyerContact(event.target.value)} placeholder="where the product is opened for you" maxLength={160} /></label>
              <label>Paytm UTR / transaction reference (required)<input value={paytmReference} onChange={(event) => setPaytmReference(event.target.value)} placeholder="the 12-digit reference on your Paytm receipt" maxLength={80} /></label>
              <label>What do you want to work on<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="DSA roadmap, system design, mock interviews…" maxLength={1000} /></label>
              <p className="mentorship-summary">Product: <strong>{product.name}</strong> · {rupees(amount)} · ref {reference}</p>
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
          <p className="mentorship-small">DUE means the claim never reached the server - it is sitting on this device, or was cancelled. DONE means the product is confirmed and its rail is open. Nothing here charges you twice: the sheet, the roadmap and the pattern course are bought once against one reference, so a second claim on a paid account is refused; a session is meant to be bought again, call by call.</p>
        </section>
      )}

      </>}

      <section className="mentorship-mentor" aria-label="Who mentors you">
        <img src={adityaPortrait} alt="Aditya Bakshi, your mentor" width={132} height={132} loading="lazy" />
        <div>
          <span className="mentorship-syllabus-kicker"><GraduationCap size={15} /> YOUR MENTOR</span>
          <h2>{mentorProfile.name}</h2>
          <p className="mentorship-mentor-role">{mentorProfile.role}</p>
          <ul>{mentorCraft.map((line) => <li key={line}>{line}</li>)}</ul>
          <ul className="mentorship-mentor-stats">
            {mentorProfile.stats.map((stat) => <li key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></li>)}
          </ul>
          <p className="mentorship-mentor-stack">{mentorProfile.stack.join(" · ")}</p>
        </div>
      </section>

      <section className="mentorship-faq" aria-label="How the products work">
        <article><strong>One price for the workspace</strong><p>{soldProducts.map((item) => `${item.name} ${rupees(item.price)}`).join(", ")}. The pass opens all three paid rails and the server refuses a claim that does not carry the exact figure on the card, so what you read here is what unlocks.</p></article>
        <article><strong>What stayed free</strong><p>The Deva editor with real judged submissions, Guru, the Algorithm Labs, notes, chat, the calendar, the leaderboard, your certificate and /radar. You never need to pay to open the workspace — only the sheet, the roadmap board and the pattern films have a price, and one {rupees(accessPass.price)} payment covers all three.</p></article>
        <article><strong>If you paid before</strong><p>Anyone with a confirmed order placed before the pass — the ₹100 sheet, the ₹159 roadmap, the ₹200 course or the old pay-what-you-can Sheet Pass — keeps every rail open, free, forever. Nothing you already bought is taken back, and the ledger still reads those receipts.</p></article>
        <article><strong>Sessions are on Topmate</strong><p>1:1 sessions are booked and paid on <a href="https://topmate.io/aditya_bakshi/2260868" target="_blank" rel="noopener noreferrer">topmate.io/aditya_bakshi</a> — slot selection, payment and the Meet link are all handled there.</p></article>
        <article><strong>DM anytime</strong><p>Stuck at 2am on a sliding window? Book a session on Topmate or message Aditya — no per-question charge.</p></article>
        <article><strong>How payment is confirmed</strong><p>Pay the figure on Paytm, then record the reference and UTR here — or WhatsApp the receipt screenshot to {whatsapp.display}. The claim is confirmed as it lands, so the rail stops asking for money straight away, and Aditya reconciles your UTR against his statement afterwards.</p></article>
        <article><strong>Refund within {refundWindow.days} days</strong><p>Full money back if it was not worth it, asked inside {refundWindow.days} days of confirmation — refunded on Paytm to the UPI id you paid from.</p></article>
      </section>
    </section>
  );
}
