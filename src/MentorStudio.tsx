import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Banknote,
  CalendarClock,
  Check,
  Copy,
  LoaderCircle,
  Lock,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Store,
  Trash2,
  UserRoundSearch,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import {
  clampMarketPrice,
  closeMarketSale,
  deleteMarketProduct,
  emptyProduct,
  istWhen,
  loadMentorApplications,
  loadMentorAccount,
  loadMySales,
  marketKindLabel,
  marketPriceBand,
  marketReference,
  marketStatusBadge,
  qrImageUrl,
  reviewMentorApplication,
  rupees,
  saveMarketProduct,
  saveMentorProfile,
  sellerUpiUri,
  slugify,
  startsAtInputValue,
  type MarketKind,
  type MarketOrderRow,
  type MarketProduct,
  type MentorAccount,
  type MentorProfile,
} from "./mentorMarket";

const expertiseHint = "Comma separated, e.g. Dynamic Programming, Graphs, System design";

function emptyProfile(userId: string, name: string, email: string): MentorProfile {
  return {
    user_id: userId,
    email,
    display_name: name,
    headline: "",
    bio: "",
    city: "",
    upi_id: "",
    payee_name: name,
    expertise: [],
    status: "pending",
    review_note: "",
  };
}

type Draft = {
  id?: number;
  slug: string;
  kind: MarketKind;
  title: string;
  summary: string;
  details: string;
  includes: string;
  format: string;
  price: number;
  file_url: string;
  unlocks_workspace: boolean;
  starts_at: string;
  room_url: string;
  active: boolean;
};

const draftFrom = (product: MarketProduct): Draft => ({
  id: product.id,
  slug: product.slug,
  kind: product.kind,
  title: product.title,
  summary: product.summary,
  details: product.details,
  includes: product.includes.join("\n"),
  format: product.format,
  price: product.price,
  file_url: product.file_url,
  unlocks_workspace: product.unlocks_workspace,
  starts_at: startsAtInputValue(product.starts_at ?? null),
  room_url: product.room_url,
  active: product.active,
});

const toProduct = (draft: Draft): MarketProduct => ({
  id: draft.id,
  slug: draft.slug,
  kind: draft.kind,
  title: draft.title,
  summary: draft.summary,
  details: draft.details,
  includes: draft.includes.split("\n").map((line) => line.trim()).filter(Boolean),
  format: draft.format,
  price: clampMarketPrice(draft.price),
  file_url: draft.file_url,
  unlocks_workspace: draft.unlocks_workspace,
  starts_at: draft.starts_at || null,
  room_url: draft.room_url,
  active: draft.active,
});

export default function MentorStudio({ userId = null, userName = "", userEmail = "" }: { userId?: string | null; userName?: string; userEmail?: string }) {
  const [account, setAccount] = useState<MentorAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MentorProfile>(() => emptyProfile(userId ?? "", userName, userEmail));
  const [expertiseText, setExpertiseText] = useState("");
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [sales, setSales] = useState<MarketOrderRow[]>([]);
  const [applications, setApplications] = useState<MentorProfile[]>([]);
  const [busy, setBusy] = useState<"save" | "product" | "sale" | "review" | "delete" | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saleNotes, setSaleNotes] = useState<Record<string, string>>({});

  const approved = account?.status === "approved";

  async function refresh() {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const [nextAccount, ownProducts, ownSales] = await Promise.all([
      loadMentorAccount(),
      supabase ? supabase
        .from("mentor_products")
        .select("id, mentor_user_id, slug, kind, title, summary, details, includes, format, price, file_url, unlocks_workspace, starts_at, room_url, active, created_at")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => (error ? [] : ((data ?? []) as MarketProduct[])))
        : Promise.resolve([] as MarketProduct[]),
      loadMySales(),
    ]);
    setAccount(nextAccount);
    if (nextAccount?.profile) {
      setProfile({ ...emptyProfile(userId, userName, userEmail), ...nextAccount.profile });
      setExpertiseText((nextAccount.profile.expertise ?? []).join(", "));
    }
    setProducts(ownProducts);
    setSales(ownSales);
    if (nextAccount?.platform_mentor) setApplications(await loadMentorApplications());
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, [userId]);

  const pendingSales = useMemo(() => sales.filter((row) => row.status === "awaiting"), [sales]);
  const earned = account?.earned ?? sales
    .filter((row) => row.status === "confirmed" || row.status === "delivered")
    .reduce((total, row) => total + Number(row.amount), 0);

  async function submitApplication() {
    if (!userId) { setNotice({ ok: false, text: "Sign in first — a mentor account is tied to your login." }); return; }
    const expertise = expertiseText.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8);
    if (profile.display_name.trim().length < 2) { setNotice({ ok: false, text: "Add the name students should see." }); return; }
    if (!/^[\w.-]{2,64}@[A-Za-z][\w.-]{1,48}$/.test(profile.upi_id.trim())) {
      setNotice({ ok: false, text: "Your UPI id needs the handle form, e.g. 9876543210@paytm." }); return;
    }
    if (profile.payee_name.trim().length < 2) { setNotice({ ok: false, text: "Add the payee name that appears in your UPI link." }); return; }
    setBusy("save");
    const error = await saveMentorProfile({ ...profile, expertise });
    setBusy(null);
    setNotice(error
      ? { ok: false, text: `Could not file your application: ${error}` }
      : { ok: true, text: "Application filed. Aditya reviews it, and until then your storefront stays private." });
    void refresh();
  }

  async function saveDraft() {
    if (!draft || !userId) return;
    if (draft.title.trim().length < 3) { setNotice({ ok: false, text: "Give the product a title students can read." }); return; }
    if (draft.kind === "webinar") {
      if (!draft.starts_at) { setNotice({ ok: false, text: "A webinar needs a start date and time — students buy it for that slot." }); return; }
      if (new Date(draft.starts_at).getTime() <= Date.now()) { setNotice({ ok: false, text: "Pick a webinar time in the future; past sessions leave the shop window." }); return; }
    }
    setBusy("product");
    const error = await saveMarketProduct(toProduct(draft), userId);
    setBusy(null);
    if (error) { setNotice({ ok: false, text: `Not saved: ${error}` }); return; }
    setNotice({ ok: true, text: approved ? "Published on the marketplace." : "Saved. It stays hidden until your mentor account is approved." });
    setDraft(null);
    void refresh();
  }

  async function removeProduct(product: MarketProduct) {
    if (!product.id) return;
    setBusy("delete");
    const error = await deleteMarketProduct(product.id);
    setBusy(null);
    setNotice(error ? { ok: false, text: `Could not remove it: ${error}` } : { ok: true, text: `${product.title} removed.` });
    void refresh();
  }

  async function closeSale(reference: string, status: "confirmed" | "delivered" | "cancelled" | "refunded") {
    setBusy("sale");
    const error = await closeMarketSale(reference, status, saleNotes[reference] ?? "");
    setBusy(null);
    setNotice(error ? { ok: false, text: error } : { ok: true, text: `${reference} marked ${status}.` });
    void refresh();
  }

  async function decide(application: MentorProfile, status: "approved" | "suspended") {
    setBusy("review");
    const error = await reviewMentorApplication(application.user_id, status);
    setBusy(null);
    setNotice(error ? { ok: false, text: error } : { ok: true, text: `${application.display_name} ${status}.` });
    void refresh();
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

  if (!userId) {
    return (
      <section className="mkt-studio">
        <header className="mkt-studio-head">
          <span className="mkt-kicker"><Lock size={14} /> MENTOR STUDIO</span>
          <h1>Sign in to open a mentor account.</h1>
          <p>A storefront belongs to one login, so approval, products and sales all follow your account.</p>
        </header>
      </section>
    );
  }

  return (
    <section className="mkt-studio" aria-label="Mentor studio">
      <header className="mkt-studio-head">
        <span className="mkt-kicker"><Store size={14} /> MENTOR STUDIO</span>
        <h1>Your shop, <em>your products, your prices, your UPI.</em></h1>
        <p>Register first. Once Aditya approves the account you publish services and digital products, set each price yourself, and every buyer pays your own UPI id — your QR, your statement, your money.</p>
        <div className="mkt-studio-stats">
          <span className={`mkt-stat ${account?.status ?? "none"}`}>ACCOUNT: {(account?.status ?? "none").toUpperCase()}</span>
          <span className="mkt-stat">{pendingSales.length} awaiting you</span>
          <span className="mkt-stat">{rupees(earned)} confirmed</span>
          <button type="button" className="mkt-ghost" onClick={() => void refresh()} disabled={loading}>
            {loading ? <LoaderCircle size={14} className="mkt-spin" /> : <RefreshCw size={14} />} Refresh
          </button>
        </div>
      </header>

      {notice && <p className={`mkt-notice ${notice.ok ? "good" : "bad"}`}>{notice.text}</p>}

      {account?.platform_mentor && (
        <section className="mkt-panel" aria-label="Applications to review">
          <h2><UserRoundSearch size={16} /> Applications {applications.length > 0 && <span className="mkt-count">{applications.length}</span>}</h2>
          <p className="mkt-small">Approving does two things: the storefront goes live on <a href="/marketplace">the marketplace</a> and a formal offer letter is queued to the applicant&apos;s email. It posts within five minutes, and CodexSheet pays them nothing — their own UPI id collects everything.</p>
          {applications.length === 0 ? (
            <p className="mkt-empty">Nobody is waiting. New mentor applications land here.</p>
          ) : (
            <ul className="mkt-app-list">
              {applications.map((application) => (
                <li key={application.user_id} className="mkt-app">
                  <div>
                    <strong>{application.display_name}</strong>
                    <span>{application.headline || "no headline"}{application.city ? ` · ${application.city}` : ""}</span>
                    <span className="mkt-mono">{application.upi_id} · {application.payee_name}</span>
                    <span className="mkt-small">{application.email || "no email on the login"} · {application.user_id}</span>
                    <p>{application.bio || "No bio filled in."}</p>
                  </div>
                  <div className="mkt-app-actions">
                    <span className={`mkt-state ${application.status}`}>{application.status}</span>
                    <button type="button" className="mkt-primary" onClick={() => void decide(application, "approved")} disabled={busy === "review"}><BadgeCheck size={14} /> Approve</button>
                    <button type="button" className="mkt-ghost" onClick={() => void decide(application, "suspended")} disabled={busy === "review"}>Suspend</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="mkt-panel" aria-label="Your mentor account">
        <h2>{approved ? <><BadgeCheck size={16} /> Storefront profile</> : <><Lock size={16} /> Step 1 · Register as a mentor</>}</h2>
        {!approved && (
          <p className={`mkt-banner ${account?.status ?? "none"}`}>
            {account?.status === "pending"
              ? "Your application is with Aditya. Products you save now stay private and go live the moment you are approved."
              : account?.status === "suspended"
                ? `Suspended. ${account.profile?.review_note || "Talk to Aditya before selling again."}`
                : "Fill this in and file it. A mentor account is reviewed by hand because buyers pay you directly."}
          </p>
        )}
        <div className="mkt-grid">
          <label>Display name<input value={profile.display_name} maxLength={80} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} placeholder="How students see you" /></label>
          <label>City<input value={profile.city} maxLength={60} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="Bengaluru" /></label>
          <label className="mkt-wide">Headline<input value={profile.headline} maxLength={90} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="SDE-2 at Google · DSA mentor since 2022" /></label>
          <label className="mkt-wide">Expertise<input value={expertiseText} maxLength={200} onChange={(e) => setExpertiseText(e.target.value)} placeholder={expertiseHint} /></label>
          <label className="mkt-wide">About you<textarea rows={4} maxLength={1200} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="What you actually teach, and how a session runs." /></label>
          <label>Your UPI id<input value={profile.upi_id} maxLength={80} onChange={(e) => setProfile({ ...profile, upi_id: e.target.value })} placeholder="9876543210@paytm" /></label>
          <label>Payee name<input value={profile.payee_name} maxLength={50} onChange={(e) => setProfile({ ...profile, payee_name: e.target.value })} placeholder="Name on your UPI" /></label>
        </div>
        <div className="mkt-policy">
          <ShieldCheck size={17} />
          <div>
            <strong>CodexSheet never pays you.</strong>
            <p>There is no payout, no invoice and no share to wait for, because CodexSheet takes no share. Students scan <span className="mkt-mono">{profile.upi_id || "your UPI id"}</span>, the money lands in your own UPI account, and this app only files the reference so you can tick it against your statement.</p>
          </div>
        </div>
        <button type="button" className="mkt-primary" onClick={() => void submitApplication()} disabled={busy === "save"}>
          {busy === "save" ? <LoaderCircle size={16} className="mkt-spin" /> : <Check size={16} />} {approved ? "Save profile" : account?.status === "pending" ? "Update application" : "Apply for a mentor account"}
        </button>
      </section>

      <section className="mkt-panel" aria-label="Your products">
        <h2><Package size={16} /> Step 2 · Your products</h2>
        {products.length === 0 && !draft && <p className="mkt-empty">Nothing on sale yet. Add a service — a 1:1 session, a mock interview — a live webinar at a set date, or a digital product — a workbook, a template pack, a recorded course.</p>}
        <ul className="mkt-product-list">
          {products.map((product) => (
            <li key={product.id ?? product.slug}>
              <div className="mkt-product-main">
                <div className="mkt-product-title">
                  <span className={`mkt-kind ${product.kind}`}>{marketKindLabel[product.kind].toUpperCase()}</span>
                  <strong>{product.title}</strong>
                  <span className="mkt-price">{rupees(product.price)}</span>
                  <span className={`mkt-state ${product.active && approved ? "approved" : "pending"}`}>{product.active ? (approved ? "live" : "private draft") : "paused"}</span>
                </div>
                {product.kind === "webinar" && product.starts_at && (
                  <span className="mkt-when"><CalendarClock size={12} /> {istWhen(product.starts_at)}</span>
                )}
                <p>{product.summary}</p>
                <span className="mkt-small">{product.format} · {product.includes.length} bullets{product.unlocks_workspace ? " · opens the workspace" : ""}</span>
              </div>
              <div className="mkt-product-side">
                <img src={qrImageUrl(sellerUpiUri(profile, product.slug, product.price))} alt={`UPI QR for ${product.title}`} width={92} height={92} loading="lazy" />
                <div>
                  <button type="button" className="mkt-ghost" onClick={() => setDraft(draftFrom(product))}>Edit</button>
                  <button type="button" className="mkt-ghost" onClick={() => void copy(`link-${product.slug}`, sellerUpiUri(profile, product.slug, product.price))}>
                    {copied === `link-${product.slug}` ? <Check size={14} /> : <Copy size={14} />} Copy UPI link
                  </button>
                  <button type="button" className="mkt-ghost danger" onClick={() => void removeProduct(product)} disabled={busy === "delete"}><Trash2 size={14} /> Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {draft ? (
          <div className="mkt-editor">
            <header>
              <h3>{draft.id ? "Edit product" : "New product"}</h3>
              <button type="button" className="mkt-ghost" onClick={() => setDraft(null)}><X size={14} /> Close</button>
            </header>
            <div className="mkt-grid">
              <label>What is it
                <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as MarketKind })}>
                  <option value="service">A service (your time)</option>
                  <option value="digital">A digital product (a file)</option>
                  <option value="webinar">A live webinar (scheduled session)</option>
                </select>
              </label>
              <label>Price in ₹
                <input type="number" min={marketPriceBand.min} max={marketPriceBand.max} step={1} value={draft.price} onChange={(e) => setDraft({ ...draft, price: clampMarketPrice(Number(e.target.value)) })} />
              </label>
              <label className="mkt-wide">Title<input value={draft.title} maxLength={90} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} placeholder="Mock interview + written feedback" /></label>
              <label>How it is billed<input value={draft.format} maxLength={60} onChange={(e) => setDraft({ ...draft, format: e.target.value })} placeholder="one-time · per session · monthly" /></label>
              <label>Address<input value={draft.slug} maxLength={70} onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="mock-interview-feedback" /></label>
              <label className="mkt-wide">One-line summary<input value={draft.summary} maxLength={240} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="45 minutes on a real problem, then a written note on your code." /></label>
              <label className="mkt-wide">What the student gets<textarea rows={4} maxLength={4000} value={draft.details} onChange={(e) => setDraft({ ...draft, details: e.target.value })} placeholder="How it runs, what you need from them before it starts." /></label>
              <label className="mkt-wide">Bullets (one per line)<textarea rows={4} maxLength={900} value={draft.includes} onChange={(e) => setDraft({ ...draft, includes: e.target.value })} placeholder={"Live call, recorded\nFeedback note within 48h"} /></label>
              {draft.kind === "digital" && <label className="mkt-wide">Download link<input value={draft.file_url} maxLength={500} onChange={(e) => setDraft({ ...draft, file_url: e.target.value })} placeholder="https://… the file students get after you confirm" /></label>}
              {draft.kind === "webinar" && (
                <>
                  <label>Starts (your local time)<input type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} /></label>
                  <label>Room link<input value={draft.room_url} maxLength={500} onChange={(e) => setDraft({ ...draft, room_url: e.target.value })} placeholder="https://meet.google.com/…" /></label>
                  <p className="mkt-small mkt-wide">The webinar leaves the shop window by itself once {istWhen(draft.starts_at) || "its time"} has passed. The link is not public: students get it from you as the delivery note when you mark their claim delivered.</p>
                </>
              )}
            </div>
            <div className="mkt-toggles">
              <button type="button" className={draft.active ? "on" : ""} aria-pressed={draft.active} onClick={() => setDraft({ ...draft, active: !draft.active })}>
                <Store size={14} /> {draft.active ? "Listed on the marketplace" : "Kept private"}
              </button>
              <button type="button" className={draft.unlocks_workspace ? "on" : ""} aria-pressed={draft.unlocks_workspace} onClick={() => setDraft({ ...draft, unlocks_workspace: !draft.unlocks_workspace })}>
                <Package size={14} /> {draft.unlocks_workspace ? "Payment also opens the CodexSheet workspace" : "Workspace access not included"}
              </button>
            </div>
            <p className="mkt-price-note">{rupees(draft.price)} · your QR below is built from <span className="mkt-mono">{profile.upi_id || "your UPI id"}</span>. Buyers pay you, not CodexSheet.</p>
            {draft.kind === "webinar" && <p className="mkt-price-note">Sold for {istWhen(draft.starts_at) || "the time you picked"} · buyers see the date on the listing and get the room link from you.</p>}
            <div className="mkt-editor-foot">
              <img src={qrImageUrl(sellerUpiUri(profile, draft.slug || "your-product", draft.price), 336)} alt="Your UPI QR for this product" width={168} height={168} />
              <button type="button" className="mkt-primary" onClick={() => void saveDraft()} disabled={busy === "product"}>
                {busy === "product" ? <LoaderCircle size={16} className="mkt-spin" /> : <Check size={16} />} {busy === "product" ? "Saving…" : draft.id ? "Save changes" : "Publish product"}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="mkt-secondary" onClick={() => setDraft(draftFrom(emptyProduct()))} disabled={!approved}>
            <Plus size={15} /> Add a product
          </button>
        )}
        {!approved && <p className="mkt-small">Publishing unlocks once Aditya approves your account.</p>}
      </section>

      <section className="mkt-panel" aria-label="Your sales">
        <h2><Banknote size={16} /> Step 3 · Sales to confirm</h2>
        {sales.length === 0 ? (
          <p className="mkt-empty">No claims yet. When a student pays your UPI id and records the reference, it lands here for you to tick against your statement.</p>
        ) : (
          <ul className="mkt-sale-list">
            {sales.map((sale) => {
              const badge = marketStatusBadge(sale);
              return (
                <li key={sale.reference} className={sale.status}>
                  <div className="mkt-sale-head">
                    <span className={`mkt-badge ${badge.cls}`}>{badge.label}</span>
                    <strong>{sale.product_title}</strong>
                    <span className="mkt-price">{rupees(Number(sale.amount))}</span>
                    <span className="mkt-mono">{sale.reference}</span>
                  </div>
                  <p>
                    {sale.buyer_name || "a student"}{sale.buyer_contact ? ` · ${sale.buyer_contact}` : ""}
                    {sale.upi_reference ? ` · UTR ${sale.upi_reference}` : ""}
                    {sale.note ? ` · “${sale.note}”` : ""}
                  </p>
                  {sale.status === "awaiting" ? (
                    <div className="mkt-sale-actions">
                      <input placeholder={sale.product_title && sale.status === "awaiting" ? "Paste the room link here so the student can join" : "Delivery note the student sees (link, time, what you sent)"} maxLength={1000} value={saleNotes[sale.reference] ?? ""} onChange={(e) => setSaleNotes({ ...saleNotes, [sale.reference]: e.target.value })} />
                      <button type="button" className="mkt-primary" onClick={() => void closeSale(sale.reference, "confirmed")} disabled={busy === "sale"}>Money received</button>
                      <button type="button" className="mkt-secondary" onClick={() => void closeSale(sale.reference, "delivered")} disabled={busy === "sale"}>Delivered</button>
                      <button type="button" className="mkt-ghost danger" onClick={() => void closeSale(sale.reference, "cancelled")} disabled={busy === "sale"}>Cancel</button>
                    </div>
                  ) : (
                    <div className="mkt-sale-actions">
                      {sale.status === "confirmed" && <button type="button" className="mkt-secondary" onClick={() => void closeSale(sale.reference, "delivered")} disabled={busy === "sale"}>Mark delivered</button>}
                      {(sale.status === "confirmed" || sale.status === "delivered") && <button type="button" className="mkt-ghost danger" onClick={() => void closeSale(sale.reference, "refunded")} disabled={busy === "sale"}>Refunded</button>}
                      {sale.delivery_note && <span className="mkt-small">{sale.delivery_note}</span>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
