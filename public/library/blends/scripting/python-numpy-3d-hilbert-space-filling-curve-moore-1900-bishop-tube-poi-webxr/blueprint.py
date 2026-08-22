"""
3D Hilbert Space-Filling Curve — Blender 5.1 Blueprint
=======================================================

Technique
---------
The Hilbert space-filling curve maps the unit interval [0,1] surjectively onto
[0,1]ⁿ.  In 3D at recursion order k the curve visits every voxel of a
2ᵏ × 2ᵏ × 2ᵏ integer lattice exactly once, with consecutive voxels always
face-adjacent.  Its limit curve has Hausdorff–Besicovitch dimension exactly 3
— it is measure-theoretically indistinguishable from a solid cube.

David Hilbert (1891) proved the 2D version; E. H. Moore (1900) generalised the
construction to arbitrary dimensions.  The integer-to-coordinate mapping used
here is Skilling's transposed-bit algorithm (2004), adapted from the MIT-licensed
galtay/hilbertcurve Python package.  The curve is extruded along a Bishop
parallel-transport tube: a frame that eliminates gimbal-lock by rotating the
cross-section only as much as the tangent demands, producing twist-free geometry
that reads cleanly as a light-trail poi head.

Parameters — edit these before running.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# ── PARAMETERS ────────────────────────────────────────────────────────────────
ORDER    = 3        # recursion depth; curve has 8^ORDER points (ORDER=3 → 512)
TUBE_R   = 0.024    # bishop-tube cross-section radius (m)
TUBE_SEG = 8        # cross-section polygon sides (octagon)
SCALE    = 0.55     # bounding-box half-extent (m); poi head diameter ≈ 1.1 m
OBJ_NAME = "hf_hilbert_poi"

# ── HILBERT ALGORITHM — Skilling (2004) transposed-bit method ─────────────────
# Adapted from galtay/hilbertcurve (MIT licence):
# https://github.com/galtay/hilbertcurve

def _h_to_transpose(h: int, p: int, n: int) -> list[int]:
    """
    Convert Hilbert integer h to transposed representation X (length n).

    WHY: Skilling's algorithm works on a 'transposed' form where X[i] packs
    bit i from all n coordinate axes into a single n-bit integer.  This allows
    simple bitwise operations to implement the Gray-code inverse transform.
    """
    X = [0] * n
    for bit_idx in range(p * n):
        X[bit_idx % n] |= ((h >> bit_idx) & 1) << (p - 1 - bit_idx // n)
    return X


def _transpose_to_axes(X: list[int], p: int, n: int) -> list[int]:
    """
    Decode transposed form X into Cartesian coordinate list [x, y, z, ...].

    Two-pass algorithm (Skilling 2004):
      1. Inverse-undo-excess-work: reverses the excess encoding that ensures
         adjacent Hilbert indices map to face-adjacent voxels.
      2. Gray decode: the Gray code avoids jumps larger than 1 step per axis.
    """
    X = list(X)
    N = 1 << p          # 2^p = one dimension's grid size

    # Pass 1: inverse undo excess work
    Q = 2
    while Q != N:
        P = Q - 1
        for i in range(n - 1, -1, -1):
            if X[i] & Q:
                X[0] ^= P           # invert
            else:
                t = (X[0] ^ X[i]) & P
                X[0] ^= t
                X[i] ^= t
        Q <<= 1

    # Pass 2: Gray decode
    for i in range(1, n):
        X[i] ^= X[i - 1]
    t = 0
    Q = N
    while Q > 1:
        Q >>= 1
        if X[n - 1] & Q:
            t ^= Q - 1
    for i in range(n):
        X[i] ^= t

    return X


def hilbert3d_points(order: int) -> np.ndarray:
    """
    Return the (8^order, 3) float array of the 3D Hilbert curve at given order,
    normalised to lie inside [−SCALE, +SCALE]³.

    WHY order=3 default: 512 curve-waypoints × 8 tube vertices = ~4 096 mesh
    vertices — small enough for a realtime WebXR poi but dense enough that the
    space-filling quality is visually obvious (each axis subdivided into 8
    bands).
    """
    n = 3
    total = 8 ** order
    pts = np.empty((total, n), dtype=np.float64)

    for h in range(total):
        X_t = _h_to_transpose(h, order, n)
        xyz = _transpose_to_axes(X_t, order, n)
        pts[h] = xyz

    # Normalise integer grid [0, 2^order−1]³ → [−SCALE, +SCALE]³
    g = (1 << order) - 1       # grid max = 2^order − 1
    pts = (pts / g * 2.0 - 1.0) * SCALE
    return pts


# ── BISHOP PARALLEL-TRANSPORT FRAME ──────────────────────────────────────────
def bishop_frame(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Compute Bishop (rotation-minimising) frame along the polyline pts.

    Returns T (tangents), N (normals), B (binormals) each of shape (N-1, 3).

    WHY Bishop over Frenet: the Frenet frame flips through π when curvature
    passes through zero — catastrophic for a tube.  Bishop propagates the
    cross-section by the minimal rotation that tracks the tangent, so the
    tube never acquires spurious twist.
    """
    n_seg = len(pts) - 1
    seg = pts[1:] - pts[:-1]                  # segment vectors
    lengths = np.linalg.norm(seg, axis=1, keepdims=True)
    T = seg / np.maximum(lengths, 1e-12)       # unit tangents

    # Seed normal — pick a vector not parallel to T[0]
    v = np.array([0.0, 0.0, 1.0])
    if abs(T[0] @ v) > 0.9:
        v = np.array([0.0, 1.0, 0.0])
    N0 = np.cross(T[0], v)
    N0 /= np.linalg.norm(N0)

    N = np.empty((n_seg, 3))
    B = np.empty((n_seg, 3))
    N[0] = N0
    B[0] = np.cross(T[0], N0)

    for i in range(1, n_seg):
        # Parallel transport: rotate N[i-1] by the same rotation that maps T[i-1]→T[i]
        axis = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = T[i - 1] @ T[i]
        if sin_a < 1e-10:
            N[i] = N[i - 1]
        else:
            axis /= sin_a
            # Rodrigues: v' = v cos θ + (axis×v) sin θ + axis(axis·v)(1−cos θ)
            Ni = (N[i - 1] * cos_a
                  + np.cross(axis, N[i - 1]) * sin_a
                  + axis * (axis @ N[i - 1]) * (1.0 - cos_a))
            N[i] = Ni / np.linalg.norm(Ni)
        B[i] = np.cross(T[i], N[i])

    return T, N, B


# ── TUBE GEOMETRY ─────────────────────────────────────────────────────────────
def build_tube(pts: np.ndarray, T: np.ndarray, N: np.ndarray, B: np.ndarray
               ) -> tuple[list, list, list]:
    """
    Tessellate a tube of TUBE_R around the polyline.

    Returns (verts, faces, colours) where colours encodes parameter t ∈ [0,1]
    as a float per vertex for the FLOAT_COLOR 'Hilbert_T' attribute.
    """
    seg_count = len(pts) - 1
    angles = np.linspace(0, 2 * np.pi, TUBE_SEG, endpoint=False)
    cos_a = np.cos(angles)
    sin_a = np.sin(angles)

    verts = []
    colours = []   # scalar t per vertex

    # Build rings: one ring per waypoint (using frame of adjacent segment)
    for i, p in enumerate(pts):
        # Use the frame of the adjacent segment (clamp to [0, seg_count−1])
        fi = min(i, seg_count - 1)
        n_vec = N[fi]
        b_vec = B[fi]
        t_param = i / (len(pts) - 1)           # 0 → 1 along curve
        for c, s in zip(cos_a, sin_a):
            offset = TUBE_R * (c * n_vec + s * b_vec)
            verts.append(tuple(p + offset))
            colours.append(t_param)

    # Quad faces connecting adjacent rings
    faces = []
    R = TUBE_SEG
    for i in range(seg_count):
        base = i * R
        for j in range(R):
            j1 = (j + 1) % R
            faces.append((base + j, base + j1,
                          base + R + j1, base + R + j))

    return verts, faces, colours


# ── BLENDER SCENE CONSTRUCTION ────────────────────────────────────────────────
def build_scene() -> None:
    # Clear default objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # ── 1. Generate curve waypoints
    print(f"[Hilbert] Computing order-{ORDER} curve ({8**ORDER} points)…")
    pts = hilbert3d_points(ORDER)

    # ── 2. Bishop frame
    T, N, B = bishop_frame(pts)

    # ── 3. Tube geometry
    verts, faces, colours = build_tube(pts, T, N, B)
    print(f"[Hilbert] Tube: {len(verts)} verts, {len(faces)} quads")

    # ── 4. Build mesh via bmesh (direct data API — no bpy.ops context dependency)
    me = bpy.data.meshes.new(OBJ_NAME)
    bm = bmesh.new()

    bm_verts = [bm.verts.new(v) for v in verts]
    bm.verts.ensure_lookup_table()

    for f in faces:
        try:
            bm.faces.new([bm_verts[i] for i in f])
        except ValueError:
            pass     # skip degenerate / duplicate faces

    # Recalculate normals outward
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()

    # ── 5. FLOAT_COLOR vertex attribute 'Hilbert_T' (Blender 5.x API)
    # WHY FLOAT_COLOR at POINT domain: the 5.x deprecation of legacy vertex_colors
    # moved per-vertex colour into generic mesh attributes; GLTF export reads
    # COLOR_0 from a FLOAT_COLOR POINT attribute automatically, so WebXR gets
    # the gradient without any shader setup.
    attr = me.attributes.new(name="Hilbert_T", type="FLOAT_COLOR", domain="POINT")
    for i, t in enumerate(colours):
        # Cobalt (0, 0.35, 1) at t=0 → Amber (1, 0.65, 0) at t=1
        r = t
        g = 0.35 + t * 0.30
        b = 1.0 - t
        a = 1.0
        attr.data[i].color = (r, g, b, a)

    # ── 6. Single Principled BSDF material
    mat = bpy.data.materials.new(name="Hilbert_Mat")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    attr_node = tree.nodes.new("ShaderNodeAttribute")
    attr_node.attribute_name = "Hilbert_T"
    attr_node.attribute_type = "GEOMETRY"

    tree.links.new(attr_node.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 0.08
    bsdf.inputs["Roughness"].default_value = 0.30

    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    me.materials.append(mat)

    # ── 7. Object & Holoflow metadata
    ob = bpy.data.objects.new(OBJ_NAME, me)
    ob["holoflow:facet"]    = False   # smooth tube, not faceted
    ob["holoflow:category"] = "poi-head"
    bpy.context.collection.objects.link(ob)

    # ── 8. Smooth shading (auto-smooth via ShadeSmooth operator)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.shade_smooth()

    # ── 9. Export GLB — apply transforms, Draco level 6, WebP textures
    glb_path = bpy.path.abspath(f"//{OBJ_NAME}.glb")
    bpy.ops.export_scene.gltf(
        filepath       = glb_path,
        export_format  = "GLB",
        use_selection  = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
        export_apply   = True,
        export_yup     = True,          # +Y up for WebXR
        export_colors  = True,
    )
    print(f"[Hilbert] GLB written → {glb_path}")


build_scene()
