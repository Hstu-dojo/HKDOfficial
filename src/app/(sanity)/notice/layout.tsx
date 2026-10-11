import BackToTop from "@/components/back-to-top";
import { Suspense } from "react";
import NoticeShell from "@/components/notices/NoticeShell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="editorial-public min-h-screen bg-background">
      <Suspense>
        <NoticeShell>{children}</NoticeShell>
      </Suspense>
      <BackToTop />
    </div>
  );
}
