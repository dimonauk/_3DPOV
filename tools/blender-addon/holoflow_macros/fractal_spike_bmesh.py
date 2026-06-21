"""
holoflow_macros/fractal_spike_bmesh.py
Blender 5.1 | CC0

Reusable macro: grow fractal spikes on any bmesh via iterative
extrude_discrete_faces + translate + scale.

Usage:
    import bmesh
    from holoflow_macros.fractal_spike_bmesh import grow_spikes

    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    bm.normal_update()
    tip_caps = grow_spikes(bm, iterations=4, extrude_factor=0.9, scale_factor=0.58)
    # tag tip caps with material_index=1:
    tip_set = set(tip_caps)
    for f in bm.faces:
        f.material_index = 1 if f in tip_set else 0
    bm.to_mesh(mesh)
    bm.free()
"""

import math
import bmesh


def grow_spikes(
    bm: "bmesh.types.BMesh",
    iterations: int = 4,
    extrude_factor: float = 0.90,
    scale_factor: float = 0.58,
) -> list:
    """
    Iteratively extrude tip caps on a bmesh to produce fractal spikes.

    Args:
        bm:             An initialised bmesh with face normals updated.
        iterations:     Number of spike generations (3 = sparse, 5 = dense).
        extrude_factor: spike_height = sqrt(face_area) × extrude_factor.
        scale_factor:   Cap contracts toward its centre by this ratio each pass.

    Returns:
        List of BMFace objects — the final-iteration tip caps.
        Assign material_index = 1 to these before bm.to_mesh() to tag tips.
    """
    current_caps = list(bm.faces)

    for _iter in range(iterations):
        next_caps = []

        for face in current_caps:
            orig_normal  = face.normal.copy()
            extrude_dist = math.sqrt(face.calc_area()) * extrude_factor

            # discrete: each face extruded in isolation, preserving spike gaps.
            result    = bmesh.ops.extrude_discrete_faces(bm, faces=[face])
            new_faces = result['faces']

            # cap has highest dot product with original normal.
            cap = max(new_faces, key=lambda f: f.normal.dot(orig_normal))

            # lift the cap; only cap.verts — side quad bases stay put.
            bmesh.ops.translate(
                bm,
                vec=orig_normal * extrude_dist,
                verts=list(cap.verts),
            )

            # taper: scale cap verts toward cap centre (manual loop avoids
            # bmesh.ops.scale 3×3 space ambiguity for arbitrary pivot).
            ctr = cap.calc_center_median()
            for v in cap.verts:
                v.co = ctr + (v.co - ctr) * scale_factor

            next_caps.append(cap)

        bm.normal_update()
        current_caps = next_caps

    return current_caps
