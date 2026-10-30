import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

const threeModuleUrl = "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

export type SceneStep = { narration: string; active?: number[]; span?: [number, number]; reveal?: number; code?: string };

export type MentorScene = {
  figure: "array" | "hash" | "stack" | "queue" | "list" | "tree" | "graph" | "grid" | "window";
  title: string;
  values: number[];
  keys?: string[];
  edges?: [number, number][];
  cells?: { row: number; col: number; value: string }[];
  steps: SceneStep[];
};

type Figure = MentorScene["figure"];
type Cell = { row: number; col: number; value: string };
type Mood = "calm" | "happy" | "laugh" | "angry" | "think" | "proud";

const MAX_VALUES = 12;
const MAX_BUCKETS = 8;
const MAX_NODES = 12;
const MAX_CELLS = 40;
const MAX_EDGES = 20;
const MAX_KEYS = 16;
const MAX_STEPS = 64;

const palette = {
  background: "#0a1220",
  surface: "#131f33",
  line: "#243449",
  ink: "#e8eff9",
  primary: "#3b82f6",
  highlight: "#60a5fa",
  muted: "#a9c1de",
};

const tint = {
  background: 0x0a1220,
  surface: 0x131f33,
  line: 0x243449,
  ink: 0xe8eff9,
  primary: 0x3b82f6,
  highlight: 0x60a5fa,
  block: 0x1b2b44,
};

const figures = new Set<Figure>(["array", "hash", "stack", "queue", "list", "tree", "graph", "grid", "window"]);
const slabFigures = new Set<Figure>(["array", "window", "queue", "list", "hash"]);

const moodLights: Record<Mood, { key: number; rim: number; keyPower: number; rimPower: number }> = {
  calm: { key: 0xcfe2ff, rim: 0x3b82f6, keyPower: 2.1, rimPower: 20 },
  happy: { key: 0xe4f1ff, rim: 0x60a5fa, keyPower: 2.4, rimPower: 24 },
  laugh: { key: 0xf3f8ff, rim: 0x7ab6ff, keyPower: 2.7, rimPower: 28 },
  angry: { key: 0xffa45c, rim: 0x3b82f6, keyPower: 2.9, rimPower: 15 },
  think: { key: 0xa9c4e8, rim: 0x24509a, keyPower: 1.6, rimPower: 13 },
  proud: { key: 0xdce900, rim: 0x9ecbff, keyPower: 2.6, rimPower: 34 },
};

function moodSetting(mood?: string) {
  const known = moodLights[mood as Mood];
  return known ?? moodLights.calm;
}

function clamp(value: number, low: number, high: number): number {
  return value < low ? low : value > high ? high : value;
}

function whole(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
}

type Model = {
  figure: Figure;
  title: string;
  values: number[];
  keys: string[];
  edges: [number, number][];
  cells: Cell[];
  steps: SceneStep[];
  count: number;
  hoverNext: boolean;
  slab: boolean;
  cameraY: number;
  cameraZ: number;
};

function normalizeScene(scene: MentorScene): Model {
  const safe = scene ?? ({} as MentorScene);
  const figure: Figure = figures.has(safe.figure) ? safe.figure : "array";
  const limit = figure === "tree" || figure === "graph" ? Math.min(MAX_VALUES, MAX_NODES) : MAX_VALUES;
  const values = (Array.isArray(safe.values) ? safe.values : []).slice(0, limit).map((value) => (typeof value === "number" && Number.isFinite(value) ? value : 0));
  const keys = (Array.isArray(safe.keys) ? safe.keys : []).slice(0, MAX_KEYS).map((key) => (key === null || key === undefined ? "" : String(key).slice(0, 12)));

  const edges: [number, number][] = [];
  for (const edge of Array.isArray(safe.edges) ? safe.edges : []) {
    if (edges.length >= MAX_EDGES) break;
    if (!Array.isArray(edge)) continue;
    const from = whole(edge[0], -1);
    const to = whole(edge[1], -1);
    if (from >= 0 && to >= 0 && from !== to && from < values.length && to < values.length) edges.push([from, to]);
  }

  const cells: Cell[] = [];
  for (const cell of Array.isArray(safe.cells) ? safe.cells : []) {
    if (cells.length >= MAX_CELLS) break;
    if (!cell) continue;
    cells.push({ row: clamp(whole(cell.row, 0), 0, 9), col: clamp(whole(cell.col, 0), 0, 9), value: cell.value === null || cell.value === undefined ? "" : String(cell.value).slice(0, 8) });
  }

  const steps: SceneStep[] = [];
  for (const step of Array.isArray(safe.steps) ? safe.steps : []) {
    if (steps.length >= MAX_STEPS) break;
    if (!step) {
      steps.push({ narration: "" });
      continue;
    }
    steps.push({
      narration: typeof step.narration === "string" ? step.narration : "",
      active: Array.isArray(step.active) ? step.active.slice(0, MAX_CELLS) : undefined,
      span: Array.isArray(step.span) ? [whole(step.span[0], -1), whole(step.span[1], -1)] : undefined,
      reveal: Number.isFinite(step.reveal as number) ? whole(step.reveal, 0) : undefined,
      code: typeof step.code === "string" ? step.code.slice(0, 240) : undefined,
    });
  }
  if (!steps.length) steps.push({ narration: "" });

  const hash = figure === "hash";
  const grid = figure === "grid";
  return {
    figure,
    title: typeof safe.title === "string" && safe.title ? safe.title : "Pattern visual",
    values,
    keys,
    edges,
    cells,
    steps,
    count: hash ? MAX_BUCKETS : grid ? cells.length : values.length,
    hoverNext: figure === "stack" || figure === "queue",
    slab: slabFigures.has(figure),
    cameraY: grid ? 3.6 : 2.35,
    cameraZ: grid ? 9.4 : hash ? 12.8 : 11.6,
  };
}

/** The UI clamps its own timeline with this, so it must never return zero. */
export function mentorSceneStepCount(scene: MentorScene): number {
  const steps = Array.isArray(scene?.steps) ? scene.steps.length : 0;
  return clamp(steps, 1, MAX_STEPS);
}

type Targets = { glow: boolean[]; reveal: number; keyCount: number; span: [number, number] | null; focus: number };

function computeTargets(model: Model, step: SceneStep): Targets {
  const size = Math.max(1, model.count);
  const glow = new Array<boolean>(size).fill(false);
  let focus = -1;
  for (const raw of Array.isArray(step.active) ? step.active : []) {
    const index = whole(raw, -1);
    if (index >= 0 && index < size) {
      glow[index] = true;
      focus = index;
    }
  }
  const reveal = Number.isFinite(step.reveal as number) ? clamp(whole(step.reveal, size), 0, size) : size;
  let span: [number, number] | null = null;
  if (model.slab && Array.isArray(step.span)) {
    const first = whole(step.span[0], -1);
    const second = whole(step.span[1], -1);
    if (first >= 0 && second >= 0) {
      const start = clamp(Math.min(first, second), 0, size - 1);
      const end = clamp(Math.max(first, second), 0, size - 1);
      span = [start, end];
    }
  }
  return { glow, reveal, keyCount: clamp(reveal, 0, model.keys.length), span, focus };
}

function sceneSignature(model: Model): string {
  const steps = model.steps.map((step) => `${(step.active ?? []).join(",")}|${step.span ? `${step.span[0]}-${step.span[1]}` : ""}|${step.reveal ?? ""}`).join(";");
  return [
    model.figure,
    model.title,
    model.values.join(","),
    model.keys.join(","),
    model.edges.map(([from, to]) => `${from}${to}`).join(","),
    model.cells.map((cell) => `${cell.row}.${cell.col}.${cell.value}`).join(","),
    steps,
  ].join("#");
}

const rootStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  minHeight: "280px",
  height: "100%",
  borderRadius: "18px",
  background: palette.background,
  border: `1px solid ${palette.line}`,
  color: palette.ink,
};

const canvasStyle: CSSProperties = { display: "block", width: "100%", height: "100%", minHeight: "280px" };

const captionStyle: CSSProperties = {
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "14px",
  display: "flex",
  gap: "10px",
  alignItems: "baseline",
  flexWrap: "wrap",
  pointerEvents: "none",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  textShadow: "0 2px 12px #0a1220",
};

const badgeStyle: CSSProperties = {
  position: "absolute",
  top: "14px",
  left: "16px",
  padding: "4px 10px",
  borderRadius: "999px",
  background: "rgba(19, 31, 51, 0.72)",
  border: `1px solid ${palette.line}`,
  color: palette.highlight,
  font: "600 11px/1.6 ui-monospace, Menlo, Consolas, monospace",
  letterSpacing: "0.08em",
  pointerEvents: "none",
};

const fallbackStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  minHeight: "240px",
  padding: "18px 18px 54px",
  borderRadius: "18px",
  background: palette.background,
  border: `1px solid ${palette.line}`,
  color: palette.ink,
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
};

const flexRow: CSSProperties = { display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" };

const chipBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "34px",
  padding: "4px 8px",
  borderRadius: "8px",
  background: palette.surface,
  border: `1px solid ${palette.line}`,
  font: "600 13px/1.4 ui-monospace, Menlo, Consolas, monospace",
};

function barStyle(ratio: number, glowing: boolean, committed: boolean): CSSProperties {
  return {
    ...chipBase,
    width: "34px",
    height: `${Math.round(24 + ratio * 96)}px`,
    flexDirection: "column",
    justifyContent: "flex-end",
    background: glowing ? palette.primary : palette.surface,
    borderColor: glowing ? palette.highlight : palette.line,
    boxShadow: glowing ? `0 0 16px ${palette.primary}` : "none",
    opacity: committed ? 1 : 0.42,
  };
}

function chip(glowing: boolean, committed: boolean): CSSProperties {
  return {
    ...chipBase,
    background: glowing ? palette.primary : committed ? palette.surface : "#0e1928",
    borderColor: glowing ? palette.highlight : palette.line,
    opacity: committed ? 1 : 0.4,
  };
}

function MentorFallback({ model, step, stepIndex }: { model: Model; step: SceneStep; stepIndex: number }) {
  const targets = computeTargets(model, step);
  const tallest = Math.max(1, ...model.values.map((value) => Math.abs(value)));

  let body: ReactNode = null;
  if (model.figure === "hash") {
    body = <div style={flexRow}>
      {Array.from({ length: MAX_BUCKETS }, (_, bucket) => (
        <div key={bucket} style={{ ...chipBase, flexDirection: "column", alignItems: "stretch", gap: "4px", minWidth: "46px", background: targets.glow[bucket] ? palette.primary : palette.surface, borderColor: targets.glow[bucket] ? palette.highlight : palette.line }}>
          <b style={{ textAlign: "center", color: palette.muted }}>{bucket}</b>
          {model.keys.map((key, position) => (position % MAX_BUCKETS === bucket && position < targets.keyCount ? <span key={position} style={{ ...chipBase, minWidth: "auto" }}>{key}</span> : null))}
        </div>
      ))}
    </div>;
  } else if (model.figure === "grid") {
    const rows: Cell[][] = [];
    for (const cell of model.cells) if (!rows[cell.row]) rows[cell.row] = [];
    for (const cell of model.cells) rows[cell.row]?.push(cell);
    body = <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {rows.map((cells, row) => (
        <div key={row} style={flexRow}>
          {cells.map((cell, column) => {
            const flat = model.cells.indexOf(cell);
            return <span key={`${row}-${column}`} style={chip(!!targets.glow[flat], flat < targets.reveal)}>{cell.value}</span>;
          })}
        </div>
      ))}
    </div>;
  } else if (model.figure === "tree" || model.figure === "graph") {
    body = <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={flexRow}>{model.values.map((value, position) => <span key={position} style={chip(!!targets.glow[position], position < targets.reveal)}>{value}</span>)}</div>
      <div style={{ ...flexRow, alignItems: "center" }}>{model.edges.map(([from, to], position) => <span key={position} style={{ ...chipBase, minWidth: "auto", color: palette.muted }}>{`${from}\u2192${to}`}</span>)}</div>
    </div>;
  } else if (model.figure === "stack") {
    body = <div style={{ display: "flex", flexDirection: "column-reverse", gap: "6px", alignItems: "center" }}>
      {model.values.map((value, position) => <span key={position} style={{ ...chip(!!targets.glow[position], position < targets.reveal), width: "74px", justifyContent: "space-between" }}>{value}<small style={{ color: palette.muted }}>{position}</small></span>)}
    </div>;
  } else {
    body = <div style={flexRow}>
      {model.values.map((value, position) => (
        <div key={position} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <b style={{ font: "600 12px/1 ui-monospace, Menlo, Consolas, monospace", color: palette.ink }}>{value}</b>
          <span style={barStyle(Math.abs(value) / tallest, !!targets.glow[position], position < targets.reveal || model.count === 0)}>&nbsp;</span>
          <small style={{ color: palette.muted }}>{position}</small>
        </div>
      ))}
    </div>;
  }

  return <div className="dsa-mentor-stage-fallback" style={fallbackStyle} aria-label={`${model.title} visual fallback`}>
    <div style={{ ...flexRow, alignItems: "stretch" }}>{body}</div>
    <div className="dsa-mentor-stage-caption" style={captionStyle}>
      <strong style={{ color: palette.ink }}>{model.title}</strong>
      <span style={{ color: palette.muted }}>{step.narration}</span>
      <span style={{ color: palette.highlight, marginLeft: "auto" }}>{String(stepIndex + 1).padStart(2, "0")}/{String(model.steps.length).padStart(2, "0")}</span>
    </div>
  </div>;
}

type StageState = { targets: Targets; mood: Mood };

type Stage = { dispose: () => void };

type Item = {
  object: any;
  material: any;
  label: any;
  labelRise: number;
  commit: (targets: Targets) => boolean;
  lit: (targets: Targets) => boolean;
  baseY: number;
  height: number;
  axis: "y" | "all";
  grow: number;
  bright: number;
  lift: number;
  phase: number;
};

function makeLabel(THREE: any, text: string, color: string, scale: number): any {
  if (!text) return null;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const font = `600 72px ui-monospace, Menlo, Consolas, monospace`;
  ctx.font = font;
  const width = Math.max(30, Math.ceil(ctx.measureText(text).width) + 28);
  canvas.width = width;
  canvas.height = 96;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set((scale * canvas.width) / canvas.height, scale, 1);
  sprite.renderOrder = 6;
  return sprite;
}

function edgeGeometry(THREE: any, from: any, to: any, radius: number) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = Math.max(0.05, direction.length());
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 8, 1);
  const mesh = new THREE.Mesh(geometry, null);
  mesh.position.copy(from).addScaledVector(direction, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return mesh;
}

function blockMaterial(THREE: any, transparent: true) {
  return new THREE.MeshStandardMaterial({
    color: tint.block,
    emissive: new THREE.Color(tint.primary),
    emissiveIntensity: 0.12,
    roughness: 0.42,
    metalness: 0.2,
    transparent,
    opacity: 1,
  });
}

function createStage(THREE: any, canvas: HTMLCanvasElement, model: Model, read: () => StageState): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(tint.background, 1);
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140);
  camera.position.set(0, model.cameraY, model.cameraZ);
  camera.lookAt(0, 0.9, 0);

  const ambient = new THREE.AmbientLight(0x9fc3ff, 0.5);
  const keyLight = new THREE.DirectionalLight(0xcfe2ff, 2.1);
  keyLight.position.set(3.6, 7.5, 6.2);
  const rimLight = new THREE.PointLight(0x3b82f6, 20, 46, 2);
  rimLight.position.set(-4.8, 2.4, -4.2);
  world.add(ambient, keyLight, rimLight);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x0c1626, roughness: 0.96 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.03;
  world.add(floor);

  const group = new THREE.Group();
  world.add(group);

  const items: Item[] = [];
  const add = (
    object: any,
    material: any,
    label: any,
    commit: (targets: Targets) => boolean,
    lit: (targets: Targets) => boolean,
    options: { height?: number; axis?: "y" | "all"; labelRise?: number } = {},
  ) => {
    if (label) {
      label.position.set(object.position.x, object.position.y + (options.labelRise ?? 0), object.position.z);
      group.add(label);
    }
    group.add(object);
    items.push({
      object,
      material,
      label,
      labelRise: options.labelRise ?? 0,
      commit,
      lit,
      baseY: object.position.y,
      height: options.height ?? 1,
      axis: options.axis ?? "all",
      grow: 0,
      bright: 0,
      lift: 0,
      phase: items.length * 0.7,
    });
  };

  const kind =
    model.figure === "tree" || model.figure === "graph"
      ? "nodes"
      : model.figure === "grid"
        ? "grid"
        : model.figure === "stack"
          ? "column"
          : model.figure === "hash"
            ? "hash"
            : model.figure === "queue" || model.figure === "list"
              ? "chips"
              : "bars";

  const count = Math.max(1, model.count);
  const pitch = Math.min(1.2, 9.2 / count);

  if (kind === "nodes") {
    const total = model.values.length;
    const depths = new Array<number>(total).fill(0);
    const adjacency: number[][] = model.values.map(() => []);
    for (const [from, to] of model.edges) {
      adjacency[from]?.push(to);
      adjacency[to]?.push(from);
    }
    if (model.edges.length) {
      const seen = new Array<boolean>(total).fill(false);
      const queue: number[] = [0];
      seen[0] = true;
      while (queue.length) {
        const node = queue.shift() as number;
        for (const next of adjacency[node] ?? []) {
          if (!seen[next]) {
            seen[next] = true;
            depths[next] = clamp(depths[node] + 1, 0, 5);
            queue.push(next);
          }
        }
      }
      depths.forEach((depth, node) => {
        if (!seen[node]) depths[node] = clamp(depth + 1, 1, 5);
      });
    } else {
      for (let node = 0; node < total; node += 1) depths[node] = clamp(Math.floor(Math.log2(node + 1)), 0, 5);
    }

    const centers: any[] = [];
    const rows = new Map<number, number[]>();
    depths.forEach((depth, node) => {
      const row = rows.get(depth) ?? [];
      row.push(node);
      rows.set(depth, row);
    });
    for (let node = 0; node < total; node += 1) centers[node] = new THREE.Vector3();
    for (const [depth, row] of rows) {
      const gap = Math.min(1.7, 9.2 / row.length);
      row.forEach((node, position) => {
        centers[node].set((position - (row.length - 1) / 2) * gap, 2.5 - depth * 1.0, model.figure === "graph" ? ((depth % 2) * 1.3 - 0.65) : 0);
      });
    }
    for (let node = 0; node < total; node += 1) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 16), blockMaterial(THREE, true));
      mesh.position.copy(centers[node]);
      add(mesh, mesh.material, makeLabel(THREE, String(model.values[node]), palette.ink, 0.42), (targets) => node < targets.reveal, (targets) => !!targets.glow[node]);
    }
    for (const [from, to] of model.edges) {
      const mesh = edgeGeometry(THREE, centers[from], centers[to], 0.05);
      const material = new THREE.MeshStandardMaterial({ color: tint.line, emissive: new THREE.Color(tint.highlight), emissiveIntensity: 0.2, roughness: 0.6, transparent: true, opacity: 1 });
      mesh.material = material;
      add(mesh, material, null, (targets) => from < targets.reveal && to < targets.reveal, (targets) => !!targets.glow[from] || !!targets.glow[to]);
    }
  } else if (kind === "grid") {
    const cols = Math.max(1, ...model.cells.map((cell) => cell.col + 1));
    const rows = Math.max(1, ...model.cells.map((cell) => cell.row + 1));
    const gap = Math.min(1.3, 9.2 / Math.max(cols, rows));
    model.cells.forEach((cell, flat) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(gap * 0.8, 0.34, gap * 0.8), blockMaterial(THREE, true));
      mesh.position.set((cell.col - (cols - 1) / 2) * gap, 0.2, (cell.row - (rows - 1) / 2) * gap);
      add(mesh, mesh.material, makeLabel(THREE, cell.value, palette.ink, 0.34), (targets) => flat < targets.reveal, (targets) => !!targets.glow[flat], { labelRise: 0.34 });
    });
  } else if (kind === "column") {
    model.values.forEach((value, position) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.58, 1.3), blockMaterial(THREE, true));
      mesh.position.set(0, 0.34 + position * 0.66, 0);
      add(
        mesh,
        mesh.material,
        makeLabel(THREE, String(value), palette.ink, 0.34),
        (targets) => position < targets.reveal,
        (targets) => !!targets.glow[position],
      );
    });
  } else if (kind === "hash") {
    for (let bucket = 0; bucket < MAX_BUCKETS; bucket += 1) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(pitch * 0.78, 0.7, pitch * 0.78), blockMaterial(THREE, true));
      mesh.position.set((bucket - (MAX_BUCKETS - 1) / 2) * pitch, 0.36, 0);
      add(mesh, mesh.material, makeLabel(THREE, String(bucket), palette.muted, 0.3), () => true, (targets) => !!targets.glow[bucket], { labelRise: -0.9 });
    }
    model.keys.forEach((key, position) => {
      const bucket = position % MAX_BUCKETS;
      const tier = Math.floor(position / MAX_BUCKETS);
      const label = makeLabel(THREE, key, palette.highlight, 0.3);
      if (!label) return;
      label.position.set((bucket - (MAX_BUCKETS - 1) / 2) * pitch, 1.25 + tier * 0.5, 0);
      group.add(label);
      items.push({
        object: label,
        material: label.material,
        label: null,
        labelRise: 0,
        commit: (targets) => position < targets.keyCount,
        lit: (targets) => targets.keyCount === position + 1,
        baseY: label.position.y,
        height: 1,
        axis: "all",
        grow: 0,
        bright: 0,
        lift: 0,
        phase: position * 0.7,
      });
    });
  } else {
    const tallest = Math.max(1, ...model.values.map((value) => Math.abs(value)));
    model.values.forEach((value, position) => {
      const isBar = kind === "bars";
      const height = isBar ? 0.5 + (Math.abs(value) / tallest) * 2.7 : 0.72;
      const geometry = new THREE.BoxGeometry(pitch * 0.74, 1, pitch * 0.74);
      geometry.translate(0, 0.5, 0);
      const mesh = new THREE.Mesh(geometry, blockMaterial(THREE, true));
      mesh.position.set((position - (model.values.length - 1) / 2) * pitch, isBar ? 0 : 0.36, 0);
      add(
        mesh,
        mesh.material,
        makeLabel(THREE, String(value), palette.ink, 0.36),
        (targets) => position < targets.reveal || model.values.length === 0,
        (targets) => !!targets.glow[position],
        isBar ? { height, axis: "y", labelRise: 0 } : { height, labelRise: 0.5 },
      );
    });
  }

  const slab = model.slab
    ? (() => {
        const material = new THREE.MeshStandardMaterial({ color: tint.primary, emissive: new THREE.Color(tint.highlight), emissiveIntensity: 0.7, transparent: true, opacity: 0.3, roughness: 0.3 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(pitch, 0.16, pitch * 1.9), material);
        mesh.position.set(0, 0.09, 0);
        mesh.scale.set(1, 1, 1);
        mesh.visible = false;
        group.add(mesh);
        return { mesh, material };
      })()
    : null;

  const wantKey = new THREE.Color(tint.primary);
  const wantRim = new THREE.Color(tint.primary);
  let keyPower = moodSetting("calm").keyPower;
  let rimPower = moodSetting("calm").rimPower;

  let spanStart = 0;
  let spanEnd = 0;
  let spanWeight = 0;

  const resize = () => {
    const parent = canvas.parentElement;
    const width = Math.max(1, Math.floor(parent ? parent.clientWidth : canvas.clientWidth || 1));
    const height = Math.max(1, Math.floor(parent ? parent.clientHeight : canvas.clientHeight || 1));
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();

  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
  if (observer) observer.observe(canvas.parentElement ?? canvas);
  else window.addEventListener("resize", resize);

  let frame = 0;
  let previous = performance.now();
  let elapsed = 0;
  let stopped = false;

  const tick = (now: number) => {
    if (stopped) return;
    frame = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    if (document.hidden) return;
    elapsed += dt;
    const step = Math.min(1, dt * 7);
    const state = read();
    const targets = state.targets;
    const lights = moodSetting(state.mood);

    keyPower += (lights.keyPower - keyPower) * step;
    rimPower += (lights.rimPower - rimPower) * step;
    wantKey.setHex(lights.key);
    wantRim.setHex(lights.rim);
    keyLight.color.lerp(wantKey, step * 0.6);
    keyLight.intensity = keyPower;
    rimLight.color.lerp(wantRim, step * 0.6);
    rimLight.intensity = rimPower;

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const committed = item.commit(targets);
      const glowing = item.lit(targets);
      item.grow += ((committed ? 1 : 0.12) - item.grow) * step;
      item.bright += ((glowing ? 1 : 0) - item.bright) * step;
      item.lift += ((glowing ? 0.3 : 0) - item.lift) * step;
      const bob = glowing ? Math.sin(elapsed * 2.7 + item.phase) * 0.06 : 0;
      if (item.axis === "y") {
        item.object.scale.y = Math.max(0.03, item.height * (0.12 + 0.88 * item.grow));
        item.object.scale.x = 1 + item.bright * 0.06;
        item.object.scale.z = 1 + item.bright * 0.06;
        item.object.position.y = item.baseY + item.lift + bob;
      } else {
        const scale = 0.16 + 0.84 * item.grow + item.bright * 0.08;
        item.object.scale.setScalar(scale);
        item.object.position.y = item.baseY + item.lift + bob;
      }
      item.material.opacity = 0.18 + 0.82 * item.grow;
      if (item.material.emissiveIntensity !== undefined) {
        item.material.emissiveIntensity = 0.1 + item.bright * (1.05 + 0.35 * Math.sin(elapsed * 4 + item.phase));
      }
      if (item.label) {
        const top = item.axis === "y" ? item.object.position.y + item.height * item.object.scale.y : item.object.position.y;
        item.label.position.set(item.object.position.x, top + item.labelRise, item.object.position.z);
        item.label.material.opacity = committed ? 0.55 + 0.45 * item.grow : 0.14;
      }
    }

    if (slab) {
      const show = !!targets.span;
      slab.mesh.visible = true;
      if (targets.span) {
        spanStart += (targets.span[0] - spanStart) * step;
        spanEnd += (targets.span[1] - spanEnd) * step;
        spanWeight += (1 - spanWeight) * step;
      } else {
        spanWeight += (0 - spanWeight) * step;
      }
      const length = Math.max(1, spanEnd - spanStart + 1);
      const centre = ((spanStart + spanEnd) / 2 - (count - 1) / 2) * pitch;
      slab.mesh.position.x = centre;
      slab.mesh.scale.x = Math.max(0.001, length * spanWeight);
      slab.mesh.scale.y = 1;
      slab.mesh.scale.z = 1 + spanWeight * 0.2;
      slab.material.opacity = 0.12 + 0.3 * spanWeight;
      if (!show && spanWeight < 0.02) slab.mesh.visible = false;
    }

    camera.position.x = Math.sin(elapsed * 0.22) * 0.42;
    camera.position.y = model.cameraY + Math.sin(elapsed * 0.3) * 0.1;
    camera.lookAt(0, 0.85, 0);
    renderer.render(world, camera);
  };
  frame = requestAnimationFrame(tick);

  return {
    dispose() {
      stopped = true;
      cancelAnimationFrame(frame);
      if (observer) observer.disconnect();
      else window.removeEventListener("resize", resize);
      world.traverse((node: any) => {
        if (node.geometry) node.geometry.dispose();
        const material = node.material;
        const list = Array.isArray(material) ? material : material ? [material] : [];
        for (const entry of list) {
          if (entry.map) entry.map.dispose();
          entry.dispose();
        }
      });
      renderer.dispose();
    },
  };
}

export default function DsaMentorStage({ scene, index, mood }: { scene: MentorScene; index: number; mood?: string }) {
  const model = useMemo(() => normalizeScene(scene), [scene]);
  const signature = useMemo(() => sceneSignature(model), [model]);
  const stepIndex = clamp(whole(index, 0), 0, model.steps.length - 1);
  const step = model.steps[stepIndex];
  const targets = useMemo(() => computeTargets(model, step), [model, step]);
  const moodKey = (moodLights[mood as Mood] ? (mood as Mood) : "calm") as Mood;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeRef = useRef<any>(null);
  const stateRef = useRef<StageState>({ targets, mood: moodKey });
  stateRef.current = { targets, mood: moodKey };

  const [webgl, setWebgl] = useState<"pending" | "live" | "off">("pending");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setWebgl((current) => (current === "pending" ? "off" : current));
    }, 8000);
    void import(/* @vite-ignore */ threeModuleUrl)
      .then((module) => {
        if (cancelled) return;
        window.clearTimeout(timer);
        threeRef.current = module;
        setWebgl("live");
      })
      .catch(() => {
        if (cancelled) return;
        window.clearTimeout(timer);
        setWebgl("off");
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (webgl !== "live") return;
    const THREE = threeRef.current;
    const canvas = canvasRef.current;
    if (!THREE || !canvas) return;
    let stage: Stage | null = null;
    try {
      stage = createStage(THREE, canvas, model, () => stateRef.current);
    } catch {
      setWebgl("off");
      return;
    }
    return () => {
      stage?.dispose();
      stage = null;
    };
    // `signature` is the stable identity of the geometry, `model` its data.
  }, [webgl, signature, model]);

  if (webgl !== "live") {
    return <MentorFallback model={model} step={step} stepIndex={stepIndex} />;
  }

  return (
    <div className="dsa-mentor-stage" style={rootStyle}>
      <canvas ref={canvasRef} style={canvasStyle} aria-label={`${model.title} in 3D`} role="img" />
      <span className="dsa-mentor-stage-badge" style={badgeStyle}>
        {model.figure.toUpperCase()}
      </span>
      <div className="dsa-mentor-stage-caption" style={captionStyle}>
        <strong style={{ color: palette.ink }}>{model.title}</strong>
        <span style={{ color: palette.muted }}>{step.narration}</span>
        <span style={{ color: palette.highlight, marginLeft: "auto" }}>
          {String(stepIndex + 1).padStart(2, "0")}/{String(model.steps.length).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
