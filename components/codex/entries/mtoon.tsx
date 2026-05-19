export default function Mtoon() {
  return (
    <>
      <p>
        MToon is the toon-shading material specification that ships as
        part of the VRM avatar standard. Its job is to render an
        anime-style figure consistently across every engine that loads
        a VRM file &mdash; Unity, Unreal, Godot, the Three.js
        reference implementation &mdash; without anyone hand-porting
        a custom shader. It defines a small, fixed set of parameters
        (shade colour, shade ramp, rim colour, rim power, outline
        width, outline colour) and the calculations a renderer must
        perform with them.<sup>1</sup>
      </p>
      <p>
        Three techniques stitch together. Lighting is ramp-shaded
        rather than continuous: the dot product of the surface normal
        and the light direction is quantised to a small number of
        bands, giving the flat shadow blocks that read as drawn
        rather than rendered. A Fresnel-style rim contribution
        brightens silhouette edges as if a backlight were behind the
        figure. And outlines are added by rendering an inverted-hull
        copy of the mesh, slightly enlarged with normals flipped, in
        the outline colour &mdash; cheap, animation-friendly, and
        independent of camera angle.
      </p>
      <p>
        The reference implementation the rest of the field tracks is{" "}
        <a
          href="https://github.com/pixiv/three-vrm"
          className="text-pink-200 underline underline-offset-4"
        >
          @pixiv/three-vrm
        </a>{" "}
        &mdash; the Three.js loader and material package maintained
        by Pixiv. The studio uses it directly to render Aura. MToon
        compiles to a standard fragment-shader graph; on the
        studio&rsquo;s WebGPU + TSL path it ports cleanly because the
        underlying graph is the same shape as the studio&rsquo;s own
        cel-shaded preset. The studio also borrows the MToon rim and
        outline contribution patterns inside the in-house
        glow-rim preset and the cel-shaded variant of the wall-piece
        material set.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/vrm-virtual-reality-model"
          className="text-pink-200 underline underline-offset-4"
        >
          VRM
        </a>
        ,{" "}
        <a
          href="/codex/ramp-shading"
          className="text-pink-200 underline underline-offset-4"
        >
          ramp shading
        </a>
        ,{" "}
        <a
          href="/codex/inverted-hull-outline"
          className="text-pink-200 underline underline-offset-4"
        >
          inverted-hull outline
        </a>
        ,{" "}
        <a
          href="/codex/fresnel-rim-light"
          className="text-pink-200 underline underline-offset-4"
        >
          Fresnel rim light
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_materials_mtoon-1.0/README.md"
            className="text-pink-200 underline underline-offset-4"
          >
            VRMC_materials_mtoon-1.0 specification
          </a>{" "}
          (VRM Consortium).
        </li>
        <li>
          <a
            href="https://github.com/pixiv/three-vrm"
            className="text-pink-200 underline underline-offset-4"
          >
            @pixiv/three-vrm
          </a>{" "}
          &mdash; the reference Three.js implementation (MIT).
        </li>
        <li>
          <a
            href="https://vrm.dev/en/univrm/shaders/shader_mtoon.html"
            className="text-pink-200 underline underline-offset-4"
          >
            vrm.dev MToon documentation
          </a>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The original MToon was written by Masataka Santoki in 2018
          as a Unity shader for the early VRM 0.x format; the 1.0
          revision (2022) tightened the parameter set, added gltf
          extension hooks, and made the material spec engine-
          independent. The 1.0 spec is the version the studio targets.
        </li>
      </ol>
    </>
  );
}
