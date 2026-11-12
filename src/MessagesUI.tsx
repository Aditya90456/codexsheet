import { ArrowLeft, LoaderCircle, MessageSquare, Send } from "lucide-react";
import type { DmMessage } from "./studentGraph";

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
  return (
    <div className="students-room" aria-label="Conversation">
      {!activeChat ? (
        <div className="students-room-empty">
          <span className="students-room-empty-mark"><MessageSquare size={20} /></span>
          <strong>Nothing open</strong>
          <p>Choose a thread, or search the network and start one.</p>
        </div>
      ) : (
        <>
          <button type="button" className="students-room-back" onClick={onBack} aria-label="Back to messages">
            <ArrowLeft size={17} />
          </button>
          <div className="students-log" role="log" aria-label={`Messages with ${activeChat.name}`} aria-live="polite">
            {older !== null && <button type="button" className="students-older" onClick={onLoadOlder}>Older messages</button>}
            {!messages.length && <p className="students-log-empty">First message. Ask the thing you were too proud to ask in the group chat.</p>}
            {messages.map((message) => (
              <div className={`students-line${message.from === userId ? " mine" : ""}`} key={message.id}>
                <span>{message.content}</span>
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
              placeholder={`Message ${activeChat.name}…`}
              aria-label={`Message ${activeChat.name}`}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
            />
            <button type="button" className="students-send" onClick={onSend} disabled={sending || draft.trim() === ""} aria-label="Send message">
              {sending ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}
            </button>
            <span className="students-compose-hint">Enter to send <span aria-hidden="true">·</span> Shift + Enter for a new line</span>
          </div>
        </>
      )}
    </div>
  );
}
