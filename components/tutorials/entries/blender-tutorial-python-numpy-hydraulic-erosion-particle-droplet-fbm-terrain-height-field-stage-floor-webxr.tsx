import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-hydraulic-erosion-particle-droplet-fbm-terrain-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Hydraulic Erosion: Particle-Droplet Method on FBM Terrain " +
  "Sebastian Lague 2019 MIT " +
  "Inertia-Blended Downslope Flow Sediment Capacity capacity=slope×speed×water×K " +
  "Bilinear Splat Erosion/Deposition ERODE_SPEED=0.30 GRAVITY=4.0 EVAP=0.01 " +
  "128×128=16384V 16129Q " +
  "Basis(raw FBM)/SK_Eroded(40k)/SK_Rivers(100k)/SK_Deposition(soft) " +
  "Shape Keys & Erosion_Depth FLOAT_COLOR " +
  "Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Every mountain range you have ever seen bears the signatures of water.  " +
  "Rain falls, runs downhill, loosens material proportional to its own speed, " +
  "carries that sediment until it slows or the slope flattens, then dumps it " +
  "in fans at the valley mouth.  Repeat that process for ten thousand virtual " +
  "droplets and an initially random FBM heightmap develops river channels, " +
  "knife-edge ridges, and alluvial deltas — without any hand-sculpting.  " +
  "This blueprint implements the particle-droplet (path-tracing) erosion " +
  "algorithm from Sebastian Lague's MIT-licensed reference code, adapted for " +
  "Blender 5.1 bpy scripting with mathutils FBM and numpy arrays, producing " +
  "a 128×128 quad stage-floor with four erosion-stage shape keys and a " +
  "cobalt–amber vertex-colour attribute ready for WebXR export.";

function Body() {
  return (
    <>
      <p>
        Hydraulic erosion models belong to the family of <em>geomorphological
        process models</em> — simulations that describe how landscapes evolve
        under physical forcing.  The particle-droplet (or path-tracing) variant
        treats each raindrop as an independent agent.  It is the most intuitive
        formulation and, for terrain generation, the most tractable: each drop
        is cheap to simulate, drops are independent (embarrassingly parallelisable
        on GPU), and the aggregate of tens of thousands of paths produces
        statistically convincing geology.
      </p>
      <p>
        Sebastian Lague published a clean MIT-licensed C# implementation in 2019
        (
        <a
          className={lk}
          href="https://github.com/SebLague/Hydraulic-Erosion"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/SebLague/Hydraulic-Erosion
        </a>
        ) that has become the de-facto reference for indie game terrain tools.
        The physics traces back to Musgrave, Kolb &amp; Mace (1989) and the
        rigorous review in Galin et al. 2019 (Eurographics survey).  This
        blueprint is a direct translation into Blender&apos;s bpy + numpy
        environment, with inline commentary on every parameter choice and a
        shape-key workflow so you can inspect erosion staging interactively.
      </p>

      <h2>Fractal Brownian Motion starting terrain</h2>
      <p>
        The simulation seeds from an FBM heightmap via{" "}
        <code>mathutils.noise.turbulence()</code> — Blender&apos;s Perlin wrapper.
        Six octaves with lacunarity 2 and gain 0.5 give the 1/f spectral slope
        of natural terrain (Hurst H = 1, boundary between smooth and rough).
        Baked into a 128×128 float32 array: 16 129 quads, inside the WebXR
        poly budget, with enough resolution for three-pixel-wide river channels.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`H(x,y) = Σᵢ₌₀⁵  0.5ⁱ · noise(2ⁱ · p + SEED)   (FBM_SCALE=3.2)
Amplitudes:  1, 0.5, 0.25, 0.125, 0.0625, 0.0312  (sum ≈ 1.94)
Frequencies: 1, 2,   4,    8,     16,     32`}
      </pre>

      <h2>The droplet physics</h2>
      <p>
        Each droplet carries a state vector{" "}
        <code>(px, py, dx, dy, speed, water, sediment)</code>.  The update
        rule at each step is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# 1. Bilinear gradient at current position
h, gx, gy = bilerp(H, px, py)

# 2. Direction blend (inertia = 0.05)
dx = dx * INERTIA  −  gx * (1 − INERTIA)     # steer 95% toward downslope
dy = dy * INERTIA  −  gy * (1 − INERTIA)
dx, dy = normalise(dx, dy)                   # unit direction vector

# 3. Move
nx, ny = px + dx, py + dy
new_h = bilerp(H, nx, ny).h
dh = new_h − h     # positive → climbing uphill

# 4. Carrying capacity
slope    = max(MIN_SLOPE, |dh|)
capacity = slope × speed × water × CAPACITY_K   # (K = 8.0)

# 5. Erode or deposit (bilinear splat to 4 neighbours)
if sediment > capacity or dh > 0:
    deposit = (dh > 0) ? min(dh, sediment) : (sediment − capacity) × DEPOSIT_SPEED
    H[neighbours] += deposit  (bilinear weights)
else:
    erode = min((capacity − sediment) × ERODE_SPEED, −dh)
    H[neighbours] −= erode

# 6. Physics update
speed  = √max(0,  speed² − dh × GRAVITY)     # kinetic energy on slope
water *= 1 − EVAP_RATE                       # evaporation
if water < 0.01: stop`}
      </pre>

      <h2>Why bilinear splat, not nearest-cell?</h2>
      <p>
        Depositing/eroding only at the integer grid cell nearest the droplet
        creates blocky, staircase artefacts — height changes in discrete lumps
        at cell centres.  The bilinear splat distributes the amount across the
        four surrounding cells weighted by the fractional offsets{" "}
        <code>u = px − floor(px), v = py − floor(py)</code>.  This is the
        2-D equivalent of linear interpolation: it ensures that a droplet
        moving smoothly across the grid produces a smooth deformation envelope,
        regardless of its phase relative to the grid lines.  Lague&apos;s
        implementation uses the same technique.
      </p>

      <h2>Inertia parameter</h2>
      <p>
        Pure gradient descent (<code>INERTIA=0</code>) produces rivers that
        turn sharply at every cell — numerically noisy.  Pure inertia (1)
        ignores the terrain and travels straight.  Lague found 0.03–0.10
        balances realism against artefacts.  This blueprint uses <strong>0.05</strong>:
        95% gradient steering with just enough momentum to smooth grid-scale
        zigzagging.
      </p>

      <h2>Shape key strategy</h2>
      <p>
        Four shape keys capture the erosion trajectory so you can scrub
        interactively in Blender&apos;s Properties panel or drive them from
        animation:
      </p>
      <ul>
        <li>
          <strong>Basis</strong> — raw FBM, no erosion. Use as the &ldquo;before&rdquo;
          reference.
        </li>
        <li>
          <strong>SK_Eroded</strong> — 40 000 droplets. River channels are
          visible; ridges are sharpened. Good mid-point.
        </li>
        <li>
          <strong>SK_Rivers</strong> — 100 000 total droplets.  Deep gorges
          and prominent alluvial fans at every low-point exit.
        </li>
        <li>
          <strong>SK_Deposition</strong> — 8 000 droplets on a high-capacity
          setting (less erosion, more deposition).  Shows the fan-dominated
          low-slope regime.
        </li>
      </ul>

      <h2>Colour attribute: Erosion_Depth</h2>
      <p>
        The <code>Erosion_Depth</code> FLOAT_COLOR attribute encodes the{" "}
        <em>net change</em> at each vertex after the 40k-drop pass.  Positive
        values (erosion) map toward red; negative values (net deposition) map
        toward blue; zero maps to white.  The normalisation is separate for
        the positive and negative half-ranges so both ends of the spectrum are
        always visible regardless of the erosion-to-deposition ratio.
      </p>
      <p>
        In Blender&apos;s solid viewport, switch the colour mode to{" "}
        <em>Attribute → Erosion_Depth</em> to see the three-zone map.  In
        WebXR, the attribute is carried through GLB export as vertex colours and
        drives the diffuse material directly — no texture baking required.
      </p>

      <h2>Failure modes</h2>
      <p>
        <strong>Plateau pooling</strong> — if the FBM has large flat regions,
        droplets stall (gradient ≈ 0 → capacity ≈ 0 → deposit immediately).
        Increase <code>FBM_SCALE</code> or lower <code>FBM_GAIN</code>.{" "}
        <strong>Speed divergence</strong> — keep{" "}
        <code>GRAVITY × HEIGHT_SCALE &lt; 10</code>.{" "}
        <strong>No visible channels</strong> — 10 000+ drops needed on a
        128-cell grid; fewer produces only mild smoothing.{" "}
        <strong>Edge artefacts</strong> — the blueprint excludes a 1-cell
        border from all droplet start positions and halts on grid egress.
      </p>

      <h2>WebXR export</h2>
      <p>
        <em>File → Export → glTF 2.0</em>: tick{" "}
        <em>Include → Vertex Colors</em> and{" "}
        <em>Mesh → Apply Modifiers</em>.  The holoflow exporter converts
        to +Y-up; <code>hydraulic_erosion_floor</code> (snake_case) satisfies
        studio naming.  Shape keys export as glTF morph targets, driven via{" "}
        <code>THREE.AnimationMixer</code> in the WebXR scene.
      </p>

      <h2>Cross-references</h2>
      <p>Related studio tutorials:</p>
      <ul>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-gn-image-texture-heightmap-terrain">
            Geometry Nodes: Image Texture Heightmap Terrain
          </Link>{" "}
          — GN-driven terrain displacement from a greyscale image
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-gn-raycast-terrain-decal-scatter">
            GN Raycast Terrain Decal Scatter
          </Link>{" "}
          — placing decals onto eroded terrain surfaces
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing">
            GN Simulation Zone: Reaction–Diffusion Turing
          </Link>{" "}
          — another PDE-on-mesh simulation producing patterned height fields
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr">
            Python NumPy: Kelvin–Helmholtz Shear Instability
          </Link>{" "}
          — fluid-dynamics height-field using pseudo-spectral FFT solver
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-flame-front-height-field-stage-floor-webxr">
            Python NumPy: Kuramoto–Sivashinsky PDE Stage Floor
          </Link>{" "}
          — spatiotemporal chaos height-field, same stage-floor mesh pattern
        </li>
      </ul>

      <p>Outside sources:</p>
      <ul>
        <li>
          <a
            className={lk}
            href="https://github.com/SebLague/Hydraulic-Erosion"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sebastian Lague — Hydraulic Erosion (MIT, 2019–2023)
          </a>{" "}
          — primary algorithm reference; C# Unity implementation
        </li>
        <li>
          <a
            className={lk}
            href="https://onlinelibrary.wiley.com/doi/abs/10.1111/cgf.13657"
            target="_blank"
            rel="noopener noreferrer"
          >
            Galin et al. — A Review of Digital Terrain Modeling
            (Eurographics 2019, open-access survey)
          </a>{" "}
          — comprehensive survey of erosion and terrain synthesis methods
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-05",
  topic: "scripting",
  body: <Body />,
  sources: [
    {
      label: "Sebastian Lague — Hydraulic Erosion (MIT)",
      url: "https://github.com/SebLague/Hydraulic-Erosion",
    },
    {
      label: "Galin et al. — Review of Digital Terrain Modeling (EG 2019)",
      url: "https://onlinelibrary.wiley.com/doi/abs/10.1111/cgf.13657",
    },
  ],
  blenderVersion: "5.1",
  libPath:
    "public/library/blends/scripting/python-numpy-hydraulic-erosion-particle-droplet-fbm-terrain-height-field-stage-floor-webxr",
});
