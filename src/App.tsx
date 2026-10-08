import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/clerk-react";
import {
  ArrowRight,
  AudioLines,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  ExternalLink,
  Flame,
  GitBranch,
  House,
  LayoutDashboard,
  LoaderCircle,
  Map as MapIcon,
  MessageCircle,
  NotebookPen,
  Plus,
  Bell,
  Rows3,
  Send,
  Search,
  Target,
  Trophy,
  UsersRound,
  Wifi,
  WifiOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Copy,
  Users,
  Link2,
  MonitorUp,
  ShieldCheck,
} from "lucide-react";
import { refreshRealtimeAuth, setClerkTokenGetter, supabase } from "./lib/supabase";

type Status = "Todo" | "In progress" | "Solved";
type Problem = {
  number: number;
  title: string;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
};
type ProgressMap = Record<number, { status: Status; notes: string }>;
type ChatMessage = {
  id: number;
  userId: string;
  content: string;
  createdAt: string;
};
type ProfilesByUserId = Record<string, { displayName: string | null }>;
type PersonalNote = {
  id: number;
  title: string;
  content: string;
  savedTitle: string;
  savedContent: string;
  updatedAt: string;
};
type RoadmapPreferences = {
  targetWeeks: number;
  sessionsPerWeek: number;
  focusPattern: string;
};
type WorkspaceView = "home" | "dashboard" | "problems" | "calendar" | "roadmap" | "chat" | "notes" | "coach" | "calls";

const viewPaths: Record<WorkspaceView, string> = {
  home: "/",
  dashboard: "/dashboard",
  problems: "/problems",
  calendar: "/calendar",
  roadmap: "/roadmap",
  chat: "/chat",
  notes: "/notes",
  coach: "/coach",
  calls: "/calls",
};

function viewFromLocation(): WorkspaceView {
  const params = new URLSearchParams(window.location.search);
  if (params.has("room") || params.has("schedule")) return "calls";
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const match = (Object.entries(viewPaths) as Array<[WorkspaceView, string]>).find(([, route]) => route === path);
  return match?.[0] ?? "dashboard";
}

function HomePage({
  solved,
  inProgress,
  streak,
  percent,
  patterns,
  onNavigate,
}: {
  solved: number;
  inProgress: number;
  streak: number;
  percent: number;
  patterns: Array<{ name: string; completed: number; total: number }>;
  onNavigate: (view: WorkspaceView) => void;
}) {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    let revertAnimations: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, triggerModule]) => {
      if (cancelled || !pageRef.current) return;
      const engine = gsapModule.gsap;
      engine.registerPlugin(triggerModule.ScrollTrigger);
      const context = engine.context(() => {
        const motion = engine.matchMedia();
        motion.add("(prefers-reduced-motion: no-preference)", () => {
          const intro = engine.timeline({ defaults: { ease: "power3.out" } });
          intro
            .from(".home-copy > *", { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 })
            .from(".home-flow-node", { y: 28, opacity: 0, duration: 0.65, stagger: 0.13 }, "-=0.35")
            .from(".home-flow-link", { scaleX: 0, duration: 0.45, stagger: 0.12, transformOrigin: "left center" }, "-=0.3")
            .from(".home-lab-foot", { y: 10, opacity: 0, duration: 0.45 }, "-=0.2");

          engine.from(".home-loop-step", {
            y: 24,
            opacity: 0,
            duration: 0.65,
            stagger: 0.14,
            ease: "power2.out",
            scrollTrigger: { trigger: ".home-loop", start: "top 78%", once: true },
          });
          engine.from(".home-progress-fill", {
            scaleX: 0,
            duration: 1.1,
            ease: "power2.out",
            transformOrigin: "left center",
            scrollTrigger: { trigger: ".home-progress", start: "top 82%", once: true },
          });
          engine.to(".home-mark-orbit", { rotate: 360, duration: 32, ease: "none", repeat: -1 });
        });
        return () => motion.revert();
      }, pageRef);
      revertAnimations = () => context.revert();
    });
    return () => {
      cancelled = true;
      revertAnimations?.();
    };
  }, []);

  return (
    <main className="home-page" ref={pageRef}>
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-copy">
            <span className="home-eyebrow"><span className="home-live-dot" /> YOUR NEXT INTERVIEW STARTS HERE</span>
            <h1>DSA interview practice <em>with a plan.</em></h1>
            <p>Build problem-solving fluency one pattern at a time. Keep your practice, progress, and study group in one focused workspace.</p>
            <div className="home-actions">
              <button className="home-primary" type="button" onClick={() => onNavigate("problems")}>Start practicing <ArrowRight size={16} /></button>
              <button className="home-secondary" type="button" onClick={() => onNavigate("dashboard")}>View my progress</button>
            </div>
            <div className="home-proof"><span><Check size={14} /> 250 curated problems</span><span><Check size={14} /> 18 core patterns</span></div>
          </div>

          <div className="home-lab" aria-label="A problem-solving path from problem to pattern to solution">
            <div className="home-lab-head"><span>THE PRACTICE LOOP</span><span>01 — 03</span></div>
            <div className="home-flow">
              <div className="home-flow-node node-problem"><span className="home-node-index">01</span><span className="home-node-title">Read the problem</span><strong>Two Sum</strong><small>Find a matching pair</small></div>
              <i className="home-flow-link" />
              <div className="home-flow-node node-pattern"><span className="home-node-index">02</span><span className="home-node-title">Spot the pattern</span><strong>Hash map</strong><small>Trade space for time</small></div>
              <i className="home-flow-link" />
              <div className="home-flow-node node-solve"><span className="home-node-index">03</span><span className="home-node-title">Build the solution</span><strong>O(n)</strong><small>One clear pass</small></div>
            </div>
            <div className="home-lab-foot"><span><span className="home-success-dot" /> A repeatable way to think</span><div className="home-mark-orbit"><i /><i /><i /></div></div>
          </div>
        </div>
        <div className="home-hero-bottom"><span>START WITH ONE PROBLEM</span><span>SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span></div>
      </section>

      <section className="home-loop" aria-labelledby="home-loop-title">
        <div className="home-section-heading">
          <div><span className="home-section-kicker">A SIMPLE SYSTEM, USED DAILY</span><h2 id="home-loop-title">Practice that <em>adds up.</em></h2></div>
          <p>Small, deliberate reps build the instincts that interviews ask for.</p>
        </div>
        <div className="home-loop-grid">
          <button className="home-loop-step" type="button" onClick={() => onNavigate("roadmap")}>
            <span className="home-loop-number">01</span><strong>Follow a roadmap</strong><span>Set your timeline and focus on the patterns you need most.</span><span className="home-step-link">Build your plan <ArrowRight size={14} /></span>
          </button>
          <button className="home-loop-step" type="button" onClick={() => onNavigate("problems")}>
            <span className="home-loop-number">02</span><strong>Solve with intent</strong><span>Practice a curated problem set, then mark what you have learned.</span><span className="home-step-link">Browse problems <ArrowRight size={14} /></span>
          </button>
          <button className="home-loop-step" type="button" onClick={() => onNavigate("calendar")}>
            <span className="home-loop-number">03</span><strong>Keep your rhythm</strong><span>See your progress take shape and make the next session count.</span><span className="home-step-link">View calendar <ArrowRight size={14} /></span>
          </button>
        </div>
      </section>

      <section className="home-progress" aria-label="Your current study progress">
        <div className="home-progress-copy"><span className="home-section-kicker">YOUR WORKSPACE IS READY</span><h2>Pick up where <em>you are.</em></h2><p>Your practice stays yours. Sign in to sync progress and study with your peers.</p><button className="home-progress-link" type="button" onClick={() => onNavigate("dashboard")}>Open your dashboard <ArrowRight size={15} /></button></div>
        <div className="home-progress-stats"><div><span>PROBLEMS SOLVED</span><strong>{solved}<small> / 250</small></strong></div><div><span>IN PROGRESS</span><strong>{inProgress}</strong></div><div><span>DAY STREAK</span><strong>{streak}</strong></div><div className="home-progress-bar" aria-label={`${percent}% of problems solved`}><i className="home-progress-fill" style={{ width: `${percent}%` }} /></div>
          <div className="home-pattern-list">{patterns.slice(0, 3).map((item) => <span key={item.name}>{item.name}<small>{item.completed}/{item.total}</small></span>)}</div>
        </div>
      </section>
      <footer className="home-footer"><span>codexsheet</span><span>One pattern. One problem. One step forward.</span><button type="button" onClick={() => onNavigate("problems")}>Go to the problem sheet <ArrowRight size={14} /></button></footer>
    </main>
  );
}

const elevenLabsAgentId = "agent_6801m0q9g55pe3vr0eb8y4sgkby7";
const elevenLabsVoiceId = "C2S5J6WvmHnrQWjUu6Rg";
const elevenLabsAgentUrl = `https://elevenlabs.io/app/talk-to?agent_id=${elevenLabsAgentId}&branch_id=agtbrch_4401m0q9g6nbf1885mt8fmg66dm7`;
const elevenLabsVoicePreviewUrl = "https://elevenlabs.io/app/voice-lab/share/7398804d9eaf2f463899a907587c33a390591775784f87857b6d0e1e4e3e66f6/C2S5J6WvmHnrQWjUu6Rg";

const seeds: Array<[string, string, Problem["difficulty"]]> = [
  ["Two Sum", "Arrays & Hashing", "Easy"],
  ["Valid Anagram", "Arrays & Hashing", "Easy"],
  ["Group Anagrams", "Arrays & Hashing", "Medium"],
  ["Top K Frequent Elements", "Arrays & Hashing", "Medium"],
  ["Product of Array Except Self", "Arrays & Hashing", "Medium"],
  ["Valid Palindrome", "Two Pointers", "Easy"],
  ["3Sum", "Two Pointers", "Medium"],
  ["Container With Most Water", "Two Pointers", "Medium"],
  ["Trapping Rain Water", "Two Pointers", "Hard"],
  ["Best Time to Buy and Sell Stock", "Sliding Window", "Easy"],
  [
    "Longest Substring Without Repeating Characters",
    "Sliding Window",
    "Medium",
  ],
  ["Longest Repeating Character Replacement", "Sliding Window", "Medium"],
  ["Minimum Window Substring", "Sliding Window", "Hard"],
  ["Valid Parentheses", "Stack", "Easy"],
  ["Min Stack", "Stack", "Medium"],
  ["Evaluate Reverse Polish Notation", "Stack", "Medium"],
  ["Daily Temperatures", "Monotonic Stack", "Medium"],
  ["Binary Search", "Binary Search", "Easy"],
  ["Search a 2D Matrix", "Binary Search", "Medium"],
  ["Koko Eating Bananas", "Binary Search", "Medium"],
  ["Reverse Linked List", "Linked List", "Easy"],
  ["Merge Two Sorted Lists", "Linked List", "Easy"],
  ["Reorder List", "Linked List", "Medium"],
  ["Remove Nth Node From End of List", "Linked List", "Medium"],
  ["LRU Cache", "Linked List", "Medium"],
  ["Invert Binary Tree", "Trees", "Easy"],
  ["Maximum Depth of Binary Tree", "Trees", "Easy"],
  ["Binary Tree Level Order Traversal", "Trees", "Medium"],
  ["Validate Binary Search Tree", "Trees", "Medium"],
  ["Kth Smallest Element in a BST", "Trees", "Medium"],
  ["Subsets", "Backtracking", "Medium"],
  ["Combination Sum", "Backtracking", "Medium"],
  ["Permutations", "Backtracking", "Medium"],
  ["Word Search", "Backtracking", "Medium"],
  ["N-Queens", "Backtracking", "Hard"],
  ["Number of Islands", "Graphs", "Medium"],
  ["Clone Graph", "Graphs", "Medium"],
  ["Rotting Oranges", "Graphs", "Medium"],
  ["Course Schedule", "Graphs", "Medium"],
  ["Graph Valid Tree", "Graphs", "Medium"],
  ["Climbing Stairs", "1-D DP", "Easy"],
  ["House Robber", "1-D DP", "Medium"],
  ["Coin Change", "1-D DP", "Medium"],
  ["Longest Increasing Subsequence", "1-D DP", "Medium"],
  ["Word Break", "1-D DP", "Medium"],
  ["Unique Paths", "2-D DP", "Medium"],
  ["Longest Common Subsequence", "2-D DP", "Medium"],
  ["Best Time to Buy and Sell Stock with Cooldown", "2-D DP", "Medium"],
  ["Burst Balloons", "Intervals DP", "Hard"],
  ["Regular Expression Matching", "2-D DP", "Hard"],
];
const patterns = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Backtracking",
  "Graphs",
  "1-D DP",
  "2-D DP",
  "Greedy",
  "Intervals",
  "Heaps",
  "Bit Manipulation",
];
const problems: Problem[] = Array.from({ length: 250 }, (_, index) => {
  const seed = seeds[index % seeds.length];
  const cycle = Math.floor(index / seeds.length);
  return {
    number: index + 1,
    title: cycle === 0 ? seed[0] : `${seed[0]} · Pattern ${cycle + 1}`,
    pattern:
      cycle === 0 ? seed[1] : patterns[(index + cycle) % patterns.length],
    difficulty: seed[2],
    link: `https://leetcode.com/problems/${seed[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}/description/?search=${encodeURIComponent(seed[0])}`,
  };
});

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPracticeStreak(practiceDays: string[]) {
  const dates = new Set(practiceDays);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let current = 0;
  if (dates.has(localDateKey(today)) || dates.has(localDateKey(yesterday))) {
    const cursor = dates.has(localDateKey(today)) ? today : yesterday;
    while (dates.has(localDateKey(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of [...dates].sort()) {
    const [year, month, day] = key.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const expected = previous ? new Date(previous) : null;
    expected?.setDate(expected.getDate() + 1);
    run = expected && localDateKey(expected) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return { current, best };
}

type CallSignal = {
  from: string;
  to?: string;
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  name?: string;
};

function getCallIceServers(): RTCIceServer[] {
  const urls = (import.meta.env.VITE_TURN_URLS ?? "").split(",").map((url: string) => url.trim()).filter(Boolean);
  const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
  if (urls.length > 0) {
    iceServers.push({
      urls,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    });
  }
  return iceServers;
}

function CallVideo({ stream, muted, label, self = false }: { stream: MediaStream | null; muted?: boolean; label: string; self?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <div className={`call-video-tile${self ? " self" : ""}`}>
      {stream ? <video ref={videoRef} autoPlay playsInline muted={muted} /> : <div className="call-avatar">{label.slice(0, 1).toUpperCase()}</div>}
      <span className="call-video-name">{label}{self ? " (You)" : ""}</span>
    </div>
  );
}

function VideoCalls({ userId, userName }: { userId: string | null; userName: string }) {
  const [inviteRoomId, setInviteRoomId] = useState(() => new URLSearchParams(window.location.search).get("room") ?? "");
  const [joinRoomInput, setJoinRoomInput] = useState("");
  const [sharedRoomId, setSharedRoomId] = useState("");
  const [roomCreatorId, setRoomCreatorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, { stream: MediaStream; name: string }>>({});
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectingLabel, setConnectingLabel] = useState("Connecting to room…");
  const localId = useRef(crypto.randomUUID());
  const streamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceCandidates = useRef(new Map<string, RTCIceCandidateInit[]>());
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  useEffect(() => {
    if (!inviteRoomId || !supabase || !userId) return;
    void supabase.from("call_rooms").select("created_by").eq("id", inviteRoomId).maybeSingle().then(({ data }) => {
      if (data?.created_by) setRoomCreatorId(data.created_by);
    });
  }, [inviteRoomId, userId]);

  async function createRoom() {
    if (!supabase || !userId) { setError("Sign in to create a peer room."); return; }
    const { data, error: createError } = await supabase.from("call_rooms").insert({ created_by: userId }).select("id").single();
    if (createError || !data) { setError(`Could not create the room. ${createError?.message ?? "Please try again."}`); return; }
    setSharedRoomId(data.id); setInviteRoomId(data.id); setRoomCreatorId(userId);
    const url = new URL(window.location.href); url.searchParams.delete("schedule"); url.searchParams.delete("call"); url.searchParams.set("room", data.id); window.history.replaceState({}, "", url);
  }

  function openRoomInvite() {
    if (!userId) { setError("Sign in to join a peer room."); return; }
    const value = joinRoomInput.trim();
    let targetRoomId = value;
    try { targetRoomId = new URL(value).searchParams.get("room") ?? value; } catch { /* A raw room ID is also accepted. */ }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetRoomId)) {
      setError("Paste a valid peer room link or room ID."); return;
    }
    setRoomCreatorId(""); setSharedRoomId(""); setInviteRoomId(targetRoomId); setJoinRoomInput(""); setError("");
    const url = new URL(window.location.href); url.searchParams.delete("schedule"); url.searchParams.delete("call"); url.searchParams.set("room", targetRoomId); window.history.replaceState({}, "", url);
  }

  async function invitePeers(url: URL) {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join my Codexsheet peer room", text: "Join me for a peer video call.", url: url.toString() });
      } else {
        await navigator.clipboard.writeText(url.toString());
        setCopied(true); window.setTimeout(() => setCopied(false), 1800);
      }
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url.toString());
        setCopied(true); window.setTimeout(() => setCopied(false), 1800);
      } catch { setError("Could not share the peer room link. Copy the link above instead."); }
    }
  }

  async function startRoom(targetRoomId: string) {
    if (!supabase || !userId) { setError("Sign in to join this peer room."); return; }
    if (connecting) return;
    setConnecting(true); setConnectingLabel("Joining room…"); setError("");
    try {
      const { error: joinError } = await supabase.rpc("join_call_room", { p_room_id: targetRoomId });
      if (joinError) throw new Error(joinError.message);
      const { data: room, error: roomError } = await supabase.from("call_rooms").select("created_by").eq("id", targetRoomId).single();
      if (roomError || !room) throw new Error("That room link is no longer available.");
      setRoomCreatorId(room.created_by);
      setRoomId(targetRoomId);
      setConnectingLabel("Allow camera and microphone access…");
      const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = media;
      setConnectingLabel("Refreshing sign-in for the call…");
      await refreshRealtimeAuth();
      setStream(media); setJoined(true);
    } catch (cause) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      await supabase.rpc("leave_call_room", { p_room_id: targetRoomId });
      setConnecting(false);
      setConnectingLabel("Connecting to room…");
      const message = cause instanceof Error ? cause.message : "Please try again.";
      const mediaIssue = cause instanceof DOMException || /camera|microphone|media|permission|secure context/i.test(message);
      setError(mediaIssue
        ? `Camera or microphone unavailable: ${message}. Check browser permissions and use HTTPS, then try again.`
        : `Could not join the peer room: ${message}`);
    }
  }

  useEffect(() => {
    if (!joined || !supabase || !roomId) return;
    let active = true;
    const channel = supabase.channel(`video-call-${roomId}`, { config: { private: true, broadcast: { self: false } } });
    channelRef.current = channel;
    const send = async (event: string, payload: CallSignal) => {
      const status = await channel.send({ type: "broadcast", event, payload });
      if (status !== "ok") {
        console.error(`Peer room ${event} signal failed:`, status);
        setError(`Call signaling failed (${status}). Rejoin the room and check your connection.`);
      }
      return status;
    };
    const connectPresentPeers = () => {
      const present = Object.values(channel.presenceState()).flat() as Array<{ peerId?: string; name?: string }>;
      for (const participant of present) {
        const remoteId = participant.peerId;
        if (!remoteId || remoteId === localId.current || localId.current < remoteId || peers.current.has(remoteId)) continue;
        const peer = createPeer(remoteId, participant.name || "Peer");
        void peer.createOffer().then((offer) => peer.setLocalDescription(offer)).then(() => send("offer", { from: localId.current, to: remoteId, name: userName, description: peer.localDescription?.toJSON() }));
      }
    };
    const createPeer = (remoteId: string, name = "Guest") => {
      const existing = peers.current.get(remoteId);
      if (existing) return existing;
      const peer = new RTCPeerConnection({ iceServers: getCallIceServers() });
      peers.current.set(remoteId, peer);
      streamRef.current?.getTracks().forEach((track) => peer.addTrack(track, streamRef.current!));
      peer.ontrack = (event) => {
        if (!active) return;
        const incoming = event.streams[0];
        if (incoming) setRemoteStreams((current) => ({ ...current, [remoteId]: { stream: incoming, name } }));
      };
      peer.onicecandidate = (event) => { if (event.candidate) void send("ice", { from: localId.current, to: remoteId, candidate: event.candidate.toJSON() }); };
      peer.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
          setRemoteStreams((current) => { const next = { ...current }; delete next[remoteId]; return next; });
        }
      };
      return peer;
    };
    channel.on("presence", { event: "sync" }, connectPresentPeers);
    channel.on("presence", { event: "join" }, connectPresentPeers);
    channel.on("broadcast", { event: "offer" }, async ({ payload }: { payload: CallSignal }) => {
      if (payload.to !== localId.current || !payload.description) return;
      const peer = createPeer(payload.from, payload.name || "Peer");
      try {
        await peer.setRemoteDescription(payload.description);
        const queuedCandidates = pendingIceCandidates.current.get(payload.from) ?? [];
        pendingIceCandidates.current.delete(payload.from);
        await Promise.all(queuedCandidates.map((candidate) => peer.addIceCandidate(candidate)));
        const answer = await peer.createAnswer(); await peer.setLocalDescription(answer);
      } catch (cause) {
        setError(`Could not negotiate with a peer: ${cause instanceof Error ? cause.message : "WebRTC negotiation failed."}`);
        return;
      }
      await send("answer", { from: localId.current, to: payload.from, description: peer.localDescription?.toJSON() });
    });
    channel.on("broadcast", { event: "answer" }, async ({ payload }: { payload: CallSignal }) => {
      if (payload.to !== localId.current || !payload.description) return;
      const peer = peers.current.get(payload.from);
      if (!peer) return;
      try {
        await peer.setRemoteDescription(payload.description);
        const queuedCandidates = pendingIceCandidates.current.get(payload.from) ?? [];
        pendingIceCandidates.current.delete(payload.from);
        await Promise.all(queuedCandidates.map((candidate) => peer.addIceCandidate(candidate)));
      } catch (cause) {
        setError(`Could not negotiate with a peer: ${cause instanceof Error ? cause.message : "WebRTC negotiation failed."}`);
      }
    });
    channel.on("broadcast", { event: "ice" }, async ({ payload }: { payload: CallSignal }) => {
      if (payload.to !== localId.current || !payload.candidate) return;
      const peer = peers.current.get(payload.from);
      if (!peer || !peer.remoteDescription) {
        const queued = pendingIceCandidates.current.get(payload.from) ?? [];
        queued.push(payload.candidate);
        pendingIceCandidates.current.set(payload.from, queued);
        return;
      }
      try { await peer.addIceCandidate(payload.candidate); } catch (cause) {
        console.warn("Could not add peer ICE candidate:", cause);
      }
    });
    channel.on("broadcast", { event: "leave" }, ({ payload }: { payload: CallSignal }) => {
      peers.current.get(payload.from)?.close(); peers.current.delete(payload.from);
      pendingIceCandidates.current.delete(payload.from);
      setRemoteStreams((current) => { const next = { ...current }; delete next[payload.from]; return next; });
    });
    channel.subscribe((status, subscriptionError) => {
      if (status === "SUBSCRIBED") {
        void channel.track({ peerId: localId.current, userId, name: userName }).then((trackStatus) => {
          setConnecting(false);
          if (trackStatus !== "ok") {
            setError(`Joined the room, but could not announce your presence (${trackStatus}). Check Realtime permissions and rejoin.`);
            return;
          }
          connectPresentPeers();
        }).catch((cause: unknown) => {
          setConnecting(false);
          setError(`Joined the room, but could not announce your presence: ${cause instanceof Error ? cause.message : "Realtime error"}`);
        });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setError(`Could not connect to the call room${subscriptionError instanceof Error ? `: ${subscriptionError.message}` : ". Check Supabase Realtime authorization and your connection."}`); setConnecting(false);
      }
    });
    return () => {
      active = false;
      void send("leave", { from: localId.current });
      channel.unsubscribe(); channelRef.current = null;
      peers.current.forEach((peer) => peer.close()); peers.current.clear();
      pendingIceCandidates.current.clear();
    };
  }, [joined, roomId, userId, userName]);

  function leaveCall() {
    void channelRef.current?.send({ type: "broadcast", event: "leave", payload: { from: localId.current } });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    displayStreamRef.current?.getTracks().forEach((track) => track.stop());
    displayStreamRef.current = null; setScreenSharing(false);
    streamRef.current = null; setStream(null); setRemoteStreams({}); setJoined(false); setConnecting(false);
    peers.current.forEach((peer) => peer.close()); peers.current.clear();
    pendingIceCandidates.current.clear();
    setRoomId("");
    if (supabase && userId && roomId) void supabase.rpc("leave_call_room", { p_room_id: roomId });
  }

  async function toggleScreenShare() {
    if (screenSharing) {
      const cameraTrack = streamRef.current?.getVideoTracks()[0] ?? null;
      for (const peer of peers.current.values()) {
        const sender = peer.getSenders().find((item) => item.track?.kind === "video");
        if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
      }
      displayStreamRef.current?.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
      setStream(streamRef.current); setScreenSharing(false);
      return;
    }
    if (!navigator.mediaDevices.getDisplayMedia) { setError("Screen sharing is not supported by this browser."); return; }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const displayTrack = display.getVideoTracks()[0];
      displayStreamRef.current = display;
      for (const peer of peers.current.values()) {
        const sender = peer.getSenders().find((item) => item.track?.kind === "video");
        if (sender) await sender.replaceTrack(displayTrack);
      }
      setStream(display); setScreenSharing(true);
      displayTrack.onended = () => { if (displayStreamRef.current) void toggleScreenShare(); };
    } catch (cause) {
      if (cause instanceof Error && cause.name !== "NotAllowedError") setError(`Could not share your screen: ${cause.message}`);
    }
  }

  if (!joined) {
    const roomToShare = sharedRoomId || inviteRoomId;
    const isRoomOwner = Boolean(userId && roomCreatorId === userId);
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.delete("schedule"); shareUrl.searchParams.delete("call");
    if (roomToShare) shareUrl.searchParams.set("room", roomToShare);
    return <section className="calls-page">
      {!roomToShare ? <section className="share-link-hero"><div className="share-link-copy"><span className="calls-eyebrow"><Video size={14}/> CODEXSHEET MEET</span><h2>Meet your peers.<br/><em>Face to face.</em></h2><p>Create a private video room and share its link with classmates. Peers with the link can join directly, and you can talk together in real time.</p>{userId ? <><button className="request-room-button create-room-button" onClick={() => void createRoom()}><Video size={17}/> Create a peer room <ArrowRight size={15}/></button><div className="join-room-divider"><span>OR JOIN A ROOM</span></div><form className="join-room-form" onSubmit={(event) => { event.preventDefault(); openRoomInvite(); }}><input aria-label="Room invite link or ID" value={joinRoomInput} onChange={(event) => setJoinRoomInput(event.target.value)} placeholder="Paste an invite link or room ID"/><button type="submit"><ArrowRight size={15}/> Join room</button></form></> : <div className="share-link-hint"><ShieldCheck size={14}/> Sign in to create or join a room.</div>}</div><div className="share-link-art"><div className="share-link-glow"/><div className="share-link-card"><div className="share-link-card-icon"><Users size={23}/></div><span>PEER TO PEER</span><strong>Study together</strong><small>Open link · Join · Connect</small><div className="share-link-card-dots"><i/><i/><i/></div></div><span className="share-link-spark share-link-spark-a">✦</span><span className="share-link-spark share-link-spark-b">✳</span></div></section> : <section className="share-link-hero"><div className="share-link-copy"><span className="calls-eyebrow"><Video size={14}/> CODEXSHEET MEET</span><h2>{isRoomOwner ? <>Your peer room.<br/><em>Ready when you are.</em></> : <>You’re invited.<br/><em>Join the room.</em></>}</h2><p>{isRoomOwner ? "Share this private link with anyone you’d like to meet. Peers can join directly." : "Join the shared room to meet the host and other peers. No request or approval needed."}</p><div className="share-link-field"><Link2 size={17}/><span title={shareUrl.toString()}>{shareUrl.toString()}</span><button onClick={async () => { try { await navigator.clipboard.writeText(shareUrl.toString()); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setError("Could not copy the peer room link."); } }}><Copy size={15}/>{copied ? "Copied" : "Copy link"}</button></div><div className="share-link-hint"><ShieldCheck size={14}/> Anyone with this link can join while signed in.</div></div><div className="share-link-art"><div className="share-link-glow"/><div className="share-link-card"><div className="share-link-card-icon"><Video size={23}/></div><span>LIVE PEER ROOM</span><strong>Room for everyone</strong><small>Share · Join · Talk</small><div className="share-link-card-dots"><i/><i/><i/></div></div><span className="share-link-spark share-link-spark-a">✦</span><span className="share-link-spark share-link-spark-b">✳</span></div></section>}
      {roomToShare && userId && <div className="schedule-layout room-meeting-layout"><div className="schedule-main-card room-request-card"><div className="room-card-icon"><Video size={22}/></div><span className="schedule-kicker">{isRoomOwner ? "YOUR PEER ROOM" : "PEER ROOM INVITE"}</span><h3>{isRoomOwner ? "Start the call" : "Join the conversation"}</h3><p>{isRoomOwner ? "Start your camera and microphone, then your peers can connect through the link above." : "Your camera and microphone turn on only after you join."}</p><div className="room-card-steps"><span><i>01</i> Share the room link</span><span><i>02</i> Peers join directly</span><span><i>03</i> Talk face to face</span></div><div className="peer-room-actions"><button className="request-room-button" disabled={connecting} onClick={() => void startRoom(roomToShare)}><Video size={16}/>{connecting ? "Joining…" : isRoomOwner ? "Start call" : "Join call"}<ArrowRight size={15}/></button><button className="invite-peers-button" onClick={() => void invitePeers(shareUrl)}><Users size={15}/>{copied ? "Link copied" : "Invite peers"}</button></div></div><aside className="schedule-side-card"><div className="schedule-side-heading"><span className="schedule-kicker">PEER ROOM</span><span className="approval-count"><Users size={13}/></span></div><h3>Bring your study group</h3><p>Share the room link with peers. Everyone who joins appears in the call.</p><div className="request-empty"><div className="request-empty-icon"><Link2 size={20}/></div><strong>One link, shared conversation</strong><span>Peer-to-peer video, microphone, and screen sharing.</span></div><div className="approval-footnote"><ShieldCheck size={15}/> Calls stay private to people with the room link.</div></aside></div>}
      {connecting && <div className="call-connecting">{connectingLabel}</div>}
      {(error) && <div className="call-toast" role="status">{error}<button onClick={() => setError("")}>×</button></div>}
      <div className="call-footnote"><span><span className="status-dot"/> PEER ROOM</span><span>Private peer-to-peer calls · No recording</span></div>
    </section>;
  }

  const participants = Object.entries(remoteStreams);
  return <section className="live-call-page"><div className="live-call-top"><div><span className="live-label"><span className="status-dot" /> LIVE PEER ROOM</span><h2>Study room <span>/{roomId}</span></h2></div><button className="invite-button" onClick={() => { const inviteUrl = new URL(window.location.href); inviteUrl.searchParams.set("room", roomId); inviteUrl.searchParams.delete("call"); void invitePeers(inviteUrl); }}><Users size={15}/>{copied ? "Link copied" : "Invite peers"}</button><button className="invite-button" onClick={() => { leaveCall(); }}><ArrowRight size={15} /> Back to meetings</button></div><div className="live-call-stage"><div className={`video-grid video-grid-${Math.min(participants.length + 1, 4)}`}><CallVideo stream={stream} muted label={userName} self />{participants.map(([id, participant]) => <CallVideo key={id} stream={participant.stream} label={participant.name} />)}</div>{participants.length === 0 && <div className="waiting-guests"><span className="status-dot" /> Waiting for peers to join <span>Peers with this link can join</span></div>}</div><div className="live-call-bottom"><div className="call-people"><Users size={16} /> {participants.length + 1} {participants.length === 0 ? "person" : "people"}</div><div className="call-controls"><button className={muted ? "control-off" : ""} aria-label={muted ? "Unmute microphone" : "Mute microphone"} onClick={() => { const next = !muted; setMuted(next); streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next; }); }}>{muted ? <MicOff size={18} /> : <Mic size={18} />}<span>{muted ? "Unmute" : "Mute"}</span></button><button className={cameraOff ? "control-off" : ""} aria-label={cameraOff ? "Turn camera on" : "Turn camera off"} onClick={() => { const next = !cameraOff; setCameraOff(next); streamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !next; }); }}>{cameraOff ? <VideoOff size={18} /> : <Video size={18} />}<span>Camera</span></button><button className={`screen-share-button${screenSharing ? " control-off" : ""}`} onClick={() => void toggleScreenShare()}><MonitorUp size={18} /><span>{screenSharing ? "Stop sharing" : "Share screen"}</span></button><button className="leave-call-button" onClick={leaveCall}><PhoneOff size={18} /><span>Leave</span></button></div><div className="call-encryption"><ShieldCheck size={15} /> Private peer-to-peer call</div></div>{connecting && <div className="call-connecting">{connectingLabel}</div>}{error && <div className="call-toast" role="status">{error}<button onClick={() => setError("")}>×</button></div>}</section>;
}

function App() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const user = isSignedIn && userId
    ? { id: userId, email: clerkUser?.primaryEmailAddress?.emailAddress }
    : null;
  const clerkDisplayName =
    clerkUser?.fullName?.trim() ||
    clerkUser?.username?.trim() ||
    clerkUser?.primaryEmailAddress?.emailAddress.split("@")[0]?.trim() ||
    "Codexsheet member";
  useEffect(() => {
    setClerkTokenGetter((options) => getToken(options));
    return () => setClerkTokenGetter(null);
  }, [getToken]);
  const [progress, setProgress] = useState<ProgressMap>(
    () =>
      JSON.parse(
        localStorage.getItem("codexsheet-dsa-progress") ?? "{}",
      ) as ProgressMap,
  );
  const [practiceDays, setPracticeDays] = useState<string[]>(
    () => JSON.parse(localStorage.getItem("codexsheet-practice-days") ?? "[]") as string[],
  );
  const practiceStreak = getPracticeStreak(practiceDays);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeView, setActiveView] = useState<WorkspaceView>(viewFromLocation);
  const navigateToView = (view: WorkspaceView) => {
    const url = new URL(window.location.href);
    url.pathname = viewPaths[view];
    if (view !== "calls") {
      url.searchParams.delete("room");
      url.searchParams.delete("schedule");
      url.searchParams.delete("call");
    }
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setActiveView(view);
  };
  useEffect(() => {
    const handlePopState = () => setActiveView(viewFromLocation());
    const canonicalPath = viewPaths[viewFromLocation()];
    if (window.location.pathname !== canonicalPath) {
      window.history.replaceState({}, "", `${canonicalPath}${window.location.search}${window.location.hash}`);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const [roadmapPreferences, setRoadmapPreferences] = useState<RoadmapPreferences>(
    () => JSON.parse(
      localStorage.getItem("codexsheet-roadmap-preferences") ??
        '{"targetWeeks":8,"sessionsPerWeek":5,"focusPattern":"Build weak areas"}',
    ) as RoadmapPreferences,
  );
  const [pattern, setPattern] = useState("All patterns");
  const [difficulty, setDifficulty] = useState("All levels");
  const [status, setStatus] = useState("All status");
  const [notice, setNotice] = useState("Saved locally");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatReadsByMessage, setChatReadsByMessage] = useState<Record<number, string[]>>({});
  const [chatUnreadIds, setChatUnreadIds] = useState<number[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [profileByUserId, setProfileByUserId] = useState<ProfilesByUserId>({});
  const [chatDraft, setChatDraft] = useState("");
  const [chatReload, setChatReload] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatLoadedFor, setChatLoadedFor] = useState<string | null>(null);
  const [chatError, setChatError] = useState("");
  const [chatLiveStatus, setChatLiveStatus] = useState("");
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [creatingNote, setCreatingNote] = useState(false);
  const [notesReload, setNotesReload] = useState(0);
  const [notesLoadedFor, setNotesLoadedFor] = useState<string | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeViewRef = useRef(activeView);
  activeViewRef.current = activeView;
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  currentUserIdRef.current = user?.id ?? null;
  const selectedNote = personalNotes.find((note) => note.id === selectedNoteId) ?? null;
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarMonthKey = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, "0")}`;
  const calendarLeadingDays = new Date(calendarYear, calendarMonthIndex, 1).getDay();
  const calendarDaysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = index - calendarLeadingDays + 1;
    return day > 0 && day <= calendarDaysInMonth
      ? new Date(calendarYear, calendarMonthIndex, day)
      : null;
  });
  const practiceDaySet = new Set(practiceDays);
  const activeDaysThisMonth = practiceDays.filter((day) => day.startsWith(calendarMonthKey)).length;
  const todayDateKey = localDateKey(new Date());

  const visibleProblems = useMemo(
    () =>
      problems.filter((problem) => {
        const current = progress[problem.number]?.status ?? "Todo";
        return (
          (!query ||
            `${problem.title} ${problem.pattern}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (pattern === "All patterns" || problem.pattern === pattern) &&
          (difficulty === "All levels" || problem.difficulty === difficulty) &&
          (status === "All status" || current === status)
        );
      }),
    [difficulty, pattern, progress, query, status],
  );
  const solved = Object.values(progress).filter(
    (item) => item.status === "Solved",
  ).length;
  const inProgress = Object.values(progress).filter(
    (item) => item.status === "In progress",
  ).length;
  const percent = Math.round((solved / 250) * 100);
  const studyQueue = useMemo(
    () =>
      problems
        .filter((problem) => progress[problem.number]?.status !== "Solved")
        .sort((left, right) => {
          const leftActive = progress[left.number]?.status === "In progress";
          const rightActive = progress[right.number]?.status === "In progress";
          return Number(rightActive) - Number(leftActive) || left.number - right.number;
        })
        .slice(0, 5),
    [progress],
  );
  const patternStats = useMemo(
    () =>
      patterns
        .map((name) => {
          const matching = problems.filter((problem) => problem.pattern === name);
          const completed = matching.filter(
            (problem) => progress[problem.number]?.status === "Solved",
          ).length;
          return { name, total: matching.length, completed };
        })
        .filter((item) => item.total > 0),
    [progress],
  );
  const weakestPattern = useMemo(
    () => [...patternStats].sort((left, right) =>
      (left.completed / left.total) - (right.completed / right.total) || left.name.localeCompare(right.name),
    )[0],
    [patternStats],
  );
  const roadmapProblems = useMemo(() => {
    const completionByPattern = new Map(
      patternStats.map((item) => [item.name, item.completed / item.total]),
    );
    return problems
      .filter((problem) => progress[problem.number]?.status !== "Solved")
      .sort((left, right) => {
        const leftInProgress = progress[left.number]?.status === "In progress";
        const rightInProgress = progress[right.number]?.status === "In progress";
        if (leftInProgress !== rightInProgress) return Number(rightInProgress) - Number(leftInProgress);
        if (roadmapPreferences.focusPattern === "Build weak areas") {
          const weaknessDifference =
            (completionByPattern.get(left.pattern) ?? 0) -
            (completionByPattern.get(right.pattern) ?? 0);
          if (weaknessDifference !== 0) return weaknessDifference;
        } else if (roadmapPreferences.focusPattern !== "All patterns") {
          const focusDifference =
            Number(right.pattern === roadmapPreferences.focusPattern) -
            Number(left.pattern === roadmapPreferences.focusPattern);
          if (focusDifference !== 0) return focusDifference;
        }
        return left.number - right.number;
      });
  }, [patternStats, progress, roadmapPreferences.focusPattern]);
  const roadmapWeeks = useMemo(() => {
    if (roadmapProblems.length === 0) return [];
    const weekCount = Math.min(roadmapPreferences.targetWeeks, roadmapProblems.length);
    const problemsPerWeek = Math.ceil(roadmapProblems.length / weekCount);
    return Array.from({ length: weekCount }, (_, index) => ({
      number: index + 1,
      problems: roadmapProblems.slice(index * problemsPerWeek, (index + 1) * problemsPerWeek),
    }));
  }, [roadmapPreferences.targetWeeks, roadmapProblems]);
  function getDisplayName(userId: string) {
    if (userId === user?.id) return "You";
    const profile = profileByUserId[userId];
    const fallbackName = profile?.displayName?.trim();
    if (fallbackName) return fallbackName;
    if (userId.length <= 6) return `Member · ${userId}`;
    return `Member · ${userId.slice(-6)}`;
  }

  async function markChatMessagesRead(messages: ChatMessage[]) {
    if (!user || !supabase) return;
    const unreadMessages = messages.filter((message) => message.userId !== user.id);
    if (unreadMessages.length === 0) return;
    const messageIds = unreadMessages.map((message) => message.id);
    const { data: existingReads, error: readError } = await supabase
      .from("group_chat_reads")
      .select("message_id")
      .eq("user_id", user.id)
      .in("message_id", messageIds);
    if (readError) {
      setChatError(`Could not check chat read status. ${readError.message}`);
      return;
    }
    const alreadyRead = new Set((existingReads ?? []).map((read) => read.message_id));
    const newReads = unreadMessages
      .filter((message) => !alreadyRead.has(message.id))
      .map((message) => ({ message_id: message.id, user_id: user.id }));
    if (newReads.length > 0) {
      const { error } = await supabase
        .from("group_chat_reads")
        .upsert(newReads, { onConflict: "message_id,user_id", ignoreDuplicates: true });
      if (error) {
        setChatError(`Could not save chat read status. ${error.message}`);
        return;
      }
      setChatReadsByMessage((current) => {
        const next = { ...current };
        for (const read of newReads) {
          next[read.message_id] = [...new Set([...(next[read.message_id] ?? []), read.user_id])];
        }
        return next;
      });
    }
    setChatUnreadIds((current) => current.filter((id) => !messageIds.includes(id)));
  }

  async function enableChatNotifications() {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Browser permission request failed.";
      setChatError(`Could not enable browser notifications. ${detail}`);
    }
  }

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    setChatMessages([]);
    setChatReadsByMessage({});
    setChatUnreadIds([]);
    setProfileByUserId({});
    setChatDraft("");
    setChatLoadedFor(null);
    setChatSending(false);
    setChatError("");
    setChatLiveStatus("");
    if (!isLoaded || !user) {
      setChatLoading(false);
      return () => {
        cancelled = true;
      };
    }
    if (!supabase) {
      setChatError("Connect Supabase to load the group chat.");
      setChatLoading(false);
      return () => {
        cancelled = true;
      };
    }
    const supabaseClient = supabase;

    channel = supabaseClient
      .channel("group-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_chat_messages" },
        (payload) => {
          const message = payload.new as {
            id: number;
            user_id: string;
            content: string;
            created_at: string;
          };
          setChatMessages((current) => {
            if (current.some((item) => item.id === message.id)) return current;
            return [...current, {
              id: message.id,
              userId: message.user_id,
              content: message.content,
              createdAt: message.created_at,
            }].sort((left, right) => left.id - right.id);
          });
          if (message.user_id !== user.id) {
            const chatIsVisible =
              activeViewRef.current === "chat" && document.visibilityState === "visible";
            if (chatIsVisible) {
              void markChatMessagesRead([{
                id: message.id,
                userId: message.user_id,
                content: message.content,
                createdAt: message.created_at,
              }]);
            } else {
              setChatUnreadIds((current) =>
                current.includes(message.id) ? current : [...current, message.id],
              );
              if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                try {
                  const notification = new Notification("New group chat message", {
                    body: message.content,
                    tag: `codexsheet-chat-${message.id}`,
                  });
                  notification.onclick = () => {
                    window.focus();
                    navigateToView("chat");
                    notification.close();
                  };
                } catch (error) {
                  const detail = error instanceof Error ? error.message : "Notification could not be displayed.";
                  setChatError(`Could not display a browser notification. ${detail}`);
                }
              }
            }
          }
          void supabaseClient
            .from("profiles")
            .select("user_id, display_name")
            .eq("user_id", message.user_id)
            .maybeSingle()
            .then(({ data: profile, error: profileError }) => {
              if (cancelled) return;
              if (profileError) {
                setChatError(`Could not load a chat member name. ${profileError.message}`);
              } else if (profile) {
                setProfileByUserId((current) => ({
                  ...current,
                  [profile.user_id]: { displayName: profile.display_name },
                }));
              }
            });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_chat_reads" },
        (payload) => {
          const read = payload.new as { message_id: number; user_id: string };
          setChatReadsByMessage((current) => ({
            ...current,
            [read.message_id]: [...new Set([...(current[read.message_id] ?? []), read.user_id])],
          }));
          void supabaseClient
            .from("profiles")
            .select("user_id, display_name")
            .eq("user_id", read.user_id)
            .maybeSingle()
            .then(({ data: profile, error: profileError }) => {
              if (cancelled) return;
              if (profileError) {
                setChatError(`Could not load a reader name. ${profileError.message}`);
              } else if (profile) {
                setProfileByUserId((current) => ({
                  ...current,
                  [profile.user_id]: { displayName: profile.display_name },
                }));
              }
            });
        },
      )
      .subscribe((state) => {
        if (cancelled) return;
        setChatLiveStatus(
          state === "SUBSCRIBED"
            ? "Live"
            : state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED"
              ? "Live updates disconnected. Reload to reconnect."
              : "Connecting...",
        );
      });

    setChatLoading(true);
    void (async () => {
      try {
        const { error: profileSaveError } = await supabaseClient
          .from("profiles")
          .upsert(
            { user_id: user.id, display_name: clerkDisplayName },
            { onConflict: "user_id" },
          );
        if (cancelled) return;
        if (profileSaveError) {
          setChatError(`Could not save your chat profile name. ${profileSaveError.message}`);
        }

        const { data, error } = await supabaseClient
          .from("group_chat_messages")
          .select("id, user_id, content, created_at")
          .order("id", { ascending: false })
          .limit(100);
        if (cancelled) return;
        if (error) {
          setChatError(`Could not load the group chat. ${error.message}`);
          return;
        }
        const loadedMessages = (data ?? []).reverse().map((message) => ({
            id: message.id,
            userId: message.user_id,
            content: message.content,
            createdAt: message.created_at,
          }));
        const loadedMessageIds = loadedMessages.map((message) => message.id);
        let loadedReads: Array<{ message_id: number; user_id: string }> = [];
        if (loadedMessageIds.length > 0) {
          const { data: reads, error: readsError } = await supabaseClient
            .from("group_chat_reads")
            .select("message_id, user_id")
            .in("message_id", loadedMessageIds);
          if (cancelled) return;
          if (readsError) {
            setChatError(`Could not load chat read status. ${readsError.message}`);
          } else {
            loadedReads = reads ?? [];
            const readsByMessage: Record<number, string[]> = {};
            for (const read of loadedReads) {
              readsByMessage[read.message_id] = [
                ...new Set([...(readsByMessage[read.message_id] ?? []), read.user_id]),
              ];
            }
            setChatReadsByMessage(readsByMessage);
            const readMessageIds = new Set(
              loadedReads
                .filter((read) => read.user_id === user.id)
                .map((read) => read.message_id),
            );
            const unreadMessageIds = loadedMessages
              .filter((message) => message.userId !== user.id && !readMessageIds.has(message.id))
              .map((message) => message.id);
            setChatUnreadIds((current) => [...new Set([...current, ...unreadMessageIds])]);
          }
        }
        const userIds = [...new Set(loadedMessages.map((message) => message.userId))];
        const profileUserIds = [...new Set([
          ...userIds,
          ...loadedReads.map((read) => read.user_id),
        ])];
        let nextProfiles: ProfilesByUserId = {};
        if (profileUserIds.length > 0) {
          const { data: profiles, error: profileError } = await supabaseClient
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", profileUserIds);
          if (!cancelled && profileError) {
            setChatError(`Could not load group chat member names. ${profileError.message}`);
          } else if (!cancelled) {
            nextProfiles = Object.fromEntries(
              (profiles ?? []).map((profile) => [
                profile.user_id,
                { displayName: profile.display_name },
              ]),
            );
            setProfileByUserId(nextProfiles);
          }
        }
        setChatMessages((current) => {
          const merged = new Map(current.map((message) => [message.id, message]));
          for (const message of loadedMessages) merged.set(message.id, message);
          return [...merged.values()].sort((left, right) => left.id - right.id);
        });
        setChatLoadedFor(user.id);
      } catch (error) {
        if (!cancelled) {
          const detail = error instanceof Error ? error.message : "Network error.";
          setChatError(`Could not load the group chat. ${detail}`);
        }
      } finally {
        if (!cancelled) setChatLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (channel) void supabaseClient.removeChannel(channel);
    };
  }, [chatReload, isLoaded, user?.id]);

  useEffect(() => {
    function markVisibleChatRead() {
      if (
        activeView !== "chat" ||
        chatLoadedFor !== user?.id ||
        document.visibilityState !== "visible"
      ) return;
      void markChatMessagesRead(chatMessages);
    }
    markVisibleChatRead();
    document.addEventListener("visibilitychange", markVisibleChatRead);
    return () => document.removeEventListener("visibilitychange", markVisibleChatRead);
  }, [activeView, chatLoadedFor, chatMessages, user?.id]);

  async function savePersonalNote(note: PersonalNote) {
    if (!user || !supabase) return false;
    const requestUserId = user.id;
    setNotesSaving(true);
    try {
      const savedAt = new Date();
      const { data, error } = await supabase
        .from("personal_notes")
        .update({
          title: note.title,
          content: note.content,
          updated_at: savedAt.toISOString(),
        })
        .eq("id", note.id)
        .eq("user_id", requestUserId)
        .select("id")
        .maybeSingle();
      if (currentUserIdRef.current !== requestUserId) return false;
      if (error || !data) {
        setNotesError(`Could not save your note. ${error?.message ?? "The note was not found."}`);
        return false;
      }
      setPersonalNotes((current) =>
        current.map((item) =>
          item.id === note.id
            ? {
                ...item,
                savedTitle: note.title,
                savedContent: note.content,
                updatedAt: savedAt.toISOString(),
              }
            : item,
        ),
      );
      setNotesError("");
      return true;
    } catch (error) {
      if (currentUserIdRef.current === requestUserId) {
        const detail = error instanceof Error ? error.message : "Network error.";
        setNotesError(`Could not save your note. ${detail}`);
      }
      return false;
    } finally {
      if (currentUserIdRef.current === requestUserId) setNotesSaving(false);
    }
  }

  async function selectPersonalNote(noteId: number) {
    if (noteId === selectedNoteId) return;
    if (
      selectedNote &&
      (selectedNote.title !== selectedNote.savedTitle ||
        selectedNote.content !== selectedNote.savedContent) &&
      !(await savePersonalNote(selectedNote))
    ) return;
    setSelectedNoteId(noteId);
  }

  async function createPersonalNote() {
    if (!user || !supabase || creatingNote) return;
    if (
      selectedNote &&
      (selectedNote.title !== selectedNote.savedTitle ||
        selectedNote.content !== selectedNote.savedContent) &&
      !(await savePersonalNote(selectedNote))
    ) return;

    setCreatingNote(true);
    setNotesError("");
    try {
      const { data, error } = await supabase
        .from("personal_notes")
        .insert({ user_id: user.id, title: "Untitled note" })
        .select("id, title, content, updated_at")
        .single();
      if (currentUserIdRef.current !== user.id) return;
      if (error || !data) {
        setNotesError(`Could not create a note. ${error?.message ?? "No note was returned."}`);
        return;
      }
      const note: PersonalNote = {
        id: data.id,
        title: data.title,
        content: data.content,
        savedTitle: data.title,
        savedContent: data.content,
        updatedAt: data.updated_at,
      };
      setPersonalNotes((current) => [note, ...current]);
      setSelectedNoteId(note.id);
    } catch (error) {
      if (currentUserIdRef.current === user.id) {
        const detail = error instanceof Error ? error.message : "Network error.";
        setNotesError(`Could not create a note. ${detail}`);
      }
    } finally {
      if (currentUserIdRef.current === user.id) setCreatingNote(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setPersonalNotes([]);
    setSelectedNoteId(null);
    setNotesLoadedFor(null);
    setNotesSaving(false);
    setNotesError("");
    if (!isLoaded || !user) return;
    if (!supabase) {
      setNotesError("Connect Supabase to load your private notebook.");
      return;
    }

    void (async () => {
      try {
        const { data, error } = await supabase
          .from("personal_notes")
          .select("id, title, content, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });
        if (cancelled) return;
        if (error) {
          setNotesError(`Could not load your notebook. ${error.message}`);
          return;
        }
        const loadedNotes: PersonalNote[] = (data ?? []).map((note) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          savedTitle: note.title,
          savedContent: note.content,
          updatedAt: note.updated_at,
        }));
        setPersonalNotes(loadedNotes);
        setSelectedNoteId(loadedNotes[0]?.id ?? null);
        setNotesLoadedFor(user.id);
      } catch (error) {
        if (!cancelled) {
          const detail = error instanceof Error ? error.message : "Network error.";
          setNotesError(`Could not load your notebook. ${detail}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, notesReload, user?.id]);

  useEffect(() => {
    if (
      !user ||
      !isLoaded ||
      notesLoadedFor !== user.id ||
      !selectedNote ||
      (selectedNote.title === selectedNote.savedTitle &&
        selectedNote.content === selectedNote.savedContent) ||
      !supabase
    ) return;

    const noteToSave = selectedNote;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) void savePersonalNote(noteToSave);
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [isLoaded, notesLoadedFor, selectedNote, user?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeView, chatMessages, chatSending]);

  useEffect(() => {
    localStorage.setItem("codexsheet-practice-days", JSON.stringify(practiceDays));
  }, [practiceDays]);

  useEffect(() => {
    localStorage.setItem("codexsheet-roadmap-preferences", JSON.stringify(roadmapPreferences));
  }, [roadmapPreferences]);



  useEffect(() => {
    localStorage.setItem("codexsheet-dsa-progress", JSON.stringify(progress));
    if (!isLoaded) {
      setNotice("Loading account");
      return;
    }
    if (!supabase || !user) {
      setNotice(user ? "Supabase not configured" : "Sign in to sync");
      return;
    }
    const changes = Object.entries(progress).slice(-1);
    if (changes.length === 0) return;
    const [number, value] = changes[0];
    void supabase
      .from("dsa_progress")
      .upsert(
        {
          user_id: user.id,
          problem_number: Number(number),
          status: value.status,
          notes: value.notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,problem_number" },
      )
      .then(({ error }) =>
        setNotice(error ? "Saved locally · sync failed" : "Synced to Supabase"),
      );
  }, [isLoaded, progress, user]);

  function setProblemStatus(number: number, nextStatus: Status) {
    if ((progress[number]?.status ?? "Todo") === nextStatus) return;
    setProgress((current) => ({
      ...current,
      [number]: { status: nextStatus, notes: current[number]?.notes ?? "" },
    }));
    if (nextStatus !== "Todo") {
      const today = localDateKey(new Date());
      setPracticeDays((current) => current.includes(today) ? current : [...current, today]);
    }
  }

  async function sendGroupMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!message || chatSending) return;
    if (!user) {
      setChatError("Sign in to join the group chat.");
      return;
    }
    if (!supabase) {
      setChatError("Connect Supabase before sending a chat message.");
      return;
    }

    const requestUserId = user.id;
    setChatSending(true);
    setChatError("");
    try {
      const { data, error } = await supabase
        .from("group_chat_messages")
        .insert({ user_id: requestUserId, content: message })
        .select("id, user_id, content, created_at")
        .single();
      if (error || !data) {
        if (currentUserIdRef.current === requestUserId) {
          setChatError(`Could not send your message. ${error?.message ?? "No row was returned."}`);
        }
        return;
      }
      if (currentUserIdRef.current !== requestUserId) return;
      setChatMessages((current) => current.some((item) => item.id === data.id)
        ? current
        : [...current, {
            id: data.id,
            userId: data.user_id,
            content: data.content,
            createdAt: data.created_at,
          }].sort((left, right) => left.id - right.id));
      setChatDraft("");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Network error.";
      if (currentUserIdRef.current === requestUserId) {
        setChatError(`Could not send your message. ${detail}`);
      }
    } finally {
      if (currentUserIdRef.current === requestUserId) setChatSending(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Code2 size={17} />
          </div>
          <span className="brand-name">
            codex<span>sheet</span>
          </span>
          <span className="workspace-name">DSA practice workspace</span>
          <ChevronDown size={14} className="muted-icon" />
        </div>
        <div className="top-actions">
          <span className="save-state">
            {supabase && user ? <Wifi size={14} /> : <WifiOff size={14} />}{" "}
            {notice}
          </span>
          <CircleHelp size={18} className="muted-icon" />
            {isLoaded ? user ? (
              <UserButton />
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="secondary-button">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="primary-button">Create account</button>
                </SignUpButton>
              </>
            ) : null}
        </div>
      </header>
      <section className="workspace-header">
        {activeView !== "home" && <div className="title-row">
          <div>
            <div className="breadcrumb">
              <span>Library</span>
              <span>/</span>
              <span>
                {activeView === "dashboard"
                  ? "Dashboard"
                  : activeView === "problems"
                    ? "Problems"
                    : activeView === "calendar"
                      ? "Calendar"
                      : activeView === "roadmap"
                        ? "Roadmap"
                    : activeView === "chat"
                      ? "Group chat"
                        : activeView === "notes"
                          ? "Personal notes"
                          : activeView === "calls"
                            ? "Video calls"
                          : "AI coach"}
              </span>
            </div>
            <h1>
              {activeView === "dashboard"
                ? "Your progress"
                : activeView === "problems"
                  ? "Problem library"
                  : activeView === "calendar"
                    ? "Practice calendar"
                    : activeView === "roadmap"
                      ? "Your DSA roadmap"
                  : activeView === "chat"
                    ? "Group chat"
                      : activeView === "notes"
                        ? "Personal notebook"
                        : activeView === "calls"
                          ? "Video calls"
                        : "AI study coach"}{" "}
              <span className="private-pill">DSA 250</span>
            </h1>
            <p>
              {activeView === "dashboard"
                ? "A clear view of your practice and what to tackle next."
                : activeView === "problems"
                  ? "Find a problem, update its status, and keep your practice moving."
                  : activeView === "calendar"
                    ? "See your practice history and keep your daily streak going."
                    : activeView === "roadmap"
                      ? "A study plan shaped around your pace and the patterns you want to master."
                  : activeView === "chat"
                    ? "Talk through DSA problems and share ideas with the study group."
                      : activeView === "notes"
                        ? "Keep private study notes that sync with your account."
                        : activeView === "calls"
                          ? "Meet your study group face to face, right from your workspace."
                        : "Practice explaining solutions with your ElevenLabs voice coach."}
            </p>
          </div>
          <div className="title-actions">
            <button className="secondary-button">
              <GitBranch size={16} /> View repo
            </button>
          </div>
        </div>}
        <nav className="view-switcher" aria-label="Workspace views">
          <button
            className={activeView === "home" ? "active" : ""}
            aria-pressed={activeView === "home"}
            onClick={() => navigateToView("home")}
          >
            <House size={16} /> Home
          </button>
          <button
            className={activeView === "dashboard" ? "active" : ""}
            aria-pressed={activeView === "dashboard"}
            onClick={() => navigateToView("dashboard")}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button
            className={activeView === "problems" ? "active" : ""}
            aria-pressed={activeView === "problems"}
            onClick={() => navigateToView("problems")}
          >
            <Rows3 size={16} /> Problems
            <span>{visibleProblems.length}</span>
          </button>
          <button
            className={activeView === "calendar" ? "active" : ""}
            aria-pressed={activeView === "calendar"}
            onClick={() => navigateToView("calendar")}
          >
            <CalendarDays size={16} /> Calendar
          </button>
          <button
            className={activeView === "roadmap" ? "active" : ""}
            aria-pressed={activeView === "roadmap"}
            onClick={() => navigateToView("roadmap")}
          >
            <MapIcon size={16} /> Roadmap
          </button>
          <button
            className={activeView === "chat" ? "active" : ""}
            aria-pressed={activeView === "chat"}
            onClick={() => navigateToView("chat")}
          >
            <MessageCircle size={16} /> Group chat
            {chatUnreadIds.length > 0 && (
              <span className="chat-unread-badge" aria-label={`${chatUnreadIds.length} unread messages`}>
                {chatUnreadIds.length > 99 ? "99+" : chatUnreadIds.length}
              </span>
            )}
          </button>
          <button
            className={activeView === "calls" ? "active" : ""}
            aria-pressed={activeView === "calls"}
            onClick={() => navigateToView("calls")}
          >
            <Video size={16} /> Video calls
          </button>
          <button
            className={activeView === "coach" ? "active" : ""}
            aria-pressed={activeView === "coach"}
            onClick={() => navigateToView("coach")}
          >
            <AudioLines size={16} /> AI coach
          </button>
          <button
            className={activeView === "notes" ? "active" : ""}
            aria-pressed={activeView === "notes"}
            onClick={() => navigateToView("notes")}
          >
            <NotebookPen size={16} /> Notes
          </button>
        </nav>
      </section>
      {activeView === "home" && <HomePage
        solved={solved}
        inProgress={inProgress}
        streak={practiceStreak.current}
        percent={percent}
        patterns={patternStats}
        onNavigate={navigateToView}
      />}
      {activeView === "calls" && <VideoCalls userId={user?.id ?? null} userName={clerkDisplayName} />}
      {activeView === "dashboard" && (
        <>
          <section className="insight-strip">
        <div className="insight">
          <span className="insight-label">Solved</span>
          <strong>
            {solved}
            <small>/250</small>
          </strong>
          <span className="progress-line">
            <i style={{ width: `${percent}%` }} />
          </span>
        </div>
        <div className="insight">
          <span className="insight-label">In progress</span>
          <strong>{inProgress}</strong>
          <span className="insight-detail">keep the streak alive</span>
        </div>
        <div className="insight insight-streak">
          <span className="insight-label">Practice streak</span>
          <strong><Flame size={16} /> {practiceStreak.current}<small>days</small></strong>
          <span className="insight-detail">
            {practiceStreak.current > 0
              ? `Best: ${practiceStreak.best} days`
              : "Update a problem to start"}
          </span>
        </div>
        <div className="insight">
          <span className="insight-label">Completion</span>
          <strong>{percent}%</strong>
          <span className="insight-detail">of the full sheet</span>
        </div>
        <div className="insight-ai">
          <Trophy size={16} />
          <span>{250 - solved} problems left in your path</span>
        </div>
          </section>
          <section className="dashboard-grid">
            <div className="dashboard-panel queue-panel">
              <header className="panel-heading">
                <div>
                  <span className="insight-label">Study queue</span>
                  <h2>{inProgress ? "Pick up where you left off" : "Start with a classic"}</h2>
                </div>
                <button className="panel-link" onClick={() => navigateToView("problems")}>
                  All problems <ArrowRight size={15} />
                </button>
              </header>
              <div className="queue-list">
                {studyQueue.map((problem) => {
                  const current = progress[problem.number]?.status ?? "Todo";
                  return (
                    <div className="queue-row" key={problem.number}>
                      <span className="queue-number">{String(problem.number).padStart(3, "0")}</span>
                      <div className="queue-problem">
                        <strong>{problem.title}</strong>
                        <span>{problem.pattern}</span>
                      </div>
                      <span className={`queue-status ${current.toLowerCase().replace(" ", "-")}`}>
                        {current}
                      </span>
                      <a
                        className="external-link"
                        href={problem.link}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${problem.title}`}
                      >
                        <ArrowRight size={15} />
                      </a>
                    </div>
                  );
                })}
                {studyQueue.length === 0 && (
                  <p className="queue-empty">Every problem is marked solved. Nice work.</p>
                )}
              </div>
            </div>
            <div className="dashboard-panel pattern-panel">
              <header className="panel-heading">
                <div>
                  <span className="insight-label">Coverage</span>
                  <h2>Patterns</h2>
                </div>
                <span className="pattern-total">{patternStats.length} topics</span>
              </header>
              <div className="pattern-overview">
                {patternStats.slice(0, 7).map((item) => (
                  <div className="pattern-progress" key={item.name}>
                    <div>
                      <span>{item.name}</span>
                      <small>{item.completed}/{item.total}</small>
                    </div>
                    <span className="pattern-track">
                      <i style={{ width: `${Math.round((item.completed / item.total) * 100)}%` }} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
      {activeView === "roadmap" && (
        <section className="roadmap-card" aria-label="Customized DSA roadmap">
          <header className="roadmap-heading">
            <div className="roadmap-icon"><MapIcon size={18} /></div>
            <div>
              <span className="roadmap-eyebrow">ADAPTIVE PREPARATION</span>
              <h2>Your DSA roadmap</h2>
              <p>A focused plan built around your progress and weekly availability.</p>
            </div>
          </header>
          <div className="roadmap-controls">
            <label>
              <span>Finish in</span>
              <select
                value={roadmapPreferences.targetWeeks}
                onChange={(event) => setRoadmapPreferences((current) => ({
                  ...current,
                  targetWeeks: Number(event.target.value),
                }))}
              >
                <option value={4}>4 weeks</option>
                <option value={8}>8 weeks</option>
                <option value={12}>12 weeks</option>
                <option value={16}>16 weeks</option>
              </select>
            </label>
            <label>
              <span>Study days each week</span>
              <select
                value={roadmapPreferences.sessionsPerWeek}
                onChange={(event) => setRoadmapPreferences((current) => ({
                  ...current,
                  sessionsPerWeek: Number(event.target.value),
                }))}
              >
                <option value={3}>3 days</option>
                <option value={5}>5 days</option>
                <option value={7}>7 days</option>
              </select>
            </label>
            <label>
              <span>Focus area</span>
              <select
                value={roadmapPreferences.focusPattern}
                onChange={(event) => setRoadmapPreferences((current) => ({
                  ...current,
                  focusPattern: event.target.value,
                }))}
              >
                <option>Build weak areas</option>
                <option>All patterns</option>
                {patterns.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <div className="roadmap-insight" aria-live="polite">
            <div className="roadmap-insight-mark"><Target size={17} /></div>
            <div className="roadmap-insight-copy">
              <span className="roadmap-insight-label">YOUR NEXT FOCUS</span>
            {weakestPattern ? (
              <p><strong>{weakestPattern.name}</strong> is your least-practiced pattern ({weakestPattern.completed} of {weakestPattern.total} solved). {roadmapPreferences.focusPattern === "Build weak areas" ? "It is prioritized in your plan." : "Choose Build weak areas to prioritize it."}</p>
            ) : (
              <p>As you solve problems, the plan will identify patterns where you need more practice and adjust the order.</p>
            )}
            </div>
          </div>
          <div className="roadmap-load" aria-live="polite">
            <div className="roadmap-stat"><strong>{roadmapProblems.length}</strong><span>problems remaining</span></div>
            <div className="roadmap-stat"><strong>{Math.ceil(roadmapProblems.length / (roadmapPreferences.targetWeeks * roadmapPreferences.sessionsPerWeek))}</strong><span>problems per study day</span></div>
            <div className="roadmap-stat"><strong>{roadmapPreferences.sessionsPerWeek}</strong><span>study days each week</span></div>
          </div>
          {roadmapWeeks.length === 0 ? (
            <div className="roadmap-complete">
              <Check size={20} />
              <strong>You’ve completed the roadmap.</strong>
              <p>All 250 problems are marked solved.</p>
            </div>
          ) : (
            <div className="roadmap-weeks">
              {roadmapWeeks.map((week) => (
                <article className="roadmap-week" key={week.number}>
                  <header>
                    <div>
                      <span className="roadmap-week-label">WEEK {String(week.number).padStart(2, "0")}</span>
                      <h3>
                        {week.problems.some((problem) => progress[problem.number]?.status === "In progress")
                          ? "Continue and build momentum"
                          : roadmapPreferences.focusPattern === "Build weak areas"
                            ? "Strengthen your foundations"
                            : roadmapPreferences.focusPattern === "All patterns"
                              ? "Keep a balanced pace"
                              : `Focus on ${roadmapPreferences.focusPattern}`}
                      </h3>
                    </div>
                    <span className="roadmap-week-count">{week.problems.length} problems</span>
                  </header>
                  <div className="roadmap-task-list">
                    {week.problems.map((problem) => {
                      const current = progress[problem.number]?.status ?? "Todo";
                      const problemPatternStats = patternStats.find((item) => item.name === problem.pattern);
                      const reason = current === "In progress"
                        ? "Continue where you left off"
                        : roadmapPreferences.focusPattern !== "All patterns" && roadmapPreferences.focusPattern !== "Build weak areas"
                          ? `Matches your ${problem.pattern} focus`
                          : problem.pattern === weakestPattern?.name
                            ? "Targets your least-practiced pattern"
                            : `${problemPatternStats?.completed ?? 0}/${problemPatternStats?.total ?? 0} in this pattern solved`;
                      return (
                        <div className="roadmap-task" key={problem.number}>
                          <span className="roadmap-task-number">{String(problem.number).padStart(3, "0")}</span>
                          <div className="roadmap-task-info">
                            <a
                              className="roadmap-problem-link"
                              href={problem.link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <strong>{problem.title}</strong>
                              <ExternalLink size={12} />
                            </a>
                            <span>{problem.pattern} · {problem.difficulty}</span>
                            <span className="roadmap-reason">{reason}</span>
                          </div>
                          <select
                            className={`roadmap-task-status ${current.toLowerCase().replace(" ", "-")}`}
                            aria-label={`Status for ${problem.title}`}
                            value={current}
                            onChange={(event) => setProblemStatus(problem.number, event.target.value as Status)}
                          >
                            <option>Todo</option>
                            <option>In progress</option>
                            <option>Solved</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      {activeView === "calendar" && (
        <section className="calendar-card" aria-label="Practice activity calendar">
          <header className="calendar-topline">
            <div className="calendar-titlelockup">
              <div className="calendar-icon"><CalendarDays size={18} /></div>
              <div>
                <h2>Practice calendar</h2>
                <p>{activeDaysThisMonth} active {activeDaysThisMonth === 1 ? "day" : "days"} this month</p>
              </div>
            </div>
            <div className="calendar-controls">
              <button
                className="secondary-button calendar-nav-button"
                type="button"
                aria-label="Previous month"
                title="Previous month"
                onClick={() => {
                  setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
                  setSelectedCalendarDate(null);
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <strong>{calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
              <button
                className="secondary-button calendar-nav-button"
                type="button"
                aria-label="Next month"
                title="Next month"
                onClick={() => {
                  setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
                  setSelectedCalendarDate(null);
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </header>
          <div className="calendar-body">
            <div className="calendar-weekdays" aria-hidden="true">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="calendar-grid" role="grid" aria-label={`${calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })} practice days`}>
              {calendarDays.map((date, index) => {
                if (!date) return <span className="calendar-day-spacer" key={`empty-${index}`} />;
                const dateKey = localDateKey(date);
                const isActive = practiceDaySet.has(dateKey);
                const isToday = dateKey === todayDateKey;
                const isFuture = dateKey > todayDateKey;
                return (
                  <button
                    className={`calendar-day${isActive ? " active" : ""}${isToday ? " today" : ""}${selectedCalendarDate === dateKey ? " selected" : ""}`}
                    key={dateKey}
                    type="button"
                    aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${isActive ? ", practice recorded" : ", no practice recorded"}`}
                    aria-pressed={selectedCalendarDate === dateKey}
                    disabled={isFuture}
                    onClick={() => setSelectedCalendarDate(dateKey)}
                  >
                    <span>{date.getDate()}</span>
                    {!isFuture && (
                      <span className="calendar-day-mood" aria-hidden="true">
                        {isActive ? "🔥" : "😠"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <footer className="calendar-footer">
            <div className="calendar-legend">
              <span><i aria-hidden="true">🔥</i> Practiced</span>
              <span><i aria-hidden="true">😠</i> Missed</span>
            </div>
            <span className="calendar-streak-summary"><Flame size={14} /> {practiceStreak.current}-day streak</span>
            <p className="calendar-selection" role="status">
              {selectedCalendarDate ? (
                <>
                  <strong>{new Date(`${selectedCalendarDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</strong>
                  <span>{practiceDaySet.has(selectedCalendarDate) ? "Practice logged" : "No practice logged"}</span>
                </>
              ) : "Select a date to see your activity."}
            </p>
          </footer>
        </section>
      )}
      {activeView === "chat" && (
        <section className="chat-card" aria-label="Shared group chat">
          <header className="chat-heading">
            <div className="group-chat-icon"><UsersRound size={18} /></div>
            <div>
              <h2>DSA study group</h2>
              <p>Shared with everyone signed in to Codexsheet</p>
            </div>
            {user && notificationPermission !== "unsupported" && (
              <button
                className="secondary-button chat-notification-button"
                type="button"
                onClick={() => void enableChatNotifications()}
                disabled={notificationPermission === "granted"}
                title={
                  notificationPermission === "denied"
                    ? "Allow notifications for this site in browser settings"
                    : undefined
                }
              >
                <Bell size={15} />
                {notificationPermission === "granted"
                  ? "Notifications on"
                  : notificationPermission === "denied"
                    ? "Notifications blocked"
                    : "Enable notifications"}
              </button>
            )}
          </header>
          {!user ? (
            <div className="feature-sign-in">
              <p>Sign in to join the shared study group and chat with other learners.</p>
              <SignInButton mode="modal"><button className="primary-button">Sign in</button></SignInButton>
            </div>
          ) : (
            <>
              <div className="chat-transcript" aria-live="polite">
                {chatLoading || (chatLoadedFor !== user.id && !chatError) ? (
                  <p className="chat-status"><LoaderCircle size={15} className="spin" /> Loading group chat...</p>
                ) : chatLoadedFor !== user.id ? (
                  <p className="chat-status">Group chat could not be loaded.</p>
                ) : chatMessages.length === 0 ? (
                  <div className="chat-welcome">
                    <UsersRound size={20} />
                    <strong>Start the conversation</strong>
                    <p>Share what you’re learning, ask a question, or help someone with a DSA problem.</p>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <article className={`chat-message ${message.userId === user.id ? "user" : "member"}`} key={message.id}>
                      <span className="chat-sender">{getDisplayName(message.userId)}</span>
                      <p>{message.content}</p>
                      {message.userId === user.id &&
                        (chatReadsByMessage[message.id] ?? []).filter((readerId) => readerId !== user.id).length > 0 && (
                          <span className="chat-read-receipt">
                            Read by{" "}
                            {(chatReadsByMessage[message.id] ?? [])
                              .filter((readerId) => readerId !== user.id)
                              .map(getDisplayName)
                              .join(", ")}
                          </span>
                        )}
                    </article>
                  ))
                )}
                {chatSending && (
                  <p className="chat-status"><LoaderCircle size={15} className="spin" /> Sending message...</p>
                )}
                <div ref={chatEndRef} />
              </div>
              {chatLiveStatus && <p className="chat-live-status" role="status">{chatLiveStatus}</p>}
              {chatError && <p className="feature-error" role="alert">{chatError}</p>}
              {chatError && chatLoadedFor !== user.id && supabase && (
                <button
                  className="panel-link chat-retry"
                  type="button"
                  onClick={() => setChatReload((current) => current + 1)}
                >
                  Retry loading group chat
                </button>
              )}
              {!supabase && <p className="feature-error" role="alert">Supabase is not configured for group chat.</p>}
              <form className="chat-composer" onSubmit={sendGroupMessage}>
                <textarea
                  aria-label="Write a group chat message"
                  maxLength={4000}
                  placeholder="Message the study group..."
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  disabled={!supabase || chatLoading || chatSending || chatLoadedFor !== user.id}
                  rows={2}
                />
                <button
                  className="primary-button"
                  type="submit"
                  disabled={!supabase || chatLoading || chatSending || chatLoadedFor !== user.id || !chatDraft.trim()}
                  aria-label="Send message"
                >
                  {chatSending ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}
                  <span>{chatSending ? "Sending" : "Send"}</span>
                </button>
              </form>
            </>
          )}
        </section>
      )}
      {activeView === "coach" && (
        <section className="coach-card" aria-label="ElevenLabs AI study coach">
          <header className="coach-heading">
            <div className="coach-icon"><AudioLines size={18} /></div>
            <div>
              <h2>DSA voice coach</h2>
              <p>Practice problem-solving out loud with your ElevenLabs agent</p>
            </div>
            <a
              className="secondary-button coach-open-link"
              href={elevenLabsAgentUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={15} /> Open agent page
            </a>
            <a
              className="secondary-button coach-open-link"
              href={elevenLabsVoicePreviewUrl}
              target="_blank"
              rel="noreferrer"
            >
              <AudioLines size={15} /> Preview voice
            </a>
          </header>
          <div className="coach-layout">
            <aside className="coach-brief">
              <span className="coach-kicker">VOICE PRACTICE</span>
              <h2>Make your reasoning audible.</h2>
              <p>Talk through an approach, test your assumptions, and ask for a hint when you get stuck.</p>
              <div className="coach-prompts" aria-label="Suggested topics">
                <span>Explain a solution step by step</span>
                <span>Ask for a hint, not the answer</span>
                <span>Compare time and space complexity</span>
              </div>
              <p className="coach-mic-note">Your browser may ask for microphone access when you start a voice session. Preview the selected voice, or enable voice overrides in ElevenLabs to use it here.</p>
            </aside>
            <div className="coach-widget">
              <elevenlabs-convai
                agent-id={elevenLabsAgentId}
                override-voice-id={elevenLabsVoiceId}
                variant="expanded"
                dismissible="true"
                action-text="Talk with your DSA coach"
                start-call-text="Start coaching session"
                end-call-text="End session"
                expand-text="Open voice coach"
              />
            </div>
          </div>
        </section>
      )}
      {activeView === "notes" && (
        <section className="notebook-card" aria-label="Personal notebook">
          <header className="notebook-heading">
            <div className="notebook-icon"><NotebookPen size={18} /></div>
            <div>
              <h2>Your private notebook</h2>
              <p>Notes are saved automatically and are visible only to your account.</p>
            </div>
            {user && notesLoadedFor === user.id && selectedNote && (
              <span className="notebook-save-state" role="status">
                {notesSaving ? (
                  <><LoaderCircle size={14} className="spin" /> Saving</>
                ) : selectedNote.savedContent !== selectedNote.content ||
                  selectedNote.savedTitle !== selectedNote.title ? (
                  "Unsaved changes"
                ) : selectedNote.updatedAt ? (
                  <><Check size={14} /> Saved</>
                ) : "Ready"}
              </span>
            )}
          </header>
          {!user ? (
            <div className="feature-sign-in">
              <p>Sign in to create a private notebook that syncs with your account.</p>
              <SignInButton mode="modal"><button className="primary-button">Sign in</button></SignInButton>
            </div>
          ) : (
            <>
              {notesError && <p className="feature-error" role="alert">{notesError}</p>}
              {notesError && notesLoadedFor !== user.id && supabase && (
                <button
                  className="panel-link chat-retry"
                  type="button"
                  onClick={() => setNotesReload((current) => current + 1)}
                >
                  Retry loading notes
                </button>
              )}
              {!supabase && <p className="feature-error" role="alert">Supabase is not configured for notes.</p>}
              <div className="notes-toolbar">
                <nav className="notes-list" aria-label="Your saved notes">
                  {personalNotes.map((note) => (
                    <button
                      className={`note-tab ${note.id === selectedNoteId ? "active" : ""}`}
                      key={note.id}
                      type="button"
                      aria-pressed={note.id === selectedNoteId}
                      onClick={() => void selectPersonalNote(note.id)}
                      disabled={notesLoadedFor !== user.id || creatingNote || notesSaving}
                    >
                      {note.title.trim() || "Untitled note"}
                    </button>
                  ))}
                </nav>
                <button
                  className="secondary-button new-note-button"
                  type="button"
                  onClick={() => void createPersonalNote()}
                  disabled={!supabase || notesLoadedFor !== user.id || creatingNote || notesSaving}
                >
                  {creatingNote ? <LoaderCircle size={15} className="spin" /> : <Plus size={15} />}
                  {creatingNote ? "Creating" : "New note"}
                </button>
              </div>
              {notesLoadedFor !== user.id ? (
                <p className="notes-empty-state">
                  {notesError ? "Your notes could not be loaded." : "Loading your notes..."}
                </p>
              ) : selectedNote ? (
                <>
                  <input
                    className="personal-note-title"
                    aria-label="Note title"
                    maxLength={120}
                    placeholder="Untitled note"
                    value={selectedNote.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      setPersonalNotes((current) =>
                        current.map((note) =>
                          note.id === selectedNote.id ? { ...note, title } : note,
                        ),
                      );
                      setNotesError("");
                    }}
                  />
                  <textarea
                    className="personal-notes-editor"
                    aria-label="Personal study notes"
                    maxLength={100000}
                    placeholder="Write down a concept, an insight, or what you want to review next..."
                    onChange={(event) => {
                      const content = event.target.value;
                      setPersonalNotes((current) =>
                        current.map((note) =>
                          note.id === selectedNote.id ? { ...note, content } : note,
                        ),
                      );
                      setNotesError("");
                    }}
                    value={selectedNote.content}
                    disabled={!supabase}
                  />
                  <footer className="notebook-footer">
                    <span>{selectedNote.content.length.toLocaleString()} / 100,000 characters</span>
                    {selectedNote.updatedAt && !notesSaving && (
                      <span>Last saved {new Date(selectedNote.updatedAt).toLocaleTimeString()}</span>
                    )}
                  </footer>
                </>
              ) : (
                <div className="notes-empty-state">
                  <p>You don’t have any saved notes yet.</p>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => void createPersonalNote()}
                    disabled={!supabase || creatingNote}
                  >
                    <Plus size={15} /> Create your first note
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {activeView === "problems" && <section className="sheet-card">
        <div className="problems-heading">
          <div>
            <h2>All problems</h2>
            <span>{visibleProblems.length} matching problems</span>
          </div>
          <span className="problems-count">250 total</span>
        </div>
        <div className="sheet-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search problems or patterns"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
          >
            <option>All patterns</option>
            {patterns.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option>All levels</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option>All status</option>
            <option>Todo</option>
            <option>In progress</option>
            <option>Solved</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Problem</th>
                <th>Pattern</th>
                <th>Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProblems.map((problem) => {
                const current = progress[problem.number]?.status ?? "Todo";
                return (
                  <tr key={problem.number}>
                    <td className="number-cell">
                      {String(problem.number).padStart(3, "0")}
                    </td>
                    <td className="problem-cell">
                      <span
                        className={`status-dot ${current.toLowerCase().replace(" ", "-")}`}
                      />
                      <strong>{problem.title}</strong>
                    </td>
                    <td>
                      <span className="pattern-pill">{problem.pattern}</span>
                    </td>
                    <td>
                      <span
                        className={`difficulty ${problem.difficulty.toLowerCase()}`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <select
                        className={`status-select ${current.toLowerCase().replace(" ", "-")}`}
                        value={current}
                        onChange={(event) =>
                          setProblemStatus(
                            problem.number,
                            event.target.value as Status,
                          )
                        }
                      >
                        <option>Todo</option>
                        <option>In progress</option>
                        <option>Solved</option>
                      </select>
                    </td>
                    <td>
                      <div className="problem-actions">
                        <a
                          className="external-link"
                          href={problem.link}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${problem.title}`}
                        >
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="sheet-footer">
          <span>
            <Target size={14} /> Showing {visibleProblems.length} of 250
            problems
          </span>
          <span className="footer-hint">
            <Check size={14} />{" "}
            {user ? "Synced progress" : "Sign in to sync progress"}
          </span>
        </div>
      </section>}

      <footer className="footer-note">
        Use the patterns, then make the problem yours.
      </footer>
    </main>
  );
}

export default App;
