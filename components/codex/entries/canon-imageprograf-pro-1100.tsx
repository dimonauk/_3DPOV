export default function CanonImageprografPro1100() {
  return (
    <>
      <p>
        The Canon imagePROGRAF PRO-1100 is a 17&Prime;-wide
        fine-art-photographic inkjet printer, released by Canon in
        2024 as the successor to the PRO-1000. It runs a 12-channel
        Lucia PRO II pigment inkset on cut sheets up to A2 (or US
        Super-B), with a maximum print width of 432mm and a stated
        archival permanence of 200+ years on rated papers under
        standard conservation conditions.<sup>1</sup>
      </p>
      <p>
        The technical specifics relevant to the studio&rsquo;s use:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Inkset:</strong> 12 channels &mdash; Cyan, Magenta,
          Yellow, Photo Cyan, Photo Magenta, Red, Blue, Photo Grey,
          Grey, Matte Black, Photo Black, Chroma Optimizer
        </li>
        <li>
          <strong>Black ink switching:</strong> automatic between
          Matte Black (for matte papers like Photo Rag) and Photo
          Black (for glossy and semi-gloss papers); no waste-ink
          switching cost in practice on a typical month
        </li>
        <li>
          <strong>Resolution:</strong> 2400 &times; 1200 dpi
        </li>
        <li>
          <strong>Droplet size:</strong> 4 picolitres minimum
        </li>
        <li>
          <strong>Maximum paper width:</strong> 432mm (A2 / Super-B)
        </li>
        <li>
          <strong>Maximum paper thickness:</strong> 0.7mm (handles all
          common fine-art rag papers; doesn&rsquo;t handle Hahnem&uuml;hle&rsquo;s
          heaviest 350gsm baryta in its straight-path mode)
        </li>
        <li>
          <strong>Profile management:</strong> standard ICC; the unit
          ships with profiles for every Hahnem&uuml;hle, Canson, and
          Awagami paper Canon endorses
        </li>
      </ul>
      <p>What the PRO-1100 does well, in practice:</p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>The Chroma Optimizer.</strong> A clear-coat channel
          that fills in the differential gloss between heavily-inked
          areas and lightly-inked paper. The print is uniformly matte
          (or uniformly satin, on satin papers) instead of having
          flat areas read as drier than ink-rich areas. The
          studio&rsquo;s long-exposure images, with their deep blacks
          adjacent to deep paper white, benefit specifically from this
          channel.<sup>2</sup>
        </li>
        <li>
          <strong>The greys.</strong> Three grey channels (Photo Grey,
          Grey, plus the Matte and Photo Blacks acting as black-end
          grey points) let the printer hold neutral midtones without
          shifting into magenta or green casts. Critical for the
          studio&rsquo;s pieces, which often have large fields of dark
          grey background between light traces.
        </li>
        <li>
          <strong>The reds.</strong> The dedicated Red channel
          extends the colour gamut into the saturated red-orange-amber
          range that fire-poi and warm-LED traces sit in. Without it,
          those passes muddy toward magenta or rust.
        </li>
      </ul>
      <p>
        Holo-Flow Studio operates one PRO-1100 in the Salford studio,
        connected to a calibrated Eizo CG2700S monitor via the
        studio&rsquo;s colour-managed workflow. Annual calibration with
        X-Rite i1Studio; replacement ICC profiles re-generated on each
        new paper batch. The printer is also the engine behind the{" "}
        <strong>
          <a
            href="/bureau"
            className="text-pink-200 underline underline-offset-4"
          >
            print bureau
          </a>
        </strong>{" "}
        service the studio offers to other artists at trade rates.
      </p>
      <p>
        See{" "}
        <strong>
          <a
            href="/codex/hahnemuhle-photo-rag-308"
            className="text-pink-200 underline underline-offset-4"
          >
            Hahnem&uuml;hle Photo Rag 308gsm
          </a>
        </strong>{" "}
        for the studio&rsquo;s default substrate, and{" "}
        <strong>
          <a
            href="/articles/the-right-paper-for-a-light-painting"
            className="text-pink-200 underline underline-offset-4"
          >
            The right paper for a light painting
          </a>
        </strong>{" "}
        for the bench&rsquo;s working notes on paper selection per
        image type.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The 200-year permanence figure is from the Wilhelm Imaging
          Research lab&rsquo;s standard test, which models accelerated
          ageing under standard exposure. In practice, prints in actual
          collector use &mdash; framed behind UV-filtering glass, kept
          out of direct sunlight, in a stable temperature/humidity
          environment &mdash; will outlive the printer that made them
          and most of the people involved.
        </li>
        <li>
          The Chroma Optimizer is the channel most reviewers
          underestimate because its effect is what isn&rsquo;t there
          &mdash; the absence of differential gloss. Print a heavy
          black square next to a heavy white area without it and you
          can read the gradient in oblique light; with it, you cannot.
          Once you&rsquo;ve seen the difference on a piece with deep
          blacks against pale paper, no other consumer-priced inkjet
          looks quite right.
        </li>
      </ol>
    </>
  );
}
