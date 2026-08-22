"""
Python bpy.types.LaplacianSmoothModifier
-----------------------------------------
Uniform vs cotangent-weighted Laplacian smoothing, volume-preserving
iteration, and vertex-group masking — applied to a faceted VRM body-panel
after a destructive cut, then exported as a clean WebXR GLB.

Technique overview
------------------
The Laplacian smooth modifier repositions each vertex toward the weighted
average (centroid) of its one-ring neighbours, iterated N times.

  use_normalized = False  →  uniform weights (each neighbour = 1/N)
                              fast; pulls sharp tips inward; small quads
                              shrink faster than large ones (area bias)

  use_normalized = True   →  cotangent weights (each edge weighted by
                              cot(α) + cot(β) for the two angles opposite
                              it in adjacent triangles). Area-normalised,
                              no volume bias; preferred for organic meshes.

  use_volume_preserve     →  after each smoothing pass rescales the mesh
                              uniformly so volume matches the previous pass.
                              Prevents the classic "soap-bubble shrink"
                              at high iteration counts.

  lambda_factor           →  blend factor [0,1] — how far each vertex
                              moves toward the weighted centroid each pass.
                              0.5 is the standard Taubin λ; lower values
                              with more iterations give a smoother result.

  vertex_group            →  restrict smoothing to weighted faces; weight
                              1.0 = full smoothing, 0.0 = pinned (unaffected).

Studio use case
---------------
After a mesh boolean or destructive cut the result often has jagged edges
and uneven face areas. Running 4–6 iterations of normalised Laplacian
smooth with volume-preserve restores organic flow without changing the
overall silhouette. The vertex-group mask protects seam edges from moving
so UV islands stay valid.
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ---------------------------------------------------------------------------
# Parameters — edit these at the top, not scattered through the code
# ---------------------------------------------------------------------------
SLUG          = "hf_lapsmooth_panel"
ITERATIONS    = 6          # smoothing passes
LAMBDA_FACTOR = 0.5        # blend weight per pass (standard Taubin value)
USE_NORMALIZED      = True  # cotangent weights — correct for organic meshes
USE_VOLUME_PRESERVE = True  # prevent soap-bubble shrinkage
SEAM_GROUP    = "smooth_mask"  # vertex group that PINS seam-ring vertices
OUTPUT_DIR    = "//"           # same folder as .blend

PANEL_SEGS_H  = 12   # horizontal edge loops on the panel cylinder
PANEL_SEGS_V  = 8    # vertical edge loops
PANEL_RADIUS  = 0.28  # metres — VRM shoulder-width scale
PANEL_HEIGHT  = 0.42  # metres


# ---------------------------------------------------------------------------
# 1. Clean scene
# ---------------------------------------------------------------------------
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for mesh in list(bpy.data.meshes):
    bpy.data.meshes.remove(mesh)
for mat in list(bpy.data.materials):
    bpy.data.materials.remove(mat)


# ---------------------------------------------------------------------------
# 2. Build a cylindrical body-panel mesh via bmesh
#    We add deliberate faceting (flat shading) and a ragged equator cut
#    to simulate what a boolean operation leaves behind.
# ---------------------------------------------------------------------------
def build_panel_mesh():
    """Faceted cylinder with a wavy equator that mimics boolean residue."""
    bm = bmesh.new()

    verts = []
    for row in range(PANEL_SEGS_V + 1):
        t = row / PANEL_SEGS_V
        y = -PANEL_HEIGHT / 2 + t * PANEL_HEIGHT

        # Wavy perturbation on the equatorial rows to simulate ragged cut
        wave = 0.0
        if 0.3 < t < 0.7:
            angle_offset = t * math.pi * 6
            wave = math.sin(angle_offset) * 0.05

        ring = []
        for col in range(PANEL_SEGS_H):
            angle = (col / PANEL_SEGS_H) * 2 * math.pi
            r = PANEL_RADIUS + wave
            x = r * math.cos(angle)
            z = r * math.sin(angle)
            ring.append(bm.verts.new(Vector((x, y, z))))
        verts.append(ring)

    bm.verts.ensure_lookup_table()

    for row in range(PANEL_SEGS_V):
        for col in range(PANEL_SEGS_H):
            v0 = verts[row][col]
            v1 = verts[row][(col + 1) % PANEL_SEGS_H]
            v2 = verts[row + 1][(col + 1) % PANEL_SEGS_H]
            v3 = verts[row + 1][col]
            bm.faces.new([v0, v1, v2, v3])

    bm.normal_update()

    # Cap the top and bottom with star-polygon fans (introduces n-gons)
    for cap_row, y in [(0, -PANEL_HEIGHT / 2), (PANEL_SEGS_V, PANEL_HEIGHT / 2)]:
        pole = bm.verts.new(Vector((0.0, y, 0.0)))
        for col in range(PANEL_SEGS_H):
            if cap_row == 0:
                a, b = verts[0][col], verts[0][(col + 1) % PANEL_SEGS_H]
                bm.faces.new([pole, b, a])
            else:
                a, b = verts[-1][col], verts[-1][(col + 1) % PANEL_SEGS_H]
                bm.faces.new([pole, a, b])

    bm.normal_update()

    mesh = bpy.data.meshes.new(SLUG)
    bm.to_mesh(mesh)
    bm.free()

    # Flat shading — faceted studio aesthetic
    for poly in mesh.polygons:
        poly.use_smooth = False

    return mesh


mesh = build_panel_mesh()
obj = bpy.data.objects.new(SLUG, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)


# ---------------------------------------------------------------------------
# 3. Create vertex group that PINS the two end-cap rings (seam protection)
#    Smoothing is masked: group weight 0.0 = do not move.
#    This prevents UV seam vertices from drifting during smoothing passes.
# ---------------------------------------------------------------------------
vg = obj.vertex_groups.new(name=SEAM_GROUP)

# Collect seam vertex indices — top and bottom cap rings
seam_indices = []
bm_pin = bmesh.new()
bm_pin.from_mesh(mesh)
bm_pin.verts.ensure_lookup_table()

cap_ring_top = [v.index for v in bm_pin.verts if v.co.y > PANEL_HEIGHT / 2 - 0.02]
cap_ring_bot = [v.index for v in bm_pin.verts if v.co.y < -PANEL_HEIGHT / 2 + 0.02]
seam_indices = cap_ring_top + cap_ring_bot
bm_pin.free()

# All non-seam vertices get weight 1.0 (full smooth)
all_indices = list(range(len(mesh.vertices)))
smooth_indices = [i for i in all_indices if i not in seam_indices]
vg.add(smooth_indices, 1.0, 'REPLACE')
vg.add(seam_indices,   0.0, 'REPLACE')   # pins the seams


# ---------------------------------------------------------------------------
# 4. Material — violet VRM panel with rim highlight
# ---------------------------------------------------------------------------
mat = bpy.data.materials.new(f"{SLUG}_mat")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

tc   = nt.nodes.new('ShaderNodeTexCoord')
sep  = nt.nodes.new('ShaderNodeSeparateXYZ')
ramp = nt.nodes.new('ShaderNodeValToRGB')
bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
out  = nt.nodes.new('ShaderNodeOutputMaterial')

nt.links.new(tc.outputs['Normal'], sep.inputs['Vector'])
nt.links.new(sep.outputs['Y'], ramp.inputs['Fac'])
ramp.color_ramp.interpolation = 'LINEAR'
ramp.color_ramp.elements[0].color = (0.08, 0.04, 0.18, 1.0)  # deep violet
ramp.color_ramp.elements[1].color = (0.55, 0.25, 0.90, 1.0)  # bright violet

nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Metallic'].default_value = 0.6
bsdf.inputs['Roughness'].default_value = 0.35
nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
mesh.materials.append(mat)


# ---------------------------------------------------------------------------
# 5. Add LaplacianSmoothModifier
#    This is a non-destructive modifier, distinct from:
#    - bmesh.ops.smooth_laplacian_vert  (destructive, in-bmesh)
#    - CorrectiveSmoothModifier          (anchors to bind pose)
#    - SmoothByAngle modifier            (controls split normals, not geometry)
# ---------------------------------------------------------------------------
mod = obj.modifiers.new(name="LapSmooth", type='LAPLACIANSMOOTH')

# Number of iterations — each pass moves vertices fraction lambda toward centroid
mod.iterations = ITERATIONS

# Cotangent-weighted (area-normalised) vs uniform-weighted
# use_normalized=True is mathematically correct for irregular meshes and
# avoids the area-bias where small quads shrink faster than large ones.
mod.use_normalized = USE_NORMALIZED

# Rescale per-pass to match previous-pass volume — prevents shrinkage
mod.use_volume_preserve = USE_VOLUME_PRESERVE

# How far each vertex moves toward the weighted centroid each pass.
# 0.5 is the Taubin λ — low enough to avoid ringing at the first pass.
mod.lambda_factor = LAMBDA_FACTOR

# Separate smooth-XY and smooth-Z if anisotropic surface response is needed.
# For uniform organic smoothing all three axes must be True (default).
mod.use_x = True
mod.use_y = True
mod.use_z = True

# Vertex group mask — only vertices with weight > 0 are smoothed.
# The seam ring has weight 0.0 so it is pinned while the body flows.
mod.vertex_group = SEAM_GROUP


# ---------------------------------------------------------------------------
# 6. Demonstrate iteration effect by baking three snapshots
#    Each snapshot freezes the modifier at a different iteration count,
#    exports a static GLB, then restores the modifier for the next snapshot.
# ---------------------------------------------------------------------------
import os

output_dir = bpy.path.abspath(OUTPUT_DIR)

def bake_snapshot(label: str, n_iter: int) -> str:
    """Apply LaplacianSmooth at n_iter to a copy and export as GLB."""
    # Duplicate
    dup = obj.copy()
    dup.data = obj.data.copy()
    bpy.context.collection.objects.link(dup)

    # Modify the iteration count on the duplicate's modifier
    dup.modifiers['LapSmooth'].iterations = n_iter

    # Evaluate mesh through depsgraph
    bpy.context.view_layer.update()
    dg      = bpy.context.evaluated_depsgraph_get()
    eval_ob = dup.evaluated_get(dg)
    baked   = bpy.data.meshes.new_from_object(eval_ob, depsgraph=dg)

    # Apply the baked mesh, remove modifier copy
    dup.data = baked
    dup.modifiers.clear()
    dup.name = f"{SLUG}_{label}"

    # Apply transforms
    bpy.context.view_layer.objects.active = dup
    dup.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Export GLB
    out_path = os.path.join(output_dir, f"{SLUG}_{label}.glb")
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
        export_apply=True,
        use_selection=True,
    )

    # Deselect and remove the temporary duplicate
    dup.select_set(False)
    bpy.data.objects.remove(dup, do_unlink=True)
    bpy.data.meshes.remove(baked)
    return out_path


for n, label in [(0, "raw"), (3, "iter3"), (ITERATIONS, f"iter{ITERATIONS}")]:
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    path = bake_snapshot(label, n)
    print(f"[holoflow] exported {path}")


# ---------------------------------------------------------------------------
# 7. Save .blend with modifier live (non-destructive)
# ---------------------------------------------------------------------------
blend_path = os.path.join(output_dir, f"{SLUG}.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"[holoflow] saved {blend_path}")
