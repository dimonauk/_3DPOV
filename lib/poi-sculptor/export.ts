/**
 * lib/poi-sculptor/export.ts
 *
 * STL (ASCII) and GLB (binary) export from a Three.js Group of meshes.
 * Each Mesh must have indexed BufferGeometry with `position` attribute.
 * Three.js is dynamic-imported so the module is safe to reference from
 * server-rendered code paths.
 */

import type { BufferGeometry, Group } from "three";

import type { TrailMaterial } from "./materials";

export async function exportSTL(
  trailGroup: Group | null,
  moveLabel: string,
  matDef: TrailMaterial,
): Promise<void> {
  if (!trailGroup) return;
  let stl = "solid poi_sculpture\n";
  trailGroup.children.forEach((child) => {
    const mesh = child as { geometry?: { attributes: { position?: { getX(i: number): number; getY(i: number): number; getZ(i: number): number } }; index?: { count: number; getX(i: number): number } } };
    const pos = mesh.geometry?.attributes.position;
    const idx = mesh.geometry?.index;
    if (!pos || !idx) return;
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
      const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a);
      const bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b);
      const cx = pos.getX(c), cy = pos.getY(c), cz = pos.getZ(c);
      const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
      const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
      let nx = e1y * e2z - e1z * e2y;
      let ny = e1z * e2x - e1x * e2z;
      let nz = e1x * e2y - e1y * e2x;
      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      stl += `facet normal ${nx} ${ny} ${nz}\n outer loop\n  vertex ${ax} ${ay} ${az}\n  vertex ${bx} ${by} ${bz}\n  vertex ${cx} ${cy} ${cz}\n endloop\nendfacet\n`;
    }
  });
  stl += "endsolid poi_sculpture";
  const blob = new Blob([stl], { type: "application/octet-stream" });
  triggerDownload(blob, `poi_${moveLabel}_${matDef.id}.stl`);
}

export async function exportGLB(
  trailGroup: Group | null,
  moveLabel: string,
  matDef: TrailMaterial,
): Promise<void> {
  if (!trailGroup) return;
  const THREE = await import("three");
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");

  const exportGroup = new THREE.Group();
  trailGroup.children.forEach((child) => {
    const mesh = child as { geometry?: BufferGeometry };
    if (!mesh.geometry) return;
    const mat = new THREE.MeshStandardMaterial({
      color: matDef.base,
      emissive: new THREE.Color(matDef.emissive),
      roughness: matDef.rough,
      metalness: matDef.metal,
    });
    exportGroup.add(new THREE.Mesh(mesh.geometry.clone(), mat));
  });

  const exporter = new GLTFExporter();
  await new Promise<void>((resolve, reject) => {
    exporter.parse(
      exportGroup,
      (gltf: ArrayBuffer | object) => {
        const buf = gltf as ArrayBuffer;
        const blob = new Blob([buf], { type: "application/octet-stream" });
        triggerDownload(blob, `poi_${moveLabel}_${matDef.id}.glb`);
        resolve();
      },
      (err: ErrorEvent) => reject(err),
      { binary: true },
    );
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
