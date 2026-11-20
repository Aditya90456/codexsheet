import { useId, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, Compass, ExternalLink, GraduationCap, LoaderCircle, Map as MapIcon, Sparkles, Target } from "lucide-react";
import type { Problem } from "./dsaSheet";
import { useUiLanguage } from "./i18n";
import { planFromAi } from "./planAi";
import { buildPlan, type PlanConfig } from "./studyPlan";
import { readPlanConfig, writePlanConfig } from "./savedPlan";

type DiagramPointer = { index: number; label: string };
type ArrayDiagram = { type: "array"; title: string; values: string[]; pointers: DiagramPointer[] };
type FlowNode = { id: string; label: string; x: number; y: number };
type FlowEdge = { from: string; to: string; label?: string };
type FlowDiagram = { type: "flowchart"; title: string; nodes: FlowNode[]; edges: FlowEdge[] };
type DsaDiagram = ArrayDiagram | FlowDiagram;
type CoachMessage = { role: "user" | "assistant"; content: string; streaming?: boolean; diagram?: DsaDiagram; diagramError?: string };

type Props = {
  solvedNumbers: number[];
  statusOf: (number: number) => string;
  onStatus: (number: number, status: "Todo" | "In progress" | "Solved") => void;
};

const promptIdeas = [
  {
    icon: Clock3,
    title: "Interview tomorrow",
    detail: "A calm, focused last-day review",
    prompt: "My interview is tomorrow and my DSA is weak. Give me a small, realistic review plan.",
  },
  {
    icon: Target,
    title: "Interview coming up",
    detail: "Make the most of a short timeline",
    prompt: "My interview is in 4 weeks. I can practice 5 days a week; focus on graphs and DP.",
  },
  {
    icon: GraduationCap,
    title: "Stronger after past interviews",
    detail: "Build DSA fundamentals at a steady pace",
    prompt: "I've given a few interviews, but my DSA is weak. Help me build stronger fundamentals at a steady pace; I have no interview date yet.",
  },
  {
    icon: Compass,
    title: "Focus on weak topics",
    detail: "Spend more reps where you need them",
    prompt: "Placements are in 10 days. Give me the must-know problems, especially arrays and trees.",
  },
];

export function parseTutorReply(reply: string): Pick<CoachMessage, "content" | "diagram" | "diagramError"> {
  const match = /```dsa-diagram\s*([\s\S]*?)```/i.exec(reply);
  if (!match) return { content: reply };
  const content = reply.replace(match[0], "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[1]);
  } catch {
    return { content, diagramError: "I could not display that diagram. Ask your coach to try again." };
  }
  if (!parsed || typeof parsed !== "object") {
    return { content, diagramError: "I could not display that diagram. Ask your coach to try again." };
  }
  const data = parsed as Record<string, unknown>;
  if (typeof data.title !== "string" || !data.title.trim() || data.title.length > 100) {
    return { content, diagramError: "I could not display that diagram. Ask your coach to try again." };
  }
  if (data.type === "array" && Array.isArray(data.values) && Array.isArray(data.pointers)) {
    const values = data.values as unknown[];
    const pointers = data.pointers as unknown[];
    const validValues = values.length > 0 && values.length <= 16 && values.every((value) => typeof value === "string" && value.length <= 80);
    const validPointers = pointers.length <= 8 && pointers.every((pointer) => (
      Boolean(pointer)
      && typeof pointer === "object"
      && Number.isInteger((pointer as Record<string, unknown>).index)
      && Number((pointer as Record<string, unknown>).index) >= 0
      && Number((pointer as Record<string, unknown>).index) < values.length
      && typeof (pointer as Record<string, unknown>).label === "string"
      && ((pointer as Record<string, unknown>).label as string).length <= 32
    ));
    if (validValues && validPointers) {
      return {
        content,
        diagram: { type: "array", title: data.title, values: values as string[], pointers: pointers as DiagramPointer[] },
      };
    }
  }
  if (data.type === "flowchart" && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
    const nodes = data.nodes as unknown[];
    const ids = new Set(nodes.map((node) => (node as Record<string, unknown> | null)?.id));
    const validNodes = nodes.length > 0 && nodes.length <= 12 && nodes.every((node) => {
      if (!node || typeof node !== "object") return false;
      const item = node as Record<string, unknown>;
      return typeof item.id === "string" && /^[a-zA-Z0-9_-]{1,32}$/.test(item.id)
        && typeof item.label === "string" && item.label.length <= 100
        && typeof item.x === "number" && Number.isFinite(item.x) && item.x >= 8 && item.x <= 92
        && typeof item.y === "number" && Number.isFinite(item.y) && item.y >= 8 && item.y <= 92;
    }) && ids.size === nodes.length;
    const validEdges = data.edges.length <= 20 && data.edges.every((edge) => (
      Boolean(edge)
      && typeof edge === "object"
      && typeof (edge as Record<string, unknown>).from === "string"
      && ids.has((edge as Record<string, unknown>).from)
      && typeof (edge as Record<string, unknown>).to === "string"
      && ids.has((edge as Record<string, unknown>).to)
      && ((edge as Record<string, unknown>).label === undefined
        || (typeof (edge as Record<string, unknown>).label === "string" && ((edge as Record<string, unknown>).label as string).length <= 80))
    ));
    if (validNodes && validEdges) {
      return { content, diagram: { type: "flowchart", title: data.title, nodes: nodes as FlowNode[], edges: data.edges as FlowEdge[] } };
    }
  }
  return { content, diagramError: "I could not display that diagram. Ask your coach to try again." };
}

function textBeforeDiagram(reply: string) {
  const diagramStart = reply.search(/```dsa-diagram\b/i);
  return diagramStart < 0 ? reply : reply.slice(0, diagramStart).trimEnd();
}

function DsaDiagramView({ diagram }: { diagram: DsaDiagram }) {
  const markerId = `dsa-arrow-${useId().replace(/:/g, "")}`;
  if (diagram.type === "array") {
    const cellWidth = Math.min(64, 560 / diagram.values.length);
    const contentWidth = cellWidth * diagram.values.length;
    const width = Math.max(300, contentWidth + 40);
    const startX = (width - contentWidth) / 2;
    const height = 132 + Math.min(3, diagram.pointers.length) * 18;
    return (
      <figure className="ai-sheet-generated-diagram">
        <figcaption>{diagram.title}</figcaption>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${diagram.title} array diagram`}>
          <title>{diagram.title}</title>
          {diagram.values.map((value, index) => {
            const x = startX + index * cellWidth;
            return <g key={`${index}-${value}`}><rect x={x} y="35" width={cellWidth - 2} height="42" rx="5" /><text x={x + (cellWidth - 2) / 2} y="61">{value}</text><text className="ai-sheet-diagram-index" x={x + (cellWidth - 2) / 2} y="92">{index}</text></g>;
          })}
          {diagram.pointers.map((pointer, index) => {
            const x = startX + pointer.index * cellWidth + (cellWidth - 2) / 2;
            const y = 110 + (index % 3) * 18;
            return <g key={`${pointer.index}-${pointer.label}-${index}`}><line x1={x} y1="77" x2={x} y2={y - 7} /><text className="ai-sheet-diagram-pointer" x={x} y={y + 3}>{pointer.label}</text></g>;
          })}
        </svg>
      </figure>
    );
  }
  const point = (value: number) => 15 + value * 0.7;
  const nodes = new Map(diagram.nodes.map((node) => [node.id, node]));
  return (
    <figure className="ai-sheet-generated-diagram">
      <figcaption>{diagram.title}</figcaption>
      <svg viewBox="0 0 100 100" role="img" aria-label={`${diagram.title} flowchart`}>
        <title>{diagram.title}</title>
        <defs><marker id={markerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" /></marker></defs>
        {diagram.edges.map((edge, index) => {
          const from = nodes.get(edge.from)!;
          const to = nodes.get(edge.to)!;
          const x1 = point(from.x);
          const y1 = point(from.y);
          const x2 = point(to.x);
          const y2 = point(to.y);
          return <g key={`${edge.from}-${edge.to}-${index}`}><line x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={`url(#${markerId})`} />{edge.label && <text className="ai-sheet-diagram-edge-label" x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 2}>{edge.label}</text>}</g>;
        })}
        {diagram.nodes.map((node) => (
          <g key={node.id}><rect x={point(node.x) - 12} y={point(node.y) - 5} width="24" height="10" rx="2" /><text textLength="20" lengthAdjust="spacingAndGlyphs" x={point(node.x)} y={point(node.y) + 1}>{node.label}</text></g>
        ))}
      </svg>
    </figure>
  );
}

export default function AiPracticeSheet({ solvedNumbers, statusOf, onStatus }: Props) {
  const language = useUiLanguage();
  const [config, setConfig] = useState<PlanConfig>(() => ({ ...readPlanConfig(), solved: solvedNumbers }));
  const [brief, setBrief] = useState(config.goal);
  const [generated, setGenerated] = useState(Boolean(config.goal.trim()));
  const [editing, setEditing] = useState(!config.goal.trim());
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [source, setSource] = useState<"ai" | "local" | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [chatMessages, setChatMessages] = useState<CoachMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState("");

  const plan = useMemo(() => buildPlan(config), [config]);
  const selectedNumbers = useMemo(
    () => new Set(plan.days.filter((day) => day.phase === "learn").flatMap((day) => day.rows.map((problem) => problem.number))),
    [plan.days],
  );
  const completed = [...selectedNumbers].filter((number) => statusOf(number) === "Solved").length;
  const visibleDays = plan.days.slice(dayOffset, dayOffset + 7);
  const rangeStart = visibleDays[0]?.day ?? 0;
  const rangeEnd = visibleDays[visibleDays.length - 1]?.day ?? 0;
  const coachReply = feedback || `Your saved ${plan.track.label} is set for ${config.daysPerWeek} practice days a week, with about ${plan.perStudyDay} problems on each study day. ${config.weakPatterns.length ? `I have brought ${config.weakPatterns.join(", ")} forward for extra practice. ` : "The schedule follows the curated sheet so concepts build in sequence. "}Start with day one, try each problem before checking a solution, and mark it solved when you can explain the approach.`;
  const roadmapSegments = useMemo(() => {
    const segmentLength = Math.ceil(plan.days.length / Math.min(4, plan.days.length));
    return Array.from({ length: Math.ceil(plan.days.length / segmentLength) }, (_, index) => {
      const days = plan.days.slice(index * segmentLength, (index + 1) * segmentLength);
      const rows = days.flatMap((day) => day.rows);
      const patternsByCount = new Map<string, number>();
      const phaseCounts = new Map<string, number>();
      days.forEach((day) => day.rows.forEach((problem) => {
        patternsByCount.set(problem.pattern, (patternsByCount.get(problem.pattern) ?? 0) + 1);
        phaseCounts.set(day.phase, (phaseCounts.get(day.phase) ?? 0) + 1);
      }));
      const focus = [...patternsByCount.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 2)
        .map(([pattern]) => pattern);
      const phase = [...phaseCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
        ?? days.find((day) => day.phase !== "rest")?.phase
        ?? "rest";
      const phaseLabel = phase === "revise" ? "Review" : phase === "mock" ? "Timed practice" : phase === "rest" ? "Rest & reset" : "Learn";
      return {
        from: days[0]?.day ?? 0,
        to: days[days.length - 1]?.day ?? 0,
        phaseLabel,
        focus: focus.length ? focus.join(" · ") : days[0]?.focus ?? "Rest and reset",
        problemCount: rows.length,
      };
    });
  }, [plan.days]);

  async function generateSheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = brief.trim();
    if (!request || busy) return;
    setBusy(true);
    setFeedback("");
    try {
      const suggestion = await planFromAi(request, { solved: solvedNumbers });
      setConfig(suggestion.config);
      setBrief(request);
      setGenerated(true);
      setEditing(false);
      setSource(suggestion.source);
      setFeedback(suggestion.note);
      setDayOffset(0);
      setChatMessages([]);
      setChatError("");
      writePlanConfig(suggestion.config);
    } finally {
      setBusy(false);
    }
  }

  async function askCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = chatDraft.trim();
    if (!request || chatBusy) return;
    const historyItems: CoachMessage[] = [
      { role: "user", content: brief },
      { role: "assistant", content: coachReply },
      ...chatMessages.slice(-5),
      { role: "user", content: request },
    ];
    const history = historyItems.slice(-7);
    const userMessage: CoachMessage = { role: "user", content: request };
    setChatMessages((current) => [...current.slice(-10), userMessage, { role: "assistant", content: "", streaming: true }]);
    setChatDraft("");
    setChatError("");
    setChatBusy(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "tutor",
          language,
          stream: true,
          messages: history.map((message) => ({ role: message.role, content: message.content.slice(0, 1200) })),
        }),
        signal: AbortSignal.timeout(90_000),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error ?? "The coach could not answer. Please try again.");
      }
      if (!response.headers.get("content-type")?.includes("text/event-stream") || !response.body) {
        throw new Error("The coach returned an unreadable response. Please try again.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      const updatePending = (content: string) => setChatMessages((current) => current.map((message, index) => (
        index === current.length - 1 && message.role === "assistant" && message.streaming
          ? { ...message, content }
          : message
      )));
      const consumeEvent = (event: string) => {
        const lines = event.split(/\r?\n/);
        const eventType = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
        const data = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
        if (!data) return;
        let payload: { text?: string; error?: string };
        try {
          payload = JSON.parse(data) as { text?: string; error?: string };
        } catch {
          throw new Error("The coach sent an unreadable response. Please try again.");
        }
        if (eventType === "error") throw new Error(payload.error ?? "The coach could not answer. Please try again.");
        if (typeof payload.text === "string") {
          answer += payload.text;
          updatePending(textBeforeDiagram(answer));
        }
      };
      try {
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";
          events.forEach(consumeEvent);
          if (done) {
            if (buffer.trim()) consumeEvent(buffer);
            break;
          }
        }
      } finally {
        reader.releaseLock();
      }
      const completeAnswer = answer.trim();
      if (!completeAnswer) throw new Error("The coach returned an empty reply. Please try again.");
      const reply = parseTutorReply(completeAnswer);
      const assistantMessage: CoachMessage = {
        role: "assistant",
        ...reply,
        content: reply.content || (reply.diagram ? `Here is the ${reply.diagram.title} diagram.` : completeAnswer),
      };
      setChatMessages((current) => [...current.slice(0, -1), assistantMessage]);
    } catch (error) {
      setChatMessages((current) => {
        const pending = current[current.length - 1];
        if (pending?.role !== "assistant" || !pending.streaming) return current;
        const previous = current.slice(0, -1);
        return pending.content ? [...previous, { ...pending, streaming: false }] : previous;
      });
      setChatError(error instanceof Error && error.message !== "Failed to fetch"
        ? error.message
        : "Could not reach your coach. Check your connection and try again.");
    } finally {
      setChatBusy(false);
    }
  }

  return (
    <section className="ai-sheet-page" aria-label="AI-generated practice sheet">
      <header className="ai-sheet-hero">
        <div className="ai-sheet-hero-copy">
          <span className="ai-sheet-eyebrow"><Sparkles size={14} /> YOUR PERSONAL DSA COACH</span>
          <h2>A plan made for<br /><em>your next big step.</em></h2>
          <p>Tell us your goal, your timeline, and what feels tough. We’ll turn the 250-question library into a practice plan that fits your life.</p>
          <div className="ai-sheet-hero-trust"><span><Check size={13} /> Built from real sheet problems</span><i /><span>Progress saves as you solve</span></div>
        </div>
        <div className="ai-sheet-hero-art" aria-hidden="true"><div className="ai-sheet-orbit ai-sheet-orbit-one" /><div className="ai-sheet-orbit ai-sheet-orbit-two" /><div className="ai-sheet-orbit-center"><Target size={28} /></div><span className="ai-sheet-art-label">ONE REP AT A TIME</span></div>
      </header>

      {generated && !editing && (
        <div className="ai-sheet-current-goal">
          <span className="ai-sheet-current-icon"><CalendarDays size={16} /></span>
          <div><small>YOUR PLAN IS BUILT AROUND</small><strong>{brief}</strong></div>
          <button type="button" onClick={() => setEditing(true)}>Edit goal</button>
        </div>
      )}

      {(!generated || editing) && <div className="ai-sheet-builder">
      <div className="ai-sheet-builder-heading"><span>01</span><div><h3>What are you working toward?</h3><p>Share as much or as little as you like. You can mention time, pace, or topics.</p></div></div>
      <form className="ai-sheet-prompt" onSubmit={(event) => void generateSheet(event)}>
        <label htmlFor="ai-sheet-brief">
          <textarea
            id="ai-sheet-brief"
            value={brief}
            maxLength={400}
            onChange={(event) => setBrief(event.target.value)}
            placeholder="e.g. I have 8 weeks until placements. I can practice 4 days a week, and trees are my weak spot…"
            rows={4}
            aria-describedby="ai-sheet-prompt-help"
          />
        </label>
        <div className="ai-sheet-prompt-footer">
          <span id="ai-sheet-prompt-help">{brief.length}/400 <i /> Include your timeline, weekly pace, and topics you want to focus on.</span>
          <div className="ai-sheet-prompt-actions">
            {editing && generated && <button className="ai-sheet-cancel-edit" type="button" onClick={() => { setBrief(config.goal); setEditing(false); }}>Back to my plan</button>}
            <button type="submit" disabled={!brief.trim() || busy}>
              {busy ? <><LoaderCircle size={16} className="ai-sheet-spinner" /> Building your plan…</> : <><Sparkles size={15} /> Create my plan <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      </form>

      {!generated && (
        <div className="ai-sheet-ideas">
          <span className="ai-sheet-ideas-label">OR PICK A STARTING POINT</span>
          <div className="ai-sheet-idea-grid">{promptIdeas.map(({ icon: Icon, title, detail, prompt }) => <button key={title} type="button" onClick={() => setBrief(prompt)}><span className="ai-sheet-idea-icon"><Icon size={16} /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={14} /></button>)}</div>
        </div>
      )}
      </div>}

      {generated && (
        <div className="ai-sheet-results">
          <div className="ai-sheet-section-heading"><span>02</span><div><h3>Your practice path</h3><p>A manageable next step, built around your schedule.</p></div></div>
          <div className="ai-sheet-chat-thread" aria-label="Conversation with your coach" aria-live="polite">
            <div className="ai-sheet-user-message">
              <span className="ai-sheet-user-avatar" aria-hidden="true">Y</span>
              <p>{brief}</p>
            </div>
            <div className="ai-sheet-assistant-message">
              <span className="ai-sheet-assistant-avatar" aria-hidden="true"><Sparkles size={15} /></span>
              <div>
                <strong>Your coach</strong>
                {coachReply.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                <small>Approach, not pressure. You can edit your goal anytime.</small>
              </div>
            </div>
            {chatMessages.map((message, index) => (
              <div className={message.role === "user" ? "ai-sheet-user-message" : "ai-sheet-assistant-message"} key={`${message.role}-${index}`}>
                {message.role === "user" ? (
                  <>
                    <span className="ai-sheet-user-avatar" aria-hidden="true">Y</span>
                    <p>{message.content}</p>
                  </>
                ) : (
                  <>
                    <span className="ai-sheet-assistant-avatar" aria-hidden="true"><Sparkles size={15} /></span>
                    <div>
                      <strong>Your coach</strong>
                      {message.content && message.content.split(/\n{2,}/).map((paragraph, partIndex) => <p key={partIndex}>{paragraph}</p>)}
                      {message.streaming && <small className="ai-sheet-chat-thinking"><LoaderCircle size={12} className="ai-sheet-spinner" /> {message.content ? "Writing…" : "Thinking…"}</small>}
                      {message.diagram && <DsaDiagramView diagram={message.diagram} />}
                      {message.diagramError && <p className="ai-sheet-diagram-error" role="status">{message.diagramError}</p>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {!editing && <form className="ai-sheet-follow-up" onSubmit={(event) => void askCoach(event)}>
            <label htmlFor="ai-sheet-follow-up">Ask your coach anything</label>
            <div>
              <textarea
                id="ai-sheet-follow-up"
                rows={2}
                maxLength={600}
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask about a pattern, a problem, or how to approach your next practice session…"
                aria-describedby={chatError ? "ai-sheet-chat-error" : "ai-sheet-chat-help"}
              />
              <button type="submit" disabled={chatBusy || !chatDraft.trim()}>{chatBusy ? <LoaderCircle size={15} className="ai-sheet-spinner" /> : <ArrowRight size={15} />} {chatBusy ? "Thinking…" : "Send"}</button>
            </div>
            <small id="ai-sheet-chat-help">Your coach is here whenever you want to ask a follow-up. Press Enter to send, Shift+Enter for a new line.</small>
            {chatError && <p className="ai-sheet-chat-error" id="ai-sheet-chat-error" role="alert">{chatError}</p>}
          </form>}
          <header className="ai-sheet-result-heading">
            <div>
              <span className="ai-sheet-result-kicker"><span className={source === "ai" ? "ai-sheet-status-dot" : "ai-sheet-status-dot local"} />{source === "ai" ? "AI PERSONALIZED" : source === "local" ? "PERSONALIZED FROM YOUR WORDS" : "SAVED PERSONALIZED PLAN"}</span>
              <h4>{plan.track.label}</h4>
              {source === "local" && <p className="ai-sheet-local-note">The AI service is unavailable, so we used the details we could read locally.</p>}
            </div>
            <div className="ai-sheet-completion"><strong>{completed}<small>/{selectedNumbers.size}</small></strong><span>problems solved</span></div>
          </header>

          <div className="ai-sheet-progress-track" role="progressbar" aria-label="Personalized plan progress" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={selectedNumbers.size}><span style={{ width: `${selectedNumbers.size ? (completed / selectedNumbers.size) * 100 : 0}%` }} /></div>

          <div className="ai-sheet-summary">
            <div><CalendarDays size={15} /><span>{plan.track.days} days</span></div>
            <div><Clock3 size={15} /><span>{plan.perStudyDay} problems / study day</span></div>
            <div><Target size={15} /><span>{plan.config.daysPerWeek} practice days / week</span></div>
            <div><Check size={15} /><span>{plan.learnTotal} problems in your plan</span></div>
            {config.weakPatterns.map((pattern) => <span className="ai-sheet-focus-chip" key={pattern}>{pattern}</span>)}
          </div>

          <section className="ai-sheet-roadmap" aria-label="Roadmap diagram based on your plan">
            <header><span className="ai-sheet-roadmap-icon"><MapIcon size={16} /></span><div><h4>Your roadmap, visualized</h4><p>Each step is based on the real problems and practice days in your plan.</p></div></header>
            <ol>
              {roadmapSegments.map((segment, index) => (
                <li key={segment.from}>
                  <span>STEP {String(index + 1).padStart(2, "0")} · DAYS {segment.from}–{segment.to}</span>
                  <strong>{segment.phaseLabel}</strong>
                  <p>{segment.focus}</p>
                  <small>{segment.problemCount} {segment.problemCount === 1 ? "problem" : "problems"}</small>
                </li>
              ))}
            </ol>
          </section>

          <div className="ai-sheet-plan-toolbar">
            <div><span>YOUR FIRST WEEK</span><strong>Days {rangeStart}–{rangeEnd} <small>of {plan.days.length}</small></strong></div>
            <div className="ai-sheet-plan-nav">
              <button type="button" aria-label="Previous days" disabled={dayOffset === 0} onClick={() => setDayOffset((offset) => Math.max(0, offset - 7))}><ArrowLeft size={15} /></button>
              <button type="button" aria-label="Next days" disabled={dayOffset + 7 >= plan.days.length} onClick={() => setDayOffset((offset) => Math.min(Math.max(0, plan.days.length - 7), offset + 7))}><ArrowRight size={15} /></button>
            </div>
          </div>

          <div className="ai-sheet-day-list">
            {visibleDays.map((day) => (
              <section className={`ai-sheet-day${day.rows.length ? "" : " empty"}${day.day === 1 ? " first" : ""}`} key={day.day}>
                <header><span>DAY {String(day.day).padStart(2, "0")}</span><strong>{day.focus}</strong><small>{day.phase === "learn" ? "PRACTICE" : day.phase === "revise" ? "REVIEW" : day.phase === "mock" ? "TIMED SET" : "REST"}</small></header>
                {day.rows.length ? (
                  <ul>{day.rows.map((problem: Problem) => {
                    const solved = statusOf(problem.number) === "Solved";
                    return (
                      <li className={solved ? "solved" : ""} key={problem.number}>
                        <button type="button" className="ai-sheet-tick" aria-label={`${solved ? "Unmark" : "Mark"} ${problem.title} ${solved ? "unsolved" : "solved"}`} aria-pressed={solved} onClick={() => onStatus(problem.number, solved ? "Todo" : "Solved")}>{solved && <Check size={13} />}</button>
                        <span className="ai-sheet-problem-number">{String(problem.number).padStart(3, "0")}</span>
                        <a href={problem.link} target="_blank" rel="noreferrer"><strong>{problem.title}</strong><ExternalLink size={12} /></a>
                        <span className="ai-sheet-problem-meta">{problem.pattern} · {problem.difficulty}</span>
                      </li>
                    );
                  })}</ul>
                ) : <p>{day.phase === "rest" ? "Rest day. Let the patterns settle." : "No new problems scheduled for this day."}</p>}
              </section>
            ))}
          </div>
          <footer className="ai-sheet-disclaimer"><span>✳</span> Problems come from the curated CodexSheet library. This plan is a practice guide, not a hiring guarantee.</footer>
        </div>
      )}
    </section>
  );
}
