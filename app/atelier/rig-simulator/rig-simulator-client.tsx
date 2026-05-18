"use client";

/**
 * app/atelier/rig-simulator/rig-simulator-client.tsx
 *
 * React surface for the POV rig simulator. Owns the canvas refs, the
 * UI state (rpm, ledCount, exposureSeconds, pattern), and the
 * simulator instance lifecycle. The simulator core, hardware constants,
 * and pattern generators live in sibling modules:
 *
 *   - ./simulator.ts  — Three.js TSL + WebGPU rendering core
 *   - ./patterns.ts   — procedural source-image generators
 *   - ./hardware.ts   — real-component spec constants
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { createLogger, errToObject } from "lib/log";

import { FALLBACK_LED_COUNT, HARDWARE, type Pattern } from "./hardware";
import { makePattern } from "./patterns";
import type { Simulator } from "./simulator";

const log = createLogger("atelier:rig-simulator");

export default function RigSimulatorClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Simulator | null>(null);
  const [supported, setSupported] = useState<"probing" | "yes" | "no">("probing");
  const [pattern, setPattern] = useState<Pattern>("wedges");
  const [rpm, setRpm] = useState(180);
  const [ledCount, setLedCount] = useState(FALLBACK_LED_COUNT);
  const [exposureSeconds, setExposureSeconds] = useState(8);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eventCount, setEventCount] = useState(0);

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
        // Dynamic import: `./simulator` pulls in `three/webgpu`, which
        // touches browser globals at module load. Keep it off the server
        // bundle so PPR prerender of this page doesn't crash with
        // "ReferenceError: self is not defined".
        const { Simulator } = await import("./simulator");
        const sim = await Simulator.create(canvas, captureCanvas);
        if (cancelled) {
          sim.dispose();
          return;
        }
        simRef.current = sim;
        setSupported("yes");
      } catch (err) {
        log.error("init failed", { err: errToObject(err) });
        if (!cancelled) setSupported("no");
      }
    })();
    return () => {
      cancelled = true;
      simRef.current?.dispose();
      simRef.current = null;
    };
  }, []);

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
      if (p >= 1) setRunning(false);
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
          <div className="chrome-label text-chrome-300">simulated long exposure</div>
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
      {supported === "no" && <UnsupportedPanel />}

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

function HardwarePanel({ ledCount, rpm }: { ledCount: number; rpm: number }) {
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

function UnsupportedPanel() {
  return (
    <div className="rounded-sm border border-rose-300/40 bg-warm-black-950/50 p-5 text-sm text-rose-200">
      <div className="chrome-label">WebGPU not available</div>
      <p className="mt-2">
        This simulator uses Three.js TSL + WebGPU for physically-accurate
        emissive accumulation. Your browser doesn&rsquo;t expose
        <code className="ml-1 font-mono">navigator.gpu</code>. Try
        Chrome 113+ / Edge / Safari 18+ on a recent device.
      </p>
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
