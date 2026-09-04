import Link from "next/link";

export function SiteNav() {
  return (
    <nav aria-label="主要導覽" className="site-nav">
      <Link href="/">分析訊息</Link>
      <Link href="/log">案件紀錄</Link>
    </nav>
  );
}
