/**
 * lib/printfiles/ingest.test.ts — validateAttachment unit tests.
 *
 * The ingest pipeline must correctly:
 *   - infer kind from magic bytes + extension
 *   - parse binary STL header for triangle count + bounding box
 *   - parse ASCII STL by counting `facet normal` occurrences
 *   - parse GLB header + JSON chunk for accessor min/max
 *   - reject oversize attachments
 *   - reject implausible bounding boxes
 *   - flag zero-triangle meshes
 *   - tolerate parse failures (don't throw — produce an issue)
 *
 * We synthesise minimal binary STL / GLB blobs in-memory rather than
 * shipping fixture files. The STL spec is simple enough; GLB header
 * is also tractable.
 */

import { Buffer } from "node:buffer";

import { describe, expect, it } from "vitest";

import { inferKind, validateAttachment } from "./ingest";

/**
 * Build a minimal binary STL with `count` triangles, each at the
 * origin (so bounding box is 0×0×0). Triangle layout (50 bytes each):
 *   12 bytes normal
 *   12 bytes vertex 1
 *   12 bytes vertex 2
 *   12 bytes vertex 3
 *    2 bytes attribute byte count
 */
function makeBinaryStl(
  count: number,
  vertexFn: (i: number, v: number) => [number, number, number] = () => [0, 0, 0],
): Buffer {
  const headerSize = 80;
  const countSize = 4;
  const triSize = 50;
  const buf = Buffer.alloc(headerSize + countSize + count * triSize);
  // 80-byte header — any bytes
  buf.write("synthetic-stl-for-tests", 0);
  buf.writeUInt32LE(count, headerSize);
  for (let i = 0; i < count; i++) {
    const base = headerSize + countSize + i * triSize;
    // Skip normal (12 bytes); leave at 0.
    for (let v = 0; v < 3; v++) {
      const [x, y, z] = vertexFn(i, v);
      buf.writeFloatLE(x, base + 12 + v * 12);
      buf.writeFloatLE(y, base + 12 + v * 12 + 4);
      buf.writeFloatLE(z, base + 12 + v * 12 + 8);
    }
    // attribute byte count: 2 bytes at base + 48
  }
  return buf;
}

/**
 * Build a minimal GLB with a JSON chunk advertising one accessor's
 * count + min + max. We skip the binary buffer chunk (irrelevant for
 * the probe).
 */
function makeGlb(accessor: {
  count?: number;
  min?: number[];
  max?: number[];
}): Buffer {
  const json = JSON.stringify({
    asset: { version: "2.0" },
    accessors: [accessor],
  });
  // Pad JSON to 4-byte alignment with spaces.
  const padded = json + " ".repeat((4 - (json.length % 4)) % 4);
  const jsonBytes = Buffer.from(padded, "utf8");

  // GLB layout:
  //   12 bytes header: magic('glTF'), version(2), length(uint32)
  //   8 bytes chunk header: length, type
  //   N bytes chunk data
  const headerLen = 12;
  const chunkHeaderLen = 8;
  const total = headerLen + chunkHeaderLen + jsonBytes.length;
  const buf = Buffer.alloc(total);
  buf.write("glTF", 0, 4, "ascii");
  buf.writeUInt32LE(2, 4); // version
  buf.writeUInt32LE(total, 8);
  buf.writeUInt32LE(jsonBytes.length, headerLen);
  buf.write("JSON", headerLen + 4, 4, "ascii");
  jsonBytes.copy(buf, headerLen + chunkHeaderLen);
  return buf;
}

describe("inferKind", () => {
  it("identifies GLB by magic bytes", () => {
    const glb = makeGlb({ count: 0 });
    expect(inferKind("anonymous", glb)).toBe("glb");
  });

  it("identifies 3MF by ZIP magic", () => {
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    expect(inferKind("model.3mf", zip)).toBe("3mf");
  });

  it("identifies STL by extension", () => {
    const stl = makeBinaryStl(0);
    expect(inferKind("model.STL", stl)).toBe("stl");
    expect(inferKind("model.stl", stl)).toBe("stl");
  });

  it("identifies OBJ by extension", () => {
    expect(inferKind("model.obj", Buffer.from("v 0 0 0\n"))).toBe("obj");
  });

  it("identifies ASCII STL by 'solid' prefix when extension is unknown", () => {
    const ascii = Buffer.from(
      "solid testmesh\nfacet normal 0 0 1\n endloop\nendfacet\nendsolid",
    );
    expect(inferKind("anonymous", ascii)).toBe("stl");
  });

  it("returns 'unknown' for clear non-3D bytes", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(inferKind("image.png", png)).toBe("unknown");
  });
});

describe("validateAttachment", () => {
  describe("STL binary", () => {
    it("counts triangles", () => {
      const stl = makeBinaryStl(42);
      const { kind, validation } = validateAttachment("model.stl", "model/stl", stl);
      expect(kind).toBe("stl");
      expect(validation.triangleCount).toBe(42);
    });

    it("reads bounding box", () => {
      // 4-triangle mesh spanning a 10×20×30 box.
      const stl = makeBinaryStl(4, (i, v) => {
        if (i === 0 && v === 0) return [0, 0, 0];
        return [10, 20, 30];
      });
      const { validation } = validateAttachment("model.stl", "model/stl", stl);
      expect(validation.boundingBoxMm).toEqual({ x: 10, y: 20, z: 30 });
    });

    it("flags zero-triangle meshes", () => {
      const stl = makeBinaryStl(0);
      const { validation } = validateAttachment("empty.stl", "model/stl", stl);
      expect(validation.ok).toBe(false);
      expect(validation.issues).toContain("zero-triangles");
    });

    it("flags implausible bounding boxes (>10m)", () => {
      // Triangle SPANNING 0..20000 on X so the bounding-box side is 20000.
      const stl = makeBinaryStl(1, (_i, v) => {
        if (v === 0) return [0, 0, 0];
        if (v === 1) return [20_000, 0, 0];
        return [0, 0, 0];
      });
      const { validation } = validateAttachment("huge.stl", "model/stl", stl);
      expect(validation.boundingBoxMm?.x).toBeGreaterThan(10_000);
      expect(validation.issues).toContain("implausible-bounding-box");
    });
  });

  describe("GLB", () => {
    it("counts triangles from accessor count", () => {
      const glb = makeGlb({ count: 300, min: [0, 0, 0], max: [10, 20, 30] });
      const { kind, validation } = validateAttachment(
        "model.glb",
        "model/gltf-binary",
        glb,
      );
      expect(kind).toBe("glb");
      // accessor.count is vertex count; divided by 3 for triangles.
      expect(validation.triangleCount).toBe(100);
    });

    it("reads bounding box from accessor min/max", () => {
      const glb = makeGlb({ count: 30, min: [1, 2, 3], max: [11, 22, 33] });
      const { validation } = validateAttachment("model.glb", "model/gltf-binary", glb);
      expect(validation.boundingBoxMm).toEqual({ x: 10, y: 20, z: 30 });
    });
  });

  describe("rejections", () => {
    it("flags unrecognised formats by mime-mismatch", () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const { validation } = validateAttachment("image.png", "image/png", png);
      expect(validation.ok).toBe(false);
      expect(validation.issues).toContain("mime-mismatch");
    });

    it("flags too-large attachments", () => {
      // 30 MB STL — over default 20 MB cap.
      const big = Buffer.alloc(30 * 1024 * 1024);
      // Write a valid header so it doesn't also fail parse.
      big.writeUInt32LE(0, 80);
      const { validation } = validateAttachment("big.stl", "model/stl", big);
      expect(validation.issues).toContain("too-large");
    });
  });
});
