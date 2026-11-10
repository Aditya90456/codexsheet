// DashboardHub.tsx — the two halves of /dashboard that are about the platform
// rather than about today's numbers: the patterns you left half-finished, and
// the board that lists every rail CodexSheet actually has.
//
// The rule this file exists to keep: a card may only say a number that the page
// behind it can also produce. Every count arrives as a prop from App.tsx, which
// reads it off the same module the rail renders from - so scripts/dashboard-hub-check.mjs
// can compare the two and fail the day they drift apart.
import {
  Activity,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CodeXml,
  GraduationCap,
  Layers,
  Map as MapIcon,
  MessageCircle,
  NotebookPen,
  Radar,
  Rows3,
  ScrollText,
  Sparkles,
  Store,
  Target,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceView } from "./App";
import { courseLessons } from "./deva-course-lessons";
import { lessonLectures } from "./love-babbar-lessons";
import { radarQuestions } from "./interviewRadar2027";
import { roadmapStages } from "./dsaPatterns";
import { uiLanguages } from "./i18n";

export type HubCounts = {
  /** Problems this student has marked solved. */
  solved: number;
  /** Length of the sheet, so "12/250" means the same thing here and on /problems. */
  total: number;
  /** Patterns with at least one problem on them. */
  patterns: number;
  /** Days with practice logged. */
  activeDays: number;
  /** Unread group-chat messages - the only count on this board that moves while you read it. */
  unread: number;
};

export type HubCard = { view: WorkspaceView; icon: LucideIcon; name: string; note: string; count: string };
export type HubGroup = { label: string; cards: HubCard[] };

export function hubGroups(counts: HubCounts): HubGroup[] {
  return [
    {
      label: "Practice",
      cards: [
        { view: "problems", icon: Target, name: "The 250 sheet", note: "Status, notes, the next problem.", count: `${counts.solved}/${counts.total}` },
        { view: "patterns", icon: Layers, name: "Pattern library", note: "Each pattern filmed on live data.", count: `${counts.patterns} patterns` },
        { view: "dsa-ide", icon: CodeXml, name: "Deva editor", note: "Run it against hidden tests.", count: "4 languages" },
        { view: "cslabs", icon: Activity, name: "Algorithm Labs", note: "Watch the algorithm move.", count: "no sign-in" },
        { view: "calendar", icon: CalendarDays, name: "Practice calendar", note: "The days you actually showed up.", count: `${counts.activeDays} active` },
        { view: "notes", icon: NotebookPen, name: "Notebook", note: "Private, tied to your account.", count: "" },
      ],
    },
    {
      label: "Learn",
      cards: [
        { view: "dsa-course", icon: BookOpen, name: "DSA course", note: "Lesson by lesson, with the code beside it.", count: `${courseLessons.length} lessons` },
        { view: "lessons", icon: Video, name: "Lesson films", note: "The whole sheet, explained on screen.", count: `${lessonLectures.length} films` },
        { view: "articles", icon: Rows3, name: "Field notes", note: "Approach, worked steps, trade-offs, FAQ.", count: "deep dives" },
        { view: "guru", icon: Sparkles, name: "Guru", note: "It teaches, then checks your reasoning.", count: `${uiLanguages.length} languages` },
        { view: "roadmap", icon: MapIcon, name: "Roadmap", note: "A plan around your season, not a list.", count: `${roadmapStages.length} stages` },
        { view: "radar", icon: Radar, name: "2027 radar", note: "What the loop is actually asking now.", count: `${radarQuestions.length} questions` },
      ],
    },
    {
      label: "Peers",
      cards: [
        { view: "network", icon: Users, name: "CodexSheet Network", note: "Post your code, read theirs, ask in private.", count: "" },
        { view: "chat", icon: MessageCircle, name: "Group chat", note: "The study room, open all day.", count: counts.unread ? `${counts.unread} new` : "" },
        { view: "experiences", icon: Building2, name: "Interview experiences", note: "Written by the student in the room.", count: "" },
        { view: "leaderboard", icon: Trophy, name: "Leaderboard", note: "Ranked on the server, solved only.", count: "" },
        { view: "certificate", icon: ScrollText, name: "Certificate", note: "Minted from what you solved.", count: "" },
      ],
    },
    {
      label: "Mentors",
      cards: [
        { view: "mentorship", icon: GraduationCap, name: "1:1 mentorship", note: "Google Meet calls with Aditya.", count: "" },
        { view: "marketplace", icon: Store, name: "Mentor marketplace", note: "Other mentors, their own prices.", count: "" },
        { view: "jobs", icon: BriefcaseBusiness, name: "Job board", note: "Early-career roles worth prepping for.", count: "" },
      ],
    },
  ];
}

export type PatternRow = { name: string; total: number; completed: number; active: number };
export type ResumeRow = PatternRow & { percent: number };

/** A half-finished pattern is where the next hour pays best, so anything with
 *  work open in it leads, then whatever is closest to being finished. */
export function resumeRows(rows: PatternRow[], limit = 8): ResumeRow[] {
  return rows
    .map((row) => ({ ...row, percent: row.total ? Math.round((row.completed / row.total) * 100) : 0 }))
    .sort((left, right) => Number(right.active > 0) - Number(left.active > 0) || right.percent - left.percent)
    .slice(0, limit);
}

export function ResumeTrack({ rows, onOpen }: { rows: ResumeRow[]; onOpen: (view: WorkspaceView) => void }) {
  return (
    <section className="dashboard-resume" aria-label="Continue where you left off">
      <header className="panel-heading">
        <div>
          <span className="insight-label">CONTINUE</span>
          <h2>Pick the pattern back up</h2>
        </div>
        <button className="panel-link" onClick={() => onOpen("patterns")}>
          All patterns <ArrowRight size={15} />
        </button>
      </header>
      <div className="resume-track">
        {rows.map((item) => (
          <button type="button" className="resume-card" key={item.name} onClick={() => onOpen("patterns")}>
            <span className="resume-card-top"><strong>{item.name}</strong><em>{item.percent}%</em></span>
            <span className="resume-bar"><i style={{ width: `${item.percent}%` }} /></span>
            <small>
              {item.completed} of {item.total} solved
              {item.active ? ` · ${item.active} open right now` : item.completed === item.total ? " · finished" : " · untouched so far"}
            </small>
          </button>
        ))}
      </div>
    </section>
  );
}

export function DashboardHub({ counts, onOpen }: { counts: HubCounts; onOpen: (view: WorkspaceView) => void }) {
  return (
    <section className="dashboard-hub" aria-label="Everything on CodexSheet">
      <header className="hub-head">
        <div>
          <span className="insight-label">THE WHOLE PLATFORM</span>
          <h2>Every room, one tap away</h2>
        </div>
        <p>No card is a teaser. Each one is the page itself, and the number on it is counted from that page&apos;s own data.</p>
      </header>
      {hubGroups(counts).map((group) => (
        <div className="hub-group" key={group.label}>
          <h3 className="hub-group-title">{group.label}</h3>
          <div className="hub-cards">
            {group.cards.map((card) => {
              const Icon = card.icon;
              return (
                <button type="button" className="hub-card" key={card.view} onClick={() => onOpen(card.view)}>
                  <span className="hub-card-icon"><Icon size={15} /></span>
                  <strong>{card.name}</strong>
                  <small>{card.note}</small>
                  <span className="hub-card-foot">
                    {card.count && <em>{card.count}</em>}
                    <ArrowRight size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
