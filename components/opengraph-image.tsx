import { ImageResponse } from "next/og";
import { join } from "path";
import { readFile } from "fs/promises";

export type Props = {
  title?: string;
};

export default async function OpengraphImage(
  props?: Props,
): Promise<ImageResponse> {
  const title = props?.title ?? "Light, held in the hand";

  const file = await readFile(join(process.cwd(), "./fonts/Inter-Bold.ttf"));
  const font = Uint8Array.from(file).buffer;

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
          backgroundColor: "#0c0a12",
          backgroundImage:
            "radial-gradient(900px 480px at 78% 18%, rgba(255,120,165,0.32), transparent 62%), radial-gradient(780px 520px at 8% 82%, rgba(154,109,255,0.32), transparent 62%), radial-gradient(600px 380px at 50% 100%, rgba(118,222,166,0.22), transparent 65%)",
          color: "#efece4",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          Holo-Flow Studio · Field records
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: 88,
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, opacity: 0.78, maxWidth: 900 }}>
            Editioned waveguide sculptures, desktop objects, and wall arrays
            from a twelve-year poi practice.
          </div>
        </div>
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.55,
          }}
        >
          holoflow.co.uk
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: font,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
