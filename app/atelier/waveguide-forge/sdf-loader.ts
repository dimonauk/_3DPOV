/**
 * app/atelier/waveguide-forge/sdf-loader.ts
 *
 * Load a .sdf.bin produced by tools/mesh-to-sdf/build_sdf.py and upload it
 * as a THREE.Data3DTexture so the raymarcher can sample texture3D instead
 * of computing a gyroid SDF parametrically.
 *
 * Format (matches the Python writer byte-for-byte):
 *   [4]  magic 'SDF1'
 *   [4]  uint32 resolution_x
 *   [4]  uint32 resolution_y
 *   [4]  uint32 resolution_z
 *   [12] float32 bounds_min[3]   (mm)
 *   [12] float32 bounds_max[3]   (mm)
 *   [..] float32 sdf in C order, signed mm (inside < 0)
 */

import * as THREE from "three";

export type LoadedSdf = {
  texture: THREE.Data3DTexture;
  resolution: [number, number, number];
  boundsMin: [number, number, number];
  boundsMax: [number, number, number];
  extentMm: [number, number, number];
};

export async function loadSdfBin(
  input: File | ArrayBuffer,
): Promise<LoadedSdf> {
  const buf = input instanceof ArrayBuffer ? input : await input.arrayBuffer();
  const view = new DataView(buf);
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );
  if (magic !== "SDF1") {
    throw new Error(`not an SDF1 file (magic = ${magic})`);
  }

  const rx = view.getUint32(4, true);
  const ry = view.getUint32(8, true);
  const rz = view.getUint32(12, true);
  const bmin: [number, number, number] = [
    view.getFloat32(16, true),
    view.getFloat32(20, true),
    view.getFloat32(24, true),
  ];
  const bmax: [number, number, number] = [
    view.getFloat32(28, true),
    view.getFloat32(32, true),
    view.getFloat32(36, true),
  ];
  const data = new Float32Array(buf, 40, rx * ry * rz);

  const texture = new THREE.Data3DTexture(data, rx, ry, rz);
  texture.format = THREE.RedFormat;
  texture.type = THREE.FloatType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = texture.wrapR = THREE.ClampToEdgeWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  return {
    texture,
    resolution: [rx, ry, rz],
    boundsMin: bmin,
    boundsMax: bmax,
    extentMm: [bmax[0] - bmin[0], bmax[1] - bmin[1], bmax[2] - bmin[2]],
  };
}
