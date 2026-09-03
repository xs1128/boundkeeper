import { Disclaimer } from "@/components/Disclaimer";

export default function CaseLogPage() {
  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">LOCAL CASE LOG</p>
        <h1>案件紀錄</h1>
        <p className="lede">本機案件時間軸將在下一階段啟用。</p>
      </header>
      <Disclaimer />
    </main>
  );
}
