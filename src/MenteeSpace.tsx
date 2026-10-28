import { useCallback, useEffect, useState } from "react";
import { Check, LoaderCircle, Mail, RotateCcw, Users } from "lucide-react";
import { supabase, supabaseConfigurationError } from "./lib/supabase";
import { mentorEmail, planById } from "./mentorship";

type Mentee = {
  id: number;
  reference: string;
  user_id: string;
  plan: string;
  status: string;
  student_name: string;
  contact: string;
  email: string;
  weekly_slot: string;
  notes: string;
  started_at: string;
  ends_at: string | null;
};

type Claim = {
  reference: string;
  plan: string;
  amount: number;
  student: string;
  contact: string;
  paytm_reference: string;
  note: string;
  user_id: string;
  placed_at: string;
};

type Draft = { status: string; weekly_slot: string; user_id: string };

const STATUSES = ["active", "paused", "completed", "cancelled"];

const planLabel = (plan: string) => planById(plan)?.title ?? plan;

const shortDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "open ended";

const isEmail = (value: string) => /.+@.+\..+/.test(value);

export default function MenteeSpace({ userId = null, userEmail = "" }: { userId?: string | null; userEmail?: string }) {
  const [booting, setBooting] = useState(true);
  const [isMentor, setIsMentor] = useState(false);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});

  const load = useCallback(async () => {
    if (!supabase) {
      setError(supabaseConfigurationError ?? "Supabase is not configured.");
      setBooting(false);
      return;
    }
    const gate = await supabase.rpc("is_workspace_mentor");
    const mentor = gate.data === true;
    const rows = await supabase.from("mentees").select("*").order("created_at", { ascending: false });
    let pendingRows: Claim[] = [];
    let pendingError: string | null = null;
    if (mentor) {
      const pending = await supabase.rpc("mentor_pending_orders");
      pendingRows = (pending.data as Claim[]) ?? [];
      pendingError = pending.error?.message ?? null;
    }
    if (rows.error) setError(rows.error.message);
    if (pendingError) setError(pendingError);
    setIsMentor(mentor);
    setMentees((rows.data as Mentee[]) ?? []);
    setClaims(pendingRows);
    setBooting(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmClaim(claim: Claim) {
    if (!supabase) return;
    setBusy(claim.reference);
    setError(null);
    const result = await supabase.rpc("mentor_confirm_mentee", {
      p_reference: claim.reference,
      p_weekly_slot: slots[claim.reference] ?? "",
      p_notes: "",
    });
    if (result.error) setError(result.error.message);
    await load();
    setBusy(null);
  }

  async function saveMentee(mentee: Mentee) {
    if (!supabase) return;
    const draft = drafts[mentee.id];
    if (!draft) return;
    setBusy(String(mentee.id));
    setError(null);
    const result = await supabase
      .from("mentees")
      .update({ status: draft.status, weekly_slot: draft.weekly_slot, user_id: draft.user_id, updated_at: new Date().toISOString() })
      .eq("id", mentee.id);
    if (result.error) setError(result.error.message);
    await load();
    setDrafts((current) => {
      const next = { ...current };
      delete next[mentee.id];
      return next;
    });
    setBusy(null);
  }

  function draftOf(mentee: Mentee): Draft {
    return drafts[mentee.id] ?? { status: mentee.status, weekly_slot: mentee.weekly_slot, user_id: mentee.user_id };
  }

  function patchDraft(mentee: Mentee, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [mentee.id]: { ...draftOf(mentee), ...patch } }));
  }

  const mine = isMentor
    ? []
    : mentees.filter((mentee) =>
        !mentee.user_id ||
        mentee.user_id === userId ||
        (userEmail.trim() !== "" && mentee.email?.toLowerCase() === userEmail.trim().toLowerCase()));

  return (
    <section className="mentees" aria-label="Mentorship records">
      <header className="mentees-head">
        <span className="mentees-kicker">MENTORSHIP · ACTIVE RECORDS</span>
        <h1><Users size={22} /> Mentees</h1>
        <p>Confirmed payments, weekly slots and what each student is working on. Only you and the student see a record.</p>
      </header>

      {booting && <p className="mentees-note"><LoaderCircle size={14} className="mentees-spin" /> Loading mentorship records…</p>}

      {error && <p className="mentees-warning">{error}</p>}

      {!booting && isMentor && claims.length > 0 && (
        <article className="mentees-claims">
          <h2>Awaiting confirmation · {claims.length}</h2>
          <p className="mentees-note">Match these against your Paytm statement, then confirm. Confirmation creates the mentee record and ends the payment alert.</p>
          {claims.map((claim) => (
            <div className="mentees-claim" key={claim.reference}>
              <div>
                <strong>{claim.student}</strong>
                <span>{planLabel(claim.plan)} · ₹{claim.amount} · {claim.reference}</span>
                <span>{[claim.contact, claim.paytm_reference && `UTR ${claim.paytm_reference}`, claim.note].filter(Boolean).join(" · ")}</span>
              </div>
              <label className="mentees-slot">
                <span>Weekly slot</span>
                <input
                  value={slots[claim.reference] ?? ""}
                  onChange={(event) => setSlots((current) => ({ ...current, [claim.reference]: event.target.value }))}
                  placeholder="Tue 7pm IST"
                  maxLength={120}
                />
              </label>
              <button type="button" className="mentees-primary" onClick={() => void confirmClaim(claim)} disabled={busy === claim.reference}>
                {busy === claim.reference ? <LoaderCircle size={15} className="mentees-spin" /> : <Check size={15} />}
                {busy === claim.reference ? "Confirming…" : "Confirm payment"}
              </button>
            </div>
          ))}
        </article>
      )}

      {!booting && isMentor && (
        <article className="mentees-roster">
          <h2>Roster · {mentees.length}</h2>
          {mentees.length === 0 && <p className="mentees-note">No confirmed mentees yet.</p>}
          {mentees.map((mentee) => {
            const draft = draftOf(mentee);
            const dirty = draft.status !== mentee.status || draft.weekly_slot !== mentee.weekly_slot || draft.user_id !== mentee.user_id;
            return (
              <div className="mentees-row" key={mentee.id}>
                <div className="mentees-row-main">
                  <strong>{mentee.student_name}</strong>
                  <span>{planLabel(mentee.plan)} · {mentee.reference} · since {shortDate(mentee.started_at)} · ends {shortDate(mentee.ends_at)}</span>
                  {mentee.notes && <span className="mentees-notes">{mentee.notes}</span>}
                </div>
                <label><span>Status</span>
                  <select value={draft.status} onChange={(event) => patchDraft(mentee, { status: event.target.value })}>
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label><span>Weekly slot</span>
                  <input value={draft.weekly_slot} onChange={(event) => patchDraft(mentee, { weekly_slot: event.target.value })} maxLength={120} />
                </label>
                <label><span>Student id</span>
                  <input value={draft.user_id} onChange={(event) => patchDraft(mentee, { user_id: event.target.value })} placeholder="user_…" maxLength={80} />
                </label>
                <button type="button" className="mentees-primary" onClick={() => void saveMentee(mentee)} disabled={!dirty || busy === String(mentee.id)}>
                  {busy === String(mentee.id) ? <LoaderCircle size={15} className="mentees-spin" /> : <Check size={15} />} Save
                </button>
                {(mentee.contact || mentee.email) && (
                  <a className="mentees-contact" href={isEmail(mentee.contact) ? `mailto:${mentee.contact}` : mentee.contact ? `tel:${mentee.contact}` : `mailto:${mentee.email}`}>
                    <Mail size={14} /> Contact
                  </a>
                )}
              </div>
            );
          })}
        </article>
      )}

      {!booting && !isMentor && (
        <article className="mentees-mine">
          <h2>Your mentorship</h2>
          {mine.length === 0 ? (
            <p className="mentees-note">
              Nothing confirmed yet. Plans start at ₹19 on the{" "}
              <a href="/mentorship">mentorship page</a>.
            </p>
          ) : mine.map((mentee) => (
            <div className="mentees-mine-card" key={mentee.id}>
              <strong>{planLabel(mentee.plan)}</strong>
              <span>{mentee.status === "active" ? "Active" : mentee.status}</span>
              <span>{mentee.weekly_slot || "Slot not fixed yet — Aditya sets it after confirming your payment."}</span>
              <span>{mentee.reference} · until {shortDate(mentee.ends_at)}</span>
              <a href={`mailto:${mentorEmail}?subject=${encodeURIComponent(`CodexSheet mentorship ${mentee.reference}`)}`}>
                <Mail size={14} /> Email Aditya <RotateCcw size={13} />
              </a>
            </div>
          ))}
        </article>
      )}
    </section>
  );
}
