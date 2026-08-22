import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ClothSimulationFlagBody() {
  return (
    <>
      <p>
        Blender&rsquo;s Cloth modifier is a spring-mass particle system, not a
        continuous FEM solver. Every vertex in the mesh becomes a mass-point;
        every edge becomes a spring whose stiffness you dial in directly.  Three
        spring types determine the fabric&rsquo;s character: <em>tension /
        compression</em> springs along mesh edges resist stretching; <em>shear</em>{" "}
        springs along diagonals resist in-plane parallelogram distortion; and{" "}
        <em>bending</em> springs between adjacent face pairs resist folding.
        For a real flag the bending stiffness is almost zero &mdash; polyester
        has negligible flexural rigidity, which is why flags ripple with
        fine-resolution wrinkles rather than curling gently like a stiff piece
        of card.  Compare the Bullet impulse solver used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-rigid-body-dominoes-brick-wall"
          className={lk}
        >
          rigid-body domino chain tutorial
        </Link>
        : that solver tracks discrete rigid bodies with mass and inertia tensors.
        The cloth solver tracks a continuous deformable manifold.  The two
        systems co-exist in the same scene and interact through Blender&rsquo;s
        shared Collision modifier.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Time integration &mdash; why implicit?
      </h3>
      <p>
        Cloth uses a Newmark-&beta; implicit integration scheme.  Unlike explicit
        Euler, implicit integration is unconditionally stable: it can take large
        timesteps without the simulation &ldquo;exploding.&rdquo;  The trade-off is a
        sparse linear solve per substep, which is why high-resolution cloth is
        slow on CPU.  The <code>quality</code> parameter (substeps per frame)
        controls accuracy rather than stability &mdash; 8 substeps handles most
        slow-moving cloth; raise it to 20+ only when cloth collides with fast
        objects or is very stiff.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          Geometry Nodes Simulation Zone wave-reveal tutorial
        </Link>{" "}
        uses explicit Euler on a vertex position field &mdash; cheap for a smooth
        wave, but unstable at the same timestep for stiff springs.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Pinning via vertex groups
      </h3>
      <p>
        The &ldquo;Vertex Group Mass&rdquo; slot on <code>ClothSettings</code> accepts a
        vertex group whose weights map directly to the inverse-mass ratio.  Weight{" "}
        <code>1.0</code> gives the vertex infinite effective mass &mdash; the
        solver never moves it regardless of applied forces.  Weight{" "}
        <code>0.0</code> is a free particle.  Intermediate weights blend
        linearly, which lets you build soft anchor zones (like a fabric attached
        with a loose tack rather than a staple).  For the flag we assign weight{" "}
        <code>1.0</code> to every vertex in the leftmost column (the{" "}
        <em>hoist</em> column in sailing/flag terminology).  The same technique
        underpins VRM clothing attachments &mdash; see the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-weight-paint"
          className={lk}
        >
          armature weight-paint tutorial
        </Link>{" "}
        where bone influence weights create the deformation envelope.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Wind force field physics
      </h3>
      <p>
        A Wind effector applies a directional force proportional to the
        velocity difference between the wind field and each cloth face:
      </p>
      <pre className="bg-zinc-900 rounded p-3 text-sm my-3 overflow-x-auto">
{`F = ρ × (v_wind − v_cloth)² × A × Cd × n̂

where:
  ρ   = air density (baked into Blender's Air Viscosity)
  A   = local face area (larger faces absorb more force)
  Cd  = drag coefficient
  n̂   = face normal (force is zero when wind is edge-on to the fabric)`}
      </pre>
      <p>
        The Noise parameter overlays turbulence from a Perlin octave stack.
        At <code>noise = 0</code> the flag flows in a perfectly smooth arc;
        at <code>noise = 2.5</code> the surface breaks into the chaotic,
        non-repeating ripple you see on real flags.  The turbulence pattern
        moves through world space (
        <code>use_global_coords = True</code>), so the flag experiences different
        gusts as it flaps rather than the same pattern locked to the fabric.
        The Geometry Nodes{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-position-noise-displacement"
          className={lk}
        >
          noise-displacement blob planet tutorial
        </Link>{" "}
        samples the same Perlin stack (via the <em>Noise Texture</em> node) on
        vertex positions &mdash; understanding the shared primitive helps you
        predict why cloth noise and GN noise produce visually similar results.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Collision objects &mdash; the required modifier
      </h3>
      <p>
        The cloth solver detects surface proximity by checking each cloth
        particle against a BVH tree built from every object that carries a{" "}
        <em>Collision modifier</em>.  Without the modifier, the cloth passes
        through the geometry regardless of mesh overlap &mdash; this is the most
        common beginner mistake.  The modifier&rsquo;s <code>thickness_outer</code>{" "}
        pads the collision surface outward from the actual mesh by a small offset;
        set it too large and cloth floats visibly above the surface, too small
        and cloth may tunnel through in a single substep (fix by raising{" "}
        <code>collision_quality</code>).  The same principle appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-rigid-body-dominoes-brick-wall"
          className={lk}
        >
          rigid-body tutorial
        </Link>
        &rsquo;s <code>use_split_impulse</code> flag: both are numeric remedies for
        discrete-timestep tunnelling.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Self-collision &mdash; the expensive flag-fold fix
      </h3>
      <p>
        When a strong gust folds the flag back on itself, the cloth solver must
        detect face-to-face interpenetration within the same mesh.  Blender
        solves this with a separate BVH tree rebuilt for the cloth mesh each
        substep, checking every triangle against every other triangle within a
        minimum distance threshold.  The cost scales as <em>O(n log n)</em> per
        substep; for a 32&times;20 grid (640 quads = 1,280 triangles) it adds
        roughly 40% overhead.  Disable it when shooting the flag from a fixed
        angle where back-folds won&rsquo;t be visible.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Point cache &mdash; baking for reproducibility
      </h3>
      <p>
        The cloth simulation is deterministic given the same initial state and
        the same Noise seed.  Blender writes per-frame vertex positions into a{" "}
        <code>.bphys</code> binary cache file alongside the <code>.blend</code>.
        Once baked, scrubbing the timeline reads from this cache rather than
        re-solving; you can jump to any frame in 0.1 s rather than 30 s.
        Setting <code>use_library_path = True</code> on the point cache tells
        Blender to store the cache in a <code>blendcache_&lt;name&gt;/</code>{" "}
        folder next to the <code>.blend</code> file, so the pair survive being
        moved or archived together.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        GLB export &mdash; baking the deformed mesh
      </h3>
      <p>
        A GLB exporter cannot serialise a live Cloth simulation; it needs a
        static mesh.  The workflow is: jump to the desired frame (here, frame 30
        &mdash; full mid-billow), duplicate the object, apply the Cloth modifier
        on the duplicate (which collapses the current deformed state into base
        mesh data), apply all transforms (studio convention: origin at world
        zero, scale 1), then export with Draco compression level 6.  The
        animated <code>.blend</code> remains untouched.  The exported mesh is a
        sculptural snapshot useful for 3D printing, WebXR props, or reference
        images &mdash; see the{" "}
        <Link href="/tutorials/blender-tutorial-python-batch-glb-exporter" className={lk}>
          batch GLB exporter tutorial
        </Link>{" "}
        for automating this across multiple frames.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Mesh resolution trade-offs
      </h3>
      <p>
        The 32&times;20 grid (640 quads) balances visual fidelity against bake
        time.  Cloth ripple wavelength is bounded below by the grid spacing:
        ripples smaller than one quad edge length are invisible.  At{" "}
        <code>GRID_W = 2 m</code> and <code>GRID_SEGS_X = 32</code> the edge
        spacing is 6.25 cm &mdash; fine enough to show mid-scale flag flutter
        but too coarse for fine silk billowing.  Doubling to 64&times;40 (2,560
        quads) shows finer ripples but takes &sim;4&times; longer to bake.
        The same resolution concern applies to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-faces-poisson-scatter"
          className={lk}
        >
          Poisson-disc scatter tutorial
        </Link>
        : there, polygon density limits the minimum instance spacing; here it
        limits minimum cloth wavelength.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-physics-cloth-simulation-flag-banner",
  title:
    "Physics — Cloth Simulation: Gravity, Wind Force Field, Collision & Pinning for a Fabric Flag Banner (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Author a spring-mass cloth flag pinned at the hoist column, billowing under a turbulent Wind force field, and colliding with a metal pole. Covers Newmark-β implicit integration, vertex-group pinning, Wind effector force maths, Collision modifier thickness padding, self-collision BVH overhead, point-cache baking, and frozen-mesh GLB export at a chosen frame.",
  Body: ClothSimulationFlagBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Blender 5.1 installed. Cloth modifier available since Blender 2.4x; no extensions required.",
      "Basic 3D viewport navigation and familiarity with the modifier stack. The armature weight-paint tutorial is a helpful precursor for understanding vertex groups.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Cloth modifier, Wind force fields, and Collision modifier have been stable since Blender 2.8. No extensions or add-ons required. The bpy API (ClothSettings, PointCache, FieldSettings) is unchanged in 5.1.",
      },
    ],
    steps: [
      {
        title: "Build the flag grid mesh with bmesh",
        body:
          "import bpy, bmesh, math\nfrom mathutils import Vector\n\nGRID_W, GRID_H = 2.0, 1.2\nGRID_SEGS_X, GRID_SEGS_Y = 32, 20\ndx = GRID_W / GRID_SEGS_X\ndz = GRID_H / GRID_SEGS_Y\n\nme = bpy.data.meshes.new('flag')\nbm = bmesh.new()\nverts = []\nfor zi in range(GRID_SEGS_Y + 1):\n    row = []\n    for xi in range(GRID_SEGS_X + 1):\n        v = bm.verts.new(Vector((xi * dx, 0.0, zi * dz)))\n        row.append(v)\n    verts.append(row)\nfor zi in range(GRID_SEGS_Y):\n    for xi in range(GRID_SEGS_X):\n        bm.faces.new([verts[zi][xi], verts[zi][xi+1],\n                      verts[zi+1][xi+1], verts[zi+1][xi]])\nbm.to_mesh(me)\nbm.free()\n\nflag_obj = bpy.data.objects.new('flag_banner', me)\nbpy.context.scene.collection.objects.link(flag_obj)\nflag_obj.location = Vector((-0.01, 0.0, 0.2))  # gap to avoid z-fight with pole",
      },
      {
        title: "Create the pin vertex group (hoist column)",
        body:
          "# Weight 1.0 = fully pinned; 0.0 = free.\n# Assign all vertices in the leftmost column (xi == 0).\npg = flag_obj.vertex_groups.new(name='pin_col')\ncol_indices = [verts[zi][0].index for zi in range(GRID_SEGS_Y + 1)]\npg.add(col_indices, 1.0, 'REPLACE')",
      },
      {
        title: "Add and configure the Cloth modifier",
        body:
          "cloth_mod = flag_obj.modifiers.new(name='Cloth', type='CLOTH')\ncs = cloth_mod.settings           # ClothSettings\ncc = cloth_mod.collision_settings  # ClothCollisionSettings\n\n# Material parameters — lightweight polyester flag\ncs.mass                  = 0.15   # kg/m²\ncs.tension_stiffness     = 15.0   # N/m\ncs.compression_stiffness = 15.0\ncs.shear_stiffness       = 5.0\ncs.bending_stiffness     = 0.5    # near-zero for flags\ncs.quality               = 16     # substeps per frame\ncs.air_damping           = 1.0    # velocity damping against world rest frame\n\n# Pin group\ncs.vertex_group_mass     = 'pin_col'\n\n# Self-collision (disable if scene is slow)\ncc.use_self_collision    = True\ncc.self_distance_min     = 0.005\ncc.use_collision         = True\ncc.collision_quality     = 4",
      },
      {
        title: "Add the flag pole with a Collision modifier",
        body:
          "bpy.ops.mesh.primitive_cylinder_add(\n    radius=0.03, depth=1.6,\n    location=(0.0, 0.0, 0.75), vertices=16)\npole = bpy.context.active_object\npole.name = 'flag_pole'\n\ncol_mod = pole.modifiers.new(name='Collision', type='COLLISION')\ncol_mod.settings.thickness_inner = 0.003  # minimal padding for a hard metal pole\ncol_mod.settings.thickness_outer = 0.003\ncol_mod.settings.cloth_friction  = 0.08",
      },
      {
        title: "Add the Wind force field",
        body:
          "# Wind's local -Z axis is the blow direction.\n# Rotate 90° on X → -Z points in world +X → wind blows across the fly edge.\nbpy.ops.object.effector_add(type='WIND', location=(0.0, -2.0, 0.6))\nwind = bpy.context.active_object\nwind.name = 'wind_field'\nwind.rotation_euler = (math.radians(90), 0.0, math.radians(90))\nwind.field.strength           = 8.0\nwind.field.noise              = 2.5   # turbulence amplitude\nwind.field.seed               = 42    # reproducible noise\nwind.field.use_global_coords  = True  # noise moves through world space",
      },
      {
        title: "Configure point cache and bake",
        body:
          "cache = cloth_mod.point_cache\ncache.frame_start      = 1\ncache.frame_end        = 60\ncache.use_library_path = True  # cache beside .blend, survives moves\n\n# Bake via UI: Physics Properties → Cloth → Cache → Bake\n# Or from Script Editor:\ntry:\n    with bpy.context.temp_override(active_object=flag_obj):\n        bpy.ops.ptcache.bake_all(bake=True)\nexcept Exception as e:\n    print(f'Bake skipped ({e}) — use the UI Bake button instead.')",
      },
      {
        title: "Export frozen GLB snapshot at frame 30",
        body:
          "scene = bpy.context.scene\nscene.frame_set(30)\nbpy.context.view_layer.update()\n\n# Duplicate flag, apply cloth on duplicate, export\nbpy.ops.object.select_all(action='DESELECT')\nflag_obj.select_set(True)\nbpy.context.view_layer.objects.active = flag_obj\nbpy.ops.object.duplicate()\nfrozen = bpy.context.active_object\nfrozen.name = 'flag_frozen'\n\nwith bpy.context.temp_override(active_object=frozen):\n    bpy.ops.object.modifier_apply(modifier='Cloth')\n\nbpy.ops.object.transform_apply(location=True, rotation=True, scale=True)\n\nbpy.ops.export_scene.gltf(\n    filepath='//cloth_flag_banner.glb',\n    use_selection=True,\n    export_format='GLB',\n    export_apply=True,\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format='WEBP',\n    export_yup=True,\n)",
      },
    ],
  },
  base,
);
