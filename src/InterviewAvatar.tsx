import { useEffect, useRef } from "react";
import * as THREE from "three";

/** A lightweight, locally rendered 3D interviewer avatar. */
export default function InterviewAvatar({ speaking = false }: { speaking?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const speakingRef = useRef(speaking);

  useEffect(() => { speakingRef.current = speaking; }, [speaking]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: any;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, host.clientWidth / host.clientHeight, 0.1, 40);
    camera.position.set(0, 0.1, 6.8);
    scene.add(new THREE.HemisphereLight(0xf4f3ff, 0x353043, 2.1));
    const key = new THREE.DirectionalLight(0xffe3c8, 3.2);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const rim = new THREE.PointLight(0x9f8bff, 14, 12);
    rim.position.set(3, 1, -1);
    scene.add(rim);

    const head = new THREE.Group();
    scene.add(head);
    const skin = new THREE.MeshStandardMaterial({ color: 0xb9795b, roughness: 0.75 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x28202a, roughness: 0.8 });
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xf4eadf, roughness: 0.45 });
    const iris = new THREE.MeshStandardMaterial({ color: 0x392b29, roughness: 0.35 });
    const lips = new THREE.MeshStandardMaterial({ color: 0x6e3936, roughness: 0.6 });
    const torso = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 32), new THREE.MeshStandardMaterial({ color: 0x39354d, roughness: 0.7 }));
    torso.scale.set(1.35, 0.92, 0.52);
    torso.position.set(0, -1.35, -0.15);
    head.add(torso);

    const face = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 40), skin);
    face.scale.set(0.79, 1.05, 0.72);
    head.add(face);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.52), dark);
    hair.scale.set(0.82, 1.08, 0.75);
    hair.position.set(0, 0.06, 0.02);
    head.add(hair);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), skin);
      ear.position.set(side * 0.77, -0.08, -0.02);
      ear.scale.set(0.48, 0.8, 0.5);
      head.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 18), eyeWhite);
      eye.position.set(side * 0.3, 0.1, 0.655);
      eye.scale.set(1.15, 0.68, 0.45);
      head.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.052, 20, 16), iris);
      pupil.position.set(side * 0.3, 0.095, 0.704);
      head.add(pupil);
      const brow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 12), dark);
      brow.position.set(side * 0.3, 0.245, 0.64);
      brow.scale.set(1.2, 0.22, 0.25);
      head.add(brow);
    }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), skin);
    nose.position.set(0, -0.08, 0.7);
    nose.scale.set(0.66, 1.18, 0.72);
    head.add(nose);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), lips);
    mouth.position.set(0, -0.43, 0.66);
    mouth.scale.set(0.83, 0.22, 0.3);
    head.add(mouth);
    head.position.y = 0.12;
    head.rotation.y = -0.08;

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.009, 8, 120), new THREE.MeshBasicMaterial({ color: 0x9281e8, transparent: true, opacity: 0.55 }));
    ring.position.z = -0.65;
    ring.rotation.x = -0.18;
    scene.add(ring);
    const clock = new THREE.Clock();
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.14;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.08;
    };
    const resize = () => {
      if (!host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    host.addEventListener("pointermove", onPointerMove);
    const animate = () => {
      const time = clock.getElapsedTime();
      head.rotation.y += ((pointerX + Math.sin(time * 0.42) * 0.035) - head.rotation.y) * 0.035;
      head.rotation.x += ((-pointerY + Math.sin(time * 0.7) * 0.012) - head.rotation.x) * 0.035;
      head.position.y = 0.12 + Math.sin(time * 1.25) * 0.025;
      mouth.scale.y = speakingRef.current ? 0.22 + Math.abs(Math.sin(time * 12)) * 0.13 : 0.22;
      ring.rotation.z = time * 0.12;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      scene.traverse((object: any) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material: any) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="interview-avatar" ref={hostRef} role="img" aria-label="Animated 3D interviewer avatar" />;
}
