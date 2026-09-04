import { MessageAnalyzer } from "@/components/MessageAnalyzer";
import { Disclaimer } from "@/components/Disclaimer";
import { SiteNav } from "@/components/SiteNav";

export default function HomePage() {
  return (
    <main className="shell">
      <SiteNav />

      <header className="hero">
        <p className="eyebrow">WORKER-SIDE COPILOT</p>
        <h1>勞權濾網</h1>
        <p className="lede">
          看懂主管訊息中的勞權風險，準備冷靜、保留權益的下一步。
        </p>
      </header>

      <MessageAnalyzer />

      <Disclaimer />
    </main>
  );
}
