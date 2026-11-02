// The public interview-experience page. Every card on it came off the form at the
// bottom of this same page, which is the point: the version of this feature that
// works off a scrape is the version that gets a student rejected in an interview
// because the questions were someone else's.
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Building2, Check, LoaderCircle, MapPin, Plus, Send, Trash2, X } from "lucide-react";
import {
  emptyExperience,
  experienceCompanies,
  experienceProblem,
  loadExperiences,
  outcomeChoices,
  outcomeLabel,
  submitExperience,
  suggestedCompanies,
  tidyRounds,
  type ExperienceDraft,
  type ExperienceOutcome,
  type ExperienceRow,
} from "./interviewStories";
import "./experiences.css";

const shortDay = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";

function ExperienceCard({ row }: { row: ExperienceRow }) {
  return (
    <article className={`exp-card exp-${row.outcome}`}>
      <header className="exp-card-head">
        <div>
          <strong>{row.company}</strong>
          <span>{row.role}</span>
        </div>
        <span className={`exp-outcome exp-outcome-${row.outcome}`}>{outcomeLabel[row.outcome] ?? row.outcome}</span>
      </header>
      <p className="exp-meta">
        {row.location && <span><MapPin size={12} /> {row.location}</span>}
        <span><Building2 size={12} /> {row.interview_year}</span>
      </p>
      {row.rounds.length > 0 && (
        <ol className="exp-rounds">
          {row.rounds.map((round, index) => (
            <li key={`${row.id}-round-${index}`}>
              <strong>{round.name}</strong>
              {round.questions.length > 0 && <ul>{round.questions.map((question, at) => <li key={`${row.id}-q-${index}-${at}`}>{question}</li>)}</ul>}
            </li>
          ))}
        </ol>
      )}
      <p className="exp-narrative">{row.narrative}</p>
      <footer className="exp-card-foot">
        <span>— {row.handle || "a CodexSheet student"}</span>
        <span>shared {shortDay(row.created_at)} · written for this page, not scraped</span>
      </footer>
    </article>
  );
}

export default function InterviewExperiences({ userId = "" }: { userId?: string }) {
  const [rows, setRows] = useState<ExperienceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [readProblem, setReadProblem] = useState("");
  const [company, setCompany] = useState("");
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState<ExperienceDraft>(emptyExperience);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function refresh() {
    setLoading(true);
    const found = await loadExperiences();
    setRows(found.rows);
    setReadProblem(found.problem);
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []);

  const chips = useMemo(() => experienceCompanies(rows), [rows]);
  const shown = useMemo(() => (company ? rows.filter((row) => row.company.toLowerCase() === company.toLowerCase()) : rows), [rows, company]);

  function patch(next: Partial<ExperienceDraft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function patchRound(index: number, next: Partial<ExperienceDraft["rounds"][number]>) {
    setDraft((current) => ({ ...current, rounds: current.rounds.map((round, at) => (at === index ? { ...round, ...next } : round)) }));
  }

  async function send() {
    const problem = experienceProblem(draft);
    if (problem) { setResult({ ok: false, message: problem }); return; }
    setBusy(true);
    const outcome = await submitExperience(draft, userId);
    setBusy(false);
    setResult(outcome);
    if (outcome.ok) {
      setDraft(emptyExperience());
      await refresh();
    }
  }

  return (
    <section className="exp" aria-label="Real interview experiences">
      <header className="exp-head">
        <span className="exp-kicker"><BadgeCheck size={14} /> REAL INTERVIEW EXPERIENCES · {rows.length} WRITTEN HERE · {chips.length} COMPANIES</span>
        <h1>What they actually asked. <em>Written by the student who sat in the room.</em></h1>
        <p>Nothing on this page was scraped. Every card was typed into the form at the bottom of it by the person who lived through the interview, and a CodexSheet mentor read it before you saw it.</p>
        <div className="exp-actions">
          <button type="button" className="exp-primary" onClick={() => setWriting((current) => !current)}>
            {writing ? <X size={16} /> : <Send size={16} />} {writing ? "Close the form" : "Share your experience"}
          </button>
          {chips.length > 0 && (
            <span className="exp-count">{shown.length} of {rows.length} shown</span>
          )}
        </div>
      </header>

      {chips.length > 0 && (
        <div className="exp-chips" role="group" aria-label="Filter by company">
          <button type="button" className={company === "" ? "on" : ""} onClick={() => setCompany("")}>All · {rows.length}</button>
          {chips.map((chip) => (
            <button type="button" key={chip.name} className={company === chip.name ? "on" : ""} onClick={() => setCompany(chip.name)}>
              {chip.name} · {chip.count}
            </button>
          ))}
        </div>
      )}

      {writing && (
        <div className="exp-form">
          <h2>Tell the next student what really happened</h2>
          <p className="exp-small">Which rounds, which questions, what you were asked to build. A mentor reads it before it goes live; nobody edits your words after that.</p>
          <div className="exp-form-grid">
            <label>
              Company
              <input list="exp-companies" value={draft.company} onChange={(event) => patch({ company: event.target.value })} placeholder="TCS, Adobe, CodeNation…" />
              <datalist id="exp-companies">{suggestedCompanies.map((name) => <option key={name} value={name} />)}</datalist>
            </label>
            <label>Role you interviewed for<input value={draft.role} onChange={(event) => patch({ role: event.target.value })} placeholder="SDE-1, Intern, Data Analyst…" /></label>
            <label>City<input value={draft.location} onChange={(event) => patch({ location: event.target.value })} placeholder="Pune, remote, Bangalore…" /></label>
            <label>Year<input inputMode="numeric" value={draft.interviewYear} onChange={(event) => patch({ interviewYear: event.target.value.replace(/\D/g, "").slice(0, 4) })} /></label>
            <label>Where you landed
              <select value={draft.outcome} onChange={(event) => patch({ outcome: event.target.value as ExperienceOutcome })}>
                {outcomeChoices.map((choice) => <option key={choice} value={choice}>{outcomeLabel[choice]}</option>)}
              </select>
            </label>
            <label>Sign it how you want to be known<input value={draft.handle} onChange={(event) => patch({ handle: event.target.value })} placeholder="Optional - a first name, or leave it blank" /></label>
          </div>

          <div className="exp-rounds-form">
            <h3>Rounds</h3>
            {draft.rounds.map((round, index) => (
              <div className="exp-round" key={`draft-round-${index}`}>
                <input value={round.name} onChange={(event) => patchRound(index, { name: event.target.value })} placeholder={`Round ${index + 1} - online test, technical, HR…`} />
                <textarea
                  rows={3}
                  value={round.questions.join("\n")}
                  onChange={(event) => patchRound(index, { questions: event.target.value.split("\n") })}
                  placeholder={"One question per line, exactly as they asked it"}
                />
                {draft.rounds.length > 1 && (
                  <button type="button" className="exp-ghost exp-remove" onClick={() => patch({ rounds: draft.rounds.filter((_, at) => at !== index) })}>
                    <Trash2 size={13} /> Remove round
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="exp-ghost" onClick={() => patch({ rounds: [...draft.rounds, { name: "", questions: [""] }] })}>
              <Plus size={14} /> Add a round
            </button>
          </div>

          <label className="exp-wide-field">
            The story
            <textarea rows={5} maxLength={4000} value={draft.narrative} onChange={(event) => patch({ narrative: event.target.value })} placeholder="How long you had, what went wrong, what you would do differently. 40 characters minimum." />
            <span className="exp-small">{draft.narrative.trim().length} / 4000</span>
          </label>

          <button type="button" className={`exp-consent${draft.consent ? " on" : ""}`} aria-pressed={draft.consent} onClick={() => patch({ consent: !draft.consent })}>
            {draft.consent ? <Check size={15} /> : <X size={15} />}
            I wrote this myself and CodexSheet may publish it with my name or without one.
          </button>

          {result && <p className={`exp-notice ${result.ok ? "good" : "bad"}`} role="status">{result.message}</p>}
          <div className="exp-form-foot">
            <button type="button" className="exp-primary" onClick={() => void send()} disabled={busy}>
              {busy ? <LoaderCircle size={16} className="exp-spin" /> : <Send size={16} />} {busy ? "Sending…" : "Send it in"}
            </button>
            <span className="exp-small">{tidyRounds(draft.rounds).length} round{tidyRounds(draft.rounds).length === 1 ? "" : "s"} named · nobody sees it until a mentor reads it</span>
          </div>
        </div>
      )}

      {loading ? (
        <p className="exp-empty"><LoaderCircle size={16} className="exp-spin" /> Reading what students have written…</p>
      ) : readProblem ? (
        <p className="exp-notice bad">Could not read the experiences: {readProblem}</p>
      ) : shown.length === 0 ? (
        <div className="exp-empty exp-empty-page">
          <h2>{company ? `No ${company} experience written here yet.` : "No experience has been published yet."}</h2>
          <p>That is the honest state of this page. The alternative was a thousand cards copied off a scraped dataset, and a scraped question is a question someone else was asked in a year that is not yours.</p>
          {!writing && (
            <button type="button" className="exp-primary" onClick={() => setWriting(true)}>
              Be the first <ArrowRight size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="exp-list">
          {shown.map((row) => <ExperienceCard key={row.id} row={row} />)}
        </div>
      )}

    </section>
  );
}
