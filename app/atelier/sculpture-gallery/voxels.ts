// Voxel scalar-field utilities for the sculpture-gallery workshop.
//
// Ported from D:/The_Hangar/apps/sculpture-gallery/src/voxels.ts. A
// `Field` is a flat Float32Array of length res*res*res with values
// typically in [-1, 1]; the marching-cubes pass walks it at a given
// iso threshold to produce a triangle soup.

export type Field = {
  data: Float32Array;
  res: number;
};

export function syntheticSphere(res = 48): Field {
  // SDF: sphere minus three cones, evocative of a poi-trail sculpture.
  const data = new Float32Array(res * res * res);
  const r = res / 2;
  for (let z = 0; z < res; z++) {
    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const dx = x - r + 0.5;
        const dy = y - r + 0.5;
        const dz = z - r + 0.5;
        const sphere = Math.sqrt(dx * dx + dy * dy + dz * dz) - r * 0.7;
        const swirl = Math.sin(Math.atan2(dy, dx) * 4 + dz * 0.3) * 2;
        data[z * res * res + y * res + x] = -(sphere + swirl);
      }
    }
  }
  return { data, res };
}

export async function loadJsonField(file: File): Promise<Field> {
  const text = await file.text();
  const parsed = JSON.parse(text) as { res: number; data: number[] };
  return { res: parsed.res, data: new Float32Array(parsed.data) };
}

/** Dispatch by file extension. Accepts .npy and .json. */
export async function loadFieldFromFile(file: File): Promise<Field> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".npy")) {
    const { parseNpy } = await import("./npy");
    return parseNpy(file);
  }
  if (name.endsWith(".json")) return loadJsonField(file);
  throw new Error(`unsupported voxel file extension: ${name}`);
}
