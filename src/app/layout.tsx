import "./globals.css";
import { cookies } from "next/headers";
import "./globals.css";
import { getServerSession } from "next-auth";
import SessionProvider from "@/utils/SessionProvider";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = cookies().get("Next-Locale")?.value || "en";
  const session = await getServerSession();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="dark:bg-slate-850 dark:text-slate-200">
        {/* updated theme provider  */}
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
