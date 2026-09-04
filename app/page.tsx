import { MessageAnalyzer } from "@/components/MessageAnalyzer";
import { Disclaimer } from "@/components/Disclaimer";
import { SiteNav } from "@/components/SiteNav";

export default function HomePage() {
  return (
    <main className="shell">
      <SiteNav />

      <header className="hero">
        <p className="eyebrow">給工作者的溝通助手</p>
        <h1>勞權濾網</h1>
        <p className="lede">
          貼上主管訊息，取得風險提示、法規參考與回覆改進建議。由你決定如何回應，我們不代寫完整回覆。
        </p>
        <ul className="hero-points" aria-label="產品特色">
          <li>隱私優先，預設不儲存原文</li>
          <li>繁體中文，一般資訊非法律判決</li>
          <li>可離線試用範例情境</li>
        </ul>
      </header>

      <MessageAnalyzer />

      <Disclaimer />
    </main>
  );
}
