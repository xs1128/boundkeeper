"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "分析訊息" },
  { href: "/log", label: "案件紀錄" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <Link href="/" className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="13" fill="#136c5a"/>
            <path d="M24 9 35 14.5V23.5c0 7.2-4.6 12.8-11 14.8-6.4-2-11-7.6-11-14.8V14.5L24 9Z" fill="#e8f5f0"/>
            <path d="M15 21.5h18M15 25h14M15 28.5h10" stroke="#136c5a" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </span>
        <span className="brand-name">勞權濾網</span>
      </Link>
      <nav aria-label="主要導覽" className="site-nav">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={active ? "nav-link nav-link-active" : "nav-link"}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
