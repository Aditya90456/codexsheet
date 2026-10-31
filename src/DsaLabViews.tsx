import { useMemo } from "react";
import type {
  BarsFrame,
  BoardFrame,
  ChainFrame,
  DsaFrame,
  DsaTreeFrame,
  GraphFrame,
  GridFrame,
  IntervalFrame,
  LabTone,
} from "./dsa-labs-kernels";

type Lane = BarsFrame["lanes"][number];

const tone = (value: LabTone) => `t-${value}`;

function LabLanes({ lanes }: { lanes: Lane[] }) {
  if (!lanes.length) return null;
  return (
    <div className="lab-lanes">
      {lanes.map((lane) => (
        <div key={lane.label} className="lab-lane">
          <span className="lab-lane-label">{lane.label}</span>
          <div className={`lab-lane-items ${tone(lane.tone)}`}>
            {lane.items.length ? (
              lane.items.map((item, i) => (
                <em key={`${item}-${i}`} className={i === lane.hot ? "hot" : i > (lane.hot ?? -1) ? "future" : ""}>
                  {item}
                </em>
              ))
            ) : (
              <em className="none">empty</em>
            )}
          </div>
          {lane.note && <small>{lane.note}</small>}
        </div>
      ))}
    </div>
  );
}

function LabTally({ tally }: { tally: BarsFrame["tally"] }) {
  const parts: string[] = [];
  if (tally.comparisons) parts.push(`${tally.comparisons} comparison${tally.comparisons === 1 ? "" : "s"}`);
  if (tally.writes) parts.push(`${tally.writes} write${tally.writes === 1 ? "" : "s"}`);
  if (tally.probes) parts.push(`${tally.probes} probe${tally.probes === 1 ? "" : "s"}`);
  if (!parts.length) return null;
  return (
    <div className="lab-tally">
      {parts.map((part) => <span key={part}>{part}</span>)}
    </div>
  );
}

export function BarsView({ frame }: { frame: BarsFrame }) {
  const n = frame.values.length;
  const nums = frame.values.map((value) => Number(value));
  const numeric = n > 0 && nums.every((value) => Number.isFinite(value));
  const peak = Math.max(1, ...nums.filter((value) => Number.isFinite(value)));
  const width = 900;
  const height = 208;
  const top = 48;
  const base = height - 32;
  const gap = n > 24 ? 1 : 3;
  const bw = Math.max(6, (width - 24 - gap * Math.max(0, n - 1)) / Math.max(1, n));
  const xOf = (i: number) => 12 + i * (bw + gap);
  const hOf = (i: number) => {
    if (!numeric) return 38;
    const value = nums[i];
    if (value <= 0) return 8;
    return Math.max(8, (value / peak) * (base - top));
  };
  const marksAt = new Map<number, string[]>();
  frame.marks.forEach((mark) => marksAt.set(mark.index, [...(marksAt.get(mark.index) ?? []), mark.label]));
  const markTone = new Map<number, LabTone>();
  frame.marks.forEach((mark) => markTone.set(mark.index, mark.tone));
  return (
    <div className="csl-viz">
      <div className="lab-strip">
        <svg viewBox={`0 0 ${width} ${height}`} className="csl-svg" role="img" aria-label="Array state at this step">
          <line x1={8} y1={base} x2={width - 8} y2={base} className="csl-axis" />
          {frame.band && (
            <rect
              x={xOf(frame.band[0]) - 2}
              y={top - 12}
              width={Math.max(bw, xOf(frame.band[1]) + bw - xOf(frame.band[0]) + 4)}
              height={base - top + 18}
              rx={8}
              className="lab-band"
            />
          )}
          {frame.values.map((value, i) => {
            const h = hOf(i);
            const settled = frame.settled.includes(i);
            const pairEnd = frame.pair?.includes(i) ?? false;
            const markT = markTone.get(i);
            return (
              <g key={i}>
                <rect
                  x={xOf(i)}
                  y={base - h}
                  width={bw}
                  height={h}
                  rx={4}
                  className={`lab-bar${settled ? " settled" : ""}${markT ? ` ${tone(markT)}` : ""}${pairEnd ? " paired" : ""}`}
                />
                {bw >= 15 && (
                  <text x={xOf(i) + bw / 2} y={base - h - 6} className={`lab-value${markT ? ` ${tone(markT)}` : ""}`} textAnchor="middle">
                    {value}
                  </text>
                )}
                <text x={xOf(i) + bw / 2} y={base + 15} className="csl-tick" textAnchor="middle">{i}</text>
                {(marksAt.get(i) ?? []).map((label, k) => {
                  const chipWidth = Math.max(26, label.length * 6.4 + 12);
                  return (
                    <g key={label} transform={`translate(${xOf(i) + bw / 2}, ${14 + k * 17})`}>
                      <rect x={-chipWidth / 2} y={-11} width={chipWidth} height={17} rx={8} className={`lab-chip ${tone(markT ?? "active")}`} />
                      <text y={2} className={`lab-chip-text ${tone(markT ?? "active")}`} textAnchor="middle">{label}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
          {frame.pair && (
            <line
              x1={xOf(frame.pair[0]) + bw / 2}
              y1={base - hOf(frame.pair[0]) / 2}
              x2={xOf(frame.pair[1]) + bw / 2}
              y2={base - hOf(frame.pair[1]) / 2}
              className={`lab-pair ${tone(frame.pairTone)}`}
            />
          )}
        </svg>
        {!numeric && <p className="lab-legend">tokens left to right · {n} items</p>}
      </div>
      <LabLanes lanes={frame.lanes} />
      <LabTally tally={frame.tally} />
    </div>
  );
}

export function ChainView({ frame }: { frame: ChainFrame }) {
  const marksById = new Map<string, { label: string; tone: LabTone }[]>();
  frame.marks.forEach((mark) => marksById.set(mark.id, [...(marksById.get(mark.id) ?? []), { label: mark.label, tone: mark.tone }]));
  return (
    <div className="csl-viz">
      <div className="lab-rows">
        {frame.rows.map((row, rowIndex) => (
          <div key={`${row.label}-${rowIndex}`} className="lab-row">
            <span className="lab-rlabel">{row.label}</span>
            <div className="lab-chain">
              {row.nodes.length ? (
                row.nodes.map((node, i) => {
                  const marks = marksById.get(node.id) ?? [];
                  return (
                    <span key={node.id} className="lab-link">
                      <span className={`lab-node ${tone(node.tone)}${marks.length ? " pinned" : ""}`}>
                        {marks.length > 0 && <em>{marks.map((m) => m.label).join(" / ")}</em>}
                        <b>{node.text}</b>
                      </span>
                      {i < row.nodes.length - 1 && <span className="lab-arrow">→</span>}
                    </span>
                  );
                })
              ) : (
                <span className="lab-node empty t-ghost"><b>·</b></span>
              )}
            </div>
            {row.note && <small className="lab-rnote">{row.note}</small>}
          </div>
        ))}
      </div>
      {frame.formula && <p className="lab-formula"><code>{frame.formula}</code></p>}
      <LabTally tally={frame.tally} />
    </div>
  );
}

export function DsaTreeView({ frame }: { frame: DsaTreeFrame }) {
  const layout = useMemo(() => {
    const ids = frame.nodes.map((node) => node.id);
    const idSet = new Set(ids);
    const childrenOf = new Map<string, string[]>();
    const hasParent = new Set<string>();
    frame.edges.forEach((edge) => {
      if (!idSet.has(edge.from) || !idSet.has(edge.to)) return;
      childrenOf.set(edge.from, [...(childrenOf.get(edge.from) ?? []), edge.to]);
      hasParent.add(edge.to);
    });
    const roots = ids.filter((id) => !hasParent.has(id));
    const depth = new Map<string, number>();
    const xunit = new Map<string, number>();
    let cursor = 0;
    const walk = (id: string, level: number): number => {
      depth.set(id, level);
      const kids = childrenOf.get(id) ?? [];
      if (!kids.length) {
        const at = cursor;
        cursor += 1;
        xunit.set(id, at);
        return at;
      }
      const placed = kids.map((kid) => walk(kid, level + 1));
      const at = (placed[0] + placed[placed.length - 1]) / 2;
      xunit.set(id, at);
      return at;
    };
    roots.forEach((root) => {
      walk(root, 0);
      cursor += 0.6;
    });
    ids.filter((id) => !xunit.has(id)).forEach((id) => {
      xunit.set(id, cursor);
      depth.set(id, 0);
      cursor += 1;
    });
    const levels = Math.max(...[...depth.values()], 0);
    const span = Math.max(1, cursor - 0.6);
    return { roots, depth, xunit, levels, span, childrenOf };
  }, [frame.edges, frame.nodes]);

  const unit = Math.min(78, Math.max(34, 760 / (layout.span + 1)));
  const width = Math.max(420, layout.span * unit + 60);
  const height = layout.levels * 62 + 76;
  const xOf = (id: string) => 30 + ((layout.xunit.get(id) ?? 0) + 0.5) * unit;
  const yOf = (id: string) => 34 + (layout.depth.get(id) ?? 0) * 62;
  const textOf = new Map(frame.nodes.map((node) => [node.id, node]));
  return (
    <div className="csl-viz">
      <svg viewBox={`0 0 ${width} ${height}`} className="csl-svg tree" role="img" aria-label="Tree structure at this step">
        {frame.edges.map((edge, i) => {
          const from = textOf.get(edge.from);
          const to = textOf.get(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}-${i}`}
              x1={xOf(edge.from)}
              y1={yOf(edge.from) + 15}
              x2={xOf(edge.to)}
              y2={yOf(edge.to) - 15}
              className={`lab-edge ${tone(edge.tone)}`}
            />
          );
        })}
        {frame.nodes.map((node) => {
          const focused = frame.focus.includes(node.id);
          const label = node.text || node.id;
          const w = Math.max(30, Math.min(unit - 6, label.length * 8.4 + 16));
          return (
            <g key={node.id}>
              <rect
                x={xOf(node.id) - w / 2}
                y={yOf(node.id) - 15}
                width={w}
                height={30}
                rx={8}
                className={`lab-tnode ${tone(node.tone)}${focused ? " focus" : ""}`}
              />
              <text x={xOf(node.id)} y={yOf(node.id) + 4} className={`lab-ttext ${tone(node.tone)}`} textAnchor="middle">{label}</text>
              {node.note && <text x={xOf(node.id)} y={yOf(node.id) + 27} className="lab-tnote" textAnchor="middle">{node.note}</text>}
            </g>
          );
        })}
      </svg>
      {layout.roots.length > 1 && <p className="lab-legend">a forest, not one tree · {layout.roots.length} roots: {layout.roots.map((r) => textOf.get(r)?.text || r).join(", ")}</p>}
      <LabLanes lanes={frame.lanes} />
      <LabTally tally={frame.tally} />
    </div>
  );
}

export function GraphView({ frame }: { frame: GraphFrame }) {
  const pos = new Map(frame.nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
  return (
    <div className="csl-viz">
      <div className="lab-graphwrap">
        <svg viewBox="0 0 260 250" className="csl-svg lab-graph" role="img" aria-label="Graph being traversed">
          {frame.edges.map((edge) => {
            const a = pos.get(edge.a);
            const b = pos.get(edge.b);
            if (!a || !b) return null;
            const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            return (
              <g key={`${edge.a}-${edge.b}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`lab-gedge ${tone(edge.tone)}`} />
                {edge.weight !== null && (
                  <g transform={`translate(${mid.x}, ${mid.y})`}>
                    <rect x={-11} y={-8} width={22} height={15} rx={5} className="lab-gweight" />
                    <text y={3} className="lab-gweight-text" textAnchor="middle">{edge.weight}</text>
                  </g>
                )}
              </g>
            );
          })}
          {frame.nodes.map((node) => (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={15} className={`lab-gnode ${tone(node.tone)}`} />
              <text x={node.x} y={node.y + 4} className={`lab-gtext ${tone(node.tone)}`} textAnchor="middle">{node.value ?? node.id}</text>
            </g>
          ))}
        </svg>
        <div className="lab-tablewrap">
          <table className="csl-table lab-table">
            <thead><tr><th>node</th><th>{frame.table.some((row) => /∞/.test(row.dist)) ? "best" : "dist"}</th><th>via</th></tr></thead>
            <tbody>
              {frame.table.map((row) => (
                <tr key={row.id} className={row.tone === "active" ? "live" : row.tone === "done" ? "done" : ""}>
                  <td>{row.id}</td>
                  <td>{row.dist}</td>
                  <td>{row.via}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="csl-chiprow">
        <span className="csl-chip-label">order</span>
        {frame.visited.length ? frame.visited.map((id, i) => <em key={`${id}-${i}`} className="csl-chip">{i + 1} {id}</em>) : <em className="csl-chip empty">nothing settled yet</em>}
        <span className="csl-chip-label">frontier</span>
        {frame.frontier.length ? frame.frontier.map((id, i) => <em key={`${id}-f${i}`} className="csl-chip live">{id}</em>) : <em className="csl-chip empty">empty</em>}
        {frame.current && <em className="csl-chip event">at {frame.current}</em>}
      </div>
      <LabTally tally={frame.tally} />
    </div>
  );
}

export function GridView({ frame }: { frame: GridFrame }) {
  const sourceSet = new Set(frame.sources.map(([r, c]) => `${r}:${c}`));
  return (
    <div className="csl-viz">
      <div className="lab-gridwrap">
        <table className="lab-grid">
          <thead>
            <tr>
              <th className="corner" />
              {frame.colLabels.map((label, c) => <th key={`c${c}`}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {frame.cells.map((row, r) => (
              <tr key={frame.rowLabels[r] ?? r}>
                <th className="rowhead">{frame.rowLabels[r]}</th>
                {row.map((entry, c) => {
                  const isActive = frame.active?.[0] === r && frame.active?.[1] === c;
                  return (
                    <td
                      key={`${r}-${c}`}
                      className={`${tone(entry.tone)}${isActive ? " active" : ""}${sourceSet.has(`${r}:${c}`) ? " source" : ""}`}
                    >
                      {entry.text}
                      {isActive && <i>◂ reading</i>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LabLanes lanes={frame.lanes} />
      <LabTally tally={frame.tally} />
    </div>
  );
}

export function BoardView({ frame }: { frame: BoardFrame }) {
  const queens = new Map(frame.queens.map((q) => [`${q.r}:${q.c}`, q.tone]));
  const attacked = new Set(frame.attacked.map((a) => `${a.r}:${a.c}`));
  const placedRows = new Set(frame.queens.map((q) => q.r));
  return (
    <div className="csl-viz">
      <div className="lab-boardwrap">
        <div className="lab-board" style={{ gridTemplateColumns: `repeat(${frame.size}, 1fr)` }}>
          {Array.from({ length: frame.size * frame.size }, (_, i) => {
            const r = Math.floor(i / frame.size);
            const c = i % frame.size;
            const key = `${r}:${c}`;
            const q = queens.get(key);
            return (
              <span
                key={key}
                className={`lab-sq${(r + c) % 2 ? " dark" : ""}${q ? ` queen ${tone(q)}` : attacked.has(key) ? " hit" : ""}${placedRows.has(r) ? " rowset" : ""}`}
              >
                {q ? "♛" : attacked.has(key) ? "·" : ""}
              </span>
            );
          })}
        </div>
        <div className="lab-boardside">
          <h4>{frame.size}-Queens · {frame.solutions.length} solution{frame.solutions.length === 1 ? "" : "s"}</h4>
          {frame.solutions.slice(-6).map((solution, i) => (
            <p key={i} className="lab-sol">
              <b>#{i + 1}</b>
              {solution.map((c, r) => <em key={r} className={c === (frame.queens[frame.queens.length - 1]?.c ?? -1) && r === (frame.queens.length - 1) ? "hot" : ""}>{c}</em>)}
            </p>
          ))}
          {!frame.solutions.length && <p className="lab-sol empty">no complete placement yet - every branch so far got pruned or is still open</p>}
        </div>
      </div>
      <LabLanes lanes={frame.lanes} />
      <LabTally tally={frame.tally} />
    </div>
  );
}

export function IntervalView({ frame }: { frame: IntervalFrame }) {
  const width = 880;
  const left = 74;
  const right = 20;
  const rows: number[] = frame.items.map(() => 0);
  const rowEnds: number[] = [];
  frame.items.forEach((item, i) => {
    const slot = rowEnds.findIndex((end) => end <= item.start);
    if (slot === -1) {
      rowEnds.push(item.end);
      rows[i] = rowEnds.length - 1;
    } else {
      rowEnds[slot] = item.end;
      rows[i] = slot;
    }
  });
  const rowCount = Math.max(1, rowEnds.length);
  const height = rowCount * 34 + 46;
  const span = Math.max(1, frame.span);
  const xOf = (t: number) => left + (t / span) * (width - left - right);
  const ticks: number[] = [];
  const step = span > 20 ? Math.ceil(span / 12) : span > 10 ? 2 : 1;
  for (let t = 0; t <= span; t += step) ticks.push(t);
  if (ticks[ticks.length - 1] !== span) ticks.push(span);
  return (
    <div className="csl-viz">
      <svg viewBox={`0 0 ${width} ${height}`} className="csl-svg" role="img" aria-label="Intervals on a timeline">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={xOf(t)} y1={10} x2={xOf(t)} y2={height - 26} className="csl-grid-line" />
            <text x={xOf(t)} y={height - 10} className="csl-tick" textAnchor="middle">{t}</text>
          </g>
        ))}
        {frame.lastEnd !== null && (
          <line x1={xOf(frame.lastEnd)} y1={8} x2={xOf(frame.lastEnd)} y2={height - 26} className="lab-cursor-line" />
        )}
        {frame.items.map((item, i) => {
          const y = 14 + rows[i] * 34;
          const isCursor = frame.cursor === item.id;
          return (
            <g key={item.id}>
              <rect
                x={xOf(item.start)}
                y={y}
                width={Math.max(6, xOf(item.end) - xOf(item.start))}
                height={22}
                rx={6}
                className={`lab-ibar ${tone(item.tone)}${isCursor ? " cursor" : ""}`}
              />
              <text x={xOf(item.start) + 5} y={y + 15} className={`lab-ilabel ${tone(item.tone)}`} textAnchor="start">{item.label}</text>
              <title>{`${item.label}: ${item.start} to ${item.end}`}</title>
              {isCursor && <line x1={xOf(item.end)} y1={y - 3} x2={xOf(item.end)} y2={y + 25} className="lab-cursor-line" />}
            </g>
          );
        })}
        <line x1={left} y1={height - 26} x2={width - right} y2={height - 26} className="csl-axis" />
        <text x={left - 62} y={height - 26} className="csl-axis-label">time</text>
      </svg>
      <div className="csl-chiprow">
        <span className="csl-chip-label">chosen</span>
        {frame.items.filter((item) => item.tone === "good").length
          ? frame.items.filter((item) => item.tone === "good").map((item) => <em key={item.id} className="csl-chip hit">{item.label}</em>)
          : <em className="csl-chip empty">nothing picked yet</em>}
        {frame.lastEnd !== null && <em className="csl-chip">last end {frame.lastEnd}</em>}
      </div>
      <LabLanes lanes={frame.lanes} />
      <LabTally tally={frame.tally} />
    </div>
  );
}

export function renderDsaFrame(frame: DsaFrame) {
  switch (frame.kind) {
    case "bars": return <BarsView frame={frame} />;
    case "chain": return <ChainView frame={frame} />;
    case "dsatree": return <DsaTreeView frame={frame} />;
    case "graph": return <GraphView frame={frame} />;
    case "grid": return <GridView frame={frame} />;
    case "board": return <BoardView frame={frame} />;
    case "interval": return <IntervalView frame={frame} />;
  }
}
