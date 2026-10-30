// Students who have never signed in are the ones whose feedback matters most,
// so this form needs no Clerk session and no pass — the row is written straight
// to student_feedback and rides the same digest that carries payment alerts to
// Aditya's inbox. There is no read policy: the message leaves the database only
// inside his mail.
import { useState, type FormEvent } from "react";
import { Mail, MessageSquareText, Send } from "lucide-react";
import { supabase } from "./lib/supabase";
import { mentorEmail } from "./mentorship";
import { useT } from "./i18n";

const emailShape = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;

export default function StudentFooter({ compact = false }: { compact?: boolean }) {
  const tr = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const mailtoHref = `mailto:${mentorEmail}?subject=${encodeURIComponent("CodexSheet student feedback")}&body=${encodeURIComponent(`${message}\n\n— ${name || "Anonymous"} (${email})`)}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = message.trim();
    const address = email.trim();
    if (body.length < 5 || !emailShape.test(address)) {
      setState("failed");
      return;
    }
    setState("sending");
    const { error } = supabase
      ? await supabase.from("student_feedback").insert({ name: name.trim().slice(0, 80), email: address, message: body.slice(0, 2000) })
      : { error: new Error("Supabase is not configured.") };
    setState(error ? "failed" : "sent");
    if (!error) {
      setName("");
      setEmail("");
      setMessage("");
    }
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
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={tr("footer.feedbackEmail")} aria-label={tr("footer.feedbackEmail")} type="email" required maxLength={160} />
        </div>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={tr("footer.feedbackMessage")} aria-label={tr("footer.feedbackMessage")} rows={compact ? 2 : 3} maxLength={2000} required />
        <div className="site-footer-send">
          <button className="primary-button" type="submit" disabled={state === "sending" || message.trim().length < 5}>
            <Send size={14} /> {state === "sending" ? tr("footer.feedbackSending") : tr("footer.feedbackSend")}
          </button>
          {state === "sent" && <span className="site-footer-done">{tr("footer.feedbackSent")}</span>}
          {state === "failed" && (
            <span className="site-footer-error">
              {tr("footer.feedbackError")}{" "}
              <a href={mailtoHref}>{tr("footer.feedbackMail")}</a>
            </span>
          )}
        </div>
      </form>
    </footer>
  );
}
