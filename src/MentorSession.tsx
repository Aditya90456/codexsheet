import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, Check, Clock3, Mail, Video } from "lucide-react";
import adityaPortrait from "./assets/aditya-bakshi.jpg";

const MEET_URL = "https://meet.google.com/prb-vzch-yrn";
const MENTOR_EMAIL = "adityabakshi1011@gmail.com";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function MentorSession() {
  const dates = useMemo(() => Array.from({ length: 10 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date;
  }), []);
  const [selectedDate, setSelectedDate] = useState(dateKey(dates[1]));
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [booking, setBooking] = useState<{ name: string; email: string; date: string; time: string } | null>(null);

  function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBooking = { name: name.trim(), email: email.trim(), date: selectedDate, time: selectedTime };
    try {
      const previous = JSON.parse(localStorage.getItem("codexsheet-mentor-bookings") ?? "[]") as typeof nextBooking[];
      localStorage.setItem("codexsheet-mentor-bookings", JSON.stringify([...previous, nextBooking]));
    } catch {
      // Keep the booking confirmation usable when local storage is unavailable.
    }
    setBooking(nextBooking);
  }

  const formattedDate = (value: Date) => new Intl.DateTimeFormat("en-IN", { weekday: "short", month: "short", day: "numeric" }).format(value);
  const calendarUrl = booking ? (() => {
    const [hours, minutes] = booking.time.match(/\d+/g)!.map(Number);
    const isPm = booking.time.includes("PM");
    const hour24 = (hours % 12) + (isPm ? 12 : 0);
    const start = `${booking.date.replace(/-/g, "")}T${String(hour24).padStart(2, "0")}${String(minutes).padStart(2, "0")}00`;
    const endDate = new Date(`${booking.date}T${String(hour24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
    endDate.setMinutes(endDate.getMinutes() + 60);
    const end = `${dateKey(endDate).replace(/-/g, "")}T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;
    return `https://calendar.google.com/calendar/render?${new URLSearchParams({
      action: "TEMPLATE",
      text: `Requested free mentor session — ${booking.name}`,
      dates: `${start}/${end}`,
      ctz: "Asia/Kolkata",
      details: `Requested by ${booking.name} (${booking.email}). Please confirm this time.\n\nGoogle Meet: ${MEET_URL}`,
      add: MENTOR_EMAIL,
      location: MEET_URL,
    }).toString()}`;
  })() : "#";
  const mentorEmailUrl = booking ? `https://mail.google.com/mail/?${new URLSearchParams({
    view: "cm",
    fs: "1",
    to: MENTOR_EMAIL,
    subject: `Free mentor session request — ${booking.name}`,
    body: [
      "Hi Aditya,",
      "",
      "I’d like to request a free 60-minute mentor session.",
      `Name: ${booking.name}`,
      `Email: ${booking.email}`,
      `Date: ${formattedDate(new Date(`${booking.date}T12:00:00`))}`,
      `Time: ${booking.time} IST`,
      `Google Meet: ${MEET_URL}`,
      `Add session to Google Calendar: ${calendarUrl}`,
      "",
      "Please confirm whether this time works for you.",
    ].join("\n"),
  }).toString()}` : "#";

  return (
    <main className="mentor-page">
      <section className="mentor-hero">
        <div className="mentor-hero-copy">
          <span className="mentor-eyebrow"><span className="mentor-live-dot" /> 1:1 MENTORING · CODING & CAREER</span>
          <h2>Make your next move <em>with clarity.</em></h2>
          <p>Bring a DSA problem, interview question, or career decision. Leave with a focused plan and practical next steps.</p>
          <div className="mentor-proof"><span><Check size={14} /> Personal guidance</span><span><Check size={14} /> Actionable feedback</span></div>
        </div>
        <div className="mentor-price-card"><span>60 minute session</span><strong>Free</strong><span>No payment required</span></div>
      </section>

      <div className="mentor-booking-layout">
        <section className="mentor-details-card">
          <div className="mentor-profile-row">
            <img src={adityaPortrait} alt="Mentor" />
            <div><span className="mentor-eyebrow">YOUR MENTOR</span><h3>CodexSheet Mentor</h3><span>Software engineering · DSA · Interviews</span></div>
          </div>
          <div className="mentor-session-summary">
            <h3>What we can work on</h3>
            <ul><li>Untangle a DSA concept or interview problem</li><li>Review your approach and problem-solving habits</li><li>Build a practical plan for your next career step</li></ul>
          </div>
          <div className="mentor-includes"><span><Clock3 size={16} /> 60 minutes</span><span><Video size={16} /> Google Meet</span><span><Check size={16} /> Free session</span></div>
          <a className="mentor-meet-link" href={MEET_URL} target="_blank" rel="noreferrer"><Video size={15} /> Meeting link included after booking <ArrowRight size={15} /></a>
        </section>

        {!booking ? <form className="mentor-schedule-card" onSubmit={submitBooking}>
          <div className="mentor-card-heading"><div className="mentor-card-icon"><CalendarDays size={18} /></div><div><span className="mentor-eyebrow">PICK A TIME</span><h3>Schedule your session</h3></div></div>
          <label className="mentor-field-label" htmlFor="mentor-date">Choose a date</label>
          <div className="mentor-date-list" id="mentor-date" role="group" aria-label="Available dates">
            {dates.map((date) => <button key={dateKey(date)} type="button" aria-pressed={selectedDate === dateKey(date)} className={selectedDate === dateKey(date) ? "selected" : ""} onClick={() => setSelectedDate(dateKey(date))}><span>{new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date)}</span><strong>{date.getDate()}</strong><span>{new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date)}</span></button>)}
          </div>
          <label className="mentor-field-label">Available times <span>India Standard Time</span></label>
          <div className="mentor-time-list" role="group" aria-label="Available times">
            {["10:00 AM", "2:00 PM", "4:30 PM"].map((time) => <button key={time} type="button" aria-pressed={selectedTime === time} className={selectedTime === time ? "selected" : ""} onClick={() => setSelectedTime(time)}>{time}</button>)}
          </div>
          <div className="mentor-form-fields">
            <label>Your name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" autoComplete="name" /></label>
            <label>Email for booking details<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
          </div>
          <button type="submit" className="mentor-submit">Book free session <ArrowRight size={16} /></button>
          <p className="mentor-form-note"><Mail size={13} /> No payment is required. Your request is saved in this browser; please contact your mentor to confirm the selected time.</p>
        </form> : <section className="mentor-schedule-card mentor-confirmation" aria-live="polite">
          <div className="mentor-success-mark"><Check size={21} /></div><span className="mentor-eyebrow">{requestSent ? "REQUEST SENT" : "FREE SESSION REQUEST"}</span><h3>{requestSent ? `Thanks, ${booking.name.split(" ")[0]}.` : `Your request is saved, ${booking.name.split(" ")[0]}.`}</h3>
          <p>Your 60-minute session is requested for <strong>{formattedDate(new Date(`${booking.date}T12:00:00`))}, {booking.time}</strong>. There is no payment required.</p>
          {!requestSent && <a className="mentor-confirm-meet" href={mentorEmailUrl} target="_blank" rel="noreferrer"><Mail size={15} /> Send session request <ExternalLinkLabel /></a>}
          <button type="button" className="mentor-confirm-meet mentor-confirm-action" onClick={() => setRequestSent(true)} disabled={requestSent}><Check size={15} /> {requestSent ? "Request marked as sent" : "I’ve sent the request"}</button>
          <p className="mentor-form-note"><Mail size={13} /> {requestSent ? "Thanks for confirming. Aditya will need to confirm the time." : "The Gmail draft includes the Meet link and a link to add this session to Google Calendar. Send the email, then mark the request as sent here."}</p>
        </section>}
      </div>
      <p className="mentor-timezone-note">Times shown in India Standard Time (IST). Choose a slot that works for you.</p>
    </main>
  );
}

function ExternalLinkLabel() { return <span aria-hidden="true">↗</span>; }
