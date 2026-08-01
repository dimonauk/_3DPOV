# ─────────────────────────────────────────────────────────────────────────────
# Space Colonisation Algorithm — Branching Coral Skeleton as Bevel-NURBS GLB
# Algorithm: Runions, Lane & Prusinkiewicz (2007) — Eurographics Workshop on
#            Natural Phenomena. Mathematical algorithm = public domain.
# Blender 5.1 · Python 3.11 · numpy
# Run from Blender Scripting workspace (Text Editor → Run Script).
# ─────────────────────────────────────────────────────────────────────────────

import bpy
import numpy as np
from mathutils import Vector

# ── PARAMETERS ─────────────────────────────────────────────────────────────
SEED          = 42
N_ATTRACTORS  = 500          # hemisphere shell of coral-polyp "food" points
DOME_RADIUS   = 1.5          # m — crown half-width
DOME_BASE_Z   = 0.55         # m — hemisphere base height
D             = 0.09         # segment step length (m)
D_INFLUENCE   = 5.5 * D      # attractor reach    (0.495 m)
D_KILL        = 1.7 * D      # attractor kill     (0.153 m)
MAX_ITER      = 280
TRUNK_SEGS    = 7            # root spine below dome base
BEVEL_DEPTH   = 0.012        # tube radius at leaf tips
TAPER_FACTOR  = 4.0          # root bevel is TAPER_FACTOR × BEVEL_DEPTH
OBJ_NAME      = "hf_coral_sca"
MAT_NAME      = "mat_coral"
GLB_OUT       = "//hf_coral_sca.glb"

# WHY D_INFLUENCE > D_KILL: the gap (D_INFLUENCE - D_KILL) ≈ 3.8 × D is the
# "dead zone" ahead of each tip. A tip grows INTO the dead zone on each step,
# committing to a direction before killing its attractors. Without this gap
# (D_KILL ≥ D_INFLUENCE) every tip would kill its only attractor on first
# contact, producing a stubby unbranched spine.

# WHY normalise the mean attractor direction: multiple attractors pull one tip;
# normalising collapses the magnitude so each step has identical length D,
# keeping the skeleton uniform. Without normalisation, tips near large attractor
# clusters would take longer steps, breaking the even branch-length constraint.


# ── ATTRACTOR CLOUD ─────────────────────────────────────────────────────────

def make_attractor_cloud(rng):
    """Uniform hemispherical shell — mimics coral polyp distribution."""
    pts = []
    batch = N_ATTRACTORS * 4
    while len(pts) < N_ATTRACTORS:
        # Marsaglia (1972) sphere sampling: normalise Gaussian vectors
        v = rng.standard_normal((batch, 3))
        v /= np.linalg.norm(v, axis=1, keepdims=True)
        v = v[v[:, 2] > 0]           # upper hemisphere
        pts.extend(v.tolist())
    pts = np.array(pts[:N_ATTRACTORS], dtype=np.float64) * DOME_RADIUS
    pts[:, 2] += DOME_BASE_Z
    return pts


# ── SCA CORE LOOP ───────────────────────────────────────────────────────────

def run_sca(attractors, root_nodes):
    """
    Grows a branching skeleton toward the attractor cloud.

    Returns
    -------
    nodes   : (N,3) float64 — all branch-node positions
    parents : (N,)  int32  — parents[i] = parent index, -1 for roots
    """
    nodes   = np.array(root_nodes, dtype=np.float64)
    parents = np.full(len(nodes), -1, dtype=np.int32)
    attrs   = attractors.copy()

    d_i2 = D_INFLUENCE ** 2
    d_k2 = D_KILL      ** 2

    for _it in range(MAX_ITER):
        if len(attrs) == 0:
            break

        m, n = len(attrs), len(nodes)

        # Squared-distance matrix: attrs (m) × nodes (n)
        # Broadcasting over 3D positions — O(m·n) but feasible for m≤500, n≤1500
        diff  = attrs[:, np.newaxis, :] - nodes[np.newaxis, :, :]  # (m,n,3)
        dist2 = np.einsum("ijk,ijk->ij", diff, diff)               # (m,n)

        # ── Kill attractors within D_KILL of any node ──
        alive = dist2.min(axis=1) >= d_k2
        if not alive.all():
            attrs = attrs[alive]
            dist2 = dist2[alive]
            diff  = diff[alive]
        if len(attrs) == 0:
            break

        # ── For each attractor: find nearest node; check in-range ──
        nn      = dist2.argmin(axis=1)           # (m,) — nearest node index
        in_rng  = dist2[np.arange(len(attrs)), nn] < d_i2  # (m,) bool

        # ── Scatter-add normalised directions to growth_dir[node] ──
        growth_dir = np.zeros((len(nodes), 3), dtype=np.float64)
        counts     = np.zeros(len(nodes),     dtype=np.int32)

        act   = np.where(in_rng)[0]
        v_act = attrs[act] - nodes[nn[act]]          # (k,3)
        nrm   = np.linalg.norm(v_act, axis=1, keepdims=True)
        safe  = (nrm[:, 0] > 1e-12)
        v_act[safe] /= nrm[safe]

        np.add.at(growth_dir, nn[act], v_act)
        np.add.at(counts,     nn[act], safe.astype(np.int32))

        # ── Grow new nodes ──
        growing = np.where(counts > 0)[0]
        if not growing.size:
            break

        dirs  = growth_dir[growing]
        nrm2  = np.linalg.norm(dirs, axis=1, keepdims=True)
        nrm2  = np.where(nrm2 < 1e-12, 1.0, nrm2)
        dirs /= nrm2

        new_pos = nodes[growing] + dirs * D
        nodes   = np.vstack([nodes, new_pos])
        parents = np.concatenate([parents, growing.astype(np.int32)])

    return nodes, parents


# ── BRANCH PATH EXTRACTION ──────────────────────────────────────────────────

def extract_leaf_to_root_paths(nodes, parents):
    """Return a list of node-index lists, each tracing root → leaf."""
    n = len(nodes)
    children = [[] for _ in range(n)]
    for i, p in enumerate(parents):
        if p >= 0:
            children[p].append(i)

    leaves = [i for i in range(n) if not children[i]]
    paths  = []
    for leaf in leaves:
        chain = []
        cur   = leaf
        while cur >= 0:
            chain.append(cur)
            cur = int(parents[cur])
        paths.append(list(reversed(chain)))

    # Prune trivial paths (single-node "leaves" at root level)
    return [p for p in paths if len(p) >= 3]


# ── BLENDER OBJECT ASSEMBLY ─────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def build_curve_object(nodes, paths):
    """Build a NURBS curve with one spline per branch path, tapered bevel."""
    crv = bpy.data.curves.new(OBJ_NAME, type="CURVE")
    crv.dimensions      = "3D"
    crv.resolution_u    = 12
    crv.bevel_depth     = BEVEL_DEPTH
    crv.bevel_resolution = 4
    crv.use_fill_caps   = True

    for path in paths:
        coords = nodes[path]          # (L,3)
        sp = crv.splines.new("NURBS")
        sp.points.add(len(coords) - 1)  # spline starts with 1 point
        for j, (x, y, z) in enumerate(coords):
            sp.points[j].co = (x, y, z, 1.0)   # NURBS needs W=1
        sp.order_u     = min(4, len(coords))
        sp.use_endpoint_u = True   # clamp endpoints to first/last control point
        sp.use_smooth  = True

    obj = bpy.data.objects.new(OBJ_NAME, crv)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    return obj


def assign_material(obj):
    """Coral emission material: warm magenta glow."""
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value  = (1.0, 0.25, 0.55, 1.0)  # magenta coral
    emit.inputs["Strength"].default_value = 2.5

    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    obj.data.materials.append(mat)


def export_glb(obj):
    """Draco-6 GLB export, +Y up, transforms applied."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath          = bpy.path.abspath(GLB_OUT),
        use_selection     = True,
        export_apply      = True,
        export_yup        = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
    )
    print(f"[SCA] GLB exported → {GLB_OUT}")


# ── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    rng = np.random.default_rng(SEED)

    print("[SCA] Generating attractor cloud …")
    attractors = make_attractor_cloud(rng)

    # Root spine: vertical trunk from z=0 to DOME_BASE_Z
    z_steps    = np.linspace(0.0, DOME_BASE_Z, TRUNK_SEGS + 1)
    root_nodes = [[0.0, 0.0, z] for z in z_steps]

    print(f"[SCA] Running SCA — {N_ATTRACTORS} attractors, max {MAX_ITER} iter …")
    nodes, parents = run_sca(attractors, root_nodes)
    print(f"[SCA] Tree built: {len(nodes)} nodes")

    paths = extract_leaf_to_root_paths(nodes, parents)
    print(f"[SCA] Branch paths: {len(paths)}")

    clear_scene()
    obj = build_curve_object(nodes, paths)
    assign_material(obj)

    bpy.context.scene.frame_set(1)

    export_glb(obj)
    print("[SCA] Done.")


main()
