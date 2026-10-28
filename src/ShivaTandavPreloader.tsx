import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import "./shiva-preloader.css";

const threeUrl = "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";
const loaderUrl = "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js";
// Zenodo does not send Access-Control-Allow-Origin, so this model is served from
// public/ instead. Source record: zenodo.org/records/10293437 (CC0).
const statueUrl = "/shiva-nataraja.glb";

function TandavScene({ onReady, onProgress }: { onReady: () => void; onProgress: (value: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let frame = 0;
    let renderer: any;
    let observer: ResizeObserver | undefined;
    let scene: any;
    let camera: any;
    let figure: any;
    let fireRing: any;
    let fireFlames: any;
    let embers: any;
    let emberGeometry: any;
    let emberRise: Float32Array | undefined;
    onProgress(6);

    void Promise.all([
      import(/* @vite-ignore */ threeUrl),
      import(/* @vite-ignore */ loaderUrl),
    ]).then(([THREE, loaderModule]: any[]) => {
      if (disposed) return;
      onProgress(14);
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
      } catch {
        onReady();
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0.15, 7.4);
      scene.add(new THREE.HemisphereLight(0xb9d9ff, 0x27110b, 2.1));
      const key = new THREE.PointLight(0xffad57, 34, 18);
      key.position.set(2.4, 2.3, 4.5);
      scene.add(key);
      const rim = new THREE.PointLight(0x4c80d9, 28, 16);
      rim.position.set(-3, 1, -2);
      scene.add(rim);

      figure = new THREE.Group();
      scene.add(figure);
      fireRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.82, 0.025, 10, 128),
        new THREE.MeshStandardMaterial({ color: 0xff8d36, emissive: 0xd54a12, emissiveIntensity: 1.3, metalness: 0.48, roughness: 0.28 }),
      );
      fireRing.scale.y = 1.13;
      fireRing.position.z = -0.22;
      figure.add(fireRing);

      // A fine ring of animated flame tongues gives the bronze scan a more
      // dimensional, ceremonial frame than a single rotating outline.
      fireFlames = new THREE.InstancedMesh(
        new THREE.ConeGeometry(0.035, 0.16, 5),
        new THREE.MeshStandardMaterial({ color: 0xff9a42, emissive: 0xa8320b, emissiveIntensity: 1.1, metalness: 0.15, roughness: 0.38 }),
        88,
      );
      const flameTransform = new THREE.Object3D();
      for (let index = 0; index < 88; index += 1) {
        const angle = (index / 88) * Math.PI * 2;
        const radius = 1.83;
        flameTransform.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 1.13, -0.2);
        flameTransform.rotation.z = angle - Math.PI / 2;
        flameTransform.scale.setScalar(0.55 + Math.random() * 0.8);
        flameTransform.updateMatrix();
        fireFlames.setMatrixAt(index, flameTransform.matrix);
        fireFlames.setColorAt(index, new THREE.Color().setHSL(0.055 + Math.random() * 0.045, 0.86, 0.5 + Math.random() * 0.14));
      }
      fireFlames.instanceMatrix.needsUpdate = true;
      figure.add(fireFlames);

      const emberPositions = new Float32Array(260 * 3);
      emberRise = new Float32Array(260);
      for (let index = 0; index < 260; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.55 + Math.random() * 1.05;
        emberPositions[index * 3] = Math.cos(angle) * radius;
        emberPositions[index * 3 + 1] = (Math.random() - 0.5) * 3.5;
        emberPositions[index * 3 + 2] = (Math.random() - 0.5) * 1.8;
        emberRise[index] = 0.004 + Math.random() * 0.012;
      }
      emberGeometry = new THREE.BufferGeometry();
      emberGeometry.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));
      embers = new THREE.Points(emberGeometry, new THREE.PointsMaterial({ color: 0xffb45a, size: 0.035, transparent: true, opacity: 0.8, sizeAttenuation: true }));
      scene.add(embers);

      const resize = ([entry]: ResizeObserverEntry[]) => {
        if (!entry) return;
        const { width, height } = entry.contentRect;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.position.z = width < 520 ? 8.3 : 7.4;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        renderer.render(scene, camera);
      };
      observer = new ResizeObserver(resize);
      observer.observe(canvas);

      const loader = new loaderModule.GLTFLoader();
      loader.load(statueUrl, (gltf: any) => {
        if (disposed) return;
        const statue = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(statue);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const extent = Math.max(size.x, size.y, size.z) || 1;
        statue.scale.setScalar(3.55 / extent);
        statue.position.set(-center.x * statue.scale.x, -center.y * statue.scale.y, -center.z * statue.scale.z);
        statue.rotation.y = 0.12;
        figure.add(statue);
        onProgress(100);
        onReady();
      }, (event: ProgressEvent) => {
        if (event.lengthComputable && event.total > 0) onProgress(Math.min(96, 14 + Math.round((event.loaded / event.total) * 82)));
      }, () => { onProgress(100); onReady(); });

      let previous = 0;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const draw = (time: number) => {
        frame = requestAnimationFrame(draw);
        if (disposed || document.hidden || reduceMotion.matches || time - previous < 32) return;
        previous = time;
        figure.rotation.y = Math.sin(time * 0.00022) * 0.12;
        figure.rotation.x = Math.sin(time * 0.00047) * 0.018;
        figure.position.y = Math.sin(time * 0.0012) * 0.035;
        const breath = 1 + Math.sin(time * 0.0011) * 0.012;
        figure.scale.set(breath, breath, breath);
        fireRing.rotation.z = Math.sin(time * 0.0003) * 0.035;
        fireFlames.rotation.z = -time * 0.00009;
        embers.rotation.y = Math.sin(time * 0.00018) * 0.12;
        const positions = emberGeometry.attributes.position;
        for (let index = 0; index < positions.count; index += 1) {
          const nextY = positions.getY(index) + (emberRise?.[index] ?? 0.006);
          positions.setY(index, nextY > 2.3 ? -2.3 : nextY);
        }
        positions.needsUpdate = true;
        key.intensity = 31 + Math.sin(time * 0.004) * 4;
        camera.position.x = Math.sin(time * 0.00017) * 0.16;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      };
      resizeObserverRender();
      if (!reduceMotion.matches) frame = requestAnimationFrame(draw);

      function resizeObserverRender() {
        const bounds = canvasRef.current?.getBoundingClientRect();
        if (bounds?.width && bounds.height) resize([{ contentRect: bounds } as ResizeObserverEntry]);
      }
    }).catch(() => onReady());

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      scene?.traverse((object: any) => {
        object.geometry?.dispose?.();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach((material: any) => material.dispose?.());
      });
      renderer?.dispose();
    };
  }, [onReady]);

  return <canvas ref={canvasRef} className="shiva-tandav-canvas" aria-hidden="true"/>;
}

export default function ShivaTandavPreloader() {
  const [visible, setVisible] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const startRef = useRef(performance.now());
  const onReady = useCallback(() => { setProgress(100); setModelReady(true); }, []);
  const messages = ["Loading the artwork", "Lighting the scene", "Preparing your editor", "Almost ready"];

  useEffect(() => {
    const timer = window.setInterval(() => setMessageIndex((index) => (index + 1) % messages.length), 1450);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!modelReady) return;
    const remaining = Math.max(0, 6000 - (performance.now() - startRef.current));
    const timer = window.setTimeout(() => setVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, [modelReady]);

  useEffect(() => {
    const failsafe = window.setTimeout(() => setVisible(false), 7000);
    return () => window.clearTimeout(failsafe);
  }, []);

  if (!visible) return null;
  return <div className="shiva-preloader" role="status" aria-live="polite">
    <div className="shiva-preloader-art"><TandavScene onReady={onReady} onProgress={setProgress}/><div className="shiva-preloader-aura"/></div>
    <div className="shiva-preloader-copy"><span>CODEXSHEET · DEVA</span><h1>Shiva <em>Tandav</em></h1><p className="shiva-preloader-status" key={messageIndex}>{messages[messageIndex]}</p><div className="shiva-preloader-progress" role="progressbar" aria-label="Loading the Deva editor" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{ width: `${Math.max(5, progress)}%` }}/></div><small>{progress}% · Creation · preservation · renewal</small></div>
    <button className="shiva-preloader-skip" type="button" onClick={() => setVisible(false)} aria-label="Skip animation"><X size={18}/><span>Skip</span></button>
    <a className="shiva-preloader-credit" href="https://zenodo.org/records/10293437" target="_blank" rel="noreferrer">Nataraja bronze scan · Minneapolis Institute of Art</a>
  </div>;
}
