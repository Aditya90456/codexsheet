import { useMemo, useState } from "react";
import { BookOpen, ExternalLink, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  interviewCompanyGuides,
  interviewPracticeQuestions,
  type InterviewQuestionCategory,
} from "./interviewQuestionResearchData";
import "./interview-question-research.css";

const categories: Array<InterviewQuestionCategory | "All types"> = [
  "All types",
  "Coding",
  "System design",
  "Debugging",
  "Behavioral",
];

export default function InterviewQuestionResearch() {
  const [company, setCompany] = useState("all");
  const [category, setCategory] = useState<InterviewQuestionCategory | "All types">("All types");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return interviewPracticeQuestions.filter((item) => {
      const guide = interviewCompanyGuides.find((entry) => entry.id === item.company);
      return (company === "all" || item.company === company)
        && (category === "All types" || item.category === category)
        && (!needle || `${item.prompt} ${item.followUp} ${guide?.name ?? ""}`.toLowerCase().includes(needle));
    });
  }, [category, company, query]);

  return (
    <section className="iqr" aria-label="Interview Questions Research">
      <header className="iqr-hero">
        <span className="iqr-kicker"><BookOpen size={14} /> INTERVIEW QUESTIONS · PRACTICE RESEARCH</span>
        <h1>Practise the interview.<br /><em>Not a leaked question list.</em></h1>
        <p>
          Work through original CodexSheet practice prompts, grouped by target company and skill.
          Company links go to official interview guidance; they do not claim these exact prompts
          have been asked by that company.
        </p>
        <div className="iqr-notice" role="note">
          <TriangleAlert size={16} />
          <span><strong>Important:</strong> These are authored practice questions, not official or reported interview questions. Use each company&apos;s current guide and recruiter instructions for the real process.</span>
        </div>
      </header>

      <section className="iqr-sources" aria-label="Official company interview guides">
        {interviewCompanyGuides.map((guide) => (
          <a className="iqr-source" key={guide.id} href={guide.url} target="_blank" rel="noopener noreferrer">
            <span><ShieldCheck size={14} /> OFFICIAL GUIDE</span>
            <strong>{guide.name}</strong>
            <small>{guide.source} <ExternalLink size={12} /></small>
          </a>
        ))}
      </section>

      <div className="iqr-filter-row">
        <label className="iqr-search">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a practice prompt" aria-label="Search practice questions" />
        </label>
        <label className="iqr-select">
          <span>COMPANY</span>
          <select value={company} onChange={(event) => setCompany(event.target.value)}>
            <option value="all">All companies</option>
            {interviewCompanyGuides.map((guide) => <option key={guide.id} value={guide.id}>{guide.name}</option>)}
          </select>
        </label>
      </div>

      <div className="iqr-types" role="group" aria-label="Filter by question type">
        {categories.map((item) => (
          <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>
        ))}
        <span>{shown.length} practice prompts</span>
      </div>

      <div className="iqr-list">
        {shown.map((item) => {
          const guide = interviewCompanyGuides.find((entry) => entry.id === item.company)!;
          return (
            <article className="iqr-card" key={item.id}>
              <div className="iqr-card-meta"><span>{guide.name}</span><span>{item.category}</span><span>CodexSheet practice prompt</span></div>
              <h2>{item.prompt}</h2>
              <p className="iqr-evaluation"><strong>What to demonstrate</strong>{item.evaluation}</p>
              <details>
                <summary>Try a follow-up</summary>
                <p>{item.followUp}</p>
              </details>
            </article>
          );
        })}
        {shown.length === 0 && <p className="iqr-empty">No prompts match those filters. Try another company or search term.</p>}
      </div>
    </section>
  );
}
