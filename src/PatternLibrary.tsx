// The pattern library: every one of the 16 sheet patterns as a teachable card,
// plus the lesson film that explains it. The captions carry the teaching and the
// browser's speech engine reads them out, so a lesson can be published without
// the author ever recording a voice. Under each caption the real DSA kernel runs
// the algorithm step by step - no canned animation.
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, CirclePlay, Download, ExternalLink, Layers, Pause, Presentation, RotateCcw, ScrollText, Timer, Volume2, VolumeX } from "lucide-react";
import type { Problem } from "./dsaSheet";
import { dsaMetrics } from "./dsa-labs-kernels";
import { renderDsaFrame } from "./DsaLabViews";
import { filmLength, interviewPlan, interviewTier, patternCards, tierLabels, vttFor, type PatternCard } from "./dsaPatterns";
import { downloadPatternDeck } from "./studyPack";
import { filmNarration, patternSimByName, patternSimFrames, patternSimHeading, simCut } from "./pattern-sims";
import { speak, stopSpeaking, voiceSupported, onVoiceStateChange } from "./mentor-voice";
import { useUiLanguage, uiLanguages, type UiLanguage } from "./i18n";
import "./pattern-library.css";

type Status = "Todo" | "In progress" | "Solved";
type Props = {
  problems: Problem[];
  progress: Record<number, { status: Status; notes: string }>;
  onPractice: () => void;
};

const stepOf = (card: PatternCard, elapsed: number) => {
  let index = 0;
  for (let i = 0; i < card.film.length; i += 1) if (elapsed >= card.film[i].at) index = i;
  return index;
};

// A sentence the engine never finishes must not stall the film forever. The
// spoken line is the caption plus the code reading plus the live state, so the
// allowance is a long one.
const VOICE_GUARD_MS = 70000;

export default function PatternLibrary({ problems, progress, onPractice }: Props) {
  const appLang = useUiLanguage();
  const [openCard, setOpenCard] = useState<PatternCard | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [voiced, setVoiced] = useState(voiceSupported);
  const [narrLang, setNarrLang] = useState<UiLanguage>(appLang);
  // Set to the next caption boundary while a sentence is still being read: the
  // film waits for the voice instead of running the caption off the screen.
  const [holdAt, setHoldAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  // Re-clicking the same card restarts the film, so the scroll is keyed on the
  // viewing session rather than the card alone.
  const [session, setSession] = useState(0);
  // A .pptx is assembled in the browser, so the card that started it owns the notice.
  const [deckFor, setDeckFor] = useState<string | null>(null);
  const [deckNote, setDeckNote] = useState<{ pattern: string; ok: boolean; text: string } | null>(null);
  const filmRef = useRef<HTMLElement | null>(null);
  const speakToken = useRef(0);

  const total = openCard ? filmLength(openCard) : 0;
  const stepIndex = openCard ? stepOf(openCard, elapsed) : 0;
  const frames = useMemo(() => (openCard ? patternSimFrames(openCard.name) : []), [openCard]);
  const cut = openCard ? simCut(openCard, frames.length, elapsed, stepIndex) : { index: 0, head: 1 };
  const frame = frames[cut.index];
  // What the voice is saying for this step, shown so a silent viewer gets the
  // same lesson as one watching with the browser's voice on.
  const reading = useMemo(() => (openCard ? filmNarration(openCard, stepIndex) : null), [openCard, stepIndex]);

  useEffect(() => onVoiceStateChange(setSpeaking), []);

  useEffect(() => {
    if (!playing || !openCard) return;
    const ceiling = holdAt === null ? total : Math.min(total, holdAt);
    const step = 0.25 * rate;
    const stop = window.setInterval(() => setElapsed((value) => Math.max(value, Math.min(value + step, ceiling))), 250);
    return () => window.clearInterval(stop);
  }, [playing, openCard, rate, holdAt, total]);

  useEffect(() => {
    if (openCard && elapsed >= total) {
      setPlaying(false);
      setFinished(true);
    }
  }, [elapsed, openCard, total]);

  useEffect(() => {
    if (openCard) filmRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openCard, session]);

  // One sentence per caption step, chained by the speech engine's own end event,
  // so the pacing of the lesson is the pacing of the voice.
  useEffect(() => {
    if (!openCard) return;
    if (!voiced || !playing) {
      // A film that ran to the end lets its last sentence finish; a hand on
      // pause, voice off or a new step cuts the current one.
      if (!finished) {
        speakToken.current += 1;
        stopSpeaking();
      }
      setHoldAt(null);
      return;
    }
    const last = stepIndex === openCard.film.length - 1;
    // The caption, the highlighted line of the skeleton and the live state, read
    // as one sentence: the voice teaches the code, not a script written next to it.
    speakToken.current += 1;
    const token = speakToken.current;
    const started = speak(filmNarration(openCard, stepIndex).script, {
      lang: narrLang,
      mood: last ? "proud" : "think",
      onEnd: () => { if (token === speakToken.current) setHoldAt(null); },
    });
    if (!started || last) return;
    setHoldAt(openCard.film[stepIndex + 1].at);
    const guard = window.setTimeout(() => { if (token === speakToken.current) setHoldAt(null); }, VOICE_GUARD_MS);
    return () => window.clearTimeout(guard);
  }, [voiced, playing, openCard, stepIndex, narrLang, session, finished]);

  useEffect(() => () => stopSpeaking(), []);

  const stats = useMemo(() => patternCards.map((card) => {
    const list = problems.filter((problem) => problem.pattern === card.name);
    const solved = list.filter((problem) => progress[problem.number]?.status === "Solved").length;
    return { card, total: list.length, solved, percent: list.length ? Math.round((solved / list.length) * 100) : 0 };
  }), [problems, progress]);

  const tierOne = useMemo(() => {
    const list = problems.filter((problem) => interviewTier(problem) === 1);
    return { total: list.length, solved: list.filter((problem) => progress[problem.number]?.status === "Solved").length };
  }, [problems, progress]);

  const weakest = [...stats].sort((a, b) => a.percent - b.percent)[0];

  const openFilm = (card: PatternCard) => {
    setOpenCard(card);
    setElapsed(0);
    setHoldAt(null);
    setFinished(false);
    setPlaying(true);
    setSession((value) => value + 1);
  };

  const closeFilm = () => {
    speakToken.current += 1;
    stopSpeaking();
    setOpenCard(null);
    setPlaying(false);
    setHoldAt(null);
  };

  const toggleVoice = () => {
    if (voiced) {
      speakToken.current += 1;
      stopSpeaking();
      setHoldAt(null);
    }
    setVoiced((value) => !value);
  };

  const nudgeFrames = (delta: number) => {
    if (!openCard || !frames.length) return;
    setHoldAt(null);
    setFinished(false);
    setElapsed(Math.min(total, Math.max(0, elapsed + delta * cut.head)));
  };

  const downloadCaptions = (card: PatternCard) => {
    // The same three sentences the voice reads, so a downloaded .vtt is a
    // transcript of the film rather than a caption list.
    const blob = new Blob([vttFor(card, (index) => filmNarration(card, index).lines.join("\n"))], { type: "text/vtt;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${card.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-captions.vtt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  async function downloadDeck(card: PatternCard) {
    setDeckFor(card.name);
    try {
      const meta = await downloadPatternDeck(card);
      setDeckNote({
        pattern: card.name,
        ok: true,
        text: `${meta.fileName} - ${meta.slides} slides with speaker notes on every one, and all ${meta.assignments} ${card.name} problems from the sheet as the assignments.`,
      });
    } catch (error) {
      setDeckNote({
        pattern: card.name,
        ok: false,
        text: `${card.name}: the deck did not build - ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setDeckFor(null);
    }
  }

  return (
    <div className="pattern-library">
      <header className="pattern-summary">
        <div>
          <span className="pattern-kicker">CODEXSHEET · PATTERN LIBRARY</span>
          <h2>16 patterns, 250 problems, taught on screen and out loud</h2>
          <p>The sheet tells you which problem to solve. This tells you how to recognise the pattern, what the skeleton looks like, and how to say it in the room. Every lesson runs the real algorithm under the caption and can be read aloud in your language by the browser's own voice - or played silent with subtitles you can export.</p>
        </div>
        <dl className="pattern-stat-strip">
          <div><dt>Must-know solved</dt><dd>{tierOne.solved}<span>/{tierOne.total}</span></dd></div>
          <div><dt>Patterns touched</dt><dd>{stats.filter((row) => row.solved > 0).length}<span>/16</span></dd></div>
          <div><dt>Weakest pattern</dt><dd className="pattern-weak-name">{weakest.card.name}</dd><span>{weakest.percent}%</span></div>
        </dl>
      </header>

      <section className="pattern-track" aria-labelledby="pattern-track-title">
        <h3 id="pattern-track-title">Interview-wise: eight weeks in order</h3>
        <ol className="pattern-weeks">
          {interviewPlan.map((week) => (
            <li key={week.week}>
              <span className="pattern-week-number">W{week.week}</span>
              <strong>{week.focus.join(" + ")}</strong>
              <p>{week.goal}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="pattern-grid">
        {stats.map(({ card, total: cardTotal, solved, percent }) => (
          <article className="pattern-card" key={card.name}>
            <header>
              <span className={`pattern-tier tier-${card.tier}`}>{tierLabels[card.tier]}</span>
              <h4>{card.name}</h4>
              <p>{card.tagline}</p>
            </header>
            <div className="pattern-progress"><i style={{ width: `${percent}%` }} /></div>
            <span className="pattern-count">{solved} of {cardTotal} solved</span>
            <p className="pattern-cue">{card.cue}</p>
            <footer>
              <button type="button" className="primary-button" onClick={() => openFilm(card)}><CirclePlay size={15} /> Watch the film</button>
              <button type="button" className="secondary-button" onClick={() => void downloadDeck(card)} disabled={deckFor === card.name}>
                <Presentation size={15} /> {deckFor === card.name ? "Building…" : "Deck .pptx"}
              </button>
              <button type="button" className="secondary-button" onClick={() => downloadCaptions(card)}><Download size={15} /> Captions</button>
            </footer>
          </article>
        ))}
      </div>

      {deckNote && <p className={`pattern-deck-note${deckNote.ok ? "" : " bad"}`}>{deckNote.text}</p>}
      {openCard && (() => {
        const step = openCard.film[stepIndex];
        const sim = patternSimByName[openCard.name];
        const metrics = frame ? dsaMetrics(frame, frames) : [];
        const rows = problems.filter((problem) => problem.pattern === openCard.name);
        const grouped = [1, 2, 3].map((tier) => ({
          tier: tier as 1 | 2 | 3,
          items: rows.filter((problem) => interviewTier(problem) === tier),
        })).filter((group) => group.items.length > 0);
        return (
          <section ref={filmRef} className="pattern-film" aria-label={`${openCard.name} lesson`}>
            <header className="pattern-film-head">
              <div>
                <span className="pattern-kicker">{voiced && playing ? "LESSON FILM · SPOKEN CAPTIONS" : "LESSON FILM · SILENT CAPTIONS"}</span>
                <h3>{openCard.name}</h3>
                <p>{openCard.complexity}</p>
              </div>
              <div className="pattern-film-controls">
                <button type="button" className="secondary-button" onClick={() => setPlaying((value) => !value)}>
                  {playing ? <Pause size={15} /> : <CirclePlay size={15} />} {playing ? "Pause" : "Play"}
                </button>
                <button type="button" className="secondary-button" onClick={() => openFilm(openCard)}><RotateCcw size={15} /> Restart</button>
                <button type="button" className="secondary-button" onClick={() => setRate(rate === 1 ? 1.5 : 1)}><Timer size={15} /> {rate}x</button>
                <button
                  type="button"
                  className={`secondary-button voice-toggle${voiced ? " on" : ""}`}
                  onClick={toggleVoice}
                  disabled={!voiceSupported}
                  aria-pressed={voiced}
                >
                  {voiced ? <Volume2 size={15} /> : <VolumeX size={15} />} {voiced ? "Voice on" : "Voice off"}
                </button>
                {voiced && (
                  <label className="pattern-film-voice-lang">
                    <span>VOICE</span>
                    <select value={narrLang} onChange={(event) => setNarrLang(event.target.value as UiLanguage)} aria-label="Narration language">
                      {uiLanguages.map((entry) => <option key={entry.id} value={entry.id}>{entry.native}</option>)}
                    </select>
                  </label>
                )}
                <button type="button" className="secondary-button" onClick={() => downloadCaptions(openCard)}><Download size={15} /> .vtt</button>
                <button type="button" className="secondary-button" onClick={closeFilm}>Close</button>
              </div>
            </header>

            <div className="pattern-film-caption">
              <span className="pattern-film-step">
                Step {stepIndex + 1} of {openCard.film.length}
                {voiced && (speaking || holdAt !== null) ? " · speaking" : ""}
              </span>
              <div className="pattern-film-caption-body">
                <div className="pattern-film-idea">
                  <strong>{step.title}</strong>
                  <p>{step.caption}</p>
                </div>
                {reading && (reading.code || reading.board) && (
                  <ul className="pattern-film-read">
                    {reading.code && <li><span>CODE READS</span>{reading.code}</li>}
                    {reading.board && <li><span>BOARD SAYS</span>{reading.board}</li>}
                  </ul>
                )}
              </div>
            </div>

            <div className="pattern-film-stage">
              <pre className="pattern-film-code">
                {openCard.template.map((line, index) => (
                  <span key={index} className={index === step.line ? "is-live" : ""}>{line || " "}{index < openCard.template.length - 1 ? "\n" : ""}</span>
                ))}
              </pre>

              {frame && sim && (
                <div className="pattern-film-sim">
                  <header className="pattern-film-sim-head">
                    <div>
                      <span className="pattern-kicker">LIVE SIMULATION · {patternSimHeading(openCard.name).toUpperCase()}</span>
                      <p>{sim.lens}</p>
                    </div>
                    <div className="pattern-film-sim-step">
                      <button type="button" className="secondary-button" onClick={() => nudgeFrames(-1)} aria-label="Previous simulation step"><ChevronLeft size={15} /></button>
                      <span>step {cut.index + 1} / {frames.length}</span>
                      <button type="button" className="secondary-button" onClick={() => nudgeFrames(1)} aria-label="Next simulation step"><ChevronRight size={15} /></button>
                      <code title="The exact input the kernel was run with">{sim.input}</code>
                    </div>
                  </header>
                  <div className="pattern-film-sim-stage">
                    <div className="pattern-film-frame" key={cut.index}>{renderDsaFrame(frame)}</div>
                  </div>
                  <p className="pattern-film-sim-caption">{frame.caption}</p>
                  <p className="pattern-film-sim-detail">{frame.detail}</p>
                  {metrics.length > 0 && (
                    <div className="pattern-film-sim-metrics">
                      {metrics.map((metric) => (
                        <div key={metric.label} title={metric.hint}>
                          <span>{metric.label}</span>
                          <strong>{metric.value}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pattern-film-timeline">
              <i style={{ width: `${(elapsed / total) * 100}%` }} />
              {openCard.film.map((cue, index) => (
                <button key={cue.at} type="button" className={index === stepIndex ? "on" : ""} aria-label={`Jump to ${cue.title}`} onClick={() => { setFinished(false); setHoldAt(null); setElapsed(cue.at); }} />
              ))}
            </div>

            <div className="pattern-film-notes">
              <div>
                <h4>How to spot it</h4>
                <p>{openCard.cue}</p>
                <h4>Shows up as</h4>
                <ul>{openCard.variants.map((variant) => <li key={variant}>{variant}</li>)}</ul>
              </div>
              <div className="pattern-film-problems">
                <h4><Layers size={14} /> The sheet for this pattern</h4>
                {grouped.map((group) => (
                  <div key={group.tier}>
                    <span className={`pattern-tier tier-${group.tier}`}>{tierLabels[group.tier]}</span>
                    <ul>
                      {group.items.slice(0, group.tier === 3 ? 8 : 40).map((problem) => {
                        const done = progress[problem.number]?.status === "Solved";
                        return (
                          <li key={problem.number}>
                            <a href={problem.link} target="_blank" rel="noreferrer">
                              {done && <Check size={13} />}
                              <span className="pattern-problem-number">{problem.number}</span>
                              <span className="pattern-problem-title">{problem.title}</span>
                              <span className="pattern-problem-diff">{problem.difficulty[0]}</span>
                              <ExternalLink size={13} />
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                <button type="button" className="primary-button" onClick={onPractice}><ScrollText size={15} /> Open the sheet</button>
              </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
