// lib/webgpu-marching-cubes/shaders.ts
//
// WGSL source strings for the isosurface chamber. Two pipelines:
//   1. A compute pass that runs marching cubes on a procedural SDF
//      grid. Each invocation handles one voxel cell. Cells that
//      cross the isosurface append their generated triangles to a
//      shared vertex buffer through atomicAdd on a counter.
//   2. A render pass that draws the resulting triangles with simple
//      Lambert shading.
//
// The MC tri-table is uploaded as a storage buffer (see tri-table.ts).

// -- SDF + Marching Cubes compute shader -------------------------------------

export const MC_COMPUTE_WGSL = /* wgsl */ `
struct Params {
  // grid size on each axis (cells)
  resolution: u32,
  // shape blend weights: sphere / torus / gyroid
  wSphere: f32,
  wTorus: f32,
  wGyroid: f32,
  // isosurface threshold (-1..1 nominal)
  threshold: f32,
  // maximum vertex capacity of the output buffer
  maxVerts: u32,
  // padding to keep the uniform 16-aligned
  _pad0: u32,
  _pad1: u32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> triTable: array<i32>;
@group(0) @binding(2) var<storage, read_write> vertCount: atomic<u32>;
@group(0) @binding(3) var<storage, read_write> verts: array<f32>;

// --- Three primitive SDFs ---------------------------------------------------

fn sdSphere(p: vec3<f32>) -> f32 {
  // unit sphere of radius 0.7 — negative inside, positive outside
  return length(p) - 0.7;
}

fn sdTorus(p: vec3<f32>) -> f32 {
  let R = 0.6;
  let r = 0.22;
  let q = vec2<f32>(length(p.xz) - R, p.y);
  return length(q) - r;
}

fn sdGyroid(p: vec3<f32>) -> f32 {
  // Classic triply-periodic gyroid, scaled into the [-1, 1] cube.
  let s = 4.5;
  let v = p * s;
  return (sin(v.x) * cos(v.y) + sin(v.y) * cos(v.z) + sin(v.z) * cos(v.x)) * 0.3;
}

// Blend the three SDFs by the visitor's weights. Pure linear blend on the
// field, not on geometry — gives a clean morph between shapes.
fn sdField(p: vec3<f32>) -> f32 {
  let w = params.wSphere + params.wTorus + params.wGyroid + 1e-6;
  let a = sdSphere(p) * params.wSphere;
  let b = sdTorus(p) * params.wTorus;
  let c = sdGyroid(p) * params.wGyroid;
  return (a + b + c) / w;
}

// Sample SDF at a grid corner; the grid spans [-1, 1] on every axis.
fn sampleAt(ix: u32, iy: u32, iz: u32) -> f32 {
  let n = f32(params.resolution);
  let p = vec3<f32>(
    (f32(ix) / n) * 2.0 - 1.0,
    (f32(iy) / n) * 2.0 - 1.0,
    (f32(iz) / n) * 2.0 - 1.0,
  );
  return sdField(p);
}

// Linear edge interpolation between two corners by the threshold.
fn vertInterp(p1: vec3<f32>, p2: vec3<f32>, v1: f32, v2: f32) -> vec3<f32> {
  let iso = params.threshold;
  let denom = v2 - v1;
  // Guard against tiny denominators to keep the surface smooth.
  if (abs(denom) < 1e-6) {
    return (p1 + p2) * 0.5;
  }
  let t = clamp((iso - v1) / denom, 0.0, 1.0);
  return p1 + (p2 - p1) * t;
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let res = params.resolution;
  if (gid.x >= res || gid.y >= res || gid.z >= res) {
    return;
  }

  // Sample the eight corners of this voxel cell.
  let v0 = sampleAt(gid.x,     gid.y,     gid.z);
  let v1 = sampleAt(gid.x + 1u, gid.y,     gid.z);
  let v2 = sampleAt(gid.x + 1u, gid.y + 1u, gid.z);
  let v3 = sampleAt(gid.x,     gid.y + 1u, gid.z);
  let v4 = sampleAt(gid.x,     gid.y,     gid.z + 1u);
  let v5 = sampleAt(gid.x + 1u, gid.y,     gid.z + 1u);
  let v6 = sampleAt(gid.x + 1u, gid.y + 1u, gid.z + 1u);
  let v7 = sampleAt(gid.x,     gid.y + 1u, gid.z + 1u);

  let iso = params.threshold;
  var caseIndex: u32 = 0u;
  if (v0 < iso) { caseIndex = caseIndex | 1u;   }
  if (v1 < iso) { caseIndex = caseIndex | 2u;   }
  if (v2 < iso) { caseIndex = caseIndex | 4u;   }
  if (v3 < iso) { caseIndex = caseIndex | 8u;   }
  if (v4 < iso) { caseIndex = caseIndex | 16u;  }
  if (v5 < iso) { caseIndex = caseIndex | 32u;  }
  if (v6 < iso) { caseIndex = caseIndex | 64u;  }
  if (v7 < iso) { caseIndex = caseIndex | 128u; }

  if (caseIndex == 0u || caseIndex == 255u) {
    return;
  }

  let n = f32(res);
  let base = vec3<f32>(
    (f32(gid.x) / n) * 2.0 - 1.0,
    (f32(gid.y) / n) * 2.0 - 1.0,
    (f32(gid.z) / n) * 2.0 - 1.0,
  );
  let step = 2.0 / n;
  let p0 = base;
  let p1 = base + vec3<f32>(step, 0.0, 0.0);
  let p2 = base + vec3<f32>(step, step, 0.0);
  let p3 = base + vec3<f32>(0.0, step, 0.0);
  let p4 = base + vec3<f32>(0.0, 0.0, step);
  let p5 = base + vec3<f32>(step, 0.0, step);
  let p6 = base + vec3<f32>(step, step, step);
  let p7 = base + vec3<f32>(0.0, step, step);

  // Compute the twelve possible edge midpoints. Each edge is named by
  // the two corner indices it connects, matching the standard
  // Bourke / Lorensen MC topology.
  var edge: array<vec3<f32>, 12>;
  edge[0]  = vertInterp(p0, p1, v0, v1);
  edge[1]  = vertInterp(p1, p2, v1, v2);
  edge[2]  = vertInterp(p2, p3, v2, v3);
  edge[3]  = vertInterp(p3, p0, v3, v0);
  edge[4]  = vertInterp(p4, p5, v4, v5);
  edge[5]  = vertInterp(p5, p6, v5, v6);
  edge[6]  = vertInterp(p6, p7, v6, v7);
  edge[7]  = vertInterp(p7, p4, v7, v4);
  edge[8]  = vertInterp(p0, p4, v0, v4);
  edge[9]  = vertInterp(p1, p5, v1, v5);
  edge[10] = vertInterp(p2, p6, v2, v6);
  edge[11] = vertInterp(p3, p7, v3, v7);

  // Walk the tri-table row for this case and emit triangles. Each
  // table row holds up to 5 triangles as edge triples, terminated by -1.
  let rowBase = caseIndex * 16u;
  var i: u32 = 0u;
  loop {
    if (i >= 15u) { break; }
    let e0 = triTable[rowBase + i];
    if (e0 < 0) { break; }
    let e1 = triTable[rowBase + i + 1u];
    let e2 = triTable[rowBase + i + 2u];
    if (e1 < 0 || e2 < 0) { break; }

    let a = edge[u32(e0)];
    let b = edge[u32(e1)];
    let c = edge[u32(e2)];

    // Per-triangle flat normal (cross product of two edges). Cheap and
    // gives the chunky faceted look that suits low grid resolutions.
    let nrm = normalize(cross(b - a, c - a));

    // Reserve three vertices' worth of slots in the output buffer.
    let baseIdx = atomicAdd(&vertCount, 3u);
    if (baseIdx + 3u > params.maxVerts) {
      // Out of vertex-buffer space — drop this triangle silently. The
      // CPU side caps the resolution slider to keep this rare.
      break;
    }

    // 6 floats per vertex: position.xyz, normal.xyz
    let s0 = (baseIdx + 0u) * 6u;
    let s1 = (baseIdx + 1u) * 6u;
    let s2 = (baseIdx + 2u) * 6u;
    verts[s0 + 0u] = a.x; verts[s0 + 1u] = a.y; verts[s0 + 2u] = a.z;
    verts[s0 + 3u] = nrm.x; verts[s0 + 4u] = nrm.y; verts[s0 + 5u] = nrm.z;
    verts[s1 + 0u] = b.x; verts[s1 + 1u] = b.y; verts[s1 + 2u] = b.z;
    verts[s1 + 3u] = nrm.x; verts[s1 + 4u] = nrm.y; verts[s1 + 5u] = nrm.z;
    verts[s2 + 0u] = c.x; verts[s2 + 1u] = c.y; verts[s2 + 2u] = c.z;
    verts[s2 + 3u] = nrm.x; verts[s2 + 4u] = nrm.y; verts[s2 + 5u] = nrm.z;

    i = i + 3u;
  }
}
`;

// -- Render pipeline (vertex + fragment) -------------------------------------

export const RENDER_WGSL = /* wgsl */ `
struct CameraUniforms {
  viewProj: mat4x4<f32>,
  cameraPos: vec3<f32>,
  _pad0: f32,
  lightDir: vec3<f32>,
  _pad1: f32,
};

@group(0) @binding(0) var<uniform> camera: CameraUniforms;

struct VSIn {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
};

struct VSOut {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
};

@vertex
fn vs_main(input: VSIn) -> VSOut {
  var out: VSOut;
  out.clipPos = camera.viewProj * vec4<f32>(input.position, 1.0);
  out.worldPos = input.position;
  out.normal = input.normal;
  return out;
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
  let n = normalize(input.normal);
  let l = normalize(camera.lightDir);

  // Magenta / cyan rim split — matches the studio's holographic look.
  let nl = max(dot(n, l), 0.0);
  let warm = vec3<f32>(0.95, 0.55, 0.85);
  let cool = vec3<f32>(0.45, 0.85, 0.95);
  let base = mix(cool, warm, nl);

  // Fresnel-ish rim for the contour edge against the dark background.
  let viewDir = normalize(camera.cameraPos - input.worldPos);
  let rim = pow(1.0 - max(dot(n, viewDir), 0.0), 2.0);
  let rimCol = vec3<f32>(1.0, 0.85, 0.95) * rim * 0.7;

  let ambient = vec3<f32>(0.12, 0.10, 0.18);
  let lit = base * (0.35 + 0.65 * nl) + ambient + rimCol;

  return vec4<f32>(lit, 1.0);
}
`;
