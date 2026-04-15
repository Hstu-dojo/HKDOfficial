import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getI18n } from "@/locales/server";

export default async function NotFound({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getI18n();

  return (
    <>
      <Header />
      <main className="relative">
        <section className="mt-[4.5rem] bg-muted py-32 text-muted-foreground dark:bg-slate-900 lg:mt-[161px]">
          <div className="container text-center">
            <Image
              src="/not_found.png"
              width={340}
              height={340}
              alt={t("notFound.imageAlt")}
              className="mb-12 inline-block"
            />
            <h1 className="mb-4">{t("notFound.title")}</h1>
            <p className="mb-12">
              {t("notFound.description")}
            </p>
            <Button size="lg" asChild>
              <Link href={`/${locale}`}>{t("notFound.homeCta")}</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
