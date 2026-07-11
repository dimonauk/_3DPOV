"""
blueprint.py — pyopenvdb + bpy.types.Volume: Procedural VDB Density Field,
               Voxel Sampling & WebXR Particle Cloud Export
Blender 5.1  ·  Holoflow Studio  ·  CC0

TECHNIQUE
=========
OpenVDB is the Academy Software Foundation sparse-voxel library (Apache-2.0,
originally DreamWorks 2012).  Blender 5.1 bundles pyopenvdb — the official
Python C++ bindings — inside its own Python interpreter.  No external pip
install is needed; `import pyopenvdb` works from any Blender text-editor script.

A VDB FloatGrid stores active voxels only (sparse octree): a 128³ sphere in a
256³ logical domain has ~67 k active voxels — iterable in < 1 s from Python.
The background value (inactive voxels) is implicitly 0.0, so every read on
an inactive coordinate returns 0 without storing anything.

This blueprint:
1. Generates two overlapping Gaussian density blobs with pyopenvdb.FloatGrid.
2. Writes them to a .vdb file; loads it as a bpy.types.Volume object.
3. Configures an EEVEE Next Principled Volume material, binding "density" grid.
4. Re-reads the .vdb with pyopenvdb; samples on a coarsened stride grid.
5. Instances icospheres at high-density points (scale ∝ density, vertex colour).
6. Joins, exports GLB (Draco-6, WebP) + JSON metadata for the WebXR renderer.

KEY BLENDER 5.1 / PYOPENVDB FACTS
===================================
• import pyopenvdb        — works inside Blender 5.1's bundled Python ONLY.
• pyopenvdb.FloatGrid(0.0) — background=0 (inactive default); name must match
  the Principled Volume 'Density Attribute' input or EEVEE sees nothing.
• pyopenvdb.createLinearTransform(voxelSize) — uniform-scale transform that
  maps index (i,j,k) → world (i*vs, j*vs, k*vs).  Required for world-space
  export of sampled positions.
• accessor.setValueOn((i,j,k), v) — marks voxel active AND sets value.
  accessor.setValue() sets value but leaves active flag unchanged — prefer
  setValueOn() for building a new grid from scratch.
• accessor.getValue((i,j,k)) — returns background (0) for inactive coords;
  no range check, no exception.  Safe to call outside the active bbox.
• pyopenvdb.write(path, grids=[g]) — writes one or more named grids to .vdb.
• grid.activeVoxelCount()    — integer count of active leaf voxels.
• bpy.data.volumes           — exposes metadata (grid names, matrix) but NOT
  voxel values.  Use pyopenvdb.read() for data access.
• bpy.ops.object.volume_add() — creates Volume object + links it to the scene;
  then set vol.data.filepath to your .vdb path.
"""

import json
import math
import bpy
from mathutils import Vector

try:
    import pyopenvdb as vdb
    HAS_OPENVDB = True
except ImportError:
    HAS_OPENVDB = False
    print("[holoflow] pyopenvdb not available — generation + sampling skipped.")

# ── parameters ──────────────────────────────────────────────────────────────
VDB_PATH          = "/tmp/holoflow_density.vdb"
GLB_PATH          = "//density_cloud.glb"
META_PATH         = "//vdb_meta.json"

VOXEL_SIZE        = 0.05       # metres/voxel (5 cm)
BLOB_RADIUS       = 18         # voxels  (18 × 0.05 m = 0.9 m radius)
BLOB_A            = (0, 0, 0)  # index-space centre, blob A (peak density 1.0)
BLOB_B            = (22, 8, 4) # index-space centre, blob B (overlapping)
BLOB_B_WEIGHT     = 0.75       # peak density of blob B relative to A

DENSITY_THRESHOLD = 0.25       # voxels below this are not sampled
SAMPLE_STEP       = 3          # stride in voxels for point-cloud sampling
MAX_POINTS        = 1_800      # hard cap on instanced spheres in the GLB

SPHERE_SUBDIVS    = 2          # icosphere subdivision (low-poly for WebXR)
SPHERE_BASE_R     = 0.018      # base icosphere radius in metres

DRACO_LEVEL       = 6
USE_WEBP          = True


# ── helpers ─────────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def gauss(dist, radius):
    """Gaussian falloff: 1.0 at centre, ≈ 0.022 at dist == radius."""
    sigma = radius * 0.5
    return math.exp(-0.5 * (dist / sigma) ** 2)


# ── STEP 1 — build pyopenvdb density field and write .vdb ────────────────────

def build_vdb():
    """
    Two overlapping Gaussian blobs create additive density interference —
    more visually interesting than a single sphere and exercises the
    density_range correctly (values can exceed 1.0 in the overlap zone).

    WHY accessor.setValueOn() rather than grid.fill():
    grid.fill() sets a rectangular region to a uniform value — unsuitable
    for a spatially-varying Gaussian.  The accessor approach is O(active voxels)
    with near-O(1) per write due to the tree-node caching in the accessor.
    """
    if not HAS_OPENVDB:
        return False

    grid = vdb.FloatGrid(0.0)
    grid.name = "density"                            # MUST match material attr
    grid.transform = vdb.createLinearTransform(VOXEL_SIZE)

    accessor = grid.getAccessor()

    ax, ay, az = BLOB_A
    bx, by, bz = BLOB_B
    r = BLOB_RADIUS
    lo = (min(ax, bx) - r - 2, min(ay, by) - r - 2, min(az, bz) - r - 2)
    hi = (max(ax, bx) + r + 2, max(ay, by) + r + 2, max(az, bz) + r + 2)

    for i in range(lo[0], hi[0] + 1):
        for j in range(lo[1], hi[1] + 1):
            for k in range(lo[2], hi[2] + 1):
                da = math.sqrt((i-ax)**2 + (j-ay)**2 + (k-az)**2)
                db = math.sqrt((i-bx)**2 + (j-by)**2 + (k-bz)**2)
                val = gauss(da, r) + BLOB_B_WEIGHT * gauss(db, r)
                if val > 0.001:                      # keep sparse — skip near-zero
                    accessor.setValueOn((i, j, k), min(val, 1.5))

    vdb.write(VDB_PATH, grids=[grid])
    print(f"[holoflow] VDB → {VDB_PATH}  ({grid.activeVoxelCount()} active voxels)")
    return True


# ── STEP 2 — load VDB as bpy.types.Volume + EEVEE Next material ──────────────

def load_volume():
    """
    volume_add() creates a Volume Object + links it to the active collection.
    Setting vol.data.filepath after creation binds the external .vdb.

    The Principled Volume 'Density Attribute' string must equal the grid name
    written by pyopenvdb.  EEVEE Next queries the .vdb at render time via
    OpenVDB's trilinear interpolation; if the name doesn't match, density = 0.
    """
    bpy.ops.object.volume_add(align='WORLD', location=(0, 0, 0), scale=(1, 1, 1))
    vol_obj = bpy.context.active_object
    vol_obj.name = "density_field"
    vol_obj.data.filepath     = VDB_PATH
    vol_obj.data.sequence_mode = 'SINGLE'

    mat = bpy.data.materials.new("vol_density")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    pvol = nt.nodes.new("ShaderNodeVolumePrincipled")
    out.location  = (300, 0)
    pvol.location = (0, 0)

    pvol.inputs["Density Attribute"].default_value   = "density"
    pvol.inputs["Density"].default_value              = 3.0
    pvol.inputs["Scatter Anisotropy"].default_value   = 0.15
    pvol.inputs["Emission Strength"].default_value    = 0.0   # scattering only

    nt.links.new(pvol.outputs["Volume"], out.inputs["Volume"])
    vol_obj.data.materials.append(mat)

    sc = bpy.context.scene
    sc.render.engine                   = 'BLENDER_EEVEE_NEXT'
    sc.eevee.use_volumetric_lights     = True
    sc.eevee.volumetric_end            = 10.0
    sc.eevee.volumetric_tile_size      = '4'

    return vol_obj


# ── STEP 3 — re-read VDB, sample voxels above threshold ──────────────────────

def sample_vdb():
    """
    pyopenvdb.read() returns a list of Python-accessible Grid objects.
    accessor.getValue() returns 0 (background) for inactive coords — no bounds
    exception.  Sampling on a regular stride grid (SAMPLE_STEP) caps output size
    without requiring iterAllValues(), whose tile-iteration API varies by build.
    """
    if not HAS_OPENVDB:
        # Analytic fallback so subsequent steps execute without a real VDB.
        pts = []
        for i in range(-18, 19, SAMPLE_STEP):
            for j in range(-18, 19, SAMPLE_STEP):
                for k in range(-18, 19, SAMPLE_STEP):
                    d = math.sqrt(i*i + j*j + k*k)
                    val = gauss(d, 18)
                    if val > DENSITY_THRESHOLD:
                        pts.append(((i*VOXEL_SIZE, j*VOXEL_SIZE, k*VOXEL_SIZE), val))
        pts.sort(key=lambda p: p[1], reverse=True)
        return pts[:MAX_POINTS]

    grids   = vdb.read(VDB_PATH)
    dgrid   = next((g for g in grids if g.name == "density"), grids[0])
    acc     = dgrid.getConstAccessor()

    ax, ay, az = BLOB_A
    bx, by, bz = BLOB_B
    r  = BLOB_RADIUS
    lo = (min(ax,bx)-r, min(ay,by)-r, min(az,bz)-r)
    hi = (max(ax,bx)+r, max(ay,by)+r, max(az,bz)+r)

    pts = []
    i = int(lo[0])
    while i <= int(hi[0]):
        j = int(lo[1])
        while j <= int(hi[1]):
            k = int(lo[2])
            while k <= int(hi[2]):
                val = acc.getValue((i, j, k))
                if val > DENSITY_THRESHOLD:
                    pts.append(((i * VOXEL_SIZE, j * VOXEL_SIZE, k * VOXEL_SIZE), val))
                k += SAMPLE_STEP
            j += SAMPLE_STEP
        i += SAMPLE_STEP

    pts.sort(key=lambda p: p[1], reverse=True)
    return pts[:MAX_POINTS]


# ── STEP 4 — instantiate icospheres, join, export GLB ────────────────────────

def build_glb(points):
    """
    Join all icosphere copies into one mesh before exporting.
    WHY join rather than Geometry Nodes instancing:
    A joined mesh exports as a single primitive in GLB — one draw call in WebXR.
    GN instances survive as GLTF EXT_mesh_gpu_instancing only when the exporter
    supports it; join is the safest universal path for < 2 k instances.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=SPHERE_SUBDIVS, radius=SPHERE_BASE_R, location=(0, 0, 0))
    proto = bpy.context.active_object
    proto.name = "pt_proto"

    def col_from_density(d):
        t = min(max(d, 0.0), 1.0)
        return (0.12 + 0.88 * t, 0.45 + 0.55 * t, 1.0, 1.0)   # blue→white

    copies = []
    for (wx, wy, wz), density in points:
        cp      = proto.copy()
        cp.data = proto.data.copy()
        cp.location = Vector((wx, wy, wz))
        s = 0.5 + density
        cp.scale = (s, s, s)

        mesh = cp.data
        if not mesh.color_attributes:
            mesh.color_attributes.new("density_col", type='FLOAT_COLOR', domain='CORNER')
        for elem in mesh.color_attributes["density_col"].data:
            elem.color = col_from_density(density)

        bpy.context.scene.collection.objects.link(cp)
        copies.append(cp)

    bpy.ops.object.select_all(action='DESELECT')
    for cp in copies:
        cp.select_set(True)
    proto.select_set(True)
    bpy.context.view_layer.objects.active = proto
    bpy.ops.object.join()

    cloud = bpy.context.active_object
    cloud.name = "density_cloud"

    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(GLB_PATH),
        export_format                        = 'GLB',
        use_selection                        = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = DRACO_LEVEL,
        export_image_format                  = 'WEBP' if USE_WEBP else 'AUTO',
        export_colors                        = True,
        export_normals                       = True,
    )
    print(f"[holoflow] GLB → {bpy.path.abspath(GLB_PATH)}")
    return cloud


# ── STEP 5 — write JSON metadata ────────────────────────────────────────────

def write_meta(points):
    if not points:
        return
    dens = [d for _, d in points]
    meta = {
        "voxel_size_m":   VOXEL_SIZE,
        "sample_step":    SAMPLE_STEP,
        "point_count":    len(points),
        "density_range":  [round(min(dens), 4), round(max(dens), 4)],
        "world_bbox": {
            "x": [min(p[0][0] for p in points), max(p[0][0] for p in points)],
            "y": [min(p[0][1] for p in points), max(p[0][1] for p in points)],
            "z": [min(p[0][2] for p in points), max(p[0][2] for p in points)],
        },
        "colour_decode": "density_cloud GLB vertex colour: R≈density; "
                         "col = mix(vec3(0.12,0.45,1.0), vec3(1.0), vCol.r)",
        "tsl_sample":    "const d=vertexColor.r; "
                         "const col=mix(vec3(0.12,0.45,1.0),vec3(1.0),d);",
    }
    out = bpy.path.abspath(META_PATH)
    with open(out, "w") as fh:
        json.dump(meta, fh, indent=2)
    print(f"[holoflow] META → {out}")


# ── main ────────────────────────────────────────────────────────────────────

def main():
    clear_scene()
    build_vdb()
    load_volume()
    pts = sample_vdb()
    print(f"[holoflow] {len(pts)} sample points above threshold {DENSITY_THRESHOLD}")
    build_glb(pts)
    write_meta(pts)
    print("[holoflow] Pipeline complete.")

main()
