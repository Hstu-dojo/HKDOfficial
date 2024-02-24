import { cookies } from "next/headers";
import { ThemeProvider } from "@/context/ThemeProvider";
import "./globals.css";
import { draftMode } from "next/headers";
import LiveVisualEditing from "@/components/blogs/LiveVisualEditing";
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
      <body className="dark:bg-slate-850 dark:text-slate-400">
        {/* updated theme provider  */}
        <SessionProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            {draftMode().isEnabled && <LiveVisualEditing />}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
