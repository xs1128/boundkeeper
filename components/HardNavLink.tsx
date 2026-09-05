import type { AnchorHTMLAttributes, ReactNode } from "react";

type HardNavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

export function HardNavLink({ href, children, ...props }: HardNavLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
