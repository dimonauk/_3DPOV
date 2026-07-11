import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        OpenVDB is the Academy Software Foundation sparse-voxel library
        (Apache-2.0, originally DreamWorks Animation, 2012). Blender 5.1
        bundles <strong>pyopenvdb</strong> — the official C++ Python bindings —
        directly inside its own interpreter, so{" "}
        <code>import pyopenvdb</code> works from any Blender text-editor script
        without an external pip install. A VDB{" "}
        <strong>FloatGrid</strong> stores only active (non-zero) voxels in a
        sparse B-tree: a sphere 36 voxels in diameter inside a 256³ logical
        domain activates roughly 24 k voxels — iterable in under a second from
        Python, at 5 cm/voxel giving a 1.8 m diameter cloud. This tutorial
        builds a <strong>dual-blob density field</strong> procedurally,
        loads it as a <code>bpy.types.Volume</code> object, samples
        it above a density threshold, and exports an instanced icosphere{" "}
        <strong>point-cloud GLB</strong> for WebXR — with per-vertex colour
        encoding the local density. It builds on the spatial-data pipelines in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-volume-cube-procedural-cloud"
          className={lk}
        >
          GN procedural volume cloud
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-volume-to-mesh-point-cloud-blob-reconstruction"
          className={lk}
        >
          GN volume-to-mesh point cloud
        </Link>{" "}
        tutorials, and extends the pixel-buffer technique from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-image-pixel-buffer-sdf-texture-atlas-webxr"
          className={lk}
        >
          SDF texture atlas tutorial
        </Link>
        .
      </p>
      <p>
        Outside references:{" "}
        <a
          href="https://www.openvdb.org/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenVDB — Academy Software Foundation (Apache-2.0)
        </a>
        ; sibling projects:{" "}
        <a
          href="https://github.com/AcademySoftwareFoundation/openvdb"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/AcademySoftwareFoundation/openvdb
        </a>{" "}
        (pyopenvdb bindings in{" "}
        <code>openvdb/python/</code>), NanoVDB (GPU-native VDB for WebGPU,
        same repo).{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/volumes/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Volumes (CC-BY-SA 4.0)
        </a>
        ; sibling:{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          projects.blender.org/blender/blender
        </a>
        .
      </p>
    </>
  );
}

export const entry = buildInstructable(
  {
    steps: [
      {
        title: "Generate the dual-blob density field with pyopenvdb",
        body: `# pyopenvdb.FloatGrid(background) — background is the value returned
# for any coordinate NOT explicitly set (inactive voxels).  Setting it to 0
# means density is 0 everywhere until we call accessor.setValueOn().
#
# WHY two blobs: additive interference creates a non-trivial density field
# that exercises density_range properly (values can exceed 1.0 in the overlap
# zone) and makes the resulting point cloud visually interesting.
#
# WHY accessor.setValueOn() rather than grid.fill():
# fill() writes a constant to a rectangular tile — it cannot represent a
# spatially-varying Gaussian.  The accessor uses the VDB tree's node cache
# so repeated writes to nearby coordinates are near-O(1) in practice.

import math, pyopenvdb as vdb

VOXEL_SIZE    = 0.05
BLOB_RADIUS   = 18
BLOB_A        = (0, 0, 0)
BLOB_B        = (22, 8, 4)
BLOB_B_WEIGHT = 0.75
VDB_PATH      = "/tmp/holoflow_density.vdb"

def gauss(dist, radius):
    sigma = radius * 0.5
    return math.exp(-0.5 * (dist / sigma) ** 2)

grid = vdb.FloatGrid(0.0)
grid.name = "density"                         # MUST match material attr name
grid.transform = vdb.createLinearTransform(VOXEL_SIZE)

accessor = grid.getAccessor()
ax, ay, az = BLOB_A
bx, by, bz = BLOB_B
r = BLOB_RADIUS
for i in range(min(ax,bx)-r-2, max(ax,bx)+r+3):
    for j in range(min(ay,by)-r-2, max(ay,by)+r+3):
        for k in range(min(az,bz)-r-2, max(az,bz)+r+3):
            da = math.sqrt((i-ax)**2 + (j-ay)**2 + (k-az)**2)
            db = math.sqrt((i-bx)**2 + (j-by)**2 + (k-bz)**2)
            val = gauss(da, r) + BLOB_B_WEIGHT * gauss(db, r)
            if val > 0.001:                   # keep sparse — skip near-zero
                accessor.setValueOn((i, j, k), min(val, 1.5))

vdb.write(VDB_PATH, grids=[grid])
print(f"Active voxels: {grid.activeVoxelCount()}")`,
      },
      {
        title: "Load the VDB as bpy.types.Volume and wire EEVEE Next material",
        body: `# bpy.ops.object.volume_add() creates a Volume Object and links it to the
# active collection — the equivalent of dragging a .vdb from the asset browser.
# Set vol_obj.data.filepath AFTER the call; the operator accepts filepath= as
# a keyword but the parameter is not always exposed in Blender 5.1's RNA.
#
# The Principled Volume node's 'Density Attribute' field is a string that names
# a grid in the .vdb file.  EEVEE Next queries that grid via OpenVDB's
# trilinear interpolation during the volumetric render pass.  If the string
# does not match any grid name exactly, EEVEE silently renders zero density.
#
# sequence_mode = 'SINGLE' means Blender reads frame 0 of the VDB regardless
# of the scene timeline — correct for a static density field.

import bpy

VDB_PATH = "/tmp/holoflow_density.vdb"

bpy.ops.object.volume_add(align='WORLD', location=(0, 0, 0), scale=(1, 1, 1))
vol_obj = bpy.context.active_object
vol_obj.name = "density_field"
vol_obj.data.filepath      = VDB_PATH
vol_obj.data.sequence_mode = 'SINGLE'

mat = bpy.data.materials.new("vol_density")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()

out  = nt.nodes.new("ShaderNodeOutputMaterial")
pvol = nt.nodes.new("ShaderNodeVolumePrincipled")
out.location = (300, 0); pvol.location = (0, 0)

pvol.inputs["Density Attribute"].default_value  = "density"  # grid name
pvol.inputs["Density"].default_value             = 3.0
pvol.inputs["Scatter Anisotropy"].default_value  = 0.15
pvol.inputs["Emission Strength"].default_value   = 0.0

nt.links.new(pvol.outputs["Volume"], out.inputs["Volume"])
vol_obj.data.materials.append(mat)

sc = bpy.context.scene
sc.render.engine               = 'BLENDER_EEVEE_NEXT'
sc.eevee.use_volumetric_lights = True
sc.eevee.volumetric_end        = 10.0
sc.eevee.volumetric_tile_size  = '4'   # finer tile = better detail, more VRAM`,
      },
      {
        title: "Sample voxels above threshold via pyopenvdb.read()",
        body: `# pyopenvdb.read() returns a Python list of Grid objects — one per named
# grid in the .vdb file.  We pick the 'density' grid by name.
#
# getConstAccessor() is read-only and slightly faster than getAccessor()
# because it skips the write-lock on the tree nodes.
#
# WHY stride sampling rather than iterAllValues():
# iterAllValues() visits tiles and voxels together; its Python-visible API
# varies between pyopenvdb builds shipped with different Blender versions.
# Stride sampling with accessor.getValue() is guaranteed stable and
# naturally caps output size without a secondary sort-and-cap step.
# Drawback: misses voxels between sample points — acceptable for a visual
# point cloud where MAX_POINTS ≈ 1 800 already caps resolution.

import math, pyopenvdb as vdb

VDB_PATH          = "/tmp/holoflow_density.vdb"
VOXEL_SIZE        = 0.05
DENSITY_THRESHOLD = 0.25
SAMPLE_STEP       = 3
MAX_POINTS        = 1800
BLOB_A = (0,0,0); BLOB_B = (22,8,4); BLOB_RADIUS = 18

grids   = vdb.read(VDB_PATH)
dgrid   = next((g for g in grids if g.name == "density"), grids[0])
acc     = dgrid.getConstAccessor()

r  = BLOB_RADIUS
lo = (min(0,22)-r, min(0,8)-r, min(0,4)-r)
hi = (max(0,22)+r, max(0,8)+r, max(0,4)+r)

pts = []
i = int(lo[0])
while i <= int(hi[0]):
    j = int(lo[1])
    while j <= int(hi[1]):
        k = int(lo[2])
        while k <= int(hi[2]):
            val = acc.getValue((i, j, k))   # returns 0 for inactive coords
            if val > DENSITY_THRESHOLD:
                pts.append(((i*VOXEL_SIZE, j*VOXEL_SIZE, k*VOXEL_SIZE), val))
            k += SAMPLE_STEP
        j += SAMPLE_STEP
    i += SAMPLE_STEP

pts.sort(key=lambda p: p[1], reverse=True)
pts = pts[:MAX_POINTS]
print(f"Sampled {len(pts)} points above {DENSITY_THRESHOLD}")`,
      },
      {
        title: "Instance icospheres, set vertex colour, join and export GLB",
        body: `# WHY join rather than Geometry Nodes instancing for < 2 k instances:
# Joined mesh → single GLB primitive → one WebXR draw call.
# GN instance output survives GLB export as EXT_mesh_gpu_instancing only
# when every instance has an identical mesh; our per-point scale breaks that.
# For > 10 k points, prefer a GN Scatter + Instance on Points setup instead.
#
# Vertex colour domain='CORNER' (face-corner) is the GLB convention;
# GLTF_COLOR_0 attribute in the .glb maps to vColor in a GLSL shader.
# The colour encodes density: R≈density, blue channel always 1.0.
# WebXR decode: mix(vec3(0.12, 0.45, 1.0), vec3(1.0), vColor.r)

import bpy
from mathutils import Vector

GLB_PATH = "//density_cloud.glb"
SPHERE_SUBDIVS = 2
SPHERE_BASE_R  = 0.018

bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=SPHERE_SUBDIVS, radius=SPHERE_BASE_R, location=(0,0,0))
proto      = bpy.context.active_object
proto.name = "pt_proto"

def density_col(d):
    t = min(max(d, 0.0), 1.0)
    return (0.12 + 0.88*t, 0.45 + 0.55*t, 1.0, 1.0)

copies = []
for (wx, wy, wz), density in pts:
    cp      = proto.copy()
    cp.data = proto.data.copy()
    cp.location = Vector((wx, wy, wz))
    s = 0.5 + density
    cp.scale = (s, s, s)
    mesh = cp.data
    if not mesh.color_attributes:
        mesh.color_attributes.new("density_col", 'FLOAT_COLOR', 'CORNER')
    for elem in mesh.color_attributes["density_col"].data:
        elem.color = density_col(density)
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
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_colors                        = True,
    export_normals                       = True,
)
print(f"GLB → {bpy.path.abspath(GLB_PATH)}")`,
      },
      {
        title: "Write vdb_meta.json and decode in WebXR / Three.js",
        body: `# vdb_meta.json gives the WebXR renderer the information it needs to
# position and colour the point cloud without re-reading the .vdb at runtime:
# density_range for normalising the colour ramp, world_bbox for frustum
# culling, and a TSL snippet ready to paste into a MeshStandardNodeMaterial.
#
# Three.js import (r165+):
#   const loader    = new GLTFLoader();
#   const { scene } = await loader.loadAsync('density_cloud.glb');
#   // vertex colour is GLTF_COLOR_0 → in Three.js it arrives as vertexColor
#   const mat = new MeshStandardMaterial({ vertexColors: true });
#   scene.traverse(o => { if (o.isMesh) o.material = mat; });
#
# For TSL (Three.js r168+):
#   import { mix, vec3, attribute } from 'three/tsl';
#   const d   = attribute('color').r;  // density in red channel
#   const col = mix(vec3(0.12, 0.45, 1.0), vec3(1.0), d);

import bpy, json

META_PATH = "//vdb_meta.json"

dens = [d for _, d in pts]
meta = {
    "voxel_size_m": 0.05,
    "sample_step":  3,
    "point_count":  len(pts),
    "density_range": [round(min(dens), 4), round(max(dens), 4)],
    "world_bbox": {
        "x": [min(p[0][0] for p in pts), max(p[0][0] for p in pts)],
        "y": [min(p[0][1] for p in pts), max(p[0][1] for p in pts)],
        "z": [min(p[0][2] for p in pts), max(p[0][2] for p in pts)],
    },
    "colour_decode_glsl":
        "vec3 col = mix(vec3(0.12,0.45,1.0), vec3(1.0), vColor.r);",
    "colour_decode_tsl":
        "const col = mix(vec3(0.12,0.45,1.0), vec3(1.0), attribute('color').r);",
}
out = bpy.path.abspath(META_PATH)
with open(out, "w") as fh:
    json.dump(meta, fh, indent=2)
print(f"META → {out}")
print(f"[holoflow] Pipeline complete — {len(pts)} points exported.")`,
      },
    ],
    troubleshooting: [
      {
        problem: "ImportError: No module named 'pyopenvdb'",
        solution:
          "This error means the script is running outside Blender's bundled Python interpreter (e.g. in a system Python or VS Code terminal). pyopenvdb is bundled with Blender 5.1's Python only. Always run blueprint.py via the Blender Scripting workspace Text Editor → Run Script, or via `blender --python blueprint.py --background`.",
      },
      {
        problem: "density_field Volume object appears invisible in the viewport",
        solution:
          "Volume objects only render visibly in Rendered shading mode (Z → Rendered). In Solid mode they show as an orange wireframe bounding box — this is expected. Switch to Rendered mode after loading the .vdb to confirm EEVEE Next is picking up the density grid.",
      },
      {
        problem: "Volume renders as empty / zero density in EEVEE Next",
        solution:
          "The 'Density Attribute' string in the Principled Volume node must exactly match the grid name written by pyopenvdb. The blueprint sets grid.name = 'density' and pvol.inputs['Density Attribute'].default_value = 'density' — they must be identical. Check for leading/trailing spaces. Inspect grid names with: `import pyopenvdb as vdb; [g.name for g in vdb.read(VDB_PATH)]`.",
      },
      {
        problem: "accessor.getValue() always returns 0 / no sample points found",
        solution:
          "Verify the .vdb was written successfully by checking that /tmp/holoflow_density.vdb exists and is > 10 KB. Then confirm the stride loop bounds match the blob centres: lo/hi must bracket both BLOB_A and BLOB_B centres ± BLOB_RADIUS. Print `acc.getValue(BLOB_A)` — it should return ≈ 1.0 at the first blob's centre voxel.",
      },
      {
        problem: "GLB export produces a file but density_cloud has no vertex colours in Three.js",
        solution:
          "The GLTF exporter requires `export_colors=True` AND the mesh to have a color_attributes layer named correctly. Verify in Blender: select density_cloud → Properties → Data → Color Attributes — 'density_col' should appear. In Three.js set `material.vertexColors = true` or use TSL `attribute('color')`; the attribute arrives as GLTF COLOR_0.",
      },
    ],
    outsideSources: [
      {
        title: "OpenVDB — Academy Software Foundation (Apache-2.0)",
        author: "DreamWorks Animation / Academy Software Foundation",
        licence: "Apache-2.0",
        url: "https://www.openvdb.org/",
        relatedProjects: [
          "https://github.com/AcademySoftwareFoundation/openvdb",
          "https://github.com/AcademySoftwareFoundation/openvdb/tree/master/openvdb/openvdb/python",
        ],
      },
      {
        title: "Blender Manual — Volumes (CC-BY-SA 4.0)",
        author: "Blender Foundation",
        licence: "CC-BY-SA-4.0",
        url: "https://docs.blender.org/manual/en/latest/modeling/volumes/",
        relatedProjects: [
          "https://projects.blender.org/blender/blender",
          "https://developer.blender.org/docs/",
        ],
      },
    ],
  },
  {
    slug: "python-bpy-volume-openvdb-domain-field-sample-webxr",
    title:
      "Python pyopenvdb + bpy.types.Volume — VDB Density Field & WebXR Particle Cloud (Blender 5.1)",
    description:
      "Use Blender 5.1's bundled pyopenvdb bindings to generate a sparse dual-blob density field, load it as a Volume object with EEVEE Next volumetric rendering, sample active voxels above a threshold, and export an instanced point-cloud GLB for WebXR with per-vertex density colour.",
    date: "2026-07-11",
    image: null,
    body: <Body />,
    tags: [
      "blender",
      "python",
      "scripting",
      "openvdb",
      "pyopenvdb",
      "volume",
      "voxel",
      "point-cloud",
      "webxr",
      "eevee-next",
      "particle",
      "glb",
    ],
  }
);
