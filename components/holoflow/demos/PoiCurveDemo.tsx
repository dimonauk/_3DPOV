"use client";
/**
 * PoiCurveDemo.tsx — Three.js shell-curve tracer.
 * Extracted from holo-flow-studio-v5.html.
 * Mouse warps r1/r2 in real time. 4 mode buttons.
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Mode = "shell" | "butterfly" | "antispin" | "weave";
const MODES: { key: Mode; label: string }[] = [
  { key: "shell",     label: "Shell" },
  { key: "butterfly", label: "Butterfly" },
  { key: "antispin",  label: "Antispin" },
  { key: "weave",     label: "Weave" },
];
const PALETTE = [0xe07060, 0xf0a090, 0xc9a84c, 0xe8c97a, 0xd060a0, 0xb39fff];

function buildPoints(mode: Mode, mx: number, my: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const r1 = 2.2 + mx * 0.6, r2 = 1.1 + mx * 0.3, ph = my * Math.PI;
  for (let i = 0; i < 500; i++) {
    const t = (i / 500) * Math.PI * 2 * 6;
    let x = 0, y = 0, z = 0;
    if (mode === "shell") {
      x = r1 * Math.cos(t) + r2 * Math.cos((1 + mx * 0.5) * t + ph);
      y = (r1 * Math.sin(t) + r2 * Math.sin(1.7 * t + ph)) * 0.65;
      z = Math.sin(t * 1.3) * 1.4;
    } else if (mode === "butterfly") {
      x = 2.8 * Math.cos(t);
      y = 2.8 * Math.sin(t) * Math.cos(t * 0.5);
      z = Math.sin(2 * t) * 1.1;
    } else if (mode === "antispin") {
      x = 2 * Math.cos(t) - 1.5 * Math.cos(2 * t + ph);
      y = 2 * Math.sin(t) - 1.5 * Math.sin(2 * t + ph);
      z = Math.sin(t) * 1.7;
    } else {
      x = 2.5 * Math.cos(t) + 0.8 * Math.cos(3 * t);
      y = 2.5 * Math.sin(t) + 0.8 * Math.sin(3 * t);
      z = Math.sin(t * 1.5) * 0.9;
    }
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

export function PoiCurveDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("shell");
  const modeRef  = useRef<Mode>("shell");
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth || 420, H = 240;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0, 0);
    el.appendChild(renderer.domElement);
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 9;

    // ghost background traces
    for (let p = 0; p < 3; p++) {
      const pts: THREE.Vector3[] = [];
      const r1b = 2 + p * 0.3, r2b = 1 + p * 0.18, phb = p * 1.2;
      for (let i = 0; i < 350; i++) {
        const t = (i / 350) * Math.PI * 2 * 5;
        pts.push(new THREE.Vector3(
          r1b * Math.cos(t) + r2b * Math.cos(2.3 * t + phb),
          (r1b * Math.sin(t) + r2b * Math.sin(1.7 * t + phb)) * 0.65,
          Math.sin(t * 1.3 + p),
        ));
      }
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: [0xe07060, 0xc9a84c, 0xf0a090][p]!, transparent: true, opacity: 0.1 }),
      ));
    }

    let activeLine: THREE.Line | null = null;
    function rebuildLine(mx: number, my: number) {
      if (activeLine) scene.remove(activeLine);
      const pts = buildPoints(modeRef.current, mx, my);
      activeLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: PALETTE[Math.floor(Math.random() * PALETTE.length)]!, transparent: true, opacity: 0.6 }),
      );
      scene.add(activeLine);
    }
    rebuildLine(0, 0);

    let lmx = 0, lmy = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - r.left) / r.width)  * 2 - 1;
      mouseRef.current.y = -((e.clientY - r.top)  / r.height) * 2 + 1;
    };
    el.addEventListener("mousemove", onMove);

    let pt = 0, rafId = 0;
    function loop() {
      rafId = requestAnimationFrame(loop);
      pt += 0.007;
      const { x, y } = mouseRef.current;
      if (Math.abs(x - lmx) > 0.03 || Math.abs(y - lmy) > 0.03) {
        rebuildLine(x, y); lmx = x; lmy = y;
      }
      if (activeLine) activeLine.rotation.y = pt * 0.28;
      camera.position.x = Math.sin(pt * 0.22) * 2;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("mousemove", onMove);
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div ref={mountRef} className="relative h-[240px] w-full cursor-crosshair overflow-hidden rounded-lg border border-warm-black-700 bg-black">
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-0.5 font-mono text-[10px]">
          <span className="text-teal-300">SHELL CURVE TRACER · INTERACTIVE</span>
          <span className="text-lavender-200">MODE: {mode.toUpperCase()}</span>
          <span className="text-gold-300">MOVE MOUSE TO WARP</span>
        </div>
        <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-1.5 font-mono text-[10px] text-coral-300">
          <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-coral-300" />
          TRACING LIVE
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {MODES.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setMode(key)}
            className={["border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors",
              mode === key
                ? "border-coral-400 bg-coral-400/10 text-coral-300"
                : "border-warm-black-700 text-chrome-500 hover:border-warm-black-500 hover:text-chrome-300",
            ].join(" ")}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
