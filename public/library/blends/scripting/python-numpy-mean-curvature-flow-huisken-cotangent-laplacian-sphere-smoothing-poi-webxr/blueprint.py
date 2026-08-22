# SPDX-License-Identifier: CC0-1.0
"""
Discrete Mean-Curvature Flow  (Huisken 1984)
=============================================
Holoflow Studio · Blender 5.1 tutorial

∂X/∂t = H·n  — convex surfaces flow to a round point under MCF.
Discrete approximation (Meyer et al. 2003):
    H·n_i = L_cot(X)_i / (2 A_i)
where L_cot is the cotangent-weighted Laplacian and A_i is the mixed
Voronoi area around vertex i.

Explicit Euler integration with mean-radius rescaling runs 800 steps on a
noise-perturbed subdivided icosphere.  Five shape keys capture the smoothing
trajectory so WebXR viewers can scrub the evolution.
A FLOAT_COLOR POINT attribute maps initial |H·n| to a cobalt–amber gradient.

References
----------
Huisken G (1984) Flow by mean curvature of convex surfaces into spheres.
  J Differential Geometry 20 237–266.
  https://doi.org/10.4310/jdg/1214438998  (open access, perpetual link)
Meyer M, Desbrun M, Schröder P, Barr AH (2003) Discrete differential-geometry
  operators for triangulated 2-manifolds. Visualization and Mathematics III,
  Springer, pp 35–57.
  https://doi.org/10.1007/978-3-662-05105-4_2
NumPy (BSD-3-Clause)  https://numpy.org/

Cross-references (Holoflow Studio library)
------------------------------------------
/tutorials/blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr
/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr
/tutorials/blender-tutorial-python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr
/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr
"""

import numpy as np
import bpy

# ── Parameters ───────────────────────────────────────────────────────────────
SUBDIVISIONS   = 4          # icosphere → 2 562 verts, 5 120 tris
NOISE_STRENGTH = 0.05       # radial perturbation amplitude (fraction of radius)
NOISE_SEED     = 42
DT             = 0.0015     # explicit-Euler step — stable for this mesh density
N_STEPS        = 800        # Huisken: convex sphere reaches round point ~ step 800
SNAPSHOTS      = [50, 200, 500, 800]
SK_NAMES       = ["SK_Step050", "SK_Step200", "SK_Step500", "SK_Step800"]
COBALT         = (0.13, 0.35, 0.80, 1.0)   # low  mean curvature
AMBER          = (1.00, 0.55, 0.10, 1.0)   # high mean curvature
COLOUR_ATTR    = "MCF_Curvature"
OBJ_NAME       = "MCF_Sphere"
POI_RADIUS     = 0.08       # metres, WebXR point-of-interest bounding sphere
LICENCE        = "CC0"


# ── Scene setup ──────────────────────────────────────────────────────────────

def _clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def _add_icosphere() -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=SUBDIVISIONS, radius=1.0, location=(0, 0, 0)
    )
    obj = bpy.context.active_object
    obj.name = OBJ_NAME
    return obj


# ── Bulk mesh I/O (40× faster than per-vertex loops) ─────────────────────────

def _get_verts(mesh: bpy.types.Mesh) -> np.ndarray:
    n   = len(mesh.vertices)
    buf = np.empty(n * 3, dtype=np.float64)
    mesh.vertices.foreach_get("co", buf)
    return buf.reshape(n, 3)


def _set_verts(mesh: bpy.types.Mesh, verts: np.ndarray) -> None:
    mesh.vertices.foreach_set("co", verts.astype(np.float32).ravel())
    mesh.update()


def _get_faces(mesh: bpy.types.Mesh) -> np.ndarray:
    """Return (F, 3) int32 triangle vertex-index array via loop_triangles."""
    mesh.calc_loop_triangles()
    buf = np.empty(len(mesh.loop_triangles) * 3, dtype=np.int32)
    mesh.loop_triangles.foreach_get("vertices", buf)
    return buf.reshape(-1, 3)


# ── Geometry ─────────────────────────────────────────────────────────────────

def _perturb_radially(v: np.ndarray, strength: float, seed: int) -> np.ndarray:
    """Multiply each vertex radius by a random factor drawn from [1−s, 1+s]."""
    rng = np.random.default_rng(seed)
    t   = rng.uniform(-strength, strength, (v.shape[0], 1))
    return v * (1.0 + t)


# ── Cotangent-Laplacian MCF step (vectorised, scipy-free) ────────────────────

def _mcf_step(
    verts: np.ndarray, faces: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    """
    One explicit-Euler MCF step; returns (new_verts, H_magnitude).

    For each face (a, b, c), iterating over each tip vertex t ∈ {a, b, c}:
      cot(tip angle) = dot(u, v) / |u × v|    u, v = edges from t
    The half-weight w = ½ cot goes to the edge (j, l) OPPOSITE the tip:
      D[j]  += w,   D[l]  += w          (cotangent degree)
      WX[j] += w * X[l],  WX[l] += w * X[j]  (weighted position sum)

    L_cot(X)_i = WX_i − D_i · X_i
    H·n_i      = L_cot(X)_i / (2 A_i)   A_i = mixed Voronoi area
    X_new      = X + dt · H·n,  then rescale to preserve mean radius.
    """
    V  = verts.shape[0]
    D  = np.zeros(V,      dtype=np.float64)   # Σ_j w_ij
    WX = np.zeros((V, 3), dtype=np.float64)   # Σ_j w_ij X_j
    A  = np.zeros(V,      dtype=np.float64)   # Voronoi area (face_area / 3)

    for ki in range(3):                        # cycle tip role through face verts
        tip = faces[:, ki]
        j   = faces[:, (ki + 1) % 3]
        l   = faces[:, (ki + 2) % 3]

        u      = verts[j] - verts[tip]         # edges from tip to neighbours
        v      = verts[l] - verts[tip]
        dot    = np.einsum("fi,fi->f", u, v)
        cross  = np.cross(u, v)
        sinmag = np.linalg.norm(cross, axis=1)
        cot    = dot / np.maximum(sinmag, 1e-12)
        w      = 0.5 * cot                     # half-cotangent weight for edge (j,l)

        np.add.at(D,  j,  w)                   # scatter w to both edge endpoints
        np.add.at(D,  l,  w)
        np.add.at(WX, j,  w[:, None] * verts[l])
        np.add.at(WX, l,  w[:, None] * verts[j])
        np.add.at(A,  tip, sinmag / 6.0)       # each face contributes |u×v|/2 / 3

    LX    = WX - D[:, None] * verts            # cotangent Laplacian applied to X
    inv2A = 1.0 / np.maximum(2.0 * A, 1e-14)[:, None]
    HN    = inv2A * LX                          # discrete vector mean curvature

    new_v = verts + DT * HN

    # Mean-radius rescale — keeps the sphere visible; does not alter curvature flow
    r_old  = np.mean(np.linalg.norm(verts, axis=1))
    r_new  = np.mean(np.linalg.norm(new_v, axis=1))
    new_v *= r_old / max(r_new, 1e-12)

    return new_v, np.linalg.norm(HN, axis=1)


# ── Vertex colour  ────────────────────────────────────────────────────────────

def _paint_curvature(mesh: bpy.types.Mesh, H_mag: np.ndarray) -> None:
    """Write MCF_Curvature FLOAT_COLOR POINT: cobalt (low H) → amber (high H)."""
    if COLOUR_ATTR in mesh.color_attributes:
        mesh.color_attributes.remove(mesh.color_attributes[COLOUR_ATTR])
    attr = mesh.color_attributes.new(
        name=COLOUR_ATTR, type="FLOAT_COLOR", domain="POINT"
    )
    h_lo, h_hi = H_mag.min(), H_mag.max()
    t    = (H_mag - h_lo) / max(h_hi - h_lo, 1e-12)  # 0 = cobalt, 1 = amber
    cols = np.empty((H_mag.shape[0], 4), dtype=np.float32)
    for ch in range(4):
        cols[:, ch] = (1.0 - t) * COBALT[ch] + t * AMBER[ch]
    attr.data.foreach_set("color", cols.ravel())
    mesh.color_attributes.active_color       = attr
    mesh.color_attributes.render_color_index = mesh.color_attributes.find(COLOUR_ATTR)


# ── Material ──────────────────────────────────────────────────────────────────

def _make_material(obj: bpy.types.Object) -> None:
    mat   = bpy.data.materials.new("MCF_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    vc  = nodes.new("ShaderNodeVertexColor")
    vc.layer_name = COLOUR_ATTR
    vc.location   = (-400, 0)

    pb  = nodes.new("ShaderNodeBsdfPrincipled")
    pb.location = (-100, 0)
    pb.inputs["Roughness"].default_value = 0.35
    pb.inputs["Metallic"].default_value  = 0.15

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (220, 0)

    links.new(vc.outputs["Color"], pb.inputs["Base Color"])
    links.new(pb.outputs["BSDF"],  out.inputs["Surface"])
    obj.data.materials.append(mat)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    _clear_scene()
    obj  = _add_icosphere()
    mesh = obj.data
    mesh.shade_flat()

    faces = _get_faces(mesh)               # triangle indices — connectivity is constant

    # t = 0 : noise-perturbed icosphere → Basis shape key
    verts = _get_verts(mesh)
    verts = _perturb_radially(verts, NOISE_STRENGTH, NOISE_SEED)
    _set_verts(mesh, verts)
    obj.shape_key_add(name="Basis", from_mix=False)

    # One forward pass at t=0 to get H for vertex colour (max spatial variation)
    _, H_init = _mcf_step(verts, faces)    # verts unchanged (no in-place mutation)

    # Explicit-Euler MCF loop
    snap_idx = 0
    for step in range(1, N_STEPS + 1):
        verts, _ = _mcf_step(verts, faces)
        if step == SNAPSHOTS[snap_idx]:
            sk = obj.shape_key_add(name=SK_NAMES[snap_idx], from_mix=False)
            sk.data.foreach_set("co", verts.astype(np.float32).ravel())
            snap_idx += 1
            if snap_idx == len(SNAPSHOTS):
                break                      # all shape keys captured

    _paint_curvature(mesh, H_init)
    _make_material(obj)

    # Holoflow Studio export metadata
    obj["holoflow:facet"]   = True
    obj["holoflow:licence"] = LICENCE
    obj["mcf:dt"]           = DT
    obj["mcf:steps"]        = N_STEPS
    obj["mcf:noise"]        = NOISE_STRENGTH

    # Point-of-interest empty (WebXR bounding volume)
    bpy.ops.object.empty_add(type="SPHERE", radius=POI_RADIUS, location=(0, 0, 0))
    poi = bpy.context.active_object
    poi.name             = "POI_MCF_Sphere"
    poi["holoflow:poi"]  = True

    bpy.context.view_layer.objects.active = obj
    nsk = len(obj.data.shape_keys.key_blocks)
    nv  = len(mesh.vertices)
    nt  = len(mesh.loop_triangles)
    print(f"[MCF] ✓  {nv} verts · {nt} tris · {nsk} shape keys")


main()
