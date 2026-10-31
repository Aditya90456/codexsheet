import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  GitBranch,
  HardDrive,
  Lightbulb,
  Network,
  Pause,
  Play,
  RotateCcw,
  Sigma,
  Sparkles,
  TriangleAlert,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  cacheSummary,
  cpuAlgorithms,
  cpuMetrics,
  csSubjects,
  csTopicById,
  csTopics,
  runCpu,
  type BankerFrame,
  type CacheFrame,
  type CpuAlgorithmId,
  type CpuFrame,
  type CsFrame,
  type CsSubject,
  type CsTopicId,
  type GanttBlock,
  type PagingFrame,
  type TcpFrame,
  type TreeFrame,
  type TreeNode,
} from "./cs-labs-kernels";
import { useT, useUiLanguage } from "./i18n";
import { speak, stopSpeaking, voiceSupported } from "./mentor-voice";

const palette = ["#3b82f6", "#34d399", "#fbbf24", "#a78bfa", "#60a5fa", "#f472b6", "#22d3ee", "#fb923c"];
const subjectIcon = { os: Cpu, db: Database, network: Network, arch: HardDrive } as const;

const colorFor = (key: string) => palette[[...key].reduce((sum, c) => sum + c.charCodeAt(0), 0) % palette.length];

const pad = (value: number, width: number) => {
  const text = value.toFixed(width);
  return text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
};

function ticksUpTo(end: number) {
  const step = end > 30 ? Math.ceil(end / 15) : end > 14 ? 2 : 1;
  const marks: number[] = [];
  for (let t = 0; t <= end; t += step) marks.push(t);
  if (marks[marks.length - 1] !== end) marks.push(end);
  return marks;
}

function GanttView({ frame }: { frame: CpuFrame }) {
  const end = Math.max(1, ...frame.gantt.map((b) => b.end));
  const width = 900;
  const left = 34;
  const usable = width - left - 14;
  const px = (t: number) => left + (t / end) * usable;
  return (
    <div className="csl-viz">
      <svg viewBox={`0 0 ${width} 108`} className="csl-svg" role="img" aria-label="Gantt chart of the schedule">
        {ticksUpTo(end).map((t) => (
          <g key={t}>
            <line x1={px(t)} y1={14} x2={px(t)} y2={62} className="csl-grid-line" />
            <text x={px(t)} y={76} className="csl-tick" textAnchor="middle">{t}</text>
          </g>
        ))}
        <text x={left - 26} y={40} className="csl-axis-label">CPU</text>
        {frame.gantt.map((block, i) => (
          <g key={`${block.pid}-${block.start}`}>
            <rect
              x={px(block.start) + 1}
              y={20}
              width={Math.max(2, px(block.end) - px(block.start) - 2)}
              height={34}
              rx={5}
              fill={block.idle ? "transparent" : colorFor(block.pid)}
              className={`csl-gantt-block${block.idle ? " idle" : ""}${block.pid === frame.running ? " live" : ""}`}
            />
            {!block.idle && px(block.end) - px(block.start) > 22 && (
              <text x={(px(block.start) + px(block.end)) / 2} y={41} className="csl-block-label" textAnchor="middle">{block.pid}</text>
            )}
            <title>{`${block.idle ? "idle" : block.pid}: t ${block.start} to ${block.end}`}</title>
            {i === frame.gantt.length - 1 && !block.idle && (
              <line x1={px(block.end)} y1={16} x2={px(block.end)} y2={58} className="csl-now" />
            )}
          </g>
        ))}
        <line x1={left} y1={62} x2={width - 14} y2={62} className="csl-axis" />
      </svg>
      <div className="csl-queues">
        <div className="csl-chiprow">
          <span className="csl-chip-label">running</span>
          {frame.running ? <em className="csl-chip live" style={{ borderColor: colorFor(frame.running) }}>{frame.running}</em> : <em className="csl-chip idle">idle</em>}
          <span className="csl-chip-label">ready</span>
          {frame.ready.length ? frame.ready.map((pid, i) => (
            <em key={pid} className="csl-chip" style={{ borderColor: colorFor(pid) }}>
              <b>{i + 1}</b> {pid}
            </em>
          )) : <em className="csl-chip empty">empty</em>}
        </div>
        {frame.finished.length > 0 && (
          <table className="csl-table">
            <thead><tr><th>pid</th><th>arrival</th><th>burst</th><th>completion</th><th>turnaround</th><th>waiting</th></tr></thead>
            <tbody>
              {frame.finished.map((row) => (
                <tr key={row.pid} className={row.pid === frame.running ? "live" : ""}>
                  <td><i style={{ background: colorFor(row.pid) }} />{row.pid}</td>
                  <td>{row.arrival}</td><td>{row.burst}</td><td>{row.completion}</td><td>{row.turnaround}</td><td>{row.waiting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BitBar({ parts }: { parts: { text: string; label: string; tone: string }[] }) {
  const total = parts.reduce((sum, p) => sum + p.text.length, 0);
  return (
    <div className="csl-bitbar">
      {parts.map((part) => (
        <div key={part.label} className={`csl-bit ${part.tone}`} style={{ flexGrow: part.text.length / Math.max(1, total) }}>
          <span className="csl-bit-bits">{part.text}</span>
          <span className="csl-bit-label">{part.label}</span>
        </div>
      ))}
    </div>
  );
}

function PagingView({ frame }: { frame: PagingFrame }) {
  return (
    <div className="csl-viz">
      <div className="csl-flow">
        <section className="csl-card">
          <h4>virtual address <b>{frame.address}</b></h4>
          <BitBar parts={[
            { text: frame.pageBin, label: `page number (${frame.pageBin.length} bits) = ${frame.page}`, tone: "page" },
            { text: frame.offsetBin, label: `offset (${frame.offsetBin.length} bits) = ${frame.offset}`, tone: "offset" },
          ]} />
        </section>
        <section className="csl-card">
          <h4>TLB · {frame.tlb.length} entries <em className={frame.tlbHit ? "hit" : "miss"}>{frame.tlbHit ? "HIT" : "MISS"}</em></h4>
          <div className="csl-slots">
            {frame.tlb.map((entry, i) => (
              <div key={`${entry.page}-${i}`} className={`csl-slot${entry.page === frame.page && frame.tlbHit ? " live" : ""}`}>
                <b>p{entry.page}</b><span>→</span><b>f{entry.frame}</b>
              </div>
            ))}
            {frame.tlb.length === 0 && <div className="csl-slot empty"><span>cold - nothing cached yet</span></div>}
          </div>
          <p className="csl-hint">{frame.walked ? "TLB missed, so the table was walked - two memory accesses instead of one." : "Translation served from the TLB - one access."}</p>
        </section>
        <section className="csl-card">
          <h4>page table <b>{frame.table.length} entries</b></h4>
          <div className="csl-slots wrap">
            {frame.table.map((value, i) => (
              <div key={i} className={`csl-cell${i === frame.page ? " live" : ""}${value === frame.frame && !frame.tlbHit ? " chosen" : ""}`}>
                <span className="csl-cell-index">{i}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </section>
        <section className="csl-card">
          <h4>physical address <b>{frame.physical < 0 ? "unmapped" : frame.physical}</b></h4>
          <BitBar parts={frame.frame < 0
            ? [{ text: "-", label: "no frame - page fault", tone: "bad" }]
            : [
              { text: String(frame.frame), label: `frame ${frame.frame}`, tone: "frame" },
              { text: String(frame.offset), label: `offset ${frame.offset}`, tone: "offset" },
            ]} />
          <p className="csl-hint">{frame.frame < 0 ? "The reference is outside the table." : `${frame.frame} x page size + ${frame.offset} = ${frame.physical}`}</p>
        </section>
      </div>
      <div className="csl-meter">
        <div className="csl-meterbar">
          <span className="hit" style={{ width: `${(frame.hits / Math.max(1, frame.hits + frame.misses)) * 100}%` }} />
        </div>
        <p><b>{frame.hits}</b> TLB hits · <b>{frame.misses}</b> walks · hit ratio <b>{Math.round((frame.hits / Math.max(1, frame.hits + frame.misses)) * 100)}%</b> after {frame.index + 1} references</p>
      </div>
    </div>
  );
}

function BankerView({ frame }: { frame: BankerFrame }) {
  const header = (cols: string[]) => <thead><tr><th />{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>;
  const letters = frame.resources;
  const matrix = (title: string, rows: number[][], highlight: boolean) => (
    <section className={`csl-card csl-matrix${highlight ? " focus" : ""}`}>
      <h4>{title}</h4>
      <table>
        {header(letters)}
        <tbody>
          {rows.map((row, i) => (
            <tr key={frame.processes[i] ?? i} className={frame.examining === frame.processes[i] ? "live" : ""}>
              <th>{frame.processes[i]}</th>
              {row.map((value, r) => <td key={r}>{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
  return (
    <div className="csl-viz">
      <div className="csl-flow wide">
        {matrix("ALLOCATION", frame.allocation, false)}
        {matrix("MAX → NEED", frame.need, true)}
        <section className="csl-card">
          <h4>resources</h4>
          <div className="csl-vectors">
            <div><span>AVAILABLE</span>{frame.available.map((value, r) => <b key={r}>{letters[r]}{value}</b>)}</div>
            <div className={frame.phase === "trial" ? "work" : ""}><span>{frame.phase === "trial" ? "WORK (hypothetical)" : "WORK"}</span>{frame.work.map((value, r) => <b key={r}>{letters[r]}{value}</b>)}</div>
          </div>
          {frame.requested && <p className="csl-hint">request: {frame.requested.map((value, r) => `${letters[r]}=${value}`).join("  ")}</p>}
        </section>
        <section className="csl-card">
          <h4>finish flags</h4>
          <div className="csl-slots wrap">
            {frame.finish.map((done, i) => (
              <div key={i} className={`csl-slot${done ? " done" : ""}${frame.examining === frame.processes[i] ? " live" : ""}`}>
                <b>{frame.processes[i]}</b><span>{done ? "TRUE" : "false"}</span>
              </div>
            ))}
          </div>
          <div className="csl-sequence">
            {frame.sequence.length ? frame.sequence.map((pid, i) => (
              <span key={pid}><i>{i + 1}</i>{pid}{i < frame.sequence.length - 1 && <em>→</em>}</span>
            )) : <em className="csl-chip empty">no sequence yet</em>}
          </div>
        </section>
      </div>
      {frame.phase === "verdict" && (
        <div className={`csl-verdict ${frame.granted ? "yes" : "no"}`}>
          {frame.granted ? "SAFE - the bank grants it" : "UNSAFE - the request is rolled back"}
        </div>
      )}
    </div>
  );
}

function TreeView({ frame }: { frame: TreeFrame }) {
  const byId = useMemo(() => new Map(frame.nodes.map((node) => [node.id, node])), [frame.nodes]);
  const layout = useMemo(() => {
    const placed = new Map<number, { x: number; y: number; node: TreeNode }>();
    const widths = new Map<number, number>();
    const widthOf = (node: TreeNode) => Math.max(58, node.keys.length * 26 + 14);
    const depthOf = (id: number): number => {
      const node = byId.get(id);
      if (!node) return 0;
      return node.leaf ? 0 : 1 + Math.max(...node.children.map(depthOf), 0);
    };
    const maxDepth = depthOf(frame.root);
    let cursor = 0;
    const visit = (id: number): number => {
      const node = byId.get(id);
      if (!node) return cursor;
      const w = widthOf(node);
      widths.set(id, w);
      let x: number;
      if (node.leaf) {
        x = cursor + w / 2;
        cursor += w + 12;
      } else {
        const kids = node.children.map(visit);
        x = (kids[0] + kids[kids.length - 1]) / 2;
      }
      placed.set(id, { x, y: (maxDepth - depthOf(id)) * 92 + 30, node });
      return x;
    };
    visit(frame.root);
    return { placed, widths, maxDepth, span: cursor };
  }, [byId, frame.root]);

  const height = 92 * (layout.maxDepth + 1) + 60;
  const viewBoxWidth = Math.max(420, layout.span + 30);
  return (
    <div className="csl-viz">
      <svg viewBox={`0 0 ${viewBoxWidth} ${height}`} className="csl-svg tree" role="img" aria-label="B+ tree after each insert">
        {[...layout.placed.entries()].map(([id, { node, x, y }]) => (
          <g key={`edges-${id}`}>
            {node.children.map((child) => {
              const target = layout.placed.get(child);
              if (!target) return null;
              return <line key={`${id}-${child}`} x1={x} y1={y + 14} x2={target.x} y2={target.y - 14} className={`csl-edge${frame.touched.includes(id) && frame.touched.includes(child) ? " live" : ""}`} />;
            })}
          </g>
        ))}
        {[...layout.placed.values()].map(({ node, x, y }) => {
          const w = layout.widths.get(node.id) ?? 60;
          const touched = frame.touched.includes(node.id);
          return (
            <g key={node.id}>
              <rect x={x - w / 2} y={y - 16} width={w} height={32} rx={6} className={`csl-node${node.leaf ? " leaf" : ""}${touched ? " live" : ""}${frame.split && touched ? " split" : ""}`} />
              {node.keys.map((key, i) => (
                <text key={`${key}-${i}`} x={x - w / 2 + 14 + i * 26} y={y + 4} className="csl-key" textAnchor="middle">{key}</text>
              ))}
              {!node.keys.length && <text x={x} y={y + 4} className="csl-key empty" textAnchor="middle">·</text>}
            </g>
          );
        })}
      </svg>
      <div className="csl-keys-row">
        <span className="csl-chip-label">insert order</span>
        {frame.keys.map((key, i) => <em key={`${key}-${i}`} className={`csl-chip${i === frame.step - 1 ? " live" : ""}${i >= frame.step ? " future" : ""}`}>{key}</em>)}
      </div>
    </div>
  );
}

function TcpView({ frame, history }: { frame: TcpFrame; history: TcpFrame[] }) {
  const points = frame.points;
  const maxRtt = Math.max(1, points[points.length - 1].rtt);
  const maxCwnd = Math.max(4, ...points.map((p) => p.cwnd), ...history.map((f) => f.ssthresh));
  const width = 900;
  const height = 260;
  const left = 40;
  const bottom = height - 30;
  const x = (rtt: number) => left + (rtt / maxRtt) * (width - left - 16);
  const y = (cwnd: number) => bottom - (cwnd / maxCwnd) * (bottom - 18);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.rtt)},${y(p.cwnd)}`).join(" ");
  const area = `${path} L${x(maxRtt)},${bottom} L${left},${bottom} Z`;
  const seen = history.filter((f) => f.rtt <= frame.rtt);
  const threshold = seen.length
    ? seen.map((p, i) => `${i ? "L" : "M"}${x(p.rtt)},${y(p.ssthresh)}`).join(" ")
    : `M${left},${y(frame.ssthresh)} L${width - 16},${y(frame.ssthresh)}`;
  return (
    <div className="csl-viz">
      <svg viewBox={`0 0 ${width} ${height}`} className="csl-svg" role="img" aria-label="Congestion window over time">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = Math.round((maxCwnd / 4) * i);
          return (
            <g key={i}>
              <line x1={left} y1={y(value)} x2={width - 16} y2={y(value)} className="csl-grid-line" />
              <text x={left - 8} y={y(value) + 4} className="csl-tick" textAnchor="end">{value}</text>
            </g>
          );
        })}
        <path d={area} className="csl-area" />
        <path d={threshold} className="csl-ssthresh" />
        <text x={width - 18} y={y(frame.ssthresh) - 6} className="csl-ssthresh-label" textAnchor="end">ssthresh {frame.ssthresh}</text>
        <path d={path} className="csl-cwnd" />
        {points.map((p) => (
          <circle key={p.rtt} cx={x(p.rtt)} cy={y(p.cwnd)} r={p.rtt === frame.rtt ? 5 : 2.6} className={`csl-dot${p.rtt === frame.rtt ? " live" : ""}`} />
        ))}
        {[0, Math.round(maxRtt / 2), maxRtt].map((rtt) => (
          <text key={rtt} x={x(rtt)} y={bottom + 18} className="csl-tick" textAnchor="middle">RTT {rtt}</text>
        ))}
        <line x1={left} y1={bottom} x2={width - 16} y2={bottom} className="csl-axis" />
        <text x={left - 30} y={18} className="csl-axis-label">cwnd (MSS)</text>
      </svg>
      <div className="csl-queues">
        <div className="csl-chiprow">
          <span className="csl-chip-label">phase</span>
          <em className={`csl-chip phase-${frame.phase}`}>{frame.phase.replace("-", " ")}</em>
          <span className="csl-chip-label">cwnd</span><em className="csl-chip live">{frame.cwnd} MSS</em>
          <span className="csl-chip-label">ssthresh</span><em className="csl-chip">{frame.ssthresh}</em>
          {frame.event && <em className="csl-chip event">{frame.event}</em>}
        </div>
      </div>
    </div>
  );
}

function CacheView({ frame }: { frame: CacheFrame }) {
  return (
    <div className="csl-viz">
      <div className="csl-cachehead">
        <BitBar parts={[
          { text: String(frame.tag), label: `tag = ${frame.tag}`, tone: "frame" },
          { text: String(frame.set), label: `set index = ${frame.set}`, tone: "page" },
        ]} />
        <em className={`csl-chip ${frame.hit ? "hit" : "miss"}`}>{frame.hit ? "HIT" : frame.evicted === null ? "MISS · cold fill" : "MISS · conflict"}</em>
      </div>
      <div className="csl-cache">
        <div className="csl-cache-col head">
          {frame.ways.map((_, i) => <span key={i} className="csl-wayname">set {i}</span>)}
        </div>
        <div className="csl-cache-grid">
          {frame.ways.map((bucket, setIndex) => (
            <div key={setIndex} className={`csl-cache-row${setIndex === frame.set ? " live" : ""}`}>
              <span className="csl-wayname">{setIndex}</span>
              {bucket.map((entry, wayIndex) => {
                const isTarget = setIndex === frame.set;
                const evictedHere = isTarget && !frame.hit && frame.evicted !== null && entry.tag !== null && entry.tag !== frame.tag;
                return (
                  <div
                    key={wayIndex}
                    className={`csl-cachecell${entry.tag === null ? " empty" : ""}${isTarget && entry.tag === frame.tag ? " filled" : ""}${evictedHere ? " ghost" : ""}`}
                    style={{ borderColor: entry.tag === null ? undefined : colorFor(String(entry.tag)) }}
                  >
                    {entry.tag === null ? <span>·</span> : <b>tag {entry.tag}</b>}
                    <small>{entry.tag === null ? "free" : entry.stamp === frame.step ? "used now" : `${frame.step - entry.stamp} access${frame.step - entry.stamp === 1 ? "" : "es"} ago`}</small>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="csl-trace">
        {frame.trace.slice(-6).map((line, i) => <span key={i} className={line.startsWith("hit") ? "hit" : "miss"}>{line}</span>)}
      </div>
      <div className="csl-meter">
        <div className="csl-meterbar">
          <span className="hit" style={{ width: `${(frame.hits / Math.max(1, frame.hits + frame.misses)) * 100}%` }} />
        </div>
        <p><b>{frame.hits}</b> hits · <b>{frame.misses}</b> misses · hit ratio <b>{Math.round((frame.hits / Math.max(1, frame.hits + frame.misses)) * 100)}%</b></p>
      </div>
    </div>
  );
}

function renderFrame(frame: CsFrame, history: CsFrame[]) {
  switch (frame.kind) {
    case "cpu": return <GanttView frame={frame} />;
    case "paging": return <PagingView frame={frame} />;
    case "banker": return <BankerView frame={frame} />;
    case "tree": return <TreeView frame={frame} />;
    case "tcp": return <TcpView frame={frame} history={history.filter((f): f is TcpFrame => f.kind === "tcp")} />;
    case "cache": return <CacheView frame={frame} />;
  }
}

function metricsOf(frame: CsFrame, frames: CsFrame[]) {
  const rows: { label: string; value: string; hint?: string }[] = [];
  if (frame.kind === "cpu") {
    const cpuFrames = frames as CpuFrame[];
    const m = cpuMetrics(cpuFrames);
    const last = cpuFrames[cpuFrames.length - 1];
    rows.push({ label: "average waiting time", value: `${pad(m.avgWait, 2)} units`, hint: "sum of (turnaround - burst) per process" });
    rows.push({ label: "average turnaround", value: `${pad(m.avgTurnaround, 2)} units` });
    rows.push({ label: "CPU utilisation", value: `${Math.round(m.cpuUse * 100)}%` });
    rows.push({ label: "context switches", value: String(Math.max(0, last.gantt.filter((b: GanttBlock, i: number, arr: GanttBlock[]) => !b.idle && (i === 0 || arr[i - 1].pid !== b.pid)).length - 1)) });
  } else if (frame.kind === "paging") {
    const total = frame.hits + frame.misses;
    rows.push({ label: "TLB hit ratio", value: `${Math.round((frame.hits / Math.max(1, total)) * 100)}%` });
    rows.push({ label: "memory accesses paid", value: String(total + frame.misses), hint: "a walk costs the table read plus the real read" });
    rows.push({ label: "page size", value: `${2 ** frame.offsetBin.length} bytes`, hint: `${frame.offsetBin.length} offset bits` });
  } else if (frame.kind === "banker") {
    const verdicts = frames.filter((f): f is BankerFrame => f.kind === "banker" && f.phase === "verdict");
    rows.push({ label: "requests granted", value: String(verdicts.filter((v) => v.granted).length) });
    rows.push({ label: "requests denied", value: String(verdicts.filter((v) => !v.granted).length) });
    rows.push({ label: "safe sequence", value: frame.sequence.length ? `<${frame.sequence.join(", ")}>` : "none found" });
  } else if (frame.kind === "tree") {
    const leaves = frame.nodes.filter((n) => n.leaf);
    const heightOf = (id: number): number => {
      const node = frame.nodes.find((n) => n.id === id);
      if (!node || node.leaf) return 0;
      return 1 + Math.max(...node.children.map(heightOf));
    };
    rows.push({ label: "tree height", value: String(heightOf(frame.root)), hint: "grows only when the root splits" });
    rows.push({ label: "leaf nodes", value: String(leaves.length) });
    rows.push({ label: "keys stored", value: String(leaves.reduce((sum, n) => sum + n.keys.length, 0)) });
    rows.push({ label: "order", value: "4", hint: "max 3 keys in a leaf, 2 in an internal node" });
  } else if (frame.kind === "tcp") {
    const tcpFrames = frames as TcpFrame[];
    const events = tcpFrames.filter((f) => f.event);
    const peak = Math.max(...tcpFrames.map((f) => f.cwnd));
    const avg = tcpFrames.reduce((sum, f) => sum + f.cwnd, 0) / tcpFrames.length;
    rows.push({ label: "peak window", value: `${peak} MSS` });
    rows.push({ label: "mean window", value: `${pad(avg, 1)} MSS` });
    rows.push({ label: "congestion events", value: String(events.length), hint: events.map((e) => `${e.rtt}: ${e.event}`).join(" · ") });
  } else if (frame.kind === "cache") {
    const total = frame.hits + frame.misses;
    rows.push({ label: "hit ratio", value: `${Math.round((frame.hits / Math.max(1, total)) * 100)}%` });
    rows.push({ label: "conflict misses", value: String(frames.filter((f) => f.kind === "cache" && !f.hit && f.evicted !== null).length) });
    rows.push({ label: "cold misses", value: String(frames.filter((f) => f.kind === "cache" && !f.hit && f.evicted === null).length) });
  }
  return rows;
}

export default function CsLabs({ onOpenPass }: { onOpenPass: () => void }) {
  const tr = useT();
  const lang = useUiLanguage();
  const [subject, setSubject] = useState<CsSubject | "all">("all");
  const [topicId, setTopicId] = useState<CsTopicId>(globalThis.__CSL_T);
  const topic = csTopicById(topicId);
  const [input, setInput] = useState(globalThis.__CSL_INPUT ?? topic.defaultInput);
  const [algorithm, setAlgorithm] = useState<CpuAlgorithmId>(globalThis.__CSL_A);
  const [index, setIndex] = useState(globalThis.__CSL_I | 0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [spoken, setSpoken] = useState(false);
  const [tab, setTab] = useState<"deep" | "traps" | "interview">("deep");

  const frames = useMemo(() => topic.run(input, algorithm), [topic, input, algorithm]);
  const atEnd = index >= frames.length - 1;
  const frame = frames[Math.min(index, Math.max(0, frames.length - 1))];

  useEffect(() => {
    setInput(topic.defaultInput);
    setIndex(0);
    setPlaying(false);
  }, [topicId, topic.defaultInput]);

  useEffect(() => {
    if (!playing) return;
    if (index >= frames.length - 1) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setIndex((i) => Math.min(i + 1, frames.length - 1)), 1500 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, index, frames.length, speed]);

  useEffect(() => {
    if (!spoken) { stopSpeaking(); return; }
    if (!frame) return;
    speak(`${frame.caption}. ${frame.detail}`, { lang, mood: "think" });
  }, [spoken, frame, lang]);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") { event.preventDefault(); setPlaying(false); setIndex((i) => Math.min(i + 1, frames.length - 1)); }
      if (event.key === "ArrowLeft") { event.preventDefault(); setPlaying(false); setIndex((i) => Math.max(0, i - 1)); }
      if (event.key === " ") { event.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [frames.length]);

  const visibleTopics = subject === "all" ? csTopics : csTopics.filter((t) => t.subject === subject);
  const compare = useMemo(() => {
    if (topic.id !== "cpu-scheduling") return [];
    return cpuAlgorithms.map((option) => {
      const run = runCpu(option.id, input, 2);
      const m = cpuMetrics(run);
      return { ...option, avgWait: m.avgWait, avgTurnaround: m.avgTurnaround };
    });
  }, [topic.id, input]);
  const associativity = useMemo(() => (topic.id === "cache-lru" ? cacheSummary(input) : null), [topic.id, input]);
  const worstWait = Math.max(0.001, ...compare.map((c) => c.avgWait));

  return (
    <section className="cslabs">
      <header className="csl-top">
        <div>
          <span className="csl-kicker"><Sparkles size={12} /> CORE COMPUTER SCIENCE · SIMULATED</span>
          <h1>CS Labs</h1>
          <p>{tr("cslabs.sub")}</p>
        </div>
        <div className="csl-subjects" role="group" aria-label="Subjects">
          <button className={subject === "all" ? "active" : ""} onClick={() => setSubject("all")}>All</button>
          {csSubjects.map((entry) => {
            const Icon = subjectIcon[entry.id];
            return (
              <button key={entry.id} className={subject === entry.id ? "active" : ""} onClick={() => setSubject(entry.id)}>
                <Icon size={14} /> {entry.label}
              </button>
            );
          })}
        </div>
      </header>

      <nav className="csl-topics" aria-label="Topics">
        {visibleTopics.map((entry) => (
          <button key={entry.id} className={entry.id === topicId ? "active" : ""} onClick={() => setTopicId(entry.id)} aria-pressed={entry.id === topicId}>
            <strong>{entry.title}</strong>
            <small>{entry.blurb}</small>
          </button>
        ))}
      </nav>

      <div className="csl-board">
        <aside className="csl-panel csl-side">
          <h3>{tr("cslabs.workload")} <em>{topic.inputLabel}</em></h3>
          <textarea
            value={input}
            onChange={(event) => { setInput(event.target.value); setIndex(0); setPlaying(false); }}
            rows={4}
            spellCheck={false}
            aria-label={topic.inputLabel}
          />
          <div className="csl-side-actions">
            <button onClick={() => { setInput(topic.defaultInput); setIndex(0); }}><RotateCcw size={13} /> {tr("cslabs.sample")}</button>
            <span>{frames.length} {tr("cslabs.steps")}</span>
          </div>

          {topic.hasAlgorithm && (
            <>
              <h3 className="spaced">{tr("cslabs.algorithm")}</h3>
              <div className="csl-algos">
                {cpuAlgorithms.map((option) => (
                  <button key={option.id} className={option.id === algorithm ? "active" : ""} onClick={() => { setAlgorithm(option.id); setIndex(0); setPlaying(false); }} title={option.note}>
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="csl-note">{cpuAlgorithms.find((o) => o.id === algorithm)?.note}</p>
              <h3 className="spaced">Same workload, four policies</h3>
              <ul className="csl-compare">
                {compare.map((row) => (
                  <li key={row.id}>
                    <button onClick={() => { setAlgorithm(row.id); setIndex(0); }} className={row.id === algorithm ? "active" : ""}>
                      <span className="csl-compare-label">{row.label}</span>
                      <span className="csl-compare-bar" style={{ width: `${(row.avgWait / worstWait) * 100}%`, background: colorFor(row.id) }} />
                      <b>{pad(row.avgWait, 2)}</b>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="csl-note">Average waiting time in units. Lower is better - SJF is the provable minimum for this set of jobs.</p>
            </>
          )}

          {associativity && (
            <>
              <h3 className="spaced">What associativity buys</h3>
              <ul className="csl-compare">
                {([["direct-mapped", associativity.direct], ["2-way", associativity.twoWay], ["4-way", associativity.fourWay], ["as configured", associativity.configured]] as const).map(([label, value]) => (
                  <li key={label}>
                    <span className="csl-compare-label">{label}</span>
                    <span className="csl-compare-bar" style={{ width: `${Math.max(3, value * 100)}%`, background: colorFor(label) }} />
                    <b>{Math.round(value * 100)}%</b>
                  </li>
                ))}
              </ul>
              <p className="csl-note">Identical trace, identical capacity. Only the number of ways changed - the difference is conflict misses.</p>
            </>
          )}
        </aside>

        <div className="csl-stage">
          <div className="csl-canvas">
            {frame ? renderFrame(frame, frames) : <div className="csl-empty">Type a workload above to run the simulation.</div>}
          </div>

          <div className="csl-transport">
            <button onClick={() => { setPlaying(false); setIndex(0); }} title={tr("cslabs.reset")} aria-label={tr("cslabs.reset")}><RotateCcw size={15} /></button>
            <button onClick={() => { setPlaying(false); setIndex((i) => Math.max(0, i - 1)); }} disabled={index === 0} title={tr("cslabs.prev")} aria-label={tr("cslabs.prev")}><ChevronLeft size={16} /></button>
            <button className="csl-play" onClick={() => { if (atEnd) setIndex(0); setPlaying((p) => !p); }}>
              {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? tr("cslabs.pause") : tr("cslabs.play")}
            </button>
            <button onClick={() => { setPlaying(false); setIndex((i) => Math.min(frames.length - 1, i + 1)); }} disabled={atEnd} title={tr("cslabs.next")} aria-label={tr("cslabs.next")}><ChevronRight size={16} /></button>
            <input
              type="range"
              min={0}
              max={Math.max(0, frames.length - 1)}
              value={Math.min(index, Math.max(0, frames.length - 1))}
              onChange={(event) => { setPlaying(false); setIndex(Number(event.target.value)); }}
              aria-label={tr("cslabs.steps")}
            />
            <span className="csl-count">{frames.length ? index + 1 : 0}<i>/{frames.length}</i></span>
            <label className="csl-speed">
              {tr("cslabs.speed")}
              <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
                {[0.5, 1, 2, 4].map((value) => <option key={value} value={value}>{value}x</option>)}
              </select>
            </label>
          </div>

          {frame && (
            <article className="csl-why">
              <header>
                <span className="csl-why-kicker">{tr("cslabs.why")}</span>
                <h2>{frame.caption}</h2>
                {voiceSupported && (
                  <button className="csl-voice" onClick={() => { if (spoken) { setSpoken(false); stopSpeaking(); } else { setSpoken(true); speak(`${frame.caption}. ${frame.detail}`, { lang, mood: "think" }); } }} aria-pressed={spoken}>
                    {spoken ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                )}
              </header>
              <p>{frame.detail}</p>
            </article>
          )}

          {frame && (
            <div className="csl-metrics">
              <h3><Activity size={14} /> {tr("cslabs.metrics")}</h3>
              <div>
                {metricsOf(frame, frames).map((row) => (
                  <div key={row.label}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                    {row.hint && <small>{row.hint}</small>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="csl-panel csl-read">
          <div className="csl-tabs">
            <button className={tab === "deep" ? "active" : ""} onClick={() => setTab("deep")}><Lightbulb size={13} /> {tr("cslabs.deep")}</button>
            <button className={tab === "traps" ? "active" : ""} onClick={() => setTab("traps")}><TriangleAlert size={13} /> {tr("cslabs.traps")}</button>
            <button className={tab === "interview" ? "active" : ""} onClick={() => setTab("interview")}><Sigma size={13} /> {tr("cslabs.interview")}</button>
          </div>

          {tab === "deep" && (
            <div className="csl-readbody">
              <p className="csl-concept">{topic.read.concept}</p>
              <h4>{tr("cslabs.mechanism")}</h4>
              <ol>{topic.read.mechanism.map((line) => <li key={line}>{line}</li>)}</ol>
              <h4>{tr("cslabs.formulas")}</h4>
              <ul className="csl-formulas">{topic.read.formulas.map((line) => <li key={line}><code>{line}</code></li>)}</ul>
            </div>
          )}
          {tab === "traps" && (
            <div className="csl-readbody">
              <h4>The mistakes interviewers listen for</h4>
              <ul className="csl-traps">{topic.read.traps.map((line) => <li key={line}><TriangleAlert size={12} /> {line}</li>)}</ul>
            </div>
          )}
          {tab === "interview" && (
            <div className="csl-readbody">
              {topic.read.interview.map((qa) => (
                <details key={qa.q}>
                  <summary>{qa.q}</summary>
                  <p>{qa.a}</p>
                </details>
              ))}
            </div>
          )}

          <button className="csl-bridge" onClick={onOpenPass}>
            <GitBranch size={13} /> {tr("guru.mentor")}
          </button>
        </aside>
      </div>
    </section>
  );
}
