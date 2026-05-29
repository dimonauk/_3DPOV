"""
Curves-Based Hair Grooming — Blender 5.1
Holoflow Studio | CC0

Curves hair replaced the particle hair system as the canonical grooming
workflow in Blender 4.0.  A bpy.types.Curves data block stores hair as a
list of polylines; each polyline lives in POINT domain and is anchored to
a surface mesh.  EEVEE Next renders the strands natively via Principled
Hair BSDF.  For WebXR/GLB delivery you must convert strands to mesh
ribbons first — the blueprint exports a head-only GLB and documents the
GN ribbon path in the README.
"""

import bpy
import math
import random
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────────
SEED          = 42
N_STRANDS     = 44        # strands across the upper hemisphere
SEG_COUNT     = 7         # control points per strand (polyline resolution)
STRAND_LENGTH = 0.38      # world-unit arc length root → tip
ROOT_RADIUS   = 0.0042    # strand cylinder radius at scalp (EEVEE hair width)
TIP_RADIUS    = 0.0008    # strand cylinder radius at tip
HEAD_RADIUS   = 0.12      # icosphere radius (roughly head-sized at 1 BU = 1 m)
GRAVITY       = 0.35      # droop factor; 0 = straight, 1 = fully horizontal
OUTPUT_GLB    = "//hair_grooming_head.glb"

random.seed(SEED)


# ── Helpers ───────────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
                  bpy.data.node_groups):
        for item in list(block):
            block.remove(item)


def set_active(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def uniform_upper_hemisphere(rng: random.Random) -> tuple[float, float, float]:
    """
    Equal-area sampling on the upper sphere; cos_min caps the lateral spread
    so strands don't seed below the hairline / temple region.
    cos(theta) = 1 is the north pole; cos(theta) = 0 is the equator.
    """
    cos_min   = 0.28
    cos_theta = rng.uniform(cos_min, 1.0)
    sin_theta = math.sqrt(max(0.0, 1.0 - cos_theta * cos_theta))
    phi       = rng.uniform(0.0, 2.0 * math.pi)
    return (sin_theta * math.cos(phi),
            sin_theta * math.sin(phi),
            cos_theta)


# ── Scene ─────────────────────────────────────────────────────────────────────
clear_scene()
rng = random.Random(SEED)

# ── 1. Head mesh ──────────────────────────────────────────────────────────────
# Icosphere (subdivisions=2 → 80 triangular faces) distributes faces
# uniformly across the surface.  UV sphere has denser faces near the
# poles, making hair root density uneven.  Flat shading matches the
# studio's faceted aesthetic and reduces normals data in the export.
bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=2, radius=HEAD_RADIUS, location=(0.0, 0.0, 0.0))
head = bpy.context.active_object
head.name = "head_scalp"
bpy.ops.object.shade_flat()

scalp_mat = bpy.data.materials.new("scalp")
scalp_mat.use_nodes = True
bsdf = scalp_mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value  = (0.55, 0.40, 0.35, 1.0)
bsdf.inputs["Roughness"].default_value   = 0.90
head.data.materials.append(scalp_mat)

# ── 2. Curves hair object ─────────────────────────────────────────────────────
# curves_empty_hair_add() requires the surface object to be active; it
# sets curves.surface = head and curves.surface_uv_map = UVMap so the
# sculpt-mode grooming tools can snap roots to the nearest face.
# We override the positions immediately via the direct data API.
set_active(head)
bpy.ops.object.curves_empty_hair_add()
hair_obj          = bpy.context.active_object
hair_obj.name     = "hair_strands"
curves: bpy.types.Curves = hair_obj.data

# ── 3. Seed strands programmatically ─────────────────────────────────────────
# add_curves(counts) appends strands in one allocation; counts[i] = number
# of control points in strand i.  A single call is far cheaper than
# N_STRANDS individual calls because it avoids repeated BLI array resizes.
curves.add_curves([SEG_COUNT] * N_STRANDS)

total_pts = N_STRANDS * SEG_COUNT
pos_flat  = np.zeros(total_pts * 3, dtype=np.float32)
rad_flat  = np.zeros(total_pts,     dtype=np.float32)

for si in range(N_STRANDS):
    nx, ny, nz = uniform_upper_hemisphere(rng)
    rx = HEAD_RADIUS * nx
    ry = HEAD_RADIUS * ny
    rz = HEAD_RADIUS * nz

    for pi in range(SEG_COUNT):
        t  = pi / (SEG_COUNT - 1)
        # Gravity increases quadratically — root segments grow outward along
        # the normal; tip segments curve downward.  The quadratic weighting
        # means the first half of the strand is nearly straight (natural root
        # stiffness) before the gravity droop kicks in.
        g  = GRAVITY * t * t
        dx = nx * (1.0 - g)
        dy = ny * (1.0 - g)
        dz = nz * (1.0 - g) - g

        mag = math.sqrt(dx * dx + dy * dy + dz * dz)
        if mag > 1e-6:
            dx, dy, dz = dx / mag, dy / mag, dz / mag

        arc_len = STRAND_LENGTH * t
        base_i  = (si * SEG_COUNT + pi) * 3
        pos_flat[base_i]     = rx + dx * arc_len
        pos_flat[base_i + 1] = ry + dy * arc_len
        pos_flat[base_i + 2] = rz + dz * arc_len

        rad_flat[si * SEG_COUNT + pi] = (
            ROOT_RADIUS + (TIP_RADIUS - ROOT_RADIUS) * t)

# foreach_set writes the whole attribute array in one C call — avoids the
# per-element Python ↔ C overhead that makes attribute assignment in a loop
# roughly 50× slower on large point counts.
curves.attributes['position'].data.foreach_set('vector', pos_flat)

rad_attr = curves.attributes.new('radius', 'FLOAT', 'POINT')
rad_attr.data.foreach_set('value', rad_flat)

# ── 4. Hair material ──────────────────────────────────────────────────────────
# Principled Hair BSDF is EEVEE Next–native since Blender 4.2.  MELANIN
# parametrisation maps physically: 0 = blonde/platinum, 1 = near-black.
# For flat cel-shading, replace this BSDF with a ShaderNodeEmission +
# hard ColourRamp (see the EEVEE toon cel-shader tutorial on this site).
hair_mat = bpy.data.materials.new("hair")
hair_mat.use_nodes = True
nt = hair_mat.node_tree
nt.nodes.clear()

out_node  = nt.nodes.new('ShaderNodeOutputMaterial')
out_node.location = (300, 0)

hair_bsdf = nt.nodes.new('ShaderNodePrincipledHairBSDF')
hair_bsdf.location = (0, 0)
hair_bsdf.parametrization                         = 'MELANIN'
hair_bsdf.inputs['Melanin'].default_value         = 0.92
hair_bsdf.inputs['Melanin Redness'].default_value = 0.60
hair_bsdf.inputs['Roughness'].default_value       = 0.35
hair_bsdf.inputs['Radial Roughness'].default_value = 0.30

nt.links.new(hair_bsdf.outputs['BSDF'], out_node.inputs['Surface'])
hair_obj.data.materials.append(hair_mat)

# ── 5. Export head-only GLB ───────────────────────────────────────────────────
# The Blender 5.1 glTF exporter cannot emit Curves objects as hair
# primitives; the glTF 2.0 spec has no hair primitive type.  Export the
# head mesh as the base GLB; see README for the GN ribbon workflow that
# converts strands to mesh strips for full WebXR delivery.
set_active(head)
head.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUTPUT_GLB,
    use_selection=True,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_apply=True,
)

print("blueprint complete — hair_grooming_head.glb + .blend ready for sculpt grooming")
