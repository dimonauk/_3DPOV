import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0c0a12",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="#ffc4d9"
            strokeOpacity="0.7"
            strokeWidth="1.6"
            fill="none"
          />
          <circle cx="26.4" cy="10.2" r="2.8" fill="#ffc4d9" />
        </svg>
      </div>
    ),
    size,
  );
}
