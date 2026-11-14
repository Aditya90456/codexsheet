import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
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
  Zap,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  BookOpen,
  Clock3,
  Crown,
  ScrollText,
  Play,
  Pause,
  RotateCcw,
  CodeXml,
  Palette,
  FileText,
  Building2,
  Layers3,
  Lock,
  MousePointer2,
  Store,
  Radar,
  Package,
  Trash2,
  Sparkles,
  GraduationCap,
  Lightbulb,
  Activity,
  Layers,
  LayoutGrid,
  Bot,
  X,
  type LucideIcon,
} from "lucide-react";
import CsLabs from "./CsLabs";
import { refreshRealtimeAuth, setClerkTokenGetter, supabase } from "./lib/supabase";
import DsaIde from "./DsaIde";
import ProblemStudyPanel from "./ProblemStudyPanel";
import DailyTaskRail from "./DailyTaskRail";
import { expectedByDay, planDays, taskForDay } from "./dailyTasks";
import { DashboardHub, ResumeTrack, resumeRows, type HubCounts } from "./DashboardHub";
import DsaCoursePage from "./DsaCoursePage";
import ProgrammingBasicsCourse from "./ProgrammingBasicsArticles";
import StudyPlanner from "./StudyPlanner";
import StudentNetwork from "./StudentNetwork";
import { loadUnreadDms } from "./studentGraph";
import MentorshipPayments from "./MentorshipPayments";
import MenteeSpace from "./MenteeSpace";
import Marketplace from "./Marketplace";
import MentorStudio from "./MentorStudio";
import InterviewExperiences from "./InterviewExperiences";
import InterviewRadar from "./InterviewRadar";
import Leaderboard from "./Leaderboard";
import Certificates, { VerifyPage } from "./Certificates";
import PatternLibrary from "./PatternLibrary";
import CompanyProblems from "./CompanyProblems";
import { companyInterviewTracks, fetchCompanyInterviewTags, type CompanyInterviewTags, type CompanyInterviewTrack } from "./companyInterviewTags";
import PatternTest from "./PatternTest";
import DsaGuru from "./DsaGuru";
import StudentFooter from "./StudentFooter";
import LanguagePicker from "./LanguagePicker";
import ResumeBuilder from "./ResumeBuilder";
import HumanVsAi from "./HumanVsAi";
import { articleDetails, type ArticleDetail } from "./articleDetails";
import { uiLanguages, useT, type MessageKey } from "./i18n";
import { mentorProfile, rupees } from "./mentorship";
import adityaPortrait from "./assets/aditya-bakshi.jpg";
import { accessPass, productById, railLabel, soldProducts, type CodexSheetProduct, type ProductId } from "./products";
import { unlocksRail, useUnlocks } from "./entitlements";
import { gitLogCommand, parseCommitSubjects, studentRepoCloneCommand, studentRepoUrl, topicFolderFor } from "./studentRepo";
import { hauslaLine, rewardVoice, sheetModeVoice, sheetVoice } from "./sheetVoice";
import { interviewTier, roadmapStages, tierLabels } from "./dsaPatterns";
import {
  getSheetRank,
  patterns,
  problemByNumber,
  problems,
  sheetRanks,
  sheetXp,
  sheetXpTotal,
  solveMilestones,
  topics,
  type Problem,
} from "./dsaSheet";

type Status = "Todo" | "In progress" | "Solved";
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
type SheetGroupMode = "week" | "topic" | "pattern";

const sheetModeLabels: Record<SheetGroupMode, string> = { week: "Stage", topic: "Topic", pattern: "Pattern" };

/** Rows rendered per group before the student has to open the rest. */
const ROWS_PER_SECTION = 60;

/** Which rail group a sheet problem sits in for the mode being browsed. */
function sheetGroupKey(problem: Problem, mode: SheetGroupMode) {
  if (mode === "week") return `Week ${problem.week}`;
  return mode === "topic" ? problem.topic : problem.pattern;
}

// The order the rail lists groups in: weeks numerically, the rest exactly as
// dsaSheet.ts declares them, so the rail, the pattern cards and the plan agree.
function sheetGroupOrder(mode: SheetGroupMode): string[] {
  if (mode === "week") return Array.from({ length: 12 }, (_, index) => `Week ${index + 1}`);
  return mode === "topic" ? [...topics] : [...patterns];
}

/** What sits under a group name in the rail - the mix it is made of. */
function sheetGroupHint(group: Problem[], mode: SheetGroupMode) {
  const mustKnow = group.filter((problem) => problem.tier === 1).length;
  const weeks = new Set(group.map((problem) => problem.week));
  if (mode === "pattern") {
    const members = new Set(group.map((problem) => problem.topic));
    return `${members.size} ${members.size === 1 ? "topic" : "topics"} · ${weeks.size === 1 ? `week ${[...weeks][0]}` : `${weeks.size} weeks`} · ${mustKnow} must-know`;
  }
  const members = new Set(group.map((problem) => problem.pattern));
  return `${members.size} ${members.size === 1 ? "pattern" : "patterns"} · ${mustKnow} must-know`;
}
export type WorkspaceView = "home" | "dashboard" | "problems" | "patterns" | "companies" | "dsa-ide" | "dsa-course" | "programming-basics" | "guru" | "cslabs" | "leaderboard" | "certificate" | "verify" | "calendar" | "roadmap" | "lld" | "whiteboard" | "chat" | "notes" | "articles" | "resume" | "mentorship" | "mentees" | "marketplace" | "studio" | "experiences" | "radar" | "network" | "arena";

export const viewPaths: Record<WorkspaceView, string> = {
  home: "/",
  dashboard: "/dashboard",
  problems: "/problems",
  patterns: "/patterns",
  companies: "/companies",
  "dsa-ide": "/ide/dsa",
  "dsa-course": "/learn/dsa",
  "programming-basics": "/learn/programming",
  guru: "/guru",
  cslabs: "/cslabs",
  leaderboard: "/leaderboard",
  certificate: "/certificate",
  verify: "/verify",
  calendar: "/calendar",
  roadmap: "/roadmap",
  lld: "/roadmap/lld",
  whiteboard: "/whiteboard/lld",
  chat: "/chat",
  notes: "/notes",
  articles: "/articles",
  resume: "/resume",
  mentorship: "/mentorship",
  mentees: "/mentees",
  marketplace: "/marketplace",
  studio: "/mentor-studio",
  experiences: "/experiences",
  radar: "/radar",
  network: "/network",
  arena: "/battle",
};

const siteOrigin = "https://www.codexsheet.in";

// Rails that arrive with their own header - their own kicker, h1 and blurb,
// written for that rail. Above them the shared band only ever printed the
// generic "Your workspace" fallback, so a student saw two titles, one of them
// wrong. Anything not listed here is a plain rail and gets the band.
export const selfHeadedViews: WorkspaceView[] = [
  "home", "guru", "leaderboard", "certificate", "verify", "patterns",
  "companies", "cslabs", "articles", "resume", "radar", "experiences",
  "mentorship", "mentees", "marketplace", "studio", "network", "dsa-course", "programming-basics", "arena",
];

const viewSeo: Record<WorkspaceView, { title: string; description: string }> = {
  home: {
    title: "CodexSheet — DSA Practice Sheet, Algorithm Labs & Mentorship",
    description: "CodexSheet is an interview-prep platform for Indian students: a curated DSA sheet, 22 free animated algorithm simulations, a real code judge and 1-on-1 mentorship.",
  },
  dashboard: { title: "Your DSA dashboard — CodexSheet", description: "Track streaks, weak patterns and the next problem worth your time." },
  problems: {
    title: "The CodexSheet DSA problem sheet — by pattern and company",
    description: "A curated DSA problem sheet organised by pattern, difficulty and hiring company, with the solution approach for every problem.",
  },
  patterns: {
    title: "16 DSA patterns, each with a spoken lesson film — CodexSheet",
    description: "Every pattern behind the 250-problem DSA sheet: how to spot it, the code skeleton, an eight-week interview plan, and a lesson film that reads its own captions in eight Indian languages while the real algorithm runs step by step on screen.",
  },
  companies: { title: "Company-wise DSA questions — CodexSheet", description: "See which patterns each company actually asks before you spend a month on the wrong topics." },
  "dsa-ide": { title: "DSA code editor with real test judging — CodexSheet", description: "Write Python, Java, C++ or JavaScript and run it against hidden test cases with verdicts, runtime and memory." },
  "dsa-course": { title: "Animated DSA course — CodexSheet", description: "A lesson-by-lesson DSA course where every data structure is shown moving, not described." },
  "programming-basics": { title: "Programming basics in Python, Java & C++ — CodexSheet", description: "A hands-on beginner course covering programming foundations in Python, Java, and C++, with runnable examples and short lessons." },
  guru: { title: "Guru — the free AI DSA teacher — CodexSheet", description: "Guru teaches one DSA topic at a time, checks your reasoning and hands you the problem that follows." },
  cslabs: {
    title: "Free algorithm labs — 22 animated DSA and CS simulations",
    description: "22 free, no-sign-in simulations of the algorithms interviewers ask about - sorting, two pointers, sliding window, hashing, trees, graphs, DP, recursion and greedy - running on numbers you type yourself.",
  },
  leaderboard: {
    title: "CodexSheet DSA leaderboard — who has solved the 250",
    description: "Standings on the CodexSheet 250-problem DSA sheet, computed from solved problems only: 10 XP Easy, 20 Medium, 35 Hard, ranked on the server.",
  },
  certificate: {
    title: "DSA practice certificate — CodexSheet",
    description: "A certificate minted from the problems you actually marked solved on the CodexSheet 250-problem sheet, with a public code anyone can verify.",
  },
  verify: {
    title: "Verify a CodexSheet certificate — check the code",
    description: "Type a CodexSheet certificate code, CS-1A2B3C4D, to see the name, the milestone and the issue date. No account needed.",
  },
  calendar: { title: "Study calendar — CodexSheet", description: "Plan the week you will actually study, and see the gap between plan and practice." },
  roadmap: { title: "12-week DSA roadmap — CodexSheet", description: "A week-by-week DSA roadmap built around your target placement season." },
  lld: { title: "Low-level design practice — CodexSheet", description: "Design the systems interviewers ask for: parking lot, elevator, splitwise, and the rest." },
  whiteboard: { title: "LLD whiteboard — CodexSheet", description: "Sketch classes and interactions the way you would on a real interview whiteboard." },
  chat: { title: "Mentor chat — CodexSheet", description: "Ask your mentor between sessions and get an answer the same day." },
  notes: { title: "Your DSA notes — CodexSheet", description: "The notes you write while practising, kept next to the problem they belong to." },
  articles: { title: "DSA articles and interview notes — CodexSheet", description: "Short, opinionated write-ups on the parts of DSA that candidates keep getting wrong." },
  resume: { title: "Resume builder — CodexSheet", description: "Build a polished resume with a live preview and save a PDF. Your draft stays in this browser." },
  mentorship: {
    title: `CodexSheet ${rupees(accessPass.price)} All Access — every paid rail, plus 1:1 mentor sessions`,
    description: `One ${rupees(accessPass.price)} CodexSheet All Access payment opens all three paid rails: the 250-problem DSA sheet with its 84-day task plan, the 12-week roadmap board and the 16 pattern films with their PPT decks. A 45-minute 1:1 Google Meet with Aditya is ${rupees(productById("session")!.price)} and bought per session. Pay on his Paytm QR, confirmed the moment the claim lands, refundable within 5 days. The rest of the workspace is free, and anyone who paid for an older rail keeps every rail.`,
  },
  mentees: { title: "Mentee console — CodexSheet", description: "Track the students you are mentoring and the sessions still owed." },
  marketplace: {
    title: "Mentor marketplace — services and digital products from real mentors",
    description: "Approved mentors publish their own sessions, workbooks and courses at their own prices, and are paid straight to their own UPI id.",
  },
  studio: { title: "Mentor studio — open a storefront on CodexSheet", description: "Apply for a mentor account, publish services and digital products, set your own prices, and confirm your own payments." },
  experiences: {
    title: "Real company interview experiences — CodexSheet",
    description: "Round by round, in the candidate's own words: which company, which role, what they actually asked. Every card was written here and read by a mentor before it was published - nothing is scraped.",
  },
  radar: {
    title: "2027 interview questions, by round — CodexSheet Radar",
    description: "What the 2027 hiring cycle is actually asking: the AI-pairing round, reading code you did not write, defending your own project, designing around a model, behavioural answers and the DSA that still gates. 27 questions across 7 rounds, each linked to the write-up it came from.",
  },
  network: {
    title: "CodexSheet Network — share code, follow students and ask in private",
    description: "The CodexSheet network: post the code you wrote for the 250-problem sheet and let the batch like, dislike or pick it apart in the comments, follow the students whose approach you want, and open a private thread to ask the doubt you have been sitting on.",
  },
  arena: {
    title: "CodexSheet Battle — Human vs AI Code Duel",
    description: "Practice company-tagged DSA interview questions in a timed JavaScript code duel. Filter Amazon, Google, Meta and more; run code privately and build your streak.",
  },
};

function viewFromLocation(): WorkspaceView {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/artcles") return "articles";
  if (path === "/jobs") return "resume";
  const match = (Object.entries(viewPaths) as Array<[WorkspaceView, string]>).find(([, route]) => route === path);
  return match?.[0] ?? "dashboard";
}

// Every destination that is not one of the three navbar taps, grouped into the
// parts of the product they belong to. The More menu renders straight from this.
type NavMenuItem = { view: WorkspaceView; label: string; labelKey?: MessageKey; icon: LucideIcon };

const navMenuGroups: Array<{ label: string; items: NavMenuItem[] }> = [
  {
    label: "Workspace",
    items: [
      { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { view: "calendar", label: "Practice calendar", icon: CalendarDays },
      { view: "certificate", label: "Certificate", icon: ScrollText },
      { view: "home", label: "Home", labelKey: "nav.home", icon: House },
    ],
  },
  {
    label: "Learn",
    items: [
      { view: "patterns", label: "Pattern library", icon: Layers },
      { view: "radar", label: "2027 interview radar", icon: Radar },
      { view: "dsa-ide", label: "Deva", labelKey: "nav.deva", icon: CodeXml },
      { view: "arena", label: "CodexSheet Battle", icon: Bot },
      { view: "dsa-course", label: "DSA Course", labelKey: "nav.course", icon: BookOpen },
      { view: "programming-basics", label: "Programming basics", icon: GraduationCap },
      { view: "guru", label: "Guru", labelKey: "nav.guru", icon: Sparkles },
      { view: "cslabs", label: "Algorithm Labs", icon: Activity },
      { view: "roadmap", label: "Roadmap", icon: MapIcon },
      { view: "notes", label: "Notes", icon: NotebookPen },
      { view: "articles", label: "Articles", icon: BookOpen },
    ],
  },
  {
    label: "Community",
    items: [
      { view: "chat", label: "Group chat", icon: MessageCircle },
      { view: "network", label: "Network", icon: Users },
      { view: "experiences", label: "Interview experiences", icon: Building2 },
    ],
  },
  {
    label: "Career",
    items: [
      { view: "resume", label: "Resume builder", icon: FileText },
    ],
  },
  {
    label: "Mentors",
    items: [
      { view: "mentorship", label: "1:1 mentorship", icon: GraduationCap },
      { view: "marketplace", label: "Mentor marketplace", icon: Store },
      { view: "studio", label: "Mentor studio", icon: Package },
      { view: "mentees", label: "My mentees", icon: Users },
    ],
  },
];

const moreMenuViews: WorkspaceView[] = navMenuGroups.flatMap((group) => group.items.map((item) => item.view));



/**
 * The public landing page and the signed-in home, one component. Everything a
 * visitor sees is a fact from the data modules - problem, pattern, stage and
 * language counts come from dsaSheet, dsaPatterns and i18n, and the day-one card
 * is what planCalendar() really assigns, so the page cannot drift from the sheet.
 */
export function HomePage({
  signedIn,
  signInSlot,
  onNavigate,
  onOpenProduct,
}: {
  signedIn: boolean;
  /** The Clerk sign-in button, handed over by App so this stays presentation. */
  signInSlot: ReactNode;
  onNavigate: (view: WorkspaceView, plan?: string) => void;
  /** The catalogue card a visitor taps - lands the checkout on that product. */
  onOpenProduct: (product: ProductId) => void;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const tr = useT();
  const stageStats = useMemo(() => {
    const ownerOf = new Map(roadmapStages.flatMap((stage, index) => stage.patterns.map((name) => [name, index] as const)));
    const buckets = roadmapStages.map(() => ({ total: 0, tiers: { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number> }));
    for (const problem of problems) {
      const stageIndex = ownerOf.get(problem.pattern);
      if (stageIndex === undefined) continue;
      buckets[stageIndex].total += 1;
      buckets[stageIndex].tiers[interviewTier(problem)] += 1;
    }
    return buckets;
  }, []);
  /** Day 1 of the 12-week plan - the same rows the plan hands a new student. */
  const firstDay = useMemo(() => taskForDay(1), []);

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
            .from(".home-plan", { y: 26, opacity: 0, duration: 0.6 }, "-=0.45")
            .from(".home-plan-rows li", { y: 14, opacity: 0, duration: 0.4, stagger: 0.07 }, "-=0.3");

          engine.from(".home-path-row", {
            y: 18,
            opacity: 0,
            duration: 0.5,
            stagger: 0.07,
            ease: "power2.out",
            scrollTrigger: { trigger: ".home-path", start: "top 82%", once: true },
          });
          engine.from(".home-tier", {
            y: 18,
            opacity: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: ".home-tiers", start: "top 85%", once: true },
          });
          engine.from(".home-builder > *", {
            y: 18,
            opacity: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: ".home-builder", start: "top 88%", once: true },
          });
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
    <div className="home-page home-simple" ref={pageRef}>
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-copy">
            <span className="home-eyebrow"><span className="home-live-dot" /> {tr("home.eyebrow")}</span>
            <h1>{tr("home.title1")} <em>{tr("home.title2")}</em></h1>
            <p>{tr("home.body")}</p>
            <div className="home-actions">
              {signedIn ? (
                <button className="home-primary" type="button" onClick={() => onNavigate("problems")}>{tr("home.cta1")} <ArrowRight size={16} /></button>
              ) : signInSlot}
              <button className="home-secondary" type="button" onClick={() => onOpenProduct(accessPass.id)}>{tr("home.ctaPass", { price: rupees(accessPass.price) })}</button>
            </div>
            <ul className="home-numbers">
              <li><strong>{problems.length}</strong><span>problems</span></li>
              <li><strong>{patterns.length}</strong><span>patterns</span></li>
              <li><strong>{roadmapStages.length}</strong><span>stages</span></li>
              <li><strong>{uiLanguages.length - 1}</strong><span>Indian languages, free</span></li>
            </ul>
          </div>

          <aside className="home-plan" aria-label="What the plan asks on day one">
            <div className="home-plan-head"><span>DAY 1 OF {planDays}</span><span>WEEK {firstDay.week}</span></div>
            <ol className="home-plan-rows">
              {firstDay.rows.slice(0, 4).map((problem) => (
                <li key={problem.number}>
                  <strong>{problem.title}</strong>
                  <span>{problem.pattern}</span>
                  <em>{problem.difficulty}</em>
                </li>
              ))}
            </ol>
            <div className="home-plan-foot">
              <span>{firstDay.rows.length} today · {expectedByDay(1)} done by tonight</span>
              <button type="button" onClick={() => onNavigate("problems")}>Open the sheet <ArrowRight size={14} /></button>
            </div>
          </aside>
        </div>
        <div className="home-hero-bottom"><span>ONE PATTERN · ONE PROBLEM · ONE STEP</span><span>SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span></div>
      </section>

      <section className="home-path" aria-labelledby="home-path-title">
        <div className="home-section-heading">
          <div><span className="home-section-kicker">THE PATH, IN ORDER</span><h2 id="home-path-title">{roadmapStages.length} stages, <em>{problems.length} problems.</em></h2></div>
          <p>A ladder, not a list. Each stage is a set of patterns, the reps behind them and what you can say out loud at the end of it.</p>
        </div>
        <ol className="home-path-list">
          {roadmapStages.map((stage, index) => {
            const stats = stageStats[index];
            return (
              <li className="home-path-row" key={stage.name}>
                <button type="button" onClick={() => onNavigate("roadmap")}>
                  <span className="home-path-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="home-path-name"><strong>{stage.name}</strong><small>{stage.outcome}</small></span>
                  <span className="home-path-patterns">{stage.patterns.length} patterns · {stage.weeks}</span>
                  <span className="home-path-count">
                    <strong>{stats.total}</strong>
                    <small>{([1, 2, 3] as const).map((tier) => `${stats.tiers[tier]} ${tierLabels[tier].toLowerCase()}`).join(" · ")}</small>
                  </span>
                  <ArrowRight size={15} />
                </button>
              </li>
            );
          })}
        </ol>
        <div className="home-path-foot">
          <button className="home-link" type="button" onClick={() => onNavigate("patterns")}>{patterns.length} pattern films, with the deck for each <ArrowRight size={15} /></button>
          <button className="home-link" type="button" onClick={() => onNavigate("guru")}>Guru, the AI teacher <ArrowRight size={15} /></button>
        </div>
      </section>

      <section className="home-tiers" aria-labelledby="home-tiers-title">
        <div className="home-section-heading">
          <div><span className="home-section-kicker">ONE {rupees(accessPass.price)} PAYMENT · NO GATEWAY</span><h2 id="home-tiers-title">Free to start. <em>Then one pass.</em></h2></div>
          <p>Paid on Aditya&apos;s Paytm QR and confirmed the moment the claim lands. The pass never expires.</p>
        </div>
        <ul className="home-tier-list">
          <li className="home-tier home-tier-free">
            <span className="home-tier-price">FREE</span>
            <div className="home-tier-body">
              <strong>The workspace</strong>
              <p>The Deva editor with real judged submissions, Guru in {uiLanguages.length - 1} Indian languages, the Algorithm Labs, notes, group chat, the leaderboard, your certificate and the 2027 radar - open with a Google sign-in.</p>
            </div>
            <span className="home-tier-action">{signedIn ? "Yours already" : "Google sign-in"}</span>
          </li>
          {soldProducts.map((item) => (
            <li className="home-tier" key={item.id}>
              <span className="home-tier-price">{rupees(item.price)}</span>
              <div className="home-tier-body">
                <strong>{item.name}</strong>
                <p>{item.oneLine} Opens {railLabel(item)}.</p>
              </div>
              <button type="button" onClick={() => onOpenProduct(item.id)}>Unlock <ArrowRight size={14} /></button>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-builder" aria-label="Who builds CodexSheet">
        <img className="home-builder-portrait" src={adityaPortrait} alt="Aditya Bakshi, your mentor" width={104} height={104} loading="lazy" />
        <div className="home-builder-copy">
          <span className="home-section-kicker">BUILT BY ONE PERSON</span>
          <h2>{mentorProfile.name} <em>writes the code and takes the sessions.</em></h2>
          <p className="home-builder-role">{mentorProfile.role}. He solved the problems himself, wrote the pattern notes he wanted at 2am, and put them where any student can reach them.</p>
          <ul className="home-builder-stats">
            {mentorProfile.stats.map((stat) => (
              <li key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></li>
            ))}
          </ul>
          <p className="home-builder-stack">{mentorProfile.stack.join(" · ")}</p>
        </div>
        <div className="home-builder-side">
          {mentorProfile.projects.map((project) => (
            <a className="home-builder-project" key={project.name} href={project.href} target="_blank" rel="noreferrer">
              <strong>{project.name}</strong><span>{project.blurb}</span>
            </a>
          ))}
          <button className="home-link" type="button" onClick={() => onNavigate("mentorship")}>Book a 1:1 session <ArrowRight size={15} /></button>
        </div>
      </section>
      <footer className="home-footer"><span>codexsheet</span><span>Built by Aditya Bakshi - one pattern, one problem, one step forward.</span><nav className="home-social-links" aria-label="Social profiles"><a href="https://www.instagram.com/adityabakshi10/" target="_blank" rel="noreferrer" aria-label="Instagram: adityabakshi10"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg> adityabakshi10</a><a href="https://www.linkedin.com/in/aditya-bakshi-11923dd/?isSelfProfile=true" target="_blank" rel="noreferrer" aria-label="Aditya Bakshi on LinkedIn"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M5.2 3.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.4 9.5h3.7v11H3.4v-11Zm6 0h3.5V11h.1c.5-.9 1.7-1.9 3.5-1.9 3.8 0 4.5 2.4 4.5 5.5v5.9h-3.7v-5.2c0-1.2 0-2.8-1.8-2.8s-2.1 1.3-2.1 2.7v5.3H9.4v-11Z"/></svg> LinkedIn</a></nav><button type="button" onClick={() => onNavigate("problems")}>Go to the problem sheet <ArrowRight size={14} /></button></footer>
    </div>
  );
}

const dsaArticles = [
  { category: "FOUNDATIONS", title: "Big O, without the mystery", read: "6 min read", summary: "Learn to describe how an algorithm scales as input grows, and why the slowest-growing term matters.", concept: "Complexity", body: "Big O describes how an algorithm’s work grows with its input. It helps compare approaches independently of hardware: a single pass through n values is O(n), while comparing every pair is O(n²).", takeaway: "Count the work that grows with n. Drop constants and lower-order terms: 3n² + 4n + 9 becomes O(n²).", code: "for (const item of items) {\n  visit(item); // O(n)\n}" },
  { category: "ARRAYS & HASHING", title: "Hash maps: trade space for speed", read: "5 min read", summary: "Turn repeated searches into quick lookups by storing the information you have already seen.", concept: "Hash map", body: "A hash map stores key–value pairs and usually looks up a key in constant time. It is useful when a problem asks whether something has appeared before, how often it occurs, or what value complements the current one.", takeaway: "For Two Sum, store each value’s index. At x, look for target − x before saving x.", code: "for (let i = 0; i < nums.length; i++) {\n  const need = target - nums[i];\n  if (seen.has(need)) return [seen.get(need), i];\n  seen.set(nums[i], i);\n}" },
  { category: "SEARCH", title: "Binary search is a boundary finder", read: "7 min read", summary: "Use a sorted range to discard half the search space at every step—and keep your loop honest.", concept: "Binary search", body: "Binary search works when the search space is ordered or when a yes/no condition changes monotonically. Each comparison rules out half the remaining candidates, giving O(log n) time.", takeaway: "Maintain a clear invariant: the answer stays inside [left, right]. Use mid = left + floor((right − left) / 2).", code: "while (left <= right) {\n  const mid = left + Math.floor((right - left) / 2);\n  if (nums[mid] === target) return mid;\n  if (nums[mid] < target) left = mid + 1;\n  else right = mid - 1;\n}" },
  { category: "PATTERNS", title: "Sliding window: remember the useful range", read: "8 min read", summary: "Replace repeated subarray work with a window that expands and contracts as you scan.", concept: "Sliding window", body: "A sliding window tracks a contiguous section of an array or string. Move the right edge to include new values; when the window breaks a rule, move the left edge until it is valid again.", takeaway: "Ask whether the problem concerns a contiguous range. If each pointer moves only forward, many O(n²) scans become O(n).", code: "let left = 0;\nfor (let right = 0; right < text.length; right++) {\n  add(text[right]);\n  while (!isValid()) remove(text[left++]);\n  best = Math.max(best, right - left + 1);\n}" },
  { category: "DATA STRUCTURES", title: "Trees are recursive by nature", read: "6 min read", summary: "See how each subtree is a smaller version of the whole, and use that to design traversals.", concept: "Trees", body: "A tree is a hierarchy of nodes connected by edges. In a binary tree, each node has at most two children. Preorder, inorder, and postorder differ only in when the current node is processed relative to its children.", takeaway: "State what a recursive call returns. For maximum depth: the depth of this node is 1 + the larger child depth.", code: "function depth(node) {\n  if (!node) return 0;\n  return 1 + Math.max(depth(node.left), depth(node.right));\n}" },
  { category: "DYNAMIC PROGRAMMING", title: "DP starts with repeated subproblems", read: "9 min read", summary: "Build a dynamic programming solution by naming a state, a recurrence, and its base cases.", concept: "Dynamic programming", body: "Dynamic programming saves answers to smaller subproblems so they are not recomputed. A useful state captures exactly what is needed to make the next decision; a recurrence explains how states depend on one another.", takeaway: "Define the state in one sentence, write the recurrence, set base cases, then choose an evaluation order.", code: "// ways[i] = ways to reach step i\nways[0] = 1;\nfor (let i = 1; i <= n; i++) {\n  ways[i] = ways[i - 1] + (i > 1 ? ways[i - 2] : 0);\n}" },
  { category: "DATA STRUCTURES", title: "Stacks and queues shape the order", read: "5 min read", summary: "Choose a stack for last-in-first-out work and a queue for first-in-first-out work.", concept: "Stack & queue", body: "A stack removes the newest item first, which makes it useful for nested work, undo actions, and matching brackets. A queue removes the oldest item first, which is the natural choice for level-by-level tree traversal and breadth-first search.", takeaway: "When the next item to process depends on arrival order, the right structure often makes the algorithm obvious.", code: "stack.push(item);\nconst newest = stack.pop();\n\nqueue.push(item);\nconst oldest = queue.shift();" },
  { category: "GRAPHS", title: "Graph traversal: visit without looping forever", read: "8 min read", summary: "Use a visited set to explore connected nodes safely with DFS or BFS.", concept: "Graph traversal", body: "Graphs model relationships that are not necessarily hierarchical. Depth-first search follows one path before backtracking; breadth-first search explores in layers and finds shortest paths in an unweighted graph.", takeaway: "Mark nodes visited when adding them to the worklist. This prevents cycles from sending the traversal around forever.", code: "const queue = [start];\nconst visited = new Set([start]);\nwhile (queue.length) {\n  const node = queue.shift();\n  for (const next of graph.get(node) ?? []) {\n    if (visited.has(next)) continue;\n    visited.add(next); queue.push(next);\n  }\n}" },
  { category: "RECURSION", title: "Recursion needs a smaller next step", read: "6 min read", summary: "Make recursive solutions safe by naming the base case and shrinking the problem each call.", concept: "Recursion", body: "A recursive function solves a problem by delegating a smaller version of it to itself. Every correct recursive design has a base case that stops and a recursive step that moves closer to that case.", takeaway: "Trace a tiny input by hand. If each call does not make measurable progress toward the base case, the recursion will not terminate.", code: "function sumTo(n) {\n  if (n <= 0) return 0; // base case\n  return n + sumTo(n - 1); // smaller input\n}" },
  { category: "GREEDY", title: "Greedy choices need a reason", read: "7 min read", summary: "Make the locally best choice only when you can explain why it leads to a global optimum.", concept: "Greedy algorithm", body: "A greedy algorithm commits to a choice at each step without revisiting it. This can be fast and simple, but a plausible local choice is not automatically correct; the proof is what makes the method trustworthy.", takeaway: "Look for an exchange argument or a stays-ahead proof. If you cannot justify the choice, compare it against dynamic programming or search.", code: "intervals.sort((a, b) => a.end - b.end);\nlet finish = -Infinity;\nfor (const interval of intervals) {\n  if (interval.start >= finish) {\n    choose(interval); finish = interval.end;\n  }\n}" },
  { category: "DATA STRUCTURES", title: "Heaps keep the next best item close", read: "6 min read", summary: "Use a priority queue when you repeatedly need the smallest or largest remaining value.", concept: "Heap", body: "A binary heap keeps its highest-priority value at the root while maintaining a compact tree shape. It does not fully sort every item, so inserting and removing the top item take O(log n), with O(1) access to the current minimum or maximum.", takeaway: "For top-k questions, keep a heap of size k instead of sorting all n values when k is small.", code: "for (const value of values) {\n  minHeap.push(value);\n  if (minHeap.size() > k) minHeap.pop();\n}\nreturn minHeap.peek();" },
];

const articleLessons: Record<string, { detail: string; usefulWhen: string; complexity: string; steps: string[] }> = {
  "Complexity": { detail: "Complexity is a model of growth. We ask how the number of operations changes as the input size n increases, while ignoring machine-specific timing. A loop over every item grows linearly. A loop nested inside another full scan grows quadratically. Repeatedly halving a range grows logarithmically. This lets us reason about whether an approach will still work when the input becomes much larger.", usefulWhen: "Use it to compare two correct approaches, estimate whether a solution fits the constraints, and spot the part of your code that dominates as input grows.", complexity: "Time: depends on the algorithm · Space: count extra memory", steps: ["Compare growth as input grows", "A full scan visits n items", "Nested scans visit about n² pairs", "Halving the range takes log₂ n steps"] },
  "Hash map": { detail: "A hash map converts a key into a bucket location, so a lookup usually takes constant time on average. Its key benefit is memory: instead of searching the prefix repeatedly, keep a compact record of what has already appeared. For Two Sum, the map represents the past; each new value asks whether its complement is already in that past. Check first, then insert, so an element cannot accidentally match itself.", usefulWhen: "Use one when you need fast membership checks, frequency counts, grouping by a signature, or a relationship between a current item and an earlier one.", complexity: "Average lookup / insert: O(1) · Extra space: O(n)", steps: ["Read the current value", "Compute the needed complement", "Look for it in earlier values", "Save this value for later"] },
  "Binary search": { detail: "Binary search keeps a range that is guaranteed to contain the answer. At each step, inspect its midpoint. If the midpoint is too small, every value to its left can be discarded; if it is too large, discard the right side. The invariant matters more than memorizing a loop: after each update, the answer must remain inside the candidate range. This same idea works on a sorted array and on a monotonic yes/no condition.", usefulWhen: "Use it when the input is sorted, or when you can define a condition that changes once from false to true (or true to false).", complexity: "Time: O(log n) · Extra space: O(1)", steps: ["Start with the full sorted range", "Inspect the middle candidate", "Discard the half that cannot contain the answer", "Repeat until the range is empty or found"] },
  "Sliding window": { detail: "A sliding window keeps a summary of one contiguous range. Advancing the right edge adds information; advancing the left edge removes information. The key optimization is that neither pointer moves backward. Even if a while-loop appears inside a for-loop, each item enters and leaves the window at most once, so the total work stays linear. For variable-size windows, shrink only when the current window violates the problem’s condition.", usefulWhen: "Use it for contiguous substrings or subarrays when you need a longest, shortest, or count result under a condition.", complexity: "Time: O(n) when each pointer only moves forward · Space: depends on the window summary", steps: ["Expand the right edge", "Update the window summary", "Shrink from the left if the rule breaks", "Record the best valid window"] },
  "Trees": { detail: "A tree breaks into smaller trees: the left and right subtrees. That recursive structure makes divide-and-combine solutions natural. Decide what each call promises to return, handle the empty tree as the base case, then combine the child results. Traversal order changes when you process the current node: preorder processes it before children, inorder between children, and postorder after them.", usefulWhen: "Use tree traversal for hierarchy questions, path properties, subtree summaries, and ordered search in a binary search tree.", complexity: "Traversal: O(n) time · Call stack: O(h), where h is tree height", steps: ["Arrive at the current node", "Visit the left subtree", "Visit the right subtree", "Combine child results at the parent"] },
  "Dynamic programming": { detail: "Dynamic programming is useful when a problem has overlapping subproblems and an optimal solution can be composed from smaller choices. The state is the smallest description of a subproblem that preserves everything future decisions need. The recurrence expresses the choices; base cases anchor the recurrence. Memoization evaluates only requested states, while tabulation fills a table in dependency order. Once the table is understood, many solutions can reduce memory to the previous row or a few variables.", usefulWhen: "Use it when naive recursion repeats the same states, especially for counting, feasibility, or best-value choices over prefixes, ranges, or capacities.", complexity: "Time / space: number of states × work per state", steps: ["Name the state", "Write the choices as a recurrence", "Set the base cases", "Fill states in dependency order"] },
  "Stack & queue": { detail: "A stack and a queue both hold a sequence of pending work; their removal rule defines their behavior. A stack is last-in, first-out, which mirrors nested structure: the most recently opened bracket must close first. A queue is first-in, first-out, which processes work in arrival order and naturally explores graphs level by level. These operations are usually O(1) when backed by suitable containers.", usefulWhen: "Choose a stack for nested state, undo, parsing, or DFS. Choose a queue for scheduling, BFS, or processing items by arrival order.", complexity: "Push / pop / enqueue / dequeue: O(1) with a suitable implementation", steps: ["Add a new item", "Stack returns the newest item", "Queue returns the oldest item", "The removal rule determines the traversal"] },
  "Graph traversal": { detail: "A graph is a set of vertices connected by edges; it can contain cycles, so a traversal needs a visited set. DFS follows one branch deeply and is often implemented with recursion or a stack. BFS uses a queue and explores by distance from the start. In an unweighted graph, that layer order proves the first time BFS reaches a node is through a shortest path. Mark nodes as discovered when they enter the worklist to avoid duplicate visits.", usefulWhen: "Use traversal for reachability, connected components, grid regions, dependency exploration, or shortest paths in an unweighted graph.", complexity: "Time: O(V + E) · Space: O(V)", steps: ["Add the start node to the queue", "Remove the next node to explore", "Discover each unvisited neighbor", "Process the graph one layer at a time"] },
  "Recursion": { detail: "A recursive function delegates a smaller instance of a problem to itself. A sound design has a base case, a progress rule that moves toward it, and a clear contract for what the call returns. The runtime call stack remembers each unfinished call. Deep recursion can therefore use O(depth) stack space; an iterative version with an explicit stack can make that memory visible and avoid call-stack limits.", usefulWhen: "Use it for naturally nested data and split-into-smaller-subproblem designs; consider iteration when depth can be very large.", complexity: "Time: number of calls × work per call · Stack: recursion depth", steps: ["Receive the current subproblem", "Check whether it is already solved", "Create a smaller subproblem", "Return and combine the result"] },
  "Greedy algorithm": { detail: "A greedy method makes one locally attractive choice and commits. The implementation may be simple, but correctness requires a proof that the choice can belong to an optimal solution. For interval scheduling, choosing the compatible interval that finishes earliest leaves the most room for later intervals; an exchange argument shows an optimal schedule can use that choice without losing solutions. The proof is what separates a valid greedy algorithm from a tempting heuristic.", usefulWhen: "Use it when choices can be ordered and you can prove an exchange or stays-ahead property; otherwise compare with DP or search.", complexity: "Often O(n log n) for sorting, then O(n) for selection", steps: ["Sort choices by the proven priority", "Take the best compatible choice", "Discard choices that now conflict", "Repeat while preserving feasibility"] },
  "Heap": { detail: "A binary heap is a complete binary tree stored compactly in an array. The heap property guarantees only that each parent outranks its children; it does not sort every pair. That is enough to expose the minimum or maximum at the root. Insertion bubbles one value upward, and removal replaces the root then sifts a value downward, each across at most the tree height. A heap is especially effective when the next best item is needed repeatedly.", usefulWhen: "Use it for priority queues, streaming top-k problems, merging sorted streams, or repeatedly scheduling the next event.", complexity: "Peek: O(1) · Push / pop: O(log n) · Build: O(n)", steps: ["Keep the highest priority at the root", "Insert a new value at the next open leaf", "Restore order by moving it upward", "Remove the root and sift the replacement down"] },
};

function ConceptDiagram({ article, lesson }: { article: (typeof dsaArticles)[number]; lesson: (typeof articleLessons)[string] }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => { setStep(0); setPlaying(true); }, [article]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStep((current) => (current + 1) % lesson.steps.length), 1350);
    return () => window.clearInterval(timer);
  }, [lesson.steps.length, playing]);
  const family = article.concept;
  const current = step % lesson.steps.length;
  return <div className={`lesson-diagram diagram-${family.toLowerCase().replace(/[^a-z]+/g,"-")}`}>
    <div className="lesson-diagram-top"><span>LOOPING CONCEPT ANIMATION</span><span>{String(current + 1).padStart(2,"0")} / {String(lesson.steps.length).padStart(2,"0")}</span></div>
    <div className={`lesson-visual-stage visual-step-${current}`} aria-label={`${family} illustration: ${lesson.steps[current]}`}>
      {family === "Complexity" && <svg viewBox="0 0 360 205" role="img" aria-label="Algorithm growth curves"><path className="chart-gridline" d="M42 20V170H340M42 132H340M42 94H340M42 56H340"/><path className="chart-line chart-linear" d="M46 165 C120 154 211 132 328 99"/><path className="chart-line chart-log" d="M46 160 C90 112 177 92 328 82"/><path className="chart-line chart-quadratic" d="M46 165 C120 160 201 112 268 24"/><text x="278" y="92">log n</text><text x="303" y="107">n</text><text x="254" y="35">n²</text><text x="16" y="21">WORK</text><text x="310" y="190">INPUT →</text></svg>}
      {family === "Hash map" && <div className="hash-diagram"><span className="diagram-input">value: 7 <b>→</b> need: 5</span><div className="hash-buckets">{[2,5,7,9].map((value,index)=><div className={`hash-bucket ${current >= 2 && index===1 || current===1 && index===2 ? "is-active" : ""}`} key={value}><small>key {value}</small><strong>{index===1?"idx 0":`idx ${index+2}`}</strong></div>)}</div><span className="diagram-result">{current < 2 ? "LOOK UP THE COMPLEMENT" : "MATCH FOUND · RETURN PAIR"}</span></div>}
      {family === "Binary search" && <div className="binary-diagram"><div className="binary-range-label">{current < 2 ? "CANDIDATE RANGE" : "NARROWED RANGE"}</div><div className="binary-values">{[2,5,8,12,16,21,27,34].map((value,index)=><span className={`${current === 1 && index === 3 || current >= 2 && (index===4 || index===5) ? "is-mid" : ""} ${current >= 2 && index<4 ? "is-discarded" : ""}`} key={value}>{value}</span>)}</div><div className="binary-pointer-row"><span>left</span><span>mid</span><span>right</span></div></div>}
      {family === "Sliding window" && <div className="window-diagram"><div className="window-label">CONTIGUOUS RANGE <span>length {current+2}</span></div><div className="window-values">{[4,2,1,7,8,3,5,6].map((value,index)=><span className={index >= current && index < current + 2 + (current % 3) ? "in-window" : ""} key={`${value}-${index}`}>{value}</span>)}</div><div className="window-track"><i style={{ left: `${current*10}%`, width: `${(2 + current%3)*10}%` }}/></div><div className="window-pointers"><span>← left</span><span>right →</span></div></div>}
      {family === "Trees" && <svg viewBox="0 0 360 220" className="tree-diagram" role="img" aria-label="Tree traversal"><path d="M180 48L95 105M180 48L265 105M95 125L55 178M95 125L135 178M265 125L225 178M265 125L305 178"/><g className={current===0?"node-active":""}><circle cx="180" cy="38" r="20"/><text x="180" y="42">A</text></g><g className={current===1?"node-active":""}><circle cx="95" cy="115" r="18"/><text x="95" y="119">B</text></g><g className={current>=2?"node-active":""}><circle cx="265" cy="115" r="18"/><text x="265" y="119">C</text></g><circle cx="55" cy="188" r="14"/><circle cx="135" cy="188" r="14"/><circle cx="225" cy="188" r="14"/><circle cx="305" cy="188" r="14"/><text className="tree-caption" x="180" y="216">PARENT RESULT = 1 + CHILD RESULTS</text></svg>}
      {family === "Dynamic programming" && <div className="dp-diagram"><div className="dp-equation">ways[i] = ways[i − 1] + ways[i − 2]</div><div className="dp-cells">{[1,1,2,3,5,8,13].map((value,index)=><div className={index <= current+2 ? "is-filled" : ""} key={index}><small>i={index}</small><strong>{index <= current+2 ? value : "?"}</strong></div>)}</div><div className="dp-caption">SAVE EACH ANSWER · REUSE IT LATER</div></div>}
      {(family === "Stack & queue" || family === "Recursion") && <div className="linear-structure"><div className="structure-stack"><span className={current===0?"is-active":""}>item 03</span><span className={current===1?"is-active":""}>item 02</span><span>item 01</span><small>{family === "Recursion" ? "CALL STACK" : "LAST IN · FIRST OUT"}</small></div><div className="structure-arrow">{current===1?"← return":"push →"}</div><div className="structure-state"><span>current work</span><strong>{current===0?"item 03":current===1?"item 02":"item 01"}</strong></div></div>}
      {family === "Graph traversal" && <svg viewBox="0 0 360 210" className="graph-diagram" role="img" aria-label="Breadth-first graph traversal"><g className="graph-edges"><path d="M76 101L155 54M76 101L160 155M155 54L250 73M160 155L250 143M250 73L303 109M250 143L303 109"/></g>{[[76,101,"A"],[155,54,"B"],[160,155,"C"],[250,73,"D"],[250,143,"E"],[303,109,"F"]].map(([x,y,label],index)=><g className={index<=current+1?"node-visited":""} key={label as string}><circle cx={x as number} cy={y as number} r="19"/><text x={x as number} y={(y as number)+4}>{label as string}</text></g>)}<text className="graph-caption" x="180" y="200">QUEUE · {current<2?"A → B, C":"D → E → F"}</text></svg>}
      {(family === "Greedy algorithm" || family === "Heap") && <div className="choice-diagram">{family === "Greedy algorithm" ? <><span className="choice-title">CHOOSE THE EARLIEST FINISH</span>{[68,46,76,54].map((width,index)=><div className="interval-row" key={index}><small>{String.fromCharCode(65+index)}</small><i style={{width:`${width}%`}} className={index===current?"is-selected":""}/></div>)}<span className="choice-foot">KEEP THE SCHEDULE FEASIBLE</span></> : <><span className="choice-title">MIN-HEAP · SMALLEST AT ROOT</span><svg viewBox="0 0 320 180" className="heap-tree" role="img" aria-label="Min heap"><path d="M160 40L86 100M160 40L234 100M86 118L48 160M86 118L124 160M234 118L196 160M234 118L272 160"/><g className={current===0?"node-active":""}><circle cx="160" cy="34" r="23"/><text x="160" y="39">2</text></g><circle cx="86" cy="108" r="20"/><text x="86" y="113">5</text><circle cx="234" cy="108" r="20"/><text x="234" y="113">8</text><circle cx="48" cy="163" r="16"/><text x="48" y="168">9</text><circle cx="124" cy="163" r="16"/><text x="124" y="168">11</text><circle cx="196" cy="163" r="16"/><text x="196" y="168">12</text><circle cx="272" cy="163" r="16"/><text x="272" y="168">15</text></svg><span className="choice-foot">PUSH / POP · O(log n)</span></>}</div>}
    </div>
    <div className="lesson-step-copy"><strong>{lesson.steps[current]}</strong><span>{current + 1} of {lesson.steps.length}</span></div>
    <div className="lesson-step-dots">{lesson.steps.map((stepLabel,index)=><button type="button" className={index===current?"active":""} key={stepLabel} onClick={()=>{setStep(index);setPlaying(false);}} aria-label={`Show step ${index+1}: ${stepLabel}`} />)}</div>
    <div className="lesson-diagram-controls"><button type="button" onClick={()=>setPlaying((value)=>!value)}>{playing?<Pause size={13}/>:<Play size={13}/>} {playing?"Pause loop":"Resume loop"}</button><button type="button" onClick={()=>{setPlaying(true);setStep(0);}} aria-label="Restart animation"><RotateCcw size={13}/></button><span>{playing?"LOOPING · PAUSE ANYTIME":"PAUSED · RESUME ANYTIME"}</span></div>
  </div>;
}

function DsaOverviewLoop() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % 4), 1050);
    return () => window.clearInterval(timer);
  }, []);
  return <div className={`dsa-overview-loop overview-frame-${frame}`} aria-label="Looping overview of data structures, algorithms, and problem-solving patterns">
    <h3>Data Structures and Algorithms</h3>
    <section className="overview-band overview-structures"><header>● DATA STRUCTURES</header><div className="overview-grid overview-grid-four">
      <div className="overview-cell"><b>Array</b><div className="overview-array">{[7,2,9,4,6,1].map((value,index)=><span className={index === (frame + 1) % 6 ? "is-lit" : ""} key={index}>{value}</span>)}</div><small>0　1　2　3　4　5</small></div>
      <div className="overview-cell"><b>Linked List</b><div className="overview-linked">{[3,8,1,9,4].map((value,index)=><span key={value} className={index === frame ? "is-lit" : ""}>{value}{index < 4 && <i>→</i>}</span>)}</div></div>
      <div className="overview-cell"><b>Stack</b><div className="overview-stack"><span className={frame % 2 === 0 ? "is-lit" : ""}>12</span><span>8</span><small>◂ top</small></div></div>
      <div className="overview-cell"><b>Hash map</b><div className="overview-hash">{[12,7,5].map((value,index)=><span key={value}><small>{index} →</small><i className={frame === index ? "is-lit" : ""}>{value}</i></span>)}</div></div>
    </div></section>
    <section className="overview-band overview-algorithms"><header>● ALGORITHMS</header><div className="overview-grid overview-grid-three">
      <div className="overview-cell"><b>Insertion Sort</b><div className="overview-bars">{[22,32,42,58,72,84,98].map((height,index)=><i key={index} style={{height:`${height}%`}} className={index === frame + 2 ? "is-lit" : ""}/>)}</div></div>
      <div className="overview-cell"><b>Binary Search</b><div className="overview-search"><small>target 23</small><div>{[2,5,8,12,16,23,38,56,72].map((value,index)=><i key={value} className={index === (frame + 5) % 9 ? "is-lit" : ""}>{value}</i>)}</div></div></div>
      <div className="overview-cell"><b>Depth-First Search</b><div className="overview-tree"><svg viewBox="0 0 240 105" aria-hidden="true"><path d="M120 22 64 53M120 22 176 53M64 53 38 88M64 53 90 88M176 53 150 88M176 53 202 88"/></svg>{[[120,10,"8"],[64,42,"4"],[176,42,"12"],[38,78,"2"],[90,78,"6"],[150,78,"10"],[202,78,"14"]].map(([x,y,value],index)=><span key={value as string} className={index === (frame + 1) % 7 ? "is-lit" : ""} style={{left:`${(x as number)/2.4}%`,top:`${(y as number)/1.05}%`}}>{value}</span>)}</div></div>
    </div></section>
    <section className="overview-band overview-patterns"><header>● PATTERNS</header><div className="overview-grid overview-grid-three">
      <div className="overview-cell"><b>Two Pointers</b><div className="overview-pointers">{[1,2,4,6,8,9,11,14,17].map((value,index)=><i key={value} className={index === frame + 1 || index === 6 ? "is-lit" : ""}>{value}</i>)}</div></div>
      <div className="overview-cell"><b>Sliding Window</b><div className="overview-window">{[4,2,7,1,8,3,5,9].map((value,index)=><i key={index} className={index >= frame + 2 && index < frame + 5 ? "is-lit" : ""}>{value}</i>)}</div></div>
      <div className="overview-cell"><b>Dynamic Programming</b><div className="overview-dp">{Array.from({length:21},(_,index)=><i key={index} className={index <= frame * 4 + 5 ? "is-lit" : ""}/>)}</div></div>
    </div></section>
    <div className="overview-caption"><span>CONCEPTS IN MOTION</span><span>ANIMATED LEARNING MAP · LOOPING</span></div>
  </div>;
}

const seniorLldPhases = [
  { id: 1, weeks: "WEEK 01–02", title: "Scope the problem", short: "Requirements", summary: "Turn an ambiguous prompt into a bounded design with explicit users, workflows, and constraints.", article: "Senior interviews rarely reward the fastest class diagram. They reward the engineer who first discovers what must be true for the product to work. Clarify actors, the main success path, expected traffic, latency needs, and failure behavior before choosing abstractions. Record assumptions so the interviewer can correct them early.", topics: ["Ask clarifying questions and quantify scale", "Separate functional and quality requirements", "Define APIs, events, and system boundaries"], deliverable: "A one-page problem brief with assumptions, core use cases, and API contracts.", case: "Design a parking garage", seniorSignal: "State which requirements change your design and which details you are intentionally deferring." },
  { id: 2, weeks: "WEEK 03–04", title: "Model the domain", short: "Object modeling", summary: "Build a coherent domain model before reaching for patterns. Make ownership and invariants visible.", article: "A useful object model mirrors the rules of the domain, not the tables in a database. Give each object a clear responsibility, keep related state behind the object that owns its invariant, and use interfaces where behavior truly varies. Prefer a small model that can explain the critical workflow over a large catalog of patterns.", topics: ["Identify entities, value objects, and aggregates", "Assign responsibilities with SOLID and composition", "Use patterns only when they clarify a real change point"], deliverable: "A class and sequence diagram that shows the primary flow and its invariants.", case: "Design an inventory service", seniorSignal: "Explain why each object owns its data and name the invariant that would be at risk if ownership moved." },
  { id: 3, weeks: "WEEK 05–06", title: "Make state safe", short: "Concurrency", summary: "Design for simultaneous requests, retries, and partial failure without corrupting business state.", article: "Concurrency becomes a product problem when two valid requests compete for the same state. Identify the write boundary, decide how conflicts are detected, and make retries safe. Choose the smallest mechanism that preserves the invariant: a database constraint, optimistic version, atomic update, or a lock with a clear scope and timeout.", topics: ["Choose locks, optimistic versions, or atomic operations", "Make writes idempotent and define conflict behavior", "Protect invariants across threads and transactions"], deliverable: "A concurrency plan with race conditions, consistency rules, and recovery paths.", case: "Design a ticket booking system", seniorSignal: "Walk through two requests arriving at the same instant and show exactly where one is rejected or retried." },
  { id: 4, weeks: "WEEK 07–08", title: "Persist and evolve", short: "Data & evolution", summary: "Choose storage around access patterns, then make migrations and interfaces safe to evolve.", article: "Storage choices should follow the reads, writes, and consistency guarantees the domain needs. Design the important queries first, then add indexes and retention rules. Senior engineers also plan for change: APIs need compatibility, schemas need safe migrations, and caches need a clear invalidation or freshness policy.", topics: ["Map aggregates to relational or document storage", "Add indexes, cache boundaries, and pagination", "Version APIs and plan backward-compatible migrations"], deliverable: "A data model with indexes, retention rules, and a safe migration sequence.", case: "Design a notification platform", seniorSignal: "Describe how the design changes as data volume grows without requiring a risky all-at-once rewrite." },
  { id: 5, weeks: "WEEK 09–10", title: "Design for failure", short: "Reliability", summary: "Move beyond the happy path: bound work, isolate failure, and make system behavior observable.", article: "Reliable systems make failure visible and limit how far it spreads. Bound every network call, retry only when the operation is safe, and use queues when asynchronous work improves isolation. Pair each mechanism with an operational signal so the team can tell whether the system is healthy and how users are affected.", topics: ["Use timeouts, retries with jitter, and circuit breakers", "Add queues and backpressure where they fit", "Define logs, metrics, traces, and operational alerts"], deliverable: "A failure-mode table with mitigations, SLOs, and operational signals.", case: "Design a rate limiter", seniorSignal: "For each failure mode, explain the user impact, containment boundary, and signal that would page the team." },
  { id: 6, weeks: "WEEK 11–12", title: "Lead the design", short: "Senior interview", summary: "Communicate the simplest design that meets the constraints, then explain how it grows and what you would change.", article: "At senior level, the interview is a collaboration exercise. Keep a visible structure, invite feedback, explain the cost of your choices, and adapt when constraints change. Separate the core domain design from infrastructure concerns, then show how the design can evolve without pretending every future requirement belongs in version one.", topics: ["Drive a 45-minute design conversation", "Compare trade-offs with cost and failure impact", "Separate the LLD core from infrastructure and HLD concerns"], deliverable: "A timed design walkthrough, reviewed for clarity, trade-offs, and extensibility.", case: "Design a ride dispatch service", seniorSignal: "Show judgment: make a defensible choice, name its downside, and say what evidence would make you revisit it." },
];
const lldProgressKey = "codexsheet-senior-lld-progress-v1";

function LldFlowDiagram() {
  return <div className="lld-flow-diagram" role="img" aria-label="Animated ticket booking flow: customer request enters Booking API, the API places a short seat hold, payment is processed by a provider, and a verified callback confirms the booking.">
    <div className="lld-flow-caption"><span><i/> LIVE REQUEST FLOW</span><span>SEAT HOLD · 90 SEC</span></div>
    <svg viewBox="0 0 300 205" aria-hidden="true"><defs><marker id="lld-flow-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#81a894"/></marker></defs>
      <path className="lld-flow-path" d="M150 42V82" markerEnd="url(#lld-flow-arrow)"/><path className="lld-flow-path" d="M130 116C110 133 77 136 62 155" markerEnd="url(#lld-flow-arrow)"/><path className="lld-flow-path" d="M170 116C190 133 223 136 238 155" markerEnd="url(#lld-flow-arrow)"/><path className="lld-flow-path callback" d="M228 154C212 126 190 122 173 113" markerEnd="url(#lld-flow-arrow)"/>
      <circle r="3.2" className="lld-flow-packet"><animateMotion dur="1.8s" repeatCount="indefinite" path="M150 42V82"/></circle><circle r="3.2" className="lld-flow-packet hold"><animateMotion dur="2.2s" repeatCount="indefinite" path="M130 116C110 133 77 136 62 155"/></circle><circle r="3.2" className="lld-flow-packet payment"><animateMotion dur="2.5s" repeatCount="indefinite" path="M170 116C190 133 223 136 238 155"/></circle><circle r="3.2" className="lld-flow-packet callback-packet"><animateMotion dur="2.8s" repeatCount="indefinite" path="M228 154C212 126 190 122 173 113"/></circle>
    </svg>
    <div className="lld-flow-node client"><span>01 · REQUEST</span><strong>Web / Mobile</strong></div><div className="lld-flow-node api"><span>02 · ORCHESTRATE</span><strong>Booking API</strong></div><div className="lld-flow-node inventory"><span>03 · ATOMIC CLAIM</span><strong>Seat Store</strong></div><div className="lld-flow-node payment"><span>04 · ASYNC</span><strong>Payment Provider</strong></div>
    <div className="lld-flow-foot"><span><i/> Hold created</span><span>Callback confirms · expiry releases</span></div>
  </div>;
}

function LldChangeDrill() {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null]);
  const rounds = [
    {
      label: "PAYMENT IS ASYNC",
      prompt: "“Payment now redirects to a third-party provider and can take up to four minutes. Users may close the browser, and callbacks can arrive late or more than once.”",
      question: "Change request 1 · What changes in your state machine and consistency boundary?",
      options: [
        { title: "Keep the seat lock until payment finishes", detail: "Few moving parts; preserve the current synchronous checkout flow.", verdict: "This preserves a simple invariant, but couples scarce inventory to an unbounded external dependency. A four-minute provider delay can strand seats and amplify checkout retries. If you choose this temporarily, cap the hold, make the timeout explicit, and explain the conversion impact." },
        { title: "Use a short inventory hold; confirm from an idempotent payment result", detail: "Separate inventory ownership from payment progress. Expiry releases seats; a callback can be retried safely.", verdict: "A strong baseline. Create a hold with an absolute expiresAt, then start payment against a stable booking/payment id. On verified success, atomically transition Held → Confirmed only if the hold is still valid and owned by that booking. On expiry, transition Held → Expired and release seats. A late success must not silently steal released seats: move payment to RefundPending / Refunded, or enter a clearly named manual re-accommodation flow. Deduplicate provider events by providerEventId and make every transition conditional so duplicate or out-of-order callbacks are harmless." },
        { title: "Release seats as soon as the redirect starts", detail: "Avoid inventory being held while the customer is away from the app.", verdict: "This avoids long holds but breaks the user expectation that checkout reserves the selected seats. A payment can succeed after another booking has taken them. You would need an explicit authorization-before-capture flow, or a compensation policy for paid-but-unassigned orders; otherwise the model has no safe way to fulfill success." },
      ],
      artifacts: ["Booking: PendingPayment → Confirmed | Expired | PaymentFailed", "SeatHold: Held → Consumed | Released (with expiresAt)", "PaymentAttempt: Created → Pending → Succeeded | Failed | RefundPending", "Invariant: each seat has at most one active hold or confirmed booking"],
      interviewer: "Name the owner of the seat invariant. Walk through expiry racing with payment success. Which write wins, and what does the losing path do?",
    },
    {
      label: "GROUP BOOKING ARRIVES",
      prompt: "“Product now supports up to six adjacent seats in one booking. The request must succeed for all selected seats or none. A popular event can receive thousands of checkout attempts per second.”",
      question: "Change request 2 · How do you preserve all-or-nothing holds under contention?",
      options: [
        { title: "Acquire each seat independently and compensate on failure", detail: "Lock seats one at a time; release earlier locks if a later seat is unavailable.", verdict: "This can work, but creates partial-hold states, longer lock duration, and deadlock risk when requests acquire the same seats in different orders. If you use it, sort seat ids before acquisition, keep the transaction short, rollback all seats on any miss, and set a strict lock timeout. Explain how abandoned transactions and retries are cleaned up." },
        { title: "Atomically claim the requested seat set in one short transaction", detail: "Validate the complete set, claim all seats together, or commit nothing. Keep payment outside the transaction.", verdict: "A defensible design. In one transaction, verify event/section and adjacency rules, claim all requested seats with a unique active-claim constraint or conditional updates, and write one hold record. If any seat loses the race, rollback the whole transaction and return a conflict with alternatives. Commit quickly, then call the payment provider outside the database transaction. At high contention, partition inventory by event/section and use optimistic retries with jitter; load-test the hot partition and be ready to queue or rate-limit one event without weakening the invariant." },
        { title: "Put a distributed lock around the entire event", detail: "Serialize every booking request for an event to simplify correctness.", verdict: "Correctness is easy to state, throughput is not. A single hot event becomes a single-writer bottleneck; lock lease expiry, fencing, and failover now sit on the correctness path. Only defend this if event-level serialization meets measured traffic and you specify fencing tokens plus recovery. Otherwise narrow coordination to the requested seats or inventory partition." },
      ],
      artifacts: ["BookingRequest: idempotencyKey + ordered seatIds + customerId", "Hold: one bookingId owns the complete seat set or none", "DB boundary: conditional claim + unique active seat claim", "API: 409 SeatsUnavailable with fresh alternatives; retry uses same idempotency key"],
      interviewer: "Show the competing transaction. What stops two workers from both reading Available and then both claiming the same seat? Which constraint is the final guardrail?",
    },
  ];
  const selectedAnswer = answers[round];
  const choices = rounds[round].options;
  const reset = () => { setStarted(false); setRound(0); setAnswers([null, null]); };
  return <section className="lld-change-drill">
    <div className="lld-change-drill-head"><span><AudioLines size={14}/> LIVE INTERVIEW SIMULATION · 12–15 MIN</span><span>2 REQUIREMENT CHANGES</span></div>
    <h3>Ticket booking: reserve seats without overselling</h3>
    <p className="lld-drill-prompt">You have 45 minutes with the interviewer. A customer selects seats for an event and checks out. Prevent double booking, explain the core objects, and sketch the reservation flow. Start by stating assumptions: one event, assigned seating, signed-in customer, payment required.</p>
    <div className="lld-drill-baseline"><strong>Put these on your first-pass board</strong><div><span>Entities</span> Event · Seat · Booking · Payment</div><div><span>Core invariant</span> A seat belongs to at most one confirmed booking</div><div><span>Happy path</span> Select → Hold → Pay → Confirm → Ticket</div></div>
    <div className="lld-drill-timeline"><div className="lld-drill-step active"><b>01</b><span>Frame the brief</span></div><i/><div className={`lld-drill-step${started?" active":""}`}><b>02</b><span>Payment changes</span></div><i/><div className={`lld-drill-step${round===1&&started?" active":""}`}><b>03</b><span>Contention changes</span></div><i/><div className={`lld-drill-step${round===2?" active":""}`}><b>04</b><span>Debrief</span></div></div>
    {!started ? <button type="button" className="lld-drill-reveal" onClick={()=>setStarted(true)}>I’ve sketched my first-pass design <ArrowRight size={14}/><small>Start the interview. A new requirement will arrive after your baseline.</small></button> : round < rounds.length ? <>
      <div className="lld-drill-round-label">FOLLOW-UP {round+1} OF {rounds.length} · {rounds[round].label}</div>
      <div className="lld-drill-twist"><span><Zap size={14}/> THE INTERVIEWER ADDS A REQUIREMENT</span><p>{rounds[round].prompt}</p></div>
      <div className="lld-drill-whiteboard-prompt"><strong>{rounds[round].question}</strong><span>Take a moment before choosing. In a live round, narrate what changes and what stays invariant.</span></div>
      <div className="lld-drill-choices">{choices.map((choice,index)=><button type="button" key={choice.title} className={selectedAnswer===index?"selected":""} onClick={()=>setAnswers((current)=>current.map((value,i)=>i===round?index:value))}><span className="lld-drill-radio">{selectedAnswer===index?<Check size={12}/>:String.fromCharCode(65+index)}</span><span><strong>{choice.title}</strong><small>{choice.detail}</small></span></button>)}</div>
      {selectedAnswer!==null&&<><div className={`lld-drill-feedback${selectedAnswer===1?" recommended":""}`}><strong>{selectedAnswer===1?"A defensible senior-level direction":"Trade-off analysis"}</strong><p>{choices[selectedAnswer].verdict}</p><span>Don’t jump straight to a new component: state the invariant, identify its owner, then show the changed transition.</span></div><div className="lld-drill-artifacts"><strong>What a strong whiteboard answer makes explicit</strong>{rounds[round].artifacts.map((item,index)=><div key={item}><span>{String(index+1).padStart(2,"0")}</span>{item}</div>)}</div><div className="lld-drill-interviewer"><strong>Interviewer probe</strong><p>{rounds[round].interviewer}</p></div><button type="button" className="lld-drill-reveal lld-drill-continue" onClick={()=>setRound((value)=>value+1)}>Continue to the next requirement <ArrowRight size={14}/></button></>}
    </> : <div className="lld-drill-debrief"><span><Check size={14}/> DRILL COMPLETE</span><h4>Close with the decisions, not just the diagram.</h4><p>A senior answer ties the changed requirements back to a small set of invariants, names the transaction boundary, and describes the losing race and recovery path.</p><div><strong>Interview close-out checklist</strong><ul><li>Walk through two simultaneous requests for the same seat.</li><li>Explain hold expiry racing payment success.</li><li>State how idempotency works for client retries and provider callbacks.</li><li>Show which constraints live in the database as the final guardrail.</li><li>Name one operational signal: hold expiry rate, payment-to-confirmation lag, or seat-claim conflicts.</li></ul></div><button type="button" className="lld-drill-reset" onClick={reset}>Run the drill again</button></div>}
  </section>;
}

function LldRoadmapPage({ onOpenWhiteboard }: { onOpenWhiteboard: () => void }) {
  const [activePhase, setActivePhase] = useState(1);
  const [completedPhases, setCompletedPhases] = useState<number[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(lldProgressKey) ?? "[]");
      return Array.isArray(saved) ? saved.filter((id): id is number => Number.isInteger(id) && id >= 1 && id <= seniorLldPhases.length) : [];
    } catch { return []; }
  });
  const phase = seniorLldPhases.find((item) => item.id === activePhase) ?? seniorLldPhases[0];
  useEffect(() => {
    try { localStorage.setItem(lldProgressKey, JSON.stringify(completedPhases)); } catch { /* storage may be unavailable */ }
  }, [completedPhases]);
  const markComplete = () => {
    const isDone = completedPhases.includes(phase.id);
    setCompletedPhases((current) => isDone ? current.filter((id) => id !== phase.id) : [...current, phase.id].sort((a, b) => a - b));
    if (!isDone && phase.id < seniorLldPhases.length) setActivePhase(phase.id + 1);
  };
  return <main className="lld-page">
    <section className="lld-hero"><div className="lld-hero-copy"><span className="lld-eyebrow"><span/> STAFF-LEVEL DESIGN PRACTICE</span><h2>Think in systems.<br/><em>Design with intent.</em></h2><p>A practical 12-week Low-Level Design roadmap for Senior SDE interviews: from requirements and domain models to concurrency, reliability, and technical leadership.</p><div className="lld-hero-tags"><span><Check size={13}/> 6 progressive phases</span><span><Check size={13}/> 12 real design drills</span><span><Check size={13}/> Saved on this device</span><button type="button" onClick={onOpenWhiteboard}><Layers3 size={14}/> Open LLD whiteboard <ArrowRight size={13}/></button></div></div><div className="lld-hero-visual"><LldFlowDiagram/></div></section>
    <section className="lld-roadmap-section"><header className="lld-section-head"><div><span className="lld-section-kicker">YOUR 12-WEEK PATH</span><h3>From fundamentals to <em>staff-level trade-offs.</em></h3><p>Choose a phase to see the concepts, practice, and outcome to focus on.</p></div><div className="lld-completion"><strong>{completedPhases.length}<small> / {seniorLldPhases.length}</small></strong><span>PHASES COMPLETE</span><i><b style={{width:`${Math.round(completedPhases.length/seniorLldPhases.length*100)}%`}}/></i></div></header>
      <div className="lld-blog-layout">
        <aside className="lld-chapter-index"><span className="lld-index-kicker">THE LEARNING PATH</span><strong>Senior SDE · LLD</strong><div>{seniorLldPhases.map((item)=><button type="button" key={item.id} className={activePhase===item.id?"active":""} aria-current={activePhase===item.id?"step":undefined} onClick={()=>setActivePhase(item.id)}><span className="lld-index-number">{completedPhases.includes(item.id)?<Check size={12}/>:String(item.id).padStart(2,"0")}</span><span><b>{item.title}</b><small>{item.weeks}</small></span><ChevronRight size={13}/></button>)}</div><section><span>YOUR PROGRESS</span><strong>{completedPhases.length} of {seniorLldPhases.length} chapters</strong><i><b style={{width:`${Math.round(completedPhases.length/seniorLldPhases.length*100)}%`}}/></i></section></aside>
        <article className="lld-blog-article"><div className="lld-article-breadcrumb"><span>System design</span><ChevronRight size={12}/><span>Low-Level Design</span><ChevronRight size={12}/><strong>Chapter {String(phase.id).padStart(2,"0")}</strong></div><div className="lld-article-meta"><span>{phase.weeks}</span><span>·</span><span>{phase.short}</span><span className={completedPhases.includes(phase.id)?"complete":""}>{completedPhases.includes(phase.id)?<><Check size={12}/> COMPLETED</>:"IN PROGRESS"}</span></div><h2>{phase.title}</h2><p className="lld-article-lead">{phase.summary}</p><div className="lld-article-copy"><p>{phase.article}</p><div className="lld-reading-tip"><BookOpen size={16}/><p><strong>Keep this in mind:</strong> a good design starts with the problem’s constraints and keeps each important decision easy to explain.</p></div><h3 id="lld-concepts">What you’ll learn</h3><p>Work through these ideas in order. Capture the decisions and open questions as you sketch the design.</p><ol className="lld-topic-list">{phase.topics.map((topic,index)=><li id={`lld-topic-${index+1}`} key={topic}><span>{String(index+1).padStart(2,"0")}</span><div><h4>{topic}</h4><p>{index===0?"Start with the domain signal and make the constraints explicit before choosing a solution.":index===1?"Compare the options against the requirements, failure cases, and expected changes.":"Write down the boundary and the trade-off so another engineer can review the decision."}</p></div></li>)}</ol>{phase.id===6&&<LldChangeDrill/>}<section className="lld-exercise-card"><span className="lld-exercise-kicker"><Layers3 size={14}/> PUT IT INTO PRACTICE</span><h3>{phase.case}</h3><p>Sketch the primary workflow, show which component owns each state change, and call out one failure path before adding more detail.</p><div><span>YOUR DELIVERABLE</span><strong>{phase.deliverable}</strong></div><button type="button" onClick={onOpenWhiteboard}>Open the design whiteboard <ArrowRight size={14}/></button></section><section className="lld-senior-callout"><ShieldCheck size={17}/><p><span>SENIOR SDE CHECKPOINT</span><strong>{phase.seniorSignal}</strong></p></section></div><footer className="lld-article-footer"><button type="button" disabled={phase.id===1} onClick={()=>setActivePhase(phase.id-1)}><ChevronLeft size={14}/> Previous chapter</button><button className="lld-article-complete" type="button" onClick={markComplete}>{completedPhases.includes(phase.id)?"Reopen chapter":"Mark chapter complete"}<Check size={14}/></button><button type="button" disabled={phase.id===seniorLldPhases.length} onClick={()=>setActivePhase(phase.id+1)}>Next chapter <ArrowRight size={14}/></button></footer></article>
        <aside className="lld-article-rail"><section><span className="lld-rail-kicker">IN THIS CHAPTER</span><a href="#lld-concepts">What you’ll learn</a>{phase.topics.map((topic,index)=><a key={topic} href={`#lld-topic-${index+1}`}>{String(index+1).padStart(2,"0")} · {topic}</a>)}</section><section className="lld-rail-outcome"><span className="lld-rail-kicker">CHAPTER OUTCOME</span><p>{phase.deliverable}</p></section><button type="button" onClick={onOpenWhiteboard}><Layers3 size={14}/> Open whiteboard</button></aside>
      </div>
      <div className="lld-bottom-note"><span><ShieldCheck size={17}/></span><p><strong>Senior-level signal:</strong> explain what you deliberately left out, what would break first, and how you would change the design as constraints shift.</p></div>
    </section>
  </main>;
}

type LldBoardNode = { id: string; kind: string; title: string; note: string; x: number; y: number };
type LldBoardEdge = { id: string; from: string; to: string };
type LldBoardState = { title: string; nodes: LldBoardNode[]; edges: LldBoardEdge[] };
const lldBoardKey = "codexsheet-lld-whiteboard-v1";
const lldBoardKinds = ["Client", "API Gateway", "Service", "Database", "Cache", "Queue", "External API"];
const starterLldBoard: LldBoardState = {
  title: "Ticket booking · Core design",
  nodes: [
    { id: "client", kind: "Client", title: "Web / Mobile Client", note: "Browse events, reserve seats, and view booking status.", x: 48, y: 245 },
    { id: "gateway", kind: "API Gateway", title: "Booking API", note: "Authenticate requests, validate payloads, and apply rate limits.", x: 270, y: 245 },
    { id: "booking", kind: "Service", title: "Booking Service", note: "Owns reservation state, idempotency, and booking workflow.", x: 515, y: 145 },
    { id: "inventory", kind: "Service", title: "Inventory Service", note: "Owns seat availability and atomic seat holds.", x: 515, y: 360 },
    { id: "booking-db", kind: "Database", title: "Bookings DB", note: "Transactional writes with a unique idempotency key.", x: 795, y: 145 },
    { id: "seat-db", kind: "Database", title: "Seat Inventory DB", note: "Unique seat constraints prevent double booking.", x: 795, y: 360 },
    { id: "events", kind: "Queue", title: "Booking Events", note: "Publish confirmed bookings through an outbox pattern.", x: 795, y: 500 },
  ],
  edges: [
    { id: "e1", from: "client", to: "gateway" }, { id: "e2", from: "gateway", to: "booking" },
    { id: "e3", from: "gateway", to: "inventory" }, { id: "e4", from: "booking", to: "booking-db" },
    { id: "e5", from: "inventory", to: "seat-db" }, { id: "e6", from: "booking", to: "events" },
  ],
};

function readLldBoard(): LldBoardState {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(lldBoardKey) ?? "null");
    if (value && typeof value === "object" && "title" in value && "nodes" in value && "edges" in value && typeof value.title === "string" && Array.isArray(value.nodes) && Array.isArray(value.edges)) return value as LldBoardState;
  } catch { /* use the starter design when storage is unavailable */ }
  return starterLldBoard;
}

function LldWhiteboardPage() {
  const [board, setBoard] = useState<LldBoardState>(readLldBoard);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const selectedNode = board.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = board.edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  useEffect(() => { try { localStorage.setItem(lldBoardKey, JSON.stringify(board)); } catch { /* storage may be unavailable */ } }, [board]);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      setBoard((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === drag.id ? { ...node, x: Math.max(8, Math.min(820, drag.x + event.clientX - drag.pointerX)), y: Math.max(8, Math.min(510, drag.y + event.clientY - drag.pointerY)) } : node) }));
    };
    const stop = () => { dragRef.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); window.removeEventListener("pointercancel", stop); };
  }, []);
  const addNode = (kind: string) => {
    const index = board.nodes.length;
    const id = `node-${Date.now()}-${index}`;
    const titles: Record<string, string> = { Client: "New client", "API Gateway": "New API gateway", Service: "New service", Database: "New database", Cache: "New cache", Queue: "New queue", "External API": "External integration" };
    const positions = [{ x: 55, y: 40 }, { x: 300, y: 40 }, { x: 550, y: 40 }, { x: 55, y: 165 }, { x: 300, y: 165 }, { x: 550, y: 165 }, { x: 55, y: 390 }, { x: 300, y: 390 }, { x: 550, y: 390 }];
    const position = positions[index % positions.length];
    setBoard((current) => ({ ...current, nodes: [...current.nodes, { id, kind, title: titles[kind] ?? `New ${kind}`, note: "Describe responsibility, state ownership, or a key design decision.", ...position }] }));
    setSelectedNodeId(id); setSelectedEdgeId(null); setConnectMode(false); setConnectSource(null);
  };
  const chooseNode = (id: string) => {
    if (!connectMode) { setSelectedNodeId(id); setSelectedEdgeId(null); return; }
    if (!connectSource) { setConnectSource(id); setSelectedNodeId(id); setSelectedEdgeId(null); return; }
    if (connectSource !== id && !board.edges.some((edge) => edge.from === connectSource && edge.to === id)) {
      setBoard((current) => ({ ...current, edges: [...current.edges, { id: `edge-${Date.now()}`, from: connectSource, to: id }] }));
    }
    setConnectSource(null);
  };
  const deleteNode = (id: string) => { setBoard((current) => ({ ...current, nodes: current.nodes.filter((node) => node.id !== id), edges: current.edges.filter((edge) => edge.from !== id && edge.to !== id) })); setSelectedNodeId(null); };
  const startDrag = (event: { preventDefault: () => void; stopPropagation: () => void; clientX: number; clientY: number }, node: LldBoardNode) => { if (connectMode) return; event.preventDefault(); event.stopPropagation(); dragRef.current = { id: node.id, pointerX: event.clientX, pointerY: event.clientY, x: node.x, y: node.y }; };
  return <main className="lld-whiteboard-page">
    <header className="lld-board-header"><div><span className="lld-eyebrow"><span/> SENIOR SDE · DESIGN WORKSPACE</span><h2>LLD <em>whiteboard.</em></h2><p>Shape the system, make ownership clear, and pressure-test the design.</p></div><label className="lld-board-title"><span>BOARD NAME</span><input value={board.title} onChange={(event) => setBoard((current) => ({ ...current, title: event.target.value }))} aria-label="Whiteboard name"/><span><Check size={12}/> Saved locally</span></label></header>
    <div className="lld-board-toolbar"><div className="lld-board-palette"><span>ADD TO BOARD</span>{lldBoardKinds.map((kind) => <button type="button" key={kind} onClick={() => addNode(kind)}><Plus size={12}/>{kind}</button>)}</div><div className="lld-board-tools"><button type="button" className={connectMode?"active":""} onClick={() => { setConnectMode((value) => !value); setConnectSource(null); setSelectedEdgeId(null); }}><GitBranch size={14}/>{connectMode?"Connecting…":"Connect"}</button><button type="button" onClick={() => { setBoard(starterLldBoard); setSelectedNodeId(null); setSelectedEdgeId(null); setConnectMode(false); setConnectSource(null); }}><RotateCcw size={14}/>Reset example</button></div></div>
    {connectMode&&<div className="lld-connect-hint"><GitBranch size={14}/>{connectSource?"Choose the destination component to create a connection.":"Choose a source component, then choose a destination."}<button type="button" onClick={()=>{setConnectMode(false);setConnectSource(null);}}>Cancel</button></div>}
    <section className="lld-whiteboard-layout"><div className="lld-canvas-scroll"><div className={`lld-canvas${connectMode?" connect-mode":""}`} onClick={(event: { target: EventTarget; currentTarget: EventTarget })=>{if(event.target===event.currentTarget){setSelectedNodeId(null);setSelectedEdgeId(null);}}} aria-label="LLD architecture whiteboard">
      <svg className="lld-edges" viewBox="0 0 1000 610" role="img" aria-label="Connections between architecture components"><defs><marker id="lld-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"/></marker></defs>{board.edges.map((edge)=>{const from=board.nodes.find((node)=>node.id===edge.from);const to=board.nodes.find((node)=>node.id===edge.to);if(!from||!to)return null;const x1=from.x+83,y1=from.y+41,x2=to.x+83,y2=to.y+41,curve=Math.max(35,Math.abs(x2-x1)*.42);return <path key={edge.id} d={`M ${x1} ${y1} C ${x1+curve} ${y1}, ${x2-curve} ${y2}, ${x2} ${y2}`} className={selectedEdgeId===edge.id?"selected":""} markerEnd="url(#lld-arrow)" onClick={(event: { stopPropagation: () => void })=>{event.stopPropagation();setSelectedEdgeId(edge.id);setSelectedNodeId(null);}}/>;})}</svg>
      {board.nodes.map((node)=><article key={node.id} className={`lld-board-node kind-${node.kind.toLowerCase().replace(/[^a-z]+/g,"-")}${selectedNodeId===node.id?" selected":""}${connectSource===node.id?" connect-source":""}`} style={{left:node.x,top:node.y}} onClick={(event: { stopPropagation: () => void })=>{event.stopPropagation();chooseNode(node.id);}}><header><span onPointerDown={(event: { preventDefault: () => void; stopPropagation: () => void; clientX: number; clientY: number })=>startDrag(event,node)}><i/><i/><i/></span><small>{node.kind}</small><button type="button" aria-label={`Remove ${node.title}`} onClick={(event: { stopPropagation: () => void })=>{event.stopPropagation();deleteNode(node.id);}}>×</button></header><strong>{node.title}</strong><p>{node.note || "Add a short note about this component."}</p></article>)}
      {board.nodes.length===0&&<div className="lld-canvas-empty"><Layers3 size={26}/><strong>Your board is ready</strong><span>Add a component from the toolbar to start designing.</span></div>}
      <span className="lld-canvas-caption">DRAG COMPONENTS · {connectMode?"CLICK TWO COMPONENTS TO CONNECT":"SELECT A COMPONENT TO EDIT"}</span>
    </div></div>
    <aside className="lld-board-inspector"><span className="lld-detail-label">DESIGN INSPECTOR</span>{selectedNode?<><div className="lld-inspector-type">{selectedNode.kind}</div><label>Component name<input value={selectedNode.title} onChange={(event)=>setBoard((current)=>({...current,nodes:current.nodes.map((node)=>node.id===selectedNode.id?{...node,title:event.target.value}:node)}))}/></label><label>Responsibility / decisions<textarea rows={6} value={selectedNode.note} onChange={(event)=>setBoard((current)=>({...current,nodes:current.nodes.map((node)=>node.id===selectedNode.id?{...node,note:event.target.value}:node)}))} placeholder="What does it own? What can fail?"/></label><div className="lld-inspector-tip"><ShieldCheck size={15}/><span>Senior lens: name the invariant this component protects.</span></div><button className="lld-inspector-delete" type="button" onClick={()=>deleteNode(selectedNode.id)}><Trash2 size={14}/>Remove component</button></>:selectedEdge?<><strong className="lld-inspector-heading">Component connection</strong><p className="lld-inspector-description">{board.nodes.find((node)=>node.id===selectedEdge.from)?.title} sends work to {board.nodes.find((node)=>node.id===selectedEdge.to)?.title}.</p><div className="lld-inspector-tip"><GitBranch size={15}/><span>Make the contract explicit: sync call, event, or shared data?</span></div><button className="lld-inspector-delete" type="button" onClick={()=>{setBoard((current)=>({...current,edges:current.edges.filter((edge)=>edge.id!==selectedEdge.id)}));setSelectedEdgeId(null);}}><Trash2 size={14}/>Remove connection</button></>:<div className="lld-inspector-empty"><MousePointer2 size={19}/><strong>Select a component</strong><span>Edit its responsibility, or use Connect to draw a relationship.</span></div>}</aside></section>
    <footer className="lld-whiteboard-foot"><span><ShieldCheck size={15}/> Private to this browser · autosaves as you work</span><span>{board.nodes.length} components <i/> {board.edges.length} connections</span></footer>
  </main>;
}

const articleToc = [
  { id: "art-intro", label: "Introduction" },
  { id: "art-approach", label: "The approach" },
  { id: "art-steps", label: "How it works, step by step" },
  { id: "art-visual", label: "Watch the structure move" },
  { id: "art-table", label: "Reference table" },
  { id: "art-code", label: "Code example" },
  { id: "art-complexity", label: "Complexity analysis" },
  { id: "art-applications", label: "Applications" },
  { id: "art-tradeoffs", label: "Advantages & limitations" },
  { id: "art-faq", label: "Frequently asked questions" },
];

function ArticleReader({ article, detail, lesson, onClose, onOpenRelated, onOpenIde }: {
  article: (typeof dsaArticles)[number];
  detail: ArticleDetail;
  lesson: (typeof articleLessons)[string];
  onClose: () => void;
  onOpenRelated: (concept: string) => void;
  onOpenIde: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("art-intro");
  const bodyRef = useRef<HTMLDivElement>(null);
  const previous = dsaArticles[Math.max(0, dsaArticles.indexOf(article) - 1)];
  const next = dsaArticles[Math.min(dsaArticles.length - 1, dsaArticles.indexOf(article) + 1)];

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    setActiveSection("art-intro");
  }, [article.title]);

  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const watcher = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { root, rootMargin: "-10% 0px -70% 0px" });
    for (const section of articleToc) {
      const node = root.querySelector(`#${section.id}`);
      if (node) watcher.observe(node);
    }
    return () => watcher.disconnect();
  }, [article.title]);

  const copyCode = () => {
    void navigator.clipboard?.writeText(article.code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }).catch(() => setCopied(false));
  };

  const jumpTo = (id: string) => {
    const node = bodyRef.current?.querySelector(`#${id}`);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  return <div className="article-reader-backdrop" onMouseDown={onClose}>
    <article className="article-reader gfg-reader" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="article-reader-title">
      <header className="gfg-head">
        <div className="gfg-crumb"><span>DSA</span><ChevronRight size={12}/><span>{article.category}</span><ChevronRight size={12}/><strong>{article.title}</strong></div>
        <button type="button" onClick={onClose} aria-label="Close article">×</button>
      </header>
      <div className="gfg-title">
        <h2 id="article-reader-title">{article.title}</h2>
        <div className="gfg-meta">
          <span>{detail.updated}</span><i/><span>{article.read}</span><i/><span className={`gfg-level gfg-level-${detail.difficulty.toLowerCase()}`}>{detail.difficulty}</span>
          <span className="gfg-tags">{detail.tags.map((tag) => <em key={tag}>{tag}</em>)}</span>
        </div>
      </div>
      <div className="gfg-layout">
        <div className="gfg-body" ref={bodyRef}>
          <section id="art-intro">
            <h3>Introduction</h3>
            <p>{article.body}</p>
            <p className="gfg-summary">{article.summary}</p>
          </section>
          <section id="art-approach">
            <h3>The approach</h3>
            <p>{detail.approach}</p>
            <div className="gfg-callout"><Lightbulb size={16}/><p><strong>Core idea: </strong>{article.concept} — {article.takeaway}</p></div>
          </section>
          <section id="art-steps">
            <h3>How it works, step by step</h3>
            <ol className="gfg-steps">{detail.algorithm.map((line, index) => <li key={line}><span>{String(index + 1).padStart(2, "0")}</span><p>{line}</p></li>)}</ol>
          </section>
          <section id="art-visual">
            <h3>Watch the structure move</h3>
            <p className="gfg-lead">{lesson.usefulWhen}</p>
            <ConceptDiagram key={article.title} article={article} lesson={lesson}/>
          </section>
          <section id="art-table">
            <h3>{detail.table.head.join(" vs ")}</h3>
            <div className="gfg-table-wrap">
              <table className="gfg-table">
                <caption>{detail.table.caption}</caption>
                <thead><tr>{detail.table.head.map((cell) => <th key={cell}>{cell}</th>)}</tr></thead>
                <tbody>{detail.table.rows.map((row) => <tr key={row.join("|")}>{row.map((cell, cellIndex) => <td key={cell} className={cellIndex === 0 ? "gfg-key" : ""}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <p className="gfg-note">Read the row you would defend in an interview, then say out loud why it moves the way it does.</p>
          </section>
          <section id="art-code">
            <h3>Code example</h3>
            <div className="gfg-code">
              <div className="gfg-code-bar"><span>JAVASCRIPT</span><div><button type="button" onClick={copyCode}>{copied ? <Check size={13}/> : <Copy size={13}/>} {copied ? "Copied" : "Copy"}</button><button type="button" className="gfg-try" onClick={onOpenIde}><Code2 size={13}/> Try it in Deva</button></div></div>
              <pre><code>{article.code}</code></pre>
            </div>
          </section>
          <section id="art-complexity">
            <h3>Complexity analysis</h3>
            <ul className="gfg-cx">
              <li><strong>Time</strong><span>{detail.complexity.time}</span></li>
              <li><strong>Auxiliary space</strong><span>{detail.complexity.space}</span></li>
              <li><strong>Lesson note</strong><span>{lesson.complexity}</span></li>
            </ul>
          </section>
          <section id="art-applications">
            <h3>Applications</h3>
            <ul className="gfg-list">{detail.applications.map((line) => <li key={line}><ArrowRight size={13}/>{line}</li>)}</ul>
          </section>
          <section id="art-tradeoffs" className="gfg-cols">
            <div>
              <h3>Advantages</h3>
              <ul className="gfg-list gfg-good">{detail.advantages.map((line) => <li key={line}><Check size={13}/>{line}</li>)}</ul>
            </div>
            <div>
              <h3>Limitations</h3>
              <ul className="gfg-list gfg-bad">{detail.limitations.map((line) => <li key={line}><X size={13}/>{line}</li>)}</ul>
            </div>
          </section>
          <section id="art-faq">
            <h3>Frequently asked questions</h3>
            {detail.faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
          </section>
          <nav className="gfg-pager">
            <button type="button" disabled={previous === article} onClick={() => onOpenRelated(previous.concept)}><ChevronLeft size={14}/>{previous.title}</button>
            <button type="button" className="gfg-next" disabled={next === article} onClick={() => onOpenRelated(next.concept)}>{next.title}<ArrowRight size={14}/></button>
          </nav>
        </div>
        <aside className="gfg-rail">
          <section>
            <span className="gfg-rail-kicker">TABLE OF CONTENTS</span>
            <ol>{articleToc.map((section) => <li key={section.id}><button type="button" className={activeSection === section.id ? "active" : ""} onClick={() => jumpTo(section.id)}>{section.label}</button></li>)}</ol>
          </section>
          <section>
            <span className="gfg-rail-kicker">PREREQUISITES</span>
            <ul className="gfg-chips">{detail.prerequisites.map((line) => <li key={line}>{line}</li>)}</ul>
          </section>
          <section>
            <span className="gfg-rail-kicker">RELATED CONCEPTS</span>
            <ul className="gfg-related">{detail.related.map((concept) => {
              const target = dsaArticles.find((item) => item.concept === concept);
              return <li key={concept}><button type="button" onClick={() => onOpenRelated(concept)}><BookOpen size={13}/>{target?.title ?? concept}<ArrowRight size={13}/></button></li>;
            })}</ul>
          </section>
          <section className="gfg-practice">
            <span className="gfg-rail-kicker">PRACTICE IT</span>
            <p>Reading it once is not enough. Write it, break it, then fix it in the editor.</p>
            <button type="button" onClick={onOpenIde}>Open Deva <ArrowRight size={14}/></button>
          </section>
        </aside>
      </div>
    </article>
  </div>;
}

function ArticlesPage({ onOpenIde }: { onOpenIde: () => void }) {
  const [selected, setSelected] = useState("All concepts");
  const [searchTerm, setSearchTerm] = useState("");
  const [openArticle, setOpenArticle] = useState<(typeof dsaArticles)[number] | null>(null);
  const pageRef = useRef<HTMLElement>(null);
  const categories = ["All concepts", ...new Set(dsaArticles.map((article) => article.category))];
  const visible = dsaArticles.filter((article) =>
    (selected === "All concepts" || article.category === selected) &&
    `${article.title} ${article.category} ${article.summary} ${article.concept}`.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  );
  const featuredArticle = visible[0];
  const otherArticles = visible.slice(1);
  const activeLesson = openArticle ? articleLessons[openArticle.concept] : null;
  useEffect(() => {
    if (!openArticle) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenArticle(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [openArticle]);
  useEffect(() => {
    let cancelled = false;
    let revert: (() => void) | undefined;
    void import("gsap").then(({ gsap }) => {
      if (cancelled || !pageRef.current) return;
      const context = gsap.context(() => {
        gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
          gsap.from(".articles-hero-copy > *", { y: 20, opacity: 0, duration: .65, stagger: .1, ease: "power3.out" });
          gsap.from(".article-row, .featured-article", { y: 16, opacity: 0, duration: .5, stagger: .06, ease: "power2.out", delay: .15 });
        });
      }, pageRef);
      revert = () => context.revert();
    });
    return () => { cancelled = true; revert?.(); };
  }, [selected]);
  return <main className="articles-page" ref={pageRef}>
    <section className="articles-hero editorial-hero"><div className="articles-hero-copy"><span className="articles-kicker"><BookOpen size={14}/> THE CODEXSHEET JOURNAL</span><h2>Learn the patterns<br/><em>behind the problems.</em></h2><p>Every note is written the long way on purpose: approach, worked steps, a reference table, runnable code, complexity, applications, trade-offs and an FAQ.</p><div className="editorial-hero-meta"><span>DSA FIELD NOTES</span><i/><span>{String(dsaArticles.length).padStart(2,"0")} DEEP-DIVE NOTES</span><i/><span>10 SECTIONS EACH</span></div></div><div className="editorial-hero-index"><span>COLLECTION</span><strong>01<span> / </span>{String(dsaArticles.length).padStart(2,"0")}</strong><p>Foundations<br/>to problem solving</p><div className="editorial-index-line"/></div><DsaOverviewLoop /></section>
    <section className="articles-library"><div className="editorial-library-head"><div><span className="articles-kicker">THE LIBRARY</span><h3>Read. Understand. <em>Apply.</em></h3></div><label className="article-search"><Search size={15}/><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Find a concept" aria-label="Search DSA articles"/>{searchTerm && <button type="button" onClick={() => setSearchTerm("")} aria-label="Clear search">×</button>}</label></div><div className="article-filters" aria-label="Filter articles by topic">{categories.map((category) => <button key={category} type="button" className={selected === category ? "active" : ""} onClick={() => setSelected(category)}>{category}</button>)}</div>{featuredArticle ? <div className="editorial-reading-layout"><div className="editorial-main-column"><button className="featured-article" type="button" onClick={() => setOpenArticle(featuredArticle)}><span className="featured-label">{selected === "All concepts" ? "EDITOR’S PICK" : "FROM THIS TOPIC"}<ArrowRight size={14}/></span><span className="featured-category">{featuredArticle.category} <i/> {featuredArticle.read.toUpperCase()}</span><strong>{featuredArticle.title}</strong><p>{featuredArticle.summary}</p><span className="featured-link">Read the article <ArrowRight size={15}/></span><span className="featured-mark">{String(dsaArticles.indexOf(featuredArticle) + 1).padStart(2,"0")}</span></button><div className="article-list-heading"><span>MORE TO EXPLORE</span><span>{String(otherArticles.length).padStart(2,"0")} ARTICLES</span></div><div className="editorial-article-list">{otherArticles.map((article) => <button className="article-row" type="button" key={article.title} onClick={() => setOpenArticle(article)}><span className="article-row-number">{String(dsaArticles.indexOf(article) + 1).padStart(2,"0")}</span><span className="article-row-copy"><small>{article.category} · {articleDetails[article.concept]?.difficulty ?? "Note"} · 10 sections</small><strong>{article.title}</strong><span>{article.summary}</span></span><span className="article-row-time">{article.read}<ArrowRight size={15}/></span></button>)}</div></div><aside className="editorial-aside"><span className="aside-kicker">A GOOD WAY IN</span><h4>Build your<br/>mental model.</h4><p>Start with the shape of the problem. Then choose a structure or pattern that makes the work simpler.</p><div className="aside-steps"><span><i>01</i> Understand the input</span><span><i>02</i> Find the repeated work</span><span><i>03</i> Choose a pattern</span></div><div className="aside-note"><Code2 size={15}/> Concepts are easier to remember when you can explain the tradeoff.</div><span className="aside-count">{String(visible.length).padStart(2,"0")} MATCHING READS</span></aside></div> : <div className="articles-empty"><Search size={20}/><strong>No concepts found</strong><span>Try another phrase or choose a different topic.</span><button type="button" onClick={() => { setSearchTerm(""); setSelected("All concepts"); }}>Clear filters</button></div>}</section>
    {openArticle && activeLesson && articleDetails[openArticle.concept] && <ArticleReader article={openArticle} detail={articleDetails[openArticle.concept]} lesson={activeLesson} onClose={() => setOpenArticle(null)} onOpenRelated={(concept) => setOpenArticle(dsaArticles.find((item) => item.concept === concept) ?? openArticle)} onOpenIde={() => { setOpenArticle(null); onOpenIde(); }} />}
  </main>;
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


type SheetReward = { id: number; xp: number; headline: string; detail: string; milestone: boolean };

const patternAliases: Array<{ pattern: string; words: string[] }> = [
  { pattern: "Arrays & Hashing", words: ["array", "arrays", "hash", "hashing", "map", "set", "anagram", "two sum", "topk"] },
  { pattern: "Two Pointers", words: ["two pointer", "2 pointer", "pointer", "pointers", "trapping rain"] },
  { pattern: "Sliding Window", words: ["slide", "sliding", "window", "substring", "k length"] },
  { pattern: "Stack", words: ["stack", "parenthes", "bracket", "valid"] },
  { pattern: "Monotonic Stack", words: ["monotonic", "next greater", "histogram", "span"] },
  { pattern: "Binary Search", words: ["binary", "search", "log n", "rotated", "mid", "bs"] },
  { pattern: "Linked List", words: ["linked", "list", "cycle", "reverse", "ll", "fast slow"] },
  { pattern: "Trees", words: ["tree", "bst", "binary tree", "lca", "traversal", "depth"] },
  { pattern: "Backtracking", words: ["backtrack", "permutation", "subset", "n queen", "sudoku", "comb"] },
  { pattern: "Graphs", words: ["graph", "bfs", "dfs", "dijkstra", "island", "union find", "topo", "shortest path", "cycle detection"] },
  { pattern: "1-D DP", words: ["1d dp", "1-d", "memo", "climbing", "robber", "fib", "coin change", "increasing subsequence", "word break"] },
  { pattern: "2-D DP", words: ["2d dp", "2-d", "grid dp", "lcs", "longest common", "edit distance", "unique paths", "cooldown", "burst balloons"] },
  { pattern: "Greedy", words: ["greedy", "jump", "gas station", "sort first"] },
  { pattern: "Intervals", words: ["interval", "merge", "meeting room", "schedule", "calendar"] },
  { pattern: "Heaps", words: ["heap", "priority queue", "kth", "top k", "median"] },
  { pattern: "Bit Manipulation", words: ["bit", "xor", "mask", "manipulation", "single number"] },
];

/** What the sheet thinks the student meant while they are still typing. */
function recognizeSheetQuery(raw: string) {
  const text = raw.trim().toLowerCase();
  if (text.length < 2) return null;
  const found: string[] = [];
  for (const alias of patternAliases) {
    if (alias.words.some((word) => text.includes(word))) found.push(alias.pattern);
  }
  // A bare "dp" means every dynamic programming problem; "1-d" or "2-d" narrows it to one.
  if (/\b(dp|dynamic programming)\b/.test(text)) {
    const oneD = /\b1-?d\b/.test(text);
    const twoD = /\b2-?d\b/.test(text);
    if (oneD || twoD) {
      const drop = oneD ? "2-D DP" : "1-D DP";
      const index = found.indexOf(drop);
      if (index >= 0) found.splice(index, 1);
    } else {
      for (const name of ["1-D DP", "2-D DP"]) if (!found.includes(name)) found.push(name);
    }
  }
  const difficultyWord = /\b(easy|hard|medium)\b/.exec(text)?.[1] ?? null;
  const difficulty = difficultyWord ? difficultyWord.replace(/^./, (letter) => letter.toUpperCase()) : null;
  const status =
    /\b(solved|done|complete|completed)\b/.test(text) ? "Solved"
      : /\b(in progress|progress|doing|ongoing)\b/.test(text) ? "In progress"
        : /\b(todo|pending|unsolved|not started|remaining)\b/.test(text) ? "Todo"
          : null;
  return { patterns: found, difficulty, status, matched: found.length > 0 || Boolean(difficulty) || Boolean(status) };
}

// Every paid rail shows the same panel with its own product in it. The name, the
// figure, the promise and the rail it opens all come from src/products.ts, so a
// lock can never advertise a price the database would refuse - and a student who
// bought the roadmap is not offered the sheet again by a copy-pasted headline.
function ProductLock({ product, checking, onOpenStore, onRecheck, onFreeRail }: {
  product: CodexSheetProduct;
  checking: boolean;
  onOpenStore: () => void;
  onRecheck: () => void;
  onFreeRail?: () => void;
}) {
  return (
    <section className="sheet-lock" aria-label={`${product.name} is locked`}>
      <div className="sheet-lock-card">
        <span className="sheet-lock-kicker"><Lock size={13} /> {product.tag} · {rupees(product.price)}</span>
        <h2>{product.name} for {rupees(product.price)}. <em>{product.cadence}.</em></h2>
        <p>{product.oneLine} It opens {railLabel(product)} and nothing else — the Deva editor with real judged submissions, Guru, the Algorithm Labs, notes, chat, the calendar, the leaderboard and the 2027 radar stay open for everyone, and anyone who paid for the old Sheet Pass keeps every rail.</p>
        <ul className="sheet-lock-list">
          {product.includes.map((line) => <li key={line}><Check size={14} /> {line}</li>)}
        </ul>
        <div className="sheet-lock-actions">
          <button type="button" className="primary-button" onClick={onOpenStore}>Unlock {product.name} · {rupees(product.price)} <ArrowRight size={16} /></button>
          <button type="button" className="secondary-button" onClick={onRecheck} disabled={checking}>{checking ? "Checking…" : "I already paid"}</button>
          {onFreeRail && <button type="button" className="sheet-lock-free" onClick={onFreeRail}>Not ready to pay? Guru, the labs and the editor are open <ArrowRight size={15} /></button>}
        </div>
        <small>No card and no gateway. Your claim is confirmed by the server as it lands, so this panel clears on the next check - and your progress is not lost while it is up.</small>
      </div>
    </section>
  );
}

// The sheet as a repository students clone. The paths here come from
// src/studentRepo.ts, the same module scripts/build-student-repo.mjs builds the repo
// from, so a folder a student reads on this page is a folder in the clone.
function StudentRepoCard({ group, onImportGit }: {
  group: string;
  onImportGit: (text: string) => { added: number; skipped: number; parsed: number };
}) {
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState("");
  const [summary, setSummary] = useState("");
  const parsed = useMemo(() => parseCommitSubjects(log), [log]);
  const copy = (value: string, setFlag: (value: boolean) => void) => {
    void navigator.clipboard?.writeText(value).then(() => {
      setFlag(true);
      window.setTimeout(() => setFlag(false), 1800);
    }).catch(() => undefined);
  };
  const importLog = () => {
    const outcome = onImportGit(log);
    setSummary(outcome.parsed === 0
      ? "Nothing in the recognised format - the subject has to start with the number, like `014: Binary Search`."
      : outcome.added === 0
        ? `All ${outcome.parsed} of those are already marked solved here.`
        : `${outcome.added} marked solved${outcome.skipped ? `, ${outcome.skipped} already counted` : ""} - XP, streak and the leaderboard have them.`);
    setLog("");
  };
  const topic = topicFolderFor(group);
  return (
    <div className="problem-repo-card">
      <span className="problem-repo-icon"><GitBranch size={17} /></span>
      <div className="problem-repo-copy">
        <strong>The sheet is a git repo - and your commits count here.</strong>
        <p>250 folders, one per problem, each with the brief and runnable Python, JavaScript, Java and C++ starters - the same starter the editor hands you. Commit with the problem number in front, then paste your log here: the solves, the XP, the streak, the leaderboard and the certificate all pick it up.</p>
        {open && (
          <div className="problem-repo-import">
            <label className="problem-repo-log">
              <span>PASTE <code>git log --pretty=%s</code></span>
              <textarea rows={4} spellCheck={false} value={log} onChange={(event) => setLog(event.target.value)} placeholder={"001: Two Sum\n014: Binary Search"} aria-label="Paste your git log commit subjects"/>
            </label>
            <div className="problem-repo-import-actions">
              <button type="button" className="problem-repo-ghost" onClick={() => copy(gitLogCommand, setCopiedLog)}>
                {copiedLog ? <Check size={12}/> : <Copy size={12}/>} <code>{gitLogCommand}</code>
              </button>
              <button type="button" className="problem-repo-import-go" onClick={importLog} disabled={!log.trim()}>
                Mark {parsed.length || 0} as solved <ArrowRight size={13}/>
              </button>
            </div>
            {summary && <p className="problem-repo-summary" role="status">{summary}</p>}
          </div>
        )}
      </div>
      <div className="problem-repo-actions">
        <button type="button" className="problem-repo-clone" onClick={() => copy(studentRepoCloneCommand, setCopiedClone)} title="Copy the clone command">
          {copiedClone ? <Check size={13}/> : <Copy size={13}/>}<code>{studentRepoCloneCommand}</code>
        </button>
        <button type="button" className="problem-repo-toggle" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={13}/> : <Check size={13}/>} {open ? "Close" : "Import my commits"}
        </button>
        <a className="problem-repo-link" href={studentRepoUrl} target="_blank" rel="noreferrer">Browse the repo <ExternalLink size={13} /></a>
        <span className="problem-repo-path">{topic ? `problems/${topic}/` : "problems/"}</span>
      </div>
    </div>
  );
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
  // Plan day 1 is the day the student first actually practised, so the daily task
  // describes the sheet they have already started rather than a fresh 84-day promise.
  const [planStart, setPlanStart] = useState<string>(() => {
    const saved = localStorage.getItem("codexsheet-plan-start");
    if (saved) return saved;
    const days = JSON.parse(localStorage.getItem("codexsheet-practice-days") ?? "[]") as string[];
    const start = days.length ? days.reduce((earliest, day) => (day < earliest ? day : earliest)) : localDateKey(new Date());
    localStorage.setItem("codexsheet-plan-start", start);
    return start;
  });

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState<"All companies" | CompanyInterviewTrack>("All companies");
  const [companyInterviewTags, setCompanyInterviewTags] = useState<CompanyInterviewTags>({});
  const [companyTagsLoading, setCompanyTagsLoading] = useState(true);
  const [companyTagsError, setCompanyTagsError] = useState("");
  const [unavailableCompanyTags, setUnavailableCompanyTags] = useState<CompanyInterviewTrack[]>([]);
  const [companyTagsReload, setCompanyTagsReload] = useState(0);
  const [sheetReward, setSheetReward] = useState<SheetReward | null>(null);
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSavedAt, setNoteSavedAt] = useState(0);
  // The same 250 problems, browsed three ways: the twelve-week stage ladder, the
  // twelve subject families, or the sixteen patterns the /patterns cards teach.
  const [sheetMode, setSheetMode] = useState<SheetGroupMode>("week");
  const [sheetGroup, setSheetGroup] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  // A 900-row sheet cannot be dropped into the DOM at once. Each group shows its
  // first rows and the student opens the rest, so the page stays scannable however
  // big the sheet grows.
  const [sectionShown, setSectionShown] = useState<Record<string, boolean>>({});
  const rewardTimer = useRef<number | null>(null);
  const [patternTestOpen, setPatternTestOpen] = useState<string | null>(null);
  // The row a student is studying: approach ladder plus live board, opened from the
  // library list. `editorProblem` is the one-shot handoff into the code editor.
  const [studyNumber, setStudyNumber] = useState<number | null>(null);
  // The row the keyboard cursor is sitting on. Arrows move it, Enter opens it, S
  // solves it - the sheet is meant to be walked without touching the mouse.
  const [cursorNumber, setCursorNumber] = useState<number | null>(null);
  const [editorProblem, setEditorProblem] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>(viewFromLocation);
  useEffect(() => {
    if (activeView !== "problems") return;
    let active = true;
    setCompanyTagsLoading(true);
    setCompanyTagsError("");
    setUnavailableCompanyTags([]);
    fetchCompanyInterviewTags().then(({ tags, unavailable }) => {
      if (!active) return;
      setCompanyInterviewTags(tags);
      setUnavailableCompanyTags(unavailable);
      setCompanyFilter((current) => current !== "All companies" && unavailable.includes(current) ? "All companies" : current);
      if (unavailable.length) {
        setCompanyTagsError(
          Object.keys(tags).length
            ? `Some community tags are unavailable (${unavailable.join(", ")}).`
            : "Community company tags are unavailable right now.",
        );
      }
      setCompanyTagsLoading(false);
    });
    return () => { active = false; };
  }, [activeView, companyTagsReload]);
  // One definer-side RPC answers all four entitlements for this account, and
  // tells us whether it is a mentor: mentors and the grandfathered Sheet Pass
  // payers see every rail. With Supabase missing the dev build never locks.
  const unlocks = useUnlocks(userId ?? null);
  // A lock panel sends the checkout to the card the student was looking at, so
  // the page does not open on the sheet when they wanted the roadmap.
  const [checkoutProduct, setCheckoutProduct] = useState<ProductId>("dsa250");
  const lockedFor = (product: ProductId) => !unlocksRail(unlocks, product);
  const sheetLocked = lockedFor("dsa250");
  function openCheckout(product: ProductId) {
    setCheckoutProduct(product);
    navigateToView("mentorship");
  }

  // Bootstrap-style collapse: below the expand breakpoint the view list hides behind
  // the hamburger and closes itself on every navigation.
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => { setNavOpen(false); }, [activeView]);
  const navigateToView = (view: WorkspaceView) => {
    const url = new URL(window.location.href);
    url.pathname = viewPaths[view];
    url.searchParams.delete("room");
    url.searchParams.delete("schedule");
    url.searchParams.delete("call");
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
  useEffect(() => {
    const goto = (event: Event) => {
      const detail = (event as CustomEvent<{ view?: string; topic?: string }>).detail;
      const view = detail?.view as WorkspaceView | undefined;
      const route = view ? viewPaths[view] : undefined;
      if (!view || !route) return;
      const url = new URL(window.location.href);
      url.pathname = route;
      if (detail?.topic) url.searchParams.set("topic", detail.topic);
      else url.searchParams.delete("topic");
      window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
      setActiveView(view);
    };
    window.addEventListener("codexsheet:goto", goto);
    return () => window.removeEventListener("codexsheet:goto", goto);
  }, []);

  useEffect(() => {
    const seo = viewSeo[activeView];
    const path = viewPaths[activeView];
    document.title = seo.title;
    const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
      const node = document.head.querySelector<HTMLMetaElement>(selector) ?? document.createElement("meta");
      node.setAttribute(attribute, key);
      node.setAttribute("content", content);
      if (!node.parentNode) document.head.appendChild(node);
    };
    setMeta('meta[name="description"]', "name", "description", seo.description);
    setMeta('meta[property="og:title"]', "property", "og:title", seo.title);
    setMeta('meta[property="og:description"]', "property", "og:description", seo.description);
    setMeta('meta[property="og:url"]', "property", "og:url", `${siteOrigin}${path}`);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", seo.title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", seo.description);
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = `${siteOrigin}${path}`;
  }, [activeView]);

  const tr = useT();
  const [pattern, setPattern] = useState("All patterns");
  const [difficulty, setDifficulty] = useState("All levels");
  const [status, setStatus] = useState("All status");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatReadsByMessage, setChatReadsByMessage] = useState<Record<number, string[]>>({});
  const [chatUnreadIds, setChatUnreadIds] = useState<number[]>([]);
  const [studentDmUnread, setStudentDmUnread] = useState(0);
  const [messagesNavRequest, setMessagesNavRequest] = useState(0);
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
  const problemLibraryRef = useRef<HTMLDivElement>(null);
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
  const isCurrentCalendarMonth = calendarMonthKey === todayDateKey.slice(0, 7);

  // What the student types is read as intent first: pattern words, difficulty
  // and status steer the filters even when no problem title contains them.
  const sheetSearch = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (raw.length < 2) return null;
    const recognition = recognizeSheetQuery(raw);
    const stripped = raw
      .replace(/\b(easy|hard|medium)\b/g, " ")
      .replace(/\b(in progress|not started|solved|done|completed|complete|doing|ongoing|todo|pending|unsolved|remaining)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { raw, recognition, stripped };
  }, [query]);

  const visibleProblems = useMemo(() => {
    const recognition = sheetSearch?.recognition ?? null;
    const aliasPatterns = recognition?.patterns ?? [];
    const patternWanted = pattern !== "All patterns" ? [pattern] : aliasPatterns;
    const difficultyWanted = difficulty !== "All levels" ? difficulty : (recognition?.difficulty ?? null);
    const statusWanted = status !== "All status" ? status : (recognition?.status ?? null);
    const text = sheetSearch?.stripped ?? "";
    return problems.filter((problem) => {
      const current = progress[problem.number]?.status ?? "Todo";
      if (sheetGroup && sheetGroupKey(problem, sheetMode) !== sheetGroup) return false;
      if (companyFilter !== "All companies" && !companyInterviewTags[companyFilter]?.includes(problem.slug)) return false;
      if (patternWanted.length && !patternWanted.includes(problem.pattern)) return false;
      if (difficultyWanted && problem.difficulty !== difficultyWanted) return false;
      if (statusWanted && current !== statusWanted) return false;
      if (text) {
        const haystack = `${problem.title} ${problem.pattern} ${problem.topic} ${problem.difficulty}`.toLowerCase();
        if (!haystack.includes(text) && !aliasPatterns.includes(problem.pattern)) return false;
      }
      return true;
    });
  }, [companyFilter, companyInterviewTags, difficulty, pattern, progress, sheetGroup, sheetMode, sheetSearch, status]);

  // One entry per rail group in the mode being browsed, with what the student has
  // already cleared inside it, so the rail doubles as a progress report.
  const sheetGroups = useMemo(
    () =>
      sheetGroupOrder(sheetMode)
        .map((key) => {
          const group = problems.filter((problem) => sheetGroupKey(problem, sheetMode) === key);
          const solvedCount = group.filter((problem) => progress[problem.number]?.status === "Solved").length;
          return {
            key,
            total: group.length,
            solved: solvedCount,
            open: group.length - solvedCount,
            hint: sheetGroupHint(group, sheetMode),
          };
        })
        .filter((group) => group.total > 0),
    [progress, sheetMode],
  );

  // How many groups each browse mode has, straight from the sheet so the rail
  // cannot claim a number the data does not have.
  const railCounts: Record<SheetGroupMode, number> = { week: sheetGroupOrder("week").length, topic: topics.length, pattern: patterns.length };

  // The list cut into the same groups, so the page shows the structure it teaches
  // instead of one flat run of links. Inside one rail group the list is cut by the
  // other axis: a pattern shows the topics it appears in, a topic shows the patterns
  // it draws on, and a week shows the topics that week covers.
  const sheetSections = useMemo(() => {
    const innerMode: SheetGroupMode = sheetMode === "pattern" ? "topic" : "pattern";
    const mode: SheetGroupMode = sheetGroup ? (sheetMode === "week" ? "topic" : innerMode) : sheetMode;
    const buckets = new Map<string, Problem[]>();
    for (const problem of visibleProblems) {
      const key = sheetGroupKey(problem, mode);
      buckets.set(key, [...(buckets.get(key) ?? []), problem]);
    }
    return sheetGroupOrder(mode)
      .filter((key) => buckets.has(key))
      .map((key) => ({ key, rows: buckets.get(key) as Problem[], mode }));
  }, [sheetGroup, sheetMode, visibleProblems]);

  const studyProblem = studyNumber === null ? null : problemByNumber.get(studyNumber) ?? null;

  /** Lands the cursor on the next open problem and opens its approach panel. */
  function focusNextProblem() {
    const next = orderedRows.find((problem) => progress[problem.number]?.status !== "Solved") ?? studyQueue[0] ?? orderedRows[0];
    if (!next) return;
    setCursorNumber(next.number);
    setStudyNumber(next.number);
    window.setTimeout(() => document.querySelector<HTMLElement>(`[data-row="${next.number}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 40);
  }

  /** Opens a row today's task is asking for. The browse mode switches to weeks -
      the axis the plan itself is cut on - and every filter is cleared, so the row
      is guaranteed to be in the DOM before the page scrolls to it. */
  function openDailyTask(problem: Problem) {
    setSheetMode("week");
    setSheetGroup("");
    setStatus("All status");
    setPattern("All patterns");
    setDifficulty("All levels");
    setCompanyFilter("All companies");
    setQuery("");
    setCursorNumber(problem.number);
    setStudyNumber(problem.number);
    window.setTimeout(() => document.querySelector<HTMLElement>(`[data-row="${problem.number}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }

  function restartPlan() {
    const today = localDateKey(new Date());
    localStorage.setItem("codexsheet-plan-start", today);
    setPlanStart(today);
  }

  // Every row currently in the DOM, in the order it is read top to bottom. The
  // keyboard cursor walks this, so arrows never jump into a collapsed group.
  const orderedRows = useMemo(
    () =>
      sheetSections.flatMap((section) =>
        sectionShown[section.key] || section.rows.length <= ROWS_PER_SECTION
          ? section.rows
          : section.rows.slice(0, ROWS_PER_SECTION),
      ),
    [sectionShown, sheetSections],
  );

  useEffect(() => {
    if (activeView !== "problems" || sheetLocked) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const order = orderedRows.map((problem) => problem.number);
      if (!order.length) return;
      const at = cursorNumber === null ? -1 : order.indexOf(cursorNumber);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const number = order[at === -1 ? 0 : event.key === "ArrowDown" ? Math.min(order.length - 1, at + 1) : Math.max(0, at - 1)];
        setCursorNumber(number);
        document.querySelector<HTMLElement>(`[data-row="${number}"]`)?.scrollIntoView({ block: "nearest" });
        if (studyNumber !== null) setStudyNumber(number);
      } else if (event.key === "Enter" && cursorNumber !== null) {
        event.preventDefault();
        setStudyNumber(cursorNumber);
      } else if ((event.key === "s" || event.key === "S") && cursorNumber !== null) {
        event.preventDefault();
        const current = progress[cursorNumber]?.status ?? "Todo";
        setProblemStatus(cursorNumber, current === "Solved" ? "Todo" : "Solved");
      } else if (event.key === "Escape") {
        if (studyNumber !== null) setStudyNumber(null);
        else if (noteFor !== null) setNoteFor(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeView, cursorNumber, noteFor, orderedRows, progress, sheetLocked, studyNumber]);
  useEffect(() => {
    if (activeView !== "problems" || !problemLibraryRef.current) return;
    let cancelled = false;
    let revert: (() => void) | undefined;
    const timer = window.setTimeout(() => {
      void import("gsap").then(({ gsap }) => {
        if (cancelled || !problemLibraryRef.current) return;
        const rows = Array.from(problemLibraryRef.current.querySelectorAll<HTMLElement>(".library-row")).slice(0, 16);
        const context = gsap.context(() => {
          gsap.fromTo(rows, { y: 10, opacity: 0, filter: "blur(3px)" }, {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.38,
            stagger: 0.022,
            ease: "power2.out",
            clearProps: "transform,opacity,filter",
          });
        }, problemLibraryRef);
        revert = () => context.revert();
      });
    }, 75);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      revert?.();
    };
  }, [activeView, difficulty, pattern, query, status, visibleProblems.length]);
  const recognition = sheetSearch?.recognition ?? null;
  const visibleSolved = visibleProblems.filter((problem) => progress[problem.number]?.status === "Solved").length;
  const noteWordCount = noteDraft.trim() ? noteDraft.trim().split(/\s+/).length : 0;
  const solved = Object.values(progress).filter(
    (item) => item.status === "Solved",
  ).length;
  const inProgress = Object.values(progress).filter(
    (item) => item.status === "In progress",
  ).length;
  const percent = Math.round((solved / problems.length) * 100);
  // The one line under the hero that tells the student where they actually stand.
  const hausla = hauslaLine({ solved, total: problems.length, inProgress, streak: practiceStreak.current, percent });
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
  const solvedNumbers = useMemo(
    () => problems.filter((problem) => progress[problem.number]?.status === "Solved").map((problem) => problem.number),
    [progress],
  );
  // A half-finished pattern is where the next hour of practice pays best, so the
  // dashboard hands back the patterns with work open in them. The ordering lives
  // in DashboardHub.tsx next to the markup it feeds.
  const resumePatterns = useMemo(
    () =>
      resumeRows(
        patternStats.map((item) => ({
          ...item,
          active: problems.filter((problem) => problem.pattern === item.name && progress[problem.number]?.status === "In progress").length,
        })),
      ),
    [patternStats, problems, progress],
  );
  const hubCounts: HubCounts = {
    solved,
    total: problems.length,
    patterns: patternStats.length,
    activeDays: practiceDays.length,
    unread: chatUnreadIds.length,
  };
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
    if (!isLoaded || !user) {
      setStudentDmUnread(0);
      return;
    }

    let active = true;
    const refreshUnreadDms = async () => {
      const { rows, problem } = await loadUnreadDms();
      if (!active) return;
      if (problem) {
        console.error(`Could not load unread message count. ${problem}`);
        return;
      }
      setStudentDmUnread(rows);
    };

    void refreshUnreadDms();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshUnreadDms();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    const channel = supabase?.channel(`student-dm-nav-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "student_dm_messages" }, () => {
        void refreshUnreadDms();
      })
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, [isLoaded, user?.id]);

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
    localStorage.setItem("codexsheet-dsa-progress", JSON.stringify(progress));
    if (!isLoaded || !supabase || !user) return;
    const changes = Object.entries(progress).slice(-1);
    if (changes.length === 0) return;
    const [number, value] = changes[0];
    void supabase.from("dsa_progress").upsert(
        {
          user_id: user.id,
          problem_number: Number(number),
          status: value.status,
          notes: value.notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,problem_number" },
      );
  }, [isLoaded, progress, user]);

  const sheetRank = useMemo(() => getSheetRank(sheetXpTotal(progress)), [progress]);

  useEffect(() => () => {
    if (rewardTimer.current) window.clearTimeout(rewardTimer.current);
  }, []);

  function setProblemStatus(number: number, nextStatus: Status) {
    const previous = progress[number]?.status ?? "Todo";
    if (previous === nextStatus) return;
    setProgress((current) => ({
      ...current,
      [number]: { status: nextStatus, notes: current[number]?.notes ?? "" },
    }));
    if (nextStatus !== "Todo") {
      const today = localDateKey(new Date());
      setPracticeDays((current) => current.includes(today) ? current : [...current, today]);
    }
    if (nextStatus !== "Solved" || previous === "Solved") return;

    const problem = problemByNumber.get(number);
    const gained = problem ? sheetXp[problem.difficulty] : 10;
    const solvedCount = Object.values(progress).filter((item) => item.status === "Solved").length + 1;
    const milestone = solveMilestones[solvedCount] ?? null;
    const startedToday = !practiceDays.includes(todayDateKey);
    const nextStreak = practiceStreak.current + (startedToday ? 1 : 0);
    const detail = milestone
      ?? (startedToday
        ? `Day streak ${nextStreak}. Solve tomorrow and it grows again.`
        : problem
          ? `${rewardVoice(problem, gained)} ${sheetRank.toNext ? `${sheetRank.toNext} XP to ${sheetRanks[sheetRank.level]?.title ?? sheetRank.title}.` : "Top rank held."}`
          : "Another one on the board.");
    setSheetReward({ id: Date.now(), xp: gained, headline: milestone ? "Milestone reached" : `${problem?.title ?? "Problem"} solved`, detail, milestone: Boolean(milestone) });
    if (rewardTimer.current) window.clearTimeout(rewardTimer.current);
    rewardTimer.current = window.setTimeout(() => setSheetReward(null), 5200);
  }

  function setProblemNote(number: number, notes: string) {
    setProgress((current) => {
      const next = { ...current };
      // Re-inserting keeps the edited problem last, which is the row the
      // sync effect upserts.
      delete next[number];
      next[number] = { status: current[number]?.status ?? "Todo", notes };
      return next;
    });
    setNoteSavedAt(Date.now());
  }

  // A student who solved offline still owns the same sheet, so the commits are
  // applied through the progress map in one write: the XP, rank, streak and
  // certificate are all derived from it. The per-keystroke effect above only
  // upserts the last row, so these rows go up together in one batch.
  function importFromGit(text: string) {
    const numbers = parseCommitSubjects(text);
    const fresh = numbers.filter((number) => progress[number]?.status !== "Solved" && problemByNumber.has(number));
    if (fresh.length) {
      setProgress((current) => {
        const next = { ...current };
        for (const number of fresh) next[number] = { status: "Solved", notes: current[number]?.notes ?? "" };
        return next;
      });
      const today = localDateKey(new Date());
      setPracticeDays((current) => current.includes(today) ? current : [...current, today]);
      if (isLoaded && supabase && user) {
        void supabase.from("dsa_progress").upsert(fresh.map((number) => ({
          user_id: user.id,
          problem_number: number,
          status: "Solved",
          notes: progress[number]?.notes ?? "",
          updated_at: new Date().toISOString(),
        })), { onConflict: "user_id,problem_number" });
      }
      const xp = fresh.reduce((total, number) => total + sheetXp[problemByNumber.get(number)!.difficulty], 0);
      setSheetReward({
        id: Date.now(),
        xp,
        headline: `${fresh.length} imported from git`,
        detail: `${xp} XP across the log - the leaderboard and your certificate see them now.`,
        milestone: false,
      });
      if (rewardTimer.current) window.clearTimeout(rewardTimer.current);
      rewardTimer.current = window.setTimeout(() => setSheetReward(null), 5200);
    }
    return { added: fresh.length, skipped: numbers.length - fresh.length, parsed: numbers.length };
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

  if (!isLoaded) {
    return <main className="auth-gate"><div className="auth-gate-card auth-gate-loading"><img className="auth-gate-logo" src="/codexsheet-primary-reversed.svg" alt="CodexSheet" /><span>CODEXSHEET · DSA WORKSPACE</span><h1>Preparing your workspace…</h1></div></main>;
  }

  // Students pay from a shared link, so the store stays public. Guru is the free
  // teacher and CS Labs the free laboratory, so a student with no account and no
  // money still gets taught and still gets to see the algorithms run.
  const publicView = !isSignedIn && (activeView === "home" || activeView === "mentorship" || activeView === "guru" || activeView === "cslabs" || activeView === "marketplace" || activeView === "experiences" || activeView === "verify" || activeView === "patterns" || activeView === "radar" || activeView === "dsa-ide");

  if (!isSignedIn && !publicView) {
    return <main className="auth-gate"><div className="auth-gate-card"><div className="auth-gate-copy"><img className="auth-gate-logo" src="/codexsheet-primary-reversed.svg" alt="CodexSheet" /><span className="auth-gate-kicker">CODEXSHEET · DSA WORKSPACE</span><h1>One sign in.<br/><em>Your whole toolkit.</em></h1><p>Sign in to unlock your DSA practice workspace: problems, articles, roadmap, notes, editor, and study features.</p><div className="auth-gate-features"><span>Problem library</span><span>Animated lessons</span><span>Interview prep</span></div><div className="auth-gate-actions"><SignInButton mode="modal" forceRedirectUrl={window.location.href}><button className="auth-gate-primary">Sign in <ArrowRight size={16}/></button></SignInButton><SignUpButton mode="modal" forceRedirectUrl={window.location.href}><button className="auth-gate-secondary">Create student account</button></SignUpButton></div><small>Your workspace opens automatically after sign in.</small></div><div className="auth-gate-art" aria-hidden="true"><div className="auth-gate-orbit auth-gate-orbit-one"/><div className="auth-gate-orbit auth-gate-orbit-two"/><div className="auth-gate-code"><span>YOUR NEXT STEP</span><strong>Learn →<br/>Practice →<br/><i>Grow.</i></strong><small>DSA · INTERVIEWS · CAREER</small></div><b>✳</b></div></div><StudentFooter /></main>;
  }

  if (publicView) {
    if (activeView === "home") {
      return (
        <main className="home-public ui-scope">
          <HomePage
            signedIn={false}
            signInSlot={(
              <SignInButton mode="modal" forceRedirectUrl={window.location.href}>
                <button className="home-primary" type="button">{tr("home.cta2")} <ArrowRight size={16} /></button>
              </SignInButton>
            )}
            onNavigate={navigateToView}
            onOpenProduct={openCheckout}
          />
          <StudentFooter />
        </main>
      );
    }
    if (activeView === "guru") {
      return <main className="guru-public ui-scope"><DsaGuru onOpenMentorship={() => navigateToView("mentorship")} /><StudentFooter /></main>;
    }
    if (activeView === "cslabs") {
      return <main className="cslabs-public ui-scope"><CsLabs onOpenMentorship={() => navigateToView("mentorship")} /><StudentFooter /></main>;
    }
    if (activeView === "marketplace") {
      return <main className="mkt-public ui-scope"><Marketplace userId={user?.id ?? null} userName={clerkDisplayName} userEmail={user?.email ?? ""} onOpenStudio={() => { window.location.href = "/mentor-studio"; }} onNavigateHome={() => navigateToView("mentorship")} /><StudentFooter /></main>;
    }
    if (activeView === "experiences") {
      return <main className="exp-public ui-scope"><InterviewExperiences /><StudentFooter /></main>;
    }
    if (activeView === "radar") {
      return <main className="rad-public ui-scope"><InterviewRadar onPractice={() => navigateToView("problems")} onOpenPatterns={() => navigateToView("patterns")} onOpenStories={() => navigateToView("experiences")} /><StudentFooter /></main>;
    }
    if (activeView === "patterns") {
      return <main className="patterns-public ui-scope"><PatternLibrary problems={problems} progress={progress} onPractice={() => navigateToView("problems")} /><StudentFooter /></main>;
    }
    if (activeView === "dsa-ide") {
      return <main className="human-ai-public ui-scope"><DsaIde problems={problems.map(({ number, title, pattern, difficulty }) => ({ number, title, pattern, difficulty }))} userId={null} focusProblem={editorProblem} /><StudentFooter /></main>;
    }
    if (activeView === "verify") {
      return <main className="cert-public ui-scope"><VerifyPage /><StudentFooter /></main>;
    }
    return <main className="mentorship-public ui-scope"><MentorshipPayments /><StudentFooter /></main>;
  }

  return (
    <main className="app-shell ui-scope">

      {/* ══ Sidebar ══════════════════════════════════════════════════════ */}
      <aside className={`sidebar${navOpen ? " sidebar-open" : ""}`} aria-label="Workspace navigation">

        {/* Brand */}
        <div className="sidebar-brand">
          <button type="button" className="brand-lockup" onClick={() => navigateToView("home")} aria-label="CodexSheet home">
            <img className="brand-primary-image" src="/codexsheet-primary-reversed.svg" alt="CodexSheet" />
          </button>
        </div>
        <LanguagePicker placement="sidebar" />

        {/* Primary nav */}
        <nav className="sidebar-nav" aria-label="Workspace views">

          <button type="button"
            className={`sidebar-item${activeView === "network" ? " active" : ""}`}
            aria-pressed={activeView === "network"}
            onClick={() => { setMessagesNavRequest((r) => r + 1); navigateToView("network"); setNavOpen(false); }}
          >
            <Bell size={16} /><span>Messages</span>
            {studentDmUnread > 0 && <em className="sidebar-badge">{studentDmUnread > 99 ? "99+" : studentDmUnread}</em>}
          </button>

          <button type="button"
            className={`sidebar-item${activeView === "problems" || activeView === "companies" ? " active" : ""}`}
            aria-pressed={activeView === "problems" || activeView === "companies"}
            onClick={() => { navigateToView("problems"); setNavOpen(false); }}
          >
            <Rows3 size={16} /><span>{tr("nav.problems")}</span>
            <em className="sidebar-count">{visibleProblems.length}</em>
          </button>

          <button type="button"
            className={`sidebar-item${activeView === "leaderboard" ? " active" : ""}`}
            aria-pressed={activeView === "leaderboard"}
            onClick={() => { navigateToView("leaderboard"); setNavOpen(false); }}
          >
            <Trophy size={16} /><span>Leaderboard</span>
          </button>

          {/* Groups from navMenuGroups */}
          {navMenuGroups.map((group) => (
            <div key={group.label} className="sidebar-group">
              <span className="sidebar-group-label">{group.label}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const unread = item.view === "chat" ? chatUnreadIds.length : 0;
                return (
                  <button key={item.view} type="button"
                    className={`sidebar-item${activeView === item.view ? " active" : ""}`}
                    aria-pressed={activeView === item.view}
                    onClick={() => { navigateToView(item.view); setNavOpen(false); }}
                  >
                    <Icon size={16} /><span>{item.labelKey ? tr(item.labelKey) : item.label}</span>
                    {unread > 0 && <em className="sidebar-badge">{unread > 99 ? "99+" : unread}</em>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Stat chips */}
        <div className="sidebar-stats" aria-label="Your standing on the sheet">
          <div className="sidebar-stat sidebar-stat-sheet">
            <span className="sidebar-stat-row">
              <strong>{solved}</strong><small>/{problems.length} solved</small>
            </span>
            <i className="sidebar-stat-track"><b style={{ width: `${percent}%` }} /></i>
          </div>
          <div className="sidebar-stat">
            <Crown size={12} className="sidebar-stat-icon sidebar-stat-rank-icon" />
            <span><strong>{sheetRank.title}</strong><small>Lv {sheetRank.level} · {sheetRank.xp} XP</small></span>
          </div>
          <div className="sidebar-stat">
            <Flame size={12} className="sidebar-stat-icon sidebar-stat-streak-icon" />
            <span><strong>{practiceStreak.current}</strong><small>{practiceStreak.current === 1 ? "day" : "days"} streak</small></span>
          </div>
        </div>

        {/* Account */}
        <div className="sidebar-account">
          {isLoaded ? user ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal" forceRedirectUrl={window.location.href}>
              <button className="primary-button" style={{ minHeight: 34, fontSize: 11, padding: "0 13px", width: "100%" }}>Sign in</button>
            </SignInButton>
          ) : null}
        </div>

      </aside>

      {/* Mobile overlay backdrop */}
      {navOpen && <div className="sidebar-backdrop" aria-hidden="true" onClick={() => setNavOpen(false)} />}

      {/* ══ Main content area ════════════════════════════════════════════ */}
      <div className="main-content">

        {/* Mobile topbar */}
        <header className="mobile-topbar">
          <button type="button" className="navbar-toggler"
            aria-expanded={navOpen}
            aria-controls="sidebar"
            aria-label={navOpen ? "Close menu" : "Open menu"}
            onClick={() => setNavOpen((o) => !o)}
          >
            <span className="navbar-toggler-icon" aria-hidden="true" />
          </button>
          <button type="button" className="brand-lockup" onClick={() => navigateToView("home")} aria-label="CodexSheet home">
            <img className="brand-primary-image" src="/codexsheet-primary-reversed.svg" alt="CodexSheet" style={{ width: 108 }} />
          </button>
          <div className="top-actions" style={{ marginLeft: "auto" }}>
            {isLoaded ? user ? <UserButton /> : (
              <SignInButton mode="modal" forceRedirectUrl={window.location.href}>
                <button className="primary-button" style={{ minHeight: 32, fontSize: 10, padding: "0 11px" }}>Sign in</button>
              </SignInButton>
            ) : null}
          </div>
        </header>
      <section className="workspace-header">
        {!selfHeadedViews.includes(activeView) && <div className="title-row">
          <div>
            <div className="breadcrumb">
              <span>Library</span>
              <span>/</span>
              <span>
                {activeView === "dashboard"
                  ? "Dashboard"
                  : activeView === "problems"
                    ? "Problems"
                    : activeView === "dsa-ide"
                      ? "Deva Editor"
                  : activeView === "dsa-course"
                      ? "DSA Course"
                    : activeView === "calendar"
                      ? "Calendar"
                      : activeView === "roadmap"
                        ? "Roadmap"
                      : activeView === "lld"
                        ? "Senior SDE LLD"
                      : activeView === "whiteboard"
                        ? "LLD whiteboard"
                    : activeView === "chat"
                      ? "Group chat"
                        : activeView === "notes"
                          ? "Personal notes"
                  : activeView === "mentorship" ? "Mentorship"
                  : activeView === "experiences" ? "Interview experiences"
                  : activeView === "mentees" ? "Mentees"
                  : activeView === "network" ? "CodexSheet Network"
                  : activeView === "articles" ? "Articles" : activeView === "resume" ? "Resume builder" : "CodexSheet"}
              </span>
            </div>
            <h1>
              {activeView === "dashboard"
                ? "Your progress"
                : activeView === "problems"
                  ? "Problem library"
                  : activeView === "dsa-ide"
                    ? "Deva Editor"
                  : activeView === "dsa-course"
                    ? "DSA visual course"
                  : activeView === "calendar"
                    ? "Practice calendar"
                    : activeView === "roadmap"
                      ? "Your DSA roadmap"
                      : activeView === "lld"
                        ? "Senior SDE · Low-Level Design"
                      : activeView === "whiteboard"
                        ? "LLD design whiteboard"
                  : activeView === "chat"
                    ? "Group chat"
                      : activeView === "notes"
                        ? "Personal notebook"
                : activeView === "articles" ? "DSA concept articles" : activeView === "experiences" ? "What they were actually asked" : activeView === "network" ? "Share your code, read theirs" : activeView === "resume" ? "Create a resume that tells your story" : "Your workspace"}{" "}
              <span className="private-pill">{activeView === "lld" ? "SENIOR SDE" : "DSA 250"}</span>
            </h1>
            <p>
              {activeView === "dashboard"
                ? "A clear view of your practice and what to tackle next."
                : activeView === "problems"
                  ? "Practice the 250-question interview sheet, explore community-reported company tags, and track every solve."
                : activeView === "dsa-ide"
                    ? "Plan on the whiteboard, edit your solution, and trace each loop step."
                : activeView === "dsa-course"
                    ? "Learn core DSA patterns through detailed explanations and interactive visual walkthroughs."
                  : activeView === "calendar"
                    ? "See your practice history and keep your daily streak going."
                    : activeView === "roadmap"
                      ? "A study plan shaped around your pace and the patterns you want to master."
                      : activeView === "lld"
                        ? "A visual, phase-by-phase LLD plan for senior engineering interviews."
                      : activeView === "whiteboard"
                        ? "Map components, ownership, and relationships in your design."
                  : activeView === "chat"
                    ? "Talk through DSA problems and share ideas with the study group."
                      : activeView === "notes"
                        ? "Keep private study notes that sync with your account."
                        : activeView === "articles" ? "Build a clear mental model for the patterns you will meet in the problem library." : activeView === "experiences" ? "Round-by-round accounts written by the candidate who sat in the room. Nothing here is scraped." : activeView === "network" ? "Post the solution you just wrote, let the batch react and argue in the comments, and message any student privately." : activeView === "resume" ? "Build and preview a polished resume. Your draft stays on this device." : "Pick up the rail you need - everything here is tied to your account."}
            </p>
          </div>
        </div>}
      </section>
      {activeView === "home" && <HomePage
        signedIn
        signInSlot={null}
        onNavigate={navigateToView}
        onOpenProduct={openCheckout}
      />}
      {activeView === "articles" && <ArticlesPage onOpenIde={() => navigateToView("dsa-ide")} />}
      {activeView === "resume" && <ResumeBuilder />}
      {activeView === "mentorship" && <MentorshipPayments userId={user?.id ?? null} userName={clerkDisplayName} userEmail={user?.email ?? ""} initialProduct={checkoutProduct} unlocks={unlocks} />}
      {activeView === "mentees" && <MenteeSpace userId={user?.id ?? null} userEmail={user?.email ?? ""} />}
      {activeView === "marketplace" && <Marketplace userId={user?.id ?? null} userName={clerkDisplayName} userEmail={user?.email ?? ""} onOpenStudio={() => navigateToView("studio")} onNavigateHome={() => navigateToView("mentorship")} />}
      {activeView === "studio" && <MentorStudio userId={user?.id ?? null} userName={clerkDisplayName} userEmail={user?.email ?? ""} />}
      {activeView === "experiences" && <InterviewExperiences userId={user?.id ?? ""} />}
      {activeView === "radar" && <InterviewRadar onPractice={() => navigateToView("problems")} onOpenPatterns={() => navigateToView("patterns")} onOpenStories={() => navigateToView("experiences")} />}
      {activeView === "leaderboard" && <Leaderboard userId={user?.id ?? ""} />}
      {activeView === "network" && <StudentNetwork userId={user?.id ?? ""} messagesRequest={messagesNavRequest} onUnreadCountChange={setStudentDmUnread} />}
      {activeView === "certificate" && <Certificates userId={user?.id ?? ""} />}
      {activeView === "verify" && <VerifyPage />}
      {activeView === "lld" && <LldRoadmapPage onOpenWhiteboard={() => navigateToView("whiteboard")} />}
      {activeView === "whiteboard" && <LldWhiteboardPage />}
      {activeView === "companies" && <CompanyProblems />}
      {activeView === "dsa-ide" && <DsaIde problems={problems.map(({ number, title, pattern, difficulty }) => ({ number, title, pattern, difficulty }))} userId={user?.id ?? null} focusProblem={editorProblem} />}
      {activeView === "arena" && <HumanVsAi />}
      {activeView === "dsa-course" && <DsaCoursePage />}
      {activeView === "programming-basics" && <ProgrammingBasicsCourse />}
      {activeView === "guru" && <DsaGuru onOpenMentorship={() => navigateToView("mentorship")} />}
      {activeView === "cslabs" && <CsLabs onOpenMentorship={() => navigateToView("mentorship")} />}
      {activeView === "dashboard" && (
        <>
          <section className="dashboard-welcome" aria-label="Continue your DSA practice">
            <div className="dashboard-welcome-copy">
              <span className="dashboard-welcome-kicker"><span /> YOUR PRACTICE, AT A GLANCE</span>
              <h2>Small steps make <em>strong instincts.</em></h2>
              <p>{solved > 0 ? `You’ve solved ${solved} of ${problems.length} problems. Keep your momentum going with the next one.` : "Build a steady interview practice habit, one thoughtfully chosen problem at a time."}</p>
              <div className="dashboard-identity">
                <span className="dashboard-identity-avatar" aria-hidden="true">{(clerkDisplayName.trim().slice(0, 1) || "C").toUpperCase()}</span>
                <span className="dashboard-identity-copy">
                  <strong>{clerkDisplayName}</strong>
                  <small>{sheetRank.title} · Level {sheetRank.level} · {sheetRank.xp} XP{sheetRank.toNext ? ` · ${sheetRank.toNext} XP to the next rank` : " · top rank held"}</small>
                </span>
                <button type="button" className="dashboard-identity-cta" onClick={() => navigateToView("network")}><Users size={14} /> Share your code</button>
              </div>
              <div className="dashboard-welcome-actions">
                <button className="dashboard-continue" onClick={() => navigateToView("problems")}>Continue practicing <ArrowRight size={15} /></button>
                <button className="dashboard-calendar-link" onClick={() => navigateToView("calendar")}><CalendarDays size={15} /> View calendar</button>
                <button className="dashboard-tool-link" onClick={() => navigateToView("companies")}><UsersRound size={15} /> Company sets</button>
                <button className="dashboard-tool-link" onClick={() => navigateToView("resume")}><FileText size={15} /> Resume builder</button>
              </div>
            </div>
            <div className="dashboard-welcome-progress" aria-label={`${percent}% complete`}>
              <div className="dashboard-progress-ring" style={{ "--progress": `${percent}%` } as CSSProperties & { "--progress": string }}>
                <div><strong>{percent}<small>%</small></strong><span>COMPLETE</span></div>
              </div>
              <span className="dashboard-progress-caption"><strong>{solved}</strong> solved <i /> {problems.length} total</span>
            </div>
          </section>
          <section className="insight-strip">
        <div className="insight">
          <span className="insight-label">Solved</span>
          <strong>
            {solved}
            <small>/{problems.length}</small>
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
          <span>{Math.max(problems.length - solved, 0)} problems left in your path</span>
        </div>
          </section>
          <ResumeTrack rows={resumePatterns} onOpen={navigateToView} />
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
          <section className="dashboard-lc-bottom">
            <article className="dashboard-panel dashboard-activity-panel">
              <header className="panel-heading"><div><span className="insight-label">Activity</span><h2>Your practice calendar</h2></div><span className="dashboard-activity-total">{practiceDays.length} active days</span></header>
              <div className="dashboard-heatmap-wrap"><div className="dashboard-heatmap-weekdays"><span>Mon</span><span>Wed</span><span>Fri</span></div><div className="dashboard-heatmap" role="grid" aria-label="Practice activity in the last 12 weeks">{Array.from({ length: 84 }, (_, index) => { const date = new Date(); date.setHours(0,0,0,0); date.setDate(date.getDate() - (83 - index)); const dateKey = localDateKey(date); const didPractice = practiceDaySet.has(dateKey); return <span role="gridcell" key={dateKey} className={didPractice ? "active" : ""} title={`${date.toLocaleDateString(undefined,{month:"short",day:"numeric"})}${didPractice?" · Practice session":" · No practice logged"}`} aria-label={`${date.toLocaleDateString()}${didPractice?", practice session":""}`}/>; })}</div></div>
              <footer className="dashboard-heatmap-footer"><span>{practiceStreak.current > 0 ? <><Flame size={13}/> {practiceStreak.current}-day streak · best {practiceStreak.best} days</> : "Log a solved problem to start your streak"}</span><span>LESS <i/><i/><i className="active"/> MORE</span></footer>
            </article>
            <article className="dashboard-panel dashboard-lld-card"><span className="dashboard-lld-kicker"><Layers3 size={14}/> NEXT CAREER TRACK</span><h2>Design for the<br/><em>senior engineer.</em></h2><p>A visual 12-week LLD roadmap: domain modeling, concurrency, resilience, and senior-level trade-offs.</p><div className="dashboard-lld-steps"><span>01 · MODEL</span><i/><span>02 · SCALE</span><i/><span>03 · LEAD</span></div><button type="button" onClick={() => navigateToView("lld")}>Open LLD roadmap <ArrowRight size={15}/></button></article>
          </section>
          <DashboardHub counts={hubCounts} onOpen={navigateToView} />
        </>
      )}
      {activeView === "roadmap" && lockedFor("roadmap") && (
        <ProductLock
          product={accessPass}
          checking={!unlocks.loaded}
          onOpenStore={() => openCheckout("dsa250")}
          onRecheck={() => void unlocks.refresh()}
          onFreeRail={() => navigateToView("guru")}
        />
      )}
      {activeView === "roadmap" && !lockedFor("roadmap") && (
        <section className="roadmap-card" aria-label="Customized DSA roadmap">
          <header className="roadmap-heading">
            <div className="roadmap-icon"><MapIcon size={18} /></div>
            <div>
              <span className="roadmap-eyebrow">CHOOSE YOUR WINDOW</span>
              <h2>Your DSA roadmap</h2>
              <p>Ten days before an interview, the full ladder, or six months from first principles - the same {problems.length} problems, cut to the time you have.</p>
            </div>
            <button type="button" className="roadmap-buy unlocked" onClick={() => openCheckout("dsa250")}>Unlock everything · {rupees(accessPass.price)} <ArrowRight size={15}/></button>
          </header>
          <StudyPlanner
            startKey={planStart}
            nowKey={todayDateKey}
            solvedNumbers={solvedNumbers}
            statusOf={(number) => progress[number]?.status ?? "Todo"}
            onStatus={setProblemStatus}
            patternStats={patternStats}
          />
        </section>
      )}
      {activeView === "calendar" && (
        <section className="calendar-card" aria-label="Practice activity calendar">
          <header className="calendar-topline">
            <div className="calendar-titlelockup">
              <div className="calendar-icon"><CalendarDays size={18} /></div>
              <div>
                <span className="calendar-eyebrow">YOUR CONSISTENCY</span>
                <h2>Practice rhythm</h2>
                <p>Every focused session adds up.</p>
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
                disabled={isCurrentCalendarMonth}
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
          <div className="calendar-stats" aria-label="Practice streak summary">
            <article className="calendar-stat calendar-stat-streak">
              <span className="calendar-stat-icon"><Flame size={18} /></span>
              <div><span>CURRENT STREAK</span><strong>{practiceStreak.current}<small>{practiceStreak.current === 1 ? "day" : "days"}</small></strong></div>
              <p>{practiceStreak.current > 0 ? "Keep the rhythm going" : "Log a session to begin"}</p>
            </article>
            <article className="calendar-stat">
              <span className="calendar-stat-icon"><Target size={17} /></span>
              <div><span>PERSONAL BEST</span><strong>{practiceStreak.best}<small>{practiceStreak.best === 1 ? "day" : "days"}</small></strong></div>
              <p>Your longest practice run</p>
            </article>
            <article className="calendar-stat">
              <span className="calendar-stat-icon"><Check size={17} /></span>
              <div><span>THIS MONTH</span><strong>{activeDaysThisMonth}<small>{activeDaysThisMonth === 1 ? "day" : "days"}</small></strong></div>
              <p>Days with a practice session</p>
            </article>
          </div>
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
                    {!isFuture && <span className="calendar-day-indicator" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
          <footer className="calendar-footer">
            <div className="calendar-legend">
              <span><i className="calendar-legend-active" aria-hidden="true" /> Practice logged</span>
              <span><i className="calendar-legend-empty" aria-hidden="true" /> No activity</span>
            </div>
            <span className="calendar-streak-summary"><Flame size={14} /> {practiceStreak.current} day streak</span>
            <p className="calendar-selection" role="status">
              {selectedCalendarDate ? (
                <>
                  <strong>{new Date(`${selectedCalendarDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</strong>
                  <span>{practiceDaySet.has(selectedCalendarDate) ? "Practice logged · nice work" : selectedCalendarDate === todayDateKey ? "No practice yet · there’s still time today" : "No practice logged"}</span>
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
              <SignInButton mode="modal" forceRedirectUrl={window.location.href}><button className="primary-button">Sign in</button></SignInButton>
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
              <SignInButton mode="modal" forceRedirectUrl={window.location.href}><button className="primary-button">Sign in</button></SignInButton>
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
      {activeView === "patterns" && lockedFor("patterns") && (
        <ProductLock
          product={accessPass}
          checking={!unlocks.loaded}
          onOpenStore={() => openCheckout("dsa250")}
          onRecheck={() => void unlocks.refresh()}
          onFreeRail={() => navigateToView("guru")}
        />
      )}
      {activeView === "patterns" && !lockedFor("patterns") && <section className="patterns-page">
        <PatternLibrary problems={problems} progress={progress} onPractice={() => navigateToView("problems")} />
      </section>}
      {activeView === "problems" && sheetLocked && (
        <ProductLock
          product={productById("dsa250")!}
          checking={!unlocks.loaded}
          onOpenStore={() => openCheckout("dsa250")}
          onRecheck={() => void unlocks.refresh()}
          onFreeRail={() => navigateToView("guru")}
        />
      )}
      {activeView === "problems" && !sheetLocked && <section className="problem-library-page">
        <div className="problem-library-hero">
          <div className="problem-library-intro">
            <span className="problem-library-eyebrow"><span/> {sheetVoice.eyebrow}</span>
            <h2>{sheetVoice.heroLine1}<br/><em>{sheetVoice.heroLine2}</em></h2>
            <p>{sheetVoice.heroBody(problems.length, topics.length, patterns.length, problems[problems.length - 1]?.week ?? 12)}</p>
            <div className="problem-hero-actions"><button type="button" onClick={() => { setStatus("All status"); setPattern("All patterns"); setDifficulty("All levels"); setCompanyFilter("All companies"); document.querySelector(".problem-library-controls input")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>{sheetVoice.heroOpen} <ArrowRight size={15}/></button><span><Check size={14}/> {sheetVoice.heroSaveNote}</span></div>
          </div>
          <div className="problem-hero-progress"><div className="problem-progress-ring" style={{ "--progress": `${percent}%` } as CSSProperties}><div><strong>{percent}%</strong><span>COMPLETE</span></div></div><span className="problem-progress-caption"><strong>{solved} <small>/ {problems.length}</small></strong> problems solved</span><div className="problem-progress-track"><i style={{ width: `${percent}%` }}/></div><span className="problem-progress-rank"><strong>LEVEL {sheetRank.level}</strong><span>{sheetRank.title}</span><i className="problem-rank-track"><b style={{ width: `${sheetRank.percent}%` }}/></i><em>{sheetRank.toNext ? `${sheetRank.toNext} XP to ${sheetRanks[sheetRank.level]?.title ?? sheetRank.title}` : `${sheetRank.xp} XP - top rank`}</em></span><span className="problem-progress-foot">Every problem makes you sharper.</span><span className="problem-progress-spark">✳</span></div>
        </div>
        <nav className="sheet-learning-links" aria-label="Continue learning">
          <button type="button" className="sheet-learning-link sheet-learning-course" onClick={() => navigateToView("dsa-course")}>
            <span className="sheet-learning-icon"><BookOpen size={17}/></span>
            <span><strong>Learn with the animated DSA course</strong><small>Watch algorithms step by step, then try the code.</small></span>
            <ArrowRight size={16}/>
          </button>
          <button type="button" className="sheet-learning-link sheet-learning-notes" onClick={() => navigateToView("notes")}>
            <span className="sheet-learning-icon"><NotebookPen size={17}/></span>
            <span><strong>Open your personal notes</strong><small>Save insights here or add a note to any problem.</small></span>
            <ArrowRight size={16}/>
          </button>
        </nav>
        <div className="sheet-hausla">
          <span className="sheet-hausla-flame"><Flame size={15}/></span>
          <span className="sheet-hausla-copy"><strong>{hausla.line}</strong><small>{hausla.sub}</small></span>
          <span className="sheet-hausla-count">{solved}<small>/{problems.length}</small></span>
          <button type="button" className="sheet-hausla-next" onClick={focusNextProblem}>Aage kya? <ArrowRight size={14}/></button>
          <span className="sheet-hausla-keys">{sheetVoice.keyboardHint}</span>
        </div>
        <div className="problem-library-stats">
          <div className="problem-stat-card"><span className="problem-stat-icon problem-stat-solved"><Check size={16}/></span><span className="problem-stat-label">{sheetVoice.stats.solved}</span><strong>{solved}<small> / {problems.length}</small></strong><span className="problem-stat-note">{sheetVoice.statsNote.solved}</span></div>
          <div className="problem-stat-card"><span className="problem-stat-icon problem-stat-progress"><Clock3 size={16}/></span><span className="problem-stat-label">{sheetVoice.stats.progress}</span><strong>{inProgress}<small> active</small></strong><span className="problem-stat-note">{sheetVoice.statsNote.progress}</span></div>
          <div className="problem-stat-card"><span className="problem-stat-icon problem-stat-pattern"><Target size={16}/></span><span className="problem-stat-label">{sheetVoice.stats.patterns}</span><strong>{patterns.length}<small> to explore</small></strong><span className="problem-stat-note">{sheetVoice.statsNote.patterns}</span></div>
        </div>
        <DailyTaskRail startKey={planStart} nowKey={todayDateKey} statusOf={(number) => progress[number]?.status ?? "Todo"} onOpen={openDailyTask} onToggleSolved={(problem) => setProblemStatus(problem.number, progress[problem.number]?.status === "Solved" ? "Todo" : "Solved")} onRestart={restartPlan} />
        <StudentRepoCard group={sheetGroup} onImportGit={importFromGit} />
        <div className="problem-library-section-heading"><div><span>{sheetVoice.heading}</span><h3>Agle challenge pe <em>jaari rakho.</em></h3></div><div className="problem-library-heading-actions"><span className="problem-sync-state"><Check size={13}/>{user ? sheetVoice.syncCloud : sheetVoice.syncLocal}</span><button type="button" disabled={pattern === "All patterns"} onClick={() => setPatternTestOpen(pattern)} title={pattern === "All patterns" ? sheetVoice.headingTestIdle : sheetVoice.headingTest(pattern)}>{pattern === "All patterns" ? "4-sawal test" : sheetVoice.headingTest(pattern)} <ArrowRight size={13}/></button></div></div>
        <div className="sheet-browser">
          <aside className="sheet-rail-card">
            <div className="nav nav-pills sheet-mode-switch" role="tablist" aria-label="Browse the sheet by">
              {(["week", "topic", "pattern"] as SheetGroupMode[]).map((mode) => <button key={mode} type="button" role="tab" aria-selected={sheetMode === mode} className={`nav-link${sheetMode === mode ? " active" : ""}`} onClick={() => { setSheetMode(mode); setSheetGroup(""); }}>{sheetModeVoice[mode].label}<small>{railCounts[mode]} {sheetModeVoice[mode].sub}{railCounts[mode] === 1 ? "" : "s"}</small></button>)}
            </div>
            <nav className="sheet-rail" aria-label={`${sheetModeLabels[sheetMode]} rail`}>
              <button type="button" className={`sheet-rail-item${sheetGroup === "" ? " active" : ""}`} onClick={() => setSheetGroup("")}>
                <span className="sheet-rail-name">{sheetVoice.railAll}</span>
                <span className="sheet-rail-meta">{sheetVoice.railAllMeta(problems.length, patterns.length, topics.length)}</span>
                <span className="progress sheet-rail-progress" role="progressbar" aria-label="Whole sheet progress" aria-valuenow={solved} aria-valuemin={0} aria-valuemax={problems.length}><span className="progress-bar" style={{ width: `${percent}%` }}/></span>
                <span className="badge sheet-rail-count">{solved}/{problems.length}</span>
              </button>
              {sheetGroups.map((group) => <button key={group.key} type="button" className={`sheet-rail-item${sheetGroup === group.key ? " active" : ""}`} onClick={() => setSheetGroup(sheetGroup === group.key ? "" : group.key)}>
                <span className="sheet-rail-name">{group.key}</span>
                <span className="sheet-rail-meta">{group.hint}</span>
                <span className="progress sheet-rail-progress" role="progressbar" aria-label={`${group.key} progress`} aria-valuenow={group.solved} aria-valuemin={0} aria-valuemax={group.total}><span className="progress-bar" style={{ width: `${Math.round((group.solved / group.total) * 100)}%` }}/></span>
                <span className="badge sheet-rail-count">{group.solved}/{group.total}</span>
                <span className="sheet-rail-open">{group.open} open</span>
              </button>)}
            </nav>
            <p className="sheet-rail-foot">{sheetGroup ? <><span>{sheetVoice.railFilteredTo}: <strong>{sheetGroup}</strong></span><button type="button" className="sheet-rail-clear" onClick={() => setSheetGroup("")}>{sheetVoice.railClear(problems.length)}</button></> : <span>{sheetVoice.railPick(sheetMode)}</span>}</p>
          </aside>
        <div className="problem-learning-layout">
        <div className="problem-library-panel">
          <div className="problem-library-controls">
            <label className="problem-search"><Search size={17}/><input className="form-control" placeholder={sheetVoice.searchHint} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search problems, patterns or topics"/>{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}</label>
            <label className="problem-filter-select"><span>{sheetVoice.filters.pattern}</span><select className="form-select" value={pattern} onChange={(event) => setPattern(event.target.value)}><option value="All patterns">{sheetVoice.filterAll.pattern}</option>{patterns.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14}/></label>
            <label className="problem-filter-select"><span>{sheetVoice.filters.difficulty}</span><select className="form-select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="All levels">{sheetVoice.filterAll.difficulty}</option><option>Easy</option><option>Medium</option><option>Hard</option></select><ChevronDown size={14}/></label>
            <label className="problem-filter-select"><span>{sheetVoice.filters.status}</span><select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="All status">{sheetVoice.filterAll.status}</option><option>Todo</option><option>In progress</option><option>Solved</option></select><ChevronDown size={14}/></label>
            <label className="problem-filter-select"><span>COMPANY</span><select className="form-select" value={companyFilter} disabled={companyTagsLoading || (!Object.keys(companyInterviewTags).length && Boolean(companyTagsError))} onChange={(event) => setCompanyFilter(event.target.value as "All companies" | CompanyInterviewTrack)} aria-label="Filter by community-reported interview company"><option>All companies</option>{companyInterviewTracks.map((company) => <option key={company} disabled={unavailableCompanyTags.includes(company)}>{company}{unavailableCompanyTags.includes(company) ? " (unavailable)" : ""}</option>)}</select><ChevronDown size={14}/></label>
          </div>
          {companyTagsError && <p className="problem-company-source-error" role="status">{companyTagsError} The problem library still works without these tags.<button type="button" onClick={() => setCompanyTagsReload((reload) => reload + 1)}>Retry</button></p>}
          {sheetSearch ? (
            <div className="sheet-recognition" role="status" aria-live="polite">
              <span className="sheet-recognition-lead"><Sparkles size={13}/> Reading “{sheetSearch.raw}”</span>
              {recognition?.patterns.map((name) => <button key={name} type="button" className="sheet-chip" onClick={() => { setPattern(name); setStatus("All status"); }}>{name}<small>{problems.filter((problem) => problem.pattern === name).length}</small></button>)}
              {recognition?.difficulty && <button type="button" className="sheet-chip sheet-chip-level" onClick={() => setDifficulty(recognition.difficulty ?? "All levels")}>{recognition.difficulty}<small>level</small></button>}
              {recognition?.status && <button type="button" className="sheet-chip sheet-chip-state" onClick={() => setStatus(recognition.status ?? "All status")}>{recognition.status}<small>status</small></button>}
              {recognition && !recognition.matched && <span className="sheet-recognition-plain">matched by title</span>}
              <span className="sheet-recognition-tally"><strong>{visibleProblems.length}</strong> screen pe · {visibleSolved} solved · {Math.max(visibleProblems.length - visibleSolved, 0)} baaki</span>
            </div>
          ) : (
            <div className="sheet-recognition sheet-recognition-hint">
              <span className="sheet-recognition-lead"><Search size={13}/> {sheetVoice.searchLead}</span>
              {sheetVoice.searchChips.map((sample) => <button key={sample} type="button" className="sheet-chip sheet-chip-ghost" onClick={() => setQuery(sample)}>{sample}</button>)}
              <span className="sheet-recognition-tally">{sheetVoice.searchFoot}</span>
            </div>
          )}
          <div className="problem-list-toolbar"><span><strong>{visibleProblems.length}</strong> {visibleProblems.length === 1 ? "problem" : "problems"} <i/> {sheetVoice.toolbar(sheetGroup, sheetMode)}</span><span><span className="problem-live-dot"/>{sheetVoice.verified} · <a href="https://github.com/neetcode-gh/leetcode" target="_blank" rel="noreferrer">Question index</a> · <a href="https://github.com/snehasishroy/leetcode-companywise-interview-questions" target="_blank" rel="noreferrer">Company-tag data</a></span></div>
          <div className="problem-list" ref={problemLibraryRef}>{visibleProblems.length ? sheetSections.map((section) => {
            const collapsed = collapsedGroups[section.key] === true;
            const sectionSolved = section.rows.filter((problem) => progress[problem.number]?.status === "Solved").length;
            const sectionPercent = Math.round((sectionSolved / section.rows.length) * 100);
            return <section className={`sheet-section${collapsed ? " collapsed" : ""}`} key={section.key}>
              <button type="button" className="sheet-section-head" aria-expanded={!collapsed} onClick={() => setCollapsedGroups((state) => ({ ...state, [section.key]: !collapsed }))}>
                <span className="sheet-section-caret">{collapsed ? <ChevronRight size={15}/> : <ChevronDown size={15}/>}</span>
                <span className="sheet-section-name"><strong>{section.key}</strong><small>{sheetGroup ? `${sheetGroup} → ` : ""}{sheetGroupHint(section.rows, section.mode)}</small></span>
                <span className="progress sheet-section-progress" role="progressbar" aria-label={`${section.key} solved`} aria-valuenow={sectionSolved} aria-valuemin={0} aria-valuemax={section.rows.length}><span className="progress-bar" style={{ width: `${sectionPercent}%` }}/></span>
                <span className="badge sheet-section-count">{sectionSolved}/{section.rows.length}</span>
              </button>
              {!collapsed && <div className="sheet-section-body">{(sectionShown[section.key] || section.rows.length <= ROWS_PER_SECTION ? section.rows : section.rows.slice(0, ROWS_PER_SECTION)).map((problem) => {
            const current = progress[problem.number]?.status ?? "Todo";
            const statusClass = current.toLowerCase().replace(" ", "-");
            const savedNote = progress[problem.number]?.notes ?? "";
            const noteOpen = noteFor === problem.number;
            const taggedCompanies = companyInterviewTracks.filter((company) => companyInterviewTags[company]?.includes(problem.slug));
            return <article className={`problem-list-row library-row tier-${problem.tier}${savedNote ? " has-note" : ""}${cursorNumber === problem.number ? " cursor" : ""}${studyNumber === problem.number ? " studying" : ""}`} data-row={problem.number} id={problem.slug} key={problem.number} onClick={(event) => { if ((event.target as HTMLElement).closest("a,select,button,textarea")) return; setCursorNumber(problem.number); setStudyNumber(studyNumber === problem.number ? null : problem.number); }}><span className="problem-row-number">{String(problem.number).padStart(3,"0")}</span><button type="button" className={`problem-row-state ${statusClass}`} title={current === "Solved" ? sheetVoice.undoSolve : sheetVoice.solveNow} aria-label={`${current === "Solved" ? "Undo solved" : "Mark solved"} for ${problem.title}`} onClick={() => setProblemStatus(problem.number, current === "Solved" ? "Todo" : "Solved")}><span/></button><div className="problem-row-title"><a href={problem.link} target="_blank" rel="noreferrer" aria-label={`${problem.title} on LeetCode`}><span className="leetcode-mark" aria-hidden="true">LC</span>{problem.title}<ExternalLink size={13}/></a>{problem.premium && <a className="problem-free-mirror" href={problem.freeLink} target="_blank" rel="noreferrer">free version</a>}<span>{problem.topic} · week {problem.week}</span>{taggedCompanies.length > 0 && <div className="problem-row-company-tags" aria-label={`Community interview tags: ${taggedCompanies.join(", ")}`}>{taggedCompanies.map((company) => <span key={company}>{company}</span>)}</div>}<button type="button" className={`problem-approach-toggle${studyNumber === problem.number ? " open" : ""}`} aria-expanded={studyNumber === problem.number} onClick={() => setStudyNumber(studyNumber === problem.number ? null : problem.number)}>{studyNumber === problem.number ? sheetVoice.studying : sheetVoice.approach}</button><button type="button" className={`problem-note-toggle${savedNote ? " filled" : ""}${noteOpen ? " open" : ""}`} aria-expanded={noteOpen} aria-label={`${savedNote ? "Edit" : "Add"} your note for ${problem.title}`} onClick={() => { const next = noteOpen ? null : problem.number; setNoteFor(next); setNoteDraft(next === null ? "" : savedNote); setNoteSavedAt(0); }}>{savedNote ? "✎" : "+"}</button></div><span className="pattern-pill problem-row-pattern">{problem.pattern}</span><span className={`badge problem-row-tier tier-${problem.tier}`}>{tierLabels[problem.tier]}</span><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span><label className={`problem-row-status ${statusClass}`}><select aria-label={`Status for ${problem.title}`} value={current} onChange={(event) => setProblemStatus(problem.number, event.target.value as Status)}><option>Todo</option><option>In progress</option><option>Solved</option></select><ChevronDown size={12}/></label>{noteOpen && <div className="problem-note-panel"><textarea className="problem-note-input" rows={3} placeholder={sheetVoice.notePlaceholder(problem.title)} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} onBlur={() => { if (savedNote !== noteDraft.trim()) setProblemNote(problem.number, noteDraft.trim()); }} aria-label={`Note for ${problem.title}`}/><div className="problem-note-foot"><span className="problem-note-count">{noteWordCount} {noteWordCount === 1 ? "word" : "words"}</span><span className="problem-note-praise">{sheetVoice.notePraise(noteWordCount)}</span><span className="problem-note-saved">{noteSavedAt ? `Saved ${new Date(noteSavedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Box se bahar jate hi save ho jayega"}</span><button type="button" onClick={() => setProblemNote(problem.number, noteDraft.trim())}>{sheetVoice.noteSave}</button><button type="button" className="problem-note-close" onClick={() => { setNoteFor(null); setNoteDraft(""); }}>{sheetVoice.noteClose}</button></div></div>}</article>;
                })}{!sectionShown[section.key] && section.rows.length > ROWS_PER_SECTION && <button type="button" className="sheet-section-more" onClick={() => setSectionShown((state) => ({ ...state, [section.key]: true }))}>{sheetVoice.showAll(section.rows.length, section.key)} <ChevronDown size={13}/></button>}</div>}</section>;
          }) : <div className="problem-library-empty"><Search size={21}/><strong>{sheetVoice.empty}</strong><span>{sheetVoice.emptyFoot}</span><button type="button" onClick={() => {setQuery("");setPattern("All patterns");setDifficulty("All levels");setStatus("All status");setCompanyFilter("All companies");setSheetGroup("");}}>{sheetVoice.clearFilters}</button></div>}</div>
          <div className="problem-library-footer"><span><Target size={14}/> {visibleProblems.length} matching problem dikha rahe hain</span><span><Check size={14}/>{user ? sheetVoice.syncCloud : sheetVoice.syncLocal}</span></div>
        </div>
        {studyProblem && <ProblemStudyPanel problem={studyProblem} status={progress[studyProblem.number]?.status ?? "Todo"} onClose={() => setStudyNumber(null)} onPractice={(item) => { setEditorProblem(item.number); navigateToView("dsa-ide"); }} />}
        </div>
        </div>
        {sheetReward && <div className={`sheet-reward${sheetReward.milestone ? " milestone" : ""}`} key={sheetReward.id} role="status" aria-live="polite"><span className="sheet-reward-icon"><Sparkles size={18}/></span><div className="sheet-reward-copy"><strong>{sheetReward.headline}</strong><span>{sheetReward.detail}</span></div><em className="sheet-reward-xp">+{sheetReward.xp} XP</em><button type="button" className="sheet-reward-close" onClick={() => setSheetReward(null)} aria-label="Dismiss"><X size={14}/></button></div>}
      </section>}
      {patternTestOpen && <PatternTest pattern={patternTestOpen} onClose={() => setPatternTestOpen(null)} />}

      <StudentFooter compact />
      </div>{/* /main-content */}
    </main>
  );
}

export default App;
