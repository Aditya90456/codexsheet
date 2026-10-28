import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ExternalLink, Maximize2, Minus, MousePointer2, Plus, Route, Target } from "lucide-react";

export type BoardStatus = "Todo" | "In progress" | "Solved";
type BoardProblem = { number: number; title: string; pattern: string; difficulty: "Easy" | "Medium" | "Hard"; link: string };
type BoardWeek = { number: number; problems: BoardProblem[] };
type BoardPatternStat = { name: string; total: number; completed: number };

type Props = {
  weeks: BoardWeek[];
  patternStats: BoardPatternStat[];
  statusOf: (problemNumber: number) => BoardStatus;
  onStatus: (problemNumber: number, status: BoardStatus) => void;
};

const stages = [
  { name: "Foundations", patterns: ["Arrays & Hashing", "Bit Manipulation"] },
  { name: "Linear scanning", patterns: ["Two Pointers", "Sliding Window", "Stack", "Binary Search"] },
  { name: "Structures", patterns: ["Linked List", "Monotonic Stack", "Heaps", "Trees"] },
  { name: "Search & recursion", patterns: ["Backtracking", "Graphs"] },
  { name: "Optimization", patterns: ["1-D DP", "2-D DP", "Greedy", "Intervals"] },
];

/** "core" is the path you must walk; "optional" is a link that only reinforces. */
const links: Array<[string, string, "core" | "optional"]> = [
  ["Arrays & Hashing", "Bit Manipulation", "optional"],
  ["Arrays & Hashing", "Two Pointers", "core"],
  ["Arrays & Hashing", "Sliding Window", "core"],
  ["Arrays & Hashing", "Stack", "core"],
  ["Arrays & Hashing", "Binary Search", "core"],
  ["Arrays & Hashing", "Linked List", "core"],
  ["Two Pointers", "Sliding Window", "optional"],
  ["Stack", "Monotonic Stack", "core"],
  ["Stack", "Trees", "core"],
  ["Binary Search", "Heaps", "optional"],
  ["Linked List", "Trees", "optional"],
  ["Trees", "Backtracking", "core"],
  ["Trees", "Graphs", "core"],
  ["Heaps", "Graphs", "optional"],
  ["Backtracking", "1-D DP", "optional"],
  ["Graphs", "1-D DP", "core"],
  ["1-D DP", "2-D DP", "core"],
  ["1-D DP", "Greedy", "optional"],
  ["Greedy", "Intervals", "core"],
];

const NODE_W = 178;
const NODE_H = 104;
const COL_GAP = 86;
const ROW_GAP = 26;
const PAD = 46;
const MIN_ZOOM = 0.32;
const MAX_ZOOM = 1.6;

const stageOf = new Map(stages.flatMap((stage, index) => stage.patterns.map((pattern) => [pattern, index])));
const stageNameOf = new Map(stages.flatMap((stage) => stage.patterns.map((pattern) => [pattern, stage.name])));
const tallest = Math.max(...stages.map((stage) => stage.patterns.length));
const worldW = PAD * 2 + stages.length * NODE_W + (stages.length - 1) * COL_GAP;
const worldH = PAD * 2 + 40 + tallest * NODE_H + (tallest - 1) * ROW_GAP;

type Placement = { x: number; y: number; stage: number };
const placements = new Map<string, Placement>();
stages.forEach((stage, columnIndex) => {
  const rows = stage.patterns.length;
  stage.patterns.forEach((pattern, row) => {
    placements.set(pattern, {
      x: PAD + columnIndex * (NODE_W + COL_GAP),
      y: worldH / 2 + (row - (rows - 1) / 2) * (NODE_H + ROW_GAP) - NODE_H / 2,
      stage: columnIndex,
    });
  });
});

function edgePath(from: Placement, to: Placement): string {
  if (from.stage !== to.stage) {
    const x1 = from.x + NODE_W;
    const y1 = from.y + NODE_H / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_H / 2;
    const reach = Math.max(46, (x2 - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + reach} ${y1}, ${x2 - reach} ${y2}, ${x2} ${y2}`;
  }
  const x1 = from.x + NODE_W / 2;
  const y1 = from.y + NODE_H;
  const x2 = to.x + NODE_W / 2;
  const y2 = to.y;
  const reach = Math.max(30, (y2 - y1) / 2);
  return `M ${x1} ${y1} C ${x1 + 42} ${y1 + reach}, ${x2 + 42} ${y2 - reach}, ${x2} ${y2}`;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const viewKey = "codexsheet-roadmap-board-view";

export default function RoadmapBoard({ weeks, patternStats, statusOf, onStatus }: Props) {
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ pointerId: number; x: number; y: number; originX: number; originY: number } | null>(null);

  const stats = useMemo(() => new Map(patternStats.map((item) => [item.name, item])), [patternStats]);
  const planned = useMemo(() => {
    const byPattern = new Map<string, BoardProblem[]>();
    const weekOfPattern = new Map<string, number>();
    for (const week of weeks) {
      for (const problem of week.problems) {
        const bucket = byPattern.get(problem.pattern);
        if (bucket) bucket.push(problem);
        else byPattern.set(problem.pattern, [problem]);
        if (!weekOfPattern.has(problem.pattern)) weekOfPattern.set(problem.pattern, week.number);
      }
    }
    return { byPattern, weekOfPattern };
  }, [weeks]);

  const fit = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const k = clamp((el.clientWidth - 28) / worldW, MIN_ZOOM, 1);
    setView({ k, x: (el.clientWidth - worldW * k) / 2, y: Math.max(18, (el.clientHeight - worldH * k) / 2) });
  }, []);

  useEffect(() => {
    let restored = false;
    try {
      const saved = localStorage.getItem(viewKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { x: number; y: number; k: number };
        if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y) && Number.isFinite(parsed.k)) {
          setView({ x: parsed.x, y: parsed.y, k: clamp(parsed.k, MIN_ZOOM, MAX_ZOOM) });
          restored = true;
        }
      }
    } catch { /* a bad saved view simply refits */ }
    if (!restored) fit();
  }, [fit]);

  useEffect(() => {
    try { localStorage.setItem(viewKey, JSON.stringify(view)); } catch { /* storage may be unavailable */ }
  }, [view]);

  const zoomAt = useCallback((pointX: number, pointY: number, factor: number) => {
    setView((current) => {
      const k = clamp(current.k * factor, MIN_ZOOM, MAX_ZOOM);
      const worldX = (pointX - current.x) / current.k;
      const worldY = (pointY - current.y) / current.k;
      return { k, x: pointX - worldX * k, y: pointY - worldY * k };
    });
  }, []);

  // React's wheel listener is passive, so preventDefault needs a native binding.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey) {
        zoomAt(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-event.deltaY * 0.0016));
        return;
      }
      setView((current) => ({ ...current, x: current.x - event.deltaX, y: current.y - event.deltaY }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const pan = panRef.current;
      if (!pan || pan.pointerId !== event.pointerId) return;
      setView((current) => ({ ...current, x: pan.originX + event.clientX - pan.x, y: pan.originY + event.clientY - pan.y }));
    };
    const stop = () => { panRef.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  function startPan(event: { button: number; pointerType: string; pointerId: number; clientX: number; clientY: number }) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, originX: view.x, originY: view.y };
  }

  function panKeys(event: { key: string; preventDefault: () => void; currentTarget: HTMLDivElement }) {
    const step = 64;
    if (event.key === "ArrowLeft") setView((v) => ({ ...v, x: v.x + step }));
    else if (event.key === "ArrowRight") setView((v) => ({ ...v, x: v.x - step }));
    else if (event.key === "ArrowUp") setView((v) => ({ ...v, y: v.y + step }));
    else if (event.key === "ArrowDown") setView((v) => ({ ...v, y: v.y - step }));
    else if (event.key === "+" || event.key === "=") zoomAt(event.currentTarget.clientWidth / 2, event.currentTarget.clientHeight / 2, 1.18);
    else if (event.key === "-") zoomAt(event.currentTarget.clientWidth / 2, event.currentTarget.clientHeight / 2, 1 / 1.18);
    else if (event.key === "0") fit();
    else return;
    event.preventDefault();
  }

  const selectedProblems = selected ? (planned.byPattern.get(selected) ?? []) : [];
  const selectedStat = selected ? stats.get(selected) : undefined;
  const prerequisites = selected ? links.filter(([, to]) => to === selected).map(([from]) => from) : [];
  const unlocks = selected ? links.filter(([from]) => from === selected).map(([, to]) => to) : [];

  function nodeState(pattern: string): "done" | "active" | "todo" {
    const item = stats.get(pattern);
    if (!item || item.total === 0) return "todo";
    if (item.completed >= item.total) return "done";
    return item.completed > 0 ? "active" : "todo";
  }

  return <section className="roadmap-board" aria-label="DSA roadmap board">
    <header className="roadmap-board-head">
      <div>
        <span className="roadmap-eyebrow">THE SKILL PATH</span>
        <h3>Your roadmap, drawn as one board</h3>
        <p>Follow the solid lines for the required order. Dashed lines only reinforce what you already know.</p>
      </div>
      <div className="roadmap-board-legend" aria-hidden="true">
        <span><i className="dot done"/> solved</span>
        <span><i className="dot active"/> in progress</span>
        <span><i className="dot todo"/> not started</span>
        <span><i className="line core"/> required</span>
        <span><i className="line optional"/> reinforces</span>
      </div>
    </header>

    <div className="roadmap-week-rail" role="group" aria-label="Jump to a planned week">
      <button type="button" className={activeWeek === null ? "on" : ""} onClick={() => setActiveWeek(null)}>All weeks</button>
      {weeks.map((week) => <button key={week.number} type="button" className={activeWeek === week.number ? "on" : ""} onClick={() => setActiveWeek(week.number)}>W{String(week.number).padStart(2, "0")}<i>{week.problems.length}</i></button>)}
    </div>

    <div className="roadmap-board-layout">
      <div
        ref={viewportRef}
        className={`roadmap-board-viewport${view.k < 0.6 ? " zoomed-out" : ""}`}
        tabIndex={0}
        role="application"
        aria-label="Roadmap canvas. Drag to pan, Ctrl plus scroll to zoom, arrow keys to move."
        onPointerDown={startPan}
        onKeyDown={panKeys}
      >
        <div className="roadmap-board-world" style={{ width: worldW, height: worldH, transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.k})` }}>
          <svg className="roadmap-board-edges" width={worldW} height={worldH} viewBox={`0 0 ${worldW} ${worldH}`} aria-hidden="true">
            {links.map(([from, to, kind]) => {
              const a = placements.get(from);
              const b = placements.get(to);
              if (!a || !b) return null;
              const dim = activeWeek !== null && !(planned.weekOfPattern.get(from) === activeWeek || planned.weekOfPattern.get(to) === activeWeek);
              return <path key={`${from}-${to}`} d={edgePath(a, b)} className={`${kind}${dim ? " dim" : ""}`} />;
            })}
          </svg>

          {stages.map((stage, index) => {
            const head = placements.get(stage.patterns[0] ?? "");
            if (!head) return null;
            return <span className="roadmap-board-tier" key={stage.name} style={{ left: head.x, top: PAD - 8, width: NODE_W }}>
              <b>{String(index + 1).padStart(2, "0")}</b>{stage.name}
            </span>;
          })}

          {[...placements.keys()].map((pattern) => {
            const place = placements.get(pattern);
            if (!place) return null;
            const state = nodeState(pattern);
            const item = stats.get(pattern);
            const weekNumber = planned.weekOfPattern.get(pattern) ?? null;
            const dots = (planned.byPattern.get(pattern) ?? []).slice(0, 7);
            const ratio = item && item.total ? Math.round((item.completed / item.total) * 100) : 0;
            const outside = activeWeek !== null && weekNumber !== activeWeek;
            return <button
              type="button"
              key={pattern}
              className={`roadmap-node state-${state}${selected === pattern ? " selected" : ""}${outside ? " dim" : ""}`}
              style={{ left: place.x, top: place.y, width: NODE_W, height: NODE_H }}
              aria-pressed={selected === pattern}
              onPointerDown={(event: { stopPropagation: () => void }) => event.stopPropagation()}
              onClick={() => setSelected(pattern)}
            >
              <span className="roadmap-node-top">
                <i className={`status-dot ${state}`}/>
                <strong>{pattern}</strong>
                {state === "done" && <Check size={13} className="roadmap-node-check"/>}
              </span>
              <span className="roadmap-node-meta">{weekNumber ? `week ${String(weekNumber).padStart(2, "0")}` : "planned later"} · {item?.completed ?? 0}/{item?.total ?? 0}</span>
              <span className="roadmap-node-bar"><b style={{ width: `${ratio}%` }}/></span>
              <span className="roadmap-node-dots">{dots.map((problem) => <i key={problem.number} className={statusOf(problem.number).toLowerCase().replace(" ", "-")}/>)}</span>
            </button>;
          })}
        </div>

        <div className="roadmap-board-tools">
          <button type="button" aria-label="Zoom out" onClick={() => zoomAt((viewportRef.current?.clientWidth ?? 0) / 2, (viewportRef.current?.clientHeight ?? 0) / 2, 1 / 1.22)}><Minus size={14}/></button>
          <span>{Math.round(view.k * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => zoomAt((viewportRef.current?.clientWidth ?? 0) / 2, (viewportRef.current?.clientHeight ?? 0) / 2, 1.22)}><Plus size={14}/></button>
          <button type="button" onClick={fit}><Maximize2 size={14}/> Fit</button>
        </div>
        <span className="roadmap-board-hint"><MousePointer2 size={12}/> drag to pan · ctrl + scroll to zoom · click a topic</span>
      </div>

      <aside className="roadmap-board-inspector" aria-live="polite">
        {selected ? <>
          <span className="roadmap-insight-label">{(stageNameOf.get(selected) ?? "Topic").toUpperCase()}</span>
          <h4>{selected}</h4>
          <p className="roadmap-inspector-progress"><strong>{selectedStat?.completed ?? 0}</strong> of <strong>{selectedStat?.total ?? 0}</strong> solved in your library</p>
          {(prerequisites.length > 0 || unlocks.length > 0) && <div className="roadmap-inspector-links">
            {prerequisites.length > 0 && <div><span><Route size={12}/> BEFORE IT</span>{prerequisites.map((item) => <button type="button" key={item} onClick={() => setSelected(item)}>{item}</button>)}</div>}
            {unlocks.length > 0 && <div><span><Target size={12}/> IT UNLOCKS</span>{unlocks.map((item) => <button type="button" key={item} onClick={() => setSelected(item)}>{item}</button>)}</div>}
          </div>}
          <div className="roadmap-inspector-list">
            {selectedProblems.length === 0 && <p>No problems from this pattern are in your current plan. Switch the focus area to include it.</p>}
            {selectedProblems.map((problem) => {
              const status = statusOf(problem.number);
              return <div className="roadmap-inspector-task" key={problem.number}>
                <span className="roadmap-task-number">{String(problem.number).padStart(3, "0")}</span>
                <div>
                  <a className="roadmap-problem-link" href={problem.link} target="_blank" rel="noreferrer"><strong>{problem.title}</strong><ExternalLink size={12}/></a>
                  <small>{problem.difficulty}</small>
                </div>
                <select
                  className={`roadmap-task-status ${status.toLowerCase().replace(" ", "-")}`}
                  aria-label={`Status for ${problem.title}`}
                  value={status}
                  onChange={(event) => onStatus(problem.number, event.target.value as BoardStatus)}
                >
                  <option>Todo</option>
                  <option>In progress</option>
                  <option>Solved</option>
                </select>
              </div>;
            })}
          </div>
          <button type="button" className="roadmap-inspector-close" onClick={() => setSelected(null)}>Close</button>
        </> : <div className="roadmap-inspector-empty">
          <MousePointer2 size={19}/>
          <strong>Pick a topic</strong>
          <span>See its place in the path, the problems scheduled for it, and mark them as you go.</span>
        </div>}
      </aside>
    </div>
  </section>;
}
