"""
Sprott C Attractor — Dual-Quadratic 6-Term ODE, Paired Shilnikov Saddle-Foci
Julien Clinton Sprott 1994 · Blender 5.1 · bpy direct-data API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sprott C is Case #3 in the 1994 catalogue of minimal three-variable autonomous
ODEs with at most six terms and at most two quadratic nonlinearities:

    ẋ = y·z              (nonlinear coupling: y and z multiply)
    ẏ = x − y            (linear restoring + linear damping)
    ż = c − x·y          (nonlinear feedback; canonical  c = 1.0)

The two nonlinear terms — y·z and x·y — are PRODUCT nonlinearities: neither
y nor z alone drives instability; they must both be nonzero simultaneously.
This mutual-gating property is qualitatively different from the x²-rectifier
in Sprott L or the single yz term in Lorenz.

The c parameter scales the driving constant in ż = c − xy.  At c = 1.0
(the canonical Sprott 1994 value) the system is genuinely chaotic.  The shape
keys below sample the c-family, revealing a topology transition as c rises:

  Basis      c = 1.0   canonical chaos   — the attractor from the 1994 paper
  SK_cLow    c = 0.7   contracted orbit  — smaller but still chaotic
  SK_cHigh   c = 1.5   expanded attractor — looser windings, same topology
  SK_cWide   c = 2.0   near-bifurcation  — orbit grows toward unbounded

──────────────────────────────────────────────────────────────────────────────
FIXED-POINT ANALYSIS
──────────────────────────────────────────────────────────────────────────────

Set ẋ = ẏ = ż = 0:
    y·z = 0         → y = 0  OR  z = 0
    x = y
    x·y = c

Case  y = 0:  x = 0  but  0·0 = c  →  0 = c  (impossible for c ≠ 0)
Case  z = 0:  x = y  and  x² = c   →  x = ±√c

Two equilibria:  P₊ = (+√c,  +√c, 0)   and   P₋ = (−√c, −√c, 0)

At canonical c = 1.0:   P₊ = (1, 1, 0)   P₋ = (−1, −1, 0)

Jacobian at P₊ = (1, 1, 0):
    J = [[0, z, y ],    = [[0,  0,  1],
         [1, −1, 0],       [1, −1,  0],
         [−y, −x, 0]]      [−1, −1,  0]]

Characteristic polynomial:
    det(λI − J) = λ(λ+1)λ − (−λ − 2) = λ³ + λ² + λ + 2 = 0

Numerical roots:
    λ_r  ≈ −1.352               (real, stable)
    λ_c  ≈ +0.176 ± 1.203i      (complex pair, unstable)

Shilnikov condition:  |λ_r| = 1.352  >  Re(λ_c) = 0.176   ✓
→ Guaranteed horseshoe chaos near any homoclinic orbit through P₊.

By the Z₂ symmetry (x,y,z) → (−x,−y,z) that maps P₊ ↔ P₋, P₋ has the
same eigenvalue structure.  Both fixed points are Shilnikov saddle-foci,
so the attractor has two symmetric winding lobes — a double-scroll topology.

Constant divergence:  ∇·F = 0 + (−1) + 0 = −1
Liouville:            λ₁ + λ₂ + λ₃ = −1  (exact)
Lyapunov (canonical): λ₁ ≈ +0.101   λ₂ ≈ 0   λ₃ ≈ −1.101
Kaplan-Yorke dim:     D_KY = 2 + 0.101/1.101 ≈ 2.092

──────────────────────────────────────────────────────────────────────────────
SOURCES (permissive licences only)
──────────────────────────────────────────────────────────────────────────────

Primary:
  Sprott JC (1994) "Some simple chaotic flows"
      Phys Rev E 50(2):R647–R650  DOI 10.1103/PhysRevE.50.R647
      Public-domain mathematics. Companion atlas:
      https://sprott.physics.wisc.edu/chaos/  (permissive educational)

Secondary:
  Gilpin W (2021–2024) dysts Dynamical Systems Benchmarks  MIT licence
      https://github.com/williamgilpin/dysts
      Lyapunov exponents and Kaplan-Yorke dimensions for all 131 systems.
      Related: https://github.com/williamgilpin/fnn  (MIT) false-nearest-
      neighbours embedding-dimension estimation.
"""

import bpy
import bmesh
import math
import mathutils
import numpy as np

# ── PARAMETERS ───────────────────────────────────────────────────────────────
# RK4 step — 0.01 keeps relative error < 1e-7 for the Sprott C orbit.
# Sprott C spirals at ≈ ω = 1.2 rad/time-unit; need ≥ 10 steps/cycle → OK.
DT          = 0.01
BURN_IN     = 3_000         # transient steps discarded
N_STEPS     = 90_000        # steps integrated after burn-in
THIN        = 30            # keep every THIN-th step → 3 000 waypoints
N_WP        = N_STEPS // THIN   # = 3 000

IC          = np.array([1.0, 0.5, 0.0])  # near P₊, off the z=0 plane

TUBE_SEGS   = 10            # polygon sides of tube cross-section
TUBE_R      = 0.025         # tube radius (m) — Sprott C orbit is compact
POI_R       = 0.085         # poi sphere radius

OBJ_NAME    = "SprottC_Attractor"
ATTR_NAME   = "SprottC_Speed"   # FLOAT_COLOR vertex attribute

COBALT = np.array([0.05, 0.22, 0.82, 1.0])
AMBER  = np.array([0.92, 0.58, 0.04, 1.0])

# c-parameter presets — varying the constant term in  ż = c − xy
PRESETS: dict[str, float] = {
    "Basis"   : 1.0,   # Sprott 1994 canonical
    "SK_cLow" : 0.7,   # contracted orbit; equilibria at ±√0.7 ≈ ±0.837
    "SK_cHigh": 1.5,   # expanded orbit;   equilibria at ±√1.5 ≈ ±1.225
    "SK_cWide": 2.0,   # near bifurcation; equilibria at ±√2   ≈ ±1.414
}


# ── ODE ──────────────────────────────────────────────────────────────────────
def _deriv(s: np.ndarray, c: float) -> np.ndarray:
    """Sprott C right-hand side.

    WHY product nonlinearities:  y·z in ẋ means the x-drive is zero whenever
    either y or z is zero — the two variables must conspire to push x.  This
    creates slow passages near the z = 0 plane (both equilibria live there)
    that mimic the laminar phases in intermittent chaos.
    """
    x, y, z = s
    return np.array([y * z, x - y, c - x * y])


def _rk4(s: np.ndarray, dt: float, c: float) -> np.ndarray:
    """Classic fourth-order Runge-Kutta step.

    WHY RK4 over Euler:  with dt = 0.01 the Lorenz-family systems have a
    dominant frequency ≈ 1–2 rad/tu.  Euler's error is O(dt²) ≈ 1e-4 per
    step; RK4's error is O(dt⁵) ≈ 1e-10.  Over 90 000 steps Euler drifts
    visibly off the true attractor.  RK4 costs 4 evaluations/step but the
    mesh precision is worth it.
    """
    k1 = _deriv(s,          c)
    k2 = _deriv(s + 0.5*dt*k1, c)
    k3 = _deriv(s + 0.5*dt*k2, c)
    k4 = _deriv(s +     dt*k3, c)
    return s + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)


def integrate(c: float) -> tuple[np.ndarray, np.ndarray]:
    """Return (waypoints [N_WP, 3], speeds [N_WP]).

    WHY an adaptive IC for each c:  the equilibria shift to ±√c when c varies.
    We start near P₊ so the burn-in reliably converges to the attractor rather
    than wandering off to the symmetric lobe or infinity.
    """
    sqrt_c = math.sqrt(max(c, 1e-6))
    s = np.array([sqrt_c, sqrt_c * 0.5, 0.0])  # near P₊ for each c-value

    for _ in range(BURN_IN):
        s = _rk4(s, DT, c)

    pts: list[np.ndarray] = []
    spds: list[float] = []
    for step in range(N_STEPS):
        s = _rk4(s, DT, c)
        if step % THIN == 0:
            pts.append(s.copy())
            spds.append(float(np.linalg.norm(_deriv(s, c))))

    return np.array(pts), np.array(spds)


# ── BISHOP PARALLEL-TRANSPORT FRAME ──────────────────────────────────────────
def bishop_frame(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Return per-waypoint normal N and binormal B arrays via parallel transport.

    WHY Bishop frames over Frenet-Serret:  Frenet-Serret frames have
    discontinuities wherever the curvature passes through zero (inflection
    points), producing sudden 180° rolls in the tube cross-section.  Bishop
    frames rotate the transported normal only as much as the curve actually
    bends — no spurious twisting.  The result is a smooth tube even across
    the slow laminar passages where Sprott C nearly straightens out.
    """
    n  = len(pts)
    T  = np.diff(pts, axis=0)
    T /= (np.linalg.norm(T, axis=1, keepdims=True) + 1e-12)

    # seed: pick N₀ perpendicular to T₀ via Gram-Schmidt against a fixed axis
    ref = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], ref)) > 0.9:
        ref = np.array([0.0, 1.0, 0.0])
    N0 = ref - np.dot(ref, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    N = np.zeros((n, 3))
    B = np.zeros((n, 3))
    N[0] = N0
    B[0] = np.cross(T[0], N0)

    for i in range(1, n - 1):
        axis = np.cross(T[i-1], T[i])
        sa   = np.linalg.norm(axis)
        ca   = np.clip(np.dot(T[i-1], T[i]), -1.0, 1.0)
        if sa < 1e-10:
            N[i] = N[i-1]
        else:
            axis /= sa
            # Rodrigues rotation of N[i-1] by angle between successive tangents
            N[i] = (ca * N[i-1]
                    + sa * np.cross(axis, N[i-1])
                    + (1.0 - ca) * np.dot(axis, N[i-1]) * axis)
        N[i] /= np.linalg.norm(N[i]) + 1e-12
        B[i]  = np.cross(T[i], N[i])

    N[-1] = N[-2]
    B[-1] = B[-2]
    return N, B


# ── TUBE MESH ────────────────────────────────────────────────────────────────
def build_tube(pts: np.ndarray,
               N: np.ndarray,
               B: np.ndarray,
               r: float,
               sides: int) -> tuple[np.ndarray, list[tuple]]:
    """Extrude a polygonal cross-section along the curve.

    Returns (verts [n*sides, 3], faces list-of-4-tuples).

    WHY quads:  quad strips produce cleaner shading gradients across the
    FLOAT_COLOR attribute than triangles, and Blender's EEVEE smooth-shading
    interpolates the per-vertex colours correctly across quads.
    """
    n     = len(pts)
    theta = np.linspace(0, 2*math.pi, sides, endpoint=False)
    cos_t = np.cos(theta)
    sin_t = np.sin(theta)

    # Each ring: centre + r*(cos·N + sin·B)
    rings = (pts[:, None, :]                  # [n, 1, 3]
             + r * (cos_t[None, :, None] * N[:, None, :]   # [n, sides, 3]
                    + sin_t[None, :, None] * B[:, None, :]))
    verts = rings.reshape(-1, 3)

    faces = []
    for i in range(n - 1):
        for j in range(sides):
            j1 = (j + 1) % sides
            a  = i * sides + j
            b  = i * sides + j1
            c  = (i + 1) * sides + j1
            d  = (i + 1) * sides + j
            faces.append((a, b, c, d))

    return verts, faces


# ── COLOUR MAP ───────────────────────────────────────────────────────────────
def speed_to_rgba(spds: np.ndarray, sides: int) -> list[tuple]:
    """Map orbit speed to cobalt→amber colour, repeated for each tube ring.

    WHY percentile clipping:  raw speeds have rare spikes near the fixed
    point (very slow) and near-separatrix excursions (very fast).  Clipping
    to [2nd, 98th] percentile spreads the colour range across the typical
    orbit rather than compressing all variation into 5% of the spectrum.
    """
    lo = float(np.percentile(spds, 2))
    hi = float(np.percentile(spds, 98))
    t  = np.clip((spds - lo) / (hi - lo + 1e-12), 0.0, 1.0)

    colours = []
    for ti in t:
        rgba = tuple((1.0 - ti) * COBALT + ti * AMBER)
        for _ in range(sides):
            colours.append(rgba)
    return colours


# ── MAIN BUILDER ─────────────────────────────────────────────────────────────
def build_sprott_c() -> None:
    # ── 1. clear scene ────────────────────────────────────────────────────
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    # ── 2. integrate canonical orbit ──────────────────────────────────────
    c_basis = PRESETS["Basis"]
    pts, spds = integrate(c_basis)

    # ── 3. Bishop frame & tube geometry ───────────────────────────────────
    N, B = bishop_frame(pts)
    verts, faces = build_tube(pts, N, B, TUBE_R, TUBE_SEGS)
    colours = speed_to_rgba(spds, TUBE_SEGS)

    # ── 4. create mesh ────────────────────────────────────────────────────
    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(verts.tolist(), [], faces)
    me.update()

    # ── 5. FLOAT_COLOR attribute (SprottC_Speed) ──────────────────────────
    # WHY FLOAT_COLOR not FLOAT:  FLOAT_COLOR carries RGBA in linear space
    # so the material can feed it directly into Emission without a gamma
    # conversion node.  Blender 5.x Geometry Nodes and shader nodes both
    # read FLOAT_COLOR via ShaderNodeAttribute name=ATTR_NAME.
    attr = me.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", [v for rgba in colours for v in rgba])

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    # ── 6. shape keys ─────────────────────────────────────────────────────
    # Basis is added first (Blender requires it as the reference key).
    ob.shape_key_add(name="Basis", from_mix=False)

    for sk_name, c_val in PRESETS.items():
        if sk_name == "Basis":
            continue
        sk_pts, sk_spds = integrate(c_val)
        sk_N, sk_B = bishop_frame(sk_pts)
        sk_verts, _ = build_tube(sk_pts, sk_N, sk_B, TUBE_R, TUBE_SEGS)
        sk_colours   = speed_to_rgba(sk_spds, TUBE_SEGS)

        sk = ob.shape_key_add(name=sk_name, from_mix=False)
        sk.data.foreach_set("co", sk_verts.flatten().tolist())

        # update per-shape-key colour (replaces the POINT attribute in-place)
        attr.data.foreach_set("color", [v for rgba in sk_colours for v in rgba])

    # Restore Basis colouring to the mesh attribute
    attr.data.foreach_set("color", [v for rgba in colours for v in rgba])

    # ── 7. poi head ───────────────────────────────────────────────────────
    # WHY a separate sphere object:  the tube endpoint is a sharp cut.
    # Appending a smooth sphere signals "poi head" to the holoflow exporter
    # which treats it as a separate visual element for VRM/WebXR instancing.
    centroid = pts.mean(axis=0)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R,
                                          location=tuple(centroid))
    poi = bpy.context.active_object
    poi.name = f"{OBJ_NAME}_PoiHead"

    # ── 8. material ───────────────────────────────────────────────────────
    # WHY Emission + BSDF:  Sprott attractors are lit by their own speed
    # gradient.  A pure BSDF would darken the cobalt regions; mixing 1.7×
    # emission ensures the full colour range is visible regardless of scene
    # lighting.  metallic=0.50 adds a soft specular highlight that reads
    # as "physical wire" in WebXR environments.
    mat = bpy.data.materials.new(f"{OBJ_NAME}_Mat")
    mat.use_nodes = True
    tree  = mat.node_tree
    nodes = tree.nodes
    links = tree.links
    nodes.clear()

    out  = nodes.new("ShaderNodeOutputMaterial")
    mix  = nodes.new("ShaderNodeMixShader")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    emit = nodes.new("ShaderNodeEmission")
    attr = nodes.new("ShaderNodeAttribute")

    attr.attribute_name = ATTR_NAME
    bsdf.inputs["Metallic"].default_value   = 0.50
    bsdf.inputs["Roughness"].default_value  = 0.22
    emit.inputs["Strength"].default_value   = 1.7
    mix.inputs["Fac"].default_value         = 0.35  # 35% emission, 65% BSDF

    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(attr.outputs["Color"], emit.inputs["Color"])
    links.new(bsdf.outputs["BSDF"],  mix.inputs[1])
    links.new(emit.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs["Shader"],  out.inputs["Surface"])

    ob.data.materials.append(mat)

    # ── 9. holoflow metadata ──────────────────────────────────────────────
    ob["holoflow:facet"]    = False
    ob["holoflow:category"] = "poi-head"

    # ── 10. +Y-up orientation for WebXR export ────────────────────────────
    # WHY rotate X by π/2:  Blender uses +Z-up; glTF/WebXR uses +Y-up.
    # Applying this rotation before export means downstream loaders receive
    # a coordinate-correct asset without any runtime correction.
    ob.rotation_euler = (math.pi / 2, 0.0, 0.0)
    bpy.ops.object.transform_apply(rotation=True)

    # ── 11. export GLB ────────────────────────────────────────────────────
    import os
    out_dir  = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..",
                             "..", "glbs", "scripting",
                             "python-numpy-sprott-c-attractor-1994-yz-xy-"
                             "dual-saddle-focus-shilnikov-rk4-bishop-tube-"
                             "poi-webxr")
    os.makedirs(out_dir, exist_ok=True)
    glb_path = os.path.join(out_dir, "hf_sprott_c_poi.glb")

    bpy.ops.export_scene.gltf(
        filepath            = glb_path,
        export_format       = "GLB",
        export_draco_mesh_compression_enable  = True,
        export_draco_mesh_compression_level   = 6,
        export_image_format = "WEBP",
        export_morph        = True,
        export_colors       = True,
    )
    print(f"[SprottC] GLB exported → {glb_path}")
    print(f"[SprottC] Mesh: {len(verts)} verts / {len(faces)} quads / "
          f"{len(PRESETS)} shape keys")


# ── RUN ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    build_sprott_c()
