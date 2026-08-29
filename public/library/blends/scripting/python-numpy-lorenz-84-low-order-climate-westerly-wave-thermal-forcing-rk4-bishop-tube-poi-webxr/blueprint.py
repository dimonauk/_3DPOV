# SPDX-License-Identifier: CC0-1.0
"""
Lorenz 84 Low-Order Climate Model — Westerly Wind & Rossby Wave Chaos
Blender 5.1 | bpy direct-data API | no UI context required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Edward Lorenz published this three-variable model in 1984 as the simplest
autonomous ODE that faithfully reproduces key properties of large-scale
atmospheric variability — including blocking events and multi-week weather
regimes — using only wave–mean-flow interaction and thermal forcing.

    ẋ = −y² − z² − ax + aF       (westerly wind tendency)
    ẏ =  xy − bxz − y + G        (cosine-wave tendency)
    ż =  bxy + xz − z            (sine-wave tendency)

Physical variables (Lorenz 1984 notation):
  x  intensity of the zonal (west-to-east) mean wind current
  y  amplitude of the cosine phase of a large-scale Rossby wave
  z  amplitude of the sine phase of the same Rossby wave

Parameters:
  a = 0.25  thermal damping / mechanical friction coefficient
  b = 4.0   advection coupling (wave tilted by mean flow, barotropic instability)
  F         differential thermal forcing, equator–pole temperature gradient
  G         asymmetric forcing, land–sea thermal contrast / seasonal offset

The quadratic terms −y²−z² in ẋ represent wave-drag on the mean wind;
xy−bxz in ẏ and bxy+xz in ż are the wave-tilting / Reynolds-stress terms
responsible for nonlinearity and, ultimately, chaos.

Dynamical regimes (G = 1, vary F):
  F < 0.5  →  globally stable fixed point (steady laminar westerlies)
  F ≈ 0.5  →  supercritical Hopf bifurcation; periodic Rossby oscillation
  1 < F < 6.9  →  quasi-periodic or multi-periodic tori
  F > 6.9  →  strange attractor, deterministic chaos (weather-blocking regime)

At canonical F = 8, G = 1:
  λ₁ ≈ +0.044  (positive Lyapunov; predictability horizon ≈ 23 time units)
  λ₂ ≈  0.000  (neutral; along the flow direction)
  λ₃  <  0     (contracting; ∇·F = −a + 2(x−1) is negative on average)
  D_KY ≈ 2 + λ₁/|λ₃|  (Kaplan–Yorke fractal dimension ~ 2.05–2.10)

The orbit is rendered as a Bishop parallel-transport tube. Four shape keys
show canonical chaos (Basis), near-Hopf quasi-periodicity (SK_Hopf),
a periodic limit cycle (SK_Periodic), and high-G asymmetric chaos (SK_HighG).
"""

import bpy
import bmesh
import numpy as np

# ── PARAMETERS ───────────────────────────────────────────────────────────────
A_DAMP  = 0.25      # thermal damping rate 'a' (Lorenz 1984 canonical)
B_ADV   = 4.00      # advection coupling 'b'   (Lorenz 1984 canonical)

DT       = 0.025    # RK4 timestep; ≤0.04 stable for F ≤ 16
N_WARMUP = 2000     # warmup steps discarded (50 time units; transient dies quickly)
N_STEPS  = 3000     # waypoints collected (75 time units; ~10+ chaotic orbits)

TUBE_R  = 0.015     # tube cross-section radius, metres
N_SIDES = 12        # polygon sides (12-gon is smooth yet lightweight)
POI_R   = 0.082     # scale attractor so it fits inside a standard poi head

OBJ_NAME = "Lorenz84_Poi"

COBALT = (0.03, 0.15, 0.58, 1.0)   # low-speed colour (slow, spiralling regions)
AMBER  = (1.00, 0.65, 0.00, 1.0)   # high-speed colour (fast fold-back jumps)

# Each shape key is (F_value, G_value); full re-integration per key so that
# the morph target IS the trajectory, not an interpolation artefact.
SK_PARAMS = {
    "Basis":       (8.00, 1.00),   # canonical chaos — strange attractor
    "SK_Hopf":     (6.50, 1.00),   # near-Hopf; limit cycle / 2-torus
    "SK_Periodic": (4.00, 1.00),   # well below Hopf; clean periodic orbit
    "SK_HighG":    (8.00, 3.00),   # strong land-sea contrast; altered chaos
}


# ── LORENZ-84 ODE ────────────────────────────────────────────────────────────
def _l84(s: np.ndarray, F: float, G: float) -> np.ndarray:
    """Return (ẋ, ẏ, ż) for the Lorenz-84 system at state s=(x,y,z).

    The energy-like quantity E = ½(x²+y²+z²) has tendency:
      Ė = aF·x + G·y − a·x² − y² − z²
    which is bounded — confirming the flow is dissipative on average.
    """
    x, y, z = s
    return np.array([
        -y*y - z*z - A_DAMP*x + A_DAMP*F,   # wave-drag + thermal drive
         x*y - B_ADV*x*z - y + G,            # barotropic wave tilting
         B_ADV*x*y + x*z - z,                # quadrature wave tilting
    ])


def _integrate(F: float, G: float) -> np.ndarray:
    """RK4 integration of Lorenz-84. Returns (N_STEPS, 3) float64 array.

    We start near the origin rather than at a fixed point so the transient
    naturally samples a range of x values during warmup, helping the
    Bishop frame initialise away from degenerate tangent configurations.
    """
    s = np.array([0.10, 0.05, 0.05])
    for _ in range(N_WARMUP):
        k1 = _l84(s,             F, G)
        k2 = _l84(s + 0.5*DT*k1, F, G)
        k3 = _l84(s + 0.5*DT*k2, F, G)
        k4 = _l84(s +    DT*k3,  F, G)
        s += DT / 6.0 * (k1 + 2.0*k2 + 2.0*k3 + k4)

    pts = np.empty((N_STEPS, 3), dtype=np.float64)
    for i in range(N_STEPS):
        k1 = _l84(s,             F, G)
        k2 = _l84(s + 0.5*DT*k1, F, G)
        k3 = _l84(s + 0.5*DT*k2, F, G)
        k4 = _l84(s +    DT*k3,  F, G)
        s += DT / 6.0 * (k1 + 2.0*k2 + 2.0*k3 + k4)
        pts[i] = s

    return pts


# ── BISHOP PARALLEL-TRANSPORT FRAME ──────────────────────────────────────────
def _bishop_frame(pts: np.ndarray):
    """Rodrigues-rotation Bishop frame along a 3-D polyline.

    Bishop (1975) showed that minimising the rate of normal rotation gives a
    frame that is free of torsion-induced twisting — essential for tubes that
    stay smooth even when the curve reverses curvature.  We seed the first
    normal perpendicular to the first tangent by choosing the axis least
    aligned with it, then propagate via rotation about the binormal.
    """
    n = len(pts)
    T = np.diff(pts, axis=0)                      # (n-1, 3) tangents
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)   # guard zero-length segments
    T = T / norms

    # Seed first normal: pick global axis least parallel to T[0]
    abs_t0 = np.abs(T[0])
    seed_axis = np.array([1.0, 0.0, 0.0]) if abs_t0[0] < abs_t0[1] else np.array([0.0, 1.0, 0.0])
    N0 = seed_axis - np.dot(seed_axis, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    N = np.empty((n - 1, 3))
    B = np.empty((n - 1, 3))
    N[0] = N0
    B[0] = np.cross(T[0], N0)

    for i in range(1, n - 1):
        axis = np.cross(T[i-1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = np.dot(T[i-1], T[i])
        if sin_a < 1e-10:          # nearly parallel segments — keep previous
            N[i] = N[i-1]
        else:
            axis /= sin_a
            # Rodrigues: N' = cos·N + sin·(axis×N) + (1−cos)·(axis·N)·axis
            N[i] = (cos_a * N[i-1]
                    + sin_a * np.cross(axis, N[i-1])
                    + (1.0 - cos_a) * np.dot(axis, N[i-1]) * axis)
            N[i] /= np.linalg.norm(N[i])
        B[i] = np.cross(T[i], N[i])

    return T, N, B


# ── TUBE GEOMETRY ─────────────────────────────────────────────────────────────
def _build_tube(pts: np.ndarray) -> tuple:
    """Return (verts, faces) arrays for a Bishop-frame tube.

    Each ring of N_SIDES vertices is:
        ring[j] = pts[i] + TUBE_R * (cos(θ_j)·N[i] + sin(θ_j)·B[i])

    Quad faces connect adjacent rings; no caps — poi-head GLBs don't need them.
    """
    _, N, B = _bishop_frame(pts)
    m = len(N)          # m = N_STEPS - 1
    angles = np.linspace(0, 2.0 * np.pi, N_SIDES, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)

    # (m, N_SIDES, 3) — broadcast ring construction
    rings = (pts[:m, None, :]
             + TUBE_R * (ca[None, :, None] * N[:, None, :]
                         + sa[None, :, None] * B[:, None, :]))
    verts = rings.reshape(-1, 3)          # (m*N_SIDES, 3)

    # Quads: two adjacent rings, wrapping the last vertex back to first
    faces = []
    for i in range(m - 1):
        base = i * N_SIDES
        for j in range(N_SIDES):
            j_next = (j + 1) % N_SIDES
            faces.append((base + j, base + j_next,
                           base + N_SIDES + j_next, base + N_SIDES + j))

    return verts, faces


# ── SPEED COLOURS ─────────────────────────────────────────────────────────────
def _speed_colours(pts: np.ndarray) -> np.ndarray:
    """FLOAT_COLOR POINT attribute: cobalt (slow) → amber (fast).

    Speed is proportional to |ẋ, ẏ, ż| evaluated from finite differences,
    which emphasises the fast fold-back transitions between Rossby-wave phases.
    The m-1 tube rings (between adjacent pts) receive the average of the speeds
    at the two bracketing waypoints.
    """
    diffs = np.diff(pts, axis=0)                        # (m-1, 3)
    speed_raw = np.linalg.norm(diffs, axis=1)           # (m-1,)
    s_max = speed_raw.max()
    t = speed_raw / (s_max if s_max > 1e-12 else 1.0)   # normalise 0–1

    # Expand each per-ring colour to all N_SIDES vertices
    colours = np.empty((len(t), N_SIDES, 4))
    for c in range(4):
        lo, hi = COBALT[c], AMBER[c]
        colours[:, :, c] = (lo + t[:, None] * (hi - lo))

    return colours.reshape(-1, 4)


# ── MESH CONSTRUCTION ─────────────────────────────────────────────────────────
def _build_mesh(pts: np.ndarray, name: str) -> bpy.types.Object:
    """Create a Blender mesh object from tube geometry.  Scale to POI_R."""
    # Centre and scale the attractor
    centre = pts.mean(axis=0)
    pts_c  = pts - centre
    radius = np.linalg.norm(pts_c, axis=1).max()
    scale  = POI_R / radius if radius > 1e-12 else 1.0
    pts_s  = pts_c * scale

    verts, faces = _build_tube(pts_s)

    me = bpy.data.meshes.new(name)
    me.from_pydata(verts.tolist(), [], faces)
    me.shade_flat()

    # FLOAT_COLOR POINT attribute (Blender 5.x renamed vertex colours → attributes)
    attr = me.attributes.new("Lorenz84_Speed", "FLOAT_COLOR", "POINT")
    colours = _speed_colours(pts_s)
    attr.data.foreach_set("color", colours.ravel().tolist())

    me.update()

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob, pts_s


# ── SHAPE KEYS ────────────────────────────────────────────────────────────────
def _add_shape_key(ob: bpy.types.Object, name: str, pts: np.ndarray) -> None:
    """Add a shape key whose vertex positions come from a separate integration.

    Each key is a distinct attractor orbit, not an interpolation — so morphing
    between keys transitions between qualitatively different dynamical regimes.
    """
    sk = ob.shape_key_add(name=name, from_mix=False)
    verts_key, _ = _build_tube(pts)
    sk.data.foreach_set("co", verts_key.ravel().tolist())


# ── MATERIAL ──────────────────────────────────────────────────────────────────
def _make_material(ob: bpy.types.Object) -> None:
    """Principled BSDF with Lorenz84_Speed driving base colour and emission."""
    mat = bpy.data.materials.new("Lorenz84_Mat")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Lorenz84_Speed"
    attr.attribute_type = "GEOMETRY"           # reads FLOAT_COLOR from the mesh

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value  = 0.45
    bsdf.inputs["Roughness"].default_value = 0.26
    bsdf.inputs["Emission Strength"].default_value = 1.80

    out = nodes.new("ShaderNodeOutputMaterial")

    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])

    ob.data.materials.append(mat)


# ── GLB EXPORT ────────────────────────────────────────────────────────────────
def _export_glb(ob: bpy.types.Object) -> None:
    """Apply +Y-up rotation, export Draco-6 GLB with morph targets."""
    import math, os
    from pathlib import Path

    # +Y-up convention: rotate -90° around X to match WebXR / three.js origin
    ob.rotation_euler = (math.radians(-90), 0.0, 0.0)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(rotation=True)

    # holoflow metadata
    ob["holoflow:facet"]    = True
    ob["holoflow:category"] = "poi-head"
    ob["holoflow:topic"]    = "lorenz-84-climate"

    glb_path = str(
        Path(bpy.data.filepath).parent / "hf_lorenz84_poi.glb"
        if bpy.data.filepath
        else Path("/tmp/hf_lorenz84_poi.glb")
    )
    bpy.ops.export_scene.gltf(
        filepath            = glb_path,
        export_format       = "GLB",
        use_selection       = True,
        export_draco_mesh_compression_enable   = True,
        export_draco_mesh_compression_level    = 6,
        export_colors       = True,
        export_morph        = True,
        export_morph_normal = False,
        export_image_format = "WEBP",
        export_yup          = True,
    )
    print(f"[Lorenz84] GLB → {glb_path}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main() -> None:
    # Clear previous run artefacts
    for obj in list(bpy.data.objects):
        if obj.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(obj, do_unlink=True)

    print("[Lorenz84] Integrating canonical trajectory (Basis) …")
    pts_basis = _integrate(*SK_PARAMS["Basis"])
    ob, pts_s = _build_mesh(pts_basis, OBJ_NAME)

    # Basis shape key (required anchor before adding morph targets)
    ob.shape_key_add(name="Basis", from_mix=False)

    # Additional shape keys — each a full independent orbit
    centre  = pts_basis.mean(axis=0)
    radius  = np.linalg.norm(pts_basis - centre, axis=1).max()
    scale   = POI_R / radius if radius > 1e-12 else 1.0

    for key_name, (F, G) in SK_PARAMS.items():
        if key_name == "Basis":
            continue
        print(f"[Lorenz84] Shape key {key_name} (F={F}, G={G}) …")
        pts_key = (_integrate(F, G) - centre) * scale
        _add_shape_key(ob, key_name, pts_key)

    _make_material(ob)
    _export_glb(ob)

    vcount = len(ob.data.vertices)
    print(f"[Lorenz84] Done — {N_STEPS} waypoints · {vcount} verts · scale={scale:.3f}")


main()
