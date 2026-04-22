import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "The Neo-London Chrono-Protocol";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(1200px 500px at 75% 15%, rgba(138,51,36,0.45), transparent 60%), radial-gradient(900px 600px at 10% 85%, rgba(47,93,80,0.45), transparent 60%), #0b0b0d",
          color: "#efece4",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            opacity: 0.7,
            fontFamily: "monospace",
          }}
        >
          Neo-London · Chrono-Protocol
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 96, lineHeight: 1, fontWeight: 300 }}>
            Welcome to the Protocol.
          </div>
          <div style={{ fontSize: 30, opacity: 0.8, maxWidth: 900 }}>
            Archive and gallery of the kata and the artefacts the city returns.
          </div>
        </div>
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.6,
            fontFamily: "monospace",
          }}
        >
          CP-ARCHIVE
        </div>
      </div>
    ),
    size
  );
}
