import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "勞權濾網",
  description: "Worker-side workplace communication copilot",
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
