"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, Environment, OrbitControls, useGLTF } from "@react-three/drei";

function useGlbExists(glb: string | undefined) {
  const [exists, setExists] = useState<boolean | null>(null);
  useEffect(() => {
    if (!glb) {
      setExists(false);
      return;
    }
    let cancelled = false;
    fetch(glb, { method: "HEAD" })
      .then((r) => {
        if (!cancelled) setExists(r.ok);
      })
      .catch(() => {
        if (!cancelled) setExists(false);
      });
    return () => {
      cancelled = true;
    };
  }, [glb]);
  return exists;
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
        <meshStandardMaterial color={tint} roughness={0.35} metalness={0.15} />
      </mesh>
    </Center>
  );
}

export function GlbViewer({
  glb,
  tint,
  className = "",
}: {
  glb?: string;
  tint: string;
  className?: string;
}) {
  const exists = useGlbExists(glb);
  const showStub = exists !== true;

  return (
    <div className={`relative aspect-[3/4] w-full border border-ink/15 bg-ink/5 ${className}`.trim()}>
      <Canvas camera={{ position: [2.2, 1.6, 2.8], fov: 40 }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 2]} intensity={0.9} />
        <Suspense fallback={null}>
          {exists === true && glb ? <LoadedModel glb={glb} /> : <StubModel tint={tint} />}
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
      {showStub && (
        <div className="absolute bottom-2 left-2 protocol-label text-ink/60 bg-bone/80 px-2 py-1">
          {exists === null ? "Resolving model…" : "Model pending — placeholder shown"}
        </div>
      )}
    </div>
  );
}
