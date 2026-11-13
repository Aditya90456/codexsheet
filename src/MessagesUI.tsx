import { ArrowLeft, LoaderCircle, MessageSquare, Send } from "lucide-react";
import type { DmMessage } from "./studentGraph";
import { useRemoteTranslations } from "./i18n";

const messageUiCopy = [
  "Conversation",
  "Nothing open",
  "Choose a thread, or search the network and start one.",
  "Back to messages",
  "Conversation messages",
  "Older messages",
  "First message. Ask the thing you were too proud to ask in the group chat.",
  "Message",
  "Send message",
  "Sending message",
  "Enter to send",
  "Shift + Enter for a new line",
] as const;

type ActiveChat = { name: string; peerId: string };

type MessagesUIProps = {
  activeChat: ActiveChat | null;
  messages: DmMessage[];
  userId: string;
  older: number | null;
  draft: string;
  sending: boolean;
  tailRef: (node: HTMLDivElement | null) => void;
  onBack: () => void;
  onLoadOlder: () => void;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  formatTime: (iso: string) => string;
};

export default function MessagesUI({
  activeChat,
  messages,
  userId,
  older,
  draft,
  sending,
  tailRef,
  onBack,
  onLoadOlder,
  onDraftChange,
  onSend,
  formatTime,
}: MessagesUIProps) {
  const { translations, error } = useRemoteTranslations([...messageUiCopy]);
  const [
    conversationLabel,
    nothingOpenLabel,
    emptyPrompt,
    backLabel,
    messagesLabel,
    olderLabel,
    firstMessagePrompt,
    messagePlaceholder,
    sendLabel,
    sendingLabel,
    enterHint,
    shiftEnterHint,
  ] = translations;

  return (
    <div className="students-room" aria-label={conversationLabel}>
      {error && <p className="students-log-empty" role="status">{error}</p>}
      {!activeChat ? (
        <div className="students-room-empty">
          <span className="students-room-empty-mark"><MessageSquare size={20} /></span>
          <strong>{nothingOpenLabel}</strong>
          <p>{emptyPrompt}</p>
        </div>
      ) : (
        <>
          <button type="button" className="students-room-back" onClick={onBack} aria-label={backLabel}>
            <ArrowLeft size={17} />
          </button>
          <div className="students-log" role="log" aria-label={messagesLabel} aria-live="polite">
            {older !== null && <button type="button" className="students-older" onClick={onLoadOlder}>{olderLabel}</button>}
            {!messages.length && <p className="students-log-empty">{firstMessagePrompt}</p>}
            {messages.map((message) => (
              <div className={`students-line${message.from === userId ? " mine" : ""}`} key={message.id}>
                <span translate="no">{message.content}</span>
                <time dateTime={message.at}>{formatTime(message.at)}</time>
              </div>
            ))}
            <div ref={tailRef} />
          </div>
          <div className="students-compose">
            <textarea
              value={draft}
              rows={1}
              maxLength={2000}
              enterKeyHint="send"
              placeholder={messagePlaceholder}
              aria-label={messagePlaceholder}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
            />
            <button type="button" className="students-send" onClick={onSend} disabled={sending || draft.trim() === ""} aria-label={sending ? sendingLabel : sendLabel}>
              {sending ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}
            </button>
            <span className="students-compose-hint">{enterHint} <span aria-hidden="true">·</span> {shiftEnterHint}</span>
          </div>
        </>
      )}
    </div>
  );
}
