import { cookies } from "next/headers";
import { ThemeProvider } from "@/context/ThemeProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = cookies().get("Next-Locale")?.value || "en";
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        {/* updated theme provider  */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
