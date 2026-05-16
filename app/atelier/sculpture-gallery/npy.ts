// NumPy .npy file parser.
//
// Spec: https://numpy.org/doc/stable/reference/generated/numpy.lib.format.html
// Ported from D:/The_Hangar/apps/sculpture-gallery/src/npy.ts.
//
// Supports 3D arrays only; all dtypes coerced to Float32 for the renderer.

import type { Field } from "./voxels";

export async function parseNpy(input: File | ArrayBuffer): Promise<Field> {
  const buf = input instanceof ArrayBuffer ? input : await input.arrayBuffer();
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  const magic = String.fromCharCode(...bytes.slice(1, 6));
  if (bytes[0] !== 0x93 || magic !== "NUMPY") {
    throw new Error("not a valid .npy file (missing magic)");
  }

  const major = bytes[6] ?? 0;
  let headerLen: number;
  let dataOffset: number;
  if (major === 1) {
    headerLen = view.getUint16(8, true);
    dataOffset = 10 + headerLen;
  } else if (major === 2 || major === 3) {
    headerLen = view.getUint32(8, true);
    dataOffset = 12 + headerLen;
  } else {
    throw new Error(`unsupported .npy major version ${major}`);
  }

  const headerStart = major === 1 ? 10 : 12;
  const header = String.fromCharCode(
    ...bytes.slice(headerStart, headerStart + headerLen),
  );

  const descrMatch = header.match(/'descr':\s*'([^']+)'/);
  const fortranMatch = header.match(/'fortran_order':\s*(True|False)/);
  const shapeMatch = header.match(/'shape':\s*\(([^)]*)\)/);
  if (!descrMatch || !fortranMatch || !shapeMatch) {
    throw new Error("could not parse .npy header: " + header);
  }
  const descr = descrMatch[1]!;
  const fortranOrder = fortranMatch[1] === "True";
  const shape = shapeMatch[1]!
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10));

  if (shape.length !== 3) {
    throw new Error(
      `.npy must be 3D (got ${shape.length}D shape ${JSON.stringify(shape)})`,
    );
  }
  const [dx, dy, dz] = shape as [number, number, number];
  const n = dx * dy * dz;

  const data = decodeDtype(descr, buf, dataOffset, n);

  if (fortranOrder) {
    const re = new Float32Array(n);
    for (let z = 0; z < dz; z++)
      for (let y = 0; y < dy; y++)
        for (let x = 0; x < dx; x++)
          re[z * dx * dy + y * dx + x] = data[x * dy * dz + y * dz + z] ?? 0;
    return { res: cubicRes(shape), data: re };
  }
  return { res: cubicRes(shape), data };
}

function cubicRes(shape: number[]): number {
  if (shape[0] === shape[1] && shape[1] === shape[2]) return shape[0]!;
  // Non-cubic — render at max dim; empty regions are zero.
  return Math.max(...shape);
}

function decodeDtype(
  descr: string,
  buf: ArrayBuffer,
  offset: number,
  n: number,
): Float32Array {
  const out = new Float32Array(n);
  switch (descr) {
    case "<f4":
    case "=f4": {
      const src = new Float32Array(buf, offset, n);
      out.set(src);
      return out;
    }
    case "<f8":
    case "=f8": {
      const src = new Float64Array(buf, offset, n);
      for (let i = 0; i < n; i++) out[i] = src[i]!;
      return out;
    }
    case "|u1":
    case "<u1":
    case "u1": {
      const src = new Uint8Array(buf, offset, n);
      for (let i = 0; i < n; i++) out[i] = (src[i] ?? 0) / 255;
      return out;
    }
    case "|b1":
    case "b1": {
      const src = new Uint8Array(buf, offset, n);
      for (let i = 0; i < n; i++) out[i] = src[i] ? 1 : -1;
      return out;
    }
    case "<u2": {
      const src = new Uint16Array(buf, offset, n);
      for (let i = 0; i < n; i++) out[i] = (src[i] ?? 0) / 65535;
      return out;
    }
    case "<i4": {
      const src = new Int32Array(buf, offset, n);
      for (let i = 0; i < n; i++) out[i] = src[i]!;
      return out;
    }
    default:
      throw new Error(`unsupported .npy dtype: ${descr}`);
  }
}
