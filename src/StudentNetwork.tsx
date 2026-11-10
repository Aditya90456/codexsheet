// StudentNetwork.tsx — the CodexSheet network rail at /network.
//
// Two surfaces, one sign-in. The board is where students post the code they just
// wrote and the batch likes, dislikes or picks apart in the comments; messages is
// the inbox - your threads on the left, the conversation in the middle, a person
// on the right. The data is all in Postgres (see studentGraph.ts), so a follow, a
// reaction and an unread count mean the same thing on every device. Realtime does
// the waiting: both migrations add their tables to the publication, and the select
// policies are what keep a private message between two people.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Crown,
  Inbox,
  LoaderCircle,
  MessageCircleOff,
  MessageSquare,
  Pencil,
  Search,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { refreshRealtimeAuth, supabase } from "./lib/supabase";
import {
  LANGUAGE_LABEL,
  commentOn,
  deleteComment,
  deletePost,
  loadDirectory,
  loadFeed,
  loadFeedUnread,
  loadFollowList,
  loadHistory,
  loadPost,
  loadProfile,
  loadThreads,
  markFeedSeen,
  markThreadRead,
  openChat,
  reactTo,
  sendDm,
  setFollow,
  shareCode,
  updateMyProfile,
  type BoardPost,
  type DmMessage,
  type FeedTab,
  type FollowListRow,
  type PostComment,
  type ShareLanguage,
  type StudentCard,
  type StudentProfile,
  type ThreadRow,
} from "./studentGraph";
import "./students.css";

type Open = { chatId: number; peerId: string; name: string };

function clock(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
}

function since(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "CS";
}

// Until 20261109_student_posts.sql is really in the project, every board call
// answers "Could not find the function … in the schema cache". A student can do
// nothing with Postgres's sentence about its own cache, so the rail recognises
// it and says the true thing instead: the board is not open yet.
function notDeployed(message: string) {
  return /schema cache|relation .* does not exist/i.test(message);
}

export default function StudentNetwork({ userId = "" }: { userId?: string }) {
  const [tab, setTab] = useState<"board" | "messages">("board");
  const [feedTab, setFeedTab] = useState<FeedTab>("all");
  const [feed, setFeed] = useState<BoardPost[]>([]);
  const [olderPost, setOlderPost] = useState<number | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [boardDown, setBoardDown] = useState(false);
  const [share, setShare] = useState({ caption: "", code: "", language: "python" as ShareLanguage, problem: "" });
  const [reading, setReading] = useState<number | null>(null);
  const [thread, setThread] = useState<PostComment[]>([]);
  const [reply, setReply] = useState("");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [people, setPeople] = useState<StudentCard[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Open | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [older, setOlder] = useState<number | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [acquaintances, setAcquaintances] = useState<FollowListRow[]>([]);
  const [listKind, setListKind] = useState<"followers" | "following">("followers");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", username: "", bio: "" });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [boardNew, setBoardNew] = useState(0);
  const [mine, setMine] = useState<StudentProfile | null>(null);
  const tail = useRef<HTMLDivElement | null>(null);
  const refreshTimer = useRef<number | null>(null);
  const openRef = useRef<number | null>(null);
  const readingRef = useRef<number | null>(null);
  const tabRef = useRef<"board" | "messages">("board");

  const refreshInbox = useCallback(() => {
    if (!userId) return;
    void loadThreads().then(({ rows, problem }) => {
      if (!problem) setThreads(rows);
    });
  }, [userId]);

  // The board is read from the server every time the tab or filter changes, so
  // the like count a student sees is the one Postgres counted, not a local guess.
  const refreshBoard = useCallback((kind: FeedTab) => {
    if (!userId) return;
    void loadFeed(kind).then(({ rows, problem }) => {
      if (problem) {
        setBoardDown(notDeployed(problem));
        if (!notDeployed(problem)) setNote(problem);
        setLoadingFeed(false);
        return;
      }
      setBoardDown(false);
      setFeed(rows);
      setOlderPost(rows.length >= 20 ? rows[rows.length - 1]?.id ?? null : null);
      setLoadingFeed(false);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) { setLoadingFeed(false); return; }
    setLoadingFeed(true);
    refreshBoard(feedTab);
  }, [feedTab, refreshBoard, userId]);

  // The badge only means something while the board is somewhere else, so opening
  // it is what clears Postgres's own "seen" marker for this student.
  useEffect(() => {
    tabRef.current = tab;
    if (!userId || tab !== "board") return;
    setBoardNew(0);
    void markFeedSeen();
  }, [tab, userId]);

  useEffect(() => {
    if (!userId) return;
    void loadFeedUnread().then(setBoardNew);
    void loadProfile().then(({ profile: found }) => found && setMine(found));
  }, [userId]);

  // Directory search is a server filter, so a handle nobody can type cannot
  // fake its way into the list.
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let alive = true;
    const timer = window.setTimeout(() => {
      void loadDirectory(query.trim(), 60).then(({ rows, problem }) => {
        if (!alive) return;
        setPeople(rows);
        setNote(problem);
        setLoading(false);
      });
    }, query.trim() === "" ? 0 : 220);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [query, userId]);

  useEffect(() => { refreshInbox(); }, [refreshInbox]);

  const openThread = useCallback(async (chatId: number, peerId: string, name: string) => {
    openRef.current = chatId;
    setOpen({ chatId, peerId, name });
    setProfile(null);
    setEditing(false);
    setMessages([]);
    setOlder(null);
    const { rows, problem } = await loadHistory(chatId);
    setMessages(rows);
    setNote(problem);
    setOlder(rows.length >= 40 ? rows[0]?.id ?? null : null);
    void markThreadRead(chatId);
    setThreads((current) => current.map((thread) => (thread.chatId === chatId ? { ...thread, unread: 0 } : thread)));
  }, []);

  // One subscription for the whole rail. Postgres hands over only the rows this
  // student is allowed to read, so an inbox-wide listener is safe.
  useEffect(() => {
    if (!supabase || !userId) return;
    const client = supabase;
    const channel = client
      .channel(`student-dms-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "student_dm_messages" }, (payload) => {
        const row = payload.new as { id: number; chat_id: number; sender_id: string; content: string; created_at: string };
        if (openRef.current === row.chat_id) {
          setMessages((list) => (list.some((item) => item.id === row.id) ? list : [...list, { id: row.id, from: row.sender_id, content: row.content, at: row.created_at }]));
          void markThreadRead(row.chat_id);
        }
        if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        refreshTimer.current = window.setTimeout(refreshInbox, 400);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "student_posts" }, () => {
        if (tabRef.current !== "board") setBoardNew((count) => count + 1);
        if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
        refreshTimer.current = window.setTimeout(() => refreshBoard(feedTab), 400);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "student_post_comments" }, (payload) => {
        const row = payload.new as { post_id: number };
        // A thread that is open on screen is re-read rather than patched from the
        // payload, because the payload has no author name in it.
        if (readingRef.current === row.post_id) {
          void loadPost(row.post_id).then(({ post, thread: rows }) => {
            if (post) putPost(post);
            setThread(rows);
          });
        } else {
          setFeed((list) => list.map((post) => (post.id === row.post_id ? { ...post, comments: post.comments + 1 } : post)));
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void refreshRealtimeAuth().catch(() => undefined);
      });
    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      void client.removeChannel(channel);
    };
  }, [feedTab, refreshBoard, refreshInbox, userId]);

  useEffect(() => { tail.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    void loadFollowList(profile.userId, listKind).then(({ rows }) => { if (alive) setAcquaintances(rows); });
    return () => { alive = false; };
  }, [listKind, profile]);

  const unread = useMemo(() => threads.reduce((total, thread) => total + thread.unread, 0), [threads]);

  async function pickPerson(peerId: string) {
    setNote("");
    const { profile: found, problem } = await loadProfile(peerId);
    if (!found) { setNote(problem); return; }
    setProfile(found);
    setOpen(null);
    setEditing(false);
    // The card lives in the people pane, so tapping an author on the board walks
    // the student over to it instead of opening something invisible.
    setTab("messages");
  }

  async function pickThread(thread: ThreadRow) {
    await openThread(thread.chatId, thread.peerId, thread.name);
  }

  async function toggleFollow(target: { userId: string; youFollow: boolean }) {
    setBusy(target.userId);
    const result = await setFollow(target.userId, !target.youFollow);
    setBusy("");
    if (!result.ok) { setNote(result.message); return; }
    setProfile((current) => (current && current.userId === target.userId
      ? { ...current, youFollow: !target.youFollow, followers: result.followers, following: result.following }
      : current));
    setPeople((current) => current.map((card) => (card.userId === target.userId ? { ...card, youFollow: !target.youFollow, followers: result.followers } : card)));
    setFeed((current) => current.map((post) => (post.userId === target.userId ? { ...post, youFollow: !target.youFollow } : post)));
  }

  async function message(peerId: string, peerName: string) {
    setNote("");
    const { chatId, problem } = await openChat(peerId);
    if (!chatId) { setNote(problem); return; }
    await openThread(chatId, peerId, peerName);
    setTab("messages");
    refreshInbox();
  }

  async function send() {
    const text = draft.trim();
    if (!open || text === "") return;
    setBusy("send");
    setNote("");
    const { message: sent, problem } = await sendDm(open.chatId, text.slice(0, 2000));
    if (!sent) setNote(problem);
    else setMessages((current) => (current.some((item) => item.id === sent.id) ? current : [...current, sent]));
    setDraft("");
    setBusy("");
    refreshInbox();
  }

  async function showOlder() {
    if (!open || older === null) return;
    const { rows } = await loadHistory(open.chatId, older);
    if (!rows.length) { setOlder(null); return; }
    setOlder(rows[0]?.id ?? null);
    setMessages((current) => [...rows, ...current]);
  }

  async function showOlderPosts() {
    if (olderPost === null) return;
    const { rows } = await loadFeed(feedTab, olderPost);
    if (!rows.length) { setOlderPost(null); return; }
    setOlderPost(rows[rows.length - 1]?.id ?? null);
    setFeed((current) => {
      const seen = new Set(current.map((post) => post.id));
      return [...current, ...rows.filter((post) => !seen.has(post.id))];
    });
  }

  function putPost(post: BoardPost) {
    setFeed((current) => (current.some((item) => item.id === post.id)
      ? current.map((item) => (item.id === post.id ? post : item))
      : [post, ...current]));
  }

  async function publish() {
    const code = share.code.trim();
    if (code === "") { setNote("The code is the post - paste the solution you want eyes on."); return; }
    setBusy("share");
    setNote("");
    const number = Number.parseInt(share.problem, 10);
    const { post, problem } = await shareCode({
      code,
      caption: share.caption.trim().slice(0, 600),
      language: share.language,
      problemNumber: Number.isFinite(number) ? number : null,
    });
    setBusy("");
    if (!post) { setNote(problem); return; }
    setShare({ caption: "", code: "", language: share.language, problem: "" });
    putPost(post);
    setNote("");
  }

  async function react(post: BoardPost, kind: "like" | "dislike") {
    setBusy(`react-${post.id}`);
    const { post: updated, problem } = await reactTo(post.id, post.myReaction === kind ? "none" : kind);
    setBusy("");
    if (!updated) { setNote(problem); return; }
    putPost(updated);
  }

  async function readThread(post: BoardPost) {
    if (reading === post.id) {
      readingRef.current = null;
      setReading(null);
      setThread([]);
      return;
    }
    setBusy(`read-${post.id}`);
    const { post: fresh, thread: rows, problem } = await loadPost(post.id);
    setBusy("");
    if (fresh) putPost(fresh);
    if (problem) { setNote(problem); return; }
    readingRef.current = post.id;
    setThread(rows);
    setReading(post.id);
  }

  async function replyTo(post: BoardPost) {
    const text = reply.trim();
    if (text === "") return;
    setBusy(`reply-${post.id}`);
    setNote("");
    const { post: updated, comment, problem } = await commentOn(post.id, text.slice(0, 1500));
    setBusy("");
    if (!comment) { setNote(problem); return; }
    setThread((current) => (current.some((item) => item.id === comment.id) ? current : [...current, comment]));
    if (updated) putPost(updated);
    else setFeed((current) => current.map((item) => (item.id === post.id ? { ...item, comments: item.comments + 1 } : item)));
    setReply("");
  }

  async function removePost(post: BoardPost) {
    const problem = await deletePost(post.id);
    if (problem) { setNote(problem); return; }
    setFeed((current) => current.filter((item) => item.id !== post.id));
    if (reading === post.id) { setReading(null); setThread([]); }
  }

  async function removeComment(post: BoardPost, comment: PostComment) {
    const problem = await deleteComment(comment.id);
    if (problem) { setNote(problem); return; }
    setThread((current) => current.filter((item) => item.id !== comment.id));
    setFeed((current) => current.map((item) => (item.id === post.id ? { ...item, comments: Math.max(0, item.comments - 1) } : item)));
  }

  function startEditing() {
    if (!profile) return;
    setForm({ displayName: profile.name, username: profile.username, bio: profile.bio });
    setEditing(true);
  }

  async function saveCard() {
    setBusy("card");
    const { profile: saved, problem } = await updateMyProfile({
      displayName: form.displayName.trim(),
      username: form.username.trim().toLowerCase(),
      bio: form.bio.trim(),
    });
    setBusy("");
    if (!saved) { setNote(problem); return; }
    setProfile(saved);
    setEditing(false);
    void loadDirectory(query.trim(), 60).then(({ rows }) => setPeople(rows));
  }

  if (!userId) {
    return (
      <section className="students" aria-labelledby="students-title">
        <header className="students-head">
          <span className="students-kicker"><Users size={13} /> THE CODEXSHEET NETWORK</span>
          <h1 id="students-title">Find the others working through the 250</h1>
          <p>Sign in to share the code you wrote, follow students, read your threads and get a doubt answered by someone who has already solved it.</p>
        </header>
      </section>
    );
  }

  return (
    <section className="students" aria-labelledby="students-title">
      <header className="students-head">
        <span className="students-kicker">
          <Users size={13} /> CODEXSHEET NETWORK · {loading ? "COUNTING" : `${people.length + 1} STUDENTS`}
          {unread > 0 && <em className="students-unread">{unread} new</em>}
        </span>
        <h1 id="students-title">Nobody gets through the sheet alone</h1>
        <p>
          Post the code you wrote, read what the batch wrote, follow the students whose approach you want,
          and message anyone here. A student you have not connected with gets one message until they answer -
          that is what keeps the doubt channels real.
        </p>
        <div className="students-tabs" role="tablist" aria-label="Network">
          <button type="button" role="tab" aria-selected={tab === "board"} className={tab === "board" ? "active" : ""} onClick={() => setTab("board")}>
            <Share2 size={13} /> Board
            {boardNew > 0 && <b className="students-pill">{boardNew}</b>}
          </button>
          <button type="button" role="tab" aria-selected={tab === "messages"} className={tab === "messages" ? "active" : ""} onClick={() => setTab("messages")}>
            <Inbox size={13} /> Messages
            {unread > 0 && <b className="students-pill">{unread}</b>}
          </button>
        </div>
      </header>

      {note && <p className="students-note" role="status">{note}</p>}

      <div className={`students-panes${tab === "board" ? " board" : ""}`}>
        {tab === "board" ? (
          <section className="students-board" aria-label="The board">
            {boardDown ? (
              <div className="students-soon">
                <span className="students-soon-mark"><Share2 size={14} /></span>
                <h3>Sharing opens soon</h3>
                <p>The board is built and switched on for the whole batch at once, so there is nothing to post into yet. Meanwhile the other half of the network works today - follow a student and ask the doubt you are sitting on.</p>
                <button type="button" className="students-soon-go" onClick={() => setTab("messages")}><Inbox size={13} /> Go to Messages</button>
              </div>
            ) : (
              <>
            <form
              className="students-share"
              onSubmit={(event) => { event.preventDefault(); void publish(); }}
            >
              <span className="students-avatar" aria-hidden="true">{initials(mine?.name ?? "You")}</span>
              <div className="students-share-body">
                <input
                  value={share.caption}
                  maxLength={600}
                  placeholder="What should they look at?"
                  aria-label="Say something about your code"
                  onChange={(event) => setShare({ ...share, caption: event.target.value })}
                />
                <textarea
                  value={share.code}
                  rows={5}
                  maxLength={20000}
                  placeholder={"Paste the function you want eyes on…"}
                  aria-label="Code to share"
                  onChange={(event) => setShare({ ...share, code: event.target.value })}
                />
                <div className="students-share-foot">
                  <select
                    value={share.language}
                    aria-label="Language"
                    onChange={(event) => setShare({ ...share, language: event.target.value as ShareLanguage })}
                  >
                    {(Object.keys(LANGUAGE_LABEL) as ShareLanguage[]).map((code) => (
                      <option key={code} value={code}>{LANGUAGE_LABEL[code]}</option>
                    ))}
                  </select>
                  <input
                    value={share.problem}
                    inputMode="numeric"
                    maxLength={3}
                    placeholder="Problem #"
                    aria-label="Sheet problem number"
                    onChange={(event) => setShare({ ...share, problem: event.target.value.replace(/\D/g, "") })}
                  />
                  <button type="submit" className="students-send" disabled={busy === "share" || share.code.trim() === ""}>
                    {busy === "share" ? <LoaderCircle size={14} className="spin" /> : <Share2 size={14} />} Share
                  </button>
                </div>
              </div>
            </form>

            <div className="students-filters" role="tablist" aria-label="Which posts">
              {(["all", "following", "mine"] as FeedTab[]).map((kind) => (
                <button
                  type="button"
                  key={kind}
                  role="tab"
                  aria-selected={feedTab === kind}
                  className={feedTab === kind ? "active" : ""}
                  onClick={() => setFeedTab(kind)}
                >
                  {kind === "all" ? "Everyone" : kind === "following" ? "Following" : "My posts"}
                </button>
              ))}
            </div>

            {loadingFeed ? (
              <p className="students-loading"><LoaderCircle size={14} className="spin" /> Reading the board…</p>
            ) : (
              <div className="students-posts">
                {!feed.length && (
                  <p className="students-pane-empty">
                    <MessageCircleOff size={14} /> Nothing shared yet.
                    {feedTab === "following" ? " Follow a student and their work lands here." : " Paste the first solution."}
                  </p>
                )}
                {feed.map((post) => (
                  <article className={`students-post${reading === post.id ? " open" : ""}`} key={post.id}>
                    <header className="students-post-head">
                      <button type="button" className="students-card-who" onClick={() => void pickPerson(post.userId)}>
                        <span className="students-avatar" aria-hidden="true">{initials(post.name)}</span>
                        <span>
                          <strong>{post.name}</strong>
                          <small>
                            {post.username ? `@${post.username} · ` : ""}{post.rankTitle}
                            {post.followsYou && " · follows you"}
                          </small>
                        </span>
                      </button>
                      <em>{since(post.at)}</em>
                      {post.isMine && (
                        <button type="button" className="students-kill" onClick={() => void removePost(post)} aria-label="Delete your post">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </header>

                    {post.caption && <p className="students-post-caption">{post.caption}</p>}

                    <pre className="students-code" tabIndex={0} aria-label={`${LANGUAGE_LABEL[post.language] ?? post.language} code shared by ${post.name}`}><code>{post.code}</code></pre>

                    <p className="students-post-meta">
                      <span className="students-chip">{LANGUAGE_LABEL[post.language] ?? post.language}</span>
                      {post.problemNumber !== null && (
                        <span className="students-chip problem">
                          #{post.problemNumber} {post.problemTitle}
                        </span>
                      )}
                      <span>{post.solved}/250 solved</span>
                    </p>

                    <div className="students-post-bar">
                      <button type="button" className={`students-react${post.myReaction === "like" ? " on" : ""}`} onClick={() => void react(post, "like")} disabled={busy === `react-${post.id}`}>
                        <ThumbsUp size={13} /> {post.likes}
                      </button>
                      <button type="button" className={`students-react down${post.myReaction === "dislike" ? " on" : ""}`} onClick={() => void react(post, "dislike")} disabled={busy === `react-${post.id}`}>
                        <ThumbsDown size={13} /> {post.dislikes}
                      </button>
                      <button type="button" className={`students-read${reading === post.id ? " on" : ""}`} onClick={() => void readThread(post)} disabled={busy === `read-${post.id}`}>
                        <MessageSquare size={13} /> {post.comments} comment{post.comments === 1 ? "" : "s"}
                      </button>
                      {!post.isMine && (
                        <>
                          <button type="button" className={`students-follow${post.youFollow ? " on" : ""}`} onClick={() => void toggleFollow(post)} disabled={busy === post.userId}>
                            {post.youFollow ? <UserCheck size={13} /> : <UserPlus size={13} />} {post.youFollow ? "Following" : "Follow"}
                          </button>
                          <button type="button" className="students-sendghost" onClick={() => void message(post.userId, post.name)}><Send size={13} /> Message</button>
                        </>
                      )}
                    </div>

                    {reading === post.id && (
                      <div className="students-comments">
                        {!thread.length && <p className="students-pane-empty">No comments yet. Say what you would have done.</p>}
                        {thread.map((comment) => (
                          <p className={`students-reply${comment.isMine ? " mine" : ""}`} key={comment.id}>
                            <button type="button" onClick={() => void pickPerson(comment.userId)}><strong>{comment.name}</strong></button>
                            <span>{comment.content}</span>
                            <em>{clock(comment.at)}</em>
                            {comment.isMine && (
                              <button type="button" className="students-kill" onClick={() => void removeComment(post, comment)} aria-label="Delete your comment">
                                <X size={11} />
                              </button>
                            )}
                          </p>
                        ))}
                        <div className="students-compose">
                          <input
                            value={reply}
                            maxLength={1500}
                            placeholder="Add to this thread…"
                            aria-label={`Comment on ${post.name}'s code`}
                            onChange={(event) => setReply(event.target.value)}
                            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void replyTo(post); } }}
                          />
                          <button type="button" className="students-send" onClick={() => void replyTo(post)} disabled={busy === `reply-${post.id}` || reply.trim() === ""}>
                            {busy === `reply-${post.id}` ? <LoaderCircle size={13} className="spin" /> : <Send size={13} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
                {olderPost !== null && feed.length > 0 && (
                  <button type="button" className="students-older" onClick={() => void showOlderPosts()}>Older shares</button>
                )}
              </div>
            )}
              </>
            )}
          </section>
        ) : (
          <>
            <aside className="students-inbox" aria-label="Your threads">
              <h2 className="students-pane-title"><Inbox size={13} /> MESSAGES</h2>
              {!threads.length && !loading && (
                <p className="students-pane-empty"><MessageCircleOff size={14} /> No threads yet. Pick a student on the right and say hello.</p>
              )}
              <ul className="students-threads">
                {threads.map((thread) => (
                  <li key={thread.chatId}>
                    <button
                      type="button"
                      className={`students-thread${open?.chatId === thread.chatId ? " active" : ""}`}
                      onClick={() => void pickThread(thread)}
                    >
                      <span className="students-avatar" aria-hidden="true">{initials(thread.name)}</span>
                      <span className="students-thread-copy">
                        <strong>{thread.name}</strong>
                        <span>{thread.lastMessage || "Say something first"}</span>
                      </span>
                      <span className="students-thread-when">
                        <em>{since(thread.at)}</em>
                        {thread.unread > 0 && <b className="students-pill">{thread.unread}</b>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
    
            <div className="students-room" aria-label="Conversation">
              {!open ? (
                <div className="students-room-empty">
                  <Users size={22} />
                  <strong>Nothing open</strong>
                  <p>Choose a thread on the left, or search the network and start one.</p>
                </div>
              ) : (
                <>
                  <header className="students-room-head">
                    <button type="button" className="students-back" onClick={() => setOpen(null)}><ArrowLeft size={14} /> Back</button>
                    <div>
                      <strong>{open.name}</strong>
                      <small>{profileHint(open.peerId, people)}</small>
                    </div>
                  </header>
                  <div className="students-log">
                    {older !== null && <button type="button" className="students-older" onClick={() => void showOlder()}>Older messages</button>}
                    {!messages.length && <p className="students-log-empty">First message. Ask the thing you were too proud to ask in the group chat.</p>}
                    {messages.map((message) => (
                      <p className={`students-line${message.from === userId ? " mine" : ""}`} key={message.id}>
                        <span>{message.content}</span>
                        <em>{clock(message.at)}</em>
                      </p>
                    ))}
                    <div ref={tail} />
                  </div>
                  <div className="students-compose">
                    <textarea
                      value={draft}
                      rows={2}
                      maxLength={2000}
                      placeholder={`Message ${open.name}…`}
                      aria-label={`Message ${open.name}`}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }}
                    />
                    <button type="button" className="students-send" onClick={() => void send()} disabled={busy === "send" || draft.trim() === ""}>
                      {busy === "send" ? <LoaderCircle size={14} className="spin" /> : <Send size={14} />} Send
                    </button>
                  </div>
                </>
              )}
            </div>
    
            <aside className="students-people" aria-label="The network">
              {!profile ? (
                <>
                  <h2 className="students-pane-title"><Users size={13} /> EVERYONE</h2>
                  <label className="students-search">
                    <Search size={13} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or handle" aria-label="Search students" />
                    {query && <button type="button" className="students-clear" onClick={() => setQuery("")} aria-label="Clear search"><X size={12} /></button>}
                  </label>
                  {loading ? (
                    <p className="students-loading"><LoaderCircle size={14} className="spin" /> Reading the network…</p>
                  ) : (
                    <ul className="students-cards">
                      {!people.length && <li className="students-pane-empty">Nobody by that name. The sheet is still young.</li>}
                      {people.map((card) => (
                        <li key={card.userId}>
                          <div className="students-card">
                            <button type="button" className="students-card-who" onClick={() => void pickPerson(card.userId)}>
                              <span className="students-avatar" aria-hidden="true">{initials(card.name)}</span>
                              <span>
                                <strong>{card.name}</strong>
                                <small>{card.username ? `@${card.username} · ` : ""}{card.solved}/250 solved</small>
                              </span>
                            </button>
                            <div className="students-card-actions">
                              <button type="button" className={`students-follow${card.youFollow ? " on" : ""}`} onClick={() => void toggleFollow(card)} disabled={busy === card.userId}>
                                {card.youFollow ? <UserCheck size={13}/> : <UserPlus size={13}/>} {card.youFollow ? "Following" : "Follow"}
                              </button>
                              <button type="button" className="students-hello" onClick={() => void message(card.userId, card.name)}><Send size={13} /></button>
                            </div>
                            {card.followsYou && <span className="students-tag">follows you</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" className="students-mine" onClick={() => void pickPerson(userId)}>My card</button>
                </>
              ) : (
                <div className="students-profile">
                  <button type="button" className="students-back" onClick={() => { setProfile(null); setEditing(false); }}><ArrowLeft size={14} /> Everyone</button>
                  <div className="students-profile-top">
                    <span className="students-avatar big" aria-hidden="true">{initials(profile.name)}</span>
                    <div>
                      <strong>{profile.name}</strong>
                      {profile.username && <small>@{profile.username}</small>}
                      <span className="students-rank"><Crown size={12} /> {profile.rankTitle}</span>
                    </div>
                  </div>
                  {profile.bio && <p className="students-bio">{profile.bio}</p>}
                  <dl className="students-stats">
                    <div><dt>Solved</dt><dd>{profile.solved}<small>/250</small></dd></div>
                    <div><dt>XP</dt><dd>{profile.xp}</dd></div>
                    <div><dt>Followers</dt><dd>{profile.followers}</dd></div>
                    <div><dt>Following</dt><dd>{profile.following}</dd></div>
                  </dl>
                  {profile.patterns.length > 0 && (
                    <p className="students-strengths">Strongest: {profile.patterns.join(", ")}</p>
                  )}
                  <p className="students-joined">On CodexSheet since {new Date(profile.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</p>
    
                  {!profile.isMe ? (
                    <div className="students-profile-actions">
                      <button type="button" className={`students-follow${profile.youFollow ? " on" : ""}`} onClick={() => void toggleFollow(profile)} disabled={busy === profile.userId}>
                        {profile.youFollow ? <UserCheck size={13}/> : <UserPlus size={13}/>} {profile.youFollow ? "Following" : "Follow"}
                      </button>
                      <button type="button" className="students-sendghost" onClick={() => void message(profile.userId, profile.name)}><Send size={13} /> Message</button>
                    </div>
                  ) : (
                    <div className="students-profile-actions">
                      <button type="button" className="students-sendghost" onClick={startEditing}><Pencil size={13} /> Edit my card</button>
                    </div>
                  )}
    
                  {editing && (
                    <div className="students-edit">
                      <label>Name<input value={form.displayName} maxLength={40} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></label>
                      <label>Handle<input value={form.username} maxLength={20} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="a-z, 0-9, _" /></label>
                      <label>About you<textarea value={form.bio} rows={3} maxLength={200} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
                      <div>
                        <button type="button" className="students-send" onClick={() => void saveCard()} disabled={busy === "card"}>
                          {busy === "card" ? <LoaderCircle size={13} className="spin" /> : <UserCheck size={13} />} Save
                        </button>
                        <button type="button" className="students-sendghost" onClick={() => setEditing(false)}>Cancel</button>
                      </div>
                    </div>
                  )}
    
                  <div className="students-friends">
                    <button type="button" className={listKind === "followers" ? "active" : ""} onClick={() => setListKind("followers")}>Followers</button>
                    <button type="button" className={listKind === "following" ? "active" : ""} onClick={() => setListKind("following")}>Following</button>
                  </div>
                  <ul className="students-friend-list">
                    {!acquaintances.length && <li className="students-pane-empty">{listKind === "followers" ? "No followers yet." : "Not following anyone yet."}</li>}
                    {acquaintances.map((row) => (
                      <li key={row.userId}>
                        <button type="button" onClick={() => void loadProfile(row.userId).then(({ profile: found }) => found && setProfile(found))}>
                          <span className="students-avatar small" aria-hidden="true">{initials(row.name)}</span>
                          <strong>{row.name}</strong>
                          <em>{since(row.since)}</em>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </>
        )}
      </div>
    </section>
  );
}

function profileHint(peerId: string, people: StudentCard[]) {
  const card = people.find((person) => person.userId === peerId);
  if (!card) return "in the network";
  if (card.youFollow && card.followsYou) return "you follow each other";
  if (card.youFollow) return "you follow them";
  if (card.followsYou) return "follows you";
  return `${card.solved}/250 solved`;
}
