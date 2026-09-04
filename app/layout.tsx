import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import { StructuredData } from "@/components/StructuredData";
import "./globals.css";

const notoSansTc = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  variable: "--font-noto",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://genai-hack.vercel.app";

const title = "勞權濾網";
const description =
  "台灣勞工專用的主管訊息分析工具。貼上訊息即可取得風險提示、法規參考、回覆改進建議與本機案件紀錄。一般資訊，非法律意見。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s · ${title}`,
  },
  description,
  keywords: [
    "勞權濾網",
    "勞動法",
    "職場霸凌",
    "加班",
    "主管訊息",
    "勞工權益",
    "台灣",
    "1955",
    "勞基法",
  ],
  authors: [{ name: "勞權濾網" }],
  creator: "勞權濾網",
  category: "productivity",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: siteUrl,
    siteName: title,
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" className={notoSansTc.variable}>
      <body>
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
