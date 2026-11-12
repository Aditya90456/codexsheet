// studentGraph.ts — the client side of the CodexSheet network.
//
// Every call here is an RPC from supabase/migrations/20261109_student_network.sql
// or 20261109_student_posts.sql. Nothing is read straight off the tables on
// purpose: the follow graph, the threads and the unread counts are other people's
// rows, and the server functions are the ones that decide what a student is
// allowed to see. No function here throws - a failed call comes back with
// `problem` set to the database's own sentence, which is written for a student to
// read.
import { supabase } from "./lib/supabase";

export type StudentCard = {
  userId: string;
  name: string;
  username: string;
  bio: string;
  solved: number;
  xp: number;
  rankTitle: string;
  followers: number;
  followsYou: boolean;
  youFollow: boolean;
  joinedAt: string;
};

export type StudentProfile = {
  userId: string;
  name: string;
  username: string;
  bio: string;
  joinedAt: string;
  solved: number;
  xp: number;
  rankTitle: string;
  lastSolvedAt: string;
  patterns: string[];
  followers: number;
  following: number;
  followsYou: boolean;
  youFollow: boolean;
  isMe: boolean;
  chatId: number | null;
};

export type ThreadRow = {
  chatId: number;
  peerId: string;
  name: string;
  username: string;
  lastMessage: string;
  lastFrom: string;
  at: string;
  unread: number;
  followsYou: boolean;
  youFollow: boolean;
};

export type DmMessage = {
  id: number;
  from: string;
  content: string;
  at: string;
};

export type FollowListRow = { userId: string; name: string; username: string; since: string };

export type Network<T> = { rows: T; problem: string };

const NO_CLIENT = "CodexSheet cannot reach the network right now - Supabase is not configured.";
const NOT_SIGNED_IN = "Sign in to meet the other students.";

function client() {
  return supabase;
}

function text(value: unknown, fallback = "") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function num(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function loadDirectory(query = "", limit = 60): Promise<Network<StudentCard[]>> {
  const db = client();
  if (!db) return { rows: [], problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_directory", { p_limit: limit, p_query: query });
  if (error) return { rows: [], problem: error.message };
  return {
    rows: ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      userId: text(row.user_id),
      name: text(row.display_name, "CodexSheet student"),
      username: text(row.username),
      bio: text(row.bio),
      solved: num(row.solved),
      xp: num(row.xp),
      rankTitle: text(row.rank_title),
      followers: num(row.followers),
      followsYou: Boolean(row.follows_you),
      youFollow: Boolean(row.you_follow),
      joinedAt: text(row.joined_at),
    })),
    problem: "",
  };
}

function asProfile(value: Record<string, unknown>): StudentProfile {
  return {
    userId: text(value.userId),
    name: text(value.displayName, "CodexSheet student"),
    username: text(value.username),
    bio: text(value.bio),
    joinedAt: text(value.joinedAt),
    solved: num(value.solved),
    xp: num(value.xp),
    rankTitle: text(value.rankTitle),
    lastSolvedAt: text(value.lastSolvedAt),
    patterns: Array.isArray(value.patterns) ? (value.patterns as unknown[]).map((item) => String(item)) : [],
    followers: num(value.followers),
    following: num(value.following),
    followsYou: Boolean(value.followsYou),
    youFollow: Boolean(value.youFollow),
    isMe: Boolean(value.isMe),
    chatId: value.chatId === null || value.chatId === undefined ? null : num(value.chatId),
  };
}

export async function loadProfile(userId = ""): Promise<{ profile: StudentProfile | null; problem: string }> {
  const db = client();
  if (!db) return { profile: null, problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_profile", userId ? { p_user_id: userId } : {});
  if (error) return { profile: null, problem: error.message };
  const value = (data ?? null) as Record<string, unknown> | null;
  if (!value) return { profile: null, problem: NOT_SIGNED_IN };
  return { profile: asProfile(value), problem: "" };
}

export async function loadFollowList(userId: string, kind: "followers" | "following"): Promise<Network<FollowListRow[]>> {
  const db = client();
  if (!db) return { rows: [], problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_follow_list", {
    p_user_id: userId || null,
    p_kind: kind,
  });
  if (error) return { rows: [], problem: error.message };
  return {
    rows: ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      userId: text(row.user_id),
      name: text(row.display_name, "CodexSheet student"),
      username: text(row.username),
      since: text(row.since),
    })),
    problem: "",
  };
}

export type FollowResult = { ok: boolean; message: string; followers: number; following: number };

export async function setFollow(userId: string, follow: boolean): Promise<FollowResult> {
  const db = client();
  if (!db) return { ok: false, message: NO_CLIENT, followers: 0, following: 0 };
  const { data, error } = await db.rpc("student_set_follow", { p_target_id: userId, p_follow: follow });
  if (error) return { ok: false, message: error.message, followers: 0, following: 0 };
  const value = (data ?? {}) as Record<string, unknown>;
  return {
    ok: true,
    message: "",
    followers: num(value.followers),
    following: num(value.following),
  };
}

/** Find - or start - the one thread two students share. */
export async function openChat(peerId: string): Promise<{ chatId: number | null; problem: string }> {
  const db = client();
  if (!db) return { chatId: null, problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_open_chat", { p_peer_id: peerId });
  if (error) return { chatId: null, problem: error.message };
  const chat = num((data as Record<string, unknown> | null)?.chat);
  return { chatId: chat > 0 ? chat : null, problem: chat > 0 ? "" : "The thread could not be opened." };
}

export async function loadThreads(): Promise<Network<ThreadRow[]>> {
  const db = client();
  if (!db) return { rows: [], problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_dm_threads");
  if (error) return { rows: [], problem: error.message };
  return {
    rows: ((data ?? []) as Record<string, unknown>[]).map((row) => ({
      chatId: num(row.chat_id),
      peerId: text(row.peer_id),
      name: text(row.display_name, "CodexSheet student"),
      username: text(row.username),
      lastMessage: text(row.last_message),
      lastFrom: text(row.last_from),
      at: text(row.last_message_at),
      unread: num(row.unread),
      followsYou: Boolean(row.follows_you),
      youFollow: Boolean(row.you_follow),
    })),
    problem: "",
  };
}

export async function loadUnreadDms(): Promise<Network<number>> {
  const db = client();
  if (!db) return { rows: 0, problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_unread_dms");
  if (error) return { rows: 0, problem: error.message };
  return { rows: num(data), problem: "" };
}

/** One page of a thread, oldest first. Pass the oldest id you hold to walk back. */
export async function loadHistory(chatId: number, before?: number, limit = 40): Promise<Network<DmMessage[]>> {
  const db = client();
  if (!db) return { rows: [], problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_dm_history", {
    p_chat_id: chatId,
    p_before: before ?? null,
    p_limit: limit,
  });
  if (error) return { rows: [], problem: error.message };
  const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: num(row.id),
    from: text(row.from_id),
    content: text(row.content),
    at: text(row.created_at),
  }));
  return { rows: rows.reverse(), problem: "" };
}

export async function sendDm(chatId: number, content: string): Promise<{ message: DmMessage | null; problem: string }> {
  const db = client();
  if (!db) return { message: null, problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_send_dm", { p_chat_id: chatId, p_content: content });
  if (error) return { message: null, problem: error.message };
  const value = (data ?? {}) as Record<string, unknown>;
  if (!value.id) return { message: null, problem: "The message did not go through. Try again." };
  return {
    message: { id: num(value.id), from: text(value.from), content: text(value.content), at: text(value.at) },
    problem: "",
  };
}

export async function markThreadRead(chatId: number): Promise<void> {
  const db = client();
  if (!db) return;
  await db.rpc("student_mark_read", { p_chat_id: chatId });
}

export async function loadUnread(): Promise<number> {
  const db = client();
  if (!db) return 0;
  const { data, error } = await db.rpc("student_unread_dms");
  return error ? 0 : num(data);
}

export type ProfileEdit = { displayName?: string; username?: string; bio?: string };

/** The student's own card. Undefined means "leave that field as it is". */
export async function updateMyProfile(edit: ProfileEdit): Promise<{ profile: StudentProfile | null; problem: string }> {
  const db = client();
  if (!db) return { profile: null, problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_update_profile", {
    p_display_name: edit.displayName,
    p_username: edit.username,
    p_bio: edit.bio,
  });
  if (error) return { profile: null, problem: error.message };
  const value = (data ?? {}) as Record<string, unknown>;
  if (!value.userId) return { profile: null, problem: "Your card could not be saved." };
  return { profile: asProfile(value), problem: "" };
}

// ── The board: students sharing the code they wrote ────────────────────────
// These calls come from 20261109_student_posts.sql. A post is only a post if it
// carries code, and a dislike comes back as a number and nothing else - the
// server never tells an author who disliked them.
export const SHARE_LANGUAGES = ["python", "javascript", "java", "cpp"] as const;
export type ShareLanguage = (typeof SHARE_LANGUAGES)[number];

export const LANGUAGE_LABEL: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
};

export type BoardPost = {
  id: number;
  userId: string;
  name: string;
  username: string;
  joinedAt: string;
  solved: number;
  rankTitle: string;
  caption: string;
  code: string;
  language: string;
  problemNumber: number | null;
  problemTitle: string;
  at: string;
  likes: number;
  dislikes: number;
  comments: number;
  myReaction: "" | "like" | "dislike";
  followsYou: boolean;
  youFollow: boolean;
  isMine: boolean;
};

export type PostComment = {
  id: number;
  userId: string;
  name: string;
  content: string;
  at: string;
  isMine: boolean;
};

export type FeedTab = "all" | "following" | "mine";

function asPost(value: Record<string, unknown>): BoardPost {
  return {
    id: num(value.id),
    userId: text(value.userId),
    name: text(value.displayName, "CodexSheet student"),
    username: text(value.username),
    joinedAt: text(value.joinedAt),
    solved: num(value.solved),
    rankTitle: text(value.rankTitle),
    caption: text(value.caption),
    code: text(value.code),
    language: text(value.language, "python"),
    problemNumber: value.problemNumber === null || value.problemNumber === undefined ? null : num(value.problemNumber),
    problemTitle: text(value.problemTitle),
    at: text(value.createdAt),
    likes: num(value.likes),
    dislikes: num(value.dislikes),
    comments: num(value.comments),
    myReaction: value.myReaction === "like" || value.myReaction === "dislike" ? value.myReaction : "",
    followsYou: Boolean(value.followsYou),
    youFollow: Boolean(value.youFollow),
    isMine: Boolean(value.isMine),
  };
}

function asComment(value: Record<string, unknown>): PostComment {
  return {
    id: num(value.id),
    userId: text(value.userId),
    name: text(value.displayName, "CodexSheet student"),
    content: text(value.content),
    at: text(value.createdAt),
    isMine: Boolean(value.isMine),
  };
}

export async function loadFeed(tab: FeedTab = "all", before?: number): Promise<Network<BoardPost[]>> {
  const db = client();
  if (!db) return { rows: [], problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_feed", {
    p_tab: tab,
    p_before: before ?? null,
    p_limit: 20,
  });
  if (error) return { rows: [], problem: error.message };
  return {
    rows: ((data ?? []) as Record<string, unknown>[])
      .map((row) => (row.post ?? null) as Record<string, unknown> | null)
      .filter((post): post is Record<string, unknown> => Boolean(post))
      .map(asPost),
    problem: "",
  };
}

export async function loadPost(
  postId: number,
): Promise<{ post: BoardPost | null; thread: PostComment[]; problem: string }> {
  const db = client();
  if (!db) return { post: null, thread: [], problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_post_detail", { p_post_id: postId });
  if (error) return { post: null, thread: [], problem: error.message };
  const value = (data ?? null) as Record<string, unknown> | null;
  if (!value) return { post: null, thread: [], problem: "That post is gone." };
  const { thread, ...post } = value;
  return {
    post: asPost(post),
    thread: Array.isArray(thread) ? (thread as Record<string, unknown>[]).map(asComment) : [],
    problem: "",
  };
}

export type ShareDraft = { code: string; caption?: string; language?: ShareLanguage; problemNumber?: number | null };

export async function shareCode(draft: ShareDraft): Promise<{ post: BoardPost | null; problem: string }> {
  const db = client();
  if (!db) return { post: null, problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_create_post", {
    p_code: draft.code,
    p_caption: draft.caption ?? "",
    p_language: draft.language ?? "python",
    p_problem_number: draft.problemNumber ?? null,
  });
  if (error) return { post: null, problem: error.message };
  const value = (data ?? null) as Record<string, unknown> | null;
  if (!value) return { post: null, problem: "The share did not go through. Try again." };
  return { post: asPost(value), problem: "" };
}

export async function reactTo(postId: number, kind: "like" | "dislike" | "none"): Promise<{ post: BoardPost | null; problem: string }> {
  const db = client();
  if (!db) return { post: null, problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_react", { p_post_id: postId, p_kind: kind });
  if (error) return { post: null, problem: error.message };
  const value = (data ?? null) as Record<string, unknown> | null;
  if (!value) return { post: null, problem: "The reaction did not count. Try again." };
  return { post: asPost(value), problem: "" };
}

export async function commentOn(
  postId: number,
  content: string,
): Promise<{ post: BoardPost | null; comment: PostComment | null; problem: string }> {
  const db = client();
  if (!db) return { post: null, comment: null, problem: NO_CLIENT };
  const { data, error } = await db.rpc("student_comment", { p_post_id: postId, p_content: content });
  if (error) return { post: null, comment: null, problem: error.message };
  const value = (data ?? {}) as Record<string, unknown>;
  const post = (value.post ?? null) as Record<string, unknown> | null;
  const comment = (value.comment ?? null) as Record<string, unknown> | null;
  if (!post || !comment) return { post: null, comment: null, problem: "The comment did not go through. Try again." };
  return { post: asPost(post), comment: asComment(comment), problem: "" };
}

export async function deletePost(postId: number): Promise<string> {
  const db = client();
  if (!db) return NO_CLIENT;
  const { error } = await db.rpc("student_delete_post", { p_post_id: postId });
  return error ? error.message : "";
}

export async function deleteComment(commentId: number): Promise<string> {
  const db = client();
  if (!db) return NO_CLIENT;
  const { error } = await db.rpc("student_delete_comment", { p_comment_id: commentId });
  return error ? error.message : "";
}

export async function loadFeedUnread(): Promise<number> {
  const db = client();
  if (!db) return 0;
  const { data, error } = await db.rpc("student_unread_posts");
  return error ? 0 : num(data);
}

export async function markFeedSeen(): Promise<void> {
  const db = client();
  if (!db) return;
  await db.rpc("student_mark_feed_seen");
}
