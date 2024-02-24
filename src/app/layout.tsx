import { cookies } from "next/headers";
import { ThemeProvider } from "@/context/ThemeProvider";
import "./globals.css";
import { draftMode } from "next/headers";
import LiveVisualEditing from "@/components/blogs/LiveVisualEditing";

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
          {draftMode().isEnabled && <LiveVisualEditing />}
        </ThemeProvider>
      </body>
    </html>
  );
}
