"""
DIFFERENTIAL GROWTH — Laplacian Smoothing + Edge Refinement → Ruffle-Fan Poi Head
Blender 5.1  |  bpy + bmesh + numpy  |  CC0

Technique (2 sentences):
  A flat seeded disc is grown iteratively: boundary vertices expand faster than
  interior vertices, producing an incompatible reference metric that forces the
  mesh to buckle out-of-plane into organic ruffles.  At each step a
  uniform-graph Laplacian pass regularises vertex distribution and long edges
  are split at their midpoints, progressively refining the mesh as curvature
  accumulates — replicating the morphology of coral fans, ruffle skirts, and
  lettuce-leaf margins.

Mathematical basis:
  Uniform Laplacian operator on vertex i:  L v_i = (1/|N(i)|)Σ_{j∈N} v_j − v_i
  Growth step:     v_i ← v_i − g_i · L v_i       (push away from centroid)
  Smoothing step:  v_i ← v_i + λ · L v_i          (pull toward centroid)
  Net per step:    Δv_i = (λ − g_i) · L v_i
    • g_boundary >> g_interior → rim expands faster than centre
    • Incompatible growth ↔ non-zero Riemannian curvature tensor (Gauss 1827)
    • By the Theorema Egregium the reference metric cannot be embedded flat;
      the mesh buckles — exactly the Föppl-von Kármán thin-plate instability.
  Gauss-Bonnet reminder:  ∫_M K dA = 2π·χ(M).  For an open disc (χ=1, fixed
  boundary) fast boundary growth adds negative K at the rim — the integral
  constraint forces positive K to concentrate at the interior, driving ruffles.

Edge refinement:
  Subdivide edges whose current length exceeds MAX_EDGE_LEN.  This maintains
  mesh resolution as the surface expands, preventing aliasing of the emerging
  curvature field.  bmesh.ops.subdivide_edges inserts midpoint vertices and
  re-triangulates incident faces in one pass — no fill artefacts.

Failure modes / trade-offs:
  • GROWTH_BOUNDARY > 0.025 per step → explosive divergence (mesh folds through
    itself); keep ratio GROWTH_BOUNDARY / GROWTH_INTERIOR ≤ 5 for stability.
  • Too few SMOOTH_ITERS → tangled faces; too many → overdamped, shape is a
    boring mushroom rather than a coral fan.
  • MAX_EDGE_LEN too small → exponential face count; start with 0.18–0.22 m.
  • Flat Z-seed noise breaks symmetry; without it growth is perfectly radial and
    produces no ruffles on a perfectly flat disc.

Authors / licence:
  Blueprint written by Holoflow Studio (CC0).  Algorithm concept based on the
  public-domain differential growth technique described by Jesse Louis-Rosenberg
  & Jessica Rosenkrantz (Nervous System) and the MIT-licenced morphogenesis
  resource compendium by Jason Webb — see README.md for full attribution.
"""

import bpy, bmesh, numpy as np
from mathutils import Vector
import os

# ── PARAMETERS ─────────────────────────────────────────────────────────────────
SLUG             = "hf_diff_growth"
N_STEPS          = 160         # growth iterations (more → denser ruffles)
GROWTH_BOUNDARY  = 0.016       # boundary vertex expansion rate per step
GROWTH_INTERIOR  = 0.004       # interior vertex expansion rate per step
SMOOTH_FACTOR    = 0.40        # Laplacian damping  λ ∈ (0, 1)
SMOOTH_ITERS     = 3           # smoothing passes per growth step
MAX_EDGE_LEN     = 0.20        # split edges longer than this (metres)
SEED_SEGMENTS    = 40          # vertices on initial seed circle
SEED_RADIUS      = 0.50        # initial disc radius (metres)
SEED_NOISE       = 0.004       # Z-noise amplitude to break symmetry
# holoflow export convention: +Y up, 9.5 cm diameter poi head
EXPORT_DIAMETER  = 0.095       # metres


# ── UTILITIES ──────────────────────────────────────────────────────────────────
def clear_scene() -> None:
    """Remove all objects and meshes from the default scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)


def get_boundary_verts(bm: bmesh.types.BMesh) -> set:
    """
    Return the set of all vertices that belong to at least one boundary edge.
    A boundary edge has exactly one linked face (open mesh rim).
    Uses bmesh's built-in is_boundary flag — O(E) with no adjacency rebuild.
    """
    bm.edges.ensure_lookup_table()
    return {v for e in bm.edges if e.is_boundary for v in e.verts}


# ── SEED MESH ──────────────────────────────────────────────────────────────────
def make_seed_disc() -> bpy.types.Object:
    """
    Build a subdivided flat disc via bmesh data API (no ops / mode switching).
    Three subdivision levels give ~640 starting faces — enough resolution for
    Laplacian smoothing to produce a smooth curvature gradient without
    excessive triangle count at step 0.
    """
    bm = bmesh.new()

    # bmesh.ops.create_circle with cap_ends=True fills an ngon cap
    bmesh.ops.create_circle(bm, cap_ends=True, cap_tris=True,
                            radius=SEED_RADIUS, segments=SEED_SEGMENTS)

    # Three uniform subdivisions: each quadruples the triangle count
    for _ in range(3):
        bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=1,
                                  use_grid_fill=True, smooth=0.0)

    # Triangulate any quads that subdivide_edges may have introduced
    bmesh.ops.triangulate(bm, faces=list(bm.faces))

    # Small Z-noise: breaks perfect radial symmetry so growth produces
    # varied ruffle patterns rather than a rotationally symmetric dome
    rng = np.random.default_rng(42)
    zn = rng.uniform(-SEED_NOISE, SEED_NOISE, len(bm.verts))
    for i, v in enumerate(bm.verts):
        v.co.z = float(zn[i])

    me = bpy.data.meshes.new(SLUG + "_mesh")
    bm.to_mesh(me)
    bm.free()

    obj = bpy.data.objects.new(SLUG, me)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj


# ── GROWTH STEP ────────────────────────────────────────────────────────────────
def growth_step(bm: bmesh.types.BMesh, boundary: set) -> None:
    """
    Push each pair of vertices along their shared edge away from each other.
    Displacement = (growth_rate × edge_length × 0.5) per vertex, equal and
    opposite — conserves the centroid so the poi head stays centred at origin.

    WHY equal-and-opposite?  Each edge contributes twice (once per vert).
    Equal-and-opposite ensures no net translational drift accumulates over
    hundreds of steps — critical for stable long simulations.
    """
    disp = {v: Vector((0.0, 0.0, 0.0)) for v in bm.verts}

    for edge in bm.edges:
        v0, v1 = edge.verts
        diff = v1.co - v0.co
        L = diff.length
        if L < 1e-9:
            continue
        unit = diff / L
        g0 = GROWTH_BOUNDARY if v0 in boundary else GROWTH_INTERIOR
        g1 = GROWTH_BOUNDARY if v1 in boundary else GROWTH_INTERIOR
        g  = (g0 + g1) * 0.5       # edge-average growth rate
        delta = unit * (L * g * 0.5)
        disp[v0] -= delta           # v0 moves away from v1
        disp[v1] += delta           # v1 moves away from v0

    for v in bm.verts:
        v.co += disp[v]


# ── LAPLACIAN SMOOTHING ────────────────────────────────────────────────────────
def laplacian_smooth(bm: bmesh.types.BMesh) -> None:
    """
    Uniform-graph Laplacian smoothing: move each vertex a fraction SMOOTH_FACTOR
    toward the average of its one-ring neighbours.

    WHY uniform (not cotangent)?  Cotangent weights improve curvature flow
    accuracy (see Crane 2013) but require recomputing angles each step.  For
    differential growth the goal is vertex distribution, not curvature
    measurement, so uniform weights give equivalent visual results with O(V)
    rather than O(V + face_area_sum) cost.
    """
    snapshot = {v: v.co.copy() for v in bm.verts}
    for v in bm.verts:
        nbrs = [e.other_vert(v) for e in v.link_edges]
        if not nbrs:
            continue
        centroid = sum((snapshot[n] for n in nbrs), Vector()) / len(nbrs)
        v.co = v.co.lerp(centroid, SMOOTH_FACTOR)


# ── EDGE REFINEMENT ────────────────────────────────────────────────────────────
def refine_long_edges(bm: bmesh.types.BMesh) -> None:
    """
    Subdivide edges longer than MAX_EDGE_LEN (midpoint insertion).
    bmesh.ops.subdivide_edges handles the face-splitting and triangulation
    consistently; use_grid_fill=True produces quads which we re-triangulate.
    """
    long = [e for e in bm.edges if e.calc_length() > MAX_EDGE_LEN]
    if not long:
        return
    result = bmesh.ops.subdivide_edges(bm, edges=long, cuts=1,
                                       use_grid_fill=True, smooth=0.0)
    # Triangulate any quads created by grid fill to keep the mesh homogeneous
    new_faces = [f for f in result.get('geom', [])
                 if isinstance(f, bmesh.types.BMFace) and len(f.verts) == 4]
    if new_faces:
        bmesh.ops.triangulate(bm, faces=new_faces)


# ── MATERIAL ───────────────────────────────────────────────────────────────────
def add_coral_material(obj: bpy.types.Object) -> None:
    """
    Gradient material driven by vertex Z-height: deep magenta at the base,
    cream-white at mid height, vivid cyan at the tips.
    Cel-shade look via a two-band colour ramp — matches Holoflow's faceted style.
    """
    mat = bpy.data.materials.new(SLUG + "_mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    geom   = nodes.new('ShaderNodeNewGeometry')
    sep    = nodes.new('ShaderNodeSeparateXYZ')
    rng_nd = nodes.new('ShaderNodeMapRange')
    ramp   = nodes.new('ShaderNodeValToRGB')
    bsdf   = nodes.new('ShaderNodeBsdfPrincipled')
    out    = nodes.new('ShaderNodeOutputMaterial')

    # Map world Z from [−0.2, 0.6] → [0, 1]
    rng_nd.inputs['From Min'].default_value = -0.20
    rng_nd.inputs['From Max'].default_value =  0.60
    rng_nd.clamp = True

    # Colour ramp: deep magenta → cream → cyan
    ramp.color_ramp.interpolation = 'CARDINAL'
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.72, 0.05, 0.42, 1.0)   # magenta
    ramp.color_ramp.elements.new(0.5).color = (0.95, 0.92, 0.80, 1.0)  # cream
    ramp.color_ramp.elements[2].position = 1.0
    ramp.color_ramp.elements[2].color = (0.05, 0.82, 0.80, 1.0)   # cyan

    bsdf.inputs['Roughness'].default_value = 0.65

    links.new(geom.outputs['Position'], sep.inputs['Vector'])
    links.new(sep.outputs['Z'],         rng_nd.inputs['Value'])
    links.new(rng_nd.outputs['Result'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'],    bsdf.inputs['Base Color'])
    links.new(bsdf.outputs['BSDF'],     out.inputs['Surface'])

    obj.data.materials.append(mat)


# ── MAIN SIMULATION LOOP ───────────────────────────────────────────────────────
def run_simulation(obj: bpy.types.Object) -> None:
    me = obj.data
    for step in range(N_STEPS):
        bm = bmesh.new()
        bm.from_mesh(me)
        bm.verts.ensure_lookup_table()

        boundary = get_boundary_verts(bm)     # recompute after each refinement

        growth_step(bm, boundary)

        for _ in range(SMOOTH_ITERS):
            laplacian_smooth(bm)

        refine_long_edges(bm)

        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(me)
        bm.free()

        if (step + 1) % 20 == 0:
            print(f"  step {step+1}/{N_STEPS}  verts={len(me.vertices)}")

    me.update()


# ── SCALE TO POI HEAD SIZE ─────────────────────────────────────────────────────
def scale_to_poi(obj: bpy.types.Object) -> None:
    """
    Rescale so the XY bounding box spans EXPORT_DIAMETER, centre at origin.
    Apply all transforms before export (Holoflow convention).
    """
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    current_dia = max(max(xs) - min(xs), max(ys) - min(ys))
    if current_dia < 1e-6:
        return
    s = EXPORT_DIAMETER / current_dia
    obj.scale = (s, s, s)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


# ── EXPORT ─────────────────────────────────────────────────────────────────────
def export_glb(obj: bpy.types.Object) -> None:
    base = os.path.dirname(os.path.abspath(__file__))
    glb_dir = os.path.join(base, "..", "..", "..", "..",
                           "glbs", "scripting",
                           "python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr")
    os.makedirs(glb_dir, exist_ok=True)
    out = os.path.join(glb_dir, f"{SLUG}.glb")
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )
    print(f"Exported → {out}")


# ── ENTRY POINT ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    clear_scene()
    obj = make_seed_disc()
    print(f"Seed: {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces")
    print(f"Running {N_STEPS} growth steps …")
    run_simulation(obj)
    print(f"Final mesh: {len(obj.data.vertices)} verts, {len(obj.data.polygons)} faces")
    scale_to_poi(obj)
    add_coral_material(obj)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.path.dirname(__file__), f"{SLUG}.blend"))
    export_glb(obj)
    print("Done.")
