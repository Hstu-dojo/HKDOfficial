import "./globals.css";
import { editorialFonts } from "@/styles/fonts";
import { cookies } from "next/headers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("Next-Locale")?.value || "en";
  return (
    <html lang={locale} className={editorialFonts} suppressHydrationWarning>
      <body className="editorial-site">
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
