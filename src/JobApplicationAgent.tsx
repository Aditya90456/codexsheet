import { useState, type FormEvent } from "react";
import { ArrowRight, BriefcaseBusiness, ExternalLink, LoaderCircle, MapPin, Search, Sparkles } from "lucide-react";
import "./job-application-agent.css";

type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  remote: boolean;
  postedAt: string;
  applyUrl: string;
  description: string;
};

type ApplicationDraft = {
  fitSummary: string;
  coverLetter: string;
  resumeBullets: string[];
  reviewChecklist: string[];
};

async function responseError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  return typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
    ? body.error
    : fallback;
}

export default function JobApplicationAgent() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [profile, setProfile] = useState("");
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [searching, setSearching] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;

  async function searchJobs(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      setError("Enter a role, skill, or company to search.");
      return;
    }

    setSearching(true);
    setError("");
    setJobs([]);
    setSelectedJobId(null);
    setDraft(null);
    try {
      const response = await fetch("/api/job-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), location: location.trim() }),
      });
      if (!response.ok) throw new Error(await responseError(response, "Could not search jobs."));
      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null || !("jobs" in body) ||
        !Array.isArray(body.jobs) || !body.jobs.every((job) => typeof job === "object" && job !== null)) {
        throw new Error("The job search returned an invalid response.");
      }
      setJobs(body.jobs as JobListing[]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not search jobs. Try again shortly.");
    } finally {
      setSearching(false);
    }
  }

  async function createDraft() {
    if (!selectedJob || !profile.trim()) {
      setError("Choose a role and add your experience before drafting.");
      return;
    }
    setDrafting(true);
    setError("");
    setDraft(null);
    try {
      const response = await fetch("/api/job-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile.trim(),
          job: {
            title: selectedJob.title,
            company: selectedJob.company,
            description: selectedJob.description,
          },
        }),
      });
      if (!response.ok) throw new Error(await responseError(response, "Could not prepare an application draft."));
      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null || !("draft" in body) || typeof body.draft !== "object" || body.draft === null) {
        throw new Error("The application assistant returned an invalid response.");
      }
      setDraft(body.draft as ApplicationDraft);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not prepare a draft. Try again shortly.");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <main className="jobs-page job-agent-page">
      <section className="jobs-hero job-agent-hero">
        <div className="jobs-hero-copy">
          <span className="jobs-kicker"><BriefcaseBusiness size={14} /> AI APPLICATION COPILOT</span>
          <h2>Find a role.<br /><em>Make your case.</em></h2>
          <p>Search live roles, then turn your real experience into a tailored application draft. You review every word and apply yourself.</p>
          <div className="jobs-hero-meta"><span><i /> HUMAN REVIEW REQUIRED</span><span>NO AUTO-SUBMISSIONS</span></div>
        </div>
        <div className="job-agent-hero-note">
          <span><Sparkles size={16} /> YOUR APPLICATION WORKFLOW</span>
          <strong>Search → Select → Review → Apply</strong>
          <small>Your profile stays in this tab unless you ask for a draft.</small>
        </div>
      </section>

      <section className="jobs-board job-agent-board" aria-labelledby="job-agent-search-title">
        <header className="jobs-board-heading">
          <div><span className="jobs-kicker">LIVE JOB SEARCH</span><h3 id="job-agent-search-title">Find your next opportunity.</h3><p>Listings come from JSearch. Check the employer page for current details.</p></div>
          {jobs.length > 0 && <span className="jobs-live-count"><i />{jobs.length} MATCHES</span>}
        </header>
        <form className="jobs-search-panel job-agent-search" onSubmit={(event) => void searchJobs(event)}>
          <label className="jobs-search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Role, company, or skill" aria-label="Search jobs" maxLength={160} /></label>
          <label className="jobs-search-field"><MapPin size={17} /><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, country, or remote" aria-label="Job location" maxLength={100} /></label>
          <button className="jobs-search-button" type="submit" disabled={searching}>{searching ? <LoaderCircle size={15} className="job-agent-spinner" /> : <Search size={15} />}{searching ? "Searching…" : "Search roles"}<ArrowRight size={15} /></button>
        </form>

        {error && <p className="job-agent-error" role="alert">{error}</p>}
        {searching && <p className="job-agent-status" role="status"><LoaderCircle size={16} className="job-agent-spinner" /> Looking for matching roles…</p>}
        {!searching && !jobs.length && !error && <div className="jobs-empty job-agent-empty"><Search size={20} /><strong>Start with a role or skill</strong><span>Try “junior frontend developer” or “Python internship”.</span></div>}

        {jobs.length > 0 && (
          <div className="job-agent-results">
            {jobs.map((job) => (
              <article className={`job-agent-card${selectedJobId === job.id ? " selected" : ""}`} key={job.id}>
                <div className="job-agent-card-heading">
                  <span className="job-agent-company-mark"><BriefcaseBusiness size={18} /></span>
                  <div><h4>{job.title}</h4><strong>{job.company}</strong></div>
                  <span className="job-agent-worktype">{job.remote ? "Remote" : job.employmentType}</span>
                </div>
                <div className="job-agent-meta"><span><MapPin size={13} />{job.location || "Location not listed"}</span>{job.postedAt && <span>{job.postedAt}</span>}</div>
                {job.description && <p className="job-agent-description">{job.description}</p>}
                <footer>
                  <button type="button" className="job-agent-tailor" onClick={() => { setSelectedJobId(job.id); setDraft(null); setError(""); }}>
                    <Sparkles size={14} /> Tailor an application
                  </button>
                  {job.applyUrl && <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">Open employer listing <ExternalLink size={13} /></a>}
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedJob && (
        <section className="job-agent-draft-panel" aria-labelledby="job-agent-draft-title">
          <header><span className="jobs-kicker"><Sparkles size={14} /> REVIEW-FIRST DRAFTING</span><h3 id="job-agent-draft-title">Prepare for {selectedJob.title}</h3><p>{selectedJob.company}</p></header>
          <label className="job-agent-profile-label" htmlFor="job-agent-profile">Your experience and skills</label>
          <textarea id="job-agent-profile" value={profile} onChange={(event) => { setProfile(event.target.value); setDraft(null); }} maxLength={6000} rows={7} placeholder="Paste your resume text or summarize your experience, projects, and skills. Leave out personal contact details." />
          <div className="job-agent-consent"><strong>Before drafting:</strong> Your profile and the selected job description are sent to the configured AI service to create a draft. They are not sent to the employer or saved by this page. Review all claims; the assistant must not invent experience.</div>
          <button type="button" className="jobs-search-button job-agent-generate" onClick={() => void createDraft()} disabled={drafting || !profile.trim()}>
            {drafting ? <LoaderCircle size={15} className="job-agent-spinner" /> : <Sparkles size={15} />}{drafting ? "Preparing draft…" : "Generate application draft"}<ArrowRight size={15} />
          </button>

          {draft && (
            <div className="job-agent-draft" aria-live="polite">
              <section><h4>Why your experience may fit</h4><p>{draft.fitSummary}</p></section>
              <section><h4>Cover letter draft</h4><textarea aria-label="Editable cover letter draft" value={draft.coverLetter} rows={9} onChange={(event) => setDraft({ ...draft, coverLetter: event.target.value })} /></section>
              <section><h4>Resume bullet suggestions</h4><ul>{draft.resumeBullets.map((bullet, index) => <li key={`${index}-${bullet}`}>{bullet}</li>)}</ul></section>
              <section><h4>Check before you apply</h4><ul>{draft.reviewChecklist.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>
              <p className="job-agent-final-review">AI-generated draft. Verify every detail, edit it to your voice, then use the employer listing to apply yourself.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
