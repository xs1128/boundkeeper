import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#136c5a",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 108,
            background: "#e8f5f0",
            borderRadius: "50% 50% 46% 46%",
          }}
        >
          <div style={{ display: "flex", width: 68, height: 8, background: "#136c5a", marginBottom: 12, borderRadius: 4 }} />
          <div style={{ display: "flex", width: 52, height: 8, background: "#136c5a", marginBottom: 12, borderRadius: 4 }} />
          <div style={{ display: "flex", width: 36, height: 8, background: "#136c5a", borderRadius: 4 }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
