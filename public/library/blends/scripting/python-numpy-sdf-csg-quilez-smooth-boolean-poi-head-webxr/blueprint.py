"""
blueprint.py — SDF CSG: Quilez Primitives, Smooth Boolean Ops & Surface Nets
Blender 5.1 · Python 3.11 · CC0

Signed Distance Fields compose like arithmetic expressions.  Each primitive
returns a signed scalar — negative inside, positive outside, zero on the
surface — so Boolean CSG reduces to min/max algebra:
    union(a, b)        = min(a, b)
    intersection(a, b) = max(a, b)
    difference(a, b)   = max(a, −b)

The smooth minimum (smin) by Inigo Quilez replaces the discontinuous min with a
C¹-continuous blend over radius k, letting two forms melt into each other
organically rather than meeting at a sharp seam.  Within distance k of the
boundary the blend is: mix(a, b, h) − k·h·(1−h), h = saturate(½ + ½(b−a)/k).

This blueprint composes a poi head from four primitives with three smooth Boolean
operations, samples the compound SDF on a 72³ lattice, extracts the zero
isosurface via Surface Nets (Gibson 1998), and exports a Draco-6 GLB.

Outside sources
---------------
Inigo Quilez, "Distance Functions". CC0.
    https://iquilezles.org/articles/distfunctions/
Sarah F. Gibson (1998), "Constrained Elastic Surface Nets". MERL TR98-19.
    https://www.merl.com/publications/TR98-19.pdf  (academic free-use)

Run inside Blender ≥ 5.1:
    blender --python blueprint.py
"""

import bpy, bmesh, numpy as np, math

# ── Named constants ───────────────────────────────────────────────────────────
GRID_N    = 72        # voxels per axis; 72³ ≈ 373 k cells
BBOX      = 1.05      # world-space half-extent in metres
ISO       = 0.0       # isosurface level (zero crossing)
SMOOTH_K  = 0.12      # global blend radius for smooth Boolean ops
# Poi head geometry
BODY_R    = 0.44      # sphere body radius
RING_R    = 0.39      # torus major radius (equatorial ring)
RING_T    = 0.055     # torus tube radius
DOME_OFS  = 0.27      # dome-sphere centre offset above y = 0
DOME_R    = 0.42      # dome sphere radius — subtracted for concave polar recess
STEM_R    = 0.046     # stem capsule radius
STEM_LEN  = 0.30      # stem length below body
# Export
OBJECT_N  = "hf_sdf_csg_poi"
OUT_GLB   = "//hf_sdf_csg_poi.glb"

# ── SDF primitives (vectorised over (N, 3) point array) ───────────────────────

def sdf_sphere(pts, r):
    # Exact SDF: distance to origin minus radius.
    return np.linalg.norm(pts, axis=-1) - r

def sdf_box(pts, b):
    # Axis-aligned box at origin; b = (bx, by, bz) half-extents.
    # Components of q > 0 are exterior distances; max(q) < 0 gives interior depth.
    b = np.asarray(b, dtype=np.float32)
    q = np.abs(pts) - b
    return np.linalg.norm(np.maximum(q, 0.0), axis=-1) + np.minimum(np.max(q, axis=-1), 0.0)

def sdf_torus(pts, R, r):
    # Torus with equatorial plane = XZ, tube axis = Y.
    # Ring centre-line is the circle of radius R in the XZ plane.
    xz = np.linalg.norm(np.stack([pts[:, 0], pts[:, 2]], axis=-1), axis=-1) - R
    return np.sqrt(xz ** 2 + pts[:, 1] ** 2) - r

def sdf_capsule(pts, a, b, r):
    # Rounded line segment [a, b] of radius r.
    # Projects each point onto the segment and measures residual distance.
    a, b   = np.asarray(a, dtype=np.float32), np.asarray(b, dtype=np.float32)
    ab     = b - a
    denom  = float(np.dot(ab, ab)) + 1e-12
    t      = np.clip(np.einsum('ij,j->i', pts - a, ab) / denom, 0.0, 1.0)
    return np.linalg.norm(pts - (a + t[:, None] * ab), axis=-1) - r

# ── Smooth Boolean operations ─────────────────────────────────────────────────

def op_union(a, b):   return np.minimum(a, b)
def op_isect(a, b):   return np.maximum(a, b)
def op_diff(a, b):    return np.maximum(a, -b)

def op_smin(a, b, k=SMOOTH_K):
    # Polynomial smooth min (Quilez, CC0).  Gradient is C¹ everywhere.
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return a * h + b * (1.0 - h) - k * h * (1.0 - h)

def op_smax(a, b, k=SMOOTH_K):   return -op_smin(-a, -b, k)
def op_sdiff(a, b, k=SMOOTH_K):  return op_smax(a, -b, k)

# ── Scene: Poi Head via CSG ───────────────────────────────────────────────────

def scene_poi(pts):
    # 1. Smooth-union sphere body + equatorial torus ring.
    body  = sdf_sphere(pts, BODY_R)
    ring  = sdf_torus(pts, RING_R, RING_T)
    shell = op_smin(body, ring, k=SMOOTH_K)

    # 2. Smooth-subtract a dome sphere from the top polar region,
    #    creating the concave recess characteristic of HoloFlow poi heads.
    dome  = sdf_sphere(pts - np.float32([0.0, DOME_OFS, 0.0]), DOME_R)
    shape = op_sdiff(shell, dome, k=SMOOTH_K * 0.55)

    # 3. Smooth-union a capsule stem below the body.
    stem  = sdf_capsule(pts,
                        (0.0, -BODY_R + 0.04, 0.0),
                        (0.0, -BODY_R - STEM_LEN, 0.0),
                        STEM_R)
    return op_smin(shape, stem, k=0.07)

# ── Evaluate on 72³ grid ─────────────────────────────────────────────────────
coords   = np.linspace(-BBOX, BBOX, GRID_N, dtype=np.float32)
X, Y, Z  = np.meshgrid(coords, coords, coords, indexing='ij')
pts_flat = np.stack([X.ravel(), Y.ravel(), Z.ravel()], axis=-1)
F        = scene_poi(pts_flat).reshape(GRID_N, GRID_N, GRID_N)
INSIDE   = F < ISO

# ── Surface Nets (Gibson 1998) — one vertex per surface cell ─────────────────
N    = GRID_N
mark = np.zeros((N, N, N), dtype=bool)
FWDS = ((0, 1, 0, 0), (1, 0, 1, 0), (2, 0, 0, 1))  # (axis, di, dj, dk)
for ax, di, dj, dk in FWDS:
    lo = [slice(None)] * 3; lo[ax] = slice(None, N - 1)
    hi = [slice(None)] * 3; hi[ax] = slice(1,    None)
    diff = INSIDE[tuple(lo)] != INSIDE[tuple(hi)]
    mark[tuple(lo)] |= diff;  mark[tuple(hi)] |= diff

surf_ijk = np.argwhere(mark)
M        = len(surf_ijk)

verts_w  = np.empty((M, 3), dtype=np.float32)
cell_map = {}

for m, (ci, cj, ck) in enumerate(surf_ijk):
    edge_pts = []
    for ax, di, dj, dk in FWDS:
        ni, nj, nk = ci + di, cj + dj, ck + dk
        if ni < N and nj < N and nk < N:
            va, vb = float(F[ci, cj, ck]), float(F[ni, nj, nk])
            if (va < ISO) != (vb < ISO):
                t = (ISO - va) / (vb - va + 1e-12)
                pa = np.array([coords[ci], coords[cj], coords[ck]])
                pb = np.array([coords[ni], coords[nj], coords[nk]])
                edge_pts.append(pa + t * (pb - pa))
    verts_w[m] = (np.mean(edge_pts, axis=0) if edge_pts
                  else np.array([coords[ci], coords[cj], coords[ck]]))
    cell_map[(ci, cj, ck)] = m

# Stitch quads between adjacent surface cells across sign-change edges.
faces = []
for ci, cj, ck in surf_ijk:
    for ax, di, dj, dk in FWDS:
        ni, nj, nk = ci + di, cj + dj, ck + dk
        if ni >= N or nj >= N or nk >= N: continue
        if INSIDE[ci, cj, ck] == INSIDE[ni, nj, nk]: continue
        if ax == 0:
            ring = [(ci,cj,ck),(ci,cj-1,ck),(ci,cj-1,ck-1),(ci,cj,ck-1)]
        elif ax == 1:
            ring = [(ci,cj,ck),(ci-1,cj,ck),(ci-1,cj,ck-1),(ci,cj,ck-1)]
        else:
            ring = [(ci,cj,ck),(ci-1,cj,ck),(ci-1,cj-1,ck),(ci,cj-1,ck)]
        ids = [cell_map.get(r) for r in ring]
        if all(v is not None for v in ids):
            faces.append(ids if INSIDE[ci, cj, ck] else ids[::-1])

# ── Assemble Blender mesh ──────────────────────────────────────────────────────
for obj in list(bpy.data.objects):
    if obj.name.startswith(OBJECT_N): bpy.data.objects.remove(obj, do_unlink=True)

mesh = bpy.data.meshes.new(OBJECT_N)
bm   = bmesh.new()
bm_vs = [bm.verts.new(v.tolist()) for v in verts_w]
bm.verts.ensure_lookup_table()
for f in faces:
    try: bm.faces.new([bm_vs[i] for i in f])
    except ValueError: pass
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(mesh); bm.free()
mesh.update()

obj = bpy.data.objects.new(OBJECT_N, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj; obj.select_set(True)

# Apply transform: +Y up, match HoloFlow export convention.
obj.rotation_euler = (math.radians(-90), 0, 0)
bpy.ops.object.transform_apply(rotation=True)

# ── Material: HoloFlow violet emissive ───────────────────────────────────────
mat  = bpy.data.materials.new("HF_SDF_CSG")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value   = (0.46, 0.10, 0.88, 1.0)
bsdf.inputs["Emission Color"].default_value = (0.46, 0.10, 0.88, 1.0)
bsdf.inputs["Emission Strength"].default_value = 2.0
bsdf.inputs["Metallic"].default_value    = 0.25
bsdf.inputs["Roughness"].default_value   = 0.35
obj.data.materials.append(mat)

# ── Camera & lighting ─────────────────────────────────────────────────────────
cam_data = bpy.data.cameras.new("Cam"); cam_data.lens = 85
cam_obj  = bpy.data.objects.new("Cam", cam_data)
bpy.context.collection.objects.link(cam_obj)
cam_obj.location  = (0, -2.8, 0.15); cam_obj.rotation_euler = (math.radians(90), 0, 0)
bpy.context.scene.camera = cam_obj

sun = bpy.data.lights.new("Sun", "SUN"); sun.energy = 4.0; sun.angle = 0.01
sun_obj = bpy.data.objects.new("Sun", sun)
bpy.context.collection.objects.link(sun_obj); sun_obj.location = (2, -2, 3)

# ── Export GLB ────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath         = bpy.path.abspath(OUT_GLB),
    use_selection    = True,
    export_apply     = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//hf_sdf_csg_poi.blend"))
print(f"[HF] SDF CSG poi head exported → {OUT_GLB} ({M} surface vertices, {len(faces)} quads)")
