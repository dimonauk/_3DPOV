"""
blueprint.py — Python mathutils: Möbius Strip N-Twist Parametric Mesh
Blender 5.1 | CC0 | Holoflow Studio Library
https://holoflow.co.uk/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr

TECHNIQUE
─────────
A Möbius strip is a non-orientable surface: a square strip of paper with one
half-twist before gluing the ends.  The classic parametrisation maps (θ, t)
∈ [0, 2π) × [−1, 1] into ℝ³:

    x(θ, t) = (R + W·t·cos(N·θ/2)) · cos(θ)
    y(θ, t) = (R + W·t·cos(N·θ/2)) · sin(θ)
    z(θ, t) = W·t·sin(N·θ/2)

where R is the ring radius, W the half-width, and N the number of half-twists.
Odd N → non-orientable (Möbius family), even N → orientable cylinder.

KEY TOPOLOGICAL FACT — boundary loop count:
    N odd  → 1 boundary loop of length 2·THETA_SEGS (both edges join into one)
    N even → 2 boundary loops of length THETA_SEGS  (independent edges)

The seam closure (θ → θ+2π) flips t → −t when N is odd.  In the mesh this is
expressed by reversing the j-index of row 0 when closing the last column of faces.
This single index reversal is the entire non-orientability encoded in mesh topology.

EXTERNAL ATTRIBUTION
─────────────────────
  Paul Bourke — "Möbius Strip" — Educational freeware
  http://paulbourke.net/geometry/mobius/
  Related: http://paulbourke.net/geometry/

  Wikipedia "Möbius strip" — CC BY-SA 4.0 — Wikimedia Foundation
  https://en.wikipedia.org/wiki/M%C3%B6bius_strip
  Related: https://en.wikipedia.org/wiki/Non-orientable_surface
"""

import bpy, bmesh, math
import numpy as np

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SLUG        = "hf_mobius"
RADIUS      = 1.00      # ring radius: centre to strip midline (m)
HALF_WIDTH  = 0.35      # half-width of the strip ribbon (m)
N_TWISTS    = 1         # half-twists: 1 = Möbius, 2 = cylinder, 3 = triple
THETA_SEGS  = 120       # longitudinal resolution — 120 gives <1° angular error
T_SEGS      = 12        # lateral resolution across width
THICKNESS   = 0.022     # shell thickness for solidified body (m); 0 = thin surface
# Two-tone backface-aware colours — outer face / inner face (after solidify)
COL_OUTER   = (0.90, 0.68, 0.05, 1.0)   # warm gold
COL_INNER   = (0.04, 0.08, 0.30, 1.0)   # deep navy
GLB_PATH    = "//hf_mobius.glb"
# ─────────────────────────────────────────────────────────────────────────────


def _build_quads() -> tuple[list, list]:
    """
    Return (verts, faces) for the Möbius-strip parametric surface.

    Vertex layout:
      THETA_SEGS rows (θ from 0 to 2π exclusive, endpoint=False)
      × (T_SEGS+1) columns (t from −1 to +1 inclusive)
    Total vertices = THETA_SEGS × (T_SEGS+1)

    The seam at the last row (i = THETA_SEGS−1) closes back to row 0.
    For odd N_TWISTS, the closing face reverses the j-index — encoding
    the half-twist in connectivity rather than in 3-D coordinates.
    """
    ts     = np.linspace(-1.0, 1.0, T_SEGS + 1)
    thetas = np.linspace(0.0, 2.0 * math.pi, THETA_SEGS, endpoint=False)
    cols   = T_SEGS + 1

    verts = []
    for theta in thetas:
        ha = N_TWISTS * theta * 0.5          # half-angle: rotates the local frame
        cos_ha, sin_ha = math.cos(ha), math.sin(ha)
        cos_t,  sin_t  = math.cos(theta), math.sin(theta)
        for t in ts:
            r = RADIUS + HALF_WIDTH * t * cos_ha
            verts.append((r * cos_t, r * sin_t, HALF_WIDTH * t * sin_ha))

    faces = []
    for i in range(THETA_SEGS):
        next_i = (i + 1) % THETA_SEGS
        is_seam = (next_i == 0)
        for j in range(T_SEGS):
            a = i * cols + j
            b = i * cols + j + 1
            if is_seam and (N_TWISTS % 2 == 1):
                # Möbius seam: flip j-axis so the far edge meets the near edge.
                # (T_SEGS − j) and (T_SEGS − j − 1) give the reversed column index.
                c = next_i * cols + (T_SEGS - j - 1)
                d = next_i * cols + (T_SEGS - j)
            else:
                c = next_i * cols + j + 1
                d = next_i * cols + j
            faces.append((a, b, c, d))

    return verts, faces


def _assemble_mesh(verts: list, faces: list) -> bpy.types.Object:
    """Create a Blender mesh object from vertex/face lists and link it to the scene."""
    # Purge previous run
    for name in (SLUG, SLUG + "_mesh"):
        bpy.data.objects.get(name) and bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
        bpy.data.meshes.get(name + "_mesh") and bpy.data.meshes.remove(bpy.data.meshes[name + "_mesh"])

    mesh = bpy.data.meshes.new(SLUG + "_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.validate()

    obj = bpy.data.objects.new(SLUG, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj


def _solidify(obj: bpy.types.Object) -> None:
    """
    Extrude the surface into a solid shell via bmesh.ops.solidify.

    solidify adds a parallel inner surface offset by THICKNESS along the
    face normals, then stitches side-walls along the boundary edges.
    After this the mesh is manifold and suitable for FDM/resin printing.
    recalc_face_normals is called AFTER solidify: on the thin surface it
    would produce an inconsistent orientation (the topological contradiction
    of non-orientability); on the solid it converges to outward-pointing normals.
    """
    if THICKNESS <= 0.0:
        return
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=THICKNESS)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()


def _count_boundary_loops(obj: bpy.types.Object) -> int:
    """
    Count distinct boundary loops on the (thin) strip surface.

    A boundary edge is shared by exactly one face.  For odd N_TWISTS the
    two long edges of the strip form ONE continuous loop (length 2·THETA_SEGS);
    for even N_TWISTS they form TWO separate loops.  This function walks
    the boundary adjacency graph via vertex→boundary-edge connectivity.
    """
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.edges.ensure_lookup_table()

    boundary = [e for e in bm.edges if e.is_boundary]
    visited  = set()
    loops    = 0

    for start in boundary:
        if start.index in visited:
            continue
        loops += 1
        stack = [start]
        while stack:
            edge = stack.pop()
            if edge.index in visited:
                continue
            visited.add(edge.index)
            for vert in edge.verts:
                for nb in vert.link_edges:
                    if nb.is_boundary and nb.index not in visited:
                        stack.append(nb)

    bm.free()
    return loops


def _make_material() -> bpy.types.Material:
    """
    Two-tone Principled BSDF driven by the Geometry node's Backfacing output.

    Outer face → COL_OUTER (gold); inner face → COL_INNER (navy).
    On the thin non-solidified strip, 'inner' and 'outer' alternate as the
    viewer's eye crosses the non-orientable seam — the face normal has
    flipped, so the Backfacing signal toggles even though the viewer has
    not changed sides in 3-space.  This is a direct visual signature of
    non-orientability.
    """
    mat = bpy.data.materials.get(SLUG + "_mat")
    if mat:
        bpy.data.materials.remove(mat)
    mat = bpy.data.materials.new(SLUG + "_mat")
    mat.use_nodes        = True
    mat.use_backface_culling = False      # show both faces

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out  = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    mix  = nodes.new("ShaderNodeMixRGB")
    geom = nodes.new("ShaderNodeNewGeometry")

    mix.blend_type = "MIX"
    mix.inputs["Color1"].default_value = COL_OUTER
    mix.inputs["Color2"].default_value = COL_INNER
    bsdf.inputs["Roughness"].default_value       = 0.45
    bsdf.inputs["Specular IOR Level"].default_value = 0.55

    links.new(geom.outputs["Backfacing"],  mix.inputs["Fac"])
    links.new(mix.outputs["Color"],        bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"],        out.inputs["Surface"])

    out.location  = (400, 0);  bsdf.location = (100, 0)
    mix.location  = (-150, -80);  geom.location = (-400, -80)
    return mat


def _export_glb(obj: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath                            = bpy.path.abspath(GLB_PATH),
        use_selection                       = True,
        export_format                       = "GLB",
        export_draco_mesh_compression_enable= True,
        export_draco_mesh_compression_level = 6,
        export_image_format                 = "WEBP",
        export_apply                        = True,
    )
    print(f"[HF] → {bpy.path.abspath(GLB_PATH)}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main() -> None:
    verts, faces = _build_quads()
    print(f"[HF] mesh built: {len(verts)} verts, {len(faces)} quads, N_TWISTS={N_TWISTS}")

    obj = _assemble_mesh(verts, faces)
    mat = _make_material()
    obj.data.materials.append(mat)

    # Topology report on the thin surface (before solidify changes it)
    loops = _count_boundary_loops(obj)
    expected = 1 if N_TWISTS % 2 == 1 else 2
    status = "✓" if loops == expected else "✗ unexpected"
    print(f"[HF] boundary loops = {loops}  (expected {expected} for N={N_TWISTS})  {status}")

    _solidify(obj)
    _export_glb(obj)
    print(f"[HF] done. Solid={THICKNESS>0}, boundary loops before solidify={loops}")


main()
