import type { Metadata } from "next";
import { CaseLogView } from "@/components/CaseLogView";
import { Disclaimer } from "@/components/Disclaimer";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "案件紀錄",
  description: "瀏覽本機儲存的分析摘要與 JSON 匯出。不含主管原始訊息。",
  alternates: {
    canonical: "/log",
  },
};

export default function CaseLogPage() {
  return (
    <main className="shell">
      <SiteNav />

      <header className="hero">
        <p className="eyebrow">本機案件紀錄</p>
        <h1>案件紀錄</h1>
        <p className="lede">
          僅保存在這台裝置上的分析摘要；不會上傳主管原始訊息。
        </p>
      </header>

      <CaseLogView />

      <Disclaimer />
    </main>
  );
}
