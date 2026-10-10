"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Dashboard layouts persist during navigation; their scrolling pane does too. */
export function PortalContent({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const pane = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pane.current) {
      pane.current.scrollTop = 0;
      pane.current.scrollLeft = 0;
    }
  }, [pathname]);
  return (
    <div
      ref={pane}
      className="portal-main"
      role="region"
      aria-label={label}
      tabIndex={-1}
    >
      <div className="portal-content">{children}</div>
    </div>
  );
}
