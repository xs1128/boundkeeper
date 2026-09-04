import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "勞權濾網",
  description: "看懂主管訊息中的勞權風險，準備回覆與諮詢資料。提供一般資訊，非法律意見。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
