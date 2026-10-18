import { useState, useMemo } from "react";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Briefcase,
  CalendarDays,
  CodeXml,
  ExternalLink,
  Flame,
  LayoutDashboard,
  Map as MapIcon,
  MessageCircle,
  NotebookPen,
  Play,
  Rows3,
  Search,
  Sparkles,
  UsersRound,
  Video,
} from "lucide-react";

export type WorkspaceView =
  | "home"
  | "dashboard"
  | "problems"
  | "companies"
  | "editor"
  | "calendar"
  | "roadmap"
  | "chat"
  | "notes"
  | "coach"
  | "calls"
  | "articles"
  | "course"
  | "mentor"
  | "explore";

interface ToolItem {
  id: string;
  title: string;
  category: "LEARN" | "PRACTICE" | "STUDY TOOLS" | "CAREER & COMMUNITY";
  description: string;
  badge?: string;
  view?: WorkspaceView;
  externalUrl?: string;
  icon: React.ReactNode;
  tags: string[];
}

const allTools: ToolItem[] = [
  {
    id: "course",
    title: "Python DSA Course",
    category: "LEARN",
    description: "6-week structured video curriculum covering core data structures, Big O, recursion, trees, and dynamic programming.",
    badge: "6 WEEKS",
    view: "course",
    icon: <Play size={20} />,
    tags: ["python", "video", "lessons", "curriculum", "beginner", "advanced"],
  },
  {
    id: "articles",
    title: "DSA Field Notes & 3D Visualizer",
    category: "LEARN",
    description: "11 illustrated algorithmic field notes with code snippets, takeaways, and an interactive 3D binary search visualizer.",
    badge: "11 ARTICLES",
    view: "articles",
    icon: <BookOpen size={20} />,
    tags: ["articles", "theory", "3d", "binary search", "big o", "hash map"],
  },
  {
    id: "roadmap",
    title: "Adaptive DSA Roadmap",
    category: "LEARN",
    description: "A tailored study schedule dynamically calibrated to your target timeline (4, 8, or 12 weeks) and focus patterns.",
    badge: "ADAPTIVE",
    view: "roadmap",
    icon: <MapIcon size={20} />,
    tags: ["roadmap", "timeline", "study plan", "calendar", "preparation"],
  },
  {
    id: "problems",
    title: "Curated Problem Sheet",
    category: "PRACTICE",
    description: "250 hand-picked DSA problems mapped to 19 algorithmic patterns with level tags and status tracking.",
    badge: "250 PROBLEMS",
    view: "problems",
    icon: <Rows3 size={20} />,
    tags: ["problems", "dsa", "leetcode", "patterns", "easy", "medium", "hard"],
  },
  {
    id: "editor",
    title: "Interactive Code Editor",
    category: "PRACTICE",
    description: "Multi-language editor supporting JavaScript (client-side execution), Python, Java, and C++ with test cases and I/O terminal.",
    badge: "IN-BROWSER RUNNER",
    view: "editor",
    icon: <CodeXml size={20} />,
    tags: ["editor", "code", "run", "javascript", "python", "cpp", "java", "ide"],
  },
  {
    id: "companies",
    title: "Company Question Bank",
    category: "PRACTICE",
    description: "Targeted problem lists frequently asked in technical interviews at Meta, Amazon, Apple, Netflix, Nvidia, and Google.",
    badge: "FAANG / MAANG",
    view: "companies",
    icon: <UsersRound size={20} />,
    tags: ["companies", "meta", "google", "amazon", "apple", "netflix", "interview questions"],
  },
  {
    id: "dashboard",
    title: "Practice Dashboard",
    category: "STUDY TOOLS",
    description: "Central command center with completion ring, weak-pattern analysis, study queue, daily streak, and achievement badges.",
    badge: "METRICS",
    view: "dashboard",
    icon: <LayoutDashboard size={20} />,
    tags: ["dashboard", "progress", "streak", "analytics", "badges", "stats"],
  },
  {
    id: "notes",
    title: "Personal Notebook",
    category: "STUDY TOOLS",
    description: "Private study notes with auto-saving, local caching, and quick markdown formatting to capture pattern insights.",
    badge: "AUTO-SAVE",
    view: "notes",
    icon: <NotebookPen size={20} />,
    tags: ["notes", "notebook", "private", "markdown", "journal", "study"],
  },
  {
    id: "calendar",
    title: "Practice Calendar",
    category: "STUDY TOOLS",
    description: "Monthly activity calendar and heatmap to track your daily practice habit and protect your problem-solving streak.",
    badge: "HABIT TRACKER",
    view: "calendar",
    icon: <CalendarDays size={20} />,
    tags: ["calendar", "dates", "streak", "activity", "heatmap"],
  },
  {
    id: "coach",
    title: "AI Technical Interview Coach",
    category: "CAREER & COMMUNITY",
    description: "Voice-enabled technical mock interviewer with real-time conversational feedback, speech synthesis, and voice recognition.",
    badge: "VOICE AI",
    view: "coach",
    icon: <AudioLines size={20} />,
    tags: ["ai", "coach", "interview", "voice", "mock interview", "speech"],
  },
  {
    id: "calls",
    title: "Peer Video Call Rooms",
    category: "CAREER & COMMUNITY",
    description: "Direct WebRTC peer video rooms with camera, mic, and screen-sharing controls for mock interviews with peers.",
    badge: "WEBRTC",
    view: "calls",
    icon: <Video size={20} />,
    tags: ["video", "calls", "peer", "mock", "screen share", "webrtc"],
  },
  {
    id: "chat",
    title: "Study Group Chat",
    category: "CAREER & COMMUNITY",
    description: "Real-time group discussion channel to share approaches, discuss tricky edge cases, and study together.",
    badge: "COMMUNITY",
    view: "chat",
    icon: <MessageCircle size={20} />,
    tags: ["chat", "community", "discussion", "group", "messages"],
  },
  {
    id: "mentor",
    title: "1-on-1 Mentor Session",
    category: "CAREER & COMMUNITY",
    description: "Schedule a personalized 60-minute mentorship session with Aditya Bakshi for interview advice and career guidance.",
    badge: "FREE 60-MIN",
    view: "mentor",
    icon: <CalendarDays size={20} />,
    tags: ["mentor", "aditya bakshi", "session", "1-on-1", "guidance", "booking"],
  },
  {
    id: "jobs",
    title: "LinkedIn Tech Job Explorer",
    category: "CAREER & COMMUNITY",
    description: "Search live software engineering internships, frontend, and backend openings directly from LinkedIn.",
    badge: "LIVE ROLES",
    externalUrl: "https://www.linkedin.com/jobs/search/?keywords=Software%20Engineer%20Intern&location=India&f_TPR=r86400",
    icon: <Briefcase size={20} />,
    tags: ["jobs", "linkedin", "careers", "internship", "frontend", "backend", "hiring"],
  },
];

const categories = ["ALL", "LEARN", "PRACTICE", "STUDY TOOLS", "CAREER & COMMUNITY"] as const;

export default function ExploreHub({ onNavigate }: { onNavigate: (view: WorkspaceView) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[number]>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allTools.filter((item) => {
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section className="explore-hub-page">
      {/* Hero Banner */}
      <div className="explore-hero">
        <div className="explore-hero-content">
          <div className="explore-eyebrow">
            <Sparkles size={14} className="explore-sparkle" />
            <span>WORKSPACE DIRECTORY</span>
          </div>
          <h1>Explore <em>Codexsheet</em></h1>
          <p>
            Everything you need to master Data Structures & Algorithms, build consistent study habits, and ace technical interviews.
          </p>
        </div>

        {/* Quick Stat Highlights */}
        <div className="explore-stats-row">
          <div className="explore-stat">
            <strong>250</strong>
            <span>Curated Problems</span>
          </div>
          <div className="explore-stat">
            <strong>19</strong>
            <span>Core Patterns</span>
          </div>
          <div className="explore-stat">
            <strong>6</strong>
            <span>Target Tech Giants</span>
          </div>
          <div className="explore-stat">
            <strong>11</strong>
            <span>Field Notes & 3D</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="explore-filter-bar">
        <div className="explore-category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`explore-tab ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="explore-search-input">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search tools, topics, or features…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="explore-clear-btn" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="explore-grid">
        {filteredTools.length === 0 ? (
          <div className="explore-empty">
            <p>No tools found matching &ldquo;{searchQuery}&rdquo;.</p>
            <button type="button" onClick={() => { setSearchQuery(""); setSelectedCategory("ALL"); }}>
              Reset filters
            </button>
          </div>
        ) : (
          filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="explore-card"
              onClick={() => {
                if (tool.view) onNavigate(tool.view);
                else if (tool.externalUrl) window.open(tool.externalUrl, "_blank", "noreferrer");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (tool.view) onNavigate(tool.view);
                  else if (tool.externalUrl) window.open(tool.externalUrl, "_blank", "noreferrer");
                }
              }}
            >
              <div className="explore-card-top">
                <span className="explore-card-category">{tool.category}</span>
                {tool.badge && <span className="explore-card-badge">{tool.badge}</span>}
              </div>

              <div className="explore-card-icon-wrap">{tool.icon}</div>

              <h3 className="explore-card-title">{tool.title}</h3>
              <p className="explore-card-desc">{tool.description}</p>

              <div className="explore-card-footer">
                <span className="explore-card-action">
                  {tool.externalUrl ? "Open link" : "Launch tool"}
                  {tool.externalUrl ? <ExternalLink size={13} /> : <ArrowRight size={13} />}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
