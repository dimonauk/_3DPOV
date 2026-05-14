"use client";

/**
 * components/sphere/sphere-scene-graph-mesh.tsx — The R3F graph mesh.
 *
 * Renders the laid-out graph as additive-blended line segments for edges
 * + sphere markers for nodes, with hover highlighting (adjacent edges
 * brighten, non-adjacent nodes dim) + click-to-route. The whole group
 * slowly rotates around Y so the sphere reads as alive at rest.
 */

import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { graph } from "lib/graph";

import { NODE_COLOURS, type PositionedNode, type Vec3 } from "./sphere-scene-layout";

export function GraphMesh({
  nodes,
  hoveredId,
  setHoveredId,
}: {
  nodes: PositionedNode[];
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  const router = useRouter();
  const groupRef = useRef<THREE.Group>(null);

  const positionsById = useMemo(() => {
    const m = new Map<string, Vec3>();
    for (const n of nodes) m.set(n.id, n.position);
    return m;
  }, [nodes]);

  const neighboursByNode = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const node of nodes) m.set(node.id, new Set());
    for (const edge of graph.edges) {
      m.get(edge.from)?.add(edge.to);
      m.get(edge.to)?.add(edge.from);
    }
    return m;
  }, [nodes]);

  const edgeGeometry = useMemo(() => {
    const positions: number[] = [];
    for (const edge of graph.edges) {
      const a = positionsById.get(edge.from);
      const b = positionsById.get(edge.to);
      if (!a || !b) continue;
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return geometry;
  }, [positionsById]);

  const sphereGeom = useMemo(() => new THREE.SphereGeometry(1, 12, 10), []);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.05 * delta;
    }
  });

  const hoveredNeighbours = hoveredId
    ? neighboursByNode.get(hoveredId)
    : null;
  const edgesDimmed = hoveredId !== null;

  return (
    <group ref={groupRef}>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial
          color="#00f3ff"
          transparent
          opacity={edgesDimmed ? 0.08 : 0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Hovered-node adjacent edges, brighter, drawn on top. */}
      {hoveredId
        ? (() => {
            const positions: number[] = [];
            for (const edge of graph.edges) {
              if (edge.from !== hoveredId && edge.to !== hoveredId) continue;
              const a = positionsById.get(edge.from);
              const b = positionsById.get(edge.to);
              if (!a || !b) continue;
              positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute(
              "position",
              new THREE.Float32BufferAttribute(positions, 3),
            );
            return (
              <lineSegments geometry={g}>
                <lineBasicMaterial
                  color="#ff4dff"
                  transparent
                  opacity={0.75}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </lineSegments>
            );
          })()
        : null}

      {nodes.map((node) => {
        const baseRadius = 0.07;
        // Cap degree scaling so a hub doesn't visually swallow the sphere.
        const radius = baseRadius + Math.min(node.degree, 20) * 0.008;
        const isHovered = node.id === hoveredId;
        const isAdjacent = hoveredNeighbours?.has(node.id) ?? false;
        const dimmed = hoveredId !== null && !isHovered && !isAdjacent;
        const baseColour = NODE_COLOURS[node.kind];
        const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHoveredId(node.id);
          document.body.style.cursor = "pointer";
        };
        const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHoveredId(null);
          document.body.style.cursor = "";
        };
        const onClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          router.push(node.href);
        };
        return (
          <mesh
            key={node.id}
            geometry={sphereGeom}
            position={[node.position.x, node.position.y, node.position.z]}
            scale={radius}
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            onClick={onClick}
          >
            <meshBasicMaterial
              color={baseColour}
              transparent
              opacity={dimmed ? 0.25 : 1}
              toneMapped={false}
            />
            {isHovered ? (
              <Html
                distanceFactor={8}
                position={[0, 1.6, 0]}
                style={{ pointerEvents: "none" }}
              >
                <div
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: "11px",
                    color: "#e5e7eb",
                    background: "rgba(12, 10, 18, 0.92)",
                    border: "1px solid rgba(0, 243, 255, 0.4)",
                    padding: "6px 9px",
                    borderRadius: "2px",
                    whiteSpace: "nowrap",
                    transform: "translate(-50%, -100%)",
                    boxShadow: "0 0 20px rgba(0, 243, 255, 0.15)",
                  }}
                >
                  <div
                    style={{
                      color: "#fbcfe8",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontSize: "9px",
                      marginBottom: "2px",
                    }}
                  >
                    {node.kind}
                  </div>
                  <div style={{ color: "#f3f4f6" }}>{node.label}</div>
                  <div
                    style={{
                      color: "#9ca3af",
                      marginTop: "2px",
                      fontSize: "10px",
                    }}
                  >
                    {node.href}
                  </div>
                </div>
              </Html>
            ) : null}
          </mesh>
        );
      })}
    </group>
  );
}
