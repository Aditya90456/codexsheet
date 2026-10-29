import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Check, Download, LoaderCircle, Mail, MessageSquare, PhoneCall, RotateCcw, Send, Users } from "lucide-react";
import { supabase, supabaseConfigurationError } from "./lib/supabase";
import { mentorEmail, paymentBadge, planLabel } from "./mentorship";

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
  live_room_id: string | null;
  meeting_url: string;
  scheduled_at: string | null;
  started_at: string;
  ends_at: string | null;
};

type LaneMessage = { id: number; sender_id: string; content: string; created_at: string };

type Payment = { reference: string; plan: string; amount: number; status: string; due: boolean; paytm_reference?: string };

type Slot = { starts_at: string; ends_at: string };
type Hours = { weekday: number; start_time: string; end_time: string };

const WEEKDAYS = [
  { iso: 1, label: "Monday" },
  { iso: 2, label: "Tuesday" },
  { iso: 3, label: "Wednesday" },
  { iso: 4, label: "Thursday" },
  { iso: 5, label: "Friday" },
];

const istHour = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const istDay = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" }).format(new Date(value));

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



const shortDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "open ended";

const isEmail = (value: string) => /.+@.+\..+/.test(value);

const laneTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const istLabel = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value)) + " IST"
    : "";

// datetime-local carries a wall clock, so give it one in IST rather than an instant.
function toLocalInput(value: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

const fromLocalInput = (value: string) => new Date(`${value}+05:30`).toISOString();

function googleCalendarHref(mentee: Mentee) {
  if (!mentee.scheduled_at) return "";
  const start = new Date(mentee.scheduled_at);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const utc = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const link = mentee.meeting_url || `https://codexsheet.in/calls?room=${mentee.live_room_id}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `CodexSheet mentorship · ${planLabel(mentee.plan)}`,
    dates: `${utc(start)}/${utc(end)}`,
    details: `Reference ${mentee.reference} · with Aditya Bakshi · ${link}`,
    location: link,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Google Calendar and Apple Calendar both accept a plain .ics download.
function downloadInvite(mentee: Mentee) {
  if (!mentee.scheduled_at) return;
  const start = new Date(mentee.scheduled_at);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const utc = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const link = mentee.meeting_url || `https://codexsheet.in/calls?room=${mentee.live_room_id}`;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CodexSheet//Mentorship//EN",
    "BEGIN:VEVENT",
    `UID:${mentee.live_room_id ?? mentee.reference}@codexsheet.in`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(start)}`,
    `DTEND:${utc(end)}`,
    `SUMMARY:CodexSheet mentorship · ${planLabel(mentee.plan)}`,
    `DESCRIPTION:Reference ${mentee.reference} · with Aditya Bakshi · ${link}`,
    `URL:${link}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `codexsheet-session-${mentee.reference}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SessionChat({ mentee, userId, otherLabel }: { mentee: Mentee; userId: string; otherLabel: string }) {
  const [messages, setMessages] = useState<LaneMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const tail = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!supabase || userId === "") return;
    const client = supabase;
    let cancelled = false;
    void (async () => {
      const rows = await client
        .from("mentorship_messages")
        .select("id, sender_id, content, created_at")
        .eq("mentee_id", mentee.id)
        .order("id", { ascending: false })
        .limit(60);
      if (cancelled) return;
      if (rows.error) setNote(rows.error.message);
      setMessages(((rows.data as LaneMessage[]) ?? []).reverse());
    })();
    const channel = client
      .channel(`mentee-lane-${mentee.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mentorship_messages", filter: `mentee_id=eq.${mentee.id}` },
        (payload) => {
          const message = payload.new as LaneMessage;
          setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, [mentee.id, userId]);

  useEffect(() => {
    tail.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const text = draft.trim();
    if (!supabase || userId === "" || text === "") return;
    setSending(true);
    setNote(null);
    const { data, error } = await supabase
      .from("mentorship_messages")
      .insert({ mentee_id: mentee.id, sender_id: userId, content: text.slice(0, 4000) })
      .select("id, sender_id, content, created_at")
      .single();
    if (error) setNote(`Could not send. ${error.message}`);
    else if (data) {
      const message = data as LaneMessage;
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    }
    setDraft("");
    setSending(false);
  }

  return (
    <div className="lane">
      <div className="lane-log">
        {messages.length === 0 && <p className="lane-empty">Nothing said yet in this lane.</p>}
        {messages.map((message) => (
          <p className={message.sender_id === userId ? "lane-line mine" : "lane-line"} key={message.id}>
            <strong>{message.sender_id === userId ? "You" : otherLabel}</strong>
            <span>{message.content}</span>
            <em>{laneTime(message.created_at)}</em>
          </p>
        ))}
        <div ref={tail} />
      </div>
      {note && <p className="mentees-warning">{note}</p>}
      <div className="lane-compose">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          placeholder={`Message ${otherLabel}…`}
          maxLength={4000}
        />
        <button type="button" className="mentees-primary" onClick={() => void send()} disabled={sending || draft.trim() === ""}>
          {sending ? <LoaderCircle size={15} className="mentees-spin" /> : <Send size={15} />} Send
        </button>
      </div>
    </div>
  );
}

/** The one control both people press: same label, same room, on each side. */
function JoinButton({ mentee }: { mentee: Mentee }) {
  if (!mentee.live_room_id && !mentee.meeting_url) return null;
  const external = mentee.meeting_url !== "";
  return (
    <a
      className="mentees-primary mentees-join"
      href={mentee.meeting_url || `/calls?room=${mentee.live_room_id}`}
      target={external ? "_blank" : undefined}
      rel="noreferrer"
    >
      <PhoneCall size={15} /> Join session
    </a>
  );
}

// The student chooses the hour; the grid comes from the mentor's published
// windows with already-held hours removed.
function SlotPicker({ mentee, userId, onBooked }: { mentee: Mentee; userId: string; onBooked: () => Promise<void> }) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    if (!supabase || userId === "") return;
    const { data, error } = await supabase.rpc("mentor_open_slots", { p_mentee_id: mentee.id });
    if (error) { setSlots([]); setNote(`Could not read Aditya's hours: ${error.message}`); return; }
    setSlots((data as Slot[]) ?? []);
  }, [mentee.id, userId]);

  useEffect(() => { void load(); }, [load]);

  const days: { label: string; items: Slot[] }[] = [];
  for (const slot of slots ?? []) {
    const label = istDay(slot.starts_at);
    const bucket = days.find((day) => day.label === label);
    if (bucket) bucket.items.push(slot);
    else days.push({ label, items: [slot] });
  }

  async function book(slot: Slot) {
    if (!supabase) return;
    setBusy(slot.starts_at);
    setNote("");
    const { error } = await supabase.rpc("mentee_book_slot", { p_mentee_id: mentee.id, p_starts_at: slot.starts_at });
    if (error) setNote(error.message);
    else await Promise.all([load(), onBooked()]);
    setBusy("");
  }

  if (userId === "") return <p className="mentees-quiet">Sign in to pick your own session hour.</p>;

  return (
    <div className="mentees-slots">
      <p className="mentees-slots-lead">
        <CalendarDays size={14} /> Pick an hour. Aditya holds sessions Monday to Friday, 11:00–18:00 IST; booking opens the room for both of you.
      </p>
      {slots === null ? (
        <p className="mentees-quiet"><LoaderCircle size={14} className="mentees-spin" /> Reading the schedule…</p>
      ) : slots.length === 0 ? (
        <p className="mentees-quiet">No open hour in the next seven days — Aditya has to publish his hours or free a slot first.</p>
      ) : (
        days.map((day) => (
          <div className="mentees-slots-day" key={day.label}>
            <span>{day.label}</span>
            <div>
              {day.items.map((slot) => (
                <button
                  type="button"
                  key={slot.starts_at}
                  disabled={busy !== ""}
                  onClick={() => void book(slot)}
                >
                  {istHour(slot.starts_at)}
                  {busy === slot.starts_at && <LoaderCircle size={12} className="mentees-spin" />}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
      {note && <p className="mentees-warning">{note}</p>}
    </div>
  );
}

// The mentor publishes the window once; every student books inside it.
function AvailabilityEditor({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Record<number, Hours> | null>(null);
  const [edits, setEdits] = useState<Record<number, { start: string; end: string }>>({});
  const [closed, setClosed] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    if (!supabase || userId === "") return;
    const { data, error } = await supabase
      .from("mentor_availability")
      .select("weekday, start_time, end_time")
      .eq("mentor_user_id", userId)
      .order("weekday");
    if (error) { setNote(error.message); setRows({}); return; }
    const map: Record<number, Hours> = {};
    for (const row of (data as Hours[]) ?? []) map[row.weekday] = row;
    setRows(map);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  function editOf(iso: number): { start: string; end: string } {
    const edit = edits[iso];
    if (edit) return edit;
    const row = rows?.[iso];
    return { start: row?.start_time.slice(0, 5) ?? "11:00", end: row?.end_time.slice(0, 5) ?? "18:00" };
  }

  async function save(iso: number) {
    if (!supabase || userId === "") return;
    setBusy(iso);
    setNote("");
    if (closed[iso]) {
      const gone = await supabase.from("mentor_availability").delete().eq("mentor_user_id", userId).eq("weekday", iso);
      if (gone.error) setNote(gone.error.message);
    } else {
      const edit = editOf(iso);
      const up = await supabase
        .from("mentor_availability")
        .upsert(
          { mentor_user_id: userId, weekday: iso, start_time: edit.start, end_time: edit.end, updated_at: new Date().toISOString() },
          { onConflict: "mentor_user_id,weekday" },
        );
      if (up.error) setNote(up.error.message);
    }
    await load();
    setEdits((current) => {
      const next = { ...current };
      delete next[iso];
      return next;
    });
    setBusy(null);
  }

  if (userId === "") return null;

  return (
    <article className="mentees-hours">
      <h2>Your session hours · IST</h2>
      <p className="mentees-note">Students only ever see hours inside this window, and one call per hour at most.</p>
      {rows === null ? (
        <p className="mentees-quiet"><LoaderCircle size={14} className="mentees-spin" /> Reading your hours…</p>
      ) : (
        <div className="mentees-hours-grid">
          {WEEKDAYS.map((day) => {
            const edit = editOf(day.iso);
            const off = closed[day.iso] ?? !rows[day.iso];
            return (
              <div className={off ? "mentees-hour off" : "mentees-hour"} key={day.iso}>
                <label>{day.label}</label>
                <input
                  type="time"
                  value={edit.start}
                  disabled={off}
                  onChange={(event) => setEdits((current) => ({ ...current, [day.iso]: { ...edit, start: event.target.value } }))}
                />
                <span>to</span>
                <input
                  type="time"
                  value={edit.end}
                  disabled={off}
                  onChange={(event) => setEdits((current) => ({ ...current, [day.iso]: { ...edit, end: event.target.value } }))}
                />
                <button
                  type="button"
                  className={off ? "mentees-hour-state closed" : "mentees-hour-state"}
                  onClick={() => setClosed((current) => ({ ...current, [day.iso]: !off }))}
                >
                  {off ? "Closed" : "Open"}
                </button>
                <button type="button" className="mentees-chat" onClick={() => void save(day.iso)} disabled={busy === day.iso}>
                  {busy === day.iso ? <LoaderCircle size={14} className="mentees-spin" /> : <Check size={14} />} Save
                </button>
              </div>
            );
          })}
        </div>
      )}
      {note && <p className="mentees-warning">{note}</p>}
    </article>
  );
}

export default function MenteeSpace({ userId = null, userEmail = "" }: { userId?: string | null; userEmail?: string }) {
  const [booting, setBooting] = useState(true);
  const [isMentor, setIsMentor] = useState(false);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [roomBusy, setRoomBusy] = useState<number | null>(null);
  const [sessionEdits, setSessionEdits] = useState<Record<number, { meeting: string; when: string }>>({});
  const [openLane, setOpenLane] = useState<number | null>(null);
  const [copiedRoom, setCopiedRoom] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

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
    let myPayments: Payment[] = [];
    if (mentor) {
      const pending = await supabase.rpc("mentor_pending_orders");
      pendingRows = (pending.data as Claim[]) ?? [];
      pendingError = pending.error?.message ?? null;
    } else if (userId) {
      // The table itself is unreadable from the browser, so the student's own
      // due-or-done list has to come from the security-definer function.
      const placed = await supabase.rpc("my_mentorship_payments");
      myPayments = (placed.data as Payment[]) ?? [];
    }
    if (rows.error) setError(rows.error.message);
    if (pendingError) setError(pendingError);
    setIsMentor(mentor);
    setMentees((rows.data as Mentee[]) ?? []);
    setClaims(pendingRows);
    setPayments(myPayments);
    setBooting(false);
  }, [userId]);

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

  async function toggleSession(mentee: Mentee) {
    if (!supabase) return;
    setRoomBusy(mentee.id);
    setError(null);
    let result;
    if (mentee.live_room_id) {
      result = await supabase.rpc("mentor_close_session", { p_mentee_id: mentee.id });
    } else {
      const edit = sessionEdits[mentee.id] ?? { meeting: "", when: "" };
      result = await supabase.rpc("mentor_open_session", {
        p_mentee_id: mentee.id,
        p_meeting_url: edit.meeting.trim(),
        p_scheduled_at: edit.when ? fromLocalInput(edit.when) : null,
      });
    }
    if (result.error) setError(result.error.message);
    await load();
    setRoomBusy(null);
  }

  function editOf(mentee: Mentee): { meeting: string; when: string } {
    const edit = sessionEdits[mentee.id];
    if (edit) return edit;
    return {
      meeting: mentee.meeting_url,
      when: mentee.scheduled_at ? toLocalInput(mentee.scheduled_at) : "",
    };
  }

  function patchEdit(mentee: Mentee, patch: Partial<{ meeting: string; when: string }>) {
    setSessionEdits((current) => ({ ...current, [mentee.id]: { ...editOf(mentee), ...patch } }));
  }

  function joinHref(mentee: Mentee) {
    return mentee.meeting_url || `${window.location.origin}/calls?room=${mentee.live_room_id}`;
  }

  function copyRoom(mentee: Mentee) {
    if (!mentee.live_room_id) return;
    const href = joinHref(mentee);
    navigator.clipboard
      .writeText(href)
      .then(() => {
        setCopiedRoom(mentee.live_room_id);
        window.setTimeout(() => setCopiedRoom(null), 2200);
      })
      .catch(() => setError("Your browser blocked the clipboard. Open the room and copy the address bar."));
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

  const dues = payments.filter((payment) => payment.due);

  return (
    <section className="mentees" aria-label="Mentorship records">
      <header className="mentees-head">
        <span className="mentees-kicker">MENTORSHIP · ACTIVE RECORDS</span>
        <h1><Users size={22} /> Mentees</h1>
        <p>Confirmed payments, weekly slots, hours the student books himself, one Join button for both sides and a one-to-one chat lane. Only you and the student see a record.</p>
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

      {!booting && isMentor && <AvailabilityEditor userId={userId ?? ""} />}

      {!booting && isMentor && (
        <article className="mentees-roster">
          <h2>Roster · {mentees.length}</h2>
          {mentees.length === 0 && <p className="mentees-note">No confirmed mentees yet.</p>}
          {mentees.map((mentee) => {
            const draft = draftOf(mentee);
            const dirty = draft.status !== mentee.status || draft.weekly_slot !== mentee.weekly_slot || draft.user_id !== mentee.user_id;
            return (
              <div className="mentees-person" key={mentee.id}>
                <div className="mentees-row">
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
                </div>
                {!mentee.live_room_id && (
                  <div className="mentees-schedule">
                    <label><span>Session time (IST)</span>
                      <input
                        type="datetime-local"
                        value={editOf(mentee).when}
                        onChange={(event) => patchEdit(mentee, { when: event.target.value })}
                      />
                    </label>
                    <label><span>Google Meet link · optional</span>
                      <input
                        value={editOf(mentee).meeting}
                        onChange={(event) => patchEdit(mentee, { meeting: event.target.value })}
                        placeholder="https://meet.google.com/xxx-yyyy-zzz"
                        maxLength={300}
                      />
                    </label>
                  </div>
                )}
                <div className="mentees-actions">
                  <JoinButton mentee={mentee} />
                  <button type="button" className="mentees-session" onClick={() => void toggleSession(mentee)} disabled={roomBusy === mentee.id}>
                    {roomBusy === mentee.id
                      ? <LoaderCircle size={14} className="mentees-spin" />
                      : mentee.live_room_id ? <RotateCcw size={14} /> : <PhoneCall size={14} />}
                    {mentee.live_room_id ? "End session" : mentee.meeting_url ? "Re-book with Meet" : "Open room now"}
                  </button>
                  <button
                    type="button"
                    className={openLane === mentee.id ? "mentees-chat on" : "mentees-chat"}
                    onClick={() => setOpenLane((current) => (current === mentee.id ? null : mentee.id))}
                  >
                    <MessageSquare size={14} /> Chat
                  </button>
                  {(mentee.contact || mentee.email) && (
                    <a className="mentees-contact" href={isEmail(mentee.contact) ? `mailto:${mentee.contact}` : mentee.contact ? `tel:${mentee.contact}` : `mailto:${mentee.email}`}>
                      <Mail size={14} /> Contact
                    </a>
                  )}
                  {mentee.live_room_id || mentee.scheduled_at ? (
                    <span className="mentees-room">
                      <span>{mentee.scheduled_at ? istLabel(mentee.scheduled_at) : "No hour booked — opens on press"}</span>
                      {mentee.live_room_id && (
                        <button type="button" onClick={() => copyRoom(mentee)}>
                          {copiedRoom === mentee.live_room_id ? "Link copied" : "Copy invite link"}
                        </button>
                      )}
                    </span>
                  ) : (
                    <span className="mentees-quiet">Waiting for the student to pick an hour from your published window.</span>
                  )}
                </div>
                {openLane === mentee.id && (
                  <SessionChat mentee={mentee} userId={userId ?? ""} otherLabel={mentee.student_name || "student"} />
                )}
              </div>
            );
          })}
        </article>
      )}

      {!booting && !isMentor && (
        <article className="mentees-mine">
          <h2>Your mentorship</h2>
          {payments.length > 0 && (
            <ul className="mentees-dues">
              {payments.map((payment) => {
                const state = paymentBadge(payment);
                return (
                  <li className={state.cls} key={payment.reference}>
                    <span className="mentees-duo">{state.label}</span>
                    <div>
                      <strong>{planLabel(payment.plan)} · ₹{Number(payment.amount)}</strong>
                      <span>
                        {payment.reference}
                        {state.cls === "due"
                          ? ` · awaiting Aditya's confirmation against his Paytm statement${payment.paytm_reference ? ` (UTR ${payment.paytm_reference})` : ""}`
                          : state.cls === "done"
                            ? " · confirmed by Aditya"
                            : " · cancelled"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {mine.length === 0 && (
            <p className="mentees-note">
              {dues.length > 0
                ? "Your record appears here the moment Aditya confirms the payment above against his Paytm statement."
                : <>Nothing confirmed yet. The pass is ₹10 on the <a href="/mentorship">mentorship page</a>.</>}
            </p>
          )}
          {mine.map((mentee) => {
            const linked = mentee.user_id === (userId ?? "");
            return (
              <div className="mentees-mine-card" key={mentee.id}>
                <strong>{planLabel(mentee.plan)}</strong>
                <span>{mentee.status === "active" ? "Active" : mentee.status}</span>
                <span>{mentee.weekly_slot || "Weekly slot not fixed — pick any hour below and Aditya keeps it."}</span>
                <span>{mentee.reference} · until {shortDate(mentee.ends_at)}</span>
                <div className="mentees-mine-actions">
                  <JoinButton mentee={mentee} />
                  {mentee.scheduled_at && (
                    <>
                      <span className="mentees-when">{istLabel(mentee.scheduled_at)}</span>
                      <a className="mentees-chat" href={googleCalendarHref(mentee)} target="_blank" rel="noreferrer">
                        <CalendarDays size={14} /> Google Calendar
                      </a>
                      <button type="button" className="mentees-chat" onClick={() => downloadInvite(mentee)}>
                        <Download size={14} /> .ics
                      </button>
                    </>
                  )}
                  {linked ? (
                    <SlotPicker mentee={mentee} userId={userId ?? ""} onBooked={load} />
                  ) : (
                    <p className="mentees-quiet">
                      This record is not linked to your sign-in id yet, so the schedule and chat stay closed. Send your <code>{userId ?? ""}</code> id to Aditya once.
                    </p>
                  )}
                  <button
                    type="button"
                    className={openLane === mentee.id ? "mentees-chat on" : "mentees-chat"}
                    onClick={() => setOpenLane((current) => (current === mentee.id ? null : mentee.id))}
                  >
                    <MessageSquare size={14} /> Chat with Aditya
                  </button>
                  <a href={`mailto:${mentorEmail}?subject=${encodeURIComponent(`CodexSheet mentorship ${mentee.reference}`)}`}>
                    <Mail size={14} /> Email Aditya <RotateCcw size={13} />
                  </a>
                </div>
                {openLane === mentee.id && (linked ? (
                  <SessionChat mentee={mentee} userId={userId ?? ""} otherLabel="Aditya" />
                ) : (
                  <p className="mentees-warning">
                    This record is not linked to your sign-in id yet, so the chat stays closed. Send your <code>{userId ?? ""}</code> id to Aditya once and he can open the lane.
                  </p>
                ))}
              </div>
            );
          })}
        </article>
      )}
    </section>
  );
}
