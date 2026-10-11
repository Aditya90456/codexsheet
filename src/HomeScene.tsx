import { useEffect, useRef } from "react";

const threeModuleUrl = "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

export default function HomeScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let frame = 0;
    let renderer: any;
    let resizeObserver: ResizeObserver | undefined;
    let root: any;
    let dust: any;
    let scene: any;
    let camera: any;

    void import(/* @vite-ignore */ threeModuleUrl).then((THREE: any) => {
      if (disposed) return;

      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
      } catch {
        return;
      }

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
      camera.position.set(0, 0, 8.5);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      root = new THREE.Group();
      scene.add(root);

      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.64, 1),
        new THREE.MeshBasicMaterial({ color: 0x8fc2ff, wireframe: true, transparent: true, opacity: 0.72 }),
      );
      root.add(core);

      root.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.29, 20, 16),
        new THREE.MeshBasicMaterial({ color: 0x73aaff, transparent: true, opacity: 0.16 }),
      ));

      const orbitA = new THREE.Mesh(
        new THREE.TorusGeometry(1.08, 0.006, 6, 100),
        new THREE.MeshBasicMaterial({ color: 0x79b0fa, transparent: true, opacity: 0.36, wireframe: true }),
      );
      orbitA.rotation.set(0.82, 0.26, 0.24);
      root.add(orbitA);
      const orbitB = new THREE.Mesh(
        new THREE.TorusGeometry(1.38, 0.004, 5, 112),
        new THREE.MeshBasicMaterial({ color: 0x79b0fa, transparent: true, opacity: 0.22, wireframe: true }),
      );
      orbitB.rotation.set(1.22, -0.48, -0.24);
      root.add(orbitB);

      const nodeGeometry = new THREE.SphereGeometry(0.045, 10, 8);
      const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xa9d2ff, transparent: true, opacity: 0.8 });
      const nodePositions = [
        [-1.45, 0.62, 0.1], [-1.18, -0.88, 0.15], [-0.34, 1.18, -0.2],
        [0.96, 0.91, 0.12], [1.46, -0.34, -0.08], [0.52, -1.18, 0.16],
      ];
      nodePositions.forEach(([x, y, z]) => {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(x, y, z);
        root.add(node);
      });

      const points = new Float32Array(110 * 3);
      for (let index = 0; index < 110; index += 1) {
        const radius = 1.8 + Math.random() * 2.1;
        const angle = Math.random() * Math.PI * 2;
        points[index * 3] = Math.cos(angle) * radius;
        points[index * 3 + 1] = (Math.random() - 0.5) * 3.3;
        points[index * 3 + 2] = (Math.random() - 0.5) * 1.5 - 0.8;
      }
      const dustGeometry = new THREE.BufferGeometry();
      dustGeometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
      dust = new THREE.Points(
        dustGeometry,
        new THREE.PointsMaterial({ color: 0x9dc8ff, size: 0.025, transparent: true, opacity: 0.54, sizeAttenuation: true }),
      );
      scene.add(dust);

      const resize = ([entry]: ResizeObserverEntry[]) => {
        if (!entry) return;
        const { width, height } = entry.contentRect;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.position.x = width < 480 ? 0.35 : 0;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        renderer.render(scene, camera);
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);

      let lastFrame = 0;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const renderFrame = (time: number) => {
        frame = requestAnimationFrame(renderFrame);
        if (disposed || document.hidden || reduceMotion.matches || time - lastFrame < 32) return;
        lastFrame = time;
        root.rotation.y += 0.0018;
        root.rotation.x = Math.sin(time * 0.00022) * 0.055;
        dust.rotation.y -= 0.00035;
        renderer.render(scene, camera);
      };
      if (!reduceMotion.matches) frame = requestAnimationFrame(renderFrame);
    }).catch(() => {
      // Keep the rest of the home page usable if the external 3D module is blocked.
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      if (scene) {
        scene.traverse((object: any) => {
          if (!object.geometry) return;
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.filter(Boolean).forEach((material: any) => material.dispose());
        });
      }
      renderer?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="home-three-canvas" aria-hidden="true" />;
}
