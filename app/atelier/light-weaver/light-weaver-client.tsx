"use client";

/**
 * app/atelier/light-weaver/light-weaver-client.tsx — Light Weaver chamber.
 *
 * A focused light-trail composer. Mouse drives a luminous head; the head
 * leaves a camera-facing ribbon trail through 3D space, shaded by a
 * selectable trail shader. Optional autoplay describes a figure-8 (the
 * fundamental weave) so the trail draws itself.
 *
 * Source: apps/Light_Weiver/src/input/TrailShaders.ts — the same shader
 * library used in the bench app, ported to a single chamber here, with
 * the game systems (zones, kata, sisters, agents) stripped out.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:light-weaver");

// ─────────────────────────────────────────────────────────────────────────────
// SHADER LIBRARY — six representative trail shaders.
// Lifted from apps/Light_Weiver/src/input/TrailShaders.ts.
// Each shader takes uTime, uIntensity, uSpeed and varies a vAge / vUv pair
// produced by the shared vertex shader below.
// ─────────────────────────────────────────────────────────────────────────────

const TRAIL_VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vAge;
  varying float vSpeed;
  attribute float age;
  void main() {
    vUv = uv;
    vAge = age;
    vSpeed = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLAME_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float twist = sin(vUv.y * 8.0 + uTime * 3.5) * 0.4 * uSpeed;
    float d = abs(uv.x - twist);
    float core = 1.0 - smoothstep(0.0, 0.25, d);
    float outer = 1.0 - smoothstep(0.2, 0.7, d);
    float alpha = (1.0 - vAge) * outer;
    if (alpha < 0.01) discard;
    vec3 hot = vec3(1.0, 0.95, 0.7);
    vec3 mid = vec3(1.0, 0.4, 0.0);
    vec3 cool = vec3(0.6, 0.05, 0.0);
    vec3 col = mix(cool, mix(mid, hot, core), (1.0 - vAge));
    col = mix(col * 0.5, col, uSpeed);
    col += vec3(0.2, 0.1, 0.0) * uIntensity;
    gl_FragColor = vec4(col, alpha * 0.92);
  }
`;

const PLASMA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float p = sin(uv.x * 10.0 + uTime * 4.0)
            + sin(uv.y * 8.0 - uTime * 3.0)
            + sin((uv.x + uv.y) * 12.0 + uTime * 5.0)
            + sin(length(uv) * 14.0 - uTime * 6.0);
    p = p * 0.25 + 0.5;
    float alpha = (1.0 - vAge) * (1.0 - smoothstep(0.4, 0.9, length(uv)));
    if (alpha < 0.01) discard;
    vec3 col = mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.2, 0.9), p);
    col = mix(col, vec3(1.0), pow(p, 4.0) * uIntensity);
    gl_FragColor = vec4(col, alpha * 0.92);
  }
`;

const AURORA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float b1 = sin(uv.y * 4.0 + uTime * 0.8 + uv.x * 2.0) * 0.5 + 0.5;
    float b2 = sin(uv.y * 7.0 - uTime * 0.5 + uv.x * 3.0) * 0.5 + 0.5;
    float b3 = sin(uv.y * 2.5 + uTime * 1.2) * 0.5 + 0.5;
    float curtain = (b1 * 0.5 + b2 * 0.3 + b3 * 0.2);
    float mask = 1.0 - smoothstep(0.3, 1.0, abs(uv.x));
    float alpha = (1.0 - vAge) * curtain * mask * 0.85;
    if (alpha < 0.01) discard;
    vec3 green = vec3(0.1, 1.0, 0.5);
    vec3 cyan = vec3(0.0, 0.9, 1.0);
    vec3 violet = vec3(0.7, 0.1, 1.0);
    vec3 col = mix(green, cyan, b1);
    col = mix(col, violet, uIntensity);
    col += vec3(0.0, 0.3, 0.2) * b3;
    gl_FragColor = vec4(col, alpha);
  }
`;

const MYCELIUM_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float filament = 1.0 - smoothstep(0.0, 0.08, abs(uv.x + sin(vUv.y * 20.0 + uTime) * 0.1));
    float web = 0.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float angle = fi * 1.257 + uTime * 0.1;
      float d = abs(uv.x * cos(angle) + uv.y * sin(angle));
      web += (1.0 - smoothstep(0.0, 0.04, d)) * 0.15 * hash(fi * 3.3 + uTime * 0.2);
    }
    float pattern = clamp(filament + web, 0.0, 1.0);
    float alpha = pow(1.0 - vAge, 0.7) * pattern;
    if (alpha < 0.01) discard;
    vec3 col = mix(vec3(0.85, 0.82, 0.7), vec3(0.7, 0.5, 0.9), web / (web + 0.01));
    col += vec3(0.3, 0.1, 0.5) * uIntensity * pattern;
    gl_FragColor = vec4(col, alpha * 0.82);
  }
`;

const INK_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  float inkBleed(vec2 uv, float age) {
    float d = length(uv);
    float spread = 0.2 + age * 0.6;
    return max((1.0 - smoothstep(spread - 0.15, spread, d)) * 0.4,
               1.0 - smoothstep(0.0, spread * 0.4, d));
  }
  void main() {
    float alpha = pow(1.0 - vAge, 0.6) * 0.95;
    if (alpha < 0.01) discard;
    vec2 uv = vUv * 2.0 - 1.0;
    float bleed = inkBleed(uv, vAge);
    float tex = sin(uv.x * 40.0 + sin(uv.y * 20.0) * 2.0) * 0.1 + 0.9;
    vec3 col = mix(vec3(0.04, 0.03, 0.06), vec3(0.15, 0.05, 0.35), (1.0 - bleed) * 0.6);
    col += vec3(0.3, 0.1, 0.5) * pow(bleed, 3.0) * uIntensity * 0.5;
    gl_FragColor = vec4(col, alpha * bleed * tex);
  }
`;

const NEON_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vAge;
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float d = abs(uv.x);
    float tube = 1.0 - smoothstep(0.04, 0.18, d);
    float glow = (1.0 - smoothstep(0.0, 0.6, d)) * 0.4;
    float alpha = (1.0 - vAge) * (tube + glow);
    if (alpha < 0.01) discard;
    vec3 cyan = vec3(0.0, 1.0, 0.9);
    vec3 magenta = vec3(1.0, 0.1, 0.9);
    vec3 col = mix(cyan, magenta, uIntensity);
    col = mix(col, vec3(1.0, 1.0, 1.0), tube * 0.6);
    gl_FragColor = vec4(col, alpha * 0.88);
  }
`;

type ShaderKey = "flame" | "plasma" | "aurora" | "mycelium" | "ink" | "neon";

const SHADER_LIBRARY: Record<ShaderKey, { label: string; frag: string }> = {
  flame: { label: "Flame ribbon", frag: FLAME_FRAG },
  plasma: { label: "Plasma", frag: PLASMA_FRAG },
  aurora: { label: "Aurora", frag: AURORA_FRAG },
  mycelium: { label: "Mycelium", frag: MYCELIUM_FRAG },
  ink: { label: "Ink bleed", frag: INK_FRAG },
  neon: { label: "Neon tube", frag: NEON_FRAG },
};

type TipKey = "sphere" | "crystal" | "torus" | "icosahedron";

const TIP_LABELS: Record<TipKey, string> = {
  sphere: "Sphere",
  crystal: "Crystal",
  torus: "Torus",
  icosahedron: "Icosahedron",
};

// ─────────────────────────────────────────────────────────────────────────────
// TRAIL RIBBON — ported from apps/Light_Weiver/src/input/TrailShaders.ts
// Camera-facing quad strip; per-vertex `age` attribute drives shader fade.
// ─────────────────────────────────────────────────────────────────────────────

const TRAIL_SEGMENTS = 64;

class TrailRibbon {
  readonly geometry: THREE.BufferGeometry;
  readonly mesh: THREE.Mesh;
  private positions: Float32Array;
  private uvs: Float32Array;
  private ages: Float32Array;
  private indices: Uint16Array;
  private points: THREE.Vector3[] = [];
  private baseWidth = 0.04;

  constructor(material: THREE.ShaderMaterial) {
    const N = TRAIL_SEGMENTS;
    const V = N * 2;
    const F = (N - 1) * 2;
    this.positions = new Float32Array(V * 3);
    this.uvs = new Float32Array(V * 2);
    this.ages = new Float32Array(V);
    this.indices = new Uint16Array(F * 3);
    for (let i = 0; i < N - 1; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      const base = i * 6;
      this.indices[base + 0] = a;
      this.indices[base + 1] = b;
      this.indices[base + 2] = c;
      this.indices[base + 3] = b;
      this.indices[base + 4] = d;
      this.indices[base + 5] = c;
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3),
    );
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(this.uvs, 2));
    this.geometry.setAttribute("age", new THREE.BufferAttribute(this.ages, 1));
    this.geometry.setIndex(new THREE.BufferAttribute(this.indices, 1));
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.frustumCulled = false;
  }

  setBaseWidth(w: number): void {
    this.baseWidth = w;
  }

  clear(): void {
    this.points = [];
    this.ages.fill(1);
    // age attribute is added in the constructor; always present.
    this.geometry.attributes.age!.needsUpdate = true;
  }

  update(headPos: THREE.Vector3, speed: number, camera: THREE.Camera): void {
    this.points.push(headPos.clone());
    if (this.points.length > TRAIL_SEGMENTS) this.points.shift();
    const N = this.points.length;
    if (N < 2) return;

    const camRight = new THREE.Vector3();
    camRight.setFromMatrixColumn(camera.matrixWorld, 0);
    const width = this.baseWidth + speed * 0.12;

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const age = 1 - t;
      const w = width * t;
      const p = this.points[i]!;
      const left = p.clone().addScaledVector(camRight, -w);
      const right = p.clone().addScaledVector(camRight, w);
      const vi = i * 2;
      this.positions[vi * 3 + 0] = left.x;
      this.positions[vi * 3 + 1] = left.y;
      this.positions[vi * 3 + 2] = left.z;
      this.uvs[vi * 2 + 0] = 0;
      this.uvs[vi * 2 + 1] = t;
      this.ages[vi] = age;
      this.positions[(vi + 1) * 3 + 0] = right.x;
      this.positions[(vi + 1) * 3 + 1] = right.y;
      this.positions[(vi + 1) * 3 + 2] = right.z;
      this.uvs[(vi + 1) * 2 + 0] = 1;
      this.uvs[(vi + 1) * 2 + 1] = t;
      this.ages[vi + 1] = age;
    }

    for (let i = N; i < TRAIL_SEGMENTS; i++) {
      const vi = i * 2;
      const last = this.points[N - 1]!;
      for (let k = 0; k < 2; k++) {
        this.positions[(vi + k) * 3 + 0] = last.x;
        this.positions[(vi + k) * 3 + 1] = last.y;
        this.positions[(vi + k) * 3 + 2] = last.z;
        this.ages[vi + k] = 1;
      }
    }

    // position / uv / age attributes are all added in the constructor.
    this.geometry.attributes.position!.needsUpdate = true;
    this.geometry.attributes.uv!.needsUpdate = true;
    this.geometry.attributes.age!.needsUpdate = true;
  }

  tick(time: number, resonance: number, speed: number): void {
    const mat = this.mesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime!.value = time;
    mat.uniforms.uIntensity!.value = resonance;
    mat.uniforms.uSpeed!.value = speed;
  }

  dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

function buildTipGeometry(tip: TipKey): THREE.BufferGeometry {
  switch (tip) {
    case "crystal": {
      const g = new THREE.OctahedronGeometry(0.16, 0);
      g.scale(0.7, 1.6, 0.7);
      return g;
    }
    case "torus":
      return new THREE.TorusGeometry(0.13, 0.055, 8, 20);
    case "icosahedron":
      return new THREE.IcosahedronGeometry(0.16, 1);
    default:
      return new THREE.SphereGeometry(0.14, 16, 12);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE — head, trail, optional autoplay path.
// ─────────────────────────────────────────────────────────────────────────────

interface HeadDriverHandle {
  position: THREE.Vector3;
  speed: number;
}

interface WeaveSceneProps {
  shaderKey: ShaderKey;
  tipKey: TipKey;
  intensity: number;
  baseWidth: number;
  autoplay: boolean;
  clearSignal: number;
  driver: HeadDriverHandle;
}

function WeaveScene({
  shaderKey,
  tipKey,
  intensity,
  baseWidth,
  autoplay,
  clearSignal,
  driver,
}: WeaveSceneProps) {
  const { camera, scene, mouse, viewport } = useThree();
  const tipRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<TrailRibbon | null>(null);
  const prevHead = useRef(new THREE.Vector3());
  const speedSmooth = useRef(0);

  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: TRAIL_VERT,
      fragmentShader: SHADER_LIBRARY[shaderKey].frag,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uSpeed: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    return m;
  }, [shaderKey, intensity]);

  // Trail lifecycle — rebuild on shader change.
  useEffect(() => {
    const ribbon = new TrailRibbon(material);
    ribbon.setBaseWidth(baseWidth);
    trailRef.current = ribbon;
    scene.add(ribbon.mesh);
    log.info("trail mounted", { shader: shaderKey });
    return () => {
      scene.remove(ribbon.mesh);
      ribbon.dispose();
      trailRef.current = null;
    };
  }, [material, scene, shaderKey, baseWidth]);

  useEffect(() => {
    trailRef.current?.setBaseWidth(baseWidth);
  }, [baseWidth]);

  // Clear signal from parent (button press).
  useEffect(() => {
    trailRef.current?.clear();
  }, [clearSignal]);

  // Tip geometry — rebuild on tip change.
  const tipGeo = useMemo(() => buildTipGeometry(tipKey), [tipKey]);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    let head: THREE.Vector3;

    if (autoplay) {
      // Figure-8 (lemniscate of gerono) — the fundamental weave path.
      const s = t * 0.9;
      head = new THREE.Vector3(
        Math.sin(s) * 1.6,
        Math.sin(s * 2) * 0.8,
        Math.cos(s * 0.6) * 0.4,
      );
    } else {
      // Mouse → world plane at z=0.
      head = new THREE.Vector3(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2,
        0,
      );
    }

    // Smoothed speed estimate for shader uSpeed input.
    const inst = head.distanceTo(prevHead.current) / Math.max(dt, 0.001);
    const target = Math.min(1, inst / 8);
    speedSmooth.current = speedSmooth.current * 0.85 + target * 0.15;
    prevHead.current.copy(head);

    driver.position.copy(head);
    driver.speed = speedSmooth.current;

    if (tipRef.current) {
      tipRef.current.position.copy(head);
      tipRef.current.rotation.y = t * 0.8;
      tipRef.current.rotation.x = t * 0.4;
    }
    if (glowRef.current) {
      glowRef.current.position.copy(head);
      const targetScale = 0.35 + speedSmooth.current * 0.5;
      glowRef.current.scale.setScalar(
        glowRef.current.scale.x +
          (targetScale - glowRef.current.scale.x) * 0.15,
      );
    }

    if (trailRef.current) {
      trailRef.current.update(head, speedSmooth.current, camera);
      trailRef.current.tick(t, intensity, speedSmooth.current);
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[2, 3, 4]} intensity={1.2} color={0xffccaa} />
      <pointLight position={[-3, -1, -2]} intensity={0.6} color={0x4488ff} />

      <mesh ref={tipRef} geometry={tipGeo}>
        <meshStandardMaterial
          color={0xffffff}
          emissive={0xffaa44}
          emissiveIntensity={2.2}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color={0xffcc88}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CLIENT — controls, canvas wrapper, snapshot.
// ─────────────────────────────────────────────────────────────────────────────

export default function LightWeaverClient() {
  useActiveChamber("light-weaver");

  const [shaderKey, setShaderKey] = useState<ShaderKey>("flame");
  const [tipKey, setTipKey] = useState<TipKey>("crystal");
  const [intensity, setIntensity] = useState(0.7);
  const [baseWidth, setBaseWidth] = useState(0.05);
  const [autoplay, setAutoplay] = useState(true);
  const [clearSignal, setClearSignal] = useState(0);

  const driverRef = useRef<HeadDriverHandle>({
    position: new THREE.Vector3(),
    speed: 0,
  });
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const onClear = useCallback(() => setClearSignal((c) => c + 1), []);

  const onSnapshot = useCallback(() => {
    const container = canvasContainerRef.current;
    const canvas = container?.querySelector("canvas");
    if (!canvas) {
      log.warn("snapshot: no canvas found");
      return;
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        log.warn("snapshot: toBlob returned null");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `light-weaver-${shaderKey}-${Date.now()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      log.info("snapshot saved", { shader: shaderKey, size: blob.size });
    }, "image/png");
  }, [shaderKey]);

  return (
    <div className="flex flex-col gap-8">
      <section
        ref={canvasContainerRef}
        className="relative h-[520px] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-black"
      >
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 55 }}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
        >
          <WeaveScene
            shaderKey={shaderKey}
            tipKey={tipKey}
            intensity={intensity}
            baseWidth={baseWidth}
            autoplay={autoplay}
            clearSignal={clearSignal}
            driver={driverRef.current}
          />
        </Canvas>
        <div className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome-400">
          {autoplay ? "autoplay · figure-8" : "mouse drives the head"}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">Trail shader</span>
          <select
            value={shaderKey}
            onChange={(e) => setShaderKey(e.target.value as ShaderKey)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-xs text-chrome-200"
            aria-label="Trail shader"
          >
            {(Object.keys(SHADER_LIBRARY) as ShaderKey[]).map((k) => (
              <option key={k} value={k}>
                {SHADER_LIBRARY[k].label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">Tip geometry</span>
          <select
            value={tipKey}
            onChange={(e) => setTipKey(e.target.value as TipKey)}
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 font-mono text-xs text-chrome-200"
            aria-label="Tip geometry"
          >
            {(Object.keys(TIP_LABELS) as TipKey[]).map((k) => (
              <option key={k} value={k}>
                {TIP_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">
            Brightness &middot; {Math.round(intensity * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="accent-pink-200"
            aria-label="Brightness"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="chrome-label text-chrome-400">
            Trail width &middot; {baseWidth.toFixed(2)}
          </span>
          <input
            type="range"
            min={0.01}
            max={0.2}
            step={0.01}
            value={baseWidth}
            onChange={(e) => setBaseWidth(Number(e.target.value))}
            className="accent-pink-200"
            aria-label="Trail width"
          />
        </label>

        <label className="flex items-center gap-2 self-end pb-2">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) => setAutoplay(e.target.checked)}
            className="accent-pink-200"
            aria-label="Autoplay figure-8"
          />
          <span className="chrome-label text-chrome-400">
            Autoplay figure-8
          </span>
        </label>

        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            onClick={onClear}
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-chrome-200 transition-colors hover:border-pink-200/60 hover:text-pink-200"
          >
            Clear trail
          </button>
          <button
            type="button"
            onClick={onSnapshot}
            className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
          >
            Save snapshot
          </button>
        </div>
      </section>

      <section className="rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6 text-sm text-chrome-300">
        <div className="chrome-label">How to use</div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-chrome-300">
          <li>
            <strong className="text-chrome-100">autoplay on</strong> &mdash;
            the head describes a figure-8 in space; trail draws itself.
          </li>
          <li>
            <strong className="text-chrome-100">autoplay off</strong>{" "}
            &mdash; the head follows the mouse cursor in the viewport.
            Drag wide arcs; the trail width responds to speed.
          </li>
          <li>
            <strong className="text-chrome-100">trail shader</strong>{" "}
            &mdash; flame, plasma, aurora, mycelium, ink, or neon. Each
            reads the same age / speed / brightness inputs differently.
          </li>
          <li>
            <strong className="text-chrome-100">save snapshot</strong>{" "}
            &mdash; PNG of the current frame; the canvas is configured
            with <code className="font-mono">preserveDrawingBuffer</code>{" "}
            so it grabs the live composite.
          </li>
        </ul>
      </section>
    </div>
  );
}
