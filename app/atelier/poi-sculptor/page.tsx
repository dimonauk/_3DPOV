import Link from "next/link";
import { AtelierToolPage } from "components/ui";
import PoiSculptorClient from "./poi-sculptor-client";

export const metadata = {
  title: "Poi sculptor — twelve years of practice as printable solid",
  description:
    "Twenty-one parametric poi-flow moves rendered as GPU-driven 3D sculpture in the browser. Pick a move, pick a surface, drive the hands along an anchor path, export STL or GLB for the print bureau. The studio's twelve-year poi practice, available as a printable solid.",
};

export default function PoiSculptorPage() {
  return (
    <AtelierToolPage
      label="Atelier · Poi sculptor"
      headline={<>The poi move,<br />as printable solid.</>}
      body="Twelve years of poi practice precomputed as twenty-one parametric flow moves — butterflies, weaves, antispin flowers, isolations, lissajous knots — each rendered as a pair of hand trails through space. Pick a move, pick a surface, drive the hands along an anchor path, and the GPU draws the move as a continuous tube. The result is a 3D object that holds twelve years of muscle memory at one instant of itself."
      secondary="Every move is parametric: t runs from 0 to 8π and the two-handed positions fall out of sines, cosines, and the shapes the body learned. The sculpture you see is not a recording of any particular spin — it's the mathematics of the move itself, made visible. Three hundred thousand compute-shader particles orbit the trail and reset toward the hand centres. Export STL or GLB, send it through the print bureau on the next panel."
      chips={[
        { href: "/codex/poi",             label: "codex · poi" },
        { href: "/codex/marching-cubes",  label: "codex · marching cubes" },
        { href: "/codex/gyroid-surfaces", label: "codex · printable surfaces" },
      ]}
      notes={{
        label: "What the move actually is",
        body: [
          "A poi move is a function of time over two hands. The butterfly is two opposing circles offset by π. A 3-beat weave is a translating sinusoid the body wraps around itself three times per revolution. An antispin flower is two angular velocities — the head spinning one way, the hand orbiting the other, the petal count is the difference. Each generator in this demo is the parametric equation the body learned through repetition.",
          <>
            The trail you see is the same data the studio&rsquo;s POV rig writes into a long-exposure photograph — a two-hand event cloud in space and time. The rig{" "}
            <Link href="/atelier/rig-simulator" className="text-pink-200 underline underline-offset-4">draws it with light</Link>; this demo draws it as printable mass. Same maths, two outputs, both editioned.
          </>,
        ],
      }}
    >
      <PoiSculptorClient />
    </AtelierToolPage>
  );
}
