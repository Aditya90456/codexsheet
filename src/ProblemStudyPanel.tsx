// ProblemStudyPanel.tsx — the panel a sheet row opens: how to approach this exact
// question, then the live board that shows the pattern working. It is the answer to
// "I can see the problem but I cannot see the shape of it".

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Pause, Play, RotateCcw, Sparkles, TriangleAlert, X } from "lucide-react";
import type { Problem } from "./dsaSheet";
import { sheetVoice, studyBlockVoice, studyTabVoice } from "./sheetVoice";
import { approachFor, boardFor, topicPlaybook } from "./problemCoach";
import { renderDsaFrame } from "./DsaLabViews";

type Props = {
  problem: Problem;
  status: string;
  onClose: () => void;
  onPractice: (problem: Problem) => void;
};

const TABS = ["approach", "board"] as const;
type Tab = (typeof TABS)[number];

export default function ProblemStudyPanel({ problem, status, onClose, onPractice }: Props) {
  const [tab, setTab] = useState<Tab>("approach");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const approach = useMemo(() => approachFor(problem), [problem]);
  const board = useMemo(() => boardFor(problem), [problem]);
  const playbook = useMemo(() => topicPlaybook(problem.topic), [problem.topic]);
  const lastStep = Math.max(0, board.frames.length - 1);
  const frame = board.frames[Math.min(step, lastStep)];

  useEffect(() => { setStep(0); setPlaying(false); setTab("approach"); }, [problem.number]);

  useEffect(() => {
    if (!playing || tab !== "board" || !board.frames.length) return;
    const timer = window.setInterval(() => {
      setStep((value) => {
        if (value >= lastStep) { setPlaying(false); return value; }
        return value + 1;
      });
    }, 1100);
    return () => window.clearInterval(timer);
  }, [playing, tab, lastStep, board.frames.length]);

  return (
    <aside className="pstudy" aria-label={`How to approach ${problem.title}`}>
      <header className="pstudy-head">
        <div className="pstudy-idline">
          <span className="pstudy-number">{String(problem.number).padStart(3, "0")}</span>
          <span className={`pstudy-level ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
          <span className="pstudy-state">{status}</span>
        </div>
        <h3>{problem.title}</h3>
        <div className="pstudy-meta">
          <span className="pattern-pill">{problem.pattern}</span>
          <span>{problem.topic}</span>
          <span>week {problem.week}</span>
          <span>{approach.tierLabel}</span>
        </div>
        <button type="button" className="pstudy-close" onClick={onClose} aria-label="Close the study panel"><X size={15} /></button>
      </header>

      <div className="nav nav-pills pstudy-tabs" role="tablist" aria-label="Study view">
        <button type="button" role="tab" aria-selected={tab === "approach"} className={`nav-link${tab === "approach" ? " active" : ""}`} onClick={() => setTab("approach")}>{studyTabVoice.approach}</button>
        <button type="button" role="tab" aria-selected={tab === "board"} className={`nav-link${tab === "board" ? " active" : ""}`} onClick={() => setTab("board")}>{studyTabVoice.board}<small>{board.frames.length} steps</small></button>
      </div>

      {tab === "approach" && <div className="pstudy-body">
        <section className="pstudy-block">
          <span className="pstudy-label"><Sparkles size={12} /> {studyBlockVoice.recognise}</span>
          <p>{approach.recognize}</p>
        </section>
        <section className="pstudy-block">
          <span className="pstudy-label">{studyBlockVoice.ladder}</span>
          <ol className="pstudy-ladder">{approach.ladder.map((move, index) => <li key={index}><b>{index + 1}</b><span>{move}</span></li>)}</ol>
        </section>
        <section className="pstudy-block">
          <span className="pstudy-label">{studyBlockVoice.traps}</span>
          <ul className="pstudy-traps">{approach.traps.map((trap, index) => <li key={index}><TriangleAlert size={13} /><span>{trap}</span></li>)}</ul>
        </section>
        {approach.template.length > 0 && <section className="pstudy-block">
          <span className="pstudy-label">{studyBlockVoice.skeleton}</span>
          <pre className="pstudy-code">{approach.template.join("\n")}</pre>
          <div className="pstudy-variants">{approach.variants.map((variant) => <span key={variant} className="pstudy-variant">{variant}</span>)}</div>
          {approach.complexity && <p className="pstudy-cost"><b>{studyBlockVoice.cost}</b> {approach.complexity}</p>}
        </section>}
        <section className="pstudy-block pstudy-topic">
          <span className="pstudy-label">{studyBlockVoice.topic}</span>
          <p>{playbook.shape}</p>
          <ul>{playbook.checks.map((check, index) => <li key={index}>{check}</li>)}</ul>
          <p className="pstudy-start"><b>{studyBlockVoice.start}:</b> {playbook.start}</p>
        </section>
      </div>}

      {tab === "board" && <div className="pstudy-body">
        <section className="pstudy-board" aria-live="polite">
          <div className="pstudy-board-head">
            <strong>{board.heading}</strong>
            <span>{sheetVoice.boardNote(problem.pattern)}</span>
          </div>
          <div className="pstage">{frame ? renderDsaFrame(frame) : <p className="pstudy-empty">{sheetVoice.boardEmpty}</p>}</div>
          {frame && <div className="pstudy-caption"><span>{studyBlockVoice.step(Math.min(step, lastStep) + 1, board.frames.length)}</span><strong>{frame.caption}</strong><p>{frame.detail}</p></div>}
          <div className="pstudy-controls">
            <button type="button" onClick={() => { setPlaying(false); setStep(0); }} disabled={!step} aria-label="Restart the board"><RotateCcw size={14} /></button>
            <button type="button" onClick={() => { setPlaying(false); setStep((value) => Math.max(0, value - 1)); }} disabled={!step} aria-label="Previous step">&lsaquo;</button>
            <button type="button" className="pstudy-play" onClick={() => setPlaying((value) => !value)} disabled={!board.frames.length}>{playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Play</>}</button>
            <button type="button" onClick={() => { setPlaying(false); setStep((value) => Math.min(lastStep, value + 1)); }} disabled={step >= lastStep} aria-label="Next step">&rsaquo;</button>
            <input type="range" min={0} max={lastStep} value={Math.min(step, lastStep)} onChange={(event) => { setPlaying(false); setStep(Number(event.target.value)); }} aria-label="Scrub the board" />
          </div>
          {board.metrics.length > 0 && <div className="pstudy-metrics">{board.metrics.map((metric) => <span key={metric.label} title={metric.hint}><b>{metric.label}</b>{metric.value}</span>)}</div>}
          {board.input && <p className="pstudy-input"><b>input</b> <code>{board.input}</code></p>}
          <p className="pstudy-lens">{board.lens}</p>
        </section>
      </div>}

      <footer className="pstudy-foot">
        <button type="button" className="pstudy-practice" onClick={() => onPractice(problem)}>{sheetVoice.openEditor} <ArrowRight size={14} /></button>
        <a className="pstudy-link" href={problem.link} target="_blank" rel="noreferrer">LeetCode <ExternalLink size={12} /></a>
        {problem.premium && problem.freeLink && <a className="pstudy-link" href={problem.freeLink} target="_blank" rel="noreferrer">free version <ExternalLink size={12} /></a>}
      </footer>
    </aside>
  );
}
