"use client";

/**
 * app/atelier/rig-simulator/rig-simulator-client.tsx
 *
 * Physically-accurate POV-LED rig simulator built with Three.js TSL +
 * WebGPURenderer. Renders an SK9822 line of 200 LEDs spinning around
 * the vertical axis on a Teensy-4.1-driven rig, with Hall-effect-synced
 * frame updates and an additive long-exposure accumulator that produces
 * the simulated photograph in real time.
 *
 * Full purpose in rig-simulator-client.PURPOSE.md.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three/webgpu";
import {
  Fn,
  instancedBufferAttribute,
  smoothstep,
  uv,
  vec4,
} from "three/tsl";

// ─── Hardware spec (real-world, 2026) ───────────────────────────────────────

/** SK9822 (= APA102C) — the studio's chosen chipset. */
const HARDWARE = {
  led: {
    chipset: "SK9822 / APA102C",
    package: "5050 SMD",
    voltage: 5,
    /** Lumens per LED at full white, typical drive current 20mA/channel. */
    lumensPerLed: 0.4,
    /** Switching rise/fall time in microseconds. */
    switchTimeUs: 3,
    /** Density on the strip. */
    ledsPerMeter: 144,
    /** Bits per channel. */
    colorBitsPerChannel: 8,
  },
  mcu: {
    name: "Teensy 4.1",
    core: "ARM Cortex-M7",
    clockMHz: 600,
    ramKB: 1024,
    flashMB: 8,
    /** Frame updates per second the firmware can sustain at full LED count. */
    maxFps: 800,
  },
  hallSensor: {
    name: "TLE5012B",
    /** Angular resolution in degrees. */
    resolutionDegrees: 0.011,
    /** I²C / SPI read latency in microseconds. */
    latencyUs: 10,
    /** Practical synchronisation jitter on the rig (microseconds). */
    jitterUs: 50,
  },
  power: {
    pack: "4S LiPo 11.1V, 50C",
    /** 5V buck regulator peak current capacity (amps). */
    peakAmps: 50,
  },
} as const;

const FALLBACK_LED_COUNT = 200;

// ─── Built-in source patterns ───────────────────────────────────────────────

/** Generate a procedural test pattern as a 2D RGB image. */
function makePattern(
  kind: "spectrum" | "wedges" | "studio-logo" | "checker",
  width: number,
  height: number,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const u = x / (width - 1);
      const v = y / (height - 1);
      let r = 0, g = 0, b = 0;
      if (kind === "spectrum") {
        // Full-saturation hue ramp across X, brightness ramp across Y.
        const h = u * 360;
        const c = 1 - Math.abs(v - 0.5) * 1.6;
        const cl = Math.max(0, c);
        const [rr, gg, bb] = hsl(h, 1, 0.5);
        r = rr * cl;
        g = gg * cl;
        b = bb * cl;
      } else if (kind === "wedges") {
        // Eight angular wedges with bright pink edges — a kata-shape pattern.
        const seg = Math.floor(u * 8) % 8;
        const intensity = Math.sin(v * Math.PI);
        const palette: ReadonlyArray<readonly [number, number, number]> = [
          [1, 0.4, 0.9],
          [0.2, 0.2, 0.2],
          [1, 0.8, 0.2],
          [0.2, 0.2, 0.2],
          [0.4, 0.9, 1],
          [0.2, 0.2, 0.2],
          [1, 0.4, 0.4],
          [0.2, 0.2, 0.2],
        ];
        const entry = palette[seg] ?? palette[0]!;
        r = entry[0] * intensity;
        g = entry[1] * intensity;
        b = entry[2] * intensity;
      } else if (kind === "studio-logo") {
        // A studio-pink-and-mint vertical bar that hits at multiple heights.
        const bar = (v > 0.1 && v < 0.4) || (v > 0.6 && v < 0.9) ? 1 : 0;
        const hue = v < 0.5 ? 320 : 170;
        const [rr, gg, bb] = hsl(hue, 1, 0.5);
        r = rr * bar;
        g = gg * bar;
        b = bb * bar;
      } else {
        // checker
        const cell = (Math.floor(u * 16) + Math.floor(v * 16)) % 2;
        r = g = b = cell;
      }
      data[idx] = Math.round(r * 255);
      data[idx + 1] = Math.round(g * 255);
      data[idx + 2] = Math.round(b * 255);
    }
  }
  return data;
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [r + m, g + m, b + m];
}

// ─── React component ────────────────────────────────────────────────────────

type Pattern = "spectrum" | "wedges" | "studio-logo" | "checker";

export default function RigSimulatorClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Simulator | null>(null);
  const [supported, setSupported] = useState<"probing" | "yes" | "no">(
    "probing",
  );
  const [pattern, setPattern] = useState<Pattern>("wedges");
  const [rpm, setRpm] = useState(180);
  const [ledCount, setLedCount] = useState(FALLBACK_LED_COUNT);
  const [exposureSeconds, setExposureSeconds] = useState(8);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  // Mount + WebGPU probe
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("gpu" in navigator)) {
      setSupported("no");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const canvas = canvasRef.current;
        const captureCanvas = captureCanvasRef.current;
        if (!canvas || !captureCanvas) return;
        const sim = await Simulator.create(canvas, captureCanvas);
        if (cancelled) {
          sim.dispose();
          return;
        }
        simRef.current = sim;
        setSupported("yes");
      } catch (err) {
        console.error("[rig-simulator] init failed", err);
        if (!cancelled) setSupported("no");
      }
    })();
    return () => {
      cancelled = true;
      simRef.current?.dispose();
      simRef.current = null;
    };
  }, []);

  // Push pattern/rpm/count changes into the live simulator.
  useEffect(() => {
    if (supported !== "yes") return;
    const data = makePattern(pattern, 360, ledCount);
    simRef.current?.setSource(data, 360, ledCount);
  }, [pattern, ledCount, supported]);

  useEffect(() => {
    if (supported !== "yes") return;
    simRef.current?.setRpm(rpm);
  }, [rpm, supported]);

  const onStart = useCallback(() => {
    if (supported !== "yes") return;
    const sim = simRef.current;
    if (!sim) return;
    sim.clearAccumulator();
    setEventCount(0);
    setProgress(0);
    setRunning(true);
    sim.start(exposureSeconds, (p, events) => {
      setProgress(p);
      setEventCount(events);
      if (p >= 1) {
        setRunning(false);
      }
    });
  }, [supported, exposureSeconds]);

  const onStop = useCallback(() => {
    simRef.current?.stop();
    setRunning(false);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <HardwarePanel ledCount={ledCount} rpm={rpm} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="chrome-label text-chrome-300">live rig</div>
          <div className="aspect-square w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
            <canvas
              ref={canvasRef}
              className="block h-full w-full"
              aria-label="Live 3D view of the rotating LED rig"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="chrome-label text-chrome-300">
            simulated long exposure
          </div>
          <div className="aspect-square w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
            <canvas
              ref={captureCanvasRef}
              className="block h-full w-full"
              aria-label="Accumulating long-exposure photograph"
            />
          </div>
        </div>
      </div>

      {supported === "probing" && (
        <div className="font-mono text-xs text-chrome-400">
          probing WebGPU support…
        </div>
      )}
      {supported === "no" && (
        <div className="rounded-sm border border-rose-300/40 bg-warm-black-950/50 p-5 text-sm text-rose-200">
          <div className="chrome-label">WebGPU not available</div>
          <p className="mt-2">
            This simulator uses Three.js TSL + WebGPU for physically-accurate
            emissive accumulation. Your browser doesn&rsquo;t expose
            <code className="ml-1 font-mono">navigator.gpu</code>. Try
            Chrome 113+ / Edge / Safari 18+ on a recent device.
          </p>
        </div>
      )}

      <Controls
        pattern={pattern}
        onPattern={setPattern}
        rpm={rpm}
        onRpm={setRpm}
        ledCount={ledCount}
        onLedCount={setLedCount}
        exposureSeconds={exposureSeconds}
        onExposureSeconds={setExposureSeconds}
        running={running}
        onStart={onStart}
        onStop={onStop}
        progress={progress}
        eventCount={eventCount}
        disabled={supported !== "yes"}
      />
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function HardwarePanel({
  ledCount,
  rpm,
}: {
  ledCount: number;
  rpm: number;
}) {
  const revsPerSecond = rpm / 60;
  const eventsPerSec = ledCount * Math.max(60, Math.floor(revsPerSecond * 60));
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
      <div className="chrome-label text-chrome-300">simulated hardware</div>
      <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs text-chrome-200 md:grid-cols-4">
        <div>
          <div className="text-chrome-500">LEDs</div>
          <div className="text-chrome-100">{HARDWARE.led.chipset}</div>
          <div className="text-chrome-400">
            {ledCount} @ {HARDWARE.led.ledsPerMeter}/m · {HARDWARE.led.lumensPerLed} lm each
          </div>
        </div>
        <div>
          <div className="text-chrome-500">MCU</div>
          <div className="text-chrome-100">{HARDWARE.mcu.name}</div>
          <div className="text-chrome-400">
            {HARDWARE.mcu.core} @ {HARDWARE.mcu.clockMHz} MHz
          </div>
        </div>
        <div>
          <div className="text-chrome-500">Hall sync</div>
          <div className="text-chrome-100">{HARDWARE.hallSensor.name}</div>
          <div className="text-chrome-400">
            {HARDWARE.hallSensor.resolutionDegrees}° · ±{HARDWARE.hallSensor.jitterUs} μs jitter
          </div>
        </div>
        <div>
          <div className="text-chrome-500">Throughput</div>
          <div className="text-chrome-100">{rpm} RPM</div>
          <div className="text-chrome-400">
            ~{eventsPerSec.toLocaleString()} events/s
          </div>
        </div>
      </div>
    </div>
  );
}

function Controls({
  pattern,
  onPattern,
  rpm,
  onRpm,
  ledCount,
  onLedCount,
  exposureSeconds,
  onExposureSeconds,
  running,
  onStart,
  onStop,
  progress,
  eventCount,
  disabled,
}: {
  pattern: Pattern;
  onPattern: (p: Pattern) => void;
  rpm: number;
  onRpm: (n: number) => void;
  ledCount: number;
  onLedCount: (n: number) => void;
  exposureSeconds: number;
  onExposureSeconds: (n: number) => void;
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  progress: number;
  eventCount: number;
  disabled: boolean;
}) {
  const patterns: { id: Pattern; label: string }[] = [
    { id: "wedges", label: "Wedges" },
    { id: "spectrum", label: "Spectrum ramp" },
    { id: "studio-logo", label: "Studio bars" },
    { id: "checker", label: "Checker" },
  ];
  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="chrome-label text-chrome-300">source pattern</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {patterns.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={disabled || running}
                onClick={() => onPattern(p.id)}
                className={`rounded-sm border px-3 py-1 font-mono text-xs ${
                  pattern === p.id
                    ? "border-pink-200 text-pink-100"
                    : "border-warm-black-700 text-chrome-300 hover:border-pink-200/40"
                } disabled:opacity-40`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="chrome-label text-chrome-300">
            rotation: <span className="text-pink-200">{rpm} RPM</span> ·{" "}
            <span className="text-pink-200">{(rpm / 60).toFixed(1)} rev/s</span>
          </div>
          <input
            type="range"
            min={30}
            max={600}
            step={10}
            value={rpm}
            disabled={disabled || running}
            onChange={(e) => onRpm(Number(e.target.value))}
            aria-label="Rotation speed in RPM"
            className="mt-2 w-full accent-pink-300"
          />
        </div>
        <div>
          <div className="chrome-label text-chrome-300">
            LED count: <span className="text-pink-200">{ledCount}</span>
          </div>
          <input
            type="range"
            min={32}
            max={400}
            step={8}
            value={ledCount}
            disabled={disabled || running}
            onChange={(e) => onLedCount(Number(e.target.value))}
            aria-label="LED count along the rig"
            className="mt-2 w-full accent-pink-300"
          />
        </div>
        <div>
          <div className="chrome-label text-chrome-300">
            exposure: <span className="text-pink-200">{exposureSeconds} s</span>
          </div>
          <input
            type="range"
            min={2}
            max={30}
            step={1}
            value={exposureSeconds}
            disabled={disabled || running}
            onChange={(e) => onExposureSeconds(Number(e.target.value))}
            aria-label="Exposure time in seconds"
            className="mt-2 w-full accent-pink-300"
          />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        {!running ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onStart}
            className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 chrome-label text-pink-100 hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            open shutter
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            className="rounded-sm border border-warm-black-700 px-5 py-2 chrome-label text-chrome-300 hover:border-pink-200/60"
          >
            stop
          </button>
        )}
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-warm-black-900">
            <div
              className="h-full bg-pink-200"
              style={{ width: `${(progress * 100).toFixed(0)}%` }}
            />
          </div>
          <div className="mt-1 font-mono text-xs text-chrome-400">
            {(progress * 100).toFixed(0)}% · {eventCount.toLocaleString()} 4D events recorded
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Three.js / TSL simulator core ──────────────────────────────────────────

class Simulator {
  private renderer: THREE.WebGPURenderer;
  private accumScene: THREE.Scene;
  private liveScene: THREE.Scene;
  private accumCamera: THREE.OrthographicCamera;
  private liveCamera: THREE.PerspectiveCamera;
  private accumTarget: THREE.RenderTarget;
  private accumDisplayCanvas: HTMLCanvasElement;
  private accumDisplayCtx: CanvasRenderingContext2D | null;
  private ledMesh: THREE.InstancedMesh | null = null;
  private liveLedMesh: THREE.InstancedMesh | null = null;
  private ledPositions: Float32Array | null = null;
  private ledColors: Float32Array | null = null;
  private ledColorsAttr: THREE.InstancedBufferAttribute | null = null;
  private livePositionsAttr: THREE.InstancedBufferAttribute | null = null;
  private liveColorsAttr: THREE.InstancedBufferAttribute | null = null;
  private sourceData: Uint8ClampedArray | null = null;
  private sourceWidth = 0;
  private sourceHeight = 0;
  private rpm = 180;
  private ledCount = FALLBACK_LED_COUNT;
  private rigRadius = 1.0; // metres
  private angle = 0; // current rotation angle in radians
  private startedAt = 0;
  private exposureSeconds = 0;
  private rafId: number | null = null;
  private onProgress: ((p: number, events: number) => void) | null = null;
  private eventsRecorded = 0;
  private accumulated = false;

  private constructor(
    renderer: THREE.WebGPURenderer,
    canvas: HTMLCanvasElement,
    accumDisplay: HTMLCanvasElement,
  ) {
    this.renderer = renderer;
    this.accumDisplayCanvas = accumDisplay;
    this.accumDisplayCtx = accumDisplay.getContext("2d");

    // Live 3D scene — the rotating rig.
    this.liveScene = new THREE.Scene();
    this.liveScene.background = new THREE.Color(0x05050a);
    this.liveCamera = new THREE.PerspectiveCamera(
      35,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      30,
    );
    this.liveCamera.position.set(2.5, 1.2, 3.2);
    this.liveCamera.lookAt(0, 0, 0);

    // Accumulator scene — fed by the same per-frame LED data, additive blending,
    // rendered to a render target that never clears between frames. The target
    // is read back to the 2D display canvas after each accumulation step.
    this.accumScene = new THREE.Scene();
    this.accumCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.accumCamera.position.set(0, 0, 5);
    this.accumCamera.lookAt(0, 0, 0);
    this.accumTarget = new THREE.RenderTarget(512, 512, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.NoColorSpace,
    });

    this.resize(canvas);
  }

  static async create(
    liveCanvas: HTMLCanvasElement,
    accumCanvas: HTMLCanvasElement,
  ): Promise<Simulator> {
    const renderer = new THREE.WebGPURenderer({
      antialias: true,
      canvas: liveCanvas,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(liveCanvas.clientWidth, liveCanvas.clientHeight, false);
    renderer.setClearColor(new THREE.Color(0x05050a), 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    await renderer.init();
    return new Simulator(renderer, liveCanvas, accumCanvas);
  }

  setRpm(rpm: number): void {
    this.rpm = rpm;
  }

  setSource(data: Uint8ClampedArray, width: number, height: number): void {
    this.sourceData = data;
    this.sourceWidth = width;
    this.sourceHeight = height;
    this.rebuildLedRig(height);
  }

  private rebuildLedRig(ledCount: number): void {
    this.ledCount = ledCount;
    // Positions are computed per-frame (LEDs sit on the rotating spar).
    // The instance attributes hold (instanceIndex, ledY, …); the rest comes
    // from the rotation transform applied in setLedColors().
    this.ledPositions = new Float32Array(ledCount * 3);
    this.ledColors = new Float32Array(ledCount * 3);
    for (let i = 0; i < ledCount; i++) {
      const yNorm = (i / (ledCount - 1)) * 2 - 1;
      // Rig spar length = 1.6m; LED row spans -0.8m .. +0.8m on the y axis.
      this.ledPositions[i * 3] = this.rigRadius;
      this.ledPositions[i * 3 + 1] = yNorm * 0.8;
      this.ledPositions[i * 3 + 2] = 0;
    }
    this.ledColorsAttr = new THREE.InstancedBufferAttribute(this.ledColors, 3);
    this.livePositionsAttr = new THREE.InstancedBufferAttribute(this.ledPositions, 3);
    this.liveColorsAttr = new THREE.InstancedBufferAttribute(this.ledColors, 3);

    // Dispose old meshes if any.
    if (this.liveLedMesh) {
      this.liveScene.remove(this.liveLedMesh);
      (this.liveLedMesh.material as THREE.Material).dispose();
      this.liveLedMesh.geometry.dispose();
    }
    if (this.ledMesh) {
      this.accumScene.remove(this.ledMesh);
      (this.ledMesh.material as THREE.Material).dispose();
      this.ledMesh.geometry.dispose();
    }

    // Live mesh — bright emissive points that ride the rotating rig.
    this.liveLedMesh = this.makeLedMesh(
      this.livePositionsAttr,
      this.liveColorsAttr,
      0.018,
      false,
    );
    this.liveScene.add(this.liveLedMesh);

    // Accumulator mesh — additive blending, projected as if the camera saw
    // the rig at this instant. Same geometry; different blending.
    this.ledMesh = this.makeLedMesh(
      new THREE.InstancedBufferAttribute(this.ledPositions, 3),
      new THREE.InstancedBufferAttribute(this.ledColors, 3),
      0.012,
      true,
    );
    this.accumScene.add(this.ledMesh);
  }

  private makeLedMesh(
    posAttr: THREE.InstancedBufferAttribute,
    colorAttr: THREE.InstancedBufferAttribute,
    sizeMetres: number,
    additive: boolean,
  ): THREE.InstancedMesh {
    const geometry = new THREE.PlaneGeometry(sizeMetres, sizeMetres);
    // TSL-driven emissive material — colour from instance attribute,
    // positionLocal offset by the per-instance rig position (computed each frame
    // via the rotation matrix applied to the parent mesh, see render()).
    const material = new THREE.SpriteNodeMaterial();
    material.transparent = true;
    material.depthWrite = false;
    if (additive) material.blending = THREE.AdditiveBlending;
    material.positionNode = instancedBufferAttribute(posAttr);
    material.colorNode = Fn(() => {
      const c = instancedBufferAttribute(colorAttr);
      // Soft-circular sprite via uv-distance falloff.
      const d = uv().sub(0.5).length();
      const a = smoothstep(0.5, 0.35, d);
      return vec4(c.mul(2.4), a);
    })();
    const mesh = new THREE.InstancedMesh(geometry, material, this.ledCount);
    mesh.count = this.ledCount;
    mesh.frustumCulled = false;
    return mesh;
  }

  setLedColorsForAngle(angle: number): void {
    if (!this.sourceData || !this.ledColorsAttr || !this.liveColorsAttr || !this.ledColors) return;
    const sliceFloat =
      ((angle / (Math.PI * 2)) % 1) * this.sourceWidth;
    const col = Math.floor(((sliceFloat % this.sourceWidth) + this.sourceWidth) % this.sourceWidth);
    const w = this.sourceWidth;
    const h = this.sourceHeight;
    // Read column col across all rows; map row j -> LED j (linear).
    for (let i = 0; i < this.ledCount; i++) {
      const j = Math.min(h - 1, Math.max(0, Math.floor((i / (this.ledCount - 1)) * (h - 1))));
      const idx = (j * w + col) * 3;
      this.ledColors[i * 3] = this.sourceData[idx]! / 255;
      this.ledColors[i * 3 + 1] = this.sourceData[idx + 1]! / 255;
      this.ledColors[i * 3 + 2] = this.sourceData[idx + 2]! / 255;
    }
    this.ledColorsAttr.needsUpdate = true;
    this.liveColorsAttr.needsUpdate = true;
  }

  clearAccumulator(): void {
    this.renderer.setRenderTarget(this.accumTarget);
    this.renderer.setClearColor(new THREE.Color(0x000000), 1);
    this.renderer.clear();
    this.renderer.setRenderTarget(null);
    this.eventsRecorded = 0;
    this.accumulated = false;
    if (this.accumDisplayCtx) {
      this.accumDisplayCtx.clearRect(
        0,
        0,
        this.accumDisplayCanvas.width,
        this.accumDisplayCanvas.height,
      );
    }
  }

  start(
    exposureSeconds: number,
    onProgress: (p: number, events: number) => void,
  ): void {
    this.exposureSeconds = exposureSeconds;
    this.onProgress = onProgress;
    this.startedAt = performance.now();
    this.eventsRecorded = 0;
    this.tick();
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.onProgress = null;
  }

  private tick = (): void => {
    const elapsed = (performance.now() - this.startedAt) / 1000;
    const progress = Math.min(1, elapsed / this.exposureSeconds);

    // Advance angle by RPM × dt.
    const revsPerSecond = this.rpm / 60;
    const dtRender = 1 / 60;
    this.angle += revsPerSecond * Math.PI * 2 * dtRender;
    this.setLedColorsForAngle(this.angle);

    // Rotate both meshes' parent transforms.
    if (this.liveLedMesh) this.liveLedMesh.rotation.y = this.angle;
    if (this.ledMesh) this.ledMesh.rotation.y = this.angle;
    this.eventsRecorded += this.ledCount;

    // Render the live scene to the on-screen canvas.
    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(new THREE.Color(0x05050a), 1);
    this.renderer.autoClear = true;
    this.renderer.render(this.liveScene, this.liveCamera);

    // Accumulate this frame into the accumulator render target (no clear).
    this.renderer.setRenderTarget(this.accumTarget);
    this.renderer.autoClear = false;
    if (!this.accumulated) {
      this.renderer.setClearColor(new THREE.Color(0x000000), 1);
      this.renderer.clear();
      this.accumulated = true;
    }
    this.renderer.render(this.accumScene, this.accumCamera);
    this.renderer.setRenderTarget(null);

    // Read back to the 2D display canvas every ~6 frames to keep cost down.
    if (Math.floor(elapsed * 10) % 1 === 0) {
      void this.copyAccumulatorToDisplay();
    }

    this.onProgress?.(progress, this.eventsRecorded);

    if (progress < 1 && this.onProgress !== null) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.rafId = null;
      void this.copyAccumulatorToDisplay();
    }
  };

  private async copyAccumulatorToDisplay(): Promise<void> {
    if (!this.accumDisplayCtx) return;
    const w = this.accumTarget.width;
    const h = this.accumTarget.height;
    try {
      // r169 API: readRenderTargetPixelsAsync(target, x, y, width, height, attachmentIndex?)
      // Returns ArrayBufferView with the pixel data.
      const result = (await (
        this.renderer as unknown as {
          readRenderTargetPixelsAsync: (
            target: THREE.RenderTarget,
            x: number,
            y: number,
            width: number,
            height: number,
          ) => Promise<ArrayBufferView>;
        }
      ).readRenderTargetPixelsAsync(this.accumTarget, 0, 0, w, h)) as Float32Array;
      const buffer = result;
      // Tonemap (Reinhard) the HDR buffer to LDR for display.
      const img = this.accumDisplayCtx.createImageData(w, h);
      for (let i = 0, j = 0; i < buffer.length; i += 4, j += 4) {
        const r = buffer[i]!;
        const g = buffer[i + 1]!;
        const b = buffer[i + 2]!;
        // Reinhard
        const rT = r / (1 + r);
        const gT = g / (1 + g);
        const bT = b / (1 + b);
        // Y-flip (render target is bottom-up; canvas is top-down)
        const dst = ((h - 1 - Math.floor(j / 4 / w)) * w + (Math.floor(j / 4) % w)) * 4;
        img.data[dst] = Math.min(255, rT * 255);
        img.data[dst + 1] = Math.min(255, gT * 255);
        img.data[dst + 2] = Math.min(255, bT * 255);
        img.data[dst + 3] = 255;
      }
      // Use a temp canvas to draw the imagedata then scale to display canvas
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      off.getContext("2d")!.putImageData(img, 0, 0);
      this.accumDisplayCtx.imageSmoothingEnabled = false;
      this.accumDisplayCtx.drawImage(
        off,
        0,
        0,
        this.accumDisplayCanvas.width,
        this.accumDisplayCanvas.height,
      );
    } catch (err) {
      // Read-back may not be supported on some WebGPU adapters in current
      // browsers; the live view still works, the photograph just won't update.
      console.warn("[rig-simulator] accumulator read-back failed", err);
    }
  }

  private resize(canvas: HTMLCanvasElement): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.liveCamera.aspect = w / h;
    this.liveCamera.updateProjectionMatrix();
    this.accumDisplayCanvas.width = 512;
    this.accumDisplayCanvas.height = 512;
  }

  dispose(): void {
    this.stop();
    if (this.liveLedMesh) {
      this.liveScene.remove(this.liveLedMesh);
      (this.liveLedMesh.material as THREE.Material).dispose();
      this.liveLedMesh.geometry.dispose();
    }
    if (this.ledMesh) {
      this.accumScene.remove(this.ledMesh);
      (this.ledMesh.material as THREE.Material).dispose();
      this.ledMesh.geometry.dispose();
    }
    this.accumTarget.dispose();
    this.renderer.dispose();
  }
}

