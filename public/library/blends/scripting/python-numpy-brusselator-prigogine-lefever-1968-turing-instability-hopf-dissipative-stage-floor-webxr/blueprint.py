"""
Brusselator Reaction-Diffusion — Blender 5.1 Blueprint
=======================================================
Prigogine & Lefever 1968 (Université Libre de Bruxelles, J Chem Phys 48(4):1695)
Nobel Prize in Chemistry 1977 (Prigogine) — theory of dissipative structures.

Model (two-variable trimolecular oscillator):
  ∂U/∂t = D_u·∇²U + A − (B+1)U + U²V       (activator, slow diffuser)
  ∂V/∂t = D_v·∇²V + BU − U²V                (inhibitor, fast diffuser)

Steady state: U* = A,  V* = B/A
Jacobian at (U*, V*):  J = [[B−1,  A²], [−B, −A²]]
  tr(J)  = B − 1 − A²   →  Hopf bifurcation at B = 1 + A²
  det(J) = A² > 0        always (no saddle, Descartes condition OK)

Turing instability requires ALL of:
  1. B < 1 + A²                              (SS stable without diffusion)
  2. D_v(B−1) − D_u·A² > 0                  (differential diffusion breaks symmetry)
  3. (D_v(B−1) − D_u·A²)² > 4·D_u·D_v·A²   (discriminant → negative h(k²_c))

Critical wavenumber: k²_c = (D_v(B−1) − D_u·A²) / (2·D_u·D_v)
Pattern wavelength:  Λ_c = 2π / √k²_c  (in simulation grid units)

Produces: 80×80 stage-floor height field; normalised U drives height + vertex colour.
Four shape keys: labyrinthine / hexagonal spots / Hopf snapshot / dense labyrinth.
Vertex colour: Brussel_U (FLOAT_COLOR POINT, cobalt→amber).
"""
import bpy, bmesh, numpy as np, math

# ── Named constants ────────────────────────────────────────────────────────
N            = 80      # grid resolution (N×N vertices, (N−1)² quads = 6241)
PHYS_SIZE    = 0.25    # half-extent in metres → 0.50 m wide floor
DT           = 0.002   # time step: explicit-Euler stability DT < DX²/(4·D_v)
                       # worst case: DX=1 D_v=8 → limit≈0.031; DT=0.002 gives 15× margin
N_WARMUP     = 2000    # burn-in: spreads perturbation, avoids transient front artefacts
N_STEPS      = 5000    # main run: patterns crystallise fully by t=14 normalised units
SEED         = 42
HEIGHT_SCALE = 0.028   # max z displacement in metres (normalised U=1 → z=28 mm)
FLOOR_NAME   = "Brussel_Floor"

# Brusselator parameter sets — (A, B, D_u, D_v)
# Turing k²_c formula: (D_v(B−1) − D_u·A²) / (2·D_u·D_v)
PARAM_SETS = {
    "Basis":    (2.0, 3.8, 1.0, 8.0),  # labyrinthine stripes: k²_c≈1.15  Λ≈5.9 units
    "SK_Spots": (3.0, 5.5, 1.0, 8.0),  # hexagonal spots:      k²_c≈1.69  Λ≈4.8 units
    "SK_Hopf":  (1.0, 2.5, 1.0, 1.0),  # Hopf regime (B=2.5>1+A²=2), D_u=D_v → no Turing
    "SK_Dense": (2.0, 4.5, 0.5, 8.0),  # dense labyrinth:      k²_c≈3.25  Λ≈3.5 units
}

COL_LOW  = (0.04, 0.14, 0.72)   # cobalt  — activator peak (U high)
COL_HIGH = (0.90, 0.54, 0.06)   # amber   — activator trough
ATTR_NAME = "Brussel_U"


# ── Brusselator integrator ─────────────────────────────────────────────────
def run_brusselator(A: float, B: float, D_u: float, D_v: float) -> np.ndarray:
    """
    Explicit-Euler integration on N×N periodic grid, returns U field at end.

    WHY np.roll for Laplacian: clean periodic BC with zero extra imports;
    five-point stencil ∇²U[i,j] ≈ U[i+1]+U[i-1]+U[j+1]+U[j-1]−4U[i,j].

    WHY simultaneous update (not in-place): explicit Euler correctness requires
    both U_new and V_new to be computed from the OLD U and V.  In-place update
    of U before computing V_new silently produces Gauss-Seidel order, which
    changes dynamics when DT is non-negligible.

    WHY U²V not UV²: Brusselator autocatalytic step is 2U+V → 3U, so the rate
    is proportional to [U]²[V] = U·U·V.  Gray-Scott uses U·V²; the two models
    are NOT interchangeable despite superficial similarity.

    WHY clip(0): concentrations are non-negative; numerical noise at steep
    gradients can produce tiny negatives that compound exponentially — clip
    prevents divergence without altering converged patterns.
    """
    rng = np.random.default_rng(SEED)
    U = np.full((N, N), A,     dtype=np.float64)
    V = np.full((N, N), B / A, dtype=np.float64)

    # Symmetry-breaking: 20×20 random patch (WHY: uniform IC stays at (A, B/A) forever)
    c, h = N // 2, 10
    U[c-h:c+h, c-h:c+h] += rng.uniform(-0.05 * A,    0.05 * A,    (2*h, 2*h))
    V[c-h:c+h, c-h:c+h] += rng.uniform(-0.05 * B/A,  0.05 * B/A,  (2*h, 2*h))

    for _ in range(N_WARMUP + N_STEPS):
        lU = (np.roll(U, 1, 0) + np.roll(U, -1, 0)
            + np.roll(U, 1, 1) + np.roll(U, -1, 1) - 4.0 * U)
        lV = (np.roll(V, 1, 0) + np.roll(V, -1, 0)
            + np.roll(V, 1, 1) + np.roll(V, -1, 1) - 4.0 * V)
        U2V = U * U * V                                      # trimolecular term
        U_new = U + DT * (D_u * lU + A - (B + 1.0) * U + U2V)
        V_new = V + DT * (D_v * lV + B * U - U2V)
        U, V  = U_new.clip(0.0, None), V_new.clip(0.0, None)
    return U


def _normalise(field: np.ndarray) -> np.ndarray:
    """Map field range to [0,1] for consistent height scale across param sets."""
    lo, hi = field.min(), field.max()
    return (field - lo) / (hi - lo + 1.0e-12)


# ── Grid coordinates ────────────────────────────────────────────────────────
xs = np.linspace(-PHYS_SIZE, PHYS_SIZE, N)
ys = np.linspace(-PHYS_SIZE, PHYS_SIZE, N)
GX, GY = np.meshgrid(xs, ys, indexing="ij")   # (N,N) each

def _verts(U_norm: np.ndarray) -> list:
    z = (U_norm.ravel() * HEIGHT_SCALE).tolist()
    return list(zip(GX.ravel().tolist(), GY.ravel().tolist(), z))

def _faces() -> list:
    faces = []
    for i in range(N - 1):
        for j in range(N - 1):
            a = i * N + j
            faces.append((a, a + 1, a + N + 1, a + N))
    return faces


# ── Build Basis mesh ────────────────────────────────────────────────────────
U_basis = _normalise(run_brusselator(*PARAM_SETS["Basis"]))

me = bpy.data.meshes.new(FLOOR_NAME)
ob = bpy.data.objects.new(FLOOR_NAME, me)
bpy.context.collection.objects.link(ob)
bpy.context.view_layer.objects.active = ob

me.from_pydata(_verts(U_basis), [], _faces())
me.update()

for poly in me.polygons:
    poly.use_smooth = False       # holoflow:facet convention — deliberate flat shading


# ── Vertex colour attribute (FLOAT_COLOR POINT) ────────────────────────────
attr = me.attributes.new(name=ATTR_NAME, type="FLOAT_COLOR", domain="POINT")

def _colours(U_norm: np.ndarray) -> np.ndarray:
    """Vectorised cobalt→amber gradient on normalised U ∈ [0,1]."""
    t   = U_norm.ravel()[:, None].astype(np.float32)
    lo  = np.array(COL_LOW,  dtype=np.float32)
    hi  = np.array(COL_HIGH, dtype=np.float32)
    col = (1.0 - t) * lo + t * hi
    # WHY invert: activator-HIGH (U→1 normalised) → cobalt; trough → amber.
    # Reversing the lerp direction (hi first) would put hot colour on peaks.
    rgba = np.hstack([col, np.ones((N * N, 1), dtype=np.float32)])
    return rgba.ravel()

attr.data.foreach_set("color", _colours(U_basis))
me.update()


# ── Shape keys ──────────────────────────────────────────────────────────────
ob.shape_key_add(name="Basis", from_mix=False)

def _add_shape_key(sk_name: str, param_key: str) -> None:
    """
    Run a fresh simulation, write positions via foreach_set (bulk C-side write).
    WHY foreach_set: ~100× faster than per-vertex Python assignment; mandatory
    at N=256+ where the Python loop would stall for tens of seconds.
    WHY float32 cast: Blender 5.1 stores shape-key data in float32; passing
    float64 silently truncates without raising an error.
    """
    U_sk = _normalise(run_brusselator(*PARAM_SETS[param_key]))
    sk   = ob.shape_key_add(name=sk_name, from_mix=False)
    z_sk = U_sk.ravel() * HEIGHT_SCALE
    pos  = np.column_stack([GX.ravel(), GY.ravel(), z_sk]).astype(np.float32)
    sk.data.foreach_set("co", pos.ravel())
    me.update()

_add_shape_key("SK_Spots", "SK_Spots")
_add_shape_key("SK_Hopf",  "SK_Hopf")
_add_shape_key("SK_Dense", "SK_Dense")


# ── Material ────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(name="Brussel_Mat")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
nodes.clear()

# WHY ShaderNodeAttribute: reads FLOAT_COLOR at render time → colour updates
# automatically as shape-key morphs change the active key without re-baking.
attr_nd = nodes.new("ShaderNodeAttribute")
attr_nd.attribute_name = ATTR_NAME
attr_nd.location = (-400, 0)

bsdf = nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (-80, 0)
bsdf.inputs["Metallic"].default_value          = 0.45
bsdf.inputs["Roughness"].default_value         = 0.28
bsdf.inputs["Emission Strength"].default_value = 1.6

out = nodes.new("ShaderNodeOutputMaterial")
out.location = (220, 0)

links.new(attr_nd.outputs["Color"], bsdf.inputs["Base Color"])
links.new(attr_nd.outputs["Color"], bsdf.inputs["Emission Color"])
links.new(bsdf.outputs["BSDF"],     out.inputs["Surface"])
ob.data.materials.append(mat)


# ── Holoflow metadata + WebXR transform ─────────────────────────────────────
ob["holoflow:facet"]       = True
ob["holoflow:category"]    = "stage-floor"
ob["holoflow:topic"]       = "brusselator-rd"
ob["holoflow:export_name"] = "brussel_floor"

# +Y-up convention: rotate so the XY floor plane faces +Y in WebXR runtime
ob.rotation_euler = (math.radians(-90), 0.0, 0.0)
bpy.ops.object.select_all(action="DESELECT")
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.object.transform_apply(rotation=True)

print(
    f"✓ {FLOOR_NAME}: {N*N}V  {(N-1)**2}Q | "
    "Basis · SK_Spots · SK_Hopf · SK_Dense | "
    f"{ATTR_NAME} FLOAT_COLOR | Brussel_Mat"
)
