import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowUp, LifeBuoy, Lightbulb, RotateCcw, Volume2, VolumeX, WandSparkles } from "lucide-react";
import DsaMentorStage from "./DsaMentorStage";
import GuruFace from "./GuruFace";
import {
  detectIntent,
  detectLevel,
  detectPattern,
  lessonFor,
  patternLessons,
  sceneFor,
  teachOffline,
  type MentorPatternId,
  type MentorTurn,
} from "./dsa-mentor-brain";
import { detectMood, moodProfiles, parseMoodCue, type MentorMood } from "./mentor-mood";
import { hasNativeVoice, isSpeaking, onVoiceStateChange, speak, speechText, stopSpeaking, voiceSupported } from "./mentor-voice";
import { languageOption, setUiLanguage, uiLanguages, useT, useUiLanguage, type MessageKey, type UiLanguage } from "./i18n";
import { mentorEmail } from "./mentorship";
import "./guru.css";

type GuruMessage = { role: "user" | "assistant"; content: string };

const seenKey = "codexsheet.guru.covered";

function readCovered(): MentorPatternId[] {
  try {
    const raw = localStorage.getItem(seenKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is MentorPatternId => patternLessons.some((lesson) => lesson.id === id)) : [];
  } catch {
    return [];
  }
}

const starters: Array<{ key: MessageKey; ask: string }> = [
  { key: "guru.s1", ask: "Two Sum — how do I even start?" },
  { key: "guru.s2", ask: "Explain sliding window to me like I am new to it." },
  { key: "guru.s3", ask: "How do I reverse a linked list without extra space?" },
  { key: "guru.s4", ask: "I always get stuck on dynamic programming. What do I look at first?" },
];

const moodKeys: Record<MentorMood, MessageKey> = {
  calm: "mood.calm",
  happy: "mood.happy",
  laugh: "mood.laugh",
  angry: "mood.angry",
  think: "mood.think",
  proud: "mood.proud",
};

export default function DsaGuru({ onOpenPass }: { onOpenPass: () => void }) {
  const lang = useUiLanguage();
  const tr = useT();
  const [transcript, setTranscript] = useState<GuruMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [mood, setMood] = useState<MentorMood>("calm");
  const [pattern, setPattern] = useState<MentorPatternId>("hashing");
  const [hintStep, setHintStep] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(() => (typeof localStorage === "undefined" ? true : localStorage.getItem("codexsheet.guru.voice") !== "off"));
  const [speaking, setSpeaking] = useState(isSpeaking());
  const [notice, setNotice] = useState("");
  const [covered, setCovered] = useState<MentorPatternId[]>(readCovered);
  const endRef = useRef<HTMLDivElement | null>(null);

  const scene = useMemo(() => sceneFor({ pattern, intent: "explain", level: "beginner" }), [pattern]);
  const stepCount = Math.max(1, scene.steps.length);
  const boardStep = scene.steps[Math.min(stepIndex, stepCount - 1)];
  const lesson = lessonFor(pattern);
  const nextUp = patternLessons.map((entry) => entry.id).find((id) => id !== pattern && !covered.includes(id)) ?? null;

  useEffect(() => onVoiceStateChange(setSpeaking), []);

  useEffect(() => {
    if (stepIndex + 1 < stepCount) return;
    setCovered((current) => (current.includes(pattern) ? current : [...current, pattern]));
  }, [stepIndex, stepCount, pattern]);

  useEffect(() => {
    try {
      localStorage.setItem(seenKey, JSON.stringify(covered));
    } catch {
      // A private window just forgets the progress when it closes.
    }
  }, [covered]);

  useEffect(() => {
    if (!voiceOn) stopSpeaking();
    try {
      localStorage.setItem("codexsheet.guru.voice", voiceOn ? "on" : "off");
    } catch {
      // A private window only keeps the toggle for this session.
    }
  }, [voiceOn]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript, sending]);

  const advanceBoard = useCallback(() => {
    setStepIndex((current) => Math.min(stepCount - 1, current + 1));
  }, [stepCount]);

  useEffect(() => {
    if (!speaking || !voiceOn) return;
    const tick = window.setInterval(advanceBoard, moodProfiles[mood].stepSeconds * 1000);
    return () => window.clearInterval(tick);
  }, [speaking, voiceOn, mood, advanceBoard]);

  function deliver(turn: MentorTurn, reply: string, spokenMood: MentorMood) {
    const cleaned = reply.trim();
    setMood(spokenMood);
    setTranscript((current) => [...current.slice(-11), { role: "assistant", content: cleaned }]);
    if (voiceOn) speak(cleaned, { lang, mood: spokenMood });
  }

  async function ask(rawText: string, forcedIntent?: MentorTurn["intent"]) {
    const text = rawText.trim();
    if (!text || sending) return;
    stopSpeaking();
    const detected = detectPattern(text) ?? pattern;
    const turn: MentorTurn = { pattern: detected, intent: forcedIntent ?? detectIntent(text), level: detectLevel(text), problem: text.slice(0, 160) };
    const repeats = transcript.filter((message) => message.content.trim().toLowerCase() === text.toLowerCase()).length;
    setPattern(detected);
    setHintStep(turn.intent === "hint" ? Math.min(hintStep + 1, lessonFor(detected).hints.length - 1) : 0);
    setStepIndex(0);
    setMood("think");
    setNotice("");
    setDraft("");
    setTranscript((current) => [...current.slice(-11), { role: "user", content: text }]);
    setSending(true);
    const history: GuruMessage[] = [...transcript.slice(-8), { role: "user", content: text }];
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "guru",
          language: lang,
          messages: history.map((message) => ({ role: message.role, content: speechText(message.content).slice(0, 1200) })),
        }),
        signal: AbortSignal.timeout(90_000),
      });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !result.answer) throw new Error(result.error ?? "Guru could not answer.");
      const cued = parseMoodCue(result.answer);
      deliver(turn, cued.text, cued.mood ?? detectMood(cued.text, text, repeats + 1));
      if (cued.text.includes("```")) setNotice("Guru wrote code — the Deva editor can run it.");
    } catch {
      const offlineMood: MentorMood = repeats >= 2 ? "angry" : turn.intent === "stuck" ? "think" : "calm";
      setNotice(tr("guru.offline"));
      deliver(turn, teachOffline(turn, hintStep).join(" "), offlineMood);
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  function reset() {
    stopSpeaking();
    setTranscript([]);
    setHintStep(0);
    setStepIndex(0);
    setMood("calm");
    setNotice("");
  }

  function chooseTopic(id: MentorPatternId) {
    if (id === pattern) return;
    stopSpeaking();
    setPattern(id);
    setStepIndex(0);
    setHintStep(0);
    const entry = lessonFor(id);
    setMood("happy");
    if (voiceOn) speak(`${entry.hook} ${entry.idea}`, { lang, mood: "happy" });
  }

  const mentorHref = `mailto:${mentorEmail}?subject=${encodeURIComponent(`CodexSheet Guru — stuck on ${lesson.label}`)}&body=${encodeURIComponent(
    `I am on Guru's ${lesson.label} board and I am stuck.\n\nLast step I saw:\n${boardStep?.narration ?? lesson.idea}\n${boardStep?.code ? `\n${boardStep.code}\n` : ""}\nThe part I do not understand yet:\n`,
  )}`;

  const voiceNote = !voiceSupported
    ? " · This browser has no voice."
    : voiceOn && !hasNativeVoice(lang)
      ? ` · No ${languageOption(lang).native} voice installed, so Guru uses the English one.`
      : "";

  return (
    <section className="guru" aria-label="Guru, the free AI DSA teacher">
      <header className="guru-head">
        <div>
          <span className="guru-kicker">{tr("guru.kicker")}</span>
          <h1>{tr("guru.title")}</h1>
          <p>{tr("guru.body")}</p>
        </div>
        <div className="guru-head-actions">
          <label className="guru-lang">
            <span>{tr("lang.label")}</span>
            <select
              value={lang}
              onChange={(event) => {
                stopSpeaking();
                setUiLanguage(event.target.value as UiLanguage);
              }}
            >
              {uiLanguages.map((option) => <option key={option.id} value={option.id}>{option.native} · {option.english}</option>)}
            </select>
          </label>
          <button type="button" className={`guru-voice${voiceOn ? " on" : ""}`} aria-pressed={voiceOn} onClick={() => setVoiceOn((current) => !current)}>
            {voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />} {voiceOn ? tr("guru.speakOn") : tr("guru.speakOff")}
          </button>
          <button type="button" className="guru-reset" onClick={reset} aria-label="Restart the lesson"><RotateCcw size={15} /></button>
        </div>
      </header>

      <div className="guru-grid">
        <div className="guru-board">
          <div className="guru-board-top">
            <GuruFace mood={mood} speaking={speaking} moodLabel={tr(moodKeys[mood])} />
            <div className="guru-board-meta">
              <span className="guru-pattern-label">{lesson.label}</span>
              <strong>{scene.title}</strong>
              <div className="guru-steps">
                <button type="button" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={stepIndex === 0}>‹ {tr("guru.prev")}</button>
                <span>{Math.min(stepIndex + 1, stepCount)} / {stepCount}</span>
                <button type="button" onClick={advanceBoard} disabled={stepIndex + 1 >= stepCount}>{tr("guru.next")} ›</button>
              </div>
            </div>
          </div>
          <DsaMentorStage scene={scene} index={stepIndex} mood={mood} />
          <p className="guru-narration">{boardStep?.narration ?? lesson.idea}</p>
          {boardStep?.code && (
            <pre className="guru-step-code"><code>{boardStep.code}</code></pre>
          )}
          <div className="guru-quick">
            <button type="button" onClick={() => void ask(`Give me a hint on ${lesson.label}.`, "hint")}><Lightbulb size={14} /> {tr("guru.hint")}</button>
            <button type="button" onClick={() => void ask(`Show me the solution shape for ${lesson.label}.`, "code")}><WandSparkles size={14} /> {tr("guru.solve")}</button>
          </div>
          <div className="guru-rail">
            <div className="guru-rail-head">
              <span>{tr("guru.topics")}</span>
              <strong>{tr("guru.covered", { count: String(covered.length), total: String(patternLessons.length) })}</strong>
            </div>
            <div className="guru-topics">
              {patternLessons.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`guru-topic${entry.id === pattern ? " active" : ""}${covered.includes(entry.id) ? " covered" : ""}`}
                  onClick={() => chooseTopic(entry.id)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            {nextUp && (
              <button type="button" className="guru-next-up" onClick={() => chooseTopic(nextUp)}>
                <span>{tr("guru.nextUp")}</span>
                <strong>{lessonFor(nextUp).label}</strong>
              </button>
            )}
            <a className="guru-mentor" href={mentorHref}><LifeBuoy size={14} /> {tr("guru.mentor")}</a>
          </div>
          <p className="guru-fineprint">{tr("guru.langNote", { language: languageOption(lang).native })}{voiceNote}</p>
        </div>

        <div className="guru-chat">
          <div className="guru-thread" aria-live="polite">
            {transcript.length === 0 && (
              <div className="guru-starters">
                {starters.map((starter) => <button key={starter.key} type="button" onClick={() => void ask(starter.ask)}>{tr(starter.key)}</button>)}
                <p className="guru-free-note">{tr("guru.free")}</p>
              </div>
            )}
            {transcript.map((message, index) => (
              <article key={`${index}-${message.content.slice(0, 16)}`} className={`guru-msg ${message.role}`}>
                {message.content.split(/```/).map((part, partIndex) => (partIndex % 2 === 1
                  ? <pre key={partIndex}><code>{part.replace(/^[a-z]*\n?/i, "")}</code></pre>
                  : part.trim() ? <span key={partIndex}>{part}</span> : null))}
              </article>
            ))}
            {sending && <div className="guru-thinking">{tr("guru.thinking")}</div>}
            <div ref={endRef} />
          </div>
          {notice && <p className="guru-notice">{notice}</p>}
          <form className="guru-input" onSubmit={submit}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={tr("guru.placeholder")} aria-label={tr("guru.chat")} maxLength={600} />
            <button className="primary-button" type="submit" disabled={sending || !draft.trim()}><ArrowUp size={16} /> {tr("guru.send")}</button>
          </form>
          <button type="button" className="guru-pass" onClick={onOpenPass}>{tr("guru.passCta")} · {tr("lock.pay")}</button>
        </div>
      </div>
    </section>
  );
}
