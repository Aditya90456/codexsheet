import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, AudioLines, BookOpen, Check, ChevronRight, CircleHelp, Headphones, Mic2, Sparkles, Waves } from "lucide-react";
import { courseLessons, courseUnits, lessonsForUnit } from "./deva-course-lessons";
import "./dsa-voice-course.css";

const AGENT_ID = "agent_8401m7z5s784f9qt2c4gxeewfx35";
const TALK_URL = `https://elevenlabs.io/app/talk-to?agent_id=${AGENT_ID}`;
const STORAGE_KEY = "dsa-voice-course:completed";

function readProgress(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export default function DsaVoiceCourse() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState<string[]>(readProgress);
  const [activeLesson, setActiveLesson] = useState(courseLessons[0]);
  const [openUnit, setOpenUnit] = useState(courseUnits[0]?.id ?? "");
  const completedSet = new Set(completed);
  const progress = Math.round((completed.length / courseLessons.length) * 100);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;
    const attach = () => {
      if (cancelled || !mount.isConnected || mount.querySelector("elevenlabs-convai")) return;
      const widget = document.createElement("elevenlabs-convai");
      widget.setAttribute("agent-id", AGENT_ID);
      widget.setAttribute("variant", "expanded");
      mount.appendChild(widget);
      setReady(true);
    };
    if (customElements.get("elevenlabs-convai")) {
      attach();
      return () => { cancelled = true; };
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-elevenlabs-convai="true"]');
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", attach, { once: true });
    if (!existing) {
      script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
      script.async = true;
      script.type = "text/javascript";
      script.dataset.elevenlabsConvai = "true";
      document.body.appendChild(script);
    }
    return () => {
      cancelled = true;
      script.removeEventListener("load", attach);
    };
  }, []);

  const toggleDone = () => {
    const next = completedSet.has(activeLesson.id)
      ? completed.filter((id) => id !== activeLesson.id)
      : [...completed, activeLesson.id];
    setCompleted(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <main className="dsa-voice-course">
      <header className="dvc-topline"><span className="dvc-brand-mark"><AudioLines size={17} /></span><span>CODEXSHEET <i>/</i> VOICE COURSE</span><span className="dvc-topline-spacer" /><span className="dvc-level"><Sparkles size={13} /> BEGINNER FRIENDLY</span></header>
      <section className="dvc-hero">
        <div className="dvc-hero-copy">
          <span className="dvc-kicker"><Waves size={14} /> YOUR PERSONAL DSA VOICE COURSE</span>
          <h1>Think it through.<br /><em>Say it out loud.</em></h1>
          <p>Build problem-solving instincts in short voice lessons. Ask questions, request hints, and explain your reasoning to Priya as you learn.</p>
          <a className="dvc-start-link" href={TALK_URL} target="_blank" rel="noreferrer"><Mic2 size={16} /> Start a voice lesson <ArrowUpRight size={16} /></a>
          <div className="dvc-proof"><span><Headphones size={14} /> Hands-free learning</span><span><BookOpen size={14} /> {courseLessons.length} guided concepts</span></div>
        </div>
        <div className="dvc-priya-card">
          <div className="dvc-priya-orb"><span /><AudioLines size={38} /></div>
          <span className="dvc-online"><i /> YOUR TUTOR</span>
          <h2>Priya</h2>
          <p>Patient DSA coach · Ask anything, one step at a time</p>
          <div className="dvc-waveform" aria-hidden="true">{Array.from({ length: 31 }, (_, i) => <i key={i} style={{ height: `${8 + ((i * 13 + 7) % 21)}px` }} />)}</div>
          <span className="dvc-priya-caption">Ready to learn with you</span>
        </div>
      </section>

      <section className="dvc-session-grid">
        <div className="dvc-session-main">
          <div className="dvc-section-heading"><div><span className="dvc-section-kicker">VOICE SESSION</span><h2>Pick up with Priya</h2></div><span className="dvc-topic-tag">{activeLesson.pattern}</span></div>
          <div className="dvc-live-panel">
            <div className="dvc-live-heading"><span className="dvc-mini-orb"><Waves size={17} /></span><div><strong>Talk through {activeLesson.title}</strong><small>{ready ? "Priya is ready whenever you are" : "Preparing your voice room"}</small></div><span className="dvc-live-indicator"><i /> LIVE</span></div>
            <div className="dvc-widget-mount" ref={mountRef}>
              {!ready && <div className="dvc-widget-placeholder"><span className="dvc-mic-halo"><Mic2 size={23} /></span><strong>Your voice room is getting ready</strong><small>Allow microphone access when your browser asks.</small><a href={TALK_URL} target="_blank" rel="noreferrer">Open Priya in ElevenLabs <ArrowUpRight size={13} /></a></div>}
            </div>
            <div className="dvc-session-foot"><span><CircleHelp size={14} /> Start with a question or ask for a hint.</span><span>Voice powered by ElevenLabs</span></div>
          </div>
          <div className="dvc-try-prompts"><span>NEED A STARTING POINT?</span><p>“Priya, can you explain the idea behind {activeLesson.title} without showing me the solution?”</p><p>“Ask me one question at a time so I can find the pattern myself.”</p></div>
        </div>
        <aside className="dvc-progress-card">
          <span className="dvc-section-kicker">YOUR COURSE</span><div className="dvc-progress-title"><strong>Learning progress</strong><b>{progress}%</b></div>
          <div className="dvc-progress-track"><span style={{ width: `${progress}%` }} /></div>
          <small>{completed.length} of {courseLessons.length} concepts completed</small>
          <button type="button" className={`dvc-complete-button${completedSet.has(activeLesson.id) ? " is-done" : ""}`} onClick={toggleDone}>{completedSet.has(activeLesson.id) ? <><Check size={15} /> Lesson completed</> : <>Mark “{activeLesson.title}” complete <Check size={15} /></>}</button>
          <div className="dvc-selected-topic"><span>NEXT UP WITH PRIYA</span><strong>{activeLesson.title}</strong><small>{activeLesson.goal}</small></div>
        </aside>
      </section>

      <section className="dvc-curriculum">
        <div className="dvc-section-heading"><div><span className="dvc-section-kicker">THE LEARNING PATH</span><h2>Choose a concept to explore</h2></div><span className="dvc-self-paced">Learn at your own pace</span></div>
        {courseUnits.map((unit, index) => {
          const lessons = lessonsForUnit(unit.id);
          const expanded = openUnit === unit.id;
          const doneCount = lessons.filter((lesson) => completedSet.has(lesson.id)).length;
          return <section className={`dvc-unit${expanded ? " expanded" : ""}`} key={unit.id}>
            <button type="button" className="dvc-unit-toggle" onClick={() => setOpenUnit(expanded ? "" : unit.id)} aria-expanded={expanded}>
              <span className="dvc-unit-number">{String(index + 1).padStart(2, "0")}</span><span className="dvc-unit-copy"><strong>{unit.title}</strong><small>{unit.blurb}</small></span><span className="dvc-unit-count">{doneCount}/{lessons.length} DONE</span><ChevronRight size={17} className="dvc-unit-chevron" />
            </button>
            {expanded && <div className="dvc-lessons">{lessons.map((lesson, lessonIndex) => <button type="button" key={lesson.id} className={`dvc-lesson${activeLesson.id === lesson.id ? " selected" : ""}`} onClick={() => { setActiveLesson(lesson); document.querySelector(".dvc-session-grid")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
              <span className={`dvc-lesson-index${completedSet.has(lesson.id) ? " done" : ""}`}>{completedSet.has(lesson.id) ? <Check size={13} /> : String(lessonIndex + 1).padStart(2, "0")}</span><span className="dvc-lesson-text"><strong>{lesson.title}</strong><small>{lesson.pattern} <i>·</i> {lesson.complexity.split("·")[0].trim()}</small></span><span className="dvc-lesson-action">Explore with Priya <ChevronRight size={14} /></span>
            </button>)}</div>}
          </section>;
        })}
      </section>
      <footer className="dvc-footer"><span>Small steps. Clear thinking. Stronger problem-solving.</span><a href={TALK_URL} target="_blank" rel="noreferrer">Open voice tutor <ArrowUpRight size={13} /></a></footer>
    </main>
  );
}
