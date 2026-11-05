// The 2027 radar: a public page of what the round structure is turning into, and
// the questions going into it. Kept deliberately different from /experiences -
// that page is one student's account of one interview, this one is what several
// write-ups agree on. Every card links to the source it came from and says
// whether the source is the company itself or somebody reporting about it,
// because a student who trusts a third-party list of "who allows AI" in the room
// is the student who gets cut.
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ExternalLink,
  Layers,
  Lightbulb,
  Radar,
  ShieldCheck,
  Target,
  TriangleAlert,
} from "lucide-react";
import {
  radarCompiledOn,
  radarMyths,
  radarPatternLinks,
  radarPolicy,
  radarQuestions,
  radarRounds,
  radarShifts,
  type RadarQuestion,
  type RadarRoundId,
} from "./interviewRadar2027";
import "./interview-radar.css";

const roundName = (id: RadarRoundId) => radarRounds.find((round) => round.id === id)?.name ?? id;

const stanceLabel: Record<(typeof radarPolicy)[number]["stance"], string> = {
  required: "AI REQUIRED",
  allowed: "AI ALLOWED",
  restricted: "ONLY THEIR TOOL",
  check_before_you_assume: "ASK YOUR RECRUITER",
};

function QuestionCard({ question }: { question: RadarQuestion }) {
  const [open, setOpen] = useState(false);
  const firstParty = question.confidence === "first_party";
  return (
    <article className={`rad-card${open ? " open" : ""}`}>
      <div className="rad-card-top">
        <span className="rad-round">{roundName(question.round)}</span>
        <span className={`rad-conf ${firstParty ? "own" : "reported"}`}>
          {firstParty ? <ShieldCheck size={12} /> : <TriangleAlert size={12} />}
          {firstParty ? "the company's own write-up" : "reported - verify before you rely on it"}
        </span>
      </div>

      <h3>{question.ask}</h3>

      <p className="rad-probes"><strong>What it probes</strong>{question.probes}</p>

      <button type="button" className="rad-toggle" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <ChevronDown size={15} className={open ? "rad-turn" : ""} />
        {open ? "Hide the answer shape" : "How to answer it"}
      </button>

      {open && (
        <div className="rad-answer">
          <p><span className="rad-tag good"><Lightbulb size={12} /> Strong</span>{question.strong}</p>
          <p><span className="rad-tag bad"><TriangleAlert size={12} /> Trap</span>{question.trap}</p>
          {question.patterns && question.patterns.length > 0 && (
            <p className="rad-drill">
              <Layers size={13} />
              {question.patterns.join(" · ")}
            </p>
          )}
        </div>
      )}

      <footer className="rad-card-foot">
        <a href={question.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={13} /> {question.source}
        </a>
      </footer>
    </article>
  );
}

export default function InterviewRadar({
  onPractice,
  onOpenPatterns,
  onOpenStories,
}: {
  onPractice: () => void;
  onOpenPatterns: () => void;
  onOpenStories: () => void;
}) {
  const [round, setRound] = useState<RadarRoundId | "all">("all");

  const shown = useMemo(
    () => (round === "all" ? radarQuestions : radarQuestions.filter((question) => question.round === round)),
    [round],
  );
  const counts = useMemo(() => {
    const map = new Map<RadarRoundId, number>();
    for (const question of radarQuestions) map.set(question.round, (map.get(question.round) ?? 0) + 1);
    return map;
  }, []);
  const sourced = useMemo(() => radarQuestions.filter((question) => question.confidence === "first_party").length, []);

  return (
    <section className="rad" aria-label="2027 interview radar">
      <header className="rad-head">
        <span className="rad-kicker">
          <Radar size={14} /> 2027 HIRING CYCLE · {radarQuestions.length} QUESTIONS · {radarRounds.length} ROUNDS · COMPILED {radarCompiledOn.toUpperCase()}
        </span>
        <h1>What the 2027 loop <em>is actually asking.</em></h1>
        <p>
          Interviewers are not asking the old questions any more, because an assistant answers them in
          seconds. This page is the replacement set, read off the write-ups the companies and the people
          running these loops published themselves: the AI-pairing round, code you did not write, your own
          project taken apart, and the design rounds that now end in “how would you know it works”.
        </p>
        <div className="rad-actions">
          <button type="button" className="rad-primary" onClick={onPractice}>
            Train the part still gating <ArrowRight size={16} />
          </button>
          <button type="button" className="rad-ghost" onClick={onOpenPatterns}>
            <Layers size={15} /> 16 pattern films
          </button>
          <span className="rad-count">{sourced} first-party · {radarQuestions.length - sourced} reported · every card links to its source</span>
        </div>
      </header>

      <section className="rad-panel" aria-label="What changed">
        <h2><Target size={16} /> What changed between your seniors’ loop and yours</h2>
        <div className="rad-shifts">
          {radarShifts.map((shift) => (
            <article key={shift.headline}>
              <strong>{shift.headline}</strong>
              <p>{shift.detail}</p>
              <a href={shift.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /> {shift.source}</a>
            </article>
          ))}
        </div>
      </section>

      <div className="rad-chips" role="group" aria-label="Filter by round">
        <button type="button" className={round === "all" ? "on" : ""} onClick={() => setRound("all")}>
          All · {radarQuestions.length}
        </button>
        {radarRounds.map((item) => (
          <button type="button" key={item.id} className={round === item.id ? "on" : ""} onClick={() => setRound(item.id)}>
            {item.name} · {counts.get(item.id) ?? 0}
          </button>
        ))}
      </div>

      {round !== "all" && (
        <p className="rad-blurb">
          <strong>{radarRounds.find((item) => item.id === round)?.name}</strong> — {radarRounds.find((item) => item.id === round)?.blurb}{" "}
          <em>{radarRounds.find((item) => item.id === round)?.who}</em>
        </p>
      )}

      <div className="rad-list">
        {shown.map((question) => <QuestionCard key={question.id} question={question} />)}
      </div>

      <section className="rad-panel" aria-label="Who allows AI in the interview">
        <h2><ShieldCheck size={16} /> Can you use AI in the room?</h2>
        <p className="rad-banner">
          Read this as a list of things to check, not as permission. Every row except Canva’s is somebody
          else reporting a rule that changes with each hiring season, and the ones that changed most were
          still being quoted wrong in 2026. The invite email and your recruiter outrank this table.
        </p>
        <ul className="rad-policy">
          {radarPolicy.map((row) => (
            <li key={`${row.company}-${row.stance}`}>
              <span className={`rad-stance ${row.stance}`}>{stanceLabel[row.stance]}</span>
              <div>
                <strong>{row.company}</strong>
                <p>{row.detail}</p>
                <a href={row.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={12} /> {row.source} · {row.confidence === "first_party" ? "the company itself" : "third-party tracker"}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rad-panel" aria-label="What not to believe">
        <h2><TriangleAlert size={16} /> Four things being said about 2027 that cost students offers</h2>
        <div className="rad-myths">
          {radarMyths.map((myth) => (
            <article key={myth.myth}>
              <strong className="rad-myth">{myth.myth}</strong>
              <p>{myth.reality}</p>
              <a href={myth.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /> {myth.source}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="rad-panel rad-use" aria-label="How to use this page">
        <h2><BadgeCheck size={16} /> How to work through it</h2>
        <ol>
          <li>Pick the round you are weakest on, not the fashionable one. If your project cannot survive “why this architecture?”, that is the round losing you offers.</li>
          <li>For every DSA card, drill the named pattern in the film, then solve the tier-1 problems in the sheet against a clock — the 2027 version still filters on recognition speed.</li>
          <li>Rehearse the AI-pairing round out loud, alone, with an assistant open and a timer running. Nobody else is practising this, which is exactly why it is worth the hour.</li>
          <li>Write the six behavioural stories in your notes and tag each one against a quality. Then check your reasoning with Guru before you say it to a stranger.</li>
        </ol>
        <button type="button" className="rad-ghost" onClick={onOpenStories}>
          Read what real candidates sat through <ArrowRight size={15} />
        </button>
      </section>

      <p className="rad-foot">
        Patterns this page points you at: {radarPatternLinks().join(" · ")}. Compiled from public
        write-ups on {radarCompiledOn} — it is a map of the round structure, not next month’s question
        sheet, and it says so on every card.
      </p>
    </section>
  );
}
