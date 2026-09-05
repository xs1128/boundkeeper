import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import { NavigationRecovery } from "@/components/NavigationRecovery";
import { StructuredData } from "@/components/StructuredData";
import { PRODUCT_NAME_ZH } from "@/src/product";
import { siteUrl } from "./site-url";
import "./globals.css";

const notoSansTc = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  variable: "--font-noto",
});

const publicSiteUrl = siteUrl();

const title = PRODUCT_NAME_ZH;
const description =
  "台灣勞工專用的主管訊息分析工具。貼上訊息即可取得風險提示、法規參考、回覆改進建議與本機案件紀錄。一般資訊，非法律意見。";

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: {
    default: title,
    template: `%s · ${title}`,
  },
  description,
  keywords: [
    PRODUCT_NAME_ZH,
    "勞動法",
    "職場霸凌",
    "加班",
    "主管訊息",
    "勞工權益",
    "台灣",
    "1955",
    "勞基法",
  ],
  authors: [{ name: PRODUCT_NAME_ZH }],
  creator: PRODUCT_NAME_ZH,
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
    url: publicSiteUrl,
    siteName: title,
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" className={notoSansTc.variable}>
      <body>
        <NavigationRecovery />
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
