"use client";

/**
 * app/atelier/silk-brush/silk-brush-client.tsx — Silk Brush chamber.
 *
 * 3D paint canvas. Pointer down on the invisible interaction plane,
 * drag to extrude a tube of THREE.CatmullRomCurve3 segments, release
 * to commit. Three brushes: a neon emissive line, a sparkle (still a
 * tube — kept simple so the port is one file), and a Keijiro-glitch
 * shader material whose `time` uniform animates per-frame.
 *
 * WebXR: a stable `createXRStore()` wraps the scene in `<XR>`; the
 * StageXRBar-style enter/exit row sits over the canvas. When the
 * visitor enters VR the same scene renders inside the headset.
 *
 * Ported from the Vite bench app at
 * D:/The_Hangar/apps/silk-brush-canvas/. The bench imports
 * `framer-motion` + `lucide-react`; both stripped here — the icons are
 * inline SVG and the framer-motion import in the source was unused.
 */

import { Canvas, extend, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  BakeShadows,
  Environment,
  Float,
  OrbitControls,
  PerspectiveCamera,
  shaderMaterial,
  Text,
} from "@react-three/drei";
import { createXRStore, XR, type XRStore } from "@react-three/xr";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:silk-brush");

// ---------------------------------------------------------------------------
// Brush registry
// ---------------------------------------------------------------------------

type BrushKind = "neon" | "particle" | "keijiro";

const BRUSH_LABEL: Record<BrushKind, string> = {
  neon: "Neon",
  particle: "Sparkle",
  keijiro: "Keijiro",
};

const BRUSH_COLOUR: Record<BrushKind, string> = {
  neon: "#00f2ff",
  particle: "#ffb84d",
  keijiro: "#ff5fbf",
};

// ---------------------------------------------------------------------------
// Keijiro-glitch shader material — ported intact from the bench.
// ---------------------------------------------------------------------------

const KeijiroGlitchMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color("#00f2ff"),
    intensity: 2.0,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying float vPulse;
    uniform float time;

    void main() {
      vUv = uv;
      vPulse = sin(time * 10.0 + position.y * 20.0) * cos(time * 5.0 + position.x * 10.0);
      vec3 pos = position;
      if (vPulse > 0.7) {
        pos += normal * vPulse * 0.1;
      }
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    varying vec2 vUv;
    varying float vPulse;
    uniform vec3 color;
    uniform float intensity;

    void main() {
      float edge = step(0.8, vPulse);
      vec3 finalColor = color * (1.0 + edge * intensity);
      if (edge < 0.1) {
        finalColor *= 0.5;
      }
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
);

extend({ KeijiroGlitchMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    keijiroGlitchMaterial: ThreeElements["meshStandardMaterial"] & {
      time?: number;
      color?: THREE.Color | string | number;
      intensity?: number;
    };
  }
}

// ---------------------------------------------------------------------------
// Stroke
// ---------------------------------------------------------------------------

type StrokeRecord = {
  id: number;
  points: THREE.Vector3[];
  color: string;
  kind: BrushKind;
};

function Stroke({
  points,
  color,
  width,
  kind,
}: {
  points: THREE.Vector3[];
  color: string;
  width: number;
  kind: BrushKind;
}) {
  const curve = useMemo(() => {
    if (points.length < 2) return null;
    return new THREE.CatmullRomCurve3(points);
  }, [points]);

  const materialRef = useRef<{ time?: number } | null>(null);

  useFrame((state) => {
    if (materialRef.current && materialRef.current.time !== undefined) {
      materialRef.current.time = state.clock.getElapsedTime();
    }
  });

  if (!curve) return null;

  return (
    <mesh>
      <tubeGeometry args={[curve, 64, width, 8, false]} />
      {kind === "keijiro" ? (
        <keijiroGlitchMaterial
          ref={materialRef as never}
          color={new THREE.Color(color)}
          transparent
        />
      ) : (
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={kind === "particle" ? 3 : 2}
          toneMapped={false}
        />
      )}
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Scene — paint plane, stroke list, environment, label.
// ---------------------------------------------------------------------------

function Scene({
  activeBrush,
  strokes,
  setStrokes,
}: {
  activeBrush: BrushKind;
  strokes: StrokeRecord[];
  setStrokes: React.Dispatch<React.SetStateAction<StrokeRecord[]>>;
}) {
  const [currentStroke, setCurrentStroke] = useState<THREE.Vector3[] | null>(
    null,
  );
  const colour = BRUSH_COLOUR[activeBrush];

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setCurrentStroke([e.point.clone()]);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!currentStroke) return;
    setCurrentStroke([...currentStroke, e.point.clone()]);
  };

  const handlePointerUp = () => {
    if (currentStroke && currentStroke.length > 1) {
      setStrokes((prev) => [
        ...prev,
        {
          id: Date.now(),
          points: currentStroke,
          color: colour,
          kind: activeBrush,
        },
      ]);
    }
    setCurrentStroke(null);
  };

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {/* Invisible interaction surface — one metre out. */}
      <mesh
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        visible={false}
      >
        <boxGeometry args={[100, 100, 0.1]} />
      </mesh>

      {strokes.map((s) => (
        <Stroke
          key={s.id}
          points={s.points}
          color={s.color}
          width={0.05}
          kind={s.kind}
        />
      ))}
      {currentStroke ? (
        <Stroke
          points={currentStroke}
          color={colour}
          width={0.05}
          kind={activeBrush}
        />
      ) : null}

      <Environment preset="night" />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Text
          position={[0, 2, -5]}
          fontSize={0.5}
          color="#cbcfd8"
        >
          SILK BRUSH
        </Text>
      </Float>
    </>
  );
}

// ---------------------------------------------------------------------------
// XR bar — enter/exit VR. Patterned on components/stage/StageXRBar.tsx.
// ---------------------------------------------------------------------------

function SilkBrushXRBar({ store }: { store: XRStore }) {
  const [vrSupported, setVrSupported] = useState(false);
  const [arSupported, setArSupported] = useState(false);
  const [active, setActive] = useState<"vr" | "ar" | null>(null);

  useEffect(() => {
    let cancelled = false;
    const nav = navigator as Navigator & {
      xr?: { isSessionSupported: (mode: string) => Promise<boolean> };
    };
    if (!nav.xr) return;
    Promise.all([
      nav.xr.isSessionSupported("immersive-vr").catch(() => false),
      nav.xr.isSessionSupported("immersive-ar").catch(() => false),
    ]).then(([vr, ar]) => {
      if (cancelled) return;
      setVrSupported(vr);
      setArSupported(ar);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = store.subscribe((s) => {
      if (s.session) {
        setActive(s.mode === "immersive-ar" ? "ar" : "vr");
      } else {
        setActive(null);
      }
    });
    return () => unsub();
  }, [store]);

  if (!vrSupported && !arSupported) {
    return (
      <span
        className="pointer-events-none rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-500"
        title="WebXR is not available in this browser. Try the Quest browser, or Chrome with a headset connected."
      >
        XR &middot; unavailable
      </span>
    );
  }

  if (active) {
    return (
      <button
        type="button"
        onClick={() => store.getState().session?.end()}
        className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1.5 font-mono text-[0.6rem] text-pink-100 transition-colors hover:bg-pink-200/20"
      >
        Exit {active.toUpperCase()}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {vrSupported ? (
        <button
          type="button"
          onClick={() => {
            log.info("enter vr");
            store.enterVR();
          }}
          className="rounded-sm border border-chrome-400/40 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-200 transition-colors hover:border-pink-200 hover:text-pink-200"
        >
          Enter VR
        </button>
      ) : null}
      {arSupported ? (
        <button
          type="button"
          onClick={() => {
            log.info("enter ar");
            store.enterAR();
          }}
          className="rounded-sm border border-chrome-400/40 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] text-chrome-200 transition-colors hover:border-pink-200 hover:text-pink-200"
        >
          Enter AR
        </button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline icons — replaces `lucide-react` so we don't pull a new dep.
// ---------------------------------------------------------------------------

const IconBase = ({
  children,
  size = 18,
}: {
  children: React.ReactNode;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconBrush = () => (
  <IconBase>
    <path d="M9 11l-3 3a2 2 0 1 0 3 3l3-3" />
    <path d="M22 2L12 12" />
    <path d="M14 8l2 2" />
  </IconBase>
);
const IconSparkle = () => (
  <IconBase>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </IconBase>
);
const IconGlitch = () => (
  <IconBase>
    <path d="M4 7h10M4 12h16M10 17h10" />
    <path d="M14 4l-4 4M14 16l-4 4" />
  </IconBase>
);
const IconEraser = () => (
  <IconBase>
    <path d="M20 20H8L3 15l11-11 7 7-9 9" />
    <path d="M13 6l5 5" />
  </IconBase>
);
const IconClear = () => (
  <IconBase>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </IconBase>
);

// ---------------------------------------------------------------------------
// Top-level client
// ---------------------------------------------------------------------------

export default function SilkBrushClient() {
  const [activeBrush, setActiveBrush] = useState<BrushKind>("keijiro");
  const [strokes, setStrokes] = useState<StrokeRecord[]>([]);

  // Stable XR store — recreating it tears down any live session.
  const xrStore = useMemo(() => createXRStore(), []);

  useActiveChamber("silk-brush");

  const clearAll = () => {
    log.info("clear strokes", { count: strokes.length });
    setStrokes([]);
  };

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-black">
      {/* XR bar — top-right. */}
      <div className="absolute right-3 top-3 z-20">
        <SilkBrushXRBar store={xrStore} />
      </div>

      {/* Stroke count + active brush — top-left. */}
      <div className="pointer-events-none absolute left-3 top-3 z-10">
        <div className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 text-[0.6rem] text-chrome-400">
          {strokes.length} stroke{strokes.length === 1 ? "" : "s"} &middot;{" "}
          {BRUSH_LABEL[activeBrush].toLowerCase()}
        </div>
      </div>

      {/* HUD — bottom-centre. */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-sm border border-warm-black-700 bg-warm-black-950/80 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2 border-r border-warm-black-700 pr-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{
              backgroundColor: BRUSH_COLOUR[activeBrush],
              boxShadow: `0 0 12px ${BRUSH_COLOUR[activeBrush]}`,
            }}
            aria-hidden
          />
          <span className="chrome-label text-[0.55rem] text-chrome-400">
            spectrum
          </span>
        </div>

        <BrushButton
          label="Neon brush"
          active={activeBrush === "neon"}
          onClick={() => setActiveBrush("neon")}
          icon={<IconBrush />}
        />
        <BrushButton
          label="Sparkle brush"
          active={activeBrush === "particle"}
          onClick={() => setActiveBrush("particle")}
          icon={<IconSparkle />}
        />
        <BrushButton
          label="Keijiro brush"
          active={activeBrush === "keijiro"}
          onClick={() => setActiveBrush("keijiro")}
          icon={<IconGlitch />}
        />
        <BrushButton
          label="Eraser (clears all)"
          active={false}
          onClick={clearAll}
          icon={<IconEraser />}
        />

        <div className="ml-2 flex gap-1.5 border-l border-warm-black-700 pl-3">
          <button
            type="button"
            onClick={clearAll}
            title="Clear all strokes"
            className="flex items-center gap-1.5 rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-chrome-300 transition-colors hover:border-pink-200 hover:text-pink-200"
          >
            <IconClear /> clear
          </button>
        </div>
      </div>

      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#05030a"]} />
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <XR store={xrStore}>
          <Scene
            activeBrush={activeBrush}
            strokes={strokes}
            setStrokes={setStrokes}
          />
        </XR>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
        />
        <BakeShadows />
      </Canvas>
    </div>
  );
}

function BrushButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "flex h-9 w-9 items-center justify-center rounded-sm border border-pink-200/60 bg-pink-200/10 text-pink-200 transition-colors"
          : "flex h-9 w-9 items-center justify-center rounded-sm border border-warm-black-700 bg-warm-black-900/60 text-chrome-400 transition-colors hover:border-pink-200/40 hover:text-pink-200"
      }
    >
      {icon}
    </button>
  );
}
