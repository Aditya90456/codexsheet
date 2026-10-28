import { useEffect, useRef, useState, type CSSProperties } from "react";
import { lessonMarkers, type CourseLesson, type LessonStep } from "./deva-course-lessons";

const threeModuleUrl = "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

const towerStages = new Set(["stack"]);
const spanStages = new Set(["range", "window"]);

type Cell = { mesh: any; cap: any; baseY: number; height: number; lift: number; glow: number };
type Layout = { lessonId: string; stage: string; cells: Cell[]; gap: number; count: number; tower: boolean };

/** The newest focused index is where the eye should follow. */
function focusIndex(step: LessonStep, length: number): number {
  const last = step.active[step.active.length - 1];
  return Number.isInteger(last) && last >= 0 && last < length ? last : 0;
}

function cellTargets(lesson: CourseLesson, step: LessonStep): { glow: boolean[]; lift: number; span: { start: number; end: number } | null } {
  const glow = lesson.input.map((_, index) => step.active.includes(index));
  const markers = lessonMarkers(step);
  for (const marker of markers) if (marker.index !== null && glow[marker.index] !== undefined) glow[marker.index] = true;
  const active = step.active.filter((index) => index >= 0 && index < lesson.input.length).sort((a, b) => a - b);
  const span = spanStages.has(lesson.stage) && active.length > 1 ? { start: active[0] ?? 0, end: active[active.length - 1] ?? 0 } : null;
  return { glow, lift: focusIndex(step, lesson.input.length), span };
}

function StageFallback({ lesson, step }: { lesson: CourseLesson; step: LessonStep }) {
  return <div className="deva-stage-fallback" aria-label={`${lesson.title} animation fallback`}>
    <div className="deva-stage-fallback-cells">{lesson.input.map((value, index) => <div key={index} className={step.active.includes(index) ? "active" : ""} style={{ "--cell-height": `${28 + Math.min(64, value * 1.6)}%` } as CSSProperties}><strong>{value}</strong><small>{index}</small></div>)}</div>
    <p>{step.narration}</p>
  </div>;
}

type Props = { lesson: CourseLesson; step: LessonStep; stepIndex: number; playing: boolean };

export default function DevaStage({ lesson, step, stepIndex, playing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(true);

  // The animation loop reads these instead of re-rendering, so playback stays at 60fps.
  const frameState = useRef({ step, stepIndex, playing, targets: cellTargets(lesson, step) });
  frameState.current.step = step;
  frameState.current.stepIndex = stepIndex;
  frameState.current.playing = playing;

  useEffect(() => {
    frameState.current.targets = cellTargets(lesson, step);
  }, [lesson, step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    let renderer: any;
    const disposables: Array<{ dispose: () => void }> = [];

    void import(/* @vite-ignore */ threeModuleUrl).then((THREE: any) => {
      if (disposed) return;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
      } catch {
        setSupported(false);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0d0b12, 0.05);
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
      camera.position.set(0, 2.2, 11);

      scene.add(new THREE.HemisphereLight(0x8fa6d9, 0x1a1016, 1.5));
      const key = new THREE.DirectionalLight(0xffb066, 2.3);
      key.position.set(3.2, 5.5, 4.5);
      scene.add(key);
      const rim = new THREE.PointLight(0x5b8cff, 24, 24);
      rim.position.set(-4, 1.8, -3);
      scene.add(rim);

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 26), new THREE.MeshStandardMaterial({ color: 0x120f16, roughness: 0.95, metalness: 0.05 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.78;
      scene.add(floor);
      const grid = new THREE.GridHelper(32, 32, 0x40334c, 0x241d2c);
      grid.position.y = -0.77;
      scene.add(grid);

      const root = new THREE.Group();
      scene.add(root);

      const span = new THREE.Mesh(new THREE.BoxGeometry(1, 0.07, 1.7), new THREE.MeshStandardMaterial({ color: 0xdd7432, emissive: 0xdd7432, emissiveIntensity: 1.1, transparent: true, opacity: 0.5 }));
      span.position.y = -0.72;
      span.visible = false;
      root.add(span);

      const spark = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 56), new THREE.MeshBasicMaterial({ color: 0xffd8a8, transparent: true, opacity: 0, side: THREE.DoubleSide }));
      spark.rotation.x = -Math.PI / 2;
      spark.position.y = -0.7;
      root.add(spark);

      const dustCount = 200;
      const dustGeometry = new THREE.BufferGeometry();
      const dustPositions = new Float32Array(dustCount * 3);
      for (let index = 0; index < dustCount; index += 1) {
        dustPositions[index * 3] = (Math.random() - 0.5) * 17;
        dustPositions[index * 3 + 1] = Math.random() * 5.5 - 0.7;
        dustPositions[index * 3 + 2] = (Math.random() - 0.5) * 8;
      }
      dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
      const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xffc894, size: 0.05, transparent: true, opacity: 0.45, depthWrite: false }));
      scene.add(dust);

      let layout: Layout | null = null;

      const disposeCells = (current: Layout) => {
        for (const cell of current.cells) {
          root.remove(cell.mesh, cell.cap);
          cell.mesh.geometry.dispose();
          cell.mesh.material.dispose();
          cell.cap.geometry.dispose();
          cell.cap.material.dispose();
        }
      };

      const buildLayout = (): Layout => {
        const next = lesson;
        if (layout?.lessonId === next.id && layout.stage === next.stage) return layout;
        if (layout) disposeCells(layout);
        const tower = towerStages.has(next.stage);
        const count = Math.max(1, next.input.length);
        const tallest = Math.max(...next.input, 1);
        const gap = tower ? 1.05 : Math.min(2, 12 / count);
        const cells: Cell[] = next.input.map((value, index) => {
          const height = tower ? 0.58 : 0.55 + (value / tallest) * 2.6;
          const geometry = tower ? new THREE.BoxGeometry(1.1, height, 1.1) : new THREE.BoxGeometry(0.96, height, 0.96);
          const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x4a3c55, roughness: 0.4, metalness: 0.34, emissive: new THREE.Color(0xff8d36), emissiveIntensity: 0 }));
          const cap = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 1), new THREE.MeshBasicMaterial({ color: 0x9b8ba6, transparent: true, opacity: 0.7 }));
          const baseY = tower ? -0.5 + index * gap : height / 2 - 0.75;
          const x = tower ? 0 : (index - (count - 1) / 2) * gap;
          mesh.position.set(x, baseY, 0);
          cap.position.set(x, baseY + height / 2, 0);
          root.add(mesh, cap);
          return { mesh, cap, baseY, height, lift: 0, glow: 0 };
        });
        layout = { lessonId: next.id, stage: next.stage, cells, gap, count, tower };
        return layout;
      };

      layout = buildLayout();

      const resize = ([entry]: ResizeObserverEntry[]) => {
        if (!entry) return;
        const { width, height } = entry.contentRect;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.position.z = width < 560 ? 14 : 11;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      observer = new ResizeObserver(resize);
      observer.observe(canvas);

      disposables.push({ dispose: () => renderer.dispose() });
      disposables.push({ dispose: () => { if (layout) disposeCells(layout); } });
      for (const mesh of [floor, span, spark, dust]) disposables.push({ dispose: () => { mesh.geometry.dispose(); mesh.material.dispose(); } });
      disposables.push({ dispose: () => grid.dispose?.() });

      const projected = new THREE.Vector3();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let previous = 0;
      let sparkEnergy = 1;
      let seenStep = -1;

      const draw = (time: number) => {
        if (disposed) return;
        frame = requestAnimationFrame(draw);
        const current = layout ?? buildLayout();
        if (!current || document.hidden) return;

        const state = frameState.current;
        if (state.stepIndex !== seenStep) {
          seenStep = state.stepIndex;
          sparkEnergy = 1;
        }
        const still = reduceMotion.matches;
        const dt = previous ? Math.min(0.05, (time - previous) / 1000) : 0.016;
        previous = time;
        const ease = still ? 1 : Math.min(1, dt * (state.playing ? 7.5 : 4.5));

        let focus = current.cells[0];
        current.cells.forEach((cell, index) => {
          const wantGlow = state.targets.glow[index] ? 1 : 0;
          const wantLift = index === state.targets.lift ? 1 : 0;
          cell.glow += (wantGlow - cell.glow) * ease;
          cell.lift += (wantLift - cell.lift) * ease;
          const material = cell.mesh.material;
          material.emissiveIntensity = cell.glow * 1.6;
          const shade = 0.34 + cell.glow * 0.66;
          material.color.setRGB(0.3 * shade + 0.1, 0.25 * shade + 0.09, 0.36 * shade + 0.13);
          const bob = still || current.tower ? 0 : Math.sin(time * 0.0013 + index * 0.7) * 0.025;
          cell.mesh.position.y = cell.baseY + cell.lift * (current.tower ? 0.2 : 0.45) + bob;
          cell.mesh.position.z = current.tower ? cell.lift * 0.55 : 0;
          const scale = 1 + cell.glow * 0.08;
          cell.mesh.scale.setScalar(scale);
          cell.cap.scale.setScalar(scale);
          cell.cap.position.y = cell.mesh.position.y + cell.height / 2;
          if (cell.lift > 0.5) focus = cell;
        });

        if (state.targets.span && !current.tower) {
          const from = (state.targets.span.start - (current.count - 1) / 2) * current.gap;
          const to = (state.targets.span.end - (current.count - 1) / 2) * current.gap;
          span.visible = true;
          span.scale.x += (Math.max(1, to - from + current.gap) - span.scale.x) * ease;
          span.position.x += ((from + to) / 2 - span.position.x) * ease;
        } else {
          span.visible = false;
        }

        spark.position.x = focus.mesh.position.x;
        spark.position.z = focus.mesh.position.z;
        sparkEnergy = Math.max(0, sparkEnergy - dt * 1.3);
        spark.material.opacity = sparkEnergy * 0.7;
        spark.scale.setScalar(1 + (1 - sparkEnergy) * 2.4);

        if (!still) {
          const positions = dust.geometry.attributes.position;
          for (let index = 0; index < dustCount; index += 1) {
            const y = positions.getY(index) + dt * (0.1 + (index % 5) * 0.025);
            positions.setY(index, y > 5.2 ? -0.7 : y);
          }
          positions.needsUpdate = true;
        }

        const follow = focus.mesh.position.x * 0.34;
        camera.position.x += (follow - camera.position.x) * Math.min(1, dt * 1.7);
        camera.position.y += (2.2 + (state.playing ? 0.18 : 0) - camera.position.y) * Math.min(1, dt * 1.1);
        camera.lookAt(follow * 0.55, 0.55, 0);

        const markers = lessonMarkers(state.step);
        const bounds = { width: canvas.clientWidth, height: canvas.clientHeight };
        Array.from(labelRef.current?.children ?? []).forEach((element, index) => {
          const html = element as HTMLElement;
          const marker = markers[index];
          if (!marker) return;
          const cell = marker.index !== null ? current.cells[marker.index] : focus;
          if (!cell) return;
          projected.copy(cell.mesh.position).project(camera);
          html.style.transform = `translate3d(${(((projected.x + 1) / 2) * bounds.width - 12).toFixed(1)}px, ${(((1 - (projected.y + 1) / 2) * bounds.height - 34).toFixed(1))}px, 0)`;
        });

        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(draw);
    }, () => setSupported(false));

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      for (const item of disposables) item.dispose();
      disposables.length = 0;
    };
  }, [lesson]);

  if (!supported) return <StageFallback lesson={lesson} step={step} />;

  const markers = lessonMarkers(step);
  return <div className={`deva-stage deva-stage-${lesson.stage}`} aria-label={`${lesson.title} animated walkthrough`}>
    <canvas ref={canvasRef} className="deva-stage-canvas" />
    <div className="deva-stage-markers" ref={labelRef}>{markers.map((marker, index) => <span key={`${marker.name}-${index}`}><b>{marker.name}</b>{marker.value && <em>{marker.value}</em>}</span>)}</div>
    <div className="deva-stage-step"><span>STEP {String(stepIndex + 1).padStart(2, "0")}</span><strong>{step.title}</strong></div>
    <div className="deva-stage-caption"><p>{step.narration}</p></div>
    <div className="deva-stage-state">{step.memory.map((item, index) => <code key={`${step.title}-${index}`}>{item}</code>)}</div>
  </div>;
}
