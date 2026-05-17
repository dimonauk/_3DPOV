"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, Environment, OrbitControls, useGLTF } from "@react-three/drei";

function useUrlExists(url: string | undefined) {
  const [exists, setExists] = useState<boolean | null>(null);
  useEffect(() => {
    if (!url) {
      setExists(false);
      return;
    }
    let cancelled = false;
    fetch(url, { method: "HEAD" })
      .then((r) => {
        if (!cancelled) setExists(r.ok);
      })
      .catch(() => {
        if (!cancelled) setExists(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return exists;
}

// iOS Safari and iPadOS (which masquerades as Mac on iPad). The
// `(navigator as any).standalone` test catches iPad in desktop-mode
// Safari, which reports a Mac UA but has touch input.
function useIsIOS(): boolean {
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent;
    const isAppleTouchDevice = /iPad|iPhone|iPod/.test(ua);
    const isIPadDesktopMode =
      navigator.maxTouchPoints > 1 && /Macintosh/.test(ua);
    setIsIOS(isAppleTouchDevice || isIPadDesktopMode);
  }, []);
  return isIOS;
}

function LoadedModel({ glb }: { glb: string }) {
  const { scene } = useGLTF(glb);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

function StubModel({ tint }: { tint: string }) {
  return (
    <Center>
      <mesh rotation={[0.6, 0.4, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color={tint} roughness={0.35} metalness={0.2} />
      </mesh>
    </Center>
  );
}

/**
 * Apple AR Quick Look launcher. The browser intercepts a tap on
 * `<a rel="ar" href="*.usdz">` and opens the model in AR on iOS Safari
 * and iPadOS. The child element is required (Apple's contract) — without
 * it the anchor falls back to a regular download. We always include the
 * tiny invisible img so the anchor's behavior matches the documented
 * pattern.
 */
function ARQuickLookButton({ usdz }: { usdz: string }) {
  return (
    <a
      rel="ar"
      href={usdz}
      className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-warm-black-950/85 px-3 py-1.5 text-xs text-pink-100 backdrop-blur-sm transition-colors hover:border-pink-100 hover:text-pink-50"
    >
      {/* AR symbol — small enough not to dominate but present so the
          anchor satisfies Apple's "must have a child element" rule. */}
      <span aria-hidden className="text-base leading-none">⌖</span>
      View in AR
      <img
        alt=""
        aria-hidden
        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        className="hidden"
      />
    </a>
  );
}

/**
 * 3D preview for products with a GLB model available. `glb` is
 * typically a Shopify product metafield (custom.model_3d) containing a
 * URL. Degrades gracefully: if the URL HEAD-fetches a 404, we render a
 * tinted primitive with a "Model pending" caption so product pages
 * never show a broken viewer.
 *
 * When a `usdz` URL is provided AND the visitor is on iOS, an Apple AR
 * Quick Look button overlays the canvas. iOS doesn't ship WebXR but
 * AR Quick Look works without any extra runtime — tap the anchor, Apple
 * launches the model in the camera. We HEAD-check the USDZ too so the
 * button never appears for a file that 404s.
 */
export function GLBViewer({
  glb,
  usdz,
  tint = "#ff9fbf",
  className = "",
}: {
  glb?: string;
  usdz?: string;
  tint?: string;
  className?: string;
}) {
  const exists = useUrlExists(glb);
  const usdzExists = useUrlExists(usdz);
  const isIOS = useIsIOS();
  const showStub = exists !== true;
  const showAR = isIOS && usdz && usdzExists === true;

  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-lg border border-warm-black-800 bg-warm-black-900 ${className}`.trim()}
    >
      <Canvas camera={{ position: [2.2, 1.6, 2.8], fov: 40 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 4, 2]} intensity={0.9} />
        <Suspense fallback={null}>
          {exists === true && glb ? (
            <LoadedModel glb={glb} />
          ) : (
            <StubModel tint={tint} />
          )}
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} makeDefault />
      </Canvas>
      {showStub && (
        <div className="chrome-label absolute bottom-2 left-2 rounded bg-warm-black-950/80 px-2 py-1">
          {exists === null ? "Resolving model…" : "Model pending"}
        </div>
      )}
      {showAR && <ARQuickLookButton usdz={usdz} />}
    </div>
  );
}
