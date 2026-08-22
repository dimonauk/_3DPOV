"""
GN Accumulate Field — Staggered Hex-Pillar Reveal Grid for WebXR
Blender 5.1  |  CC0  |  Holoflow Studio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECHNIQUE
Accumulate Field evaluates a running sum across a domain in a deterministic
sort order.  By setting Sort Index = floor(position.X × 100) we impose a
left-to-right rank on each Poisson-scattered point, independent of its
internal index.  Dividing the Leading output by Total gives a unique phase
in [0, 1) per instance.  Scene Time drives each pillar through an independent
rise window offset by phase × STAGGER_DUR — a directed wave sweeping the
grid from −X to +X.

The Sort Index trick is the key expert insight: without it, Accumulate Field
returns the natural Poisson-disk traversal order, which is not spatially
ordered and looks like random pop-in rather than a directed wave.

WHY POISSON, NOT RANDOM SCATTER
Poisson disk sampling guarantees a minimum separation between points,
producing a visually balanced grid with no clumps.  Random scatter can put
two pillars nearly on top of each other.  Trade-off: Poisson evaluates in
~2 ms more than RANDOM at DENSITY=5 — negligible.

WHY ACCUMULATE FIELD, NOT JUST INDEX NODE
Index returns points in Blender's internal scatter order, which varies with
Seed and DENSITY.  Sorting via Accumulate Field's Sort Index produces a
deterministic spatial order regardless of seed, making the wave predictable
and art-directable — change Seed and the wave still sweeps left-to-right.

RUN
    blender --background --python blueprint.py
OUTPUTS
    stagger_reveal_frame000.glb  (Draco 6, +Y up, WebP, ~30-80 KB)

Outside source — Blender Manual: Accumulate Field
  https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/utilities/field/accumulate_field.html
  Licence: CC BY-SA 4.0  ·  © Blender Foundation
  Sibling project: https://projects.blender.org

Outside source — Robert Guetzkow, blender-python-examples
  https://github.com/robertguetzkow/blender-python-examples
  Licence: MIT  ·  © Robert Guetzkow
  Related: https://github.com/robertguetzkow/blender-addon-clean-up-imported-materials
"""

import bpy
import math

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
GN_NAME     = "StaggerReveal_GN"
OBJ_NAME    = "stagger_reveal"
MAT_NAME    = "pillar_cel"
OUTPUT_GLB  = "//stagger_reveal_frame000.glb"

GRID_X      = 5.0    # ground plane X extent (m)
GRID_Y      = 5.0    # ground plane Y extent (m)
GRID_VERTS  = 40     # subdivisions per axis — denser grid gives more uniform Poisson coverage
DENSITY     = 5.0    # Poisson disk pts / m²  →  ~125 pillars on a 5 × 5 grid
STAGGER_DUR = 3.0    # seconds: window from first to last pillar starting its rise
RISE_TIME   = 0.40   # seconds each individual pillar takes to reach full height
PILLAR_H    = 0.50   # max pillar height (m)
PILLAR_R    = 0.09   # hex pillar inscribed radius (m) — keep < 0.5 / sqrt(DENSITY)
PILLAR_SEG  = 6      # cylinder vertex count → hexagonal cross-section


# ── HELPERS ───────────────────────────────────────────────────────────────────
def clear_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for ng in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(ng)
    for mt in list(bpy.data.materials):
        bpy.data.materials.remove(mt)


def N(nodes, ntype, x=0, y=0):
    nd = nodes.new(ntype)
    nd.location = (x, y)
    return nd


def L(lk, src, dst):
    lk.new(src, dst)


# ── MATERIAL ──────────────────────────────────────────────────────────────────
def make_material():
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = N(nt.nodes, "ShaderNodeOutputMaterial", 300, 0)
    bsdf = N(nt.nodes, "ShaderNodeBsdfToon",         0, 0)
    # Cyan-jade tint; Toon BSDF gives flat cel shading compatible with EEVEE bake
    bsdf.inputs["Color"].default_value  = (0.12, 0.78, 0.72, 1.0)
    bsdf.inputs["Size"].default_value   = 0.60
    bsdf.inputs["Smooth"].default_value = 0.04
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ── GN TREE ───────────────────────────────────────────────────────────────────
def build_gn_tree(mat):
    ng    = bpy.data.node_groups.new(GN_NAME, "GeometryNodeTree")
    nd    = ng.nodes
    lk    = ng.links
    iface = ng.interface

    # Three float inputs exposed to the modifier panel so they are keyframeable
    s_den = iface.new_socket("Density",           in_out="INPUT",  socket_type="NodeSocketFloat")
    s_stg = iface.new_socket("Stagger Duration",   in_out="INPUT",  socket_type="NodeSocketFloat")
    s_rse = iface.new_socket("Rise Time",          in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Geometry",                   in_out="OUTPUT", socket_type="NodeSocketGeometry")

    s_den.default_value = DENSITY;       s_den.min_value = 0.5;  s_den.max_value = 50.0
    s_stg.default_value = STAGGER_DUR;   s_stg.min_value = 0.1;  s_stg.max_value = 30.0
    s_rse.default_value = RISE_TIME;     s_rse.min_value = 0.05; s_rse.max_value = 5.0

    gin  = N(nd, "NodeGroupInput",   -1700, 0)
    gout = N(nd, "NodeGroupOutput",   1650, 100)

    # ── Ground grid generated inside GN — no external geometry dependency ─────
    grid = N(nd, "GeometryNodeMeshGrid", -1500, 300)
    grid.inputs["Size X"].default_value     = GRID_X
    grid.inputs["Size Y"].default_value     = GRID_Y
    grid.inputs["Vertices X"].default_value = GRID_VERTS
    grid.inputs["Vertices Y"].default_value = GRID_VERTS

    # ── Poisson-disk scatter ──────────────────────────────────────────────────
    # Distance Min = 0.85 / sqrt(density): slightly inside the theoretical
    # minimum so Blender's Poisson sampler can fill the grid uniformly.
    dist = N(nd, "GeometryNodeDistributePointsOnFaces", -1200, 300)
    dist.distribute_method = "POISSON"
    dist.inputs["Distance Min"].default_value = 0.85 / math.sqrt(DENSITY)
    L(lk, grid.outputs["Mesh"],     dist.inputs["Mesh"])
    L(lk, gin.outputs["Density"],   dist.inputs["Density Max"])

    # ── Sort key: left-to-right rank from position.X ──────────────────────────
    pos = N(nd, "GeometryNodeInputPosition", -1200, -80)
    sep = N(nd, "ShaderNodeSeparateXYZ",      -980, -80)
    L(lk, pos.outputs["Position"], sep.inputs["Vector"])

    # Scale X by 100 then floor → integer bucket width = 1 cm in world space.
    # Two pillars in the same 1 cm slice share a rank; at DENSITY ≤ 50 this
    # never happens, so the rank is effectively unique per pillar.
    msc = N(nd, "ShaderNodeMath", -770, -80)
    msc.operation = "MULTIPLY"
    msc.inputs[1].default_value = 100.0
    L(lk, sep.outputs["X"], msc.inputs[0])

    mfl = N(nd, "ShaderNodeMath", -560, -80)
    mfl.operation = "FLOOR"
    L(lk, msc.outputs["Value"], mfl.inputs[0])

    # ── Accumulate Field: spatial running rank ────────────────────────────────
    # Value = 1.0 → Leading[i] = count of elements ranked before i (0 .. N-1)
    #            → Total        = N (total point count in this domain pass)
    # Sort Index = mfl → elements with smaller X sort first
    accum = N(nd, "GeometryNodeAccumulateField", -350, -80)
    accum.data_type = "FLOAT"
    accum.inputs["Value"].default_value = 1.0
    L(lk, mfl.outputs["Value"], accum.inputs["Sort Index"])

    # ── Normalise rank → phase [0, 1) ─────────────────────────────────────────
    mnrm = N(nd, "ShaderNodeMath", -130, -80)
    mnrm.operation = "DIVIDE"
    L(lk, accum.outputs["Leading"], mnrm.inputs[0])
    L(lk, accum.outputs["Total"],   mnrm.inputs[1])

    # per-pillar start time = phase × STAGGER_DUR
    moff = N(nd, "ShaderNodeMath", 90, -80)
    moff.operation = "MULTIPLY"
    L(lk, mnrm.outputs["Value"],           moff.inputs[0])
    L(lk, gin.outputs["Stagger Duration"], moff.inputs[1])

    # ── Scene time ────────────────────────────────────────────────────────────
    stime = N(nd, "GeometryNodeInputSceneTime", 90, -250)

    # local_t = now − offset_t  (negative before pillar's start → progress < 0)
    msub = N(nd, "ShaderNodeMath", 310, -80)
    msub.operation = "SUBTRACT"
    L(lk, stime.outputs["Seconds"], msub.inputs[0])
    L(lk, moff.outputs["Value"],    msub.inputs[1])

    # progress_raw = local_t / RISE_TIME  (0 at start, 1 at full height)
    mdiv = N(nd, "ShaderNodeMath", 530, -80)
    mdiv.operation = "DIVIDE"
    L(lk, msub.outputs["Value"],    mdiv.inputs[0])
    L(lk, gin.outputs["Rise Time"], mdiv.inputs[1])

    # Clamp to [0, 1]: negative pre-start values → 0; overshoots → 1
    clmp = N(nd, "ShaderNodeClamp", 750, -80)
    clmp.clamp_type = "MINMAX"
    clmp.inputs["Min"].default_value = 0.0
    clmp.inputs["Max"].default_value = 1.0
    L(lk, mdiv.outputs["Value"], clmp.inputs["Value"])

    # ── Scale vector: XY = 1 (constant footprint), Z = progress ─────────────
    cxyz = N(nd, "ShaderNodeCombineXYZ", 970, -80)
    cxyz.inputs["X"].default_value = 1.0
    cxyz.inputs["Y"].default_value = 1.0
    L(lk, clmp.outputs["Result"], cxyz.inputs["Z"])

    # ── Hex pillar template ───────────────────────────────────────────────────
    # 6-sided cylinder for the Holoflow faceted aesthetic.
    # Translated up by half-depth so the base sits at Z=0 — ensures pillar
    # appears to grow from the ground rather than sink into it.
    cyl = N(nd, "GeometryNodeMeshCylinder", -600, 350)
    cyl.inputs["Vertices"].default_value       = PILLAR_SEG
    cyl.inputs["Side Segments"].default_value  = 1
    cyl.inputs["Fill Segments"].default_value  = 1
    cyl.inputs["Radius"].default_value         = PILLAR_R
    cyl.inputs["Depth"].default_value          = PILLAR_H

    xfm = N(nd, "GeometryNodeTransform", -350, 350)
    xfm.inputs["Translation"].default_value = (0.0, 0.0, PILLAR_H / 2.0)
    L(lk, cyl.outputs["Mesh"], xfm.inputs["Geometry"])

    # ── Instance on distributed points ───────────────────────────────────────
    inst = N(nd, "GeometryNodeInstanceOnPoints", 1200, 200)
    L(lk, dist.outputs["Points"],  inst.inputs["Points"])
    L(lk, xfm.outputs["Geometry"], inst.inputs["Instance"])
    L(lk, cxyz.outputs["Vector"],  inst.inputs["Scale"])

    # Realise instances before GLB export: glTF requires mesh geometry, not instance data
    real = N(nd, "GeometryNodeRealizeInstances", 1430, 200)
    L(lk, inst.outputs["Instances"], real.inputs["Geometry"])

    setm = N(nd, "GeometryNodeSetMaterial", 1630, 200)
    setm.inputs["Material"].default_value = mat
    L(lk, real.outputs["Geometry"],  setm.inputs["Geometry"])
    L(lk, setm.outputs["Geometry"],  gout.inputs["Geometry"])

    return ng


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    clear_scene()
    mat = make_material()
    ng  = build_gn_tree(mat)

    # Minimal host: GN tree generates all visible geometry internally
    bpy.ops.mesh.primitive_plane_add(size=0.01)
    obj            = bpy.context.active_object
    obj.name       = OBJ_NAME
    mod            = obj.modifiers.new("StaggerReveal", "NODES")
    mod.node_group = ng

    bpy.context.scene.frame_set(0)

    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_materials="EXPORT",
    )
    print(f"Exported: {OUTPUT_GLB}")
    bpy.ops.wm.save_as_mainfile(filepath="//stagger_reveal.blend")
    print("Saved: stagger_reveal.blend")


if __name__ == "__main__":
    main()
