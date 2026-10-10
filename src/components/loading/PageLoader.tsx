"use client";

import { useContext, useEffect, useId, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import type { LoaderVariant, ArcGreeting } from "./ArcRevealLoader";
import { getLoadingCopy } from "./loading-copy";
import { PageLoaderContext, PageLoaderScreen } from "./PageLoaderProvider";

const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface PageLoaderProps {
  variant?: LoaderVariant;
  greetings?: ArcGreeting[];
  badgeText?: string;
  className?: string;
}

/** Register loading work with a persistent host so its exit can finish. */
export function PageLoader({
  variant = "default",
  greetings,
  badgeText,
  className,
}: PageLoaderProps) {
  const pathname = usePathname();
  const host = useContext(PageLoaderContext);
  const id = useId();
  const [mounted, setMounted] = useState(false);
  const greeting = greetings?.[0]?.text;

  useEffect(() => {
    if (!host) setMounted(true);
  }, [host]);
  useBrowserLayoutEffect(() => {
    if (!host) return;
    host.register(id, { pathname, variant, badgeText, className, greeting });
    return () => host.unregister(id);
  }, [host, id, pathname, variant, badgeText, className, greeting]);

  // The fallback never renders its own pictures. Suspense may retain hidden
  // fallback markup after streaming; only the root host owns image elements.
  // Layout-effect cleanup also unregisters work when Suspense hides this tree.
  if (host) return null;
  const content = (
    <PageLoaderScreen
      pathname={pathname}
      variant={variant}
      badgeText={badgeText}
      className={className}
      greeting={greeting}
      loadingLabel={getLoadingCopy(pathname).loading}
    />
  );
  return mounted ? createPortal(content, document.body) : content;
}

export default PageLoader;
