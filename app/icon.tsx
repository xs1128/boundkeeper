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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#136c5a",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 22,
            background: "#e8f5f0",
            borderRadius: "50% 50% 46% 46%",
          }}
        >
          <div style={{ display: "flex", width: 14, height: 2, background: "#136c5a", marginBottom: 3 }} />
          <div style={{ display: "flex", width: 10, height: 2, background: "#136c5a" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
