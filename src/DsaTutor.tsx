import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowUp, BookOpen, Bot, BrainCircuit, Code2, RotateCcw, Sparkles, UserRound } from "lucide-react";
import "./dsa-tutor.css";

type TutorMessage = { role: "user" | "assistant"; content: string };
type TutorDiagramSpec = {
  type: "array" | "flowchart";
  title: string;
  values?: string[];
  pointers?: Array<{ index: number; label: string }>;
  nodes?: Array<{ id: string; label: string; x: number; y: number }>;
  edges?: Array<{ from: string; to: string; label?: string }>;
};

const starters = [
  "Explain sliding window with a simple example",
  "How do I know when to use two pointers?",
  "Give me a hint for solving Two Sum",
  "What is the difference between BFS and DFS?",
];

function parseTutorDiagram(source: string): TutorDiagramSpec | null {
  try {
    const raw = JSON.parse(source) as Record<string, unknown>;
    const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 80) : "DSA diagram";
    if (raw.type === "array" && Array.isArray(raw.values)) {
      const values = raw.values.filter((value): value is string => typeof value === "string").slice(0, 12).map((value) => value.slice(0, 16));
      if (values.length < 2) return null;
      const pointers = Array.isArray(raw.pointers) ? raw.pointers.flatMap((pointer) => {
        if (!pointer || typeof pointer !== "object") return [];
        const item = pointer as Record<string, unknown>;
        if (!Number.isInteger(item.index) || Number(item.index) < 0 || Number(item.index) >= values.length || typeof item.label !== "string") return [];
        return [{ index: Number(item.index), label: item.label.trim().slice(0, 24) }];
      }).slice(0, 4) : [];
      return { type: "array", title, values, pointers };
    }
    if (raw.type === "flowchart" && Array.isArray(raw.nodes)) {
      const nodes = raw.nodes.flatMap((node) => {
        if (!node || typeof node !== "object") return [];
        const item = node as Record<string, unknown>;
        if (typeof item.id !== "string" || !/^[\w-]{1,24}$/.test(item.id) || typeof item.label !== "string") return [];
        const x = Number(item.x); const y = Number(item.y);
        return [{ id: item.id, label: item.label.trim().slice(0, 64), x: Number.isFinite(x) ? Math.max(8, Math.min(92, x)) : 50, y: Number.isFinite(y) ? Math.max(8, Math.min(92, y)) : 50 }];
      }).slice(0, 12);
      if (nodes.length < 2) return null;
      const ids = new Set(nodes.map((node) => node.id));
      const edges = Array.isArray(raw.edges) ? raw.edges.flatMap((edge) => {
        if (!edge || typeof edge !== "object") return [];
        const item = edge as Record<string, unknown>;
        if (typeof item.from !== "string" || typeof item.to !== "string" || !ids.has(item.from) || !ids.has(item.to)) return [];
        return [{ from: item.from, to: item.to, label: typeof item.label === "string" ? item.label.trim().slice(0, 28) : "" }];
      }).slice(0, 20) : [];
      return { type: "flowchart", title, nodes, edges };
    }
    return null;
  } catch {
    return null;
  }
}

function DiagramLabel({ label, x, y }: { label: string; x: number; y: number }) {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    if (line && `${line} ${word}`.length > 20) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return <text x={x} y={y} textAnchor="middle">{lines.slice(0, 3).map((part, index) => <tspan key={index} x={x} dy={index === 0 ? 0 : 16}>{part}</tspan>)}</text>;
}

function TutorDiagram({ source }: { source: string }) {
  const diagram = parseTutorDiagram(source);
  const markerId = `dsa-arrow-${useId().replace(/[^\w-]/g, "")}`;
  if (!diagram) return <pre className="dsa-tutor-diagram-fallback"><code>{source}</code></pre>;

  if (diagram.type === "array") {
    const width = Math.max(420, diagram.values!.length * 64 + 56);
    return <figure className="dsa-tutor-diagram"><figcaption>{diagram.title}</figcaption><svg viewBox={`0 0 ${width} 220`} role="img" aria-label={diagram.title}>
      {diagram.pointers!.map((pointer, index) => {
        const x = 28 + pointer.index * 64 + 28;
        const y = 42 + (index % 2) * 28;
        return <g key={`${pointer.label}-${index}`} className={`diagram-pointer diagram-pointer-${index % 4}`}><text x={x} y={y} textAnchor="middle">{pointer.label}</text><path d={`M ${x} ${y + 7} L ${x} 112`} /></g>;
      })}
      {diagram.values!.map((value, index) => {
        const x = 28 + index * 64;
        return <g key={`${value}-${index}`} className="diagram-array-cell"><rect x={x} y="116" width="56" height="48" rx="8"/><text x={x + 28} y="146" textAnchor="middle">{value}</text><text className="diagram-array-index" x={x + 28} y="184" textAnchor="middle">{index}</text></g>;
      })}
    </svg></figure>;
  }

  const nodeById = new Map(diagram.nodes!.map((node) => [node.id, node]));
  const point = (id: string) => {
    const node = nodeById.get(id)!;
    return { x: node.x * 7.6, y: node.y * 3.25 };
  };
  return <figure className="dsa-tutor-diagram"><figcaption>{diagram.title}</figcaption><svg viewBox="0 0 760 360" role="img" aria-label={diagram.title}>
    <defs><marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z"/></marker></defs>
    {diagram.edges!.map((edge, index) => {
      const from = point(edge.from); const to = point(edge.to);
      const midX = (from.x + to.x) / 2; const midY = (from.y + to.y) / 2;
      return <g key={`${edge.from}-${edge.to}-${index}`} className="diagram-edge"><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} markerEnd={`url(#${markerId})`}/>{edge.label && <text x={midX} y={midY - 8} textAnchor="middle">{edge.label}</text>}</g>;
    })}
    {diagram.nodes!.map((node) => {
      const { x, y } = point(node.id);
      return <g key={node.id} className="diagram-node"><rect x={x - 66} y={y - 28} width="132" height="56" rx="12"/><DiagramLabel label={node.label} x={x} y={y - 5}/></g>;
    })}
  </svg></figure>;
}

function MessageText({ content }: { content: string }) {
  const chunks = content.split(/(```[\s\S]*?```)/g);
  return <div className="dsa-tutor-message-text">{chunks.map((chunk, index) => {
    if (!chunk.startsWith("```")) return <p key={index}>{chunk}</p>;
    const match = chunk.match(/^```([\w-]+)?\n?([\s\S]*?)```$/);
    const language = match?.[1]?.toLowerCase();
    const code = (match?.[2] ?? chunk.replace(/^```(?:[\w-]+)?\n?/, "").replace(/```$/, "")).trim();
    if (language === "dsa-diagram") return <TutorDiagram key={index} source={code}/>;
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
