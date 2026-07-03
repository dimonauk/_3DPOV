import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A Gaussian Splat needs many photographs of the same subject from many
        angles. Getting those photographs physically — DSLR on a turntable, phone
        walking a circle, drone orbit — introduces lighting variation, motion
        blur, and occlusion. Blender removes all three: you place a camera rig
        once, press run, and the script delivers 64 perfectly-consistent views in
        under ten minutes. The{" "}
        <Link href="/tutorials/from-360-to-splat" className={lk}>
          single-image splat pipeline
        </Link>{" "}
        (Apple SHARP) is fast but limited to the information in one frame. A
        Blender-sourced multi-view dataset has no such floor: add geometry,
        materials, and lighting until the reconstruction matches what you need.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Why the Fibonacci sphere and not a latitude-longitude grid
      </h2>
      <p className="mt-2">
        The naive approach — cameras at regular latitude and longitude steps —
        clusters views near the poles. An 8×8 lat-lon grid gives four views
        within 15° of the north pole and only four views covering the whole
        equatorial band. The angular gaps are uneven, so the Gaussian
        initialisation has inconsistent density across the subject. The{" "}
        <strong>golden-angle Fibonacci spiral</strong> solves this: it produces
        near-uniform Voronoi cells on the sphere, meaning every camera subtends
        roughly equal solid angle. At N=64 the worst-case angular gap is about
        28° for Fibonacci versus 52° for an 8×8 lat-lon grid.
      </p>
      <p className="mt-2">
        The formula uses two ideas from phyllotaxis (sunflower seeds). The polar
        angle{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          θ = arccos(1 − 2(i+0.5)/n)
        </code>{" "}
        assigns each point a latitude band of equal solid angle — the
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          +0.5
        </code>{" "}
        half-offset keeps points away from the exact poles where numerical
        instability can arise. The azimuthal angle{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          φ = 2πi/ϕ
        </code>{" "}
        (ϕ = golden ratio ≈ 1.618) places consecutive azimuths at an irrational
        angle to each other, preventing the stripe artefacts you see in rational
        fractions. See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-rotate-instances-phyllotaxis-sunflower"
          className={lk}
        >
          phyllotaxis sunflower GN tutorial
        </Link>{" "}
        for the same distribution applied to instance scattering on a disc.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Pointing cameras at the origin with{" "}
        <code className="font-mono text-base font-normal">to_track_quat</code>
      </h2>
      <p className="mt-2">
        Each camera sits at a point on the sphere; it must look inward toward{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          (0,0,0)
        </code>
        . The direction from camera to origin is simply{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          -position
        </code>
        . The call{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          direction.to_track_quat(&apos;-Z&apos;, &apos;Y&apos;)
        </code>{" "}
        returns the quaternion that aligns the camera&apos;s{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          -Z
        </code>{" "}
        local axis with that direction, keeping{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          +Y
        </code>{" "}
        as the up reference. Blender cameras look toward{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          -Z
        </code>{" "}
        in local space (matching the OpenGL convention), so this is exactly
        right. Always set{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          rotation_mode = &apos;QUATERNION&apos;
        </code>{" "}
        before assigning the result; if the object is in Euler mode, Blender
        converts the quaternion to Euler and gimbal lock can flip a small number
        of cameras near the poles.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The NeRF coordinate flip
      </h2>
      <p className="mt-2">
        The{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          transforms.json
        </code>{" "}
        file stores a{" "}
        <strong>camera-to-world matrix</strong> for each frame. The matrix tells
        the trainer: &ldquo;this column in the image was rendered by a camera
        whose world-space position and orientation is…&rdquo; Blender&apos;s{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          matrix_world
        </code>{" "}
        is already a camera-to-world matrix, but it is expressed in
        Blender&apos;s world coordinate frame where{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          +Z
        </code>{" "}
        is up. Most NeRF/3DGS trainers follow the same camera-local convention
        (look toward{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          -Z
        </code>
        ,{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          +Y
        </code>{" "}
        up) but expect the world frame with{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          +Y
        </code>{" "}
        up. Negating <strong>columns 1 and 2</strong> of the 3×3 rotation block
        performs this conversion without touching the translation column:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 px-4 py-3 text-xs leading-relaxed text-neutral-100">
        {`def blender_to_nerf_c2w(mat):
    m = [list(row) for row in mat]   # copy as nested lists (row-major)
    for r in range(3):
        m[r][1] = -m[r][1]           # negate Y column of rotation
        m[r][2] = -m[r][2]           # negate Z column of rotation
    return m`}
      </pre>
      <p className="mt-2">
        This is the same transform used in the official nerfstudio Blender
        data-parser (MIT licence). Without it, the trainer receives cameras that
        appear to be pointing outward from the sphere instead of inward, and the
        reconstruction either fails or produces a mirror-flipped splat. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook"
          className={lk}
        >
          glTF user extension export hook
        </Link>{" "}
        for another example of exporting coordinate-system metadata from Blender.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Swapping the active camera per render
      </h2>
      <p className="mt-2">
        The render pipeline swaps{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          bpy.context.scene.camera
        </code>{" "}
        before each call to{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          bpy.ops.render.render(write_still=True)
        </code>
        . Critically, the{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          matrix_world
        </code>{" "}
        read-back happens <em>after</em> the render call, not before: the render
        operator forces a full depsgraph evaluation, which guarantees the matrix
        reflects any parent transforms or constraints on the camera object. If
        you read the matrix before the render, an unrelated pending depsgraph
        update can produce a stale value. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-object-instances-gn-scatter-glb-export"
          className={lk}
        >
          depsgraph object_instances harvest tutorial
        </Link>
        , where the depsgraph must be evaluated explicitly for the same reason.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Intrinsics in{" "}
        <code className="font-mono text-base font-normal">transforms.json</code>
      </h2>
      <p className="mt-2">
        The JSON file carries both the camera-to-world matrices and the
        intrinsics (focal length, principal point). Nerfstudio expects focal
        length in pixel units:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 px-4 py-3 text-xs leading-relaxed text-neutral-100">
        {`fl_x = (FOCAL_MM / SENSOR_W_MM) * IMG_W
# fl_x = (24 / 36) × 800 = 533.3 px
# camera_angle_x = 2·atan(sensor_w / (2·focal)) = 2·atan(36/48) ≈ 67.4°`}
      </pre>
      <p className="mt-2">
        The principal point{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          cx, cy
        </code>{" "}
        defaults to the image centre (
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          IMG_W/2, IMG_H/2
        </code>
        ), which is exact for a computer-rendered image where there is no lens
        shift or distortion. Physical cameras need calibration to find the true
        principal point; Blender renders do not. The{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          aabb_scale=4
        </code>{" "}
        field hints at scene extent; at{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          RADIUS=3
        </code>{" "}
        the cameras fit comfortably inside a 4-unit axis-aligned bounding box.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Lighting for consistent colour estimation
      </h2>
      <p className="mt-2">
        Each Gaussian stores a colour (spherical harmonics up to degree 3).
        If lighting changes between views — as it does in HDR captures where the
        sun moves — the trainer receives contradictory colour signals for the
        same surface point and produces blurry Gaussians. The blueprint uses
        three fixed{" "}
        <strong>SUN</strong> lamps: SUN type emits perfectly parallel rays with
        no falloff, so a surface face receives identical irradiance regardless of
        which camera is active. For WebXR deployment the resulting splat will
        look consistent under any viewer-side lighting because the Gaussians have
        learned a single lighting state. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-groups-non-destructive-relight"
          className={lk}
        >
          Cycles light-group relight tutorial
        </Link>{" "}
        for the inverse direction: extracting per-light contributions from a
        single render.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Failure modes</h2>
      <p className="mt-2">
        <strong>All images are black.</strong> The active camera is set to one of
        the rig cameras but{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          configure_render()
        </code>{" "}
        ran before the cameras were parented. Re-run{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          main()
        </code>{" "}
        from a clean scene; the sequence is{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          clear → subject → lights → configure_render → rig → render
        </code>
        .
      </p>
      <p className="mt-2">
        <strong>transforms.json loads but reconstruction fails.</strong> The most
        common cause is a missing coordinate flip. Verify with{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          print(frames[0][&apos;transform_matrix&apos;][2])
        </code>{" "}
        — the third row (Z-axis) of the first frame&apos;s matrix should have a
        large positive Z-component (camera above equator looks downward = positive
        world-Z in the rotation column). If it is negative, the column flip was
        not applied.
      </p>
      <p className="mt-2">
        <strong>Cameras near the south pole look wrong.</strong> This is the
        gimbal-lock issue: the object was in Euler mode when the quaternion was
        assigned. Verify each camera with{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          print(cam.rotation_mode)
        </code>{" "}
        — it should print{" "}
        <code className="mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          QUATERNION
        </code>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-multiview-camera-rig-gaussian-splat-render",
  title:
    "Python Multi-View Camera Rig — Fibonacci Sphere for Gaussian Splatting (Blender 5.1)",
  date: "2026-07-03",
  kind: "tutorial",
  excerpt:
    "Build a 64-camera Fibonacci sphere rig in Python, render every view via bpy.context.scene.camera swap, convert Blender camera-to-world matrices to the NeRF coordinate convention, and write transforms.json for nerfstudio Splatfacto or any 3DGS trainer — producing synthetic multi-view training data from any Blender scene in under ten minutes.",
  tags: [
    "blender",
    "python",
    "gaussian-splatting",
    "camera-rig",
    "nerf",
    "scripting",
    "rendering",
    "3dgs",
  ],
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/scripting/python-multiview-camera-rig-gaussian-splat-render/",
    time: "an afternoon",
    difficulty: "advanced",
    cost: "open-source",
    supplies: {
      tools: [
        {
          name: "Blender 5.1",
          url: "https://www.blender.org/download/releases/5-1/",
          note: "mathutils.Vector.to_track_quat and EEVEE Next required.",
        },
        { name: "Python Scripting workspace" },
        {
          name: "nerfstudio (optional — to train the splat from output)",
          url: "https://github.com/nerfstudio-project/nerfstudio",
          note: "MIT licence. pip install nerfstudio.",
        },
      ],
    },
    prerequisites: [
      "Comfortable running Python scripts in the Blender Scripting workspace",
      "Understands bpy.context.scene.camera and bpy.ops.render.render()",
      "Knows what a camera-to-world matrix is (4×4 rigid-body transform)",
    ],
    steps: [
      {
        title: "Build the Fibonacci sphere positions",
        body: "In the Scripting workspace, paste and run:\n\nimport math\n\ndef fibonacci_sphere_positions(n, radius):\n    golden = (1 + math.sqrt(5)) / 2\n    pts = []\n    for i in range(n):\n        theta = math.acos(1 - 2*(i+0.5)/n)\n        phi   = 2*math.pi*i/golden\n        x = math.sin(theta)*math.cos(phi)\n        y = math.sin(theta)*math.sin(phi)\n        z = math.cos(theta)\n        pts.append((radius*x, radius*y, radius*z))\n    return pts\n\npts = fibonacci_sphere_positions(64, 3.0)\nprint(pts[:4])\n\nExpect 4 positions near the sphere surface, no two at identical latitude.",
      },
      {
        title: "Create cameras pointing at the origin",
        body: "For each position in pts:\n\nimport bpy, mathutils\n\npx, py, pz = pts[0]   # first position\ncd = bpy.data.cameras.new('hf_sv_0000')\ncd.lens = 24.0\ncd.sensor_width = 36.0\n\nco = bpy.data.objects.new('hf_sv_0000', cd)\nco.location = (px, py, pz)\nbpy.context.scene.collection.objects.link(co)\n\ndirection = mathutils.Vector((-px, -py, -pz)).normalized()\nco.rotation_mode = 'QUATERNION'                   # must set before assigning quat\nco.rotation_quaternion = direction.to_track_quat('-Z', 'Y')\n\nVerify in the 3D viewport: the camera frustum should point toward the origin.",
      },
      {
        title: "Configure EEVEE and three-point lighting",
        body: "scene = bpy.context.scene\nscene.render.engine = 'BLENDER_EEVEE_NEXT'\nscene.eevee.taa_render_samples = 16\nscene.render.resolution_x = 800\nscene.render.resolution_y = 600\nscene.render.image_settings.file_format = 'PNG'\n\n# key light\nbpy.ops.object.light_add(type='SUN', location=(0,0,0))\nsun = bpy.context.active_object\nsun.data.energy = 3.0\nsun.rotation_euler = (math.radians(45), 0, math.radians(-45))\n\nUse SUN (not POINT/AREA) — parallel rays give uniform per-face irradiance across all 64 views, which avoids contradictory colour signals in the 3DGS colour estimation.",
      },
      {
        title: "Render all views with camera swap",
        body: "import os\n\nos.makedirs(bpy.path.abspath('//output/images/'), exist_ok=True)\n\nframes = []\nfor i, cam in enumerate(cam_objects):\n    rel = f'images/{i:06d}.png'\n    scene.render.filepath = bpy.path.abspath('//output/' + rel)\n    scene.camera = cam                          # swap active camera\n    bpy.ops.render.render(write_still=True)     # render forces depsgraph eval\n    c2w = blender_to_nerf_c2w(cam.matrix_world) # read AFTER render\n    frames.append({'file_path': rel, 'transform_matrix': c2w})\n    print(f'  [{i+1}/64] {rel}')",
      },
      {
        title: "Write transforms.json",
        body: "import json\n\nFOCAL_MM, SENSOR_W_MM, IMG_W, IMG_H = 24.0, 36.0, 800, 600\nfl_x = (FOCAL_MM / SENSOR_W_MM) * IMG_W   # 533.33 px\n\npayload = {\n    'camera_angle_x': 2*math.atan(SENSOR_W_MM/(2*FOCAL_MM)),  # radians\n    'fl_x': fl_x,\n    'fl_y': fl_x * (IMG_H/IMG_W),           # square pixels\n    'cx': IMG_W/2.0,\n    'cy': IMG_H/2.0,\n    'w': IMG_W,\n    'h': IMG_H,\n    'aabb_scale': 4,\n    'frames': frames,\n}\nwith open(bpy.path.abspath('//output/transforms.json'), 'w') as f:\n    json.dump(payload, f, indent=2)\n\nOpen the file and confirm: 64 entries in 'frames', each with a 4×4 transform_matrix.",
      },
      {
        title: "Train a Gaussian Splat (if nerfstudio installed)",
        body: "From a terminal with nerfstudio installed:\n\n  ns-train splatfacto --data path/to/output/\n\nnerfstudio reads transforms.json, loads the 64 PNGs, and trains a 3DGS\nmodel.  After training, export the splat with:\n\n  ns-export gaussian-splat --load-config outputs/.../config.yml \\\n    --output-dir public/library/splats/scripting/python-multiview-camera-rig-demo/\n\nThe resulting .ply or .splat file can be rendered in a WebXR scene via\n@luma-ai/three-gaussian-splats or similar Three.js splat renderer.",
      },
    ],
    finalResult:
      "A 64-camera Fibonacci sphere rig renders all views of a faceted icosphere subject to output/images/ and writes output/transforms.json with per-frame camera-to-world matrices in NeRF convention. The output feeds directly into nerfstudio Splatfacto (or any compatible 3DGS trainer) without further preprocessing.",
    variations: [
      "Hemisphere-only capture (object resting on a surface): replace arccos(1−2(i+0.5)/n) with arccos(1−(i+0.5)/n) — this maps all N points to the upper hemisphere. Useful for objects that sit on a table or floor and have no visible underside.",
      "HDR environment texture instead of sun lamps: use World nodes with an EXR HDRI to match real-world lighting. Useful when the splat will be composited into footage taken under that HDRI. Remove the three SUN objects; assign the HDR via bpy.data.worlds[0].node_tree.",
      "Depth map export alongside colour: set scene.render.image_settings.file_format='OPEN_EXR_MULTILAYER', enable the Z-depth pass, and save depth alongside colour. nerfstudio supports depth supervision (ns-train depth-nerfacto) which converges faster when depth maps are available.",
    ],
    troubleshooting: [
      {
        symptom: "All rendered images are black or show a flat grey",
        cause:
          "scene.camera was set to None or to a camera with its lens inside the subject mesh.",
        fix:
          "Confirm scene.camera is not None before each render call: assert bpy.context.scene.camera is not None. Increase RADIUS if the cameras overlap with the subject.",
      },
      {
        symptom: "transforms.json loads but nerfstudio says 'no cameras in frustum'",
        cause:
          "The coordinate flip was not applied, so cameras appear to point outward.",
        fix:
          "Print frames[0]['transform_matrix'][2] — the third row Z-component should be positive (camera above equator, looking down). If negative, blender_to_nerf_c2w() was skipped. Rerun with the column flip applied.",
      },
      {
        symptom: "Several cameras near the poles point in a random wrong direction",
        cause:
          "rotation_mode was left as 'XYZ' (Euler); gimbal lock flipped the polar cameras.",
        fix:
          "Add co.rotation_mode = 'QUATERNION' immediately before the to_track_quat() assignment. Check existing cameras with: [c.rotation_mode for c in cam_objects if c.rotation_mode != 'QUATERNION'].",
      },
    ],
  },
  base,
);
