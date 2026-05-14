#!/usr/bin/env node
/**
 * Generate a placeholder GLB for a card.
 *
 * Hand-rolls a minimal binary glTF (a coloured PBR octahedron) so we have
 * SOMETHING to mount on the tracked card before the holder supplies their
 * real model. No three.js or jsdom polyfills needed — just pure binary
 * buffer construction.
 *
 * The placeholder is a 6-vertex octahedron with:
 *   - PBR metallic-roughness material in the card's accent colour
 *   - Emissive component so it glows pleasantly through AR
 *
 * Usage:
 *   node scripts/ar-generate-glb.mjs <slug>
 *
 * Reads:  data/cards/<slug>.json (for accent colour)
 * Writes: public/cards/<slug>/model.glb
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
  console.error("Usage: node scripts/ar-generate-glb.mjs <slug>");
  process.exit(1);
}

const cardJson = JSON.parse(
  await fs.readFile(path.join(process.cwd(), "data", "cards", `${slug}.json`), "utf8"),
);

const outDir = path.join(process.cwd(), "public", "cards", slug);
await fs.mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, "model.glb");

// hex "#FF6FB5" -> [r, g, b] floats in 0..1
function hexToRgbF(hex) {
  const m = hex.replace("#", "").match(/.{2}/g);
  return m.map((h) => parseInt(h, 16) / 255);
}
const baseColor = [...hexToRgbF(cardJson.brand.primary), 1.0];
const emissive = hexToRgbF(cardJson.brand.accent).map((c) => c * 0.35);

// ---- Geometry ----
// Octahedron, scaled to ~5cm if 1 unit ≈ 1m (so renders nicely on tracked card).
const SIZE = 0.025;
// 6 vertices, smooth-shaded (positions + auto-derived normals from normalised position)
const positions = new Float32Array([
  0,  SIZE,  0,  // top
  0, -SIZE,  0,  // bottom
  0,  0,    SIZE, // +Z
  SIZE, 0,  0,    // +X
  0,  0,   -SIZE, // -Z
 -SIZE, 0,  0,    // -X
]);
// Normals = positions normalised (octahedron from origin)
const normals = new Float32Array(positions.length);
for (let i = 0; i < positions.length; i += 3) {
  const x = positions[i], y = positions[i + 1], z = positions[i + 2];
  const len = Math.hypot(x, y, z) || 1;
  normals[i] = x / len;
  normals[i + 1] = y / len;
  normals[i + 2] = z / len;
}
// 8 triangles, CCW from outside.
const indices = new Uint16Array([
  // top half: top, side, next side
  0, 2, 3,  0, 3, 4,  0, 4, 5,  0, 5, 2,
  // bottom half: bottom, side, prev side (reversed for outward normal)
  1, 3, 2,  1, 4, 3,  1, 5, 4,  1, 2, 5,
]);

// ---- Buffer layout ----
// Single binary buffer concatenating positions | normals | indices, each
// view 4-byte aligned (already are because Float32/Uint16 sizes work out).
const posBytes = positions.byteLength;          // 72
const norBytes = normals.byteLength;            // 72
const idxBytes = indices.byteLength;            // 48
// Pad each section to 4-byte alignment (already aligned but be explicit)
function pad4(n) { return (n + 3) & ~3; }
const posOffset = 0;
const norOffset = pad4(posOffset + posBytes);
const idxOffset = pad4(norOffset + norBytes);
const totalBin = pad4(idxOffset + idxBytes);

const bin = new Uint8Array(totalBin);
bin.set(new Uint8Array(positions.buffer), posOffset);
bin.set(new Uint8Array(normals.buffer), norOffset);
bin.set(new Uint8Array(indices.buffer), idxOffset);

// ---- glTF JSON ----
function vec3MinMax(arr) {
  const mn = [Infinity, Infinity, Infinity];
  const mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k], arr[i + k]);
      mx[k] = Math.max(mx[k], arr[i + k]);
    }
  }
  return { min: mn, max: mx };
}
const pmm = vec3MinMax(positions);

const gltf = {
  asset: { version: "2.0", generator: "holo-flow ar-card placeholder" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: `${slug}-placeholder`, mesh: 0 }],
  meshes: [{
    name: `${slug}-mesh`,
    primitives: [{
      attributes: { POSITION: 0, NORMAL: 1 },
      indices: 2,
      material: 0,
    }],
  }],
  materials: [{
    name: `${slug}-material`,
    pbrMetallicRoughness: {
      baseColorFactor: baseColor,
      metallicFactor: 0.4,
      roughnessFactor: 0.2,
    },
    emissiveFactor: emissive,
    doubleSided: false,
  }],
  buffers: [{ byteLength: totalBin }],
  bufferViews: [
    { buffer: 0, byteOffset: posOffset, byteLength: posBytes, target: 34962 }, // ARRAY_BUFFER
    { buffer: 0, byteOffset: norOffset, byteLength: norBytes, target: 34962 },
    { buffer: 0, byteOffset: idxOffset, byteLength: idxBytes, target: 34963 }, // ELEMENT_ARRAY_BUFFER
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: 6, type: "VEC3", min: pmm.min, max: pmm.max }, // FLOAT
    { bufferView: 1, componentType: 5126, count: 6, type: "VEC3" },
    { bufferView: 2, componentType: 5123, count: 24, type: "SCALAR" }, // UNSIGNED_SHORT
  ],
};

// ---- Pack as binary GLB ----
const jsonStr = JSON.stringify(gltf);
let jsonBytes = new TextEncoder().encode(jsonStr);
// Pad JSON chunk to 4-byte boundary with spaces (0x20)
const jsonPad = pad4(jsonBytes.length) - jsonBytes.length;
if (jsonPad > 0) {
  const padded = new Uint8Array(jsonBytes.length + jsonPad);
  padded.set(jsonBytes);
  padded.fill(0x20, jsonBytes.length); // ASCII space
  jsonBytes = padded;
}

const headerSize = 12;
const chunkHeaderSize = 8;
const totalLength = headerSize + chunkHeaderSize + jsonBytes.length + chunkHeaderSize + bin.length;
const glb = new ArrayBuffer(totalLength);
const dv = new DataView(glb);

// File header
dv.setUint32(0, 0x46546C67, true); // "glTF" magic (little-endian)
dv.setUint32(4, 2, true);           // version
dv.setUint32(8, totalLength, true); // total file length

// JSON chunk header
let offset = headerSize;
dv.setUint32(offset, jsonBytes.length, true);
dv.setUint32(offset + 4, 0x4E4F534A, true); // "JSON"
offset += chunkHeaderSize;
new Uint8Array(glb).set(jsonBytes, offset);
offset += jsonBytes.length;

// BIN chunk header
dv.setUint32(offset, bin.length, true);
dv.setUint32(offset + 4, 0x004E4942, true); // "BIN\0"
offset += chunkHeaderSize;
new Uint8Array(glb).set(bin, offset);

await fs.writeFile(outPath, new Uint8Array(glb));
console.log(`✅ Wrote ${outPath} (${totalLength} bytes — placeholder pink octahedron)`);
console.log(`   Replace with the holder's real GLB any time; same filename.`);
