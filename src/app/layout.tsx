import "./globals.css";
import { cookies } from "next/headers";
import "./globals.css";
import { getServerSession } from "next-auth";
import SessionProvider from "@/utils/SessionProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("Next-Locale")?.value || "en";
  const session = await getServerSession();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-w-[350px] overflow-x-scroll dark:bg-slate-850 dark:text-slate-200">
        {/* updated theme provider  */}
        <SessionProvider session={session}>{children}</SessionProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
