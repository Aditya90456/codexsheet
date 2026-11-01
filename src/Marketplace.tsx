import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Copy,
  LoaderCircle,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  UserRoundPlus,
  Video,
  Wallet,
} from "lucide-react";
import {
  isUpcoming,
  istWhen,
  loadCatalog,
  loadMyPurchases,
  lookupMarketOrder,
  marketKindLabel,
  marketReference,
  marketStatusBadge,
  qrImageUrl,
  queuedMarketOrders,
  payeeOf,
  recordMarketOrder,
  rupees,
  sellerUpiUri,
  type CatalogItem,
  type MarketClaim,
  type MarketOrderRow,
} from "./mentorMarket";
import { paytmAppUriFor, paytmIntentUriFor } from "./mentorship";

type Filter = "all" | "service" | "digital" | "webinar";

const platform = () => {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  return { android: /android/i.test(userAgent), ios: /iphone|ipad|ipod/i.test(userAgent) };
};

const shortDay = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }) : "";

/**
 * The marketplace. CodexSheet's own Family Pass lives on /mentorship; this page
 * is everybody else's shop window, and every rupee here goes to the mentor whose
 * product was bought - their UPI id, their QR, their confirmation.
 */
export default function Marketplace({
  userId = null,
  userName = "",
  userEmail = "",
  onOpenStudio = () => {},
  onNavigateHome = () => {},
}: {
  userId?: string | null;
  userName?: string;
  userEmail?: string;
  onOpenStudio?: () => void;
  onNavigateHome?: () => void;
}) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [claim, setClaim] = useState<MarketClaim | null>(null);
  const [reference, setReference] = useState("");
  const [upiReference, setUpiReference] = useState("");
  const [buyerName, setBuyerName] = useState(userName);
  const [buyerContact, setBuyerContact] = useState(userEmail);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ ok: boolean; text: string } | null>(null);
  const [watch, setWatch] = useState<MarketOrderRow | null>(null);
  const [watchNote, setWatchNote] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [lookup, setLookup] = useState<{ text: string; order?: MarketOrderRow } | null>(null);
  const [purchases, setPurchases] = useState<MarketOrderRow[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const device = useMemo(platform, []);

  async function refresh() {
    setLoading(true);
    const [catalog, mine] = await Promise.all([loadCatalog(), userId || userEmail ? loadMyPurchases() : Promise.resolve([])]);
    setItems(catalog);
    setPurchases(mine);
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, [userId]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.kind !== filter) return false;
      if (!needle) return true;
      return [item.title, item.summary, item.mentor_name, item.mentor_headline, ...(item.includes ?? []), ...(item.mentor_expertise ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, filter, query]);

  const sellers = useMemo(() => new Set(items.map((item) => item.mentor_user_id)).size, [items]);

  function openCheckout(item: CatalogItem) {
    const code = marketReference(item);
    setSelected(item);
    setClaim({
      reference: code,
      productId: item.id,
      buyerName: buyerName.trim(),
      buyerContact: buyerContact.trim(),
      buyerEmail: /.+@.+\..+/.test(buyerContact.trim()) ? buyerContact.trim() : userEmail.trim(),
      buyerUserId: userId ?? "",
      upiReference: "",
      note: "",
    });
    setReference(code);
    setUpiReference("");
    setNote("");
    setSaved(null);
    setWatch(null);
    setWatchNote("");
  }

  async function refreshWatch(code: string) {
    const found = await lookupMarketOrder(code);
    setWatch(found);
    setWatchNote(found ? "" : "Saved, but the server has not returned it yet. Refresh in a moment, or email the reference so your mentor can match it by hand.");
  }

  async function submit() {
    if (!claim || !selected) return;
    if (!buyerName.trim()) { setSaved({ ok: false, text: "Add your name so the mentor knows who to deliver to." }); return; }
    if (!buyerContact.trim()) { setSaved({ ok: false, text: "Add an email or phone so the delivery can reach you." }); return; }
    const payload: MarketClaim = {
      ...claim,
      buyerName: buyerName.trim(),
      buyerContact: buyerContact.trim(),
      buyerEmail: /.+@.+\..+/.test(buyerContact.trim()) ? buyerContact.trim() : userEmail.trim(),
      upiReference: upiReference.trim(),
      note: note.trim(),
    };
    setSaving(true);
    setSaved(null);
    const outcome = await recordMarketOrder(payload);
    setSaving(false);
    setSaved(outcome.ok
      ? { ok: true, text: `Recorded as ${payload.reference}. ${selected.mentor_name} ticks it against their own UPI statement, then delivers.` }
      : { ok: false, text: `Saved on this device (${outcome.reason}). Send the reference ${payload.reference} to ${selected.mentor_name} with your receipt so it is not lost.` });
    if (outcome.ok) void refreshWatch(payload.reference);
    else void refresh();
  }

  async function checkStatus() {
    const value = lookupCode.trim();
    if (!value) { setLookup({ text: "Type the reference code, for example CS-DPWO-A2B3C4." }); return; }
    const order = await lookupMarketOrder(value);
    setLookup(order
      ? { text: `${order.reference} · ${rupees(Number(order.amount))} · ${order.seller_name} · ${order.status}`, order }
      : { text: `No claim found for ${value.toUpperCase()}. UPI note codes are case-insensitive.` });
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

  const sellerUri = selected ? sellerUpiUri(selected, reference, selected.price) : "";
  const payUri = selected
    ? device.android
      ? paytmIntentUriFor(payeeOf(selected), reference, selected.price)
      : device.ios
        ? paytmAppUriFor(payeeOf(selected), reference, selected.price)
        : sellerUri
    : "";

  return (
    <section className="mkt" aria-label="Mentor marketplace">
      <header className="mkt-head">
        <span className="mkt-kicker"><Store size={14} /> MENTOR MARKETPLACE · {sellers} MENTORS · {items.length} PRODUCTS</span>
        <h1>Mentors, not one mentor. <em>They set what they teach and what it costs.</em></h1>
        <p>Every listing here belongs to a mentor who applied, was approved, and publishes on their own terms. You pay their UPI id directly - CodexSheet never holds that money - and they confirm your reference against their own statement.</p>
        <div className="mkt-actions">
          <button type="button" className="mkt-primary" onClick={onOpenStudio}>
            <UserRoundPlus size={16} /> Become a mentor
          </button>
          <button type="button" className="mkt-ghost" onClick={onNavigateHome}>
            Back to the workspace <ArrowRight size={15} />
          </button>
        </div>
      </header>

      <div className="mkt-bar">
        <div className="mkt-tabs" role="group" aria-label="Filter listings">
          {([["all", "Everything"], ["service", "Services"], ["digital", "Digital products"], ["webinar", "Webinars"]] as Array<[Filter, string]>).map(([key, label]) => (
            <button type="button" key={key} className={filter === key ? "selected" : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
        <label className="mkt-search">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a topic, a mentor, a product" aria-label="Search the marketplace" />
        </label>
        <button type="button" className="mkt-ghost" onClick={() => void refresh()} disabled={loading}>
          {loading ? <LoaderCircle size={14} className="mkt-spin" /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>

      {loading && items.length === 0 && <p className="mkt-empty">Loading what mentors have on sale…</p>}
      {!loading && shown.length === 0 && (
        <p className="mkt-empty">
          {items.length === 0
            ? "No mentor has published yet. Approved storefronts show up here - the first one is a form away."
            : "Nothing matches that search."}
        </p>
      )}

      <div className="mkt-layout">
        <div className="mkt-grid-list">
          {shown.map((item) => (
            <article key={item.id} className={`mkt-card${selected?.id === item.id ? " selected" : ""}`}>
              <header>
                <span className={`mkt-kind ${item.kind}`}>{marketKindLabel[item.kind].toUpperCase()}</span>
                <span className="mkt-price">{rupees(Number(item.price))}</span>
                <span className="mkt-format">{item.format}</span>
              </header>
              <h2>{item.title}</h2>
              {item.kind === "webinar" && item.starts_at && (
                <p className={`mkt-when${isUpcoming(item.starts_at) ? "" : " past"}`}>
                  <CalendarClock size={13} />
                  {isUpcoming(item.starts_at) ? istWhen(item.starts_at) : "This session has already run."}
                </p>
              )}
              <p className="mkt-summary">{item.summary}</p>
              <div className="mkt-mentor">
                <strong>{item.mentor_name}</strong>
                <span>{item.mentor_headline}</span>
                {item.mentor_city && <span className="mkt-city"><MapPin size={12} /> {item.mentor_city}</span>}
              </div>
              {(item.includes ?? []).length > 0 && (
                <ul className="mkt-includes">{item.includes.map((line) => <li key={line}><Check size={12} /> {line}</li>)}</ul>
              )}
              {item.unlocks_workspace && <p className="mkt-unlock"><Package size={13} /> Also opens the full CodexSheet workspace.</p>}
              <button type="button" className="mkt-primary" onClick={() => openCheckout(item)}>
                <QrCode size={15} /> {item.kind === "webinar" ? "Reserve your seat" : `Pay ${rupees(Number(item.price))} to ${item.mentor_name}`}
              </button>
            </article>
          ))}
        </div>

        <aside className="mkt-checkout" aria-label="Checkout">
          {selected ? (
            <>
              <h2><span className="mkt-step">1</span> Pay {rupees(Number(selected.price))} on {selected.mentor_name}&apos;s UPI</h2>
              {selected.kind === "webinar" && selected.starts_at && (
                <p className="mkt-whenrail"><CalendarClock size={14} /> Live session · {istWhen(selected.starts_at)}</p>
              )}
              <p className="mkt-small">The payee, the amount and your reference are locked inside this code. It is <strong>their</strong> handle, not CodexSheet&apos;s - so the QR is theirs too.</p>
              <div className="mkt-qr">
                <img src={qrImageUrl(sellerUri)} alt={`Pay ${rupees(Number(selected.price))} to ${selected.mentor_name} on UPI, reference ${reference}`} width={220} height={220} loading="lazy" />
                <div>
                  <span className="mkt-mono">{selected.upi_id}</span>
                  <span>{selected.payee_name}</span>
                  <button type="button" className="mkt-ghost" onClick={() => void copy("uri", sellerUri)}>
                    {copied === "uri" ? <Check size={14} /> : <Copy size={14} />} Copy UPI link
                  </button>
                </div>
              </div>
              <div className="mkt-pay-buttons">
                <a className="mkt-primary" href={payUri}><QrCode size={15} /> Open in a UPI app</a>
                <a className="mkt-secondary" href={sellerUri}><Wallet size={15} /> {rupees(Number(selected.price))} · {selected.mentor_name}</a>
              </div>
              <div className="mkt-ref">
                <span>Your reference</span>
                <strong>{reference}</strong>
                <button type="button" className="mkt-ghost" onClick={() => void copy("reference", reference)} aria-label="Copy reference code">
                  {copied === "reference" ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>

              <h2 className="mkt-form-title"><span className="mkt-step">2</span> Tell {selected.mentor_name} you paid</h2>
              {saved?.ok ? (
                <div className="mkt-confirm">
                  <Check size={17} />
                  <strong>Claim {reference} recorded</strong>
                  <p>{saved.text}</p>
                  <div className="mkt-watch">
                    {watch ? (
                      <>
                        <span className={`mkt-badge ${marketStatusBadge(watch).cls}`}>{marketStatusBadge(watch).label}</span>
                        <p className="mkt-small">
                          {watch.status === "awaiting"
                            ? `${rupees(Number(watch.amount))} is due: ${watch.seller_name} has not matched ${watch.reference} against their statement yet.`
                            : watch.status === "delivered"
                              ? `${watch.seller_name} marked it delivered${watch.delivery_note && !/^https?:\S+$/.test(watch.delivery_note.trim()) ? `: ${watch.delivery_note}` : "."}`
                              : watch.status === "cancelled" || watch.status === "refunded"
                                ? `${watch.seller_name} marked this ${watch.status}.`
                                : `Paid and confirmed by ${watch.seller_name}. Delivery is on the way.`}
                        </p>
                        {watch.starts_at && <p className="mkt-small">Scheduled for {istWhen(watch.starts_at)}.</p>}
                        {watch.delivery_note && /^https?:\S+$/.test(watch.delivery_note.trim()) && (
                          <span className="mkt-join">
                            <Video size={14} />
                            <a href={watch.delivery_note.trim()} target="_blank" rel="noopener noreferrer">Join the room</a>
                          </span>
                        )}
                      </>
                    ) : (
                      <p className="mkt-small">{watchNote || "Checking the claim against the server…"}</p>
                    )}
                    <button type="button" className="mkt-secondary" onClick={() => void refreshWatch(reference)} disabled={saving}>
                      <RefreshCw size={14} /> Refresh status
                    </button>
                  </div>
                  <button type="button" className="mkt-ghost" onClick={() => { setSelected(null); setClaim(null); setSaved(null); }}>Buy something else</button>
                </div>
              ) : (
                <div className="mkt-form">
                  <label>Your name<input value={buyerName} maxLength={120} onChange={(event) => setBuyerName(event.target.value)} placeholder="Who is buying" /></label>
                  <label>Email or phone<input value={buyerContact} maxLength={160} onChange={(event) => setBuyerContact(event.target.value)} placeholder="where the delivery goes" /></label>
                  <label>UPI reference / UTR<input value={upiReference} maxLength={80} onChange={(event) => setUpiReference(event.target.value)} placeholder="from your payment receipt, optional" /></label>
                  <label>What you need from this<textarea rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Where you are stuck, what you want covered" /></label>
                  <p className="mkt-small">Buying {selected.title} from {selected.mentor_name} · {rupees(Number(selected.price))} · ref {reference}</p>
                  <button type="button" className="mkt-primary" onClick={() => void submit()} disabled={saving}>
                    {saving ? <LoaderCircle size={16} className="mkt-spin" /> : <Check size={16} />} {saving ? "Recording…" : "Record my payment"}
                  </button>
                  {saved && <p className="mkt-notice bad">{saved.text}</p>}
                  {queuedMarketOrders().length > 0 && <p className="mkt-small">{queuedMarketOrders().length} claim{queuedMarketOrders().length > 1 ? "s" : ""} still queued on this device.</p>}
                </div>
              )}
            </>
          ) : (
            <>
              <h2><Store size={16} /> How this works</h2>
              <ol className="mkt-howto">
                <li><strong>Pick a listing.</strong> The price is what that mentor chose, not a CodexSheet plan.</li>
                <li><strong>Pay their UPI id.</strong> Their QR, their handle, their money. Nothing is charged here.</li>
                <li><strong>Record the reference.</strong> The code travels in the UPI note so they can find your payment.</li>
                <li><strong>They confirm and deliver.</strong> The badge moves DUE → DONE in their own hands.</li>
              </ol>
              <p className="mkt-small">Teach something yourself? Open a mentor account, publish your products and set your prices.</p>
              <button type="button" className="mkt-primary" onClick={onOpenStudio}><UserRoundPlus size={15} /> Become a mentor</button>
              <div className="mkt-lookup">
                <h3>Already paid a mentor?</h3>
                <div>
                  <input value={lookupCode} onChange={(event) => setLookupCode(event.target.value)} placeholder="CS-DPWO-A1B2C3" aria-label="Reference code" />
                  <button type="button" className="mkt-secondary" onClick={() => void checkStatus()}>Check status</button>
                </div>
                {lookup && (
                  <p className="mkt-small mkt-lookup-row">
                    {lookup.order && <span className={`mkt-badge ${marketStatusBadge(lookup.order).cls}`}>{marketStatusBadge(lookup.order).label}</span>}
                    <strong>{lookup.text}</strong>
                  </p>
                )}
              </div>
              <div className="mkt-policy">
                <ShieldCheck size={17} />
                <div>
                  <strong>CodexSheet never pays you, and never holds your money.</strong>
                  <p>Nothing is charged on this page. Every rupee goes from your UPI app straight to the mentor whose listing you bought, and they confirm it against their own statement. CodexSheet keeps the record and takes no cut — so there is no refund to ask us for and no payout to wait on.</p>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      {(purchases.length > 0 || queuedMarketOrders().length > 0) && (
        <section className="mkt-ledger" aria-label="Your marketplace purchases">
          <h2>Your purchases</h2>
          <ul className="mkt-ledger-list">
            {purchases.map((row) => {
              const badge = marketStatusBadge(row);
              return (
                <li key={row.reference}>
                  <span className={`mkt-badge ${badge.cls}`}>{badge.label}</span>
                  <div>
                    <strong>{row.product_title} · {rupees(Number(row.amount))}</strong>
                    <span>{row.reference} · {row.seller_name} · filed {shortDay(row.created_at)}{row.upi_reference ? ` · UTR ${row.upi_reference}` : ""}</span>
                    {row.delivery_note && /^https?:\S+$/.test(row.delivery_note.trim()) ? (
                      <span className="mkt-join">
                        <Video size={14} />
                        <a href={row.delivery_note.trim()} target="_blank" rel="noopener noreferrer">Open what {row.seller_name || "your mentor"} sent</a>
                      </span>
                    ) : (row.delivery_note ? <span className="mkt-delivery">{row.delivery_note}</span> : null)}
                  </div>
                </li>
              );
            })}
            {queuedMarketOrders()
              .filter((claim) => !purchases.some((row) => row.reference === claim.reference))
              .map((claim) => (
                <li className="local" key={claim.reference}>
                  <span className="mkt-badge local">NOT RECORDED</span>
                  <div>
                    <strong>{claim.reference}</strong>
                    <span>This one is stuck on your device, so it is still due. Email the mentor the reference with your receipt.</span>
                  </div>
                </li>
              ))}
          </ul>
          <p className="mkt-small">DUE means the mentor has not matched your payment yet. DONE means they have - and that is the promise this page keeps.</p>
        </section>
      )}
    </section>
  );
}
