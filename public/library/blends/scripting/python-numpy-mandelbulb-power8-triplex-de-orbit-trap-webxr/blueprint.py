"""
Mandelbulb Power-8 — Triplex Distance Estimation & Orbit-Trap Vertex Colours
=============================================================================
Blender 5.1  |  CC0  |  Holoflow Studio

Technique
---------
The Mandelbulb extends the 2-D Mandelbrot iteration z → z² + c into ℝ³ by
replacing complex exponentiation with *triplex* (spherical-coordinate) power:

    z = (r, θ, φ)   →   z^n = (r^n, nθ, nφ),   then z ← z^n + c

No genuine 3-D analogue of ℂ exists; triplex arithmetic is an ad-hoc but
visually rich approximation due to White & Rudy (2007–2009). Power n = 8
produces the iconic branched-antenna silhouette with deep secondary bulbs.

Distance estimation (DE)
------------------------
Track the derivative magnitude |dz/dc| alongside the orbit |z|.
When |z| > bailout R:

    DE(c) = |z| · log|z| / (2 · |dz/dc|)

is a lower bound on the Euclidean distance from c to the Mandelbulb set.
Marching cubes on the DE grid at ISO_DE gives a tight exterior shell mesh.

Orbit traps
-----------
During each iteration record three geometric trap distances at each active
point, taking the minimum over the orbit:
  • trap_r  — distance to the Z-axis (cylindrical radius √(x²+y²))
  • trap_z  — distance to the XY-plane (|z.z|)
  • trap_s  — distance to the unit sphere ( | |z| − 1 | )
Interpolated back to mesh vertices they produce the iridescent RGB colouring
exported to GLB as the `orbitTrap` vertex-colour attribute (COLOR_0).

Dependency: scikit-image (`pip install scikit-image` into Blender's Python).
If unavailable, a point-cloud fallback is used.
"""

import bpy
import bmesh
import numpy as np
from pathlib import Path

# ── parameters ─────────────────────────────────────────────────────────────
POWER      = 8       # triplex power — 8 yields the canonical Mandelbulb
MAX_ITER   = 64      # escape iterations; more = sharper surface, slower
BAILOUT    = 2.0     # |z| threshold: orbit considered escaped above this
GRID_N     = 72      # voxels per axis: 72³ ≈ 373 K points (~30 s modern CPU)
GRID_RANGE = 1.25    # sample [-1.25, 1.25]³; the bulb fits inside [-1.2, 1.2]
ISO_DE     = 0.012   # isosurface threshold on the DE field
SCALE      = 2.0     # world-space size (metres); bulb fits in a 2 m cube

GLB_PATH = str(
    Path(bpy.data.filepath).parent / "hf_mandelbulb.glb"
    if bpy.data.filepath else Path("/tmp/hf_mandelbulb.glb")
)


# ── DE + orbit-trap field (vectorised numpy) ───────────────────────────────

def _mandelbulb_field(pts, power, max_iter, bailout):
    """
    Vectorised Mandelbulb DE and orbit-trap computation.

    pts    : (N, 3) float64 — sample coordinates; used as both c and z₀
    Returns: de, trap_r, trap_z, trap_s  each shape (N,)
    """
    N = len(pts)
    c  = pts.copy();  z  = pts.copy()
    dz = np.ones(N,  dtype=np.float64)
    de = np.zeros(N, dtype=np.float64)

    trap_r = np.full(N, np.inf)   # min dist to Z-axis
    trap_z = np.full(N, np.inf)   # min |z.z|
    trap_s = np.full(N, np.inf)   # min | |z| − 1 |
    active = np.ones(N, dtype=bool)

    for _ in range(max_iter):
        if not active.any():
            break

        za = z[active]
        ra = np.sqrt((za * za).sum(1))

        # record trap distances for all currently-active points
        trap_r[active] = np.minimum(trap_r[active],
                                    np.sqrt(za[:, 0]**2 + za[:, 1]**2))
        trap_z[active] = np.minimum(trap_z[active], np.abs(za[:, 2]))
        trap_s[active] = np.minimum(trap_s[active], np.abs(ra - 1.0))

        # escape
        esc = ra > bailout
        if esc.any():
            gi = np.where(active)[0][esc]
            re = ra[esc]
            de[gi] = 0.5 * np.log(re.clip(1e-10)) * re / dz[gi].clip(1e-30)
            active[gi] = False

        still = active
        if not still.any():
            break

        za2 = z[still];  dza = dz[still];  ca = c[still]
        ra2 = np.sqrt((za2 * za2).sum(1))
        rs  = ra2.clip(1e-10)

        # triplex z^n in spherical coordinates
        theta = np.arccos(np.clip(za2[:, 2] / rs, -1.0, 1.0))
        phi   = np.arctan2(za2[:, 1], za2[:, 0])
        rn    = ra2 ** power
        pt    = power * theta;  pp = power * phi

        z[still] = np.column_stack([
            rn * np.sin(pt) * np.cos(pp) + ca[:, 0],
            rn * np.sin(pt) * np.sin(pp) + ca[:, 1],
            rn * np.cos(pt)              + ca[:, 2],
        ])
        # derivative: |d(z^n)/dz| · |dz/dc| + 1  (chain rule)
        dz[still] = power * (ra2 ** (power - 1)) * dza + 1.0

    return de, trap_r, trap_z, trap_s


# ── grid computation ───────────────────────────────────────────────────────

def compute_grid():
    N    = GRID_N
    lin  = np.linspace(-GRID_RANGE, GRID_RANGE, N)
    gx, gy, gz = np.meshgrid(lin, lin, lin, indexing="ij")
    pts  = np.column_stack([gx.ravel(), gy.ravel(), gz.ravel()])

    print(f"[Mandelbulb] DE+traps on {N}³ = {N**3:,} pts …")
    de, tr, tz, ts = _mandelbulb_field(pts, POWER, MAX_ITER, BAILOUT)
    sh   = (N, N, N)
    step = 2.0 * GRID_RANGE / (N - 1)
    print(f"[Mandelbulb] DE range [{de.min():.4f}, {de.max():.4f}]")
    return de.reshape(sh), tr.reshape(sh), tz.reshape(sh), ts.reshape(sh), step


# ── isosurface extraction ──────────────────────────────────────────────────

def extract_mesh(de_grid, step):
    """Marching-cubes isosurface at DE = ISO_DE → (verts_unit, faces)."""
    try:
        from skimage.measure import marching_cubes  # type: ignore
        verts, faces, _, _ = marching_cubes(
            de_grid, level=ISO_DE, spacing=(step, step, step))
        return verts - GRID_RANGE, faces   # re-centre from [0, 2·GR] → [−GR, GR]
    except ImportError:
        print("[Mandelbulb] scikit-image missing — point-cloud fallback.")
        N   = GRID_N
        lin = np.linspace(-GRID_RANGE, GRID_RANGE, N)
        xi, yi, zi = np.where(np.abs(de_grid - ISO_DE) < step * 0.6)
        verts = np.column_stack([lin[xi], lin[yi], lin[zi]])
        faces = np.tile(np.arange(len(verts))[:, None], 3)
        return verts, faces


# ── trilinear interpolation grid → mesh vertices ───────────────────────────

def _trilinear(grid, pts_unit):
    """Interpolate NxNxN grid at pts_unit ∈ [−GR, GR]³. Returns (V,) array."""
    N    = GRID_N
    frac = (pts_unit + GRID_RANGE) / (2.0 * GRID_RANGE) * (N - 1)
    frac = np.clip(frac, 0.0, N - 1.0)
    i0   = np.floor(frac).astype(int)
    i1   = np.minimum(i0 + 1, N - 1)
    t    = frac - i0
    tx, ty, tz = t[:, 0], t[:, 1], t[:, 2]
    g    = grid
    c000 = g[i0[:,0], i0[:,1], i0[:,2]];  c100 = g[i1[:,0], i0[:,1], i0[:,2]]
    c010 = g[i0[:,0], i1[:,1], i0[:,2]];  c110 = g[i1[:,0], i1[:,1], i0[:,2]]
    c001 = g[i0[:,0], i0[:,1], i1[:,2]];  c101 = g[i1[:,0], i0[:,1], i1[:,2]]
    c011 = g[i0[:,0], i1[:,1], i1[:,2]];  c111 = g[i1[:,0], i1[:,1], i1[:,2]]
    return (  c000*(1-tx)*(1-ty)*(1-tz) + c100*tx*(1-ty)*(1-tz)
            + c010*(1-tx)*ty*(1-tz)     + c110*tx*ty*(1-tz)
            + c001*(1-tx)*(1-ty)*tz     + c101*tx*(1-ty)*tz
            + c011*(1-tx)*ty*tz         + c111*tx*ty*tz)


def vertex_colours(verts_unit, tr_grid, tz_grid, ts_grid):
    """Map interpolated trap distances to RGB float32 array (V, 3)."""
    tr = _trilinear(tr_grid, verts_unit)
    tz = _trilinear(tz_grid, verts_unit)
    ts = _trilinear(ts_grid, verts_unit)

    def sn(x):
        # soft normalise via sigmoid centred at 0.5
        return 1.0 / (1.0 + np.exp(-6.0 * (x - 0.5)))

    r_ch = sn(np.clip(tr,        0.0, 1.0))
    g_ch = sn(np.clip(tz / 0.6,  0.0, 1.0))
    b_ch = sn(np.clip(ts / 0.5,  0.0, 1.0))
    return np.column_stack([r_ch, g_ch, b_ch]).astype(np.float32)


# ── Blender helpers ────────────────────────────────────────────────────────

def _unlit_vcol_mat():
    mat = bpy.data.materials.new("mandelbulb_trap")
    mat.use_nodes = True
    nt  = mat.node_tree;  nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    em   = nt.nodes.new("ShaderNodeEmission")
    vcol = nt.nodes.new("ShaderNodeVertexColor")
    vcol.layer_name = "orbitTrap"
    nt.links.new(vcol.outputs["Color"],   em.inputs["Color"])
    nt.links.new(em.outputs["Emission"],  out.inputs["Surface"])
    em.inputs["Strength"].default_value = 2.5
    mat.shadow_method = "NONE"
    return mat


def build_mesh_obj(verts_w, faces, colours, coll):
    bm  = bmesh.new()
    bvs = [bm.verts.new((float(v[0]), float(v[1]), float(v[2]))) for v in verts_w]
    bm.verts.ensure_lookup_table()
    for fi in faces:
        try:
            bm.faces.new([bvs[int(i)] for i in fi])
        except ValueError:
            pass   # duplicate or zero-area face; skip
    col_layer = bm.loops.layers.color.new("orbitTrap")
    for face in bm.faces:
        for loop in face.loops:
            c = colours[loop.vert.index]
            loop[col_layer] = (float(c[0]), float(c[1]), float(c[2]), 1.0)
    me  = bpy.data.meshes.new("mandelbulb")
    bm.to_mesh(me);  bm.free()
    obj = bpy.data.objects.new("mandelbulb", me)
    obj["holoflow:facet"] = True
    coll.objects.link(obj)
    me.materials.append(_unlit_vcol_mat())
    return obj


# ── main ────────────────────────────────────────────────────────────────────

def build():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    coll = bpy.data.collections.new("Mandelbulb")
    bpy.context.scene.collection.children.link(coll)

    de_grid, tr_grid, tz_grid, ts_grid, step = compute_grid()
    verts_u, faces = extract_mesh(de_grid, step)
    print(f"[Mandelbulb] Mesh: {len(verts_u):,} verts, {len(faces):,} faces")

    colours = vertex_colours(verts_u, tr_grid, tz_grid, ts_grid)
    verts_w = verts_u * SCALE

    obj = build_mesh_obj(verts_w, faces, colours, coll)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        use_selection=True,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_colors=True,
        export_animations=False,
    )
    print(f"[Mandelbulb] Exported → {GLB_PATH}")


build()
