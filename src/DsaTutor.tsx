import { useEffect, useRef, useState, type FormEvent } from "react";
import { BrainCircuit, Layers, Lightbulb, LoaderCircle, RotateCcw, Send } from "lucide-react";
import { supabase } from "./lib/supabase";

type TutorMessage = { role: "user" | "assistant"; content: string; id: number };

const greeting: TutorMessage = {
  role: "assistant",
  content: "Hi! I’m your DSA tutor. Tell me what you’re working on, or paste an approach and I’ll help you reason through it one step at a time.",
  id: 0,
};

const prompts = [
  { icon: Lightbulb, label: "Give me a hint", text: "I’m stuck on Two Sum. Give me one hint at a time, without revealing the full solution." },
  { icon: Layers, label: "Explain a pattern", text: "Explain when to use a sliding window and how to recognize it." },
];

export default function DsaTutor() {
  const [messages, setMessages] = useState<TutorMessage[]>([greeting]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function askTutor(text: string) {
    const question = text.trim();
    if (!question || sending) return;
    if (!supabase) {
      setError("Connect Supabase to use the DSA AI tutor.");
      return;
    }
    const nextMessages = [...messages, { role: "user" as const, content: question, id: Date.now() }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setSending(true);
    const history = nextMessages.filter((message) => message.id !== 0).slice(-8).map(({ role, content }) => ({ role, content }));
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("dsa-tutor", { body: { messages: history } });
      if (invokeError) throw invokeError;
      const answer = typeof data?.answer === "string" ? data.answer.trim() : "";
      if (!answer) throw new Error(data?.error || "The tutor didn’t return a reply. Try again.");
      setMessages((current) => [...current, { role: "assistant", content: answer, id: Date.now() + 1 }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reach the DSA tutor. Try again.");
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askTutor(draft);
  }

  return <section className="dsa-tutor-card" aria-label="DSA AI tutor">
    <header className="dsa-tutor-heading">
      <div className="dsa-tutor-mark"><BrainCircuit size={19} /></div>
      <div><span className="dsa-tutor-eyebrow">YOUR ON-DEMAND STUDY PARTNER</span><h2>DSA AI tutor</h2><p>Build the reasoning. Keep the solution yours.</p></div>
      <span className="dsa-tutor-online"><i /> HINT-FIRST COACH</span>
    </header>
    <div className="dsa-tutor-layout">
      <aside className="dsa-tutor-prompt-rail">
        <span>START WITH A PROMPT</span>
        {prompts.map(({ icon: Icon, label, text }) => <button key={label} type="button" onClick={() => void askTutor(text)} disabled={sending}><Icon size={15} />{label}</button>)}
        <div className="dsa-tutor-rail-note"><strong>Hint-first coaching</strong><p>Ask for an approach, complexity check, or a nudge when you get stuck.</p></div>
        <button className="dsa-tutor-reset" type="button" onClick={() => { setMessages([greeting]); setError(""); }} disabled={sending}><RotateCcw size={13} />New conversation</button>
      </aside>
      <div className="dsa-tutor-chat">
        <div className="dsa-tutor-transcript" ref={transcriptRef} aria-live="polite" aria-label="Conversation">
          {messages.map((message) => <article className={`dsa-tutor-message ${message.role}`} key={message.id}>{message.role === "assistant" && <span className="dsa-tutor-avatar"><BrainCircuit size={14} /></span>}<p>{message.content}</p></article>)}
          {sending && <div className="dsa-tutor-thinking"><LoaderCircle size={14} className="spin" />Thinking through it…</div>}
        </div>
        {error && <p className="dsa-tutor-error" role="alert">{error}</p>}
        <form className="dsa-tutor-composer" onSubmit={submit}>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} rows={2} placeholder="Ask about an algorithm, a problem, or your code…" aria-label="Ask your DSA tutor" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void askTutor(draft); } }} />
          <button type="submit" aria-label="Send to tutor" disabled={sending || !draft.trim()}>{sending ? <LoaderCircle size={16} className="spin" /> : <Send size={17} />}</button>
        </form>
        <p className="dsa-tutor-footnote">AI can make mistakes. Use it to learn, then verify your reasoning.</p>
      </div>
    </div>
  </section>;
}
