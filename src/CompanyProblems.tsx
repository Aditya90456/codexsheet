import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";

type CompanyProblem = {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
  frequency: string;
  frequencyCompany: string;
  companyTagged: boolean;
};

const companies = [
  { name: "Meta", slug: "meta" },
  { name: "Amazon", slug: "amazon" },
  { name: "Apple", slug: "apple" },
  { name: "Netflix", slug: "netflix" },
  { name: "Nvidia", slug: "nvidia" },
  { name: "Google", slug: "google" },
];

const sourceRoot = "https://raw.githubusercontent.com/snehasishroy/leetcode-companywise-interview-questions/master";

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) {
      field += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      fields.push(field);
      field = "";
    } else field += char;
  }
  fields.push(field);
  return fields;
}

function parseProblems(csv: string, companyName: string): CompanyProblem[] {
  return csv.split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
    const [, link, title, difficulty, , frequency] = parseCsvLine(line);
    return {
      title,
      difficulty: (difficulty?.toLowerCase() === "easy" ? "Easy" : difficulty?.toLowerCase() === "hard" ? "Hard" : "Medium") as CompanyProblem["difficulty"],
      link,
      frequency: frequency ?? "",
      frequencyCompany: companyName,
      companyTagged: true,
    };
  }).filter((problem) => problem.title && problem.link).slice(0, 150);
}

export default function CompanyProblems() {
  const [selectedCompany, setSelectedCompany] = useState(companies[0].name);
  const [companyLists, setCompanyLists] = useState<Record<string, CompanyProblem[]>>({});
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All levels");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.allSettled(companies.map(async (company) => {
      const response = await fetch(`${sourceRoot}/${company.slug}/all.csv`);
      if (!response.ok) throw new Error(`Could not load ${company.name}`);
      return [company.slug, parseProblems(await response.text(), company.name)] as const;
    })).then((results) => {
      if (cancelled) return;
      const lists = Object.fromEntries(results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []));
      setCompanyLists(lists);
      if (!Object.keys(lists).length) setError("Could not load company questions. Check your connection and try again.");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const selectedProfile = companies.find((item) => item.name === selectedCompany)!;
  const problems = useMemo(() => {
    const tagged = (companyLists[selectedProfile.slug] ?? []).slice(0, 150);
    if (tagged.length >= 150) return tagged;
    const seen = new Set(tagged.map((problem) => problem.link));
    const shared = new Map<string, { problem: CompanyProblem; mentions: number }>();
    Object.entries(companyLists).forEach(([slug, list]) => {
      if (slug === selectedProfile.slug) return;
      list.forEach((problem) => {
        if (seen.has(problem.link)) return;
        const current = shared.get(problem.link);
        shared.set(problem.link, { problem: { ...problem, companyTagged: false }, mentions: (current?.mentions ?? 0) + 1 });
      });
    });
    const supplements = [...shared.values()].sort((left, right) => right.mentions - left.mentions || Number.parseFloat(right.problem.frequency) - Number.parseFloat(left.problem.frequency));
    return [...tagged, ...supplements.slice(0, 150 - tagged.length).map(({ problem }) => problem)];
  }, [companyLists, selectedProfile.slug]);

  const visible = useMemo(() => problems.filter((problem) =>
    (difficulty === "All levels" || problem.difficulty === difficulty) &&
    problem.title.toLowerCase().includes(query.toLowerCase())
  ), [difficulty, problems, query]);
  const taggedCount = companyLists[selectedProfile.slug]?.length ?? 0;
  const sharedCount = Math.max(0, problems.length - Math.min(150, taggedCount));

  return <div className="company-page">
    <section className="company-hero">
      <div className="company-hero-copy">
        <span className="company-eyebrow"><i /> MAANG INTERVIEW PREP</span>
        <h1>Practice with a<br /><em>company in mind.</em></h1>
        <p>Focus your prep on the questions that show up most often, then work through them one by one.</p>
      </div>
      <div className="company-hero-metric"><span>YOUR SET</span><strong>{loading ? "—" : problems.length.toString().padStart(2, "0")}</strong><small>questions</small><div><i style={{ width: `${Math.min(100, (problems.length / 150) * 100)}%` }} /></div><small>Curated for {selectedCompany}</small></div>
      <div className="company-hero-orbit" aria-hidden="true" />
    </section>
    <section className="company-picker">
      <div className="company-section-heading"><div><span>CHOOSE YOUR TARGET</span><h2>Pick a company</h2></div><small>Six focused tracks · 150 questions each</small></div>
      <div className="company-options" role="tablist" aria-label="Select a company">
        {companies.map((company, index) => <button key={company.name} role="tab" aria-selected={selectedCompany === company.name} className={`company-option${selectedCompany === company.name ? " active" : ""}`} onClick={() => setSelectedCompany(company.name)}><span className={`company-monogram monogram-${index}`}>{company.name[0]}</span><span className="company-option-copy"><strong>{company.name}</strong><small>{loading ? "Loading list" : `${companyLists[company.slug]?.length ?? 0} tagged questions`}</small></span><span className="company-option-arrow">↗</span></button>)}
      </div>
    </section>
    <section className="sheet-card company-library">
      <div className="company-library-header"><div><span className="company-library-kicker">{selectedCompany.toUpperCase()} TRACK</span><h2>Question library</h2><p>{loading ? "Building your practice list…" : `${taggedCount} company tagged · ${sharedCount} shared picks`}</p></div><span className="company-snapshot">DATA SNAPSHOT · JUL 2026</span></div>
      <div className="company-controls">
        <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions" /></label>
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Filter by difficulty"><option>All levels</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
        <span className="company-result-count">{loading ? "Loading…" : `${visible.length} results`}</span>
      </div>
      {loading ? <div className="company-empty">Loading {selectedCompany} questions…</div> : error ? <div className="company-empty">{error}</div> : <>
        <p className="company-source-note">Company tagged questions come first. Shared picks are popular questions from the other MAANG lists.</p>
        <div className="table-scroll"><table><thead><tr><th>#</th><th>Problem</th><th>Match</th><th>Frequency</th><th>Level</th><th>Open</th></tr></thead><tbody>
          {visible.map((problem, index) => <tr className="library-row" key={`${problem.title}-${index}`}><td className="number-cell">{String(index + 1).padStart(3, "0")}</td><td className="problem-cell"><strong>{problem.title}</strong></td><td><span className={`pattern-pill${problem.companyTagged ? "" : " shared"}`}>{problem.companyTagged ? selectedCompany : "Shared MAANG"}</span></td><td><span className="company-frequency">{problem.frequency || "—"}{!problem.companyTagged && problem.frequency ? ` · ${problem.frequencyCompany}` : ""}</span></td><td><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span></td><td><a className="external-link" href={problem.link} target="_blank" rel="noreferrer" aria-label={`Open ${problem.title} on LeetCode`}><ExternalLink size={15} /></a></td></tr>)}
          {!visible.length && <tr><td colSpan={6} className="company-no-results">No questions match these filters.</td></tr>}
        </tbody></table></div>
        <div className="sheet-footer"><span>{visible.length} questions · {selectedCompany}</span><a href="https://github.com/snehasishroy/leetcode-companywise-interview-questions" target="_blank" rel="noreferrer">View source data ↗</a></div>
      </>}
    </section>
    <p className="company-attribution">Company question tags and frequency data are community sourced. Snapshot: 12 July 2026.</p>
  </div>;
}
