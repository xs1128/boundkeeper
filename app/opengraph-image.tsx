import { ImageResponse } from "next/og";
import { PRODUCT_NAME_ZH } from "@/src/product";

export const alt = `${PRODUCT_NAME_ZH} — 台灣勞工主管訊息分析助手`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(145deg, #f4f7f5 0%, #e4f2ed 45%, #d5ebe3 100%)",
          color: "#17332d",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              background: "#136c5a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 46,
                height: 52,
                border: "4px solid #e8f5f0",
                borderRadius: "50% 50% 42% 42%",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#136c5a", letterSpacing: "0.08em" }}>
            給工作者的溝通助手
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            {PRODUCT_NAME_ZH}
          </div>
          <div style={{ display: "flex", marginTop: 24, maxWidth: 820, fontSize: 34, lineHeight: 1.45, color: "#5f716c" }}>
            看懂主管訊息中的勞權風險 · 法規參考 · 回覆改進建議
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#136c5a", fontWeight: 600 }}>
          一般資訊，非法律意見 · 本機儲存 · 隱私優先
        </div>
      </div>
    ),
    { ...size },
  );
}
