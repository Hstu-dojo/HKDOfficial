/** Shared loaders also render outside the locale provider (partner portal). */
export const loadingCopy = {
  en: { loading: "Loading…", academy: "Karate Academy", motto: "Discipline. Respect. Progress.", admin: "Academy administration", dashboard: "Student dashboard", partner: "Partner portal" },
  bn: { loading: "লোড হচ্ছে…", academy: "কারাতে একাডেমি", motto: "শৃঙ্খলা। শ্রদ্ধা। উন্নতি।", admin: "একাডেমি প্রশাসন", dashboard: "শিক্ষার্থী ড্যাশবোর্ড", partner: "পার্টনার পোর্টাল" },
  ne: { loading: "लोड हुँदैछ…", academy: "कराते एकेडेमी", motto: "अनुशासन। सम्मान। प्रगति।", admin: "एकेडेमी प्रशासन", dashboard: "विद्यार्थी ड्यासबोर्ड", partner: "साझेदार पोर्टल" },
};
export function getLoadingCopy(pathname: string | null) {
  const locale = pathname?.split("/")[1];
  return loadingCopy[locale === "bn" || locale === "ne" ? locale : "en"];
}
