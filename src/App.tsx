import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
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
  Play,
  Pause,
  RotateCcw,
  CodeXml,
  Palette,
  BriefcaseBusiness,
  MapPin,
  Bookmark,
  Building2,
  SlidersHorizontal,
  Layers3,
  Lock,
  MousePointer2,
  Trash2,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import adityaPortrait from "./assets/aditya-bakshi.jpg";
import { refreshRealtimeAuth, setClerkTokenGetter, supabase } from "./lib/supabase";
import DsaIde from "./DsaIde";
import DsaCourseStudio from "./DsaCourseStudio";
import RoadmapBoard from "./RoadmapBoard";
import MentorshipPayments from "./MentorshipPayments";
import MenteeSpace from "./MenteeSpace";
import CompanyProblems from "./CompanyProblems";
import PatternTest from "./PatternTest";
import DsaTutor from "./DsaTutor";

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
type WorkspaceView = "home" | "dashboard" | "problems" | "companies" | "dsa-ide" | "dsa-course" | "tutor" | "calendar" | "roadmap" | "lld" | "whiteboard" | "chat" | "notes" | "calls" | "articles" | "jobs" | "mentorship" | "mentees";
type WorkspaceTheme = "light" | "midnight" | "forest";

const viewPaths: Record<WorkspaceView, string> = {
  home: "/",
  dashboard: "/dashboard",
  problems: "/problems",
  companies: "/companies",
  "dsa-ide": "/ide/dsa",
  "dsa-course": "/learn/dsa",
  tutor: "/tutor",
  calendar: "/calendar",
  roadmap: "/roadmap",
  lld: "/roadmap/lld",
  whiteboard: "/whiteboard/lld",
  chat: "/chat",
  notes: "/notes",
  calls: "/calls",
  articles: "/articles",
  jobs: "/jobs",
  mentorship: "/mentorship",
  mentees: "/mentees",
};

function viewFromLocation(): WorkspaceView {
  const params = new URLSearchParams(window.location.search);
  if (params.has("room") || params.has("schedule")) return "calls";
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  if (path === "/artcles") return "articles";
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
  onNavigate: (view: WorkspaceView, plan?: string) => void;
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
          engine.from(".home-feature-card", {
            y: 24,
            opacity: 0,
            duration: 0.6,
            stagger: 0.09,
            ease: "power2.out",
            scrollTrigger: { trigger: ".home-features", start: "top 78%", once: true },
          });
          engine.from(".home-progress-fill", {
            scaleX: 0,
            duration: 1.1,
            ease: "power2.out",
            transformOrigin: "left center",
            scrollTrigger: { trigger: ".home-progress", start: "top 82%", once: true },
          });
          engine.to(".home-lab", {
            y: -18,
            ease: "none",
            scrollTrigger: { trigger: ".home-hero", start: "top top", end: "bottom top", scrub: 0.7 },
          });
          engine.to(".home-mark-orbit", { rotate: 360, duration: 32, ease: "none", repeat: -1 });
        });
        motion.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
          const cards = Array.from(pageRef.current?.querySelectorAll<HTMLElement>(".home-feature-card") ?? []);
          const cleanups = cards.map((card) => {
            const tiltX = engine.quickTo(card, "--tilt-x", { duration: 0.32, ease: "power2.out" });
            const tiltY = engine.quickTo(card, "--tilt-y", { duration: 0.32, ease: "power2.out" });
            const onMove = (event: PointerEvent) => {
              const bounds = card.getBoundingClientRect();
              tiltX(((event.clientX - bounds.left) / bounds.width - 0.5) * 7);
              tiltY((0.5 - (event.clientY - bounds.top) / bounds.height) * 7);
            };
            const onLeave = () => { tiltX(0); tiltY(0); };
            card.addEventListener("pointermove", onMove);
            card.addEventListener("pointerleave", onLeave);
            return () => {
              card.removeEventListener("pointermove", onMove);
              card.removeEventListener("pointerleave", onLeave);
            };
          });
          return () => cleanups.forEach((cleanup) => cleanup());
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
              <button className="home-primary" type="button" onClick={() => onNavigate("dsa-ide")}>Open Deva editor <ArrowRight size={16} /></button>
              <button className="home-secondary" type="button" onClick={() => onNavigate("problems")}>Browse problems</button>
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

      <section className="home-features" aria-labelledby="home-features-title">
        <div className="home-section-heading">
          <div><span className="home-section-kicker">TOOLS FOR EVERY STUDY SESSION</span><h2 id="home-features-title">Everything you need to <em>make progress.</em></h2></div>
          <p>Choose a starting point. Your tools and progress stay together as you learn.</p>
        </div>
        <div className="home-feature-grid">
          <button className="home-feature-card" type="button" onClick={() => onNavigate("problems")}>
            <span className="home-feature-icon"><Rows3 size={19} /></span><span className="home-feature-index">01 / PRACTICE</span><strong>Problem library</strong><span className="home-feature-description">A curated set of coding problems organized by pattern and difficulty.</span><span className="home-feature-link">Browse problems <ArrowRight size={15} /></span>
          </button>
          <button className="home-feature-card" type="button" onClick={() => onNavigate("roadmap")}>
            <span className="home-feature-icon"><MapIcon size={19} /></span><span className="home-feature-index">02 / PLAN</span><strong>Adaptive roadmap</strong><span className="home-feature-description">Shape a weekly study plan around your pace and focus areas.</span><span className="home-feature-link">Build your roadmap <ArrowRight size={15} /></span>
          </button>
          <button className="home-feature-card" type="button" onClick={() => onNavigate("dashboard")}>
            <span className="home-feature-icon"><Target size={19} /></span><span className="home-feature-index">03 / PROGRESS</span><strong>Progress dashboard</strong><span className="home-feature-description">Track solved problems, patterns covered, and your daily streak.</span><span className="home-feature-link">View progress <ArrowRight size={15} /></span>
          </button>
          <button className="home-feature-card" type="button" onClick={() => onNavigate("calendar")}>
            <span className="home-feature-icon"><CalendarDays size={19} /></span><span className="home-feature-index">04 / CONSISTENCY</span><strong>Practice calendar</strong><span className="home-feature-description">See your practice history and keep a steady learning rhythm.</span><span className="home-feature-link">Open calendar <ArrowRight size={15} /></span>
          </button>
          <button className="home-feature-card" type="button" onClick={() => onNavigate("chat")}>
            <span className="home-feature-icon"><UsersRound size={19} /></span><span className="home-feature-index">05 / TOGETHER</span><strong>Study with peers</strong><span className="home-feature-description">Talk through tricky problems with your study group.</span><span className="home-feature-link">Join the group <ArrowRight size={15} /></span>
          </button>
          <button className="home-feature-card" type="button" onClick={() => onNavigate("notes")}>
            <span className="home-feature-icon"><NotebookPen size={19} /></span><span className="home-feature-index">06 / REFLECT</span><strong>Personal notes</strong><span className="home-feature-description">Save useful insights and keep your problem-solving notes in one place.</span><span className="home-feature-link">Open your notebook <ArrowRight size={15} /></span>
          </button>
        </div>
      </section>

      <section className="home-creator" aria-labelledby="home-creator-title">
        <div className="home-creator-photo-wrap">
          <img className="home-creator-photo" src={adityaPortrait} alt="Aditya Bakshi, creator of CodexSheet" />
          <span className="home-creator-photo-caption"><span className="home-success-dot" /> BUILDING CODEXSHEET</span>
        </div>
        <div className="home-creator-copy">
          <span className="home-section-kicker">A NOTE FROM THE CREATOR</span>
          <h2 id="home-creator-title">Hey, I’m Aditya.<br /><em>I build with purpose.</em></h2>
          <p>I’m a full-stack developer, competitive programmer, and the creator of CodexSheet. I love turning ideas into real-world products and solving problems through code.</p>
          <p>I’m building CodexSheet to make learning data structures and algorithms more structured, practical, and accessible for students preparing for technical interviews.</p>
          <blockquote>“The challenges we face can inspire us to build solutions that help others.”</blockquote>
          <p>I’m constantly learning, building, and sharing my journey as I work toward products that make a real difference in the developer community.</p>
          <div className="home-creator-tags"><span>Full-Stack Development</span><span>Competitive Programming</span><span>Learning in Public</span></div>
          <a className="home-creator-link" href="https://www.linkedin.com/in/aditya-bakshi-11923dd/?isSelfProfile=true" target="_blank" rel="noreferrer">Connect on LinkedIn <ExternalLink size={14} /></a>
        </div>
      </section>

      <section className="home-services" aria-labelledby="home-services-title">
        <div className="home-section-heading">
          <div><span className="home-section-kicker">LEARN WITH ADITYA BAKSHI</span><h2 id="home-services-title">Get help with <em>your next step.</em></h2></div>
          <p>Mentorship calls, long-term plans and the full-roadmap unlock — paid straight to Paytm, no third-party store.</p>
        </div>
        <div className="home-offer-grid" aria-label="Featured DSA offers">
          <article className="home-offer-card home-offer-mentorship">
            <div className="home-offer-top"><span className="home-offer-icon">1:1</span><span className="home-offer-price">₹19</span></div>
            <span className="home-offer-label">LEARN WITH ADITYA</span>
            <h3>1:1 mentorship &amp; long-term mentoring</h3>
            <p>One 1:1 call for ₹19, or weekly sessions with DMs anytime — ₹100 for 3 months, ₹499 for 6 months. Pay on Paytm.</p>
            <a href="/mentorship" onClick={(event) => { event.preventDefault(); onNavigate("mentorship"); }}>See mentorship plans <ArrowRight size={15}/></a>
          </article>
          <article className="home-offer-card home-offer-roadmap">
            <div className="home-offer-top"><span className="home-offer-icon">250</span><span className="home-offer-price">₹19</span></div>
            <span className="home-offer-label">PATTERN-WISE PRACTICE</span>
            <h3>250-pattern DSA roadmap</h3>
            <p>The first 50 problems are free; confirming your ₹19 Paytm payment unlocks all 250 patterns in the workspace — no files, no email attachments.</p>
            <a href="/mentorship" onClick={(event) => { event.preventDefault(); onNavigate("mentorship", "roadmap"); }}>Get the roadmap <ArrowRight size={15}/></a>
          </article>
        </div>
      </section>

      <section className="home-portfolio" aria-labelledby="home-portfolio-title">
        <div className="home-section-heading">
          <div><span className="home-section-kicker">PORTFOLIO</span><h2 id="home-portfolio-title">Built for <em>steady progress.</em></h2></div>
          <p>A closer look at the learning tools and resources in the Codexsheet workspace.</p>
        </div>
        <div className="home-portfolio-grid">
          <a className="home-portfolio-card portfolio-featured" href="/problems">
            <span className="home-portfolio-label">01 · PRACTICE PLATFORM</span><span className="home-portfolio-art portfolio-art-sheet"><Rows3 size={31}/><i>250</i></span>
            <strong>Codexsheet DSA Practice</strong><span>Pattern based problem practice with progress tracking, notes, and a focused study flow.</span><span className="home-service-link">Explore the problem sheet <ArrowRight size={14}/></span>
          </a>
          <a className="home-portfolio-card" href="/roadmap">
            <span className="home-portfolio-label">02 · LEARNING PLAN</span><span className="home-portfolio-art portfolio-art-roadmap"><MapIcon size={30}/><span><i/><i/><i/></span></span>
            <strong>Adaptive DSA Roadmap</strong><span>A weekly plan shaped around your timeline, practice pace, and focus patterns.</span><span className="home-service-link">Build a roadmap <ArrowRight size={14}/></span>
          </a>
          <a className="home-portfolio-card" href="/articles">
            <span className="home-portfolio-label">03 · EDITORIAL</span><span className="home-portfolio-art portfolio-art-journal"><BookOpen size={30}/><span>FIELD<br/>NOTES</span></span>
            <strong>DSA Field Notes</strong><span>Short visual explainers for the ideas behind common coding interview patterns.</span><span className="home-service-link">Read the journal <ArrowRight size={14}/></span>
          </a>
        </div>
      </section>

      <section className="home-progress" aria-label="Your current study progress">
        <div className="home-progress-copy"><span className="home-section-kicker">YOUR WORKSPACE IS READY</span><h2>Pick up where <em>you are.</em></h2><p>Your practice stays yours. Sign in to sync progress and study with your peers.</p><button className="home-progress-link" type="button" onClick={() => onNavigate("dashboard")}>Open your dashboard <ArrowRight size={15} /></button></div>
        <div className="home-progress-stats"><div><span>PROBLEMS SOLVED</span><strong>{solved}<small> / 250</small></strong></div><div><span>IN PROGRESS</span><strong>{inProgress}</strong></div><div><span>DAY STREAK</span><strong>{streak}</strong></div><div className="home-progress-bar" aria-label={`${percent}% of problems solved`}><i className="home-progress-fill" style={{ width: `${percent}%` }} /></div>
          <div className="home-pattern-list">{patterns.slice(0, 3).map((item) => <span key={item.name}>{item.name}<small>{item.completed}/{item.total}</small></span>)}</div>
        </div>
      </section>
      <footer className="home-footer"><span>codexsheet</span><span>One pattern. One problem. One step forward.</span><nav className="home-social-links" aria-label="Social profiles"><a href="https://www.instagram.com/adityabakshi10/" target="_blank" rel="noreferrer" aria-label="Instagram: adityabakshi10"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg> adityabakshi10</a><a href="https://www.linkedin.com/in/aditya-bakshi-11923dd/?isSelfProfile=true" target="_blank" rel="noreferrer" aria-label="Aditya Bakshi on LinkedIn"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M5.2 3.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.4 9.5h3.7v11H3.4v-11Zm6 0h3.5V11h.1c.5-.9 1.7-1.9 3.5-1.9 3.8 0 4.5 2.4 4.5 5.5v5.9h-3.7v-5.2c0-1.2 0-2.8-1.8-2.8s-2.1 1.3-2.1 2.7v5.3H9.4v-11Z"/></svg> LinkedIn</a></nav><button type="button" onClick={() => onNavigate("problems")}>Go to the problem sheet <ArrowRight size={14} /></button></footer>
    </main>
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

const jobListings = [
  { id: 1, title: "Frontend Engineer, New Grad", company: "Stripe", location: "Bengaluru, India", mode: "Hybrid", type: "Full-time", level: "Entry level", salary: "₹18L – ₹28L", posted: "2 days ago", tags: ["React", "TypeScript", "Design systems"], color: "#635bff" },
  { id: 2, title: "Software Engineer I", company: "Razorpay", location: "Bengaluru, India", mode: "On-site", type: "Full-time", level: "Entry level", salary: "₹14L – ₹22L", posted: "1 day ago", tags: ["Java", "Distributed systems", "APIs"], color: "#168a68" },
  { id: 3, title: "Associate Software Engineer", company: "Atlassian", location: "Remote · India", mode: "Remote", type: "Full-time", level: "Entry level", salary: "₹16L – ₹25L", posted: "3 days ago", tags: ["JavaScript", "Problem solving", "Cloud"], color: "#1868db" },
  { id: 4, title: "Product Engineer Intern", company: "Postman", location: "Bengaluru, India", mode: "Hybrid", type: "Internship", level: "Internship", salary: "₹50K – ₹80K / mo", posted: "5 days ago", tags: ["Node.js", "React", "Open source"], color: "#ff6c37" },
  { id: 5, title: "Software Development Engineer", company: "PhonePe", location: "Pune, India", mode: "Hybrid", type: "Full-time", level: "Entry level", salary: "₹15L – ₹24L", posted: "1 week ago", tags: ["Kotlin", "Backend", "Algorithms"], color: "#5f259f" },
];

function JobsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("Any work mode");
  const [jobType, setJobType] = useState("Any job type");
  const [saved, setSaved] = useState<number[]>([]);
  const visibleJobs = jobListings.filter((job) => {
    const text = `${job.title} ${job.company} ${job.tags.join(" ")}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && job.location.toLowerCase().includes(location.trim().toLowerCase()) && (workMode === "Any work mode" || job.mode === workMode) && (jobType === "Any job type" || job.type === jobType);
  });
  return <main className="jobs-page">
    <section className="jobs-hero">
      <div className="jobs-hero-copy"><span className="jobs-kicker"><BriefcaseBusiness size={14}/> THE NEXT CHAPTER</span><h2>Find work that<br/><em>moves you forward.</em></h2><p>Explore early career roles from teams building products people love. Your next opportunity starts with one good search.</p><div className="jobs-hero-meta"><span><i/> CURATED FOR DEVELOPERS</span><span>OPPORTUNITY BOARD · 2026</span></div></div>
      <div className="jobs-hero-art" aria-hidden="true"><div className="jobs-orbit jobs-orbit-one"/><div className="jobs-orbit jobs-orbit-two"/><div className="jobs-art-card"><span className="jobs-art-icon"><BriefcaseBusiness size={20}/></span><span>YOUR NEXT MOVE</span><strong>Good things<br/>are in progress.</strong><div><i/><i/><i/></div></div><span className="jobs-art-star">✳</span><span className="jobs-art-plus">＋</span></div>
    </section>
    <section className="jobs-board">
      <div className="jobs-board-heading"><div><span className="jobs-kicker">OPPORTUNITY BOARD</span><h3>Make your next move.</h3><p>Roles worth a closer look, gathered in one place.</p></div><span className="jobs-live-count"><i/>{jobListings.length} OPEN ROLES</span></div>
      <div className="jobs-search-panel"><label className="jobs-search-field"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Role, company, or skill" aria-label="Search roles, companies, or skills"/></label><label className="jobs-search-field"><MapPin size={17}/><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or remote" aria-label="Filter by location"/></label><label className="jobs-select-field"><SlidersHorizontal size={16}/><select value={workMode} onChange={(event) => setWorkMode(event.target.value)} aria-label="Filter by work mode"><option>Any work mode</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label><label className="jobs-select-field"><select value={jobType} onChange={(event) => setJobType(event.target.value)} aria-label="Filter by job type"><option>Any job type</option><option>Full-time</option><option>Internship</option></select><ChevronDown size={15}/></label><button className="jobs-search-button" type="button" onClick={() => {}}>Search <ArrowRight size={15}/></button></div>
      <div className="jobs-list-head"><span>{visibleJobs.length} {visibleJobs.length === 1 ? "ROLE" : "ROLES"} TO EXPLORE</span><span>SORTED BY RELEVANCE <ChevronDown size={13}/></span></div>
      {visibleJobs.length ? <div className="jobs-list">{visibleJobs.map((job, index) => <article className="job-card" key={job.id}><span className="job-index">{String(index + 1).padStart(2,"0")}</span><div className="job-company-mark" style={{ "--company-color": job.color } as CSSProperties}><Building2 size={20}/></div><div className="job-main"><div className="job-title-row"><h4>{job.title}</h4><span className="job-level">{job.level}</span></div><div className="job-company-line"><strong>{job.company}</strong><i/> <span><MapPin size={13}/>{job.location}</span><i/> <span>{job.mode}</span></div><div className="job-tags">{job.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="job-side"><span className="job-salary">{job.salary}</span><span className="job-posted">Posted {job.posted}</span><div className="job-actions"><button type="button" className={`job-save ${saved.includes(job.id) ? "saved" : ""}`} onClick={() => setSaved((current) => current.includes(job.id) ? current.filter((id) => id !== job.id) : [...current, job.id])} aria-label={saved.includes(job.id) ? `Unsave ${job.title}` : `Save ${job.title}`}><Bookmark size={15}/></button><a href={`https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} careers`)}`} target="_blank" rel="noreferrer">View role <ArrowRight size={14}/></a></div></div></article>)}</div> : <div className="jobs-empty"><Search size={20}/><strong>No roles match those filters</strong><span>Try a broader search or clear your filters.</span><button type="button" onClick={() => {setQuery("");setLocation("");setWorkMode("Any work mode");setJobType("Any job type");}}>Clear filters</button></div>}
      <div className="jobs-note"><span>✳</span><p><strong>Good work takes many forms.</strong> Keep building your skills while you look — every practice session moves you closer.</p><span>CODEXSHEET · CAREER NOTES</span></div>
    </section>
  </main>;
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

function ArticlesPage() {
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
    <section className="articles-hero editorial-hero"><div className="articles-hero-copy"><span className="articles-kicker"><BookOpen size={14}/> THE CODEXSHEET JOURNAL</span><h2>Learn the patterns<br/><em>behind the problems.</em></h2><p>Clear explanations for the ideas that show up again and again in coding interviews.</p><div className="editorial-hero-meta"><span>DSA FIELD NOTES</span><i/><span>{String(dsaArticles.length).padStart(2,"0")} SHORT READS</span></div></div><div className="editorial-hero-index"><span>COLLECTION</span><strong>01<span> / </span>{String(dsaArticles.length).padStart(2,"0")}</strong><p>Foundations<br/>to problem solving</p><div className="editorial-index-line"/></div><DsaOverviewLoop /></section>
    <section className="articles-library"><div className="editorial-library-head"><div><span className="articles-kicker">THE LIBRARY</span><h3>Read. Understand. <em>Apply.</em></h3></div><label className="article-search"><Search size={15}/><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Find a concept" aria-label="Search DSA articles"/>{searchTerm && <button type="button" onClick={() => setSearchTerm("")} aria-label="Clear search">×</button>}</label></div><div className="article-filters" aria-label="Filter articles by topic">{categories.map((category) => <button key={category} type="button" className={selected === category ? "active" : ""} onClick={() => setSelected(category)}>{category}</button>)}</div>{featuredArticle ? <div className="editorial-reading-layout"><div className="editorial-main-column"><button className="featured-article" type="button" onClick={() => setOpenArticle(featuredArticle)}><span className="featured-label">{selected === "All concepts" ? "EDITOR’S PICK" : "FROM THIS TOPIC"}<ArrowRight size={14}/></span><span className="featured-category">{featuredArticle.category} <i/> {featuredArticle.read.toUpperCase()}</span><strong>{featuredArticle.title}</strong><p>{featuredArticle.summary}</p><span className="featured-link">Read the article <ArrowRight size={15}/></span><span className="featured-mark">{String(dsaArticles.indexOf(featuredArticle) + 1).padStart(2,"0")}</span></button><div className="article-list-heading"><span>MORE TO EXPLORE</span><span>{String(otherArticles.length).padStart(2,"0")} ARTICLES</span></div><div className="editorial-article-list">{otherArticles.map((article) => <button className="article-row" type="button" key={article.title} onClick={() => setOpenArticle(article)}><span className="article-row-number">{String(dsaArticles.indexOf(article) + 1).padStart(2,"0")}</span><span className="article-row-copy"><small>{article.category}</small><strong>{article.title}</strong><span>{article.summary}</span></span><span className="article-row-time">{article.read}<ArrowRight size={15}/></span></button>)}</div></div><aside className="editorial-aside"><span className="aside-kicker">A GOOD WAY IN</span><h4>Build your<br/>mental model.</h4><p>Start with the shape of the problem. Then choose a structure or pattern that makes the work simpler.</p><div className="aside-steps"><span><i>01</i> Understand the input</span><span><i>02</i> Find the repeated work</span><span><i>03</i> Choose a pattern</span></div><div className="aside-note"><Code2 size={15}/> Concepts are easier to remember when you can explain the tradeoff.</div><span className="aside-count">{String(visible.length).padStart(2,"0")} MATCHING READS</span></aside></div> : <div className="articles-empty"><Search size={20}/><strong>No concepts found</strong><span>Try another phrase or choose a different topic.</span><button type="button" onClick={() => { setSearchTerm(""); setSelected("All concepts"); }}>Clear filters</button></div>}</section>
    {openArticle && activeLesson && <div className="article-reader-backdrop" onMouseDown={() => setOpenArticle(null)}><article className="article-reader article-reader-deep" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="article-reader-title"><div className="article-reader-top"><span className="articles-kicker"><BookOpen size={14}/>{openArticle.category}</span><button type="button" onClick={() => setOpenArticle(null)} aria-label="Close article">×</button></div><span className="article-reader-index">CONCEPT {String(dsaArticles.indexOf(openArticle) + 1).padStart(3,"0")} · {openArticle.read}</span><h2 id="article-reader-title">{openArticle.title}</h2><p className="article-reader-summary">{openArticle.summary}</p><div className="article-lesson-meta"><span><small>CORE IDEA</small><strong>{openArticle.concept}</strong></span><span><small>COMPLEXITY</small><strong>{activeLesson.complexity}</strong></span></div><div className="article-lesson-layout"><div className="article-lesson-copy"><section><span className="article-reader-label">BUILD THE MENTAL MODEL</span><h3>What’s really happening?</h3><p>{activeLesson.detail}</p></section><section><span className="article-reader-label">WHEN TO REACH FOR IT</span><h3>Recognize the signal</h3><p>{activeLesson.usefulWhen}</p></section><section className="article-lesson-takeaway"><span className="article-reader-label">A PRINCIPLE TO KEEP</span><p>{openArticle.takeaway}</p></section></div><ConceptDiagram key={openArticle.title} article={openArticle} lesson={activeLesson}/></div><section className="article-reader-example"><div><span className="article-reader-label">CODE IN CONTEXT</span><h3>One way to write it</h3></div><pre><code>{openArticle.code}</code></pre></section><div className="article-reader-bottom"><span><Clock3 size={14}/> {openArticle.read}</span><button type="button" onClick={() => { setOpenArticle(null); setSelected(openArticle.category); }}>Explore {openArticle.category} <ArrowRight size={14}/></button></div></article></div>}
  </main>;
}


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
  "Monotonic Stack",
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

const fallbackCallIceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

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
  const iceServers = useRef<RTCIceServer[]>(fallbackCallIceServers);
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
      const { data: iceConfig, error: iceConfigError } = await supabase.functions.invoke("call-ice");
      if (iceConfigError || !Array.isArray(iceConfig?.iceServers) || iceConfig.iceServers.length === 0) {
        throw new Error("Could not load secure call connection settings. Configure and deploy the call-ice Supabase function, then try again.");
      }
      iceServers.current = iceConfig.iceServers as RTCIceServer[];
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
      const peer = new RTCPeerConnection({ iceServers: iceServers.current });
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
        if (peer.connectionState === "failed") {
          const hasTurn = iceServers.current.length > 1;
          setError(hasTurn
            ? "Could not establish a media connection. Check that your TURN server is reachable and its credentials are valid, then rejoin."
            : "Could not establish a media connection. Add a TURN server to the production deployment; STUN alone cannot connect some networks. Then rebuild and rejoin.");
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
  const [patternTestOpen, setPatternTestOpen] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>(viewFromLocation);
  const [workspaceTheme, setWorkspaceTheme] = useState<WorkspaceTheme>("midnight");
  const [storePlan, setStorePlan] = useState<string | null>(null);
  const navigateToView = (view: WorkspaceView, plan: string | null = null) => {
    const url = new URL(window.location.href);
    url.pathname = viewPaths[view];
    if (view !== "calls") {
      url.searchParams.delete("room");
      url.searchParams.delete("schedule");
      url.searchParams.delete("call");
    }
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setStorePlan(view === "mentorship" ? plan : null);
    setActiveView(view);
  };
  // The ₹19 roadmap plan unlocks the full 250-problem set in the library and
  // the board; signed out, the preview is free. Supabase missing => unlocked.
  const [roadmapLocked, setRoadmapLocked] = useState(true);
  const [roadmapChecking, setRoadmapChecking] = useState(false);
  const refreshRoadmapAccess = useCallback(async () => {
    if (!supabase) { setRoadmapLocked(false); return; }
    setRoadmapChecking(true);
    const result = await supabase.rpc("roadmap_unlocked");
    if (!result.error) setRoadmapLocked(result.data !== true);
    setRoadmapChecking(false);
  }, []);
  useEffect(() => {
    if (isSignedIn && (activeView === "problems" || activeView === "roadmap")) void refreshRoadmapAccess();
  }, [isSignedIn, activeView, refreshRoadmapAccess]);
  const FREE_ROADMAP_COUNT = 50;
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
    document.documentElement.dataset.theme = workspaceTheme;
    localStorage.setItem("codexsheet-theme", workspaceTheme);
  }, [workspaceTheme]);
  const [roadmapPreferences, setRoadmapPreferences] = useState<RoadmapPreferences>(
    () => JSON.parse(
      localStorage.getItem("codexsheet-roadmap-preferences") ??
        '{"targetWeeks":8,"sessionsPerWeek":5,"focusPattern":"Build weak areas"}',
    ) as RoadmapPreferences,
  );
  const [patternOfDay, setPatternOfDay] = useState(patterns[0] ?? "");
  const [pattern, setPattern] = useState("All patterns");
  const [difficulty, setDifficulty] = useState("All levels");
  const [status, setStatus] = useState("All status");
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
  const problemLibraryRef = useRef<HTMLElement>(null);
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
      })
      .slice(0, roadmapLocked ? FREE_ROADMAP_COUNT : problems.length);
  }, [patternStats, progress, roadmapPreferences.focusPattern, roadmapLocked]);
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

  if (!isLoaded) {
    return <main className="auth-gate"><div className="auth-gate-card auth-gate-loading"><img className="auth-gate-logo" src={workspaceTheme === "midnight" ? "/codexsheet-primary-reversed.svg" : "/codexsheet-primary.svg"} alt="CodexSheet" /><span>CODEXSHEET · DSA WORKSPACE</span><h1>Preparing your workspace…</h1></div></main>;
  }

  // Students pay from a shared link, so the mentorship page stays public.
  const publicMentorship = !isSignedIn && activeView === "mentorship";

  if (!isSignedIn && !publicMentorship) {
    return <main className="auth-gate"><div className="auth-gate-card"><div className="auth-gate-copy"><img className="auth-gate-logo" src={workspaceTheme === "midnight" ? "/codexsheet-primary-reversed.svg" : "/codexsheet-primary.svg"} alt="CodexSheet" /><span className="auth-gate-kicker">CODEXSHEET · DSA WORKSPACE</span><h1>One sign in.<br/><em>Your whole toolkit.</em></h1><p>Sign in to unlock your DSA practice workspace: problems, articles, roadmap, notes, editor, and study features.</p><div className="auth-gate-features"><span>Problem library</span><span>Animated lessons</span><span>Interview prep</span></div><div className="auth-gate-actions"><SignInButton mode="modal" forceRedirectUrl={window.location.href}><button className="auth-gate-primary">Sign in <ArrowRight size={16}/></button></SignInButton><SignUpButton mode="modal" forceRedirectUrl={window.location.href}><button className="auth-gate-secondary">Create student account</button></SignUpButton></div><small>Your workspace opens automatically after sign in.</small></div><div className="auth-gate-art" aria-hidden="true"><div className="auth-gate-orbit auth-gate-orbit-one"/><div className="auth-gate-orbit auth-gate-orbit-two"/><div className="auth-gate-code"><span>YOUR NEXT STEP</span><strong>Learn →<br/>Practice →<br/><i>Grow.</i></strong><small>DSA · INTERVIEWS · CAREER</small></div><b>✳</b></div></div></main>;
  }

  if (publicMentorship) {
    return <main className="mentorship-public"><MentorshipPayments /></main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <img className="brand-primary-image" src={workspaceTheme === "midnight" ? "/codexsheet-primary-reversed.svg" : "/codexsheet-primary.svg"} alt="CodexSheet" />
          <span className="workspace-name">DSA practice workspace</span>
          <ChevronDown size={14} className="muted-icon" />
        </div>
        <nav className="view-switcher" aria-label="Workspace views">
          <button className={activeView === "home" ? "active" : ""} aria-pressed={activeView === "home"} onClick={() => navigateToView("home")}>
            <House size={16} /> Home
          </button>
          <button className={activeView === "problems" ? "active" : ""} aria-pressed={activeView === "problems"} onClick={() => navigateToView("problems")}>
            <Rows3 size={16} /> Problems
            <span>{visibleProblems.length}</span>
          </button>
          <button className={activeView === "dsa-ide" ? "active" : ""} aria-pressed={activeView === "dsa-ide"} onClick={() => navigateToView("dsa-ide")}>
            <CodeXml size={16} /> Deva
          </button>
          <button className={activeView === "dsa-course" ? "active" : ""} aria-pressed={activeView === "dsa-course"} onClick={() => navigateToView("dsa-course")}>
            <BookOpen size={16} /> DSA Course
          </button>
          <button className={activeView === "tutor" ? "active" : ""} aria-pressed={activeView === "tutor"} onClick={() => navigateToView("tutor")}>
            <Sparkles size={16} /> Ask Tutor
          </button>
          <details className="nav-more" onClick={(event: { target: EventTarget; currentTarget: HTMLDetailsElement }) => { if ((event.target as HTMLElement).closest("button")) event.currentTarget.open = false; }}>
          <summary className={activeView === "dashboard" || activeView === "companies" || activeView === "dsa-ide" || activeView === "calendar" || activeView === "roadmap" || activeView === "lld" || activeView === "whiteboard" || activeView === "chat" || activeView === "calls" || activeView === "notes" || activeView === "articles" || activeView === "jobs" || activeView === "mentorship" || activeView === "mentees" ? "active" : ""}>More <ChevronDown size={14} /></summary>
            <div className="nav-more-menu">
              <span className="nav-more-label">Practice</span>
              <button className={activeView === "dashboard" ? "active" : ""} aria-pressed={activeView === "dashboard"} onClick={() => navigateToView("dashboard")}><LayoutDashboard size={16} /> Progress</button>
              <button className={activeView === "companies" ? "active" : ""} aria-pressed={activeView === "companies"} onClick={() => navigateToView("companies")}><UsersRound size={16} /> Companies</button>
              <span className="nav-more-label">Learn</span>
              <button className={activeView === "roadmap" ? "active" : ""} aria-pressed={activeView === "roadmap"} onClick={() => navigateToView("roadmap")}><MapIcon size={16} /> Roadmap</button>
              <button className={activeView === "lld" ? "active" : ""} aria-pressed={activeView === "lld"} onClick={() => navigateToView("lld")}><Layers3 size={16} /> Senior SDE · LLD</button>
              <button className={activeView === "whiteboard" ? "active" : ""} aria-pressed={activeView === "whiteboard"} onClick={() => navigateToView("whiteboard")}><MousePointer2 size={16} /> LLD whiteboard</button>
              <button className={activeView === "notes" ? "active" : ""} aria-pressed={activeView === "notes"} onClick={() => navigateToView("notes")}><NotebookPen size={16} /> Notes</button>
              <span className="nav-more-label">Content</span>
              <button className={activeView === "articles" ? "active" : ""} aria-pressed={activeView === "articles"} onClick={() => navigateToView("articles")}><BookOpen size={16} /> Articles</button>
              <button className={activeView === "jobs" ? "active" : ""} aria-pressed={activeView === "jobs"} onClick={() => navigateToView("jobs")}><BriefcaseBusiness size={16} /> Job search</button>
              <span className="nav-more-label">Community</span>
              <button className={activeView === "chat" ? "active" : ""} aria-pressed={activeView === "chat"} onClick={() => navigateToView("chat")}><MessageCircle size={16} /> Group chat {chatUnreadIds.length > 0 && <span className="chat-unread-badge">{chatUnreadIds.length > 99 ? "99+" : chatUnreadIds.length}</span>}</button>
              <button className={activeView === "calls" ? "active" : ""} aria-pressed={activeView === "calls"} onClick={() => navigateToView("calls")}><Video size={16} /> Video calls</button>
              <button className={activeView === "calendar" ? "active" : ""} aria-pressed={activeView === "calendar"} onClick={() => navigateToView("calendar")}><CalendarDays size={16} /> Calendar</button>
              <span className="nav-more-label">Mentorship</span>
              <button className={activeView === "mentorship" ? "active" : ""} aria-pressed={activeView === "mentorship"} onClick={() => navigateToView("mentorship")}><GraduationCap size={16} /> 1:1 mentorship</button>
              <button className={activeView === "mentees" ? "active" : ""} aria-pressed={activeView === "mentees"} onClick={() => navigateToView("mentees")}><Users size={16} /> Mentees</button>
              <span className="nav-more-label">Assistant</span>
              <button onClick={() => { window.location.href = "/assistant"; }}><MessageCircle size={16} /> Personal AI</button>
            </div>
          </details>
        </nav>
        <div className="top-actions">
          <label className="theme-picker">
            <Palette size={15} aria-hidden="true" />
            <span className="sr-only">Color theme</span>
            <select
              aria-label="Color theme"
              value={workspaceTheme}
              onChange={(event) => setWorkspaceTheme(event.target.value as WorkspaceTheme)}
            >
              <option value="light">Light</option>
              <option value="midnight">Midnight</option>
              <option value="forest">Forest</option>
            </select>
          </label>
          <CircleHelp size={18} className="muted-icon" />
            {isLoaded ? user ? (
              <UserButton />
            ) : (
              <>
                <SignInButton mode="modal" forceRedirectUrl={window.location.href}>
                  <button className="secondary-button">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl={window.location.href}>
                  <button className="primary-button">Create account</button>
                </SignUpButton>
              </>
            ) : null}
        </div>
      </header>
      <section className={`workspace-header${activeView === "companies" ? " company-workspace-header" : ""}`}>
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
                    : activeView === "dsa-ide"
                      ? "Deva Editor"
                  : activeView === "dsa-course"
                      ? "DSA Course"
                    : activeView === "tutor"
                      ? "DSA Tutor"
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
                          : activeView === "calls"
                            ? "Video calls"
                  : activeView === "mentorship" ? "Mentorship"
                  : activeView === "mentees" ? "Mentees"
                  : activeView === "articles" ? "Articles" : "Job search"}
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
                  : activeView === "tutor"
                    ? "Ask a DSA doubt"
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
                        : activeView === "calls"
                          ? "Video calls"
                : activeView === "articles" ? "DSA concept articles" : "Find your next opportunity"}{" "}
              <span className="private-pill">{activeView === "lld" ? "SENIOR SDE" : "DSA 250"}</span>
            </h1>
            <p>
              {activeView === "dashboard"
                ? "A clear view of your practice and what to tackle next."
                : activeView === "problems"
                  ? "Find a problem, update its status, and keep your practice moving."
                : activeView === "dsa-ide"
                    ? "Plan on the whiteboard, edit your solution, and trace each loop step."
                : activeView === "dsa-course"
                    ? "Learn core DSA patterns through detailed explanations and interactive visual walkthroughs."
                  : activeView === "tutor"
                    ? "Get patient, step-by-step help with data structures, algorithms, and interview problems."
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
                        : activeView === "calls"
                          ? "Meet your study group face to face, right from your workspace."
                        : activeView === "articles" ? "Build a clear mental model for the patterns you will meet in the problem library." : "Explore early career roles and find a team where you can grow."}
            </p>
          </div>
          <div className="title-actions">
            <button className="secondary-button">
              <GitBranch size={16} /> View repo
            </button>
          </div>
        </div>}
      </section>
      {activeView === "home" && <HomePage
        solved={solved}
        inProgress={inProgress}
        streak={practiceStreak.current}
        percent={percent}
        patterns={patternStats}
        onNavigate={navigateToView}
      />}
      {activeView === "articles" && <ArticlesPage />}
      {activeView === "jobs" && <JobsPage />}
      {activeView === "mentorship" && <MentorshipPayments userId={user?.id ?? null} userName={clerkDisplayName} userEmail={user?.email ?? ""} initialPlanId={storePlan} />}
      {activeView === "mentees" && <MenteeSpace userId={user?.id ?? null} userEmail={user?.email ?? ""} />}
      {activeView === "lld" && <LldRoadmapPage onOpenWhiteboard={() => navigateToView("whiteboard")} />}
      {activeView === "whiteboard" && <LldWhiteboardPage />}
      {activeView === "companies" && <CompanyProblems />}
      {activeView === "dsa-ide" && <DsaIde problems={problems.map(({ number, title, pattern, difficulty }) => ({ number, title, pattern, difficulty }))} userId={user?.id ?? null} />}
      {activeView === "dsa-course" && <DsaCourseStudio />}
      {activeView === "tutor" && <DsaTutor />}
      {activeView === "calls" && <VideoCalls userId={user?.id ?? null} userName={clerkDisplayName} />}
      {activeView === "dashboard" && (
        <>
          <section className="dashboard-welcome" aria-label="Continue your DSA practice">
            <div className="dashboard-welcome-copy">
              <span className="dashboard-welcome-kicker"><span /> YOUR PRACTICE, AT A GLANCE</span>
              <h2>Small steps make <em>strong instincts.</em></h2>
              <p>{solved > 0 ? `You’ve solved ${solved} of 250 problems. Keep your momentum going with the next one.` : "Build a steady interview practice habit, one thoughtfully chosen problem at a time."}</p>
              <div className="dashboard-welcome-actions">
                <button className="dashboard-continue" onClick={() => navigateToView("problems")}>Continue practicing <ArrowRight size={15} /></button>
                <button className="dashboard-calendar-link" onClick={() => navigateToView("calendar")}><CalendarDays size={15} /> View calendar</button>
              </div>
            </div>
            <div className="dashboard-welcome-progress" aria-label={`${percent}% complete`}>
              <div className="dashboard-progress-ring" style={{ "--progress": `${percent}%` } as CSSProperties & { "--progress": string }}>
                <div><strong>{percent}<small>%</small></strong><span>COMPLETE</span></div>
              </div>
              <span className="dashboard-progress-caption"><strong>{solved}</strong> solved <i /> 250 total</span>
            </div>
          </section>
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
          <section className="dashboard-lc-bottom">
            <article className="dashboard-panel dashboard-activity-panel">
              <header className="panel-heading"><div><span className="insight-label">Activity</span><h2>Your practice calendar</h2></div><span className="dashboard-activity-total">{practiceDays.length} active days</span></header>
              <div className="dashboard-heatmap-wrap"><div className="dashboard-heatmap-weekdays"><span>Mon</span><span>Wed</span><span>Fri</span></div><div className="dashboard-heatmap" role="grid" aria-label="Practice activity in the last 12 weeks">{Array.from({ length: 84 }, (_, index) => { const date = new Date(); date.setHours(0,0,0,0); date.setDate(date.getDate() - (83 - index)); const dateKey = localDateKey(date); const didPractice = practiceDaySet.has(dateKey); return <span role="gridcell" key={dateKey} className={didPractice ? "active" : ""} title={`${date.toLocaleDateString(undefined,{month:"short",day:"numeric"})}${didPractice?" · Practice session":" · No practice logged"}`} aria-label={`${date.toLocaleDateString()}${didPractice?", practice session":""}`}/>; })}</div></div>
              <footer className="dashboard-heatmap-footer"><span>{practiceStreak.current > 0 ? <><Flame size={13}/> {practiceStreak.current}-day streak · best {practiceStreak.best} days</> : "Log a solved problem to start your streak"}</span><span>LESS <i/><i/><i className="active"/> MORE</span></footer>
            </article>
            <article className="dashboard-panel dashboard-lld-card"><span className="dashboard-lld-kicker"><Layers3 size={14}/> NEXT CAREER TRACK</span><h2>Design for the<br/><em>senior engineer.</em></h2><p>A visual 12-week LLD roadmap: domain modeling, concurrency, resilience, and senior-level trade-offs.</p><div className="dashboard-lld-steps"><span>01 · MODEL</span><i/><span>02 · SCALE</span><i/><span>03 · LEAD</span></div><button type="button" onClick={() => navigateToView("lld")}>Open LLD roadmap <ArrowRight size={15}/></button></article>
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
            <button type="button" className={roadmapLocked ? "roadmap-buy" : "roadmap-buy unlocked"} onClick={() => navigateToView("mentorship", "roadmap")}>{roadmapLocked ? <>Unlock all 250 patterns · ₹19 <ArrowRight size={15}/></> : <>Roadmap unlocked <Check size={15}/></>}</button>
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
          <section className="roadmap-pattern-day" aria-label="Choose a pattern of the day">
            <div className="roadmap-pattern-day-heading">
              <div>
                <span className="roadmap-eyebrow">YOUR DAILY PRACTICE</span>
                <h3>Choose a pattern of the day</h3>
                <p>Pick one pattern to focus on, then work through its problems at your pace.</p>
              </div>
              <span className="roadmap-pattern-day-count">
                {problems.filter((problem) => problem.pattern === patternOfDay).length} problems
              </span>
            </div>
            <div className="roadmap-pattern-choices" role="group" aria-label="Available patterns">
              {patternStats.map((item) => (
                <button
                  className={`roadmap-pattern-choice${patternOfDay === item.name ? " active" : ""}`}
                  key={item.name}
                  type="button"
                  aria-pressed={patternOfDay === item.name}
                  onClick={() => setPatternOfDay(item.name)}
                >
                  <span>{item.name}</span>
                  <small>{item.completed}/{item.total}</small>
                </button>
              ))}
            </div>
            <div className="roadmap-pattern-problems" aria-live="polite">
              {problems.filter((problem) => problem.pattern === patternOfDay).map((problem) => {
                const current = progress[problem.number]?.status ?? "Todo";
                return (
                  <div className="roadmap-pattern-problem" key={problem.number}>
                    <span className="roadmap-task-number">{String(problem.number).padStart(3, "0")}</span>
                    <a href={problem.link} target="_blank" rel="noreferrer">
                      <strong>{problem.title}</strong>
                      <span>{problem.difficulty}</span>
                    </a>
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
          </section>
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
            <RoadmapBoard
              weeks={roadmapWeeks}
              patternStats={patternStats}
              statusOf={(problemNumber) => progress[problemNumber]?.status ?? "Todo"}
              onStatus={setProblemStatus}
            />
          )}
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
      {activeView === "problems" && <section className="problem-library-page">
        <div className="problem-library-hero">
          <div className="problem-library-intro">
            <span className="problem-library-eyebrow"><span/> YOUR PRACTICE, WITH PURPOSE</span>
            <h2>Build the instincts<br/>to <em>solve anything.</em></h2>
            <p>250 hand-picked interview problems, organized around the patterns great engineers use every day.</p>
            <div className="problem-hero-actions"><button type="button" onClick={() => { setStatus("All status"); setPattern("All patterns"); setDifficulty("All levels"); document.querySelector(".problem-library-controls input")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>Explore the library <ArrowRight size={15}/></button><span><Check size={14}/> Progress saves as you go</span></div>
          </div>
          <div className="problem-hero-progress"><div className="problem-progress-ring" style={{ "--progress": `${percent}%` } as CSSProperties}><div><strong>{percent}%</strong><span>COMPLETE</span></div></div><span className="problem-progress-caption"><strong>{solved} <small>/ 250</small></strong> problems solved</span><div className="problem-progress-track"><i style={{ width: `${percent}%` }}/></div><span className="problem-progress-foot">Every problem makes you sharper.</span><span className="problem-progress-spark">✳</span></div>
        </div>
        <div className="problem-library-stats">
          <div className="problem-stat-card"><span className="problem-stat-icon problem-stat-solved"><Check size={16}/></span><span className="problem-stat-label">SOLVED</span><strong>{solved}<small> / 250</small></strong><span className="problem-stat-note">One rep at a time</span></div>
          <div className="problem-stat-card"><span className="problem-stat-icon problem-stat-progress"><Clock3 size={16}/></span><span className="problem-stat-label">IN PROGRESS</span><strong>{inProgress}<small> active</small></strong><span className="problem-stat-note">Keep your momentum</span></div>
          <div className="problem-stat-card"><span className="problem-stat-icon problem-stat-pattern"><Target size={16}/></span><span className="problem-stat-label">CORE PATTERNS</span><strong>{patterns.length}<small> to explore</small></strong><span className="problem-stat-note">Learn how problems connect</span></div>
        </div>
        <div className="problem-library-section-heading"><div><span>THE PRACTICE LIBRARY</span><h3>Find your next <em>challenge.</em></h3></div><div className="problem-library-heading-actions"><span className="problem-sync-state"><Check size={13}/>{user ? "Progress synced" : "Progress saved locally"}</span><button type="button" disabled={pattern === "All patterns"} onClick={() => setPatternTestOpen(pattern)} title={pattern === "All patterns" ? "Choose a pattern to start its test" : `Take the ${pattern} test`}>Take 4-question test <ArrowRight size={13}/></button></div></div>
        <div className="problem-pattern-shortcuts" aria-label="Popular problem patterns">
          <span>POPULAR PATTERNS</span>
          {["Two Pointers", "Sliding Window", "Binary Search", "Trees", "Graphs", "1-D DP"].map((topic) => <button key={topic} type="button" className={pattern === topic ? "active" : ""} onClick={() => { setPattern(topic); setStatus("All status"); document.querySelector(".problem-library-controls input")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>{topic}<span>{problems.filter((problem) => problem.pattern === topic).length}</span></button>)}
        </div>
        <div className="problem-learning-layout">
        <div className="problem-library-panel">
          <div className="problem-library-controls">
            <label className="problem-search"><Search size={17}/><input placeholder="Search problems or patterns" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search problems or patterns"/>{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}</label>
            <label className="problem-filter-select"><span>PATTERN</span><select value={pattern} onChange={(event) => setPattern(event.target.value)}><option>All patterns</option>{patterns.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14}/></label>
            <label className="problem-filter-select"><span>DIFFICULTY</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>All levels</option><option>Easy</option><option>Medium</option><option>Hard</option></select><ChevronDown size={14}/></label>
            <label className="problem-filter-select"><span>STATUS</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All status</option><option>Todo</option><option>In progress</option><option>Solved</option></select><ChevronDown size={14}/></label>
          </div>
          <div className="problem-list-toolbar"><span><strong>{roadmapLocked ? Math.min(visibleProblems.length, FREE_ROADMAP_COUNT) : visibleProblems.length}</strong> {visibleProblems.length === 1 ? "problem" : "problems"} <i/> Curated for interview prep</span><span><span className="problem-live-dot"/> UPDATED FOR YOUR JOURNEY</span></div>
          {roadmapLocked && (
            <div className="problem-library-gate">
              <Lock size={15} />
              <span>Free preview shows the first {FREE_ROADMAP_COUNT} problems. Pay ₹19 to open all 250 patterns.</span>
              <button type="button" onClick={() => navigateToView("mentorship", "roadmap")}>Unlock for ₹19</button>
              <button type="button" className="gate-check" disabled={roadmapChecking} onClick={() => void refreshRoadmapAccess()}>{roadmapChecking ? "Checking…" : "I've paid — check"}</button>
            </div>
          )}
          <div className="problem-list">{(roadmapLocked ? visibleProblems.filter((problem) => problem.number <= FREE_ROADMAP_COUNT) : visibleProblems).length ? (roadmapLocked ? visibleProblems.filter((problem) => problem.number <= FREE_ROADMAP_COUNT) : visibleProblems).map((problem) => {
            const current = progress[problem.number]?.status ?? "Todo";
            const statusClass = current.toLowerCase().replace(" ", "-");
            return <article className="problem-list-row" key={problem.number}><span className="problem-row-number">{String(problem.number).padStart(3,"0")}</span><span className={`problem-row-state ${statusClass}`}><span/></span><div className="problem-row-title"><a href={problem.link} target="_blank" rel="noreferrer" aria-label={`${problem.title} on LeetCode`}><span className="leetcode-mark" aria-hidden="true">LC</span>{problem.title}<ExternalLink size={13}/></a><span>{problem.pattern}</span></div><span className="pattern-pill problem-row-pattern">{problem.pattern}</span><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span><label className={`problem-row-status ${statusClass}`}><select aria-label={`Status for ${problem.title}`} value={current} onChange={(event) => setProblemStatus(problem.number, event.target.value as Status)}><option>Todo</option><option>In progress</option><option>Solved</option></select><ChevronDown size={12}/></label></article>;
          }) : <div className="problem-library-empty"><Search size={21}/><strong>No problems found</strong><span>Try another search or adjust your filters.</span><button type="button" onClick={() => {setQuery("");setPattern("All patterns");setDifficulty("All levels");setStatus("All status");}}>Clear filters</button></div>}</div>
          <div className="problem-library-footer"><span><Target size={14}/> Showing {visibleProblems.length} matching problems</span><span><Check size={14}/>{user ? "Synced to your account" : "Sign in to sync across devices"}</span></div>
        </div>
        <aside className="free-dsa-video" aria-label="Free Love Babbar DSA course">
          <div className="free-dsa-video-heading"><div><span>FREE VIDEO COURSE</span><h3>Learn with <em>Love Babbar.</em></h3></div><span className="free-video-tag">FREE</span></div>
          <p>Follow the complete CodeHelp DSA placement series alongside your practice.</p>
          <div className="free-dsa-video-player"><iframe src="https://www.youtube-nocookie.com/embed/videoseries?list=PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA" title="Love Babbar CodeHelp free DSA placement course" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
          <div className="free-dsa-video-footer"><span><Play size={13}/> 149-lesson playlist</span><a href="https://www.youtube.com/playlist?list=PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA" target="_blank" rel="noreferrer">Open playlist <ExternalLink size={12}/></a></div>
          <div className="free-dsa-course-note"><strong>Practice as you learn</strong><span>Watch a lesson, then solve a matching problem in the library.</span></div>
        </aside>
        </div>
      </section>}
      {patternTestOpen && <PatternTest pattern={patternTestOpen} onClose={() => setPatternTestOpen(null)} />}

      <footer className="footer-note">
        Use the patterns, then make the problem yours.
      </footer>
    </main>
  );
}

export default App;
