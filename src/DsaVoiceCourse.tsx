import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, AudioLines, Check, Headphones, Mic2, Waves } from "lucide-react";
import DsaIde from "./DsaIde";
import "./dsa-voice-course.css";

const AGENT_ID = "agent_8401m7z5s784f9qt2c4gxeewfx35";
const TALK_URL = `https://elevenlabs.io/app/talk-to?agent_id=${AGENT_ID}`;
type PracticeProblem = { number: number; title: string; pattern: string; difficulty: "Easy" | "Medium" | "Hard"; link?: string };

export default function DsaVoiceCourse({ problems, userId }: { problems: PracticeProblem[]; userId: string | null }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

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

  return (
    <main className="dsa-voice-practice">
      <header className="dvp-heading">
        <div className="dvp-title-lockup"><span className="dvp-brand-icon"><AudioLines size={18} /></span><div><span>CODEXSHEET <i>/</i> VOICE PRACTICE</span><h1>JavaScript IDE <em>with Priya</em></h1></div></div>
        <span className="dvp-free-pill"><Check size={13} /> PASS ACCESS</span>
      </header>
      <section className="dvp-voice-bar" aria-label="Voice tutor controls">
        <div className="dvp-priya-lockup"><span className="dvp-priya-avatar"><Waves size={20} /></span><div><strong>Priya <i className="dvp-online-dot" /></strong><small>{ready ? "Voice tutor ready" : "Connecting to ElevenLabs"}</small></div></div>
        <p>Keep the IDE open and talk through your approach as you code.</p>
        <div className="dvp-widget-slot" ref={mountRef}>{!ready && <div className="dvp-connect-state"><span className="dvp-pulse"><Mic2 size={15} /></span><span>Preparing mic</span></div>}</div>
        <a className="dvp-fallback-link" href={TALK_URL} target="_blank" rel="noreferrer"><Headphones size={14} /> Open Priya <ArrowUpRight size={13} /></a>
      </section>
      <section className="dvp-ide-shell" aria-label="JavaScript DSA practice editor">
        <div className="dvp-ide-caption"><span><i /> PRACTICE WORKSPACE</span><span>JavaScript <b>JS</b></span></div>
        <DsaIde problems={problems} userId={userId} voicePractice />
      </section>
      <footer className="dvp-footer"><span>Voice sessions are handled by ElevenLabs.</span><span>JavaScript only · Runs in your browser</span></footer>
    </main>
  );
}
