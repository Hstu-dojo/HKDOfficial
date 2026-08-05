"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { ShieldCheckIcon, MagnifyingGlassIcon, CheckBadgeIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface CertificateData {
  certificateNumber: string;
  recipientName: string;
  program: {
    title: string;
  };
}

export default function SectionCertVerify() {
  const t = useScopedI18n("certVerify");
  const locale = useCurrentLocale();
  const router = useRouter();

  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const term = searchValue.trim();
    if (!term) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/certificates/verify?certId=${encodeURIComponent(term)}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error ?? t("errorNotFoundOrRevoked"));
      } else {
        setResult(data.certificate);
      }
    } catch {
      setError(t("errorNetwork"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-12 md:py-20 bg-muted/5 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-gradient-to-br from-card to-background rounded-3xl p-6 md:p-12 border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-[0.04] dark:opacity-[0.06] pointer-events-none hidden md:block scale-[1.2] origin-right">
             <img src="/favicon.ico" alt="Logo" className="w-[320px] h-auto grayscale" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 w-full text-center md:text-left">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4 md:mb-6">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {t("title") || "Verify Certificate"}
              </h2>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">
                Check the authenticity of any certificate quickly using its unique ID.
              </p>

              <form onSubmit={verify} className="flex gap-2 max-w-md mx-auto md:mx-0">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                    placeholder={t("searchPlaceholder")}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !searchValue.trim()}
                  className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap min-w-[110px]"
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t("verifyButton")
                  )}
                </button>
              </form>
            </div>

            <div className="w-full md:w-1/2 min-h-[160px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!result && !error && !loading && (
                   <motion.div 
                     key="idle"
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="text-center text-muted-foreground bg-muted/20 p-6 rounded-2xl w-full border border-dashed"
                   >
                      <ShieldCheckIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Enter a certificate ID to instantly verify its status.</p>
                   </motion.div>
                )}
                
                {loading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <span className="inline-block h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </motion.div>
                )}

                {error && !loading && (
                   <motion.div 
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-200 dark:border-red-900/50 w-full text-center shadow-sm"
                   >
                      <XCircleIcon className="h-10 w-10 mx-auto mb-3 text-red-500" />
                      <p className="text-sm font-semibold">{error}</p>
                   </motion.div>
                )}

                {result && !loading && (
                   <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-6 rounded-2xl w-full shadow-sm text-left"
                   >
                     <div className="flex items-center gap-3 mb-4 border-b border-green-200/50 dark:border-green-900/30 pb-3">
                        <CheckBadgeIcon className="h-8 w-8 text-green-600 dark:text-green-400 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-green-800 dark:text-green-300">Verified Authentic</p>
                          <p className="text-xs text-green-600/80 dark:text-green-400/70 font-mono">{result.certificateNumber}</p>
                        </div>
                     </div>
                     <p className="font-semibold mb-1 text-foreground">{result.recipientName}</p>
                     <p className="text-xs text-muted-foreground line-clamp-1 mb-4">{result.program.title}</p>
                     <Link href={`/${locale}/cert-verify?certId=${encodeURIComponent(result.certificateNumber)}`} className="inline-block text-xs font-semibold px-3 py-1.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors">
                        View Full Details &rarr;
                     </Link>
                   </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
