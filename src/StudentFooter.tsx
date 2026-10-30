// Students who have never signed in are the ones whose feedback matters most,
// so this form needs no Clerk session and no pass — the row is written straight
// to student_feedback and rides the same digest that carries payment alerts to
// Aditya's inbox. There is no read policy: the message leaves the database only
// inside his mail.
import { useState, type FormEvent } from "react";
import { Mail, MessageSquareText, Send } from "lucide-react";
import { supabasePublic } from "./lib/supabase";
import { mentorEmail } from "./mentorship";
import { useT } from "./i18n";

const emailShape = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;
// Students type the gmail username they remember rather than the full address,
// and a native type="email" check would then swallow the click with a tooltip
// nobody reads, so the bare name is completed here and validated in code.
const bareUsername = /^[a-z0-9][a-z0-9._%+-]*$/i;

function resolveEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed.includes("@") && bareUsername.test(trimmed) && trimmed.length >= 6) return `${trimmed}@gmail.com`;
  return trimmed;
}

export default function StudentFooter({ compact = false }: { compact?: boolean }) {
  const tr = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [reason, setReason] = useState("");
  const [repliedTo, setRepliedTo] = useState("");

  const mailtoHref = `mailto:${mentorEmail}?subject=${encodeURIComponent("CodexSheet student feedback")}&body=${encodeURIComponent(`${message}\n\n— ${name || "Anonymous"} (${resolveEmail(email)})`)}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = message.trim();
    const address = resolveEmail(email);
    if (body.length < 5 || !emailShape.test(address)) {
      setReason(tr("footer.feedbackBadInput"));
      setState("failed");
      return;
    }
    setState("sending");
    if (!supabasePublic) {
      setReason(tr("footer.feedbackOffline"));
      setState("failed");
      return;
    }
    let failure = "";
    try {
      const { error } = await supabasePublic.from("student_feedback").insert({
        name: name.trim().slice(0, 80),
        email: address,
        message: body.slice(0, 2000),
      });
      if (error) failure = `${error.code ?? "error"} ${error.message}`;
    } catch (caught) {
      failure = caught instanceof Error ? caught.message : "The feedback request did not complete.";
    }
    if (failure) {
      setReason(failure.slice(0, 160));
      setState("failed");
      return;
    }
    setRepliedTo(address);
    setName("");
    setEmail("");
    setMessage("");
    setState("sent");
  }

  return (
    <footer className={`site-footer${compact ? " compact" : ""}`}>
      <div className="site-footer-brand">
        <strong>codexsheet</strong>
        <span>One pattern. One problem. One step forward.</span>
        <a className="site-footer-mail" href={`mailto:${mentorEmail}`} aria-label={`Email Aditya at ${mentorEmail}`}>
          <Mail size={13} /> {mentorEmail}
        </a>
        <span className="site-footer-rights">codexsheet@2026</span>
      </div>
      <form className="site-footer-feedback" onSubmit={(event) => void submit(event)}>
        <span className="site-footer-kicker"><MessageSquareText size={13} /> {tr("footer.feedbackTitle")}</span>
        <p>{tr("footer.feedbackBody")}</p>
        <div className="site-footer-fields">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder={tr("footer.feedbackName")} aria-label={tr("footer.feedbackName")} maxLength={80} />
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={tr("footer.feedbackEmail")} aria-label={tr("footer.feedbackEmail")} type="text" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={160} />
        </div>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={tr("footer.feedbackMessage")} aria-label={tr("footer.feedbackMessage")} rows={compact ? 2 : 3} maxLength={2000} />
        <div className="site-footer-send">
          <button className="primary-button" type="submit" disabled={state === "sending" || message.trim().length < 5}>
            <Send size={14} /> {state === "sending" ? tr("footer.feedbackSending") : tr("footer.feedbackSend")}
          </button>
          {state === "sent" && <span className="site-footer-done">{tr("footer.feedbackSent")} {repliedTo}</span>}
          {state === "failed" && (
            <span className="site-footer-error">
              {tr("footer.feedbackError")}{" "}
              <a href={mailtoHref}>{tr("footer.feedbackMail")}</a>
              {reason && <em className="site-footer-reason">{reason}</em>}
            </span>
          )}
        </div>
      </form>
    </footer>
  );
}
