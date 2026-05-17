"use client";

/**
 * app/atelier/shader-station/shader-station-client.tsx
 *
 * Minimum-viable shader chamber. Three columns:
 *   1. Preset + snippet picker (left)
 *   2. GLSL textarea editor (centre)
 *   3. R3F sphere preview (right) + share-via-QR + mic toggle
 *
 * Compiles on change with a small debounce; surface errors below the
 * editor; live audio bands feed the u_audio_low/mid/high/volume
 * uniforms when the mic is on. Built against the new capabilities
 * lifted from Shadrerapp (Apache-2.0).
 */

import { Canvas } from "@react-three/fiber";
import { Center, Environment, OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import {
  DEFAULT_PRESET,
  listPresets,
  PRESETS,
  SNIPPETS,
  type PresetId,
} from "lib/algorithms/shaders";
import {
  startSpectrum,
  type SpectrumBands,
  type SpectrumHandle,
} from "lib/capabilities/audio/spectrum";
import {
  clearPayloadFromUrl,
  encodeForTransfer,
  readPayloadFromCurrentUrl,
} from "lib/capabilities/media/qr-transfer";
import {
  assembleFragment,
  compileFragment,
} from "lib/capabilities/viz/shader-editor";
import { downloadShaderPng } from "lib/capabilities/viz/shader-export";

const SILENT: SpectrumBands = { low: 0, mid: 0, high: 0, volume: 0 };

function ShaderSphere({
  code,
  bandsRef,
}: {
  code: string;
  bandsRef: React.MutableRefObject<SpectrumBands>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_seed: { value: 42 },
      u_complexity: { value: 4 },
      u_palette: {
        value: [
          new THREE.Color("#00ffff"),
          new THREE.Color("#ff00ff"),
          new THREE.Color("#ffff00"),
          new THREE.Color("#00ff00"),
          new THREE.Color("#4444ff"),
        ],
      },
      u_texture: { value: new THREE.Texture() },
      u_use_texture: { value: false },
      u_tex_tiling: { value: new THREE.Vector2(1, 1) },
      u_tex_offset: { value: new THREE.Vector2(0, 0) },
      u_tex_scale: { value: new THREE.Vector2(1, 1) },
      u_tex_alpha: { value: 1.0 },
      u_audio_low: { value: 0 },
      u_audio_mid: { value: 0 },
      u_audio_high: { value: 0 },
      u_audio_volume: { value: 0 },
    }),
    [],
  );

  const fragment = useMemo(() => assembleFragment(code), [code]);

  const vertex = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        onBeforeRender={() => {
          uniforms.u_time.value = performance.now() / 1000;
          uniforms.u_audio_low.value = bandsRef.current.low;
          uniforms.u_audio_mid.value = bandsRef.current.mid;
          uniforms.u_audio_high.value = bandsRef.current.high;
          uniforms.u_audio_volume.value = bandsRef.current.volume;
        }}
      />
    </mesh>
  );
}

export default function ShaderStationClient() {
  const [activePreset, setActivePreset] = useState<PresetId>(DEFAULT_PRESET);
  const [code, setCode] = useState<string>(PRESETS[DEFAULT_PRESET]);
  const [audioOn, setAudioOn] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bandsRef = useRef<SpectrumBands>(SILENT);
  const spectrumRef = useRef<SpectrumHandle | null>(null);

  // Pull a shared shader payload from the URL on mount.
  useEffect(() => {
    const shared = readPayloadFromCurrentUrl();
    if (shared) {
      setCode(shared);
      clearPayloadFromUrl();
    }
  }, []);

  // Debounced try-compile to populate the error surface below the
  // textarea. The chamber's preview material catches the same error
  // silently; this puts a human-readable message in front of the
  // author when their edit doesn't parse.
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = compileFragment(assembleFragment(code));
      setError(result.ok ? null : result.error);
    }, 400);
    return () => clearTimeout(timer);
  }, [code]);

  const handlePreset = useCallback((id: PresetId) => {
    setActivePreset(id);
    setCode(PRESETS[id]);
    setError(null);
  }, []);

  const handleExport = useCallback(() => {
    const filename = `holoflow_${activePreset.toLowerCase()}_${Date.now()}`;
    downloadShaderPng({ code, size: { kind: "equirect" } }, filename);
  }, [activePreset, code]);

  const handleInsertSnippet = useCallback((snippet: string) => {
    setCode((c) => `${snippet}\n\n${c}`);
  }, []);

  const handleToggleAudio = useCallback(async () => {
    if (audioOn) {
      spectrumRef.current?.stop();
      spectrumRef.current = null;
      bandsRef.current = SILENT;
      setAudioOn(false);
      return;
    }
    try {
      spectrumRef.current = await startSpectrum({
        onBands: (b) => {
          bandsRef.current = b;
        },
      });
      setAudioOn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [audioOn]);

  const handleShare = useCallback(() => {
    setShareUrl(encodeForTransfer(code));
  }, [code]);

  useEffect(() => {
    return () => {
      spectrumRef.current?.stop();
    };
  }, []);

  const presets = useMemo(() => listPresets(), []);

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[200px_1fr_320px]">
      <aside className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3">
        <div className="chrome-label mb-2 text-chrome-300">Presets</div>
        <div className="flex max-h-[420px] flex-col gap-1 overflow-y-auto">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p.id)}
              className={`rounded-sm px-2 py-1 text-left font-mono text-xs transition-colors ${
                activePreset === p.id
                  ? "border border-pink-200 text-pink-100"
                  : "border border-transparent text-chrome-300 hover:border-pink-200/40"
              }`}
            >
              {p.id}
              <span className="ml-2 text-chrome-500">{p.description}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-col gap-3">
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          spellCheck={false}
          className="h-[420px] w-full resize-none rounded-sm border border-warm-black-800 bg-warm-black-950 p-3 font-mono text-xs text-chrome-100 outline-none focus:border-pink-200/60"
        />
        {error && (
          <pre className="rounded-sm border border-coral-500/60 bg-warm-black-950 p-3 text-[10px] text-coral-300">
            {error}
          </pre>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-chrome-300">
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`rounded-sm border px-3 py-1 ${
              audioOn ? "border-pink-200 text-pink-100" : "border-warm-black-700 hover:border-pink-200/40"
            }`}
          >
            {audioOn ? "audio · on" : "audio · off"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="rounded-sm border border-warm-black-700 px-3 py-1 hover:border-pink-200/40"
          >
            share via qr
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-sm border border-warm-black-700 px-3 py-1 hover:border-pink-200/40"
          >
            export 2048×1024 png
          </button>
        </div>
        {shareUrl && (
          <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3 font-mono text-[10px] break-all text-chrome-400">
            {shareUrl}
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-3">
        <div className="aspect-square w-full overflow-hidden rounded-sm border border-warm-black-800 bg-warm-black-950">
          <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
            <ambientLight intensity={0.4} />
            <Center>
              <ShaderSphere code={code} bandsRef={bandsRef} />
            </Center>
            <Environment preset="studio" />
            <OrbitControls enablePan={false} enableZoom={true} minDistance={1.5} maxDistance={5} />
          </Canvas>
        </div>
        <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-3">
          <div className="chrome-label mb-2 text-chrome-300">Snippets</div>
          <div className="flex flex-col gap-1">
            {SNIPPETS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleInsertSnippet(s.code)}
                className="rounded-sm border border-transparent px-2 py-1 text-left font-mono text-xs text-chrome-300 hover:border-pink-200/40 hover:text-pink-100"
              >
                <div>{s.name}</div>
                <div className="text-[10px] text-chrome-500">{s.category}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
