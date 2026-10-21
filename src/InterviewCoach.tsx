import { useEffect, useRef, useState, type FormEvent } from "react";
import { LoaderCircle, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import InterviewAvatar from "./InterviewAvatar";
import { supabase } from "./lib/supabase";

type Message = { role: "user" | "assistant"; content: string };
type RecognitionController = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition() {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: new () => RecognitionController;
    webkitSpeechRecognition?: new () => RecognitionController;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

async function getFunctionErrorMessage(error: Error) {
  const context = (error as Error & { context?: unknown }).context;
  if (context instanceof Response) {
    const code = context.headers.get("sb-error-code");
    if (code === "UNAUTHORIZED_ASYMMETRIC_JWT") {
      return "The deployed interview function is still rejecting Clerk sign-in at the Supabase gateway. Deploy the latest dsa-tutor function, which verifies your Clerk token securely.";
    }
    const body = await context.clone().json().catch(() => null) as { error?: unknown; message?: unknown; msg?: unknown } | null;
    const detail = [body?.error, body?.message, body?.msg].find((value) => typeof value === "string" && value.trim());
    if (typeof detail === "string") return detail;
  }
  return error.message || "Could not reach the AI interviewer. Please try again.";
}

export default function InterviewCoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Message[]>([]);
  const recognitionRef = useRef<RecognitionController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  function speak(text: string) {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g, "code omitted").replace(/[*#`]/g, ""));
    const englishVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;
    utterance.rate = 0.96;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  async function requestCoach(history: Message[], showUserMessage = true) {
    if (!supabase) {
      setError("");
      setLoading(true);
      const latestMessage = history[history.length - 1];
      if (showUserMessage && latestMessage) setMessages((current) => [...current, latestMessage]);
      window.setTimeout(() => {
        let reply = "";
        const userMsg = latestMessage?.content?.toLowerCase() ?? "";
        if (!showUserMessage || history.length <= 1) {
          reply =
            "Hello! Welcome to your technical mock interview. Let's start with a problem: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Each input has exactly one solution, and you may not use the same element twice. How would you approach this problem?";
        } else if (
          userMsg.includes("hash") ||
          userMsg.includes("map") ||
          userMsg.includes("dictionary") ||
          userMsg.includes("dict")
        ) {
          reply =
            "That's the optimal direction! Using a hash map lets you achieve O(n) time complexity. As you iterate through the array, what exactly would you store as keys and values in the map, and when do you check for the complement?";
        } else if (
          userMsg.includes("loop") ||
          userMsg.includes("nested") ||
          userMsg.includes("brute") ||
          userMsg.includes("o(n^2)") ||
          userMsg.includes("n^2")
        ) {
          reply =
            "A brute-force two-pointer or nested loop scan gives O(n²) time and O(1) space. It's good to mention the naive solution first! Can we do better in time complexity by trading some additional space?";
        } else if (
          userMsg.includes("index") ||
          userMsg.includes("complement") ||
          userMsg.includes("target -") ||
          userMsg.includes("target-")
        ) {
          reply =
            "Spot on! By checking if target - current exists in the hash map before inserting the current number, we find our answer in a single pass with O(n) time and O(n) space. Are there any edge cases you'd test for?";
        } else {
          reply =
            "Good thoughts! Walk me through your proposed time and space complexity, and how you would handle edge cases such as negative integers or duplicate numbers.";
        }
        const answer: Message = { role: "assistant", content: reply };
        historyRef.current = [...history.slice(-8), answer];
        setMessages((current) => [...current, answer]);
        speak(reply);
        setLoading(false);
      }, 700);
      return;
    }
    setError("");
    setLoading(true);
    const latestMessage = history[history.length - 1];
    if (showUserMessage && latestMessage) setMessages((current) => [...current, latestMessage]);
    try {
      const recentMessages = history.slice(-8);
      const { data, error: invokeError } = await supabase.functions.invoke<{ answer: string }>("dsa-tutor", {
        body: { messages: recentMessages, mode: "interview" },
      });
      if (invokeError) throw invokeError;
      if (!data?.answer?.trim()) throw new Error("The interviewer returned an empty reply. Please try again.");
      const answer: Message = { role: "assistant", content: data.answer.trim() };
      historyRef.current = [...recentMessages, answer].slice(-8);
      setMessages((current) => [...current, answer]);
      speak(answer.content);
    } catch (cause) {
      setError(cause instanceof Error ? await getFunctionErrorMessage(cause) : "Could not reach the AI interviewer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startInterview() {
    setStarted(true);
    const opener: Message = {
      role: "user",
      content: "Start a realistic technical coding interview for a software engineering role. Greet me briefly and ask one suitable DSA problem as your first question. Do not give me the solution.",
    };
    historyRef.current = [opener];
    void requestCoach([opener], false);
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || loading || !started) return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setDraft("");
    const nextHistory = [...historyRef.current, { role: "user" as const, content }];
    historyRef.current = nextHistory;
    void requestCoach(nextHistory);
  }

  function toggleMicrophone() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setError("Voice input is not supported in this browser. You can type your answer instead.");
      return;
    }
    const recognition = new Recognition();
    const prefix = draft.trim();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const recognized = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript.trim() ?? "")
        .filter(Boolean)
        .join(" ");
      const interim = !recognized ? event.results[event.results.length - 1]?.[0]?.transcript.trim() ?? "" : "";
      const speech = recognized || interim;
      setDraft([prefix, speech].filter(Boolean).join(" "));
    };
    recognition.onerror = () => {
      setListening(false);
      setError("Microphone input stopped. Check browser microphone permission, then try again.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setError("");
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Could not start microphone input. Try again or type your answer.");
    }
  }

  function endInterview() {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setListening(false);
    setSpeaking(false);
    setStarted(false);
    setMessages([]);
    historyRef.current = [];
  }

  return (
    <section className="interview-room" aria-label="AI technical interview">
      <div className="interview-room-topline">
        <div><span className="interview-room-eyebrow">CODEXSHEET · PRACTICE ROOM</span><h2>Technical interview</h2><p>A private voice practice session with your AI interviewer.</p></div>
        <div className="interview-room-status"><i /> {started ? "SESSION LIVE" : "READY TO BEGIN"}</div>
      </div>
      <div className="interview-room-grid">
        <aside className="interviewer-panel">
          <div className="interviewer-panel-top"><span>YOUR INTERVIEWER</span><span className="interviewer-online"><i /> ONLINE</span></div>
          <div className={`interview-avatar-wrap${speaking ? " speaking" : ""}`}><InterviewAvatar speaking={speaking} /><span className="interview-avatar-live"><i /> {speaking ? "Speaking" : "AI interviewer"}</span></div>
          <h3>Practice like it’s the real thing.</h3>
          <p>Talk through your reasoning. Ask questions. Take a moment to think.</p>
          <div className="interviewer-capabilities"><span>DSA questions</span><span>Hints on request</span><span>Clear feedback</span></div>
          <button type="button" className={`interview-speech-toggle${voiceEnabled ? " active" : ""}`} onClick={() => { setVoiceEnabled((value) => !value); window.speechSynthesis?.cancel(); setSpeaking(false); }}><span>{voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}{voiceEnabled ? "AI voice on" : "AI voice off"}</span><i className={voiceEnabled ? "on" : ""} /></button>
        </aside>
        <div className="interview-conversation">
          <header className="interview-conversation-head"><div><strong>Interview conversation</strong><span>{started ? "Take your time with each question." : "Your session has not started yet."}</span></div>{started && <button type="button" onClick={endInterview}>End session</button>}</header>
          <div className="interview-transcript" aria-live="polite" aria-relevant="additions text">
            {!started ? <div className="interview-welcome"><span className="interview-welcome-icon"><Mic size={20} /></span><h3>Your interviewer is ready.</h3><p>Start a session and answer out loud, or type your responses in the chat.</p><button type="button" onClick={startInterview}>Start interview <Send size={14} /></button></div> : messages.length === 0 && loading ? <div className="interview-thinking"><LoaderCircle size={17} className="spin" /> Your interviewer is joining…</div> : <>
              {messages.map((message, index) => <article key={`${index}-${message.role}`} className={`interview-message ${message.role}`}><div className="interview-message-label"><span>{message.role === "assistant" ? "AI INTERVIEWER" : "YOU"}</span>{message.role === "assistant" && voiceEnabled && <button type="button" onClick={() => speak(message.content)} aria-label="Play interviewer reply"><Volume2 size={13} /> Play voice</button>}</div><p>{message.content}</p></article>)}
              {loading && <div className="interview-thinking"><LoaderCircle size={15} className="spin" /> Thinking…</div>}
              {speaking && <div className="interview-speaking-indicator"><i /><i /><i /><span>AI is speaking</span></div>}
              <div ref={messagesEndRef} />
            </>}
          </div>
          {error && <p className="interview-error" role="alert">{error}</p>}
          <form className="interview-composer" onSubmit={submitMessage}>
            <button className={`interview-mic-button${listening ? " listening" : ""}`} type="button" aria-label={listening ? "Stop microphone" : "Speak your answer"} title={listening ? "Stop microphone" : "Speak your answer"} onClick={toggleMicrophone} disabled={!started || loading}>{listening ? <MicOff size={18} /> : <Mic size={18} />}</button>
            <textarea aria-label="Your interview answer" placeholder={started ? listening ? "Listening…" : "Type an answer or use your microphone…" : "Start the interview to respond"} value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!started || loading} rows={1} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
            <button className="interview-send-button" type="submit" disabled={!started || loading || !draft.trim()} aria-label="Send answer">{loading ? <LoaderCircle size={17} className="spin" /> : <Send size={17} />}</button>
          </form>
          <div className="interview-conversation-foot"><span>Microphone access is requested only when you tap the mic.</span><span>Voice replies use your browser’s speech service.</span></div>
        </div>
      </div>
    </section>
  );
}
