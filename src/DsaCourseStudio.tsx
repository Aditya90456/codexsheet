import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { EditorView, keymap, type ViewUpdate } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { ArrowRight, BookOpen, Braces, ChevronLeft, CirclePlay, Lightbulb, LoaderCircle, Pause, Repeat, RotateCcw, Send, Sparkles, Target, TriangleAlert, Volume2 } from "lucide-react";
import DevaStage from "./DevaStage";
import GuruFace from "./GuruFace";
import { uiLanguages, translate, useUiLanguage, type UiLanguage } from "./i18n";
import { speak, stopSpeaking, voiceSupported } from "./mentor-voice";
import type { MentorMood } from "./mentor-mood";
import { hindiStep, hindiTitle } from "./dsa-course-hindi";
import { courseLessons, courseUnits, lessonsForUnit, lessonDemoStdin, starterFor, type CourseLesson, type LessonStep } from "./deva-course-lessons";
import { judgeCases, outputsMatch, type JudgeCase, type Language } from "./deva-judge";

type CourseLanguage = Extract<Language, "JavaScript" | "Python">;
type CaseResult = { index: number; stdin: string; expected: string; actual: string; verdict: "Passed" | "Failed" | "Error" | "Running" | "Output"; note?: string };

const editorTheme = EditorView.theme({
  "&": { backgroundColor: "#101010", color: "#e9e3dc", fontSize: "12px", height: "100%" },
  ".cm-content": { caretColor: "#ffb37a", fontFamily: "'DM Mono', Consolas, monospace", lineHeight: "1.75" },
  ".cm-cursor": { borderLeftColor: "#ffb37a" },
  ".cm-gutters": { backgroundColor: "#0c0c0c", color: "#5d5560", border: "none" },
  ".cm-activeLine": { backgroundColor: "#10100e" },
  ".cm-activeLineGutter": { backgroundColor: "#10100e", color: "#c8b8a6" },
  ".cm-selectionBackground, ::selection": { backgroundColor: "#805336aa" },
}, { dark: true });

/** Judged fixtures when the lesson binds a real problem, otherwise one run-only demo case. */
function practiceCases(lesson: CourseLesson) {
  const judged = lesson.problemNumber ? judgeCases(lesson.problemNumber) : null;
  if (judged?.length) return { cases: judged, judged: true };
  return { cases: [{ stdin: lessonDemoStdin(lesson), expected: "" }], judged: false };
}

export default function DsaCourseStudio() {
  const uiLang = useUiLanguage();
  const [lessonId, setLessonId] = useState(courseLessons[0]?.id ?? "");
  const [language, setLanguage] = useState<CourseLanguage>("JavaScript");
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [code, setCode] = useState(() => starterFor(courseLessons[0]!, "JavaScript"));
  const [results, setResults] = useState<CaseResult[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState<"run" | "submit" | "ai" | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [done, setDone] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("deva-course:done") ?? "[]") as string[]; } catch { return []; }
  });
  const [teaching, setTeaching] = useState(false);
  const [teacherLang, setTeacherLang] = useState<UiLanguage>(uiLang);
  const [teacherMood, setTeacherMood] = useState<MentorMood>("think");
  const teachToken = useRef(0);
  const askRef = useRef<HTMLTextAreaElement>(null);

  const completed = new Set(done);
  const markDone = (id: string) => setDone((current) => (current.includes(id) ? current : [...current, id]));

  useEffect(() => {
    try { localStorage.setItem("deva-course:done", JSON.stringify(done)); } catch { /* storage is optional */ }
  }, [done]);

  const lesson = courseLessons.find((item) => item.id === lessonId) ?? courseLessons[0]!;
  const steps = lesson.steps;
  const step = steps[Math.min(stepIndex, steps.length - 1)] ?? steps[0]!;
  const practice = useMemo(() => practiceCases(lesson), [lesson]);
  const unit = courseUnits.find((entry) => entry.id === lesson.unit) ?? courseUnits[0]!;
  const unitIndex = Math.max(0, courseUnits.findIndex((entry) => entry.id === unit.id));
  const siblings = lessonsForUnit(unit.id);
  const lessonIndex = Math.max(0, siblings.findIndex((item) => item.id === lesson.id));
  const courseProgress = Math.round((completed.size / Math.max(1, courseLessons.length)) * 100);

  useEffect(() => {
    const saved = localStorage.getItem(`deva-course:${lesson.id}:${language}`);
    setCode(saved ?? starterFor(lesson, language));
    setStepIndex(0);
    setPlaying(false);
    setResults([]);
    setSummary(null);
    setAnswer(null);
  }, [lesson, language]);

  useEffect(() => {
    if (!playing || steps.length < 2) return;
    const timer = window.setInterval(() => setStepIndex((index) => {
      if (index >= steps.length - 1) {
        if (!loop) { setPlaying(false); return index; }
        return 0;
      }
      return index + 1;
    }), 3600 / speed);
    return () => window.clearInterval(timer);
  }, [playing, speed, loop, steps.length]);

  const stepsRef = useRef(steps); stepsRef.current = steps;
  const lessonRef = useRef(lesson); lessonRef.current = lesson;
  const teacherLangRef = useRef<UiLanguage>(teacherLang); teacherLangRef.current = teacherLang;

  /** One step, in the language the student chose. Hindi narration is authored; the rest speak the English track. */
  const spokenLine = (lessonIdValue: string, item: LessonStep, at: number, languageValue: UiLanguage) => {
    const hindi = languageValue === "hi" ? hindiStep(lessonIdValue, at) : null;
    return hindi ? `${hindi.title}. ${hindi.narration}` : `${item.title}. ${item.narration}`;
  };

  const narrateStep = (at: number, token: number) => {
    const item = stepsRef.current[at];
    const current = lessonRef.current;
    if (!item) { markDone(current.id); setTeaching(false); return; }
    setStepIndex(at);
    setTeacherMood(at === stepsRef.current.length - 1 ? "proud" : "think");
    const opening = at === 0 ? `${(teacherLangRef.current === "hi" ? hindiTitle(current.id) : null) ?? current.title}. ` : "";
    const started = speak(`${opening}${spokenLine(current.id, item, at, teacherLangRef.current)}`, {
      lang: teacherLangRef.current,
      mood: at === stepsRef.current.length - 1 ? "proud" : "think",
      onEnd: () => { if (token === teachToken.current) narrateStep(at + 1, token); },
    });
    if (!started) setTeaching(false);
  };

  const stopTeaching = () => { teachToken.current += 1; setTeaching(false); stopSpeaking(); };

  const startTeaching = () => {
    teachToken.current += 1;
    const token = teachToken.current;
    setPlaying(false);
    setTeaching(true);
    narrateStep(0, token);
  };

  const chooseTeacherLang = (next: UiLanguage) => {
    setTeacherLang(next);
    if (!teaching) return;
    teachToken.current += 1;
    stopSpeaking();
    narrateStep(stepIndex, teachToken.current);
  };

  const scrubTo = (next: number) => {
    if (teaching) stopTeaching();
    setPlaying(false);
    setStepIndex(next);
  };

  useEffect(() => { teachToken.current += 1; setTeaching(false); stopSpeaking(); }, [lessonId]);
  useEffect(() => () => stopSpeaking(), []);

  const practiceRef = useRef<(mode: "run" | "submit") => Promise<void>>(async () => {});
  const extensions = useMemo<Extension[]>(() => [
    language === "Python" ? python() : javascript(),
    keymap.of([{ key: "Mod-Enter", run: () => { void practiceRef.current("run"); return true; } }]),
    editorTheme,
  ], [language]);

  async function execute(stdin: string) {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: language === "Python" ? "python" : "javascript", source_code: code, stdin }),
    });
    const result = await response.json() as { status?: string; stdout?: string; stderr?: string; compile_output?: string; error?: string };
    if (result.error) return { text: "", verdict: "Error" as const, note: result.error };
    if (result.compile_output?.trim()) return { text: "", verdict: "Error" as const, note: result.compile_output.trim().split("\n").slice(0, 6).join("\n") };
    if (/time limit|timeout/i.test(result.stderr ?? "")) return { text: "", verdict: "Error" as const, note: "Time limit exceeded." };
    if (result.status && !/accepted|finished|completed/i.test(result.status)) return { text: result.stdout ?? "", verdict: "Error" as const, note: (result.stderr || result.status).trim().split("\n").slice(0, 6).join("\n") };
    return { text: (result.stdout ?? "").trim(), verdict: "Passed" as const, note: (result.stderr ?? "").trim() };
  }

  async function runPractice(mode: "run" | "submit") {
    setBusy(mode);
    setSummary(null);
    try {
      if (mode === "run") {
        const caseIndex = Math.min(stepIndex, practice.cases.length - 1);
        const outcome = await execute(practice.cases[caseIndex]?.stdin ?? "");
        setResults([{ index: caseIndex, stdin: practice.cases[caseIndex]?.stdin ?? "", expected: practice.cases[caseIndex]?.expected ?? "", actual: outcome.text, verdict: outcome.verdict === "Error" ? "Error" : "Output", note: outcome.note }]);
        setSummary(outcome.verdict === "Error" ? outcome.note || "Execution failed." : `Case ${caseIndex + 1} · output ${outcome.text || "(empty)"}`);
        return;
      }
      const collected: CaseResult[] = practice.cases.map((item, index) => ({ index, stdin: item.stdin, expected: item.expected, actual: "", verdict: "Running" }));
      setResults(collected);
      let passed = 0;
      for (let index = 0; index < practice.cases.length; index += 1) {
        const item = practice.cases[index]!;
        const outcome = await execute(item.stdin);
        const verdict = outcome.verdict === "Error" ? "Error" : outputsMatch(outcome.text, item.expected) ? "Passed" : "Failed";
        if (verdict === "Passed") passed += 1;
        collected[index] = { index, stdin: item.stdin, expected: item.expected, actual: outcome.text, verdict, note: outcome.note };
        setResults([...collected]);
      }
      setSummary(`${passed}/${practice.cases.length} cases ${practice.judged ? "judged" : "executed"}${passed === practice.cases.length && practice.judged ? " · Accepted" : ""}`);
      if (practice.judged && passed === practice.cases.length) markDone(lesson.id);
    } finally {
      setBusy(null);
    }
  }

  practiceRef.current = runPractice;

  async function askDev() {
    const text = question.trim();
    if (!text) return;
    setBusy("ai");
    setAnswer(null);
    try {
      const prompt = `Lesson: ${lesson.title} (${lesson.pattern}, ${lesson.complexity}).\nGoal: ${lesson.goal}\nStep ${stepIndex + 1}: ${step.title} — ${step.narration}\nLanguage: ${language}\nCode:\n${code.slice(0, 1300)}\n\nQuestion: ${text}`;
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gemini-3.6-flash", messages: [{ role: "user", content: prompt }] }),
      });
      const result = await response.json() as { answer?: string; error?: string };
      setAnswer(result.error ?? result.answer ?? "No answer returned.");
    } catch {
      setAnswer("Could not reach the tutor service.");
    } finally {
      setBusy(null);
    }
  }

  function editCode(value: string) {
    setCode(value);
    try { localStorage.setItem(`deva-course:${lesson.id}:${language}`, value); } catch { /* storage is optional */ }
  }

  return <section className="deva-course" aria-label="DSA course studio">
    <header className="deva-course-head">
      <div><span className="deva-course-kicker">DSA COURSE · UNIT {String(unitIndex + 1).padStart(2, "0")} — {unit.title.toUpperCase()}</span><h2>{lesson.title} <em>{lesson.pattern}</em></h2><p>{lesson.goal}</p></div>
      <div className="deva-course-headside">
        <label className="deva-course-picker"><span>LESSON {String(lessonIndex + 1).padStart(2, "0")} / {String(siblings.length).padStart(2, "0")} · {String(completed.size)} of {String(courseLessons.length).padStart(2, "0")} COURSE DONE</span>
          <select value={lesson.id} onChange={(event) => setLessonId(event.target.value)}>{courseUnits.map((entry) => <optgroup key={entry.id} label={entry.title}>{lessonsForUnit(entry.id).map((item) => <option key={item.id} value={item.id}>{completed.has(item.id) ? "✓ " : ""}{item.title}</option>)}</optgroup>)}</select>
        </label>
        {lesson.labTopic && <button type="button" className="deva-course-lab" onClick={() => window.dispatchEvent(new CustomEvent("codexsheet:goto", { detail: { view: "cslabs", topic: lesson.labTopic } }))}><CirclePlay size={13}/> Run it live in the lab</button>}
      </div>
    </header>
    <section className="deva-course-progress" aria-label="Course progress">
      <div className="deva-course-progress-copy"><span>YOUR LEARNING PATH</span><strong>{completed.size}<i> / {courseLessons.length}</i> lessons complete</strong><small>{courseProgress === 100 ? "Course complete — you did it." : `${courseLessons.length - completed.size} lessons left in your DSA journey`}</small></div>
      <div className="deva-course-progress-track" role="progressbar" aria-valuenow={courseProgress} aria-valuemin={0} aria-valuemax={100} aria-label={`${courseProgress}% of course complete`}><span style={{ width: `${courseProgress}%` }} /></div>
      <div className="deva-course-progress-percent">{courseProgress}<small>%</small></div>
      <div className="deva-course-progress-current"><span>UP NEXT IN YOUR PATH</span><strong>{lesson.title}</strong><small>Unit {String(unitIndex + 1).padStart(2, "0")} · Lesson {String(lessonIndex + 1).padStart(2, "0")}</small></div>
    </section>
    <div className="deva-course-units" aria-label="Course units">{courseUnits.map((entry, index) => {
      const items = lessonsForUnit(entry.id);
      const finished = items.filter((item) => completed.has(item.id)).length;
      return <section key={entry.id} className={`deva-course-unit${entry.id === lesson.unit ? " open" : ""}`}>
        <h3><span>UNIT {String(index + 1).padStart(2, "0")}</span><strong>{entry.title}</strong><small>{finished}/{items.length}</small><i>{entry.blurb}</i></h3>
        <div className="deva-course-outline">{items.map((item, position) => <button type="button" key={item.id} className={item.id === lesson.id ? "active" : completed.has(item.id) ? "complete" : ""} onClick={() => setLessonId(item.id)}><span>{completed.has(item.id) ? "✓" : String(position + 1).padStart(2, "0")}</span><strong>{item.title}</strong><small>{item.pattern}</small></button>)}</div>
      </section>;
    })}</div>
    <div className="deva-course-split">
      <section className="deva-course-stage-panel" aria-label="Animation panel">
        <div className="deva-course-panel-head"><span><CirclePlay size={13}/> {lesson.stage === "stack" ? "STACK VIEW" : "ARRAY STAGE"}</span><span>{lesson.complexity}</span></div>
        <DevaStage lesson={lesson} step={step} stepIndex={stepIndex} playing={playing} />
        <div className="deva-course-step-summary"><span>STEP {String(stepIndex + 1).padStart(2, "0")} OF {String(steps.length).padStart(2, "0")}</span><strong>{step.title}</strong><p>{step.narration}</p></div>
        {teaching && <div className="deva-course-teacher" aria-label="AI teacher">
          <GuruFace mood={teacherMood} speaking={teaching} moodLabel={translate(teacherMood === "proud" ? "mood.proud" : "mood.think", teacherLang)} className="deva-course-teacher-face" />
          <p className="deva-course-teacher-line">{spokenLine(lesson.id, step, stepIndex, teacherLang)}</p>
        </div>}
        <div className="deva-course-transport">
          <button type="button" onClick={() => scrubTo(0)} aria-label="Restart"><RotateCcw size={15}/></button>
          <button type="button" onClick={() => scrubTo(Math.max(0, stepIndex - 1))} disabled={stepIndex === 0} aria-label="Previous step"><ChevronLeft size={16}/></button>
          <button type="button" className="deva-course-play" onClick={() => { if (teaching) stopTeaching(); setPlaying((value) => !value); }}>{playing ? <Pause size={15}/> : <CirclePlay size={15}/>} {playing ? "Pause" : "Play"}</button>
          <button type="button" onClick={() => scrubTo(Math.min(steps.length - 1, stepIndex + 1))} disabled={stepIndex >= steps.length - 1} aria-label="Next step"><ArrowRight size={16}/></button>
          <input type="range" min={0} max={Math.max(0, steps.length - 1)} value={stepIndex} onChange={(event) => scrubTo(Number(event.target.value))} aria-label="Timeline" />
          <span className="deva-course-count">{String(stepIndex + 1).padStart(2, "0")}<i>/{String(steps.length).padStart(2, "0")}</i></span>
          <label className="deva-course-speed"><span>SPEED</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label>
          <button type="button" className={`deva-course-loop${loop ? " on" : ""}`} onClick={() => setLoop((value) => !value)} aria-pressed={loop}><Repeat size={14}/> Loop</button>
          <button type="button" className={`deva-course-voice${teaching ? " on" : ""}`} onClick={() => (teaching ? stopTeaching() : startTeaching())} disabled={!voiceSupported} aria-pressed={teaching}>
            <Volume2 size={14}/> {teaching ? "Stop voice lesson" : "Voice lesson"}
          </button>
          <label className="deva-course-voice-lang"><span>VOICE</span><select value={teacherLang} onChange={(event) => chooseTeacherLang(event.target.value as UiLanguage)} aria-label="Lesson voice language">{uiLanguages.map((entry) => <option key={entry.id} value={entry.id}>{entry.native}</option>)}</select></label>
          <span className="deva-course-voice-state">{teaching ? `${String(stepIndex + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")} spoken` : voiceSupported ? `${steps.length} steps narrated` : "no voice in this browser"}</span>
        </div>
        <div className="deva-course-ticks">{steps.map((item, index) => <button type="button" key={`${item.title}-${index}`} className={index === stepIndex ? "active" : index < stepIndex ? "complete" : ""} aria-label={`Step ${index + 1}: ${item.title}`} title={item.title} onClick={() => scrubTo(index)} />)}</div>
      </section>

      <section className="deva-course-editor-panel" aria-label="Code editor panel">
        <div className="deva-course-panel-head">
          <span><Braces size={13}/> {lesson.id.replace(/-/g, "_")}.{language === "Python" ? "py" : "js"}</span>
          <label className="deva-course-language"><select value={language} onChange={(event) => setLanguage(event.target.value as CourseLanguage)}><option>JavaScript</option><option>Python</option></select></label>
        </div>
        <div className="deva-course-editor">
          <CodeMirror className="deva-source-editor deva-codemirror" value={code} theme="dark" extensions={extensions} placeholder="Write your solution"
            onChange={editCode}
            onUpdate={(update: ViewUpdate) => {
              if (!update.selectionSet && !update.docChanged) return;
              const head = update.state.selection.main.head;
              const line = update.state.doc.lineAt(head);
              setCursor({ line: line.number, column: head - line.from + 1 });
            }} />
        </div>
        <div className="deva-course-editor-foot"><span>Ln {cursor.line}, Col {cursor.column}</span><span>{practice.judged ? `${practice.cases.length} judged cases` : "run-only · no judged fixtures"}</span></div>
        <div className="deva-course-actions">
          <button type="button" className="deva-course-run" onClick={() => void runPractice("run")} disabled={busy !== null}>{busy === "run" ? <LoaderCircle size={14} className="spin" /> : <CirclePlay size={14}/>} Run this step</button>
          <button type="button" className="deva-course-submit" onClick={() => void runPractice("submit")} disabled={busy !== null || !practice.judged}>{busy === "submit" ? <LoaderCircle size={14} className="spin"/> : <Target size={14}/>} Submit {practice.judged ? `(${practice.cases.length})` : ""}</button>
          <button type="button" className="deva-course-reset" onClick={() => { localStorage.removeItem(`deva-course:${lesson.id}:${language}`); setCode(starterFor(lesson, language)); setResults([]); setSummary(null); }}>Reset starter</button>
          <button type="button" className={`deva-course-done${completed.has(lesson.id) ? " on" : ""}`} onClick={() => markDone(lesson.id)}>{completed.has(lesson.id) ? "Completed" : "Mark complete"}</button>
          {lessonIndex < siblings.length - 1 && <button type="button" className="deva-course-next" onClick={() => setLessonId(siblings[lessonIndex + 1]!.id)}>Next lesson <ArrowRight size={13}/></button>}
        </div>
        {(results.length > 0 || summary) && <div className="deva-course-results" aria-live="polite">
          {summary && <strong className={summary.includes("Accepted") ? "ok" : ""}>{summary}</strong>}
          {results.map((item) => <div key={item.index} className={`deva-course-case ${item.verdict.toLowerCase()}`}>
            <span>#{item.index + 1} <em>{item.verdict}</em></span>
            <pre>{`in:  ${item.stdin.trim().replace(/\n/g, " · ")}\nout: ${item.actual || item.note || "(empty)"}`}</pre>
          </div>)}
        </div>}

        <div className="deva-course-ai">
          <div className="deva-course-ai-head"><Sparkles size={13}/> ASK DEVA ABOUT THIS STEP</div>
          <div className="deva-course-ai-chips">{["Why is this step correct?", "What breaks if I swap the order?", "How do I adapt it to duplicates?"].map((item) => <button type="button" key={item} onClick={() => { setQuestion(item); askRef.current?.focus(); }}>{item}</button>)}</div>
          <textarea ref={askRef} rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void askDev(); } }} placeholder={`Ask about “${step.title}”`} />
          <button type="button" className="deva-course-ask" onClick={() => void askDev()} disabled={busy !== null || !question.trim()}>{busy === "ai" ? <LoaderCircle size={14} className="spin"/> : <Send size={14}/>} Ask</button>
          {answer && <p className="deva-course-answer">{answer}</p>}
        </div>
      </section>
    </div>
    <section className="deva-course-notes" aria-label="Lesson notes">
      <article><span><Lightbulb size={14}/> THE IDEA</span><p>{lesson.concept}</p></article>
      <article><span><BookOpen size={14}/> WHEN TO USE IT</span><p>{lesson.whenToUse}</p></article>
      <article><span><TriangleAlert size={14}/> COMMON PITFALLS</span><ul>{lesson.pitfalls.map((item) => <li key={item}>{item}</li>)}</ul></article>
      <article className="deva-course-practice"><span><Target size={14}/> PRACTICE CHALLENGE</span><p>{lesson.practice}</p></article>
    </section>
  </section>;
}
