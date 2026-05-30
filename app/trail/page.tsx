import { TrailContent } from "components/trail/trail-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Trail of My Passing — Beneath the Numbers",
  description:
    "An interactive kinetic primer by Dimona Dougherty. 40 sandboxes, one knob each, no instructions. Five acts exploring physics, rhythm, geometry, waves, and emergence—all experienced through the body in motion.",
  openGraph: {
    title: "The Trail of My Passing",
    description:
      "An interactive kinetic primer. 40 sandboxes exploring physics and rhythm through motion.",
    type: "website",
  },
};

export default function TrailPage() {
  return <TrailContent />;
}
