"use client";

/**
 * app/atelier/modal-lattice/modal-lattice-client.tsx
 *
 * Lattice deformer in R3F. A base mesh (sphere / torus / icosa) is
 * captured at rest. A 3D grid of control points (counts U x V x W)
 * is laid over its bounding box; each rest-space vertex is mapped to
 * normalised lattice coordinates (u,v,w in [0,1]^3). At render time
 * the deformed vertex is the tensor-product interpolation of the
 * control points at (u,v,w), using one of four kernels — the four
 * Blender exposes: linear, b-spline (uniform cubic, smoothed),
 * cardinal (interpolating, tension), catmull-rom (interpolating,
 * tangent-continuous).
 *
 * Math note: cardinal + catmull-rom are interpolating (the deformed
 * surface passes through unperturbed control points), b-spline is
 * approximating (it smooths through them). Linear is straight
 * trilinear. All four implemented as separable 1D kernels evaluated
 * along U, V, W axes.
 *
 * Original concept: Yann Terrer (Tyo-79)'s Blender modal-lattice-
 * resolution-v2 addon. Same affordances, web register.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { createLogger } from "lib/log";
import { useActiveChamber } from "lib/state/atelier-hooks";

const log = createLogger("atelier:modal-lattice");

// --- Kernels -------------------------------------------------------------

type Kernel = "linear" | "bspline" | "cardinal" | "catmull";

const KERNELS: ReadonlyArray<{ id: Kernel; label: string; hint: string }> = [
  { id: "linear", label: "Linear", hint: "Trilinear. The cheap, faceted one." },
  { id: "bspline", label: "B-spline", hint: "Cubic, smoothing. Doesn't pass through points." },
  { id: "cardinal", label: "Cardinal", hint: "Interpolating with tension. Crisp." },
  { id: "catmull", label: "Catmull-Rom", hint: "Interpolating, tangent-continuous. Cloth-like." },
];

type Shape = "sphere" | "torus" | "icosa";

const SHAPES: ReadonlyArray<{ id: Shape; label: string }> = [
  { id: "sphere", label: "Sphere" },
  { id: "torus", label: "Torus" },
  { id: "icosa", label: "Icosahedron" },
];

/**
 * Evaluate four kernel weights for a parameter t in [0, n-1], given
 * n control points along an axis. Returns { i0, w[4] } where the
 * sample is sum_{k=0..3} w[k] * P[clamp(i0 + k, 0, n-1)].
 * For n == 1, returns a degenerate kernel that just picks index 0.
 */
function kernelWeights(
  kernel: Kernel,
  t: number,
  n: number,
): { i0: number; w: [number, number, number, number] } {
  if (n <= 1) return { i0: 0, w: [1, 0, 0, 0] };
  const tc = Math.max(0, Math.min(n - 1, t));

  if (kernel === "linear") {
    const i = Math.floor(tc);
    const i0 = Math.max(0, Math.min(n - 2, i));
    const f = tc - i0;
    return { i0: i0 - 1, w: [0, 1 - f, f, 0] };
  }

  // Cubic kernels: take four neighbouring points and a local parameter
  // f in [0, 1] between the middle two.
  const i = Math.floor(tc);
  const i0 = i - 1;
  const f = tc - i;
  const f2 = f * f;
  const f3 = f2 * f;

  if (kernel === "bspline") {
    // Uniform cubic B-spline basis: smoothing, doesn't interpolate.
    const w0 = (1 - 3 * f + 3 * f2 - f3) / 6;
    const w1 = (4 - 6 * f2 + 3 * f3) / 6;
    const w2 = (1 + 3 * f + 3 * f2 - 3 * f3) / 6;
    const w3 = f3 / 6;
    return { i0, w: [w0, w1, w2, w3] };
  }

  if (kernel === "catmull") {
    // Catmull-Rom: tension = 0.5 cardinal, tangent-continuous.
    const w0 = -0.5 * f3 + f2 - 0.5 * f;
    const w1 = 1.5 * f3 - 2.5 * f2 + 1;
    const w2 = -1.5 * f3 + 2 * f2 + 0.5 * f;
    const w3 = 0.5 * f3 - 0.5 * f2;
    return { i0, w: [w0, w1, w2, w3] };
  }

  // Cardinal with tension = 0.25 (crisper than catmull-rom).
  const c = 0.25;
  const w0 = -c * f + 2 * c * f2 - c * f3;
  const w1 = 1 + (c - 3) * f2 + (2 - c) * f3;
  const w2 = c * f + (3 - 2 * c) * f2 + (c - 2) * f3;
  const w3 = -c * f2 + c * f3;
  return { i0, w: [w0, w1, w2, w3] };
}

// --- Lattice -------------------------------------------------------------

type LatticeDims = { u: number; v: number; w: number };

/** Generate a flat array of (u*v*w * 3) rest-position lattice points
 *  evenly distributed across [-0.5, 0.5]^3. */
function makeRestLattice(dims: LatticeDims): Float32Array {
  const { u, v, w } = dims;
  const out = new Float32Array(u * v * w * 3);
  const idx = (i: number, j: number, k: number) =>
    ((k * v + j) * u + i) * 3;
  for (let k = 0; k < w; k++) {
    const tw = w > 1 ? k / (w - 1) - 0.5 : 0;
    for (let j = 0; j < v; j++) {
      const tv = v > 1 ? j / (v - 1) - 0.5 : 0;
      for (let i = 0; i < u; i++) {
        const tu = u > 1 ? i / (u - 1) - 0.5 : 0;
        const o = idx(i, j, k);
        out[o] = tu;
        out[o + 1] = tv;
        out[o + 2] = tw;
      }
    }
  }
  return out;
}

/** Deform: read rest verts (uvw in [0,1]^3), write deformed positions
 *  by sampling the lattice with the chosen kernel. Mutates `outPos`. */
function deform(
  uvw: Float32Array,
  lattice: Float32Array,
  dims: LatticeDims,
  kernel: Kernel,
  outPos: Float32Array,
): void {
  const { u, v, w } = dims;
  const latIdx = (i: number, j: number, k: number) =>
    ((Math.max(0, Math.min(w - 1, k)) * v +
      Math.max(0, Math.min(v - 1, j))) *
      u +
      Math.max(0, Math.min(u - 1, i))) *
    3;

  const nVerts = uvw.length / 3;
  for (let vi = 0; vi < nVerts; vi++) {
    const tu = (uvw[vi * 3] as number) * (u - 1);
    const tv = (uvw[vi * 3 + 1] as number) * (v - 1);
    const tw = (uvw[vi * 3 + 2] as number) * (w - 1);

    const ku = kernelWeights(kernel, tu, u);
    const kv = kernelWeights(kernel, tv, v);
    const kw = kernelWeights(kernel, tw, w);

    let x = 0,
      y = 0,
      z = 0;
    for (let dw = 0; dw < 4; dw++) {
      const wwt = kw.w[dw] as number;
      if (wwt === 0) continue;
      const ki = kw.i0 + dw;
      for (let dv = 0; dv < 4; dv++) {
        const wvt = kv.w[dv] as number;
        if (wvt === 0) continue;
        const ji = kv.i0 + dv;
        for (let du = 0; du < 4; du++) {
          const wut = ku.w[du] as number;
          if (wut === 0) continue;
          const ii = ku.i0 + du;
          const o = latIdx(ii, ji, ki);
          const ww = wut * wvt * wwt;
          x += (lattice[o] as number) * ww;
          y += (lattice[o + 1] as number) * ww;
          z += (lattice[o + 2] as number) * ww;
        }
      }
    }
    outPos[vi * 3] = x;
    outPos[vi * 3 + 1] = y;
    outPos[vi * 3 + 2] = z;
  }
}

// --- Base shape factories -------------------------------------------------

function makeShape(shape: Shape): THREE.BufferGeometry {
  switch (shape) {
    case "sphere":
      return new THREE.SphereGeometry(0.42, 64, 48);
    case "torus":
      return new THREE.TorusGeometry(0.32, 0.12, 32, 96);
    case "icosa":
      return new THREE.IcosahedronGeometry(0.45, 4);
  }
}

/** From a base geometry, compute the rest positions and the
 *  normalised lattice coordinates uvw in [0,1]^3 derived from the
 *  geometry's bounding box. */
function shapeToLatticeSpace(geom: THREE.BufferGeometry): {
  rest: Float32Array;
  uvw: Float32Array;
} {
  geom.computeBoundingBox();
  const bb = geom.boundingBox!;
  const min = bb.min;
  const size = new THREE.Vector3().subVectors(bb.max, bb.min);
  const posAttr = geom.attributes.position;
  if (!posAttr) throw new Error("geometry has no position attribute");
  const pos = posAttr.array as Float32Array;
  const rest = new Float32Array(pos.length);
  const uvw = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    const px = pos[i] as number;
    const py = pos[i + 1] as number;
    const pz = pos[i + 2] as number;
    rest[i] = px;
    rest[i + 1] = py;
    rest[i + 2] = pz;
    uvw[i] = (px - min.x) / Math.max(1e-6, size.x);
    uvw[i + 1] = (py - min.y) / Math.max(1e-6, size.y);
    uvw[i + 2] = (pz - min.z) / Math.max(1e-6, size.z);
  }
  return { rest, uvw };
}

// --- Scene ---------------------------------------------------------------

type SceneProps = {
  dims: LatticeDims;
  kernel: Kernel;
  shape: Shape;
  amplitude: number;
  animate: boolean;
};

function LatticeScene({ dims, kernel, shape, amplitude, animate }: SceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.LineSegments>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Base geometry + lattice-space coordinates (rebuilt when shape changes).
  const baseData = useMemo(() => {
    const geom = makeShape(shape);
    const { rest, uvw } = shapeToLatticeSpace(geom);
    return { geom, rest, uvw };
  }, [shape]);

  // Rest lattice positions (rebuilt when dims change).
  const restLat = useMemo(() => makeRestLattice(dims), [dims]);

  // Deformed lattice positions — animated, mutated in-place.
  const liveLat = useMemo(() => new Float32Array(restLat.length), [restLat]);

  // Output buffer reused across frames.
  const liveVerts = useMemo(
    () => new Float32Array(baseData.rest.length),
    [baseData.rest.length],
  );

  // Lattice wireframe — edges along each axis between adjacent control
  // points. Recomputed when dims change.
  const wireIndices = useMemo(() => {
    const { u, v, w } = dims;
    const idx = (i: number, j: number, k: number) =>
      (k * v + j) * u + i;
    const segs: number[] = [];
    for (let k = 0; k < w; k++) {
      for (let j = 0; j < v; j++) {
        for (let i = 0; i < u - 1; i++) {
          segs.push(idx(i, j, k), idx(i + 1, j, k));
        }
      }
    }
    for (let k = 0; k < w; k++) {
      for (let i = 0; i < u; i++) {
        for (let j = 0; j < v - 1; j++) {
          segs.push(idx(i, j, k), idx(i, j + 1, k));
        }
      }
    }
    for (let j = 0; j < v; j++) {
      for (let i = 0; i < u; i++) {
        for (let k = 0; k < w - 1; k++) {
          segs.push(idx(i, j, k), idx(i, j, k + 1));
        }
      }
    }
    return new Uint16Array(segs);
  }, [dims]);

  // Set initial geometry on the mesh once per shape change.
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.geometry.dispose();
    const cloned = baseData.geom.clone();
    meshRef.current.geometry = cloned;
    return () => {
      cloned.dispose();
    };
  }, [baseData.geom]);

  // Cleanup the source geometry when the component unmounts or shape
  // swaps. (The clone above is owned by the mesh; this is the source.)
  useEffect(() => {
    return () => {
      baseData.geom.dispose();
    };
  }, [baseData.geom]);

  useFrame(({ clock }) => {
    const t = animate ? clock.getElapsedTime() : 0;

    // Animate the lattice: every control point gets a per-position phase
    // offset, displaced by a small sinusoid scaled by `amplitude`. When
    // amplitude is zero this collapses to the rest lattice.
    for (let i = 0; i < restLat.length; i += 3) {
      const rx = restLat[i] as number;
      const ry = restLat[i + 1] as number;
      const rz = restLat[i + 2] as number;
      const phase = rx * 3.1 + ry * 2.7 + rz * 4.3;
      const k = amplitude;
      liveLat[i] = rx + k * Math.sin(t * 0.9 + phase) * 0.4;
      liveLat[i + 1] = ry + k * Math.sin(t * 1.1 + phase * 1.3) * 0.4;
      liveLat[i + 2] = rz + k * Math.sin(t * 0.7 + phase * 0.7) * 0.4;
    }

    // Deform mesh verts.
    deform(baseData.uvw, liveLat, dims, kernel, liveVerts);

    if (meshRef.current) {
      const attr = meshRef.current.geometry.attributes.position;
      if (attr) {
        (attr.array as Float32Array).set(liveVerts);
        attr.needsUpdate = true;
        meshRef.current.geometry.computeVertexNormals();
      }
    }

    // Update wireframe lattice + control-point cloud.
    if (wireRef.current) {
      const attr = wireRef.current.geometry.attributes.position;
      if (attr) {
        (attr.array as Float32Array).set(liveLat);
        attr.needsUpdate = true;
      }
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.attributes.position;
      if (attr) {
        (attr.array as Float32Array).set(liveLat);
        attr.needsUpdate = true;
      }
    }
  });

  // Geometry buffers for wireframe + points (recreated when dims change).
  const wireGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(restLat.length), 3),
    );
    g.setIndex(new THREE.BufferAttribute(wireIndices, 1));
    return g;
  }, [restLat.length, wireIndices]);

  const pointsGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(restLat.length), 3),
    );
    return g;
  }, [restLat.length]);

  useEffect(() => {
    return () => {
      wireGeom.dispose();
      pointsGeom.dispose();
    };
  }, [wireGeom, pointsGeom]);

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#f0a8c8"
          metalness={0.35}
          roughness={0.28}
          clearcoat={0.6}
          clearcoatRoughness={0.15}
          flatShading={false}
        />
      </mesh>

      <lineSegments ref={wireRef} geometry={wireGeom}>
        <lineBasicMaterial
          color="#00ccff"
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </lineSegments>

      <points ref={pointsRef} geometry={pointsGeom}>
        <pointsMaterial
          color="#00ccff"
          size={0.025}
          sizeAttenuation
          transparent
          opacity={0.85}
        />
      </points>
    </group>
  );
}

function ResizeBump() {
  // Force R3F to re-resize on parent layout changes.
  const { gl, size } = useThree();
  useEffect(() => {
    gl.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    gl.setSize(size.width, size.height, false);
  }, [gl, size.width, size.height]);
  return null;
}

// --- Top-level client ----------------------------------------------------

const INITIAL_DIMS: LatticeDims = { u: 4, v: 4, w: 4 };

export default function ModalLatticeClient() {
  useActiveChamber("modal-lattice");

  const [dims, setDims] = useState<LatticeDims>(INITIAL_DIMS);
  const [kernel, setKernel] = useState<Kernel>("catmull");
  const [shape, setShape] = useState<Shape>("sphere");
  const [amplitude, setAmplitude] = useState(0.6);
  const [animate, setAnimate] = useState(true);

  const setU = useCallback(
    (n: number) => setDims((d) => ({ ...d, u: clampDim(n) })),
    [],
  );
  const setV = useCallback(
    (n: number) => setDims((d) => ({ ...d, v: clampDim(n) })),
    [],
  );
  const setW = useCallback(
    (n: number) => setDims((d) => ({ ...d, w: clampDim(n) })),
    [],
  );

  const onReset = useCallback(() => {
    setDims(INITIAL_DIMS);
    setKernel("catmull");
    setAmplitude(0.6);
    log.info("reset to defaults");
  }, []);

  // Keyboard shortcuts mirroring the Blender modal operator:
  //   Ctrl+L linear, B b-spline, C cardinal, R catmull-rom,
  //   Numpad 1..9 set all dims to N (cap at 8 here),
  //   Numpad 0 reset to 2x2x2.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA")
      )
        return;
      if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
        setKernel("linear");
        e.preventDefault();
        return;
      }
      if (e.key === "b" || e.key === "B") setKernel("bspline");
      else if (e.key === "c" || e.key === "C") setKernel("cardinal");
      else if (e.key === "r" || e.key === "R") setKernel("catmull");
      else if (e.key >= "0" && e.key <= "9") {
        const n = Number(e.key);
        if (n === 0) setDims({ u: 2, v: 2, w: 2 });
        else setDims({ u: clampDim(n), v: clampDim(n), w: clampDim(n) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-3 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4 font-mono text-xs text-chrome-200 md:grid-cols-4">
        <Stat label="control points" value={dims.u * dims.v * dims.w} />
        <Stat label="kernel" value={kernel} />
        <Stat label="shape" value={shape} />
        <Stat
          label="amplitude"
          value={amplitude.toFixed(2)}
        />
      </section>

      <div className="aspect-[16/10] w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [1.6, 1.1, 1.9], fov: 42 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <ResizeBump />
            <color attach="background" args={["#0a0d12"]} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[3, 4, 2]} intensity={0.9} />
            <directionalLight position={[-2, -1, -3]} intensity={0.35} color="#a8c8ff" />
            <LatticeScene
              dims={dims}
              kernel={kernel}
              shape={shape}
              amplitude={amplitude}
              animate={animate}
            />
            <OrbitControls
              enablePan={false}
              minDistance={1.2}
              maxDistance={6}
            />
          </Suspense>
        </Canvas>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Slider
          label={`U · ${dims.u}`}
          min={1}
          max={8}
          step={1}
          value={dims.u}
          onChange={setU}
        />
        <Slider
          label={`V · ${dims.v}`}
          min={1}
          max={8}
          step={1}
          value={dims.v}
          onChange={setV}
        />
        <Slider
          label={`W · ${dims.w}`}
          min={1}
          max={8}
          step={1}
          value={dims.w}
          onChange={setW}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Slider
          label={`amplitude · ${amplitude.toFixed(2)}`}
          min={0}
          max={1}
          step={0.02}
          value={amplitude}
          onChange={setAmplitude}
        />
        <label className="flex items-center gap-3 self-end font-mono text-xs uppercase tracking-[0.2em] text-chrome-300">
          <input
            type="checkbox"
            checked={animate}
            onChange={(e) => setAnimate(e.target.checked)}
            className="accent-pink-200"
          />
          animate lattice
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <span className="chrome-label text-chrome-400">Interpolation kernel</span>
        <div className="flex flex-wrap gap-2">
          {KERNELS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKernel(k.id)}
              title={k.hint}
              className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                kernel === k.id
                  ? "border-pink-200 bg-pink-200/15 text-pink-100"
                  : "border-warm-black-700 bg-warm-black-950 text-chrome-300 hover:border-pink-200/50"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <span className="chrome-label text-chrome-400">Base shape</span>
        <div className="flex flex-wrap gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setShape(s.id)}
              className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                shape === s.id
                  ? "border-pink-200 bg-pink-200/15 text-pink-100"
                  : "border-warm-black-700 bg-warm-black-950 text-chrome-300 hover:border-pink-200/50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onReset}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
        >
          reset to 4 · 4 · 4 · catmull
        </button>
        <p className="text-xs text-chrome-400">
          keys: ctrl+L linear · B b-spline · C cardinal · R catmull · 0
          resets to 2·2·2 · 1–8 sets all axes
        </p>
      </section>
    </div>
  );
}

function clampDim(n: number): number {
  return Math.max(1, Math.min(8, Math.round(n)));
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="chrome-label text-chrome-400">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-pink-200"
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-chrome-500">{label}</div>
      <div className="text-chrome-100">{value}</div>
    </div>
  );
}
