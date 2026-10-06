import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Editor from "@monaco-editor/react";
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
  LayoutDashboard,
  LoaderCircle,
  Map as MapIcon,
  MessageCircle,
  NotebookPen,
  Play,
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
} from "lucide-react";
import {
  setClerkTokenGetter,
  supabase,
} from "./lib/supabase";

type Status = "Todo" | "In progress" | "Solved";
type Problem = {
  number: number;
  title: string;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
};
type EditorLanguage = {
  id: string;
  label: string;
  monacoId: string;
  fileName: string;
};
type ProblemExample = {
  input: string;
  output: string;
};
type ProblemContent = {
  description: string;
  constraints: string[];
  examples: ProblemExample[];
};
type ProblemContentState = {
  problemNumber: number | null;
  content: ProblemContent | null;
  loading: boolean;
  error: string;
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
type WorkspaceView = "dashboard" | "problems" | "calendar" | "roadmap" | "chat" | "notes" | "coach";

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
const editorLanguages: EditorLanguage[] = [
  { id: "javascript", label: "JavaScript", monacoId: "javascript", fileName: "main.js" },
  { id: "python", label: "Python", monacoId: "python", fileName: "main.py" },
  { id: "java", label: "Java", monacoId: "java", fileName: "Main.java" },
  { id: "cpp", label: "C++", monacoId: "cpp", fileName: "main.cpp" },
];

function starterCode(languageId: string) {
  switch (languageId) {
    case "python":
      return "# Write your solution here\n";
    case "java":
      return "public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n";
    case "cpp":
      return "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n";
    default:
      return "// Write your solution here\n";
  }
}

const problems: Problem[] = Array.from({ length: 250 }, (_, index) => {
  const seed = seeds[index % seeds.length];
  const cycle = Math.floor(index / seeds.length);
  return {
    number: index + 1,
    title: cycle === 0 ? seed[0] : `${seed[0]} · Pattern ${cycle + 1}`,
    pattern:
      cycle === 0 ? seed[1] : patterns[(index + cycle) % patterns.length],
    difficulty: seed[2],
    link: `https://leetcode.com/problemset/all/?search=${encodeURIComponent(seed[0])}`,
  };
});

function parseProblemContent(value: unknown): ProblemContent | null {
  if (typeof value !== "object" || value === null || !("description" in value)) {
    return null;
  }
  const row = value as {
    description?: unknown;
    constraints?: unknown;
    examples?: unknown;
  };
  if (typeof row.description !== "string") return null;
  const constraints = Array.isArray(row.constraints)
    ? row.constraints.filter((item): item is string => typeof item === "string")
    : [];
  const examples = Array.isArray(row.examples)
    ? row.examples.flatMap((example): ProblemExample[] => {
        if (typeof example !== "object" || example === null) return [];
        if (!("input" in example) || !("output" in example)) return [];
        return typeof example.input === "string" && typeof example.output === "string"
          ? [{ input: example.input, output: example.output }]
          : [];
      })
    : [];
  return { description: row.description, constraints, examples };
}

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

function App() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const user =
    isSignedIn && userId
      ? { id: userId, email: clerkUser?.primaryEmailAddress?.emailAddress }
      : null;
  const clerkDisplayName =
    clerkUser?.fullName?.trim() ||
    clerkUser?.username?.trim() ||
    clerkUser?.primaryEmailAddress?.emailAddress.split("@")[0]?.trim() ||
    "Codexsheet member";
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
  const [activeView, setActiveView] = useState<WorkspaceView>("dashboard");
  const [roadmapPreferences, setRoadmapPreferences] = useState<RoadmapPreferences>(
    () => JSON.parse(
      localStorage.getItem("codexsheet-roadmap-preferences") ??
        '{"targetWeeks":8,"sessionsPerWeek":5,"focusPattern":"Build weak areas"}',
    ) as RoadmapPreferences,
  );
  const [pattern, setPattern] = useState("All patterns");
  const [difficulty, setDifficulty] = useState("All levels");
  const [status, setStatus] = useState("All status");
  const [openEditorProblem, setOpenEditorProblem] = useState<number | null>(null);
  const [editorLanguageId, setEditorLanguageId] = useState(editorLanguages[0].id);
  const [editorDrafts, setEditorDrafts] = useState<Record<string, string>>(
    () =>
      JSON.parse(
        localStorage.getItem("codexsheet-code-drafts") ?? "{}",
      ) as Record<string, string>,
  );
  const [editorInput, setEditorInput] = useState("");
  const [editorOutput, setEditorOutput] = useState("");
  const [editorError, setEditorError] = useState("");
  const [editorRunning, setEditorRunning] = useState(false);
  const [problemContentState, setProblemContentState] = useState<ProblemContentState>({
    problemNumber: null,
    content: null,
    loading: false,
    error: "",
  });
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
  const activeEditorProblem =
    problems.find((problem) => problem.number === openEditorProblem) ?? null;
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
  useEffect(() => {
    setClerkTokenGetter(() => getToken());
    return () => setClerkTokenGetter(null);
  }, [getToken]);

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
                    setActiveView("chat");
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
    localStorage.setItem("codexsheet-code-drafts", JSON.stringify(editorDrafts));
  }, [editorDrafts]);

  useEffect(() => {
    const problemNumber = activeEditorProblem?.number ?? null;
    if (problemNumber === null) {
      setProblemContentState({
        problemNumber: null,
        content: null,
        loading: false,
        error: "",
      });
      return;
    }

    let cancelled = false;
    setProblemContentState({
      problemNumber,
      content: null,
      loading: true,
      error: "",
    });
    if (!supabase) {
      setProblemContentState({
        problemNumber,
        content: null,
        loading: false,
        error: "Supabase is not configured. Add problem content to load the challenge.",
      });
      return;
    }

    void Promise.resolve(
      supabase
        .from("dsa_problem_content")
        .select("description, constraints, examples")
        .eq("problem_number", problemNumber)
        .maybeSingle(),
    )
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setProblemContentState({
            problemNumber,
            content: null,
            loading: false,
            error: `Could not load the problem details. ${error.message}`,
          });
          return;
        }
        const content = parseProblemContent(data);
        setProblemContentState({
          problemNumber,
          content,
          loading: false,
          error: content
            ? ""
            : "No description or examples have been added for this problem yet.",
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setProblemContentState({
          problemNumber,
          content: null,
          loading: false,
          error: error instanceof Error
            ? `Could not load the problem details. ${error.message}`
            : "Could not load the problem details.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [activeEditorProblem?.number]);

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

  function getEditorDraft(problemNumber: number, languageId: string) {
    return editorDrafts[`${problemNumber}:${languageId}`] ?? starterCode(languageId);
  }

  function updateEditorDraft(problemNumber: number, languageId: string, code: string) {
    setEditorDrafts((current) => ({
      ...current,
      [`${problemNumber}:${languageId}`]: code,
    }));
  }

  async function runProblemCode(problem: Problem) {
    if (editorRunning) return;
    const language = editorLanguages.find((item) => item.id === editorLanguageId);
    if (!language) {
      setEditorError("Choose a supported language before running your code.");
      return;
    }
    if (language.id !== "javascript") {
      setEditorError("In-browser execution currently supports JavaScript only.");
      return;
    }

    setEditorRunning(true);
    setEditorError("");
    setEditorOutput("");
    const frame = document.createElement("iframe");
    const requestId = crypto.randomUUID();
    frame.title = "Isolated JavaScript runner";
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.left = "-10000px";
    frame.srcdoc = `<!doctype html>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; worker-src blob:; connect-src 'none'; img-src data:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'; object-src 'none'">
      <script>
        const workerSource = [
          "self.onmessage = async (event) => {",
          "  const { requestId, sourceCode, input } = event.data;",
          "  const lines = [];",
          "  const stringify = (value) => {",
          "    if (typeof value === 'string') return value;",
          "    try { return JSON.stringify(value); } catch { return String(value); }",
          "  };",
          "  const safeConsole = {",
          "    log: (...values) => lines.push(values.map(stringify).join(' ')),",
          "    info: (...values) => lines.push(values.map(stringify).join(' ')),",
          "    warn: (...values) => lines.push(values.map(stringify).join(' ')),",
          "    error: (...values) => lines.push(values.map(stringify).join(' ')),",
          "  };",
          "  try {",
          "    const execute = new Function('input', 'console', 'print',",
          "      '\\\"use strict\\\"; return (async () => {\\\\n' + sourceCode + '\\\\n})();');",
          "    await execute(input, safeConsole, (...values) => lines.push(values.map(stringify).join(' ')));",
          "    self.postMessage({ requestId, output: lines.join('\\\\n') });",
          "  } catch (error) {",
          "    self.postMessage({ requestId, error: error && error.stack ? String(error.stack) : String(error) });",
          "  }",
          "};",
        ].join("\\n");
        window.addEventListener("message", (event) => {
          if (event.source !== parent || !event.data || event.data.type !== "codexsheet-run") return;
          const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
          const worker = new Worker(workerUrl);
          const finish = (result) => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            parent.postMessage({ type: "codexsheet-result", ...result }, "*");
          };
          worker.onmessage = (result) => finish(result.data);
          worker.onerror = (error) => finish({ requestId: event.data.requestId, error: error.message });
          worker.postMessage(event.data);
        });
      <\/script>`;

    let timeoutId = 0;
    let resolveResult: (result: { output?: unknown; error?: unknown }) => void = () => {};
    const resultPromise = new Promise<{ output?: unknown; error?: unknown }>((resolve) => {
      resolveResult = resolve;
    });
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error("Execution stopped after 5 seconds.")),
        5_000,
      );
    });
    const onMessage = (event: MessageEvent<unknown>) => {
      if (
        event.source !== frame.contentWindow ||
        typeof event.data !== "object" ||
        event.data === null ||
        !("type" in event.data) ||
        event.data.type !== "codexsheet-result" ||
        !("requestId" in event.data) ||
        event.data.requestId !== requestId
      ) return;

      resolveResult(event.data as { output?: unknown; error?: unknown });
    };

    window.addEventListener("message", onMessage);

    try {
      const frameLoaded = new Promise<void>((resolve, reject) => {
        frame.addEventListener("load", () => resolve(), { once: true });
        frame.addEventListener(
          "error",
          () => reject(new Error("Could not start the isolated JavaScript runner.")),
          { once: true },
        );
      });
      document.body.append(frame);
      await Promise.race([frameLoaded, timeoutPromise]);
      frame.contentWindow?.postMessage(
        {
          type: "codexsheet-run",
          requestId,
          sourceCode: getEditorDraft(problem.number, language.id),
          input: editorInput,
        },
        "*",
      );
      const result = await Promise.race([resultPromise, timeoutPromise]);
      if (typeof result.error === "string") {
        setEditorError(result.error);
      } else {
        setEditorOutput(
          typeof result.output === "string" && result.output
            ? result.output
            : "Execution completed with no output.",
        );
      }
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Could not run code.");
    } finally {
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
      frame.remove();
      setEditorRunning(false);
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
        <div className="title-row">
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
                        : "Practice explaining solutions with your ElevenLabs voice coach."}
            </p>
          </div>
          <div className="title-actions">
            <button className="secondary-button">
              <GitBranch size={16} /> View repo
            </button>
          </div>
        </div>
        <nav className="view-switcher" aria-label="Workspace views">
          <button
            className={activeView === "dashboard" ? "active" : ""}
            aria-pressed={activeView === "dashboard"}
            onClick={() => setActiveView("dashboard")}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button
            className={activeView === "problems" ? "active" : ""}
            aria-pressed={activeView === "problems"}
            onClick={() => setActiveView("problems")}
          >
            <Rows3 size={16} /> Problems
            <span>{visibleProblems.length}</span>
          </button>
          <button
            className={activeView === "calendar" ? "active" : ""}
            aria-pressed={activeView === "calendar"}
            onClick={() => setActiveView("calendar")}
          >
            <CalendarDays size={16} /> Calendar
          </button>
          <button
            className={activeView === "roadmap" ? "active" : ""}
            aria-pressed={activeView === "roadmap"}
            onClick={() => setActiveView("roadmap")}
          >
            <MapIcon size={16} /> Roadmap
          </button>
          <button
            className={activeView === "chat" ? "active" : ""}
            aria-pressed={activeView === "chat"}
            onClick={() => setActiveView("chat")}
          >
            <MessageCircle size={16} /> Group chat
            {chatUnreadIds.length > 0 && (
              <span className="chat-unread-badge" aria-label={`${chatUnreadIds.length} unread messages`}>
                {chatUnreadIds.length > 99 ? "99+" : chatUnreadIds.length}
              </span>
            )}
          </button>
          <button
            className={activeView === "coach" ? "active" : ""}
            aria-pressed={activeView === "coach"}
            onClick={() => setActiveView("coach")}
          >
            <AudioLines size={16} /> AI coach
          </button>
          <button
            className={activeView === "notes" ? "active" : ""}
            aria-pressed={activeView === "notes"}
            onClick={() => setActiveView("notes")}
          >
            <NotebookPen size={16} /> Notes
          </button>
        </nav>
      </section>
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
                <button className="panel-link" onClick={() => setActiveView("problems")}>
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
              <h2>Your study plan</h2>
              <p>Adjust your timeline and focus. Your unsolved problems will be reordered automatically.</p>
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
          <div className="roadmap-load" aria-live="polite">
            <strong>{roadmapProblems.length}</strong>
            <span>problems remaining</span>
            <i />
            <strong>{Math.ceil(roadmapProblems.length / (roadmapPreferences.targetWeeks * roadmapPreferences.sessionsPerWeek))}</strong>
            <span>per study day</span>
            <i />
            <strong>{roadmapPreferences.sessionsPerWeek}</strong>
            <span>days each week</span>
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
              <SignInButton mode="modal">
                <button className="primary-button">Sign in</button>
              </SignInButton>
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
              <SignInButton mode="modal">
                <button className="primary-button">Sign in</button>
              </SignInButton>
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
                        <button
                          className="editor-toggle"
                          type="button"
                          aria-expanded={openEditorProblem === problem.number}
                          onClick={() => {
                            const isClosing = openEditorProblem === problem.number;
                            setOpenEditorProblem(isClosing ? null : problem.number);
                            setEditorOutput("");
                            setEditorError("");
                          }}
                        >
                          <Code2 size={14} />{" "}
                          Code
                        </button>
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
      {activeEditorProblem && (
        <section
          className="practice-workspace"
          role="dialog"
          aria-modal="true"
          aria-labelledby="practice-workspace-title"
        >
          <header className="practice-workspace-header">
            <button
              className="practice-back-button"
              type="button"
              onClick={() => setOpenEditorProblem(null)}
            >
              <ChevronLeft size={18} /> All problems
            </button>
            <span className="practice-workspace-brand">
              <Code2 size={16} /> CodexSheet Practice
            </span>
            <span className="practice-saved-label">
              Draft saved in this browser
            </span>
          </header>
          <div className="practice-workspace-layout">
            <aside className="practice-problem-pane">
              <div className="practice-problem-meta">
                <span>Problem {String(activeEditorProblem.number).padStart(3, "0")}</span>
                <span className={`difficulty ${activeEditorProblem.difficulty.toLowerCase()}`}>
                  {activeEditorProblem.difficulty}
                </span>
              </div>
              <h1 id="practice-workspace-title">{activeEditorProblem.title}</h1>
              <span className="pattern-pill">{activeEditorProblem.pattern}</span>
              <h2>Problem description</h2>
              {problemContentState.problemNumber !== activeEditorProblem.number ||
              problemContentState.loading ? (
                <p>Loading problem description…</p>
              ) : problemContentState.error ? (
                <p className="problem-content-message" role="status">
                  {problemContentState.error}
                </p>
              ) : (
                <>
                  <p>{problemContentState.content?.description}</p>
                  {(problemContentState.content?.examples.length ?? 0) > 0 && (
                    <div className="practice-example-list">
                      <h3>Examples</h3>
                      {problemContentState.content?.examples.map((example, index) => (
                        <div className="practice-example" key={index}>
                          <strong>Example {index + 1}</strong>
                          <pre>{`Input:\n${example.input}\n\nOutput:\n${example.output}`}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                  {(problemContentState.content?.constraints.length ?? 0) > 0 && (
                    <div className="practice-problem-note">
                      <strong>Constraints</strong>
                      <ul>
                        {problemContentState.content?.constraints.map((constraint) => (
                          <li key={constraint}>{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              <div className="practice-problem-note">
                <strong>Test case guidance</strong>
                <ul>
                  <li>Try the displayed examples in the input box below.</li>
                  <li>Enter custom input to test additional cases.</li>
                </ul>
              </div>
              <a
                className="practice-reference-link"
                href={activeEditorProblem.link}
                target="_blank"
                rel="noreferrer"
              >
                Open problem reference <ExternalLink size={14} />
              </a>
            </aside>
            <section className="practice-editor-pane" aria-label="Code editor">
              <div className="practice-editor-toolbar">
                <label className="code-language-picker">
                  <span>Language</span>
                  <select
                    value={editorLanguageId}
                    onChange={(event) => {
                      setEditorLanguageId(event.target.value);
                      setEditorOutput("");
                      setEditorError("");
                    }}
                  >
                    {editorLanguages.map((language) => (
                      <option key={language.id} value={language.id}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="practice-file-name">
                  {editorLanguages.find((language) => language.id === editorLanguageId)?.fileName}
                </span>
              </div>
              <Editor
                className="monaco-editor-container"
                height="100%"
                language={
                  editorLanguages.find((language) => language.id === editorLanguageId)?.monacoId ??
                  "javascript"
                }
                theme="vs-dark"
                value={getEditorDraft(activeEditorProblem.number, editorLanguageId)}
                onChange={(value: string | undefined) =>
                  updateEditorDraft(
                    activeEditorProblem.number,
                    editorLanguageId,
                    value ?? "",
                  )
                }
                options={{
                  automaticLayout: true,
                  fontSize: 13,
                  fontFamily: "'DM Mono', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  wordWrap: "on",
                  padding: { top: 14 },
                }}
              />
              <div className="practice-io-pane">
                <label>
                  <span>Input (available as `input`)</span>
                  <textarea
                    value={editorInput}
                    onChange={(event) => setEditorInput(event.target.value)}
                    placeholder="Enter input for your program"
                  />
                </label>
                <div className="practice-output-pane" aria-live="polite">
                  <span>{editorError ? "Execution issue" : "Output"}</span>
                  {editorError || editorOutput ? (
                    <pre className={editorError ? "has-error" : ""}>
                      {[editorError, editorOutput].filter(Boolean).join("\n")}
                    </pre>
                  ) : (
                    <p>Run your code to see the output here.</p>
                  )}
                </div>
              </div>
              <div className="practice-editor-footer">
                <button
                  className="run-code-button"
                  type="button"
                  onClick={() => void runProblemCode(activeEditorProblem)}
                  disabled={editorRunning || editorLanguageId !== "javascript"}
                >
                  {editorRunning ? (
                    <LoaderCircle className="spin" size={15} />
                  ) : (
                    <Play size={14} />
                  )}
                  {editorRunning ? "Running…" : "Run code"}
                </button>
              </div>
              <p className="browser-runner-note">
                JavaScript runs locally in a restricted sandbox and stops after 5 seconds. Use `console.log()` to show output; read custom input from the `input` variable. Run only code you trust. Other languages are editor-only, and automated test-case judging is not available.
              </p>
            </section>
          </div>
        </section>
      )}
      <footer className="footer-note">
        Use the patterns, then make the problem yours.
      </footer>
    </main>
  );
}

export default App;
