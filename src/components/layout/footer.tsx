"use client";

import Link from "next/link";
import SiteLogo from "./site-logo";
import { useCurrentLocale, useI18n } from "@/locales/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

import { footerNav } from "@/config/site";
import MaxWidthWrapper from "../maxWidthWrapper";

const Footer = () => {
  const locale = useCurrentLocale();
  const t = useI18n();

  const getItemHref = (href: string, opts?: { skipLocale?: boolean }) => {
    if (opts?.skipLocale) return href;
    return `/${locale}${href}`;
  };

  return (
    <footer>
      <MaxWidthWrapper className="container">
        <div className="pb-16 pt-28">
          <div className="gap-10 space-y-10 md:grid md:grid-cols-12 md:space-y-0">
            <div className="col-span-3">
              <Link href={`/${locale}`} className="shrink-0">
                <SiteLogo
                  width={123}
                  height={39}
                  lightClasses="dark:hidden"
                  darkClasses="hidden dark:block"
                />
              </Link>
              <p className="mb-8 mt-6">
                {t("footer.tagline" as any)}
              </p>
              <div className="flex space-x-2">
                <a
                  href="https://x.com/HstuDojo"
                  className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-black text-white transition-colors hover:bg-foreground hover:text-white"
                >
                  <FontAwesomeIcon icon={faXTwitter} width={15} />
                </a>
                <a
                  href="https://www.facebook.com/hstu.karate.dojo"
                  className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-[#324e8c] text-white transition-colors hover:bg-foreground hover:text-white"
                >
                  <FontAwesomeIcon icon={faFacebook} width={15} />
                </a>
                <a
                  href="https://www.youtube.com/@hstu.karate.dojo_1"
                  className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-[#cd201f] text-white transition-colors hover:bg-foreground hover:text-white"
                >
                  <FontAwesomeIcon icon={faYoutube} width={15} />
                </a>
              </div>
            </div>

            {footerNav &&
              footerNav.map((item, index) => (
                <div
                  key={item.title}
                  className={`${
                    index === 0 ? "xl:col-start-7" : ""
                  } col-span-3 xl:col-span-2`}
                >
                  <h2 className="mb-4 text-sm">
                    {item.i18nKey ? t(item.i18nKey as any) : item.title}
                  </h2>
                  <NavigationMenu orientation="vertical">
                    <NavigationMenuList className="flex-col items-start space-y-2">
                      {item.items.map((link) => (
                        <NavigationMenuItem
                          key={link.title}
                          className="text-sm"
                        >
                          <Link
                            href={getItemHref(link.href, { skipLocale: link.skipLocale })}
                            target={link?.external ? "_blank" : undefined}
                            rel={link?.external ? "noreferrer" : undefined}
                            className="block hover:text-primary"
                          >
                            {link.i18nKey ? t(link.i18nKey as any) : link.title}
                          </Link>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </div>
              ))}
            <div className="col-span-3 xl:col-span-2">
              <h2 className="mb-4 text-sm">{t("footer.contact" as any)}</h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <address className="-mt-px leading-6">
                    {t("footer.address" as any)}
                  </address>
                </li>
                <li>
                  <span>{t("footer.phone" as any)}: </span>
                  <a href="tel:+8801777-300309" className="hover:text-primary">
                    +880 1777 - 300309
                  </a>
                </li>
                <li>
                  <span>{t("footer.email" as any)}: </span>
                  <a
                    href="mailto:hstukarate@gmail.com"
                    className="hover:text-primary"
                  >
                    hstukarate@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
      <div className="border-t py-12">
        <div className="container text-center">
          <span className="text-xs">
            {t("footer.copyright" as any, { year: new Date().getFullYear() })}{" "}
            {t("footer.madeBy" as any)}{" "}
            <a
              href="https://shahriarhasan.vercel.app"
              className="hover:text-primary"
            >
              Hasan
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
