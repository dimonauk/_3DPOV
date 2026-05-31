"use client";
/**
 * HeritagePointCloudDemo.tsx — Three.js point cloud + 4 view modes.
 * Extracted from holo-flow-studio-v5.html.
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type HMode = "pts" | "mesh" | "scan" | "section";
const HMODES: { key: HMode; label: string }[] = [
  { key: "pts",     label: "Point cloud" },
  { key: "mesh",    label: "Wireframe" },
  { key: "scan",    label: "Scan lines" },
  { key: "section", label: "Section cut" },
];

export function HeritagePointCloudDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode]   = useState<HMode>("pts");
  const [pts, setPts]     = useState("18,432");
  const modeRef           = useRef<HMode>("pts");
  const objectsRef        = useRef<{ pc: THREE.Points | null; wm: THREE.LineSegments | null; sl: THREE.Line[] }>({ pc: null, wm: null, sl: [] });

  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth || 420, H = 220;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0, 0);
    el.appendChild(renderer.domElement);
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.set(0, 1.5, 6);
    camera.lookAt(0, 0, 0);

    // point cloud
    const pGeo = new THREE.BufferGeometry();
    const count = 2048;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pc = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xc9a84c, size: 0.04, transparent: true, opacity: 0.8 }));
    scene.add(pc);
    objectsRef.current.pc = pc;

    // wireframe box
    const wm = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(4, 2.5, 2.5, 3, 2, 2)),
      new THREE.LineBasicMaterial({ color: 0x8b6fff, transparent: true, opacity: 0.6 }),
    );
    wm.visible = false;
    scene.add(wm);
    objectsRef.current.wm = wm;

    // scan lines
    const sl: THREE.Line[] = [];
    for (let i = 0; i < 12; i++) {
      const y = -1.5 + (i / 11) * 3;
      const pts2: THREE.Vector3[] = [];
      for (let j = 0; j <= 40; j++) {
        const x = -2.5 + (j / 40) * 5;
        pts2.push(new THREE.Vector3(x, y, (Math.random() - 0.5) * 0.3));
      }
      const ln = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts2),
        new THREE.LineBasicMaterial({ color: 0x3ecfb0, transparent: true, opacity: 0.5 }),
      );
      ln.visible = false;
      scene.add(ln);
      sl.push(ln);
    }
    objectsRef.current.sl = sl;

    let ht = 0, rafId = 0;
    function loop() {
      rafId = requestAnimationFrame(loop);
      ht += 0.012;
      const m = modeRef.current;
      if (pc) pc.visible  = m === "pts";
      if (wm) wm.visible  = m === "mesh";
      sl.forEach((l, idx) => {
        l.visible = m === "scan" || m === "section";
        if (l.visible) {
          const mat = l.material as THREE.LineBasicMaterial;
          mat.opacity = 0.3 + 0.5 * (Math.sin(ht * 3 - idx * 0.35 + 1) * 0.5 + 0.5);
        }
      });
      setPts((1600 + Math.floor(Math.sin(ht) * 200)).toLocaleString() + " pts");
      scene.rotation.y = ht * 0.15;
      renderer.render(scene, camera);
    }
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div ref={mountRef} className="relative h-[220px] w-full overflow-hidden rounded-lg border border-warm-black-700 bg-black">
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-0.5 font-mono text-[10px]">
          <span className="text-teal-300">POINT CLOUD RENDERER</span>
          <span className="text-lavender-200">{pts}</span>
          <span className="text-gold-300">RESOLUTION: 2mm</span>
        </div>
        <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-1.5 font-mono text-[10px] text-teal-300">
          <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-teal-300" />
          CAPTURE SIM
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {HMODES.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setMode(key)}
            className={["border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors",
              mode === key
                ? "border-gold-400 bg-gold-400/10 text-gold-300"
                : "border-warm-black-700 text-chrome-500 hover:border-warm-black-500 hover:text-chrome-300",
            ].join(" ")}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
