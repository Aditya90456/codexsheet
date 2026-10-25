import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Bot, Check, ChevronDown, CircleHelp, Command, Download, FileText, MessageSquare, Plus, Send, Settings2, ShieldCheck, Sparkles, Trash2, UserRound, Wifi, WifiOff } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type Reminder = { id: string; text: string; due: string; done: boolean };
const CHAT_KEY = "codexsheet-local-assistant-chats-v1";
const REMINDERS_KEY = "codexsheet-local-assistant-reminders-v1";
const OLLAMA_BASE = import.meta.env.DEV ? "/ollama" : "http://127.0.0.1:11434";
const STARTER: Message = { role: "assistant", content: "Hi, I’m your personal assistant. I run on your device with Ollama, so your conversation stays local. I can help you think, draft, plan, and keep track of reminders. What would you like to do?" };
const SUGGESTIONS = ["Help me plan my day", "Draft a polite follow-up email", "Break a goal into small steps"];

function readStorage<T>(key: string, fallback: T): T {
  try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) as T : fallback; } catch { return fallback; }
}

export default function PersonalAssistant() {
  const [messages, setMessages] = useState<Message[]>(() => readStorage(CHAT_KEY, [STARTER]));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState("gemma3:1b");
  const [models, setModels] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>(() => readStorage(REMINDERS_KEY, []));
  const [showReminders, setShowReminders] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => { localStorage.setItem(CHAT_KEY, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => {
    let live = true;
    const check = async () => {
      try {
        const response = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
        if (!response.ok) throw new Error("Ollama is not responding");
        const data = await response.json() as { models?: Array<{ name: string }> };
        if (!live) return;
        const available = (data.models ?? []).map((item) => item.name);
        setModels(available); setConnected(true);
        if (!available.includes(model) && available.length) setModel(available[0]);
      } catch { if (live) { setConnected(false); setModels([]); } }
    };
    void check(); const timer = window.setInterval(() => void check(), 10000);
    return () => { live = false; window.clearInterval(timer); controllerRef.current?.abort(); };
  }, [model]);

  async function sendMessage(text = draft) {
    const content = text.trim();
    if (!content || busy) return;
    setDraft(""); setError("");
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next); setBusy(true);
    const reminderMatch = content.match(/^(?:remind me to|add (?:a )?reminder to)\s+(.+?)(?:\s+(?:by|at|on)\s+(.+))?$/i);
    if (reminderMatch) {
      const when = reminderMatch[2] ? ` · ${reminderMatch[2]}` : "";
      const reminder = { id: crypto.randomUUID(), text: reminderMatch[1], due: reminderMatch[2] ?? "", done: false };
      setReminders((current) => [reminder, ...current]);
      setMessages((current) => [...current, { role: "assistant", content: `I’ve saved “${reminder.text}” as a reminder${when}. You can see it in Reminders. I can store it locally, but I can’t send notifications while this page is closed.` }]);
      setBusy(false); return;
    }
    const aborter = new AbortController(); controllerRef.current = aborter;
    try {
      const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: aborter.signal,
        body: JSON.stringify({ model, stream: false, messages: [
          { role: "system", content: "You are a warm, capable personal assistant. Help with planning, writing, brainstorming, and everyday questions. Keep answers clear and practical. If you lack current or personal information, say so. Do not claim to have performed external actions. The user can save reminders locally using commands like 'remind me to call Sam tomorrow'." },
          ...next.slice(-24),
        ] }),
      });
      if (!response.ok) throw new Error(`Ollama returned ${response.status}. Check that Ollama is running and the model is installed.`);
      const data = await response.json() as { message?: { content?: string } };
      setMessages((current) => [...current, { role: "assistant", content: data.message?.content?.trim() || "I didn’t get a response. Try again." }]);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      const isOllamaResponseError = cause instanceof Error && cause.message.includes("Ollama returned");
      setError(isOllamaResponseError
        ? cause.message
        : import.meta.env.DEV
          ? "I can’t reach Ollama at localhost:11434. Start Ollama and install a model, then try again."
          : `I can’t reach Ollama on this device. Start Ollama, allow ${window.location.origin} in OLLAMA_ORIGINS, then refresh. If your browser asks to allow local network access, allow it.`);
      setMessages((current) => current.filter((_, index) => index !== current.length - 1 || current[index]?.role !== "assistant"));
    } finally { setBusy(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void sendMessage(); }
  function newChat() { setMessages([STARTER]); setError(""); }
  function exportChat() {
    const transcript = messages.map((item) => `${item.role === "user" ? "You" : "Assistant"}\n${item.content}`).join("\n\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([transcript], { type: "text/plain" })); link.download = "assistant-chat.txt"; link.click(); URL.revokeObjectURL(link.href);
  }

  return <div className="local-assistant">
    <aside className="la-sidebar">
      <a className="la-brand" href="/"><span className="la-brand-mark"><Sparkles size={17}/></span><span>PERSONAL AI</span></a>
      <button className="la-new-chat" onClick={newChat}><Plus size={17}/> New conversation</button>
      <div className="la-sidebar-label">YOUR SPACE</div>
      <button className={`la-side-item ${showReminders ? "is-active" : ""}`} onClick={() => setShowReminders(!showReminders)}><Check size={16}/> Reminders <span className="la-count">{reminders.filter((item) => !item.done).length}</span></button>
      <button className="la-side-item" onClick={exportChat}><FileText size={16}/> Export conversation</button>
      <div className="la-sidebar-bottom">
        <div className="la-local-badge"><ShieldCheck size={17}/><span><b>Private by design</b><small>Chats stay in this browser</small></span></div>
        <a href="/" className="la-back-link"><ArrowLeft size={15}/> Back to CodexSheet</a>
      </div>
    </aside>

    <main className="la-main">
      <header className="la-topbar"><div><span className="la-mobile-brand"><Sparkles size={17}/> Personal AI</span><span className="la-breadcrumb">Personal assistant <span>/</span> Chat</span></div><div className="la-top-actions"><span className={`la-connection ${connected ? "online" : ""}`}><i/>{connected ? "Local model ready" : "Model offline"}</span><button className="la-icon-button" title="Settings" onClick={() => setShowSettings(!showSettings)}><Settings2 size={18}/></button></div></header>
      {showSettings && <div className="la-settings"><div><strong>Local model</strong><small>Choose a model installed in Ollama.</small></div><label><span>MODEL</span><select value={model} onChange={(event) => setModel(event.target.value)} disabled={!models.length}>{models.length ? models.map((item) => <option key={item}>{item}</option>) : <option>{model}</option>}</select><ChevronDown size={14}/></label>{import.meta.env.DEV ? <p>Your messages go to Ollama on this device through the Vite proxy. No hosted AI API is used.</p> : <><p>To use this deployed site, quit Ollama from the taskbar, run this in PowerShell, then reopen Ollama. Allow local network access if your browser asks. No hosted AI API is used.</p><code>[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "{window.location.origin}", "User")</code></>}</div>}
      {showReminders ? <section className="la-reminders"><div className="la-view-heading"><span className="la-kicker">YOUR SPACE</span><h1>Reminders</h1><p>Saved privately in this browser.</p></div>{reminders.length ? reminders.map((item) => <article className={`la-reminder ${item.done ? "done" : ""}`} key={item.id}><button aria-label="Mark reminder complete" onClick={() => setReminders((current) => current.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))}><Check size={16}/></button><span><strong>{item.text}</strong>{item.due && <small>{item.due}</small>}</span><button className="la-delete" aria-label="Delete reminder" onClick={() => setReminders((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={16}/></button></article>) : <div className="la-empty-reminders"><Check size={21}/><strong>Nothing on your list</strong><p>Try “Remind me to send the invoice tomorrow.”</p></div>}</section> : <>
        <section className="la-chat">
          <div className="la-messages">
            {messages.length === 1 && <div className="la-welcome"><div className="la-orb"><Sparkles size={23}/></div><span className="la-kicker">A LITTLE HELP, RIGHT HERE</span><h1>What can I help you<br/><em>take care of?</em></h1><p>Think something through, make a plan, or find the right words.</p></div>}
            {messages.map((item, index) => <article className={`la-message ${item.role}`} key={`${index}-${item.role}`}><span className="la-avatar">{item.role === "assistant" ? <Bot size={16}/> : <UserRound size={16}/>}</span><div><span className="la-sender">{item.role === "assistant" ? "Your assistant" : "You"}</span><p>{item.content}</p></div></article>)}
            {busy && <article className="la-message assistant"><span className="la-avatar"><Bot size={16}/></span><div><span className="la-sender">Your assistant</span><p className="la-thinking"><i/><i/><i/> Thinking locally</p></div></article>}
            <div ref={endRef}/>
          </div>
          {messages.length === 1 && <div className="la-suggestions">{SUGGESTIONS.map((item) => <button key={item} onClick={() => void sendMessage(item)}>{item}<ArrowLeft size={13}/></button>)}</div>}
          {error && <div className="la-error"><WifiOff size={17}/><div><strong>Your local model isn’t connected</strong><span>{error}</span><small>Install Ollama, then run <code>ollama run gemma3:1b</code> in a terminal. <a href="https://ollama.com/download" target="_blank" rel="noreferrer">Get Ollama</a></small></div></div>}
          <form className="la-composer" onSubmit={submit}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Message your assistant…" rows={1} disabled={busy}/><div className="la-composer-tools"><span><Command size={13}/> Enter to send · Shift + Enter for a new line</span><button type="submit" disabled={busy || !draft.trim()} aria-label="Send message"><Send size={17}/></button></div></form>
          <p className="la-disclaimer"><ShieldCheck size={13}/> Runs on your device with Ollama <span>·</span> No API key required</p>
        </section>
      </>}
    </main>
  </div>;
}
