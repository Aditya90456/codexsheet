import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, BookOpen, Bot, BrainCircuit, Code2, RotateCcw, Sparkles, UserRound } from "lucide-react";
import "./dsa-tutor.css";

type TutorMessage = { role: "user" | "assistant"; content: string };

const starters = [
  "Explain sliding window with a simple example",
  "How do I know when to use two pointers?",
  "Give me a hint for solving Two Sum",
  "What is the difference between BFS and DFS?",
];

function MessageText({ content }: { content: string }) {
  const chunks = content.split(/(```[\s\S]*?```)/g);
  return <div className="dsa-tutor-message-text">{chunks.map((chunk, index) => {
    if (!chunk.startsWith("```")) return <p key={index}>{chunk}</p>;
    const code = chunk.replace(/^```(?:[\w-]+)?\n?/, "").replace(/```$/, "").trim();
    return <pre key={index}><code>{code}</code></pre>;
  })}</div>;
}

export default function DsaTutor() {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [failedQuestion, setFailedQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function ask(question: string, appendQuestion = true) {
    const content = question.trim();
    if (!content || sending) return;
    const next: TutorMessage[] = appendQuestion
      ? [...messages, { role: "user", content }]
      : messages;
    if (appendQuestion) setMessages(next);
    setDraft("");
    setError("");
    setFailedQuestion("");
    setNotice("");
    setSending(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) }),
        signal: AbortSignal.timeout(100_000),
      });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "The tutor could not respond. Please try again.");
      if (!result.answer) throw new Error("The tutor returned an empty reply. Please try again.");
      setMessages((current) => [...current, { role: "assistant", content: result.answer! }]);
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : "A network error interrupted the request.";
      setError(detail);
      setFailedQuestion(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  function resetChat() {
    if (sending) return;
    setMessages([]);
    setDraft("");
    setError("");
    setFailedQuestion("");
    setNotice("New doubt session started.");
    inputRef.current?.focus();
  }

  return <main className="dsa-tutor-page">
    <section className="dsa-tutor-shell">
      <header className="dsa-tutor-topline">
        <div className="dsa-tutor-brand"><span><BrainCircuit size={17}/></span><div><strong>DSA STUDY PARTNER</strong><small>Powered by Google Gemini</small></div></div>
        <button type="button" className="dsa-tutor-reset" onClick={resetChat} disabled={sending}><RotateCcw size={14}/> New chat</button>
      </header>

      <div className={`dsa-tutor-scroll${messages.length === 0 ? " is-empty" : ""}`}>
        {messages.length === 0 ? <section className="dsa-tutor-welcome">
          <span className="dsa-tutor-orb"><Sparkles size={23}/></span>
          <span className="dsa-tutor-eyebrow">YOUR PERSONAL DSA MENTOR</span>
          <h2>What are you stuck<br/>on <em>today?</em></h2>
          <p>Ask about a pattern, an approach, a confusing line of code, or your next interview problem. We’ll work it through together.</p>
          <div className="dsa-tutor-starters">{starters.map((prompt) => <button type="button" key={prompt} onClick={() => void ask(prompt)} disabled={sending}><span><BookOpen size={14}/></span>{prompt}<ArrowUp size={13}/></button>)}</div>
        </section> : <div className="dsa-tutor-thread" aria-live="polite">
          {messages.map((message, index) => <article className={`dsa-tutor-message ${message.role}`} key={`${index}-${message.role}`}>
            <span className="dsa-tutor-avatar">{message.role === "assistant" ? <Bot size={16}/> : <UserRound size={16}/>}</span>
            <div className="dsa-tutor-bubble"><span className="dsa-tutor-sender">{message.role === "assistant" ? "DSA TUTOR" : "YOU"}</span><MessageText content={message.content}/></div>
          </article>)}
          {sending && <article className="dsa-tutor-message assistant"><span className="dsa-tutor-avatar"><Bot size={16}/></span><div className="dsa-tutor-bubble"><span className="dsa-tutor-sender">DSA TUTOR</span><span className="dsa-tutor-thinking"><i/><i/><i/> Thinking through it</span></div></article>}
          {error && <div className="dsa-tutor-inline-error" role="alert"><p>{error}</p><button type="button" onClick={() => void ask(failedQuestion, false)} disabled={sending || !failedQuestion}>Retry</button></div>}
          <div ref={endRef}/>
        </div>}
      </div>

      {notice && <div className="dsa-tutor-status notice" role="status">{notice}</div>}

      <div className="dsa-tutor-composer-wrap">
        <form className="dsa-tutor-composer" onSubmit={submit}>
          <textarea ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(draft); } }} placeholder="Ask your DSA doubt…" aria-label="Ask a DSA question" maxLength={2000} rows={2} disabled={sending}/>
          <div className="dsa-tutor-composer-footer"><span><Code2 size={13}/> DSA questions · Hints before full solutions</span><div><small>{draft.length}/2000</small><button type="submit" aria-label="Send question" disabled={!draft.trim() || sending}><ArrowUp size={17}/></button></div></div>
        </form>
        <p className="dsa-tutor-footnote">AI can make mistakes. Run code and verify important details before interviews.</p>
      </div>
    </section>
  </main>;
}
