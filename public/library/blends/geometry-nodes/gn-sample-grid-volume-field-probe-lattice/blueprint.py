"""
GN Sample Grid — Volume Field Probe: Lattice Sensor Constellation
Blender 5.1 · CC0 · Holoflow Studio

GeometryNodeSampleGrid reads a named scalar (or vector) grid from a Volume
geometry at an arbitrary 3-D position, returning the interpolated value.
It is the inverse of Volume Cube: where VolumeCube WRITES a field into a
grid at every voxel, SampleGrid READS that grid at arbitrary query positions.

Pipeline:
  SG_Volume object  →  HS_SG_VolumeField GN modifier
    NoiseTexture field → VolumeCube (grid name 'density') → Volume geometry

  SG_Probe object   →  HS_SG_FieldProbe GN modifier
    ObjectInfo(SG_Volume) → Volume
    DistributePointsInVolume(mode=DENSITY_GRID) → uniform lattice of sensor pts
    SampleGrid(Volume, Grid='density', Position=pt.Position) → density float
    density < THRESHOLD → DeleteGeometry  (sparse regions removed)
    density → MapRange → ColorRamp → StoreNamedAttribute('Col', FLOAT_COLOR)
    density → Math(MULTIPLY) → CombineXYZ → InstanceOnPoints.Scale
    RealizeInstances → GLB export

COORDINATE SPACE RULE:
  SampleGrid.Position is interpreted in the VOLUME OBJECT'S LOCAL SPACE.
  The probe's Position node gives positions in the PROBE OBJECT'S local space.
  Both objects must share origin + transform so the spaces coincide, or you
  must multiply Position by the inverse of (vol_world @ inv(probe_world)).

Outside sources:
  Blender Manual — Sample Grid node (CC-BY-SA 4.0, Blender Foundation)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/volume/sample_grid.html
  AcademySoftwareFoundation/openvdb Apache-2.0 · ASWF
    https://github.com/AcademySoftwareFoundation/openvdb
    sibling: openvdb/nanovdb (Apache-2.0)
  njanakiev/blender-scripting MIT · Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
"""

import bpy
import os

# ── Parameters ─────────────────────────────────────────────────────────────────
HALF_SIZE        = 2.0    # volume cube half-extent (m) → 4 m³ bounding box
VOXEL_RES        = 48     # voxels per axis: 48³ = 110 592 voxels
NOISE_SCALE      = 1.3    # spatial frequency of Perlin noise density
NOISE_DETAIL     = 5.0    # octave count (higher = more cloud tufts)
NOISE_ROUGHNESS  = 0.55   # inter-octave amplitude decay
NOISE_FROM_MIN   = 0.30   # noise values below this → density 0.0
NOISE_FROM_MAX   = 0.78   # noise values above this → density 1.0

GRID_SPACING     = 0.13   # sensor lattice step (m): ≈31 pts/axis → 29 791 sensors
THRESHOLD        = 0.38   # minimum density to survive (removes sparse haze)
SENSOR_RADIUS    = 0.022  # sphere glyph radius (m) — small enough not to clutter
SCALE_FACTOR     = 3.8    # densest sensors are SCALE_FACTOR× larger than minimum

OBJ_VOL          = "SG_Volume"
OBJ_PROBE        = "SG_Probe"
NG_VOL           = "HS_SG_VolumeField"
NG_PROBE         = "HS_SG_FieldProbe"
MAT_PROBE        = "SG_ProbeMat"
BLEND_OUT        = "//field_probe.blend"
GLB_OUT          = "//field_probe.glb"


def _lk(ng, a, b):
    ng.links.new(a, b)


def _clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def build_volume_gn_tree():
    """HS_SG_VolumeField: noise-density Volume Cube → Volume geometry output."""
    ng = bpy.data.node_groups.new(NG_VOL, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N, L = ng.nodes, ng.links

    out_n = N.new('NodeGroupOutput'); out_n.location = (600, 0)

    noise = N.new('ShaderNodeTexNoise')
    noise.location = (-300, 100)
    noise.noise_dimensions = '3D'
    noise.inputs['Scale'].default_value      = NOISE_SCALE
    noise.inputs['Detail'].default_value     = NOISE_DETAIL
    noise.inputs['Roughness'].default_value  = NOISE_ROUGHNESS
    noise.inputs['Distortion'].default_value = 0.0

    # Remap noise [FROM_MIN, FROM_MAX] → [0, 1] with smooth interpolation.
    # Threshold at FROM_MIN concentrates density into isolated cloud lumps.
    mr = N.new('ShaderNodeMapRange')
    mr.location = (-100, 100)
    mr.data_type          = 'FLOAT'
    mr.interpolation_type = 'SMOOTHSTEP'
    mr.clamp              = True
    mr.inputs['From Min'].default_value = NOISE_FROM_MIN
    mr.inputs['From Max'].default_value = NOISE_FROM_MAX
    mr.inputs['To Min'].default_value   = 0.0
    mr.inputs['To Max'].default_value   = 1.0

    vc = N.new('GeometryNodeVolumeCube')  # bl_idname GeometryNodeVolumeCube
    vc.location = (300, 0)
    vc.inputs['Resolution X'].default_value = VOXEL_RES
    vc.inputs['Resolution Y'].default_value = VOXEL_RES
    vc.inputs['Resolution Z'].default_value = VOXEL_RES
    vc.inputs['Min'].default_value = (-HALF_SIZE, -HALF_SIZE, -HALF_SIZE)
    vc.inputs['Max'].default_value = ( HALF_SIZE,  HALF_SIZE,  HALF_SIZE)

    _lk(ng, noise.outputs['Fac'],    mr.inputs['Value'])
    _lk(ng, mr.outputs['Result'],    vc.inputs['Density'])
    _lk(ng, vc.outputs['Volume'],    out_n.inputs['Geometry'])
    return ng


def build_probe_gn_tree(vol_ob):
    """HS_SG_FieldProbe: Sample Grid → density-coded point constellation."""
    ng = bpy.data.node_groups.new(NG_PROBE, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N, L = ng.nodes, ng.links

    in_n  = N.new('NodeGroupInput');  in_n.location  = (-1100, 0)
    out_n = N.new('NodeGroupOutput'); out_n.location = (  900, 0)

    # Object Info: pull the volume's evaluated geometry (the VDB grids).
    # transform_space='ORIGINAL' keeps the volume in its own local space.
    # Both objects share world origin → probe local space = volume local space.
    oi = N.new('GeometryNodeObjectInfo')
    oi.location = (-900, 300)
    oi.inputs['Object'].default_value = vol_ob
    oi.transform_space = 'ORIGINAL'

    # Distribute on a regular 3-D lattice so every voxel region is sampled.
    # mode=DENSITY_GRID: point at every active-voxel centre with spacing GRID_SPACING.
    # Threshold=0 includes all voxels; Sample Grid does the density filtering.
    dist = N.new('GeometryNodeDistributePointsInVolume')
    dist.location = (-700, 300)
    dist.mode = 'DENSITY_GRID'
    dist.inputs['Spacing'].default_value   = GRID_SPACING
    dist.inputs['Threshold'].default_value = 0.0

    # Sample Grid: read 'density' grid value at each point's current position.
    # Grid Name='density' matches Volume Cube's default output grid name.
    # data_type='FLOAT' → Value output is a per-point float field.
    sg = N.new('GeometryNodeSampleGrid')
    sg.location = (-500, 0)
    sg.data_type = 'FLOAT'
    sg.inputs['Grid Name'].default_value = 'density'

    pos = N.new('GeometryNodeInputPosition'); pos.location = (-700, -100)

    # Delete points where density is below threshold (sparse noise haze).
    cmp = N.new('FunctionNodeCompare')
    cmp.location = (-300, -100)
    cmp.data_type = 'FLOAT'
    cmp.operation = 'LESS_THAN'
    cmp.inputs['B'].default_value = THRESHOLD

    del_geo = N.new('GeometryNodeDeleteGeometry')
    del_geo.location = (-100, 300)
    del_geo.domain = 'POINT'
    del_geo.mode   = 'ALL'

    # Remap surviving density to [0, 1] for colour + scale mapping.
    mr = N.new('ShaderNodeMapRange')
    mr.location = (-300, 300)
    mr.data_type = 'FLOAT'
    mr.clamp     = True
    mr.inputs['From Min'].default_value = THRESHOLD
    mr.inputs['From Max'].default_value = 1.0
    mr.inputs['To Min'].default_value   = 0.0
    mr.inputs['To Max'].default_value   = 1.0

    # ColorRamp: deep blue (just above threshold) → cyan → white (densest).
    cr = N.new('ShaderNodeValToRGB'); cr.location = (100, 450)
    elems = cr.color_ramp.elements
    elems[0].position = 0.0; elems[0].color = (0.04, 0.08, 0.85, 1.0)
    elems[1].position = 1.0; elems[1].color = (1.0,  1.0,  1.0,  1.0)
    mid = elems.new(0.48);   mid.color      = (0.0,  0.85, 0.92, 1.0)

    # Store density colour as 'Col' FLOAT_COLOR attribute.
    store = N.new('GeometryNodeStoreNamedAttribute')
    store.location = (300, 300)
    store.data_type = 'FLOAT_COLOR'
    store.domain    = 'POINT'
    store.inputs['Name'].default_value = 'Col'

    # Scale glyph by density: dense points appear larger.
    mth = N.new('ShaderNodeMath'); mth.location = (-300, -250)
    mth.operation = 'MULTIPLY'
    mth.inputs[1].default_value = SCALE_FACTOR

    cxyz = N.new('ShaderNodeCombineXYZ'); cxyz.location = (-100, -250)

    # Tiny sphere glyphs: low segment count keeps GLB vertex budget small.
    glyph = N.new('GeometryNodeMeshUVSphere'); glyph.location = (100, -300)
    glyph.inputs['Segments'].default_value = 4
    glyph.inputs['Rings'].default_value    = 3
    glyph.inputs['Radius'].default_value   = SENSOR_RADIUS

    iop  = N.new('GeometryNodeInstanceOnPoints'); iop.location  = (500, 300)
    real = N.new('GeometryNodeRealizeInstances'); real.location = (700, 300)

    # Wiring ─────────────────────────────────────────────────────────────
    lk = lambda a, b: _lk(ng, a, b)
    lk(oi.outputs['Geometry'],  dist.inputs['Volume'])
    lk(oi.outputs['Geometry'],  sg.inputs['Volume'])
    lk(dist.outputs['Points'],  del_geo.inputs['Geometry'])
    lk(pos.outputs['Position'], sg.inputs['Position'])
    lk(sg.outputs['Value'],     cmp.inputs['A'])
    lk(sg.outputs['Value'],     mr.inputs['Value'])
    lk(sg.outputs['Value'],     mth.inputs[0])
    lk(cmp.outputs['Result'],   del_geo.inputs['Selection'])
    lk(del_geo.outputs['Geometry'], store.inputs['Geometry'])
    lk(mr.outputs['Result'],    cr.inputs['Fac'])
    lk(cr.outputs['Color'],     store.inputs['Value'])
    lk(mth.outputs['Value'],    cxyz.inputs['X'])
    lk(mth.outputs['Value'],    cxyz.inputs['Y'])
    lk(mth.outputs['Value'],    cxyz.inputs['Z'])
    lk(store.outputs['Geometry'], iop.inputs['Points'])
    lk(glyph.outputs['Mesh'],   iop.inputs['Instance'])
    lk(cxyz.outputs['Vector'],  iop.inputs['Scale'])
    lk(iop.outputs['Instances'], real.inputs['Geometry'])
    lk(real.outputs['Geometry'], out_n.inputs['Geometry'])
    return ng


def make_emission_mat():
    """Emission material reading 'Col' vertex attribute for WebXR display."""
    mat = bpy.data.materials.new(MAT_PROBE)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial'); out.location  = (400, 0)
    emit = nt.nodes.new('ShaderNodeEmission');       emit.location = (200, 0)
    attr = nt.nodes.new('ShaderNodeAttribute');      attr.location = (0, 0)
    attr.attribute_name = 'Col'
    attr.attribute_type = 'GEOMETRY'
    emit.inputs['Strength'].default_value = 2.5

    nt.links.new(attr.outputs['Color'], emit.inputs['Color'])
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


def main():
    _clear()
    sc = bpy.context.scene
    col = bpy.data.collections.new("SampleGrid")
    sc.collection.children.link(col)

    # ── Volume object ─────────────────────────────────────────────────────
    vol_me = bpy.data.meshes.new(OBJ_VOL)
    vol_ob = bpy.data.objects.new(OBJ_VOL, vol_me)
    col.objects.link(vol_ob)
    vol_ng = build_volume_gn_tree()
    vol_mod = vol_ob.modifiers.new("GN_Volume", 'NODES')
    vol_mod.node_group = vol_ng
    vol_ob.hide_render = True  # only the probe constellation renders

    # ── Probe object ──────────────────────────────────────────────────────
    probe_me = bpy.data.meshes.new(OBJ_PROBE)
    probe_ob = bpy.data.objects.new(OBJ_PROBE, probe_me)
    col.objects.link(probe_ob)
    probe_ng = build_probe_gn_tree(vol_ob)
    probe_mod = probe_ob.modifiers.new("GN_Probe", 'NODES')
    probe_mod.node_group = probe_ng
    mat = make_emission_mat()
    probe_ob.data.materials.append(mat)

    # World: black backdrop so emission glows
    sc.world = bpy.data.worlds.new("World")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value   = (0.0, 0.0, 0.0, 1.0)
    bg.inputs['Strength'].default_value = 0.0

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))

    # GLB export: apply modifiers, include vertex colours as COLOR_0
    bpy.ops.object.select_all(action='DESELECT')
    probe_ob.select_set(True)
    bpy.context.view_layer.objects.active = probe_ob
    bpy.ops.export_scene.gltf(
        filepath          = bpy.path.abspath(GLB_OUT),
        export_format     = 'GLB',
        use_selection     = True,
        export_apply      = True,
        export_colors     = True,
        export_attributes = True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[blueprint] saved → {BLEND_OUT} and {GLB_OUT}")


main()
