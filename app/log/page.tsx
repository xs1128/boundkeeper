import { CaseLogView } from "@/components/CaseLogView";
import { Disclaimer } from "@/components/Disclaimer";
import { SiteNav } from "@/components/SiteNav";

export default function CaseLogPage() {
  return (
    <main className="shell">
      <SiteNav />

      <header className="hero">
        <p className="eyebrow">LOCAL CASE LOG</p>
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
